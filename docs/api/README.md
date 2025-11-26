# VibeForge API Reference

> Comprehensive documentation for VibeForge's Svelte 5 rune-based store architecture

## Overview

VibeForge uses a modern state management approach with **Svelte 5 runes** (`$state`, `$derived`, `$effect`) to provide reactive, type-safe state management across the application. All stores follow consistent patterns and use the `.svelte.ts` extension for TypeScript files that utilize runes.

## Architecture Principles

### Svelte 5 Runes Pattern

All stores in VibeForge follow these architectural principles:

1. **State Management**: Use `$state` rune for reactive state
2. **Derived Values**: Use `$derived` rune for computed properties
3. **Side Effects**: Use `$effect` rune for reactive side effects
4. **Immutability**: State updates create new references for reactivity
5. **Persistence**: LocalStorage integration where appropriate
6. **Type Safety**: Full TypeScript support with strict typing

### Store Structure

Each store exports an object with:
- **Getters**: Computed properties that return current state values
- **Actions**: Methods that modify state
- **Derived State**: Computed values based on state

```typescript
export const exampleStore = {
  // State getters
  get current() { return state.current; },

  // Derived state getters
  get computed() { return derived; },

  // Actions
  action() { /* modify state */ },
};
```

## Core Stores

VibeForge includes 7 core stores that manage all application state:

### 1. [Theme Store](./stores/theme.md)
**File**: `src/lib/core/stores/theme.svelte.ts`
**Purpose**: Manages dark/light theme with localStorage persistence
**Key Features**: Theme toggling, persistence, document attribute management

### 2. [Workspace Store](./stores/workspace.md)
**File**: `src/lib/core/stores/workspace.svelte.ts`
**Purpose**: Manages workspace state and settings
**Key Features**: CRUD operations, DataForge API integration, workspace selection

### 3. [Context Blocks Store](./stores/contextBlocks.md)
**File**: `src/lib/core/stores/contextBlocks.svelte.ts`
**Purpose**: Manages context blocks for prompts
**Key Features**: Block management, active/inactive state, token estimation, reordering

### 4. [Prompt Store](./stores/prompt.md)
**File**: `src/lib/core/stores/prompt.svelte.ts`
**Purpose**: Manages prompt text, variables, and templates
**Key Features**: Variable substitution, template loading, token estimation

### 5. [Models Store](./stores/models.md)
**File**: `src/lib/core/stores/models.svelte.ts`
**Purpose**: Manages available LLM models and selection
**Key Features**: Model routing, provider filtering, cost estimation, NeuroForge integration

### 6. [Runs Store](./stores/runs.md)
**File**: `src/lib/core/stores/runs.svelte.ts`
**Purpose**: Manages prompt execution runs and history
**Key Features**: Run execution, history tracking, filtering, status management

### 7. [Tools Store](./stores/tools.md)
**File**: `src/lib/core/stores/tools.svelte.ts`
**Purpose**: Manages MCP servers and tools
**Key Features**: MCP server management, tool discovery, invocation tracking

## Quick Start

### Installation

All stores are automatically available in SvelteKit components:

```typescript
import { themeStore } from '$lib/core/stores/theme.svelte';
import { workspaceStore } from '$lib/core/stores/workspace.svelte';
import { contextBlocksStore } from '$lib/core/stores/contextBlocks.svelte';
import { promptStore } from '$lib/core/stores/prompt.svelte';
import { modelsStore } from '$lib/core/stores/models.svelte';
import { runsStore } from '$lib/core/stores/runs.svelte';
import { toolsStore } from '$lib/core/stores/tools.svelte';
```

### Basic Usage Pattern

```svelte
<script lang="ts">
  import { themeStore } from '$lib/core/stores/theme.svelte';

  // Access state - automatically reactive
  const isDark = $derived(themeStore.isDark);

  // Call actions
  function handleToggle() {
    themeStore.toggle();
  }
</script>

<button onclick={handleToggle}>
  Current theme: {themeStore.current}
</button>
```

## Store Testing

All stores have comprehensive test coverage (321 tests total):

- [Theme Store Tests](../../src/tests/stores/theme.test.ts) - 15 tests
- [Workspace Store Tests](../../src/tests/stores/workspace.test.ts) - 41 tests
- [Context Blocks Store Tests](../../src/tests/stores/contextBlocks.test.ts) - 45 tests
- [Prompt Store Tests](../../src/tests/stores/prompt.test.ts) - 54 tests
- [Models Store Tests](../../src/tests/stores/models.test.ts) - 51 tests
- [Runs Store Tests](../../src/tests/stores/runs.test.ts) - 58 tests
- [Tools Store Tests](../../src/tests/stores/tools.test.ts) - 57 tests

Run tests with:
```bash
pnpm test                  # All unit tests
pnpm test:coverage        # With coverage report
pnpm test stores          # Store tests only
```

## Type Definitions

All core types are defined in:
- [Domain Types](../../src/lib/core/types/domain.ts) - Core business entities
- [MCP Types](../../src/lib/core/types/mcp.ts) - MCP protocol types
- [Store Types](../../src/lib/core/types/index.ts) - Type exports

## Performance Considerations

### Reactivity

Svelte 5 runes provide fine-grained reactivity:
- Only components using specific state values re-render
- Derived values automatically update when dependencies change
- No manual subscription management needed

### Persistence

Stores with localStorage persistence (theme, contextBlocks, prompt):
- Save on every state change
- Load on initialization
- Handle browser/SSR gracefully with `$app/environment`

### API Integration

Stores that integrate with backend APIs:
- Use try/catch for error handling
- Provide loading states
- Return promises for async operations

## Migration Guide

### From Svelte 4 Stores

If migrating from Svelte 4 `writable` stores:

**Before (Svelte 4)**:
```typescript
import { writable } from 'svelte/store';

const theme = writable('dark');

// Usage
$theme
theme.set('light')
theme.update(t => t === 'dark' ? 'light' : 'dark')
```

**After (Svelte 5)**:
```typescript
const state = $state({ current: 'dark' });

export const themeStore = {
  get current() { return state.current; },
  setTheme(theme) { state.current = theme; },
  toggle() { state.current = state.current === 'dark' ? 'light' : 'dark'; }
};

// Usage
themeStore.current
themeStore.setTheme('light')
themeStore.toggle()
```

## Best Practices

### 1. Never Mutate State Directly

```typescript
// ❌ Bad - direct mutation
state.blocks[0].isActive = true;

// ✅ Good - create new reference
state.blocks = state.blocks.map(b =>
  b.id === id ? { ...b, isActive: true } : b
);
```

### 2. Use Derived State for Computations

```typescript
// ❌ Bad - manual computation
function getActiveBlocks() {
  return state.blocks.filter(b => b.isActive);
}

// ✅ Good - derived state
const activeBlocks = $derived(state.blocks.filter(b => b.isActive));
```

### 3. Handle Browser vs SSR

```typescript
import { browser } from '$app/environment';

// Always check before using browser APIs
if (browser) {
  localStorage.setItem(key, value);
}
```

### 4. Type Your State

```typescript
interface StoreState {
  items: Item[];
  isLoading: boolean;
  error: string | null;
}

const state = $state<StoreState>({ /* ... */ });
```

## Troubleshooting

### Common Issues

**Issue**: Store updates not triggering reactivity
**Solution**: Ensure you're creating new object/array references, not mutating

**Issue**: localStorage not persisting
**Solution**: Check `browser` condition before accessing localStorage

**Issue**: TypeScript errors with runes
**Solution**: Ensure file has `.svelte.ts` extension

**Issue**: Circular dependency errors
**Solution**: Import only what you need, avoid circular store dependencies

## Additional Resources

- [Svelte 5 Runes Documentation](https://svelte.dev/docs/svelte/runes)
- [SvelteKit Documentation](https://svelte.dev/docs/kit/introduction)
- [VibeForge Architecture Guide](../ARCHITECTURE.md)
- [Phase 2 Completion Certificate](../../PHASE2_COMPLETE.md)
- [Phase 3 Completion Certificate](../../PHASE3_COMPLETE.md)

## Contributing

When adding new stores:

1. Follow the established pattern (state, derived, actions)
2. Use `.svelte.ts` extension for rune-based stores
3. Add comprehensive TypeScript types
4. Include JSDoc comments for public APIs
5. Write unit tests (use existing tests as templates)
6. Update this documentation

---

**Last Updated**: 2025-01-26
**Version**: 5.3.0
**Test Coverage**: 321 tests across 7 stores
