/**
 * VibeForge V2 - Context Blocks Store
 *
 * Manages context blocks using Svelte 5 runes with localStorage persistence.
 */

import type { ContextBlock } from "$lib/core/types";
import { browser } from "$app/environment";

// ============================================================================
// LOCALSTORAGE PERSISTENCE
// ============================================================================

const STORAGE_KEY = "vibeforge:context-blocks";
const ORDER_KEY = "vibeforge:context-order";

function loadFromStorage(): ContextBlock[] {
  if (!browser) return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load context blocks from storage:", e);
  }
  return [];
}

function saveToStorage(blocks: ContextBlock[]) {
  if (!browser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
    // Save order separately for quick lookups
    const order = blocks.map((b) => b.id);
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch (e) {
    console.error("Failed to save context blocks to storage:", e);
  }
}

// ============================================================================
// CONTEXT BLOCKS STATE
// ============================================================================

interface ContextBlocksState {
  blocks: ContextBlock[];
  isLoading: boolean;
  error: string | null;
}

const state = $state<ContextBlocksState>({
  blocks: loadFromStorage(),
  isLoading: false,
  error: null,
});

// ============================================================================
// DERIVED STATE
// ============================================================================

const activeBlocks = $derived(state.blocks.filter((b) => b.isActive));

const inactiveBlocks = $derived(state.blocks.filter((b) => !b.isActive));

const activeBlockIds = $derived(activeBlocks.map((b) => b.id));

const blocksByKind = $derived(
  state.blocks.reduce((acc, block) => {
    if (!acc[block.kind]) {
      acc[block.kind] = [];
    }
    acc[block.kind].push(block);
    return acc;
  }, {} as Record<string, ContextBlock[]>)
);

const totalActiveTokens = $derived(
  activeBlocks.reduce(
    (sum, block) => sum + Math.floor(block.content.length / 4),
    0
  )
);

// ============================================================================
// ACTIONS
// ============================================================================

function setBlocks(blocks: ContextBlock[]) {
  state.blocks = blocks;
  state.error = null;
  saveToStorage(blocks);
}

function addBlock(block: ContextBlock) {
  state.blocks = [...state.blocks, block];
  saveToStorage(state.blocks);
}

function updateBlock(id: string, updates: Partial<ContextBlock>) {
  state.blocks = state.blocks.map((block) =>
    block.id === id
      ? { ...block, ...updates, updatedAt: new Date().toISOString() }
      : block
  );
  saveToStorage(state.blocks);
}

function removeBlock(id: string) {
  state.blocks = state.blocks.filter((block) => block.id !== id);
  saveToStorage(state.blocks);
}

function toggleActive(id: string) {
  state.blocks = state.blocks.map((block) =>
    block.id === id ? { ...block, isActive: !block.isActive } : block
  );
  saveToStorage(state.blocks);
}

function setActiveOnly(ids: string[]) {
  state.blocks = state.blocks.map((block) => ({
    ...block,
    isActive: ids.includes(block.id),
  }));
  saveToStorage(state.blocks);
}

function activateAll() {
  state.blocks = state.blocks.map((block) => ({ ...block, isActive: true }));
  saveToStorage(state.blocks);
}

function deactivateAll() {
  state.blocks = state.blocks.map((block) => ({ ...block, isActive: false }));
  saveToStorage(state.blocks);
}

function setLoading(loading: boolean) {
  state.isLoading = loading;
}

function setError(error: string | null) {
  state.error = error;
}

function getBlockById(id: string): ContextBlock | undefined {
  return state.blocks.find((block) => block.id === id);
}

function reorderBlock(draggedId: string, targetId: string) {
  const draggedIndex = state.blocks.findIndex((b) => b.id === draggedId);
  const targetIndex = state.blocks.findIndex((b) => b.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1) return;

  const newBlocks = [...state.blocks];
  const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
  newBlocks.splice(targetIndex, 0, draggedBlock);

  state.blocks = newBlocks;
  saveToStorage(state.blocks);
}

// ============================================================================
// EXPORTS
// ============================================================================

export const contextBlocksStore = {
  // State
  get blocks() {
    return state.blocks;
  },
  get isLoading() {
    return state.isLoading;
  },
  get error() {
    return state.error;
  },
  // Derived
  get activeBlocks() {
    return activeBlocks;
  },
  get inactiveBlocks() {
    return inactiveBlocks;
  },
  get activeBlockIds() {
    return activeBlockIds;
  },
  get blocksByKind() {
    return blocksByKind;
  },
  get totalActiveTokens() {
    return totalActiveTokens;
  },
  // Actions
  setBlocks,
  addBlock,
  updateBlock,
  removeBlock,
  toggleActive,
  setActiveOnly,
  activateAll,
  deactivateAll,
  setLoading,
  setError,
  getBlockById,
  reorderBlock,
};
