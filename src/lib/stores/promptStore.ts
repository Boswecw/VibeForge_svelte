import { writable, derived } from 'svelte/store';

interface PromptState {
  text: string;
  lastUpdated: string | null;
}

const initial: PromptState = {
  text: '',
  lastUpdated: null
};

function createPromptStore() {
  const { subscribe, set, update } = writable<PromptState>(initial);

  return {
    subscribe,
    setText: (text: string) =>
      update((state) => ({
        text,
        lastUpdated: new Date().toISOString()
      })),
    reset: () => set(initial)
  };
}

export const promptState = createPromptStore();

// extremely rough token estimate (4 chars ≈ 1 token)
export const estimatedTokens = derived(promptState, ($state) => {
  const len = $state.text.trim().length;
  if (!len) return 0;
  return Math.ceil(len / 4);
});
