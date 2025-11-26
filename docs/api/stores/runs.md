# Runs Store API

> Manages prompt execution runs, history tracking, and analytics

**File**: [`src/lib/core/stores/runs.svelte.ts`](../../../src/lib/core/stores/runs.svelte.ts)
**Test File**: [`src/tests/stores/runs.test.ts`](../../../src/tests/stores/runs.test.ts)
**Test Coverage**: 58 tests

## Overview

The `runsStore` manages prompt execution runs with comprehensive history tracking, status management, and analytics for tokens, costs, and performance metrics.

## State Interface

```typescript
interface RunsState {
  runs: PromptRun[];
  activeRunId: string | null;
  isExecuting: boolean;
  executionProgress: number;  // 0-100
  error: string | null;
}
```

## API Reference

### State Getters

| Property | Type | Description |
|----------|------|-------------|
| `runsStore.runs` | `PromptRun[]` | All execution runs |
| `runsStore.activeRunId` | `string \| null` | ID of currently active run |
| `runsStore.isExecuting` | `boolean` | True during execution |
| `runsStore.executionProgress` | `number` | Progress percentage (0-100) |
| `runsStore.error` | `string \| null` | Error message if any |

### Derived State

| Property | Type | Description |
|----------|------|-------------|
| `runsStore.activeRun` | `PromptRun \| null` | Full object of active run |
| `runsStore.latestRun` | `PromptRun \| null` | Most recently started run |
| `runsStore.runsByStatus` | `Record<RunStatus, PromptRun[]>` | Runs grouped by status |
| `runsStore.successfulRuns` | `PromptRun[]` | Only successful runs |
| `runsStore.failedRuns` | `PromptRun[]` | Only failed runs |
| `runsStore.totalTokensUsed` | `number` | Sum of all tokens used |
| `runsStore.totalCost` | `number` | Sum of all execution costs |
| `runsStore.averageDuration` | `number` | Average duration in ms |

### Actions

#### Run Management

```typescript
runsStore.setRuns(runs: PromptRun[]): void
runsStore.addRun(run: PromptRun): void
runsStore.updateRun(id: string, updates: Partial<PromptRun>): void
runsStore.removeRun(id: string): void
runsStore.clearRuns(): void
runsStore.setActiveRun(id: string | null): void
runsStore.getRunById(id: string): PromptRun | undefined
runsStore.getRunsByModel(modelId: string): PromptRun[]
```

#### Execution Management

```typescript
runsStore.startExecution(): void
runsStore.updateExecutionProgress(progress: number): void
runsStore.completeExecution(): void
runsStore.cancelExecution(): void
```

#### Async Execution

```typescript
runsStore.execute(
  prompt: string,
  modelId: string,
  contextBlocks?: string[]
): Promise<SimplifiedExecuteResponse>
```

#### Utility

```typescript
runsStore.setError(error: string | null): void
```

## Usage Examples

### Execute a Prompt

```typescript
import { runsStore } from '$lib/core/stores/runs.svelte';
import { promptStore } from '$lib/core/stores/prompt.svelte';
import { modelsStore } from '$lib/core/stores/models.svelte';
import { contextBlocksStore } from '$lib/core/stores/contextBlocks.svelte';

async function executePrompt() {
  try {
    const result = await runsStore.execute(
      promptStore.resolvedPrompt,
      modelsStore.selectedIds[0],
      contextBlocksStore.activeBlockIds
    );
    console.log('Execution complete:', result);
  } catch (error) {
    console.error('Execution failed:', error);
  }
}
```

### Run History Display

```svelte
<script lang="ts">
  import { runsStore } from '$lib/core/stores/runs.svelte';

  const runs = $derived(runsStore.runs);
</script>

<div class="run-history">
  <h3>Execution History ({runs.length} runs)</h3>

  <div class="stats">
    <span>Total Tokens: {runsStore.totalTokensUsed.toLocaleString()}</span>
    <span>Total Cost: ${runsStore.totalCost.toFixed(4)}</span>
    <span>Avg Duration: {runsStore.averageDuration}ms</span>
  </div>

  <div class="runs-list">
    {#each runs as run}
      <div class="run-card" class:active={run.id === runsStore.activeRunId}>
        <div class="run-header">
          <span class="status status-{run.status}">{run.status}</span>
          <span class="timestamp">{new Date(run.startedAt).toLocaleString()}</span>
        </div>

        <div class="run-content">
          <p class="output">{run.output?.substring(0, 200)}...</p>
        </div>

        <div class="run-meta">
          <span>{run.totalTokens} tokens</span>
          <span>{run.durationMs}ms</span>
          {#if run.cost}
            <span>${run.cost.toFixed(4)}</span>
          {/if}
        </div>

        <button onclick={() => runsStore.setActiveRun(run.id)}>
          View Full Output
        </button>
      </div>
    {/each}
  </div>
</div>
```

### Filter Runs by Status

```svelte
<script lang="ts">
  import { runsStore } from '$lib/core/stores/runs.svelte';

  const successfulRuns = $derived(runsStore.successfulRuns);
  const failedRuns = $derived(runsStore.failedRuns);
</script>

<div class="run-filters">
  <section>
    <h4>Successful Runs ({successfulRuns.length})</h4>
    {#each successfulRuns as run}
      <div class="run-item">{run.id}</div>
    {/each}
  </section>

  <section>
    <h4>Failed Runs ({failedRuns.length})</h4>
    {#each failedRuns as run}
      <div class="run-item error">
        {run.id}
        {#if run.error}
          <span>{run.error}</span>
        {/if}
      </div>
    {/each}
  </section>
</div>
```

### Execution Progress Indicator

```svelte
<script lang="ts">
  import { runsStore } from '$lib/core/stores/runs.svelte';

  const isExecuting = $derived(runsStore.isExecuting);
  const progress = $derived(runsStore.executionProgress);
</script>

{#if isExecuting}
  <div class="execution-progress">
    <div class="progress-bar">
      <div class="progress-fill" style="width: {progress}%"></div>
    </div>
    <span>{progress}%</span>
    <button onclick={() => runsStore.cancelExecution()}>
      Cancel
    </button>
  </div>
{/if}
```

### Active Run Viewer

```svelte
<script lang="ts">
  import { runsStore } from '$lib/core/stores/runs.svelte';

  const activeRun = $derived(runsStore.activeRun);
</script>

<div class="active-run-viewer">
  {#if activeRun}
    <div class="run-output">
      <h3>Output</h3>
      <pre>{activeRun.output}</pre>
    </div>

    <div class="run-details">
      <h4>Details</h4>
      <dl>
        <dt>Model ID:</dt>
        <dd>{activeRun.modelId}</dd>

        <dt>Status:</dt>
        <dd>{activeRun.status}</dd>

        <dt>Tokens Used:</dt>
        <dd>{activeRun.totalTokens}</dd>

        <dt>Duration:</dt>
        <dd>{activeRun.durationMs}ms</dd>

        <dt>Cost:</dt>
        <dd>${activeRun.cost?.toFixed(4) || 'N/A'}</dd>

        <dt>Started:</dt>
        <dd>{new Date(activeRun.startedAt).toLocaleString()}</dd>

        {#if activeRun.completedAt}
          <dt>Completed:</dt>
          <dd>{new Date(activeRun.completedAt).toLocaleString()}</dd>
        {/if}
      </dl>
    </div>
  {:else}
    <p>No active run selected</p>
  {/if}
</div>
```

### Model Performance Comparison

```svelte
<script lang="ts">
  import { runsStore } from '$lib/core/stores/runs.svelte';

  const runsByStatus = $derived(runsStore.runsByStatus);

  // Group runs by model for comparison
  function groupByModel(runs: PromptRun[]) {
    return runs.reduce((acc, run) => {
      if (!acc[run.modelId]) {
        acc[run.modelId] = [];
      }
      acc[run.modelId].push(run);
      return acc;
    }, {} as Record<string, PromptRun[]>);
  }

  const successByModel = $derived(groupByModel(runsStore.successfulRuns));
</script>

<div class="model-performance">
  <h3>Model Performance</h3>
  {#each Object.entries(successByModel) as [modelId, runs]}
    <div class="model-stats">
      <h4>{modelId}</h4>
      <p>Runs: {runs.length}</p>
      <p>
        Avg Tokens: {Math.round(
          runs.reduce((sum, r) => sum + (r.totalTokens || 0), 0) / runs.length
        )}
      </p>
      <p>
        Avg Duration: {Math.round(
          runs.reduce((sum, r) => sum + (r.durationMs || 0), 0) / runs.length
        )}ms
      </p>
    </div>
  {/each}
</div>
```

## Run Status Types

```typescript
type RunStatus = 'pending' | 'running' | 'success' | 'error' | 'cancelled';
```

### Status Flow

```
pending → running → success
                 → error
                 → cancelled
```

## PromptRun Type Definition

```typescript
interface PromptRun {
  id: string;
  modelId: string;
  output?: string;
  status: RunStatus;
  totalTokens?: number;
  durationMs?: number;
  cost?: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
}
```

## NeuroForge Integration

The runs store integrates with NeuroForge for execution:

```typescript
import { executePromptSimplified } from '$lib/core/api/neuroforgeClient';

const result = await runsStore.execute(prompt, modelId, contextBlocks);
// Calls: executePromptSimplified({ prompt, model_id, context_blocks })
```

## Analytics Features

### Token Usage Tracking

```typescript
const totalTokens = runsStore.totalTokensUsed;
// Sum of all tokens across all runs
```

### Cost Tracking

```typescript
const totalCost = runsStore.totalCost;
// Sum of all execution costs
```

### Performance Metrics

```typescript
const avgDuration = runsStore.averageDuration;
// Average duration of completed runs
```

## Best Practices

### ✅ Do

- Use `activeRun` to display currently selected output
- Track `isExecuting` for UI state management
- Monitor `totalTokensUsed` and `totalCost` for budgeting
- Use `runsByStatus` to organize run history
- Clear old runs periodically with `clearRuns()`

### ❌ Don't

- Don't mutate runs array directly
- Don't forget to handle execution errors
- Don't call `execute()` while `isExecuting` is true
- Don't assume all runs have `output` (check for undefined)

## Error Handling

```typescript
try {
  await runsStore.execute(prompt, modelId);
} catch (error) {
  // Error is automatically captured in store
  console.error('Execution failed:', runsStore.error);

  // Run is added with 'error' status
  const failedRuns = runsStore.failedRuns;
}
```

## Progress Updates

For long-running executions:

```typescript
// Start execution
runsStore.startExecution();

// Update progress (0-100)
runsStore.updateExecutionProgress(25);
runsStore.updateExecutionProgress(50);
runsStore.updateExecutionProgress(75);

// Complete
runsStore.completeExecution();
```

## Cancellation

```typescript
// User clicks cancel button
runsStore.cancelExecution();

// All pending/running runs are marked as cancelled
// isExecuting is set to false
// executionProgress is reset to 0
```

---

**Last Updated**: 2025-01-26
**Version**: 5.3.0
**Test Coverage**: 58 tests (execution, history, filtering, status)
