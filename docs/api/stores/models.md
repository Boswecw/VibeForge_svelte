# Models Store API

> Manages available LLM models, selection, and cost estimation

**File**: [`src/lib/core/stores/models.svelte.ts`](../../../src/lib/core/stores/models.svelte.ts)
**Test File**: [`src/tests/stores/models.test.ts`](../../../src/tests/stores/models.test.ts)
**Test Coverage**: 51 tests

## Overview

The `modelsStore` manages available LLM models from multiple providers, handles model selection for execution, and provides cost estimation for prompt runs.

## State Interface

```typescript
interface ModelsState {
  models: Model[];
  selectedIds: string[];
  isLoading: boolean;
  error: string | null;
}
```

## API Reference

### State Getters

| Property | Type | Description |
|----------|------|-------------|
| `modelsStore.models` | `Model[]` | All available models |
| `modelsStore.selectedIds` | `string[]` | IDs of selected models |
| `modelsStore.isLoading` | `boolean` | Loading state |
| `modelsStore.error` | `string \| null` | Error message if any |

### Derived State

| Property | Type | Description |
|----------|------|-------------|
| `modelsStore.selectedModels` | `Model[]` | Full model objects for selected IDs |
| `modelsStore.availableModels` | `Model[]` | Models not currently selected |
| `modelsStore.modelsByProvider` | `Record<string, Model[]>` | Models grouped by provider |
| `modelsStore.hasSelection` | `boolean` | True if any models selected |
| `modelsStore.selectedCount` | `number` | Count of selected models |

### Actions

#### Model Management

```typescript
modelsStore.setModels(models: Model[]): void
modelsStore.getModelById(id: string): Model | undefined
```

#### Selection Management

```typescript
modelsStore.selectModel(id: string): void
modelsStore.deselectModel(id: string): void
modelsStore.toggleModel(id: string): void
modelsStore.setSelectedIds(ids: string[]): void
modelsStore.clearSelection(): void
modelsStore.selectOnly(id: string): void
modelsStore.selectAll(): void
```

#### Cost Estimation

```typescript
modelsStore.estimatedCost(inputTokens: number, outputTokens: number): number
```

#### Utility

```typescript
modelsStore.setLoading(loading: boolean): void
modelsStore.setError(error: string | null): void
```

## Usage Examples

### Model Selector Component

```svelte
<script lang="ts">
  import { modelsStore } from '$lib/core/stores/models.svelte';

  const modelsByProvider = $derived(modelsStore.modelsByProvider);
</script>

<div class="model-selector">
  <h3>Select Models ({modelsStore.selectedCount} selected)</h3>

  {#each Object.entries(modelsByProvider) as [provider, models]}
    <section>
      <h4>{provider}</h4>
      {#each models as model}
        <label>
          <input
            type="checkbox"
            checked={modelsStore.selectedIds.includes(model.id)}
            onchange={() => modelsStore.toggleModel(model.id)}
          />
          {model.name}
          <span class="context">{model.maxContextTokens} tokens</span>
          {#if model.costPer1kTokens}
            <span class="cost">${model.costPer1kTokens}/1k tokens</span>
          {/if}
        </label>
      {/each}
    </section>
  {/each}

  <button onclick={() => modelsStore.clearSelection()}>
    Clear Selection
  </button>
</div>
```

### Cost Estimation

```svelte
<script lang="ts">
  import { modelsStore } from '$lib/core/stores/models.svelte';
  import { promptStore } from '$lib/core/stores/prompt.svelte';
  import { contextBlocksStore } from '$lib/core/stores/contextBlocks.svelte';

  // Estimate tokens
  const inputTokens = $derived(
    promptStore.estimatedTokens + contextBlocksStore.totalActiveTokens
  );
  const outputTokens = 500; // Assumed output length

  // Calculate cost for all selected models
  const estimatedCost = $derived(
    modelsStore.estimatedCost(inputTokens, outputTokens)
  );
</script>

<div class="cost-summary">
  <p>Input Tokens: {inputTokens}</p>
  <p>Expected Output: {outputTokens} tokens</p>
  <p>Selected Models: {modelsStore.selectedCount}</p>
  <p>Estimated Cost: ${estimatedCost.toFixed(4)}</p>
</div>
```

### Single Model Selection (Dropdown)

```svelte
<script lang="ts">
  import { modelsStore } from '$lib/core/stores/models.svelte';

  let selectedModelId = $state('');

  function handleSelect(e: Event) {
    const target = e.target as HTMLSelectElement;
    modelsStore.selectOnly(target.value);
    selectedModelId = target.value;
  }
</script>

<select value={selectedModelId} onchange={handleSelect}>
  <option value="">Select a model...</option>
  {#each modelsStore.models as model}
    <option value={model.id}>
      {model.provider} - {model.name}
    </option>
  {/each}
</select>
```

### Multi-Model Comparison

```svelte
<script lang="ts">
  import { modelsStore } from '$lib/core/stores/models.svelte';

  const selectedModels = $derived(modelsStore.selectedModels);
</script>

<div class="model-comparison">
  <h3>Running on {selectedModels.length} models</h3>

  <table>
    <thead>
      <tr>
        <th>Provider</th>
        <th>Model</th>
        <th>Context</th>
        <th>Cost</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each selectedModels as model}
        <tr>
          <td>{model.provider}</td>
          <td>{model.name}</td>
          <td>{model.maxContextTokens.toLocaleString()} tokens</td>
          <td>
            {#if model.costPer1kTokens}
              ${model.costPer1kTokens}/1k
            {:else}
              Free
            {/if}
          </td>
          <td>
            <button onclick={() => modelsStore.deselectModel(model.id)}>
              Remove
            </button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
```

### Filter Models by Provider

```svelte
<script lang="ts">
  import { modelsStore } from '$lib/core/stores/models.svelte';

  let selectedProvider = $state('all');

  const filteredModels = $derived(() => {
    if (selectedProvider === 'all') return modelsStore.models;
    return modelsStore.modelsByProvider[selectedProvider] || [];
  });
</script>

<div class="provider-filter">
  <select bind:value={selectedProvider}>
    <option value="all">All Providers</option>
    {#each Object.keys(modelsStore.modelsByProvider) as provider}
      <option value={provider}>{provider}</option>
    {/each}
  </select>

  <div class="models-grid">
    {#each filteredModels() as model}
      <div class="model-card">
        <h4>{model.name}</h4>
        <p>{model.provider}</p>
        <button onclick={() => modelsStore.selectOnly(model.id)}>
          Use This Model
        </button>
      </div>
    {/each}
  </div>
</div>
```

## Model Type Definition

```typescript
interface Model {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai' | 'local' | string;
  maxContextTokens: number;
  costPer1kTokens?: number;  // Optional, null for free/local models
  capabilities?: {
    streaming?: boolean;
    functionCalling?: boolean;
    vision?: boolean;
  };
}
```

## Cost Calculation

The `estimatedCost()` method calculates total cost across all selected models:

```typescript
const cost = modelsStore.estimatedCost(1000, 500);
// Returns: Sum of costs for all selected models
// Formula: ((inputTokens + outputTokens) / 1000) * costPer1kTokens
```

**Example**:
```typescript
// Selected models:
// - Claude Sonnet: $0.003/1k tokens
// - GPT-4: $0.03/1k tokens

const cost = modelsStore.estimatedCost(1000, 500);
// Input + Output = 1500 tokens
// Claude: (1500/1000) * 0.003 = $0.0045
// GPT-4: (1500/1000) * 0.03 = $0.045
// Total: $0.0495
```

## NeuroForge Integration

The models store integrates with NeuroForge for model routing and discovery:

```typescript
import { listModels } from '$lib/core/api/neuroforgeClient';

// Load available models
const models = await listModels();
modelsStore.setModels(models);
```

## Selection Patterns

### Single Selection (Radio Button Pattern)

```typescript
modelsStore.selectOnly('claude-sonnet-4');
// Only 'claude-sonnet-4' is selected
```

### Multi-Selection (Checkbox Pattern)

```typescript
modelsStore.selectModel('claude-sonnet-4');
modelsStore.selectModel('gpt-4');
modelsStore.selectModel('local-llama');
// All three are selected
```

### Toggle Selection

```typescript
modelsStore.toggleModel('claude-sonnet-4');
// Selects if not selected, deselects if selected
```

### Bulk Selection

```typescript
// Select all models
modelsStore.selectAll();

// Select specific set
modelsStore.setSelectedIds(['model-1', 'model-2', 'model-3']);

// Clear all
modelsStore.clearSelection();
```

## Best Practices

### ✅ Do

- Use `selectedModels` to get full model objects
- Use `modelsByProvider` to group models in UI
- Calculate costs before execution with `estimatedCost()`
- Check `hasSelection` before allowing execution
- Use `selectOnly()` for single-model workflows

### ❌ Don't

- Don't mutate models array directly
- Don't assume costPer1kTokens exists (check for null/undefined)
- Don't forget to load models on app initialization
- Don't mix single and multi-selection UX patterns without clear indication

## Performance Considerations

### Derived State Reactivity

All derived state is computed using `$derived`, ensuring optimal reactivity:
- `selectedModels` - Only recalculates when models or selectedIds change
- `modelsByProvider` - Only recalculates when models change
- Cost calculations - Only run when explicitly called

### Efficient Filtering

Use derived state instead of filtering in components:
```typescript
// ✅ Good - uses cached derived state
const selected = modelsStore.selectedModels;

// ❌ Bad - filters every render
const selected = modelsStore.models.filter(m =>
  modelsStore.selectedIds.includes(m.id)
);
```

---

**Last Updated**: 2025-01-26
**Version**: 5.3.0
**Test Coverage**: 51 tests (models, selection, cost estimation)
