//! Doctrine denylist for paths that must never be touched, layered on top
//! of `path_guard` rather than merged into it.
//!
//! Kept as a separate module for two reasons: (1) it keeps `path_guard.rs`
//! byte-identical to its forge-smithy upstream, so that file stays
//! diffable forever; (2) doc 07 (Security, Privacy, Governance) treats
//! "canonicalize/symlink/allowed-roots" and "deny `.env`/secrets/keys" as
//! two distinct policy layers, and callers should be able to tell which
//! one fired (different `security_event.event_class` values — see
//! `permission_envelope.rs`).
//!
//! **Must be checked against the already-resolved `AuthorizedRepoPath`'s
//! `repo_relative` field, never the caller's raw requested path string.**
//! `path_guard::resolve_under_repo_root()` fully canonicalizes existing
//! targets, so a symlink named `innocuous.txt` pointing at `.env`
//! *entirely inside* the repo (never triggers `path_guard`'s escape check,
//! since it doesn't escape) still resolves to `repo_relative == ".env"` —
//! checking the raw request string `"innocuous.txt"` instead would miss
//! this entirely. See fixture 8 in the Epic 2 test suite.
//!
//! No glob crate. Doctrine's patterns resolve to exactly four shapes, all
//! matched per path component or leaf filename — never full-string
//! equality, which would satisfy a root-level `.env` test while missing
//! `src/nested/.env` (see fixture 6). General glob semantics (backtracking,
//! brace expansion, character classes) aren't needed for anything doctrine
//! actually specifies, and hand-rolled matching is more predictable and
//! auditable at a security boundary than a general-purpose glob engine.
//! All matching is case-insensitive (`eq_ignore_ascii_case`) — a real gap
//! otherwise, not paranoia, since Tauri ships to macOS (APFS,
//! case-insensitive by default) and Windows (NTFS, case-insensitive). See
//! fixture 7.
//!
//! Accepted residual risk (flagged adversarially 2026-07-03): matching is
//! ASCII-only case-insensitive. A Unicode homoglyph filename (e.g. a
//! Cyrillic lookalike character substituted into ".env") won't match the
//! ASCII pattern strings here, since `eq_ignore_ascii_case` only folds
//! ASCII bytes. Low priority for now — closing this properly needs
//! confusable-skeleton normalization (e.g. Unicode's UTS #39), which is a
//! meaningfully bigger dependency/complexity commitment than anything else
//! in this module. Revisit if this ever needs to defend against untrusted
//! filenames from outside the local filesystem (e.g. names originating
//! from a cloned repo controlled by someone else) rather than the current
//! local-desktop-app threat model.

#![forbid(unsafe_code)]

/// doc 06's 4-item JSON contract example, exactly. Use this when an
/// envelope must round-trip the documented shape verbatim.
pub const CONTRACT_FORBIDDEN_PATTERNS: &[&str] =
    &[".env", "**/.ssh/**", "**/secrets/**", "**/*.pem"];

/// Superset used for envelopes VibeForge constructs itself. doc 07's prose
/// list ("Deny `.env`, private keys, SSH keys, certificate keys, cloud
/// credential files, and token stores") is illustrative, not exhaustive,
/// relative to doc 06's 4-item example. Extended 2026-07-03 after
/// adversarial testing found gaps: SSH key families beyond RSA/Ed25519,
/// `.git-credentials`, Docker config, and common cloud service-account /
/// kubeconfig filenames.
pub const DEFAULT_FORBIDDEN_PATTERNS: &[&str] = &[
    ".env",
    ".env*",
    "**/.ssh/**",
    "**/secrets/**",
    "**/*.pem",
    "**/*.key",
    "**/*.pfx",
    "**/*.p12",
    "**/.aws/**",
    "**/.gcloud/**",
    "**/.kube/**",
    "**/.netrc",
    "**/.npmrc",
    "**/.pgpass",
    "**/id_rsa*",
    "**/id_ed25519*",
    "**/id_dsa*",
    "**/id_ecdsa*",
    "**/.git-credentials",
    "**/.docker/**",
    "**/credentials*",
    "**/service-account*",
    "**/client_secret*",
    "**/kubeconfig",
];

#[derive(Debug, Clone, PartialEq, Eq)]
enum Rule {
    /// Bare name, no wildcards (".env", ".npmrc"). Matches if ANY path
    /// component equals this name, case-insensitively.
    ComponentEquals(String),
    /// "**/<name>/**" (".ssh", "secrets"). Semantically identical to
    /// ComponentEquals (directory names are just components too) — kept as
    /// a distinct variant purely so doctrine's literal "**/.ssh/**" string
    /// round-trips through `parse` without the caller needing to know the
    /// two forms are equivalent.
    DirNamed(String),
    /// "**/*.<ext>" (".pem"). Matches if the FINAL (leaf) component's
    /// extension equals <ext>, case-insensitively.
    ExtensionEquals(String),
    /// "<prefix>*" (".env*", "id_rsa*"). Matches if ANY path component
    /// starts with this prefix, case-insensitively — not just the final
    /// (leaf) component. Originally leaf-only; broadened 2026-07-03 after
    /// adversarial testing found a directory literally named
    /// `id_rsa_keys/` or `.env.d/` hid every file inside it, since nothing
    /// checked ancestor components against this rule. Matches
    /// `ComponentEquals`/`DirNamed`'s existing "any component" semantics —
    /// a secret-shaped directory name should hide its whole contents, the
    /// same way `**/.ssh/**` already does.
    ComponentPrefixed(String),
}

fn parse(raw: &str) -> Rule {
    let trimmed = raw.trim();

    if let Some(inner) = trimmed.strip_prefix("**/").and_then(|s| s.strip_suffix("/**")) {
        return Rule::DirNamed(inner.to_string());
    }

    // A leading "**/" doesn't change matching semantics below — everything
    // is already component-wise / leaf-based regardless of directory depth
    // — so just strip it if present and keep parsing the remainder.
    let rest = trimmed.strip_prefix("**/").unwrap_or(trimmed);

    if let Some(ext) = rest.strip_prefix("*.") {
        return Rule::ExtensionEquals(ext.to_string());
    }

    if let Some(prefix) = rest.strip_suffix('*') {
        return Rule::ComponentPrefixed(prefix.to_string());
    }

    Rule::ComponentEquals(rest.to_string())
}

fn matches(rule: &Rule, components: &[&str], leaf: &str) -> bool {
    match rule {
        Rule::ComponentEquals(name) => components.iter().any(|c| c.eq_ignore_ascii_case(name)),
        Rule::DirNamed(name) => components.iter().any(|c| c.eq_ignore_ascii_case(name)),
        Rule::ExtensionEquals(ext) => leaf
            .rsplit_once('.')
            .is_some_and(|(_, e)| e.eq_ignore_ascii_case(ext)),
        Rule::ComponentPrefixed(prefix) => components.iter().any(|c| {
            c.get(..prefix.len()).is_some_and(|head| head.eq_ignore_ascii_case(prefix))
        }),
    }
}

/// Check a resolved `repo_relative` path (as produced by
/// `path_guard::AuthorizedRepoPath.repo_relative`) against a set of
/// doctrine-style forbidden patterns. Returns the first matching raw
/// pattern string (for the `security_event.reason` field), or `None` if
/// nothing matched.
pub fn check<'a>(repo_relative: &str, patterns: &'a [String]) -> Option<&'a str> {
    let components: Vec<&str> = repo_relative.split('/').filter(|c| !c.is_empty()).collect();
    let leaf = components.last().copied().unwrap_or("");

    patterns
        .iter()
        .find(|raw| matches(&parse(raw), &components, leaf))
        .map(|raw| raw.as_str())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn defaults() -> Vec<String> {
        DEFAULT_FORBIDDEN_PATTERNS.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn blocks_env_at_root() {
        assert!(check(".env", &defaults()).is_some());
    }

    #[test]
    fn blocks_env_nested() {
        assert!(check("src/nested/.env", &defaults()).is_some());
    }

    #[test]
    fn blocks_env_uppercase() {
        assert!(check(".ENV", &defaults()).is_some());
        assert!(check("src/.Env", &defaults()).is_some());
    }

    #[test]
    fn blocks_env_variant_suffix() {
        assert!(check(".env.local", &defaults()).is_some());
        assert!(check(".env.production", &defaults()).is_some());
    }

    #[test]
    fn blocks_ssh_directory_contents() {
        assert!(check("home/user/.ssh/id_rsa", &defaults()).is_some());
    }

    #[test]
    fn blocks_pem_extension_anywhere() {
        assert!(check("certs/server.pem", &defaults()).is_some());
    }

    #[test]
    fn blocks_pem_extension_case_insensitive() {
        assert!(check("certs/server.PEM", &defaults()).is_some());
    }

    #[test]
    fn allows_unrelated_source_file() {
        assert!(check("src/lib/file.ts", &defaults()).is_none());
    }

    #[test]
    fn allows_file_with_env_substring_but_different_leaf() {
        // "environment.ts" contains "env" as a substring but is not a
        // component-equals or leaf-prefix match for any default pattern.
        assert!(check("src/environment.ts", &defaults()).is_none());
    }

    #[test]
    fn blocks_secret_shaped_directory_contents_not_just_leaf() {
        // Adversarially discovered 2026-07-03: ComponentPrefixed (formerly
        // LeafPrefixed) only checked the final path component, so a
        // directory literally named "id_rsa_keys/" hid everything inside
        // it from the ".env*"/"id_rsa*" family of rules.
        assert!(check("id_rsa_keys/readme.txt", &defaults()).is_some());
        assert!(check(".env.d/00-base.conf", &defaults()).is_some());
    }

    #[test]
    fn blocks_additional_ssh_key_families() {
        assert!(check("home/.ssh/id_dsa", &defaults()).is_some());
        assert!(check("home/.ssh/id_ecdsa.pub", &defaults()).is_some());
    }

    #[test]
    fn blocks_git_credentials_and_docker_config() {
        assert!(check(".git-credentials", &defaults()).is_some());
        assert!(check(".docker/config.json", &defaults()).is_some());
    }

    #[test]
    fn blocks_cloud_service_account_and_kubeconfig() {
        assert!(check("service-account.json", &defaults()).is_some());
        assert!(check("client_secret_12345.json", &defaults()).is_some());
        assert!(check("kubeconfig", &defaults()).is_some());
    }

    #[test]
    fn contract_example_matches_doc_06_exactly() {
        assert_eq!(
            CONTRACT_FORBIDDEN_PATTERNS,
            &[".env", "**/.ssh/**", "**/secrets/**", "**/*.pem"]
        );
    }
}
