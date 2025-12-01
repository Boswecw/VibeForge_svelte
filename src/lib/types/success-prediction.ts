/**
 * Success Prediction Type Definitions
 * Phase 3.6: Success Prediction & Analytics Dashboard
 *
 * ML-based project success probability prediction using historical outcome data
 */

import type { PatternAnalytics, ProjectOutcome } from './outcome';

/**
 * Confidence level for success predictions
 */
export type PredictionConfidence = 'high' | 'medium' | 'low';

/**
 * Success probability prediction for a project configuration
 */
export interface SuccessPrediction {
  /** Predicted success probability (0-100) */
  probability: number;

  /** Confidence in this prediction */
  confidence: PredictionConfidence;

  /** Factors contributing to this prediction */
  factors: PredictionFactor[];

  /** Reasons for the confidence level */
  confidenceReasons: string[];

  /** Historical data sample size used */
  sampleSize: number;

  /** Calculation timestamp */
  calculatedAt: string;
}

/**
 * Individual factor contributing to success prediction
 */
export interface PredictionFactor {
  /** Factor identifier */
  id: string;

  /** Display name */
  name: string;

  /** Detailed description */
  description: string;

  /** Impact on success probability (-100 to +100) */
  impact: number;

  /** Weight in overall calculation (0-1) */
  weight: number;

  /** Current value/score */
  value: number;
}

/**
 * Success prediction request
 */
export interface PredictSuccessRequest {
  /** Selected pattern ID */
  patternId: string;

  /** Selected stack ID (optional) */
  stackId?: string;

  /** User ID for personalization (optional) */
  userId?: string;

  /** Project metadata for prediction */
  metadata?: {
    /** Primary language */
    primaryLanguage?: string;

    /** Expected complexity */
    complexity?: 'simple' | 'intermediate' | 'complex';

    /** Has test suite */
    includesTests?: boolean;

    /** Has CI/CD */
    includesCI?: boolean;

    /** Deployment target */
    deploymentTarget?: string;
  };
}

/**
 * Trend data point for analytics visualization
 */
export interface TrendDataPoint {
  /** Date/timestamp */
  date: string;

  /** Value at this point */
  value: number;

  /** Label for this point */
  label?: string;
}

/**
 * Pattern performance metrics for analytics
 */
export interface PatternPerformance {
  /** Pattern identifier */
  patternId: string;

  /** Pattern display name */
  patternName: string;

  /** Total projects created */
  totalProjects: number;

  /** Successful projects (build success) */
  successfulProjects: number;

  /** Success rate percentage */
  successRate: number;

  /** Average user satisfaction (1-5) */
  averageSatisfaction: number;

  /** Average test pass rate (0-100) */
  averageTestPassRate: number;

  /** NPS score (1-10) */
  npsScore: number;

  /** Projects deployed to production */
  deployedProjects: number;

  /** Average time to first successful build (minutes) */
  averageTimeToFirstBuild: number | null;

  /** Trend data over time */
  trends: {
    /** Success rate trend */
    successRate: TrendDataPoint[];

    /** Satisfaction trend */
    satisfaction: TrendDataPoint[];

    /** Usage trend */
    usage: TrendDataPoint[];
  };

  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Analytics dashboard summary
 */
export interface AnalyticsSummary {
  /** Total projects tracked */
  totalProjects: number;

  /** Overall success rate */
  overallSuccessRate: number;

  /** Average satisfaction across all projects */
  averageSatisfaction: number;

  /** Total feedback submissions */
  totalFeedback: number;

  /** NPS (Net Promoter Score) */
  netPromoterScore: number;

  /** Top performing pattern */
  topPattern: {
    id: string;
    name: string;
    successRate: number;
  } | null;

  /** Most used pattern */
  mostUsedPattern: {
    id: string;
    name: string;
    usageCount: number;
  } | null;

  /** Recent trends */
  recentTrends: {
    /** Project creation trend (last 30 days) */
    projectCreation: TrendDataPoint[];

    /** Success rate trend (last 30 days) */
    successRate: TrendDataPoint[];
  };

  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Date range filter for analytics
 */
export interface DateRangeFilter {
  /** Start date (ISO string) */
  startDate: string;

  /** End date (ISO string) */
  endDate: string;
}

/**
 * Analytics query filters
 */
export interface AnalyticsFilters {
  /** Date range */
  dateRange?: DateRangeFilter;

  /** Filter by pattern IDs */
  patternIds?: string[];

  /** Filter by status */
  status?: 'active' | 'archived' | 'deleted';

  /** Minimum projects for inclusion */
  minProjects?: number;
}

/**
 * Success factors weights for prediction algorithm
 */
export interface SuccessFactorWeights {
  /** Historical pattern success rate */
  historicalSuccess: number; // 0.35

  /** Stack reliability */
  stackReliability: number; // 0.25

  /** User experience level */
  userExperience: number; // 0.20

  /** Project complexity match */
  complexityMatch: number; // 0.10

  /** Test coverage */
  testCoverage: number; // 0.05

  /** CI/CD setup */
  cicdSetup: number; // 0.05
}

/**
 * Default success factor weights
 */
export const DEFAULT_SUCCESS_WEIGHTS: SuccessFactorWeights = {
  historicalSuccess: 0.35,
  stackReliability: 0.25,
  userExperience: 0.20,
  complexityMatch: 0.10,
  testCoverage: 0.05,
  cicdSetup: 0.05,
};

/**
 * Calculate confidence level based on sample size and consistency
 */
export function calculatePredictionConfidence(
  sampleSize: number,
  variance: number
): PredictionConfidence {
  let score = 0;

  // Sample size contribution
  if (sampleSize >= 20) score += 3;
  else if (sampleSize >= 10) score += 2;
  else if (sampleSize >= 5) score += 1;

  // Variance contribution (lower variance = higher confidence)
  if (variance < 100) score += 2;
  else if (variance < 300) score += 1;

  // Map to confidence level
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

/**
 * Format success probability as percentage string
 */
export function formatProbability(probability: number): string {
  return `${Math.round(probability)}%`;
}

/**
 * Get success probability color class
 */
export function getSuccessProbabilityColor(probability: number): string {
  if (probability >= 75) return 'text-green-500';
  if (probability >= 50) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Get confidence badge class
 */
export function getConfidenceBadgeClass(confidence: PredictionConfidence): string {
  switch (confidence) {
    case 'high':
      return 'bg-green-500/10 text-green-400 border-green-500/30';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    case 'low':
      return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
  }
}
