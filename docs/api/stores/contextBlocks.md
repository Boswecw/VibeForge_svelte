# Context Blocks Store API

> Manages context blocks with localStorage persistence and token estimation

**File**: [`src/lib/core/stores/contextBlocks.svelte.ts`](../../../src/lib/core/stores/contextBlocks.svelte.ts)
**Test File**: [`src/tests/stores/contextBlocks.test.ts`](../../../src/tests/stores/contextBlocks.test.ts)
**Test Coverage**: 45 tests

## Overview

The `contextBlocksStore` manages context blocks that can be included in prompts, supporting active/inactive states, reordering, and automatic token estimation with localStorage persistence.

## State Interface

```typescript
interface ContextBlocksState {
  blocks: ContextBlock[];
  isLoading: boolean;
  error: string | null;
}
```

## API Reference

### State Getters

| Property | Type | Description |
|----------|------|-------------|
| `contextBlocksStore.blocks` | `ContextBlock[]` | All context blocks |
| `contextBlocksStore.isLoading` | `boolean` | Loading state |
| `contextBlocksStore.error` | `string \| null` | Error message if any |

### Derived State

| Property | Type | Description |
|----------|------|-------------|
| `contextBlocksStore.activeBlocks` | `ContextBlock[]` | Only active blocks |
| `contextBlocksStore.inactiveBlocks` | `ContextBlock[]` | Only inactive blocks |
| `contextBlocksStore.activeBlockIds` | `string[]` | IDs of active blocks |
| `contextBlocksStore.blocksByKind` | `Record<string, ContextBlock[]>` | Blocks grouped by kind |
| `contextBlocksStore.totalActiveTokens` | `number` | Estimated tokens for all active blocks |

### Actions

#### Block Management

```typescript
contextBlocksStore.setBlocks(blocks: ContextBlock[]): void
contextBlocksStore.addBlock(block: ContextBlock): void
contextBlocksStore.updateBlock(id: string, updates: Partial<ContextBlock>): void
contextBlocksStore.removeBlock(id: string): void
contextBlocksStore.getBlockById(id: string): ContextBlock | undefined
```

#### Active State Management

```typescript
contextBlocksStore.toggleActive(id: string): void
contextBlocksStore.setActiveOnly(ids: string[]): void
contextBlocksStore.activateAll(): void
contextBlocksStore.deactivateAll(): void
```

#### Ordering

```typescript
contextBlocksStore.reorderBlock(draggedId: string, targetId: string): void
```

#### Utility

```typescript
contextBlocksStore.setLoading(loading: boolean): void
contextBlocksStore.setError(error: string | null): void
```

## Usage Examples

### Adding Context Blocks

```svelte
<script lang="ts">
  import { contextBlocksStore } from '$lib/core/stores/contextBlocks.svelte';
  import type { ContextBlock } from '$lib/core/types';

  function addNewBlock() {
    const block: ContextBlock = {
      id: crypto.randomUUID(),
      kind: 'text',
      name: 'Example Context',
      content: 'This is example context content',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    contextBlocksStore.addBlock(block);
  }
</script>

<button onclick={addNewBlock}>Add Context Block</button>
```

### Displaying Active Blocks with Token Count

```svelte
<script lang="ts">
  import { contextBlocksStore } from '$lib/core/stores/contextBlocks.svelte';

  const activeBlocks = $derived(contextBlocksStore.activeBlocks);
  const totalTokens = $derived(contextBlocksStore.totalActiveTokens);
</script>

<div class="context-summary">
  <p>Active Blocks: {activeBlocks.length}</p>
  <p>Estimated Tokens: {totalTokens}</p>
</div>

{#each activeBlocks as block}
  <div class="context-block">
    <h3>{block.name}</h3>
    <p>{block.content.substring(0, 100)}...</p>
    <span>{Math.floor(block.content.length / 4)} tokens</span>
  </div>
{/each}
```

### Toggling Block Active State

```svelte
<script lang="ts">
  import { contextBlocksStore } from '$lib/core/stores/contextBlocks.svelte';
</script>

{#each contextBlocksStore.blocks as block}
  <label>
    <input
      type="checkbox"
      checked={block.isActive}
      onchange={() => contextBlocksStore.toggleActive(block.id)}
    />
    {block.name} ({Math.floor(block.content.length / 4)} tokens)
  </label>
{/each}
```

### Reordering Blocks

```typescript
import { contextBlocksStore } from '$lib/core/stores/contextBlocks.svelte';

// Drag and drop handler
function handleDrop(draggedId: string, targetId: string) {
  contextBlocksStore.reorderBlock(draggedId, targetId);
}
```

### Filtering by Kind

```svelte
<script lang="ts">
  import { contextBlocksStore } from '$lib/core/stores/contextBlocks.svelte';

  const blocksByKind = $derived(contextBlocksStore.blocksByKind);
</script>

{#each Object.entries(blocksByKind) as [kind, blocks]}
  <section>
    <h2>{kind} Blocks ({blocks.length})</h2>
    {#each blocks as block}
      <div>{block.name}</div>
    {/each}
  </section>
{/each}
```

### Bulk Operations

```typescript
import { contextBlocksStore } from '$lib/core/stores/contextBlocks.svelte';

// Activate all blocks
contextBlocksStore.activateAll();

// Deactivate all blocks
contextBlocksStore.deactivateAll();

// Activate only specific blocks
contextBlocksStore.setActiveOnly(['block-1', 'block-3', 'block-5']);
```

## Persistence

### LocalStorage Keys

```typescript
const STORAGE_KEY = "vibeforge:context-blocks";  // Full block data
const ORDER_KEY = "vibeforge:context-order";      // Block order
```

### Auto-Save

All mutation operations automatically persist to localStorage:
- `addBlock()` - Saves after adding
- `updateBlock()` - Saves after updating
- `removeBlock()` - Saves after removing
- `toggleActive()` - Saves after toggling
- `reorderBlock()` - Saves after reordering

### Initialization

Blocks are automatically loaded from localStorage on store initialization:
```typescript
const state = $state<ContextBlocksState>({
  blocks: loadFromStorage(),  // Loads on init
  // ...
});
```

## Token Estimation

Context blocks use a simple token estimation algorithm:
```typescript
// Rough estimation: 1 token ≈ 4 characters
const estimatedTokens = Math.floor(content.length / 4);
```

**Note**: This is an approximation. Actual token counts may vary based on the specific tokenizer used by each LLM provider.

## Best Practices

### ✅ Do

- Use `activeBlocks` to get only active blocks for prompt inclusion
- Use `totalActiveTokens` to track context window usage
- Reorder blocks to control context priority
- Toggle individual blocks for quick experimentation
- Use block kinds for categorization

### ❌ Don't

- Don't mutate block objects directly - use `updateBlock()`
- Don't assume blocks array order - it's user-controlled via reordering
- Don't bypass store methods to access localStorage directly
- Don't forget that token estimation is approximate

## Integration Example

Complete example of context block management in a component:

```svelte
<script lang="ts">
  import { contextBlocksStore } from '$lib/core/stores/contextBlocks.svelte';
  import type { ContextBlock } from '$lib/core/types';

  let newBlockName = $state('');
  let newBlockContent = $state('');

  function createBlock() {
    if (!newBlockName || !newBlockContent) return;

    const block: ContextBlock = {
      id: crypto.randomUUID(),
      kind: 'text',
      name: newBlockName,
      content: newBlockContent,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    contextBlocksStore.addBlock(block);

    // Reset form
    newBlockName = '';
    newBlockContent = '';
  }

  function deleteBlock(id: string) {
    if (confirm('Delete this context block?')) {
      contextBlocksStore.removeBlock(id);
    }
  }
</script>

<div class="context-manager">
  <div class="summary">
    <p>Total Blocks: {contextBlocksStore.blocks.length}</p>
    <p>Active: {contextBlocksStore.activeBlocks.length}</p>
    <p>Estimated Tokens: {contextBlocksStore.totalActiveTokens}</p>
  </div>

  <form onsubmit|preventDefault={createBlock}>
    <input bind:value={newBlockName} placeholder="Block name" />
    <textarea bind:value={newBlockContent} placeholder="Content" />
    <button type="submit">Add Block</button>
  </form>

  <div class="blocks-list">
    {#each contextBlocksStore.blocks as block}
      <div class="block-card" class:active={block.isActive}>
        <h3>{block.name}</h3>
        <p>{block.content.substring(0, 150)}...</p>
        <div class="block-actions">
          <label>
            <input
              type="checkbox"
              checked={block.isActive}
              onchange={() => contextBlocksStore.toggleActive(block.id)}
            />
            Active
          </label>
          <span>{Math.floor(block.content.length / 4)} tokens</span>
          <button onclick={() => deleteBlock(block.id)}>Delete</button>
        </div>
      </div>
    {/each}
  </div>
</div>
```

---

**Last Updated**: 2025-01-26
**Version**: 5.3.0
**Test Coverage**: 45 tests (blocks, active state, reordering, tokens)
