import { writable, derived } from "svelte/store";
import type { ModelRun } from "$lib/types/run";
import * as neuroforgeClient from "$lib/core/api/neuroforgeClient";
import * as dataforgeClient from "$lib/core/api/dataforgeClient";

interface RunState {
  runs: ModelRun[];
  activeRunId: string | null;
}

const initial: RunState = {
  runs: [],
  activeRunId: null,
};

function createRunStore() {
  const { subscribe, update, set } = writable<RunState>(initial);

  return {
    subscribe,
    reset: () => set(initial),
    // Execute prompt via NeuroForge and log to DataForge
    executeRun: async (
      request: neuroforgeClient.ExecutePromptRequest
    ): Promise<ModelRun | null> => {
      try {
        // 1. Execute via NeuroForge
        const response = await neuroforgeClient.executePrompt(request);
        if (!response.success || !response.data) {
          console.error("NeuroForge execution failed:", response.error);
          return null;
        }

        const runs = response.data;
        const run = runs[0]; // Get first run from array

        // Convert PromptRun to ModelRun
        const modelRun: ModelRun = {
          id: run.id,
          modelId: run.modelId,
          modelLabel: run.modelId, // Use modelId as label for now
          createdAt: run.createdAt || run.startedAt,
          promptSnapshot: run.promptSnapshot,
          contextTitles: [], // Not available from PromptRun
          status: run.status,
          outputText: run.output || '',
        };

        // 2. Add to local state
        update((state) => ({
          runs: [modelRun, ...state.runs],
          activeRunId: modelRun.id,
        }));

        // 3. Log to DataForge for analytics/history
        // TODO: Implement when DataForge /api/v1/runs endpoint is ready
        // await dataforgeClient.logRun(modelRun);

        return modelRun;
      } catch (error) {
        console.error("Run execution failed:", error);
        return null;
      }
    },
    addRun: (run: ModelRun) =>
      update((state) => {
        const runs = [run, ...state.runs];
        return {
          runs,
          activeRunId: run.id,
        };
      }),
    setActiveRun: (id: string) =>
      update((state) => ({
        ...state,
        activeRunId: id,
      })),
  };
}

export const runState = createRunStore();

export const runs = derived(runState, ($state) => $state.runs);

export const activeRun = derived(
  runState,
  ($state) => $state.runs.find((r) => r.id === $state.activeRunId) ?? null
);
