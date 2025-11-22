/**
 * VibeForge V2 - Models Store
 *
 * Manages available models and model selection using Svelte 5 runes.
 */

import type { Model } from '$lib/core/types';

// ============================================================================
// MODELS STATE
// ============================================================================

interface ModelsState {
  models: Model[];
  selectedIds: string[];
  isLoading: boolean;
  error: string | null;
}

const state = $state<ModelsState>({
  models: [],
  selectedIds: [],
  isLoading: false,
  error: null,
});

// ============================================================================
// DERIVED STATE
// ============================================================================

const selectedModels = $derived(
  state.models.filter((m) => state.selectedIds.includes(m.id))
);

const availableModels = $derived(state.models.filter((m) => !state.selectedIds.includes(m.id)));

const modelsByProvider = $derived(
  state.models.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<string, Model[]>
  )
);

const hasSelection = $derived(state.selectedIds.length > 0);

const selectedCount = $derived(state.selectedIds.length);

// Calculate estimated total cost for a given token count
const estimatedCost = (inputTokens: number, outputTokens: number) => {
  return selectedModels.reduce((total, model) => {
    if (!model.costPer1kTokens) return total;
    const totalTokens = inputTokens + outputTokens;
    return total + (totalTokens / 1000) * model.costPer1kTokens;
  }, 0);
};

// ============================================================================
// ACTIONS
// ============================================================================

function setModels(models: Model[]) {
  state.models = models;
  state.error = null;
}

function selectModel(id: string) {
  if (!state.selectedIds.includes(id)) {
    state.selectedIds = [...state.selectedIds, id];
  }
}

function deselectModel(id: string) {
  state.selectedIds = state.selectedIds.filter((selectedId) => selectedId !== id);
}

function toggleModel(id: string) {
  if (state.selectedIds.includes(id)) {
    deselectModel(id);
  } else {
    selectModel(id);
  }
}

function setSelectedIds(ids: string[]) {
  state.selectedIds = ids;
}

function clearSelection() {
  state.selectedIds = [];
}

function selectOnly(id: string) {
  state.selectedIds = [id];
}

function selectAll() {
  state.selectedIds = state.models.map((m) => m.id);
}

function getModelById(id: string): Model | undefined {
  return state.models.find((model) => model.id === id);
}

function setLoading(loading: boolean) {
  state.isLoading = loading;
}

function setError(error: string | null) {
  state.error = error;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const modelsStore = {
  // State
  get models() {
    return state.models;
  },
  get selectedIds() {
    return state.selectedIds;
  },
  get isLoading() {
    return state.isLoading;
  },
  get error() {
    return state.error;
  },
  // Derived
  get selectedModels() {
    return selectedModels;
  },
  get availableModels() {
    return availableModels;
  },
  get modelsByProvider() {
    return modelsByProvider;
  },
  get hasSelection() {
    return hasSelection;
  },
  get selectedCount() {
    return selectedCount;
  },
  estimatedCost,
  // Actions
  setModels,
  selectModel,
  deselectModel,
  toggleModel,
  setSelectedIds,
  clearSelection,
  selectOnly,
  selectAll,
  getModelById,
  setLoading,
  setError,
};
