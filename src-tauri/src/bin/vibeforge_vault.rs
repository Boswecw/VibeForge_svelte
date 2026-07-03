//! VibeForge Local Evidence Vault CLI (Epic 1 scope).
//!
//! Follows the same secondary-binary pattern as `export_stateforge_model.rs`:
//! no `lib.rs`, modules are pulled in directly via `#[path]`.
//!
//! This binary is deliberately scoped to Epic 1's commands only
//! (`vault migrate/status/backup/restore`, top-level `doctor`). It's expected
//! to be absorbed into a unified `vibeforge` CLI (the full multi-noun surface
//! sketched in docs/plans/05_CONTRACTS_AND_APIS.md) in a later epic, once
//! mission/board/patch commands exist to justify one.

#[path = "../vault/mod.rs"]
mod vault;

use anyhow::{bail, Context, Result};
use clap::{Parser, Subcommand};
use std::path::{Path, PathBuf};
use std::process::{Command, ExitCode};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Parser)]
#[command(
    name = "vibeforge_vault",
    about = "VibeForge Local Evidence Vault CLI (Epic 1: migrate/status/backup/restore/doctor)"
)]
struct Cli {
    #[command(subcommand)]
    command: TopCommand,
}

#[derive(Subcommand)]
enum TopCommand {
    /// Vault lifecycle: migrate, status, backup, restore
    Vault {
        #[command(subcommand)]
        command: VaultCommand,
    },
    /// Read-only health checks (connectivity, migration drift, table existence, orphan refs)
    Doctor,
}

#[derive(Subcommand)]
enum VaultCommand {
    /// Apply pending migrations
    Migrate,
    /// Report connection health, applied migrations, and row counts
    Status,
    /// Back up the vault database to a file (pg_dump custom format)
    Backup {
        #[arg(long)]
        out: PathBuf,
    },
    /// Restore a backup into a scratch database. Add --replace --yes to promote
    /// it to the live vault only after verification passes.
    Restore {
        #[arg(long = "in")]
        input: PathBuf,
        #[arg(long)]
        replace: bool,
        #[arg(long)]
        yes: bool,
    },
}

#[tokio::main]
async fn main() -> ExitCode {
    let cli = Cli::parse();
    let database_url = vault::database_url();

    let result = match cli.command {
        TopCommand::Vault { command } => match command {
            VaultCommand::Migrate => run_migrate(&database_url).await,
            VaultCommand::Status => run_status(&database_url).await,
            VaultCommand::Backup { out } => run_backup(&database_url, &out).await,
            VaultCommand::Restore {
                input,
                replace,
                yes,
            } => run_restore(&database_url, &input, replace, yes).await,
        },
        TopCommand::Doctor => run_doctor(&database_url).await,
    };

    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("Error: {e:#}");
            ExitCode::FAILURE
        }
    }
}

async fn run_migrate(database_url: &str) -> Result<()> {
    let pool = vault::create_pool(database_url)
        .await
        .context("connecting to vault database")?;
    vault::run_migrations(&pool)
        .await
        .context("running migrations")?;
    println!("Migrations applied.");
    Ok(())
}

async fn run_status(database_url: &str) -> Result<()> {
    let pool = vault::create_pool(database_url)
        .await
        .context("connecting to vault database")?;

    println!("Connected: {database_url}");

    let migrations = vault::applied_migrations(&pool)
        .await
        .context("reading applied migrations (has `vault migrate` been run?)")?;
    println!("\nSchema Migrations:");
    for m in &migrations {
        println!(
            "  {:>4}  {}  {}  {}",
            m.version,
            if m.success { "ok  " } else { "FAIL" },
            m.installed_on,
            m.description
        );
    }

    println!("\nTable row counts:");
    for table in vault::VAULT_TABLES {
        let count = vault::table_row_count(&pool, table)
            .await
            .with_context(|| format!("counting rows in {table}"))?;
        println!("  {table:<28} {count}");
    }

    Ok(())
}

async fn run_backup(database_url: &str, out: &Path) -> Result<()> {
    println!("Backing up {database_url} -> {}", out.display());
    let status = Command::new("pg_dump")
        .arg(database_url)
        .args(["-Fc", "--no-owner", "--no-privileges", "-f"])
        .arg(out)
        .status()
        .context("spawning pg_dump (is it installed and on PATH?)")?;

    if !status.success() {
        bail!("pg_dump exited with {status}");
    }
    println!("Backup written to {}", out.display());
    Ok(())
}

async fn run_restore(database_url: &str, input: &Path, replace: bool, yes: bool) -> Result<()> {
    if replace && !yes {
        bail!("--replace requires --yes to confirm (this can overwrite the live vault)");
    }
    if !input.exists() {
        bail!("backup file not found: {}", input.display());
    }

    let timestamp = unix_timestamp();
    let live_db = db_name(database_url);
    let scratch_db = format!("{live_db}_restore_{timestamp}");
    let maintenance_url = with_database_name(database_url, "postgres");
    let scratch_url = with_database_name(database_url, &scratch_db);

    println!("Creating scratch database {scratch_db}...");
    let maint_pool = vault::create_pool(&maintenance_url)
        .await
        .context("connecting to the postgres maintenance database")?;
    sqlx::query(&format!(r#"CREATE DATABASE "{scratch_db}""#))
        .execute(&maint_pool)
        .await
        .context("creating scratch database")?;
    maint_pool.close().await;

    println!("Restoring {} into {scratch_db}...", input.display());
    let status = Command::new("pg_restore")
        .arg(format!("--dbname={scratch_url}"))
        .arg(input)
        .status()
        .context("spawning pg_restore (is it installed and on PATH?)")?;
    if !status.success() {
        bail!(
            "pg_restore exited with {status}; scratch database {scratch_db} left in place for inspection"
        );
    }

    println!("Verifying restored data...");
    let scratch_pool = vault::create_pool(&scratch_url)
        .await
        .context("connecting to scratch database for verification")?;
    let report = vault::doctor::run_checks(&scratch_pool).await;
    scratch_pool.close().await;

    for check in &report.checks {
        println!(
            "  [{}] {}: {}",
            if check.status == vault::doctor::CheckStatus::Passed {
                "PASS"
            } else {
                "FAIL"
            },
            check.id,
            check.detail
        );
    }

    if report.status != vault::doctor::CheckStatus::Passed {
        bail!(
            "verification failed; scratch database {scratch_db} left in place for inspection, live vault untouched"
        );
    }
    println!("Verification passed.");

    if !replace {
        println!(
            "Restore verified in scratch database {scratch_db}. Re-run with --replace --yes to promote it to the live vault."
        );
        return Ok(());
    }

    let pre_restore_db = format!("{live_db}_pre_restore_{timestamp}");
    println!(
        "Promoting {scratch_db} to {live_db} (renaming current {live_db} to {pre_restore_db}, not dropping it)..."
    );
    let maint_pool = vault::create_pool(&maintenance_url)
        .await
        .context("connecting to the postgres maintenance database")?;
    sqlx::query(&format!(r#"ALTER DATABASE "{live_db}" RENAME TO "{pre_restore_db}""#))
        .execute(&maint_pool)
        .await
        .context("renaming live database aside (are there other open connections to it?)")?;
    sqlx::query(&format!(r#"ALTER DATABASE "{scratch_db}" RENAME TO "{live_db}""#))
        .execute(&maint_pool)
        .await
        .context("promoting scratch database to live name")?;
    maint_pool.close().await;

    println!("Done. Previous data preserved as database {pre_restore_db} (not dropped).");
    Ok(())
}

async fn run_doctor(database_url: &str) -> Result<()> {
    let pool = vault::create_pool(database_url)
        .await
        .context("connecting to vault database")?;
    let report = vault::doctor::run_checks(&pool).await;

    for check in &report.checks {
        println!(
            "[{}] {}: {}",
            if check.status == vault::doctor::CheckStatus::Passed {
                "PASS"
            } else {
                "FAIL"
            },
            check.id,
            check.detail
        );
    }

    if report.status != vault::doctor::CheckStatus::Passed {
        let failed = report
            .checks
            .iter()
            .filter(|c| c.status != vault::doctor::CheckStatus::Passed)
            .count();
        bail!("{failed} of {} checks failed", report.checks.len());
    }

    println!("All checks passed.");
    Ok(())
}

fn unix_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock is before the Unix epoch")
        .as_secs()
}

fn db_name(database_url: &str) -> &str {
    database_url.rsplit_once('/').map_or("vibeforge", |(_, db)| db)
}

fn with_database_name(database_url: &str, db_name: &str) -> String {
    let (base, _old_db) = database_url
        .rsplit_once('/')
        .expect("DATABASE_URL must contain a path segment");
    format!("{base}/{db_name}")
}
