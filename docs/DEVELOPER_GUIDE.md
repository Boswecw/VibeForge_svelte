# VibeForge Developer Guide

> Complete guide for developers contributing to VibeForge

**Version**: 5.3.0
**Last Updated**: 2025-01-26

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [Technology Stack](#technology-stack)
6. [Development Workflow](#development-workflow)
7. [Architecture Patterns](#architecture-patterns)
8. [Testing](#testing)
9. [Code Style](#code-style)
10. [Common Tasks](#common-tasks)
11. [Troubleshooting](#troubleshooting)
12. [Contributing](#contributing)

---

## Introduction

Welcome to VibeForge development! This guide will help you understand the codebase, set up your environment, and contribute effectively.

### What is VibeForge?

VibeForge is an AI-powered project automation platform built with:
- **Svelte 5** - Modern reactive framework with runes
- **SvelteKit 2.x** - Full-stack meta-framework
- **TypeScript 5.9** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **Vitest** - Fast unit testing
- **Playwright** - E2E testing

---

## Prerequisites

### Required Software

- **Node.js**: v20.x or later
- **pnpm**: v9.x or later (preferred package manager)
- **Git**: Latest version
- **Code Editor**: VS Code recommended

### Recommended VS Code Extensions

```
- Svelte for VS Code (svelte.svelte-vscode)
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
```

### System Requirements

- **OS**: macOS, Linux, or Windows (WSL2 recommended)
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 2GB free space

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/Forge.git
cd Forge/vibeforge
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs all dependencies defined in `package.json`.

### 3. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`.

### 4. Verify Setup

1. Open `http://localhost:5173` in your browser
2. You should see the VibeForge workbench
3. Check that stores are initialized (open browser console)
4. Verify no TypeScript errors: `pnpm check`

---

## Project Structure

```
vibeforge/
├── src/
│   ├── lib/
│   │   ├── core/           # Core business logic
│   │   │   ├── api/        # API clients
│   │   │   ├── stores/     # Svelte 5 stores
│   │   │   ├── types/      # TypeScript types
│   │   │   └── utils/      # Utility functions
│   │   ├── ui/             # UI components
│   │   │   ├── primitives/ # Base components (Button, Input)
│   │   │   └── layout/     # Layout components (TopBar, Nav)
│   │   └── workbench/      # Workbench-specific components
│   │       ├── context/    # Context column
│   │       ├── prompt/     # Prompt column
│   │       └── output/     # Output column
│   ├── routes/             # SvelteKit routes
│   │   ├── +layout.svelte  # Root layout
│   │   ├── +page.svelte    # Workbench page
│   │   └── [...]/          # Other routes
│   ├── tests/              # Unit tests
│   │   └── stores/         # Store tests
│   ├── app.html            # HTML template
│   └── app.css             # Global styles
├── tests/                  # E2E tests
│   └── e2e/
│       └── *.spec.ts       # Playwright tests
├── static/                 # Static assets
├── docs/                   # Documentation
│   ├── api/                # API reference
│   ├── guides/             # Guides
│   └── *.md                # Various docs
├── vite.config.ts          # Vite configuration
├── svelte.config.js        # Svelte configuration
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
├── vitest.config.ts        # Vitest configuration
├── playwright.config.ts    # Playwright configuration
└── package.json            # Project metadata
```

### Key Directories

#### `src/lib/core/`

Core business logic and state management:

- **`api/`**: Client wrappers for backend APIs
  - `vibeforgeClient.ts` - Main VibeForge API
  - `neuroforgeClient.ts` - Model router API
  - `dataforgeClient.ts` - Knowledge base API
  - `mcpClient.ts` - MCP protocol client

- **`stores/`**: Svelte 5 rune-based stores (`.svelte.ts` extension)
  - `theme.svelte.ts` - Theme management
  - `workspace.svelte.ts` - Workspace state
  - `contextBlocks.svelte.ts` - Context blocks
  - `prompt.svelte.ts` - Prompt state
  - `models.svelte.ts` - Model management
  - `runs.svelte.ts` - Execution runs
  - `tools.svelte.ts` - MCP tools

- **`types/`**: TypeScript type definitions
  - `domain.ts` - Business domain types
  - `mcp.ts` - MCP protocol types
  - `index.ts` - Type exports

#### `src/lib/ui/`

Reusable UI components:

- **`primitives/`**: Base components
  - `Button.svelte`, `Input.svelte`, `Panel.svelte`, etc.

- **`layout/`**: Layout components
  - `TopBar.svelte`, `LeftRailNav.svelte`, `StatusBar.svelte`

#### `src/lib/workbench/`

Workbench-specific components organized by column:

- `context/` - Context management UI
- `prompt/` - Prompt editor UI
- `output/` - Output display UI

---

## Technology Stack

### Frontend Framework

**Svelte 5** with runes (`$state`, `$derived`, `$effect`)

```svelte
<script lang="ts">
  // State
  let count = $state(0);

  // Derived
  const doubled = $derived(count * 2);

  // Effect
  $effect(() => {
    console.log(`Count is now ${count}`);
  });
</script>

<button onclick={() => count++}>
  Count: {count} (doubled: {doubled})
</button>
```

### Meta-Framework

**SvelteKit 2.x** for:
- File-based routing
- Server-side rendering
- Build optimization
- Environment variables

### Styling

**Tailwind CSS v4** with custom Forge theme:

```html
<div class="bg-forge-blacksteel text-forge-steel">
  <button class="bg-forge-ember hover:bg-forge-ember/80">
    Click me
  </button>
</div>
```

### Testing

- **Vitest**: Unit tests (321 tests, 7 stores)
- **Playwright**: E2E tests (5 scenarios)
- **@testing-library/svelte**: Component testing utilities

### Build Tools

- **Vite 7.x**: Lightning-fast build tool
- **TypeScript 5.9**: Type checking
- **ESLint**: Code linting
- **Prettier**: Code formatting

---

## Development Workflow

### Daily Development

1. **Start dev server**:
   ```bash
   pnpm dev
   ```

2. **Make changes** in `src/`

3. **Hot reload** updates automatically

4. **Check types**:
   ```bash
   pnpm check
   ```

5. **Run tests**:
   ```bash
   pnpm test
   ```

### Git Workflow

1. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make commits**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

   **Commit Message Format**:
   ```
   type(scope): subject

   body (optional)

   footer (optional)
   ```

   **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

3. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   # Create pull request on GitHub
   ```

### Code Review

All changes require code review:

1. Submit PR with clear description
2. Address review comments
3. Ensure tests pass
4. Get approval from maintainer
5. Merge to main branch

---

## Architecture Patterns

### Store Pattern (Svelte 5 Runes)

All stores use this consistent pattern:

```typescript
// 1. State
const state = $state<StoreState>({
  items: [],
  isLoading: false,
  error: null,
});

// 2. Derived state
const activeItems = $derived(state.items.filter(i => i.isActive));

// 3. Actions
function addItem(item: Item) {
  state.items = [...state.items, item];
}

// 4. Exports
export const myStore = {
  // State getters
  get items() { return state.items; },

  // Derived getters
  get activeItems() { return activeItems; },

  // Actions
  addItem,
};
```

**Key Rules**:
- Use `.svelte.ts` extension for rune-based stores
- Never mutate state directly - create new references
- Export getters, not raw state
- Group related functionality

### Component Pattern (Svelte 5)

Components use `$props` rune:

```svelte
<script lang="ts">
  interface Props {
    title: string;
    count?: number;
    onClick?: () => void;
  }

  let { title, count = 0, onClick }: Props = $props();
</script>

<div>
  <h3>{title}</h3>
  <p>Count: {count}</p>
  {#if onClick}
    <button onclick={onClick}>Click me</button>
  {/if}
</div>
```

**Key Rules**:
- Define `Props` interface
- Use `$props()` rune
- Provide default values for optional props
- Type event handlers properly

### API Client Pattern

All API clients follow this pattern:

```typescript
export async function fetchData(id: string): Promise<Data> {
  try {
    const response = await fetch(`${BASE_URL}/data/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}
```

**Key Rules**:
- Always type parameters and return values
- Handle errors with try/catch
- Throw errors (stores handle them)
- Log errors for debugging

---

## Testing

### Unit Tests (Vitest)

**Location**: `src/tests/stores/*.test.ts`

**Run tests**:
```bash
pnpm test                  # Run all
pnpm test:coverage        # With coverage
pnpm test:ui              # Interactive UI
```

**Example test**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { themeStore } from '$lib/core/stores/theme.svelte';

describe('Theme Store', () => {
  beforeEach(() => {
    // Reset state if needed
  });

  it('should toggle theme', () => {
    const initial = themeStore.current;
    themeStore.toggle();
    expect(themeStore.current).not.toBe(initial);
  });

  it('should set theme explicitly', () => {
    themeStore.setTheme('dark');
    expect(themeStore.current).toBe('dark');
  });
});
```

### E2E Tests (Playwright)

**Location**: `tests/e2e/*.spec.ts`

**Run tests**:
```bash
pnpm test:e2e             # Run all E2E tests
pnpm test:e2e:ui          # Playwright UI mode
pnpm test:e2e:debug       # Debug mode
```

**Example test**:
```typescript
import { test, expect } from '@playwright/test';

test('workbench loads correctly', async ({ page }) => {
  await page.goto('/');

  // Verify three columns exist
  await expect(page.locator('text=Context')).toBeVisible();
  await expect(page.locator('text=Prompt')).toBeVisible();
  await expect(page.locator('text=Output')).toBeVisible();
});
```

### Writing Tests

**Unit Test Guidelines**:
- Test each store method independently
- Use descriptive test names
- Mock external dependencies
- Test edge cases
- Aim for 100% coverage

**E2E Test Guidelines**:
- Test complete user workflows
- Use data-testid for selectors
- Wait for elements properly
- Test happy path and error cases
- Keep tests independent

---

## Code Style

### TypeScript

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): User | null {
  // Implementation
}

// ❌ Bad
function getUser(id: any): any {
  // Implementation
}
```

### Svelte Components

```svelte
<!-- ✅ Good -->
<script lang="ts">
  interface Props {
    title: string;
  }

  let { title }: Props = $props();
</script>

<h1>{title}</h1>

<!-- ❌ Bad -->
<script>
  export let title;
</script>

<h1>{title}</h1>
```

### Naming Conventions

- **Files**: `camelCase.ts`, `PascalCase.svelte`
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

### Formatting

Run Prettier before committing:
```bash
pnpm format
```

Run ESLint:
```bash
pnpm lint
```

---

## Common Tasks

### Adding a New Store

1. Create file: `src/lib/core/stores/myStore.svelte.ts`
2. Follow store pattern (see Architecture)
3. Export from `src/lib/core/stores/index.ts`
4. Create test: `src/tests/stores/myStore.test.ts`
5. Document in `docs/api/stores/myStore.md`

### Adding a New Component

1. Determine location:
   - Primitive: `src/lib/ui/primitives/`
   - Layout: `src/lib/ui/layout/`
   - Workbench: `src/lib/workbench/{column}/`

2. Create `MyComponent.svelte`:
   ```svelte
   <script lang="ts">
     interface Props {
       // Props here
     }

     let { /* props */ }: Props = $props();
   </script>

   <!-- Template -->
   ```

3. Export from `index.ts` in that directory

4. Use in parent component:
   ```svelte
   <script>
     import { MyComponent } from '$lib/ui/primitives';
   </script>

   <MyComponent />
   ```

### Adding a New Route

1. Create directory: `src/routes/my-route/`
2. Add `+page.svelte`:
   ```svelte
   <script lang="ts">
     // Page logic
   </script>

   <h1>My New Page</h1>
   ```

3. Optional: Add `+page.ts` for load function
4. Access at `/my-route`

### Updating Types

1. Edit `src/lib/core/types/domain.ts` or `mcp.ts`
2. Export from `src/lib/core/types/index.ts`
3. Run type check: `pnpm check`
4. Update documentation if public API

---

## Troubleshooting

### TypeScript Errors

**Problem**: "Cannot find module '$lib/...'

**Solution**:
```bash
# Restart TypeScript server in VS Code
# Or regenerate SvelteKit types
pnpm dev
```

### Build Errors

**Problem**: Build fails with cryptic error

**Solution**:
```bash
# Clear cache and rebuild
rm -rf .svelte-kit node_modules
pnpm install
pnpm build
```

### Test Failures

**Problem**: Tests fail locally but pass in CI

**Solution**:
- Check Node.js version matches CI
- Clear test cache: `pnpm test --clearCache`
- Run in CI mode: `CI=true pnpm test`

### Hot Reload Not Working

**Problem**: Changes don't reflect in browser

**Solution**:
- Check terminal for errors
- Restart dev server: `Ctrl+C`, then `pnpm dev`
- Clear browser cache
- Check file watchers limit (Linux)

---

## Contributing

### Before You Start

1. **Check Issues**: Look for existing issues or discussions
2. **Discuss Big Changes**: Open an issue for major features
3. **Follow Style**: Match existing code style
4. **Write Tests**: All code needs tests
5. **Document Changes**: Update relevant documentation

### Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] All tests pass (`pnpm test` and `pnpm test:e2e`)
- [ ] TypeScript check passes (`pnpm check`)
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] PR description is clear and complete

### Code Review Process

1. Maintainers review within 2-3 business days
2. Address feedback with new commits
3. Once approved, squash and merge
4. Delete feature branch after merge

---

## Additional Resources

- [API Reference](./api/README.md)
- [User Guide](./USER_GUIDE.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Phase 2 Completion Certificate](../PHASE2_COMPLETE.md)
- [Phase 3 Completion Certificate](../PHASE3_COMPLETE.md)
- [Svelte 5 Documentation](https://svelte.dev/docs/svelte/overview)
- [SvelteKit Documentation](https://svelte.dev/docs/kit/introduction)

---

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions or share ideas
- **Documentation**: Check guides and API reference
- **Code Comments**: Inline documentation in source files

---

**Happy Coding! 🚀**

---

**© 2025 Boswell Digital Solutions LLC**
**All Rights Reserved**
