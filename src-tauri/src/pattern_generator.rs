use handlebars::Handlebars;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::io::Write;

// ============================================================================
// TYPE DEFINITIONS (matching frontend TypeScript types)
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct ArchitecturePatternConfig {
    pub pattern_id: String,
    pub pattern_name: String,
    pub project_name: String,
    pub project_description: String,
    pub project_path: String,
    pub components: Vec<ComponentGenerationConfig>,
    pub features: FeatureFlags,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ComponentGenerationConfig {
    pub id: String,
    pub role: String,  // "backend", "frontend", "database"
    pub name: String,
    pub language: String,
    pub framework: String,
    pub location: String,  // relative path within project
    pub scaffolding: ScaffoldingConfig,
    pub custom_config: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScaffoldingConfig {
    pub directories: Vec<DirectoryDef>,
    pub files: Vec<FileDef>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DirectoryDef {
    pub path: String,
    pub description: Option<String>,
    pub subdirectories: Option<Vec<DirectoryDef>>,
    pub files: Option<Vec<FileDef>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileDef {
    pub path: String,
    pub content: String,
    pub template_engine: String,  // "handlebars", "none"
    pub overwritable: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FeatureFlags {
    pub testing: bool,
    pub linting: bool,
    pub git: bool,
    pub docker: bool,
    pub ci: bool,
}

#[derive(Debug, Serialize)]
pub struct PatternGenerationResult {
    pub success: bool,
    pub project_path: String,
    pub message: String,
    pub files_created: usize,
    pub components_generated: Vec<String>,
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

pub fn generate_pattern_project(config: ArchitecturePatternConfig) -> Result<PatternGenerationResult, String> {
    println!("Generating architecture pattern project: {}", config.project_name);
    println!("Pattern: {} ({})", config.pattern_name, config.pattern_id);
    println!("Components: {}", config.components.len());

    // Validate config
    if config.project_name.is_empty() {
        return Err("Project name is required".to_string());
    }

    if config.components.is_empty() {
        return Err("At least one component is required".to_string());
    }

    // Create project root directory
    let project_path = PathBuf::from(&config.project_path).join(&config.project_name);

    if project_path.exists() {
        return Err(format!("Directory '{}' already exists", config.project_name));
    }

    // Initialize Handlebars template engine
    let mut handlebars = Handlebars::new();
    handlebars.set_strict_mode(false);  // Allow missing variables

    // Create template context
    let template_context = create_template_context(&config);

    // Generate each component
    let mut total_files = 0;
    let mut components_generated = Vec::new();

    for component in &config.components {
        println!("Generating component: {} ({})", component.name, component.id);

        let component_path = project_path.join(&component.location);
        let files_created = generate_component(
            &component_path,
            component,
            &handlebars,
            &template_context
        )?;

        total_files += files_created;
        components_generated.push(component.id.clone());
    }

    // Generate root-level files
    total_files += generate_root_files(&project_path, &config, &handlebars, &template_context)?;

    // Initialize git if enabled
    if config.features.git {
        init_git_repository(&project_path)?;
        total_files += 1;  // .git
    }

    Ok(PatternGenerationResult {
        success: true,
        project_path: project_path.to_string_lossy().to_string(),
        message: format!("Project '{}' generated successfully with {} components!", config.project_name, components_generated.len()),
        files_created: total_files,
        components_generated,
    })
}

// ============================================================================
// COMPONENT GENERATION
// ============================================================================

fn generate_component(
    base_path: &Path,
    component: &ComponentGenerationConfig,
    handlebars: &Handlebars,
    context: &HashMap<String, serde_json::Value>,
) -> Result<usize, String> {
    let mut files_created = 0;

    // Create component root directory
    fs::create_dir_all(base_path)
        .map_err(|e| format!("Failed to create component directory: {}", e))?;
    files_created += 1;

    // Create directories
    for dir in &component.scaffolding.directories {
        files_created += create_directory_structure(base_path, dir, handlebars, context)?;
    }

    // Create files
    for file_def in &component.scaffolding.files {
        create_file(base_path, file_def, handlebars, context)?;
        files_created += 1;
    }

    Ok(files_created)
}

fn create_directory_structure(
    base_path: &Path,
    dir_def: &DirectoryDef,
    handlebars: &Handlebars,
    context: &HashMap<String, serde_json::Value>,
) -> Result<usize, String> {
    let mut files_created = 0;

    let dir_path = base_path.join(&dir_def.path);
    fs::create_dir_all(&dir_path)
        .map_err(|e| format!("Failed to create directory {}: {}", dir_def.path, e))?;
    files_created += 1;

    // Create subdirectories recursively
    if let Some(ref subdirs) = dir_def.subdirectories {
        for subdir in subdirs {
            let subdir_path = dir_path.join(&subdir.path);
            fs::create_dir_all(&subdir_path)
                .map_err(|e| format!("Failed to create subdirectory {}: {}", subdir.path, e))?;
            files_created += 1;
        }
    }

    // Create files in this directory
    if let Some(ref files) = dir_def.files {
        for file_def in files {
            create_file(&dir_path, file_def, handlebars, context)?;
            files_created += 1;
        }
    }

    Ok(files_created)
}

fn create_file(
    base_path: &Path,
    file_def: &FileDef,
    handlebars: &Handlebars,
    context: &HashMap<String, serde_json::Value>,
) -> Result<(), String> {
    let file_path = base_path.join(&file_def.path);

    // Check if file exists and is not overwritable
    if file_path.exists() && !file_def.overwritable {
        return Ok(());  // Skip non-overwritable existing files
    }

    // Create parent directories if needed
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directory: {}", e))?;
    }

    // Render content
    let content = match file_def.template_engine.as_str() {
        "handlebars" => {
            render_template(handlebars, &file_def.content, context)?
        }
        "none" | _ => file_def.content.clone(),
    };

    // Write file
    let mut file = fs::File::create(&file_path)
        .map_err(|e| format!("Failed to create file {}: {}", file_def.path, e))?;

    file.write_all(content.as_bytes())
        .map_err(|e| format!("Failed to write file {}: {}", file_def.path, e))?;

    Ok(())
}

// ============================================================================
// ROOT-LEVEL FILES
// ============================================================================

fn generate_root_files(
    project_path: &Path,
    config: &ArchitecturePatternConfig,
    handlebars: &Handlebars,
    context: &HashMap<String, serde_json::Value>,
) -> Result<usize, String> {
    let mut files_created = 0;

    // Generate README.md
    let readme_content = generate_readme(config, handlebars, context)?;
    let readme_path = project_path.join("README.md");
    fs::write(&readme_path, readme_content)
        .map_err(|e| format!("Failed to create README.md: {}", e))?;
    files_created += 1;

    // Generate .gitignore
    let gitignore_content = generate_gitignore(config);
    let gitignore_path = project_path.join(".gitignore");
    fs::write(&gitignore_path, gitignore_content)
        .map_err(|e| format!("Failed to create .gitignore: {}", e))?;
    files_created += 1;

    // Generate LICENSE if needed
    let license_content = generate_license();
    let license_path = project_path.join("LICENSE");
    fs::write(&license_path, license_content)
        .map_err(|e| format!("Failed to create LICENSE: {}", e))?;
    files_created += 1;

    Ok(files_created)
}

fn generate_readme(
    config: &ArchitecturePatternConfig,
    handlebars: &Handlebars,
    context: &HashMap<String, serde_json::Value>,
) -> Result<String, String> {
    let template = format!(
        r#"# {{{{projectName}}}}

{{{{projectDescription}}}}

## Architecture Pattern: {{{{patternName}}}}

This project was generated using the **{{{{patternName}}}}** architecture pattern.

## Components

{}

## Getting Started

### Prerequisites

{}

### Installation

{}

### Development

{}

## Project Structure

```
{{{{projectName}}}}/
{}
```

## License

MIT

---

Generated by VibeForge
"#,
        render_components_list(config),
        render_prerequisites(config),
        render_installation_steps(config),
        render_development_steps(config),
        render_directory_tree(config)
    );

    render_template(handlebars, &template, context)
}

fn render_components_list(config: &ArchitecturePatternConfig) -> String {
    config.components
        .iter()
        .map(|c| format!("- **{}** ({}/{}): {}", c.name, c.language, c.framework, c.location))
        .collect::<Vec<_>>()
        .join("\n")
}

fn render_prerequisites(config: &ArchitecturePatternConfig) -> String {
    let mut prereqs = Vec::new();

    for component in &config.components {
        match component.language.as_str() {
            "typescript" | "javascript" => prereqs.push("- Node.js 18+ and npm/pnpm"),
            "python" => prereqs.push("- Python 3.11+"),
            "rust" => prereqs.push("- Rust 1.70+ and Cargo"),
            "go" => prereqs.push("- Go 1.21+"),
            _ => {}
        }
    }

    prereqs.dedup();
    prereqs.join("\n")
}

fn render_installation_steps(config: &ArchitecturePatternConfig) -> String {
    let mut steps = Vec::new();

    for component in &config.components {
        steps.push(format!("**{}:**", component.name));
        steps.push("```bash".to_string());
        steps.push(format!("cd {}", component.location));

        match component.language.as_str() {
            "typescript" | "javascript" => steps.push("npm install".to_string()),
            "python" => {
                steps.push("python -m venv venv".to_string());
                steps.push("source venv/bin/activate".to_string());
                steps.push("pip install -r requirements.txt".to_string());
            }
            "rust" => steps.push("cargo fetch".to_string()),
            _ => {}
        }

        steps.push("```".to_string());
        steps.push("".to_string());
    }

    steps.join("\n")
}

fn render_development_steps(config: &ArchitecturePatternConfig) -> String {
    let mut steps = Vec::new();

    for (i, component) in config.components.iter().enumerate() {
        steps.push(format!("**Terminal {} - {}:**", i + 1, component.name));
        steps.push("```bash".to_string());
        steps.push(format!("cd {}", component.location));

        match component.language.as_str() {
            "typescript" | "javascript" => steps.push("npm run dev".to_string()),
            "python" => steps.push("uvicorn app.main:app --reload".to_string()),
            "rust" => steps.push("cargo run".to_string()),
            _ => {}
        }

        steps.push("```".to_string());
        steps.push("".to_string());
    }

    steps.join("\n")
}

fn render_directory_tree(config: &ArchitecturePatternConfig) -> String {
    let mut tree = Vec::new();

    for component in &config.components {
        tree.push(format!("├── {}/", component.location));
    }

    tree.push("├── README.md".to_string());
    tree.push("├── .gitignore".to_string());
    tree.push("└── LICENSE".to_string());

    tree.join("\n")
}

fn generate_gitignore(config: &ArchitecturePatternConfig) -> String {
    let mut lines = vec![
        "# OS".to_string(),
        ".DS_Store".to_string(),
        "Thumbs.db".to_string(),
        "".to_string(),
    ];

    for component in &config.components {
        match component.language.as_str() {
            "typescript" | "javascript" => {
                lines.extend(vec![
                    format!("# {}", component.name),
                    format!("{}/node_modules/", component.location),
                    format!("{}/.svelte-kit/", component.location),
                    format!("{}/build/", component.location),
                    format!("{}/.env", component.location),
                    "".to_string(),
                ]);
            }
            "python" => {
                lines.extend(vec![
                    format!("# {}", component.name),
                    format!("{}/venv/", component.location),
                    format!("{}/__pycache__/", component.location),
                    format!("{}/*.pyc", component.location),
                    format!("{}/.env", component.location),
                    "".to_string(),
                ]);
            }
            "rust" => {
                lines.extend(vec![
                    format!("# {}", component.name),
                    format!("{}/target/", component.location),
                    format!("{}/Cargo.lock", component.location),
                    "".to_string(),
                ]);
            }
            _ => {}
        }
    }

    lines.join("\n")
}

fn generate_license() -> String {
    r#"MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"#.to_string()
}

// ============================================================================
// TEMPLATE RENDERING
// ============================================================================

fn create_template_context(config: &ArchitecturePatternConfig) -> HashMap<String, serde_json::Value> {
    let mut context = HashMap::new();

    context.insert("projectName".to_string(), serde_json::json!(config.project_name));
    context.insert("projectDescription".to_string(), serde_json::json!(config.project_description));
    context.insert("patternName".to_string(), serde_json::json!(config.pattern_name));
    context.insert("patternId".to_string(), serde_json::json!(config.pattern_id));

    // Feature flags
    context.insert("includeTests".to_string(), serde_json::json!(config.features.testing));
    context.insert("includeLinting".to_string(), serde_json::json!(config.features.linting));
    context.insert("includeGit".to_string(), serde_json::json!(config.features.git));
    context.insert("includeDocker".to_string(), serde_json::json!(config.features.docker));
    context.insert("includeCi".to_string(), serde_json::json!(config.features.ci));
    context.insert("includeDatabase".to_string(), serde_json::json!(
        config.components.iter().any(|c| c.role == "database")
    ));

    context
}

fn render_template(
    handlebars: &Handlebars,
    template: &str,
    context: &HashMap<String, serde_json::Value>,
) -> Result<String, String> {
    handlebars
        .render_template(template, context)
        .map_err(|e| format!("Template rendering error: {}", e))
}

// ============================================================================
// GIT INITIALIZATION
// ============================================================================

fn init_git_repository(project_path: &Path) -> Result<(), String> {
    use std::process::Command;

    let output = Command::new("git")
        .arg("init")
        .current_dir(project_path)
        .output()
        .map_err(|e| format!("Failed to initialize git: {}", e))?;

    if !output.status.success() {
        return Err(format!("Git init failed: {}", String::from_utf8_lossy(&output.stderr)));
    }

    // Create initial commit
    Command::new("git")
        .args(&["add", "."])
        .current_dir(project_path)
        .output()
        .map_err(|e| format!("Failed to stage files: {}", e))?;

    Command::new("git")
        .args(&["commit", "-m", "Initial commit from VibeForge"])
        .current_dir(project_path)
        .output()
        .map_err(|e| format!("Failed to create initial commit: {}", e))?;

    Ok(())
}
