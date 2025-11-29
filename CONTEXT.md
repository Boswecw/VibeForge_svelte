# CONTEXT: VibeForge Architecture Patterns System

**Read this file completely before implementing. This contains all specifications, examples, and requirements.**

---

## Problem Statement

VibeForge wizard currently assumes single-language, single-framework projects. Real-world professional projects (like Cortex) require multiple languages and frameworks working together:

- **Cortex:** Rust/Tauri backend + TypeScript/SvelteKit frontend + SQLite database
- **Full-Stack Apps:** Python/FastAPI + React frontend + PostgreSQL
- **AI Platforms:** Python ML + Node.js API + React UI
- **Mobile Apps:** React Native + FastAPI backend

Users shouldn't need to understand this complexity - they should just select "Desktop App" and get a working multi-component project.

---

## Solution: Architecture Patterns

An **Architecture Pattern** is a complete, multi-component project structure with:
- Multiple integrated components (backend, frontend, database, etc.)
- Each component has its own language, framework, and file structure
- Components communicate via defined protocols (Tauri IPC, REST API, etc.)
- Full scaffolding templates for all files
- Complete documentation and setup instructions

---

## Core Type System

### ComponentRole
```typescript
export type ComponentRole = 
  | 'backend'      // Server/API/native backend
  | 'frontend'     // Web/desktop UI
  | 'mobile'       // Mobile app
  | 'cli'          // Command-line interface
  | 'library'      // Shared library/package
  | 'database'     // Database/storage
  | 'infrastructure' // Docker, K8s, etc.
  | 'ml-backend'   // ML/AI service
  | 'api-gateway'; // API gateway/router
```

### IntegrationProtocol
```typescript
export type IntegrationProtocol =
  | 'tauri-commands'  // Desktop: Tauri IPC
  | 'rest-api'        // Full-stack: HTTP REST
  | 'graphql'         // Full-stack: GraphQL
  | 'grpc'            // Microservices: gRPC
  | 'websocket'       // Real-time: WebSocket
  | 'ipc'             // Process: Inter-process
  | 'shared-memory';  // Native: Shared memory
```

### ProjectComponent
```typescript
export interface ProjectComponent {
  id: string;                    // Unique identifier
  role: ComponentRole;           // What this component does
  name: string;                  // Display name
  description: string;           // Purpose description
  
  // Technology
  language: LanguageId;          // Primary language
  framework: string;             // Framework/library
  
  // File system
  location: string;              // Path in project (e.g., "src-tauri/")
  
  // Dependencies
  dependencies: ComponentDependency[];  // Other components it needs
  
  // Scaffolding
  scaffolding: ComponentScaffolding;    // Files/dirs to generate
  
  // Build/dev commands
  commands: {
    install?: string[];          // Install dependencies
    dev?: string[];              // Development mode
    build?: string[];            // Production build
    test?: string[];             // Run tests
  };
}
```

### ComponentDependency
```typescript
export interface ComponentDependency {
  componentId: string;           // Which component
  type: 'required' | 'optional'; // Necessity
  relationship: 'calls' | 'imports' | 'embeds' | 'extends';
}
```

### ComponentIntegration
```typescript
export interface ComponentIntegration {
  protocol: IntegrationProtocol;  // How components communicate
  sharedTypes: boolean;           // Generate shared type definitions?
  sharedConfig: boolean;          // Share configuration files?
  
  // Code generation
  generateBindings?: {
    from: string;                 // Source component ID
    to: string;                   // Target component ID
    format: 'typescript' | 'rust-types' | 'python-stubs';
  }[];
}
```

### ArchitecturePattern
```typescript
export interface ArchitecturePattern {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: ArchitectureCategory;
  
  // Visual identity
  icon: string;
  diagram?: string;               // ASCII or SVG diagram
  
  // Components that make up this pattern
  components: ProjectComponent[];
  integration: ComponentIntegration;
  
  // Characteristics
  complexity: ComplexityLevel;
  maturity: 'experimental' | 'stable' | 'mature';
  popularity: number;             // 0-100
  
  // Use case matching
  idealFor: string[];
  notIdealFor: string[];
  examples: string[];
  
  // Requirements
  prerequisites: {
    tools: string[];              // Required CLI tools
    skills: string[];             // Required knowledge
    timeEstimate: string;         // "2 hours", "1 day", etc.
  };
  
  // Documentation
  documentation: {
    quickStart: string;
    architecture: string;
    deployment: string;
    troubleshooting: string;
  };
}

export type ArchitectureCategory = 
  | 'desktop'
  | 'web'
  | 'mobile'
  | 'backend'
  | 'cli'
  | 'ai-ml'
  | 'microservices';
```

### ComponentScaffolding
```typescript
export interface ComponentScaffolding {
  directories: DirectoryStructure[];
  files: FileTemplate[];
  packageFiles: Record<string, any>;    // package.json, Cargo.toml, etc.
  configFiles: Record<string, any>;     // Config file contents
}

export interface FileTemplate {
  path: string;
  content: string;
  templateEngine?: 'handlebars' | 'jinja2' | 'none';
  overwritable: boolean;
}

export interface DirectoryStructure {
  path: string;
  description?: string;
  files?: FileTemplate[];
  subdirectories?: DirectoryStructure[];
}
```

---

## Desktop App Pattern (Cortex Example)

### Complete Pattern Definition

```typescript
export const desktopAppPattern: ArchitecturePattern = {
  id: 'desktop-app',
  name: 'desktop-app',
  displayName: 'Desktop Application',
  description: 'Cross-platform desktop app with native backend and modern web UI',
  category: 'desktop',
  icon: '🖥️',
  
  components: [
    // Backend Component (Rust/Tauri)
    {
      id: 'backend',
      role: 'backend',
      name: 'Backend',
      description: 'Rust/Tauri backend with native system access',
      language: 'rust',
      framework: 'tauri',
      location: 'src-tauri',
      dependencies: [],
      scaffolding: {
        directories: [
          {
            path: 'src',
            files: [],
            subdirectories: [
              { path: 'commands', description: 'Tauri command handlers' },
              { path: 'db', description: 'Database operations' },
              { path: 'models', description: 'Data models' }
            ]
          }
        ],
        files: [
          {
            path: 'src/main.rs',
            content: tauriMainTemplate,
            templateEngine: 'handlebars',
            overwritable: false
          },
          {
            path: 'Cargo.toml',
            content: cargoTomlTemplate,
            templateEngine: 'handlebars',
            overwritable: false
          },
          {
            path: 'tauri.conf.json',
            content: tauriConfigTemplate,
            templateEngine: 'handlebars',
            overwritable: false
          }
        ],
        packageFiles: {
          'Cargo.toml': {
            package: {
              name: '{{projectName}}',
              version: '0.1.0',
              edition: '2021'
            },
            dependencies: {
              tauri: { version: '2.0', features: ['unstable'] },
              serde: { version: '1.0', features: ['derive'] },
              serde_json: '1.0',
              tokio: { version: '1', features: ['full'] },
              rusqlite: { version: '0.31', features: ['bundled'] }
            }
          }
        },
        configFiles: {}
      },
      commands: {
        install: ['cargo fetch'],
        dev: ['cargo tauri dev'],
        build: ['cargo tauri build'],
        test: ['cargo test']
      }
    },
    
    // Frontend Component (TypeScript/SvelteKit)
    {
      id: 'frontend',
      role: 'frontend',
      name: 'Frontend',
      description: 'SvelteKit web UI with Tauri integration',
      language: 'typescript',
      framework: 'sveltekit',
      location: 'src',
      dependencies: [
        {
          componentId: 'backend',
          type: 'required',
          relationship: 'calls'
        }
      ],
      scaffolding: {
        directories: [
          {
            path: 'routes',
            description: 'SvelteKit routes'
          },
          {
            path: 'lib',
            subdirectories: [
              { path: 'components' },
              { path: 'stores' },
              { path: 'utils' }
            ]
          }
        ],
        files: [
          {
            path: 'package.json',
            content: packageJsonTemplate,
            templateEngine: 'handlebars',
            overwritable: false
          },
          {
            path: 'svelte.config.js',
            content: svelteConfigTemplate,
            templateEngine: 'none',
            overwritable: false
          }
        ],
        packageFiles: {
          'package.json': {
            name: '{{projectName}}',
            version: '0.1.0',
            type: 'module',
            scripts: {
              dev: 'vite dev',
              build: 'vite build',
              tauri: 'tauri'
            },
            dependencies: {
              '@tauri-apps/api': '^2.0.0',
              'svelte': '^4.0.0'
            },
            devDependencies: {
              '@sveltejs/kit': '^2.0.0',
              'typescript': '^5.0.0',
              'vite': '^5.0.0'
            }
          }
        },
        configFiles: {}
      },
      commands: {
        install: ['npm install'],
        dev: ['npm run dev'],
        build: ['npm run build'],
        test: ['npm test']
      }
    }
  ],
  
  integration: {
    protocol: 'tauri-commands',
    sharedTypes: true,
    sharedConfig: false,
    generateBindings: [
      {
        from: 'backend',
        to: 'frontend',
        format: 'typescript'
      }
    ]
  },
  
  complexity: 'intermediate',
  maturity: 'stable',
  popularity: 85,
  
  idealFor: [
    'Desktop applications',
    'Native system access',
    'File management tools',
    'Developer tools',
    'Local-first applications'
  ],
  
  notIdealFor: [
    'Web-only applications',
    'Mobile apps',
    'Server-side services'
  ],
  
  examples: [
    'VS Code',
    'Obsidian',
    'File explorers',
    'Dev tools'
  ],
  
  prerequisites: {
    tools: ['Rust', 'Node.js', 'cargo', 'npm'],
    skills: ['Basic Rust', 'TypeScript', 'SvelteKit'],
    timeEstimate: '4-8 hours setup'
  },
  
  documentation: {
    quickStart: `# Quick Start

1. Install dependencies:
   \`\`\`bash
   cd src-tauri && cargo fetch
   npm install
   \`\`\`

2. Run in development:
   \`\`\`bash
   npm run tauri dev
   \`\`\`

3. Build for production:
   \`\`\`bash
   npm run tauri build
   \`\`\`
`,
    architecture: `# Architecture

**Backend (Rust/Tauri)**
- Native system access via Tauri commands
- SQLite database for local storage
- Fast, memory-safe operations

**Frontend (SvelteKit)**
- Modern reactive UI
- TypeScript for type safety
- Vite for fast builds

**Communication**
- Tauri IPC (Inter-Process Communication)
- Type-safe command bindings
- Async/await pattern
`,
    deployment: `# Deployment

Build platform-specific bundles:
\`\`\`bash
npm run tauri build
\`\`\`

Outputs:
- macOS: .app and .dmg
- Windows: .exe and .msi
- Linux: .deb and .AppImage
`,
    troubleshooting: `# Troubleshooting

**Build fails?**
- Ensure Rust is installed: \`rustc --version\`
- Update Rust: \`rustup update\`

**Tauri commands not working?**
- Check tauri.conf.json allows the command
- Verify command is registered in main.rs
`
  }
};
```

---

## Full-Stack Web Pattern

```typescript
export const fullstackWebPattern: ArchitecturePattern = {
  id: 'fullstack-web',
  name: 'fullstack-web',
  displayName: 'Full-Stack Web Application',
  description: 'Complete web app with API backend and modern frontend',
  category: 'web',
  icon: '🌐',
  
  components: [
    // Python/FastAPI Backend
    {
      id: 'backend',
      role: 'backend',
      name: 'API Backend',
      description: 'FastAPI REST API server',
      language: 'python',
      framework: 'fastapi',
      location: 'backend',
      // ... similar structure to desktop-app backend
    },
    
    // SvelteKit Frontend
    {
      id: 'frontend',
      role: 'frontend',
      name: 'Web Frontend',
      description: 'SvelteKit web application',
      language: 'typescript',
      framework: 'sveltekit',
      location: 'frontend',
      // ... similar structure
    },
    
    // PostgreSQL Database
    {
      id: 'database',
      role: 'database',
      name: 'Database',
      description: 'PostgreSQL database',
      language: 'sql',
      framework: 'postgresql',
      location: 'database',
      // ...
    }
  ],
  
  integration: {
    protocol: 'rest-api',
    sharedTypes: true,
    sharedConfig: false,
    generateBindings: [
      {
        from: 'backend',
        to: 'frontend',
        format: 'typescript'
      }
    ]
  },
  
  // ... rest of pattern definition
};
```

---

## Template System

### Handlebars Templates

Templates use Handlebars syntax with these variables:

**Common Variables:**
- `{{projectName}}` - Project name
- `{{projectDescription}}` - Project description
- `{{author}}` - Author name

**Conditional Blocks:**
```handlebars
{{#if includeDatabase}}
// Database code
{{/if}}

{{#if includeAuth}}
// Auth code
{{/if}}
```

**Loops:**
```handlebars
{{#each dependencies}}
- {{this}}
{{/each}}
```

### Example: Tauri main.rs Template

```rust
// src/lib/templates/tauri/main.rs.hbs

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
{{#if includeDatabase}}
mod db;
{{/if}}

use tauri::Manager;

#[tokio::main]
async fn main() {
    {{#if includeDatabase}}
    let db = db::init_database().await
        .expect("Failed to initialize database");
    {{/if}}

    tauri::Builder::default()
        {{#if includeDatabase}}
        .manage(db)
        {{/if}}
        .invoke_handler(tauri::generate_handler![
            {{#each commands}}
            commands::{{this}},
            {{/each}}
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Example: Cargo.toml Template

```toml
# src/lib/templates/tauri/Cargo.toml.hbs

[package]
name = "{{projectName}}"
version = "0.1.0"
description = "{{projectDescription}}"
edition = "2021"

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = ["unstable"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
{{#if includeDatabase}}
rusqlite = { version = "0.31", features = ["bundled"] }
{{/if}}

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

---

## Updated Wizard Types

### WizardData Changes

```typescript
export interface WizardData {
  // Step 1: Intent (unchanged)
  projectName: string;
  projectDescription: string;
  projectIntent: string;
  
  // Step 2: Architecture (NEW - replaces single language/stack)
  architecturePattern?: ArchitecturePattern;
  architecturesConsidered: string[];
  
  // Step 3: Component Configuration (NEW)
  componentConfigs: Map<string, ComponentConfig>;
  
  // Step 4: Features & Settings (mostly unchanged)
  features: FeatureSelection;
  complexity: Complexity;
  teamSize: number;
  timeline: Timeline;
  
  // Step 5: Launch (unchanged)
  outputPath: string;
  generateReadme: boolean;
  initGit: boolean;
  
  // Keep for backward compatibility
  primaryLanguage?: LanguageId;
  secondaryLanguages?: LanguageId[];
  selectedStack?: StackProfile;
}

export interface ComponentConfig {
  componentId: string;
  
  // Allow users to override defaults
  language?: LanguageId;
  framework?: string;
  location?: string;
  
  // Optional features
  includeTests: boolean;
  includeDocker: boolean;
  includeCi: boolean;
  
  // Component-specific config
  customConfig?: Record<string, any>;
}
```

---

## Pattern Registry

```typescript
// src/lib/data/architecture-patterns/index.ts

export const ARCHITECTURE_PATTERNS = {
  'desktop-app': desktopAppPattern,
  'fullstack-web': fullstackWebPattern,
} as const;

export type ArchitecturePatternId = keyof typeof ARCHITECTURE_PATTERNS;

export function getPattern(id: string): ArchitecturePattern | undefined {
  return ARCHITECTURE_PATTERNS[id as ArchitecturePatternId];
}

export function getAllPatterns(): ArchitecturePattern[] {
  return Object.values(ARCHITECTURE_PATTERNS);
}

export function getPatternsByCategory(
  category: ArchitectureCategory
): ArchitecturePattern[] {
  return getAllPatterns().filter(p => p.category === category);
}
```

---

## File Structure

```
src/lib/
├── workbench/types/
│   ├── architecture.ts         (NEW - all types)
│   ├── wizard.ts               (UPDATE - add architecture fields)
│   ├── index.ts                (UPDATE - export architecture)
│   └── __tests__/
│       └── architecture.test.ts (NEW)
│
├── data/
│   ├── architecture-patterns/   (NEW DIRECTORY)
│   │   ├── desktop-app.ts
│   │   ├── fullstack-web.ts
│   │   ├── index.ts
│   │   └── __tests__/
│   │       └── patterns.test.ts
│   └── index.ts                (UPDATE - export patterns)
│
└── templates/                   (NEW DIRECTORY)
    ├── tauri/
    │   ├── main.rs.hbs
    │   ├── Cargo.toml.hbs
    │   └── tauri.conf.json.hbs
    ├── sveltekit/
    │   ├── package.json.hbs
    │   └── svelte.config.js.hbs
    └── fastapi/
        ├── main.py.hbs
        └── requirements.txt.hbs
```

---

## Testing Requirements

### 100% Coverage Required

All new code must have 100% test coverage (company policy).

### Test Files

**Pattern Validation Tests:**
```typescript
// src/lib/data/architecture-patterns/__tests__/patterns.test.ts

describe('Desktop App Pattern', () => {
  it('should have all required fields', () => {
    expect(desktopAppPattern.id).toBeDefined();
    expect(desktopAppPattern.components.length).toBeGreaterThan(0);
  });
  
  it('should have valid component dependencies', () => {
    // Verify all dependency IDs reference real components
  });
  
  it('should have consistent template variables', () => {
    // Verify all templates use same variable names
  });
});
```

**Type Tests:**
```typescript
// src/lib/workbench/types/__tests__/architecture.test.ts

describe('Architecture Types', () => {
  it('should narrow ComponentRole correctly', () => {
    const role: ComponentRole = 'backend';
    expect(role).toBe('backend');
  });
});
```

---

## Success Criteria

Phase 1 complete when:
- [ ] All TypeScript compiles without errors
- [ ] 100% test coverage achieved
- [ ] Desktop app pattern fully defined
- [ ] Full-stack web pattern fully defined  
- [ ] Pattern registry functional
- [ ] Templates are valid Handlebars
- [ ] No linting errors
- [ ] Backward compatibility maintained
- [ ] Documentation complete

---

## Important Notes

### Phase 1 Scope
- **DO:** Create types, patterns, templates
- **DON'T:** Modify wizard UI (that's Phase 2)
- **DON'T:** Implement project generator (that's Phase 3)

### Backward Compatibility
- Keep all existing `WizardData` fields
- Don't break existing wizard flow
- Add new fields as optional

### Code Quality
- Strict TypeScript, no `any`
- Full JSDoc on all public APIs
- Prefer `type` over `interface` for unions
- Use `const` assertions

---

This is your complete specification. Implement exactly as described.
