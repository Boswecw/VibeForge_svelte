# VibeForge Features

Complete feature documentation and user guides for all VibeForge features.

---

## Table of Contents

1. [Main Workbench](#main-workbench)
2. [Context Library](#context-library)
3. [Document Ingestion](#document-ingestion)
4. [Research & Assist Panel](#research--assist-panel)
5. [Quick Run](#quick-run)
6. [Run History](#run-history)
7. [Prompt Patterns](#prompt-patterns)
8. [Presets](#presets)
9. [Evaluations](#evaluations)
10. [Workspaces](#workspaces)
11. [Settings](#settings)

---

## Main Workbench

**Route:** `/`

The heart of VibeForge—where prompt engineers craft and test prompts.

### Components

- **ContextColumn** (Left) - Browse and select context blocks
- **PromptColumn** (Center) - Compose prompts with active context visualization
- **OutputColumn** (Right) - View model responses and execution metrics
- **ResearchAssistDrawer** - Side panel for notes, snippets, and suggestions

### Features

✅ **Real-time Prompt Composition**

- Textarea with syntax highlighting (future)
- Active context chips showing selected contexts
- Character and token counter (~4 chars = 1 token)

✅ **Context Selection**

- Browse available context blocks in left column
- Click to activate/deactivate contexts
- Visual indication of active contexts
- Drag-to-reorder (future)

✅ **Multi-Model Execution**

- Select multiple models to run simultaneously
- Side-by-side response comparison
- Execution metrics (tokens, latency, finish reason)

✅ **Response History**

- All executions logged automatically
- View past responses in OutputColumn
- Replay functionality
- Compare outputs across models

✅ **Research & Assist**

- Freeform notes panel
- Reusable snippet library
- Prompting best practices and suggestions

### Usage

1. **Select Contexts** - Click context blocks in the left column to activate them
2. **Compose Prompt** - Type your prompt in the center column
3. **Select Models** - Choose which models to run (future: API integration)
4. **Execute** - Click "Run" to execute the prompt
5. **Review Outputs** - View responses in the right column
6. **Take Notes** - Use Research & Assist panel for annotations

---

## Context Library

**Route:** `/contexts`

Browse, search, and manage reusable prompt context blocks.

### Components

- `ContextLibraryHeader` - Title, stats, "Add Documents" button
- `ContextFilters` - Search, type filter, tag filter
- `ContextList` - Scrollable list of context blocks
- `ContextDetailPanel` - View and manage selected context

### Features

✅ **Search & Filter**

- Search by name, summary, or tags
- Filter by context type (system, design, project, code, workflow)
- Tag-based filtering
- Real-time search results

✅ **Context Types**

- **System** - System prompts and instructions
- **Design** - Design specifications and guidelines
- **Project** - Project context and requirements
- **Code** - Code snippets and examples
- **Workflow** - Workflow instructions and processes

✅ **Context Management**

- View context details
- Edit context metadata
- Delete contexts
- "Send to Workbench" action

✅ **Document Ingestion**

- Upload documents to create contexts
- Drag-drop file upload
- File metadata editing (title, category, tags)
- Ingestion queue with status tracking

### Usage

1. **Browse Contexts** - Scroll through available context blocks
2. **Search** - Use search bar to find specific contexts
3. **Filter** - Apply type or tag filters to narrow results
4. **View Details** - Click a context to see full details
5. **Send to Workbench** - Click "Send to Workbench" to use in prompts
6. **Upload Documents** - Click "Add Documents" to ingest new files

---

## Document Ingestion

**Integrated into:** Context Library (`/contexts`)

Upload and process documents into context blocks.

### Components

- `UploadIngestModal` - File upload interface
- `IngestQueuePanel` - Track document processing status

### Features

✅ **File Upload**

- Drag-drop file upload
- Multi-file selection
- Supported formats: PDF, TXT, MD, DOCX (future)
- File size validation

✅ **Metadata Editing**

- Title - Custom name for the document
- Category - reference, docs, code, research, other
- Tags - Comma-separated tags for organization
- Workspace - Target workspace (auto-filled)

✅ **Processing Queue**

- Real-time status tracking
- Status indicators: queued, processing, ready, error
- Progress simulation (demo mode)
- Error messages for failed uploads

✅ **Context Creation**

- Documents automatically chunked and embedded (future: backend)
- Context blocks created from document chunks
- Searchable and filterable like manual contexts

### Usage

1. **Open Upload Modal** - Click "📄 Add Documents" in Context Library
2. **Select Files** - Drag-drop or click to select files
3. **Edit Metadata** - Set title, category, and tags for each file
4. **Upload** - Click "Ingest Documents" to start processing
5. **Monitor Queue** - Watch processing status in IngestQueuePanel
6. **Use Contexts** - Once ready, contexts appear in Context Library

### Data Flow

```
User uploads document
  ↓
Document queued in IngestQueuePanel
  ↓
Backend processes document (chunking, embedding)
  ↓
Context blocks created and added to contextStore
  ↓
User can search/filter contexts in ContextColumn
  ↓
User selects context for use in prompt
```

---

## Research & Assist Panel

**Integrated into:** Main Workbench (`/`)

Side panel for research notes, snippets, and prompting suggestions.

### Components

- `ResearchAssistDrawer` - Drawer component with three tabs

### Features

✅ **Notes Tab**

- Freeform textarea for research notes
- Auto-wrapping, resizable
- Persisted locally (future: sync to backend per workspace)
- Perfect for links, references, and annotations

✅ **Snippets Tab**

- Reusable prompt boilerplate blocks
- Pre-populated snippets:
  - Code Review Boilerplate
  - Story Structure Checklist
  - LLM Safety Check
  - Analysis Framework
- One-click insertion into prompt
- Scrollable preview of snippet content

✅ **Suggestions Tab**

- Static, read-only prompting tips
- Organized by category:
  - Prompting (separate instructions from content, be explicit)
  - Structure (step-by-step reasoning, explicit format)
  - Safety (self-checks, edge cases)
  - Evaluation (test with edge cases)
- Best practices for prompt engineering

### Usage

1. **Open Panel** - Click "Research & Assist" button in workbench
2. **Take Notes** - Use Notes tab for freeform annotations
3. **Insert Snippets** - Browse Snippets tab and click "Insert" to add to prompt
4. **Review Suggestions** - Read Suggestions tab for prompting best practices

---

## Quick Run

**Route:** `/quick-run`

Lightweight single-column interface for rapid experimentation.

### Features

✅ **Simplified Interface**

- Single-column layout (no context selection)
- Quick prompt input
- Fast model comparison (1-2 models side-by-side)
- Minimal setup required

✅ **Perfect For**

- Tactical testing
- Quick experiments
- Simple prompts without complex context
- Rapid iteration

### Usage

1. **Navigate to Quick Run** - Click "Quick Run" in sidebar
2. **Type Prompt** - Enter your prompt in the textarea
3. **Select Model(s)** - Choose 1-2 models for comparison
4. **Run** - Click "Run" to execute
5. **Review** - View responses side-by-side

---

## Run History

**Route:** `/history`

View, replay, and analyze all prompt executions.

### Components

- `HistoryHeader` - Title, stats, export options
- `HistoryFilters` - Filter by date, model, status
- `HistoryTable` - Sortable table of runs
- `HistoryDetailPanel` - Full run details with metrics

### Features

✅ **Complete Audit Trail**

- Every execution logged with metadata
- Timestamp, model, status tracking
- Input/output comparison
- Execution metrics (tokens, latency, finish reason)

✅ **Filtering & Search**

- Filter by date range
- Filter by model
- Filter by status (success, error)
- Search by prompt text

✅ **Replay Functionality**

- Re-execute any past run with same prompt
- Compare new results with historical results
- Iterate on prompts based on history

✅ **Export**

- Export run history to CSV/JSON (future)
- Share runs with team members (future)

### Usage

1. **Browse History** - View all past executions in table
2. **Filter** - Apply filters to narrow results
3. **View Details** - Click a run to see full details
4. **Replay** - Click "Replay" to re-execute with same prompt
5. **Compare** - Compare outputs across different runs

---

## Prompt Patterns

**Route:** `/patterns`

Library of reusable prompt templates and patterns.

### Components

- `PatternsHeader` - Title, add new pattern
- `PatternsFilters` - Search, category, tag filters
- `PatternsList` - Pattern list view
- `PatternDetailPanel` - Pattern details & usage

### Features

✅ **Pre-built Templates**

- Common prompt patterns (chain-of-thought, few-shot, etc.)
- Domain-specific templates (code review, writing, analysis)
- Best practice examples
- Community-contributed patterns (future)

✅ **Pattern Categories**

- Reasoning (chain-of-thought, step-by-step)
- Formatting (JSON, markdown, structured output)
- Safety (content filtering, bias checking)
- Analysis (summarization, extraction, classification)

✅ **Usage Tracking**

- Track how often patterns are used
- Popular patterns highlighted
- Personal favorites

✅ **Quick Load**

- One-click load into workbench
- Customize pattern before use
- Save customized patterns as new patterns

### Usage

1. **Browse Patterns** - Explore available prompt patterns
2. **Search** - Find patterns by category or tag
3. **Preview** - View pattern details and examples
4. **Load** - Click "Load into Workbench" to use
5. **Customize** - Modify pattern in workbench as needed

---

## Presets

**Route:** `/presets`

Save and quickly load workbench configurations.

### Components

- `PresetsHeader` - Title, create new preset
- `PresetsList` - List of saved configurations
- `PresetsDrawer` - Sidebar preset quick-access
- `PresetDetailPanel` - View and edit presets

### Features

✅ **Save Workbench State**

- Save current prompt, contexts, and model selections
- Include execution settings
- Add description and tags
- Pin frequently used presets

✅ **Quick Access**

- Sidebar drawer for instant preset loading
- Pinned presets at top
- Recent presets
- Search and filter

✅ **Preset Management**

- Edit preset details
- Duplicate presets
- Delete presets
- Share presets (future)

### Usage

1. **Save Preset** - Click "Save as Preset" in workbench
2. **Name & Describe** - Add name, description, and tags
3. **Pin** - Pin frequently used presets for quick access
4. **Load** - Click preset to load into workbench
5. **Manage** - Edit or delete presets as needed

---

## Evaluations

**Route:** `/evals`

Compare and evaluate model outputs systematically.

### Components

- `EvaluationsHeader` - Title, create evaluation
- `EvaluationsFilters` - Filter evaluations
- `EvaluationsList` - List of evaluations
- `EvaluationDetail` - Detailed scoring & analysis

### Features

✅ **Side-by-Side Comparison**

- Compare outputs from multiple models
- Same prompt across different models
- Visual diff highlighting (future)

✅ **Evaluation Criteria**

- Define custom criteria (accuracy, coherence, safety, etc.)
- Score outputs on multiple dimensions
- Weighted scoring
- Aggregate scores

✅ **Systematic Testing**

- Create evaluation sets
- Run same prompts across models
- Track performance over time
- Identify best model for specific tasks

✅ **Export Results**

- Export evaluation results to CSV/JSON
- Share with team members
- Generate reports (future)

### Usage

1. **Create Evaluation** - Click "New Evaluation"
2. **Define Criteria** - Set evaluation criteria and weights
3. **Add Runs** - Select runs to evaluate
4. **Score** - Rate each output on defined criteria
5. **Compare** - View aggregate scores and comparisons
6. **Export** - Export results for reporting

---

## Workspaces

**Route:** `/workspaces`

Multi-workspace support for team collaboration and project organization.

### Components

- `WorkspacesHeader` - Title, create workspace
- `WorkspacesList` - List of workspaces
- `WorkspaceDetailPanel` - Workspace settings
- `WorkspaceEditorDrawer` - Edit workspace details

### Features

✅ **Isolated Environments**

- Separate contexts per workspace
- Independent presets
- Isolated run history
- Workspace-specific settings

✅ **Workspace Management**

- Create new workspaces
- Switch between workspaces
- Archive inactive workspaces
- Delete workspaces

✅ **Activity Tracking**

- Last activity timestamp
- Run count per workspace
- Context count per workspace
- Team member activity (future)

✅ **Team Collaboration** (Future)

- Invite team members
- Shared contexts and presets
- Role-based permissions
- Activity feed

### Usage

1. **Create Workspace** - Click "New Workspace"
2. **Name & Describe** - Add name and description
3. **Switch** - Click workspace to switch to it
4. **Manage** - Edit settings, archive, or delete
5. **Collaborate** - Invite team members (future)

---

## Settings

**Route:** `/settings`

User preferences and application configuration.

### Sections

- `WorkspaceSettingsSection` - Workspace defaults
- `AppearanceSettingsSection` - Theme, font size, density
- `ModelSettingsSection` - API keys, endpoints
- `DataSettingsSection` - Data retention, privacy

### Features

✅ **Appearance**

- Theme toggle (dark/light)
- Font size adjustment (small, medium, large)
- UI density control (compact, comfortable, spacious)
- Color scheme customization (future)

✅ **Model Configuration**

- API key management
- Model endpoint configuration
- Default model selection
- Rate limiting settings

✅ **Data Management**

- Data retention policies
- Export all data
- Clear history
- Privacy settings

✅ **Workspace Defaults**

- Default workspace on login
- Auto-save settings
- Notification preferences

### Usage

1. **Navigate to Settings** - Click "Settings" in top bar
2. **Adjust Appearance** - Toggle theme, adjust font size
3. **Configure Models** - Add API keys and endpoints
4. **Manage Data** - Set retention policies, export data
5. **Save** - Settings auto-save on change

---

**For more information, see:**

- [README.md](./README.md) - Project overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflows
