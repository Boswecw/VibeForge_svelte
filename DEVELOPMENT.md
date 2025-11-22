# VibeForge Development Guide

Development workflows, patterns, and contribution guidelines for VibeForge.

---

## Table of Contents

1. [Development Setup](#development-setup)
2. [Development Commands](#development-commands)
3. [Code Style Guidelines](#code-style-guidelines)
4. [Component Patterns](#component-patterns)
5. [Store Architecture](#store-architecture)
6. [Testing Guidelines](#testing-guidelines)
7. [Git Workflow](#git-workflow)
8. [Pull Request Process](#pull-request-process)

---

## Development Setup

See [SETUP.md](./SETUP.md) for initial installation instructions.

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/vibeforge.git
cd vibeforge

# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Open browser to http://localhost:5173
```

---

## Development Commands

### Core Commands

```bash
# Start development server (with hot reload)
pnpm dev

# Type checking (one-time)
pnpm check

# Type checking (watch mode)
pnpm check:watch

# Build for production
pnpm build

# Preview production build
pnpm preview

# Format code (if Prettier is configured)
pnpm format

# Lint code (if ESLint is configured)
pnpm lint
```

### Useful Development Workflows

```bash
# Watch mode for type checking while developing
pnpm check:watch

# Build and preview production bundle
pnpm build && pnpm preview

# Clean build artifacts
rm -rf .svelte-kit build
```

---

## Code Style Guidelines

### TypeScript

✅ **Always use TypeScript**

- All `.svelte` files should have `<script lang="ts">`
- Define interfaces for all data structures
- Avoid `any` type - use `unknown` if type is truly unknown

✅ **Type all component props**

```svelte
<script lang="ts">
  import type { ContextBlock } from '$lib/types/context';

  let {
    context,
    onSelect
  }: {
    context: ContextBlock;
    onSelect: (id: string) => void;
  } = $props();
</script>
```

✅ **Use type imports**

```typescript
import type { ContextBlock } from "$lib/types/context";
```

### Svelte 5 Runes

✅ **Use modern Svelte 5 runes**

```svelte
<script lang="ts">
  // State
  let count = $state(0);

  // Derived values
  let doubled = $derived(count * 2);

  // Props
  let { title, description } = $props();

  // Effects (use sparingly)
  $effect(() => {
    console.log('Count changed:', count);
  });
</script>
```

❌ **Don't use old Svelte patterns**

```svelte
<!-- Don't use $: for reactivity -->
$: doubled = count * 2;

<!-- Don't use export let for props -->
export let title: string;
```

### Component Patterns

✅ **Use callback props instead of event dispatchers**

```svelte
<script lang="ts">
  let { onSave }: { onSave: () => void } = $props();
</script>
<button on:click={onSave}>Save</button>
```

❌ **Don't use event dispatchers**

```svelte
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>
<button on:click={() => dispatch('save')}>Save</button>
```

### Naming Conventions

- **Components:** PascalCase (e.g., `ContextColumn.svelte`)
- **Stores:** camelCase with "Store" suffix (e.g., `themeStore.ts`)
- **Types:** PascalCase (e.g., `ContextBlock`, `RunHistory`)
- **Functions:** camelCase (e.g., `handleSubmit`, `updateContext`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)

### File Organization

```
src/lib/
├── components/
│   ├── ContextColumn.svelte       # Main components
│   ├── research/                  # Feature-specific components
│   │   └── ResearchAssistDrawer.svelte
│   └── context/                   # Domain-specific components
│       ├── ContextList.svelte
│       └── ContextDetailPanel.svelte
│
├── stores/
│   ├── themeStore.ts              # One store per file
│   └── contextStore.ts
│
└── types/
    ├── context.ts                 # Domain-specific types
    └── run.ts
```

---

## Component Patterns

### Component Structure

```svelte
<script lang="ts">
  // 1. Imports
  import { theme } from '$lib/stores/themeStore';
  import type { ContextBlock } from '$lib/types/context';

  // 2. Props
  let {
    context,
    onSelect
  }: {
    context: ContextBlock;
    onSelect: (id: string) => void;
  } = $props();

  // 3. State
  let isExpanded = $state(false);

  // 4. Derived values
  let tagCount = $derived(context.tags.length);

  // 5. Functions
  function handleClick() {
    isExpanded = !isExpanded;
    onSelect(context.id);
  }

  // 6. Effects (if needed)
  $effect(() => {
    console.log('Context changed:', context.id);
  });
</script>

<!-- 7. Template -->
<div class="context-block">
  <h3>{context.title}</h3>
  <p>{context.summary}</p>
  <button on:click={handleClick}>
    {isExpanded ? 'Collapse' : 'Expand'}
  </button>
</div>

<!-- 8. Styles (if needed) -->
<style>
  .context-block {
    padding: 1rem;
    border: 1px solid var(--border-color);
  }
</style>
```

### Theme Support

All components should support dark/light themes:

```svelte
<script lang="ts">
  import { theme } from '$lib/stores/themeStore';
</script>

<div class={`component ${
  $theme === 'dark'
    ? 'bg-slate-900 text-slate-100 border-slate-700'
    : 'bg-white text-slate-900 border-slate-200'
}`}>
  Content
</div>
```

---

## Store Architecture

### Store Pattern

```typescript
import { writable, derived } from "svelte/store";

// Define types
interface ThemeState {
  theme: "dark" | "light";
}

// Create writable store
const themeState = writable<ThemeState>({ theme: "dark" });

// Export readonly store
export const theme = { subscribe: themeState.subscribe };

// Export mutation functions
export function setTheme(newTheme: "dark" | "light") {
  themeState.update((state) => ({ ...state, theme: newTheme }));
}

export function toggleTheme() {
  themeState.update((state) => ({
    ...state,
    theme: state.theme === "dark" ? "light" : "dark",
  }));
}

// Derived stores
export const isDark = derived(themeState, ($state) => $state.theme === "dark");
```

### Store Persistence

```typescript
import { writable } from "svelte/store";

// Load from localStorage
const stored = localStorage.getItem("theme");
const initialTheme = stored ? JSON.parse(stored) : "dark";

const themeState = writable<Theme>(initialTheme);

// Save to localStorage on change
themeState.subscribe((value) => {
  localStorage.setItem("theme", JSON.stringify(value));
});
```

---

## Testing Guidelines

See [TESTING.md](./TESTING.md) for comprehensive testing procedures.

### Manual Testing Checklist

Before submitting a PR, manually test:

- [ ] Component renders correctly in dark mode
- [ ] Component renders correctly in light mode
- [ ] All interactive elements work (buttons, inputs, etc.)
- [ ] No console errors or warnings
- [ ] TypeScript compilation passes (`pnpm check`)
- [ ] Responsive design works on mobile/tablet/desktop

### Type Checking

```bash
# Run type checking
pnpm check

# Watch mode for continuous checking
pnpm check:watch
```

---

## Git Workflow

### Branch Naming

- **Feature branches:** `feature/feature-name`
- **Bug fixes:** `fix/bug-description`
- **Documentation:** `docs/doc-description`
- **Refactoring:** `refactor/refactor-description`

### Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(contexts): add document ingestion modal

- Add UploadIngestModal component
- Integrate with Context Library page
- Support drag-drop file upload

Closes #123
```

```
fix(theme): fix theme toggle not persisting

- Save theme to localStorage on change
- Load theme from localStorage on mount

Fixes #456
```

### Commit Best Practices

- Keep commits atomic (one logical change per commit)
- Write clear, descriptive commit messages
- Reference issue numbers in commit messages
- Squash commits before merging (if needed)

---

## Pull Request Process

### Before Creating a PR

1. **Update from main**

   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main
   ```

2. **Run type checking**

   ```bash
   pnpm check
   ```

3. **Test manually**

   - Test all changed functionality
   - Test in both dark and light modes
   - Test responsive design

4. **Review your changes**
   ```bash
   git diff main
   ```

### Creating a PR

1. **Push your branch**

   ```bash
   git push origin your-branch
   ```

2. **Open PR on GitHub**

   - Use a clear, descriptive title
   - Fill out the PR template
   - Link related issues
   - Add screenshots/videos if UI changes

3. **PR Template**

   ```markdown
   ## Description

   Brief description of changes

   ## Type of Change

   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation update
   - [ ] Refactoring

   ## Testing

   - [ ] Type checking passes
   - [ ] Manual testing completed
   - [ ] Dark/light mode tested
   - [ ] Responsive design tested

   ## Screenshots

   (if applicable)

   ## Related Issues

   Closes #123
   ```

### PR Review Process

1. **Code review** - At least one approval required
2. **Type checking** - Must pass `pnpm check`
3. **Manual testing** - Reviewer tests changes
4. **Merge** - Squash and merge to main

---

## Common Development Tasks

### Adding a New Page

1. **Create page file**

   ```bash
   mkdir -p src/routes/new-page
   touch src/routes/new-page/+page.svelte
   ```

2. **Add page content**

   ```svelte
   <script lang="ts">
     import { theme } from '$lib/stores/themeStore';
   </script>

   <div class={$theme === 'dark' ? 'bg-slate-900' : 'bg-white'}>
     <h1>New Page</h1>
   </div>
   ```

3. **Add navigation link**
   - Edit `src/lib/components/ForgeSideNav.svelte`
   - Add link to new page

### Adding a New Component

1. **Create component file**

   ```bash
   touch src/lib/components/NewComponent.svelte
   ```

2. **Define component**

   ```svelte
   <script lang="ts">
     import type { ComponentProps } from '$lib/types';

     let { prop1, prop2 }: ComponentProps = $props();
   </script>

   <div>
     <!-- Component template -->
   </div>
   ```

3. **Use component**

   ```svelte
   <script lang="ts">
     import NewComponent from '$lib/components/NewComponent.svelte';
   </script>

   <NewComponent prop1="value" prop2={123} />
   ```

### Adding a New Store

1. **Create store file**

   ```bash
   touch src/lib/stores/newStore.ts
   ```

2. **Define store**

   ```typescript
   import { writable } from "svelte/store";

   interface NewState {
     data: string[];
   }

   const newState = writable<NewState>({ data: [] });

   export const newStore = { subscribe: newState.subscribe };

   export function addData(item: string) {
     newState.update((state) => ({
       ...state,
       data: [...state.data, item],
     }));
   }
   ```

3. **Use store**

   ```svelte
   <script lang="ts">
     import { newStore, addData } from '$lib/stores/newStore';
   </script>

   <div>
     {#each $newStore.data as item}
       <p>{item}</p>
     {/each}
   </div>
   ```

### Adding a New Type

1. **Create type file**

   ```bash
   touch src/lib/types/newType.ts
   ```

2. **Define types**

   ```typescript
   export interface NewType {
     id: string;
     name: string;
     createdAt: string;
   }

   export type NewStatus = "pending" | "active" | "completed";
   ```

3. **Use types**

   ```svelte
   <script lang="ts">
     import type { NewType } from '$lib/types/newType';

     let item: NewType = {
       id: '1',
       name: 'Example',
       createdAt: new Date().toISOString()
     };
   </script>
   ```

---

## Troubleshooting

### Common Issues

#### TypeScript errors after adding new files

**Solution:** Restart the dev server

```bash
# Stop server (Ctrl+C)
pnpm dev
```

#### Tailwind styles not applying

**Solution:** Check class names and restart dev server

```bash
# Verify Tailwind config
cat tailwind.config.cjs.bak

# Restart dev server
pnpm dev
```

#### Store not updating

**Solution:** Ensure you're using mutation functions, not direct assignment

```typescript
// ❌ Don't do this
$contextStore.push(newContext);

// ✅ Do this
addContext(newContext);
```

---

**For more information, see:**

- [README.md](./README.md) - Project overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [FEATURES.md](./FEATURES.md) - Feature documentation
- [TESTING.md](./TESTING.md) - Testing procedures
