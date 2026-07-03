//! Canonical repository path guard.
//!
//! One Rust authorization primitive for every repository file operation the
//! Authority Gate mediates (Epic 2). Any surface that resolves a
//! caller-supplied repo-relative path — agent tool calls, workcell writes,
//! context pack source selection — MUST go through `resolve_under_repo_root()`,
//! normally via `permission_envelope::PermissionEnvelope::validate_path()`,
//! which owns root selection and layers the doctrine's forbidden-pattern
//! denylist (see `forbidden_patterns.rs`) on top of this file's output.
//!
//! Frontend validation is UX support only. Authority lives here.
//!
//! Ported from forge-smithy's `src-tauri/src/path_guard.rs`; logic
//! independently audited for VibeForge on 2026-07-03. The port was
//! originally kept byte-identical to upstream, but a subsequent
//! adversarial-verification pass (same day) found and confirmed a real,
//! non-race sandbox escape in the original `candidate.exists()` branch (see
//! "Dangling symlink" below) — **this file has since diverged from
//! forge-smithy upstream to fix it**. forge-smithy's own copy is believed
//! to share the same bug and has not been patched as part of this work;
//! flag this if forge-smithy is ever revisited. Diff against upstream
//! before assuming a re-sync from forge-smithy is safe to apply — it would
//! reintroduce the vulnerability fixed here.
//!
//! A stricter sibling implementation exists elsewhere in the Forge tree
//! (`Forge_Command/src-tauri/src/neuronforge_promotion/security.rs`,
//! `assert_no_symlink_within()`), which rejects *any* symlink encountered
//! while walking a path, even ones that resolve to somewhere still inside
//! the root. That behavior was deliberately NOT adopted here: VibeForge's
//! own doctrine (docs/plans/07_SECURITY_PRIVACY_GOVERNANCE.md, "Path
//! policy") only requires resolving symlinks and denying escapes, not
//! banning symlinks outright — blanket-rejecting internal symlinks would
//! break legitimate patterns (monorepo package links, vendored submodule
//! symlinks) for no doctrine-required benefit. Don't "fix" this by copying
//! the stricter behavior in without re-deriving that tradeoff.
//!
//! Residual risk, accepted rather than closed: there is a TOCTOU gap
//! between this function returning `Ok` and whatever the caller does next
//! (a real filesystem read/write) — a symlink swapped in between the two
//! steps isn't caught. Closing this portably would require `openat`-family
//! APIs with `O_NOFOLLOW`, not exposed cross-platform by `std`. Acceptable
//! for a single-user local desktop app; revisit if VibeForge ever runs
//! against a filesystem another process can concurrently mutate.
//!
//! Dangling symlink fix (2026-07-03, adversarially discovered and
//! confirmed): the original upstream logic branched on
//! `candidate.exists()`, which follows symlinks — for a symlink whose
//! *target* doesn't exist yet, `exists()` returns `false` even though a
//! symlink directory entry is genuinely present at that path. That routed
//! a dangling symlink into the "new file" branch, which only canonicalizes
//! the *parent* directory and reconstructs `parent.join(file_name)`
//! without ever resolving the leaf — so a pre-planted dangling symlink
//! (e.g. `notes.txt -> /home/user/.ssh/authorized_keys`, target not yet
//! present) authorized as if it were an ordinary new file at
//! `repo_root/notes.txt`. Any real write through that "authorized" path
//! transparently follows the symlink and lands outside `repo_root` — no
//! race condition needed, since the dangling state is stable and can be
//! prepared ahead of time by anything with write access to the repo
//! (an earlier less-trusted operation, a malicious repo/worktree, etc).
//! Fixed by using `symlink_metadata` (lstat semantics, does not follow the
//! final symlink) to detect *any* directory entry at the candidate path —
//! symlink or not, dangling or not — and routing all of those through full
//! canonicalization (which fails closed for a dangling target) rather than
//! only the parent-only "new file" path.
//!
//! Guarantees:
//! - repo_root is canonicalized; non-existent or non-directory roots fail closed.
//! - Empty paths are rejected.
//! - Absolute paths from plans are rejected.
//! - `..` traversal is rejected (including embedded `nested/../../escape`).
//! - `.` (current-dir) components are rejected so paths normalize cleanly.
//! - Windows drive-prefix paths (`C:\...`) are rejected.
//! - NUL and other ASCII control characters in the path are rejected.
//! - For new files, the existing parent is canonicalized and verified to
//!   remain under repo_root — symlink escapes via the parent fail closed.
//! - For existing targets, the full path is canonicalized — symlink
//!   escapes via the target itself fail closed.
//! - Optional scope allowlist further restricts which repo-relative
//!   prefixes may be touched.

#![forbid(unsafe_code)]

use std::path::{Component, Path, PathBuf};

#[derive(Debug, thiserror::Error)]
pub enum PathGuardError {
    #[error("path must be non-empty")]
    Empty,
    #[error("path must be relative (got absolute: {0})")]
    Absolute(String),
    #[error("path contains illegal traversal component: {0}")]
    Traversal(String),
    #[error("path contains illegal current-dir component: {0}")]
    CurrentDir(String),
    #[error("path contains Windows drive prefix: {0}")]
    DrivePrefix(String),
    #[error("path contains illegal control character at byte offset {0}")]
    ControlChar(usize),
    #[error("repo_root does not exist or is not accessible: {0}")]
    RootMissing(String),
    #[error("repo_root is not a directory: {0}")]
    RootNotDirectory(String),
    #[error("parent directory does not exist: {0}")]
    ParentMissing(String),
    #[error("path escapes repo_root: {0}")]
    Escape(String),
    #[error("path is outside the declared scope allowlist: {0}")]
    OutOfScope(String),
    #[error("io error during path resolution: {0}")]
    Io(String),
}

/// Result of a successful authorization.
///
/// `absolute` is the canonical absolute path safe to pass to the
/// filesystem. `repo_relative` is the normalized POSIX-style path
/// suitable for ledger entries, manifests, and audit records.
#[derive(Debug, Clone)]
pub struct AuthorizedRepoPath {
    pub absolute: PathBuf,
    pub repo_relative: String,
}

/// Optional behavior knobs for the canonical guard.
///
/// Defaults are the safe choice for any mutation surface:
/// - `must_exist = false` (writes to new files are allowed if the parent exists)
/// - `scope_allowlist = None` (no additional scope narrowing beyond repo_root)
#[derive(Debug, Default, Clone)]
pub struct PathGuardOptions {
    /// If true, the resolved target must already exist.
    pub must_exist: bool,
    /// Optional allowlist of repo-relative path prefixes (POSIX style).
    /// When set, the resolved repo_relative path must `starts_with` at
    /// least one entry. Use to bind operations to a declared scope
    /// (e.g. `["src/", "tests/"]`).
    pub scope_allowlist: Option<Vec<String>>,
}

/// Authorize a repo-relative path under `repo_root`.
///
/// This is the single entry point. Every governed mutation, agent tool
/// call, context pack source resolution, and workcell write MUST be
/// resolved through this function.
pub fn resolve_under_repo_root(
    repo_root: &Path,
    requested_relative_path: &str,
    options: PathGuardOptions,
) -> Result<AuthorizedRepoPath, PathGuardError> {
    if requested_relative_path.is_empty() {
        return Err(PathGuardError::Empty);
    }

    if let Some(idx) = requested_relative_path
        .as_bytes()
        .iter()
        .position(|b| (*b < 0x20 && *b != b'\t') || *b == 0x7f)
    {
        return Err(PathGuardError::ControlChar(idx));
    }

    if looks_like_windows_drive_prefix(requested_relative_path) {
        return Err(PathGuardError::DrivePrefix(
            requested_relative_path.to_string(),
        ));
    }

    let rel = Path::new(requested_relative_path);

    if rel.is_absolute() {
        return Err(PathGuardError::Absolute(
            requested_relative_path.to_string(),
        ));
    }

    for component in rel.components() {
        match component {
            Component::Normal(_) => {}
            Component::CurDir => {
                return Err(PathGuardError::CurrentDir(
                    requested_relative_path.to_string(),
                ));
            }
            Component::ParentDir => {
                return Err(PathGuardError::Traversal(
                    requested_relative_path.to_string(),
                ));
            }
            Component::Prefix(_) | Component::RootDir => {
                return Err(PathGuardError::Absolute(
                    requested_relative_path.to_string(),
                ));
            }
        }
    }

    let canonical_root = repo_root.canonicalize().map_err(|err| match err.kind() {
        std::io::ErrorKind::NotFound => {
            PathGuardError::RootMissing(format!("{}: {err}", repo_root.display()))
        }
        _ => PathGuardError::Io(format!("repo_root canonicalize failed: {err}")),
    })?;

    if !canonical_root.is_dir() {
        return Err(PathGuardError::RootNotDirectory(
            canonical_root.display().to_string(),
        ));
    }

    let candidate = canonical_root.join(rel);

    // `symlink_metadata` (lstat) reports whether a directory entry exists at
    // `candidate` itself, without following a trailing symlink — unlike
    // `candidate.exists()` (used by the original upstream logic), which
    // follows symlinks and silently reports `false` for a *dangling*
    // symlink even though a real directory entry is present. Routing a
    // dangling symlink into the "new file" branch below would authorize
    // writes through it without ever resolving where it actually points —
    // see the module doc comment for the full exploit description.
    let leaf_exists = candidate.symlink_metadata().is_ok();

    let canonical_target = if leaf_exists {
        candidate.canonicalize().map_err(|err| {
            PathGuardError::Io(format!(
                "target canonicalize failed (possibly a dangling symlink): {err}"
            ))
        })?
    } else {
        if options.must_exist {
            return Err(PathGuardError::ParentMissing(
                requested_relative_path.to_string(),
            ));
        }
        let parent = candidate
            .parent()
            .ok_or_else(|| PathGuardError::ParentMissing(requested_relative_path.to_string()))?;
        if !parent.exists() {
            return Err(PathGuardError::ParentMissing(parent.display().to_string()));
        }
        let canonical_parent = parent
            .canonicalize()
            .map_err(|err| PathGuardError::Io(format!("parent canonicalize failed: {err}")))?;
        if !canonical_parent.starts_with(&canonical_root) {
            return Err(PathGuardError::Escape(parent.display().to_string()));
        }
        let file_name = candidate.file_name().ok_or_else(|| PathGuardError::Empty)?;
        canonical_parent.join(file_name)
    };

    if !canonical_target.starts_with(&canonical_root) {
        return Err(PathGuardError::Escape(
            canonical_target.display().to_string(),
        ));
    }

    let repo_relative_path = canonical_target
        .strip_prefix(&canonical_root)
        .map_err(|err| PathGuardError::Io(format!("strip_prefix failed: {err}")))?;
    let repo_relative = to_posix_string(repo_relative_path);

    if let Some(allowlist) = &options.scope_allowlist {
        let in_scope = allowlist.iter().any(|prefix| {
            let normalized = prefix.trim_start_matches("./").trim_start_matches('/');
            repo_relative == normalized
                || repo_relative.starts_with(&format!("{}/", normalized.trim_end_matches('/')))
        });
        if !in_scope {
            return Err(PathGuardError::OutOfScope(repo_relative.clone()));
        }
    }

    Ok(AuthorizedRepoPath {
        absolute: canonical_target,
        repo_relative,
    })
}

fn looks_like_windows_drive_prefix(path: &str) -> bool {
    let bytes = path.as_bytes();
    if bytes.len() < 2 {
        return false;
    }
    let first = bytes[0];
    let is_drive_letter = first.is_ascii_alphabetic();
    is_drive_letter && bytes[1] == b':'
}

fn to_posix_string(path: &Path) -> String {
    let mut parts: Vec<&str> = Vec::new();
    for component in path.components() {
        if let Component::Normal(s) = component {
            if let Some(piece) = s.to_str() {
                parts.push(piece);
            }
        }
    }
    parts.join("/")
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    #[cfg(unix)]
    use std::os::unix::fs::symlink;
    use tempfile::TempDir;

    fn make_root() -> TempDir {
        TempDir::new().expect("tempdir")
    }

    fn opts() -> PathGuardOptions {
        PathGuardOptions::default()
    }

    #[test]
    fn rejects_absolute_unix_path() {
        let root = make_root();
        let err = resolve_under_repo_root(root.path(), "/etc/passwd", opts()).unwrap_err();
        assert!(matches!(err, PathGuardError::Absolute(_)));
    }

    #[test]
    fn rejects_absolute_tmp_path() {
        let root = make_root();
        let err = resolve_under_repo_root(root.path(), "/tmp/outside.txt", opts()).unwrap_err();
        assert!(matches!(err, PathGuardError::Absolute(_)));
    }

    #[test]
    fn rejects_dotdot() {
        let root = make_root();
        let err = resolve_under_repo_root(root.path(), "../outside.txt", opts()).unwrap_err();
        assert!(matches!(err, PathGuardError::Traversal(_)));
    }

    #[test]
    fn rejects_nested_dotdot_escape() {
        let root = make_root();
        let err =
            resolve_under_repo_root(root.path(), "nested/../../outside.txt", opts()).unwrap_err();
        assert!(matches!(err, PathGuardError::Traversal(_)));
    }

    #[test]
    fn rejects_dotdot_chain_to_ssh() {
        let root = make_root();
        let err = resolve_under_repo_root(root.path(), "../../.ssh/config", opts()).unwrap_err();
        assert!(matches!(err, PathGuardError::Traversal(_)));
    }

    #[test]
    fn rejects_windows_drive_prefix() {
        let root = make_root();
        let err = resolve_under_repo_root(root.path(), "C:\\Users\\outside", opts()).unwrap_err();
        assert!(matches!(err, PathGuardError::DrivePrefix(_)));
    }

    #[test]
    fn rejects_nul_byte() {
        let root = make_root();
        let err = resolve_under_repo_root(root.path(), "src/file\0.rs", opts()).unwrap_err();
        assert!(matches!(err, PathGuardError::ControlChar(_)));
    }

    #[test]
    fn rejects_empty_path() {
        let root = make_root();
        let err = resolve_under_repo_root(root.path(), "", opts()).unwrap_err();
        assert!(matches!(err, PathGuardError::Empty));
    }

    #[test]
    fn rejects_dot_only() {
        let root = make_root();
        let err = resolve_under_repo_root(root.path(), "./README.md", opts()).unwrap_err();
        assert!(matches!(err, PathGuardError::CurrentDir(_)));
    }

    #[test]
    fn rejects_missing_root() {
        let err = resolve_under_repo_root(
            Path::new("/nonexistent/forge/repo/root"),
            "src/lib.rs",
            opts(),
        )
        .unwrap_err();
        assert!(matches!(err, PathGuardError::RootMissing(_)));
    }

    #[test]
    fn rejects_file_as_root() {
        let root = make_root();
        let file = root.path().join("not_a_dir.txt");
        fs::write(&file, b"x").unwrap();
        let err = resolve_under_repo_root(&file, "x", opts()).unwrap_err();
        // Either RootNotDirectory or Io depending on platform behavior of canonicalize on file.
        assert!(matches!(
            err,
            PathGuardError::RootNotDirectory(_)
                | PathGuardError::Io(_)
                | PathGuardError::ParentMissing(_)
        ));
    }

    #[test]
    fn allows_existing_relative_file() {
        let root = make_root();
        let sub = root.path().join("src/lib");
        fs::create_dir_all(&sub).unwrap();
        let file = sub.join("file.ts");
        fs::write(&file, b"ok").unwrap();

        let resolved = resolve_under_repo_root(root.path(), "src/lib/file.ts", opts()).unwrap();
        assert!(
            resolved
                .absolute
                .starts_with(root.path().canonicalize().unwrap())
        );
        assert_eq!(resolved.repo_relative, "src/lib/file.ts");
    }

    #[test]
    fn allows_new_file_when_parent_exists() {
        let root = make_root();
        let sub = root.path().join("src");
        fs::create_dir_all(&sub).unwrap();

        let resolved = resolve_under_repo_root(root.path(), "src/new.ts", opts()).unwrap();
        assert_eq!(resolved.repo_relative, "src/new.ts");
        assert!(!resolved.absolute.exists());
    }

    #[test]
    fn rejects_new_file_when_parent_missing() {
        let root = make_root();
        let err = resolve_under_repo_root(root.path(), "missing_dir/new.ts", opts()).unwrap_err();
        assert!(matches!(err, PathGuardError::ParentMissing(_)));
    }

    #[test]
    fn must_exist_rejects_missing_target() {
        let root = make_root();
        let opts = PathGuardOptions {
            must_exist: true,
            ..Default::default()
        };
        let err = resolve_under_repo_root(root.path(), "missing.ts", opts).unwrap_err();
        assert!(matches!(err, PathGuardError::ParentMissing(_)));
    }

    #[cfg(unix)]
    #[test]
    fn rejects_symlink_to_outside_when_target_exists() {
        let outside = TempDir::new().unwrap();
        let outside_file = outside.path().join("secret.txt");
        fs::write(&outside_file, b"secret").unwrap();

        let root = make_root();
        let link = root.path().join("link.txt");
        symlink(&outside_file, &link).unwrap();

        let err = resolve_under_repo_root(root.path(), "link.txt", opts()).unwrap_err();
        assert!(matches!(err, PathGuardError::Escape(_)));
    }

    #[cfg(unix)]
    #[test]
    fn rejects_dangling_symlink_to_outside_target() {
        // Adversarially discovered 2026-07-03: a symlink whose target does
        // not yet exist must not be treated as an ordinary "new file" —
        // see the module doc comment for the full exploit description.
        let outside = TempDir::new().unwrap();
        let dangling_target = outside.path().join("not_created_yet.txt");

        let root = make_root();
        let link = root.path().join("notes.txt");
        symlink(&dangling_target, &link).unwrap();

        let err = resolve_under_repo_root(root.path(), "notes.txt", opts()).unwrap_err();
        assert!(matches!(err, PathGuardError::Io(_)));
    }

    #[cfg(unix)]
    #[test]
    fn rejects_dangling_symlink_whose_target_is_inside_repo() {
        // A dangling symlink pointing at an in-repo path that doesn't
        // exist yet should still fail closed (Io), not be silently
        // authorized as a plain new file — resolving it is the caller's
        // job after re-checking, not this function's to assume.
        let root = make_root();
        let link = root.path().join("notes.txt");
        symlink(root.path().join("not_created_yet.txt"), &link).unwrap();

        let err = resolve_under_repo_root(root.path(), "notes.txt", opts()).unwrap_err();
        assert!(matches!(err, PathGuardError::Io(_)));
    }

    #[cfg(unix)]
    #[test]
    fn rejects_new_file_under_symlinked_parent_outside_repo() {
        let outside = TempDir::new().unwrap();
        let outside_dir = outside.path().join("outside_dir");
        fs::create_dir_all(&outside_dir).unwrap();

        let root = make_root();
        let link_dir = root.path().join("evil_parent");
        symlink(&outside_dir, &link_dir).unwrap();

        let err = resolve_under_repo_root(root.path(), "evil_parent/new.txt", opts()).unwrap_err();
        assert!(matches!(err, PathGuardError::Escape(_)));
    }

    #[test]
    fn scope_allowlist_allows_in_scope_paths() {
        let root = make_root();
        fs::create_dir_all(root.path().join("src/lib")).unwrap();
        let opts = PathGuardOptions {
            scope_allowlist: Some(vec!["src/".to_string(), "tests/".to_string()]),
            ..Default::default()
        };
        let r = resolve_under_repo_root(root.path(), "src/lib/file.ts", opts).unwrap();
        assert_eq!(r.repo_relative, "src/lib/file.ts");
    }

    #[test]
    fn scope_allowlist_rejects_out_of_scope_paths() {
        let root = make_root();
        fs::create_dir_all(root.path().join("docs")).unwrap();
        let opts = PathGuardOptions {
            scope_allowlist: Some(vec!["src/".to_string()]),
            ..Default::default()
        };
        let err = resolve_under_repo_root(root.path(), "docs/page.md", opts).unwrap_err();
        assert!(matches!(err, PathGuardError::OutOfScope(_)));
    }

    #[test]
    fn scope_allowlist_handles_exact_match() {
        let root = make_root();
        let opts = PathGuardOptions {
            scope_allowlist: Some(vec!["README.md".to_string()]),
            ..Default::default()
        };
        let r = resolve_under_repo_root(root.path(), "README.md", opts).unwrap();
        assert_eq!(r.repo_relative, "README.md");
    }

    #[test]
    fn allows_valid_src_lib_file_repo_relative_normalized() {
        let root = make_root();
        fs::create_dir_all(root.path().join("src/lib")).unwrap();
        let r = resolve_under_repo_root(root.path(), "src/lib/file.ts", opts()).unwrap();
        assert_eq!(r.repo_relative, "src/lib/file.ts");
    }
}
