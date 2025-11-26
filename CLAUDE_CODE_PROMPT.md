# VibeForge Refactoring - Claude Code Implementation Prompt

## Context

You are helping refactor VibeForge, a professional prompt engineering workbench built with SvelteKit 5, Svelte 5 (runes), TypeScript, Tailwind CSS 4, and Tauri 2. The target release is January 2026.

**Critical Architecture Rule:** VibeForge is frontend-only. All backend logic lives in DataForge (storage/analytics) and NeuroForge (LLM execution). Never create API routes in VibeForge.

## Project Structure

```
vibeforge/
├── src/
│   ├── routes/                    # SvelteKit pages (NO +server.ts files!)
│   ├── lib/
│   │   ├── core/
│   │   │   ├── api/              # API clients (neuroforgeClient, dataforgeClient)
│   │   │   └── stores/           # Svelte 5 rune-based stores (TARGET)
│   │   ├── workbench/            # 3-column workbench components
│   │   │   ├── context/          # Left column
│   │   │   ├── prompt/           # Center column
│   │   │   └── output/           # Right column
│   │   ├── stores/               # LEGACY stores (to be migrated/deleted)
│   │   ├── components/           # Feature components
│   │   ├── services/             # Business logic
│   │   ├── types/                # Type definitions
│   │   └── ui/                   # Shared UI components
│   └── tests/
└── src-tauri/                    # Tauri Rust backend
```

## Technology Requirements

- **Svelte 5 Runes:** Use `$state`, `$derived`, `$effect` - NOT `writable()` or `derived()`
- **TypeScript:** Strict mode, no `any` types
- **Tailwind CSS 4:** Use modern syntax
- **API Clients:** All HTTP calls go through `neuroforgeClient.ts` or `dataforgeClient.ts`
- **Environment Variables:** Must use `VITE_` prefix for browser access

## Rune Store Pattern

Always use this pattern for stores:

```typescript
// src/lib/core/stores/example.svelte.ts
interface ExampleState {
  items: Item[];
  isLoading: boolean;
  error: string | null;
}

function createExampleStore() {
  let state = $state<ExampleState>({
    items: [],
    isLoading: false,
    error: null,
  });

  // Derived values
  const itemCount = $derived(state.items.length);

  return {
    // Getters (reactive)
    get items() { return state.items; },
    get isLoading() { return state.isLoading; },
    get error() { return state.error; },
    get itemCount() { return itemCount; },

    // Actions
    async load() {
      state.isLoading = true;
      state.error = null;
      try {
        state.items = await apiClient.fetchItems();
      } catch (err) {
        state.error = err instanceof Error ? err.message : 'Failed';
      } finally {
        state.isLoading = false;
      }
    },

    // Mutations
    addItem(item: Item) {
      state.items = [item, ...state.items];
    },

    clearError() {
      state.error = null;
    },
  };
}

export const exampleStore = createExampleStore();
```

## API Client Pattern

```typescript
// src/lib/core/api/exampleClient.ts
const BASE_URL = import.meta.env.VITE_EXAMPLE_API_BASE || 'http://localhost:8000/api/v1';

export interface Item {
  id: string;
  name: string;
}

export async function fetchItems(): Promise<Item[]> {
  const response = await fetch(`${BASE_URL}/items`, {
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }

  return response.json();
}
```

## Component Pattern (Svelte 5)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { exampleStore } from '$lib/core/stores/example.svelte';

  // Props with $props()
  interface Props {
    title?: string;
    onSelect?: (item: Item) => void;
  }
  let { title = 'Default', onSelect }: Props = $props();

  // Local state with $state
  let searchQuery = $state('');

  // Derived with $derived
  const filteredItems = $derived(
    exampleStore.items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Effects with $effect
  $effect(() => {
    console.log('Items changed:', exampleStore.items.length);
  });

  onMount(() => {
    exampleStore.load();
  });
</script>

<div class="component">
  <h2>{title}</h2>
  <input bind:value={searchQuery} placeholder="Search..." />

  {#if exampleStore.isLoading}
    <p>Loading...</p>
  {:else if exampleStore.error}
    <p class="error">{exampleStore.error}</p>
  {:else}
    <ul>
      {#each filteredItems as item (item.id)}
        <li>
          <button onclick={() => onSelect?.(item)}>
            {item.name}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
```

## Testing Pattern (Vitest)

```typescript
// src/lib/core/stores/__tests__/example.svelte.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exampleStore } from '../example.svelte';
import * as exampleClient from '../../api/exampleClient';

vi.mock('../../api/exampleClient');

describe('exampleStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load items', async () => {
    const mockItems = [{ id: '1', name: 'Test' }];
    vi.mocked(exampleClient.fetchItems).mockResolvedValue(mockItems);

    await exampleStore.load();

    expect(exampleStore.items).toEqual(mockItems);
    expect(exampleStore.isLoading).toBe(false);
  });

  it('should handle errors', async () => {
    vi.mocked(exampleClient.fetchItems).mockRejectedValue(new Error('Network error'));

    await exampleStore.load();

    expect(exampleStore.error).toBe('Network error');
  });
});
```

---

## Implementation Tasks

Please implement the following tasks in order. After each task, run `pnpm check` to verify no TypeScript errors.

### Phase 1: Core Functionality

#### Task 1.1: Fix Module Exports
Create index.ts barrel exports in:
- `src/lib/workbench/context/index.ts`
- `src/lib/workbench/prompt/index.ts`
- `src/lib/workbench/output/index.ts`

Export all public components from each directory.

#### Task 1.2: Complete Run Execution
1. Update `src/lib/core/api/neuroforgeClient.ts` with `executePrompt()` and `executeMultiModel()` functions
2. Update `src/lib/core/stores/runs.svelte.ts` with execution logic
3. Wire `src/routes/quick-run/+page.svelte` to use real API calls

#### Task 1.3: Wire Workspace Persistence
1. Add workspace CRUD functions to `src/lib/core/api/dataforgeClient.ts`
2. Update `src/lib/core/stores/workspace.svelte.ts` with persistence logic
3. Wire `src/routes/workspaces/+page.svelte` to use the store

#### Task 1.4: Integrate Context Store
1. Add context CRUD and search functions to `src/lib/core/api/dataforgeClient.ts`
2. Update `src/lib/core/stores/contextBlocks.svelte.ts`
3. Wire `src/lib/workbench/context/ContextColumn.svelte` to use the store

### Phase 2: Quality & Stability

#### Task 2.1: Add Store Tests
Create unit tests for all rune-based stores in `src/lib/core/stores/__tests__/`

#### Task 2.2: Migrate Legacy Stores
Migrate these files from writable() to runes:
1. `src/lib/stores/promptStore.ts` → `src/lib/core/stores/prompt.svelte.ts`
2. `src/lib/stores/presets.ts` → `src/lib/core/stores/presets.svelte.ts`
3. `src/lib/stores/themeStore.ts` → `src/lib/core/stores/theme.svelte.ts`

Then update all imports and delete the legacy files.

#### Task 2.3: Remove any Types
Find and replace all `: any` and `as any` with proper types.

### Phase 3: Polish

#### Task 3.1: Add Error Boundaries
Create `src/lib/ui/ErrorBoundary.svelte` and `src/routes/+error.svelte`

#### Task 3.2: Tauri Secure Storage
Implement secure API key storage using Tauri's keyring integration.

---

## Important Notes

1. **Never create +server.ts files** - VibeForge is frontend-only
2. **Always use VITE_ prefix** for environment variables accessed in browser
3. **Use $state, $derived, $effect** - NOT writable() or derived()
4. **Run pnpm check after each change** to catch TypeScript errors early
5. **Keep components focused** - one responsibility per component
6. **Handle errors gracefully** - every async operation needs try/catch
7. **Type everything** - no implicit any, no explicit any

## Reference Documentation

The full implementation plan with code examples is in `VIBEFORGE_REFACTORING_PLAN.md`.

When implementing:
1. Read the relevant section of the plan
2. Implement the code exactly as specified
3. Run `pnpm check` to verify
4. Run `pnpm dev` to test functionality
5. Move to the next task

Start with Task 1.1 (Fix Module Exports) and work through sequentially.
