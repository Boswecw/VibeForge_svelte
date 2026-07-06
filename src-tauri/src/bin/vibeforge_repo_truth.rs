//! VibeForge Repo Truth & Instruction Drift CLI (Epic 3 scope).
//!
//! Same secondary-binary pattern as `vibeforge_vault.rs` /
//! `vibeforge_authority.rs`: no `lib.rs`, modules pulled in directly via
//! `#[path]`. Mounts `authority` (required transitively by
//! `repo_truth::walk`/`repo_truth::safe_read`), `vault` (persistence), and
//! `repo_truth` (the pure scan/drift engine) all three.

#[path = "../authority/mod.rs"]
mod authority;
#[path = "../repo_truth/mod.rs"]
mod repo_truth;
#[path = "../vault/mod.rs"]
mod vault;

use anyhow::{bail, Context, Result};
use clap::{Parser, Subcommand};
use sqlx::postgres::PgPool;
use std::path::{Path, PathBuf};
use std::process::{Command, ExitCode};

/// Must match the `scan` subcommand's `--workspace-alias` default below —
/// `drift` doesn't take a workspace flag of its own (Epic 3's scope is the
/// common single-workspace-per-machine case) and resolves against this
/// same alias.
const DEFAULT_WORKSPACE_ALIAS: &str = "Default Workspace";

#[derive(Parser)]
#[command(
    name = "vibeforge_repo_truth",
    about = "VibeForge Repo Truth & Instruction Drift CLI (Epic 3: scan/drift/show/list-findings)"
)]
struct Cli {
    #[command(subcommand)]
    command: TopCommand,
}

#[derive(Subcommand)]
enum TopCommand {
    /// Scan a target repo, persist a RepoTruthSnapshot (deduped by
    /// content hash), and persist any instruction drift findings.
    Scan {
        #[arg(long)]
        repo_root: PathBuf,
        #[arg(long)]
        workspace_id: Option<String>,
        #[arg(long, default_value = "Default Workspace")]
        workspace_alias: String,
        #[arg(long)]
        repo_alias: Option<String>,
        #[arg(long)]
        head_commit: Option<String>,
        #[arg(long, default_value_t = repo_truth::walk::DEFAULT_MAX_DEPTH)]
        max_depth: usize,
        #[arg(long, default_value_t = repo_truth::walk::DEFAULT_MAX_FILES)]
        max_files: usize,
        #[arg(long)]
        json: bool,
    },
    /// Re-walk instruction files on disk and re-run drift detection
    /// against an existing snapshot's already-stored candidate commands
    /// (no rescan, no new snapshot/hash) — a lightweight re-check pass.
    Drift {
        #[arg(long)]
        repo_root: PathBuf,
        #[arg(long)]
        snapshot_id: Option<String>,
        #[arg(long)]
        json: bool,
    },
    /// Read-only pretty-printer for a stored snapshot.
    Show {
        #[arg(long)]
        snapshot_id: String,
        #[arg(long)]
        json: bool,
    },
    /// Read-only pretty-printer for a snapshot's drift findings.
    ListFindings {
        #[arg(long)]
        snapshot_id: String,
        #[arg(long)]
        json: bool,
    },
}

#[tokio::main]
async fn main() -> ExitCode {
    let cli = Cli::parse();

    let result = match cli.command {
        TopCommand::Scan {
            repo_root,
            workspace_id,
            workspace_alias,
            repo_alias,
            head_commit,
            max_depth,
            max_files,
            json,
        } => {
            run_scan(
                &repo_root,
                workspace_id,
                &workspace_alias,
                repo_alias,
                head_commit,
                max_depth,
                max_files,
                json,
            )
            .await
        }
        TopCommand::Drift {
            repo_root,
            snapshot_id,
            json,
        } => run_drift(&repo_root, snapshot_id, json).await,
        TopCommand::Show { snapshot_id, json } => run_show(&snapshot_id, json).await,
        TopCommand::ListFindings { snapshot_id, json } => run_list_findings(&snapshot_id, json).await,
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
async fn run_scan(
    repo_root: &Path,
    workspace_id: Option<String>,
    workspace_alias: &str,
    repo_alias: Option<String>,
    head_commit: Option<String>,
    max_depth: usize,
    max_files: usize,
    json: bool,
) -> Result<()> {
    let canonical_root = repo_root
        .canonicalize()
        .with_context(|| format!("repo_root does not exist or is not accessible: {}", repo_root.display()))?;
    if !canonical_root.is_dir() {
        bail!("repo_root is not a directory: {}", canonical_root.display());
    }

    let pool = vault::create_pool(&vault::database_url())
        .await
        .context("connecting to vault database")?;

    let workspace = resolve_workspace(&pool, workspace_id.as_deref(), workspace_alias).await?;

    // Never store or print the raw absolute path -- only this hash plus a
    // human-readable alias. See `repo_truth::snapshot::hash_repo_root_path`.
    let repo_root_hash = repo_truth::snapshot::hash_repo_root_path(&canonical_root);
    let alias = repo_alias.unwrap_or_else(|| {
        canonical_root
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "repo".to_string())
    });

    let repository = resolve_repository(&pool, &workspace.workspace_id, &repo_root_hash, &alias).await?;

    let resolved_head_commit = match head_commit {
        Some(commit) => commit,
        None => git_rev_parse_head(&canonical_root).context(
            "resolving head_commit (no --head-commit given and `git rev-parse HEAD` failed -- \
             is this a git repository?)",
        )?,
    };

    vault::set_repository_current_head(&pool, &repository.repo_id, &resolved_head_commit)
        .await
        .context("updating repository.current_head")?;

    let options = repo_truth::scan::ScanOptions { max_depth, max_files };
    let scan_output =
        repo_truth::scan::scan_repo(&canonical_root, &options).map_err(|e| anyhow::anyhow!("scanning repo: {e}"))?;

    let existing = vault::repo_truth::find_repo_truth_snapshot_by_hash(
        &pool,
        &repository.repo_id,
        &resolved_head_commit,
        &scan_output.snapshot_hash,
    )
    .await
    .context("checking for an existing snapshot with this hash")?;

    let (snapshot_id, reused, persisted_finding_count) = if let Some(existing) = existing {
        (existing.snapshot_id, true, 0usize)
    } else {
        let snapshot = vault::repo_truth::create_repo_truth_snapshot(
            &pool,
            &repository.repo_id,
            &resolved_head_commit,
            scan_output.snapshot_data.language_summary.clone(),
            scan_output.snapshot_data.framework_summary.clone(),
            scan_output.snapshot_data.dependency_summary.clone(),
            scan_output.snapshot_data.test_command_candidates.clone(),
            scan_output.snapshot_data.build_command_candidates.clone(),
            scan_output.snapshot_data.agent_instruction_files.clone(),
            &scan_output.snapshot_hash,
        )
        .await
        .context("inserting repo_truth_snapshot")?;

        for finding in &scan_output.drift_findings {
            vault::repo_truth::insert_instruction_drift_finding(
                &pool,
                &snapshot.snapshot_id,
                &finding.file_path,
                finding.drift_type,
                finding.severity,
                &finding.finding_summary,
                finding.evidence_refs.clone(),
            )
            .await
            .context("inserting instruction_drift_finding")?;
        }

        (snapshot.snapshot_id, false, scan_output.drift_findings.len())
    };

    if json {
        println!(
            "{}",
            serde_json::to_string_pretty(&serde_json::json!({
                "snapshot_id": snapshot_id,
                "reused": reused,
                "snapshot_hash": scan_output.snapshot_hash,
                "walk_truncated": scan_output.walk_truncated,
                "persisted_finding_count": persisted_finding_count,
                "snapshot_data": scan_output.snapshot_data,
                "drift_findings": scan_output.drift_findings,
            }))?
        );
    } else {
        if reused {
            println!("unchanged since last scan at this commit (snapshot {snapshot_id})");
        } else {
            println!("New snapshot: {snapshot_id}");
        }
        print_human_summary(&scan_output);
    }

    Ok(())
}

fn print_human_summary(scan_output: &repo_truth::scan::ScanOutput) {
    let data = &scan_output.snapshot_data;

    let primary_language = data
        .language_summary
        .get("primary_language")
        .and_then(|v| v.as_str())
        .unwrap_or("none detected");
    println!("Primary language: {primary_language}");

    let frameworks: Vec<String> = data
        .framework_summary
        .get("frameworks")
        .and_then(|v| v.as_array())
        .map(|items| {
            items
                .iter()
                .filter_map(|f| f.get("framework").and_then(|v| v.as_str()).map(str::to_string))
                .collect()
        })
        .unwrap_or_default();
    println!("Frameworks: {}", if frameworks.is_empty() { "none detected".to_string() } else { frameworks.join(", ") });

    let test_count = data.test_command_candidates.as_array().map(Vec::len).unwrap_or(0);
    let build_count = data.build_command_candidates.as_array().map(Vec::len).unwrap_or(0);
    println!("Candidate test commands: {test_count}");
    println!("Candidate build commands: {build_count}");

    let instruction_file_count = data.agent_instruction_files.as_array().map(Vec::len).unwrap_or(0);
    println!("Instruction files detected: {instruction_file_count}");

    if scan_output.walk_truncated {
        println!("WARNING: file walk was truncated (max_files reached) -- results may be incomplete");
    }

    let mut high = 0usize;
    let mut medium = 0usize;
    let mut other = 0usize;
    for finding in &scan_output.drift_findings {
        match finding.severity {
            "high" => high += 1,
            "medium" => medium += 1,
            _ => other += 1,
        }
    }
    println!(
        "Drift findings: {} (high: {high}, medium: {medium}, other: {other})",
        scan_output.drift_findings.len()
    );
}

async fn run_drift(repo_root: &Path, snapshot_id_arg: Option<String>, json: bool) -> Result<()> {
    let canonical_root = repo_root
        .canonicalize()
        .with_context(|| format!("repo_root does not exist or is not accessible: {}", repo_root.display()))?;

    let pool = vault::create_pool(&vault::database_url())
        .await
        .context("connecting to vault database")?;

    let workspace = vault::get_workspace_by_display_name(&pool, DEFAULT_WORKSPACE_ALIAS)
        .await
        .context("looking up the default workspace")?
        .ok_or_else(|| anyhow::anyhow!("no workspace found -- this repo has never been scanned (run `scan` first)"))?;

    let repo_root_hash = repo_truth::snapshot::hash_repo_root_path(&canonical_root);
    let repository = vault::get_repository_by_workspace_and_root_hash(&pool, &workspace.workspace_id, &repo_root_hash)
        .await
        .context("looking up repository by root hash")?
        .ok_or_else(|| anyhow::anyhow!("no repository found for this root -- it was never scanned (run `scan` first)"))?;

    let snapshot = match snapshot_id_arg {
        Some(id) => vault::repo_truth::get_repo_truth_snapshot(&pool, &id)
            .await
            .context("looking up snapshot by --snapshot-id")?
            .ok_or_else(|| anyhow::anyhow!("no snapshot found with snapshot_id {id}"))?,
        None => vault::repo_truth::get_latest_repo_truth_snapshot_for_repo(&pool, &repository.repo_id)
            .await
            .context("looking up latest snapshot for this repository")?
            .ok_or_else(|| anyhow::anyhow!("no snapshot exists yet for this repository (run `scan` first)"))?,
    };

    // Loaded directly from the already-stored columns -- manifest parsing
    // is NOT re-run here, per this subcommand's whole purpose (a cheap
    // re-check pass, not a rescan).
    let test_candidates: Vec<repo_truth::commands::CommandCandidate> =
        serde_json::from_value(snapshot.test_command_candidates.clone())
            .context("deserializing stored test_command_candidates")?;
    let build_candidates: Vec<repo_truth::commands::CommandCandidate> =
        serde_json::from_value(snapshot.build_command_candidates.clone())
            .context("deserializing stored build_command_candidates")?;
    let language_summary: repo_truth::languages::LanguageSummary =
        serde_json::from_value(snapshot.language_summary.clone()).context("deserializing stored language_summary")?;

    let walked = repo_truth::walk::walk_repo(&canonical_root, repo_truth::walk::DEFAULT_MAX_DEPTH, repo_truth::walk::DEFAULT_MAX_FILES);
    let detected = repo_truth::instructions::find_instruction_files(&canonical_root, &walked.files);

    let mut all_claims = Vec::new();
    for file in &detected {
        all_claims.extend(repo_truth::drift::extract_claimed_commands(&file.entry.path, &file.capped_text));
    }

    let mut findings =
        repo_truth::drift::detect_unverifiable_claims(&all_claims, &test_candidates, &build_candidates, &language_summary);
    findings.extend(repo_truth::drift::detect_conflicting_instructions(&all_claims));

    for finding in &findings {
        vault::repo_truth::insert_instruction_drift_finding(
            &pool,
            &snapshot.snapshot_id,
            &finding.file_path,
            finding.drift_type,
            finding.severity,
            &finding.finding_summary,
            finding.evidence_refs.clone(),
        )
        .await
        .context("inserting instruction_drift_finding")?;
    }

    if json {
        println!(
            "{}",
            serde_json::to_string_pretty(&serde_json::json!({
                "snapshot_id": snapshot.snapshot_id,
                "new_finding_count": findings.len(),
                "findings": findings,
            }))?
        );
    } else {
        println!(
            "Re-checked drift for snapshot {} against {} instruction file(s).",
            snapshot.snapshot_id,
            detected.len()
        );
        println!("New findings recorded: {}", findings.len());
        for finding in &findings {
            println!("  [{}] {}: {}", finding.severity, finding.drift_type, finding.finding_summary);
        }
    }

    Ok(())
}

async fn run_show(snapshot_id: &str, json: bool) -> Result<()> {
    let pool = vault::create_pool(&vault::database_url())
        .await
        .context("connecting to vault database")?;

    let snapshot = vault::repo_truth::get_repo_truth_snapshot(&pool, snapshot_id)
        .await
        .context("looking up snapshot")?
        .ok_or_else(|| anyhow::anyhow!("no snapshot found with snapshot_id {snapshot_id}"))?;

    if json {
        println!("{}", serde_json::to_string_pretty(&snapshot)?);
    } else {
        println!("Snapshot: {}", snapshot.snapshot_id);
        println!("Repository: {}", snapshot.repo_id);
        println!("Head commit: {}", snapshot.head_commit);
        println!("Generated at: {}", snapshot.generated_at);
        println!("Snapshot hash: {}", snapshot.snapshot_hash);
        println!(
            "Primary language: {}",
            snapshot
                .language_summary
                .get("primary_language")
                .and_then(|v| v.as_str())
                .unwrap_or("none detected")
        );
        let test_count = snapshot.test_command_candidates.as_array().map(Vec::len).unwrap_or(0);
        let build_count = snapshot.build_command_candidates.as_array().map(Vec::len).unwrap_or(0);
        println!("Candidate test commands: {test_count}");
        println!("Candidate build commands: {build_count}");
        let instruction_file_count = snapshot.agent_instruction_files.as_array().map(Vec::len).unwrap_or(0);
        println!("Instruction files detected: {instruction_file_count}");
    }
    Ok(())
}

async fn run_list_findings(snapshot_id: &str, json: bool) -> Result<()> {
    let pool = vault::create_pool(&vault::database_url())
        .await
        .context("connecting to vault database")?;

    let findings = vault::repo_truth::list_drift_findings_for_snapshot(&pool, snapshot_id)
        .await
        .context("listing drift findings")?;

    if json {
        println!("{}", serde_json::to_string_pretty(&findings)?);
    } else {
        if findings.is_empty() {
            println!("No drift findings recorded for snapshot {snapshot_id}.");
        }
        for finding in &findings {
            println!(
                "[{}] {} ({}): {}",
                finding.severity, finding.drift_type, finding.file_path, finding.finding_summary
            );
        }
    }
    Ok(())
}

async fn resolve_workspace(pool: &PgPool, workspace_id: Option<&str>, workspace_alias: &str) -> Result<vault::Workspace> {
    if let Some(id) = workspace_id {
        return vault::get_workspace(pool, id)
            .await
            .context("looking up workspace by --workspace-id")?
            .ok_or_else(|| anyhow::anyhow!("no workspace found with workspace_id {id}"));
    }

    if let Some(existing) = vault::get_workspace_by_display_name(pool, workspace_alias)
        .await
        .context("looking up workspace by --workspace-alias")?
    {
        return Ok(existing);
    }

    vault::create_workspace(pool, workspace_alias, "v1", "local_lock")
        .await
        .context("creating workspace")
}

async fn resolve_repository(
    pool: &PgPool,
    workspace_id: &str,
    repo_root_hash: &str,
    repo_alias: &str,
) -> Result<vault::Repository> {
    if let Some(existing) = vault::get_repository_by_workspace_and_root_hash(pool, workspace_id, repo_root_hash)
        .await
        .context("looking up repository by root hash")?
    {
        return Ok(existing);
    }

    vault::create_repository(pool, workspace_id, repo_root_hash, repo_alias)
        .await
        .context("creating repository")
}

/// `git -C <root> rev-parse HEAD`, spawned with a hardcoded argv (never a
/// shell string) via `std::process::Command`.
fn git_rev_parse_head(repo_root: &Path) -> Result<String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(repo_root)
        .arg("rev-parse")
        .arg("HEAD")
        .output()
        .context("spawning git rev-parse HEAD (is git installed and on PATH?)")?;

    if !output.status.success() {
        bail!(
            "git rev-parse HEAD failed (exit {}): {}",
            output.status,
            String::from_utf8_lossy(&output.stderr).trim()
        );
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}
