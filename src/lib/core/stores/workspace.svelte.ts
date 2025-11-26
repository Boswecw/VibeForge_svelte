/**
 * VibeForge V2 - Workspace Store
 *
 * Manages the current workspace state using Svelte 5 runes.
 * Note: .svelte.ts extension is required for Svelte 5 runes to work in TS files.
 */

import type { Workspace } from '$lib/core/types';
import * as dataforgeClient from '$lib/core/api/dataforgeClient';

// ============================================================================
// WORKSPACE STATE
// ============================================================================

interface WorkspaceState {
  workspaces: Workspace[];
  current: Workspace | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

// Create workspace store state
const state = $state<WorkspaceState>({
  workspaces: [],
  current: null,
  isLoading: false,
  isSaving: false,
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

// CRUD operations (Refactoring Plan Compatible)
async function load() {
  state.isLoading = true;
  state.error = null;

  try {
    state.workspaces = await dataforgeClient.listWorkspaces();
  } catch (err) {
    state.error = err instanceof Error ? err.message : 'Failed to load workspaces';
  } finally {
    state.isLoading = false;
  }
}

async function create(data: dataforgeClient.CreateWorkspaceRequest) {
  state.isSaving = true;
  state.error = null;

  try {
    const workspace = await dataforgeClient.createWorkspace(data);
    state.workspaces = [workspace, ...state.workspaces];
    state.current = workspace;
    return workspace;
  } catch (err) {
    state.error = err instanceof Error ? err.message : 'Failed to create workspace';
    throw err;
  } finally {
    state.isSaving = false;
  }
}

async function update(id: string, data: Partial<dataforgeClient.CreateWorkspaceRequest>) {
  state.isSaving = true;
  state.error = null;

  try {
    const workspace = await dataforgeClient.updateWorkspace(id, data);
    state.workspaces = state.workspaces.map(w => w.id === id ? workspace : w);
    if (state.current?.id === id) {
      state.current = workspace;
    }
    return workspace;
  } catch (err) {
    state.error = err instanceof Error ? err.message : 'Failed to update workspace';
    throw err;
  } finally {
    state.isSaving = false;
  }
}

async function remove(id: string) {
  state.isSaving = true;
  state.error = null;

  try {
    await dataforgeClient.deleteWorkspace(id);
    state.workspaces = state.workspaces.filter(w => w.id !== id);
    if (state.current?.id === id) {
      state.current = null;
    }
  } catch (err) {
    state.error = err instanceof Error ? err.message : 'Failed to delete workspace';
    throw err;
  } finally {
    state.isSaving = false;
  }
}

function clearError() {
  state.error = null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const workspaceStore = {
  // State
  get workspaces() {
    return state.workspaces;
  },
  get current() {
    return state.current;
  },
  get isLoading() {
    return state.isLoading;
  },
  get isSaving() {
    return state.isSaving;
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
  clearError,
  // CRUD
  load,
  create,
  update,
  remove,
};
