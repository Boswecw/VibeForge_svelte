//! VibeForge Context Control CLI (Epic 4 scope): build context packs and gate
//! cloud escalation behind an approved, forbidden-field-scanned preview.
//!
//! Same secondary-binary pattern as `vibeforge_vault.rs` /
//! `vibeforge_authority.rs` / `vibeforge_repo_truth.rs`: no `lib.rs`, modules
//! pulled in directly via `#[path]`. Mounts `vault` (persistence) and
//! `context_control` (the pure builder/redaction/gate engine). It does NOT
//! mount `authority` — `context_control` has no dependency on it.
//!
//! Subcommands:
//!   build-pack     Build + persist a context pack for a mission
//!   cloud-preview  Generate + persist a cloud payload preview (execution stays
//!                  BLOCKED until approved — this command never transmits)
//!   approve        Record developer approval of a preview by decision id
//!   show-pack      Read-only pretty-printer for a stored context pack

#[path = "../context_control/mod.rs"]
mod context_control;
#[path = "../vault/mod.rs"]
mod vault;

use anyhow::{bail, Context, Result};
use clap::{Parser, Subcommand};
use std::path::PathBuf;
use std::process::ExitCode;

use context_control::cloud_preview::{
    authorize_cloud_execution, build_cloud_preview, CloudPayloadPreview,
};
use context_control::manifest::{build_context_pack, ContextPack, ContextPackInput, RedactedEvidence};
use context_control::{EvidenceItem, RouteClass};

#[derive(clap::ValueEnum, Clone, Copy, Debug)]
enum RouteArg {
    Local,
    QuickCloud,
    DeepCloud,
    TeamPolicy,
}

impl From<RouteArg> for RouteClass {
    fn from(value: RouteArg) -> Self {
        match value {
            RouteArg::Local => RouteClass::Local,
            RouteArg::QuickCloud => RouteClass::QuickCloud,
            RouteArg::DeepCloud => RouteClass::DeepCloud,
            RouteArg::TeamPolicy => RouteClass::TeamPolicy,
        }
    }
}

#[derive(Parser)]
#[command(
    name = "vibeforge_context",
    about = "VibeForge Context Control CLI (Epic 4: build-pack/cloud-preview/approve/show-pack)"
)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Build and persist a context pack for a mission.
    BuildPack {
        #[arg(long)]
        mission_id: String,
        #[arg(long, default_value = "mission_context")]
        context_type: String,
        #[arg(long, value_enum, default_value = "local")]
        route_class: RouteArg,
        #[arg(long, default_value_t = 8000)]
        token_budget: i32,
        /// Permit cloud escalation for this mission. Even with this set, a
        /// cloud route still requires an approved preview before transmit.
        #[arg(long)]
        cloud_allowed: bool,
        /// Optional JSON file: an array of {label, source_ref, content,
        /// secret_like?} evidence items to add on top of repo-truth-derived
        /// evidence.
        #[arg(long)]
        evidence_file: Option<PathBuf>,
        #[arg(long)]
        json: bool,
    },
    /// Generate and persist a cloud payload preview for a stored pack. Never
    /// transmits; prints whether cloud execution is authorized (it won't be
    /// until `approve`).
    CloudPreview {
        #[arg(long)]
        context_pack_id: String,
        #[arg(long, default_value = "DeepArchitectureReview")]
        job_type: String,
        #[arg(long)]
        json: bool,
    },
    /// Record developer approval of a preview by developer_decision id, then
    /// re-check the cloud gate.
    Approve {
        #[arg(long)]
        preview_id: String,
        #[arg(long)]
        decision_id: String,
        #[arg(long)]
        json: bool,
    },
    /// Read-only pretty-printer for a stored context pack.
    ShowPack {
        #[arg(long)]
        context_pack_id: String,
        #[arg(long)]
        json: bool,
    },
}

#[tokio::main]
async fn main() -> ExitCode {
    let cli = Cli::parse();

    let result = match cli.command {
        Command::BuildPack {
            mission_id,
            context_type,
            route_class,
            token_budget,
            cloud_allowed,
            evidence_file,
            json,
        } => {
            run_build_pack(
                &mission_id,
                &context_type,
                route_class.into(),
                token_budget,
                cloud_allowed,
                evidence_file,
                json,
            )
            .await
        }
        Command::CloudPreview {
            context_pack_id,
            job_type,
            json,
        } => run_cloud_preview(&context_pack_id, &job_type, json).await,
        Command::Approve {
            preview_id,
            decision_id,
            json,
        } => run_approve(&preview_id, &decision_id, json).await,
        Command::ShowPack { context_pack_id, json } => run_show_pack(&context_pack_id, json).await,
    };

    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("Error: {e:#}");
            ExitCode::FAILURE
        }
    }
}

#[allow(clippy::too_many_arguments)]
async fn run_build_pack(
    mission_id: &str,
    context_type: &str,
    route_class: RouteClass,
    token_budget: i32,
    cloud_allowed: bool,
    evidence_file: Option<PathBuf>,
    json: bool,
) -> Result<()> {
    let pool = vault::create_pool(&vault::database_url())
        .await
        .context("connecting to vault database")?;

    let mission = vault::get_mission(&pool, mission_id)
        .await
        .context("looking up mission")?
        .ok_or_else(|| anyhow::anyhow!("no mission found with mission_id {mission_id}"))?;

    let mut evidence = gather_repo_truth_evidence(&pool, &mission.repo_id).await?;
    if let Some(path) = evidence_file {
        evidence.extend(load_evidence_file(&path)?);
    }

    let pack = build_context_pack(ContextPackInput {
        context_type: context_type.to_string(),
        route_class,
        token_budget,
        cloud_allowed,
        evidence,
    });

    let row = vault::context_control::create_context_pack(
        &pool,
        mission_id,
        &pack.context_type,
        &pack.route_class,
        pack.token_budget,
        serde_json::to_value(&pack.included_summary)?,
        serde_json::to_value(&pack.excluded_summary)?,
        serde_json::to_value(&pack.redaction_summary)?,
        serde_json::to_value(&pack.source_refs)?,
        pack.cloud_allowed,
        &pack.context_pack_hash,
    )
    .await
    .context("inserting context_pack")?;

    vault::context_control::set_mission_active_context_pack(&pool, mission_id, &row.context_pack_id)
        .await
        .context("setting mission.active_context_pack_id")?;

    if json {
        println!("{}", serde_json::to_string_pretty(&row)?);
    } else {
        println!("Context pack: {}", row.context_pack_id);
        println!("Route class: {}", row.route_class);
        println!("Token budget: {}", row.token_budget);
        println!("Included: {} item(s)", pack.included_summary.len());
        println!("Excluded: {} item(s)", pack.excluded_summary.len());
        for line in &pack.excluded_summary {
            println!("  - {line}");
        }
        if pack.redaction_summary.is_empty() {
            println!("Redaction: nothing redacted");
        } else {
            println!("Redaction:");
            for line in &pack.redaction_summary {
                println!("  - {line}");
            }
        }
        println!("Pack hash: {}", row.context_pack_hash);
    }
    Ok(())
}

async fn run_cloud_preview(context_pack_id: &str, job_type: &str, json: bool) -> Result<()> {
    let pool = vault::create_pool(&vault::database_url())
        .await
        .context("connecting to vault database")?;

    let row = vault::context_control::get_context_pack(&pool, context_pack_id)
        .await
        .context("looking up context pack")?
        .ok_or_else(|| anyhow::anyhow!("no context pack found with context_pack_id {context_pack_id}"))?;

    let pack = pack_from_row(&row);

    let preview = build_cloud_preview(&pack, job_type)
        .map_err(|e| anyhow::anyhow!("cannot build cloud preview: {e}"))?;

    let preview_row = vault::context_control::create_cloud_payload_preview(
        &pool,
        &row.context_pack_id,
        &row.mission_id,
        &preview.job_type,
        &preview.route_class,
        preview.estimated_credits,
        serde_json::to_value(&preview.included_summary)?,
        serde_json::to_value(&preview.excluded_summary)?,
        serde_json::to_value(&preview.redaction_summary)?,
        preview.forbidden_field_scan_passed,
    )
    .await
    .context("inserting cloud_payload_preview")?;

    // The gate. A freshly built preview is unapproved by construction, so
    // this reports BLOCKED — that is the correct, expected outcome, not an
    // error. Nothing is transmitted by this command.
    let gate = authorize_cloud_execution(Some(&preview));

    if json {
        println!(
            "{}",
            serde_json::to_string_pretty(&serde_json::json!({
                "preview_id": preview_row.preview_id,
                "estimated_credits": preview.estimated_credits,
                "forbidden_field_scan_passed": preview.forbidden_field_scan_passed,
                "forbidden_field_findings": preview.forbidden_field_findings,
                "cloud_execution_authorized": gate.is_ok(),
                "gate_status": gate.as_ref().err().map(|e| e.event_class()),
            }))?
        );
    } else {
        println!("Cloud payload preview: {}", preview_row.preview_id);
        println!("Job type: {}", preview.job_type);
        println!("Route class: {}", preview.route_class);
        println!("Estimated credits: {}", preview.estimated_credits);
        println!(
            "Forbidden-field scan: {}",
            if preview.forbidden_field_scan_passed { "PASSED" } else { "FAILED" }
        );
        for finding in &preview.forbidden_field_findings {
            println!("  ! {finding}");
        }
        match gate {
            Ok(()) => println!("Cloud execution: AUTHORIZED"),
            Err(e) => println!("Cloud execution: BLOCKED [{}] — {e}", e.event_class()),
        }
        println!("(Approve with: vibeforge_context approve --preview-id {} --decision-id <dec_...>)", preview_row.preview_id);
    }
    Ok(())
}

async fn run_approve(preview_id: &str, decision_id: &str, json: bool) -> Result<()> {
    let pool = vault::create_pool(&vault::database_url())
        .await
        .context("connecting to vault database")?;

    let existing = vault::context_control::get_cloud_payload_preview(&pool, preview_id)
        .await
        .context("looking up cloud payload preview")?
        .ok_or_else(|| anyhow::anyhow!("no preview found with preview_id {preview_id}"))?;

    vault::context_control::approve_cloud_payload_preview(&pool, preview_id, decision_id)
        .await
        .context("recording approval")?;

    // Reconstruct the in-memory preview from the now-approved row to re-run
    // the gate and report the resulting status honestly.
    let mut preview = preview_from_row(&existing);
    preview.approve(decision_id);
    let gate = authorize_cloud_execution(Some(&preview));

    if json {
        println!(
            "{}",
            serde_json::to_string_pretty(&serde_json::json!({
                "preview_id": preview_id,
                "approved_decision_id": decision_id,
                "cloud_execution_authorized": gate.is_ok(),
                "gate_status": gate.as_ref().err().map(|e| e.event_class()),
            }))?
        );
    } else {
        println!("Approved preview {preview_id} with decision {decision_id}.");
        match gate {
            Ok(()) => println!("Cloud execution: AUTHORIZED"),
            Err(e) => println!("Cloud execution still BLOCKED [{}] — {e}", e.event_class()),
        }
    }
    Ok(())
}

async fn run_show_pack(context_pack_id: &str, json: bool) -> Result<()> {
    let pool = vault::create_pool(&vault::database_url())
        .await
        .context("connecting to vault database")?;

    let row = vault::context_control::get_context_pack(&pool, context_pack_id)
        .await
        .context("looking up context pack")?
        .ok_or_else(|| anyhow::anyhow!("no context pack found with context_pack_id {context_pack_id}"))?;

    if json {
        println!("{}", serde_json::to_string_pretty(&row)?);
    } else {
        println!("Context pack: {}", row.context_pack_id);
        println!("Mission: {}", row.mission_id);
        println!("Context type: {}", row.context_type);
        println!("Route class: {}", row.route_class);
        println!("Token budget: {}", row.token_budget);
        println!("Cloud allowed: {}", row.cloud_allowed);
        println!("Pack hash: {}", row.context_pack_hash);
    }
    Ok(())
}

/// Derive context evidence from the mission's latest repo-truth snapshot
/// summaries already stored in the vault. No filesystem reads and no raw file
/// content — only the structured summaries `repo_truth` already persisted,
/// which is exactly the "minimal evidence" doc 06 step 3 asks for as a first
/// cut. Returns an empty vec (not an error) when the repo has never been
/// scanned — a pack with no repo-truth evidence is still valid.
async fn gather_repo_truth_evidence(
    pool: &sqlx::postgres::PgPool,
    repo_id: &str,
) -> Result<Vec<EvidenceItem>> {
    let Some(snapshot) =
        vault::repo_truth::get_latest_repo_truth_snapshot_for_repo(pool, repo_id)
            .await
            .context("looking up latest repo truth snapshot")?
    else {
        return Ok(Vec::new());
    };

    let mut evidence = Vec::new();
    evidence.push(EvidenceItem::new(
        "architecture summary",
        "repo_truth:architecture",
        serde_json::json!({
            "languages": snapshot.language_summary,
            "frameworks": snapshot.framework_summary,
        })
        .to_string(),
    ));
    evidence.push(EvidenceItem::new(
        "dependency metadata",
        "repo_truth:dependencies",
        snapshot.dependency_summary.to_string(),
    ));
    evidence.push(EvidenceItem::new(
        "instruction files",
        "repo_truth:instructions",
        snapshot.agent_instruction_files.to_string(),
    ));
    Ok(evidence)
}

fn load_evidence_file(path: &std::path::Path) -> Result<Vec<EvidenceItem>> {
    let text = std::fs::read_to_string(path)
        .with_context(|| format!("reading evidence file {}", path.display()))?;
    let items: Vec<EvidenceItem> =
        serde_json::from_str(&text).context("parsing evidence file as a JSON array of evidence items")?;
    Ok(items)
}

/// Reconstruct a metadata-only [`ContextPack`] from a persisted row. The
/// vault never stored raw redacted content (by design), so `redacted_evidence`
/// is empty — which means the cloud payload built from this carries only
/// summaries, and the forbidden-field scan vets that metadata. A full-content
/// re-derivation belongs to the workcell step (Epic 5) that actually holds
/// the source.
fn pack_from_row(row: &vault::context_control::ContextPackRow) -> ContextPack {
    ContextPack {
        schema_version: context_control::manifest::CONTEXT_PACK_SCHEMA_VERSION.to_string(),
        context_type: row.context_type.clone(),
        route_class: row.route_class.clone(),
        token_budget: row.token_budget,
        cloud_allowed: row.cloud_allowed,
        included_summary: json_to_string_vec(&row.included_summary),
        excluded_summary: json_to_string_vec(&row.excluded_summary),
        redaction_summary: json_to_string_vec(&row.redaction_summary),
        source_refs: json_to_string_vec(&row.source_refs),
        context_pack_hash: row.context_pack_hash.clone(),
        redacted_evidence: Vec::<RedactedEvidence>::new(),
    }
}

fn preview_from_row(row: &vault::context_control::CloudPayloadPreviewRow) -> CloudPayloadPreview {
    CloudPayloadPreview {
        schema_version: context_control::cloud_preview::CLOUD_PAYLOAD_PREVIEW_SCHEMA_VERSION.to_string(),
        job_type: row.job_type.clone(),
        route_class: row.route_class.clone(),
        estimated_credits: row.estimated_credits,
        included_summary: json_to_string_vec(&row.included_summary),
        excluded_summary: json_to_string_vec(&row.excluded_summary),
        redaction_summary: json_to_string_vec(&row.redaction_summary),
        forbidden_field_scan_passed: row.forbidden_field_scan_passed,
        forbidden_field_findings: Vec::new(),
        approved_decision_id: row.approved_decision_id.clone(),
        context_pack_hash: String::new(),
    }
}

fn json_to_string_vec(value: &serde_json::Value) -> Vec<String> {
    value
        .as_array()
        .map(|items| {
            items
                .iter()
                .filter_map(|v| v.as_str().map(str::to_string))
                .collect()
        })
        .unwrap_or_default()
}
