/**
 * Success Prediction Service
 * Phase 3.6: Success Prediction & Analytics Dashboard
 *
 * ML-based project success probability prediction using historical outcome data
 */

import type {
  SuccessPrediction,
  PredictSuccessRequest,
  PredictionFactor,
  SuccessFactorWeights,
  PatternPerformance,
  AnalyticsSummary,
  AnalyticsFilters,
  TrendDataPoint,
} from '$lib/types/success-prediction';
import { DEFAULT_SUCCESS_WEIGHTS, calculatePredictionConfidence } from '$lib/types/success-prediction';
import { projectOutcomesStore } from '$lib/stores/projectOutcomes.svelte';
import { trendDataStore } from '$lib/stores/trendData.svelte';
import { predictionCache } from '$lib/utils/predictionCache';
import type { PatternAnalytics, ProjectOutcome } from '$lib/types/outcome';

/**
 * Success Predictor Class
 * Predicts project success probability based on historical data
 */
export class SuccessPredictor {
  private weights: SuccessFactorWeights;

  constructor(weights: SuccessFactorWeights = DEFAULT_SUCCESS_WEIGHTS) {
    this.weights = weights;
  }

  /**
   * Predict success probability for a project configuration
   */
  async predictSuccess(request: PredictSuccessRequest): Promise<SuccessPrediction> {
    // Check cache first
    const cached = predictionCache.get(request);
    if (cached) {
      return cached;
    }

    // Fetch historical data
    await projectOutcomesStore.fetchAnalytics();
    const analytics = projectOutcomesStore.analytics;

    // Find pattern-specific analytics
    const patternAnalytics = analytics.find((a) => a.patternId === request.patternId);

    // Calculate factor scores
    const factors: PredictionFactor[] = [];

    // Factor 1: Historical Success Rate (35% weight)
    const historicalFactor = this.calculateHistoricalSuccessFactor(patternAnalytics);
    factors.push(historicalFactor);

    // Factor 2: Stack Reliability (25% weight)
    const stackFactor = await this.calculateStackReliabilityFactor(
      request.patternId,
      request.stackId
    );
    factors.push(stackFactor);

    // Factor 3: User Experience (20% weight)
    const experienceFactor = await this.calculateUserExperienceFactor(
      request.userId,
      request.patternId
    );
    factors.push(experienceFactor);

    // Factor 4: Complexity Match (10% weight)
    const complexityFactor = this.calculateComplexityMatchFactor(
      patternAnalytics,
      request.metadata?.complexity
    );
    factors.push(complexityFactor);

    // Factor 5: Test Coverage (5% weight)
    const testFactor = this.calculateTestCoverageFactor(request.metadata?.includesTests);
    factors.push(testFactor);

    // Factor 6: CI/CD Setup (5% weight)
    const cicdFactor = this.calculateCICDFactor(request.metadata?.includesCI);
    factors.push(cicdFactor);

    // Calculate weighted probability
    const probability = factors.reduce((sum, factor) => {
      return sum + factor.value * factor.weight;
    }, 0);

    // Calculate confidence
    const sampleSize = patternAnalytics?.totalProjects || 0;
    const variance = this.calculateFactorVariance(factors);
    const confidence = calculatePredictionConfidence(sampleSize, variance);

    // Generate confidence reasons
    const confidenceReasons = this.generateConfidenceReasons(
      confidence,
      sampleSize,
      variance,
      patternAnalytics
    );

    const prediction: SuccessPrediction = {
      probability: Math.max(0, Math.min(100, probability)),
      confidence,
      factors,
      confidenceReasons,
      sampleSize,
      calculatedAt: new Date().toISOString(),
    };

    // Cache the prediction before returning
    predictionCache.set(request, prediction);

    return prediction;
  }

  /**
   * Calculate historical success factor (0-100)
   */
  private calculateHistoricalSuccessFactor(
    analytics: PatternAnalytics | undefined
  ): PredictionFactor {
    if (!analytics || analytics.totalProjects === 0) {
      return {
        id: 'historical-success',
        name: 'Historical Success Rate',
        description: 'No historical data available for this pattern',
        impact: 0,
        weight: this.weights.historicalSuccess,
        value: 50, // Neutral score
      };
    }

    const successRate = (analytics.successfulBuilds / analytics.totalProjects) * 100;
    const satisfaction = analytics.avgSatisfaction ? ((analytics.avgSatisfaction - 1) / 4) * 100 : 50; // 1-5 → 0-100

    // Weighted average of success metrics
    const value = successRate * 0.7 + satisfaction * 0.3;

    return {
      id: 'historical-success',
      name: 'Historical Success Rate',
      description: `${successRate.toFixed(0)}% success rate across ${analytics.totalProjects} projects`,
      impact: value - 50, // Relative to neutral
      weight: this.weights.historicalSuccess,
      value,
    };
  }

  /**
   * Calculate stack reliability factor (0-100)
   */
  private async calculateStackReliabilityFactor(
    patternId: string,
    stackId?: string
  ): Promise<PredictionFactor> {
    if (!stackId) {
      return {
        id: 'stack-reliability',
        name: 'Stack Reliability',
        description: 'No stack selected yet',
        impact: 0,
        weight: this.weights.stackReliability,
        value: 60, // Slightly positive default
      };
    }

    // TODO: Query stack-specific success data when available
    // For now, use pattern-level data as proxy
    await projectOutcomesStore.fetchAnalytics();
    const analytics = projectOutcomesStore.analytics.find((a) => a.patternId === patternId);

    if (!analytics || analytics.totalProjects === 0) {
      return {
        id: 'stack-reliability',
        name: 'Stack Reliability',
        description: 'Limited data for this stack',
        impact: 0,
        weight: this.weights.stackReliability,
        value: 60,
      };
    }

    const value = (analytics.successfulBuilds / analytics.totalProjects) * 100;

    return {
      id: 'stack-reliability',
      name: 'Stack Reliability',
      description: `Stack has ${value.toFixed(0)}% success rate in similar projects`,
      impact: value - 50,
      weight: this.weights.stackReliability,
      value,
    };
  }

  /**
   * Calculate user experience factor (0-100)
   */
  private async calculateUserExperienceFactor(
    userId: string | undefined,
    patternId: string
  ): Promise<PredictionFactor> {
    if (!userId) {
      return {
        id: 'user-experience',
        name: 'User Experience',
        description: 'New user - no history available',
        impact: 0,
        weight: this.weights.userExperience,
        value: 50, // Neutral for new users
      };
    }

    // Fetch user's past projects
    await projectOutcomesStore.fetchOutcomes(1); // TODO: Filter by userId
    const outcomes = projectOutcomesStore.outcomes;

    if (outcomes.length === 0) {
      return {
        id: 'user-experience',
        name: 'User Experience',
        description: 'First project - starting fresh!',
        impact: 0,
        weight: this.weights.userExperience,
        value: 50,
      };
    }

    // Calculate user's overall success rate
    const successfulBuilds = outcomes.filter(
      (o) => o.lastBuildStatus === 'success'
    ).length;
    const userSuccessRate = (successfulBuilds / outcomes.length) * 100;

    // Bonus if user has experience with this pattern
    const patternExperience = outcomes.filter((o) => o.patternId === patternId);
    const hasPatternExp = patternExperience.length > 0;
    const patternBonus = hasPatternExp ? 10 : 0;

    const value = Math.min(100, userSuccessRate + patternBonus);

    return {
      id: 'user-experience',
      name: 'User Experience',
      description: hasPatternExp
        ? `You've successfully used this pattern ${patternExperience.length} times before`
        : `${userSuccessRate.toFixed(0)}% success rate on ${outcomes.length} past projects`,
      impact: value - 50,
      weight: this.weights.userExperience,
      value,
    };
  }

  /**
   * Calculate complexity match factor (0-100)
   */
  private calculateComplexityMatchFactor(
    analytics: PatternAnalytics | undefined,
    complexity?: 'simple' | 'intermediate' | 'complex'
  ): PredictionFactor {
    if (!complexity || !analytics) {
      return {
        id: 'complexity-match',
        name: 'Complexity Match',
        description: 'Complexity not specified',
        impact: 0,
        weight: this.weights.complexityMatch,
        value: 60,
      };
    }

    // Simple projects have higher success rates
    const complexityScores = {
      simple: 80,
      intermediate: 65,
      complex: 50,
    };

    const value = complexityScores[complexity];

    return {
      id: 'complexity-match',
      name: 'Complexity Match',
      description: `${complexity.charAt(0).toUpperCase() + complexity.slice(1)} projects have ${value}% baseline success`,
      impact: value - 50,
      weight: this.weights.complexityMatch,
      value,
    };
  }

  /**
   * Calculate test coverage factor (0-100)
   */
  private calculateTestCoverageFactor(includesTests?: boolean): PredictionFactor {
    if (includesTests === undefined) {
      return {
        id: 'test-coverage',
        name: 'Test Coverage',
        description: 'Testing setup not specified',
        impact: 0,
        weight: this.weights.testCoverage,
        value: 60,
      };
    }

    const value = includesTests ? 85 : 50;

    return {
      id: 'test-coverage',
      name: 'Test Coverage',
      description: includesTests
        ? 'Projects with tests have 85% higher success'
        : 'Consider adding tests for better reliability',
      impact: value - 50,
      weight: this.weights.testCoverage,
      value,
    };
  }

  /**
   * Calculate CI/CD factor (0-100)
   */
  private calculateCICDFactor(includesCI?: boolean): PredictionFactor {
    if (includesCI === undefined) {
      return {
        id: 'cicd-setup',
        name: 'CI/CD Setup',
        description: 'CI/CD not specified',
        impact: 0,
        weight: this.weights.cicdSetup,
        value: 60,
      };
    }

    const value = includesCI ? 80 : 55;

    return {
      id: 'cicd-setup',
        name: 'CI/CD Setup',
      description: includesCI
        ? 'CI/CD improves deployment success'
        : 'CI/CD can improve reliability',
      impact: value - 50,
      weight: this.weights.cicdSetup,
      value,
    };
  }

  /**
   * Calculate variance across factor scores
   */
  private calculateFactorVariance(factors: PredictionFactor[]): number {
    const values = factors.map((f) => f.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  /**
   * Generate confidence reasons
   */
  private generateConfidenceReasons(
    confidence: 'high' | 'medium' | 'low',
    sampleSize: number,
    variance: number,
    analytics?: PatternAnalytics
  ): string[] {
    const reasons: string[] = [];

    // Sample size reasons
    if (sampleSize >= 20) {
      reasons.push(`Strong data backing with ${sampleSize} similar projects`);
    } else if (sampleSize >= 10) {
      reasons.push(`Moderate data sample (${sampleSize} projects)`);
    } else if (sampleSize > 0) {
      reasons.push(`Limited data (only ${sampleSize} projects)`);
    } else {
      reasons.push('No historical data available');
    }

    // Variance reasons
    if (variance < 100) {
      reasons.push('Consistent success factors across all metrics');
    } else if (variance < 300) {
      reasons.push('Some variation in success factors');
    } else {
      reasons.push('High variance in success metrics');
    }

    // Analytics-based reasons
    if (analytics && analytics.totalProjects > 0) {
      const successRate = (analytics.successfulBuilds / analytics.totalProjects) * 100;
      if (successRate >= 80) {
        reasons.push('Pattern has excellent historical performance');
      } else if (successRate >= 60) {
        reasons.push('Pattern has good historical performance');
      }
    }

    return reasons;
  }

  /**
   * Get pattern performance metrics
   */
  async getPatternPerformance(
    patternId: string,
    filters?: AnalyticsFilters
  ): Promise<PatternPerformance | null> {
    await projectOutcomesStore.fetchAnalytics();
    const analytics = projectOutcomesStore.analytics.find((a) => a.patternId === patternId);

    if (!analytics || analytics.totalProjects === 0) {
      return null;
    }

    const successRate = (analytics.successfulBuilds / analytics.totalProjects) * 100;

    // Fetch real trend data from trendDataStore
    const [successRateTrend, satisfactionTrend, usageTrend] = await Promise.all([
      trendDataStore.fetchSuccessRateTrend(patternId, 30),
      trendDataStore.fetchSatisfactionTrend(patternId, 30),
      trendDataStore.fetchUsageTrend(patternId, 30),
    ]);

    const trends = {
      successRate: successRateTrend,
      satisfaction: satisfactionTrend,
      usage: usageTrend,
    };

    return {
      patternId: analytics.patternId,
      patternName: analytics.patternName,
      totalProjects: analytics.totalProjects,
      successfulProjects: analytics.successfulBuilds,
      successRate,
      averageSatisfaction: analytics.avgSatisfaction || 0,
      averageTestPassRate: 0, // TODO: Add test pass rate tracking to PatternAnalytics
      npsScore: 0, // TODO: Calculate from feedback
      deployedProjects: 0, // TODO: Calculate from outcomes
      averageTimeToFirstBuild: null,
      trends,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(filters?: AnalyticsFilters): Promise<AnalyticsSummary> {
    await projectOutcomesStore.fetchAnalytics();
    await projectOutcomesStore.fetchDashboardSummary();

    const analytics = projectOutcomesStore.analytics;
    const summary = projectOutcomesStore.dashboardSummary;

    const totalProjects = analytics.reduce((sum, a) => sum + a.totalProjects, 0);
    const successfulBuilds = analytics.reduce((sum, a) => sum + a.successfulBuilds, 0);
    const overallSuccessRate = totalProjects > 0 ? (successfulBuilds / totalProjects) * 100 : 0;

    const avgSatisfaction =
      analytics.length > 0
        ? analytics.reduce((sum, a) => sum + (a.avgSatisfaction || 0), 0) / analytics.length
        : 0;

    // Find top pattern by success rate
    const topPattern = analytics.length > 0
      ? analytics.reduce((best, current) => {
          const currentRate = (current.successfulBuilds / current.totalProjects) * 100;
          const bestRate = (best.successfulBuilds / best.totalProjects) * 100;
          return currentRate > bestRate ? current : best;
        })
      : null;

    // Find most used pattern
    const mostUsed = analytics.length > 0
      ? analytics.reduce((most, current) => {
          return current.totalProjects > most.totalProjects ? current : most;
        })
      : null;

    return {
      totalProjects,
      overallSuccessRate,
      averageSatisfaction: avgSatisfaction,
      totalFeedback: summary?.totalProjects || 0,
      netPromoterScore: 0, // TODO: Calculate NPS from feedback
      topPattern: topPattern
        ? {
            id: topPattern.patternId,
            name: topPattern.patternName,
            successRate: (topPattern.successfulBuilds / topPattern.totalProjects) * 100,
          }
        : null,
      mostUsedPattern: mostUsed
        ? {
            id: mostUsed.patternId,
            name: mostUsed.patternName,
            usageCount: mostUsed.totalProjects,
          }
        : null,
      recentTrends: {
        projectCreation: [], // TODO: Implement overall project creation trend
        successRate: [], // TODO: Implement overall success rate trend
      },
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Singleton instance for global use
 */
export const successPredictor = new SuccessPredictor();
