/**
 * VibeForge V2 - Theme Store
 *
 * Manages application theme using Svelte 5 runes with localStorage persistence.
 */

import { browser } from '$app/environment';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'vibeforge-theme';
const DEFAULT_THEME: Theme = 'dark';

// ============================================================================
// THEME STATE
// ============================================================================

// Initialize from localStorage if available
const initialTheme = browser
  ? (localStorage.getItem(STORAGE_KEY) as Theme) || DEFAULT_THEME
  : DEFAULT_THEME;

const state = $state<{ current: Theme }>({
  current: initialTheme,
});

// Apply theme to document root on initialization
if (browser) {
  document.documentElement.setAttribute('data-theme', state.current);
}

// ============================================================================
// DERIVED STATE
// ============================================================================

const isDark = $derived(state.current === 'dark');
const isLight = $derived(state.current === 'light');

// ============================================================================
// ACTIONS
// ============================================================================

function toggle() {
  const newTheme: Theme = state.current === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

function setTheme(theme: Theme) {
  state.current = theme;

  if (browser) {
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const themeStore = {
  // State
  get current() {
    return state.current;
  },
  // Derived
  get isDark() {
    return isDark;
  },
  get isLight() {
    return isLight;
  },
  // Actions
  toggle,
  setTheme,
};
