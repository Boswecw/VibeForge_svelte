//! The context pack manifest and its content-addressed hash — the heart of
//! doc 06 "Algorithm 2" (steps 3–6) and the object the vault's `context_pack`
//! row is a projection of.
//!
//! [`build_context_pack`] takes a mission's route class, token budget, and a
//! caller-prioritized list of [`EvidenceItem`]s and produces a
//! [`ContextPack`]:
//!
//! 1. budget + secret-drop (`budget::select_within_budget`),
//! 2. per-item redaction (`redaction::redact`),
//! 3. private-path aliasing (`path_alias`),
//! 4. summaries (included / excluded / redaction),
//! 5. a `context_pack_hash` over the canonicalized manifest.
//!
//! The hash uses the SAME hand-rolled canonical-JSON + SHA-256 discipline as
//! `repo_truth::snapshot` (see that file's doc comment for why we don't lean
//! on `serde_json::Map`'s incidental key ordering). It is a pure function of
//! the *manifest* — the redacted content references and summaries — never of
//! wall-clock time or IDs, so the same evidence assembled twice hashes
//! identically and a `board_review`/`patch_receipt` that later cites a
//! `context_pack_hash` cites something reproducible.
//!
//! What is and isn't persisted: the vault stores the summaries, the source
//! refs, and the hash (the `context_pack` columns). It does NOT store raw
//! redacted content — that stays in memory ([`ContextPack::redacted_evidence`])
//! for the cloud-preview / workcell steps that consume it, exactly the way
//! `repo_truth` keeps scanned file text out of the vault and stores only
//! summaries + a hash.

#![forbid(unsafe_code)]

use super::budget::{self, ExclusionReason};
use super::path_alias::{self, AliasMap};
use super::redaction::{self, RedactionCounts};
use super::{EvidenceItem, RouteClass};
use sha2::{Digest, Sha256};

pub const CONTEXT_PACK_SCHEMA_VERSION: &str = "vibeforge.context_pack.v1";

/// One included evidence item after redaction + path aliasing. Kept in
/// memory only (never a vault column) — the input to a cloud payload or a
/// local workcell.
#[derive(Debug, Clone, serde::Serialize)]
pub struct RedactedEvidence {
    pub label: String,
    pub source_ref: String,
    pub redacted_content: String,
}

/// What the caller asks the builder to assemble.
#[derive(Debug, Clone)]
pub struct ContextPackInput {
    pub context_type: String,
    pub route_class: RouteClass,
    /// Mirrors `context_pack.token_budget INTEGER`. Negative is clamped to 0.
    pub token_budget: i32,
    /// Whether cloud escalation is permitted for this mission at all (policy
    /// gate). Even when `true`, a cloud route still requires an approved
    /// cloud payload preview before anything transmits — see
    /// `cloud_preview`. Defaults `false` at every call site.
    pub cloud_allowed: bool,
    pub evidence: Vec<EvidenceItem>,
}

/// The assembled pack. The first block of fields maps 1:1 onto `context_pack`
/// columns; `redacted_evidence` is in-memory-only.
#[derive(Debug, Clone, serde::Serialize)]
pub struct ContextPack {
    pub schema_version: String,
    pub context_type: String,
    pub route_class: String,
    pub token_budget: i32,
    pub cloud_allowed: bool,
    pub included_summary: Vec<String>,
    pub excluded_summary: Vec<String>,
    pub redaction_summary: Vec<String>,
    pub source_refs: Vec<String>,
    pub context_pack_hash: String,
    #[serde(skip)]
    pub redacted_evidence: Vec<RedactedEvidence>,
}

impl ContextPack {
    pub fn route_class(&self) -> Option<RouteClass> {
        RouteClass::parse(&self.route_class)
    }

    /// Assemble the redacted-content-carrying JSON that a cloud job would
    /// transmit, for `forbidden_fields::scan_cloud_payload` to vet. Uses only
    /// already-redacted, already-aliased material — a correctly built pack
    /// produces a payload that passes the scan.
    pub fn to_cloud_payload_json(&self, job_type: &str) -> serde_json::Value {
        serde_json::json!({
            "schema_version": self.schema_version,
            "job_type": job_type,
            "route_class": self.route_class,
            "context_pack_hash": self.context_pack_hash,
            "included_summary": self.included_summary,
            "redaction_summary": self.redaction_summary,
            "content": self
                .redacted_evidence
                .iter()
                .map(|e| e.redacted_content.clone())
                .collect::<Vec<_>>(),
        })
    }
}

/// Build a context pack per doc 06 Algorithm 2. Pure and deterministic.
pub fn build_context_pack(input: ContextPackInput) -> ContextPack {
    let token_budget = input.token_budget.max(0);
    let budget_usize = usize::try_from(token_budget).unwrap_or(0);

    let selection = budget::select_within_budget(input.evidence, budget_usize);

    let mut aliases = AliasMap::new();
    let mut counts = RedactionCounts::default();
    let mut included_summary = Vec::new();
    let mut source_refs = Vec::new();
    let mut redacted_evidence = Vec::new();

    for item in &selection.included {
        let redaction::RedactionOutcome {
            redacted_text,
            counts: item_counts,
        } = redaction::redact(&item.content);

        // Alias any private absolute path that survived into the redacted
        // text, and alias the source_ref itself if it's an absolute path.
        let aliased_text = path_alias::alias_paths_in_text(&redacted_text, &mut aliases);
        let aliased_ref = path_alias::alias_source_ref(&item.source_ref, &mut aliases);

        counts.token += item_counts.token;
        counts.key += item_counts.key;
        counts.credential += item_counts.credential;
        counts.personal_data += item_counts.personal_data;

        included_summary.push(format!("{} ({aliased_ref})", item.label));
        source_refs.push(aliased_ref.clone());
        redacted_evidence.push(RedactedEvidence {
            label: item.label.clone(),
            source_ref: aliased_ref,
            redacted_content: aliased_text,
        });
    }

    let excluded_summary = selection
        .excluded
        .iter()
        .map(|ex| {
            let reason = match ex.reason {
                ExclusionReason::SecretLike => "secret-like",
                ExclusionReason::BudgetExceeded => "token budget exceeded",
            };
            format!("{}: {reason}", ex.item.label)
        })
        .collect::<Vec<_>>();

    let mut redaction_summary = redaction::summarize(&counts);
    if !aliases.is_empty() {
        redaction_summary.push(format!(
            "{} private path(s) replaced with stable aliases",
            aliases.len()
        ));
    }

    let context_pack_hash = compute_context_pack_hash(
        &input.context_type,
        input.route_class,
        token_budget,
        input.cloud_allowed,
        &included_summary,
        &excluded_summary,
        &redaction_summary,
        &source_refs,
    );

    ContextPack {
        schema_version: CONTEXT_PACK_SCHEMA_VERSION.to_string(),
        context_type: input.context_type,
        route_class: input.route_class.as_str().to_string(),
        token_budget,
        cloud_allowed: input.cloud_allowed,
        included_summary,
        excluded_summary,
        redaction_summary,
        source_refs,
        context_pack_hash,
        redacted_evidence,
    }
}

#[allow(clippy::too_many_arguments)]
fn compute_context_pack_hash(
    context_type: &str,
    route_class: RouteClass,
    token_budget: i32,
    cloud_allowed: bool,
    included_summary: &[String],
    excluded_summary: &[String],
    redaction_summary: &[String],
    source_refs: &[String],
) -> String {
    let manifest = serde_json::json!({
        "context_type": context_type,
        "route_class": route_class.as_str(),
        "token_budget": token_budget,
        "cloud_allowed": cloud_allowed,
        "included_summary": included_summary,
        "excluded_summary": excluded_summary,
        "redaction_summary": redaction_summary,
        "source_refs": source_refs,
    });

    let input = format!(
        "{CONTEXT_PACK_SCHEMA_VERSION}|{}",
        canonical_string(&manifest)
    );
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    format!("sha256:{}", hex_encode(hasher.finalize().as_slice()))
}

/// Recursive canonical JSON: object keys sorted lexicographically, array
/// order preserved, scalars via `serde_json`'s own `Display`. Identical
/// discipline to `repo_truth::snapshot::canonical_string` — duplicated
/// deliberately rather than shared, so `context_control` stays independent of
/// `repo_truth` (neither module mounts the other).
fn canonical_string(value: &serde_json::Value) -> String {
    match value {
        serde_json::Value::Object(map) => {
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort();
            let mut out = String::from("{");
            for (i, key) in keys.iter().enumerate() {
                if i > 0 {
                    out.push(',');
                }
                out.push_str(&serde_json::Value::String((*key).clone()).to_string());
                out.push(':');
                out.push_str(&canonical_string(&map[*key]));
            }
            out.push('}');
            out
        }
        serde_json::Value::Array(items) => {
            let mut out = String::from("[");
            for (i, item) in items.iter().enumerate() {
                if i > 0 {
                    out.push(',');
                }
                out.push_str(&canonical_string(item));
            }
            out.push(']');
            out
        }
        other => other.to_string(),
    }
}

fn hex_encode(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn input(evidence: Vec<EvidenceItem>, route: RouteClass) -> ContextPackInput {
        ContextPackInput {
            context_type: "mission_context".to_string(),
            route_class: route,
            token_budget: 10_000,
            cloud_allowed: false,
            evidence,
        }
    }

    #[test]
    fn builds_pack_and_redacts_included_content() {
        let evidence = vec![EvidenceItem::new(
            "config",
            "src/config.ts",
            "const apiKey = 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';",
        )];
        let pack = build_context_pack(input(evidence, RouteClass::Local));
        assert_eq!(pack.included_summary.len(), 1);
        assert!(!pack.redaction_summary.is_empty());
        // redacted content carries no live token
        assert!(!pack.redacted_evidence[0].redacted_content.contains("ghp_ABCDEF"));
        assert!(pack.context_pack_hash.starts_with("sha256:"));
    }

    #[test]
    fn secret_like_evidence_is_excluded_and_summarized() {
        let evidence = vec![
            EvidenceItem::new("readme", "README.md", "hello"),
            EvidenceItem::new("env", ".env", "SECRET=1").secret(),
        ];
        let pack = build_context_pack(input(evidence, RouteClass::Local));
        assert_eq!(pack.included_summary.len(), 1);
        assert_eq!(pack.excluded_summary.len(), 1);
        assert!(pack.excluded_summary[0].contains("secret-like"));
        // the excluded secret contributes no source ref
        assert_eq!(pack.source_refs.len(), 1);
    }

    #[test]
    fn private_absolute_source_ref_is_aliased_not_stored_raw() {
        let evidence = vec![EvidenceItem::new(
            "main",
            "/home/charlie/Forge/apps/Vibeforge/src/main.rs",
            "fn main() {}",
        )];
        let pack = build_context_pack(input(evidence, RouteClass::Local));
        assert!(pack.source_refs[0].starts_with("path_"));
        assert!(!pack.source_refs[0].contains("/home/charlie"));
        assert!(pack.redaction_summary.iter().any(|s| s.contains("private path")));
    }

    #[test]
    fn hash_is_stable_across_identical_inputs() {
        let mk = || {
            build_context_pack(input(
                vec![EvidenceItem::new("a", "src/a.ts", "fn a() {}")],
                RouteClass::Local,
            ))
        };
        assert_eq!(mk().context_pack_hash, mk().context_pack_hash);
    }

    #[test]
    fn hash_changes_when_route_class_changes() {
        let evidence = vec![EvidenceItem::new("a", "src/a.ts", "fn a() {}")];
        let local = build_context_pack(input(evidence.clone(), RouteClass::Local));
        let cloud = build_context_pack(input(evidence, RouteClass::DeepCloud));
        assert_ne!(local.context_pack_hash, cloud.context_pack_hash);
    }

    #[test]
    fn cloud_payload_json_of_clean_pack_has_no_forbidden_content() {
        let evidence = vec![EvidenceItem::new("a", "src/a.ts", "fn a() { 1 + 1 }")];
        let pack = build_context_pack(ContextPackInput {
            cloud_allowed: true,
            ..input(evidence, RouteClass::DeepCloud)
        });
        let payload = pack.to_cloud_payload_json("DeepArchitectureReview");
        let scan = super::super::forbidden_fields::scan_cloud_payload(&payload);
        assert!(scan.passed, "offending: {:?}", scan.offending_fields);
    }
}
