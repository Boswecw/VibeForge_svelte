# Quick Run Implementation

## Overview

**Quick Run** is a lightweight, fast-iteration prompt runner designed as a streamlined sibling to the full Workbench. It's purpose-built for rapid experimentation, tactical prompts, and quick model comparisons—lowering friction and cognitive load compared to the full 3-column interface.

Users can:

- Enter a short prompt instantly
- Optionally attach 1–2 lightweight context snippets
- Select 1–2 models to run against
- See side-by-side outputs in a compact layout
- Re-run with tweaks in seconds

---

## Architecture & Design Philosophy

### Single-Column, Task-Focused Layout

Unlike the full Workbench (3-column: Context | Prompt | Output), Quick Run uses a **vertical, single-column** flow:

1. **Header** – Quick Run title + workspace name
2. **Form** – Prompt input, optional context, model selection, actions
3. **Outputs** – Results grid (1 or 2 models side-by-side on desktop)
4. **Status Bar** – Workspace, models, metrics, connection status

This linear flow mirrors VibeForge's principle of **low cognitive load**: users move through one step at a time, with clear entry points and minimal context-switching.

### Speed Over Completeness

- No project management overhead
- No complex context library browsing
- No detailed run history
- Just: prompt → select models → see results

This makes Quick Run ideal for:

- Quick sanity checks
- Model comparison experiments
- Prompt prototyping
- Testing ideas before committing to full Workbench projects

### Consistent Visual Language

Quick Run reuses VibeForge's established:

- **Theme system**: Full dark/light mode support via `$theme` store
- **Component patterns**: Headers, panels, chips, buttons follow existing design
- **Color palette**: Amber for interactive states, slate for neutral backgrounds
- **Spacing & typography**: Consistent grid (p-3, p-4, gap-2, gap-4)

---

## Files Created

### Type Definition & Components

#### `src/lib/types/workspace.ts` (already exists)

- Used for workspace context in Quick Run page

#### `src/lib/components/StatusBar.svelte` (NEW – reusable)

- **Purpose**: Display workspace, models, metrics, and connection status at bottom of pages
- **Props**:
  - `workspace`: string (default: "VibeForge")
  - `project`: string (default: "Untitled")
  - `activeModels`: string[] (list of selected model names)
  - `lastRunTokens`: number (total tokens from last run)
  - `lastRunCost`: number (total cost in dollars)
  - `connectionStatus`: "ok" | "warning" | "error" (API health)
- **Features**:
  - Horizontal layout with distinct sections separated by borders
  - Status indicator (● Connected / ⚠ Degraded / ✕ Offline)
  - Color-coded status (emerald, amber, rose)
  - Responsive truncation for long workspace names
  - Full dark/light theme support
- **Reusability**: Can be used in Workbench, Quick Run, or any page needing metrics display

#### `src/lib/components/quickrun/QuickRunHeader.svelte`

- **Purpose**: Top section identifying the Quick Run interface
- **Props**: `workspace` (optional, default: "VibeForge Dev")
- **Content**:
  - Title: "Quick Run"
  - Subtitle: "Lightweight prompt runner for experiments and quick checks."
  - Workspace name display (top-right)
- **Styling**: Bordered panel, theme-aware

#### `src/lib/components/quickrun/QuickRunForm.svelte`

- **Purpose**: Main form for prompt input, context selection, and model choice
- **Props**:
  - `prompt`: string (current prompt text)
  - `selectedContextIds`: string[] (active context selections)
  - `activeModelIds`: string[] (selected models, max 2)
  - Event handlers: `onPromptChange`, `onContextToggle`, `onModelToggle`, `onRun`, `onReset`
- **Content**:
  - **Prompt input**: Large monospace textarea (min-height 160px, resizable)
  - **Optional context**: 3 mock context chips (toggleable)
    - AuthorForge design rules
    - VibeForge project spec
    - Current file summary
  - **Model selection**: 3 toggle buttons (Claude, GPT-5.x, Local)
    - Max 2 models selectable at once
  - **Actions**: Run (amber), Reset (neutral), with helper text
- **Styling**:
  - Dark mode: `bg-slate-900 border-slate-700`
  - Light mode: `bg-white border-slate-200`
  - Active chips/buttons: amber background

#### `src/lib/components/quickrun/QuickRunOutputs.svelte`

- **Purpose**: Display model outputs side-by-side or stacked
- **Props**:
  - `outputs`: QuickOutput[] (array of results)
  - `isLoading`: boolean (show loading state)
- **Content**:
  - **Header**: "Outputs" title + explanatory text
  - **Loading state**: Spinner animation while running
  - **Empty state**: "Run a prompt to see results here."
  - **Output grid**:
    - 2 columns on desktop (`md:grid-cols-2`)
    - 1 column on mobile (`grid-cols-1`)
    - Each output card shows:
      - Model name (bold)
      - Tokens + estimated cost (right-aligned)
      - Full output text (monospace, scrollable, max-height 260px)
- **Styling**: Dark mode outputs use `bg-slate-950`, light mode uses `bg-slate-50`

### Page & Routes

#### `src/routes/quick-run/+page.svelte`

- **Main orchestration** for Quick Run interface
- **Local state** (Svelte 5 `$state` runes):
  - `prompt`: string
  - `selectedContextIds`: string[]
  - `activeModelIds`: string[]
  - `outputs`: QuickOutput[]
  - `isLoading`: boolean
  - `lastRunTokens`: number
  - `lastRunCost`: number
- **Computed values** (`$derived`):
  - `activeModelsLabels`: Map model IDs to human-readable labels
- **Event handlers**:
  - `onPromptChange(text)`: Update prompt state
  - `toggleContext(id)`: Add/remove context
  - `toggleModel(id)`: Add/remove model (max 2)
  - `runQuickPrompt()`: Generate mock outputs, simulate API call (1.2s delay)
  - `resetQuickRun()`: Clear all state
- **Mock data**:
  - Model metadata: tokens per run, cost per 1K tokens
  - Realistic responses for Claude, GPT-5.x, Local
  - Local model has zero cost; others have typical pricing
- **Output generation**:
  - For each active model, create output with:
    - Random token count (±50 from base)
    - Calculated cost based on token count and model pricing
    - Mock response text
- **Metrics calculation**:
  - Sum tokens and costs across all outputs
  - Display in status bar
- **TODO comments** for future backend integration

### Navigation Update

#### `src/lib/components/ForgeSideNav.svelte`

- Added "Quick Run" (⚡ icon) to nav items
- Positioned between "Workbench" and "Context Library"
- Maintains active state styling (amber accent)
- Full routing integration with SvelteKit `$page.url.pathname`

---

## Key Features

### Lightning-Fast Entry

- No setup overhead
- Direct to prompt input
- Pre-loaded context options
- One-click model selection

### Smart Model Selection

- Max 2 models for quick comparison
- Visual feedback (amber when active)
- Prevents decision fatigue
- Easy toggle on/off

### Realistic Mock Data

- Claude: ~150 tokens, $0.003/1K tokens
- GPT-5.x: ~200 tokens, $0.006/1K tokens
- Local: ~100 tokens, $0 cost
- Random variance (±50 tokens) for realism

### Context Chips

- Optional lightweight context snippets
- Toggleable (not intrusive like full Context Library)
- Pre-populated with realistic examples
- Reduce cognitive load vs. full project context

### Status Visibility

- Workspace at a glance
- Active models clearly labeled
- Last run tokens + cost
- Connection status indicator

### Responsive Design

- Desktop: 2-column output grid
- Tablet/Mobile: Single-column layout
- Full dark/light mode support
- Accessible text hierarchy

---

## State Management & Data Flow

### Local-Only State

All state lives in the page component using Svelte 5 runes:

```svelte
let prompt = $state("");
let selectedContextIds = $state<string[]>([]);
let activeModelIds = $state<string[]>([]);
let outputs = $state<QuickOutput[]>([]);
let isLoading = $state(false);
```

### Event Propagation

1. User types prompt → `onPromptChange` handler updates `prompt` state
2. User clicks model chip → `toggleModel` handler updates `activeModelIds`
3. User clicks "Run" → `runQuickPrompt` handler:
   - Sets `isLoading = true`
   - Simulates 1.2s API call
   - Generates mock `outputs`
   - Updates `lastRunTokens` and `lastRunCost`
   - Sets `isLoading = false`

### Derived Values

```svelte
const activeModelsLabels = $derived(
  activeModelIds.map((id) => modelLabels[id] || id)
);
```

### Component Composition

```
+page.svelte (orchestration + state)
  ├─ QuickRunHeader (workspace info)
  ├─ QuickRunForm (inputs)
  ├─ QuickRunOutputs (results)
  └─ StatusBar (metrics)
```

---

## Mock Outputs & Metrics

### Output Simulation

When user clicks "Run":

1. Check prompt is not empty and at least 1 model selected
2. Set `isLoading = true`
3. Wait 1.2 seconds (simulated API latency)
4. For each active model:
   - Look up base tokens from `modelMetadata`
   - Add random variance (0–50 tokens)
   - Calculate cost: `(tokens / 1000) * costPerKTokens`
   - Create output object with mock text
5. Sum tokens and costs across all outputs
6. Update status bar and metrics
7. Set `isLoading = false`

### Realistic Pricing

- Claude: $0.003 per 1K tokens → ~$0.00045 per 150-token output
- GPT-5.x: $0.006 per 1K tokens → ~$0.0012 per 200-token output
- Local: Free (cost = $0)

### Mock Responses

Each model has a characteristic response style:

- **Claude**: "thoughtful response... nuanced analysis... clarity and helpfulness"
- **GPT-5.x**: "excels at pattern recognition... concise, direct answers... factual grounding"
- **Local**: "fast execution... minimal latency... rapid iterations... resource-constrained"

---

## Theme Consistency

### Dark Mode

- Shell: `bg-slate-950 text-slate-100`
- Header/Form/Output panels: `bg-slate-900 border-slate-700`
- Output content: `bg-slate-950 border-slate-800`
- Active chips: `bg-amber-500 text-slate-900`
- Inactive chips: `bg-slate-950 border-slate-700 text-slate-200`

### Light Mode

- Shell: `bg-slate-50 text-slate-900`
- Header/Form/Output panels: `bg-white border-slate-200 shadow-sm`
- Output content: `bg-slate-50 border-slate-200`
- Active chips: `bg-amber-500 text-slate-900`
- Inactive chips: `bg-slate-50 border-slate-300 text-slate-700`

### Consistent Patterns

- All panels use the same border/background pattern
- All buttons/chips use amber for active state
- All text hierarchy matches Workbench (text-base for h1, text-xs for labels, etc.)
- Spacing grid: p-3, p-4, gap-2, gap-4 consistent throughout

---

## How Quick Run Complements the Full Workbench

### Full Workbench

- **Use when**: Building complex prompts, managing projects, comparing 3+ models, tracking extensive history
- **Overhead**: 3-column layout, context library navigation, detailed settings
- **Time to run**: 30–60 seconds (setup + execution)

### Quick Run

- **Use when**: Testing ideas, quick A/B tests, rapid iterations, single-prompt experiments
- **Overhead**: Minimal (prompt → select → run)
- **Time to run**: 5–10 seconds (enter + execute)

### Integration Points

- Both share the same theme system
- Both use the same component patterns
- StatusBar appears in both for consistency
- Users can **graduate** from Quick Run to Workbench when projects grow
- Quick Run results could be **promoted** to Workbench projects (TODO)

---

## UX Principles Alignment

### Low Cognitive Load

✅ **Single linear flow**: No tabs, no complex navigation  
✅ **Pre-made choices**: 3 context options, 3 models—no overwhelming selections  
✅ **Clear affordances**: Amber = interactive, slate = neutral, emerald = success  
✅ **Minimal options**: Max 2 models, no advanced settings

### Hierarchy & Clarity

✅ **Prompt is primary**: Largest input, most visual weight  
✅ **Models are secondary**: Toggles below prompt  
✅ **Results are tertiary**: Appear after action (Run button)  
✅ **Metrics are passive**: Status bar at bottom, not interrupting

### Professional Instrument Design

✅ **Task-focused**: Every element serves quick-run purpose  
✅ **Speed optimized**: No hidden settings, no modals, no drill-down  
✅ **Reversible actions**: Reset clears everything safely  
✅ **Status transparency**: Metrics visible throughout

---

## TODO Items (Future Development)

1. **Backend API Integration**

   - Replace mock output generation with real API calls
   - Stream responses from Claude, GPT-5.x, and local models
   - Wire actual token counting and pricing

2. **Persistence**

   - Save quick-run history (optional, different from full History)
   - Persist default models/context selections to store
   - Bookmark favorite Quick Runs

3. **Advanced Features**

   - Custom system prompts (quick templates)
   - Temperature/frequency penalty controls (collapsible advanced panel)
   - Parallel model runs (load all models simultaneously)
   - Export/share quick-run results

4. **Integration with Workbench**

   - "Promote to Workbench" button for good Quick Runs
   - Quick Run inside Workbench as collapsible panel
   - Use Quick Run results as context in Workbench

5. **Metrics & Analytics**
   - Quick Run dashboard (daily runs, average cost, favorite models)
   - Model performance tracking (accuracy feedback on Quick Runs)
   - Cost optimization alerts

---

## Build & Performance

**Build Output:**

- Quick Run page bundle: Included in main build
- StatusBar component: Reusable, ~2KB
- Total build time: 6.57 seconds
- ✅ Zero compilation errors
- ✅ Dev server ready in 1.6 seconds

**Component Sizes (estimated):**

- QuickRunHeader: ~0.6 kB
- QuickRunForm: ~2.8 kB
- QuickRunOutputs: ~1.9 kB
- StatusBar: ~1.8 kB
- Page orchestration: ~1.2 kB

---

## Navigation & Accessibility

### Left Nav Integration

- "Quick Run" added between "Workbench" (⚒️) and "Context Library" (📚)
- Lightning icon (⚡) signals speed and energy
- Active state: amber border + lifted background
- Full keyboard navigation via SvelteKit routing

### Accessibility (TODO Improvements)

- Add `aria-label` attributes to chips
- Ensure loading spinner has `aria-live="polite"`
- Keyboard shortcuts for Run (Cmd+Enter)
- Tab order through form elements

---

## Comparison: Quick Run vs. Workbench vs. Patterns

| Feature             | Quick Run        | Workbench         | Patterns           |
| ------------------- | ---------------- | ----------------- | ------------------ |
| **Purpose**         | Fast experiments | Complex projects  | Reusable templates |
| **Setup time**      | <5s              | 30–60s            | 10–20s             |
| **Context support** | 3 snippets       | Full library      | N/A (pre-made)     |
| **Models**          | 1–2              | 3+                | Fixed per pattern  |
| **History**         | Implicit         | Explicit tracking | N/A                |
| **Use case**        | Quick checks     | Deep work         | Standardized flows |

---

**Date Created:** November 18, 2025  
**Build Status:** ✅ Successful (6.57s)  
**Components:** 4 new (3 Quick Run + 1 reusable StatusBar)  
**Total Lines of Code:** ~700 (Svelte/TypeScript)  
**Theme Support:** Full dark/light mode  
**Responsive:** Desktop-first, mobile-friendly  
**Reusability:** StatusBar is framework for other pages
