use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedLanguage {
    pub id: String,
    pub name: String,
    pub confidence: f64,
    pub files: Vec<String>,
    pub line_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedFramework {
    pub name: String,
    pub version: Option<String>,
    pub category: String,
    pub confidence: f64,
    pub indicators: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedDependency {
    pub name: String,
    pub version: Option<String>,
    #[serde(rename = "type")]
    pub dep_type: String,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedDatabase {
    #[serde(rename = "type")]
    pub db_type: String,
    pub confidence: f64,
    pub indicators: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedAuthentication {
    pub method: String,
    pub confidence: f64,
    pub indicators: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectProfile {
    pub project_name: String,
    pub project_path: String,
    pub root_files: Vec<String>,
    pub languages: Vec<DetectedLanguage>,
    pub primary_language: String,
    pub frameworks: Vec<DetectedFramework>,
    pub dependencies: Vec<DetectedDependency>,
    pub has_backend: bool,
    pub has_frontend: bool,
    pub has_mobile: bool,
    pub has_tests: bool,
    pub database: Option<DetectedDatabase>,
    pub authentication: Option<DetectedAuthentication>,
    pub has_docker: bool,
    pub has_ci: bool,
    pub suggested_stack_id: Option<String>,
    pub stack_match_confidence: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisResult {
    pub success: bool,
    pub profile: Option<ProjectProfile>,
    pub error: Option<String>,
    pub analysis_time_ms: u64,
    pub files_scanned: usize,
}

pub struct CodeAnalyzer {
    max_depth: usize,
    ignore_patterns: Vec<String>,
    language_extensions: HashMap<String, String>,
}

impl CodeAnalyzer {
    pub fn new() -> Self {
        let mut language_extensions = HashMap::new();
        language_extensions.insert(".ts".to_string(), "javascript-typescript".to_string());
        language_extensions.insert(".tsx".to_string(), "javascript-typescript".to_string());
        language_extensions.insert(".js".to_string(), "javascript-typescript".to_string());
        language_extensions.insert(".jsx".to_string(), "javascript-typescript".to_string());
        language_extensions.insert(".py".to_string(), "python".to_string());
        language_extensions.insert(".go".to_string(), "go".to_string());
        language_extensions.insert(".rs".to_string(), "rust".to_string());
        language_extensions.insert(".java".to_string(), "java".to_string());
        language_extensions.insert(".kt".to_string(), "kotlin".to_string());
        language_extensions.insert(".swift".to_string(), "swift".to_string());
        language_extensions.insert(".dart".to_string(), "dart".to_string());
        language_extensions.insert(".c".to_string(), "c".to_string());
        language_extensions.insert(".cpp".to_string(), "cpp".to_string());
        language_extensions.insert(".svelte".to_string(), "svelte".to_string());

        CodeAnalyzer {
            max_depth: 5,
            ignore_patterns: vec![
                "node_modules".to_string(),
                ".git".to_string(),
                "dist".to_string(),
                "build".to_string(),
                "target".to_string(),
                ".next".to_string(),
                "__pycache__".to_string(),
                "venv".to_string(),
                ".venv".to_string(),
            ],
            language_extensions,
        }
    }

    pub fn analyze_project(&self, project_path: &str) -> AnalysisResult {
        let start_time = std::time::Instant::now();
        let path = Path::new(project_path);

        if !path.exists() || !path.is_dir() {
            return AnalysisResult {
                success: false,
                profile: None,
                error: Some("Path does not exist or is not a directory".to_string()),
                analysis_time_ms: start_time.elapsed().as_millis() as u64,
                files_scanned: 0,
            };
        }

        let project_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Unknown")
            .to_string();

        // Scan files
        let mut files_scanned = 0;
        let mut language_files: HashMap<String, Vec<String>> = HashMap::new();
        let mut language_lines: HashMap<String, u32> = HashMap::new();
        let mut root_files = Vec::new();
        let mut config_files = HashSet::new();

        for entry in WalkDir::new(path)
            .max_depth(self.max_depth)
            .follow_links(false)
            .into_iter()
            .filter_entry(|e| !self.should_ignore(e.path()))
        {
            if let Ok(entry) = entry {
                let entry_path = entry.path();
                files_scanned += 1;

                // Track root files
                if entry_path.parent() == Some(path) {
                    if let Some(filename) = entry_path.file_name().and_then(|n| n.to_str()) {
                        root_files.push(filename.to_string());
                        
                        // Track config files
                        if Self::is_config_file(filename) {
                            config_files.insert(filename.to_string());
                        }
                    }
                }

                // Detect languages by extension
                if entry_path.is_file() {
                    if let Some(ext) = entry_path.extension().and_then(|e| e.to_str()) {
                        let ext_with_dot = format!(".{}", ext);
                        if let Some(lang_id) = self.language_extensions.get(&ext_with_dot) {
                            let file_path = entry_path.to_string_lossy().to_string();
                            language_files
                                .entry(lang_id.clone())
                                .or_insert_with(Vec::new)
                                .push(file_path);

                            // Count lines
                            if let Ok(content) = fs::read_to_string(entry_path) {
                                let lines = content.lines().count() as u32;
                                *language_lines.entry(lang_id.clone()).or_insert(0) += lines;
                            }
                        }
                    }
                }
            }
        }

        // Build detected languages
        let mut languages: Vec<DetectedLanguage> = language_files
            .into_iter()
            .map(|(lang_id, files)| {
                let line_count = language_lines.get(&lang_id).copied().unwrap_or(0);
                let confidence = self.calculate_language_confidence(files.len(), line_count);
                DetectedLanguage {
                    id: lang_id.clone(),
                    name: Self::language_name(&lang_id),
                    confidence,
                    files,
                    line_count,
                }
            })
            .collect();

        languages.sort_by(|a, b| b.line_count.cmp(&a.line_count));

        let primary_language = languages
            .first()
            .map(|l| l.id.clone())
            .unwrap_or_else(|| "unknown".to_string());

        // Detect dependencies and frameworks
        let dependencies = self.detect_dependencies(path);
        let frameworks = self.detect_frameworks(path, &dependencies, &config_files);

        // Detect project structure
        let has_frontend = self.has_frontend_indicators(&frameworks, &config_files);
        let has_backend = self.has_backend_indicators(&frameworks, &dependencies);
        let has_mobile = self.has_mobile_indicators(&frameworks, &dependencies);
        let has_tests = self.has_test_indicators(&config_files, &dependencies);
        let has_docker = config_files.contains("Dockerfile") || config_files.contains("docker-compose.yml");
        let has_ci = config_files.iter().any(|f| f.contains("ci.yml") || f.contains("ci.yaml"));

        // Detect database
        let database = self.detect_database(&dependencies);

        // Detect authentication
        let authentication = self.detect_authentication(&dependencies);

        // Match to known stacks
        let (suggested_stack_id, stack_match_confidence) = 
            self.match_stack(&frameworks, &dependencies, has_frontend, has_backend);

        let profile = ProjectProfile {
            project_name: project_name.clone(),
            project_path: project_path.to_string(),
            root_files,
            languages,
            primary_language,
            frameworks,
            dependencies,
            has_backend,
            has_frontend,
            has_mobile,
            has_tests,
            database,
            authentication,
            has_docker,
            has_ci,
            suggested_stack_id,
            stack_match_confidence,
        };

        AnalysisResult {
            success: true,
            profile: Some(profile),
            error: None,
            analysis_time_ms: start_time.elapsed().as_millis() as u64,
            files_scanned,
        }
    }

    fn should_ignore(&self, path: &Path) -> bool {
        path.file_name()
            .and_then(|n| n.to_str())
            .map(|name| self.ignore_patterns.iter().any(|pattern| name.contains(pattern)))
            .unwrap_or(false)
    }

    fn is_config_file(filename: &str) -> bool {
        matches!(
            filename,
            "package.json"
                | "requirements.txt"
                | "Cargo.toml"
                | "go.mod"
                | "pom.xml"
                | "build.gradle"
                | "composer.json"
                | "Gemfile"
                | "tsconfig.json"
                | "vite.config.js"
                | "vite.config.ts"
                | "next.config.js"
                | "next.config.ts"
                | "svelte.config.js"
                | "angular.json"
                | "Dockerfile"
                | "docker-compose.yml"
                | "schema.prisma"
                | "jest.config.js"
                | "vitest.config.ts"
        ) || filename.ends_with(".yml") || filename.ends_with(".yaml")
    }

    fn language_name(lang_id: &str) -> String {
        match lang_id {
            "javascript-typescript" => "JavaScript/TypeScript",
            "python" => "Python",
            "go" => "Go",
            "rust" => "Rust",
            "java" => "Java",
            "kotlin" => "Kotlin",
            "swift" => "Swift",
            "dart" => "Dart",
            "c" => "C",
            "cpp" => "C++",
            "svelte" => "Svelte",
            _ => "Unknown",
        }
        .to_string()
    }

    fn calculate_language_confidence(&self, file_count: usize, line_count: u32) -> f64 {
        let file_score = (file_count as f64 / 10.0).min(0.5);
        let line_score = (line_count as f64 / 1000.0).min(0.5);
        (file_score + line_score).min(1.0)
    }

    fn detect_dependencies(&self, path: &Path) -> Vec<DetectedDependency> {
        let mut dependencies = Vec::new();

        // Parse package.json
        if let Ok(content) = fs::read_to_string(path.join("package.json")) {
            if let Ok(package_json) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(deps) = package_json["dependencies"].as_object() {
                    for (name, version) in deps {
                        dependencies.push(DetectedDependency {
                            name: name.clone(),
                            version: version.as_str().map(|s| s.to_string()),
                            dep_type: "runtime".to_string(),
                            source: "package.json".to_string(),
                        });
                    }
                }
                if let Some(dev_deps) = package_json["devDependencies"].as_object() {
                    for (name, version) in dev_deps {
                        dependencies.push(DetectedDependency {
                            name: name.clone(),
                            version: version.as_str().map(|s| s.to_string()),
                            dep_type: "dev".to_string(),
                            source: "package.json".to_string(),
                        });
                    }
                }
            }
        }

        // Parse requirements.txt
        if let Ok(content) = fs::read_to_string(path.join("requirements.txt")) {
            for line in content.lines() {
                let line = line.trim();
                if line.is_empty() || line.starts_with('#') {
                    continue;
                }
                let parts: Vec<&str> = line.split("==").collect();
                dependencies.push(DetectedDependency {
                    name: parts[0].to_string(),
                    version: parts.get(1).map(|v| v.to_string()),
                    dep_type: "runtime".to_string(),
                    source: "requirements.txt".to_string(),
                });
            }
        }

        dependencies
    }

    fn detect_frameworks(
        &self,
        path: &Path,
        dependencies: &[DetectedDependency],
        config_files: &HashSet<String>,
    ) -> Vec<DetectedFramework> {
        let mut frameworks = Vec::new();
        let dep_names: HashSet<String> = dependencies.iter().map(|d| d.name.clone()).collect();

        // Next.js
        if dep_names.contains("next") {
            frameworks.push(DetectedFramework {
                name: "Next.js".to_string(),
                version: dependencies.iter().find(|d| d.name == "next").and_then(|d| d.version.clone()),
                category: "fullstack".to_string(),
                confidence: 0.95,
                indicators: vec!["next dependency".to_string()],
            });
        }

        // React
        if dep_names.contains("react") {
            frameworks.push(DetectedFramework {
                name: "React".to_string(),
                version: dependencies.iter().find(|d| d.name == "react").and_then(|d| d.version.clone()),
                category: "frontend".to_string(),
                confidence: 0.9,
                indicators: vec!["react dependency".to_string()],
            });
        }

        // SvelteKit
        if dep_names.contains("@sveltejs/kit") {
            frameworks.push(DetectedFramework {
                name: "SvelteKit".to_string(),
                version: None,
                category: "fullstack".to_string(),
                confidence: 0.95,
                indicators: vec!["@sveltejs/kit dependency".to_string()],
            });
        }

        // Express
        if dep_names.contains("express") {
            frameworks.push(DetectedFramework {
                name: "Express".to_string(),
                version: None,
                category: "backend".to_string(),
                confidence: 0.9,
                indicators: vec!["express dependency".to_string()],
            });
        }

        // FastAPI
        if dep_names.contains("fastapi") {
            frameworks.push(DetectedFramework {
                name: "FastAPI".to_string(),
                version: None,
                category: "backend".to_string(),
                confidence: 0.95,
                indicators: vec!["fastapi dependency".to_string()],
            });
        }

        // Django
        if dep_names.contains("django") || path.join("manage.py").exists() {
            frameworks.push(DetectedFramework {
                name: "Django".to_string(),
                version: None,
                category: "fullstack".to_string(),
                confidence: 0.95,
                indicators: vec!["django dependency or manage.py".to_string()],
            });
        }

        // Prisma
        if config_files.contains("schema.prisma") {
            frameworks.push(DetectedFramework {
                name: "Prisma".to_string(),
                version: None,
                category: "backend".to_string(),
                confidence: 0.95,
                indicators: vec!["schema.prisma".to_string()],
            });
        }

        // TailwindCSS
        if dep_names.contains("tailwindcss") {
            frameworks.push(DetectedFramework {
                name: "TailwindCSS".to_string(),
                version: None,
                category: "frontend".to_string(),
                confidence: 0.9,
                indicators: vec!["tailwindcss dependency".to_string()],
            });
        }

        frameworks
    }

    fn has_frontend_indicators(&self, frameworks: &[DetectedFramework], config_files: &HashSet<String>) -> bool {
        frameworks.iter().any(|f| f.category == "frontend" || f.category == "fullstack")
            || config_files.iter().any(|f| {
                f.contains("vite.config") || f.contains("webpack.config") || f.contains("next.config")
            })
    }

    fn has_backend_indicators(&self, frameworks: &[DetectedFramework], dependencies: &[DetectedDependency]) -> bool {
        frameworks.iter().any(|f| f.category == "backend" || f.category == "fullstack")
            || dependencies.iter().any(|d| {
                d.name.contains("express")
                    || d.name.contains("fastapi")
                    || d.name.contains("django")
                    || d.name.contains("flask")
            })
    }

    fn has_mobile_indicators(&self, frameworks: &[DetectedFramework], dependencies: &[DetectedDependency]) -> bool {
        frameworks.iter().any(|f| f.category == "mobile")
            || dependencies.iter().any(|d| d.name == "react-native" || d.name == "expo")
    }

    fn has_test_indicators(&self, config_files: &HashSet<String>, dependencies: &[DetectedDependency]) -> bool {
        config_files.iter().any(|f| f.contains("jest.config") || f.contains("vitest.config"))
            || dependencies.iter().any(|d| {
                d.name == "jest" || d.name == "vitest" || d.name == "pytest" || d.name == "mocha"
            })
    }

    fn detect_database(&self, dependencies: &[DetectedDependency]) -> Option<DetectedDatabase> {
        let mut db_indicators = Vec::new();
        let mut db_type = "unknown";
        let mut confidence = 0.0;

        for dep in dependencies {
            if dep.name.contains("pg") || dep.name.contains("postgres") {
                db_type = "postgresql";
                confidence = 0.9;
                db_indicators.push(format!("{} dependency", dep.name));
            } else if dep.name.contains("mongodb") || dep.name == "mongoose" {
                db_type = "mongodb";
                confidence = 0.9;
                db_indicators.push(format!("{} dependency", dep.name));
            } else if dep.name.contains("mysql") {
                db_type = "mysql";
                confidence = 0.9;
                db_indicators.push(format!("{} dependency", dep.name));
            } else if dep.name.contains("sqlite") {
                db_type = "sqlite";
                confidence = 0.9;
                db_indicators.push(format!("{} dependency", dep.name));
            } else if dep.name.contains("redis") {
                db_type = "redis";
                confidence = 0.8;
                db_indicators.push(format!("{} dependency", dep.name));
            }
        }

        if !db_indicators.is_empty() {
            Some(DetectedDatabase {
                db_type: db_type.to_string(),
                confidence,
                indicators: db_indicators,
            })
        } else {
            None
        }
    }

    fn detect_authentication(&self, dependencies: &[DetectedDependency]) -> Option<DetectedAuthentication> {
        let mut auth_indicators = Vec::new();
        let mut auth_method = "unknown";
        let mut confidence = 0.0;

        for dep in dependencies {
            if dep.name.contains("jsonwebtoken") || dep.name.contains("jwt") {
                auth_method = "jwt";
                confidence = 0.85;
                auth_indicators.push(format!("{} dependency", dep.name));
            } else if dep.name.contains("passport") || dep.name.contains("express-session") {
                auth_method = "session";
                confidence = 0.8;
                auth_indicators.push(format!("{} dependency", dep.name));
            } else if dep.name.contains("oauth") || dep.name.contains("next-auth") {
                auth_method = "oauth";
                confidence = 0.85;
                auth_indicators.push(format!("{} dependency", dep.name));
            }
        }

        if !auth_indicators.is_empty() {
            Some(DetectedAuthentication {
                method: auth_method.to_string(),
                confidence,
                indicators: auth_indicators,
            })
        } else {
            None
        }
    }

    fn match_stack(
        &self,
        frameworks: &[DetectedFramework],
        dependencies: &[DetectedDependency],
        has_frontend: bool,
        has_backend: bool,
    ) -> (Option<String>, Option<f64>) {
        let framework_names: HashSet<String> = frameworks.iter().map(|f| f.name.clone()).collect();
        let dep_names: HashSet<String> = dependencies.iter().map(|d| d.name.clone()).collect();

        // T3 Stack
        if framework_names.contains("Next.js")
            && dep_names.contains("@trpc/server")
            && dep_names.contains("prisma")
        {
            return (Some("t3-stack".to_string()), Some(0.95));
        }

        // MERN Stack
        if framework_names.contains("React")
            && framework_names.contains("Express")
            && dep_names.iter().any(|d| d.contains("mongo"))
        {
            return (Some("mern-stack".to_string()), Some(0.9));
        }

        // Next.js Full-Stack
        if framework_names.contains("Next.js") {
            return (Some("nextjs-fullstack".to_string()), Some(0.85));
        }

        // FastAPI AI Stack
        if framework_names.contains("FastAPI") {
            return (Some("fastapi-ai-stack".to_string()), Some(0.85));
        }

        // Django Stack
        if framework_names.contains("Django") {
            return (Some("django-stack".to_string()), Some(0.85));
        }

        // SvelteKit
        if framework_names.contains("SvelteKit") {
            return (Some("sveltekit-stack".to_string()), Some(0.85));
        }

        // Generic detection
        if has_frontend && has_backend {
            return (Some("fullstack-generic".to_string()), Some(0.5));
        }

        (None, None)
    }
}

#[tauri::command]
pub async fn analyze_codebase(project_path: String) -> Result<AnalysisResult, String> {
    let analyzer = CodeAnalyzer::new();
    Ok(analyzer.analyze_project(&project_path))
}
