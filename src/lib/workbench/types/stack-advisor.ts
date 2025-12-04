/**
 * Stack Advisor Type Definitions
 * Phase 3.5: Enhanced Stack Advisor
 *
 * Provides intelligent stack recommendations with weighted scoring,
 * historical success analysis, and explainable AI features.
 */

import type { StackProfile } from '$lib/core/types/stack-profiles';
import type { PatternAnalytics } from '$lib/types/outcome';

// Type alias for compatibility
export type TechStack = StackProfile;

/**
 * Confidence level for stack recommendations
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Scoring weights for stack recommendation algorithm
 */
export interface ScoringWeights {
  /** Base profile match (pattern type, project requirements) */
  profileMatch: number; // 0.3

  /** Language preference alignment */
  languageMatch: number; // 0.2

  /** Historical success rate of this stack */
  historicalSuccess: number; // 0.25

  /** User's past preferences and choices */
  userPreference: number; // 0.15

  /** Project type compatibility */
  projectTypeMatch: number; // 0.1
}

/**
 * Default scoring weights
 */
export const DEFAULT_WEIGHTS: ScoringWeights = {
  profileMatch: 0.3,
  languageMatch: 0.2,
  historicalSuccess: 0.25,
  userPreference: 0.15,
  projectTypeMatch: 0.1,
};

/**
 * Individual score components for a stack recommendation
 */
export interface ScoreComponents {
  /** Base profile match score (0-100) */
  profileScore: number;

  /** Language match bonus (0-100) */
  languageBonus: number;

  /** Historical success rate (0-100) */
  historicalScore: number;

  /** User preference alignment (0-100) */
  preferenceScore: number;

  /** Project type match (0-100) */
  projectTypeScore: number;
}

/**
 * Complete stack score with breakdown
 */
export interface StackScore {
  /** Stack identifier */
  stackId: string;

  /** Final weighted score (0-100) */
  finalScore: number;

  /** Individual component scores */
  components: ScoreComponents;

  /** Confidence level in this recommendation */
  confidence: ConfidenceLevel;

  /** Reasons for the confidence level */
  confidenceReasons: string[];

  /** Calculated at timestamp */
  calculatedAt: string;
}

/**
 * Explanation factor for why a stack was recommended
 */
export interface ExplanationFactor {
  /** Factor identifier */
  id: string;

  /** Display label */
  label: string;

  /** Detailed explanation */
  description: string;

  /** Impact level (high/medium/low) */
  impact: 'high' | 'medium' | 'low';

  /** Positive or negative factor */
  sentiment: 'positive' | 'negative' | 'neutral';

  /** Numeric contribution to score */
  scoreContribution: number;
}

/**
 * Complete explanation for a stack recommendation
 */
export interface RecommendationExplanation {
  /** Stack identifier */
  stackId: string;

  /** Primary reason (1 sentence summary) */
  primaryReason: string;

  /** Detailed factors contributing to recommendation */
  factors: ExplanationFactor[];

  /** Pros of this stack */
  pros: string[];

  /** Cons or considerations */
  cons: string[];

  /** Success stories (from historical data) */
  successStories?: {
    patternName: string;
    successRate: number;
    projectCount: number;
  }[];

  /** Alternative stacks to consider */
  alternatives?: {
    stackId: string;
    reason: string;
  }[];
}

/**
 * Historical success data for a stack/pattern combination
 */
export interface StackHistoricalData {
  /** Stack identifier */
  stackId: string;

  /** Pattern identifier (optional - can be aggregated across patterns) */
  patternId?: string;

  /** Total projects using this stack */
  totalProjects: number;

  /** Projects with successful builds */
  successfulBuilds: number;

  /** Average test pass rate (0-100) */
  avgTestPassRate: number;

  /** Average user satisfaction (1-5) */
  avgSatisfaction: number;

  /** NPS score (likelihood to reuse, 1-10) */
  npsScore: number;

  /** Projects that were deployed */
  deployedProjects: number;

  /** Average time to first successful build (minutes) */
  avgTimeToFirstBuild: number | null;

  /** Common positive aspects mentioned in feedback */
  commonPros: string[];

  /** Common negative aspects mentioned in feedback */
  commonCons: string[];

  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * User preference data learned from past choices
 */
export interface UserPreferences {
  /** User identifier */
  userId: string;

  /** Preferred languages (ranked by frequency) */
  preferredLanguages: {
    language: string;
    usageCount: number;
    averageSatisfaction: number;
  }[];

  /** Preferred patterns (ranked by frequency) */
  preferredPatterns: {
    patternId: string;
    patternName: string;
    usageCount: number;
    averageSatisfaction: number;
  }[];

  /** Preferred frameworks/libraries */
  preferredFrameworks: {
    framework: string;
    usageCount: number;
    averageSatisfaction: number;
  }[];

  /** Typical project complexity preference */
  complexityPreference: 'simple' | 'intermediate' | 'complex' | 'unknown';

  /** Deployment preferences */
  deploymentPreference: 'local' | 'staging' | 'production' | 'unknown';

  /** Last calculated timestamp */
  lastCalculated: string;
}

/**
 * Request to calculate stack scores
 */
export interface CalculateScoresRequest {
  /** Available stacks to score */
  stacks: TechStack[];

  /** Selected pattern ID */
  patternId: string;

  /** Pattern name */
  patternName: string;

  /** Project type (if specified) */
  projectType?: string;

  /** User ID (for preference learning) */
  userId?: string;

  /** Custom scoring weights (optional) */
  weights?: Partial<ScoringWeights>;

  /** Include explanations in response */
  includeExplanations?: boolean;
}

/**
 * Response with scored stack recommendations
 */
export interface StackRecommendationResponse {
  /** Scored stacks (sorted by finalScore descending) */
  recommendations: {
    stack: TechStack;
    score: StackScore;
    explanation?: RecommendationExplanation;
  }[];

  /** Historical data used for scoring */
  historicalData: Map<string, StackHistoricalData>;

  /** User preferences applied */
  userPreferences?: UserPreferences;

  /** Weights used for calculation */
  weightsUsed: ScoringWeights;

  /** Total stacks evaluated */
  totalEvaluated: number;

  /** Calculation timestamp */
  calculatedAt: string;
}

/**
 * Analytics integration - maps PatternAnalytics to StackHistoricalData
 */
export function mapPatternAnalyticsToHistoricalData(
  analytics: PatternAnalytics[],
  stackId: string
): StackHistoricalData | null {
  // Find analytics for patterns that use this stack
  // This is a placeholder - actual implementation will need to know which patterns use which stacks
  const relevantAnalytics = analytics.filter(a => {
    // TODO: Add stack-to-pattern mapping logic
    return true; // For now, include all
  });

  if (relevantAnalytics.length === 0) {
    return null;
  }

  // Aggregate data across patterns
  const totalProjects = relevantAnalytics.reduce((sum, a) => sum + (a.totalUses || a.totalProjects || 0), 0);
  const successfulBuilds = relevantAnalytics.reduce((sum, a) => sum + (a.successfulProjects || a.successfulBuilds || 0), 0);
  const avgSatisfaction =
    relevantAnalytics.reduce((sum, a) => sum + (a.averageSatisfaction || 0) * (a.totalUses || a.totalProjects || 0), 0) /
    totalProjects;
  const avgTestPassRate =
    relevantAnalytics.reduce((sum, a) => sum + (a.averageTestPassRate || 0) * (a.totalUses || a.totalProjects || 0), 0) /
    totalProjects;

  return {
    stackId,
    totalProjects,
    successfulBuilds,
    avgTestPassRate,
    avgSatisfaction,
    npsScore: 0, // TODO: Calculate from feedback data
    deployedProjects: 0, // TODO: Calculate from outcome data
    avgTimeToFirstBuild: null,
    commonPros: [],
    commonCons: [],
    lastUpdated: new Date().toISOString(),
  };
}
