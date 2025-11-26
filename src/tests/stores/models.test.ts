import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { modelsStore } from "$lib/core/stores/models.svelte";
import type { Model } from "$lib/core/types";

describe("Models Store", () => {
  const mockModel1: Model = {
    id: "gpt-4",
    name: "GPT-4",
    provider: "openai",
    maxTokens: 8192,
    supportsStreaming: true,
    costPer1kTokens: 0.03,
  };

  const mockModel2: Model = {
    id: "claude-3",
    name: "Claude 3",
    provider: "anthropic",
    maxTokens: 200000,
    supportsStreaming: true,
    costPer1kTokens: 0.015,
  };

  const mockModel3: Model = {
    id: "gpt-3.5",
    name: "GPT-3.5 Turbo",
    provider: "openai",
    maxTokens: 4096,
    supportsStreaming: true,
    costPer1kTokens: 0.002,
  };

  const mockModel4: Model = {
    id: "local-llama",
    name: "Local LLaMA",
    provider: "local",
    maxTokens: 4096,
    supportsStreaming: false,
    // No cost for local models
  };

  beforeEach(() => {
    // Clear state before each test
    modelsStore.setModels([]);
    modelsStore.clearSelection();
    modelsStore.setError(null);
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
      expect(modelsStore.models).toEqual([]);
      expect(modelsStore.selectedIds).toEqual([]);
      expect(modelsStore.isLoading).toBe(false);
      expect(modelsStore.error).toBeNull();
    });

    it("should initialize derived state correctly", () => {
      expect(modelsStore.selectedModels).toEqual([]);
      expect(modelsStore.availableModels).toEqual([]);
      expect(modelsStore.modelsByProvider).toEqual({});
      expect(modelsStore.hasSelection).toBe(false);
      expect(modelsStore.selectedCount).toBe(0);
    });
  });

  // ============================================================================
  // SET MODELS
  // ============================================================================

  describe("setModels", () => {
    it("should set models array", () => {
      const models = [mockModel1, mockModel2];
      modelsStore.setModels(models);

      expect(modelsStore.models).toEqual(models);
    });

    it("should clear error when setting models", () => {
      modelsStore.setError("Test error");
      modelsStore.setModels([mockModel1]);

      expect(modelsStore.error).toBeNull();
    });

    it("should replace existing models", () => {
      modelsStore.setModels([mockModel1]);
      modelsStore.setModels([mockModel2, mockModel3]);

      expect(modelsStore.models).toEqual([mockModel2, mockModel3]);
      expect(modelsStore.models).toHaveLength(2);
    });
  });

  // ============================================================================
  // MODEL SELECTION
  // ============================================================================

  describe("selectModel", () => {
    beforeEach(() => {
      modelsStore.setModels([mockModel1, mockModel2, mockModel3]);
    });

    it("should select a model", () => {
      modelsStore.selectModel("gpt-4");

      expect(modelsStore.selectedIds).toContain("gpt-4");
      expect(modelsStore.selectedCount).toBe(1);
    });

    it("should not duplicate selection", () => {
      modelsStore.selectModel("gpt-4");
      modelsStore.selectModel("gpt-4");

      expect(modelsStore.selectedIds).toEqual(["gpt-4"]);
      expect(modelsStore.selectedCount).toBe(1);
    });

    it("should select multiple models", () => {
      modelsStore.selectModel("gpt-4");
      modelsStore.selectModel("claude-3");

      expect(modelsStore.selectedIds).toContain("gpt-4");
      expect(modelsStore.selectedIds).toContain("claude-3");
      expect(modelsStore.selectedCount).toBe(2);
    });
  });

  describe("deselectModel", () => {
    beforeEach(() => {
      modelsStore.setModels([mockModel1, mockModel2, mockModel3]);
      modelsStore.selectModel("gpt-4");
      modelsStore.selectModel("claude-3");
    });

    it("should deselect a model", () => {
      modelsStore.deselectModel("gpt-4");

      expect(modelsStore.selectedIds).not.toContain("gpt-4");
      expect(modelsStore.selectedIds).toContain("claude-3");
      expect(modelsStore.selectedCount).toBe(1);
    });

    it("should handle deselecting unselected model", () => {
      modelsStore.deselectModel("gpt-3.5");

      expect(modelsStore.selectedIds).toHaveLength(2);
    });

    it("should handle deselecting non-existent model", () => {
      modelsStore.deselectModel("non-existent");

      expect(modelsStore.selectedIds).toHaveLength(2);
    });
  });

  describe("toggleModel", () => {
    beforeEach(() => {
      modelsStore.setModels([mockModel1, mockModel2]);
    });

    it("should select model when not selected", () => {
      modelsStore.toggleModel("gpt-4");

      expect(modelsStore.selectedIds).toContain("gpt-4");
    });

    it("should deselect model when selected", () => {
      modelsStore.selectModel("gpt-4");
      modelsStore.toggleModel("gpt-4");

      expect(modelsStore.selectedIds).not.toContain("gpt-4");
    });

    it("should toggle multiple times", () => {
      modelsStore.toggleModel("gpt-4");
      expect(modelsStore.selectedIds).toContain("gpt-4");

      modelsStore.toggleModel("gpt-4");
      expect(modelsStore.selectedIds).not.toContain("gpt-4");

      modelsStore.toggleModel("gpt-4");
      expect(modelsStore.selectedIds).toContain("gpt-4");
    });
  });

  describe("setSelectedIds", () => {
    beforeEach(() => {
      modelsStore.setModels([mockModel1, mockModel2, mockModel3]);
    });

    it("should set selected IDs array", () => {
      modelsStore.setSelectedIds(["gpt-4", "claude-3"]);

      expect(modelsStore.selectedIds).toEqual(["gpt-4", "claude-3"]);
      expect(modelsStore.selectedCount).toBe(2);
    });

    it("should replace existing selection", () => {
      modelsStore.selectModel("gpt-3.5");
      modelsStore.setSelectedIds(["gpt-4"]);

      expect(modelsStore.selectedIds).toEqual(["gpt-4"]);
      expect(modelsStore.selectedCount).toBe(1);
    });
  });

  describe("clearSelection", () => {
    beforeEach(() => {
      modelsStore.setModels([mockModel1, mockModel2]);
      modelsStore.selectModel("gpt-4");
      modelsStore.selectModel("claude-3");
    });

    it("should clear all selections", () => {
      modelsStore.clearSelection();

      expect(modelsStore.selectedIds).toEqual([]);
      expect(modelsStore.selectedCount).toBe(0);
      expect(modelsStore.hasSelection).toBe(false);
    });
  });

  describe("selectOnly", () => {
    beforeEach(() => {
      modelsStore.setModels([mockModel1, mockModel2, mockModel3]);
      modelsStore.selectModel("gpt-4");
      modelsStore.selectModel("claude-3");
    });

    it("should select only specified model", () => {
      modelsStore.selectOnly("gpt-3.5");

      expect(modelsStore.selectedIds).toEqual(["gpt-3.5"]);
      expect(modelsStore.selectedCount).toBe(1);
    });

    it("should clear previous selections", () => {
      modelsStore.selectOnly("claude-3");

      expect(modelsStore.selectedIds).not.toContain("gpt-4");
      expect(modelsStore.selectedIds).toContain("claude-3");
    });
  });

  describe("selectAll", () => {
    beforeEach(() => {
      modelsStore.setModels([mockModel1, mockModel2, mockModel3]);
    });

    it("should select all models", () => {
      modelsStore.selectAll();

      expect(modelsStore.selectedIds).toHaveLength(3);
      expect(modelsStore.selectedIds).toContain("gpt-4");
      expect(modelsStore.selectedIds).toContain("claude-3");
      expect(modelsStore.selectedIds).toContain("gpt-3.5");
    });

    it("should replace partial selection", () => {
      modelsStore.selectModel("gpt-4");
      modelsStore.selectAll();

      expect(modelsStore.selectedIds).toHaveLength(3);
    });
  });

  // ============================================================================
  // DERIVED STATE - SELECTED MODELS
  // ============================================================================

  describe("selectedModels", () => {
    beforeEach(() => {
      modelsStore.setModels([mockModel1, mockModel2, mockModel3]);
    });

    it("should return selected models", () => {
      modelsStore.selectModel("gpt-4");
      modelsStore.selectModel("claude-3");

      const selected = modelsStore.selectedModels;
      expect(selected).toHaveLength(2);
      expect(selected[0].id).toBe("gpt-4");
      expect(selected[1].id).toBe("claude-3");
    });

    it("should return empty array when no selection", () => {
      expect(modelsStore.selectedModels).toEqual([]);
    });

    it("should update when selection changes", () => {
      modelsStore.selectModel("gpt-4");
      expect(modelsStore.selectedModels).toHaveLength(1);

      modelsStore.selectModel("claude-3");
      expect(modelsStore.selectedModels).toHaveLength(2);

      modelsStore.deselectModel("gpt-4");
      expect(modelsStore.selectedModels).toHaveLength(1);
    });
  });

  describe("availableModels", () => {
    beforeEach(() => {
      modelsStore.setModels([mockModel1, mockModel2, mockModel3]);
    });

    it("should return unselected models", () => {
      modelsStore.selectModel("gpt-4");

      const available = modelsStore.availableModels;
      expect(available).toHaveLength(2);
      expect(available.some(m => m.id === "gpt-4")).toBe(false);
      expect(available.some(m => m.id === "claude-3")).toBe(true);
      expect(available.some(m => m.id === "gpt-3.5")).toBe(true);
    });

    it("should return all models when no selection", () => {
      expect(modelsStore.availableModels).toHaveLength(3);
    });

    it("should return empty array when all selected", () => {
      modelsStore.selectAll();
      expect(modelsStore.availableModels).toEqual([]);
    });
  });

  describe("modelsByProvider", () => {
    beforeEach(() => {
      modelsStore.setModels([mockModel1, mockModel2, mockModel3, mockModel4]);
    });

    it("should group models by provider", () => {
      const byProvider = modelsStore.modelsByProvider;

      expect(byProvider.openai).toHaveLength(2);
      expect(byProvider.anthropic).toHaveLength(1);
      expect(byProvider.local).toHaveLength(1);
    });

    it("should include all OpenAI models", () => {
      const openaiModels = modelsStore.modelsByProvider.openai;

      expect(openaiModels.some(m => m.id === "gpt-4")).toBe(true);
      expect(openaiModels.some(m => m.id === "gpt-3.5")).toBe(true);
    });

    it("should return empty object when no models", () => {
      modelsStore.setModels([]);
      expect(modelsStore.modelsByProvider).toEqual({});
    });
  });

  describe("hasSelection", () => {
    beforeEach(() => {
      modelsStore.setModels([mockModel1, mockModel2]);
    });

    it("should return false when no selection", () => {
      expect(modelsStore.hasSelection).toBe(false);
    });

    it("should return true when models selected", () => {
      modelsStore.selectModel("gpt-4");
      expect(modelsStore.hasSelection).toBe(true);
    });

    it("should return false after clearing selection", () => {
      modelsStore.selectModel("gpt-4");
      modelsStore.clearSelection();
      expect(modelsStore.hasSelection).toBe(false);
    });
  });

  describe("selectedCount", () => {
    beforeEach(() => {
      modelsStore.setModels([mockModel1, mockModel2, mockModel3]);
    });

    it("should return 0 when no selection", () => {
      expect(modelsStore.selectedCount).toBe(0);
    });

    it("should return correct count", () => {
      modelsStore.selectModel("gpt-4");
      expect(modelsStore.selectedCount).toBe(1);

      modelsStore.selectModel("claude-3");
      expect(modelsStore.selectedCount).toBe(2);

      modelsStore.selectModel("gpt-3.5");
      expect(modelsStore.selectedCount).toBe(3);
    });

    it("should update when selection changes", () => {
      modelsStore.selectAll();
      expect(modelsStore.selectedCount).toBe(3);

      modelsStore.deselectModel("gpt-4");
      expect(modelsStore.selectedCount).toBe(2);
    });
  });

  // ============================================================================
  // COST ESTIMATION
  // ============================================================================

  describe("estimatedCost", () => {
    beforeEach(() => {
      modelsStore.setModels([mockModel1, mockModel2, mockModel3]);
    });

    it("should calculate cost for single model", () => {
      modelsStore.selectModel("gpt-4");
      // gpt-4: $0.03 per 1k tokens
      // 1000 input + 1000 output = 2000 tokens = 2k tokens
      // Cost: 2 * 0.03 = $0.06
      const cost = modelsStore.estimatedCost(1000, 1000);
      expect(cost).toBe(0.06);
    });

    it("should calculate cost for multiple models", () => {
      modelsStore.selectModel("gpt-4"); // $0.03 per 1k
      modelsStore.selectModel("claude-3"); // $0.015 per 1k
      // Total: 1000 tokens = 1k tokens
      // Cost: 1 * (0.03 + 0.015) = $0.045
      const cost = modelsStore.estimatedCost(500, 500);
      expect(cost).toBe(0.045);
    });

    it("should return 0 when no models selected", () => {
      const cost = modelsStore.estimatedCost(1000, 1000);
      expect(cost).toBe(0);
    });

    it("should handle models without cost", () => {
      modelsStore.setModels([mockModel4]); // Local model, no cost
      modelsStore.selectModel("local-llama");

      const cost = modelsStore.estimatedCost(1000, 1000);
      expect(cost).toBe(0);
    });

    it("should handle mixed models with and without cost", () => {
      modelsStore.setModels([mockModel1, mockModel4]);
      modelsStore.selectModel("gpt-4");
      modelsStore.selectModel("local-llama");

      // Only gpt-4 has cost
      const cost = modelsStore.estimatedCost(1000, 1000);
      expect(cost).toBe(0.06); // 2k tokens * $0.03
    });

    it("should handle different token counts", () => {
      modelsStore.selectModel("gpt-3.5"); // $0.002 per 1k
      // 5000 tokens = 5k tokens
      // Cost: 5 * 0.002 = $0.01
      const cost = modelsStore.estimatedCost(3000, 2000);
      expect(cost).toBe(0.01);
    });
  });

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  describe("getModelById", () => {
    beforeEach(() => {
      modelsStore.setModels([mockModel1, mockModel2]);
    });

    it("should return model when found", () => {
      const model = modelsStore.getModelById("gpt-4");
      expect(model).toEqual(mockModel1);
    });

    it("should return undefined when not found", () => {
      const model = modelsStore.getModelById("non-existent");
      expect(model).toBeUndefined();
    });
  });

  describe("setLoading", () => {
    it("should set loading state to true", () => {
      modelsStore.setLoading(true);
      expect(modelsStore.isLoading).toBe(true);
    });

    it("should set loading state to false", () => {
      modelsStore.setLoading(true);
      modelsStore.setLoading(false);
      expect(modelsStore.isLoading).toBe(false);
    });
  });

  describe("setError", () => {
    it("should set error message", () => {
      modelsStore.setError("Test error");
      expect(modelsStore.error).toBe("Test error");
    });

    it("should clear error message", () => {
      modelsStore.setError("Test error");
      modelsStore.setError(null);
      expect(modelsStore.error).toBeNull();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe("Integration", () => {
    it("should handle complete workflow", () => {
      // Set up models
      modelsStore.setModels([mockModel1, mockModel2, mockModel3]);
      expect(modelsStore.models).toHaveLength(3);

      // Select models
      modelsStore.selectModel("gpt-4");
      modelsStore.selectModel("claude-3");
      expect(modelsStore.selectedCount).toBe(2);

      // Check derived state
      expect(modelsStore.hasSelection).toBe(true);
      expect(modelsStore.availableModels).toHaveLength(1);

      // Calculate cost
      const cost = modelsStore.estimatedCost(1000, 1000);
      expect(cost).toBeGreaterThan(0);

      // Clear selection
      modelsStore.clearSelection();
      expect(modelsStore.hasSelection).toBe(false);
      expect(modelsStore.availableModels).toHaveLength(3);
    });

    it("should maintain consistency across operations", () => {
      modelsStore.setModels([mockModel1, mockModel2, mockModel3, mockModel4]);

      // Select all
      modelsStore.selectAll();
      expect(modelsStore.selectedCount).toBe(4);
      expect(modelsStore.availableModels).toHaveLength(0);

      // Deselect one
      modelsStore.deselectModel("gpt-4");
      expect(modelsStore.selectedCount).toBe(3);
      expect(modelsStore.availableModels).toHaveLength(1);

      // Select only one
      modelsStore.selectOnly("claude-3");
      expect(modelsStore.selectedCount).toBe(1);
      expect(modelsStore.availableModels).toHaveLength(3);

      // Group by provider
      const byProvider = modelsStore.modelsByProvider;
      expect(Object.keys(byProvider)).toHaveLength(3);
    });

    it("should handle provider filtering with selection", () => {
      modelsStore.setModels([mockModel1, mockModel2, mockModel3]);

      // Select all OpenAI models
      const openaiModels = modelsStore.modelsByProvider.openai;
      openaiModels.forEach(model => modelsStore.selectModel(model.id));

      expect(modelsStore.selectedCount).toBe(2);
      expect(modelsStore.selectedModels.every(m => m.provider === "openai")).toBe(true);
    });
  });
});
