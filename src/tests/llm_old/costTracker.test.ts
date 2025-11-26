import { describe, it, expect, beforeEach } from "vitest";
import { CostTracker } from "$lib/services/llm/costTracker";
import type { CostEntry } from "$lib/types/llm";

describe("CostTracker", () => {
  let costTracker: CostTracker;

  beforeEach(() => {
    costTracker = new CostTracker();
  });

  describe("initialization", () => {
    it("should initialize with zero total cost", () => {
      const summary = costTracker.getSummary();
      expect(summary.totalCost).toBe(0);
    });

    it("should initialize with default budgets", () => {
      const budget = costTracker.getBudget();
      expect(budget.daily).toBeGreaterThan(0);
      expect(budget.weekly).toBeGreaterThan(0);
      expect(budget.monthly).toBeGreaterThan(0);
    });
  });

  describe("trackCost", () => {
    it("should track a single cost entry", () => {
      const entry: CostEntry = {
        timestamp: new Date(),
        provider: "openai",
        model: "gpt-3.5-turbo",
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.002,
        category: "recommendation",
      };

      costTracker.trackCost(entry);

      const summary = costTracker.getSummary();
      expect(summary.totalCost).toBe(0.002);
      expect(summary.entries.length).toBe(1);
      expect(summary.entries[0]).toEqual(entry);
    });

    it("should track multiple cost entries", () => {
      const entries: CostEntry[] = [
        {
          timestamp: new Date(),
          provider: "openai",
          model: "gpt-3.5-turbo",
          inputTokens: 100,
          outputTokens: 50,
          cost: 0.002,
          category: "recommendation",
        },
        {
          timestamp: new Date(),
          provider: "anthropic",
          model: "claude-sonnet",
          inputTokens: 150,
          outputTokens: 75,
          cost: 0.003,
          category: "explanation",
        },
      ];

      entries.forEach((entry) => costTracker.trackCost(entry));

      const summary = costTracker.getSummary();
      expect(summary.totalCost).toBe(0.005);
      expect(summary.entries.length).toBe(2);
    });

    it("should accumulate costs correctly", () => {
      for (let i = 0; i < 10; i++) {
        costTracker.trackCost({
          timestamp: new Date(),
          provider: "openai",
          model: "gpt-3.5-turbo",
          inputTokens: 100,
          outputTokens: 50,
          cost: 0.001,
          category: "recommendation",
        });
      }

      const summary = costTracker.getSummary();
      expect(summary.totalCost).toBeCloseTo(0.01, 5);
    });
  });

  describe("getSummary", () => {
    beforeEach(() => {
      // Add sample data
      const entries: CostEntry[] = [
        {
          timestamp: new Date(),
          provider: "openai",
          model: "gpt-3.5-turbo",
          inputTokens: 100,
          outputTokens: 50,
          cost: 0.002,
          category: "recommendation",
        },
        {
          timestamp: new Date(),
          provider: "openai",
          model: "gpt-4",
          inputTokens: 100,
          outputTokens: 50,
          cost: 0.02,
          category: "explanation",
        },
        {
          timestamp: new Date(),
          provider: "anthropic",
          model: "claude-sonnet",
          inputTokens: 150,
          outputTokens: 75,
          cost: 0.003,
          category: "recommendation",
        },
      ];
      entries.forEach((entry) => costTracker.trackCost(entry));
    });

    it("should return correct total cost", () => {
      const summary = costTracker.getSummary();
      expect(summary.totalCost).toBeCloseTo(0.025, 5);
    });

    it("should group costs by provider", () => {
      const summary = costTracker.getSummary();
      expect(summary.byProvider.get("openai")).toBeCloseTo(0.022, 5);
      expect(summary.byProvider.get("anthropic")).toBeCloseTo(0.003, 5);
    });

    it("should group costs by category", () => {
      const summary = costTracker.getSummary();
      expect(summary.byCategory.get("recommendation")).toBeCloseTo(0.005, 5);
      expect(summary.byCategory.get("explanation")).toBeCloseTo(0.02, 5);
    });

    it("should filter by date range", () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const summary = costTracker.getSummary(yesterday, tomorrow);
      expect(summary.entries.length).toBe(3);
    });

    it("should exclude entries outside date range", () => {
      const futureStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const futureEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const summary = costTracker.getSummary(futureStart, futureEnd);
      expect(summary.entries.length).toBe(0);
      expect(summary.totalCost).toBe(0);
    });
  });

  describe("budget management", () => {
    it("should set daily budget", () => {
      costTracker.setBudget("daily", 5.0);
      const budget = costTracker.getBudget();
      expect(budget.daily).toBe(5.0);
    });

    it("should set weekly budget", () => {
      costTracker.setBudget("weekly", 30.0);
      const budget = costTracker.getBudget();
      expect(budget.weekly).toBe(30.0);
    });

    it("should set monthly budget", () => {
      costTracker.setBudget("monthly", 100.0);
      const budget = costTracker.getBudget();
      expect(budget.monthly).toBe(100.0);
    });

    it("should not allow negative budgets", () => {
      expect(() => costTracker.setBudget("daily", -10)).toThrow();
    });
  });

  describe("budget enforcement", () => {
    it("should return false when under budget", () => {
      costTracker.setBudget("daily", 10.0);
      costTracker.trackCost({
        timestamp: new Date(),
        provider: "openai",
        model: "gpt-3.5-turbo",
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.002,
        category: "recommendation",
      });

      expect(costTracker.isOverBudget("daily")).toBe(false);
    });

    it("should return true when over budget", () => {
      costTracker.setBudget("daily", 0.001);
      costTracker.trackCost({
        timestamp: new Date(),
        provider: "openai",
        model: "gpt-3.5-turbo",
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.002,
        category: "recommendation",
      });

      expect(costTracker.isOverBudget("daily")).toBe(true);
    });

    it("should check daily budget correctly", () => {
      costTracker.setBudget("daily", 0.01);

      // Add cost from today
      costTracker.trackCost({
        timestamp: new Date(),
        provider: "openai",
        model: "gpt-3.5-turbo",
        inputTokens: 1000,
        outputTokens: 500,
        cost: 0.015,
        category: "recommendation",
      });

      expect(costTracker.isOverBudget("daily")).toBe(true);
    });

    it("should check weekly budget correctly", () => {
      costTracker.setBudget("weekly", 0.05);

      // Add multiple costs
      for (let i = 0; i < 10; i++) {
        costTracker.trackCost({
          timestamp: new Date(),
          provider: "openai",
          model: "gpt-3.5-turbo",
          inputTokens: 100,
          outputTokens: 50,
          cost: 0.01,
          category: "recommendation",
        });
      }

      expect(costTracker.isOverBudget("weekly")).toBe(true);
    });

    it("should check monthly budget correctly", () => {
      costTracker.setBudget("monthly", 1.0);

      // Add large cost
      costTracker.trackCost({
        timestamp: new Date(),
        provider: "openai",
        model: "gpt-4",
        inputTokens: 10000,
        outputTokens: 5000,
        cost: 1.5,
        category: "recommendation",
      });

      expect(costTracker.isOverBudget("monthly")).toBe(true);
    });
  });

  describe("budget threshold warnings", () => {
    it("should warn when approaching budget limit", () => {
      costTracker.setBudget("daily", 1.0);
      costTracker.trackCost({
        timestamp: new Date(),
        provider: "openai",
        model: "gpt-3.5-turbo",
        inputTokens: 1000,
        outputTokens: 500,
        cost: 0.85, // 85% of budget
        category: "recommendation",
      });

      expect(costTracker.isApproachingBudget("daily", 0.8)).toBe(true);
    });

    it("should not warn when well under budget", () => {
      costTracker.setBudget("daily", 10.0);
      costTracker.trackCost({
        timestamp: new Date(),
        provider: "openai",
        model: "gpt-3.5-turbo",
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.002,
        category: "recommendation",
      });

      expect(costTracker.isApproachingBudget("daily", 0.8)).toBe(false);
    });
  });

  describe("reset", () => {
    it("should clear all tracked costs", () => {
      costTracker.trackCost({
        timestamp: new Date(),
        provider: "openai",
        model: "gpt-3.5-turbo",
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.002,
        category: "recommendation",
      });

      costTracker.reset();

      const summary = costTracker.getSummary();
      expect(summary.totalCost).toBe(0);
      expect(summary.entries.length).toBe(0);
    });

    it("should preserve budget settings after reset", () => {
      costTracker.setBudget("daily", 5.0);
      costTracker.setBudget("weekly", 30.0);
      costTracker.setBudget("monthly", 100.0);

      costTracker.reset();

      const budget = costTracker.getBudget();
      expect(budget.daily).toBe(5.0);
      expect(budget.weekly).toBe(30.0);
      expect(budget.monthly).toBe(100.0);
    });
  });
});
