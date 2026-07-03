//! VibeForge Authority Gate CLI (Epic 2 scope).
//!
//! Same secondary-binary pattern as `vibeforge_vault.rs`: no `lib.rs`,
//! modules pulled in directly via `#[path]`. Mounts both `authority` and
//! `vault` because `authority::kill_switch` (and this binary's own
//! security-event logging on blocked checks) needs `vault` for persistence.

#[path = "../authority/mod.rs"]
mod authority;
#[path = "../vault/mod.rs"]
mod vault;

use anyhow::{bail, Context, Result};
use clap::{Parser, Subcommand};
use std::path::{Path, PathBuf};
use std::process::ExitCode;

use authority::kill_switch::{trigger_kill_switch, KillSwitchTarget};
use authority::permission_envelope::{CommandAuthorization, PathIntent, PermissionEnvelope};

#[derive(Parser)]
#[command(
    name = "vibeforge_authority",
    about = "VibeForge Authority Gate CLI (Epic 2: check-path/check-command/kill-switch)"
)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(clap::ValueEnum, Clone, Copy, Debug)]
enum IntentArg {
    Read,
    Write,
}

#[derive(Subcommand)]
enum Command {
    /// Check whether a path is authorized under a repo root (and optional worktree root)
    CheckPath {
        #[arg(long)]
        repo_root: PathBuf,
        #[arg(long)]
        worktree_root: Option<PathBuf>,
        #[arg(long)]
        path: String,
        #[arg(long, value_enum, default_value = "read")]
        intent: IntentArg,
        /// If set, a blocked check logs a security_event against this mission.
        #[arg(long)]
        mission_id: Option<String>,
    },
    /// Classify and authorize a proposed command string
    CheckCommand {
        #[arg(long)]
        command: String,
        /// If set, a blocked/forbidden check logs a security_event against this mission.
        #[arg(long)]
        mission_id: Option<String>,
    },
    /// Trigger the kill switch for one mission or all active missions
    KillSwitch {
        #[arg(long)]
        mission_id: Option<String>,
        #[arg(long)]
        all: bool,
        #[arg(long, default_value = "manual CLI kill switch")]
        reason: String,
    },
}

#[tokio::main]
async fn main() -> ExitCode {
    let cli = Cli::parse();

    let result = match cli.command {
        Command::CheckPath {
            repo_root,
            worktree_root,
            path,
            intent,
            mission_id,
        } => run_check_path(&repo_root, worktree_root.as_deref(), &path, intent, mission_id.as_deref()).await,
        Command::CheckCommand { command, mission_id } => run_check_command(&command, mission_id.as_deref()).await,
        Command::KillSwitch { mission_id, all, reason } => run_kill_switch(mission_id, all, &reason).await,
    };

    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("Error: {e:#}");
            ExitCode::FAILURE
        }
    }
}

async fn run_check_path(
    repo_root: &Path,
    worktree_root: Option<&Path>,
    path: &str,
    intent: IntentArg,
    mission_id: Option<&str>,
) -> Result<()> {
    let envelope = PermissionEnvelope::default_for_mission(
        mission_id.unwrap_or("mis_cli_probe"),
        "repo_cli_probe",
    );
    let intent = match intent {
        IntentArg::Read => PathIntent::Read,
        IntentArg::Write => PathIntent::Write,
    };

    match envelope.validate_path(repo_root, worktree_root, path, intent) {
        Ok(resolved) => {
            println!("ALLOWED: {}", resolved.repo_relative);
            Ok(())
        }
        Err(violation) => {
            let reason = violation.to_string();
            println!("BLOCKED [{}]: {reason}", violation.event_class());
            if let Some(mission_id) = mission_id {
                log_security_event(
                    Some(mission_id),
                    violation.event_class(),
                    "high",
                    &reason,
                    serde_json::json!({ "path": path, "intent": format!("{intent:?}") }),
                )
                .await;
            }
            bail!("path blocked: {reason}")
        }
    }
}

async fn run_check_command(command: &str, mission_id: Option<&str>) -> Result<()> {
    let envelope = PermissionEnvelope::default_for_mission(
        mission_id.unwrap_or("mis_cli_probe"),
        "repo_cli_probe",
    );

    match envelope.validate_command(command) {
        CommandAuthorization::Allowed => {
            println!("ALLOWED");
            Ok(())
        }
        CommandAuthorization::RequiresApproval { class, reason } => {
            println!("REQUIRES_APPROVAL [{class:?}]: {reason}");
            // Not a block — no security_event, this is a normal, expected
            // outcome a developer can approve.
            Ok(())
        }
        CommandAuthorization::Blocked { class, reason } => {
            println!("BLOCKED [{class:?}]: {reason}");
            if let Some(mission_id) = mission_id {
                log_security_event(
                    Some(mission_id),
                    "command_blocked",
                    "high",
                    &reason,
                    serde_json::json!({ "command": command, "class": format!("{class:?}") }),
                )
                .await;
            }
            bail!("command blocked: {reason}")
        }
    }
}

async fn run_kill_switch(mission_id: Option<String>, all: bool, reason: &str) -> Result<()> {
    if all == mission_id.is_some() {
        bail!("specify exactly one of --mission-id <id> or --all");
    }
    let target = match mission_id {
        Some(id) => KillSwitchTarget::Mission(id),
        None => KillSwitchTarget::All,
    };

    let pool = vault::create_pool(&vault::database_url())
        .await
        .context("connecting to vault database")?;
    let receipt = trigger_kill_switch(&pool, target, reason, "cli-operator")
        .await
        .context("triggering kill switch")?;

    println!("Kill switch triggered: security_event {}", receipt.security_event_id);
    if receipt.cancelled_mission_ids.is_empty() {
        println!("No missions were in an active state; no-op.");
    } else {
        println!("Cancelled missions: {}", receipt.cancelled_mission_ids.join(", "));
    }
    Ok(())
}

async fn log_security_event(
    mission_id: Option<&str>,
    event_class: &str,
    risk_level: &str,
    reason: &str,
    evidence: serde_json::Value,
) {
    let Ok(pool) = vault::create_pool(&vault::database_url()).await else {
        eprintln!("(warning: could not connect to vault database; security_event not logged)");
        return;
    };
    if let Err(e) = vault::insert_security_event(&pool, mission_id, event_class, risk_level, true, reason, evidence).await {
        eprintln!("(warning: failed to log security_event: {e})");
    }
}
