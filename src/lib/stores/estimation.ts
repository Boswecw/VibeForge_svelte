/**
 * VibeForge - Cost Estimation Store
 *
 * Svelte store for managing token counts and cost estimates.
 */

import { writable, derived } from "svelte/store";
import type {
  EstimateResponse,
  ModelPricing,
} from "$lib/core/api/estimationClient";
import { estimationClient } from "$lib/core/api";

// ============================================================================
// Types
// ============================================================================

interface EstimationState {
  // Current estimate
  currentEstimate: EstimateResponse | null;

  // Model pricing data
  modelPricing: ModelPricing[];

  // Loading state
  isEstimating: boolean;
  isPricingLoaded: boolean;

  // Error state
  error: string | null;
}

const initialState: EstimationState = {
  currentEstimate: null,
  modelPricing: [],
  isEstimating: false,
  isPricingLoaded: false,
  error: null,
};

// ============================================================================
// Store
// ============================================================================

function createEstimationStore() {
  const { subscribe, set, update } = writable<EstimationState>(initialState);

  // Debounce timer for live estimation
  let estimateTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    subscribe,

    /**
     * Load model pricing data
     */
    async loadPricing() {
      const result = await estimationClient.estimationClient.getPricing();

      if (result.error) {
        update((state) => ({ ...state, error: result.error || null }));
        return;
      }

      if (result.data) {
        update((state) => ({
          ...state,
          modelPricing: result.data!,
          isPricingLoaded: true,
          error: null,
        }));
      }
    },

    /**
     * Estimate cost for a prompt
     */
    async estimate(
      prompt: string,
      models: string[],
      estimatedCompletionLength: number = 500
    ) {
      if (!prompt || models.length === 0) {
        update((state) => ({ ...state, currentEstimate: null }));
        return;
      }

      update((state) => ({ ...state, isEstimating: true, error: null }));

      const result = await estimationClient.estimationClient.estimate({
        prompt,
        models,
        estimatedCompletionLength,
      });

      if (result.error) {
        update((state) => ({
          ...state,
          isEstimating: false,
          error: result.error || null,
        }));
        return;
      }

      if (result.data) {
        update((state) => ({
          ...state,
          currentEstimate: result.data!,
          isEstimating: false,
          error: null,
        }));
      }
    },

    /**
     * Schedule debounced estimation (for live updates as user types)
     */
    scheduleEstimate(
      prompt: string,
      models: string[],
      estimatedCompletionLength: number = 500,
      debounceMs: number = 500
    ) {
      // Clear existing timer
      if (estimateTimer) {
        clearTimeout(estimateTimer);
      }

      // Schedule new estimation
      estimateTimer = setTimeout(() => {
        this.estimate(prompt, models, estimatedCompletionLength);
      }, debounceMs);
    },

    /**
     * Cancel pending estimation
     */
    cancelEstimate() {
      if (estimateTimer) {
        clearTimeout(estimateTimer);
        estimateTimer = null;
      }
    },

    /**
     * Get pricing for a specific model
     */
    getModelPricing(model: string): ModelPricing | null {
      const state = initialState;
      return state.modelPricing.find((p) => p.model === model) || null;
    },

    /**
     * Clear error
     */
    clearError() {
      update((state) => ({ ...state, error: null }));
    },

    /**
     * Reset store
     */
    reset() {
      if (estimateTimer) {
        clearTimeout(estimateTimer);
        estimateTimer = null;
      }
      set(initialState);
    },
  };
}

export const estimationStore = createEstimationStore();

// ============================================================================
// Derived Stores
// ============================================================================

/**
 * Get current total cost estimate
 */
export const totalCost = derived(
  estimationStore,
  ($store) => $store.currentEstimate?.totalEstimatedCostUsd || 0
);

/**
 * Get total token count
 */
export const totalTokens = derived(
  estimationStore,
  ($store) => $store.currentEstimate?.totalInputLength || 0
);

/**
 * Check if pricing is loaded
 */
export const isPricingReady = derived(
  estimationStore,
  ($store) => $store.isPricingLoaded
);
