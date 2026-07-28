//! Context Control (Epic 4): build a bounded, redacted, content-addressed
//! **context pack** for a mission, and gate any cloud escalation behind a
//! mandatory, forbidden-field-scanned, developer-approved **cloud payload
//! preview**.
//!
//! This module is the VibeForge realization of doc
//! `06_AGENT_ORCHESTRATION_ALGORITHMS.md` "Algorithm 2 — Context pack
//! builder" and doc `07_SECURITY_PRIVACY_GOVERNANCE.md` (safe-analytics
//! allowlist, redaction, forbidden-field scan). The two exit-gate
//! properties this epic must prove (per
//! `docs/plans/08_IMPLEMENTATION_MILESTONES.md`, M4, and
//! `10_CONTRACTOR_HANDOFF.md`, Epic 4) live here as pure, unit-tested
//! functions:
//!
//! - **"a cloud payload cannot execute without a preview"** →
//!   [`cloud_preview::authorize_cloud_execution`] fails closed for a missing
//!   preview, a failed forbidden-field scan, or an unapproved preview.
//! - **"secret-like fixtures are excluded"** → [`redaction`] scrubs
//!   token/key/credential/PII-like values out of every included evidence
//!   item, and [`budget::select_within_budget`] drops whole items marked
//!   secret-like before they can ever reach a pack.
//!
//! Structural note, mirroring `repo_truth/mod.rs`: **nothing in this module
//! tree touches the database or the filesystem.** It is pure
//! structured-data-in / structured-data-out. Persistence of the resulting
//! `context_pack` / `cloud_payload_preview` rows is the vault repository
//! layer's job (`vault::context_control`), and orchestration across the two
//! lives in the `vibeforge_context` CLI binary. It also does not depend on
//! `crate::authority` — a binary can mount `context_control` via `#[path]`
//! without also mounting `authority` (compare the CLI, which mounts only
//! `vault` + `context_control`).

#![forbid(unsafe_code)]

pub mod budget;
pub mod cloud_preview;
pub mod forbidden_fields;
pub mod manifest;
pub mod path_alias;
pub mod redaction;

#[cfg(test)]
mod fixtures_test;

/// The four `context_pack.route_class` / `cloud_payload_preview.route_class`
/// values the vault schema's `CHECK (route_class IN (...))` constraint
/// allows (`migrations/001_initial_vault_schema.sql`). Kept as a Rust enum
/// so the cloud-gating logic can ask `is_cloud()` rather than string-matching
/// in three places, but it maps 1:1 to the DB strings via [`Self::as_str`].
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum RouteClass {
    Local,
    QuickCloud,
    DeepCloud,
    TeamPolicy,
}

impl RouteClass {
    pub fn as_str(&self) -> &'static str {
        match self {
            RouteClass::Local => "local",
            RouteClass::QuickCloud => "quick_cloud",
            RouteClass::DeepCloud => "deep_cloud",
            RouteClass::TeamPolicy => "team_policy",
        }
    }

    /// `quick_cloud` and `deep_cloud` are the only routes that leave the
    /// local machine. `team_policy` is a governance route, not a
    /// transmission route, and is deliberately NOT treated as cloud here —
    /// it never triggers the cloud payload preview gate. `local` obviously
    /// never does either.
    pub fn is_cloud(&self) -> bool {
        matches!(self, RouteClass::QuickCloud | RouteClass::DeepCloud)
    }

    pub fn parse(raw: &str) -> Option<Self> {
        match raw {
            "local" => Some(RouteClass::Local),
            "quick_cloud" => Some(RouteClass::QuickCloud),
            "deep_cloud" => Some(RouteClass::DeepCloud),
            "team_policy" => Some(RouteClass::TeamPolicy),
            _ => None,
        }
    }
}

/// One candidate piece of evidence offered to the context pack builder.
///
/// `content` is the raw text as read by the caller; the builder never trusts
/// it to already be safe — every included item's `content` is run through
/// [`redaction::redact`] and [`path_alias`] before it can leave this module.
/// `source_ref` MUST be a repo-relative path or an already-stable alias, not
/// a private absolute path (the vault must never persist raw absolute paths;
/// see `repo_truth::snapshot::hash_repo_root_path`'s doc comment for the same
/// rule) — the builder additionally alias-scrubs it defensively.
///
/// `secret_like` lets the caller mark an item that must be dropped wholesale
/// rather than merely redacted (e.g. a `.env` file the repo scanner flagged):
/// [`budget::select_within_budget`] excludes it with
/// [`budget::ExclusionReason::SecretLike`] before budgeting.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct EvidenceItem {
    pub label: String,
    pub source_ref: String,
    pub content: String,
    #[serde(default)]
    pub secret_like: bool,
}

impl EvidenceItem {
    pub fn new(
        label: impl Into<String>,
        source_ref: impl Into<String>,
        content: impl Into<String>,
    ) -> Self {
        Self {
            label: label.into(),
            source_ref: source_ref.into(),
            content: content.into(),
            secret_like: false,
        }
    }

    pub fn secret(mut self) -> Self {
        self.secret_like = true;
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn route_class_round_trips_through_db_strings() {
        for route in [
            RouteClass::Local,
            RouteClass::QuickCloud,
            RouteClass::DeepCloud,
            RouteClass::TeamPolicy,
        ] {
            assert_eq!(RouteClass::parse(route.as_str()), Some(route));
        }
        assert_eq!(RouteClass::parse("nonsense"), None);
    }

    #[test]
    fn only_quick_and_deep_cloud_are_cloud_routes() {
        assert!(RouteClass::QuickCloud.is_cloud());
        assert!(RouteClass::DeepCloud.is_cloud());
        assert!(!RouteClass::Local.is_cloud());
        // team_policy is a governance route, not a transmission route.
        assert!(!RouteClass::TeamPolicy.is_cloud());
    }
}
