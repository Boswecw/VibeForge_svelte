/**
 * VibeForge User Preferences Store
 *
 * Manages user preferences for power user features.
 */

import { browser } from '$app/environment';

// ============================================================================
// TYPES
// ============================================================================

interface UserPreferences {
  // Wizard behavior
  skipWizard: boolean;
  showWizardOnFirstVisit: boolean;
  rememberLastStack: boolean;

  // Workbench behavior
  autoSavePrompts: boolean;
  confirmBeforeClose: boolean;

  // UI preferences
  sidebarWidth: number;
  outputPanelWidth: number;
  fontSize: number;

  // Keyboard shortcuts (customizable)
  shortcuts: Record<string, string>;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const STORAGE_KEY = 'vibeforge:user-preferences';

const defaultPreferences: UserPreferences = {
  skipWizard: false,
  showWizardOnFirstVisit: true,
  rememberLastStack: true,
  autoSavePrompts: true,
  confirmBeforeClose: true,
  sidebarWidth: 288,
  outputPanelWidth: 384,
  fontSize: 14,
  shortcuts: {
    newProject: 'mod+n',
    openProject: 'mod+o',
    commandPalette: 'mod+k',
    runPrompt: 'mod+enter',
    savePrompt: 'mod+s',
    closeProject: 'mod+w',
  },
};

// ============================================================================
// PERSISTENCE
// ============================================================================

function loadPreferences(): UserPreferences {
  if (!browser) return defaultPreferences;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

function savePreferences(prefs: UserPreferences): void {
  if (!browser) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

// ============================================================================
// STATE
// ============================================================================

const state = $state<UserPreferences>(loadPreferences());

// ============================================================================
// ACTIONS
// ============================================================================

function update<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
  state[key] = value;
  savePreferences(state);
}

function updateShortcut(action: string, shortcut: string): void {
  state.shortcuts[action] = shortcut;
  savePreferences(state);
}

function reset(): void {
  Object.assign(state, defaultPreferences);
  savePreferences(state);
}

function resetShortcuts(): void {
  state.shortcuts = { ...defaultPreferences.shortcuts };
  savePreferences(state);
}

// ============================================================================
// EXPORTS
// ============================================================================

export const userPreferencesStore = {
  // Wizard preferences
  get skipWizard() { return state.skipWizard; },
  get showWizardOnFirstVisit() { return state.showWizardOnFirstVisit; },
  get rememberLastStack() { return state.rememberLastStack; },

  // Workbench preferences
  get autoSavePrompts() { return state.autoSavePrompts; },
  get confirmBeforeClose() { return state.confirmBeforeClose; },

  // UI preferences
  get sidebarWidth() { return state.sidebarWidth; },
  get outputPanelWidth() { return state.outputPanelWidth; },
  get fontSize() { return state.fontSize; },

  // Shortcuts
  get shortcuts() { return state.shortcuts; },

  // All preferences (for settings UI)
  get all() { return state; },

  // Actions
  update,
  updateShortcut,
  reset,
  resetShortcuts,
};
