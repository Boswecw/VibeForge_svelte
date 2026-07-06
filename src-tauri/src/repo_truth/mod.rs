//! Repo Truth and Instruction Drift (Epic 3): scans a target repository to
//! build a `RepoTruthSnapshot` (detected languages/frameworks/dependencies,
//! candidate test/build commands, and instruction-file locations + content
//! hashes) and detects "instruction drift" between what agent instruction
//! files (AGENTS.md/CLAUDE.md/CODEX.md/GEMINI.md/etc) claim and what the
//! scanner actually found on disk.
//!
//! Nothing in this module depends on `crate::vault` — this is a pure
//! filesystem-in/structured-data-out module. Only `walk.rs` and
//! `safe_read.rs` depend on `crate::authority::path_guard` and
//! `crate::authority::forbidden_patterns` for read-safety (directory
//! pruning and symlink-escape rejection), so any binary that mounts
//! `repo_truth` via `#[path]` must also mount `authority`.
//!
//! No database access anywhere in this tree — see `scan.rs`'s own doc
//! comment. Persistence is the vault repository layer's job
//! (`vault::repo_truth`), and orchestration across the two lives in the
//! `vibeforge_repo_truth` CLI binary.

pub mod commands;
pub mod drift;
pub mod instructions;
pub mod languages;
pub mod manifests;
pub mod safe_read;
pub mod scan;
pub mod snapshot;
pub mod walk;
