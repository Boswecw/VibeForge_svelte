//! The persisted snapshot shape and its content-addressed hash.
//!
//! `RepoTruthSnapshotData`'s six fields map 1:1 onto
//! `repo_truth_snapshot`'s six JSONB columns (see
//! `migrations/001_initial_vault_schema.sql`): `language_summary`,
//! `framework_summary`, `dependency_summary`, `test_command_candidates`,
//! `build_command_candidates`, `agent_instruction_files`. Deliberately
//! typed as `serde_json::Value` rather than the concrete producer types
//! from `languages.rs`/`commands.rs`/`instructions.rs` — this file only
//! needs to reason about "already-JSON" data; `scan.rs` (which does know
//! those concrete types) is the one place that converts.
//!
//! `canonical_string` is a HAND-ROLLED recursive JSON canonicalizer, not a
//! reliance on `serde_json::Map`'s incidental ordering. As of this
//! writing the `preserve_order` feature is not enabled anywhere in
//! `Cargo.lock` (confirmed via `grep`), which means `serde_json::Map`
//! already happens to iterate in sorted order today — but a future
//! transitive dependency bump could enable that feature without this
//! crate's `Cargo.toml` changing at all, silently reordering iteration.
//! `canonical_string` must not (and does not) depend on that incidental
//! behavior.

#![forbid(unsafe_code)]

use sha2::{Digest, Sha256};
use std::path::Path;

#[derive(Debug, Clone, serde::Serialize)]
pub struct RepoTruthSnapshotData {
    pub language_summary: serde_json::Value,
    pub framework_summary: serde_json::Value,
    pub dependency_summary: serde_json::Value,
    pub test_command_candidates: serde_json::Value,
    pub build_command_candidates: serde_json::Value,
    pub agent_instruction_files: serde_json::Value,
}

/// Recursively canonicalize a `serde_json::Value`: object keys are sorted
/// lexicographically before being emitted; array elements are emitted in
/// their existing order (array-order determinism is a producer contract
/// owned by `languages.rs`/`commands.rs`, not this function's job — see
/// their own "CRITICAL DETERMINISM CONTRACT" doc comments); scalars use
/// `serde_json::Value`'s own `Display` (which is exactly its compact JSON
/// serialization, including string escaping), never hand-rolled escaping.
pub fn canonical_string(value: &serde_json::Value) -> String {
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

/// Fixed-order literal input string, fed through SHA-256. `head_commit`
/// and `generated_at` are deliberately NOT part of this input — the hash
/// is a pure function of scanned CONTENT only, so re-scanning an
/// unchanged repo at the same commit produces an identical hash. This is
/// what makes `repo_truth_snapshot`'s `UNIQUE(repo_id, head_commit,
/// snapshot_hash)` constraint usable as natural dedup in the CLI (`scan`
/// looks up by hash before inserting, rather than catching a unique
/// violation as control flow).
pub fn compute_snapshot_hash(data: &RepoTruthSnapshotData) -> String {
    let input = format!(
        "vibeforge.repo_truth_snapshot.v1|language_summary={}|framework_summary={}|dependency_summary={}|test_command_candidates={}|build_command_candidates={}|agent_instruction_files={}",
        canonical_string(&data.language_summary),
        canonical_string(&data.framework_summary),
        canonical_string(&data.dependency_summary),
        canonical_string(&data.test_command_candidates),
        canonical_string(&data.build_command_candidates),
        canonical_string(&data.agent_instruction_files),
    );

    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    format!("sha256:{}", hex_encode(hasher.finalize().as_slice()))
}

/// Hash of an absolute, already-canonicalized repo root path string.
/// Exposed here (rather than re-implemented in the `vibeforge_repo_truth`
/// CLI binary) so the `repository.repo_root_hash` hashing convention
/// lives in exactly one place. The vault must never store or print the
/// raw absolute path — only this hash plus a human-readable alias.
pub fn hash_repo_root_path(canonical_root: &Path) -> String {
    let mut hasher = Sha256::new();
    hasher.update(canonical_root.to_string_lossy().as_bytes());
    format!("sha256:{}", hex_encode(hasher.finalize().as_slice()))
}

fn hex_encode(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn sample_data() -> RepoTruthSnapshotData {
        RepoTruthSnapshotData {
            language_summary: json!({"languages": [{"language": "rust", "file_count": 3}], "primary_language": "rust"}),
            framework_summary: json!({"frameworks": [{"framework": "tauri", "language": "rust"}]}),
            dependency_summary: json!({"manifests": [{"repo_relative": "Cargo.toml", "dependency_count": 2}]}),
            test_command_candidates: json!([{"command": "cargo test", "source": "Cargo.toml:presence", "confidence": "medium"}]),
            build_command_candidates: json!([{"command": "cargo build", "source": "Cargo.toml:presence", "confidence": "medium"}]),
            agent_instruction_files: json!([{"path": "AGENTS.md", "filename_kind": "AGENTS.md", "size_bytes": 100, "content_sha256": "sha256:abc", "line_count": 10}]),
        }
    }

    #[test]
    fn canonical_string_is_stable_regardless_of_key_insertion_order() {
        let a: serde_json::Value = serde_json::from_str(r#"{"b": 2, "a": 1, "c": {"z": 1, "y": 2}}"#).unwrap();
        let b: serde_json::Value = serde_json::from_str(r#"{"c": {"y": 2, "z": 1}, "a": 1, "b": 2}"#).unwrap();
        assert_eq!(canonical_string(&a), canonical_string(&b));
    }

    #[test]
    fn canonical_string_preserves_array_element_order() {
        let value = json!({"items": [3, 1, 2]});
        assert_eq!(canonical_string(&value), r#"{"items":[3,1,2]}"#);
    }

    #[test]
    fn compute_snapshot_hash_is_stable_across_structurally_identical_values() {
        let a = sample_data();
        let b = sample_data();
        assert_eq!(compute_snapshot_hash(&a), compute_snapshot_hash(&b));
    }

    #[test]
    fn compute_snapshot_hash_starts_with_sha256_prefix() {
        assert!(compute_snapshot_hash(&sample_data()).starts_with("sha256:"));
    }

    #[test]
    fn changing_language_summary_changes_hash() {
        let base = sample_data();
        let mut changed = base.clone();
        changed.language_summary = json!({"languages": [], "primary_language": null});
        assert_ne!(compute_snapshot_hash(&base), compute_snapshot_hash(&changed));
    }

    #[test]
    fn changing_framework_summary_changes_hash() {
        let base = sample_data();
        let mut changed = base.clone();
        changed.framework_summary = json!({"frameworks": []});
        assert_ne!(compute_snapshot_hash(&base), compute_snapshot_hash(&changed));
    }

    #[test]
    fn changing_dependency_summary_changes_hash() {
        let base = sample_data();
        let mut changed = base.clone();
        changed.dependency_summary = json!({"manifests": []});
        assert_ne!(compute_snapshot_hash(&base), compute_snapshot_hash(&changed));
    }

    #[test]
    fn changing_test_command_candidates_changes_hash() {
        let base = sample_data();
        let mut changed = base.clone();
        changed.test_command_candidates = json!([]);
        assert_ne!(compute_snapshot_hash(&base), compute_snapshot_hash(&changed));
    }

    #[test]
    fn changing_build_command_candidates_changes_hash() {
        let base = sample_data();
        let mut changed = base.clone();
        changed.build_command_candidates = json!([]);
        assert_ne!(compute_snapshot_hash(&base), compute_snapshot_hash(&changed));
    }

    #[test]
    fn changing_agent_instruction_files_changes_hash() {
        let base = sample_data();
        let mut changed = base.clone();
        changed.agent_instruction_files = json!([]);
        assert_ne!(compute_snapshot_hash(&base), compute_snapshot_hash(&changed));
    }

    #[test]
    fn hash_repo_root_path_is_deterministic_and_sensitive_to_input() {
        let a = hash_repo_root_path(Path::new("/home/user/repo"));
        let b = hash_repo_root_path(Path::new("/home/user/repo"));
        let c = hash_repo_root_path(Path::new("/home/user/other-repo"));
        assert_eq!(a, b);
        assert_ne!(a, c);
        assert!(a.starts_with("sha256:"));
    }
}
