# Workspace Store API

> Manages workspace state and settings with DataForge API integration

**File**: [`src/lib/core/stores/workspace.svelte.ts`](../../../src/lib/core/stores/workspace.svelte.ts)
**Test File**: [`src/tests/stores/workspace.test.ts`](../../../src/tests/stores/workspace.test.ts)
**Test Coverage**: 41 tests

## Overview

The `workspaceStore` manages workspace state, providing CRUD operations integrated with the DataForge API for workspace management and persistence.

## State Interface

```typescript
interface WorkspaceState {
  workspaces: Workspace[];
  current: Workspace | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}
```

## API Reference

### State Getters

| Property | Type | Description |
|----------|------|-------------|
| `workspaceStore.workspaces` | `Workspace[]` | All available workspaces |
| `workspaceStore.current` | `Workspace \| null` | Currently active workspace |
| `workspaceStore.isLoading` | `boolean` | Loading state for async operations |
| `workspaceStore.isSaving` | `boolean` | Saving state for CUD operations |
| `workspaceStore.error` | `string \| null` | Error message if any |

### Derived State

| Property | Type | Description |
|----------|------|-------------|
| `workspaceStore.workspaceId` | `string \| undefined` | ID of current workspace |
| `workspaceStore.theme` | `Theme` | Theme setting from current workspace (default: 'dark') |
| `workspaceStore.autoSave` | `boolean` | Auto-save setting from current workspace (default: true) |

### Actions

#### State Management

```typescript
workspaceStore.setWorkspace(workspace: Workspace): void
workspaceStore.clearWorkspace(): void
workspaceStore.updateSettings(settings: Partial<Workspace['settings']>): void
workspaceStore.setLoading(loading: boolean): void
workspaceStore.setError(error: string | null): void
workspaceStore.clearError(): void
```

#### CRUD Operations

```typescript
// Load all workspaces from DataForge
workspaceStore.load(): Promise<void>

// Create new workspace
workspaceStore.create(data: CreateWorkspaceRequest): Promise<Workspace>

// Update existing workspace
workspaceStore.update(id: string, data: Partial<CreateWorkspaceRequest>): Promise<Workspace>

// Delete workspace
workspaceStore.remove(id: string): Promise<void>
```

## Usage Examples

### Loading Workspaces

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { workspaceStore } from '$lib/core/stores/workspace.svelte';

  onMount(async () => {
    await workspaceStore.load();
  });
</script>

{#if workspaceStore.isLoading}
  <p>Loading workspaces...</p>
{:else if workspaceStore.error}
  <p class="error">{workspaceStore.error}</p>
{:else}
  <select>
    {#each workspaceStore.workspaces as workspace}
      <option value={workspace.id}>{workspace.name}</option>
    {/each}
  </select>
{/if}
```

### Creating a Workspace

```typescript
import { workspaceStore } from '$lib/core/stores/workspace.svelte';

async function createNewWorkspace() {
  try {
    const workspace = await workspaceStore.create({
      name: 'My New Workspace',
      description: 'A workspace for testing',
    });
    console.log('Created:', workspace);
  } catch (error) {
    console.error('Failed to create workspace:', error);
  }
}
```

### Updating Workspace Settings

```typescript
// Update just the theme setting
workspaceStore.updateSettings({ theme: 'light' });

// Update multiple settings
workspaceStore.updateSettings({
  theme: 'dark',
  autoSave: false,
});
```

### Switching Workspaces

```svelte
<script lang="ts">
  import { workspaceStore } from '$lib/core/stores/workspace.svelte';

  function switchWorkspace(workspace: Workspace) {
    workspaceStore.setWorkspace(workspace);
  }
</script>

{#each workspaceStore.workspaces as workspace}
  <button onclick={() => switchWorkspace(workspace)}>
    {workspace.name}
    {#if workspace.id === workspaceStore.current?.id}✓{/if}
  </button>
{/each}
```

## DataForge API Integration

The workspace store integrates with these DataForge API endpoints:

```typescript
import * as dataforgeClient from '$lib/core/api/dataforgeClient';

// List all workspaces
dataforgeClient.listWorkspaces(): Promise<Workspace[]>

// Create workspace
dataforgeClient.createWorkspace(data: CreateWorkspaceRequest): Promise<Workspace>

// Update workspace
dataforgeClient.updateWorkspace(id: string, data: Partial<CreateWorkspaceRequest>): Promise<Workspace>

// Delete workspace
dataforgeClient.deleteWorkspace(id: string): Promise<void>
```

## Error Handling

The store provides comprehensive error handling:

```typescript
try {
  await workspaceStore.create({ name: 'Test' });
} catch (error) {
  // Error is automatically set in store
  console.error(workspaceStore.error);

  // Clear error when ready
  workspaceStore.clearError();
}
```

## Best Practices

### ✅ Do

- Load workspaces on app initialization
- Use `isLoading` and `isSaving` for UI feedback
- Clear errors after displaying to user
- Update settings in bulk when possible

### ❌ Don't

- Don't mutate workspace objects directly
- Don't assume current workspace is set (check for null)
- Don't forget error handling for async operations
- Don't bypass store methods to call API directly

---

**Last Updated**: 2025-01-26
**Version**: 5.3.0
**Test Coverage**: 41 tests (CRUD, API integration, selection, settings)
