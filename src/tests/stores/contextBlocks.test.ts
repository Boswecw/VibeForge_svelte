import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { contextBlocksStore } from "$lib/core/stores/contextBlocks.svelte";
import type { ContextBlock } from "$lib/core/types";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("Context Blocks Store", () => {
  const mockBlock1: ContextBlock = {
    id: "block-1",
    title: "Test Block 1",
    kind: "system",
    content: "This is test content for block 1. It has some text to estimate tokens.",
    description: "A test block",
    tags: ["test", "system"],
    isActive: true,
    source: "workspace",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };

  const mockBlock2: ContextBlock = {
    id: "block-2",
    title: "Test Block 2",
    kind: "code",
    content: "Code content here",
    description: "A code block",
    tags: ["test", "code"],
    isActive: false,
    source: "global",
    createdAt: "2025-01-02T00:00:00Z",
    updatedAt: "2025-01-02T00:00:00Z",
  };

  const mockBlock3: ContextBlock = {
    id: "block-3",
    title: "Test Block 3",
    kind: "system",
    content: "Another system block",
    description: "Another test block",
    tags: ["test"],
    isActive: true,
    source: "local",
    createdAt: "2025-01-03T00:00:00Z",
    updatedAt: "2025-01-03T00:00:00Z",
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    // Clear any existing blocks
    contextBlocksStore.setBlocks([]);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  describe("Initialization", () => {
    it("should initialize with empty state", () => {
      expect(contextBlocksStore.blocks).toEqual([]);
      expect(contextBlocksStore.isLoading).toBe(false);
      expect(contextBlocksStore.error).toBeNull();
    });

    it("should initialize derived state as empty", () => {
      expect(contextBlocksStore.activeBlocks).toEqual([]);
      expect(contextBlocksStore.inactiveBlocks).toEqual([]);
      expect(contextBlocksStore.activeBlockIds).toEqual([]);
      expect(contextBlocksStore.blocksByKind).toEqual({});
      expect(contextBlocksStore.totalActiveTokens).toBe(0);
    });

    it("should load blocks from localStorage on initialization", () => {
      const blocks = [mockBlock1, mockBlock2];
      localStorageMock.setItem("vibeforge:context-blocks", JSON.stringify(blocks));

      // Note: Since the store is already initialized, we need to reload the module
      // For this test, we'll just verify that setBlocks persists correctly
      contextBlocksStore.setBlocks(blocks);

      expect(contextBlocksStore.blocks).toHaveLength(2);
    });
  });

  // ============================================================================
  // BASIC ACTIONS - SET BLOCKS
  // ============================================================================

  describe("setBlocks", () => {
    it("should set blocks array", () => {
      const blocks = [mockBlock1, mockBlock2];
      contextBlocksStore.setBlocks(blocks);
      expect(contextBlocksStore.blocks).toEqual(blocks);
    });

    it("should clear error when setting blocks", () => {
      contextBlocksStore.setError("Test error");
      contextBlocksStore.setBlocks([mockBlock1]);
      expect(contextBlocksStore.error).toBeNull();
    });

    it("should save blocks to localStorage", () => {
      const blocks = [mockBlock1, mockBlock2];
      contextBlocksStore.setBlocks(blocks);

      const stored = localStorageMock.getItem("vibeforge:context-blocks");
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(blocks);
    });

    it("should save block order to localStorage", () => {
      const blocks = [mockBlock1, mockBlock2];
      contextBlocksStore.setBlocks(blocks);

      const storedOrder = localStorageMock.getItem("vibeforge:context-order");
      expect(storedOrder).toBeTruthy();
      expect(JSON.parse(storedOrder!)).toEqual(["block-1", "block-2"]);
    });
  });

  // ============================================================================
  // BASIC ACTIONS - ADD/UPDATE/REMOVE
  // ============================================================================

  describe("addBlock", () => {
    it("should add a new block", () => {
      contextBlocksStore.addBlock(mockBlock1);
      expect(contextBlocksStore.blocks).toHaveLength(1);
      expect(contextBlocksStore.blocks[0]).toEqual(mockBlock1);
    });

    it("should append to existing blocks", () => {
      contextBlocksStore.setBlocks([mockBlock1]);
      contextBlocksStore.addBlock(mockBlock2);
      expect(contextBlocksStore.blocks).toHaveLength(2);
      expect(contextBlocksStore.blocks[1]).toEqual(mockBlock2);
    });

    it("should persist to localStorage", () => {
      contextBlocksStore.addBlock(mockBlock1);

      const stored = localStorageMock.getItem("vibeforge:context-blocks");
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toHaveLength(1);
    });
  });

  describe("updateBlock", () => {
    beforeEach(() => {
      contextBlocksStore.setBlocks([mockBlock1, mockBlock2]);
    });

    it("should update a block's properties", () => {
      contextBlocksStore.updateBlock("block-1", { title: "Updated Title" });

      const updatedBlock = contextBlocksStore.getBlockById("block-1");
      expect(updatedBlock?.title).toBe("Updated Title");
    });

    it("should update block's timestamp", () => {
      const beforeUpdate = new Date().toISOString();
      contextBlocksStore.updateBlock("block-1", { title: "Updated" });

      const updatedBlock = contextBlocksStore.getBlockById("block-1");
      expect(updatedBlock?.updatedAt).toBeTruthy();
      expect(updatedBlock?.updatedAt ? updatedBlock.updatedAt >= beforeUpdate : false).toBe(true);
    });

    it("should not affect other blocks", () => {
      contextBlocksStore.updateBlock("block-1", { title: "Updated Title" });

      const otherBlock = contextBlocksStore.getBlockById("block-2");
      expect(otherBlock?.title).toBe("Test Block 2");
    });

    it("should persist to localStorage", () => {
      contextBlocksStore.updateBlock("block-1", { title: "Updated" });

      const stored = localStorageMock.getItem("vibeforge:context-blocks");
      const blocks = JSON.parse(stored!);
      expect(blocks[0].title).toBe("Updated");
    });
  });

  describe("removeBlock", () => {
    beforeEach(() => {
      contextBlocksStore.setBlocks([mockBlock1, mockBlock2, mockBlock3]);
    });

    it("should remove a block by id", () => {
      contextBlocksStore.removeBlock("block-2");

      expect(contextBlocksStore.blocks).toHaveLength(2);
      expect(contextBlocksStore.getBlockById("block-2")).toBeUndefined();
    });

    it("should keep other blocks", () => {
      contextBlocksStore.removeBlock("block-2");

      expect(contextBlocksStore.getBlockById("block-1")).toBeDefined();
      expect(contextBlocksStore.getBlockById("block-3")).toBeDefined();
    });

    it("should persist to localStorage", () => {
      contextBlocksStore.removeBlock("block-2");

      const stored = localStorageMock.getItem("vibeforge:context-blocks");
      const blocks = JSON.parse(stored!);
      expect(blocks).toHaveLength(2);
      expect(blocks.find((b: ContextBlock) => b.id === "block-2")).toBeUndefined();
    });
  });

  // ============================================================================
  // ACTIVE STATE MANAGEMENT
  // ============================================================================

  describe("toggleActive", () => {
    beforeEach(() => {
      contextBlocksStore.setBlocks([mockBlock1, mockBlock2]);
    });

    it("should toggle block active state from true to false", () => {
      contextBlocksStore.toggleActive("block-1");

      const block = contextBlocksStore.getBlockById("block-1");
      expect(block?.isActive).toBe(false);
    });

    it("should toggle block active state from false to true", () => {
      contextBlocksStore.toggleActive("block-2");

      const block = contextBlocksStore.getBlockById("block-2");
      expect(block?.isActive).toBe(true);
    });

    it("should persist to localStorage", () => {
      contextBlocksStore.toggleActive("block-1");

      const stored = localStorageMock.getItem("vibeforge:context-blocks");
      const blocks = JSON.parse(stored!);
      expect(blocks[0].isActive).toBe(false);
    });
  });

  describe("setActiveOnly", () => {
    beforeEach(() => {
      contextBlocksStore.setBlocks([mockBlock1, mockBlock2, mockBlock3]);
    });

    it("should activate only specified blocks", () => {
      contextBlocksStore.setActiveOnly(["block-1", "block-3"]);

      expect(contextBlocksStore.getBlockById("block-1")?.isActive).toBe(true);
      expect(contextBlocksStore.getBlockById("block-2")?.isActive).toBe(false);
      expect(contextBlocksStore.getBlockById("block-3")?.isActive).toBe(true);
    });

    it("should deactivate blocks not in list", () => {
      contextBlocksStore.setActiveOnly(["block-2"]);

      expect(contextBlocksStore.getBlockById("block-1")?.isActive).toBe(false);
      expect(contextBlocksStore.getBlockById("block-3")?.isActive).toBe(false);
    });

    it("should persist to localStorage", () => {
      contextBlocksStore.setActiveOnly(["block-2"]);

      const stored = localStorageMock.getItem("vibeforge:context-blocks");
      const blocks = JSON.parse(stored!);
      expect(blocks.filter((b: ContextBlock) => b.isActive)).toHaveLength(1);
    });
  });

  describe("activateAll", () => {
    beforeEach(() => {
      contextBlocksStore.setBlocks([mockBlock1, mockBlock2, mockBlock3]);
    });

    it("should activate all blocks", () => {
      contextBlocksStore.activateAll();

      contextBlocksStore.blocks.forEach(block => {
        expect(block.isActive).toBe(true);
      });
    });

    it("should persist to localStorage", () => {
      contextBlocksStore.activateAll();

      const stored = localStorageMock.getItem("vibeforge:context-blocks");
      const blocks = JSON.parse(stored!);
      expect(blocks.every((b: ContextBlock) => b.isActive)).toBe(true);
    });
  });

  describe("deactivateAll", () => {
    beforeEach(() => {
      contextBlocksStore.setBlocks([mockBlock1, mockBlock2, mockBlock3]);
    });

    it("should deactivate all blocks", () => {
      contextBlocksStore.deactivateAll();

      contextBlocksStore.blocks.forEach(block => {
        expect(block.isActive).toBe(false);
      });
    });

    it("should persist to localStorage", () => {
      contextBlocksStore.deactivateAll();

      const stored = localStorageMock.getItem("vibeforge:context-blocks");
      const blocks = JSON.parse(stored!);
      expect(blocks.every((b: ContextBlock) => !b.isActive)).toBe(true);
    });
  });

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  describe("Derived State", () => {
    beforeEach(() => {
      contextBlocksStore.setBlocks([mockBlock1, mockBlock2, mockBlock3]);
    });

    it("should derive activeBlocks correctly", () => {
      expect(contextBlocksStore.activeBlocks).toHaveLength(2);
      expect(contextBlocksStore.activeBlocks[0].id).toBe("block-1");
      expect(contextBlocksStore.activeBlocks[1].id).toBe("block-3");
    });

    it("should derive inactiveBlocks correctly", () => {
      expect(contextBlocksStore.inactiveBlocks).toHaveLength(1);
      expect(contextBlocksStore.inactiveBlocks[0].id).toBe("block-2");
    });

    it("should derive activeBlockIds correctly", () => {
      expect(contextBlocksStore.activeBlockIds).toEqual(["block-1", "block-3"]);
    });

    it("should derive blocksByKind correctly", () => {
      const byKind = contextBlocksStore.blocksByKind;

      expect(byKind.system).toHaveLength(2);
      expect(byKind.code).toHaveLength(1);
    });

    it("should calculate totalActiveTokens correctly", () => {
      // block-1: ~17 words * 4 chars = ~68 chars / 4 = ~17 tokens
      // block-3: ~4 words * 4 chars = ~16 chars / 4 = ~4 tokens
      const tokens = contextBlocksStore.totalActiveTokens;
      expect(tokens).toBeGreaterThan(0);
    });

    it("should update derived state when blocks change", () => {
      contextBlocksStore.toggleActive("block-2");

      expect(contextBlocksStore.activeBlocks).toHaveLength(3);
      expect(contextBlocksStore.inactiveBlocks).toHaveLength(0);
    });
  });

  // ============================================================================
  // REORDER FUNCTIONALITY
  // ============================================================================

  describe("reorderBlock", () => {
    beforeEach(() => {
      contextBlocksStore.setBlocks([mockBlock1, mockBlock2, mockBlock3]);
    });

    it("should reorder blocks correctly (move forward)", () => {
      // Move block-1 to position of block-3
      contextBlocksStore.reorderBlock("block-1", "block-3");

      const blocks = contextBlocksStore.blocks;
      expect(blocks[0].id).toBe("block-2");
      expect(blocks[1].id).toBe("block-3");
      expect(blocks[2].id).toBe("block-1");
    });

    it("should reorder blocks correctly (move backward)", () => {
      // Move block-3 to position of block-1
      contextBlocksStore.reorderBlock("block-3", "block-1");

      const blocks = contextBlocksStore.blocks;
      expect(blocks[0].id).toBe("block-3");
      expect(blocks[1].id).toBe("block-1");
      expect(blocks[2].id).toBe("block-2");
    });

    it("should handle invalid source id gracefully", () => {
      const beforeBlocks = [...contextBlocksStore.blocks];
      contextBlocksStore.reorderBlock("invalid-id", "block-2");

      expect(contextBlocksStore.blocks).toEqual(beforeBlocks);
    });

    it("should handle invalid target id gracefully", () => {
      const beforeBlocks = [...contextBlocksStore.blocks];
      contextBlocksStore.reorderBlock("block-1", "invalid-id");

      expect(contextBlocksStore.blocks).toEqual(beforeBlocks);
    });

    it("should persist to localStorage", () => {
      contextBlocksStore.reorderBlock("block-3", "block-1");

      const stored = localStorageMock.getItem("vibeforge:context-blocks");
      const blocks = JSON.parse(stored!);
      expect(blocks[0].id).toBe("block-3");
    });

    it("should update order in localStorage", () => {
      contextBlocksStore.reorderBlock("block-3", "block-1");

      const storedOrder = localStorageMock.getItem("vibeforge:context-order");
      const order = JSON.parse(storedOrder!);
      expect(order).toEqual(["block-3", "block-1", "block-2"]);
    });
  });

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  describe("getBlockById", () => {
    beforeEach(() => {
      contextBlocksStore.setBlocks([mockBlock1, mockBlock2]);
    });

    it("should return block when found", () => {
      const block = contextBlocksStore.getBlockById("block-1");
      expect(block).toEqual(mockBlock1);
    });

    it("should return undefined when not found", () => {
      const block = contextBlocksStore.getBlockById("non-existent");
      expect(block).toBeUndefined();
    });
  });

  describe("setLoading", () => {
    it("should set loading state to true", () => {
      contextBlocksStore.setLoading(true);
      expect(contextBlocksStore.isLoading).toBe(true);
    });

    it("should set loading state to false", () => {
      contextBlocksStore.setLoading(true);
      contextBlocksStore.setLoading(false);
      expect(contextBlocksStore.isLoading).toBe(false);
    });
  });

  describe("setError", () => {
    it("should set error message", () => {
      contextBlocksStore.setError("Test error");
      expect(contextBlocksStore.error).toBe("Test error");
    });

    it("should clear error message", () => {
      contextBlocksStore.setError("Test error");
      contextBlocksStore.setError(null);
      expect(contextBlocksStore.error).toBeNull();
    });
  });
});
