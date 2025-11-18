# VibeForge Copilot Instructions

## Architecture Overview

**VibeForge** is a professional prompt workbench (not a chat UI) built with SvelteKit + Vite + Tailwind. It implements a **3-column layout** philosophy:
- **Context Column** (`ContextColumn.svelte`): Library of reusable prompt blocks (system, design, project, code, workflow kinds)
- **Prompt Column** (`PromptColumn.svelte`): Primary text editor with active context chips and token estimation
- **Output Column** (`OutputColumn.svelte`): Model responses and run history

The design emphasizes **low cognitive load** and professional workflows. Core motivation: AI coding agents need structured context + clear prompts + execution history.

## Project Setup & Development

**Tech Stack:**
- **SvelteKit 2.x** with TypeScript 5.9
- **Vite 7** for fast dev/build, `pnpm` monorepo package manager
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **Svelte 5.43** with runes (`$state`, `$derived`, `$props`)

**Key Commands:**
```bash
pnpm dev          # Start dev server on :5173
pnpm build        # Production build
pnpm preview      # Serve built output
pnpm check        # TypeScript + svelte-check validation
pnpm check:watch  # Watch mode validation
```

**Project Structure:**
- `src/routes/` — SvelteKit pages (standard file-based routing)
- `src/lib/components/` — Reusable UI components
- `src/lib/stores/` — Svelte stores (theme, prompt, context, run state)
- `src/lib/types/` — TypeScript interfaces (ContextBlock, ModelRun, etc.)
- `src/app.css` — Tailwind + Forge design tokens (see below)

## Design System: "Forge" Palette

VibeForge uses a **dark-by-default** theme inspired by forged steel and embers. Tailwind theme extensions in `tailwind.config.cjs.bak`:

**Metal/Dark Tones:**
- `forge-blacksteel: #0B0F17` — Main background (deepest)
- `forge-gunmetal: #111827` — Secondary backgrounds
- `forge-steel: #1E293B` — Tertiary / interactive states

**Light/Quench Surfaces (Light Mode):**
- `forge-quench: #F8FAFC` — Primary light background
- `forge-quenchLift: #E2E8F0` — Accent light backgrounds

**Text & Borders:**
- `forge-textBright: #F8FAFC`, `forge-textDim: #CBD5E1`, `forge-textMuted: #94A3B8` (dark mode)
- `forge-line: #233044` — Dark borders, `forge-lineLight: #CBD5E1` (light mode)

**Accent:**
- `forge-ember: #FBBF24` — Primary action/highlight (warm amber)
- `forge-emberHover: #F59E0B` — Hover state

**Functional Colors:**
- `forge-info: #3B82F6`, `forge-danger: #EF4444`, `forge-success: #22C55E`

**Pattern:** All color-aware components check `$theme` store and apply conditional Tailwind classes for light/dark support (see `ForgeSideNav.svelte`, `PromptColumn.svelte` for examples).

## State Management: Svelte Stores

Stores live in `src/lib/stores/` and follow a **custom store factory** pattern with methods:

**`themeStore.ts`:**
- Singleton store: `export const theme` (`'dark' | 'light'`)
- Methods: `toggle()`, `setTheme(theme)`
- Persists to `localStorage` with key `'vibeforge-theme'`
- Applies `data-theme` attribute to `document.documentElement` on every change

**`promptStore.ts`:**
- `promptState` (writable): `{ text: string; lastUpdated: string }`
- Methods: `setText(text)`, `reset()`
- `estimatedTokens` (derived): Rough token count (~4 chars = 1 token)

**`contextStore.ts`:**
- `contextState` (writable): Array of `ContextBlock` items (see `types/context.ts`)
- `activeContexts` (derived): Filtered to `isActive === true`
- Methods: `toggleActive(id)`, `addContext(block)`, `removeContext(id)`, `updateContext(id, partial)`
- Example contexts pre-populate on init (system rules, design, AuthorForge project, code review patterns)

**`runStore.ts`:**
- `runState` (writable): `{ runs: ModelRun[]; activeRunId: string | null }`
- Derived: `runs` (array), `activeRun` (single or null)
- Methods: `addRun(run)`, `setActiveRun(id)`, `reset()`

**`presetsStore.ts`:**
- `Preset` interface: id, name, description, category ('coding'|'writing'|'analysis'|'evaluation'|'other'), workspace, tags, basePrompt, contextRefs, models, pinned, updatedAt
- Derived stores: `pinnedPresets` (filtered `pinned === true`), `allPresets`, `presets` (all)
- Methods: `togglePinned(id)`, `addPreset(preset)`, `removePreset(id)`, `updatePreset(id, partial)`
- Enables preset library UI and applies presets to workbench/quick-run prompts

**`accessibilityStore.ts`:**
- `AccessibilityState`: `{ fontSize: 'small'|'medium'|'large'|'x-large' }`
- Methods: `setFontSize(size)`, `reset()`
- Persists to `localStorage` with key `'forge-accessibility'`, applies `font-size` CSS to `document.root`

**Pattern:** All stores use `browser` check (`import { browser } from '$app/environment'`) before accessing `localStorage` or DOM, ensuring SSR-safe hydration.

## Component Patterns

### Theme-Aware Styling
Every visual component conditionally applies Tailwind classes based on `$theme`:
```svelte
<div class={`px-4 py-3 ${$theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
```
Light theme uses `slate-` colors; dark uses `forge-` colors or `slate-` variants.

### List Components & Filters
- `ContextList.svelte`, `HistoryTable.svelte`, `PatternsList.svelte` accept `blocks`, `activeId`, `onSelect` props
- Use `#each` with `(item.id)` as key for efficient re-renders
- Display empty state when array is empty (see `ContextList.svelte` lines 48–56)

### Multi-Column Layout
- `WorkbenchShell.svelte` — Flex column container that wraps page content
- `+layout.svelte` — Root layout orchestrates theme provider + top bar + side nav + workbench
- `ForgeSideNav.svelte` — Fixed 224px (`w-56`) navigation with emojis, routing via `$page.url.pathname`

### Detail Panels
- `ContextDetailPanel.svelte`, `HistoryDetailPanel.svelte`, `PatternDetailPanel.svelte` follow the same structure:
  - Accept item ID / data via props
  - Render metadata (tags, timestamps, description)
  - Theme-aware borders and text colors
  - Optional action buttons (delete, edit, share)

## Type System

**Key Types (in `src/lib/types/`):**

`context.ts`:
```typescript
export type ContextKind = 'system' | 'design' | 'project' | 'code' | 'workflow';
export type ContextSource = 'global' | 'workspace' | 'local';
export interface ContextBlock {
  id: string;
  title: string;
  kind: ContextKind;
  description: string;
  tags: string[];
  isActive: boolean;
  lastUpdated: string; // ISO date string
  source: ContextSource;
}
```

`workspace.ts`:
```typescript
export interface WorkspaceSettings {
  defaultEvaluationScale: "1-5" | "1-10";
  requireWinner: boolean;
}
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
  status: "active" | "archived";
  models: string[];
  tags: string[];
  settings: WorkspaceSettings;
  stats: { totalRuns: number; lastRunAt?: string };
}
```

`evaluation.ts` and `run.ts`: Define ModelRun, Evaluation interfaces with id, model, timestamp, output, scores, etc.

**Pattern:** Use discriminated unions for status/kind fields; always include ISO timestamps for sort/filter.

## Routing & Pages

SvelteKit file-based routing (each is a `+page.svelte` in its own directory):
- `/` — Main workbench (3-column: ContextColumn + PromptColumn + OutputColumn)
- `/quick-run` — Lightweight single-column prompt runner for rapid experimentation (fast model comparison, tactical prompts)
- `/contexts` — Context library browser and management
- `/history` — Run history, replay, and comparison metrics
- `/patterns` — Prompt patterns / recipes library
- `/presets` — Saved workbench configurations (context refs + model selections + base prompts)
- `/evals` — Evaluations dashboard and model comparison
- `/settings` — User preferences (appearance, fonts, models, workspace defaults, data policies)
- `/workspaces` — Multi-workspace management with stats and quick switching

**Reusable layout:** `src/routes/+layout.svelte` orchestrates theme provider + ForgeTopBar + ForgeSideNav + WorkbenchShell

## Build & Deployment

**Build Output:** `vite build` → `build/` directory (SvelteKit adapter-auto handles platform detection)

**Tailwind:** Using Tailwind v4 via `@tailwindcss/vite` plugin in `vite.config.ts`. All CSS imports via `@import "tailwindcss"` in `app.css`. Theme tokens defined in `@theme` block (lines 1–28 of `app.css`).

**SSR Hydration:** Stores use `browser` checks; locale storage access only in browser context.

## Feature Patterns

### Quick Run vs. Main Workbench
- **Quick Run** (`/quick-run`): Single-column, speed-optimized for rapid experiments. Components in `src/lib/components/quickrun/`. No context library, lightweight form, 1–2 model comparison side-by-side.
- **Main Workbench** (`/`): 3-column professional interface for structured, persistent work with full context management.

### Presets System
- **Preset** is a saved configuration: basePrompt + contextRefs (array of `{id, label}`) + models + metadata.
- Stored in `presetsStore` (in-memory; backend TODO).
- Components: `PresetsDrawer.svelte`, `SavePresetModal.svelte`, `PresetDetailPanel.svelte` in `src/lib/components/presets/`.
- Pattern: Pressing "Save Preset" in workbench opens modal; modal exports preset data to store.

### Workspaces
- **Workspace** entity: Container for contexts, settings, and run stats. Tracks default evaluation scale, preferred models, activity stats.
- Managed via `src/lib/types/workspace.ts` type definitions.
- UI in `src/lib/components/workspaces/` (WorkspacesList, WorkspaceDetailPanel, WorkspaceEditorDrawer).
- Pattern: 2-column layout on desktop (list + detail), responsive to single column on mobile.

### Settings Screen
- **Four sections** in `/settings` each with own component:
  1. `WorkspaceSettingsSection.svelte` — Defaults (workspace, models, evaluation scale, require winner)
  2. `AppearanceSettingsSection.svelte` — Theme, font size (links to `accessibilityStore`), density toggles
  3. `ModelSettingsSection.svelte` — Per-model API key and endpoint config
  4. `DataSettingsSection.svelte` — History retention, data management policies
- All controlled via stores; local-first (TODO: persist to backend).

## Critical Notes for Agents

1. **Always hydrate stores on mount** — Use `onMount(() => { /* load persisted state */ })` if needed for SSR edge cases
2. **Derived stores are reactive** — Don't mutate the source; use update/set methods on writable stores
3. **Theme propagates globally** — Changes to `theme` store auto-apply to all components; no manual refreshes needed
4. **Active contexts** are a derived filter — PromptColumn chip rendering depends on `$activeContexts` being synced with store
5. **Component prop patterns** — Most list/detail components follow `blocks`, `activeId`, `onSelect` convention for consistency
6. **Timestamp format** — Always use ISO 8601 strings (`new Date().toISOString()`) for `lastUpdated` fields; easier to sort and serialize
7. **Token estimation** — Current logic is naive (length / 4); keep it simple unless integrating with real tokenizer
8. **Presets persist to store only** — Currently in-memory; no backend sync yet (TODO comments in `presets.ts`). Save/load from `localStorage` manually if adding persistence.
9. **Workspace stats are display-only** — `totalRuns` and `lastRunAt` are computed from run history; don't mutate stats directly.
10. **Font size accessibility** — Changes to `accessibilityStore.fontSize` auto-apply CSS to document root; components don't need manual binding.
11. **Quick Run modal pattern** — If integrating new quick-run flows, follow the `open` prop + callback pattern in `QuickRunForm.svelte` for state management.
12. **Settings are local-first** — All settings UI reads from stores; backend persistence is a future enhancement. Current behavior is UI-only.
