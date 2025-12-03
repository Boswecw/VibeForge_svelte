/**
 * Intelligent Model Routing Types - Phase 4.3
 * Type definitions for dynamic AI model selection and cost optimization
 */

// ============================================================================
// Request/Response Types
// ============================================================================

export interface ClassifyRequest {
  prompt: string;
  context?: Record<string, unknown>;
}

export interface ClassifyResponse {
  complexity: TaskComplexity;
  confidence: number;
  reasoning: string;
  factors: Record<string, number>;
}

export interface RouteRequest {
  prompt: string;
  context?: Record<string, unknown>;
  estimated_output_tokens?: number;
  strategy?: RoutingStrategy;
}

export interface RouteResponse {
  model_name: string;
  model_tier: ModelTier;
  task_complexity: TaskComplexity;
  strategy: RoutingStrategy;
  estimated_cost: number;
  reasoning: string;
  timestamp: string;
}

export interface RecordCostRequest {
  model_name: string;
  input_tokens: number;
  output_tokens: number;
  cost: number;
}

export interface RecordCostResponse {
  success: boolean;
  message: string;
  total_cost: number;
  total_requests: number;
}

export interface CostStatsResponse {
  total_requests: number;
  total_cost: number;
  average_cost_per_request: number;
  cost_by_model: Record<string, number>;
  cost_by_tier: Record<string, number>;
  cost_by_complexity: Record<string, number>;
  requests_by_model: Record<string, number>;
  model_distribution: Record<string, number>;
}

export interface SavingsResponse {
  total_actual_cost: number;
  baseline_cost: number;
  total_savings: number;
  savings_percentage: number;
  requests_count: number;
  baseline_model: string;
}

export interface TimeSeriesBucket {
  timestamp: string;
  cost: number;
  requests: number;
  average_cost: number;
}

export interface TimeSeriesResponse {
  time_series: TimeSeriesBucket[];
  hours: number;
  interval_minutes: number;
}

export interface StrategyUpdateRequest {
  strategy: RoutingStrategy;
}

export interface StrategyUpdateResponse {
  previous_strategy: RoutingStrategy;
  new_strategy: RoutingStrategy;
  message: string;
}

export interface ModelInfo {
  tier: ModelTier;
  input_cost_per_1k_tokens: number;
  output_cost_per_1k_tokens: number;
  max_tokens: number;
  capabilities: string[];
}

export interface ModelsListResponse {
  models: Record<string, ModelInfo>;
  current_strategy: RoutingStrategy;
  total_models: number;
}

export interface RoutingStatusResponse {
  task_classifier_active: boolean;
  model_router_active: boolean;
  cost_tracker_active: boolean;
  current_strategy: RoutingStrategy;
  total_requests_tracked: number;
  total_cost_tracked: number;
  models_available: string[];
}

// ============================================================================
// Enums
// ============================================================================

export type TaskComplexity = 'simple' | 'moderate' | 'complex';
export type RoutingStrategy = 'cost' | 'balanced' | 'performance';
export type ModelTier = 'fast' | 'standard' | 'premium';

// ============================================================================
// Helper Functions
// ============================================================================

export function getComplexityColor(complexity: TaskComplexity): string {
  switch (complexity) {
    case 'simple':
      return '#10b981'; // green-500
    case 'moderate':
      return '#f59e0b'; // amber-500
    case 'complex':
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
}

export function getComplexityLabel(complexity: TaskComplexity): string {
  switch (complexity) {
    case 'simple':
      return 'Simple';
    case 'moderate':
      return 'Moderate';
    case 'complex':
      return 'Complex';
    default:
      return 'Unknown';
  }
}

export function getStrategyColor(strategy: RoutingStrategy): string {
  switch (strategy) {
    case 'cost':
      return '#10b981'; // green-500
    case 'balanced':
      return '#3b82f6'; // blue-500
    case 'performance':
      return '#8b5cf6'; // purple-500
    default:
      return '#6b7280'; // gray-500
  }
}

export function getStrategyLabel(strategy: RoutingStrategy): string {
  switch (strategy) {
    case 'cost':
      return 'Cost Optimized';
    case 'balanced':
      return 'Balanced';
    case 'performance':
      return 'Performance';
    default:
      return 'Unknown';
  }
}

export function getStrategyDescription(strategy: RoutingStrategy): string {
  switch (strategy) {
    case 'cost':
      return 'Minimize costs by preferring lower-tier models';
    case 'balanced':
      return 'Balance cost and performance for optimal value';
    case 'performance':
      return 'Maximize quality by preferring higher-tier models';
    default:
      return '';
  }
}

export function getTierColor(tier: ModelTier): string {
  switch (tier) {
    case 'fast':
      return '#10b981'; // green-500
    case 'standard':
      return '#3b82f6'; // blue-500
    case 'premium':
      return '#8b5cf6'; // purple-500
    default:
      return '#6b7280'; // gray-500
  }
}

export function getTierLabel(tier: ModelTier): string {
  switch (tier) {
    case 'fast':
      return 'Fast';
    case 'standard':
      return 'Standard';
    case 'premium':
      return 'Premium';
    default:
      return 'Unknown';
  }
}

export function getTierIcon(tier: ModelTier): string {
  switch (tier) {
    case 'fast':
      return '⚡';
    case 'standard':
      return '⭐';
    case 'premium':
      return '💎';
    default:
      return '❓';
  }
}

export function formatCost(cost: number): string {
  if (cost === 0) return '$0.00';
  if (cost < 0.0001) return `$${cost.toFixed(6)}`;
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

// ============================================================================
// Type Guards
// ============================================================================

export function isTaskComplexity(value: unknown): value is TaskComplexity {
  return (
    typeof value === 'string' &&
    ['simple', 'moderate', 'complex'].includes(value)
  );
}

export function isRoutingStrategy(value: unknown): value is RoutingStrategy {
  return (
    typeof value === 'string' &&
    ['cost', 'balanced', 'performance'].includes(value)
  );
}

export function isModelTier(value: unknown): value is ModelTier {
  return (
    typeof value === 'string' &&
    ['fast', 'standard', 'premium'].includes(value)
  );
}

// ============================================================================
// Validation
// ============================================================================

export function validateRouteRequest(request: RouteRequest): string | null {
  if (!request.prompt || request.prompt.trim().length === 0) {
    return 'Prompt cannot be empty';
  }

  if (request.prompt.length > 10000) {
    return 'Prompt is too long (max 10,000 characters)';
  }

  if (
    request.estimated_output_tokens !== undefined &&
    (request.estimated_output_tokens < 1 || request.estimated_output_tokens > 4096)
  ) {
    return 'Estimated output tokens must be between 1 and 4096';
  }

  if (request.strategy && !isRoutingStrategy(request.strategy)) {
    return `Invalid routing strategy: ${request.strategy}`;
  }

  return null;
}

export function validateRecordCostRequest(request: RecordCostRequest): string | null {
  if (!request.model_name || request.model_name.trim().length === 0) {
    return 'Model name cannot be empty';
  }

  if (request.input_tokens < 0) {
    return 'Input tokens must be non-negative';
  }

  if (request.output_tokens < 0) {
    return 'Output tokens must be non-negative';
  }

  if (request.cost < 0) {
    return 'Cost must be non-negative';
  }

  return null;
}
