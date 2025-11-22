/**
 * Research Store
 *
 * Svelte store for managing research state across the application.
 * Handles query execution, results caching, and UI state.
 */

import { writable, derived } from "svelte/store";
import type {
  ResearchQuery,
  ResearchAnswer,
  ResearchStatus,
} from "$lib/types/research";
import { queryResearch } from "$lib/api/research";

// ============================================================================
// State Definition
// ============================================================================

interface ResearchStoreState {
  currentQuery: ResearchQuery | null;
  currentAnswer: ResearchAnswer | null;
  isExecuting: boolean;
  error: string | null;
  history: Array<{
    query: ResearchQuery;
    answer: ResearchAnswer;
    timestamp: string;
  }>;
}

// ============================================================================
// Store Creation
// ============================================================================

function createResearchStore() {
  const initialState: ResearchStoreState = {
    currentQuery: null,
    currentAnswer: null,
    isExecuting: false,
    error: null,
    history: [],
  };

  const { subscribe, set, update } = writable(initialState);

  // ========================================================================
  // Actions
  // ========================================================================

  async function executeQuery(
    query: ResearchQuery
  ): Promise<ResearchAnswer | null> {
    update((state) => ({
      ...state,
      currentQuery: query,
      isExecuting: true,
      error: null,
    }));

    try {
      const answer = await queryResearch(query);

      update((state) => ({
        ...state,
        currentAnswer: answer,
        isExecuting: false,
        history: [
          {
            query,
            answer,
            timestamp: new Date().toISOString(),
          },
          ...state.history,
        ],
      }));

      return answer;
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "error" in err
          ? (err as { error: string }).error
          : "Unknown error";

      update((state) => ({
        ...state,
        isExecuting: false,
        error: errorMsg,
      }));

      return null;
    }
  }

  function clearError(): void {
    update((state) => ({
      ...state,
      error: null,
    }));
  }

  function clearHistory(): void {
    update((state) => ({
      ...state,
      history: [],
    }));
  }

  function setCurrentAnswer(answer: ResearchAnswer | null): void {
    update((state) => ({
      ...state,
      currentAnswer: answer,
    }));
  }

  function reset(): void {
    set(initialState);
  }

  // ========================================================================
  // Derived Stores
  // ========================================================================

  const status = derived(
    { subscribe },
    ($state): ResearchStatus => ({
      status: $state.error
        ? "error"
        : $state.isExecuting
        ? "loading"
        : $state.currentAnswer
        ? "success"
        : "idle",
      answer: $state.currentAnswer || undefined,
      error: $state.error
        ? {
            error: $state.error,
            code: "EXECUTION_ERROR",
          }
        : undefined,
      isExecuting: $state.isExecuting,
    })
  );

  const historyCount = derived(
    { subscribe },
    ($state) => $state.history.length
  );

  return {
    subscribe,
    executeQuery,
    clearError,
    clearHistory,
    setCurrentAnswer,
    reset,
    status,
    historyCount,
  };
}

// ============================================================================
// Export Singleton
// ============================================================================

export const researchStore = createResearchStore();
