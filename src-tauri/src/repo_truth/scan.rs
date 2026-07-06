//! Pure orchestrator: walk -> parse manifests -> build summaries -> derive
//! command candidates -> find instruction files -> extract claimed
//! commands -> detect drift -> assemble the persisted snapshot data ->
//! hash it.
//!
//! NO database access anywhere in this file, or anywhere else in
//! `repo_truth` (see this module tree's `mod.rs` doc comment).
//! Persistence is the vault repository layer's job
//! (`vault::repo_truth`); deciding what to do with `ScanOutput` (dedup
//! against an existing snapshot by hash, insert a new one, persist
//! findings) is the `vibeforge_repo_truth` CLI binary's job.

#![forbid(unsafe_code)]

use crate::repo_truth::{commands, drift, instructions, languages, manifests, snapshot, walk};
use std::path::Path;

#[derive(Debug, Clone, Copy)]
pub struct ScanOptions {
    pub max_depth: usize,
    pub max_files: usize,
}

impl Default for ScanOptions {
    fn default() -> Self {
        ScanOptions {
            max_depth: walk::DEFAULT_MAX_DEPTH,
            max_files: walk::DEFAULT_MAX_FILES,
        }
    }
}

#[derive(Debug, Clone)]
pub struct ScanOutput {
    pub snapshot_data: snapshot::RepoTruthSnapshotData,
    pub snapshot_hash: String,
    pub drift_findings: Vec<drift::DriftFindingData>,
    pub walk_truncated: bool,
}

#[derive(Debug, thiserror::Error)]
pub enum ScanError {
    #[error("repo_root is not a directory: {0}")]
    RepoRootNotDirectory(String),
}

/// Scan `repo_root` (expected to already be an existing, canonicalized
/// directory -- the `vibeforge_repo_truth scan` CLI command owns
/// canonicalizing/validating the user-supplied root before calling this;
/// the directory check here is defense in depth for any other caller).
pub fn scan_repo(repo_root: &Path, options: &ScanOptions) -> Result<ScanOutput, ScanError> {
    if !repo_root.is_dir() {
        return Err(ScanError::RepoRootNotDirectory(repo_root.display().to_string()));
    }

    let walked = walk::walk_repo(repo_root, options.max_depth, options.max_files);
    let manifest_facts = manifests::find_and_parse_manifests(repo_root, &walked.files);

    let language_summary = languages::build_language_summary(&walked.files, &manifest_facts);
    let framework_summary = languages::build_framework_summary(&manifest_facts);
    let dependency_summary = languages::build_dependency_summary(&manifest_facts);

    let test_candidates = commands::test_command_candidates(&manifest_facts);
    let build_candidates = commands::build_command_candidates(&manifest_facts);

    // Transient: `detected_instruction_files` carries `capped_text`, which
    // must never reach the persisted snapshot. Only `.entry` (the
    // `InstructionFileEntry` projection) is used below when assembling
    // `RepoTruthSnapshotData`.
    let detected_instruction_files = instructions::find_instruction_files(repo_root, &walked.files);

    let mut all_claims = Vec::new();
    for detected in &detected_instruction_files {
        all_claims.extend(drift::extract_claimed_commands(&detected.entry.path, &detected.capped_text));
    }

    let mut drift_findings =
        drift::detect_unverifiable_claims(&all_claims, &test_candidates, &build_candidates, &language_summary);
    drift_findings.extend(drift::detect_conflicting_instructions(&all_claims));

    let agent_instruction_files: Vec<instructions::InstructionFileEntry> =
        detected_instruction_files.into_iter().map(|d| d.entry).collect();

    let snapshot_data = snapshot::RepoTruthSnapshotData {
        language_summary: to_json(&language_summary),
        framework_summary: to_json(&framework_summary),
        dependency_summary: to_json(&dependency_summary),
        test_command_candidates: to_json(&test_candidates),
        build_command_candidates: to_json(&build_candidates),
        agent_instruction_files: to_json(&agent_instruction_files),
    };
    let snapshot_hash = snapshot::compute_snapshot_hash(&snapshot_data);

    Ok(ScanOutput {
        snapshot_data,
        snapshot_hash,
        drift_findings,
        walk_truncated: walked.truncated,
    })
}

fn to_json<T: serde::Serialize>(value: &T) -> serde_json::Value {
    serde_json::to_value(value).unwrap_or(serde_json::Value::Null)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn write_file(root: &Path, rel: &str, contents: &str) {
        let path = root.join(rel);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).unwrap();
        }
        fs::write(path, contents).unwrap();
    }

    /// Reusable fixture: a `package.json` with a `"test"` script, plus two
    /// instruction files that both correctly reference it.
    fn write_clean_fixture(root: &Path) {
        write_file(
            root,
            "package.json",
            r#"{ "name": "app", "scripts": { "test": "vitest run" } }"#,
        );
        write_file(root, "AGENTS.md", "Run tests with `npm test`.\n");
        write_file(root, "CLAUDE.md", "Run tests with `npm test`.\n");
    }

    #[test]
    fn rescanning_unchanged_fixture_produces_identical_hash() {
        let root = TempDir::new().unwrap();
        write_clean_fixture(root.path());

        let first = scan_repo(root.path(), &ScanOptions::default()).unwrap();
        let second = scan_repo(root.path(), &ScanOptions::default()).unwrap();

        assert_eq!(first.snapshot_hash, second.snapshot_hash);
    }

    #[test]
    fn hash_changes_when_a_tracked_file_changes() {
        let root = TempDir::new().unwrap();
        write_clean_fixture(root.path());
        let before = scan_repo(root.path(), &ScanOptions::default()).unwrap();

        write_file(
            root.path(),
            "package.json",
            r#"{ "name": "app", "scripts": { "test": "jest" } }"#,
        );
        let after = scan_repo(root.path(), &ScanOptions::default()).unwrap();

        assert_ne!(before.snapshot_hash, after.snapshot_hash);
    }

    #[test]
    fn clean_fixture_produces_no_drift_findings() {
        let root = TempDir::new().unwrap();
        write_clean_fixture(root.path());

        let output = scan_repo(root.path(), &ScanOptions::default()).unwrap();
        assert!(output.drift_findings.is_empty(), "unexpected findings: {:?}", output.drift_findings);
    }

    #[test]
    fn fixture_with_nonexistent_command_produces_drift_finding() {
        let root = TempDir::new().unwrap();
        write_clean_fixture(root.path());
        write_file(root.path(), "AGENTS.md", "Run tests with `pytest`.\n");

        let output = scan_repo(root.path(), &ScanOptions::default()).unwrap();
        assert!(output
            .drift_findings
            .iter()
            .any(|f| f.drift_type == "unverifiable_command_reference"));
    }

    #[test]
    fn fixture_with_two_conflicting_instruction_files_produces_conflict_finding() {
        let root = TempDir::new().unwrap();
        write_clean_fixture(root.path());
        write_file(root.path(), "AGENTS.md", "Run tests with `npm test`.\n");
        write_file(root.path(), "CLAUDE.md", "Run tests with `yarn test`.\n");

        let output = scan_repo(root.path(), &ScanOptions::default()).unwrap();
        assert!(output
            .drift_findings
            .iter()
            .any(|f| f.drift_type == "conflicting_instruction_commands"));
    }

    #[test]
    fn adversarial_manifest_cap_overflow_is_silently_untruncated_in_scan_output() {
        // Monorepo-shaped fixture: more manifests than DEFAULT_MAX_MANIFESTS,
        // but nowhere near DEFAULT_MAX_FILES, so walk_truncated stays false.
        // Does ScanOutput expose ANY signal that manifest discovery itself
        // was capped/incomplete?
        let root = TempDir::new().unwrap();
        for i in 0..(crate::repo_truth::manifests::DEFAULT_MAX_MANIFESTS + 25) {
            write_file(
                root.path(),
                &format!("pkg_{i:04}/Cargo.toml"),
                "[package]\nname = \"x\"\n",
            );
        }
        let output = scan_repo(root.path(), &ScanOptions::default()).unwrap();
        eprintln!("walk_truncated = {}", output.walk_truncated);
        let dep_manifests = output.snapshot_data.dependency_summary["manifests"].as_array().unwrap().len();
        eprintln!(
            "manifests actually present on disk = {}, manifests in snapshot = {}",
            crate::repo_truth::manifests::DEFAULT_MAX_MANIFESTS + 25,
            dep_manifests
        );
        assert!(!output.walk_truncated, "walk itself was not truncated (far under max_files)");
        assert_eq!(dep_manifests, crate::repo_truth::manifests::DEFAULT_MAX_MANIFESTS);
        // There is no field anywhere on ScanOutput/RepoTruthSnapshotData
        // indicating manifest discovery was capped -- confirmed by the
        // struct definitions themselves (walk_truncated is the only
        // truncation-shaped field that exists).
    }

    #[test]
    fn adversarial_instruction_file_cap_overflow_is_silently_untruncated() {
        let root = TempDir::new().unwrap();
        for i in 0..(crate::repo_truth::instructions::DEFAULT_MAX_INSTRUCTION_FILES + 25) {
            write_file(root.path(), &format!("dir_{i:04}/AGENTS.md"), "Run `npm test`.\n");
        }
        let output = scan_repo(root.path(), &ScanOptions::default()).unwrap();
        let count = output.snapshot_data.agent_instruction_files.as_array().unwrap().len();
        eprintln!(
            "instruction files actually present on disk = {}, in snapshot = {}, walk_truncated = {}",
            crate::repo_truth::instructions::DEFAULT_MAX_INSTRUCTION_FILES + 25,
            count,
            output.walk_truncated
        );
        assert!(!output.walk_truncated);
        assert_eq!(count, crate::repo_truth::instructions::DEFAULT_MAX_INSTRUCTION_FILES);
    }

    #[test]
    fn adversarial_manifest_cap_overflow_hash_stability_across_rescans() {
        let root = TempDir::new().unwrap();
        for i in 0..(crate::repo_truth::manifests::DEFAULT_MAX_MANIFESTS + 25) {
            write_file(
                root.path(),
                &format!("pkg_{i:04}/Cargo.toml"),
                "[package]\nname = \"x\"\n",
            );
        }
        let hashes: Vec<String> = (0..5)
            .map(|_| scan_repo(root.path(), &ScanOptions::default()).unwrap().snapshot_hash)
            .collect();
        eprintln!("hashes across 5 rescans: {hashes:?}");
        assert!(hashes.iter().all(|h| h == &hashes[0]), "hash was NOT stable across rescans: {hashes:?}");
    }

    #[test]
    fn large_ignored_directory_is_not_walked_or_hashed() {
        let root = TempDir::new().unwrap();
        write_clean_fixture(root.path());
        for i in 0..25 {
            write_file(
                root.path(),
                &format!("node_modules/big_pkg_{i}/index.js"),
                "MARKER_NODE_MODULES_CONTENT",
            );
            write_file(
                root.path(),
                &format!("node_modules/big_pkg_{i}/package.json"),
                r#"{"name": "big_pkg", "dependencies": {"left-pad": "1.0.0"}}"#,
            );
        }

        let output = scan_repo(root.path(), &ScanOptions::default()).unwrap();

        let dependency_summary_str = output.snapshot_data.dependency_summary.to_string();
        assert!(
            !dependency_summary_str.contains("node_modules"),
            "node_modules manifests must never be discovered: {dependency_summary_str}"
        );

        let language_summary = &output.snapshot_data.language_summary;
        let javascript_count = language_summary["languages"]
            .as_array()
            .unwrap()
            .iter()
            .find(|l| l["language"] == "javascript")
            .and_then(|l| l["file_count"].as_u64())
            .unwrap_or(0);
        assert_eq!(javascript_count, 0, "node_modules .js files must not be counted");
    }

    #[test]
    fn zzz_adversarial_mtime_only_touch_does_not_change_hash() {
        let root = TempDir::new().unwrap();
        write_clean_fixture(root.path());
        let before = scan_repo(root.path(), &ScanOptions::default()).unwrap();

        // Bump mtime far into the future without touching a single byte of
        // content.
        let status = std::process::Command::new("touch")
            .arg("-d")
            .arg("2030-01-01")
            .arg(root.path().join("AGENTS.md"))
            .status()
            .unwrap();
        assert!(status.success());

        let after = scan_repo(root.path(), &ScanOptions::default()).unwrap();
        assert_eq!(before.snapshot_hash, after.snapshot_hash, "mtime-only touch must not change the hash");
    }

    #[test]
    fn zzz_adversarial_package_json_untracked_field_does_not_change_hash() {
        let root = TempDir::new().unwrap();
        write_clean_fixture(root.path());
        let before = scan_repo(root.path(), &ScanOptions::default()).unwrap();

        write_file(
            root.path(),
            "package.json",
            r#"{ "name": "app", "description": "a totally different description now", "scripts": { "test": "vitest run" } }"#,
        );
        let after = scan_repo(root.path(), &ScanOptions::default()).unwrap();
        assert_eq!(before.snapshot_hash, after.snapshot_hash, "untracked package.json field must not change the hash");
    }

    #[test]
    fn zzz_adversarial_cargo_toml_dependency_version_bump_hash_behavior() {
        let root = TempDir::new().unwrap();
        write_file(
            root.path(),
            "Cargo.toml",
            "[package]\nname = \"foo\"\n\n[dependencies]\nserde = \"1.0\"\n",
        );
        let before = scan_repo(root.path(), &ScanOptions::default()).unwrap();

        write_file(
            root.path(),
            "Cargo.toml",
            "[package]\nname = \"foo\"\n\n[dependencies]\nserde = \"9.9.9\"\n",
        );
        let after = scan_repo(root.path(), &ScanOptions::default()).unwrap();

        eprintln!("before dependency_summary = {}", before.snapshot_data.dependency_summary);
        eprintln!("after  dependency_summary = {}", after.snapshot_data.dependency_summary);
        eprintln!("before hash = {}", before.snapshot_hash);
        eprintln!("after  hash = {}", after.snapshot_hash);

        assert_eq!(
            before.snapshot_hash, after.snapshot_hash,
            "OBSERVED: a Cargo.toml dependency VERSION bump (name unchanged) does not change the snapshot hash"
        );
    }

    #[test]
    fn zzz_adversarial_go_mod_dependency_version_bump_hash_behavior() {
        let root = TempDir::new().unwrap();
        write_file(
            root.path(),
            "go.mod",
            "module example.com/foo\n\ngo 1.21\n\nrequire (\n\tgithub.com/foo/bar v1.2.3\n)\n",
        );
        let before = scan_repo(root.path(), &ScanOptions::default()).unwrap();

        write_file(
            root.path(),
            "go.mod",
            "module example.com/foo\n\ngo 1.21\n\nrequire (\n\tgithub.com/foo/bar v9.9.9\n)\n",
        );
        let after = scan_repo(root.path(), &ScanOptions::default()).unwrap();

        eprintln!("before dependency_summary = {}", before.snapshot_data.dependency_summary);
        eprintln!("after  dependency_summary = {}", after.snapshot_data.dependency_summary);

        assert_eq!(
            before.snapshot_hash, after.snapshot_hash,
            "OBSERVED: a go.mod dependency VERSION bump (module path unchanged) does not change the snapshot hash"
        );
    }

    #[test]
    fn zzz_adversarial_pyproject_dependency_version_bump_hash_behavior() {
        let root = TempDir::new().unwrap();
        write_file(
            root.path(),
            "pyproject.toml",
            "[tool.poetry.dependencies]\nrequests = \"2.28.0\"\n",
        );
        let before = scan_repo(root.path(), &ScanOptions::default()).unwrap();

        write_file(
            root.path(),
            "pyproject.toml",
            "[tool.poetry.dependencies]\nrequests = \"99.0.0\"\n",
        );
        let after = scan_repo(root.path(), &ScanOptions::default()).unwrap();

        eprintln!("before dependency_summary = {}", before.snapshot_data.dependency_summary);
        eprintln!("after  dependency_summary = {}", after.snapshot_data.dependency_summary);

        assert_eq!(
            before.snapshot_hash, after.snapshot_hash,
            "OBSERVED: a pyproject.toml dependency VERSION bump (name unchanged) does not change the snapshot hash"
        );
    }
}
