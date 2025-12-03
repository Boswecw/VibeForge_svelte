/**
 * Insights Types - Phase 4.5
 * Type definitions for cross-project pattern insights.
 */

// ============================================================================
// Pattern Categories
// ============================================================================

export type PatternCategory =
  | 'architecture'
  | 'frontend'
  | 'backend'
  | 'database'
  | 'infrastructure'
  | 'testing'
  | 'deployment';

export type TrendType =
  | 'rising'
  | 'stable'
  | 'declining'
  | 'new'
  | 'obsolete';

export type TimeInterval =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly';

// ============================================================================
// Technology Usage
// ============================================================================

export interface TechnologyUsage {
  tech_name: string;
  category: PatternCategory;
  usage_count: number;
  project_count: number;
  success_rate: number; // 0-1
  avg_complexity: number; // 0-10
  last_used: string; // ISO timestamp
  trending_score: number; // -1 to +1 (negative = declining, positive = rising)
}

// ============================================================================
// Stack Combinations
// ============================================================================

export interface StackCombination {
  technologies: string[];
  usage_count: number;
  success_rate: number; // 0-1
  avg_project_size: number; // lines of code
  common_patterns: string[];
}

// ============================================================================
// Pattern Insights
// ============================================================================

export interface PatternInsight {
  pattern_name: string;
  category: PatternCategory;
  usage_count: number;
  success_rate: number; // 0-1
  popularity_score: number; // 0-100
  recommendation_score: number; // 0-100
  common_technologies: string[];
  best_use_cases: string[];
  potential_issues: string[];
  complementary_patterns: string[];
}

// ============================================================================
// Trend Data
// ============================================================================

export interface TrendData {
  entity_name: string;
  trend_type: TrendType;
  current_value: number;
  change_percent: number; // Percentage change
  change_absolute: number; // Absolute change
  confidence: number; // 0-1
  forecast_next_period: number | null;
  data_point_count: number;
}

// ============================================================================
// Statistics
// ============================================================================

export interface InsightsStatistics {
  total_technologies: number;
  total_projects: number;
  total_patterns: number;
  total_combinations: number;
  avg_success_rate: number;
  most_popular_tech: string | null;
  most_successful_pattern: string | null;
}

export interface TrendStatistics {
  total_entities: number;
  rising_count: number;
  declining_count: number;
  stable_count: number;
  new_count: number;
  obsolete_count: number;
  avg_change_percent: number;
  most_rising: string;
  most_declining: string;
}

// ============================================================================
// API Requests
// ============================================================================

export interface AnalyzeProjectRequest {
  project_id: string;
  technologies: string[];
  pattern_name: string;
  success_score: number; // 0-1
  project_size: number; // lines of code
  metadata?: Record<string, unknown>;
}

export interface CompareTrendsRequest {
  entity_names: string[];
  lookback_days?: number;
}

// ============================================================================
// API Responses
// ============================================================================

export interface AnalyzeProjectResponse {
  success: boolean;
  project_id: string;
  message: string;
}

export interface CompareTrendsResponse {
  entity_count: number;
  lookback_days: number;
  comparison: Record<string, TrendData>;
}

export interface InsightsStatusResponse {
  pattern_analyzer_initialized: boolean;
  trend_calculator_initialized: boolean;
  technologies_tracked: number;
  patterns_tracked: number;
  projects_analyzed: number;
  trend_interval: TimeInterval | null;
  entities_tracked: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get display label for pattern category
 */
export function getCategoryLabel(category: PatternCategory): string {
  const labels: Record<PatternCategory, string> = {
    architecture: 'Architecture',
    frontend: 'Frontend',
    backend: 'Backend',
    database: 'Database',
    infrastructure: 'Infrastructure',
    testing: 'Testing',
    deployment: 'Deployment',
  };
  return labels[category];
}

/**
 * Get icon for pattern category
 */
export function getCategoryIcon(category: PatternCategory): string {
  const icons: Record<PatternCategory, string> = {
    architecture: '🏗️',
    frontend: '🎨',
    backend: '⚙️',
    database: '🗄️',
    infrastructure: '☁️',
    testing: '🧪',
    deployment: '🚀',
  };
  return icons[category];
}

/**
 * Get display label for trend type
 */
export function getTrendLabel(trend: TrendType): string {
  const labels: Record<TrendType, string> = {
    rising: 'Rising',
    stable: 'Stable',
    declining: 'Declining',
    new: 'New',
    obsolete: 'Obsolete',
  };
  return labels[trend];
}

/**
 * Get icon for trend type
 */
export function getTrendIcon(trend: TrendType): string {
  const icons: Record<TrendType, string> = {
    rising: '📈',
    stable: '➡️',
    declining: '📉',
    new: '✨',
    obsolete: '🗑️',
  };
  return icons[trend];
}

/**
 * Get color for trend type
 */
export function getTrendColor(trend: TrendType): string {
  const colors: Record<TrendType, string> = {
    rising: '#10b981', // green
    stable: '#6b7280', // gray
    declining: '#ef4444', // red
    new: '#3b82f6', // blue
    obsolete: '#9ca3af', // light gray
  };
  return colors[trend];
}

/**
 * Format success rate as percentage
 */
export function formatSuccessRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Format trending score
 */
export function formatTrendingScore(score: number): string {
  if (score > 0) {
    return `+${(score * 100).toFixed(1)}%`;
  }
  return `${(score * 100).toFixed(1)}%`;
}

/**
 * Format popularity/recommendation score
 */
export function formatScore(score: number): string {
  return `${score.toFixed(1)}/100`;
}

/**
 * Get color for success rate
 */
export function getSuccessRateColor(rate: number): string {
  if (rate >= 0.8) return '#10b981'; // green
  if (rate >= 0.6) return '#3b82f6'; // blue
  if (rate >= 0.4) return '#f59e0b'; // yellow
  return '#ef4444'; // red
}

/**
 * Get color for trending score
 */
export function getTrendingScoreColor(score: number): string {
  if (score > 0.2) return '#10b981'; // green (rising)
  if (score > 0) return '#3b82f6'; // blue (slight rise)
  if (score === 0) return '#6b7280'; // gray (stable)
  if (score > -0.2) return '#f59e0b'; // yellow (slight decline)
  return '#ef4444'; // red (declining)
}

/**
 * Sort technologies by usage
 */
export function sortByUsage(techs: TechnologyUsage[]): TechnologyUsage[] {
  return [...techs].sort((a, b) => b.usage_count - a.usage_count);
}

/**
 * Sort technologies by trending score
 */
export function sortByTrending(techs: TechnologyUsage[]): TechnologyUsage[] {
  return [...techs].sort((a, b) => b.trending_score - a.trending_score);
}

/**
 * Sort technologies by success rate
 */
export function sortBySuccessRate(techs: TechnologyUsage[]): TechnologyUsage[] {
  return [...techs].sort((a, b) => b.success_rate - a.success_rate);
}

/**
 * Filter technologies by category
 */
export function filterByCategory(
  techs: TechnologyUsage[],
  category: PatternCategory
): TechnologyUsage[] {
  return techs.filter((tech) => tech.category === category);
}

/**
 * Sort patterns by recommendation score
 */
export function sortByRecommendation(patterns: PatternInsight[]): PatternInsight[] {
  return [...patterns].sort((a, b) => b.recommendation_score - a.recommendation_score);
}

/**
 * Sort patterns by popularity
 */
export function sortByPopularity(patterns: PatternInsight[]): PatternInsight[] {
  return [...patterns].sort((a, b) => b.popularity_score - a.popularity_score);
}

/**
 * Get top N items from array
 */
export function getTopN<T>(items: T[], n: number): T[] {
  return items.slice(0, n);
}
