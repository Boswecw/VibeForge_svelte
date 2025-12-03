# VibeForge Implementation Plan - Context Document v2

**Project:** VibeForge - AI Engineering Workbench  
**Current State:** 60% Complete - UI Ready, Backend Missing  
**Goal:** Wire up the complete project generation pipeline  
**Standard:** 100% test coverage (mandatory)

---

## Executive Summary

VibeForge has excellent architecture, a fully functional wizard UI, and comprehensive type definitions. However, the actual project generation is completely stubbed - the Rust/Tauri backend doesn't exist, and the `generateProject()` function returns fake data.

**What Works:**
- ✅ Wizard UI (5-step flow, validation, persistence)
- ✅ Architecture patterns (Desktop App, Monorepo)
- ✅ Type system (comprehensive, well-designed)
- ✅ State management (mostly Svelte 5 runes)
- ✅ Analysis system (refactoring, metrics, standards)
- ✅ Test infrastructure (Vitest configured, good test coverage)

**What's Missing:**
- ❌ Tauri Rust commands (project generation backend)
- ❌ Wire-up from frontend to backend
- ❌ API clients (Cortex, NeuroForge, DataForge)
- ❌ Coverage enforcement (no thresholds)
- ❌ One legacy store (learning.ts still uses writable)

**The Gap:** The beautiful wizard collects all the data perfectly, but when you click "Create Project", it calls a stubbed function that returns `{ success: true, filesCreated: ['fake.txt'] }` and nothing actually happens on disk.

---

## Current Architecture Analysis

### Wizard Flow (What Happens Now)

```typescript
// 1. User completes wizard ✅
wizardStore.currentStep = 5;
wizardStore.config = {
  projectName: "MyProject",
  architecturePattern: desktopAppPattern,
  // ... all config
};

// 2. User clicks "Create Project" ✅
await wizardStore.createProject();

// 3. Calls project store ✅
await projectStore.createFromWizard(wizardData);

// 4. Calls generateProject() ❌ STUB
async function generateProject(wizardData) {
  // TODO: Replace with actual Tauri invoke when backend is ready
  await new Promise(resolve => setTimeout(resolve, 1000)); // Fake delay
  
  return {
    projectId: `proj_${Date.now()}`,
    path: '/fake/path',
    filesCreated: ['README.md'] // Fake
  };
}

// 5. Returns success ✅ but files don't exist ❌
```

### Scaffolder Service (Exists But Not Connected)

```typescript
// src/lib/workbench/services/scaffolder.ts
export async function generateProject(config: ScaffoldConfig) {
  if (!isTauriMode) {
    return await mockGenerateProject(config); // ✅ Mock works
  }
  
  // Calls Tauri command that DOESN'T EXIST ❌
  const result = await invoke('generate_pattern_project_command', { config });
  return result;
}
```

The scaffolder service exists and has the right structure, but:
1. It's never called from `project.svelte.ts` (which has its own stub)
2. The Tauri command it tries to invoke doesn't exist
3. No Rust code exists in `src-tauri/src/commands/`

---

## Phase 1: Create Tauri Backend

**Goal:** Implement the Rust commands that actually create files

### 1A: Project Generation Command (Rust)

**File:** `src-tauri/src/commands/scaffolding.rs` (NEW)

This is the core command that receives the scaffolding config and creates files.

```rust
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::command;

#[derive(Debug, Deserialize)]
pub struct ScaffoldConfig {
    pattern_id: String,
    pattern_name: String,
    project_name: String,
    project_description: String,
    project_path: String,
    components: Vec<ComponentConfig>,
    features: FeatureFlags,
}

#[derive(Debug, Deserialize)]
pub struct ComponentConfig {
    id: String,
    role: String,
    name: String,
    language: String,
    framework: String,
    location: String,
    scaffolding: ComponentScaffolding,
    custom_config: Option<CustomConfig>,
}

#[derive(Debug, Deserialize)]
pub struct ComponentScaffolding {
    directories: Vec<DirectoryDef>,
    files: Vec<FileDef>,
}

#[derive(Debug, Deserialize)]
pub struct DirectoryDef {
    path: String,
    description: Option<String>,
    subdirectories: Option<Vec<DirectoryDef>>,
    files: Option<Vec<FileDef>>,
}

#[derive(Debug, Deserialize)]
pub struct FileDef {
    path: String,
    content: String,
    template_engine: Option<String>,
    overwritable: bool,
}

#[derive(Debug, Deserialize)]
pub struct FeatureFlags {
    testing: bool,
    linting: bool,
    git: bool,
    docker: bool,
    ci: bool,
}

#[derive(Debug, Deserialize)]
pub struct CustomConfig {
    include_tests: Option<bool>,
    include_docker: Option<bool>,
    include_ci: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct ScaffoldResult {
    success: bool,
    project_path: Option<String>,
    message: String,
    files_created: usize,
    components_generated: Vec<String>,
}

#[command]
pub async fn generate_pattern_project_command(config: ScaffoldConfig) -> Result<ScaffoldResult, String> {
    // Validate project path
    let project_path = Path::new(&config.project_path);
    if project_path.exists() {
        return Err(format!("Directory already exists: {}", config.project_path));
    }

    // Create project root directory
    fs::create_dir_all(project_path)
        .map_err(|e| format!("Failed to create project directory: {}", e))?;

    let mut files_created = 0;
    let mut components_generated = Vec::new();

    // Process each component
    for component in &config.components {
        let component_path = project_path.join(&component.location);
        
        // Create component directory
        fs::create_dir_all(&component_path)
            .map_err(|e| format!("Failed to create component directory: {}", e))?;

        // Create directory structure
        for dir in &component.scaffolding.directories {
            create_directory_structure(&component_path, dir)?;
        }

        // Create files
        for file in &component.scaffolding.files {
            create_file(&component_path, file, &config)?;
            files_created += 1;
        }

        components_generated.push(component.name.clone());
    }

    // Initialize Git if requested
    if config.features.git {
        initialize_git(project_path)?;
        
        // Create .gitignore
        let gitignore_content = generate_gitignore(&config);
        fs::write(project_path.join(".gitignore"), gitignore_content)
            .map_err(|e| format!("Failed to write .gitignore: {}", e))?;
        files_created += 1;
    }

    // Create README
    let readme_content = generate_readme(&config);
    fs::write(project_path.join("README.md"), readme_content)
        .map_err(|e| format!("Failed to write README.md: {}", e))?;
    files_created += 1;

    Ok(ScaffoldResult {
        success: true,
        project_path: Some(config.project_path.clone()),
        message: format!("Successfully created {} project", config.project_name),
        files_created,
        components_generated,
    })
}

fn create_directory_structure(base_path: &Path, dir: &DirectoryDef) -> Result<(), String> {
    let dir_path = base_path.join(&dir.path);
    fs::create_dir_all(&dir_path)
        .map_err(|e| format!("Failed to create directory {}: {}", dir.path, e))?;

    // Recursively create subdirectories
    if let Some(subdirs) = &dir.subdirectories {
        for subdir in subdirs {
            create_directory_structure(&dir_path, subdir)?;
        }
    }

    // Create files in this directory
    if let Some(files) = &dir.files {
        for file in files {
            create_file(&dir_path, file, &ScaffoldConfig {
                // Pass minimal config for template processing
                pattern_id: String::new(),
                pattern_name: String::new(),
                project_name: String::new(),
                project_description: String::new(),
                project_path: String::new(),
                components: Vec::new(),
                features: FeatureFlags {
                    testing: false,
                    linting: false,
                    git: false,
                    docker: false,
                    ci: false,
                },
            })?;
        }
    }

    Ok(())
}

fn create_file(base_path: &Path, file: &FileDef, config: &ScaffoldConfig) -> Result<(), String> {
    let file_path = base_path.join(&file.path);
    
    // Ensure parent directory exists
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directory: {}", e))?;
    }

    // Process template if needed
    let content = if let Some(engine) = &file.template_engine {
        match engine.as_str() {
            "handlebars" => process_handlebars_template(&file.content, config)?,
            _ => file.content.clone(),
        }
    } else {
        file.content.clone()
    };

    // Check if file exists and overwritable
    if file_path.exists() && !file.overwritable {
        return Err(format!("File already exists and is not overwritable: {:?}", file_path));
    }

    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write file {:?}: {}", file_path, e))?;

    Ok(())
}

fn process_handlebars_template(template: &str, config: &ScaffoldConfig) -> Result<String, String> {
    // Simple template variable replacement
    // For production, use handlebars crate for full template support
    let mut result = template.to_string();
    
    result = result.replace("{{projectName}}", &config.project_name);
    result = result.replace("{{projectDescription}}", &config.project_description);
    result = result.replace("{{patternName}}", &config.pattern_name);
    
    // Add more replacements as needed
    
    Ok(result)
}

fn initialize_git(project_path: &Path) -> Result<(), String> {
    let output = Command::new("git")
        .args(&["init"])
        .current_dir(project_path)
        .output()
        .map_err(|e| format!("Failed to run git init: {}", e))?;

    if !output.status.success() {
        return Err("Git initialization failed".to_string());
    }

    // Initial commit
    Command::new("git")
        .args(&["add", "."])
        .current_dir(project_path)
        .output()
        .map_err(|e| format!("Failed to git add: {}", e))?;

    Command::new("git")
        .args(&["commit", "-m", "Initial commit from VibeForge"])
        .current_dir(project_path)
        .output()
        .map_err(|e| format!("Failed to git commit: {}", e))?;

    Ok(())
}

fn generate_gitignore(config: &ScaffoldConfig) -> String {
    let mut lines = vec![
        "# Dependencies",
        "node_modules/",
        "target/",
        "",
        "# Build outputs",
        "dist/",
        "build/",
        ".svelte-kit/",
        "",
        "# Environment",
        ".env",
        ".env.local",
        "",
        "# IDE",
        ".vscode/",
        ".idea/",
        "*.swp",
        "*.swo",
        "",
        "# OS",
        ".DS_Store",
        "Thumbs.db",
    ];

    // Add pattern-specific ignores
    if config.pattern_id == "desktop-app" {
        lines.push("");
        lines.push("# Tauri");
        lines.push("src-tauri/target/");
        lines.push("src-tauri/Cargo.lock");
    }

    lines.join("\n")
}

fn generate_readme(config: &ScaffoldConfig) -> String {
    format!(
        r#"# {}

{}

## Architecture Pattern

{}

## Getting Started

### Prerequisites

Check the pattern documentation for required tools and dependencies.

### Installation

```bash
# Install dependencies
npm install  # or pnpm install
```

### Development

```bash
# Start development server
npm run dev
```

### Build

```bash
# Build for production
npm run build
```

## Generated by VibeForge

This project was generated using VibeForge, the AI engineering workbench.

- Pattern: {}
- Generated: {}
"#,
        config.project_name,
        config.project_description,
        config.pattern_name,
        config.pattern_name,
        chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC")
    )
}
```

### 1B: Register Commands

**File:** `src-tauri/src/commands/mod.rs` (NEW)

```rust
pub mod scaffolding;

pub use scaffolding::*;
```

**File:** `src-tauri/src/main.rs` (UPDATE)

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::generate_pattern_project_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 1C: Update Cargo.toml

**File:** `src-tauri/Cargo.toml` (UPDATE)

```toml
[dependencies]
tauri = { version = "2", features = ["shell-open"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = "0.4"
```

### 1D: Rust Tests

**File:** `src-tauri/src/commands/scaffolding.rs` (ADD)

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_generate_gitignore() {
        let config = ScaffoldConfig {
            pattern_id: "desktop-app".to_string(),
            pattern_name: "Desktop App".to_string(),
            project_name: "Test".to_string(),
            project_description: "Test project".to_string(),
            project_path: "/tmp/test".to_string(),
            components: vec![],
            features: FeatureFlags {
                testing: false,
                linting: false,
                git: true,
                docker: false,
                ci: false,
            },
        };

        let gitignore = generate_gitignore(&config);
        assert!(gitignore.contains("node_modules/"));
        assert!(gitignore.contains("src-tauri/target/"));
    }

    #[test]
    fn test_generate_readme() {
        let config = ScaffoldConfig {
            pattern_id: "desktop-app".to_string(),
            pattern_name: "Desktop App".to_string(),
            project_name: "MyApp".to_string(),
            project_description: "My cool app".to_string(),
            project_path: "/tmp/test".to_string(),
            components: vec![],
            features: FeatureFlags {
                testing: false,
                linting: false,
                git: false,
                docker: false,
                ci: false,
            },
        };

        let readme = generate_readme(&config);
        assert!(readme.contains("# MyApp"));
        assert!(readme.contains("My cool app"));
        assert!(readme.contains("Desktop App"));
    }

    #[test]
    fn test_process_handlebars_template() {
        let config = ScaffoldConfig {
            pattern_id: "test".to_string(),
            pattern_name: "Test Pattern".to_string(),
            project_name: "MyProject".to_string(),
            project_description: "Test desc".to_string(),
            project_path: "/tmp/test".to_string(),
            components: vec![],
            features: FeatureFlags {
                testing: false,
                linting: false,
                git: false,
                docker: false,
                ci: false,
            },
        };

        let template = "Project: {{projectName}}\nDescription: {{projectDescription}}";
        let result = process_handlebars_template(template, &config).unwrap();
        
        assert!(result.contains("Project: MyProject"));
        assert!(result.contains("Description: Test desc"));
    }
}
```

---

## Phase 2: Wire Up Frontend

**Goal:** Connect the UI to the new Tauri backend

### 2A: Replace Stub in Project Store

**File:** `src/lib/workbench/stores/project.svelte.ts` (UPDATE)

Find the stubbed `generateProject()` function (~line 90) and replace it:

```typescript
// REMOVE THIS STUB:
async function generateProject(wizardData: WizardData): Promise<ProjectGenerationResult> {
  // TODO: Replace with actual Tauri invoke when backend is ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const projectId = `proj_${Date.now()}`;
  return {
    projectId,
    path: wizardData.outputPath + '/' + wizardData.projectName,
    filesCreated: ['README.md', 'package.json'],
  };
}

// REPLACE WITH THIS:
async function generateProject(wizardData: WizardData): Promise<ProjectGenerationResult> {
  try {
    // Use the scaffolder service which calls Tauri
    const { generateProject: scaffolderGenerate } = await import(
      '$lib/workbench/services/scaffolder'
    );

    // Build scaffold config
    const scaffoldConfig: ScaffoldConfig = {
      patternId: wizardData.architecturePattern?.id || 'single-app',
      patternName: wizardData.architecturePattern?.displayName || 'Single App',
      projectName: wizardData.projectName,
      projectDescription: wizardData.projectDescription,
      projectPath: `${wizardData.outputPath}/${wizardData.projectName}`,
      components: wizardData.architecturePattern?.components.map((comp) => ({
        id: comp.id,
        role: comp.role,
        name: comp.name,
        language: comp.language,
        framework: comp.framework,
        location: comp.location,
        scaffolding: {
          directories: comp.scaffolding.directories,
          files: comp.scaffolding.files,
        },
        customConfig: undefined,
      })) || [],
      features: {
        testing: wizardData.features.testing ?? true,
        linting: wizardData.features.linting ?? true,
        git: wizardData.features.git ?? true,
        docker: wizardData.features.docker ?? false,
        ci: wizardData.features.ci ?? false,
      },
    };

    // Call scaffolder which invokes Tauri
    const result = await scaffolderGenerate(scaffoldConfig);

    if (!result.success) {
      throw new Error(result.message || 'Project generation failed');
    }

    return {
      projectId: `proj_${Date.now()}`,
      path: result.projectPath || scaffoldConfig.projectPath,
      filesCreated: result.filesCreated.map((f: string) => f) || [],
    };
  } catch (error) {
    console.error('Project generation failed:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Unknown error during project generation'
    );
  }
}
```

### 2B: Ensure Scaffolder Has Correct Types

**File:** `src/lib/workbench/types/scaffolding.ts` (UPDATE if needed)

Make sure the `ScaffoldConfig` and `ScaffoldResult` types match the Rust structs exactly:

```typescript
export interface ScaffoldConfig {
  patternId: string;
  patternName: string;
  projectName: string;
  projectDescription: string;
  projectPath: string;
  components: ComponentConfig[];
  features: FeatureFlags;
}

export interface ScaffoldResult {
  success: boolean;
  projectPath?: string;
  message: string;
  filesCreated: number;  // Note: number in Rust, not string[]
  componentsGenerated: string[];
}
```

### 2C: Test Frontend Integration

**File:** `src/lib/workbench/stores/__tests__/project-generation.test.ts` (NEW)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { projectStore } from '../project.svelte';
import type { WizardData } from '../../types/wizard';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Mock scaffolder
vi.mock('$lib/workbench/services/scaffolder', () => ({
  generateProject: vi.fn()
}));

describe('Project Generation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call scaffolder with correct configuration', async () => {
    const { generateProject: scaffolderGenerate } = await import(
      '$lib/workbench/services/scaffolder'
    );
    
    vi.mocked(scaffolderGenerate).mockResolvedValueOnce({
      success: true,
      projectPath: '/test/MyProject',
      message: 'Success',
      filesCreated: 5,
      componentsGenerated: ['frontend', 'backend']
    });

    const wizardData: WizardData = {
      projectName: 'MyProject',
      projectDescription: 'Test project',
      outputPath: '/test',
      architecturePattern: {
        id: 'desktop-app',
        displayName: 'Desktop App',
        components: []
      },
      features: {
        testing: true,
        linting: true,
        git: true,
        docker: false,
        ci: false
      }
    };

    await projectStore.createFromWizard(wizardData);

    expect(scaffolderGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        projectName: 'MyProject',
        patternId: 'desktop-app'
      })
    );
  });

  it('should handle scaffolder errors gracefully', async () => {
    const { generateProject: scaffolderGenerate } = await import(
      '$lib/workbench/services/scaffolder'
    );
    
    vi.mocked(scaffolderGenerate).mockRejectedValueOnce(
      new Error('Permission denied')
    );

    const wizardData: WizardData = {
      projectName: 'MyProject',
      outputPath: '/invalid'
    };

    await expect(projectStore.createFromWizard(wizardData)).rejects.toThrow(
      'Permission denied'
    );
  });
});
```

---

## Phase 3: Testing & Coverage

**Goal:** Achieve 100% test coverage with enforced thresholds

### 3A: Configure Coverage Thresholds

**File:** `vitest.config.ts` (UPDATE)

```typescript
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit(), svelte({ hot: !process.env.VITEST })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.config.ts',
        '**/types/**',
        '**/*.d.ts',
        '.svelte-kit/**',
        'build/**'
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100
      }
    }
  },
  resolve: {
    alias: {
      '$lib': new URL('./src/lib', import.meta.url).pathname,
      '$app': new URL('./node_modules/@sveltejs/kit/src/runtime/app', import.meta.url).pathname
    }
  }
});
```

### 3B: Test Setup File

**File:** `src/test/setup.ts` (CREATE if doesn't exist)

```typescript
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
  emit: vi.fn()
}));

// Mock browser environment
Object.defineProperty(window, '__TAURI__', {
  value: true,
  writable: true
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Reset before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});
```

### 3C: Add Package Scripts

**File:** `package.json` (UPDATE scripts section)

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
    "lint": "eslint .",
    "format": "prettier --write .",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

---

## Phase 4: State Management Cleanup

**Goal:** Migrate remaining legacy stores to Svelte 5 runes

### 4A: Migrate Learning Store

**File:** `src/lib/stores/learning.ts` (UPDATE)

Current state uses `writable` from svelte/store. Convert to runes:

```typescript
// REMOVE:
import { writable, derived, get } from "svelte/store";

// REPLACE WITH:
import { browser } from '$app/environment';

interface LearningState {
  currentProject: VibeForgeProjectResponse | null;
  currentSession: ProjectSessionResponse | null;
  // ... rest of state
}

const state = $state<LearningState>({
  currentProject: null,
  currentSession: null,
  sessionStartTime: null,
  languagesViewed: new Set<string>(),
  // ... rest of initial state
});

// Derived values
const hasProject = $derived(state.currentProject !== null);
const hasSession = $derived(state.currentSession !== null);

export const learningStore = {
  // State accessors
  get currentProject() { return state.currentProject; },
  get hasProject() { return hasProject; },
  
  // Actions
  async startProject(projectData) {
    state.isLoading = true;
    try {
      const project = await learningClient.createProject(projectData);
      state.currentProject = project;
    } catch (error) {
      state.error = 'Failed to create project';
    } finally {
      state.isLoading = false;
    }
  },
  
  // ... rest of actions
};
```

### 4B: Update Imports

Search for any files importing the old learning store:

```bash
# Find imports
grep -r "from.*learning.*import" src/

# Update from:
import { learningStore } from '$lib/stores/learning';
$learningStore.subscribe(...)

# To:
import { learningStore } from '$lib/stores/learning.svelte';
learningStore.currentProject
```

---

## Phase 5: API Client Stubs

**Goal:** Create placeholder API clients for future integration

### 5A: Base API Client

**File:** `src/lib/core/api/base.ts` (CREATE)

```typescript
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

export class BaseApiClient {
  constructor(protected config: ApiConfig) {}
  
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: AbortSignal.timeout(this.config.timeout)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  protected post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  protected get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }
}
```

### 5B: Cortex Client Stub

**File:** `src/lib/core/api/cortex.ts` (CREATE)

```typescript
import { BaseApiClient } from './base';

export interface RepositoryAnalysis {
  path: string;
  language: string;
  frameworks: string[];
  fileCount: number;
}

export class CortexClient extends BaseApiClient {
  constructor() {
    super({
      baseUrl: import.meta.env.VITE_CORTEX_API_URL || 'http://localhost:8001',
      timeout: 30000
    });
  }
  
  async analyzeRepository(path: string): Promise<RepositoryAnalysis> {
    // Stub implementation
    console.warn('Cortex integration not yet implemented');
    return {
      path,
      language: 'unknown',
      frameworks: [],
      fileCount: 0
    };
  }
}

export const cortexClient = new CortexClient();
```

### 5C: NeuroForge Client Stub

**File:** `src/lib/core/api/neuroforge.ts` (CREATE)

```typescript
import { BaseApiClient } from './base';

export interface ModelSelection {
  model: string;
  confidence: number;
}

export class NeuroForgeClient extends BaseApiClient {
  constructor() {
    super({
      baseUrl: import.meta.env.VITE_NEUROFORGE_API_URL || 'http://localhost:8002',
      timeout: 60000
    });
  }
  
  async routePrompt(prompt: string): Promise<ModelSelection> {
    // Stub implementation
    console.warn('NeuroForge integration not yet implemented');
    return {
      model: 'claude-sonnet-4',
      confidence: 0.8
    };
  }
}

export const neuroforgeClient = new NeuroForgeClient();
```

### 5D: DataForge Client Stub

**File:** `src/lib/core/api/dataforge.ts` (CREATE)

```typescript
import { BaseApiClient } from './base';

export interface Project {
  id: string;
  name: string;
  path: string;
}

export class DataForgeClient extends BaseApiClient {
  constructor() {
    super({
      baseUrl: import.meta.env.VITE_DATAFORGE_API_URL || 'http://localhost:8000',
      timeout: 10000
    });
  }
  
  async saveProject(project: Project): Promise<string> {
    // Stub implementation
    console.warn('DataForge integration not yet implemented');
    return project.id;
  }
}

export const dataforgeClient = new DataForgeClient();
```

---

## Success Criteria

### Phase 1: Tauri Backend ✓
- [ ] `src-tauri/src/commands/scaffolding.rs` created
- [ ] Commands registered in main.rs
- [ ] Cargo.toml dependencies added
- [ ] Rust tests pass: `cd src-tauri && cargo test`
- [ ] Command compiles: `cd src-tauri && cargo build`

### Phase 2: Frontend Wire-Up ✓
- [ ] Stub replaced in `project.svelte.ts`
- [ ] Scaffolder connected
- [ ] Types match Rust structs
- [ ] Integration tests pass
- [ ] Manual test: wizard → files created on disk

### Phase 3: Testing & Coverage ✓
- [ ] vitest.config.ts has 100% thresholds
- [ ] Test setup file created
- [ ] All tests pass: `pnpm test`
- [ ] Coverage meets 100%: `pnpm test:coverage`
- [ ] HTML coverage report viewable: `open coverage/index.html`

### Phase 4: State Cleanup ✓
- [ ] learning.ts migrated to runes
- [ ] No more `writable` imports
- [ ] All store imports updated
- [ ] Tests updated for new store API

### Phase 5: API Stubs ✓
- [ ] Base client created
- [ ] Cortex client stub
- [ ] NeuroForge client stub
- [ ] DataForge client stub
- [ ] All have 100% test coverage

---

## Quality Gates

**Before Each Commit:**
```bash
# Type check
pnpm check

# Tests
pnpm test

# Coverage
pnpm test:coverage
# Must show 100% in all metrics

# Lint
pnpm lint

# Build
pnpm build

# Tauri build
pnpm tauri build
```

**Git Workflow:**
```bash
git add .
git commit -m "feat(phase): description"
git push origin main
```

---

## Common Issues & Solutions

### Issue: Tauri command not found
**Solution:** Check `src-tauri/src/main.rs` has command in `invoke_handler![]`

### Issue: Rust compilation errors
**Solution:** Check Cargo.toml dependencies, run `cargo clean && cargo build`

### Issue: Type mismatches between Rust and TypeScript
**Solution:** Use `snake_case` in Rust, Tauri auto-converts to `camelCase` in JS

### Issue: Tests can't find Tauri
**Solution:** Check `src/test/setup.ts` mocks `@tauri-apps/api/core`

### Issue: Coverage not 100%
**Solution:** Run `pnpm test:coverage`, open `coverage/index.html`, add tests for uncovered lines

---

## Execution Timeline

**Week 1:**
- Days 1-2: Phase 1 (Rust backend)
- Days 3-4: Phase 2 (Frontend wire-up)
- Day 5: Manual testing, bug fixes

**Week 2:**
- Days 1-2: Phase 3 (Testing & coverage)
- Days 3-4: Phase 4 (State cleanup)
- Day 5: Phase 5 (API stubs)

**Week 3:**
- Polish, documentation, final testing

---

## Environment Setup

**Required Tools:**
- Rust (latest stable)
- Node.js 18+
- pnpm 8+
- Git

**Environment Variables:**
```bash
# .env.development
VITE_CORTEX_API_URL=http://localhost:8001
VITE_NEUROFORGE_API_URL=http://localhost:8002
VITE_DATAFORGE_API_URL=http://localhost:8000
```

---

**END OF CONTEXT DOCUMENT**
