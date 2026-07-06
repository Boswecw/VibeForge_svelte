//! Repository-layer functions for `repo_truth_snapshot` and
//! `instruction_drift_finding` (Epic 3).
//!
//! Split into its own sibling file rather than growing `mod.rs`, same
//! precedent as `doctor.rs` for its own table-cluster.
//!
//! `instruction_drift_finding.severity` is the real Postgres `risk_level`
//! enum (`migrations/001_initial_vault_schema.sql`), not a `TEXT CHECK`
//! column — bound via an explicit `::risk_level` cast and read back via
//! `::text AS severity`, exactly like `mission.risk_level` and
//! `security_event.risk_level` already do in `vault/mod.rs`. The Rust
//! struct field stays a plain `String` rather than
//! `crate::authority::risk::RiskLevel` for the same reason documented
//! there: this keeps `vault` decoupled from `authority`'s types, since not
//! every binary that mounts `vault` via `#[path]` also mounts `authority`
//! (compare `bin/vibeforge_vault.rs`, which doesn't, against
//! `bin/vibeforge_authority.rs` and `bin/vibeforge_repo_truth.rs`, which
//! do). Callers convert as needed.
//!
//! No live-Postgres unit tests here, matching `mod.rs`/`doctor.rs`'s
//! existing practice (only `ids.rs`, a pure function file, has tests) —
//! these functions are exercised through the `vibeforge_repo_truth` CLI
//! instead.

use super::ids;
use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;

// --- repo_truth_snapshot ---

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct RepoTruthSnapshot {
    pub snapshot_id: String,
    pub repo_id: String,
    pub head_commit: String,
    pub generated_at: DateTime<Utc>,
    pub language_summary: serde_json::Value,
    pub framework_summary: serde_json::Value,
    pub dependency_summary: serde_json::Value,
    pub test_command_candidates: serde_json::Value,
    pub build_command_candidates: serde_json::Value,
    pub agent_instruction_files: serde_json::Value,
    pub snapshot_hash: String,
}

#[allow(clippy::too_many_arguments)]
pub async fn create_repo_truth_snapshot(
    pool: &PgPool,
    repo_id: &str,
    head_commit: &str,
    language_summary: serde_json::Value,
    framework_summary: serde_json::Value,
    dependency_summary: serde_json::Value,
    test_command_candidates: serde_json::Value,
    build_command_candidates: serde_json::Value,
    agent_instruction_files: serde_json::Value,
    snapshot_hash: &str,
) -> Result<RepoTruthSnapshot, sqlx::Error> {
    let snapshot_id = ids::new_id(ids::prefix::REPO_TRUTH_SNAPSHOT);
    sqlx::query_as::<_, RepoTruthSnapshot>(
        "INSERT INTO repo_truth_snapshot (snapshot_id, repo_id, head_commit, language_summary, framework_summary, \
         dependency_summary, test_command_candidates, build_command_candidates, agent_instruction_files, snapshot_hash) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) \
         RETURNING snapshot_id, repo_id, head_commit, generated_at, language_summary, framework_summary, \
                   dependency_summary, test_command_candidates, build_command_candidates, agent_instruction_files, \
                   snapshot_hash",
    )
    .bind(&snapshot_id)
    .bind(repo_id)
    .bind(head_commit)
    .bind(language_summary)
    .bind(framework_summary)
    .bind(dependency_summary)
    .bind(test_command_candidates)
    .bind(build_command_candidates)
    .bind(agent_instruction_files)
    .bind(snapshot_hash)
    .fetch_one(pool)
    .await
}

/// The dedup lookup the CLI must call BEFORE inserting a new snapshot,
/// never relying on catching a `UNIQUE(repo_id, head_commit,
/// snapshot_hash)` violation as control flow.
pub async fn find_repo_truth_snapshot_by_hash(
    pool: &PgPool,
    repo_id: &str,
    head_commit: &str,
    snapshot_hash: &str,
) -> Result<Option<RepoTruthSnapshot>, sqlx::Error> {
    sqlx::query_as::<_, RepoTruthSnapshot>(
        "SELECT snapshot_id, repo_id, head_commit, generated_at, language_summary, framework_summary, \
                dependency_summary, test_command_candidates, build_command_candidates, agent_instruction_files, \
                snapshot_hash \
         FROM repo_truth_snapshot WHERE repo_id = $1 AND head_commit = $2 AND snapshot_hash = $3",
    )
    .bind(repo_id)
    .bind(head_commit)
    .bind(snapshot_hash)
    .fetch_optional(pool)
    .await
}

pub async fn get_repo_truth_snapshot(
    pool: &PgPool,
    snapshot_id: &str,
) -> Result<Option<RepoTruthSnapshot>, sqlx::Error> {
    sqlx::query_as::<_, RepoTruthSnapshot>(
        "SELECT snapshot_id, repo_id, head_commit, generated_at, language_summary, framework_summary, \
                dependency_summary, test_command_candidates, build_command_candidates, agent_instruction_files, \
                snapshot_hash \
         FROM repo_truth_snapshot WHERE snapshot_id = $1",
    )
    .bind(snapshot_id)
    .fetch_optional(pool)
    .await
}

pub async fn get_latest_repo_truth_snapshot_for_repo(
    pool: &PgPool,
    repo_id: &str,
) -> Result<Option<RepoTruthSnapshot>, sqlx::Error> {
    sqlx::query_as::<_, RepoTruthSnapshot>(
        "SELECT snapshot_id, repo_id, head_commit, generated_at, language_summary, framework_summary, \
                dependency_summary, test_command_candidates, build_command_candidates, agent_instruction_files, \
                snapshot_hash \
         FROM repo_truth_snapshot WHERE repo_id = $1 ORDER BY generated_at DESC LIMIT 1",
    )
    .bind(repo_id)
    .fetch_optional(pool)
    .await
}

// --- instruction_drift_finding ---

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct InstructionDriftFinding {
    pub finding_id: String,
    pub snapshot_id: String,
    pub file_path: String,
    pub drift_type: String,
    pub severity: String,
    pub finding_summary: String,
    pub evidence_refs: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

/// `severity` is bound via an explicit `::risk_level` cast — callers pass
/// one of `"low"`/`"medium"`/`"high"`/`"critical"` as a plain string;
/// Postgres rejects anything else at the database level. `drift.rs`'s
/// detectors only ever produce `"high"`/`"medium"` in practice, but this
/// function itself doesn't narrow the type further than the DB already
/// does.
pub async fn insert_instruction_drift_finding(
    pool: &PgPool,
    snapshot_id: &str,
    file_path: &str,
    drift_type: &str,
    severity: &str,
    finding_summary: &str,
    evidence_refs: serde_json::Value,
) -> Result<InstructionDriftFinding, sqlx::Error> {
    let finding_id = ids::new_id(ids::prefix::INSTRUCTION_DRIFT_FINDING);
    sqlx::query_as::<_, InstructionDriftFinding>(
        "INSERT INTO instruction_drift_finding (finding_id, snapshot_id, file_path, drift_type, severity, \
         finding_summary, evidence_refs) \
         VALUES ($1, $2, $3, $4, $5::risk_level, $6, $7) \
         RETURNING finding_id, snapshot_id, file_path, drift_type, severity::text AS severity, finding_summary, \
                   evidence_refs, created_at",
    )
    .bind(&finding_id)
    .bind(snapshot_id)
    .bind(file_path)
    .bind(drift_type)
    .bind(severity)
    .bind(finding_summary)
    .bind(evidence_refs)
    .fetch_one(pool)
    .await
}

pub async fn list_drift_findings_for_snapshot(
    pool: &PgPool,
    snapshot_id: &str,
) -> Result<Vec<InstructionDriftFinding>, sqlx::Error> {
    sqlx::query_as::<_, InstructionDriftFinding>(
        "SELECT finding_id, snapshot_id, file_path, drift_type, severity::text AS severity, finding_summary, \
                evidence_refs, created_at \
         FROM instruction_drift_finding WHERE snapshot_id = $1 ORDER BY created_at ASC",
    )
    .bind(snapshot_id)
    .fetch_all(pool)
    .await
}
