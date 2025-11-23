use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeStatus {
    pub id: String,
    pub name: String,
    pub category: String,
    pub required: bool,
    pub installed: bool,
    pub on_path: bool,
    pub version: Option<String>,
    pub path: Option<String>,
    pub last_checked: Option<u64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeCheckResult {
    pub runtimes: Vec<RuntimeStatus>,
    pub all_required_met: bool,
    pub missing_required: Vec<String>,
    pub container_only: Vec<String>,
    pub timestamp: u64,
}

#[derive(Debug, Clone)]
pub struct RuntimeDetector {
    pub id: String,
    pub name: String,
    pub category: String,
    pub command: String,
    pub version_arg: String,
    pub version_regex: String,
    pub required: bool,
    pub container_only: bool,
}

impl RuntimeDetector {
    pub fn detect(&self) -> RuntimeStatus {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        if self.container_only {
            return RuntimeStatus {
                id: self.id.clone(),
                name: self.name.clone(),
                category: self.category.clone(),
                required: self.required,
                installed: false,
                on_path: false,
                version: None,
                path: None,
                last_checked: Some(timestamp),
                notes: Some("Container-only runtime (requires Dev-Container)".to_string()),
            };
        }

        // Check if command exists on PATH
        let path_result = which::which(&self.command);
        let on_path = path_result.is_ok();
        let path = path_result.ok().map(|p| p.to_string_lossy().to_string());

        if !on_path {
            return RuntimeStatus {
                id: self.id.clone(),
                name: self.name.clone(),
                category: self.category.clone(),
                required: self.required,
                installed: false,
                on_path: false,
                version: None,
                path: None,
                last_checked: Some(timestamp),
                notes: Some(format!("'{}' not found on PATH", self.command)),
            };
        }

        // Try to get version
        let version = self.get_version();

        RuntimeStatus {
            id: self.id.clone(),
            name: self.name.clone(),
            category: self.category.clone(),
            required: self.required,
            installed: version.is_some(),
            on_path,
            version,
            path,
            last_checked: Some(timestamp),
            notes: None,
        }
    }

    fn get_version(&self) -> Option<String> {
        let output = Command::new(&self.command)
            .arg(&self.version_arg)
            .output()
            .ok()?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        let combined = format!("{}{}", stdout, stderr);

        // Use regex to extract version
        let re = regex::Regex::new(&self.version_regex).ok()?;
        re.captures(&combined)
            .and_then(|caps| caps.get(1))
            .map(|m| m.as_str().to_string())
    }
}

pub fn get_all_detectors() -> Vec<RuntimeDetector> {
    vec![
        // Frontend Languages
        RuntimeDetector {
            id: "javascript-typescript".to_string(),
            name: "JavaScript/TypeScript (Node.js)".to_string(),
            category: "frontend".to_string(),
            command: "node".to_string(),
            version_arg: "--version".to_string(),
            version_regex: r"v?(\d+\.\d+\.\d+)".to_string(),
            required: true,
            container_only: false,
        },
        // Backend Languages
        RuntimeDetector {
            id: "python".to_string(),
            name: "Python".to_string(),
            category: "backend".to_string(),
            command: "python3".to_string(),
            version_arg: "--version".to_string(),
            version_regex: r"Python\s+(\d+\.\d+\.\d+)".to_string(),
            required: false,
            container_only: false,
        },
        RuntimeDetector {
            id: "go".to_string(),
            name: "Go".to_string(),
            category: "backend".to_string(),
            command: "go".to_string(),
            version_arg: "version".to_string(),
            version_regex: r"go(\d+\.\d+(?:\.\d+)?)".to_string(),
            required: false,
            container_only: false,
        },
        RuntimeDetector {
            id: "rust".to_string(),
            name: "Rust".to_string(),
            category: "backend".to_string(),
            command: "rustc".to_string(),
            version_arg: "--version".to_string(),
            version_regex: r"rustc\s+(\d+\.\d+\.\d+)".to_string(),
            required: false,
            container_only: false,
        },
        RuntimeDetector {
            id: "java".to_string(),
            name: "Java".to_string(),
            category: "backend".to_string(),
            command: "java".to_string(),
            version_arg: "--version".to_string(),
            version_regex: r"(\d+\.\d+\.\d+)".to_string(),
            required: false,
            container_only: false,
        },
        // Systems Languages
        RuntimeDetector {
            id: "c".to_string(),
            name: "C (GCC)".to_string(),
            category: "systems".to_string(),
            command: "gcc".to_string(),
            version_arg: "--version".to_string(),
            version_regex: r"gcc.*?(\d+\.\d+\.\d+)".to_string(),
            required: false,
            container_only: false,
        },
        RuntimeDetector {
            id: "cpp".to_string(),
            name: "C++ (G++)".to_string(),
            category: "systems".to_string(),
            command: "g++".to_string(),
            version_arg: "--version".to_string(),
            version_regex: r"g\+\+.*?(\d+\.\d+\.\d+)".to_string(),
            required: false,
            container_only: false,
        },
        RuntimeDetector {
            id: "bash".to_string(),
            name: "Bash".to_string(),
            category: "systems".to_string(),
            command: "bash".to_string(),
            version_arg: "--version".to_string(),
            version_regex: r"version\s+(\d+\.\d+\.\d+)".to_string(),
            required: true,
            container_only: false,
        },
        // Mobile Languages (Container-only)
        RuntimeDetector {
            id: "dart".to_string(),
            name: "Dart (Flutter)".to_string(),
            category: "mobile".to_string(),
            command: "dart".to_string(),
            version_arg: "--version".to_string(),
            version_regex: r"Dart.*?(\d+\.\d+\.\d+)".to_string(),
            required: false,
            container_only: true,
        },
        RuntimeDetector {
            id: "kotlin".to_string(),
            name: "Kotlin".to_string(),
            category: "mobile".to_string(),
            command: "kotlinc".to_string(),
            version_arg: "-version".to_string(),
            version_regex: r"(\d+\.\d+\.\d+)".to_string(),
            required: false,
            container_only: true,
        },
        RuntimeDetector {
            id: "swift".to_string(),
            name: "Swift".to_string(),
            category: "mobile".to_string(),
            command: "swift".to_string(),
            version_arg: "--version".to_string(),
            version_regex: r"Swift version\s+(\d+\.\d+(?:\.\d+)?)".to_string(),
            required: false,
            container_only: true,
        },
        // Package Managers & Tools
        RuntimeDetector {
            id: "npm".to_string(),
            name: "npm".to_string(),
            category: "frontend".to_string(),
            command: "npm".to_string(),
            version_arg: "--version".to_string(),
            version_regex: r"(\d+\.\d+\.\d+)".to_string(),
            required: true,
            container_only: false,
        },
        RuntimeDetector {
            id: "pnpm".to_string(),
            name: "pnpm".to_string(),
            category: "frontend".to_string(),
            command: "pnpm".to_string(),
            version_arg: "--version".to_string(),
            version_regex: r"(\d+\.\d+\.\d+)".to_string(),
            required: false,
            container_only: false,
        },
        RuntimeDetector {
            id: "git".to_string(),
            name: "Git".to_string(),
            category: "systems".to_string(),
            command: "git".to_string(),
            version_arg: "--version".to_string(),
            version_regex: r"git version\s+(\d+\.\d+\.\d+)".to_string(),
            required: true,
            container_only: false,
        },
        RuntimeDetector {
            id: "docker".to_string(),
            name: "Docker".to_string(),
            category: "systems".to_string(),
            command: "docker".to_string(),
            version_arg: "--version".to_string(),
            version_regex: r"Docker version\s+(\d+\.\d+\.\d+)".to_string(),
            required: false,
            container_only: false,
        },
    ]
}

pub async fn check_all_runtimes() -> RuntimeCheckResult {
    let detectors = get_all_detectors();
    let mut runtimes = Vec::new();
    let mut missing_required = Vec::new();
    let mut container_only = Vec::new();

    for detector in detectors {
        let status = detector.detect();
        
        if detector.container_only {
            container_only.push(detector.name.clone());
        } else if detector.required && !status.installed {
            missing_required.push(detector.name.clone());
        }

        runtimes.push(status);
    }

    let all_required_met = missing_required.is_empty();
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    RuntimeCheckResult {
        runtimes,
        all_required_met,
        missing_required,
        container_only,
        timestamp,
    }
}

// Cache for runtime check results
pub struct RuntimeCache {
    cache: HashMap<String, RuntimeStatus>,
    ttl_seconds: u64,
}

impl RuntimeCache {
    pub fn new(ttl_seconds: u64) -> Self {
        Self {
            cache: HashMap::new(),
            ttl_seconds,
        }
    }

    pub fn get(&self, runtime_id: &str) -> Option<RuntimeStatus> {
        let status = self.cache.get(runtime_id)?;
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        if let Some(last_checked) = status.last_checked {
            if current_time - last_checked < self.ttl_seconds {
                return Some(status.clone());
            }
        }
        
        None
    }

    pub fn set(&mut self, status: RuntimeStatus) {
        self.cache.insert(status.id.clone(), status);
    }

    pub fn clear(&mut self) {
        self.cache.clear();
    }
}
