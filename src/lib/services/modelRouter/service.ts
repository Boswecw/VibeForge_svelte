/**
 * Model Router Service
 * Intelligent model selection based on task complexity, cost, and performance
 */

import { complexityAnalyzer } from "./complexityAnalyzer";
import { costTracker } from "./costTracker";
import { performanceMetrics } from "./performanceMetrics";
import type {
  ModelSelectionCriteria,
  ModelSelection,
  ModelRecommendation,
  RouterConfig,
  RoutingStrategy,
  TaskComplexity,
  TaskCategory,
  ComplexityFactors,
  ModelCapabilities,
} from "./types";
import { MODEL_CAPABILITIES } from "./types";

export class ModelRouter {
  private config: RouterConfig;
  private selectionCache: Map<string, ModelSelection> = new Map();

  constructor(config: Partial<RouterConfig> = {}) {
    this.config = {
      strategy: config.strategy || "balanced",
      budget: config.budget,
      maxLatencyMs: config.maxLatencyMs,
      minQualityScore: config.minQualityScore,
      enableFallback: config.enableFallback ?? true,
      fallbackModel: config.fallbackModel || {
        modelId: "gpt-3.5-turbo",
        provider: "openai",
      },
      enableCaching: config.enableCaching ?? true,
      cacheTTL: config.cacheTTL || 3600, // 1 hour default
      activeABTests: config.activeABTests || [],
      customScoreFn: config.customScoreFn,
    };
  }

  /**
   * Select the best model for a task
   */
  async selectModel(criteria: ModelSelectionCriteria): Promise<ModelSelection> {
    // Check cache
    if (this.config.enableCaching) {
      const cacheKey = this.getCacheKey(criteria);
      const cached = this.selectionCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Check for active A/B tests
    const abTestModel = this.checkABTests(criteria.taskCategory);
    if (abTestModel) {
      const selection = this.createSelection(
        abTestModel.modelId,
        abTestModel.provider,
        criteria,
        "A/B Test"
      );
      return selection;
    }

    // Get available models
    const availableModels = this.getAvailableModels(criteria);

    if (availableModels.length === 0) {
      // Use fallback
      if (this.config.enableFallback && this.config.fallbackModel) {
        return this.createSelection(
          this.config.fallbackModel.modelId,
          this.config.fallbackModel.provider,
          criteria,
          "Fallback (no models available)"
        );
      }
      throw new Error("No models available");
    }

    // Score models based on strategy
    const scored = availableModels.map((model) => ({
      model,
      score: this.scoreModel(model, criteria),
    }));

    // Sort by score (descending)
    scored.sort((a, b) => b.score - a.score);

    // Select top model
    const best = scored[0];
    const alternatives = scored.slice(1, 4).map((s) => ({
      modelId: s.model.modelId,
      provider: s.model.provider,
      score: s.score,
      reason: this.getReasonForScore(s.model, criteria, s.score),
    }));

    const selection: ModelSelection = {
      modelId: best.model.modelId,
      provider: best.model.provider,
      reasoning: this.getReasonForScore(best.model, criteria, best.score),
      confidence: best.score,
      estimatedCost: this.estimateCost(best.model, criteria),
      estimatedLatencyMs: best.model.avgResponseTimeMs,
      alternativeModels: alternatives,
    };

    // Cache result
    if (this.config.enableCaching) {
      const cacheKey = this.getCacheKey(criteria);
      this.selectionCache.set(cacheKey, selection);
      // Clear cache after TTL
      setTimeout(() => {
        this.selectionCache.delete(cacheKey);
      }, this.config.cacheTTL! * 1000);
    }

    return selection;
  }

  /**
   * Select model with detailed explanation
   */
  async selectWithExplanation(
    criteria: ModelSelectionCriteria
  ): Promise<ModelRecommendation> {
    const selection = await this.selectModel(criteria);

    // Build explanation
    const factors: Array<{
      factor: string;
      weight: number;
      contribution: number;
      description: string;
    }> = [];

    const model = MODEL_CAPABILITIES[selection.modelId];

    // Complexity factor
    const complexityMatch = this.getComplexityMatch(
      model,
      criteria.taskComplexity
    );
    factors.push({
      factor: "Task Complexity Match",
      weight: 0.3,
      contribution: complexityMatch * 0.3,
      description: `Task is ${criteria.taskComplexity}, model is best for ${model.bestFor.join(", ")}`,
    });

    // Cost factor
    const costScore = this.getCostScore(model, criteria);
    factors.push({
      factor: "Cost Efficiency",
      weight: 0.2,
      contribution: costScore * 0.2,
      description: `Estimated cost: $${this.estimateCost(model, criteria).toFixed(4)} per request`,
    });

    // Performance factor
    const perfScore = this.getPerformanceScore(model);
    factors.push({
      factor: "Historical Performance",
      weight: 0.25,
      contribution: perfScore * 0.25,
      description: `Avg response time: ${model.avgResponseTimeMs}ms, acceptance rate from history`,
    });

    // Quality factor
    const qualityScore = this.getQualityScore(model, criteria);
    factors.push({
      factor: "Quality Requirements",
      weight: 0.25,
      contribution: qualityScore * 0.25,
      description: `Reasoning: ${model.reasoningScore}/10, Accuracy: ${model.accuracyScore}/10`,
    });

    // Tradeoffs
    const tradeoffs: string[] = [];
    if (selection.alternativeModels.length > 0) {
      const cheaperAlternative = selection.alternativeModels.find((alt) => {
        const altModel = MODEL_CAPABILITIES[alt.modelId];
        return (
          altModel &&
          this.estimateCost(altModel, criteria) < selection.estimatedCost
        );
      });
      if (cheaperAlternative) {
        tradeoffs.push(
          `${cheaperAlternative.modelId} is cheaper but may have lower quality`
        );
      }

      const fasterAlternative = selection.alternativeModels.find((alt) => {
        const altModel = MODEL_CAPABILITIES[alt.modelId];
        return altModel && altModel.avgResponseTimeMs < model.avgResponseTimeMs;
      });
      if (fasterAlternative) {
        tradeoffs.push(
          `${fasterAlternative.modelId} is faster but may be less accurate`
        );
      }
    }

    return {
      selection,
      explanation: {
        summary: `Selected ${selection.modelId} based on ${this.config.strategy} strategy. Confidence: ${Math.round(selection.confidence * 100)}%`,
        factors,
        tradeoffs,
      },
    };
  }

  /**
   * Track usage after model execution
   */
  trackUsage(
    modelId: string,
    provider: LLMProvider,
    taskCategory: TaskCategory,
    promptTokens: number,
    completionTokens: number,
    responseTimeMs: number,
    accepted: boolean,
    errorOccurred: boolean = false
  ): void {
    const totalTokens = promptTokens + completionTokens;

    // Track cost
    const costEntry = costTracker.track({
      modelId,
      provider,
      promptTokens,
      completionTokens,
      totalTokens,
      taskCategory,
    });

    // Track performance
    performanceMetrics.record({
      modelId,
      provider,
      taskCategory,
      responseTimeMs,
      tokens: totalTokens,
      cost: costEntry.totalCost,
      accepted,
      errorOccurred,
    });
  }

  /**
   * Get available models based on criteria
   */
  private getAvailableModels(
    criteria: ModelSelectionCriteria
  ): ModelCapabilities[] {
    const allModels = Object.values(MODEL_CAPABILITIES);

    return allModels.filter((model) => {
      // Filter by preferred/avoided providers
      if (
        criteria.preferredProvider &&
        model.provider !== criteria.preferredProvider
      ) {
        return false;
      }
      if (criteria.avoidProviders?.includes(model.provider)) {
        return false;
      }

      // Filter by budget constraint
      if (criteria.maxCostPerRequest !== undefined) {
        const estimatedCost = this.estimateCost(model, criteria);
        if (estimatedCost > criteria.maxCostPerRequest) {
          return false;
        }
      }

      // Filter by latency constraint
      if (criteria.maxLatencyMs !== undefined) {
        if (model.avgResponseTimeMs > criteria.maxLatencyMs) {
          return false;
        }
      }

      // Check budget limits
      if (this.config.budget) {
        const budget = costTracker.getBudget();
        if (budget) {
          if (budget.dailyLimit && budget.dailySpent >= budget.dailyLimit)
            return false;
          if (budget.weeklyLimit && budget.weeklySpent >= budget.weeklyLimit)
            return false;
          if (budget.monthlyLimit && budget.monthlySpent >= budget.monthlyLimit)
            return false;
        }
      }

      // Check availability
      const availability = performanceMetrics.getAvailability(
        model.modelId,
        model.provider
      );
      if (availability && !availability.isAvailable) {
        return false;
      }

      return true;
    });
  }

  /**
   * Score a model based on routing strategy
   */
  private scoreModel(
    model: ModelCapabilities,
    criteria: ModelSelectionCriteria
  ): number {
    switch (this.config.strategy) {
      case "cost-optimized":
        return this.scoreCostOptimized(model, criteria);
      case "performance-optimized":
        return this.scorePerformanceOptimized(model, criteria);
      case "quality-optimized":
        return this.scoreQualityOptimized(model, criteria);
      case "balanced":
        return this.scoreBalanced(model, criteria);
      case "custom":
        return this.config.customScoreFn
          ? this.config.customScoreFn(model, criteria)
          : this.scoreBalanced(model, criteria);
      default:
        return this.scoreBalanced(model, criteria);
    }
  }

  /**
   * Cost-optimized scoring
   */
  private scoreCostOptimized(
    model: ModelCapabilities,
    criteria: ModelSelectionCriteria
  ): number {
    const costScore = 1 - this.estimateCost(model, criteria) / 0.1; // normalize
    const qualityScore = this.getQualityScore(model, criteria);
    return costScore * 0.7 + qualityScore * 0.3;
  }

  /**
   * Performance-optimized scoring
   */
  private scorePerformanceOptimized(
    model: ModelCapabilities,
    criteria: ModelSelectionCriteria
  ): number {
    const speedScore = 1 - model.avgResponseTimeMs / 10000; // normalize
    const qualityScore = this.getQualityScore(model, criteria);
    return speedScore * 0.7 + qualityScore * 0.3;
  }

  /**
   * Quality-optimized scoring
   */
  private scoreQualityOptimized(
    model: ModelCapabilities,
    criteria: ModelSelectionCriteria
  ): number {
    return this.getQualityScore(model, criteria);
  }

  /**
   * Balanced scoring
   */
  private scoreBalanced(
    model: ModelCapabilities,
    criteria: ModelSelectionCriteria
  ): number {
    const complexityMatch = this.getComplexityMatch(
      model,
      criteria.taskComplexity
    );
    const costScore = this.getCostScore(model, criteria);
    const perfScore = this.getPerformanceScore(model);
    const qualityScore = this.getQualityScore(model, criteria);

    return (
      complexityMatch * 0.3 +
      costScore * 0.2 +
      perfScore * 0.25 +
      qualityScore * 0.25
    );
  }

  /**
   * Get complexity match score
   */
  private getComplexityMatch(
    model: ModelCapabilities,
    complexity: TaskComplexity
  ): number {
    if (model.bestFor.includes(complexity)) return 1.0;

    const complexityOrder: TaskComplexity[] = [
      "simple",
      "medium",
      "complex",
      "expert",
    ];
    const modelLevel = Math.max(
      ...model.bestFor.map((c) => complexityOrder.indexOf(c))
    );
    const taskLevel = complexityOrder.indexOf(complexity);

    const diff = Math.abs(modelLevel - taskLevel);
    return Math.max(0, 1 - diff * 0.3);
  }

  /**
   * Get cost score (lower cost = higher score)
   */
  private getCostScore(
    model: ModelCapabilities,
    criteria: ModelSelectionCriteria
  ): number {
    const estimatedCost = this.estimateCost(model, criteria);
    return Math.max(0, 1 - estimatedCost / 0.1); // normalize to 0-1
  }

  /**
   * Get performance score from historical data
   */
  private getPerformanceScore(model: ModelCapabilities): number {
    const metrics = performanceMetrics.getMetrics(
      model.modelId,
      model.provider
    );
    if (!metrics) return 0.5; // neutral if no data

    const acceptanceScore = metrics.recommendationAcceptanceRate;
    const speedScore = Math.max(0, 1 - metrics.avgResponseTimeMs / 10000);
    const reliabilityScore = 1 - metrics.errorRate;

    return acceptanceScore * 0.5 + speedScore * 0.3 + reliabilityScore * 0.2;
  }

  /**
   * Get quality score based on requirements
   */
  private getQualityScore(
    model: ModelCapabilities,
    criteria: ModelSelectionCriteria
  ): number {
    let score = 0;
    let weight = 0;

    if (criteria.requiresReasoning) {
      score += model.reasoningScore / 10;
      weight += 1;
    }

    if (criteria.requiresCreativity) {
      score += model.creativityScore / 10;
      weight += 1;
    }

    if (criteria.requiresAccuracy) {
      score += model.accuracyScore / 10;
      weight += 1;
    }

    return weight > 0
      ? score / weight
      : (model.reasoningScore + model.accuracyScore) / 20;
  }

  /**
   * Estimate cost for a request
   */
  private estimateCost(
    model: ModelCapabilities,
    criteria: ModelSelectionCriteria
  ): number {
    const inputCost =
      (criteria.promptTokens / 1_000_000) * model.inputCostPer1M;
    const outputCost =
      (criteria.expectedOutputTokens / 1_000_000) * model.outputCostPer1M;
    return inputCost + outputCost;
  }

  /**
   * Get reasoning for model score
   */
  private getReasonForScore(
    model: ModelCapabilities,
    criteria: ModelSelectionCriteria,
    score: number
  ): string {
    const reasons: string[] = [];

    if (model.bestFor.includes(criteria.taskComplexity)) {
      reasons.push(`Optimized for ${criteria.taskComplexity} tasks`);
    }

    if (criteria.requiresReasoning && model.reasoningScore >= 8) {
      reasons.push(
        `Strong reasoning capabilities (${model.reasoningScore}/10)`
      );
    }

    const estimatedCost = this.estimateCost(model, criteria);
    if (estimatedCost < 0.001) {
      reasons.push(
        `Very cost-effective ($${estimatedCost.toFixed(6)} per request)`
      );
    }

    if (model.avgResponseTimeMs < 1000) {
      reasons.push(`Fast response time (~${model.avgResponseTimeMs}ms)`);
    }

    if (reasons.length === 0) {
      reasons.push(
        `Best overall match with ${Math.round(score * 100)}% confidence`
      );
    }

    return reasons.join(". ");
  }

  /**
   * Check for active A/B tests
   */
  private checkABTests(
    taskCategory: TaskCategory
  ): { modelId: string; provider: string } | null {
    for (const testId of this.config.activeABTests.map((t) => t.id)) {
      const test = performanceMetrics.getABTest(testId);
      if (
        test &&
        test.isActive &&
        (!test.taskCategory || test.taskCategory === taskCategory)
      ) {
        const selected = performanceMetrics.selectForABTest(testId);
        if (selected) {
          return selected;
        }
      }
    }
    return null;
  }

  /**
   * Create model selection
   */
  private createSelection(
    modelId: string,
    provider: LLMProvider,
    criteria: ModelSelectionCriteria,
    reasoning: string
  ): ModelSelection {
    const model = MODEL_CAPABILITIES[modelId];
    return {
      modelId,
      provider,
      reasoning,
      confidence: 0.8,
      estimatedCost: model ? this.estimateCost(model, criteria) : 0,
      estimatedLatencyMs: model ? model.avgResponseTimeMs : 0,
      alternativeModels: [],
    };
  }

  /**
   * Get cache key
   */
  private getCacheKey(criteria: ModelSelectionCriteria): string {
    return `${criteria.taskCategory}_${criteria.taskComplexity}_${criteria.promptTokens}_${criteria.preferredProvider || "any"}`;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RouterConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // Clear cache on config change
    this.selectionCache.clear();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.selectionCache.clear();
  }
}

/**
 * Singleton instance with default config
 */
export const modelRouter = new ModelRouter();
