/**
 * DataForge Integration Store
 *
 * Manages state and loading for DataForge resources:
 * - Context libraries
 * - Semantic search results
 * - Run history
 */

import { writable, derived, type Writable, type Readable } from "svelte/store";
import type {
  DataForgeContext,
  DataForgeContextSearchResult,
} from "$lib/types/dataforge";

// ============================================================================
// State Types
// ============================================================================

export interface DataForgeState {
  contexts: DataForgeContext[];
  searchResults: DataForgeContextSearchResult[];
  history: any[];
  isLoadingContexts: boolean;
  isSearching: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// ============================================================================
// Store Factory
// ============================================================================

function createDataForgeStore() {
  const initialState: DataForgeState = {
    contexts: [],
    searchResults: [],
    history: [],
    isLoadingContexts: false,
    isSearching: false,
    isLoadingHistory: false,
    error: null,
    lastUpdated: null,
  };

  const state: Writable<DataForgeState> = writable(initialState);

  return {
    subscribe: state.subscribe,

    // ========================================================================
    // Context Management
    // ========================================================================

    setContexts(contexts: DataForgeContext[]): void {
      state.update((s) => ({
        ...s,
        contexts,
        lastUpdated: new Date().toISOString(),
      }));
    },

    setLoadingContexts(loading: boolean): void {
      state.update((s) => ({
        ...s,
        isLoadingContexts: loading,
      }));
    },

    // ========================================================================
    // Search Management
    // ========================================================================

    setSearchResults(results: DataForgeContextSearchResult[]): void {
      state.update((s) => ({
        ...s,
        searchResults: results,
        lastUpdated: new Date().toISOString(),
      }));
    },

    setSearching(searching: boolean): void {
      state.update((s) => ({
        ...s,
        isSearching: searching,
      }));
    },

    clearSearchResults(): void {
      state.update((s) => ({
        ...s,
        searchResults: [],
      }));
    },

    // ========================================================================
    // History Management
    // ========================================================================

    setHistory(history: any[]): void {
      state.update((s) => ({
        ...s,
        history,
        lastUpdated: new Date().toISOString(),
      }));
    },

    setLoadingHistory(loading: boolean): void {
      state.update((s) => ({
        ...s,
        isLoadingHistory: loading,
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

export const dataforgeStore = createDataForgeStore();

// ============================================================================
// Derived Stores
// ============================================================================

/**
 * Readable store: Whether DataForge is actively loading
 */
export const dataforgeLoading: Readable<boolean> = derived(
  dataforgeStore,
  ($state) =>
    $state.isLoadingContexts || $state.isSearching || $state.isLoadingHistory
);

/**
 * Readable store: Whether there are any errors
 */
export const dataforgeHasError: Readable<boolean> = derived(
  dataforgeStore,
  ($state) => $state.error !== null
);

/**
 * Readable store: Number of available contexts
 */
export const contextCount: Readable<number> = derived(
  dataforgeStore,
  ($state) => $state.contexts.length
);

/**
 * Readable store: Number of search results
 */
export const searchResultCount: Readable<number> = derived(
  dataforgeStore,
  ($state) => $state.searchResults.length
);
