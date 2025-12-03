import { describe, it, expect, beforeEach } from "vitest";
import { PerformanceMetricsCollector as PerformanceMetrics } from "$lib/services/modelRouter/performanceMetrics";
// @ts-expect-error - MetricEntry type no longer exists, test file needs updating
type MetricEntry = any;

describe("PerformanceMetrics", () => {
  let performanceMetrics: PerformanceMetrics;

  beforeEach(() => {
    performanceMetrics = new PerformanceMetrics();
  });

  describe("recordMetric", () => {
    it("should record a successful metric", () => {
      const metric: MetricEntry = {
        responseTime: 1500,
        inputTokens: 100,
        outputTokens: 50,
        success: true,
      };

      performanceMetrics.recordMetric("openai", "gpt-3.5-turbo", metric);

      const metrics = performanceMetrics.getMetrics("openai", "gpt-3.5-turbo");
      expect(metrics).toBeDefined();
      expect(metrics!.totalCount).toBe(1);
      expect(metrics!.acceptedCount).toBe(1);
    });

    it("should record a failed metric", () => {
      const metric: MetricEntry = {
        responseTime: 2000,
        inputTokens: 100,
        outputTokens: 0,
        success: false,
      };

      performanceMetrics.recordMetric("openai", "gpt-4", metric);

      const metrics = performanceMetrics.getMetrics("openai", "gpt-4");
      expect(metrics!.totalCount).toBe(1);
      expect(metrics!.errorCount).toBe(1);
      expect(metrics!.acceptedCount).toBe(0);
    });

    it("should track multiple metrics", () => {
      for (let i = 0; i < 5; i++) {
        performanceMetrics.recordMetric("openai", "gpt-3.5-turbo", {
          responseTime: 1000 + i * 100,
          inputTokens: 100,
          outputTokens: 50,
          success: true,
        });
      }

      const metrics = performanceMetrics.getMetrics("openai", "gpt-3.5-turbo");
      expect(metrics!.totalCount).toBe(5);
      expect(metrics!.acceptedCount).toBe(5);
    });
  });

  describe("getMetrics", () => {
    beforeEach(() => {
      // Add sample metrics
      const metrics: MetricEntry[] = [
        {
          responseTime: 1000,
          inputTokens: 100,
          outputTokens: 50,
          success: true,
        },
        {
          responseTime: 1500,
          inputTokens: 150,
          outputTokens: 75,
          success: true,
        },
        {
          responseTime: 2000,
          inputTokens: 200,
          outputTokens: 100,
          success: true,
        },
        {
          responseTime: 5000,
          inputTokens: 100,
          outputTokens: 50,
          success: false,
        },
      ];

      metrics.forEach((metric) =>
        performanceMetrics.recordMetric("openai", "gpt-3.5-turbo", metric)
      );
    });

    it("should return correct total count", () => {
      const metrics = performanceMetrics.getMetrics("openai", "gpt-3.5-turbo");
      expect(metrics!.totalCount).toBe(4);
    });

    it("should return correct accepted count", () => {
      const metrics = performanceMetrics.getMetrics("openai", "gpt-3.5-turbo");
      expect(metrics!.acceptedCount).toBe(3);
    });

    it("should return correct error count", () => {
      const metrics = performanceMetrics.getMetrics("openai", "gpt-3.5-turbo");
      expect(metrics!.errorCount).toBe(1);
    });

    it("should calculate average response time correctly", () => {
      const metrics = performanceMetrics.getMetrics("openai", "gpt-3.5-turbo");
      // (1000 + 1500 + 2000 + 5000) / 4 = 2375
      expect(metrics!.avgResponseTime).toBeCloseTo(2375, 0);
    });

    it("should return null for non-existent model", () => {
      const metrics = performanceMetrics.getMetrics(
        "nonexistent",
        "nonexistent-model"
      );
      expect(metrics).toBeNull();
    });
  });

  describe("acceptance rate calculation", () => {
    it("should calculate 100% acceptance rate", () => {
      for (let i = 0; i < 10; i++) {
        performanceMetrics.recordMetric("openai", "gpt-3.5-turbo", {
          responseTime: 1000,
          inputTokens: 100,
          outputTokens: 50,
          success: true,
        });
      }

      const acceptanceRate = performanceMetrics.getAcceptanceRate(
        "openai",
        "gpt-3.5-turbo"
      );
      expect(acceptanceRate).toBe(100);
    });

    it("should calculate 0% acceptance rate", () => {
      for (let i = 0; i < 10; i++) {
        performanceMetrics.recordMetric("openai", "gpt-4", {
          responseTime: 1000,
          inputTokens: 100,
          outputTokens: 0,
          success: false,
        });
      }

      const acceptanceRate = performanceMetrics.getAcceptanceRate(
        "openai",
        "gpt-4"
      );
      expect(acceptanceRate).toBe(0);
    });

    it("should calculate 50% acceptance rate", () => {
      for (let i = 0; i < 5; i++) {
        performanceMetrics.recordMetric("anthropic", "claude-sonnet", {
          responseTime: 1000,
          inputTokens: 100,
          outputTokens: 50,
          success: true,
        });
        performanceMetrics.recordMetric("anthropic", "claude-sonnet", {
          responseTime: 1000,
          inputTokens: 100,
          outputTokens: 0,
          success: false,
        });
      }

      const acceptanceRate = performanceMetrics.getAcceptanceRate(
        "anthropic",
        "claude-sonnet"
      );
      expect(acceptanceRate).toBe(50);
    });

    it("should return 0 for non-existent model", () => {
      const acceptanceRate = performanceMetrics.getAcceptanceRate(
        "nonexistent",
        "nonexistent"
      );
      expect(acceptanceRate).toBe(0);
    });
  });

  describe("percentile calculations", () => {
    beforeEach(() => {
      // Add metrics with known response times
      const responseTimes = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
      responseTimes.forEach((time) => {
        performanceMetrics.recordMetric("openai", "gpt-3.5-turbo", {
          responseTime: time,
          inputTokens: 100,
          outputTokens: 50,
          success: true,
        });
      });
    });

    it("should calculate p50 (median) correctly", () => {
      const metrics = performanceMetrics.getMetrics("openai", "gpt-3.5-turbo");
      // Median of [100..1000] = 550
      expect(metrics!.p50).toBeDefined();
      expect(metrics!.p50).toBeGreaterThanOrEqual(500);
      expect(metrics!.p50).toBeLessThanOrEqual(600);
    });

    it("should calculate p95 correctly", () => {
      const metrics = performanceMetrics.getMetrics("openai", "gpt-3.5-turbo");
      // 95th percentile should be close to 950
      expect(metrics!.p95).toBeDefined();
      expect(metrics!.p95).toBeGreaterThanOrEqual(900);
    });

    it("should calculate p99 correctly", () => {
      const metrics = performanceMetrics.getMetrics("openai", "gpt-3.5-turbo");
      // 99th percentile should be close to 990
      expect(metrics!.p99).toBeDefined();
      expect(metrics!.p99).toBeGreaterThanOrEqual(950);
    });
  });

  describe("A/B testing support", () => {
    it("should enable comparing two models", () => {
      // Model A metrics
      for (let i = 0; i < 10; i++) {
        performanceMetrics.recordMetric("openai", "gpt-3.5-turbo", {
          responseTime: 1000,
          inputTokens: 100,
          outputTokens: 50,
          success: true,
        });
      }

      // Model B metrics
      for (let i = 0; i < 10; i++) {
        performanceMetrics.recordMetric("anthropic", "claude-haiku", {
          responseTime: 800,
          inputTokens: 100,
          outputTokens: 50,
          success: true,
        });
      }

      const metricsA = performanceMetrics.getMetrics("openai", "gpt-3.5-turbo");
      const metricsB = performanceMetrics.getMetrics(
        "anthropic",
        "claude-haiku"
      );

      expect(metricsA!.avgResponseTime).toBeGreaterThan(
        metricsB!.avgResponseTime
      );
    });

    it("should track different success rates", () => {
      // High success model
      for (let i = 0; i < 10; i++) {
        performanceMetrics.recordMetric("openai", "gpt-4", {
          responseTime: 2000,
          inputTokens: 100,
          outputTokens: 50,
          success: i < 9, // 90% success
        });
      }

      // Lower success model
      for (let i = 0; i < 10; i++) {
        performanceMetrics.recordMetric("anthropic", "claude-opus", {
          responseTime: 1500,
          inputTokens: 100,
          outputTokens: 50,
          success: i < 7, // 70% success
        });
      }

      const rateA = performanceMetrics.getAcceptanceRate("openai", "gpt-4");
      const rateB = performanceMetrics.getAcceptanceRate(
        "anthropic",
        "claude-opus"
      );

      expect(rateA).toBeGreaterThan(rateB);
      expect(rateA).toBe(90);
      expect(rateB).toBe(70);
    });
  });

  describe("performance grading", () => {
    it("should grade excellent performance (A+)", () => {
      // Fast, no errors, high acceptance
      for (let i = 0; i < 10; i++) {
        performanceMetrics.recordMetric("anthropic", "claude-haiku", {
          responseTime: 500,
          inputTokens: 100,
          outputTokens: 50,
          success: true,
        });
      }

      const grade = performanceMetrics.getPerformanceGrade(
        "anthropic",
        "claude-haiku"
      );
      expect(grade.score).toBeGreaterThanOrEqual(90);
      expect(grade.letter).toMatch(/A\+?/);
    });

    it("should grade poor performance (D)", () => {
      // Slow, many errors
      for (let i = 0; i < 10; i++) {
        performanceMetrics.recordMetric("ollama", "llama-2", {
          responseTime: 5000,
          inputTokens: 100,
          outputTokens: 50,
          success: i < 4, // 40% success
        });
      }

      const grade = performanceMetrics.getPerformanceGrade("ollama", "llama-2");
      expect(grade.score).toBeLessThan(60);
      expect(grade.letter).toBe("D");
    });

    it("should grade good performance (B)", () => {
      // Moderate speed, good success rate
      for (let i = 0; i < 10; i++) {
        performanceMetrics.recordMetric("openai", "gpt-3.5-turbo", {
          responseTime: 2000,
          inputTokens: 100,
          outputTokens: 50,
          success: i < 8, // 80% success
        });
      }

      const grade = performanceMetrics.getPerformanceGrade(
        "openai",
        "gpt-3.5-turbo"
      );
      expect(grade.score).toBeGreaterThanOrEqual(70);
      expect(grade.score).toBeLessThan(80);
      expect(grade.letter).toBe("B");
    });
  });

  describe("getAllMetrics", () => {
    it("should return all tracked models", () => {
      performanceMetrics.recordMetric("openai", "gpt-3.5-turbo", {
        responseTime: 1000,
        inputTokens: 100,
        outputTokens: 50,
        success: true,
      });

      performanceMetrics.recordMetric("anthropic", "claude-sonnet", {
        responseTime: 1200,
        inputTokens: 100,
        outputTokens: 50,
        success: true,
      });

      const allMetrics = performanceMetrics.getAllMetrics();
      expect(allMetrics.size).toBe(2);
      expect(allMetrics.has("openai:gpt-3.5-turbo")).toBe(true);
      expect(allMetrics.has("anthropic:claude-sonnet")).toBe(true);
    });
  });

  describe("reset", () => {
    it("should clear all metrics", () => {
      performanceMetrics.recordMetric("openai", "gpt-3.5-turbo", {
        responseTime: 1000,
        inputTokens: 100,
        outputTokens: 50,
        success: true,
      });

      performanceMetrics.reset();

      const metrics = performanceMetrics.getMetrics("openai", "gpt-3.5-turbo");
      expect(metrics).toBeNull();
    });
  });
});
