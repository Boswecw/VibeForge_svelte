/**
 * CLI Tool Architecture Pattern
 *
 * Command-line interface application with argument parsing,
 * subcommands, configuration, and cross-platform distribution.
 */

import type { ArchitecturePattern } from '$lib/workbench/types/architecture';

// ============================================================================
// TEMPLATES
// ============================================================================

const cargoTomlTemplate = `[package]
name = "{{projectName}}"
version = "0.1.0"
edition = "2021"
authors = ["{{author}}"]
description = "{{description}}"

[[bin]]
name = "{{projectName}}"
path = "src/main.rs"

[dependencies]
clap = { version = "4.4", features = ["derive", "cargo"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
anyhow = "1.0"
thiserror = "1.0"
colored = "2.0"
env_logger = "0.11"
log = "0.4"
dirs = "5.0"

[dev-dependencies]
assert_cmd = "2.0"
predicates = "3.0"
tempfile = "3.8"

[profile.release]
opt-level = "z"
lto = true
codegen-units = 1
strip = true
`;

const mainRsTemplate = `use anyhow::Result;
use clap::{Parser, Subcommand};
use colored::*;
use log::{error, info};

mod commands;
mod config;
mod utils;

use commands::{init, run, status};
use config::Config;

/// {{description}}
#[derive(Parser)]
#[command(name = "{{projectName}}")]
#[command(version, about, long_about = None)]
struct Cli {
    /// Set log level (error, warn, info, debug, trace)
    #[arg(short, long, default_value = "info")]
    log_level: String,

    /// Use custom config file
    #[arg(short, long)]
    config: Option<String>,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Initialize a new project
    Init {
        /// Project name
        name: String,

        /// Project directory
        #[arg(short, long, default_value = ".")]
        path: String,
    },

    /// Run the main process
    Run {
        /// Enable verbose output
        #[arg(short, long)]
        verbose: bool,

        /// Dry run mode
        #[arg(short = 'n', long)]
        dry_run: bool,
    },

    /// Check current status
    Status {
        /// Output format (text, json)
        #[arg(short, long, default_value = "text")]
        format: String,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    // Initialize logger
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or(&cli.log_level))
        .init();

    // Load configuration
    let config = if let Some(config_path) = cli.config {
        Config::from_file(&config_path)?
    } else {
        Config::default()
    };

    info!("Starting {{projectName}}...");

    // Execute command
    let result = match cli.command {
        Commands::Init { name, path } => {
            init::execute(&name, &path, &config)
        }
        Commands::Run { verbose, dry_run } => {
            run::execute(verbose, dry_run, &config)
        }
        Commands::Status { format } => {
            status::execute(&format, &config)
        }
    };

    match result {
        Ok(_) => {
            println!("{}", "✓ Command completed successfully".green());
            Ok(())
        }
        Err(e) => {
            error!("Command failed: {}", e);
            eprintln!("{} {}", "✗ Error:".red().bold(), e);
            std::process::exit(1);
        }
    }
}
`;

const configRsTemplate = `use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub app_name: String,
    pub version: String,
    pub settings: Settings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub verbose: bool,
    pub output_format: String,
    pub custom_value: Option<String>,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            app_name: env!("CARGO_PKG_NAME").to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            settings: Settings {
                verbose: false,
                output_format: "text".to_string(),
                custom_value: None,
            },
        }
    }
}

impl Config {
    /// Load configuration from file
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
        let contents = fs::read_to_string(path)?;
        let config: Config = serde_json::from_str(&contents)?;
        Ok(config)
    }

    /// Save configuration to file
    pub fn save<P: AsRef<Path>>(&self, path: P) -> Result<()> {
        let contents = serde_json::to_string_pretty(self)?;
        fs::write(path, contents)?;
        Ok(())
    }

    /// Get config directory path
    pub fn config_dir() -> Result<std::path::PathBuf> {
        if let Some(dir) = dirs::config_dir() {
            let app_dir = dir.join(env!("CARGO_PKG_NAME"));
            if !app_dir.exists() {
                fs::create_dir_all(&app_dir)?;
            }
            Ok(app_dir)
        } else {
            anyhow::bail!("Could not determine config directory")
        }
    }
}
`;

const initCommandTemplate = `use anyhow::Result;
use colored::*;
use log::info;
use std::fs;
use std::path::Path;

use crate::config::Config;

pub fn execute(name: &str, path: &str, _config: &Config) -> Result<()> {
    info!("Initializing project: {}", name);

    let project_path = Path::new(path).join(name);

    if project_path.exists() {
        anyhow::bail!("Directory already exists: {}", project_path.display());
    }

    // Create project directory
    fs::create_dir_all(&project_path)?;
    println!("Created directory: {}", project_path.display().to_string().cyan());

    // Create subdirectories
    for dir in &["src", "tests", "docs"] {
        fs::create_dir_all(project_path.join(dir))?;
    }

    // Create README
    let readme = format!(
        "# {}\\n\\nCreated with {{{{projectName}}}}\\n",
        name
    );
    fs::write(project_path.join("README.md"), readme)?;

    // Create .gitignore
    let gitignore = "target/\\n*.log\\n.env\\n";
    fs::write(project_path.join(".gitignore"), gitignore)?;

    println!("{}", format!("✓ Initialized project: {}", name).green());
    println!("\\nNext steps:");
    println!("  cd {}", name);
    println!("  # Start working on your project!");

    Ok(())
}
`;

const runCommandTemplate = `use anyhow::Result;
use colored::*;
use log::{debug, info};

use crate::config::Config;

pub fn execute(verbose: bool, dry_run: bool, config: &Config) -> Result<()> {
    if verbose {
        debug!("Running in verbose mode");
    }

    if dry_run {
        println!("{}", "Running in dry-run mode".yellow());
    }

    info!("Executing main process...");
    println!("Config: {}", serde_json::to_string_pretty(config)?);

    // TODO: Implement your main logic here
    println!("\\n{}", "Processing...".cyan());

    if !dry_run {
        // Actual work would happen here
        std::thread::sleep(std::time::Duration::from_secs(1));
    }

    println!("{}", "✓ Process completed".green());

    Ok(())
}
`;

const statusCommandTemplate = `use anyhow::Result;
use colored::*;
use serde_json::json;

use crate::config::Config;

pub fn execute(format: &str, config: &Config) -> Result<()> {
    let status_data = json!({
        "status": "running",
        "version": config.version,
        "uptime": "1h 23m",
        "healthy": true
    });

    match format {
        "json" => {
            println!("{}", serde_json::to_string_pretty(&status_data)?);
        }
        "text" | _ => {
            println!("{}", "Status Information".bold());
            println!("━━━━━━━━━━━━━━━━━━");
            println!("Status: {}", "running".green());
            println!("Version: {}", config.version);
            println!("Uptime: 1h 23m");
            println!("Health: {}", "✓ healthy".green());
        }
    }

    Ok(())
}
`;

const utilsRsTemplate = `use anyhow::Result;
use std::fs;
use std::path::Path;

/// Check if a file exists
pub fn file_exists<P: AsRef<Path>>(path: P) -> bool {
    path.as_ref().exists()
}

/// Read file to string
pub fn read_file<P: AsRef<Path>>(path: P) -> Result<String> {
    Ok(fs::read_to_string(path)?)
}

/// Write string to file
pub fn write_file<P: AsRef<Path>>(path: P, contents: &str) -> Result<()> {
    fs::write(path, contents)?;
    Ok(())
}

/// Get timestamp as string
pub fn timestamp() -> String {
    chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_file_operations() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.txt");

        write_file(&file_path, "test content").unwrap();
        assert!(file_exists(&file_path));

        let content = read_file(&file_path).unwrap();
        assert_eq!(content, "test content");
    }
}
`;

const readmeTemplate = `# {{projectName}}

{{description}}

## Installation

\`\`\`bash
cargo install {{projectName}}
\`\`\`

Or build from source:

\`\`\`bash
git clone https://github.com/{{author}}/{{projectName}}
cd {{projectName}}
cargo build --release
\`\`\`

## Usage

\`\`\`bash
# Initialize a new project
{{projectName}} init my-project

# Run the main command
{{projectName}} run

# Check status
{{projectName}} status

# Get help
{{projectName}} --help
\`\`\`

## Commands

### \`init\`

Initialize a new project with directory structure.

\`\`\`bash
{{projectName}} init my-project [--path /custom/path]
\`\`\`

### \`run\`

Execute the main process.

\`\`\`bash
{{projectName}} run [--verbose] [--dry-run]
\`\`\`

### \`status\`

Display current status information.

\`\`\`bash
{{projectName}} status [--format text|json]
\`\`\`

## Configuration

Create a config file at \`~/.config/{{projectName}}/config.json\`:

\`\`\`json
{
  "app_name": "{{projectName}}",
  "version": "0.1.0",
  "settings": {
    "verbose": false,
    "output_format": "text",
    "custom_value": null
  }
}
\`\`\`

## Development

\`\`\`bash
# Run in development mode
cargo run -- init test-project

# Run tests
cargo test

# Build release binary
cargo build --release

# Install locally
cargo install --path .
\`\`\`

## Testing

\`\`\`bash
# Run all tests
cargo test

# Run with output
cargo test -- --nocapture

# Run specific test
cargo test test_init
\`\`\`

## License

MIT
`;

// ============================================================================
// CLI TOOL PATTERN DEFINITION
// ============================================================================

export const cliToolPattern: ArchitecturePattern = {
	id: 'cli-tool',
	name: 'cli-tool',
	displayName: 'CLI Tool',
	description: 'Command-line interface application with subcommands and configuration',
	category: 'cli',
	icon: '⌨️',

	components: [
		{
			id: 'cli',
			role: 'cli',
			name: 'CLI Application',
			language: 'rust',
			framework: 'clap',
			location: '.',
			scaffolding: {
				directories: [
					{
						path: 'src',
						subdirectories: [
							{ path: 'commands' }
						],
						files: [
							{ path: 'main.rs', content: mainRsTemplate, templateEngine: 'handlebars', overwritable: false },
							{ path: 'config.rs', content: configRsTemplate, templateEngine: 'handlebars', overwritable: false },
							{ path: 'utils.rs', content: utilsRsTemplate, templateEngine: 'handlebars', overwritable: false }
						]
					},
					{
						path: 'src/commands',
						files: [
							{ path: 'mod.rs', content: 'pub mod init;\npub mod run;\npub mod status;\n', overwritable: false },
							{ path: 'init.rs', content: initCommandTemplate, templateEngine: 'handlebars', overwritable: false },
							{ path: 'run.rs', content: runCommandTemplate, templateEngine: 'handlebars', overwritable: false },
							{ path: 'status.rs', content: statusCommandTemplate, templateEngine: 'handlebars', overwritable: false }
						]
					},
					{ path: 'tests' },
					{ path: 'docs' }
				],
				files: [
					{ path: 'Cargo.toml', content: cargoTomlTemplate, templateEngine: 'handlebars', overwritable: false },
					{ path: 'README.md', content: readmeTemplate, templateEngine: 'handlebars', overwritable: false },
					{ path: '.gitignore', content: 'target/\n*.log\n.env\n.DS_Store\n', overwritable: false }
				],
				packageFiles: {},
				configFiles: {}
			},
			dependencies: []
		}
	],

	integration: {
		protocol: 'rest-api',
		sharedTypes: false,
		sharedConfig: true,
		generateBindings: []
	},

	complexity: 'simple',
	maturity: 'stable',
	popularity: 85,

	idealFor: [
		'Developer tools',
		'Build automation',
		'System utilities',
		'CI/CD scripts',
		'File processors',
		'Code generators',
		'Data transformers'
	],

	notIdealFor: [
		'Web applications',
		'Mobile apps',
		'Desktop GUI apps',
		'Real-time applications',
		'Large-scale services'
	],

	prerequisites: {
		tools: ['Rust', 'cargo'],
		knowledge: [
			'Rust basics',
			'Command-line interfaces',
			'Argument parsing',
			'Error handling'
		]
	},

	tags: ['cli', 'rust', 'clap', 'command-line', 'tool', 'automation', 'developer-tools']
};
