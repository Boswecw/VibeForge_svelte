//! The cloud payload preview and its authorization gate — doc 06 "Algorithm
//! 2" step 7 ("If route is cloud, create payload preview, estimate credits,
//! and block execution until approval") and the `CloudPayloadPreview.v1`
//! contract in doc 05.
//!
//! This is the module that carries the M4 exit-gate property:
//!
//! > "cloud route blocked without approved preview"
//! > (`docs/plans/08_IMPLEMENTATION_MILESTONES.md`)
//!
//! [`authorize_cloud_execution`] is the single chokepoint every future cloud
//! caller (the M9 cloud client, the workcell's cloud lane) MUST route
//! through. It **fails closed** on three independent conditions, in
//! order: no preview exists at all, the preview's forbidden-field scan did
//! not pass, or no developer decision has approved it. Only when all three
//! clear does it return `Ok`. There is deliberately no "skip preview" path.
//!
//! A preview is built from an already-assembled [`ContextPack`]
//! ([`build_cloud_preview`]) and starts life `approved_decision_id: None` —
//! unapproved by construction. Approval is a separate, explicit act
//! ([`CloudPayloadPreview::approve`]) that records the `developer_decision`
//! id, mirroring the vault's `cloud_payload_preview.approved_decision_id`
//! column. The preview does not approve itself and building it transmits
//! nothing.

#![forbid(unsafe_code)]

use super::forbidden_fields::{self, ForbiddenFieldScan};
use super::manifest::ContextPack;
use super::{budget, RouteClass};

pub const CLOUD_PAYLOAD_PREVIEW_SCHEMA_VERSION: &str = "vibeforge.cloud_payload_preview.v1";

/// Why a preview could not be built at all (as opposed to being built but
/// unapproved, which is a normal, resumable state, not an error).
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum PreviewBuildError {
    #[error("route_class '{0}' is not a cloud route; no cloud preview is needed or allowed")]
    NotACloudRoute(String),
    #[error("this mission does not permit cloud escalation (context pack cloud_allowed = false)")]
    CloudNotAllowed,
}

/// Why a cloud execution attempt is refused. Every variant is a hard block.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum CloudGateError {
    #[error("no cloud payload preview exists for this job; cloud execution requires a preview")]
    NoPreview,
    #[error("forbidden-field scan did not pass; refusing to transmit ({0} offending field(s))")]
    ForbiddenFieldScanFailed(usize),
    #[error("cloud payload preview has not been approved by a developer decision")]
    NotApproved,
}

impl CloudGateError {
    /// Stable `security_event.event_class` value, so the CLI and future
    /// callers log a blocked cloud attempt against one shared taxonomy.
    pub fn event_class(&self) -> &'static str {
        match self {
            CloudGateError::NoPreview => "cloud_execution_without_preview_blocked",
            CloudGateError::ForbiddenFieldScanFailed(_) => "cloud_forbidden_field_scan_blocked",
            CloudGateError::NotApproved => "cloud_execution_without_approval_blocked",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
pub struct CloudPayloadPreview {
    pub schema_version: String,
    pub job_type: String,
    pub route_class: String,
    pub estimated_credits: i32,
    pub included_summary: Vec<String>,
    pub excluded_summary: Vec<String>,
    pub redaction_summary: Vec<String>,
    pub forbidden_field_scan_passed: bool,
    /// The offending fields when the scan failed — carried so the caller can
    /// log them into a `security_event`. Empty when the scan passed.
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub forbidden_field_findings: Vec<String>,
    /// `None` until a developer decision approves this preview. Mirrors
    /// `cloud_payload_preview.approved_decision_id`.
    pub approved_decision_id: Option<String>,
    /// The exact context pack this preview was built from — binds the
    /// approval to specific, hashed content.
    pub context_pack_hash: String,
}

impl CloudPayloadPreview {
    /// Record developer approval by decision id. Idempotent re-approval with
    /// the same id is fine; this never *un*-approves.
    pub fn approve(&mut self, decision_id: impl Into<String>) {
        self.approved_decision_id = Some(decision_id.into());
    }

    /// The single question the gate asks. Kept as a method too so callers
    /// holding a preview can branch without constructing an `Option`.
    pub fn is_execution_authorized(&self) -> bool {
        authorize_cloud_execution(Some(self)).is_ok()
    }
}

/// Build (but do not approve, and do not transmit) a cloud payload preview
/// for `pack`. Fails only when a preview is categorically inapplicable
/// (non-cloud route, or cloud not permitted for the mission). A pack whose
/// content would fail the forbidden-field scan still yields a preview — with
/// `forbidden_field_scan_passed = false` — so the failure is visible and the
/// gate can block on it, rather than silently refusing to produce anything.
pub fn build_cloud_preview(
    pack: &ContextPack,
    job_type: &str,
) -> Result<CloudPayloadPreview, PreviewBuildError> {
    let route = pack
        .route_class()
        .ok_or_else(|| PreviewBuildError::NotACloudRoute(pack.route_class.clone()))?;

    if !route.is_cloud() {
        return Err(PreviewBuildError::NotACloudRoute(pack.route_class.clone()));
    }
    if !pack.cloud_allowed {
        return Err(PreviewBuildError::CloudNotAllowed);
    }

    let payload = pack.to_cloud_payload_json(job_type);
    let ForbiddenFieldScan {
        passed,
        offending_fields,
        ..
    } = forbidden_fields::scan_cloud_payload(&payload);

    let estimated_credits =
        budget::estimate_credits(route, usize::try_from(pack.token_budget).unwrap_or(0));

    Ok(CloudPayloadPreview {
        schema_version: CLOUD_PAYLOAD_PREVIEW_SCHEMA_VERSION.to_string(),
        job_type: job_type.to_string(),
        route_class: pack.route_class.clone(),
        estimated_credits,
        included_summary: pack.included_summary.clone(),
        excluded_summary: pack.excluded_summary.clone(),
        redaction_summary: pack.redaction_summary.clone(),
        forbidden_field_scan_passed: passed,
        forbidden_field_findings: offending_fields,
        approved_decision_id: None,
        context_pack_hash: pack.context_pack_hash.clone(),
    })
}

/// **The cloud gate.** Fails closed. Returns `Ok(())` only if a preview
/// exists, its forbidden-field scan passed, AND a developer decision has
/// approved it. Everything downstream that would send data to the cloud must
/// call this first.
pub fn authorize_cloud_execution(
    preview: Option<&CloudPayloadPreview>,
) -> Result<(), CloudGateError> {
    let preview = preview.ok_or(CloudGateError::NoPreview)?;
    if !preview.forbidden_field_scan_passed {
        return Err(CloudGateError::ForbiddenFieldScanFailed(
            preview.forbidden_field_findings.len(),
        ));
    }
    if preview.approved_decision_id.is_none() {
        return Err(CloudGateError::NotApproved);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::manifest::{build_context_pack, ContextPackInput};
    use super::super::EvidenceItem;

    fn cloud_pack(evidence: Vec<EvidenceItem>, cloud_allowed: bool) -> ContextPack {
        build_context_pack(ContextPackInput {
            context_type: "mission_context".to_string(),
            route_class: RouteClass::DeepCloud,
            token_budget: 8000,
            cloud_allowed,
            evidence,
        })
    }

    fn clean_evidence() -> Vec<EvidenceItem> {
        vec![EvidenceItem::new("a", "src/a.ts", "fn a() { 1 + 1 }")]
    }

    #[test]
    fn preview_not_built_for_local_route() {
        let pack = build_context_pack(ContextPackInput {
            context_type: "c".to_string(),
            route_class: RouteClass::Local,
            token_budget: 1000,
            cloud_allowed: true,
            evidence: clean_evidence(),
        });
        assert!(matches!(
            build_cloud_preview(&pack, "job"),
            Err(PreviewBuildError::NotACloudRoute(_))
        ));
    }

    #[test]
    fn preview_not_built_when_cloud_not_allowed() {
        let pack = cloud_pack(clean_evidence(), false);
        assert_eq!(
            build_cloud_preview(&pack, "job"),
            Err(PreviewBuildError::CloudNotAllowed)
        );
    }

    #[test]
    fn gate_blocks_when_no_preview_exists() {
        // The core exit-gate property: cloud cannot execute without a preview.
        assert_eq!(
            authorize_cloud_execution(None),
            Err(CloudGateError::NoPreview)
        );
    }

    #[test]
    fn gate_blocks_unapproved_preview_then_allows_after_approval() {
        let pack = cloud_pack(clean_evidence(), true);
        let mut preview = build_cloud_preview(&pack, "DeepArchitectureReview").unwrap();
        assert!(preview.forbidden_field_scan_passed);

        // Unapproved by construction -> blocked.
        assert_eq!(
            authorize_cloud_execution(Some(&preview)),
            Err(CloudGateError::NotApproved)
        );
        assert!(!preview.is_execution_authorized());

        // Explicit developer approval -> authorized.
        preview.approve("dec_01JTESTDECISION");
        assert!(authorize_cloud_execution(Some(&preview)).is_ok());
        assert!(preview.is_execution_authorized());
    }

    #[test]
    fn gate_blocks_even_approved_preview_if_scan_failed() {
        // Construct a preview whose scan failed but that a developer
        // nonetheless "approved" — the scan failure still hard-blocks. The
        // forbidden-field scan is not something an approval can override.
        let mut preview = CloudPayloadPreview {
            schema_version: CLOUD_PAYLOAD_PREVIEW_SCHEMA_VERSION.to_string(),
            job_type: "job".to_string(),
            route_class: "deep_cloud".to_string(),
            estimated_credits: 10,
            included_summary: vec![],
            excluded_summary: vec![],
            redaction_summary: vec![],
            forbidden_field_scan_passed: false,
            forbidden_field_findings: vec!["$.diff".to_string()],
            approved_decision_id: Some("dec_forced".to_string()),
            context_pack_hash: "sha256:abc".to_string(),
        };
        assert!(matches!(
            authorize_cloud_execution(Some(&preview)),
            Err(CloudGateError::ForbiddenFieldScanFailed(1))
        ));
        // Even flipping approval off/on doesn't matter while scan is failed.
        preview.approve("dec_again");
        assert!(matches!(
            authorize_cloud_execution(Some(&preview)),
            Err(CloudGateError::ForbiddenFieldScanFailed(1))
        ));
    }

    #[test]
    fn deep_cloud_credit_estimate_is_recorded() {
        let pack = cloud_pack(clean_evidence(), true);
        let preview = build_cloud_preview(&pack, "job").unwrap();
        // 8000-token budget, deep_cloud: 8*4 + 10 = 42 (see budget::estimate_credits).
        assert_eq!(preview.estimated_credits, 42);
    }

    #[test]
    fn gate_error_event_classes_are_distinct() {
        assert_eq!(CloudGateError::NoPreview.event_class(), "cloud_execution_without_preview_blocked");
        assert_eq!(CloudGateError::NotApproved.event_class(), "cloud_execution_without_approval_blocked");
        assert_eq!(
            CloudGateError::ForbiddenFieldScanFailed(2).event_class(),
            "cloud_forbidden_field_scan_blocked"
        );
    }
}
