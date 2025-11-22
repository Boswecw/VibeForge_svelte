# Phase 2 Quick Start Guide — UI Component Wiring

**What to do next**: Connect the Phase 1 backend infrastructure to the 3-column UI components.

---

## 5-Minute Overview

You now have:

- ✅ API clients and server routes (backend done)
- ✅ State stores with reactive updates
- ✅ Type definitions for everything

What's left: Wire stores → component props → user interactions → API calls

---

## Component Updates Checklist

### 1. ContextColumn.svelte

**Import stores:**

```typescript
import { dataforgeStore, contextCount } from "$lib/stores/dataforgeStore";
```

**Load contexts on mount:**

```typescript
onMount(async () => {
  dataforgeStore.setLoadingContexts(true);
  try {
    const response = await fetch("/api/contexts?workspace_id=vf_ws_01");
    const data = await response.json();
    dataforgeStore.setContexts(data.contexts);
  } catch (err) {
    dataforgeStore.setError(err.message);
  } finally {
    dataforgeStore.setLoadingContexts(false);
  }
});
```

**Add debounced search:**

```typescript
import { debounce } from "$lib/utils/debounce"; // Create if needed

const handleSearch = debounce(async (query: string) => {
  if (!query.trim()) {
    dataforgeStore.clearSearchResults();
    return;
  }

  dataforgeStore.setSearching(true);
  try {
    const response = await fetch("/api/search-context?workspace_id=vf_ws_01", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, top_k: 10 }),
    });
    const data = await response.json();
    dataforgeStore.setSearchResults(data.results);
  } catch (err) {
    dataforgeStore.setError(err.message);
  } finally {
    dataforgeStore.setSearching(false);
  }
}, 300);
```

**Render from store:**

```svelte
{#each $dataforgeStore.contexts as ctx (ctx.id)}
  <ContextBlock {ctx} />
{/each}

{#if $dataforgeStore.isSearching}
  <LoadingSpinner />
{/if}

{#each $dataforgeStore.searchResults as result (result.chunk_id)}
  <SearchResult {result} />
{/each}
```

---

### 2. PromptColumn.svelte

**Import stores:**

```typescript
import { neuroforgeStore, modelCount } from "$lib/stores/neuroforgeStore";
import { dataforgeStore } from "$lib/stores/dataforgeStore";
```

**Load models on mount:**

```typescript
onMount(async () => {
  neuroforgeStore.setLoadingModels(true);
  try {
    const response = await fetch("/api/models");
    const data = await response.json();
    neuroforgeStore.setModels(data.models);
  } catch (err) {
    neuroforgeStore.setError(err.message);
  } finally {
    neuroforgeStore.setLoadingModels(false);
  }
});
```

**Populate model selector:**

```svelte
<select bind:value={selectedModel}>
  {#each $neuroforgeStore.models as model (model.id)}
    <option value={model.id}>{model.display_name}</option>
  {/each}
</select>
```

**Handle "Run" button:**

```typescript
async function handleRun() {
  const prompt = promptState.getText();
  const contexts = get(activeContexts);

  if (!prompt.trim()) {
    neuroforgeStore.setError("Prompt cannot be empty");
    return;
  }

  neuroforgeStore.setExecuting(true);
  try {
    const response = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: "vf_ws_01", // Get from workspace store
        prompt,
        system: systemPrompt,
        models: selectedModels,
        contexts: contexts.map((c) => ({
          context_id: c.id,
          chunk_id: "ch_01", // TODO: Get from selected chunk
        })),
      }),
    });

    if (!response.ok) throw new Error("Run failed");

    const data = await response.json();
    neuroforgeStore.setCurrentRunId(data.run_id);
    neuroforgeStore.setResponses(data.responses);
  } catch (err) {
    neuroforgeStore.setError(err.message);
  } finally {
    neuroforgeStore.setExecuting(false);
  }
}
```

**Show loading state:**

```svelte
{#if $neuroforgeStore.isExecuting}
  <LoadingSpinner text="Executing prompt..." />
{:else}
  <button on:click={handleRun}>Run via NeuroForge</button>
{/if}
```

---

### 3. OutputColumn.svelte

**Import stores:**

```typescript
import {
  neuroforgeStore,
  responseCount,
  totalTokensUsed,
  maxLatency,
} from "$lib/stores/neuroforgeStore";
```

**Show tabs for each response:**

```svelte
<div class="tabs">
  {#each $neuroforgeStore.responses as resp (resp.output_id)}
    <button
      class:active={selectedTab === resp.output_id}
      on:click={() => selectedTab = resp.output_id}
    >
      {resp.model}
    </button>
  {/each}
</div>

<div class="content">
  {#each $neuroforgeStore.responses as resp (resp.output_id)}
    {#if selectedTab === resp.output_id}
      <div class="output">
        <div class="text">{resp.text}</div>
        <div class="metrics">
          <span>Tokens: {resp.usage.total_tokens}</span>
          <span>Latency: {resp.latency_ms}ms</span>
        </div>
      </div>
    {/if}
  {/each}
</div>
```

**Show summary stats:**

```svelte
<div class="summary">
  <p>Total Tokens: {$totalTokensUsed}</p>
  <p>Max Latency: {$maxLatency}ms</p>
  <p>Models: {$responseCount}</p>
</div>
```

---

### 4. Add History Panel (Phase 2+)

**Create new component** `src/lib/components/history/HistoryPanel.svelte`:

```typescript
import { dataforgeStore } from "$lib/stores/dataforgeStore";

onMount(async () => {
  dataforgeStore.setLoadingHistory(true);
  try {
    const response = await fetch("/api/history?workspace_id=vf_ws_01&limit=50");
    const data = await response.json();
    dataforgeStore.setHistory(data.runs);
  } catch (err) {
    dataforgeStore.setError(err.message);
  } finally {
    dataforgeStore.setLoadingHistory(false);
  }
});
```

```svelte
{#each $dataforgeStore.history as run (run.id)}
  <div class="run-item" on:click={() => replayRun(run)}>
    <strong>{run.prompt.substring(0, 50)}...</strong>
    <span>{run.created_at}</span>
  </div>
{/each}
```

---

## Utility Functions to Create

### 1. Debounce Helper

Create `src/lib/utils/debounce.ts`:

```typescript
export function debounce<T extends any[]>(
  fn: (...args: T) => void,
  ms: number
) {
  let timeout: NodeJS.Timeout;
  return (...args: T) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}
```

### 2. Workspace Store

Create `src/lib/stores/workspaceStore.ts`:

```typescript
import { writable } from "svelte/store";

export const currentWorkspaceId = writable("vf_ws_01");
```

---

## Key Patterns

### Pattern 1: Async Loading

```typescript
store.setLoading(true);
try {
  const data = await fetch("/api/endpoint").then((r) => r.json());
  store.setData(data);
} catch (err) {
  store.setError(err.message);
} finally {
  store.setLoading(false);
}
```

### Pattern 2: Form Submission

```typescript
async function handleSubmit() {
  validate(); // Check inputs
  store.setLoading(true);
  const response = await fetch("/api/endpoint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  store.setData(await response.json());
}
```

### Pattern 3: Store Subscription in Component

```typescript
<script>
  let count: number;

  const unsubscribe = countStore.subscribe(value => {
    count = value;
  });

  onDestroy(() => unsubscribe());
</script>

<!-- Or use $ prefix (auto-unsubscribe) -->
{$countStore}
```

---

## Testing Checklist

- [ ] Load contexts and display in ContextColumn
- [ ] Search contexts with debounce (check network tab for single request)
- [ ] Load models in PromptColumn
- [ ] Click Run and see request to `/api/run`
- [ ] Display responses in OutputColumn tabs
- [ ] Show token counts and latency
- [ ] Load history in History Panel
- [ ] Click "replay" and repopulate prompt/contexts

---

## Common Gotchas

**1. Forgetting `$` prefix for stores in Svelte**

```svelte
<!-- ❌ Wrong -->
{dataforgeStore.contexts}

<!-- ✅ Right -->
{$dataforgeStore.contexts}
```

**2. Not awaiting async operations**

```typescript
// ❌ Wrong
handleRun();
// UI renders before data loads

// ✅ Right
await handleRun();
// Then update UI
```

**3. Hardcoding workspace ID**

```typescript
// ❌ Wrong
const response = await fetch("/api/contexts?workspace_id=vf_ws_01");

// ✅ Right
const workspaceId = get(currentWorkspaceId);
const response = await fetch(`/api/contexts?workspace_id=${workspaceId}`);
```

---

## Next: Phase 3

After Phase 2 UI is wired, Phase 3 will add:

- Champion/challenger visualization
- Multi-model diff viewer
- Feedback integration
- Advanced telemetry
- Telemetry dashboard

---

**Ready to build UI?** Go wire up the components! 🚀
