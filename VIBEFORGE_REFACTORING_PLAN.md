# VibeForge Refactoring Implementation Plan

**Version:** 1.0  
**Created:** November 25, 2025  
**Target Release:** January 2026  
**Estimated Effort:** 284 hours (7-8 weeks)

---

## Executive Summary

This document provides a comprehensive, actionable refactoring plan for VibeForge. It is designed to be used with Claude Code (VS Code) for systematic implementation. The plan prioritizes shipping a functional MVP by January 2026 over perfect architecture.

### Key Principles

1. **Ship over perfection** - 40% test coverage beats 0% shipped
2. **Desktop-first** - Tauri app, not web SaaS
3. **Local-first** - Authentication deferred to Phase 2
4. **Ecosystem leverage** - DataForge/NeuroForge handle heavy lifting

---

## Project Context

### Architecture Overview

```
vibeforge/
├── src/
│   ├── routes/                    # SvelteKit pages (NO API routes)
│   │   ├── +page.svelte          # Main Workbench (3-column)
│   │   ├── quick-run/            # Quick Run mode
│   │   ├── patterns/             # Prompt patterns library
│   │   ├── contexts/             # Context management
│   │   ├── presets/              # Preset library
│   │   ├── workspaces/           # Workspace management
│   │   ├── history/              # Run history
│   │   ├── evals/                # Evaluations
│   │   └── settings/             # Settings
│   │
│   ├── lib/
│   │   ├── workbench/            # Workbench-specific (42 files)
│   │   │   ├── context/          # Context column components
│   │   │   ├── prompt/           # Prompt editor column
│   │   │   ├── output/           # Output/results column
│   │   │   ├── stores/           # Rune-based stores (TARGET)
│   │   │   └── types/            # Workbench types
│   │   │
│   │   ├── components/           # Feature components (89 files)
│   │   ├── stores/               # Legacy stores (TO BE MIGRATED)
│   │   ├── core/                 # Core stores + API
│   │   │   ├── api/              # neuroforgeClient, dataforgeClient
│   │   │   └── stores/           # Rune-based stores
│   │   ├── services/             # Business logic
│   │   ├── types/                # Type definitions
│   │   └── ui/                   # Shared UI components
│   │
│   └── tests/
│       └── e2e/                  # Playwright tests
│
└── src-tauri/                    # Tauri Rust backend
```

### Technology Stack

- **Frontend:** SvelteKit 5 + Svelte 5 (runes syntax)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 4
- **Desktop:** Tauri 2
- **State:** Svelte 5 runes (migrating from legacy stores)
- **Build:** Vite 7
- **Backend Integration:** DataForge + NeuroForge APIs

### Current State Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Test Coverage | 1.8% | 40%+ |
| TODO Markers | 50+ | <10 |
| TypeScript Errors | 0 | 0 |
| Legacy Stores | 14 | 0 |
| Rune Stores | 7 | 14+ |

---

## Phase 1: Core Functionality (Weeks 1-3)

### Objective

Make the app work end-to-end: User can create workspace → add context → write prompt → execute → see output → save workspace.

---

### Task 1.1: Fix Module Exports

**Priority:** P0  
**Estimated Hours:** 4  
**Files to Modify:**

```
src/lib/workbench/context/index.ts (CREATE)
src/lib/workbench/prompt/index.ts (CREATE)
src/lib/workbench/output/index.ts (CREATE)
```

**Implementation:**

Create barrel exports for each workbench column directory.

```typescript
// src/lib/workbench/context/index.ts
export { default as ContextColumn } from './ContextColumn.svelte';
export { default as ContextBlock } from './ContextBlock.svelte';
export { default as ContextList } from './ContextList.svelte';
// ... export all public components

// src/lib/workbench/prompt/index.ts
export { default as PromptColumn } from './PromptColumn.svelte';
export { default as PromptEditor } from './PromptEditor.svelte';
// ... export all public components

// src/lib/workbench/output/index.ts
export { default as OutputColumn } from './OutputColumn.svelte';
export { default as OutputPanel } from './OutputPanel.svelte';
// ... export all public components
```

**Verification:**

```bash
# Should compile without errors
pnpm check
```

---

### Task 1.2: Complete Run Execution Flow

**Priority:** P0  
**Estimated Hours:** 24  
**Files to Modify:**

```
src/routes/quick-run/+page.svelte
src/lib/core/api/neuroforgeClient.ts
src/lib/core/stores/runs.svelte.ts
src/lib/workbench/output/OutputColumn.svelte
```

**Current Problem:**

```typescript
// src/routes/quick-run/+page.svelte:125
// TODO: Replace mock outputs with real API call to run selected models
```

**Implementation Steps:**

1. **Update NeuroForge Client** (`src/lib/core/api/neuroforgeClient.ts`):

```typescript
const NEUROFORGE_BASE = import.meta.env.VITE_NEUROFORGE_API_BASE || 'http://localhost:8002/api/v1';

export interface ExecutePromptRequest {
  prompt: string;
  model_id: string;
  context_blocks?: string[];
  parameters?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
  };
  workspace_id?: string;
}

export interface ExecutePromptResponse {
  run_id: string;
  model_id: string;
  output: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  latency_ms: number;
  created_at: string;
}

export async function executePrompt(request: ExecutePromptRequest): Promise<ExecutePromptResponse> {
  const response = await fetch(`${NEUROFORGE_BASE}/workbench/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_NEUROFORGE_API_KEY}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Execution failed: ${response.status}`);
  }

  return response.json();
}

export async function executeMultiModel(
  prompt: string,
  modelIds: string[],
  options?: Omit<ExecutePromptRequest, 'prompt' | 'model_id'>
): Promise<ExecutePromptResponse[]> {
  const results = await Promise.allSettled(
    modelIds.map(model_id => executePrompt({ prompt, model_id, ...options }))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<ExecutePromptResponse> => r.status === 'fulfilled')
    .map(r => r.value);
}
```

2. **Update Runs Store** (`src/lib/core/stores/runs.svelte.ts`):

```typescript
import { executePrompt, type ExecutePromptResponse } from '../api/neuroforgeClient';

interface RunsState {
  runs: ExecutePromptResponse[];
  currentRun: ExecutePromptResponse | null;
  isExecuting: boolean;
  error: string | null;
}

function createRunsStore() {
  let state = $state<RunsState>({
    runs: [],
    currentRun: null,
    isExecuting: false,
    error: null,
  });

  return {
    get runs() { return state.runs; },
    get currentRun() { return state.currentRun; },
    get isExecuting() { return state.isExecuting; },
    get error() { return state.error; },

    async execute(prompt: string, modelId: string, contextBlocks?: string[]) {
      state.isExecuting = true;
      state.error = null;

      try {
        const result = await executePrompt({
          prompt,
          model_id: modelId,
          context_blocks: contextBlocks,
        });

        state.currentRun = result;
        state.runs = [result, ...state.runs];
        return result;
      } catch (err) {
        state.error = err instanceof Error ? err.message : 'Execution failed';
        throw err;
      } finally {
        state.isExecuting = false;
      }
    },

    clearError() {
      state.error = null;
    },
  };
}

export const runsStore = createRunsStore();
```

3. **Wire Quick Run Page** (`src/routes/quick-run/+page.svelte`):

Replace the TODO block with actual execution:

```svelte
<script lang="ts">
  import { runsStore } from '$lib/core/stores/runs.svelte';
  import { modelsStore } from '$lib/core/stores/models.svelte';

  let prompt = $state('');
  let selectedModels = $state<string[]>([]);

  async function handleRun() {
    if (!prompt.trim() || selectedModels.length === 0) return;

    for (const modelId of selectedModels) {
      try {
        await runsStore.execute(prompt, modelId);
      } catch (err) {
        console.error(`Failed to execute on ${modelId}:`, err);
      }
    }
  }
</script>

<button
  onclick={handleRun}
  disabled={runsStore.isExecuting || !prompt.trim() || selectedModels.length === 0}
>
  {runsStore.isExecuting ? 'Running...' : 'Run'}
</button>

{#if runsStore.error}
  <div class="error">{runsStore.error}</div>
{/if}

{#if runsStore.currentRun}
  <div class="output">
    <pre>{runsStore.currentRun.output}</pre>
    <div class="metrics">
      Tokens: {runsStore.currentRun.usage.total_tokens} |
      Latency: {runsStore.currentRun.latency_ms}ms
    </div>
  </div>
{/if}
```

**Verification:**

```bash
# Start NeuroForge backend
cd ../NeuroForge && python -m uvicorn app.main:app --port 8002

# Test execution
pnpm dev
# Navigate to /quick-run, enter prompt, select model, click Run
```

---

### Task 1.3: Wire Workspace Persistence

**Priority:** P0  
**Estimated Hours:** 16  
**Files to Modify:**

```
src/routes/workspaces/+page.svelte
src/lib/core/stores/workspace.svelte.ts
src/lib/core/api/dataforgeClient.ts
```

**Current Problem:**

```typescript
// src/routes/workspaces/+page.svelte:132
// TODO: Wire workspace create/update to backend or global store
```

**Implementation Steps:**

1. **Update DataForge Client** (`src/lib/core/api/dataforgeClient.ts`):

```typescript
const DATAFORGE_BASE = import.meta.env.VITE_DATAFORGE_API_BASE || 'http://localhost:8001/api/v1';

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  context_ids: string[];
  prompt_template?: string;
  model_ids: string[];
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  context_ids?: string[];
  model_ids?: string[];
  settings?: Record<string, unknown>;
}

export async function listWorkspaces(): Promise<Workspace[]> {
  const response = await fetch(`${DATAFORGE_BASE}/workspaces`, {
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_DATAFORGE_API_KEY}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch workspaces');
  return response.json();
}

export async function createWorkspace(data: CreateWorkspaceRequest): Promise<Workspace> {
  const response = await fetch(`${DATAFORGE_BASE}/workspaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_DATAFORGE_API_KEY}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error('Failed to create workspace');
  return response.json();
}

export async function updateWorkspace(id: string, data: Partial<CreateWorkspaceRequest>): Promise<Workspace> {
  const response = await fetch(`${DATAFORGE_BASE}/workspaces/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_DATAFORGE_API_KEY}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error('Failed to update workspace');
  return response.json();
}

export async function deleteWorkspace(id: string): Promise<void> {
  const response = await fetch(`${DATAFORGE_BASE}/workspaces/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_DATAFORGE_API_KEY}`,
    },
  });

  if (!response.ok) throw new Error('Failed to delete workspace');
}
```

2. **Update Workspace Store** (`src/lib/core/stores/workspace.svelte.ts`):

```typescript
import * as dataforgeClient from '../api/dataforgeClient';
import type { Workspace, CreateWorkspaceRequest } from '../api/dataforgeClient';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

function createWorkspaceStore() {
  let state = $state<WorkspaceState>({
    workspaces: [],
    currentWorkspace: null,
    isLoading: false,
    isSaving: false,
    error: null,
  });

  return {
    get workspaces() { return state.workspaces; },
    get currentWorkspace() { return state.currentWorkspace; },
    get isLoading() { return state.isLoading; },
    get isSaving() { return state.isSaving; },
    get error() { return state.error; },

    async load() {
      state.isLoading = true;
      state.error = null;

      try {
        state.workspaces = await dataforgeClient.listWorkspaces();
      } catch (err) {
        state.error = err instanceof Error ? err.message : 'Failed to load workspaces';
      } finally {
        state.isLoading = false;
      }
    },

    async create(data: CreateWorkspaceRequest) {
      state.isSaving = true;
      state.error = null;

      try {
        const workspace = await dataforgeClient.createWorkspace(data);
        state.workspaces = [workspace, ...state.workspaces];
        state.currentWorkspace = workspace;
        return workspace;
      } catch (err) {
        state.error = err instanceof Error ? err.message : 'Failed to create workspace';
        throw err;
      } finally {
        state.isSaving = false;
      }
    },

    async update(id: string, data: Partial<CreateWorkspaceRequest>) {
      state.isSaving = true;
      state.error = null;

      try {
        const workspace = await dataforgeClient.updateWorkspace(id, data);
        state.workspaces = state.workspaces.map(w => w.id === id ? workspace : w);
        if (state.currentWorkspace?.id === id) {
          state.currentWorkspace = workspace;
        }
        return workspace;
      } catch (err) {
        state.error = err instanceof Error ? err.message : 'Failed to update workspace';
        throw err;
      } finally {
        state.isSaving = false;
      }
    },

    async delete(id: string) {
      state.isSaving = true;
      state.error = null;

      try {
        await dataforgeClient.deleteWorkspace(id);
        state.workspaces = state.workspaces.filter(w => w.id !== id);
        if (state.currentWorkspace?.id === id) {
          state.currentWorkspace = null;
        }
      } catch (err) {
        state.error = err instanceof Error ? err.message : 'Failed to delete workspace';
        throw err;
      } finally {
        state.isSaving = false;
      }
    },

    setCurrentWorkspace(workspace: Workspace | null) {
      state.currentWorkspace = workspace;
    },

    clearError() {
      state.error = null;
    },
  };
}

export const workspaceStore = createWorkspaceStore();
```

**Verification:**

```bash
# Start DataForge backend
cd ../DataForge && python -m uvicorn app.main:app --port 8001

# Test workspace CRUD
pnpm dev
# Navigate to /workspaces, create/edit/delete workspaces
```

---

### Task 1.4: Integrate Context Store with Workbench

**Priority:** P0  
**Estimated Hours:** 16  
**Files to Modify:**

```
src/routes/contexts/+page.svelte
src/lib/core/stores/contextBlocks.svelte.ts
src/lib/core/api/dataforgeClient.ts
src/lib/workbench/context/ContextColumn.svelte
```

**Current Problem:**

```typescript
// src/routes/contexts/+page.svelte:372
// TODO: Integrate with workbench context store
```

**Implementation Steps:**

1. **Add Context APIs to DataForge Client** (`src/lib/core/api/dataforgeClient.ts`):

```typescript
export interface ContextBlock {
  id: string;
  name: string;
  type: 'system' | 'user' | 'code' | 'document' | 'custom';
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateContextRequest {
  name: string;
  type: ContextBlock['type'];
  content: string;
  metadata?: Record<string, unknown>;
}

export async function listContexts(): Promise<ContextBlock[]> {
  const response = await fetch(`${DATAFORGE_BASE}/contexts`, {
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_DATAFORGE_API_KEY}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch contexts');
  return response.json();
}

export async function createContext(data: CreateContextRequest): Promise<ContextBlock> {
  const response = await fetch(`${DATAFORGE_BASE}/contexts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_DATAFORGE_API_KEY}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error('Failed to create context');
  return response.json();
}

export async function searchContexts(query: string): Promise<ContextBlock[]> {
  const response = await fetch(`${DATAFORGE_BASE}/contexts/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_DATAFORGE_API_KEY}`,
    },
    body: JSON.stringify({ query, limit: 20 }),
  });

  if (!response.ok) throw new Error('Search failed');
  return response.json();
}
```

2. **Update Context Blocks Store** (`src/lib/core/stores/contextBlocks.svelte.ts`):

```typescript
import * as dataforgeClient from '../api/dataforgeClient';
import type { ContextBlock, CreateContextRequest } from '../api/dataforgeClient';

interface ContextBlocksState {
  blocks: ContextBlock[];
  selectedIds: Set<string>;
  searchResults: ContextBlock[];
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
}

function createContextBlocksStore() {
  let state = $state<ContextBlocksState>({
    blocks: [],
    selectedIds: new Set(),
    searchResults: [],
    isLoading: false,
    isSearching: false,
    error: null,
  });

  const selectedBlocks = $derived(
    state.blocks.filter(b => state.selectedIds.has(b.id))
  );

  return {
    get blocks() { return state.blocks; },
    get selectedIds() { return state.selectedIds; },
    get selectedBlocks() { return selectedBlocks; },
    get searchResults() { return state.searchResults; },
    get isLoading() { return state.isLoading; },
    get isSearching() { return state.isSearching; },
    get error() { return state.error; },

    async load() {
      state.isLoading = true;
      state.error = null;

      try {
        state.blocks = await dataforgeClient.listContexts();
      } catch (err) {
        state.error = err instanceof Error ? err.message : 'Failed to load contexts';
      } finally {
        state.isLoading = false;
      }
    },

    async create(data: CreateContextRequest) {
      try {
        const block = await dataforgeClient.createContext(data);
        state.blocks = [block, ...state.blocks];
        return block;
      } catch (err) {
        state.error = err instanceof Error ? err.message : 'Failed to create context';
        throw err;
      }
    },

    async search(query: string) {
      if (!query.trim()) {
        state.searchResults = [];
        return;
      }

      state.isSearching = true;
      try {
        state.searchResults = await dataforgeClient.searchContexts(query);
      } catch (err) {
        state.error = err instanceof Error ? err.message : 'Search failed';
      } finally {
        state.isSearching = false;
      }
    },

    toggleSelection(id: string) {
      const newSet = new Set(state.selectedIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      state.selectedIds = newSet;
    },

    selectAll(ids: string[]) {
      state.selectedIds = new Set(ids);
    },

    clearSelection() {
      state.selectedIds = new Set();
    },

    clearError() {
      state.error = null;
    },
  };
}

export const contextBlocksStore = createContextBlocksStore();
```

3. **Wire ContextColumn** (`src/lib/workbench/context/ContextColumn.svelte`):

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { contextBlocksStore } from '$lib/core/stores/contextBlocks.svelte';

  let searchQuery = $state('');
  let searchTimeout: ReturnType<typeof setTimeout>;

  onMount(() => {
    contextBlocksStore.load();
  });

  function handleSearch(query: string) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      contextBlocksStore.search(query);
    }, 300);
  }

  $effect(() => {
    handleSearch(searchQuery);
  });
</script>

<div class="context-column">
  <header>
    <h2>Context</h2>
    <input
      type="search"
      placeholder="Search contexts..."
      bind:value={searchQuery}
    />
  </header>

  {#if contextBlocksStore.isLoading}
    <div class="loading">Loading contexts...</div>
  {:else if contextBlocksStore.error}
    <div class="error">{contextBlocksStore.error}</div>
  {:else}
    <ul class="context-list">
      {#each searchQuery ? contextBlocksStore.searchResults : contextBlocksStore.blocks as block (block.id)}
        <li>
          <label>
            <input
              type="checkbox"
              checked={contextBlocksStore.selectedIds.has(block.id)}
              onchange={() => contextBlocksStore.toggleSelection(block.id)}
            />
            <span class="name">{block.name}</span>
            <span class="type">{block.type}</span>
          </label>
        </li>
      {/each}
    </ul>
  {/if}

  <footer>
    <span>{contextBlocksStore.selectedIds.size} selected</span>
    <button onclick={() => contextBlocksStore.clearSelection()}>Clear</button>
  </footer>
</div>
```

**Verification:**

```bash
# Ensure DataForge has /contexts endpoints
# Test context load, search, selection
pnpm dev
# Navigate to main workbench, verify context column works
```

---

### Task 1.5: Fix Critical TODOs (Top 10)

**Priority:** P0  
**Estimated Hours:** 40  
**Files to Review:**

Run this command to find all TODOs:

```bash
grep -rn "TODO" src/ --include="*.ts" --include="*.svelte" | head -50
```

**Priority TODO List:**

| # | File | Line | TODO | Action |
|---|------|------|------|--------|
| 1 | `quick-run/+page.svelte` | 125 | Replace mock outputs | DONE (Task 1.2) |
| 2 | `workspaces/+page.svelte` | 132 | Wire workspace CRUD | DONE (Task 1.3) |
| 3 | `contexts/+page.svelte` | 372 | Integrate context store | DONE (Task 1.4) |
| 4 | `runStore.ts` | 43 | DataForge /runs endpoint | Implement below |
| 5 | `ModelSettingsSection.svelte` | 187 | Encrypt credentials | Defer to Phase 3 |
| 6 | `PromptEditor.svelte` | ~line varies | Token counting | Implement |
| 7 | `OutputColumn.svelte` | ~line varies | Export functionality | Implement |
| 8 | `history/+page.svelte` | ~line varies | Load run history | Implement |
| 9 | `presets/+page.svelte` | ~line varies | Preset persistence | Implement |
| 10 | `patterns/+page.svelte` | ~line varies | Pattern library | Implement |

**Implementation for TODO #4 - Run History:**

```typescript
// src/lib/core/api/dataforgeClient.ts - Add:

export interface RunRecord {
  id: string;
  workspace_id?: string;
  prompt: string;
  model_id: string;
  output: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  latency_ms: number;
  created_at: string;
}

export async function listRuns(workspaceId?: string): Promise<RunRecord[]> {
  const url = workspaceId
    ? `${DATAFORGE_BASE}/runs?workspace_id=${workspaceId}`
    : `${DATAFORGE_BASE}/runs`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_DATAFORGE_API_KEY}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch runs');
  return response.json();
}

export async function saveRun(run: Omit<RunRecord, 'id' | 'created_at'>): Promise<RunRecord> {
  const response = await fetch(`${DATAFORGE_BASE}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_DATAFORGE_API_KEY}`,
    },
    body: JSON.stringify(run),
  });

  if (!response.ok) throw new Error('Failed to save run');
  return response.json();
}
```

---

## Phase 2: Quality & Stability (Weeks 4-5)

### Objective

Achieve 40%+ test coverage and consolidate state management.

---

### Task 2.1: Unit Tests for Rune-Based Stores

**Priority:** P1  
**Estimated Hours:** 28  
**Test Framework:** Vitest  
**Files to Create:**

```
src/lib/core/stores/__tests__/workspace.svelte.test.ts
src/lib/core/stores/__tests__/contextBlocks.svelte.test.ts
src/lib/core/stores/__tests__/runs.svelte.test.ts
src/lib/core/stores/__tests__/models.svelte.test.ts
src/lib/core/stores/__tests__/prompt.svelte.test.ts
src/lib/core/stores/__tests__/tools.svelte.test.ts
src/lib/workbench/stores/__tests__/[all].test.ts
```

**Setup Vitest:**

```bash
pnpm add -D vitest @testing-library/svelte jsdom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/tests/setup.ts'],
  },
});
```

**Example Store Test:**

```typescript
// src/lib/core/stores/__tests__/workspace.svelte.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workspaceStore } from '../workspace.svelte';
import * as dataforgeClient from '../../api/dataforgeClient';

vi.mock('../../api/dataforgeClient');

describe('workspaceStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('load', () => {
    it('should fetch workspaces and update state', async () => {
      const mockWorkspaces = [
        { id: '1', name: 'Test Workspace', context_ids: [], model_ids: [] },
      ];

      vi.mocked(dataforgeClient.listWorkspaces).mockResolvedValue(mockWorkspaces);

      await workspaceStore.load();

      expect(workspaceStore.workspaces).toEqual(mockWorkspaces);
      expect(workspaceStore.isLoading).toBe(false);
      expect(workspaceStore.error).toBeNull();
    });

    it('should set error on failure', async () => {
      vi.mocked(dataforgeClient.listWorkspaces).mockRejectedValue(new Error('Network error'));

      await workspaceStore.load();

      expect(workspaceStore.error).toBe('Network error');
      expect(workspaceStore.isLoading).toBe(false);
    });
  });

  describe('create', () => {
    it('should create workspace and add to list', async () => {
      const newWorkspace = { id: '2', name: 'New', context_ids: [], model_ids: [] };
      vi.mocked(dataforgeClient.createWorkspace).mockResolvedValue(newWorkspace);

      const result = await workspaceStore.create({ name: 'New' });

      expect(result).toEqual(newWorkspace);
      expect(workspaceStore.workspaces).toContainEqual(newWorkspace);
      expect(workspaceStore.currentWorkspace).toEqual(newWorkspace);
    });
  });
});
```

**Coverage Target:** Each store should have tests for:

- Initial state
- All public methods
- Error handling
- Derived state computations

---

### Task 2.2: Component Tests for 3 Columns

**Priority:** P1  
**Estimated Hours:** 24  
**Files to Create:**

```
src/lib/workbench/context/__tests__/ContextColumn.test.ts
src/lib/workbench/prompt/__tests__/PromptColumn.test.ts
src/lib/workbench/output/__tests__/OutputColumn.test.ts
```

**Example Component Test:**

```typescript
// src/lib/workbench/context/__tests__/ContextColumn.test.ts
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import ContextColumn from '../ContextColumn.svelte';
import { contextBlocksStore } from '$lib/core/stores/contextBlocks.svelte';

vi.mock('$lib/core/stores/contextBlocks.svelte', () => ({
  contextBlocksStore: {
    blocks: [
      { id: '1', name: 'System Prompt', type: 'system', content: 'You are...' },
      { id: '2', name: 'Code Context', type: 'code', content: 'function...' },
    ],
    selectedIds: new Set(),
    isLoading: false,
    error: null,
    load: vi.fn(),
    toggleSelection: vi.fn(),
    search: vi.fn(),
  },
}));

describe('ContextColumn', () => {
  it('should render context blocks', () => {
    render(ContextColumn);

    expect(screen.getByText('System Prompt')).toBeInTheDocument();
    expect(screen.getByText('Code Context')).toBeInTheDocument();
  });

  it('should toggle selection on click', async () => {
    render(ContextColumn);

    const checkbox = screen.getAllByRole('checkbox')[0];
    await fireEvent.click(checkbox);

    expect(contextBlocksStore.toggleSelection).toHaveBeenCalledWith('1');
  });

  it('should show loading state', () => {
    contextBlocksStore.isLoading = true;
    render(ContextColumn);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

---

### Task 2.3: E2E Test for Golden Path

**Priority:** P1  
**Estimated Hours:** 8  
**File to Create:**

```
src/tests/e2e/golden-path.spec.ts
```

**Implementation:**

```typescript
// src/tests/e2e/golden-path.spec.ts
import { test, expect } from '@playwright/test';

test.describe('VibeForge Golden Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete workflow: create workspace → add context → run prompt → view output', async ({ page }) => {
    // Step 1: Create workspace
    await page.click('[data-testid="create-workspace"]');
    await page.fill('[data-testid="workspace-name"]', 'Test Workspace');
    await page.click('[data-testid="save-workspace"]');

    await expect(page.locator('[data-testid="current-workspace"]')).toContainText('Test Workspace');

    // Step 2: Add context
    await page.click('[data-testid="context-block-1"]');
    await expect(page.locator('[data-testid="selected-count"]')).toContainText('1 selected');

    // Step 3: Write prompt
    const editor = page.locator('[data-testid="prompt-editor"]');
    await editor.fill('Explain the concept of recursion in programming.');

    // Step 4: Select model and run
    await page.click('[data-testid="model-selector"]');
    await page.click('[data-testid="model-claude-3-sonnet"]');
    await page.click('[data-testid="run-button"]');

    // Step 5: Verify output
    await expect(page.locator('[data-testid="output-panel"]')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid="output-content"]')).not.toBeEmpty();
    await expect(page.locator('[data-testid="token-count"]')).toBeVisible();
  });

  test('should persist workspace across page reload', async ({ page }) => {
    // Create workspace
    await page.click('[data-testid="create-workspace"]');
    await page.fill('[data-testid="workspace-name"]', 'Persistent Workspace');
    await page.click('[data-testid="save-workspace"]');

    // Reload page
    await page.reload();

    // Verify persistence
    await expect(page.locator('[data-testid="workspace-list"]')).toContainText('Persistent Workspace');
  });
});
```

---

### Task 2.4: Migrate Legacy Stores to Runes

**Priority:** P1  
**Estimated Hours:** 20  
**Files to Migrate (Priority Order):**

1. `src/lib/stores/promptStore.ts` → `src/lib/core/stores/prompt.svelte.ts`
2. `src/lib/stores/contextStore.ts` → merge into `contextBlocks.svelte.ts`
3. `src/lib/stores/runStore.ts` → merge into `runs.svelte.ts`
4. `src/lib/stores/presets.ts` → `src/lib/core/stores/presets.svelte.ts`
5. `src/lib/stores/themeStore.ts` → `src/lib/core/stores/theme.svelte.ts`

**Migration Pattern:**

```typescript
// BEFORE (Legacy writable store)
// src/lib/stores/promptStore.ts
import { writable, derived } from 'svelte/store';

export const prompt = writable('');
export const systemPrompt = writable('');
export const temperature = writable(0.7);

export const fullPrompt = derived(
  [systemPrompt, prompt],
  ([$system, $prompt]) => `${$system}\n\n${$prompt}`
);

// AFTER (Svelte 5 runes)
// src/lib/core/stores/prompt.svelte.ts
interface PromptState {
  prompt: string;
  systemPrompt: string;
  temperature: number;
}

function createPromptStore() {
  let state = $state<PromptState>({
    prompt: '',
    systemPrompt: '',
    temperature: 0.7,
  });

  const fullPrompt = $derived(
    state.systemPrompt
      ? `${state.systemPrompt}\n\n${state.prompt}`
      : state.prompt
  );

  return {
    get prompt() { return state.prompt; },
    get systemPrompt() { return state.systemPrompt; },
    get temperature() { return state.temperature; },
    get fullPrompt() { return fullPrompt; },

    setPrompt(value: string) { state.prompt = value; },
    setSystemPrompt(value: string) { state.systemPrompt = value; },
    setTemperature(value: number) { state.temperature = value; },

    reset() {
      state.prompt = '';
      state.systemPrompt = '';
      state.temperature = 0.7;
    },
  };
}

export const promptStore = createPromptStore();
```

**After Migration:**

1. Update all imports from `$lib/stores/X` to `$lib/core/stores/X.svelte`
2. Update component access patterns (`.subscribe()` → direct property access)
3. Delete legacy store files
4. Run `pnpm check` to find remaining issues

---

### Task 2.5: Remove `any` Types

**Priority:** P1  
**Estimated Hours:** 8  
**Find All Instances:**

```bash
grep -rn ": any" src/ --include="*.ts" --include="*.svelte"
grep -rn "as any" src/ --include="*.ts" --include="*.svelte"
```

**Common Fixes:**

```typescript
// BEFORE
const handleApplyPreset = (event: any) => { ... }

// AFTER
interface PresetApplyEvent {
  detail: {
    preset: Preset;
  };
}
const handleApplyPreset = (event: CustomEvent<PresetApplyEvent['detail']>) => { ... }

// BEFORE
constructor(config: any) { ... }

// AFTER
interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}
constructor(config: ProviderConfig) { ... }

// BEFORE
const data = response.json() as any;

// AFTER
interface ApiResponse<T> {
  data: T;
  error?: string;
}
const data = response.json() as ApiResponse<Workspace>;
```

---

## Phase 3: Polish & Ship (Weeks 6-8)

### Objective

Production-ready desktop release.

---

### Task 3.1: Tauri Secure Storage

**Priority:** P2  
**Estimated Hours:** 16  
**Files to Create/Modify:**

```
src-tauri/src/secure_storage.rs
src-tauri/Cargo.toml
src/lib/services/secureStorage.ts
```

**Implementation:**

```rust
// src-tauri/src/secure_storage.rs
use keyring::Entry;
use tauri::command;

const SERVICE_NAME: &str = "vibeforge";

#[command]
pub fn store_secret(key: &str, value: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, key)
        .map_err(|e| e.to_string())?;
    entry.set_password(value)
        .map_err(|e| e.to_string())
}

#[command]
pub fn get_secret(key: &str) -> Result<Option<String>, String> {
    let entry = Entry::new(SERVICE_NAME, key)
        .map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[command]
pub fn delete_secret(key: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, key)
        .map_err(|e| e.to_string())?;
    entry.delete_password()
        .map_err(|e| e.to_string())
}
```

```typescript
// src/lib/services/secureStorage.ts
import { invoke } from '@tauri-apps/api/core';

export async function storeApiKey(provider: string, key: string): Promise<void> {
  await invoke('store_secret', { key: `api_key_${provider}`, value: key });
}

export async function getApiKey(provider: string): Promise<string | null> {
  return invoke('get_secret', { key: `api_key_${provider}` });
}

export async function deleteApiKey(provider: string): Promise<void> {
  await invoke('delete_secret', { key: `api_key_${provider}` });
}
```

---

### Task 3.2: Error Boundaries

**Priority:** P2  
**Estimated Hours:** 16  
**Files to Create:**

```
src/lib/ui/ErrorBoundary.svelte
src/routes/+error.svelte
src/lib/services/errorReporting.ts
```

**Implementation:**

```svelte
<!-- src/lib/ui/ErrorBoundary.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    fallback?: import('svelte').Snippet<[Error]>;
    children: import('svelte').Snippet;
  }

  let { fallback, children }: Props = $props();

  let error = $state<Error | null>(null);

  onMount(() => {
    const handleError = (event: ErrorEvent) => {
      error = event.error;
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  });

  function reset() {
    error = null;
  }
</script>

{#if error}
  {#if fallback}
    {@render fallback(error)}
  {:else}
    <div class="error-boundary">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onclick={reset}>Try again</button>
    </div>
  {/if}
{:else}
  {@render children()}
{/if}
```

```svelte
<!-- src/routes/+error.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="error-page">
  <h1>{$page.status}</h1>
  <p>{$page.error?.message || 'An unexpected error occurred'}</p>
  <a href="/">Return to Workbench</a>
</div>
```

---

### Task 3.3: Release Packaging

**Priority:** P2  
**Estimated Hours:** 16  
**Files to Modify:**

```
src-tauri/tauri.conf.json
.github/workflows/release.yml (CREATE)
```

**Tauri Config Updates:**

```json
{
  "build": {
    "beforeBuildCommand": "pnpm build",
    "beforeDevCommand": "pnpm dev",
    "devPath": "http://localhost:5173",
    "distDir": "../build"
  },
  "package": {
    "productName": "VibeForge",
    "version": "1.0.0"
  },
  "tauri": {
    "bundle": {
      "active": true,
      "category": "DeveloperTool",
      "identifier": "com.boswelldigital.vibeforge",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "targets": ["dmg", "app", "msi", "deb", "appimage"],
      "macOS": {
        "minimumSystemVersion": "10.15"
      },
      "windows": {
        "wix": {
          "language": "en-US"
        }
      }
    }
  }
}
```

---

## Appendix A: File Change Summary

### Files to Create

| File | Phase | Task |
|------|-------|------|
| `src/lib/workbench/context/index.ts` | 1 | 1.1 |
| `src/lib/workbench/prompt/index.ts` | 1 | 1.1 |
| `src/lib/workbench/output/index.ts` | 1 | 1.1 |
| `src/lib/core/stores/__tests__/*.test.ts` | 2 | 2.1 |
| `src/lib/workbench/*/__tests__/*.test.ts` | 2 | 2.2 |
| `src/tests/e2e/golden-path.spec.ts` | 2 | 2.3 |
| `src-tauri/src/secure_storage.rs` | 3 | 3.1 |
| `src/lib/ui/ErrorBoundary.svelte` | 3 | 3.2 |
| `vitest.config.ts` | 2 | 2.1 |

### Files to Modify

| File | Phase | Task |
|------|-------|------|
| `src/lib/core/api/neuroforgeClient.ts` | 1 | 1.2 |
| `src/lib/core/api/dataforgeClient.ts` | 1 | 1.3, 1.4 |
| `src/lib/core/stores/runs.svelte.ts` | 1 | 1.2 |
| `src/lib/core/stores/workspace.svelte.ts` | 1 | 1.3 |
| `src/lib/core/stores/contextBlocks.svelte.ts` | 1 | 1.4 |
| `src/routes/quick-run/+page.svelte` | 1 | 1.2 |
| `src/routes/workspaces/+page.svelte` | 1 | 1.3 |
| `src/lib/workbench/context/ContextColumn.svelte` | 1 | 1.4 |

### Files to Delete (After Migration)

| File | Phase | Task |
|------|-------|------|
| `src/lib/stores/promptStore.ts` | 2 | 2.4 |
| `src/lib/stores/contextStore.ts` | 2 | 2.4 |
| `src/lib/stores/runStore.ts` | 2 | 2.4 |
| `src/lib/stores/presets.ts` | 2 | 2.4 |
| `src/lib/stores/themeStore.ts` | 2 | 2.4 |

---

## Appendix B: Commands Reference

### Development

```bash
# Start dev server
pnpm dev

# Type check
pnpm check

# Build for production
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

### Tauri

```bash
# Start Tauri dev
pnpm tauri dev

# Build Tauri app
pnpm tauri build

# Build for specific platform
pnpm tauri build --target universal-apple-darwin
pnpm tauri build --target x86_64-pc-windows-msvc
pnpm tauri build --target x86_64-unknown-linux-gnu
```

### Testing

```bash
# Find TODOs
grep -rn "TODO" src/ --include="*.ts" --include="*.svelte"

# Find any types
grep -rn ": any" src/ --include="*.ts" --include="*.svelte"

# Check test coverage
pnpm test:coverage
```

---

## Appendix C: Environment Variables

```env
# .env.example

# DataForge API
VITE_DATAFORGE_API_BASE=http://localhost:8001/api/v1
VITE_DATAFORGE_API_KEY=df-dev-key

# NeuroForge API
VITE_NEUROFORGE_API_BASE=http://localhost:8002/api/v1
VITE_NEUROFORGE_API_KEY=nf-dev-key

# Feature Flags
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEBUG_MODE=true
```

---

## Appendix D: Success Criteria

### Phase 1 Complete When:

- [ ] User can create/save/load workspaces
- [ ] User can add/search/select context blocks
- [ ] User can execute prompts against real models
- [ ] User can view execution results with metrics
- [ ] No TypeScript errors
- [ ] All critical TODOs resolved

### Phase 2 Complete When:

- [ ] Test coverage ≥ 40%
- [ ] All stores migrated to runes
- [ ] No `any` types in codebase
- [ ] E2E golden path test passes
- [ ] Legacy store files deleted

### Phase 3 Complete When:

- [ ] API keys stored securely via Tauri
- [ ] Error boundaries catch all errors
- [ ] Builds successfully for macOS, Windows, Linux
- [ ] Documentation updated
- [ ] Version 1.0.0 tagged

---

**Document End**
