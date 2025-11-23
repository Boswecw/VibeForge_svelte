/**
 * Model Router Types
 * Intelligent model selection based on task complexity, cost, and performance
 */

import type { LLMProvider } from "../llm/types";

/**
 * Task complexity levels
 */
export type TaskComplexity = "simple" | "medium" | "complex" | "expert";

/**
 * Task categories for complexity analysis
 */
export type TaskCategory =
  | "stack_recommendation"
  | "code_analysis"
  | "explanation"
  | "validation"
  | "generation"
  | "reasoning";

/**
 * Model selection criteria
 */
export interface ModelSelectionCriteria {
  // Task characteristics
  taskComplexity: TaskComplexity;
  taskCategory: TaskCategory;

  // Requirements
  requiresReasoning: boolean;
  requiresCreativity: boolean;
  requiresAccuracy: boolean;

  // Constraints
  maxCostPerRequest?: number; // in USD
  maxLatencyMs?: number; // max acceptable latency

  // Context
  promptTokens: number;
  expectedOutputTokens: number;

  // Preferences
  preferredProvider?: LLMProvider;
  avoidProviders?: LLMProvider[];
}

/**
 * Task complexity factors
 */
export interface ComplexityFactors {
  promptLength: number; // token count
  reasoningDepth: number; // 0-10 scale
  domainComplexity: number; // 0-10 scale
  outputStructure: "simple" | "structured" | "complex";
  requiresMultiStep: boolean;
  contextSize: number; // tokens
}

/**
 * Model capability profile
 */
export interface ModelCapabilities {
  modelId: string;
  provider: LLMProvider;
  displayName: string;

  // Performance characteristics
  maxTokens: number;
  avgResponseTimeMs: number;

  // Capabilities
  reasoningScore: number; // 0-10
  creativityScore: number; // 0-10
  accuracyScore: number; // 0-10

  // Cost (per 1M tokens)
  inputCostPer1M: number; // USD
  outputCostPer1M: number; // USD

  // Recommended usage
  bestFor: TaskComplexity[];
  goodFor: TaskCategory[];
}

/**
 * Model selection result
 */
export interface ModelSelection {
  modelId: string;
  provider: LLMProvider;
  reasoning: string;
  confidence: number; // 0-1

  // Estimates
  estimatedCost: number; // USD
  estimatedLatencyMs: number;

  // Alternatives
  alternativeModels: Array<{
    modelId: string;
    provider: LLMProvider;
    score: number;
    reason: string;
  }>;
}

/**
 * Cost tracking entry
 */
export interface CostEntry {
  id: string;
  timestamp: Date;

  // Model info
  modelId: string;
  provider: LLMProvider;

  // Usage
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  // Cost
  inputCost: number; // USD
  outputCost: number; // USD
  totalCost: number; // USD

  // Context
  taskCategory: TaskCategory;
  sessionId?: string;
  userId?: string;
}

/**
 * Cost budget
 */
export interface CostBudget {
  // Limits
  dailyLimit?: number; // USD
  weeklyLimit?: number;
  monthlyLimit?: number;

  // Current usage
  dailySpent: number;
  weeklySpent: number;
  monthlySpent: number;

  // Warnings
  warningThreshold: number; // 0-1 (e.g., 0.8 = 80%)

  // Reset dates
  dailyResetAt: Date;
  weeklyResetAt: Date;
  monthlyResetAt: Date;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  modelId: string;
  provider: LLMProvider;

  // Response metrics
  avgResponseTimeMs: number;
  p50ResponseTimeMs: number;
  p95ResponseTimeMs: number;
  p99ResponseTimeMs: number;

  // Token efficiency
  avgTokensPerRequest: number;
  avgCostPerRequest: number;

  // Quality metrics
  recommendationAcceptanceRate: number; // 0-1
  userSatisfactionScore: number; // 0-5
  errorRate: number; // 0-1

  // Usage stats
  totalRequests: number;
  totalTokens: number;
  totalCost: number;

  // Time period
  periodStart: Date;
  periodEnd: Date;
}

/**
 * A/B test configuration
 */
export interface ABTestConfig {
  id: string;
  name: string;
  description: string;

  // Models to test
  modelA: {
    modelId: string;
    provider: LLMProvider;
  };
  modelB: {
    modelId: string;
    provider: LLMProvider;
  };

  // Test parameters
  splitRatio: number; // 0-1 (e.g., 0.5 = 50/50 split)
  taskCategory?: TaskCategory; // test specific category

  // Status
  isActive: boolean;
  startDate: Date;
  endDate?: Date;

  // Results
  resultsA: PerformanceMetrics;
  resultsB: PerformanceMetrics;
}

/**
 * Model usage session
 */
export interface ModelUsageSession {
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;

  // Usage
  requests: CostEntry[];
  totalCost: number;
  totalTokens: number;

  // Context
  wizardStep?: number;
  projectType?: string;
}

/**
 * Model routing strategy
 */
export type RoutingStrategy =
  | "cost-optimized" // Minimize cost
  | "performance-optimized" // Minimize latency
  | "quality-optimized" // Maximize quality
  | "balanced" // Balance all factors
  | "custom"; // Custom scoring function

/**
 * Router configuration
 */
export interface RouterConfig {
  strategy: RoutingStrategy;

  // Budget constraints
  budget?: CostBudget;

  // Performance requirements
  maxLatencyMs?: number;
  minQualityScore?: number;

  // Fallback behavior
  enableFallback: boolean;
  fallbackModel?: {
    modelId: string;
    provider: LLMProvider;
  };

  // Caching
  enableCaching: boolean;
  cacheTTL?: number; // seconds

  // A/B testing
  activeABTests: ABTestConfig[];

  // Custom scoring (for custom strategy)
  customScoreFn?: (
    model: ModelCapabilities,
    criteria: ModelSelectionCriteria
  ) => number;
}

/**
 * Model recommendation with explanation
 */
export interface ModelRecommendation {
  selection: ModelSelection;
  explanation: {
    summary: string;
    factors: Array<{
      factor: string;
      weight: number;
      contribution: number;
      description: string;
    }>;
    tradeoffs: string[];
  };
}

/**
 * Cost alert
 */
export interface CostAlert {
  type: "warning" | "critical" | "limit_reached";
  period: "daily" | "weekly" | "monthly";
  currentSpent: number;
  limit: number;
  percentage: number;
  message: string;
  timestamp: Date;
}

/**
 * Model availability status
 */
export interface ModelAvailability {
  modelId: string;
  provider: LLMProvider;
  isAvailable: boolean;
  lastChecked: Date;
  errorRate: number;
  avgLatencyMs: number;
  status: "healthy" | "degraded" | "unavailable";
}

/**
 * Default model capabilities
 */
export const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  "gpt-4": {
    modelId: "gpt-4",
    provider: "openai",
    displayName: "GPT-4",
    maxTokens: 8192,
    avgResponseTimeMs: 3000,
    reasoningScore: 10,
    creativityScore: 9,
    accuracyScore: 10,
    inputCostPer1M: 30.0,
    outputCostPer1M: 60.0,
    bestFor: ["complex", "expert"],
    goodFor: ["stack_recommendation", "reasoning", "explanation"],
  },
  "gpt-4o": {
    modelId: "gpt-4o",
    provider: "openai",
    displayName: "GPT-4o",
    maxTokens: 16384,
    avgResponseTimeMs: 2000,
    reasoningScore: 10,
    creativityScore: 9,
    accuracyScore: 10,
    inputCostPer1M: 5.0,
    outputCostPer1M: 15.0,
    bestFor: ["medium", "complex", "expert"],
    goodFor: ["stack_recommendation", "code_analysis", "reasoning"],
  },
  "gpt-3.5-turbo": {
    modelId: "gpt-3.5-turbo",
    provider: "openai",
    displayName: "GPT-3.5 Turbo",
    maxTokens: 4096,
    avgResponseTimeMs: 800,
    reasoningScore: 7,
    creativityScore: 7,
    accuracyScore: 8,
    inputCostPer1M: 0.5,
    outputCostPer1M: 1.5,
    bestFor: ["simple", "medium"],
    goodFor: ["validation", "explanation", "generation"],
  },
  "claude-3-opus": {
    modelId: "claude-3-opus-20240229",
    provider: "anthropic",
    displayName: "Claude 3 Opus",
    maxTokens: 4096,
    avgResponseTimeMs: 2500,
    reasoningScore: 10,
    creativityScore: 10,
    accuracyScore: 10,
    inputCostPer1M: 15.0,
    outputCostPer1M: 75.0,
    bestFor: ["complex", "expert"],
    goodFor: ["stack_recommendation", "reasoning", "code_analysis"],
  },
  "claude-3-sonnet": {
    modelId: "claude-3-sonnet-20240229",
    provider: "anthropic",
    displayName: "Claude 3 Sonnet",
    maxTokens: 4096,
    avgResponseTimeMs: 1500,
    reasoningScore: 9,
    creativityScore: 9,
    accuracyScore: 9,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    bestFor: ["medium", "complex"],
    goodFor: ["stack_recommendation", "explanation", "reasoning"],
  },
  "claude-3-haiku": {
    modelId: "claude-3-haiku-20240307",
    provider: "anthropic",
    displayName: "Claude 3 Haiku",
    maxTokens: 4096,
    avgResponseTimeMs: 600,
    reasoningScore: 7,
    creativityScore: 7,
    accuracyScore: 8,
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
    bestFor: ["simple", "medium"],
    goodFor: ["validation", "generation", "explanation"],
  },
  "llama2-13b": {
    modelId: "llama2:13b",
    provider: "ollama",
    displayName: "Llama 2 13B",
    maxTokens: 4096,
    avgResponseTimeMs: 2000,
    reasoningScore: 6,
    creativityScore: 6,
    accuracyScore: 7,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    bestFor: ["simple", "medium"],
    goodFor: ["validation", "generation"],
  },
  "llama2-70b": {
    modelId: "llama2:70b",
    provider: "ollama",
    displayName: "Llama 2 70B",
    maxTokens: 4096,
    avgResponseTimeMs: 5000,
    reasoningScore: 8,
    creativityScore: 7,
    accuracyScore: 8,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    bestFor: ["medium", "complex"],
    goodFor: ["stack_recommendation", "reasoning"],
  },
};

/**
 * Complexity scoring weights
 */
export const COMPLEXITY_WEIGHTS = {
  promptLength: 0.2,
  reasoningDepth: 0.3,
  domainComplexity: 0.25,
  outputStructure: 0.15,
  contextSize: 0.1,
};

/**
 * Task category complexity defaults
 */
export const TASK_CATEGORY_DEFAULTS: Record<
  TaskCategory,
  Partial<ComplexityFactors>
> = {
  stack_recommendation: {
    reasoningDepth: 8,
    domainComplexity: 7,
    outputStructure: "structured",
    requiresMultiStep: true,
  },
  code_analysis: {
    reasoningDepth: 7,
    domainComplexity: 8,
    outputStructure: "complex",
    requiresMultiStep: true,
  },
  explanation: {
    reasoningDepth: 5,
    domainComplexity: 5,
    outputStructure: "simple",
    requiresMultiStep: false,
  },
  validation: {
    reasoningDepth: 3,
    domainComplexity: 4,
    outputStructure: "simple",
    requiresMultiStep: false,
  },
  generation: {
    reasoningDepth: 6,
    domainComplexity: 6,
    outputStructure: "structured",
    requiresMultiStep: false,
  },
  reasoning: {
    reasoningDepth: 9,
    domainComplexity: 7,
    outputStructure: "structured",
    requiresMultiStep: true,
  },
};
