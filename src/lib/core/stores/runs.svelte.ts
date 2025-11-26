/**
 * VibeForge V2 - Runs Store
 *
 * Manages prompt execution runs and history using Svelte 5 runes.
 */

import type { PromptRun, RunStatus } from '$lib/core/types';
import { executePromptSimplified, type SimplifiedExecuteResponse } from '$lib/core/api/neuroforgeClient';

// ============================================================================
// RUNS STATE
// ============================================================================

interface RunsState {
  runs: PromptRun[];
  activeRunId: string | null;
  isExecuting: boolean;
  executionProgress: number; // 0-100
  error: string | null;
}

const state = $state<RunsState>({
  runs: [],
  activeRunId: null,
  isExecuting: false,
  executionProgress: 0,
  error: null,
});

// ============================================================================
// DERIVED STATE
// ============================================================================

const activeRun = $derived(state.runs.find((r) => r.id === state.activeRunId) || null);

const latestRun = $derived(
  state.runs.length > 0
    ? state.runs.reduce((latest, run) =>
        new Date(run.startedAt) > new Date(latest.startedAt) ? run : latest
      )
    : null
);

const runsByStatus = $derived(
  state.runs.reduce(
    (acc, run) => {
      if (!acc[run.status]) {
        acc[run.status] = [];
      }
      acc[run.status].push(run);
      return acc;
    },
    {} as Record<RunStatus, PromptRun[]>
  )
);

const successfulRuns = $derived(state.runs.filter((r) => r.status === 'success'));

const failedRuns = $derived(state.runs.filter((r) => r.status === 'error'));

const totalTokensUsed = $derived(
  state.runs.reduce((sum, run) => sum + (run.totalTokens || 0), 0)
);

const totalCost = $derived(state.runs.reduce((sum, run) => sum + (run.cost || 0), 0));

const averageDuration = $derived(() => {
  const completed = state.runs.filter((r) => r.durationMs !== undefined);
  if (completed.length === 0) return 0;
  const total = completed.reduce((sum, run) => sum + (run.durationMs || 0), 0);
  return Math.round(total / completed.length);
});

// ============================================================================
// ACTIONS
// ============================================================================

function setRuns(runs: PromptRun[]) {
  state.runs = runs;
  state.error = null;
}

function addRun(run: PromptRun) {
  state.runs = [run, ...state.runs];
}

function updateRun(id: string, updates: Partial<PromptRun>) {
  state.runs = state.runs.map((run) => (run.id === id ? { ...run, ...updates } : run));
}

function removeRun(id: string) {
  state.runs = state.runs.filter((run) => run.id !== id);
}

function clearRuns() {
  state.runs = [];
  state.activeRunId = null;
}

function setActiveRun(id: string | null) {
  state.activeRunId = id;
}

function startExecution() {
  state.isExecuting = true;
  state.executionProgress = 0;
  state.error = null;
}

function updateExecutionProgress(progress: number) {
  state.executionProgress = Math.max(0, Math.min(100, progress));
}

function completeExecution() {
  state.isExecuting = false;
  state.executionProgress = 100;
}

function cancelExecution() {
  state.isExecuting = false;
  state.executionProgress = 0;
  // Update any pending runs to cancelled
  state.runs = state.runs.map((run) =>
    run.status === 'pending' || run.status === 'running'
      ? { ...run, status: 'cancelled' }
      : run
  );
}

function setError(error: string | null) {
  state.error = error;
  state.isExecuting = false;
}

function getRunById(id: string): PromptRun | undefined {
  return state.runs.find((run) => run.id === id);
}

function getRunsByModel(modelId: string): PromptRun[] {
  return state.runs.filter((run) => run.modelId === modelId);
}

// Execute a prompt with a single model (Refactoring Plan Compatible)
async function execute(prompt: string, modelId: string, contextBlocks?: string[]): Promise<SimplifiedExecuteResponse> {
  state.isExecuting = true;
  state.error = null;

  try {
    const result = await executePromptSimplified({
      prompt,
      model_id: modelId,
      context_blocks: contextBlocks,
    });

    // Convert SimplifiedExecuteResponse to PromptRun format
    const run: PromptRun = {
      id: result.run_id,
      modelId: result.model_id,
      output: result.output,
      status: 'success',
      totalTokens: result.usage.total_tokens,
      durationMs: result.latency_ms,
      startedAt: result.created_at,
      completedAt: new Date().toISOString(),
      cost: 0, // Calculate based on model pricing
    };

    addRun(run);
    state.activeRunId = run.id;
    return result;
  } catch (err) {
    state.error = err instanceof Error ? err.message : 'Execution failed';
    throw err;
  } finally {
    state.isExecuting = false;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const runsStore = {
  // State
  get runs() {
    return state.runs;
  },
  get activeRunId() {
    return state.activeRunId;
  },
  get isExecuting() {
    return state.isExecuting;
  },
  get executionProgress() {
    return state.executionProgress;
  },
  get error() {
    return state.error;
  },
  // Derived
  get activeRun() {
    return activeRun;
  },
  get latestRun() {
    return latestRun;
  },
  get runsByStatus() {
    return runsByStatus;
  },
  get successfulRuns() {
    return successfulRuns;
  },
  get failedRuns() {
    return failedRuns;
  },
  get totalTokensUsed() {
    return totalTokensUsed;
  },
  get totalCost() {
    return totalCost;
  },
  get averageDuration() {
    return averageDuration();
  },
  // Actions
  setRuns,
  addRun,
  updateRun,
  removeRun,
  clearRuns,
  setActiveRun,
  startExecution,
  updateExecutionProgress,
  completeExecution,
  cancelExecution,
  setError,
  getRunById,
  getRunsByModel,
  execute,
};
