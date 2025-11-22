/**
 * NeuroForge Integration Store
 *
 * Manages state and loading for NeuroForge resources:
 * - Available models
 * - Current run execution
 * - Multi-model comparisons
 */

import { writable, derived, type Writable, type Readable } from "svelte/store";
import type { NeuroForgeModel, ModelResponse } from "$lib/types/neuroforge";

// ============================================================================
// State Types
// ============================================================================

export interface NeuroForgeState {
  models: NeuroForgeModel[];
  selectedModels: string[];
  isLoadingModels: boolean;
  isExecuting: boolean;
  currentRunId: string | null;
  responses: ModelResponse[];
  error: string | null;
  lastUpdated: string | null;
}

// ============================================================================
// Store Factory
// ============================================================================

function createNeuroForgeStore() {
  const initialState: NeuroForgeState = {
    models: [],
    selectedModels: [],
    isLoadingModels: false,
    isExecuting: false,
    currentRunId: null,
    responses: [],
    error: null,
    lastUpdated: null,
  };

  const state: Writable<NeuroForgeState> = writable(initialState);

  return {
    subscribe: state.subscribe,

    // ========================================================================
    // Model Management
    // ========================================================================

    setModels(models: NeuroForgeModel[]): void {
      state.update((s) => ({
        ...s,
        models,
        lastUpdated: new Date().toISOString(),
      }));
    },

    setLoadingModels(loading: boolean): void {
      state.update((s) => ({
        ...s,
        isLoadingModels: loading,
      }));
    },

    selectModels(modelIds: string[]): void {
      state.update((s) => ({
        ...s,
        selectedModels: modelIds,
      }));
    },

    toggleModelSelection(modelId: string): void {
      state.update((s) => {
        const selected = s.selectedModels.includes(modelId)
          ? s.selectedModels.filter((id) => id !== modelId)
          : [...s.selectedModels, modelId];
        return {
          ...s,
          selectedModels: selected,
        };
      });
    },

    // ========================================================================
    // Execution Management
    // ========================================================================

    setExecuting(executing: boolean): void {
      state.update((s) => ({
        ...s,
        isExecuting: executing,
      }));
    },

    setCurrentRunId(runId: string | null): void {
      state.update((s) => ({
        ...s,
        currentRunId: runId,
      }));
    },

    setResponses(responses: ModelResponse[]): void {
      state.update((s) => ({
        ...s,
        responses,
        lastUpdated: new Date().toISOString(),
      }));
    },

    clearResponses(): void {
      state.update((s) => ({
        ...s,
        responses: [],
        currentRunId: null,
      }));
    },

    // ========================================================================
    // Error Management
    // ========================================================================

    setError(error: string | null): void {
      state.update((s) => ({
        ...s,
        error,
      }));
    },

    // ========================================================================
    // Reset
    // ========================================================================

    reset(): void {
      state.set(initialState);
    },
  };
}

export const neuroforgeStore = createNeuroForgeStore();

// ============================================================================
// Derived Stores
// ============================================================================

/**
 * Readable store: Whether NeuroForge is actively loading or executing
 */
export const neuroforgeLoading: Readable<boolean> = derived(
  neuroforgeStore,
  ($state) => $state.isLoadingModels || $state.isExecuting
);

/**
 * Readable store: Whether there are any errors
 */
export const neuroforgeHasError: Readable<boolean> = derived(
  neuroforgeStore,
  ($state) => $state.error !== null
);

/**
 * Readable store: Number of available models
 */
export const modelCount: Readable<number> = derived(
  neuroforgeStore,
  ($state) => $state.models.length
);

/**
 * Readable store: Number of selected models
 */
export const selectedModelCount: Readable<number> = derived(
  neuroforgeStore,
  ($state) => $state.selectedModels.length
);

/**
 * Readable store: Number of responses
 */
export const responseCount: Readable<number> = derived(
  neuroforgeStore,
  ($state) => $state.responses.length
);

/**
 * Readable store: Total tokens used across all responses
 */
export const totalTokensUsed: Readable<number> = derived(
  neuroforgeStore,
  ($state) => {
    return $state.responses.reduce((total, resp) => {
      return total + (resp.usage?.total_tokens || 0);
    }, 0);
  }
);

/**
 * Readable store: Maximum latency across responses
 */
export const maxLatency: Readable<number> = derived(
  neuroforgeStore,
  ($state) => {
    if ($state.responses.length === 0) return 0;
    return Math.max(...$state.responses.map((r) => r.latency_ms || 0));
  }
);
