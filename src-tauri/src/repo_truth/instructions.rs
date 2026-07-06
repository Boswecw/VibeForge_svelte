//! Agent instruction file discovery.
//!
//! Recognizes AGENTS.md / CLAUDE.md / CODEX.md / GEMINI.md / `.cursorrules`
//! / `.clinerules` / `.windsurfrules` (matched case-insensitively on the
//! leaf filename) and `.github/copilot-instructions.md` (matched by
//! relative-path suffix, since it's nested and its leaf name
//! `copilot-instructions.md` alone isn't distinctive enough).
//!
//! Two separate types exist here for one hard product reason: raw
//! instruction file content must NEVER be persisted to the vault.
//!
//! - `InstructionFileEntry` is what actually gets JSON-serialized into the
//!   persisted `agent_instruction_files` snapshot column — path,
//!   recognized-filename kind, size, a content hash, and a line count.
//!   NO field on this type may hold file body text; `snapshot.rs` only
//!   ever assembles the final snapshot from this projection.
//! - `DetectedInstructionFile` additionally carries `capped_text` — used
//!   ONLY transiently inside `scan.rs`'s own function body to feed
//!   `drift.rs`'s claim extraction, and explicitly dropped before the
//!   persisted snapshot is assembled.

#![forbid(unsafe_code)]

use crate::repo_truth::safe_read;
use crate::repo_truth::walk::WalkedFile;
use std::path::Path;

pub const DEFAULT_MAX_INSTRUCTION_FILES: usize = 50;

const LEAF_RECOGNIZED: &[&str] = &[
    "AGENTS.md",
    "CLAUDE.md",
    "CODEX.md",
    "GEMINI.md",
    ".cursorrules",
    ".clinerules",
    ".windsurfrules",
];

const NESTED_SUFFIX: &str = ".github/copilot-instructions.md";

fn recognize_instruction_filename(repo_relative: &str) -> Option<&'static str> {
    let leaf = repo_relative.rsplit('/').next().unwrap_or(repo_relative);
    if let Some(&name) = LEAF_RECOGNIZED.iter().find(|n| leaf.eq_ignore_ascii_case(n)) {
        return Some(name);
    }

    let lower = repo_relative.to_ascii_lowercase();
    if lower == NESTED_SUFFIX || lower.ends_with(&format!("/{NESTED_SUFFIX}")) {
        return Some(NESTED_SUFFIX);
    }
    None
}

/// The persisted projection. Structurally guaranteed content-free by
/// construction (and by `instruction_file_entry_json_has_no_body_text_field`
/// below, which asserts this against the actual serialized keys rather
/// than just the field list).
#[derive(Debug, Clone, serde::Serialize)]
pub struct InstructionFileEntry {
    pub path: String,
    pub filename_kind: String,
    pub size_bytes: u64,
    pub content_sha256: String,
    /// Computed from the capped text window (see `safe_read`), not
    /// necessarily the full file — acceptable here since instruction
    /// files are expected to be well within `DEFAULT_MAX_PARSE_WINDOW`;
    /// an instruction file large enough to be truncated would report a
    /// partial line count, a known, accepted limitation.
    pub line_count: usize,
}

/// Transient — carries the capped text needed by `drift.rs`'s claim
/// extraction. Never included in the persisted snapshot; `scan.rs` only
/// ever projects `.entry` into `RepoTruthSnapshotData`.
#[derive(Debug, Clone)]
pub struct DetectedInstructionFile {
    pub entry: InstructionFileEntry,
    pub capped_text: String,
}

/// Find and read (via `safe_read::read_capped_text` — the only sanctioned
/// way to open file bytes in this module tree) recognized instruction
/// files among an already-walked file list, capped at
/// `DEFAULT_MAX_INSTRUCTION_FILES`.
pub fn find_instruction_files(repo_root: &Path, files: &[WalkedFile]) -> Vec<DetectedInstructionFile> {
    let mut out = Vec::new();
    for file in files {
        if out.len() >= DEFAULT_MAX_INSTRUCTION_FILES {
            break;
        }
        let Some(kind) = recognize_instruction_filename(&file.repo_relative) else {
            continue;
        };

        match safe_read::read_capped_text(repo_root, &file.repo_relative, safe_read::DEFAULT_MAX_PARSE_WINDOW) {
            Ok(capped) => {
                let entry = InstructionFileEntry {
                    path: file.repo_relative.clone(),
                    filename_kind: kind.to_string(),
                    size_bytes: capped.full_size_bytes,
                    content_sha256: capped.full_sha256.clone(),
                    line_count: capped.text.lines().count(),
                };
                out.push(DetectedInstructionFile {
                    entry,
                    capped_text: capped.text,
                });
            }
            // Unreadable (permission denied, forbidden-pattern rejection,
            // symlink escape, etc) -- skip rather than fail the whole
            // scan; the file just doesn't appear as detected evidence.
            Err(_) => continue,
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::repo_truth::walk;
    use std::fs;
    use tempfile::TempDir;

    fn write_file(root: &std::path::Path, rel: &str, contents: &str) {
        let path = root.join(rel);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).unwrap();
        }
        fs::write(path, contents).unwrap();
    }

    #[test]
    fn all_recognized_filenames_detected_case_insensitively_including_nested_suffix() {
        let root = TempDir::new().unwrap();
        write_file(root.path(), "agents.md", "x");
        write_file(root.path(), "CLAUDE.MD", "x");
        write_file(root.path(), "Codex.md", "x");
        write_file(root.path(), "GEMINI.MD", "x");
        write_file(root.path(), ".CURSORRULES", "x");
        write_file(root.path(), ".ClineRules", "x");
        write_file(root.path(), ".windsurfrules", "x");
        write_file(root.path(), ".github/COPILOT-INSTRUCTIONS.md", "x");
        // Distractor: same leaf name as the nested one, but not nested
        // under .github -- must NOT match, since the nested case is
        // matched by relative-path suffix, not leaf name alone.
        write_file(root.path(), "copilot-instructions.md", "x");

        let walked = walk::walk_repo(root.path(), walk::DEFAULT_MAX_DEPTH, walk::DEFAULT_MAX_FILES);
        let detected = find_instruction_files(root.path(), &walked.files);

        assert_eq!(detected.len(), 8);
        assert!(detected.iter().any(|d| d.entry.path == ".github/COPILOT-INSTRUCTIONS.md"));
        assert!(!detected.iter().any(|d| d.entry.path == "copilot-instructions.md"));
    }

    #[test]
    fn instruction_file_entry_json_has_no_body_text_field() {
        let entry = InstructionFileEntry {
            path: "AGENTS.md".to_string(),
            filename_kind: "AGENTS.md".to_string(),
            size_bytes: 42,
            content_sha256: "sha256:abc123".to_string(),
            line_count: 5,
        };
        let value = serde_json::to_value(&entry).unwrap();
        let obj = value.as_object().unwrap();

        let forbidden_exact_keys = ["content", "text", "body", "raw_text", "capped_text", "file_content"];
        for key in obj.keys() {
            let lower = key.to_ascii_lowercase();
            assert!(
                !forbidden_exact_keys.contains(&lower.as_str()),
                "field `{key}` looks like it could hold file body content"
            );
            assert!(!lower.contains("text"), "field `{key}` looks text-shaped");
            assert!(!lower.contains("body"), "field `{key}` looks body-shaped");
        }
        assert!(obj.contains_key("content_sha256"), "hash field should still be present");
    }

    #[test]
    fn zzz_adversarial_real_walk_order_differs_by_creation_order_on_this_filesystem() {
        // Does NOT manually construct WalkedFile order -- uses two REAL
        // directories where the only difference is the order files were
        // created on disk, then runs the real `walk::walk_repo` +
        // `find_instruction_files` pipeline end to end, to see whether this
        // filesystem's own directory-entry order is itself already
        // creation-order-sensitive (which would make the previous test's
        // finding concretely reachable via ordinary repo operations like
        // "delete and recreate a file", not just a contrived test double).
        let root_a = TempDir::new().unwrap();
        write_file(root_a.path(), "AGENTS.md", "a");
        write_file(root_a.path(), "CLAUDE.md", "b");

        let root_b = TempDir::new().unwrap();
        write_file(root_b.path(), "CLAUDE.md", "b");
        write_file(root_b.path(), "AGENTS.md", "a");

        let walked_a = walk::walk_repo(root_a.path(), walk::DEFAULT_MAX_DEPTH, walk::DEFAULT_MAX_FILES);
        let walked_b = walk::walk_repo(root_b.path(), walk::DEFAULT_MAX_DEPTH, walk::DEFAULT_MAX_FILES);

        let detected_a = find_instruction_files(root_a.path(), &walked_a.files);
        let detected_b = find_instruction_files(root_b.path(), &walked_b.files);

        let paths_a: Vec<&str> = detected_a.iter().map(|d| d.entry.path.as_str()).collect();
        let paths_b: Vec<&str> = detected_b.iter().map(|d| d.entry.path.as_str()).collect();
        eprintln!("real fs walk order a = {paths_a:?}");
        eprintln!("real fs walk order b = {paths_b:?}");
    }

    #[test]
    fn zzz_adversarial_agent_instruction_files_order_follows_walk_order_not_sorted() {
        // Two real instruction files on disk. `find_instruction_files` is
        // fed the SAME two `WalkedFile`s in two different orders (exactly
        // as `walkdir` might yield them on two different filesystems/OSes
        // for identical content) to see whether the returned
        // `Vec<InstructionFileEntry>` -- which flows straight into the
        // hashed `agent_instruction_files` snapshot field -- is order
        // independent the way `languages.rs`/`commands.rs` explicitly are.
        let root = TempDir::new().unwrap();
        write_file(root.path(), "AGENTS.md", "a");
        write_file(root.path(), "CLAUDE.md", "b");

        let agents = WalkedFile {
            repo_relative: "AGENTS.md".to_string(),
            absolute: root.path().join("AGENTS.md"),
            size_bytes: 1,
            is_symlink: false,
        };
        let claude = WalkedFile {
            repo_relative: "CLAUDE.md".to_string(),
            absolute: root.path().join("CLAUDE.md"),
            size_bytes: 1,
            is_symlink: false,
        };

        let order_a = vec![agents.clone(), claude.clone()];
        let order_b = vec![claude, agents];

        let detected_a = find_instruction_files(root.path(), &order_a);
        let detected_b = find_instruction_files(root.path(), &order_b);

        let paths_a: Vec<&str> = detected_a.iter().map(|d| d.entry.path.as_str()).collect();
        let paths_b: Vec<&str> = detected_b.iter().map(|d| d.entry.path.as_str()).collect();

        eprintln!("paths_a = {paths_a:?}");
        eprintln!("paths_b = {paths_b:?}");

        let entries_a: Vec<InstructionFileEntry> = detected_a.into_iter().map(|d| d.entry).collect();
        let entries_b: Vec<InstructionFileEntry> = detected_b.into_iter().map(|d| d.entry).collect();
        let json_a = serde_json::to_string(&entries_a).unwrap();
        let json_b = serde_json::to_string(&entries_b).unwrap();

        eprintln!("json_a = {json_a}");
        eprintln!("json_b = {json_b}");

        assert_eq!(
            json_a, json_b,
            "agent_instruction_files JSON is NOT order-independent: differs when the underlying walk order differs, which breaks snapshot-hash stability across re-scans on filesystems that yield a different (but equally valid) walk order for identical content"
        );
    }

    #[test]
    fn detection_count_is_capped_at_the_max() {
        let root = TempDir::new().unwrap();
        for i in 0..(DEFAULT_MAX_INSTRUCTION_FILES + 10) {
            write_file(root.path(), &format!("dir_{i}/AGENTS.md"), "content");
        }

        let walked = walk::walk_repo(root.path(), walk::DEFAULT_MAX_DEPTH, walk::DEFAULT_MAX_FILES);
        let detected = find_instruction_files(root.path(), &walked.files);

        assert_eq!(detected.len(), DEFAULT_MAX_INSTRUCTION_FILES);
    }
}
