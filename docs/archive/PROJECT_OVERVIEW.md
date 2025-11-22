# VibeForge: Complete Project Implementation Guide

**Version:** 0.0.1 (MVP Phase)  
**Last Updated:** November 18, 2025  
**Status:** Production-Ready with Active Development

---

## 📋 Table of Contents

1. [Project Vision & Architecture](#project-vision--architecture)
2. [Tech Stack](#tech-stack)
3. [Application Structure](#application-structure)
4. [Core Features Implemented](#core-features-implemented)
5. [Component Architecture](#component-architecture)
6. [State Management](#state-management)
7. [Design System](#design-system)
8. [Feature Breakdown by Page](#feature-breakdown-by-page)
9. [Document Ingestion System](#document-ingestion-system)
10. [Development Workflow](#development-workflow)
11. [Build & Deployment](#build--deployment)
12. [Future Roadmap](#future-roadmap)

---

## Project Vision & Architecture

### What is VibeForge?

**VibeForge** is a professional prompt engineering workbench designed for AI developers and researchers who need to craft, test, and refine prompts for large language models. It's not a chat interface—it's a structured workspace for building, organizing, and executing prompts with precision.

### Core Philosophy

VibeForge is built on three foundational principles:

1. **3-Column Layout Philosophy**
   - **Left Column (Context):** Reusable prompt components and context blocks
   - **Center Column (Prompt):** Main prompt editor with real-time composition
   - **Right Column (Output):** Model responses and execution history
   - This layout ensures low cognitive load and professional workflows

2. **Structured Context Management**
   - Prompt engineers can compose complex prompts by layering different context types
   - Each context block is independently manageable and versioned
   - System prompts, design specifications, project context, and code snippets are all composable

3. **Execution & History Tracking**
   - Every prompt execution is logged with metadata
   - Users can compare model outputs, review iterations, and build evaluation metrics
   - Full audit trail of what was sent and what was received

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     VibeForge Application                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Context    │  │    Prompt    │  │    Output    │     │
│  │   Column     │  │   Column     │  │   Column     │     │
│  │              │  │              │  │              │     │
│  │ - Library    │  │ - Editor     │  │ - Responses  │     │
│  │ - Search     │  │ - Chips      │  │ - History    │     │
│  │ - Filter     │  │ - Tokens     │  │ - Compare    │     │
│  │ - Preview    │  │ - Compose    │  │ - Evals      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Navigation Sidebar  │  Top Bar (Theme, Settings, Help)    │
├─────────────────────────────────────────────────────────────┤
│              State Management (Svelte Stores)              │
│  - Theme Store      - Context Store    - Run Store         │
│  - Prompt Store     - Preset Store     - Accessibility    │
├─────────────────────────────────────────────────────────────┤
│                  Supporting Pages                          │
│  - Quick Run       - History        - Patterns             │
│  - Presets         - Evaluations    - Workspaces           │
│  - Settings        - Document Ingestion                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend Framework
- **SvelteKit 2.x** - Full-stack metaframework for Svelte
- **Svelte 5.43** - Latest version with runes (`$state`, `$derived`, `$props`)
- **TypeScript 5.9** - Full type safety throughout

### Styling & UI
- **Tailwind CSS v4** - Utility-first CSS framework via `@tailwindcss/vite`
- **Custom Forge Design System** - Dark-by-default theme inspired by forged steel
- **Responsive Design** - Mobile-first, works from mobile to 4K displays

### Build & Development
- **Vite 7.x** - Lightning-fast build tool and dev server
- **pnpm** - Fast, disk space efficient package manager
- **TypeScript** - Compile-time type checking throughout

### Architecture Patterns
- **File-based Routing** - SvelteKit's automatic page routing
- **Store-based State** - Centralized state management with Svelte stores
- **Component Composition** - Modular, reusable UI components
- **Server-Side Rendering** - SSR-ready with browser compatibility

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ JavaScript support required
- CSS Grid and Flexbox support required

---

## Application Structure

```
vibeforge/
├── src/
│   ├── routes/                    # SvelteKit pages (file-based routing)
│   │   ├── +layout.svelte         # Root layout with nav, theme, shells
│   │   ├── +page.svelte           # Main workbench (3-column)
│   │   ├── contexts/              # Context library browser
│   │   ├── evals/                 # Model evaluation dashboard
│   │   ├── history/               # Run history & replay
│   │   ├── patterns/              # Prompt patterns library
│   │   ├── presets/               # Saved configurations
│   │   ├── quick-run/             # Quick experiment mode
│   │   ├── settings/              # User preferences
│   │   └── workspaces/            # Multi-workspace management
│   │
│   ├── lib/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── ContextColumn.svelte
│   │   │   ├── PromptColumn.svelte
│   │   │   ├── OutputColumn.svelte
│   │   │   ├── ForgeSideNav.svelte
│   │   │   ├── ForgeTopBar.svelte
│   │   │   ├── WorkbenchShell.svelte
│   │   │   ├── StatusBar.svelte
│   │   │   ├── research/          # Research & Assist panel
│   │   │   │   └── ResearchAssistDrawer.svelte
│   │   │   ├── ingest/            # Document ingestion
│   │   │   │   ├── UploadIngestModal.svelte
│   │   │   │   └── IngestQueuePanel.svelte
│   │   │   ├── context/           # Context management components
│   │   │   ├── history/           # History & replay components
│   │   │   ├── evaluations/       # Evaluation components
│   │   │   ├── patterns/          # Pattern library components
│   │   │   ├── presets/           # Preset management components
│   │   │   ├── settings/          # Settings panel components
│   │   │   ├── quickrun/          # Quick run components
│   │   │   └── workspaces/        # Workspace components
│   │   │
│   │   ├── stores/                # Svelte state management
│   │   │   ├── themeStore.ts      # Dark/light theme
│   │   │   ├── promptStore.ts     # Active prompt state
│   │   │   ├── contextStore.ts    # Context blocks library
│   │   │   ├── runStore.ts        # Model run history
│   │   │   ├── presetsStore.ts    # Saved configurations
│   │   │   └── accessibilityStore.ts
│   │   │
│   │   ├── types/                 # TypeScript interfaces
│   │   │   ├── context.ts
│   │   │   ├── evaluation.ts
│   │   │   ├── run.ts
│   │   │   └── workspace.ts
│   │   │
│   │   └── index.ts               # Export central
│   │
│   ├── app.css                    # Global styles & Tailwind
│   ├── app.d.ts                   # Type definitions
│   ├── app.html                   # HTML shell
│   └── vite-env.d.ts
│
├── static/                        # Static assets
├── svelte.config.js               # Svelte config
├── tailwind.config.cjs.bak        # Tailwind theme extensions
├── tsconfig.json                  # TypeScript config
├── vite.config.ts                 # Vite config
└── package.json                   # Dependencies

Documentation:
├── .github/
│   └── copilot-instructions.md    # Architecture & patterns guide
├── PROJECT_OVERVIEW.md            # This file
├── DOCUMENT_INGESTION_INTEGRATION.md
├── DOCUMENT_INGESTION_VISUAL_GUIDE.md
├── DOCUMENT_INGESTION_CODE_REFERENCE.md
├── DOCUMENT_INGESTION_TESTING.md
├── SESSION_SUMMARY.md
├── DOCUMENTATION_INDEX.md
├── COMPLETION_REPORT.md
├── QUICK_REFERENCE.md
├── README_DOCUMENT_INGESTION.md
└── START_HERE.md
```

---

## Core Features Implemented

### ✅ Production-Ready Features

#### 1. **Main Workbench** (`/`)
The heart of VibeForge—where prompt engineers craft and test prompts.

**Components:**
- `ContextColumn.svelte` - Displays available context blocks with search/filter
- `PromptColumn.svelte` - Main prompt editor with active context chips and token counter
- `OutputColumn.svelte` - Model responses and run history
- `ResearchAssistDrawer.svelte` - Side panel for research notes, snippets, suggestions

**Features:**
- Real-time prompt composition
- Active context visualization (chip display)
- Token estimation (~4 chars = 1 token)
- Response history tracking
- Research notes & snippet library
- Model comparison view

---

#### 2. **Context Library** (`/contexts`)
Browse, search, and manage reusable prompt context blocks.

**Components:**
- `ContextLibraryHeader.svelte` - Title, stats, "Add Documents" button
- `ContextFilters.svelte` - Search, type filter, tag filter
- `ContextList.svelte` - Scrollable list of context blocks
- `ContextDetailPanel.svelte` - View and manage selected context

**Features:**
- Search by name, summary, tags
- Filter by context type (system, design, project, code, workflow)
- Tag-based filtering
- Detail view with preview
- "Send to Workbench" action

**NEW:** Document Ingestion Integration
- `UploadIngestModal.svelte` - Upload documents with metadata
- `IngestQueuePanel.svelte` - Track document processing status
- Drag-drop file upload
- File metadata editing (title, category, tags)
- Ingestion queue with status tracking (queued, processing, ready, error)

---

#### 3. **Quick Run** (`/quick-run`)
Lightweight single-column interface for rapid experimentation.

**Features:**
- Simple prompt input
- Quick model comparison (1-2 models side-by-side)
- Minimal context setup
- Fast execution
- Perfect for tactical testing

---

#### 4. **Run History** (`/history`)
View, replay, and analyze all prompt executions.

**Components:**
- `HistoryHeader.svelte` - Title, stats, export options
- `HistoryFilters.svelte` - Filter by date, model, status
- `HistoryTable.svelte` - Sortable table of runs
- `HistoryDetailPanel.svelte` - Full run details with metrics

**Features:**
- Complete execution audit trail
- Timestamp & model tracking
- Input/output comparison
- Filter by date range or model
- Replay functionality (re-execute with same prompt)
- Metrics tracking

---

#### 5. **Prompt Patterns** (`/patterns`)
Library of reusable prompt templates and patterns.

**Components:**
- `PatternsHeader.svelte` - Title, add new pattern
- `PatternsFilters.svelte` - Search, category, tag filters
- `PatternsList.svelte` - Pattern list view
- `PatternDetailPanel.svelte` - Pattern details & usage

**Features:**
- Pre-built prompt templates
- Category organization
- Tag-based discovery
- Usage metrics
- Quick load into workbench

---

#### 6. **Presets** (`/presets`)
Save and quickly load workbench configurations.

**Components:**
- `PresetsHeader.svelte` - Title, create new preset
- `PresetsList.svelte` - List of saved configurations
- `PresetsDrawer.svelte` - Sidebar preset quick-access
- `PresetDetailPanel.svelte` - View and edit presets

**Features:**
- Save current workbench state as preset
- Include selected contexts and model choices
- Pin frequently used presets
- One-click load
- Quick access from sidebar

---

#### 7. **Evaluations Dashboard** (`/evals`)
Compare and evaluate model outputs systematically.

**Components:**
- `EvaluationsHeader.svelte` - Title, create evaluation
- `EvaluationsFilters.svelte` - Filter evaluations
- `EvaluationsList.svelte` - List of evaluations
- `EvaluationDetail.svelte` - Detailed scoring & analysis

**Features:**
- Create side-by-side comparisons
- Define evaluation criteria
- Score multiple outputs
- Comparative metrics
- Export results

---

#### 8. **Workspaces** (`/workspaces`)
Multi-workspace support for team collaboration and project organization.

**Components:**
- `WorkspacesHeader.svelte` - Title, create workspace
- `WorkspacesList.svelte` - List of workspaces
- `WorkspaceDetailPanel.svelte` - Workspace settings
- `WorkspaceEditorDrawer.svelte` - Edit workspace details

**Features:**
- Multiple isolated workspaces
- Per-workspace settings
- Workspace switching
- Activity tracking
- Shared configurations
- Invite team members (future)

---

#### 9. **Settings** (`/settings`)
User preferences and application configuration.

**Sections:**
- `WorkspaceSettingsSection.svelte` - Workspace defaults
- `AppearanceSettingsSection.svelte` - Theme, font size, density
- `ModelSettingsSection.svelte` - API keys, endpoints
- `DataSettingsSection.svelte` - Data retention, privacy

**Features:**
- Theme toggle (dark/light)
- Font size adjustment
- UI density control
- Model API configuration
- Data management policies

---

### 🎨 Design System & Theming

#### Forge Color Palette

**Dark Mode (Default):**
- `forge-blacksteel: #0B0F17` - Primary backgrounds
- `forge-gunmetal: #111827` - Secondary backgrounds
- `forge-steel: #1E293B` - Interactive states
- `forge-textBright: #F8FAFC` - Primary text
- `forge-textDim: #CBD5E1` - Secondary text
- `forge-textMuted: #94A3B8` - Tertiary text
- `forge-line: #233044` - Borders

**Light Mode:**
- `forge-quench: #F8FAFC` - Primary backgrounds
- `forge-quenchLift: #E2E8F0` - Secondary backgrounds
- Light slate variants for text

**Accent Colors:**
- `forge-ember: #FBBF24` - Primary action/highlight
- `forge-emberHover: #F59E0B` - Hover state
- `forge-info: #3B82F6` - Information
- `forge-danger: #EF4444` - Errors/destructive
- `forge-success: #22C55E` - Success states

#### Theme Implementation

All components check the `$theme` store and apply conditional Tailwind classes:

```typescript
<div class={`px-4 py-3 ${
  $theme === 'dark' 
    ? 'bg-slate-900 text-slate-100 border-slate-700' 
    : 'bg-white text-slate-900 border-slate-200'
}`}>
  Content
</div>
```

---

## Component Architecture

### Layout Components

#### `ForgeSideNav.svelte` (Navigation Sidebar)
- Fixed left sidebar (224px / `w-56`)
- Emoji-based navigation icons
- Active route highlighting
- Links to all major features
- Collapsible on mobile

#### `ForgeTopBar.svelte` (Header Bar)
- Fixed top bar with application title
- Theme toggle button
- Settings link
- Help/documentation link
- Search functionality (future)

#### `WorkbenchShell.svelte` (Content Wrapper)
- Flex container for page content
- Padding and spacing
- Responsive to sidebar state
- Dark/light mode support

#### `StatusBar.svelte` (Footer Bar)
- Optional footer for status information
- Token counts, run status
- Model indicators

### Column Components (Main Workbench)

#### `ContextColumn.svelte` (Left Column)
- Displays available context blocks
- Drag-to-reorder capability
- "Active" context highlighting
- Quick preview on hover
- Tag display

#### `PromptColumn.svelte` (Center Column)
- Textarea for prompt composition
- Active context chips (visual)
- Character/token counter
- Copy/paste helpers
- Send button integration

#### `OutputColumn.svelte` (Right Column)
- Display area for model responses
- History list (scrollable)
- Response metadata (model, time, tokens)
- Compare responses
- Copy output functionality

### Feature Panels

#### Drawer Components
- `ResearchAssistDrawer.svelte` - Research notes, snippets, suggestions
- `PresetsDrawer.svelte` - Quick preset access
- All drawers slide from sidebar or slide-out from edges

#### Modal Components
- `UploadIngestModal.svelte` - File upload interface
- `SavePresetModal.svelte` - Save prompt configuration
- Form modals for creating contexts, workspaces, evaluations

#### List Components
- Consistent table layouts for history, patterns, presets
- Sortable columns
- Filtering and search
- Pagination (where applicable)
- Empty states

---

## State Management

### Svelte Stores Architecture

All stores use Svelte's `writable` and derived stores. They follow a consistent pattern:

```typescript
import { writable, derived } from 'svelte/store';

// Define store with initial value
const storeState = writable<StateType>(initialValue);

// Create public store for readonly access
export const store = { subscribe: storeState.subscribe };

// Export methods for mutations
export const updateStore = (value: StateType) => {
  storeState.set(value);
};

// Create derived stores if needed
export const derivedStore = derived(storeState, $state => {
  return // computed value
});
```

### Core Stores

#### `themeStore.ts`
**Purpose:** Manage application theme (dark/light mode)

**State:**
```typescript
type Theme = 'dark' | 'light';
```

**Methods:**
- `setTheme(theme: Theme)` - Change theme
- `toggle()` - Toggle between dark/light

**Persistence:** localStorage with key `'vibeforge-theme'`

**Side Effects:** Updates `document.documentElement.dataset.theme`

---

#### `promptStore.ts`
**Purpose:** Manage active prompt text and metadata

**State:**
```typescript
interface PromptState {
  text: string;
  lastUpdated: string; // ISO timestamp
}
```

**Methods:**
- `setText(text: string)` - Update prompt text
- `reset()` - Clear prompt

**Derived Stores:**
- `estimatedTokens` - Calculated as `text.length / 4`

---

#### `contextStore.ts`
**Purpose:** Manage available context blocks and active selections

**State:**
```typescript
interface ContextBlock {
  id: string;
  title: string;
  kind: 'system' | 'design' | 'project' | 'code' | 'workflow';
  description: string;
  tags: string[];
  isActive: boolean;
  lastUpdated: string;
  source: 'global' | 'workspace' | 'local';
}
```

**Methods:**
- `toggleActive(id: string)` - Toggle context active state
- `addContext(block: ContextBlock)` - Add new context
- `removeContext(id: string)` - Delete context
- `updateContext(id: string, partial: Partial<ContextBlock>)` - Update context

**Derived Stores:**
- `activeContexts` - Filtered list of active contexts only
- `allTags` - Unique tags from all contexts

---

#### `runStore.ts`
**Purpose:** Manage model execution history

**State:**
```typescript
interface ModelRun {
  id: string;
  model: string;
  prompt: string;
  output: string;
  tokens: {
    input: number;
    output: number;
  };
  timestamp: string; // ISO timestamp
  status: 'pending' | 'complete' | 'error';
  errorMessage?: string;
}

interface RunState {
  runs: ModelRun[];
  activeRunId: string | null;
}
```

**Methods:**
- `addRun(run: ModelRun)` - Record new execution
- `setActiveRun(id: string)` - Select run for viewing
- `reset()` - Clear all runs

**Derived Stores:**
- `activeRun` - Currently selected run
- `recentRuns` - Last N runs

---

#### `presetsStore.ts`
**Purpose:** Manage saved workbench configurations

**State:**
```typescript
interface Preset {
  id: string;
  name: string;
  description: string;
  category: 'coding' | 'writing' | 'analysis' | 'evaluation' | 'other';
  workspace: string;
  tags: string[];
  basePrompt: string;
  contextRefs: Array<{ id: string; label: string }>;
  models: string[];
  pinned: boolean;
  updatedAt: string; // ISO timestamp
}
```

**Methods:**
- `togglePinned(id: string)` - Pin/unpin preset
- `addPreset(preset: Preset)` - Save new configuration
- `removePreset(id: string)` - Delete preset
- `updatePreset(id: string, partial: Partial<Preset>)` - Modify preset

**Derived Stores:**
- `pinnedPresets` - Presets with `pinned === true`
- `allPresets` - All available presets

---

#### `accessibilityStore.ts`
**Purpose:** Manage user accessibility preferences

**State:**
```typescript
interface AccessibilityState {
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  reducedMotion: boolean;
  highContrast: boolean;
}
```

**Methods:**
- `setFontSize(size)` - Change font size
- `toggleReducedMotion()` - Reduce animations
- `toggleHighContrast()` - Increase contrast

**Persistence:** localStorage with key `'forge-accessibility'`

**Side Effects:** Updates CSS variables on document root

---

### Store Integration Pattern

All stores follow this pattern for integration:

```svelte
<script lang="ts">
  import { theme } from '$lib/stores/themeStore';
  import { promptState } from '$lib/stores/promptStore';
  
  // Subscribe to stores
  $: $theme // Reactive
  $: text = $promptState.text // Destructure
</script>

<!-- Use in template -->
<div class={`bg-${$theme === 'dark' ? 'slate-900' : 'white'}`}>
  {$promptState.text}
</div>
```

---

## Feature Breakdown by Page

### Main Workbench (`/`)

**URL:** `http://localhost:5173/`

**Layout:** 3-column grid
- **Left (25%):** Context Column
- **Center (45%):** Prompt Column
- **Right (30%):** Output Column

**Key Features:**
1. **Context Management**
   - View all available context blocks
   - Search/filter by type and tags
   - Toggle active status
   - Drag-to-reorder
   - Quick preview on hover

2. **Prompt Composition**
   - Large textarea for prompt text
   - Display active context as chips
   - Real-time token counter
   - Character counter
   - Auto-save to store

3. **Research & Assist Panel** (NEW)
   - 3-tab interface: Notes, Snippets, Suggestions
   - Save research notes between sessions
   - Pre-built snippet templates
   - 6 prompting best practice suggestions
   - One-click snippet insertion into prompt

4. **Output Display**
   - Model response rendering
   - Metadata display (model, time, tokens used)
   - Copy-to-clipboard
   - History sidebar
   - Response comparison mode

5. **Responsive Behavior**
   - Desktop: Full 3-column layout
   - Tablet (768px): 2-column layout
   - Mobile: Single column (vertical stack)

---

### Context Library (`/contexts`)

**URL:** `http://localhost:5173/contexts`

**Layout:** 2-column grid (left: filters+list, right: detail)

**Key Features:**
1. **Header Section**
   - Total block count
   - Filtered count display
   - **NEW:** "📄 Add Documents" button for file uploads

2. **Filtering**
   - Full-text search (name, summary, tags)
   - Type filter (system, design, project, code, workflow)
   - Tag multi-select
   - Dynamic tag population

3. **Context List**
   - Sortable columns (name, type, tags, updated)
   - Click to select
   - Visual active state
   - Size indicators (small/medium/large)

4. **Detail Panel**
   - Full context preview
   - Tag display with counts
   - Last updated timestamp
   - "Send to Workbench" button
   - Edit/delete options

5. **Document Ingestion** (NEW)
   - Upload modal with drag-drop
   - File list with editable metadata
   - Category selection per file
   - Shared tags input
   - Ingestion queue display
   - Status tracking (queued, processing, ready, error)
   - Progress simulation button (demo)

---

### Quick Run (`/quick-run`)

**URL:** `http://localhost:5173/quick-run`

**Layout:** Single column, compact form

**Key Features:**
1. **Minimal Setup**
   - Quick prompt input box
   - Model selection (dropdown or tabs)
   - No context library requirement
   - Inline output display

2. **Speed Optimized**
   - Fewer options and distractions
   - Direct model selection
   - Quick metrics display
   - Perfect for rapid testing

3. **Flexibility**
   - Can add context if needed
   - Supports preset loading
   - Save as preset option

---

### Run History (`/history`)

**URL:** `http://localhost:5173/history`

**Layout:** 2-column (list + detail)

**Key Features:**
1. **History Table**
   - Sortable columns: Model, Input length, Output length, Status, Timestamp
   - Pagination (optional)
   - Export to CSV/JSON
   - Clear history option

2. **Filtering**
   - Date range picker
   - Model filter
   - Status filter (complete, error, pending)
   - Free-text search

3. **Detail View**
   - Full prompt display
   - Complete model response
   - Metadata: model, tokens, duration
   - Replay button (re-execute same prompt)
   - Compare with other runs

4. **Metrics**
   - Total runs count
   - Success rate
   - Average tokens per run
   - Most used models

---

### Patterns Library (`/patterns`)

**URL:** `http://localhost:5173/patterns`

**Layout:** 2-column (list + detail)

**Key Features:**
1. **Pattern List**
   - Pre-built prompt templates
   - Category organization
   - Star/favorite patterns
   - Quick copy to workbench

2. **Pattern Details**
   - Template preview
   - Usage instructions
   - Example outputs
   - Related patterns
   - Edit/manage options

3. **Categories**
   - Code generation
   - Text analysis
   - Creative writing
   - Summarization
   - Q&A

4. **Filtering**
   - Search by name
   - Category filter
   - Tag filter
   - Sort by popularity/date

---

### Presets (`/presets`)

**URL:** `http://localhost:5173/presets`

**Layout:** 2-column (list + detail)

**Key Features:**
1. **Saved Configurations**
   - Save current workbench state
   - Include selected contexts
   - Include model selections
   - Include prompt template

2. **Quick Load**
   - One-click to restore
   - Pin favorites
   - Organize by category
   - Tag for discovery

3. **Management**
   - Edit preset metadata
   - Update included contexts
   - Modify model selections
   - Delete unused presets

4. **Sidebar Integration**
   - Quick access drawer
   - Pin/unpin from sidebar
   - Recent presets list

---

### Evaluations Dashboard (`/evals`)

**URL:** `http://localhost:5173/evals`

**Layout:** 2-column (list + detail)

**Key Features:**
1. **Evaluation Creation**
   - Define evaluation criteria
   - Set scoring rubric
   - Select outputs to compare
   - Set evaluation scale (1-5 or 1-10)

2. **Scoring Interface**
   - Side-by-side output display
   - Scoring form for each criteria
   - Notes per score
   - Final winner selection (optional)

3. **Results Display**
   - Comparative metrics
   - Score distribution charts
   - Winner highlighting
   - Export results

4. **History**
   - Previous evaluations
   - Comparative analysis
   - Trend analysis
   - Reusable evaluation templates

---

### Workspaces (`/workspaces`)

**URL:** `http://localhost:5173/workspaces`

**Layout:** 2-column (list + detail)

**Key Features:**
1. **Workspace Management**
   - Create new workspace
   - Switch between workspaces
   - Set default workspace
   - Archive unused workspaces

2. **Workspace Settings**
   - Name and description
   - Default model selection
   - Default evaluation scale
   - Preferred context types
   - Tags

3. **Activity Tracking**
   - Total runs per workspace
   - Last activity date
   - Most used models
   - Top performers

4. **Isolation**
   - Separate contexts per workspace
   - Independent presets
   - Isolated run history
   - Workspace-specific settings

---

### Settings (`/settings`)

**URL:** `http://localhost:5173/settings`

**Layout:** Single column with sections

**Key Features:**
1. **Workspace Settings Section**
   - Default workspace
   - Default model
   - Evaluation scale default
   - Require winner in evals

2. **Appearance Section**
   - Theme toggle (dark/light)
   - Font size selector
   - UI density (compact/comfortable/spacious)
   - Accessibility options

3. **Model Settings Section**
   - API key configuration
   - Model endpoints
   - Default parameters
   - API rate limits

4. **Data Settings Section**
   - History retention policy
   - Auto-delete settings
   - Data export options
   - Privacy settings
   - Analytics opt-in

---

## Document Ingestion System

### Overview

The Document Ingestion system allows users to upload documents to the Context Library, track their processing status, and eventually convert them into usable context blocks.

### Components

#### `UploadIngestModal.svelte`
**Purpose:** Modal interface for uploading documents with metadata

**Features:**
- Drag-and-drop file input
- Click-to-browse file picker
- File list with editable metadata
- Per-file title and category selection
- Shared workspace and tags fields
- Validation (requires at least 1 file)
- "Start Ingestion" button

**Data Model:**
```typescript
interface IngestDocument {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  title: string;
  workspace: string;
  category: 'reference' | 'docs' | 'code' | 'research' | 'other';
  tags: string[];
  status: 'queued' | 'processing' | 'ready' | 'error';
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}
```

**Integration:**
- Opens from "📄 Add Documents" button in Context Library header
- Emits `onIngest` event with document array
- Closes after successful submission

---

#### `IngestQueuePanel.svelte`
**Purpose:** Display and track document ingestion status

**Features:**
- Queue table showing document status
- Status badges (queued, processing, ready, error)
- Animated pulse for processing items
- Stats bar showing counts by status
- Tags display with overflow handling
- Formatted timestamps
- "Simulate progress" button (demo)
- Conditional render (only shows if queue has items)

**Status Lifecycle:**
```
CREATION → QUEUED → PROCESSING → READY
              ↓
           ERROR (optional)
```

**Theme Support:**
- Dark mode: slate-900 backgrounds, slate-100 text
- Light mode: white backgrounds, slate-900 text
- Status colors adapt to theme

---

### User Journey

1. **Access Upload**
   - Navigate to `/contexts` (Context Library)
   - Click "📄 Add Documents" button in header
   - Modal opens with file dropzone

2. **Select Files**
   - Drag files onto dropzone OR click to browse
   - Files appear in list
   - Each file shows: title (editable), filename, size, category (dropdown)

3. **Edit Metadata**
   - Click to edit file title (defaults to filename)
   - Select category per file (reference, docs, code, research, other)
   - Shared fields: workspace (readonly "default"), tags (comma-separated)

4. **Submit for Ingestion**
   - Click "Start Ingestion" button (validates ≥1 file)
   - Modal closes
   - Documents added to queue with status "queued"
   - `handleIngest` callback fires

5. **Track Progress**
   - Queue panel appears below Context Library UI
   - Shows all ingested documents
   - Status badges indicate progress: queued → processing → ready
   - Processing items have animated pulse effect
   - Timestamps show creation and update times

6. **Demo Progress** (Optional)
   - Click "Simulate progress" button
   - Status advances for all documents
   - First click: queued → processing
   - Second click: processing → ready
   - Times update to current time

### Architecture

**Parent Component:** `src/routes/contexts/+page.svelte`

**State Management:**
```typescript
let isUploadOpen = $state(false);                    // Modal visibility
let ingestQueue = $state<IngestDocument[]>([]);      // Queue data

const handleIngest = (docs: IngestDocument[]) => {
  ingestQueue = [...ingestQueue, ...docs];           // Add to queue
  isUploadOpen = false;                              // Close modal
};

const handleSimulateProgress = () => {
  ingestQueue = ingestQueue.map((doc) => {
    if (doc.status === 'queued') {
      return { ...doc, status: 'processing', updatedAt: now };
    }
    if (doc.status === 'processing') {
      return { ...doc, status: 'ready', updatedAt: now };
    }
    return doc;
  });
};
```

**Event Flow:**
```
User clicks "Add Documents"
    ↓
isUploadOpen = true
    ↓
UploadIngestModal renders
    ↓
Select files + metadata
    ↓
onIngest callback (pass docs array)
    ↓
handleIngest(docs)
    ↓
ingestQueue updated
    ↓
IngestQueuePanel conditional render
    ↓
Queue visible below library
```

### Future Enhancements

**Phase 2 (Backend Integration):**
- Real file storage (S3, local, database)
- Actual document parsing (text extraction, code parsing)
- Background job processing
- Real status updates via polling/websocket
- Persistent queue storage

**Phase 3 (Feature Extensions):**
- Convert documents to contexts
- Document preview modal
- Batch operations on queue
- Error recovery & retry
- Document search/tagging

---

## Development Workflow

### Local Development Setup

```bash
# 1. Install dependencies
cd /home/charles/projects/Coding2025/Forge/vibeforge
pnpm install

# 2. Start dev server
pnpm dev

# 3. Open browser
# http://localhost:5173

# 4. Watch for TypeScript errors
pnpm check:watch
```

### Common Development Tasks

#### Adding a New Component

```svelte
<!-- src/lib/components/MyComponent.svelte -->
<script lang="ts">
  import { theme } from '$lib/stores/themeStore';

  interface Props {
    title: string;
    description?: string;
  }

  let { title, description }: Props = $props();
</script>

<div class={`p-4 rounded ${
  $theme === 'dark'
    ? 'bg-slate-900 text-slate-100'
    : 'bg-white text-slate-900'
}`}>
  <h2>{title}</h2>
  {#if description}
    <p>{description}</p>
  {/if}
</div>
```

#### Adding a New Store

```typescript
// src/lib/stores/myStore.ts
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

interface MyState {
  value: string;
}

const initialState: MyState = { value: '' };

const createStore = () => {
  const state = writable<MyState>(initialState);

  return {
    subscribe: state.subscribe,
    setValue: (value: string) => state.set({ value }),
  };
};

export const myStore = createStore();
```

#### Adding a New Page

```svelte
<!-- src/routes/mypage/+page.svelte -->
<script lang="ts">
  import { theme } from '$lib/stores/themeStore';
</script>

<main class={`flex-1 overflow-auto p-6 ${
  $theme === 'dark'
    ? 'bg-slate-900 text-slate-100'
    : 'bg-white text-slate-900'
}`}>
  <h1>My Page</h1>
  <!-- Content here -->
</main>
```

### Code Style Guidelines

**TypeScript:**
- Strict mode enabled
- Interface for all public types
- No `any` types
- Explicit return types

**Svelte:**
- Use Svelte 5 runes (`$state`, `$derived`, `$props`)
- No `createEventDispatcher` (use callback props)
- Always include `lang="ts"` in script tags
- Theme-aware styling (check `$theme` store)

**Tailwind:**
- Utility-first approach
- Use custom Forge colors
- Responsive prefixes (sm:, md:, lg:)
- Dark mode variants with `$theme` conditionals

**Documentation:**
- JSDoc comments on exported functions
- Type definitions for all props
- README in complex feature directories
- Inline comments for non-obvious logic

### Testing

**Type Checking:**
```bash
pnpm check              # One-time check
pnpm check:watch        # Watch mode
```

**Manual Testing:**
```bash
pnpm dev                # Start dev server
# Test in browser manually
# Check console (F12) for errors
```

**Browser DevTools:**
- Use Svelte DevTools extension (if installed)
- Inspect component tree
- View reactive variable values
- Check network requests

---

## Build & Deployment

### Production Build

```bash
# Build for production
pnpm build

# Output: build/ directory
# - index.html (entry point)
# - _app/ (SvelteKit runtime)
# - routes/ (page files)
# - immutable/ (assets, JS, CSS)
```

### Build Output Structure

```
build/
├── index.html                  # Entry point
├── _app/
│   ├── version.json            # Build version
│   ├── immutable/
│   │   ├── chunks/             # JavaScript bundles
│   │   ├── nodes/              # Page components
│   │   └── assets/             # CSS, fonts
├── routes/
│   ├── +page.svelte
│   ├── contexts/
│   ├── history/
│   └── ... (all routes)
└── static/                      # Public assets
```

### Deployment Options

**Static Site Hosts:**
- Vercel (recommended for SvelteKit)
- Netlify
- GitHub Pages
- Cloudflare Pages

**VPS/Server:**
- Node.js required
- PM2 for process management
- Nginx as reverse proxy

**Docker:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
EXPOSE 3000
CMD ["node", "build"]
```

### Environment Variables

Create `.env` for development, `.env.production` for production:

```env
# API Configuration
PUBLIC_API_BASE_URL=https://api.example.com
PUBLIC_API_VERSION=v1

# Analytics (optional)
PUBLIC_ANALYTICS_ID=ga-xxxxx
```

---

## Future Roadmap

### Phase 2 (Q1 2025)
- [ ] Backend API integration
- [ ] Real database for contexts and runs
- [ ] User authentication
- [ ] Cloud document storage
- [ ] Real-time collaboration features
- [ ] Team management

### Phase 3 (Q2 2025)
- [ ] Advanced prompt optimization
- [ ] Automated A/B testing
- [ ] Model benchmarking
- [ ] Custom evaluation metrics
- [ ] Prompt versioning & branching

### Phase 4 (Q3 2025)
- [ ] Browser extension
- [ ] CLI tool
- [ ] API for external integrations
- [ ] Webhook support
- [ ] Custom model support

### Phase 5 (Q4 2025)
- [ ] AI-assisted prompt generation
- [ ] Automatic optimization suggestions
- [ ] Advanced analytics & insights
- [ ] Team leaderboards
- [ ] Plugin system

---

## Key Takeaways

### Design Philosophy
1. **Professional Tool** - Built for AI engineers, not casual users
2. **Structured Workflows** - Not a chat interface; emphasis on organization
3. **Composability** - Reusable components at all levels
4. **Low Cognitive Load** - Clean interface, clear information hierarchy
5. **Dark-First** - Optimized for extended work sessions

### Technical Strengths
1. **Type-Safe** - Full TypeScript throughout
2. **Responsive** - Works on all device sizes
3. **Accessible** - Semantic HTML, ARIA labels
4. **Themeable** - Dark/light mode support baked in
5. **Scalable** - Store architecture ready for growth

### Developer Experience
1. **Clear Patterns** - Components follow consistent structure
2. **Easy to Extend** - Well-documented architecture
3. **Fast Feedback** - Hot reload, instant compilation
4. **Good Documentation** - Architecture guides included
5. **Quality Code** - TypeScript, linting, formatting

---

## Conclusion

VibeForge is a comprehensive prompt engineering workbench that combines professional-grade features with a clean, intuitive interface. Built on modern web technologies (SvelteKit, TypeScript, Tailwind), it provides a solid foundation for AI developers to craft, test, and evaluate prompts systematically.

The architecture is designed for growth, with clear patterns for adding new features, backend integration, and team collaboration. The document ingestion system demonstrates how new workflows can be seamlessly integrated following established patterns.

**Current Status:** Production-ready MVP with active development ongoing.

**Next Steps:** Backend integration, real file storage, and user authentication to move from local-only to full cloud-based platform.

---

**Document Version:** 1.0  
**Last Updated:** November 18, 2025  
**Maintained By:** Development Team
