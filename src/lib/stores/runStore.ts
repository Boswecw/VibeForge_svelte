import { writable, derived } from 'svelte/store';
import type { ModelRun } from '$lib/types/run';

interface RunState {
  runs: ModelRun[];
  activeRunId: string | null;
}

const initial: RunState = {
  runs: [],
  activeRunId: null
};

function createRunStore() {
  const { subscribe, update, set } = writable<RunState>(initial);

  return {
    subscribe,
    reset: () => set(initial),
    addRun: (run: ModelRun) =>
      update((state) => {
        const runs = [run, ...state.runs];
        return {
          runs,
          activeRunId: run.id
        };
      }),
    setActiveRun: (id: string) =>
      update((state) => ({
        ...state,
        activeRunId: id
      }))
  };
}

export const runState = createRunStore();

export const runs = derived(runState, ($state) => $state.runs);

export const activeRun = derived(runState, ($state) =>
  $state.runs.find((r) => r.id === $state.activeRunId) ?? null
);
