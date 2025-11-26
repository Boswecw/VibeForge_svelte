# Theme Store API

> Manages application theme (dark/light) with localStorage persistence

**File**: [`src/lib/core/stores/theme.svelte.ts`](../../../src/lib/core/stores/theme.svelte.ts)
**Test File**: [`src/tests/stores/theme.test.ts`](../../../src/tests/stores/theme.test.ts)
**Test Coverage**: 15 tests

## Overview

The `themeStore` manages the application's visual theme, supporting dark and light modes with automatic persistence to localStorage. The theme is applied to the document root element for CSS theming.

## Type Definitions

```typescript
export type Theme = 'dark' | 'light';
```

## State Interface

```typescript
interface ThemeState {
  current: Theme;
}
```

## API Reference

### State Getters

#### `themeStore.current`
```typescript
get current(): Theme
```

Returns the current theme value ('dark' or 'light').

**Returns**: `Theme` - Current theme

**Example**:
```typescript
import { themeStore } from '$lib/core/stores/theme.svelte';

console.log(themeStore.current); // 'dark' or 'light'
```

---

### Derived State

#### `themeStore.isDark`
```typescript
get isDark(): boolean
```

Returns `true` if the current theme is dark mode.

**Returns**: `boolean` - True if dark mode is active

**Example**:
```svelte
<script lang="ts">
  import { themeStore } from '$lib/core/stores/theme.svelte';

  const isDark = $derived(themeStore.isDark);
</script>

{#if isDark}
  <p>Dark mode is enabled</p>
{/if}
```

#### `themeStore.isLight`
```typescript
get isLight(): boolean
```

Returns `true` if the current theme is light mode.

**Returns**: `boolean` - True if light mode is active

**Example**:
```typescript
if (themeStore.isLight) {
  console.log('Light mode is active');
}
```

---

### Actions

#### `themeStore.toggle()`
```typescript
toggle(): void
```

Toggles between dark and light themes.

**Returns**: `void`

**Side Effects**:
- Updates `data-theme` attribute on `document.documentElement`
- Persists new theme to `localStorage['vibeforge-theme']`

**Example**:
```svelte
<button onclick={() => themeStore.toggle()}>
  Toggle Theme
</button>
```

#### `themeStore.setTheme(theme)`
```typescript
setTheme(theme: Theme): void
```

Sets the theme to a specific value.

**Parameters**:
- `theme` (Theme): The theme to set ('dark' or 'light')

**Returns**: `void`

**Side Effects**:
- Updates `data-theme` attribute on `document.documentElement`
- Persists new theme to `localStorage['vibeforge-theme']`

**Example**:
```typescript
import { themeStore } from '$lib/core/stores/theme.svelte';

// Set to dark mode
themeStore.setTheme('dark');

// Set to light mode
themeStore.setTheme('light');
```

---

## Usage Examples

### Basic Theme Toggle Button

```svelte
<script lang="ts">
  import { themeStore } from '$lib/core/stores/theme.svelte';
</script>

<button onclick={() => themeStore.toggle()}>
  {themeStore.current === 'dark' ? '🌙' : '☀️'}
  {themeStore.current}
</button>
```

### Theme-Aware Component

```svelte
<script lang="ts">
  import { themeStore } from '$lib/core/stores/theme.svelte';

  const bgClass = $derived(
    themeStore.isDark ? 'bg-gray-900' : 'bg-gray-100'
  );
</script>

<div class={bgClass}>
  <p>This background adapts to the theme</p>
</div>
```

### Setting Theme on User Preference

```typescript
import { themeStore } from '$lib/core/stores/theme.svelte';

function applyUserPreference(userTheme: Theme) {
  themeStore.setTheme(userTheme);
}

// Example: Set based on user profile
applyUserPreference('light');
```

### Reactive Theme Display

```svelte
<script lang="ts">
  import { themeStore } from '$lib/core/stores/theme.svelte';
</script>

<div class="theme-indicator">
  <span>Current Theme: {themeStore.current}</span>
  <span>Dark Mode: {themeStore.isDark ? 'Yes' : 'No'}</span>
  <span>Light Mode: {themeStore.isLight ? 'Yes' : 'No'}</span>
</div>
```

---

## Persistence

### LocalStorage Key

The theme is persisted to localStorage with the key:
```typescript
const STORAGE_KEY = 'vibeforge-theme';
```

### Default Theme

If no theme is found in localStorage, the default theme is:
```typescript
const DEFAULT_THEME: Theme = 'dark';
```

### Browser Detection

The store uses `$app/environment` to detect browser context:
```typescript
import { browser } from '$app/environment';

if (browser) {
  // Safe to use localStorage and DOM APIs
}
```

---

## Implementation Details

### Document Root Theming

The theme is applied to the document root element:
```typescript
document.documentElement.setAttribute('data-theme', theme);
```

This allows CSS to respond to theme changes:
```css
[data-theme='dark'] {
  --bg-color: #1a1a1a;
  --text-color: #ffffff;
}

[data-theme='light'] {
  --bg-color: #ffffff;
  --text-color: #000000;
}
```

### Initialization

The store initializes on module load:
1. Checks if running in browser context
2. Loads theme from localStorage (or uses default)
3. Applies theme to document root
4. Creates reactive state with `$state`

---

## Testing

The theme store has 15 comprehensive tests covering:

### Test Coverage

- **Initialization**: Default theme, localStorage persistence
- **Theme Toggling**: Dark ↔ Light transitions
- **setTheme**: Explicit theme setting
- **Derived State**: `isDark` and `isLight` getters
- **Persistence**: localStorage read/write
- **Browser Detection**: SSR safety

### Running Tests

```bash
# Run theme store tests only
pnpm test theme

# Run all store tests
pnpm test stores

# Run with coverage
pnpm test:coverage
```

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { themeStore } from '$lib/core/stores/theme.svelte';

describe('Theme Store', () => {
  it('should toggle theme correctly', () => {
    const initial = themeStore.current;
    themeStore.toggle();
    expect(themeStore.current).not.toBe(initial);
  });
});
```

---

## Integration with Components

### TopBar Component

The TopBar component uses the theme store for the theme toggle button:

**File**: [`src/lib/ui/layout/TopBar.svelte`](../../../src/lib/ui/layout/TopBar.svelte)

```svelte
<button onclick={() => themeStore.toggle()}>
  {themeStore.isDark ? '🌙' : '☀️'}
</button>
```

### CSS Theming

VibeForge uses Tailwind CSS v4 with custom theme tokens:

**File**: [`src/app.css`](../../../src/app.css)

```css
@layer base {
  :root {
    --forge-blacksteel: #1a1a1a;
    --forge-gunmetal: #2d3748;
    --forge-ember: #ff6b35;
    /* ... more tokens ... */
  }

  [data-theme='light'] {
    --forge-blacksteel: #f7fafc;
    --forge-gunmetal: #e2e8f0;
    /* ... light mode overrides ... */
  }
}
```

---

## Best Practices

### ✅ Do

- Use `themeStore.toggle()` for theme toggle buttons
- Use `themeStore.isDark` and `themeStore.isLight` for conditional rendering
- Let the store handle persistence automatically
- Use derived state in components for reactivity

### ❌ Don't

- Don't manually set localStorage for theme
- Don't directly manipulate `data-theme` attribute
- Don't assume browser context (always check with `browser` from `$app/environment`)
- Don't mutate internal state directly

---

## Troubleshooting

### Theme Not Persisting

**Problem**: Theme resets on page reload
**Solution**: Check browser localStorage permissions and console for errors

### Theme Not Applying

**Problem**: CSS not responding to theme changes
**Solution**: Ensure CSS uses `[data-theme]` attribute selectors

### SSR Errors

**Problem**: `localStorage is not defined` errors
**Solution**: The store handles this automatically with `browser` checks

### Theme Flashing

**Problem**: Brief flash of wrong theme on load
**Solution**: This is handled by initializing theme in store before component render

---

## Related Documentation

- [API Reference Index](../README.md)
- [Architecture Guide](../../guides/ARCHITECTURE.md)
- [User Guide](../../guides/USER_GUIDE_LLM_FEATURES.md)
- [Theme Store Tests](../../../src/tests/stores/theme.test.ts)

---

**Last Updated**: 2025-01-26
**Version**: 5.3.0
**Test Coverage**: 15 tests (initialization, toggle, persistence)
