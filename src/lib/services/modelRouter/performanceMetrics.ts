/**
 * Performance Metrics Collector
 * Tracks model performance and enables A/B testing
 */

import type {
  PerformanceMetrics,
  ABTestConfig,
  TaskCategory,
  LLMProvider,
  ModelAvailability,
} from "./types";

interface MetricEntry {
  modelId: string;
  provider: LLMProvider;
  taskCategory: TaskCategory;
  responseTimeMs: number;
  tokens: number;
  cost: number;
  accepted: boolean;
  userRating?: number; // 0-5
  errorOccurred: boolean;
  timestamp: Date;
}

export class PerformanceMetricsCollector {
  private entries: MetricEntry[] = [];
  private abTests: Map<string, ABTestConfig> = new Map();
  private availability: Map<string, ModelAvailability> = new Map();

  /**
   * Record a metric entry
   */
  record(entry: Omit<MetricEntry, "timestamp">): void {
    this.entries.push({
      ...entry,
      timestamp: new Date(),
    });

    // Update availability
    this.updateAvailability(
      entry.modelId,
      entry.provider,
      entry.responseTimeMs,
      entry.errorOccurred
    );
  }

  /**
   * Get performance metrics for a model
   */
  getMetrics(
    modelId: string,
    provider: LLMProvider,
    startDate?: Date,
    endDate?: Date
  ): PerformanceMetrics | null {
    const filtered = this.filterEntries(modelId, provider, startDate, endDate);

    if (filtered.length === 0) return null;

    const responseTimes = filtered
      .map((e) => e.responseTimeMs)
      .sort((a, b) => a - b);
    const totalTokens = filtered.reduce((sum, e) => sum + e.tokens, 0);
    const totalCost = filtered.reduce((sum, e) => sum + e.cost, 0);
    const acceptedCount = filtered.filter((e) => e.accepted).length;
    const ratings = filtered
      .filter((e) => e.userRating !== undefined)
      .map((e) => e.userRating!);
    const errorCount = filtered.filter((e) => e.errorOccurred).length;

    return {
      modelId,
      provider,
      avgResponseTimeMs: this.average(responseTimes),
      p50ResponseTimeMs: this.percentile(responseTimes, 0.5),
      p95ResponseTimeMs: this.percentile(responseTimes, 0.95),
      p99ResponseTimeMs: this.percentile(responseTimes, 0.99),
      avgTokensPerRequest: totalTokens / filtered.length,
      avgCostPerRequest: totalCost / filtered.length,
      recommendationAcceptanceRate: acceptedCount / filtered.length,
      userSatisfactionScore: ratings.length > 0 ? this.average(ratings) : 0,
      errorRate: errorCount / filtered.length,
      totalRequests: filtered.length,
      totalTokens,
      totalCost,
      periodStart: startDate || filtered[0].timestamp,
      periodEnd: endDate || filtered[filtered.length - 1].timestamp,
    };
  }

  /**
   * Get metrics by task category
   */
  getMetricsByCategory(
    taskCategory: TaskCategory,
    startDate?: Date,
    endDate?: Date
  ): Record<string, PerformanceMetrics> {
    const filtered = this.entries.filter((e) => {
      if (e.taskCategory !== taskCategory) return false;
      if (startDate && e.timestamp < startDate) return false;
      if (endDate && e.timestamp > endDate) return false;
      return true;
    });

    // Group by model
    const byModel: Record<string, MetricEntry[]> = {};
    filtered.forEach((entry) => {
      const key = `${entry.provider}:${entry.modelId}`;
      if (!byModel[key]) {
        byModel[key] = [];
      }
      byModel[key].push(entry);
    });

    // Calculate metrics for each model
    const result: Record<string, PerformanceMetrics> = {};
    Object.entries(byModel).forEach(([key, entries]) => {
      const [provider, modelId] = key.split(":");
      const metrics = this.calculateMetrics(
        modelId,
        provider as LLMProvider,
        entries,
        startDate,
        endDate
      );
      result[key] = metrics;
    });

    return result;
  }

  /**
   * Compare two models
   */
  compare(
    modelA: { modelId: string; provider: LLMProvider },
    modelB: { modelId: string; provider: LLMProvider },
    startDate?: Date,
    endDate?: Date
  ): {
    modelA: PerformanceMetrics | null;
    modelB: PerformanceMetrics | null;
    winner: "A" | "B" | "tie" | null;
    reasons: string[];
  } {
    const metricsA = this.getMetrics(
      modelA.modelId,
      modelA.provider,
      startDate,
      endDate
    );
    const metricsB = this.getMetrics(
      modelB.modelId,
      modelB.provider,
      startDate,
      endDate
    );

    if (!metricsA || !metricsB) {
      return {
        modelA: metricsA,
        modelB: metricsB,
        winner: null,
        reasons: ["Insufficient data for comparison"],
      };
    }

    // Score each model
    const scoreA = this.calculateComparisonScore(metricsA);
    const scoreB = this.calculateComparisonScore(metricsB);

    const reasons: string[] = [];
    let winner: "A" | "B" | "tie" = "tie";

    if (Math.abs(scoreA - scoreB) < 0.05) {
      winner = "tie";
      reasons.push("Models perform similarly overall");
    } else if (scoreA > scoreB) {
      winner = "A";
      if (metricsA.avgResponseTimeMs < metricsB.avgResponseTimeMs) {
        reasons.push(
          `Model A is ${Math.round(((metricsB.avgResponseTimeMs - metricsA.avgResponseTimeMs) / metricsB.avgResponseTimeMs) * 100)}% faster`
        );
      }
      if (
        metricsA.recommendationAcceptanceRate >
        metricsB.recommendationAcceptanceRate
      ) {
        reasons.push(
          `Model A has ${Math.round((metricsA.recommendationAcceptanceRate - metricsB.recommendationAcceptanceRate) * 100)}% higher acceptance rate`
        );
      }
      if (metricsA.avgCostPerRequest < metricsB.avgCostPerRequest) {
        reasons.push(
          `Model A is ${Math.round(((metricsB.avgCostPerRequest - metricsA.avgCostPerRequest) / metricsB.avgCostPerRequest) * 100)}% cheaper`
        );
      }
    } else {
      winner = "B";
      if (metricsB.avgResponseTimeMs < metricsA.avgResponseTimeMs) {
        reasons.push(
          `Model B is ${Math.round(((metricsA.avgResponseTimeMs - metricsB.avgResponseTimeMs) / metricsA.avgResponseTimeMs) * 100)}% faster`
        );
      }
      if (
        metricsB.recommendationAcceptanceRate >
        metricsA.recommendationAcceptanceRate
      ) {
        reasons.push(
          `Model B has ${Math.round((metricsB.recommendationAcceptanceRate - metricsA.recommendationAcceptanceRate) * 100)}% higher acceptance rate`
        );
      }
      if (metricsB.avgCostPerRequest < metricsA.avgCostPerRequest) {
        reasons.push(
          `Model B is ${Math.round(((metricsA.avgCostPerRequest - metricsB.avgCostPerRequest) / metricsA.avgCostPerRequest) * 100)}% cheaper`
        );
      }
    }

    return {
      modelA: metricsA,
      modelB: metricsB,
      winner,
      reasons,
    };
  }

  /**
   * Start A/B test
   */
  startABTest(config: ABTestConfig): void {
    this.abTests.set(config.id, {
      ...config,
      isActive: true,
      startDate: new Date(),
      resultsA: this.createEmptyMetrics(
        config.modelA.modelId,
        config.modelA.provider
      ),
      resultsB: this.createEmptyMetrics(
        config.modelB.modelId,
        config.modelB.provider
      ),
    });
  }

  /**
   * Stop A/B test
   */
  stopABTest(testId: string): ABTestConfig | null {
    const test = this.abTests.get(testId);
    if (!test) return null;

    test.isActive = false;
    test.endDate = new Date();

    // Calculate final results
    test.resultsA =
      this.getMetrics(
        test.modelA.modelId,
        test.modelA.provider,
        test.startDate,
        test.endDate
      ) || test.resultsA;

    test.resultsB =
      this.getMetrics(
        test.modelB.modelId,
        test.modelB.provider,
        test.startDate,
        test.endDate
      ) || test.resultsB;

    return test;
  }

  /**
   * Get A/B test results
   */
  getABTest(testId: string): ABTestConfig | null {
    return this.abTests.get(testId) || null;
  }

  /**
   * Get all A/B tests
   */
  getAllABTests(): ABTestConfig[] {
    return Array.from(this.abTests.values());
  }

  /**
   * Select model for A/B test (random split)
   */
  selectForABTest(
    testId: string
  ): { modelId: string; provider: LLMProvider } | null {
    const test = this.abTests.get(testId);
    if (!test || !test.isActive) return null;

    // Random selection based on split ratio
    return Math.random() < test.splitRatio ? test.modelA : test.modelB;
  }

  /**
   * Get model availability
   */
  getAvailability(
    modelId: string,
    provider: LLMProvider
  ): ModelAvailability | null {
    const key = `${provider}:${modelId}`;
    return this.availability.get(key) || null;
  }

  /**
   * Get all model availabilities
   */
  getAllAvailabilities(): ModelAvailability[] {
    return Array.from(this.availability.values());
  }

  /**
   * Update model availability
   */
  private updateAvailability(
    modelId: string,
    provider: LLMProvider,
    responseTime: number,
    errorOccurred: boolean
  ): void {
    const key = `${provider}:${modelId}`;
    let availability = this.availability.get(key);

    if (!availability) {
      availability = {
        modelId,
        provider,
        isAvailable: true,
        lastChecked: new Date(),
        errorRate: 0,
        avgLatencyMs: responseTime,
        status: "healthy",
      };
      this.availability.set(key, availability);
    }

    // Update metrics (exponential moving average)
    const alpha = 0.2; // smoothing factor
    availability.avgLatencyMs =
      alpha * responseTime + (1 - alpha) * availability.avgLatencyMs;
    availability.errorRate =
      alpha * (errorOccurred ? 1 : 0) + (1 - alpha) * availability.errorRate;
    availability.lastChecked = new Date();

    // Update status
    if (availability.errorRate > 0.5) {
      availability.status = "unavailable";
      availability.isAvailable = false;
    } else if (
      availability.errorRate > 0.2 ||
      availability.avgLatencyMs > 10000
    ) {
      availability.status = "degraded";
      availability.isAvailable = true;
    } else {
      availability.status = "healthy";
      availability.isAvailable = true;
    }
  }

  /**
   * Calculate comparison score (0-1)
   */
  private calculateComparisonScore(metrics: PerformanceMetrics): number {
    // Weighted scoring
    const acceptanceWeight = 0.4;
    const speedWeight = 0.3;
    const costWeight = 0.2;
    const satisfactionWeight = 0.1;

    const acceptanceScore = metrics.recommendationAcceptanceRate;
    const speedScore = Math.max(0, 1 - metrics.avgResponseTimeMs / 10000); // normalize to 0-1
    const costScore = Math.max(0, 1 - metrics.avgCostPerRequest / 0.1); // normalize to 0-1
    const satisfactionScore = metrics.userSatisfactionScore / 5;

    return (
      acceptanceScore * acceptanceWeight +
      speedScore * speedWeight +
      costScore * costWeight +
      satisfactionScore * satisfactionWeight
    );
  }

  /**
   * Calculate metrics from entries
   */
  private calculateMetrics(
    modelId: string,
    provider: LLMProvider,
    entries: MetricEntry[],
    startDate?: Date,
    endDate?: Date
  ): PerformanceMetrics {
    const responseTimes = entries
      .map((e) => e.responseTimeMs)
      .sort((a, b) => a - b);
    const totalTokens = entries.reduce((sum, e) => sum + e.tokens, 0);
    const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);
    const acceptedCount = entries.filter((e) => e.accepted).length;
    const ratings = entries
      .filter((e) => e.userRating !== undefined)
      .map((e) => e.userRating!);
    const errorCount = entries.filter((e) => e.errorOccurred).length;

    return {
      modelId,
      provider,
      avgResponseTimeMs: this.average(responseTimes),
      p50ResponseTimeMs: this.percentile(responseTimes, 0.5),
      p95ResponseTimeMs: this.percentile(responseTimes, 0.95),
      p99ResponseTimeMs: this.percentile(responseTimes, 0.99),
      avgTokensPerRequest: totalTokens / entries.length,
      avgCostPerRequest: totalCost / entries.length,
      recommendationAcceptanceRate: acceptedCount / entries.length,
      userSatisfactionScore: ratings.length > 0 ? this.average(ratings) : 0,
      errorRate: errorCount / entries.length,
      totalRequests: entries.length,
      totalTokens,
      totalCost,
      periodStart: startDate || entries[0].timestamp,
      periodEnd: endDate || entries[entries.length - 1].timestamp,
    };
  }

  /**
   * Filter entries
   */
  private filterEntries(
    modelId: string,
    provider: LLMProvider,
    startDate?: Date,
    endDate?: Date
  ): MetricEntry[] {
    return this.entries.filter((e) => {
      if (e.modelId !== modelId || e.provider !== provider) return false;
      if (startDate && e.timestamp < startDate) return false;
      if (endDate && e.timestamp > endDate) return false;
      return true;
    });
  }

  /**
   * Create empty metrics
   */
  private createEmptyMetrics(
    modelId: string,
    provider: LLMProvider
  ): PerformanceMetrics {
    const now = new Date();
    return {
      modelId,
      provider,
      avgResponseTimeMs: 0,
      p50ResponseTimeMs: 0,
      p95ResponseTimeMs: 0,
      p99ResponseTimeMs: 0,
      avgTokensPerRequest: 0,
      avgCostPerRequest: 0,
      recommendationAcceptanceRate: 0,
      userSatisfactionScore: 0,
      errorRate: 0,
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      periodStart: now,
      periodEnd: now,
    };
  }

  /**
   * Calculate average
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil(sortedValues.length * p) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.entries = [];
    this.abTests.clear();
    this.availability.clear();
  }
}

/**
 * Singleton instance
 */
export const performanceMetrics = new PerformanceMetricsCollector();
