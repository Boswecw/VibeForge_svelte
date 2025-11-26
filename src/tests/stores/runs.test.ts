import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { runsStore } from "$lib/core/stores/runs.svelte";
import type { PromptRun } from "$lib/core/types";
import * as neuroforgeClient from "$lib/core/api/neuroforgeClient";

// Mock the neuroforgeClient module
vi.mock("$lib/core/api/neuroforgeClient", () => ({
  executePromptSimplified: vi.fn(),
}));

describe("Runs Store", () => {
  const mockRun1: PromptRun = {
    id: "run-1",
    workspaceId: "ws-1",
    promptSnapshot: "Test prompt 1",
    contextBlockIds: ["ctx-1"],
    modelId: "gpt-4",
    status: "success",
    startedAt: "2025-01-01T10:00:00Z",
    completedAt: "2025-01-01T10:00:05Z",
    durationMs: 5000,
    inputTokens: 100,
    outputTokens: 200,
    totalTokens: 300,
    cost: 0.009,
    output: "Response from model 1",
  };

  const mockRun2: PromptRun = {
    id: "run-2",
    workspaceId: "ws-1",
    promptSnapshot: "Test prompt 2",
    contextBlockIds: ["ctx-1", "ctx-2"],
    modelId: "claude-3",
    status: "success",
    startedAt: "2025-01-01T10:05:00Z",
    completedAt: "2025-01-01T10:05:03Z",
    durationMs: 3000,
    inputTokens: 150,
    outputTokens: 250,
    totalTokens: 400,
    cost: 0.006,
    output: "Response from model 2",
  };

  const mockRun3: PromptRun = {
    id: "run-3",
    workspaceId: "ws-1",
    promptSnapshot: "Test prompt 3",
    contextBlockIds: [],
    modelId: "gpt-4",
    status: "error",
    startedAt: "2025-01-01T10:10:00Z",
    error: "API Error",
  };

  const mockRunPending: PromptRun = {
    id: "run-pending",
    workspaceId: "ws-1",
    promptSnapshot: "Pending prompt",
    contextBlockIds: [],
    modelId: "gpt-4",
    status: "pending",
    startedAt: "2025-01-01T10:15:00Z",
  };

  beforeEach(() => {
    // Clear state before each test
    runsStore.clearRuns();
    runsStore.setError(null);
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
      expect(runsStore.runs).toEqual([]);
      expect(runsStore.activeRunId).toBeNull();
      expect(runsStore.isExecuting).toBe(false);
      expect(runsStore.executionProgress).toBe(0);
      expect(runsStore.error).toBeNull();
    });

    it("should initialize derived state correctly", () => {
      expect(runsStore.activeRun).toBeNull();
      expect(runsStore.latestRun).toBeNull();
      expect(runsStore.runsByStatus).toEqual({});
      expect(runsStore.successfulRuns).toEqual([]);
      expect(runsStore.failedRuns).toEqual([]);
      expect(runsStore.totalTokensUsed).toBe(0);
      expect(runsStore.totalCost).toBe(0);
      expect(runsStore.averageDuration).toBe(0);
    });
  });

  // ============================================================================
  // BASIC ACTIONS
  // ============================================================================

  describe("setRuns", () => {
    it("should set runs array", () => {
      const runs = [mockRun1, mockRun2];
      runsStore.setRuns(runs);

      expect(runsStore.runs).toEqual(runs);
    });

    it("should clear error when setting runs", () => {
      runsStore.setError("Test error");
      runsStore.setRuns([mockRun1]);

      expect(runsStore.error).toBeNull();
    });

    it("should replace existing runs", () => {
      runsStore.setRuns([mockRun1]);
      runsStore.setRuns([mockRun2, mockRun3]);

      expect(runsStore.runs).toEqual([mockRun2, mockRun3]);
      expect(runsStore.runs).toHaveLength(2);
    });
  });

  describe("addRun", () => {
    it("should add a new run", () => {
      runsStore.addRun(mockRun1);

      expect(runsStore.runs).toHaveLength(1);
      expect(runsStore.runs[0]).toEqual(mockRun1);
    });

    it("should prepend to existing runs", () => {
      runsStore.setRuns([mockRun1]);
      runsStore.addRun(mockRun2);

      expect(runsStore.runs).toHaveLength(2);
      expect(runsStore.runs[0]).toEqual(mockRun2); // Most recent first
      expect(runsStore.runs[1]).toEqual(mockRun1);
    });
  });

  describe("updateRun", () => {
    beforeEach(() => {
      runsStore.setRuns([mockRun1, mockRun2]);
    });

    it("should update a run's properties", () => {
      runsStore.updateRun("run-1", { output: "Updated output" });

      const updatedRun = runsStore.getRunById("run-1");
      expect(updatedRun?.output).toBe("Updated output");
    });

    it("should update run status", () => {
      runsStore.updateRun("run-1", { status: "error", error: "Test error" });

      const updatedRun = runsStore.getRunById("run-1");
      expect(updatedRun?.status).toBe("error");
      expect(updatedRun?.error).toBe("Test error");
    });

    it("should not affect other runs", () => {
      runsStore.updateRun("run-1", { output: "Updated" });

      const otherRun = runsStore.getRunById("run-2");
      expect(otherRun?.output).toBe("Response from model 2");
    });
  });

  describe("removeRun", () => {
    beforeEach(() => {
      runsStore.setRuns([mockRun1, mockRun2, mockRun3]);
    });

    it("should remove a run by id", () => {
      runsStore.removeRun("run-2");

      expect(runsStore.runs).toHaveLength(2);
      expect(runsStore.getRunById("run-2")).toBeUndefined();
    });

    it("should keep other runs", () => {
      runsStore.removeRun("run-2");

      expect(runsStore.getRunById("run-1")).toBeDefined();
      expect(runsStore.getRunById("run-3")).toBeDefined();
    });
  });

  describe("clearRuns", () => {
    beforeEach(() => {
      runsStore.setRuns([mockRun1, mockRun2]);
      runsStore.setActiveRun("run-1");
    });

    it("should clear all runs", () => {
      runsStore.clearRuns();

      expect(runsStore.runs).toEqual([]);
    });

    it("should clear active run ID", () => {
      runsStore.clearRuns();

      expect(runsStore.activeRunId).toBeNull();
    });
  });

  describe("setActiveRun", () => {
    beforeEach(() => {
      runsStore.setRuns([mockRun1, mockRun2]);
    });

    it("should set active run ID", () => {
      runsStore.setActiveRun("run-1");

      expect(runsStore.activeRunId).toBe("run-1");
    });

    it("should clear active run ID", () => {
      runsStore.setActiveRun("run-1");
      runsStore.setActiveRun(null);

      expect(runsStore.activeRunId).toBeNull();
    });
  });

  // ============================================================================
  // EXECUTION STATE
  // ============================================================================

  describe("startExecution", () => {
    it("should set executing state", () => {
      runsStore.startExecution();

      expect(runsStore.isExecuting).toBe(true);
      expect(runsStore.executionProgress).toBe(0);
      expect(runsStore.error).toBeNull();
    });

    it("should clear previous errors", () => {
      runsStore.setError("Previous error");
      runsStore.startExecution();

      expect(runsStore.error).toBeNull();
    });
  });

  describe("updateExecutionProgress", () => {
    it("should update progress", () => {
      runsStore.updateExecutionProgress(50);

      expect(runsStore.executionProgress).toBe(50);
    });

    it("should clamp progress to 0-100 range", () => {
      runsStore.updateExecutionProgress(-10);
      expect(runsStore.executionProgress).toBe(0);

      runsStore.updateExecutionProgress(150);
      expect(runsStore.executionProgress).toBe(100);
    });
  });

  describe("completeExecution", () => {
    it("should mark execution as complete", () => {
      runsStore.startExecution();
      runsStore.completeExecution();

      expect(runsStore.isExecuting).toBe(false);
      expect(runsStore.executionProgress).toBe(100);
    });
  });

  describe("cancelExecution", () => {
    beforeEach(() => {
      runsStore.setRuns([mockRunPending, mockRun1]);
      runsStore.startExecution();
    });

    it("should stop execution", () => {
      runsStore.cancelExecution();

      expect(runsStore.isExecuting).toBe(false);
      expect(runsStore.executionProgress).toBe(0);
    });

    it("should cancel pending runs", () => {
      runsStore.cancelExecution();

      const pendingRun = runsStore.getRunById("run-pending");
      expect(pendingRun?.status).toBe("cancelled");
    });

    it("should not affect completed runs", () => {
      runsStore.cancelExecution();

      const completedRun = runsStore.getRunById("run-1");
      expect(completedRun?.status).toBe("success");
    });
  });

  describe("setError", () => {
    it("should set error and stop execution", () => {
      runsStore.startExecution();
      runsStore.setError("Test error");

      expect(runsStore.error).toBe("Test error");
      expect(runsStore.isExecuting).toBe(false);
    });

    it("should clear error", () => {
      runsStore.setError("Test error");
      runsStore.setError(null);

      expect(runsStore.error).toBeNull();
    });
  });

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  describe("activeRun", () => {
    beforeEach(() => {
      runsStore.setRuns([mockRun1, mockRun2]);
    });

    it("should return active run when set", () => {
      runsStore.setActiveRun("run-1");

      expect(runsStore.activeRun).toEqual(mockRun1);
    });

    it("should return null when no active run", () => {
      expect(runsStore.activeRun).toBeNull();
    });

    it("should return null when active run doesn't exist", () => {
      runsStore.setActiveRun("non-existent");

      expect(runsStore.activeRun).toBeNull();
    });
  });

  describe("latestRun", () => {
    it("should return null when no runs", () => {
      expect(runsStore.latestRun).toBeNull();
    });

    it("should return the most recent run", () => {
      runsStore.setRuns([mockRun1, mockRun2, mockRun3]);

      // mockRun3 has startedAt: 2025-01-01T10:10:00Z (latest)
      expect(runsStore.latestRun).toEqual(mockRun3);
    });

    it("should update when new run is added", () => {
      runsStore.setRuns([mockRun1]);
      expect(runsStore.latestRun).toEqual(mockRun1);

      runsStore.addRun(mockRun2);
      expect(runsStore.latestRun).toEqual(mockRun2);
    });
  });

  describe("runsByStatus", () => {
    beforeEach(() => {
      runsStore.setRuns([mockRun1, mockRun2, mockRun3, mockRunPending]);
    });

    it("should group runs by status", () => {
      const byStatus = runsStore.runsByStatus;

      expect(byStatus.success).toHaveLength(2);
      expect(byStatus.error).toHaveLength(1);
      expect(byStatus.pending).toHaveLength(1);
    });

    it("should include correct runs in each status", () => {
      const byStatus = runsStore.runsByStatus;

      expect(byStatus.success.some(r => r.id === "run-1")).toBe(true);
      expect(byStatus.success.some(r => r.id === "run-2")).toBe(true);
      expect(byStatus.error.some(r => r.id === "run-3")).toBe(true);
      expect(byStatus.pending.some(r => r.id === "run-pending")).toBe(true);
    });
  });

  describe("successfulRuns", () => {
    beforeEach(() => {
      runsStore.setRuns([mockRun1, mockRun2, mockRun3]);
    });

    it("should return only successful runs", () => {
      const successful = runsStore.successfulRuns;

      expect(successful).toHaveLength(2);
      expect(successful.every(r => r.status === "success")).toBe(true);
    });
  });

  describe("failedRuns", () => {
    beforeEach(() => {
      runsStore.setRuns([mockRun1, mockRun2, mockRun3]);
    });

    it("should return only failed runs", () => {
      const failed = runsStore.failedRuns;

      expect(failed).toHaveLength(1);
      expect(failed[0]).toEqual(mockRun3);
    });
  });

  describe("totalTokensUsed", () => {
    it("should return 0 when no runs", () => {
      expect(runsStore.totalTokensUsed).toBe(0);
    });

    it("should sum total tokens from all runs", () => {
      runsStore.setRuns([mockRun1, mockRun2]);
      // mockRun1: 300, mockRun2: 400 = 700
      expect(runsStore.totalTokensUsed).toBe(700);
    });

    it("should handle runs without token counts", () => {
      runsStore.setRuns([mockRun1, mockRun3]);
      // mockRun1: 300, mockRun3: undefined = 300
      expect(runsStore.totalTokensUsed).toBe(300);
    });
  });

  describe("totalCost", () => {
    it("should return 0 when no runs", () => {
      expect(runsStore.totalCost).toBe(0);
    });

    it("should sum costs from all runs", () => {
      runsStore.setRuns([mockRun1, mockRun2]);
      // mockRun1: 0.009, mockRun2: 0.006 = 0.015
      expect(runsStore.totalCost).toBe(0.015);
    });

    it("should handle runs without costs", () => {
      runsStore.setRuns([mockRun1, mockRun3]);
      // mockRun1: 0.009, mockRun3: undefined = 0.009
      expect(runsStore.totalCost).toBe(0.009);
    });
  });

  describe("averageDuration", () => {
    it("should return 0 when no completed runs", () => {
      runsStore.setRuns([mockRun3]); // No duration
      expect(runsStore.averageDuration).toBe(0);
    });

    it("should calculate average duration", () => {
      runsStore.setRuns([mockRun1, mockRun2]);
      // mockRun1: 5000ms, mockRun2: 3000ms
      // Average: (5000 + 3000) / 2 = 4000ms
      expect(runsStore.averageDuration).toBe(4000);
    });

    it("should exclude runs without duration", () => {
      runsStore.setRuns([mockRun1, mockRun2, mockRun3]);
      // Only count mockRun1 and mockRun2
      expect(runsStore.averageDuration).toBe(4000);
    });
  });

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  describe("getRunById", () => {
    beforeEach(() => {
      runsStore.setRuns([mockRun1, mockRun2]);
    });

    it("should return run when found", () => {
      const run = runsStore.getRunById("run-1");
      expect(run).toEqual(mockRun1);
    });

    it("should return undefined when not found", () => {
      const run = runsStore.getRunById("non-existent");
      expect(run).toBeUndefined();
    });
  });

  describe("getRunsByModel", () => {
    beforeEach(() => {
      runsStore.setRuns([mockRun1, mockRun2, mockRun3]);
    });

    it("should return runs for specific model", () => {
      const gpt4Runs = runsStore.getRunsByModel("gpt-4");

      expect(gpt4Runs).toHaveLength(2);
      expect(gpt4Runs.every(r => r.modelId === "gpt-4")).toBe(true);
    });

    it("should return empty array when no runs for model", () => {
      const runs = runsStore.getRunsByModel("non-existent-model");

      expect(runs).toEqual([]);
    });
  });

  // ============================================================================
  // EXECUTE FUNCTION
  // ============================================================================

  describe("execute", () => {
    const mockApiResponse = {
      run_id: "new-run-1",
      model_id: "gpt-4",
      output: "AI generated response",
      usage: {
        total_tokens: 500,
        prompt_tokens: 100,
        completion_tokens: 400,
      },
      latency_ms: 2500,
      created_at: "2025-01-01T12:00:00Z",
    };

    beforeEach(() => {
      vi.mocked(neuroforgeClient.executePromptSimplified).mockResolvedValue(mockApiResponse);
    });

    it("should execute prompt and add run", async () => {
      const result = await runsStore.execute("Test prompt", "gpt-4", ["ctx-1"]);

      expect(result).toEqual(mockApiResponse);
      expect(runsStore.runs).toHaveLength(1);
    });

    it("should set active run to new run", async () => {
      await runsStore.execute("Test prompt", "gpt-4");

      expect(runsStore.activeRunId).toBe("new-run-1");
    });

    it("should set executing state during execution", async () => {
      vi.mocked(neuroforgeClient.executePromptSimplified).mockImplementation(
        () => new Promise((resolve) => {
          expect(runsStore.isExecuting).toBe(true);
          resolve(mockApiResponse);
        })
      );

      await runsStore.execute("Test prompt", "gpt-4");
      expect(runsStore.isExecuting).toBe(false);
    });

    it("should handle execution error", async () => {
      const error = new Error("API Error");
      vi.mocked(neuroforgeClient.executePromptSimplified).mockRejectedValue(error);

      await expect(runsStore.execute("Test prompt", "gpt-4")).rejects.toThrow(error);
      expect(runsStore.error).toBe("API Error");
      expect(runsStore.isExecuting).toBe(false);
    });

    it("should handle non-Error execution failure", async () => {
      vi.mocked(neuroforgeClient.executePromptSimplified).mockRejectedValue("String error");

      await expect(runsStore.execute("Test prompt", "gpt-4")).rejects.toBe("String error");
      expect(runsStore.error).toBe("Execution failed");
    });

    it("should pass context blocks to API", async () => {
      const contextBlocks = ["ctx-1", "ctx-2"];
      await runsStore.execute("Test prompt", "gpt-4", contextBlocks);

      expect(neuroforgeClient.executePromptSimplified).toHaveBeenCalledWith({
        prompt: "Test prompt",
        model_id: "gpt-4",
        context_blocks: contextBlocks,
      });
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe("Integration", () => {
    it("should handle complete workflow", () => {
      // Add runs
      runsStore.setRuns([mockRun1, mockRun2, mockRun3]);

      // Set active run
      runsStore.setActiveRun("run-1");
      expect(runsStore.activeRun).toEqual(mockRun1);

      // Check derived state
      expect(runsStore.successfulRuns).toHaveLength(2);
      expect(runsStore.failedRuns).toHaveLength(1);
      expect(runsStore.totalTokensUsed).toBeGreaterThan(0);

      // Update a run
      runsStore.updateRun("run-1", { cost: 0.020 });
      expect(runsStore.totalCost).toBeGreaterThan(0.015);

      // Remove a run
      runsStore.removeRun("run-3");
      expect(runsStore.failedRuns).toHaveLength(0);
    });

    it("should maintain consistency during execution lifecycle", () => {
      // Start execution
      runsStore.startExecution();
      expect(runsStore.isExecuting).toBe(true);
      expect(runsStore.executionProgress).toBe(0);

      // Update progress
      runsStore.updateExecutionProgress(50);
      expect(runsStore.executionProgress).toBe(50);

      // Complete execution
      runsStore.completeExecution();
      expect(runsStore.isExecuting).toBe(false);
      expect(runsStore.executionProgress).toBe(100);
    });

    it("should handle cancellation with multiple pending runs", () => {
      const runningRun: PromptRun = {
        ...mockRunPending,
        id: "run-running",
        status: "running",
      };

      runsStore.setRuns([mockRun1, mockRunPending, runningRun]);
      runsStore.cancelExecution();

      const pendingRun = runsStore.getRunById("run-pending");
      const running = runsStore.getRunById("run-running");
      const completed = runsStore.getRunById("run-1");

      expect(pendingRun?.status).toBe("cancelled");
      expect(running?.status).toBe("cancelled");
      expect(completed?.status).toBe("success");
    });
  });
});
