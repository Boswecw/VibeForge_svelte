/**
 * Runtime Detection System - Rust Implementation
 *
 * Analyzes project directories to detect technology stack
 * and recommend architecture patterns.
 */

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;

// ============================================================================
// TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TechnologyStack {
    pub primary_language: String,
    pub additional_languages: Vec<String>,
    pub frontend_framework: Option<String>,
    pub backend_framework: Option<String>,
    pub desktop_framework: Option<String>,
    pub build_tools: Vec<String>,
    pub databases: Vec<String>,
    pub structure: String,
    pub package_files: PackageFiles,
    pub config_files: ConfigFiles,
    pub confidence: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackageFiles {
    pub package_json: bool,
    pub cargo_toml: bool,
    pub requirements_txt: bool,
    pub poetry_lock: bool,
    pub go_mod: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigFiles {
    pub vite_config: bool,
    pub svelte_config: bool,
    pub tauri_config: bool,
    pub docker_compose: bool,
    pub dockerfile: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PatternRecommendation {
    pub pattern_id: String,
    pub score: u8,
    pub reasons: Vec<String>,
    pub warnings: Vec<String>,
    pub confidence: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecommendationResult {
    pub tech_stack: TechnologyStack,
    pub recommendations: Vec<PatternRecommendation>,
    pub metadata: AnalysisMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisMetadata {
    pub files_scanned: usize,
    pub duration: u64,
    pub timestamp: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeAnalysisOptions {
    pub project_path: String,
    #[serde(default = "default_max_depth")]
    pub max_depth: usize,
    #[serde(default)]
    pub exclude: Vec<String>,
    #[serde(default = "default_true")]
    pub analyze_dependencies: bool,
    #[serde(default = "default_true")]
    pub read_package_files: bool,
}

fn default_max_depth() -> usize {
    3
}

fn default_true() -> bool {
    true
}

// ============================================================================
// FILE INDICATORS
// ============================================================================

struct FileIndicator {
    pattern: &'static str,
    technology: &'static str,
    weight: u8,
}

const FILE_INDICATORS: &[FileIndicator] = &[
    // JavaScript/TypeScript
    FileIndicator {
        pattern: "package.json",
        technology: "javascript",
        weight: 10,
    },
    FileIndicator {
        pattern: "tsconfig.json",
        technology: "typescript",
        weight: 9,
    },
    // Python
    FileIndicator {
        pattern: "requirements.txt",
        technology: "python",
        weight: 9,
    },
    FileIndicator {
        pattern: "pyproject.toml",
        technology: "python",
        weight: 9,
    },
    FileIndicator {
        pattern: "poetry.lock",
        technology: "python",
        weight: 8,
    },
    // Rust
    FileIndicator {
        pattern: "Cargo.toml",
        technology: "rust",
        weight: 10,
    },
    FileIndicator {
        pattern: "Cargo.lock",
        technology: "rust",
        weight: 8,
    },
    // Go
    FileIndicator {
        pattern: "go.mod",
        technology: "go",
        weight: 10,
    },
    // Frameworks
    FileIndicator {
        pattern: "svelte.config.js",
        technology: "svelte",
        weight: 10,
    },
    FileIndicator {
        pattern: "vite.config.ts",
        technology: "vite",
        weight: 8,
    },
    FileIndicator {
        pattern: "src-tauri",
        technology: "tauri",
        weight: 10,
    },
    FileIndicator {
        pattern: "tauri.conf.json",
        technology: "tauri",
        weight: 10,
    },
    // Databases
    FileIndicator {
        pattern: "docker-compose.yml",
        technology: "docker",
        weight: 7,
    },
    FileIndicator {
        pattern: "Dockerfile",
        technology: "docker",
        weight: 6,
    },
];

// ============================================================================
// TECHNOLOGY DETECTOR
// ============================================================================

pub struct TechStackDetector {
    files_scanned: usize,
}

impl TechStackDetector {
    pub fn new() -> Self {
        Self { files_scanned: 0 }
    }

    pub fn detect(&mut self, options: &RuntimeAnalysisOptions) -> Result<TechnologyStack, String> {
        let project_path = Path::new(&options.project_path);

        if !project_path.exists() {
            return Err(format!("Project path does not exist: {}", options.project_path));
        }

        let mut detected_files: HashMap<String, bool> = HashMap::new();
        self.scan_directory(project_path, &mut detected_files, 0, options.max_depth, &options.exclude)?;

        // Analyze detected files
        let stack = self.analyze_files(&detected_files, options)?;

        Ok(stack)
    }

    fn scan_directory(
        &mut self,
        dir: &Path,
        detected: &mut HashMap<String, bool>,
        current_depth: usize,
        max_depth: usize,
        exclude: &[String],
    ) -> Result<(), String> {
        if current_depth > max_depth {
            return Ok(());
        }

        let entries = fs::read_dir(dir).map_err(|e| format!("Failed to read directory: {}", e))?;

        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let path = entry.path();
            let file_name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("");

            // Skip excluded directories
            if exclude.iter().any(|ex| file_name.contains(ex)) {
                continue;
            }

            // Skip common ignore directories
            if file_name == "node_modules"
                || file_name == "target"
                || file_name == ".git"
                || file_name == "dist"
                || file_name == "build"
                || file_name == "__pycache__"
            {
                continue;
            }

            if path.is_dir() {
                // Recursively scan subdirectories
                self.scan_directory(&path, detected, current_depth + 1, max_depth, exclude)?;
            } else {
                self.files_scanned += 1;
                detected.insert(file_name.to_string(), true);
            }
        }

        Ok(())
    }

    fn analyze_files(
        &self,
        detected: &HashMap<String, bool>,
        options: &RuntimeAnalysisOptions,
    ) -> Result<TechnologyStack, String> {
        let project_path = Path::new(&options.project_path);

        // Detect package files
        let package_files = PackageFiles {
            package_json: detected.contains_key("package.json"),
            cargo_toml: detected.contains_key("Cargo.toml"),
            requirements_txt: detected.contains_key("requirements.txt"),
            poetry_lock: detected.contains_key("poetry.lock"),
            go_mod: detected.contains_key("go.mod"),
        };

        // Detect config files
        let config_files = ConfigFiles {
            vite_config: detected.contains_key("vite.config.ts") || detected.contains_key("vite.config.js"),
            svelte_config: detected.contains_key("svelte.config.js"),
            tauri_config: detected.contains_key("tauri.conf.json"),
            docker_compose: detected.contains_key("docker-compose.yml") || detected.contains_key("docker-compose.yaml"),
            dockerfile: detected.contains_key("Dockerfile"),
        };

        // Determine primary language
        let primary_language = if package_files.cargo_toml {
            "rust"
        } else if package_files.package_json {
            if detected.contains_key("tsconfig.json") {
                "typescript"
            } else {
                "javascript"
            }
        } else if package_files.requirements_txt || package_files.poetry_lock {
            "python"
        } else if package_files.go_mod {
            "go"
        } else {
            "unknown"
        }
        .to_string();

        // Detect frameworks
        let (frontend_framework, backend_framework, desktop_framework) =
            self.detect_frameworks(&package_files, &config_files, project_path, options)?;

        // Detect build tools
        let build_tools = self.detect_build_tools(&package_files, &config_files);

        // Detect databases
        let databases = self.detect_databases(project_path, &config_files, options)?;

        // Determine structure
        let structure = self.detect_structure(&frontend_framework, &backend_framework, &config_files);

        // Calculate confidence
        let confidence = self.calculate_confidence(&package_files, &config_files);

        Ok(TechnologyStack {
            primary_language,
            additional_languages: vec![],
            frontend_framework,
            backend_framework,
            desktop_framework,
            build_tools,
            databases,
            structure,
            package_files,
            config_files,
            confidence,
        })
    }

    fn detect_frameworks(
        &self,
        package_files: &PackageFiles,
        config_files: &ConfigFiles,
        project_path: &Path,
        options: &RuntimeAnalysisOptions,
    ) -> Result<(Option<String>, Option<String>, Option<String>), String> {
        let mut frontend_framework = None;
        let mut backend_framework = None;
        let mut desktop_framework = None;

        // Desktop frameworks
        if config_files.tauri_config {
            desktop_framework = Some("tauri".to_string());
        }

        // Frontend frameworks
        if config_files.svelte_config {
            frontend_framework = Some(if config_files.vite_config {
                "sveltekit".to_string()
            } else {
                "svelte".to_string()
            });
        }

        // Backend frameworks (from package.json if available)
        if package_files.package_json && options.read_package_files {
            if let Ok(content) = fs::read_to_string(project_path.join("package.json")) {
                if content.contains("\"express\"") {
                    backend_framework = Some("express".to_string());
                }
            }
        }

        // Backend frameworks (from Python)
        if package_files.requirements_txt && options.read_package_files {
            if let Ok(content) = fs::read_to_string(project_path.join("requirements.txt")) {
                if content.contains("fastapi") {
                    backend_framework = Some("fastapi".to_string());
                } else if content.contains("flask") {
                    backend_framework = Some("flask".to_string());
                } else if content.contains("django") {
                    backend_framework = Some("django".to_string());
                }
            }
        }

        Ok((frontend_framework, backend_framework, desktop_framework))
    }

    fn detect_build_tools(&self, package_files: &PackageFiles, config_files: &ConfigFiles) -> Vec<String> {
        let mut tools = Vec::new();

        if config_files.vite_config {
            tools.push("vite".to_string());
        }
        if package_files.package_json {
            tools.push("npm".to_string());
        }
        if package_files.cargo_toml {
            tools.push("cargo".to_string());
        }
        if package_files.poetry_lock {
            tools.push("poetry".to_string());
        } else if package_files.requirements_txt {
            tools.push("pip".to_string());
        }

        tools
    }

    fn detect_databases(
        &self,
        project_path: &Path,
        config_files: &ConfigFiles,
        options: &RuntimeAnalysisOptions,
    ) -> Result<Vec<String>, String> {
        let mut databases = Vec::new();

        // Check docker-compose for databases
        if config_files.docker_compose && options.read_package_files {
            if let Ok(content) = fs::read_to_string(project_path.join("docker-compose.yml"))
                .or_else(|_| fs::read_to_string(project_path.join("docker-compose.yaml")))
            {
                if content.contains("postgres") || content.contains("postgresql") {
                    databases.push("postgresql".to_string());
                }
                if content.contains("mysql") {
                    databases.push("mysql".to_string());
                }
                if content.contains("mongodb") || content.contains("mongo") {
                    databases.push("mongodb".to_string());
                }
                if content.contains("redis") {
                    databases.push("redis".to_string());
                }
            }
        }

        if databases.is_empty() {
            databases.push("none".to_string());
        }

        Ok(databases)
    }

    fn detect_structure(
        &self,
        frontend: &Option<String>,
        backend: &Option<String>,
        config_files: &ConfigFiles,
    ) -> String {
        if config_files.docker_compose {
            "multi-service".to_string()
        } else if frontend.is_some() && backend.is_some() {
            "monorepo".to_string()
        } else {
            "single-app".to_string()
        }
    }

    fn calculate_confidence(&self, package_files: &PackageFiles, config_files: &ConfigFiles) -> u8 {
        let mut confidence = 50;

        // Boost confidence for clear indicators
        if package_files.package_json {
            confidence += 10;
        }
        if package_files.cargo_toml {
            confidence += 10;
        }
        if config_files.svelte_config {
            confidence += 10;
        }
        if config_files.tauri_config {
            confidence += 10;
        }
        if config_files.vite_config {
            confidence += 5;
        }

        confidence.min(100)
    }
}

// ============================================================================
// PATTERN RECOMMENDER
// ============================================================================

pub struct PatternRecommender;

impl PatternRecommender {
    pub fn new() -> Self {
        Self
    }

    pub fn recommend(&self, stack: &TechnologyStack) -> Vec<PatternRecommendation> {
        let mut recommendations = Vec::new();

        // Desktop app pattern
        if stack.desktop_framework == Some("tauri".to_string()) {
            recommendations.push(self.recommend_desktop(stack));
        }

        // Full-stack web pattern
        if stack.frontend_framework.is_some() && stack.backend_framework.is_some() {
            recommendations.push(self.recommend_fullstack(stack));
        }

        // Microservices pattern
        if stack.structure == "multi-service" {
            recommendations.push(self.recommend_microservices(stack));
        }

        // REST API backend pattern
        if stack.backend_framework.is_some() && stack.frontend_framework.is_none() {
            recommendations.push(self.recommend_rest_api(stack));
        }

        // Static site pattern
        if stack.frontend_framework == Some("sveltekit".to_string())
            && stack.backend_framework.is_none()
        {
            recommendations.push(self.recommend_static_site(stack));
        }

        // SPA pattern
        if stack.frontend_framework == Some("svelte".to_string())
            && stack.config_files.vite_config
            && stack.backend_framework.is_none()
        {
            recommendations.push(self.recommend_spa(stack));
        }

        // Sort by score
        recommendations.sort_by(|a, b| b.score.cmp(&a.score));

        recommendations
    }

    fn recommend_desktop(&self, stack: &TechnologyStack) -> PatternRecommendation {
        let mut score = 0;
        let mut reasons = Vec::new();
        let mut warnings = Vec::new();

        if stack.desktop_framework == Some("tauri".to_string()) {
            score += 40;
            reasons.push("Tauri framework detected".to_string());
        }
        if stack.primary_language == "rust" || stack.primary_language == "typescript" {
            score += 20;
            reasons.push("Compatible languages detected".to_string());
        }
        if stack.frontend_framework.is_some() {
            score += 20;
            reasons.push("Frontend framework for UI".to_string());
        }

        let confidence = if score >= 80 {
            "high"
        } else if score >= 50 {
            "medium"
        } else {
            "low"
        }
        .to_string();

        PatternRecommendation {
            pattern_id: "desktop-app".to_string(),
            score,
            reasons,
            warnings,
            confidence,
        }
    }

    fn recommend_fullstack(&self, stack: &TechnologyStack) -> PatternRecommendation {
        let mut score = 0;
        let mut reasons = Vec::new();
        let warnings = Vec::new();

        if stack.frontend_framework.is_some() {
            score += 30;
            reasons.push(format!(
                "Frontend: {}",
                stack.frontend_framework.as_ref().unwrap()
            ));
        }
        if stack.backend_framework.is_some() {
            score += 30;
            reasons.push(format!(
                "Backend: {}",
                stack.backend_framework.as_ref().unwrap()
            ));
        }
        if !stack.databases.contains(&"none".to_string()) {
            score += 20;
            reasons.push("Database detected".to_string());
        }
        if stack.structure == "monorepo" {
            score += 10;
            reasons.push("Monorepo structure".to_string());
        }

        let confidence = if score >= 80 {
            "high"
        } else if score >= 50 {
            "medium"
        } else {
            "low"
        }
        .to_string();

        PatternRecommendation {
            pattern_id: "fullstack-web".to_string(),
            score,
            reasons,
            warnings,
            confidence,
        }
    }

    fn recommend_microservices(&self, stack: &TechnologyStack) -> PatternRecommendation {
        let mut score = 0;
        let mut reasons = Vec::new();
        let warnings = Vec::new();

        if stack.structure == "multi-service" {
            score += 40;
            reasons.push("Multi-service structure detected".to_string());
        }
        if stack.config_files.docker_compose {
            score += 30;
            reasons.push("Docker Compose orchestration".to_string());
        }
        if stack.backend_framework.is_some() {
            score += 20;
            reasons.push("Backend services detected".to_string());
        }

        let confidence = if score >= 80 {
            "high"
        } else if score >= 50 {
            "medium"
        } else {
            "low"
        }
        .to_string();

        PatternRecommendation {
            pattern_id: "microservices".to_string(),
            score,
            reasons,
            warnings,
            confidence,
        }
    }

    fn recommend_rest_api(&self, stack: &TechnologyStack) -> PatternRecommendation {
        let mut score = 0;
        let mut reasons = Vec::new();
        let warnings = Vec::new();

        if stack.backend_framework.is_some() {
            score += 40;
            reasons.push(format!(
                "Backend framework: {}",
                stack.backend_framework.as_ref().unwrap()
            ));
        }
        if stack.frontend_framework.is_none() {
            score += 20;
            reasons.push("Backend-only project".to_string());
        }
        if !stack.databases.contains(&"none".to_string()) {
            score += 20;
            reasons.push("Database integration".to_string());
        }

        let confidence = if score >= 80 {
            "high"
        } else if score >= 50 {
            "medium"
        } else {
            "low"
        }
        .to_string();

        PatternRecommendation {
            pattern_id: "rest-api-backend".to_string(),
            score,
            reasons,
            warnings,
            confidence,
        }
    }

    fn recommend_static_site(&self, stack: &TechnologyStack) -> PatternRecommendation {
        let mut score = 0;
        let mut reasons = Vec::new();
        let warnings = Vec::new();

        if stack.frontend_framework == Some("sveltekit".to_string()) {
            score += 40;
            reasons.push("SvelteKit detected".to_string());
        }
        if stack.backend_framework.is_none() {
            score += 30;
            reasons.push("No backend - ideal for SSG".to_string());
        }
        if stack.databases.contains(&"none".to_string()) {
            score += 20;
            reasons.push("No database - static content".to_string());
        }

        let confidence = if score >= 80 {
            "high"
        } else if score >= 50 {
            "medium"
        } else {
            "low"
        }
        .to_string();

        PatternRecommendation {
            pattern_id: "static-site".to_string(),
            score,
            reasons,
            warnings,
            confidence,
        }
    }

    fn recommend_spa(&self, stack: &TechnologyStack) -> PatternRecommendation {
        let mut score = 0;
        let mut reasons = Vec::new();
        let warnings = Vec::new();

        if stack.frontend_framework == Some("svelte".to_string()) {
            score += 40;
            reasons.push("Svelte framework detected".to_string());
        }
        if stack.config_files.vite_config {
            score += 30;
            reasons.push("Vite build tool".to_string());
        }
        if stack.backend_framework.is_none() {
            score += 20;
            reasons.push("Client-side only app".to_string());
        }

        let confidence = if score >= 80 {
            "high"
        } else if score >= 50 {
            "medium"
        } else {
            "low"
        }
        .to_string();

        PatternRecommendation {
            pattern_id: "spa".to_string(),
            score,
            reasons,
            warnings,
            confidence,
        }
    }
}

// ============================================================================
// PUBLIC API
// ============================================================================

pub fn analyze_project(options: RuntimeAnalysisOptions) -> Result<RecommendationResult, String> {
    let start = Instant::now();

    // Detect technology stack
    let mut detector = TechStackDetector::new();
    let tech_stack = detector.detect(&options)?;

    // Recommend patterns
    let recommender = PatternRecommender::new();
    let recommendations = recommender.recommend(&tech_stack);

    let duration = start.elapsed().as_millis() as u64;

    Ok(RecommendationResult {
        tech_stack,
        recommendations,
        metadata: AnalysisMetadata {
            files_scanned: detector.files_scanned,
            duration,
            timestamp: chrono::Utc::now().to_rfc3339(),
        },
    })
}
