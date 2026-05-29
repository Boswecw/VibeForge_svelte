use std::env;
use std::path::{Path, PathBuf};

#[path = "../governance_model/mod.rs"]
mod governance_model;

use governance_model::stateforge_export::write_stateforge_model_json;

const DEFAULT_OUTPUT_REL_PATH: &str = "tools/stateforge/fixtures/model.generated.json";

fn parse_out_arg(args: &[String]) -> Result<Option<String>, String> {
    let mut out: Option<String> = None;
    let mut i = 0usize;

    while i < args.len() {
        let token = &args[i];
        if let Some(value) = token.strip_prefix("--out=") {
            if value.trim().is_empty() {
                return Err("--out value must not be empty".to_string());
            }
            out = Some(value.to_string());
            i += 1;
            continue;
        }

        if token == "--out" {
            let next = args
                .get(i + 1)
                .ok_or_else(|| "--out requires a value".to_string())?;
            if next.trim().is_empty() {
                return Err("--out value must not be empty".to_string());
            }
            out = Some(next.to_string());
            i += 2;
            continue;
        }

        return Err(format!("unknown argument '{token}'"));
    }

    Ok(out)
}

fn repo_root_from_manifest_dir() -> Result<PathBuf, String> {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    manifest_dir
        .parent()
        .map(Path::to_path_buf)
        .ok_or_else(|| format!("failed to derive repo root from {}", manifest_dir.display()))
}

fn resolve_out_path(raw_out: Option<String>, repo_root: &Path) -> PathBuf {
    match raw_out {
        Some(path) => {
            let candidate = PathBuf::from(path);
            if candidate.is_absolute() {
                candidate
            } else {
                repo_root.join(candidate)
            }
        }
        None => repo_root.join(DEFAULT_OUTPUT_REL_PATH),
    }
}

fn run() -> Result<PathBuf, String> {
    let cli_args: Vec<String> = env::args().skip(1).collect();
    let out_arg = parse_out_arg(&cli_args)?;
    let repo_root = repo_root_from_manifest_dir()?;
    let out_path = resolve_out_path(out_arg, &repo_root);

    write_stateforge_model_json(&out_path).map_err(|e| {
        format!(
            "failed to export StateForge model to {}: {e}",
            out_path.display()
        )
    })?;

    Ok(out_path)
}

fn main() {
    match run() {
        Ok(path) => {
            println!("stateforge-model-export path={}", path.display());
        }
        Err(err) => {
            eprintln!("stateforge-model-export ERROR: {err}");
            std::process::exit(1);
        }
    }
}
