//! Repository-layer functions for `context_pack` and `cloud_payload_preview`
//! (Epic 4).
//!
//! Sibling file to `repo_truth.rs`, same precedent: a table-cluster gets its
//! own file rather than growing `mod.rs`. `token_budget` and
//! `estimated_credits` are Postgres `INTEGER` columns, so they map to Rust
//! `i32` (not `i64`, which is `BIGINT`) — matching how `applied_migrations`
//! reads `_sqlx_migrations.version` as `i64` because *that* column is
//! `BIGINT`. `route_class` on both tables is a plain `TEXT ... CHECK (...)`
//! column (not a Postgres enum like `mission_state`/`risk_level`), so it
//! binds directly as text with no `::cast`, the same way `mission.autonomy_tier`
//! does.
//!
//! The four summary columns (`included_summary`, `excluded_summary`,
//! `redaction_summary`, `source_refs`) are `JSONB` and are bound/returned as
//! `serde_json::Value`, exactly like `repo_truth_snapshot`'s JSONB columns.
//! Raw redacted evidence CONTENT is never a column here — the vault stores
//! summaries + the `context_pack_hash` only, mirroring how `repo_truth` keeps
//! file text out of the vault. See `context_control::manifest`'s doc comment.
//!
//! No live-Postgres unit tests here, matching `mod.rs`/`repo_truth.rs`
//! practice — these are exercised through the `vibeforge_context` CLI.

use super::ids;
use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;

// --- context_pack ---

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct ContextPackRow {
    pub context_pack_id: String,
    pub mission_id: String,
    pub context_type: String,
    pub route_class: String,
    pub token_budget: i32,
    pub included_summary: serde_json::Value,
    pub excluded_summary: serde_json::Value,
    pub redaction_summary: serde_json::Value,
    pub source_refs: serde_json::Value,
    pub cloud_allowed: bool,
    pub context_pack_hash: String,
    pub created_at: DateTime<Utc>,
}

#[allow(clippy::too_many_arguments)]
pub async fn create_context_pack(
    pool: &PgPool,
    mission_id: &str,
    context_type: &str,
    route_class: &str,
    token_budget: i32,
    included_summary: serde_json::Value,
    excluded_summary: serde_json::Value,
    redaction_summary: serde_json::Value,
    source_refs: serde_json::Value,
    cloud_allowed: bool,
    context_pack_hash: &str,
) -> Result<ContextPackRow, sqlx::Error> {
    let context_pack_id = ids::new_id(ids::prefix::CONTEXT_PACK);
    sqlx::query_as::<_, ContextPackRow>(
        "INSERT INTO context_pack (context_pack_id, mission_id, context_type, route_class, token_budget, \
         included_summary, excluded_summary, redaction_summary, source_refs, cloud_allowed, context_pack_hash) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) \
         RETURNING context_pack_id, mission_id, context_type, route_class, token_budget, included_summary, \
                   excluded_summary, redaction_summary, source_refs, cloud_allowed, context_pack_hash, created_at",
    )
    .bind(&context_pack_id)
    .bind(mission_id)
    .bind(context_type)
    .bind(route_class)
    .bind(token_budget)
    .bind(included_summary)
    .bind(excluded_summary)
    .bind(redaction_summary)
    .bind(source_refs)
    .bind(cloud_allowed)
    .bind(context_pack_hash)
    .fetch_one(pool)
    .await
}

pub async fn get_context_pack(
    pool: &PgPool,
    context_pack_id: &str,
) -> Result<Option<ContextPackRow>, sqlx::Error> {
    sqlx::query_as::<_, ContextPackRow>(
        "SELECT context_pack_id, mission_id, context_type, route_class, token_budget, included_summary, \
                excluded_summary, redaction_summary, source_refs, cloud_allowed, context_pack_hash, created_at \
         FROM context_pack WHERE context_pack_id = $1",
    )
    .bind(context_pack_id)
    .fetch_optional(pool)
    .await
}

/// Point `mission.active_context_pack_id` at a freshly built pack. The column
/// is a plain nullable `TEXT` (no FK in the schema), so this is a bare
/// `UPDATE`. Called by the CLI's `build-pack` after a successful insert so a
/// later `cloud-preview` / workcell step can find the mission's current pack.
pub async fn set_mission_active_context_pack(
    pool: &PgPool,
    mission_id: &str,
    context_pack_id: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE mission SET active_context_pack_id = $2, updated_at = now() WHERE mission_id = $1")
        .bind(mission_id)
        .bind(context_pack_id)
        .execute(pool)
        .await?;
    Ok(())
}

// --- cloud_payload_preview ---

#[derive(Debug, Clone, sqlx::FromRow, serde::Serialize)]
pub struct CloudPayloadPreviewRow {
    pub preview_id: String,
    pub context_pack_id: String,
    pub mission_id: String,
    pub job_type: String,
    pub route_class: String,
    pub estimated_credits: i32,
    pub included_summary: serde_json::Value,
    pub excluded_summary: serde_json::Value,
    pub redaction_summary: serde_json::Value,
    pub forbidden_field_scan_passed: bool,
    pub approved_decision_id: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[allow(clippy::too_many_arguments)]
pub async fn create_cloud_payload_preview(
    pool: &PgPool,
    context_pack_id: &str,
    mission_id: &str,
    job_type: &str,
    route_class: &str,
    estimated_credits: i32,
    included_summary: serde_json::Value,
    excluded_summary: serde_json::Value,
    redaction_summary: serde_json::Value,
    forbidden_field_scan_passed: bool,
) -> Result<CloudPayloadPreviewRow, sqlx::Error> {
    let preview_id = ids::new_id(ids::prefix::CLOUD_PAYLOAD_PREVIEW);
    sqlx::query_as::<_, CloudPayloadPreviewRow>(
        "INSERT INTO cloud_payload_preview (preview_id, context_pack_id, mission_id, job_type, route_class, \
         estimated_credits, included_summary, excluded_summary, redaction_summary, forbidden_field_scan_passed) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) \
         RETURNING preview_id, context_pack_id, mission_id, job_type, route_class, estimated_credits, \
                   included_summary, excluded_summary, redaction_summary, forbidden_field_scan_passed, \
                   approved_decision_id, created_at",
    )
    .bind(&preview_id)
    .bind(context_pack_id)
    .bind(mission_id)
    .bind(job_type)
    .bind(route_class)
    .bind(estimated_credits)
    .bind(included_summary)
    .bind(excluded_summary)
    .bind(redaction_summary)
    .bind(forbidden_field_scan_passed)
    .fetch_one(pool)
    .await
}

pub async fn get_cloud_payload_preview(
    pool: &PgPool,
    preview_id: &str,
) -> Result<Option<CloudPayloadPreviewRow>, sqlx::Error> {
    sqlx::query_as::<_, CloudPayloadPreviewRow>(
        "SELECT preview_id, context_pack_id, mission_id, job_type, route_class, estimated_credits, \
                included_summary, excluded_summary, redaction_summary, forbidden_field_scan_passed, \
                approved_decision_id, created_at \
         FROM cloud_payload_preview WHERE preview_id = $1",
    )
    .bind(preview_id)
    .fetch_optional(pool)
    .await
}

/// Record developer approval on a preview by writing the `developer_decision`
/// id. The actual `developer_decision` row is Epic 7's concern; this function
/// only sets the FK-less reference column so Epic 4's cloud gate
/// (`context_control::cloud_preview::authorize_cloud_execution`) can see an
/// approval exists. Never clears an existing approval.
pub async fn approve_cloud_payload_preview(
    pool: &PgPool,
    preview_id: &str,
    decision_id: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE cloud_payload_preview SET approved_decision_id = $2 WHERE preview_id = $1")
        .bind(preview_id)
        .bind(decision_id)
        .execute(pool)
        .await?;
    Ok(())
}
