/**
 * VibeForge - Command Palette Store
 *
 * Svelte store for managing the command palette state and actions.
 */

import { writable, derived } from "svelte/store";
import type { ShortcutAction } from "$lib/core/shortcuts";

// ============================================================================
// Types
// ============================================================================

export interface Command {
  id: string;
  name: string;
  description?: string;
  category: string;
  keywords?: string[];
  icon?: string;
  shortcut?: string[];
  handler: () => void;
}

interface PaletteState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  commands: Command[];
}

const initialState: PaletteState = {
  isOpen: false,
  query: "",
  selectedIndex: 0,
  commands: [],
};

// ============================================================================
// Store
// ============================================================================

function createPaletteStore() {
  const { subscribe, set, update } = writable<PaletteState>(initialState);

  return {
    subscribe,

    /**
     * Open the command palette
     */
    open() {
      update((state) => ({
        ...state,
        isOpen: true,
        query: "",
        selectedIndex: 0,
      }));
    },

    /**
     * Close the command palette
     */
    close() {
      update((state) => ({
        ...state,
        isOpen: false,
        query: "",
        selectedIndex: 0,
      }));
    },

    /**
     * Toggle the command palette
     */
    toggle() {
      update((state) => ({
        ...state,
        isOpen: !state.isOpen,
        query: "",
        selectedIndex: 0,
      }));
    },

    /**
     * Set search query
     */
    setQuery(query: string) {
      update((state) => ({ ...state, query, selectedIndex: 0 }));
    },

    /**
     * Move selection up
     */
    selectPrevious() {
      update((state) => ({
        ...state,
        selectedIndex:
          state.selectedIndex > 0
            ? state.selectedIndex - 1
            : state.selectedIndex,
      }));
    },

    /**
     * Move selection down
     */
    selectNext(maxIndex: number) {
      update((state) => ({
        ...state,
        selectedIndex:
          state.selectedIndex < maxIndex
            ? state.selectedIndex + 1
            : state.selectedIndex,
      }));
    },

    /**
     * Register commands
     */
    registerCommands(commands: Command[]) {
      update((state) => ({ ...state, commands }));
    },

    /**
     * Add a command
     */
    addCommand(command: Command) {
      update((state) => ({
        ...state,
        commands: [...state.commands, command],
      }));
    },

    /**
     * Remove a command
     */
    removeCommand(id: string) {
      update((state) => ({
        ...state,
        commands: state.commands.filter((c) => c.id !== id),
      }));
    },

    /**
     * Reset store
     */
    reset() {
      set(initialState);
    },
  };
}

export const paletteStore = createPaletteStore();

// ============================================================================
// Derived Stores
// ============================================================================

/**
 * Get filtered commands based on search query
 */
export const filteredCommands = derived(paletteStore, ($store) => {
  if (!$store.query.trim()) {
    return $store.commands;
  }

  const query = $store.query.toLowerCase();

  return $store.commands.filter((cmd) => {
    // Search in name
    if (cmd.name.toLowerCase().includes(query)) {
      return true;
    }

    // Search in description
    if (cmd.description?.toLowerCase().includes(query)) {
      return true;
    }

    // Search in keywords
    if (cmd.keywords?.some((kw) => kw.toLowerCase().includes(query))) {
      return true;
    }

    // Search in category
    if (cmd.category.toLowerCase().includes(query)) {
      return true;
    }

    return false;
  });
});

/**
 * Get commands grouped by category
 */
export const commandsByCategory = derived(filteredCommands, ($commands) => {
  const grouped = new Map<string, Command[]>();

  for (const cmd of $commands) {
    if (!grouped.has(cmd.category)) {
      grouped.set(cmd.category, []);
    }
    grouped.get(cmd.category)!.push(cmd);
  }

  return Array.from(grouped.entries()).map(([category, commands]) => ({
    category,
    commands,
  }));
});
