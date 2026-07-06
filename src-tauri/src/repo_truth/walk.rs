//! Bounded directory walk producing a flat file list.
//!
//! Ignored directories (build artifacts, VCS internals, dependency caches)
//! are pruned via `it.skip_current_dir()` *before* their contents are ever
//! enumerated, not filtered out afterward — this matters because the same
//! prune also covers anything matching
//! `crate::authority::forbidden_patterns::check()`, so a `.ssh/` or
//! `secrets/` directory is never even listed, let alone read. This is why
//! `repo_truth` depends on `crate::authority` (see this module's parent
//! `mod.rs` doc comment).
//!
//! `follow_links(false)` means a symlinked directory is reported as a leaf
//! entry (its `file_type()` reports the symlink, not a directory) and is
//! never descended into — this alone prevents symlink traversal loops; no
//! separate visited-inode tracking is needed.
//!
//! `max_files` is a safety ceiling, not a soft hint: every entry the
//! underlying iterator yields (successful or not) counts against it, and
//! once the cap is hit the walk stops immediately and reports `truncated`.

#![forbid(unsafe_code)]

use crate::authority::forbidden_patterns;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// Matches doctrine's directory-prune list. Compared case-insensitively
/// against a single path component (the directory's own name), never a
/// full path — this list is deliberately separate from
/// `forbidden_patterns`, which covers a different concern (secrets/keys
/// shaped paths) and is checked independently below.
const IGNORED_DIR_NAMES: &[&str] = &[
    "node_modules",
    "target",
    "dist",
    "build",
    "out",
    "vendor",
    ".git",
    ".venv",
    "venv",
    "__pycache__",
    ".mypy_cache",
    ".pytest_cache",
    ".next",
    ".nuxt",
    ".svelte-kit",
    ".turbo",
    ".cache",
    "coverage",
    ".idea",
    ".vscode",
    "bower_components",
    ".tox",
    "site-packages",
    ".gradle",
    ".terraform",
    "Pods",
    "DerivedData",
];

pub const DEFAULT_MAX_DEPTH: usize = 12;
pub const DEFAULT_MAX_FILES: usize = 20_000;

/// One non-directory entry found during the walk (a file, or a symlink —
/// including one that points at a directory, since `follow_links(false)`
/// makes such a symlink a leaf rather than something to descend into).
#[derive(Debug, Clone)]
pub struct WalkedFile {
    /// POSIX-style path relative to the (already canonicalized) repo root.
    pub repo_relative: String,
    pub absolute: PathBuf,
    pub size_bytes: u64,
    pub is_symlink: bool,
}

#[derive(Debug, Clone, Default)]
pub struct WalkOutput {
    pub files: Vec<WalkedFile>,
    pub truncated: bool,
}

/// Walk `canonical_root` (must already be canonicalized by the caller — see
/// `path_guard::resolve_under_repo_root` for why callers elsewhere in this
/// crate always canonicalize before touching the filesystem) up to
/// `max_depth`, collecting at most `max_files` visited entries.
pub fn walk_repo(canonical_root: &Path, max_depth: usize, max_files: usize) -> WalkOutput {
    let forbidden: Vec<String> = forbidden_patterns::DEFAULT_FORBIDDEN_PATTERNS
        .iter()
        .map(|s| (*s).to_string())
        .collect();

    let mut files = Vec::new();
    let mut truncated = false;
    let mut visited = 0usize;

    let mut it = WalkDir::new(canonical_root)
        .max_depth(max_depth)
        .follow_links(false)
        .into_iter();

    while let Some(entry) = it.next() {
        if visited >= max_files {
            truncated = true;
            break;
        }
        visited += 1;

        let entry = match entry {
            Ok(e) => e,
            // Unreadable directory entries (permission denied, etc) are
            // skipped rather than failing the whole scan closed — a repo
            // scan is best-effort discovery, not a security boundary
            // itself (that's `safe_read`'s job, which fails closed).
            Err(_) => continue,
        };

        if entry.depth() == 0 {
            // The root itself; never prune based on the root's own name.
            continue;
        }

        let repo_relative = to_repo_relative(canonical_root, entry.path());

        if entry.file_type().is_dir() {
            let name = entry.file_name().to_string_lossy();
            let is_ignored_name = IGNORED_DIR_NAMES
                .iter()
                .any(|ignored| name.eq_ignore_ascii_case(ignored));
            let is_forbidden = forbidden_patterns::check(&repo_relative, &forbidden).is_some();
            if is_ignored_name || is_forbidden {
                it.skip_current_dir();
            }
            continue;
        }

        // A file, or a symlink (to a file OR a directory — with
        // `follow_links(false)` a symlinked directory's `file_type()`
        // reports the symlink, so it lands here as a leaf, never
        // descended into).
        let is_symlink = entry.path_is_symlink();
        let size_bytes = entry.metadata().map(|m| m.len()).unwrap_or(0);

        files.push(WalkedFile {
            repo_relative,
            absolute: entry.path().to_path_buf(),
            size_bytes,
            is_symlink,
        });
    }

    WalkOutput { files, truncated }
}

fn to_repo_relative(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .map(|p| p.to_string_lossy().replace('\\', "/"))
        .unwrap_or_else(|_| path.to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    #[cfg(unix)]
    use std::os::unix::fs::symlink;
    use tempfile::TempDir;

    fn write_file(root: &Path, rel: &str, contents: &str) {
        let path = root.join(rel);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).unwrap();
        }
        fs::write(path, contents).unwrap();
    }

    fn relatives(output: &WalkOutput) -> Vec<String> {
        output.files.iter().map(|f| f.repo_relative.clone()).collect()
    }

    #[test]
    fn ignored_directories_are_never_descended_into() {
        let root = TempDir::new().unwrap();
        write_file(root.path(), "src/main.rs", "fn main() {}");
        write_file(root.path(), "node_modules/marker_a/pkg.js", "MARKER_A");
        write_file(root.path(), "target/marker_b/debug.bin", "MARKER_B");
        write_file(root.path(), ".git/marker_c/HEAD", "MARKER_C");

        let output = walk_repo(root.path(), DEFAULT_MAX_DEPTH, DEFAULT_MAX_FILES);
        let rels = relatives(&output);

        assert!(rels.contains(&"src/main.rs".to_string()));
        assert!(!rels.iter().any(|r| r.contains("node_modules")));
        assert!(!rels.iter().any(|r| r.contains("marker_a")));
        assert!(!rels.iter().any(|r| r.contains("target")));
        assert!(!rels.iter().any(|r| r.contains("marker_b")));
        assert!(!rels.iter().any(|r| r.contains(".git")));
        assert!(!rels.iter().any(|r| r.contains("marker_c")));
    }

    #[test]
    fn forbidden_pattern_shaped_directory_is_also_pruned() {
        let root = TempDir::new().unwrap();
        write_file(root.path(), "secrets/marker/api_key.txt", "MARKER_SECRET");
        write_file(root.path(), "src/lib.rs", "// ok");

        let output = walk_repo(root.path(), DEFAULT_MAX_DEPTH, DEFAULT_MAX_FILES);
        let rels = relatives(&output);
        assert!(rels.contains(&"src/lib.rs".to_string()));
        assert!(!rels.iter().any(|r| r.contains("secrets")));
    }

    #[test]
    fn max_files_truncates() {
        let root = TempDir::new().unwrap();
        for i in 0..10 {
            write_file(root.path(), &format!("file_{i}.txt"), "x");
        }

        let output = walk_repo(root.path(), DEFAULT_MAX_DEPTH, 3);
        assert!(output.truncated);
        assert!(output.files.len() <= 3);
    }

    #[test]
    fn adversarial_max_files_exact_boundary_root_slot_check() {
        // Does the root directory entry (depth 0, always `continue`d past)
        // consume one of the `max_files` budget slots before any real file
        // is even considered? If so, asking for a cap of N and providing
        // exactly N files will silently yield only N-1 files AND report
        // truncated=true, which would be a boundary-off-by-one surprise.
        for n in [1usize, 2, 3, 5, 10] {
            let root = TempDir::new().unwrap();
            for i in 0..n {
                write_file(root.path(), &format!("file_{i}.txt"), "x");
            }
            let output = walk_repo(root.path(), DEFAULT_MAX_DEPTH, n);
            eprintln!(
                "cap={n} files_found={} truncated={}",
                output.files.len(),
                output.truncated
            );
        }
    }

    #[test]
    fn max_files_not_truncated_when_under_cap() {
        let root = TempDir::new().unwrap();
        write_file(root.path(), "a.txt", "x");
        write_file(root.path(), "b.txt", "x");

        let output = walk_repo(root.path(), DEFAULT_MAX_DEPTH, DEFAULT_MAX_FILES);
        assert!(!output.truncated);
        assert_eq!(output.files.len(), 2);
    }

    #[test]
    fn max_depth_excludes_files_deeper_than_limit() {
        let root = TempDir::new().unwrap();
        write_file(root.path(), "a/b/c/d/deep.txt", "x");
        write_file(root.path(), "shallow.txt", "x");

        // depth 0 = root, depth 1 = "a", depth 2 = "a/b", depth 3 = "a/b/c" —
        // max_depth(2) should exclude the depth-4 leaf file entirely.
        let output = walk_repo(root.path(), 2, DEFAULT_MAX_FILES);
        let rels = relatives(&output);
        assert!(rels.contains(&"shallow.txt".to_string()));
        assert!(!rels.iter().any(|r| r.contains("deep.txt")));
    }

    #[test]
    fn adversarial_top_level_secret_shaped_file_is_listed_by_walk_but_never_read() {
        use crate::repo_truth::{instructions, manifests, safe_read};

        let root = TempDir::new().unwrap();
        write_file(root.path(), ".env", "SUPER_SECRET_DB_PASSWORD=hunter2");
        write_file(root.path(), "src/lib.rs", "// ok");

        let output = walk_repo(root.path(), DEFAULT_MAX_DEPTH, DEFAULT_MAX_FILES);
        let rels = relatives(&output);

        // Layer 1 (walk.rs): a top-level secret-shaped FILE (not
        // directory) is NOT pruned by walk_repo itself -- it is listed
        // like any other file. This is the documented two-layer design,
        // not a gap, AS LONG AS nothing downstream ever recognizes it by
        // filename and reads it.
        assert!(rels.contains(&".env".to_string()), "walk.rs lists top-level files regardless of forbidden_patterns");

        // Layer 2a: it is not a recognized instruction filename, so
        // instructions.rs never calls safe_read on it.
        let detected = instructions::find_instruction_files(root.path(), &output.files);
        assert!(!detected.iter().any(|d| d.entry.path == ".env"));

        // Layer 2b: it is not a recognized manifest filename either.
        let manifests = manifests::find_and_parse_manifests(root.path(), &output.files);
        assert!(!manifests.iter().any(|m| m.repo_relative == ".env"));

        // Layer 2c (defense in depth): even if something DID try to read
        // it directly via safe_read, it is rejected there too.
        let err = safe_read::read_capped_text(root.path(), ".env", safe_read::DEFAULT_MAX_PARSE_WINDOW).unwrap_err();
        assert!(matches!(err, safe_read::SafeReadError::Forbidden(_)), "expected Forbidden, got {err:?}");
    }

    #[cfg(unix)]
    #[test]
    fn symlinked_directory_is_recorded_but_never_traversed() {
        let outside = TempDir::new().unwrap();
        write_file(outside.path(), "inside_target/marker.txt", "MARKER_OUTSIDE");

        let root = TempDir::new().unwrap();
        let link = root.path().join("linked_dir");
        symlink(outside.path().join("inside_target"), &link).unwrap();

        let output = walk_repo(root.path(), DEFAULT_MAX_DEPTH, DEFAULT_MAX_FILES);
        let rels = relatives(&output);

        // The symlink itself shows up as a leaf entry...
        assert!(rels.contains(&"linked_dir".to_string()));
        // ...but its contents were never traversed into.
        assert!(!rels.iter().any(|r| r.contains("marker.txt")));

        let entry = output
            .files
            .iter()
            .find(|f| f.repo_relative == "linked_dir")
            .unwrap();
        assert!(entry.is_symlink);
    }

    #[cfg(unix)]
    #[test]
    fn symlinked_file_is_recorded_with_is_symlink_true() {
        let root = TempDir::new().unwrap();
        write_file(root.path(), "real.txt", "hello");
        let link = root.path().join("link.txt");
        symlink(root.path().join("real.txt"), &link).unwrap();

        let output = walk_repo(root.path(), DEFAULT_MAX_DEPTH, DEFAULT_MAX_FILES);

        let real = output.files.iter().find(|f| f.repo_relative == "real.txt").unwrap();
        assert!(!real.is_symlink);

        let linked = output.files.iter().find(|f| f.repo_relative == "link.txt").unwrap();
        assert!(linked.is_symlink);
    }
}
