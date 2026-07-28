//! Fixture-driven end-to-end tests for the two Epic 4 exit-gate properties
//! (`docs/plans/08_IMPLEMENTATION_MILESTONES.md` M4,
//! `10_CONTRACTOR_HANDOFF.md` Epic 4):
//!
//! - "a cloud payload cannot execute without a preview" (and, transitively,
//!   without approval and a passing forbidden-field scan), and
//! - "secret-like fixtures are excluded" (whole secret files dropped, inline
//!   secrets redacted, private paths aliased).
//!
//! These drive the same JSON evidence fixtures the `vibeforge_context
//! build-pack --evidence-file` CLI path consumes (`fixtures/context_control/`),
//! so the fixtures double as living documentation of the evidence-item shape.
//! Everything here is pure (no database) — persistence is exercised through
//! the CLI.

#![cfg(test)]

use super::cloud_preview::{authorize_cloud_execution, build_cloud_preview, CloudGateError};
use super::manifest::{build_context_pack, ContextPackInput};
use super::{EvidenceItem, RouteClass};

const CLEAN: &str = include_str!("../../fixtures/context_control/evidence.clean.json");
const WITH_SECRET: &str = include_str!("../../fixtures/context_control/evidence.with_secret.json");

fn parse(json: &str) -> Vec<EvidenceItem> {
    serde_json::from_str(json).expect("fixture must be a valid JSON array of evidence items")
}

fn cloud_input(evidence: Vec<EvidenceItem>) -> ContextPackInput {
    ContextPackInput {
        context_type: "mission_context".to_string(),
        route_class: RouteClass::DeepCloud,
        token_budget: 20_000,
        cloud_allowed: true,
        evidence,
    }
}

#[test]
fn clean_fixture_builds_with_no_exclusions_or_redactions() {
    let pack = build_context_pack(cloud_input(parse(CLEAN)));
    assert_eq!(pack.included_summary.len(), 2);
    assert!(pack.excluded_summary.is_empty());
    assert!(pack.redaction_summary.is_empty());
}

#[test]
fn clean_fixture_cloud_gate_blocks_until_approved() {
    let pack = build_context_pack(cloud_input(parse(CLEAN)));
    let mut preview = build_cloud_preview(&pack, "DeepArchitectureReview").unwrap();
    assert!(preview.forbidden_field_scan_passed);

    // No preview at all -> blocked (the headline property).
    assert_eq!(authorize_cloud_execution(None), Err(CloudGateError::NoPreview));
    // Built but unapproved -> still blocked.
    assert_eq!(
        authorize_cloud_execution(Some(&preview)),
        Err(CloudGateError::NotApproved)
    );
    // Approved -> authorized.
    preview.approve("dec_01JCLEANFIXTURE");
    assert!(authorize_cloud_execution(Some(&preview)).is_ok());
}

#[test]
fn secret_fixture_excludes_whole_secret_file_and_scrubs_the_rest() {
    let pack = build_context_pack(cloud_input(parse(WITH_SECRET)));

    // The whole-file .env (secret_like) is excluded, not merely redacted.
    assert!(
        pack.excluded_summary.iter().any(|s| s.contains("secret-like")),
        "expected the .env item to be excluded as secret-like: {:?}",
        pack.excluded_summary
    );

    // Inline secrets + PII in the config file were redacted.
    assert!(!pack.redaction_summary.is_empty());

    // The private absolute path (both as source_ref and inside content) was
    // aliased — no host path survives anywhere the vault would persist.
    assert!(pack.source_refs.iter().any(|r| r.starts_with("path_")));
    let leaked = pack
        .source_refs
        .iter()
        .chain(pack.included_summary.iter())
        .chain(pack.redacted_evidence.iter().map(|e| &e.redacted_content))
        .any(|s| s.contains("/home/charlie"));
    assert!(!leaked, "a private absolute path leaked into the pack");
}

#[test]
fn secret_fixture_payload_passes_forbidden_scan_then_gate_blocks_until_approved() {
    let pack = build_context_pack(cloud_input(parse(WITH_SECRET)));
    let mut preview = build_cloud_preview(&pack, "DeepArchitectureReview").unwrap();

    // Because the builder scrubbed everything, the resulting cloud payload
    // carries no forbidden content and the scan passes...
    assert!(
        preview.forbidden_field_scan_passed,
        "scan should pass on a scrubbed pack; findings: {:?}",
        preview.forbidden_field_findings
    );

    // ...but transmission is still blocked until a developer approves.
    assert_eq!(
        authorize_cloud_execution(Some(&preview)),
        Err(CloudGateError::NotApproved)
    );
    preview.approve("dec_01JSECRETFIXTURE");
    assert!(authorize_cloud_execution(Some(&preview)).is_ok());
}
