import { describe, it, expect, beforeEach, vi } from "vitest";
import { ModelRouter } from "$lib/services/llm/modelRouter";
import { CostTracker } from "$lib/services/llm/costTracker";
import { PerformanceMetrics } from "$lib/services/llm/performanceMetrics";
// @ts-expect-error - Old test file, types have been refactored
import type { LLMProvider, LLMRequest, RoutingStrategy } from "$lib/types/llm";

describe("ModelRouter", () => {
  let router: ModelRouter;
  let costTracker: CostTracker;
  let performanceMetrics: PerformanceMetrics;
  let mockProviders: Map<string, LLMProvider>;

  beforeEach(() => {
    costTracker = new CostTracker();
    performanceMetrics = new PerformanceMetrics();

    // Mock providers
    mockProviders = new Map();
    const mockOpenAI: LLMProvider = {
      name: "openai",
      generateCompletion: vi.fn().mockResolvedValue({
        content: "OpenAI response",
        model: "gpt-3.5-turbo",
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        finishReason: "stop",
      }),
      calculateCost: vi.fn((model, input, output) => 0.001),
      validateModel: vi.fn((model) => true),
      getAvailableModels: vi.fn(() => ["gpt-3.5-turbo", "gpt-4"]),
    };

    const mockAnthropic: LLMProvider = {
      name: "anthropic",
      generateCompletion: vi.fn().mockResolvedValue({
        content: "Claude response",
        model: "claude-sonnet",
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        finishReason: "stop",
      }),
      calculateCost: vi.fn((model, input, output) => 0.002),
      validateModel: vi.fn((model) => true),
      getAvailableModels: vi.fn(() => [
        "claude-opus",
        "claude-sonnet",
        "claude-haiku",
      ]),
    };

    mockProviders.set("openai", mockOpenAI);
    mockProviders.set("anthropic", mockAnthropic);

    router = new ModelRouter(mockProviders, costTracker, performanceMetrics);
  });

  describe("initialization", () => {
    it("should initialize with default strategy", () => {
      expect(router.getCurrentStrategy()).toBe("balanced");
    });

    it("should accept custom initial strategy", () => {
      const customRouter = new ModelRouter(
        mockProviders,
        costTracker,
        performanceMetrics,
        "cost-optimized"
      );
      expect(customRouter.getCurrentStrategy()).toBe("cost-optimized");
    });
  });

  describe("setStrategy", () => {
    it("should change routing strategy", () => {
      router.setStrategy("performance-optimized");
      expect(router.getCurrentStrategy()).toBe("performance-optimized");
    });

    it("should accept all valid strategies", () => {
      const strategies: RoutingStrategy[] = [
        "cost-optimized",
        "performance-optimized",
        "quality-focused",
        "balanced",
        "custom",
      ];

      strategies.forEach((strategy) => {
        router.setStrategy(strategy);
        expect(router.getCurrentStrategy()).toBe(strategy);
      });
    });
  });

  describe("route - cost-optimized strategy", () => {
    beforeEach(() => {
      router.setStrategy("cost-optimized");
    });

    it("should select cheapest provider", async () => {
      const request: LLMRequest = {
        model: "auto",
        messages: [{ role: "user", content: "Test" }],
        temperature: 0.7,
      };

      const response = await router.route(request);

      // OpenAI is cheaper (0.001 vs 0.002)
      expect(response.content).toBe("OpenAI response");
      expect(
        mockProviders.get("openai")!.generateCompletion
      ).toHaveBeenCalled();
    });

    it("should consider input/output token costs", async () => {
      const request: LLMRequest = {
        model: "auto",
        messages: [{ role: "user", content: "A".repeat(1000) }],
        temperature: 0.7,
      };

      await router.route(request);

      // Should still pick OpenAI for cost optimization
      expect(
        mockProviders.get("openai")!.generateCompletion
      ).toHaveBeenCalled();
    });
  });

  describe("route - performance-optimized strategy", () => {
    beforeEach(() => {
      router.setStrategy("performance-optimized");

      // Add mock performance data
      performanceMetrics.recordMetric("openai", "gpt-3.5-turbo", {
        responseTime: 2000,
        inputTokens: 10,
        outputTokens: 20,
        success: true,
      });

      performanceMetrics.recordMetric("anthropic", "claude-sonnet", {
        responseTime: 1000,
        inputTokens: 10,
        outputTokens: 20,
        success: true,
      });
    });

    it("should select fastest provider", async () => {
      const request: LLMRequest = {
        model: "auto",
        messages: [{ role: "user", content: "Test" }],
        temperature: 0.7,
      };

      const response = await router.route(request);

      // Anthropic is faster (1000ms vs 2000ms)
      expect(response.content).toBe("Claude response");
      expect(
        mockProviders.get("anthropic")!.generateCompletion
      ).toHaveBeenCalled();
    });
  });

  describe("route - quality-focused strategy", () => {
    beforeEach(() => {
      router.setStrategy("quality-focused");
    });

    it("should select highest quality model", async () => {
      const request: LLMRequest = {
        model: "auto",
        messages: [{ role: "user", content: "Complex reasoning task" }],
        temperature: 0.7,
      };

      const response = await router.route(request);

      // Should select based on quality metrics
      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
    });
  });

  describe("route - balanced strategy", () => {
    beforeEach(() => {
      router.setStrategy("balanced");
    });

    it("should balance cost, performance, and quality", async () => {
      const request: LLMRequest = {
        model: "auto",
        messages: [{ role: "user", content: "Test" }],
        temperature: 0.7,
      };

      const response = await router.route(request);

      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
    });

    it("should work with different request types", async () => {
      const requests: LLMRequest[] = [
        {
          model: "auto",
          messages: [{ role: "user", content: "Short query" }],
          temperature: 0.5,
        },
        {
          model: "auto",
          messages: [
            { role: "system", content: "You are an expert." },
            { role: "user", content: "Complex analysis task" },
          ],
          temperature: 0.9,
          maxTokens: 1000,
        },
      ];

      for (const request of requests) {
        const response = await router.route(request);
        expect(response).toBeDefined();
      }
    });
  });

  describe("route - custom strategy", () => {
    it("should use custom routing function", async () => {
      const customFunction = vi.fn(() => ({
        provider: "anthropic",
        model: "claude-haiku",
      }));

      router.setStrategy("custom", customFunction);

      const request: LLMRequest = {
        model: "auto",
        messages: [{ role: "user", content: "Test" }],
        temperature: 0.7,
      };

      await router.route(request);

      expect(customFunction).toHaveBeenCalled();
      expect(
        mockProviders.get("anthropic")!.generateCompletion
      ).toHaveBeenCalled();
    });
  });

  describe("route - specific model requested", () => {
    it("should use specified provider and model", async () => {
      const request: LLMRequest = {
        model: "gpt-4",
        messages: [{ role: "user", content: "Test" }],
        temperature: 0.7,
      };

      await router.route(request);

      expect(
        mockProviders.get("openai")!.generateCompletion
      ).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-4" }));
    });

    it("should throw error for unsupported model", async () => {
      const request: LLMRequest = {
        model: "unsupported-model",
        messages: [{ role: "user", content: "Test" }],
        temperature: 0.7,
      };

      await expect(router.route(request)).rejects.toThrow();
    });
  });

  describe("fallback handling", () => {
    it("should fallback to next provider on error", async () => {
      // Make OpenAI fail
      mockProviders.get("openai")!.generateCompletion = vi
        .fn()
        .mockRejectedValue(new Error("API Error"));

      router.setStrategy("cost-optimized"); // Would normally pick OpenAI

      const request: LLMRequest = {
        model: "auto",
        messages: [{ role: "user", content: "Test" }],
        temperature: 0.7,
      };

      const response = await router.route(request);

      // Should fallback to Anthropic
      expect(response.content).toBe("Claude response");
      expect(
        mockProviders.get("anthropic")!.generateCompletion
      ).toHaveBeenCalled();
    });

    it("should throw error if all providers fail", async () => {
      mockProviders.get("openai")!.generateCompletion = vi
        .fn()
        .mockRejectedValue(new Error("API Error"));
      mockProviders.get("anthropic")!.generateCompletion = vi
        .fn()
        .mockRejectedValue(new Error("API Error"));

      const request: LLMRequest = {
        model: "auto",
        messages: [{ role: "user", content: "Test" }],
        temperature: 0.7,
      };

      await expect(router.route(request)).rejects.toThrow();
    });
  });

  describe("metrics integration", () => {
    it("should track costs after routing", async () => {
      const request: LLMRequest = {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Test" }],
        temperature: 0.7,
      };

      await router.route(request);

      const summary = costTracker.getSummary();
      expect(summary.totalCost).toBeGreaterThan(0);
    });

    it("should track performance metrics", async () => {
      const request: LLMRequest = {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Test" }],
        temperature: 0.7,
      };

      await router.route(request);

      const metrics = performanceMetrics.getMetrics("openai", "gpt-3.5-turbo");
      expect(metrics).toBeDefined();
      expect(metrics!.totalCount).toBeGreaterThan(0);
    });
  });
});
