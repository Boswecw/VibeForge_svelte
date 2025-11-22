/**
 * VibeForge V2 - Workspace Store
 *
 * Manages the current workspace state using Svelte 5 runes.
 * Note: .svelte.ts extension is required for Svelte 5 runes to work in TS files.
 */

import type { Workspace } from '$lib/core/types';

// ============================================================================
// WORKSPACE STATE
// ============================================================================

interface WorkspaceState {
  current: Workspace | null;
  isLoading: boolean;
  error: string | null;
}

// Create workspace store state
const state = $state<WorkspaceState>({
  current: null,
  isLoading: false,
  error: null,
});

// ============================================================================
// DERIVED STATE
// ============================================================================

const workspaceId = $derived(state.current?.id);
const theme = $derived(state.current?.settings.theme ?? 'dark');
const autoSave = $derived(state.current?.settings.autoSave ?? true);

// ============================================================================
// ACTIONS
// ============================================================================

function setWorkspace(workspace: Workspace) {
  state.current = workspace;
  state.error = null;
}

function setLoading(loading: boolean) {
  state.isLoading = loading;
}

function setError(error: string | null) {
  state.error = error;
}

function updateSettings(settings: Partial<Workspace['settings']>) {
  if (state.current) {
    state.current.settings = {
      ...state.current.settings,
      ...settings,
    };
  }
}

function clearWorkspace() {
  state.current = null;
  state.error = null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const workspaceStore = {
  // State
  get current() {
    return state.current;
  },
  get isLoading() {
    return state.isLoading;
  },
  get error() {
    return state.error;
  },
  // Derived
  get workspaceId() {
    return workspaceId;
  },
  get theme() {
    return theme;
  },
  get autoSave() {
    return autoSave;
  },
  // Actions
  setWorkspace,
  setLoading,
  setError,
  updateSettings,
  clearWorkspace,
};
