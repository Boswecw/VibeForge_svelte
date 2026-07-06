//! VibeForge Local Evidence Vault: connection pool, migrations, and a minimal
//! repository layer.
//!
//! Deliberately uses sqlx's *runtime* query API (`sqlx::query`, `sqlx::query_as`)
//! everywhere, never the compile-time-checked `query!`/`query_as!` macros —
//! those require a reachable `DATABASE_URL` (or a checked-in `.sqlx` offline
//! cache) at `cargo build` time, which would break builds on any machine
//! without Postgres already running. `#[derive(sqlx::FromRow)]` is still used
//! for typed row mapping; that derive doesn't require compile-time DB access.
//!
//! Only `workspace` and `repository` have repository functions here. Later
//! epics add functions for the tables they actually touch (board review,
//! receipts, etc.) rather than building speculative CRUD for all 19 tables
//! up front.

pub mod doctor;
pub mod ids;
pub mod repo_truth;

use chrono::{DateTime, Utc};
use sqlx::postgres::{PgPool, PgPoolOptions};
use sqlx::Row;
use std::time::Duration;

pub const DEFAULT_DATABASE_URL: &str = "postgres://forge:forge@localhost:5434/vibeforge";

/// Every table the vault schema defines, in the order they appear in
/// `migrations/001_initial_vault_schema.sql`. Used by `status` (row counts)
/// and `doctor` (table-existence check).
pub const VAULT_TABLES: &[&str] = &[
    "workspace",
    "repository",
    "repo_truth_snapshot",
    "instruction_drift_finding",
    "mission",
    "mission_event",
    "workcell_run",
    "agent_run",
    "tool_call",
    "security_event",
    "context_pack",
    "cloud_payload_preview",
    "validation_run",
    "patch_candidate",
    "board_review",
    "recommendation_card",
    "developer_decision",
    "patch_receipt",
];

pub fn database_url() -> String {
    std::env::var("DATABASE_URL").unwrap_or_else(|_| DEFAULT_DATABASE_URL.to_string())
}

pub async fn create_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(20)
        .acquire_timeout(Duration::from_secs(5))
        .connect(database_url)
        .await
}

pub async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::migrate::MigrateError> {
    sqlx::migrate!("./migrations").run(pool).await
}

// --- workspace ---

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct Workspace {
    pub workspace_id: String,
    pub display_name: String,
    pub vault_schema_version: String,
    pub privacy_mode: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn create_workspace(
    pool: &PgPool,
    display_name: &str,
    vault_schema_version: &str,
    privacy_mode: &str,
) -> Result<Workspace, sqlx::Error> {
    let workspace_id = ids::new_id(ids::prefix::WORKSPACE);
    sqlx::query_as::<_, Workspace>(
        "INSERT INTO workspace (workspace_id, display_name, vault_schema_version, privacy_mode) \
         VALUES ($1, $2, $3, $4) \
         RETURNING workspace_id, display_name, vault_schema_version, privacy_mode, created_at, updated_at",
    )
    .bind(&workspace_id)
    .bind(display_name)
    .bind(vault_schema_version)
    .bind(privacy_mode)
    .fetch_one(pool)
    .await
}

pub async fn get_workspace(
    pool: &PgPool,
    workspace_id: &str,
) -> Result<Option<Workspace>, sqlx::Error> {
    sqlx::query_as::<_, Workspace>(
        "SELECT workspace_id, display_name, vault_schema_version, privacy_mode, created_at, updated_at \
         FROM workspace WHERE workspace_id = $1",
    )
    .bind(workspace_id)
    .fetch_optional(pool)
    .await
}

/// Epic 3's `vibeforge_repo_truth scan` CLI find-or-creates a workspace by
/// `--workspace-alias` (falling back to `create_workspace` when this
/// returns `None`) rather than requiring an explicit `--workspace-id` on
/// every run.
pub async fn get_workspace_by_display_name(
    pool: &PgPool,
    display_name: &str,
) -> Result<Option<Workspace>, sqlx::Error> {
    sqlx::query_as::<_, Workspace>(
        "SELECT workspace_id, display_name, vault_schema_version, privacy_mode, created_at, updated_at \
         FROM workspace WHERE display_name = $1",
    )
    .bind(display_name)
    .fetch_optional(pool)
    .await
}

// --- repository ---

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct Repository {
    pub repo_id: String,
    pub workspace_id: String,
    pub repo_root_hash: String,
    pub vcs_type: String,
    pub default_branch_hash: Option<String>,
    pub current_head: Option<String>,
    pub repo_alias: String,
    pub is_private: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn create_repository(
    pool: &PgPool,
    workspace_id: &str,
    repo_root_hash: &str,
    repo_alias: &str,
) -> Result<Repository, sqlx::Error> {
    let repo_id = ids::new_id(ids::prefix::REPOSITORY);
    sqlx::query_as::<_, Repository>(
        "INSERT INTO repository (repo_id, workspace_id, repo_root_hash, vcs_type, repo_alias) \
         VALUES ($1, $2, $3, 'git', $4) \
         RETURNING repo_id, workspace_id, repo_root_hash, vcs_type, default_branch_hash, current_head, \
                   repo_alias, is_private, created_at, updated_at",
    )
    .bind(&repo_id)
    .bind(workspace_id)
    .bind(repo_root_hash)
    .bind(repo_alias)
    .fetch_one(pool)
    .await
}

pub async fn get_repository(pool: &PgPool, repo_id: &str) -> Result<Option<Repository>, sqlx::Error> {
    sqlx::query_as::<_, Repository>(
        "SELECT repo_id, workspace_id, repo_root_hash, vcs_type, default_branch_hash, current_head, \
                repo_alias, is_private, created_at, updated_at \
         FROM repository WHERE repo_id = $1",
    )
    .bind(repo_id)
    .fetch_optional(pool)
    .await
}

/// The dedup lookup `vibeforge_repo_truth scan` calls before
/// `create_repository` — `repo_root_hash` (never the raw absolute path,
/// see `repo_truth::snapshot::hash_repo_root_path`) is unique per
/// workspace (`UNIQUE(workspace_id, repo_root_hash)` in the schema), so a
/// rescan of the same on-disk root under the same workspace finds the
/// existing row instead of creating a duplicate.
pub async fn get_repository_by_workspace_and_root_hash(
    pool: &PgPool,
    workspace_id: &str,
    repo_root_hash: &str,
) -> Result<Option<Repository>, sqlx::Error> {
    sqlx::query_as::<_, Repository>(
        "SELECT repo_id, workspace_id, repo_root_hash, vcs_type, default_branch_hash, current_head, \
                repo_alias, is_private, created_at, updated_at \
         FROM repository WHERE workspace_id = $1 AND repo_root_hash = $2",
    )
    .bind(workspace_id)
    .bind(repo_root_hash)
    .fetch_optional(pool)
    .await
}

/// Called by `vibeforge_repo_truth scan` after resolving `head_commit`
/// (either `--head-commit` or `git rev-parse HEAD`), so `repository`
/// always reflects the commit the most recent scan actually ran against.
pub async fn set_repository_current_head(
    pool: &PgPool,
    repo_id: &str,
    current_head: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE repository SET current_head = $2, updated_at = now() WHERE repo_id = $1")
        .bind(repo_id)
        .bind(current_head)
        .execute(pool)
        .await?;
    Ok(())
}

// --- mission ---
//
// `mission.state` (and `mission_event.previous_state`/`next_state`) are the
// real Postgres `mission_state` enum (17 variants), not a `TEXT CHECK`
// column like `autonomy_tier`. Epic 2 only ever needs to create a mission
// (defaults to `'drafted'` per the schema) and transition it to
// `'cancelled'` via the kill switch — owning the other 15 transitions
// belongs to whichever later epic actually drives the full state machine.
// Deliberately modeled as a plain `String` here rather than a full Rust
// enum, bound via an explicit `::mission_state` SQL cast and read back via
// `::text` — this also keeps this module free of any dependency on
// `crate::authority` (which isn't mounted in every binary that mounts
// `vault` via `#[path]`; see `bin/vibeforge_vault.rs` vs
// `bin/vibeforge_authority.rs`). `risk_level` is handled the same way for
// the same reason, even though `authority::risk::RiskLevel` exists — vault
// stays decoupled from authority's types; callers convert as needed.

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct Mission {
    pub mission_id: String,
    pub repo_id: String,
    pub title: String,
    pub request_summary: String,
    pub requested_by: String,
    pub risk_level: String,
    pub state: String,
    pub autonomy_tier: String,
    pub source_commit: String,
    pub active_context_pack_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn create_mission(
    pool: &PgPool,
    repo_id: &str,
    title: &str,
    request_summary: &str,
    risk_level: &str,
    autonomy_tier: &str,
    source_commit: &str,
) -> Result<Mission, sqlx::Error> {
    let mission_id = ids::new_id(ids::prefix::MISSION);
    sqlx::query_as::<_, Mission>(
        "INSERT INTO mission (mission_id, repo_id, title, request_summary, risk_level, autonomy_tier, source_commit) \
         VALUES ($1, $2, $3, $4, $5::risk_level, $6, $7) \
         RETURNING mission_id, repo_id, title, request_summary, requested_by, risk_level::text AS risk_level, \
                   state::text AS state, autonomy_tier, source_commit, active_context_pack_id, created_at, updated_at",
    )
    .bind(&mission_id)
    .bind(repo_id)
    .bind(title)
    .bind(request_summary)
    .bind(risk_level)
    .bind(autonomy_tier)
    .bind(source_commit)
    .fetch_one(pool)
    .await
}

pub async fn get_mission(pool: &PgPool, mission_id: &str) -> Result<Option<Mission>, sqlx::Error> {
    sqlx::query_as::<_, Mission>(
        "SELECT mission_id, repo_id, title, request_summary, requested_by, risk_level::text AS risk_level, \
                state::text AS state, autonomy_tier, source_commit, active_context_pack_id, created_at, updated_at \
         FROM mission WHERE mission_id = $1",
    )
    .bind(mission_id)
    .fetch_optional(pool)
    .await
}

/// `new_state` is bound via an explicit `::mission_state` cast — callers
/// pass one of the 17 literal enum values as a plain string (e.g.
/// `"cancelled"`); Postgres rejects anything else at the database level.
pub async fn set_mission_state(pool: &PgPool, mission_id: &str, new_state: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE mission SET state = $2::mission_state, updated_at = now() WHERE mission_id = $1")
        .bind(mission_id)
        .bind(new_state)
        .execute(pool)
        .await?;
    Ok(())
}

/// Missions whose state counts as "active" for kill-switch purposes.
/// Allowlisted rather than denylisting terminal states — safer given this
/// module doesn't own the full 17-state machine, and later epics may
/// attach meaning to in-between states (`awaiting_review`,
/// `decision_pending`, etc.) this module can't predict correct behavior
/// for today.
pub const KILL_SWITCH_ACTIVE_STATES: &[&str] =
    &["drafted", "classified", "context_ready", "admitted", "running", "paused"];

pub async fn active_mission_ids(pool: &PgPool) -> Result<Vec<String>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT mission_id FROM mission WHERE state::text = ANY($1)",
    )
    .bind(KILL_SWITCH_ACTIVE_STATES)
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(|row| row.get("mission_id")).collect())
}

// --- mission_event ---

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct MissionEvent {
    pub event_id: String,
    pub mission_id: String,
    pub event_type: String,
    pub actor_type: String,
    pub actor_id: String,
    pub event_payload: serde_json::Value,
    pub previous_state: Option<String>,
    pub next_state: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Append-only. `actor_type` must be one of `developer`/`system`/`agent`/
/// `board`/`cloud` (the real `actor_type` Postgres enum on this column) —
/// bound directly as `TEXT` here since the column itself is `TEXT NOT NULL
/// CHECK (...)`, not an enum type (confirmed in
/// `migrations/001_initial_vault_schema.sql`), so no cast is needed, unlike
/// `previous_state`/`next_state`.
#[allow(clippy::too_many_arguments)]
pub async fn insert_mission_event(
    pool: &PgPool,
    mission_id: &str,
    event_type: &str,
    actor_type: &str,
    actor_id: &str,
    event_payload: serde_json::Value,
    previous_state: Option<&str>,
    next_state: Option<&str>,
) -> Result<MissionEvent, sqlx::Error> {
    let event_id = ids::new_id(ids::prefix::MISSION_EVENT);
    sqlx::query_as::<_, MissionEvent>(
        "INSERT INTO mission_event (event_id, mission_id, event_type, actor_type, actor_id, event_payload, previous_state, next_state) \
         VALUES ($1, $2, $3, $4, $5, $6, $7::mission_state, $8::mission_state) \
         RETURNING event_id, mission_id, event_type, actor_type, actor_id, event_payload, \
                   previous_state::text AS previous_state, next_state::text AS next_state, created_at",
    )
    .bind(&event_id)
    .bind(mission_id)
    .bind(event_type)
    .bind(actor_type)
    .bind(actor_id)
    .bind(event_payload)
    .bind(previous_state)
    .bind(next_state)
    .fetch_one(pool)
    .await
}

// --- security_event ---

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct SecurityEvent {
    pub security_event_id: String,
    pub mission_id: Option<String>,
    pub event_class: String,
    pub risk_level: String,
    pub blocked: bool,
    pub reason: String,
    pub evidence: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

/// Append-only. `mission_id` is nullable (`ON DELETE SET NULL` in the
/// schema) since a security event can be relevant even without an active
/// mission (e.g. a standalone `check-path`/`check-command` CLI probe).
pub async fn insert_security_event(
    pool: &PgPool,
    mission_id: Option<&str>,
    event_class: &str,
    risk_level: &str,
    blocked: bool,
    reason: &str,
    evidence: serde_json::Value,
) -> Result<SecurityEvent, sqlx::Error> {
    let security_event_id = ids::new_id(ids::prefix::SECURITY_EVENT);
    sqlx::query_as::<_, SecurityEvent>(
        "INSERT INTO security_event (security_event_id, mission_id, event_class, risk_level, blocked, reason, evidence) \
         VALUES ($1, $2, $3, $4::risk_level, $5, $6, $7) \
         RETURNING security_event_id, mission_id, event_class, risk_level::text AS risk_level, blocked, reason, evidence, created_at",
    )
    .bind(&security_event_id)
    .bind(mission_id)
    .bind(event_class)
    .bind(risk_level)
    .bind(blocked)
    .bind(reason)
    .bind(evidence)
    .fetch_one(pool)
    .await
}

// --- status ---

#[derive(Debug, Clone, serde::Serialize)]
pub struct AppliedMigration {
    pub version: i64,
    pub description: String,
    pub installed_on: DateTime<Utc>,
    pub success: bool,
}

/// Reads sqlx's own migration-tracking table (`_sqlx_migrations`). sqlx 0.8
/// hardcodes this table name with no configuration to rename it — this
/// satisfies the "add schema_migrations" intent from the contractor handoff
/// doc under sqlx's actual table name rather than a hand-rolled duplicate.
pub async fn applied_migrations(pool: &PgPool) -> Result<Vec<AppliedMigration>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT version, description, installed_on, success FROM _sqlx_migrations ORDER BY version",
    )
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|row| AppliedMigration {
            version: row.get("version"),
            description: row.get("description"),
            installed_on: row.get("installed_on"),
            success: row.get("success"),
        })
        .collect())
}

/// `table` must come from `VAULT_TABLES` (a fixed constant list), never from
/// external input — sqlx cannot bind identifiers as query parameters, so this
/// relies on the caller only ever passing a known-safe table name.
pub async fn table_row_count(pool: &PgPool, table: &str) -> Result<i64, sqlx::Error> {
    debug_assert!(
        VAULT_TABLES.contains(&table),
        "table_row_count called with a table not in VAULT_TABLES: {table}"
    );
    let query = format!("SELECT COUNT(*) AS count FROM {table}");
    let row = sqlx::query(&query).fetch_one(pool).await?;
    Ok(row.get::<i64, _>("count"))
}
