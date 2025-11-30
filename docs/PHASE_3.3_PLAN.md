# Phase 3.3 - Pattern Scaffolding Engine

## Overview

Transform VibeForge from a pattern browser into a **functional project generator** by implementing a robust scaffolding engine that can create real projects from architecture patterns.

**Goal**: Users click "Create Project" → Get a fully scaffolded, ready-to-run project
**Version**: 5.6.0
**Priority**: P0 - Critical Path

---

## Problem Statement

Currently, VibeForge has:
- ✅ 10 comprehensive architecture patterns
- ✅ Pattern comparison and preview
- ✅ Scaffolding templates defined in pattern files

But it **cannot**:
- ❌ Generate actual project files from templates
- ❌ Install dependencies automatically
- ❌ Initialize git repositories
- ❌ Show progress during scaffolding
- ❌ Handle errors gracefully

**User Impact**: Users can browse patterns but can't create projects from them.

---

## Success Criteria

1. ✅ User selects pattern → Real project files are created
2. ✅ Handlebars templates are processed with user-provided variables
3. ✅ Dependencies are automatically installed (npm, cargo, pip, poetry, etc.)
4. ✅ Git repository is initialized with initial commit
5. ✅ Progress is shown during scaffolding (file creation, dependency installation)
6. ✅ Errors are caught and displayed with rollback option
7. ✅ All 10 patterns can be scaffolded successfully
8. ✅ Generated projects are immediately runnable

---

## Architecture Design

### Backend (Rust/Tauri)

```
src-tauri/src/
├── main.rs
├── scaffolder/
│   ├── mod.rs              # Main scaffolder module
│   ├── template_engine.rs  # Handlebars processor
│   ├── file_generator.rs   # File/directory creation
│   ├── dependency_installer.rs  # npm, cargo, pip, etc.
│   ├── git_initializer.rs  # Git init + initial commit
│   ├── progress.rs         # Progress tracking
│   └── error.rs            # Error types and handling
```

### Frontend (TypeScript/Svelte)

```
src/lib/workbench/
├── components/
│   └── ScaffoldingProgress/
│       ├── ScaffoldingModal.svelte      # Main progress UI
│       ├── ProgressSteps.svelte         # Step indicator
│       ├── FileGenerationLog.svelte     # File creation log
│       └── ErrorDisplay.svelte          # Error handling UI
├── services/
│   └── scaffolder.ts                    # Tauri command wrapper
└── types/
    └── scaffolding.ts                   # Scaffolding types
```

---

## Implementation Plan

### Phase 3.3.1: Template Engine (Handlebars)
**Priority**: P0 - Foundation
**Timeline**: Day 1

**Tasks**:
1. Add Handlebars Rust crate dependency
2. Create template engine module
3. Implement variable substitution
4. Support helper functions (camelCase, kebab-case, PascalCase)
5. Add template validation
6. Write unit tests

**Deliverables**:
- `template_engine.rs` with Handlebars integration
- Template processing with `{{projectName}}`, `{{description}}`, etc.
- Custom helpers for case conversion
- Error handling for invalid templates

**Testing**:
```rust
assert_eq!(
  process_template("Hello {{name}}", {"name": "World"}),
  "Hello World"
);
```

---

### Phase 3.3.2: File Generation
**Priority**: P0 - Core Feature
**Timeline**: Day 1

**Tasks**:
1. Create file generator module
2. Implement directory creation (recursive)
3. Implement file writing with template processing
4. Add file permission handling (executable scripts)
5. Implement progress callbacks
6. Write unit tests

**Deliverables**:
- `file_generator.rs` with file/directory creation
- Progress events for each file created
- Support for binary files (images, etc.)
- Proper error handling for disk I/O

**Testing**:
```rust
let result = generate_files(pattern, project_path, variables);
assert!(Path::new(&project_path).join("package.json").exists());
```

---

### Phase 3.3.3: Dependency Installation
**Priority**: P0 - Essential
**Timeline**: Day 2

**Tasks**:
1. Create dependency installer module
2. Detect package manager (npm, pnpm, yarn, cargo, pip, poetry)
3. Implement installation for each package manager
4. Add timeout handling (max 5 minutes)
5. Capture and stream output
6. Handle installation failures gracefully

**Deliverables**:
- `dependency_installer.rs` with multi-tool support
- Automatic detection: `package.json` → npm/pnpm, `Cargo.toml` → cargo
- Progress streaming for installation output
- Timeout and cancellation support

**Supported Package Managers**:
- **Node.js**: npm, pnpm, yarn
- **Rust**: cargo
- **Python**: pip, poetry
- **Go**: go mod
- **Docker**: docker-compose pull (optional)

---

### Phase 3.3.4: Git Initialization
**Priority**: P1 - Important
**Timeline**: Day 2

**Tasks**:
1. Create git initializer module
2. Implement `git init`
3. Create `.gitignore` from template
4. Stage all files (`git add .`)
5. Create initial commit
6. Add optional remote setup

**Deliverables**:
- `git_initializer.rs` with git commands
- Automatic `.gitignore` generation based on pattern
- Initial commit message: "🎉 Initial commit - Created with VibeForge"
- Error handling if git is not installed

---

### Phase 3.3.5: Progress Tracking & UI
**Priority**: P0 - UX Critical
**Timeline**: Day 2-3

**Tasks**:
1. Create progress event system
2. Implement Tauri events for progress updates
3. Create ScaffoldingModal component
4. Add step indicator (1. Files → 2. Dependencies → 3. Git)
5. Show file-by-file creation log
6. Display installation output
7. Handle success/error states

**Deliverables**:
- `ScaffoldingModal.svelte` with real-time progress
- Step-by-step visual indicator
- Scrollable log of file creation
- Success screen with "Open in IDE" button
- Error screen with retry option

**Progress Steps**:
1. **Preparing** (5%) - Validating pattern
2. **Creating Files** (5-50%) - Generating project structure
3. **Installing Dependencies** (50-90%) - Running package managers
4. **Initializing Git** (90-95%) - Setting up repository
5. **Complete** (100%) - Project ready

---

### Phase 3.3.6: Error Handling & Rollback
**Priority**: P0 - Reliability
**Timeline**: Day 3

**Tasks**:
1. Implement error types for each stage
2. Add rollback on failure (delete partial project)
3. Create error display UI
4. Add retry mechanism
5. Log errors for debugging

**Deliverables**:
- `error.rs` with comprehensive error types
- Automatic rollback on failure
- User-friendly error messages
- "Try Again" and "Cancel" options

**Error Scenarios**:
- Disk full
- Permission denied
- Network timeout (dependency installation)
- Git not installed
- Invalid template syntax

---

## Data Flow

### User Interaction Flow

```
1. User selects pattern in wizard
2. User enters project details:
   - Project name: "my-awesome-app"
   - Description: "A cool new app"
   - Location: ~/projects/my-awesome-app
3. User clicks "Create Project"
4. ScaffoldingModal opens
5. Backend processes scaffolding:
   a. Validate inputs
   b. Create project directory
   c. Generate files from templates
   d. Install dependencies
   e. Initialize git
6. Progress updates stream to frontend
7. Success/Error screen shown
8. User clicks "Open Project"
```

### Tauri Commands

```rust
#[tauri::command]
async fn scaffold_project(
  pattern_id: String,
  project_name: String,
  project_path: String,
  variables: HashMap<String, String>,
  window: Window
) -> Result<ScaffoldResult, ScaffoldError> {
  // 1. Create scaffolder
  let scaffolder = Scaffolder::new(pattern_id, project_path);

  // 2. Set up progress callbacks
  scaffolder.on_progress(|event| {
    window.emit("scaffolding-progress", event).ok();
  });

  // 3. Execute scaffolding
  let result = scaffolder
    .generate_files(variables)
    .install_dependencies()
    .initialize_git()
    .await?;

  Ok(result)
}

#[tauri::command]
async fn cancel_scaffolding(
  project_path: String
) -> Result<(), ScaffoldError> {
  // Rollback partial project
  Scaffolder::rollback(project_path).await
}
```

### Progress Events

```typescript
interface ScaffoldProgressEvent {
  stage: 'preparing' | 'files' | 'dependencies' | 'git' | 'complete';
  progress: number; // 0-100
  message: string;
  details?: string; // Optional detailed log
}

// Examples:
{ stage: 'files', progress: 25, message: 'Creating src/main.ts' }
{ stage: 'dependencies', progress: 60, message: 'Installing dependencies...', details: '⠸ Installing packages...' }
{ stage: 'git', progress: 95, message: 'Initializing git repository' }
```

---

## UI/UX Design

### Scaffolding Modal

```
┌─────────────────────────────────────────────────┐
│  Creating Project: my-awesome-app               │
├─────────────────────────────────────────────────┤
│                                                 │
│  ● Files ──────● Dependencies ──────○ Git      │
│                                                 │
│  Progress: 60% ████████████░░░░░░░░░           │
│                                                 │
│  Installing dependencies...                     │
│                                                 │
│  📦 Log:                                        │
│  ┌────────────────────────────────────────┐   │
│  │ ✓ Created package.json                 │   │
│  │ ✓ Created src/index.ts                 │   │
│  │ ✓ Created src/routes/+page.svelte     │   │
│  │ ⠸ Installing packages...               │   │
│  │   ├─ @sveltejs/kit                     │   │
│  │   ├─ typescript                        │   │
│  │   └─ vite                              │   │
│  └────────────────────────────────────────┘   │
│                                                 │
│  [Cancel]                                       │
└─────────────────────────────────────────────────┘
```

### Success Screen

```
┌─────────────────────────────────────────────────┐
│  ✅ Project Created Successfully!               │
├─────────────────────────────────────────────────┤
│                                                 │
│  my-awesome-app                                 │
│  📂 ~/projects/my-awesome-app                   │
│                                                 │
│  ✓ 24 files created                            │
│  ✓ Dependencies installed                      │
│  ✓ Git initialized                             │
│                                                 │
│  Next steps:                                    │
│  1. cd my-awesome-app                          │
│  2. npm run dev                                │
│  3. Open http://localhost:5173                 │
│                                                 │
│  [Open in VS Code]  [Open Folder]  [Close]    │
└─────────────────────────────────────────────────┘
```

### Error Screen

```
┌─────────────────────────────────────────────────┐
│  ❌ Scaffolding Failed                          │
├─────────────────────────────────────────────────┤
│                                                 │
│  Stage: Installing Dependencies                 │
│  Error: Network timeout                        │
│                                                 │
│  Unable to install packages. Please check      │
│  your internet connection and try again.       │
│                                                 │
│  Details:                                       │
│  ┌────────────────────────────────────────┐   │
│  │ npm ERR! network timeout                │   │
│  │ npm ERR! A complete log of this run    │   │
│  │ can be found in: ~/.npm/_logs          │   │
│  └────────────────────────────────────────┘   │
│                                                 │
│  [Try Again]  [Skip Dependencies]  [Cancel]   │
└─────────────────────────────────────────────────┘
```

---

## Technical Challenges

### Challenge 1: Long-Running Operations
**Problem**: Dependency installation can take 1-5 minutes
**Solution**:
- Run in background thread
- Stream progress events
- Add cancellation support
- Show animated spinner

### Challenge 2: Cross-Platform Compatibility
**Problem**: Different package managers, shell commands
**Solution**:
- Detect platform (Windows, macOS, Linux)
- Use cross-platform Rust libraries
- Test on all platforms

### Challenge 3: Error Recovery
**Problem**: Partial project creation on failure
**Solution**:
- Transactional approach where possible
- Rollback mechanism (delete project folder)
- Clear error messages with recovery options

### Challenge 4: Template Complexity
**Problem**: Some patterns have 50+ files
**Solution**:
- Efficient file I/O (async writes)
- Batch progress updates (every 5 files)
- Show top-level directories first

---

## Testing Strategy

### Unit Tests
- Template engine with various inputs
- File generation with different patterns
- Dependency detection logic
- Git command execution

### Integration Tests
- Full scaffolding flow for each pattern
- Error handling and rollback
- Progress event emission
- Cancellation during each stage

### Manual Testing Checklist
- [ ] Scaffold all 10 patterns successfully
- [ ] Cancel during file creation → rollback works
- [ ] Cancel during dependency installation → rollback works
- [ ] Network failure during npm install → error shown
- [ ] Disk full → error shown with rollback
- [ ] Git not installed → git step skipped with warning
- [ ] Project already exists → error shown
- [ ] Invalid project name → validation error

---

## Dependencies

### Rust Crates
```toml
[dependencies]
handlebars = "4.5"           # Template engine
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "1"              # Error handling
async-trait = "0.1"
```

### Frontend Packages
No new dependencies needed (using existing Svelte/Tauri setup)

---

## Timeline

### Day 1 (8 hours)
- ✅ Phase 3.3.1: Template Engine (3 hours)
- ✅ Phase 3.3.2: File Generation (5 hours)

### Day 2 (8 hours)
- ✅ Phase 3.3.3: Dependency Installation (4 hours)
- ✅ Phase 3.3.4: Git Initialization (2 hours)
- ✅ Phase 3.3.5: Progress Tracking (2 hours)

### Day 3 (8 hours)
- ✅ Phase 3.3.5: Progress UI (4 hours)
- ✅ Phase 3.3.6: Error Handling (3 hours)
- ✅ Testing & Polish (1 hour)

**Total**: ~24 hours over 3 days

---

## Risks & Mitigation

### Risk 1: Platform-Specific Issues
**Impact**: High
**Probability**: Medium
**Mitigation**: Test on Windows, macOS, Linux early

### Risk 2: Dependency Installation Failures
**Impact**: High
**Probability**: Medium
**Mitigation**: Add skip option, retry logic, offline mode

### Risk 3: Template Syntax Errors
**Impact**: Medium
**Probability**: Low
**Mitigation**: Validate all templates upfront, unit tests

### Risk 4: Performance (Large Projects)
**Impact**: Medium
**Probability**: Low
**Mitigation**: Async I/O, batch updates, progress streaming

---

## Success Metrics

### Quantitative
- ✅ All 10 patterns scaffold successfully (100% success rate)
- ✅ Average scaffolding time < 3 minutes
- ✅ Error rate < 5% on valid inputs
- ✅ Rollback success rate 100%

### Qualitative
- ✅ Users can create projects without manual file creation
- ✅ Progress feedback is clear and informative
- ✅ Errors are understandable and actionable
- ✅ Generated projects run immediately without manual setup

---

## Post-Launch

### Phase 3.3.7 (Optional Enhancements)
- Custom template variables (advanced users)
- Template marketplace (community patterns)
- Scaffolding presets (save favorite configurations)
- Remote template loading (GitHub repos)

---

## Conclusion

Phase 3.3 transforms VibeForge from a **pattern browser** into a **functional project generator**. This is the most critical phase for delivering real user value.

After Phase 3.3, users will be able to:
1. Browse 10 architecture patterns ✅
2. Compare patterns side-by-side ✅
3. Preview pattern documentation ✅
4. **Create real, working projects in minutes** ← NEW!

**Status**: Ready to Begin
**Next Step**: Implement Phase 3.3.1 - Template Engine
