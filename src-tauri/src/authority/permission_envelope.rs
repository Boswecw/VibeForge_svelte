//! The permission envelope: the single validation entry point every other
//! epic calls into for path and command authorization. Matches the JSON
//! contract shape in docs/plans/06_AGENT_ORCHESTRATION_ALGORITHMS.md
//! exactly.
//!
//! `validate_path()` deliberately OWNS the call into `path_guard`, choosing
//! the root itself based on intent and `write_scope`, rather than
//! reviewing an already-resolved `AuthorizedRepoPath` handed to it by the
//! caller. A caller that pre-resolves against `repo_root` and then asks
//! this envelope to "review" the result would produce a structurally valid
//! path before the envelope ever got a say in which root was used —
//! silently defeating `write_scope: isolated_worktree_only`. Root selection
//! must happen inside this function, not before it.

#![forbid(unsafe_code)]

use std::path::Path;

use super::command_policy::{self, CommandAction, CommandRiskClass};
use super::forbidden_patterns;
use super::path_guard::{self, AuthorizedRepoPath, PathGuardOptions};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PermissionEnvelope {
    pub permission_envelope_version: String,
    pub mission_id: String,
    pub repo_id: String,
    /// "repo_root" | "worktree_root" — informational per the JSON contract;
    /// actual root selection is driven by `write_scope` + `PathIntent`, not
    /// by iterating this list.
    pub allowed_roots: Vec<String>,
    pub forbidden_patterns: Vec<String>,
    pub allowed_commands: Vec<String>,
    pub blocked_commands: Vec<String>,
    pub network_allowed: bool,
    pub cloud_allowed: bool,
    pub max_runtime_seconds: u64,
    pub max_tokens: u64,
    pub max_cost_credits: u64,
    /// "isolated_worktree_only" is the only value shown in the docs. Any
    /// other value is treated as an open write scope (no worktree
    /// requirement) — there's nothing else documented to enforce yet.
    ///
    /// Accepted residual risk (flagged adversarially 2026-07-03): when this
    /// is "isolated_worktree_only", `validate_path()` only checks that
    /// writes stay under whatever `worktree_root` the caller supplies — it
    /// does not verify that `worktree_root` is actually a real git
    /// worktree of `repo_root` (e.g. via `git worktree list`, or a `.git`
    /// file pointing back under `repo_root/.git/worktrees/`). A caller
    /// that supplies an overly broad `worktree_root` (a parent directory
    /// containing unrelated sibling projects) gets isolation scoped to
    /// that directory, not to anything structurally tied to `repo_root`.
    /// Not exploitable purely from the CLI/API surface today — nothing in
    /// this codebase yet constructs `worktree_root` from untrusted input —
    /// but worth closing before a later epic (the worktree manager, Epic
    /// 5) constructs `worktree_root` from anything less than a fully
    /// trusted source.
    pub write_scope: String,
}

/// **Trust boundary, not a verified guarantee**: `PathIntent` is asserted by
/// the caller, not independently checked against what the caller actually
/// does afterward. `validate_path()` selects a root based on the declared
/// intent, but nothing here (or anywhere in this module) stops a caller
/// from declaring `Read` and then performing a write through the returned
/// `AuthorizedRepoPath` — that would silently bypass `write_scope:
/// isolated_worktree_only` entirely. Flagged adversarially 2026-07-03;
/// judged a structural property of this layer rather than a fixable bug
/// here, since verifying "what a caller will actually do" is not something
/// a path-resolution function can observe. Whatever layer actually
/// performs the filesystem operation (the workcell executor, once one
/// exists) MUST independently enforce open-mode vs. declared intent — e.g.
/// only ever opening the returned path `O_RDONLY` when `intent == Read` —
/// rather than trusting this envelope's root selection as the sole write
/// boundary.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PathIntent {
    Read,
    Write,
}

#[derive(Debug, thiserror::Error)]
pub enum EnvelopeViolation {
    #[error(transparent)]
    PathGuard(#[from] path_guard::PathGuardError),
    #[error("path '{repo_relative}' matches forbidden pattern '{matched_pattern}'")]
    ForbiddenPattern {
        matched_pattern: String,
        repo_relative: String,
    },
    #[error("write_scope is isolated_worktree_only but no worktree_root was provided")]
    NoWorktreeConfigured,
}

impl EnvelopeViolation {
    /// Stable `security_event.event_class` value for this violation kind —
    /// shared by the CLI and tests so both log/assert against the same
    /// taxonomy rather than each inventing their own strings.
    ///
    /// Broadened 2026-07-03 (adversarially flagged): originally only
    /// `Escape`/`Traversal` had distinct classes and every other
    /// `PathGuardError` variant — including security-relevant ones like
    /// `Absolute`, `ControlChar`, and `DrivePrefix` — fell into the same
    /// generic `path_guard_blocked` bucket as genuinely benign/operational
    /// cases (`RootMissing`, `ParentMissing`, `Io`). That made
    /// `security_event`s impossible to usefully alert/aggregate on: a
    /// likely-malicious absolute-path exfiltration attempt or a
    /// control-character injection attempt was indistinguishable from a
    /// routine "directory doesn't exist yet" developer error. The
    /// human-readable `reason` string always carried the detail (see
    /// `security_event.reason`/`evidence` in the vault), but the
    /// aggregatable signal didn't. `NoWorktreeConfigured` also gets its own
    /// class now — it's a policy/config violation, not a path-parsing
    /// failure, and conflating the two was misleading for the same reason.
    pub fn event_class(&self) -> &'static str {
        use path_guard::PathGuardError;
        match self {
            EnvelopeViolation::PathGuard(PathGuardError::Escape(_)) => "symlink_escape_blocked",
            EnvelopeViolation::PathGuard(PathGuardError::Traversal(_)) => "path_traversal_blocked",
            EnvelopeViolation::PathGuard(PathGuardError::Absolute(_)) => "absolute_path_blocked",
            EnvelopeViolation::PathGuard(PathGuardError::ControlChar(_)) => "control_char_blocked",
            EnvelopeViolation::PathGuard(PathGuardError::DrivePrefix(_)) => "drive_prefix_blocked",
            EnvelopeViolation::PathGuard(PathGuardError::CurrentDir(_)) => "current_dir_component_blocked",
            EnvelopeViolation::PathGuard(PathGuardError::OutOfScope(_)) => "out_of_scope_blocked",
            EnvelopeViolation::PathGuard(
                PathGuardError::Empty
                | PathGuardError::RootMissing(_)
                | PathGuardError::RootNotDirectory(_)
                | PathGuardError::ParentMissing(_)
                | PathGuardError::Io(_),
            ) => "path_guard_config_error",
            EnvelopeViolation::ForbiddenPattern { .. } => "forbidden_pattern_blocked",
            EnvelopeViolation::NoWorktreeConfigured => "worktree_not_configured",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CommandAuthorization {
    Allowed,
    RequiresApproval { class: CommandRiskClass, reason: String },
    Blocked { class: CommandRiskClass, reason: String },
}

impl PermissionEnvelope {
    /// A conservative default envelope: worktree-only writes, no network,
    /// no cloud, the doctrine's superset forbidden-pattern list, and no
    /// mission-specific command overrides.
    pub fn default_for_mission(mission_id: impl Into<String>, repo_id: impl Into<String>) -> Self {
        Self {
            permission_envelope_version: "vibeforge.permission_envelope.v1".to_string(),
            mission_id: mission_id.into(),
            repo_id: repo_id.into(),
            allowed_roots: vec!["repo_root".to_string(), "worktree_root".to_string()],
            forbidden_patterns: forbidden_patterns::DEFAULT_FORBIDDEN_PATTERNS
                .iter()
                .map(|s| s.to_string())
                .collect(),
            allowed_commands: Vec::new(),
            blocked_commands: Vec::new(),
            network_allowed: false,
            cloud_allowed: false,
            max_runtime_seconds: 3600,
            max_tokens: 100_000,
            max_cost_credits: 0,
            write_scope: "isolated_worktree_only".to_string(),
        }
    }

    /// Resolve and authorize a repo-relative path. Owns root selection —
    /// see the module doc comment for why that matters.
    pub fn validate_path(
        &self,
        repo_root: &Path,
        worktree_root: Option<&Path>,
        requested_relative_path: &str,
        intent: PathIntent,
    ) -> Result<AuthorizedRepoPath, EnvelopeViolation> {
        let selected_root: &Path = match intent {
            PathIntent::Read => repo_root,
            PathIntent::Write => {
                if self.write_scope == "isolated_worktree_only" {
                    worktree_root.ok_or(EnvelopeViolation::NoWorktreeConfigured)?
                } else {
                    repo_root
                }
            }
        };

        let resolved = path_guard::resolve_under_repo_root(
            selected_root,
            requested_relative_path,
            PathGuardOptions::default(),
        )?;

        if let Some(matched) = forbidden_patterns::check(&resolved.repo_relative, &self.forbidden_patterns) {
            return Err(EnvelopeViolation::ForbiddenPattern {
                matched_pattern: matched.to_string(),
                repo_relative: resolved.repo_relative.clone(),
            });
        }

        Ok(resolved)
    }

    /// Classify and authorize a proposed command string. Returns a 3-way
    /// outcome, deliberately not a `Result` — `RequiresApproval` is a
    /// valid, resumable outcome a caller must branch on (a developer can
    /// say yes), not an error identical in kind to `Blocked` (never, full
    /// stop).
    pub fn validate_command(&self, command: &str) -> CommandAuthorization {
        let class = command_policy::classify(command);

        // Envelope-specific blocked_commands is an additional restriction
        // only — it can never lift a restriction the generic classifier
        // already implied.
        if self.blocked_commands.iter().any(|b| commands_match(b, command)) {
            return CommandAuthorization::Blocked {
                class,
                reason: "command matches this mission's envelope blocked_commands entry".to_string(),
            };
        }

        let action = command_policy::default_action(class);

        // Envelope-specific allowed_commands can only upgrade a
        // RequireApproval outcome to Allowed (pre-approved, mission-specific
        // safe commands beyond the classifier's built-in categories) — it
        // can never override a hard Blocked. Forbidden/Privileged/
        // Destructive are absolute security boundaries, not
        // envelope-configurable defaults.
        if action == CommandAction::RequireApproval
            && self.allowed_commands.iter().any(|a| commands_match(a, command))
        {
            return CommandAuthorization::Allowed;
        }

        match action {
            CommandAction::Allow => CommandAuthorization::Allowed,
            CommandAction::RequireApproval => CommandAuthorization::RequiresApproval {
                class,
                reason: format!("{class:?} commands require developer approval"),
            },
            CommandAction::Blocked => CommandAuthorization::Blocked {
                class,
                reason: format!("{class:?} commands are blocked"),
            },
        }
    }
}

/// Accepted residual risk (flagged adversarially 2026-07-03): prefix
/// matching means a bare single-token `allowed_commands` entry (e.g. just
/// `"npm"`, intended to pre-approve one specific invocation like `"npm
/// test"` but typo'd/truncated) silently widens to pre-approve *every*
/// subcommand of that binary that isn't already independently hard-blocked
/// — `npm install <anything>`, `npm publish`, `npm run <arbitrary
/// script>`, etc. This can't escalate past a hard `Blocked` classification
/// (Forbidden/Destructive/Privileged), only upgrade a `RequireApproval`
/// default to `Allowed`, so the blast radius is bounded — but it's still a
/// real widening beyond "this one exact command" if an envelope's
/// `allowed_commands` is ever populated by anything other than a careful
/// human. Not fixed here: `default_for_mission()` always starts with an
/// empty `allowed_commands`, so there's no real attack surface yet in this
/// epic. Revisit (e.g. require entries to specify at least two tokens, or
/// support an explicit trailing-`*` opt-in for intentional prefix matches)
/// once something populates `allowed_commands` from anything less than a
/// fully trusted, deliberate source.
///
/// `pattern` matches `command` if `command` is exactly `pattern`, or starts
/// with `pattern` followed by a space (so "rm" doesn't spuriously match
/// "rmdir").
fn commands_match(pattern: &str, command: &str) -> bool {
    let pattern = pattern.trim();
    let command = command.trim();
    command == pattern || command.starts_with(&format!("{pattern} "))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    #[cfg(unix)]
    use std::os::unix::fs::symlink;
    use tempfile::TempDir;

    fn envelope() -> PermissionEnvelope {
        PermissionEnvelope::default_for_mission("mis_test", "repo_test")
    }

    #[test]
    fn write_requires_worktree_root_when_scope_is_isolated() {
        let root = TempDir::new().unwrap();
        let env = envelope();
        let err = env
            .validate_path(root.path(), None, "src/new.ts", PathIntent::Write)
            .unwrap_err();
        assert!(matches!(err, EnvelopeViolation::NoWorktreeConfigured));
    }

    #[test]
    fn write_resolves_against_worktree_root_not_repo_root() {
        let repo_root = TempDir::new().unwrap();
        let worktree_root = TempDir::new().unwrap();
        fs::create_dir_all(worktree_root.path().join("src")).unwrap();

        let env = envelope();
        let resolved = env
            .validate_path(
                repo_root.path(),
                Some(worktree_root.path()),
                "src/new.ts",
                PathIntent::Write,
            )
            .unwrap();
        assert!(resolved.absolute.starts_with(worktree_root.path().canonicalize().unwrap()));
    }

    #[test]
    fn read_resolves_against_repo_root_even_with_worktree_configured() {
        let repo_root = TempDir::new().unwrap();
        fs::create_dir_all(repo_root.path().join("src")).unwrap();
        let worktree_root = TempDir::new().unwrap();

        let env = envelope();
        let resolved = env
            .validate_path(
                repo_root.path(),
                Some(worktree_root.path()),
                "src/file.ts",
                PathIntent::Read,
            )
            .unwrap();
        assert!(resolved.absolute.starts_with(repo_root.path().canonicalize().unwrap()));
    }

    #[test]
    fn event_class_distinguishes_security_relevant_path_guard_errors() {
        // Adversarially discovered 2026-07-03: these used to collapse into
        // the same generic "path_guard_blocked" bucket as benign
        // operational errors (missing directories etc).
        let root = TempDir::new().unwrap();
        let env = envelope();

        let absolute_err = env
            .validate_path(root.path(), None, "/etc/passwd", PathIntent::Read)
            .unwrap_err();
        assert_eq!(absolute_err.event_class(), "absolute_path_blocked");

        let control_char_err = env
            .validate_path(root.path(), None, "src/file\0.rs", PathIntent::Read)
            .unwrap_err();
        assert_eq!(control_char_err.event_class(), "control_char_blocked");

        let traversal_err = env
            .validate_path(root.path(), None, "../outside.txt", PathIntent::Read)
            .unwrap_err();
        assert_eq!(traversal_err.event_class(), "path_traversal_blocked");

        let no_worktree_err = env
            .validate_path(root.path(), None, "src/new.ts", PathIntent::Write)
            .unwrap_err();
        assert_eq!(no_worktree_err.event_class(), "worktree_not_configured");
    }

    #[test]
    fn blocks_env_file_via_forbidden_patterns() {
        let root = TempDir::new().unwrap();
        fs::write(root.path().join(".env"), b"SECRET=1").unwrap();
        let env = envelope();
        let err = env
            .validate_path(root.path(), None, ".env", PathIntent::Read)
            .unwrap_err();
        assert!(matches!(err, EnvelopeViolation::ForbiddenPattern { .. }));
    }

    #[cfg(unix)]
    #[test]
    fn blocks_symlink_to_env_inside_repo() {
        let root = TempDir::new().unwrap();
        fs::write(root.path().join(".env"), b"SECRET=1").unwrap();
        symlink(root.path().join(".env"), root.path().join("innocuous.txt")).unwrap();

        let env = envelope();
        let err = env
            .validate_path(root.path(), None, "innocuous.txt", PathIntent::Read)
            .unwrap_err();
        assert!(matches!(err, EnvelopeViolation::ForbiddenPattern { .. }));
    }

    #[test]
    fn propagates_path_guard_traversal_error() {
        let root = TempDir::new().unwrap();
        let env = envelope();
        let err = env
            .validate_path(root.path(), None, "../../.ssh/config", PathIntent::Read)
            .unwrap_err();
        assert!(matches!(err, EnvelopeViolation::PathGuard(_)));
    }

    #[test]
    fn allows_git_status() {
        let env = envelope();
        assert_eq!(env.validate_command("git status"), CommandAuthorization::Allowed);
    }

    #[test]
    fn blocks_sudo() {
        let env = envelope();
        assert!(matches!(env.validate_command("sudo rm -rf /"), CommandAuthorization::Blocked { .. }));
    }

    #[test]
    fn network_requires_approval_by_default() {
        let env = envelope();
        assert!(matches!(
            env.validate_command("curl https://example.com"),
            CommandAuthorization::RequiresApproval { class: CommandRiskClass::Network, .. }
        ));
    }

    #[test]
    fn explicit_allowed_commands_upgrades_require_approval_to_allowed() {
        let mut env = envelope();
        env.allowed_commands.push("curl https://example.com".to_string());
        assert_eq!(
            env.validate_command("curl https://example.com"),
            CommandAuthorization::Allowed
        );
    }

    #[test]
    fn explicit_allowed_commands_cannot_override_hard_block() {
        let mut env = envelope();
        env.allowed_commands.push("sudo rm -rf /".to_string());
        assert!(matches!(
            env.validate_command("sudo rm -rf /"),
            CommandAuthorization::Blocked { .. }
        ));
    }

    #[test]
    fn explicit_blocked_commands_adds_restriction_beyond_classifier() {
        let mut env = envelope();
        env.blocked_commands.push("git push".to_string());
        // "git push" alone (no --force) would otherwise classify as Network
        // -> RequireApproval; the explicit envelope entry escalates it.
        assert!(matches!(
            env.validate_command("git push origin main"),
            CommandAuthorization::Blocked { .. }
        ));
    }
}
