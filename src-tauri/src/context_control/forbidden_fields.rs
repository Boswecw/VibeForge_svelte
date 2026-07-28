//! The forbidden-field scanner: doc 07 "Safe analytics allowlist" and the
//! `CloudPayloadPreview.v1` / `AnalyticsSafeEvent.v1` contracts in doc 05.
//!
//! Two distinct scans, because the two payload classes have opposite trust
//! postures:
//!
//! - **Analytics events are allowlist-closed.** Cloud DataForge receives ONLY
//!   the fields in [`ANALYTICS_ALLOWED_FIELDS`]. Any key outside that set is
//!   a forbidden field, full stop — [`scan_analytics_event`] rejects on
//!   *unknown keys*, matching doc 07's "allowlist schema + unknown-field
//!   rejection." This is the safer of the two designs (default-deny) and is
//!   what the M9 cloud-analytics gate will build on.
//! - **Cloud job payloads are denylist-open.** An approved cloud job legitimately
//!   carries redacted evidence content, so a strict key allowlist doesn't
//!   fit. Instead [`scan_cloud_payload`] rejects on the presence of forbidden
//!   *content*: any key whose name marks raw source/diff/log/branch/commit
//!   material, any string value that still contains a secret-shaped span
//!   (via `redaction::contains_secret_like`), or any value that still
//!   carries a private absolute path (via `path_alias::looks_like_private_path`
//!   applied span-wise). A pack that has been through the builder should pass
//!   this cleanly; a pack assembled incorrectly fails closed.
//!
//! Both return a structured [`ForbiddenFieldScan`] rather than a bool so the
//! caller can log exactly which fields tripped the gate into a
//! `security_event`.

#![forbid(unsafe_code)]

use super::{path_alias, redaction};
use serde_json::Value;

/// The complete set of keys a `vibeforge.analytics_safe_event.v1` may carry
/// (doc 05 `AnalyticsSafeEvent.v1` + doc 07 "Allowed" list). Anything else is
/// forbidden by construction.
pub const ANALYTICS_ALLOWED_FIELDS: &[&str] = &[
    "schema_version",
    "event_id",
    "account_id",
    "workspace_id",
    "license_tier",
    "app_version",
    "os_family",
    "feature_name",
    "job_type",
    "route_class",
    "provider_family",
    "model_family",
    "credit_cost",
    "duration_ms",
    "success_state",
    "error_category",
    "timestamp",
];

/// Substrings that, appearing in a payload *key name*, mark forbidden raw
/// content per doc 07's "Forbidden" list. Matched case-insensitively against
/// normalized (`_`/`-`/space-stripped) key names.
const FORBIDDEN_KEY_MARKERS: &[&str] = &[
    "sourcecode",
    "source",
    "diff",
    "patchcontent",
    "rawprompt",
    "prompt",
    "rawoutput",
    "modeloutput",
    "terminal",
    "stdout",
    "stderr",
    "testlog",
    "log",
    "filepath",
    "abspath",
    "absolutepath",
    "reponame",
    "branch",
    "commitmessage",
    "commitmsg",
    "secret",
    "envcontent",
    "dotenv",
    "issuetext",
    "prtext",
    "document",
];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ForbiddenFieldScan {
    pub passed: bool,
    /// Dotted paths to offending fields (e.g. `payload.files[0].diff`).
    pub offending_fields: Vec<String>,
    /// Human-readable reasons, parallel to `offending_fields`.
    pub reasons: Vec<String>,
}

impl ForbiddenFieldScan {
    fn pass() -> Self {
        Self {
            passed: true,
            offending_fields: Vec::new(),
            reasons: Vec::new(),
        }
    }

    fn record(&mut self, field: impl Into<String>, reason: impl Into<String>) {
        self.passed = false;
        self.offending_fields.push(field.into());
        self.reasons.push(reason.into());
    }
}

fn normalize_key(key: &str) -> String {
    key.chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .map(|c| c.to_ascii_lowercase())
        .collect()
}

/// Reject an analytics event that carries any key outside
/// [`ANALYTICS_ALLOWED_FIELDS`], or whose string values smuggle secret-shaped
/// content. Default-deny on unknown keys.
pub fn scan_analytics_event(event: &Value) -> ForbiddenFieldScan {
    let mut scan = ForbiddenFieldScan::pass();

    let Some(obj) = event.as_object() else {
        scan.record("$", "analytics event must be a JSON object");
        return scan;
    };

    for (key, value) in obj {
        if !ANALYTICS_ALLOWED_FIELDS.contains(&key.as_str()) {
            scan.record(key.clone(), "field is not on the analytics allowlist");
            continue;
        }
        if let Value::String(s) = value {
            if redaction::contains_secret_like(s) {
                scan.record(key.clone(), "allowlisted field carries secret-like content");
            }
        }
    }

    scan
}

/// Reject a cloud job payload that carries forbidden raw content: a
/// forbidden-marked key name anywhere in the tree, a string value still
/// holding a secret-shaped span, or a string value still holding a private
/// absolute path. Walks the whole JSON tree.
pub fn scan_cloud_payload(payload: &Value) -> ForbiddenFieldScan {
    let mut scan = ForbiddenFieldScan::pass();
    walk(payload, "$", &mut scan);
    scan
}

fn walk(value: &Value, path: &str, scan: &mut ForbiddenFieldScan) {
    match value {
        Value::Object(map) => {
            for (key, child) in map {
                let child_path = format!("{path}.{key}");
                if FORBIDDEN_KEY_MARKERS.contains(&normalize_key(key).as_str()) {
                    scan.record(child_path.clone(), "key name marks forbidden raw content");
                }
                walk(child, &child_path, scan);
            }
        }
        Value::Array(items) => {
            for (i, child) in items.iter().enumerate() {
                walk(child, &format!("{path}[{i}]"), scan);
            }
        }
        Value::String(s) => {
            if redaction::contains_secret_like(s) {
                scan.record(path.to_string(), "value carries un-redacted secret-like content");
            } else if contains_private_path(s) {
                scan.record(path.to_string(), "value carries a private absolute path");
            }
        }
        _ => {}
    }
}

/// Whether any whitespace-delimited span of `s` looks like a private absolute
/// path. (`path_alias::looks_like_private_path` is a whole-string check; a
/// payload value may embed a path inside a longer sentence.)
fn contains_private_path(s: &str) -> bool {
    s.split_whitespace().any(path_alias::looks_like_private_path)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn analytics_event_with_only_allowed_fields_passes() {
        let event = json!({
            "schema_version": "vibeforge.analytics_safe_event.v1",
            "workspace_id": "ws_01J",
            "route_class": "deep_cloud",
            "credit_cost": 34,
            "success_state": "success",
            "error_category": null
        });
        assert!(scan_analytics_event(&event).passed);
    }

    #[test]
    fn analytics_event_with_unknown_field_is_rejected() {
        let event = json!({
            "workspace_id": "ws_01J",
            "branch_name": "feature/secret-project"
        });
        let scan = scan_analytics_event(&event);
        assert!(!scan.passed);
        assert!(scan.offending_fields.contains(&"branch_name".to_string()));
    }

    #[test]
    fn analytics_event_with_secret_in_allowed_field_is_rejected() {
        let event = json!({
            "feature_name": "token is ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        });
        assert!(!scan_analytics_event(&event).passed);
    }

    #[test]
    fn non_object_analytics_event_is_rejected() {
        assert!(!scan_analytics_event(&json!("not an object")).passed);
    }

    #[test]
    fn clean_redacted_cloud_payload_passes() {
        let payload = json!({
            "job_type": "DeepArchitectureReview",
            "route_class": "deep_cloud",
            "included_summary": ["repo architecture summary", "redacted snippets from 4 files"],
            "content": ["fn add(a, b) { a + b }", "context assembled from src/lib"]
        });
        assert!(scan_cloud_payload(&payload).passed);
    }

    #[test]
    fn cloud_payload_with_forbidden_key_is_rejected() {
        let payload = json!({
            "job_type": "review",
            "diff": "--- a/x\n+++ b/x"
        });
        let scan = scan_cloud_payload(&payload);
        assert!(!scan.passed);
        assert!(scan.offending_fields.iter().any(|f| f.ends_with(".diff")));
    }

    #[test]
    fn cloud_payload_with_unredacted_secret_value_is_rejected() {
        let payload = json!({
            "content": ["here is sk-abcdefghijklmnopqrstuvwxyz012345 pasted in"]
        });
        assert!(!scan_cloud_payload(&payload).passed);
    }

    #[test]
    fn cloud_payload_with_private_absolute_path_value_is_rejected() {
        let payload = json!({
            "notes": "assembled from /home/charlie/Forge/apps/Vibeforge/src/main.rs"
        });
        let scan = scan_cloud_payload(&payload);
        assert!(!scan.passed);
        assert!(scan.reasons.iter().any(|r| r.contains("private absolute path")));
    }

    #[test]
    fn nested_forbidden_key_is_found_with_dotted_path() {
        let payload = json!({
            "files": [ { "commit_message": "fix auth bug" } ]
        });
        let scan = scan_cloud_payload(&payload);
        assert!(!scan.passed);
        assert!(scan.offending_fields.iter().any(|f| f.contains("files[0].commit_message")));
    }
}
