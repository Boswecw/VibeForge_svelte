/**
 * outcome.ts
 *
 * TypeScript types for Phase 3.4 Outcome Tracking & Feedback Loop
 * Corresponds to DataForge database schema
 */

// ============================================================================
// Project Outcome Types
// ============================================================================

export type ProjectStatus = 'active' | 'archived' | 'deleted';
export type BuildStatus = 'success' | 'failure' | null;
export type DeploymentStatus = 'deployed' | 'staging' | 'local' | null;

export interface ProjectOutcome {
  id: string; // UUID

  // Project Metadata
  projectName: string;
  projectPath: string;
  patternId: string;
  patternName: string;

  // Scaffolding Details
  componentsGenerated: string[]; // ['UserService', 'AuthController']
  filesCreated: number;
  languagesUsed: string[]; // ['TypeScript', 'Python', 'Rust']
  dependenciesInstalled: string[]; // ['npm', 'cargo', 'pip']

  // Project Health
  status: ProjectStatus;
  lastBuildStatus: BuildStatus;
  lastBuildTimestamp: string | null; // ISO 8601
  testPassRate: number | null; // 0-100
  deploymentStatus: DeploymentStatus;

  // User Information (Future)
  userId: string | null;
  workspaceId: string | null;

  // Timestamps
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  lastAccessedAt: string | null; // ISO 8601
}

export interface CreateProjectOutcomeRequest {
  projectName: string;
  projectPath: string;
  patternId: string;
  patternName: string;
  componentsGenerated: string[];
  filesCreated: number;
  languagesUsed: string[];
  dependenciesInstalled: string[];
}

export interface UpdateProjectOutcomeRequest {
  lastBuildStatus?: BuildStatus;
  testPassRate?: number;
  deploymentStatus?: DeploymentStatus;
  lastAccessedAt?: string;
}

// ============================================================================
// User Feedback Types
// ============================================================================

export type FeedbackSource = 'modal' | 'dashboard' | 'email';

export interface UserFeedback {
  id: string; // UUID
  projectOutcomeId: string; // UUID reference

  // Ratings (1-5 scale)
  overallSatisfaction: number; // 1-5
  patternUsefulness: number | null; // 1-5
  codeQuality: number | null; // 1-5
  documentationClarity: number | null; // 1-5
  setupEase: number | null; // 1-5

  // Qualitative Feedback
  positiveAspects: string[]; // ['fast', 'clean-code', 'good-docs', 'easy-setup']
  negativeAspects: string[]; // ['slow', 'buggy', 'poor-docs', 'complex']
  additionalComments: string | null;

  // Feature Requests
  wouldRecommend: boolean | null;
  likelihoodToReuse: number | null; // 1-10 (NPS scale)
  featureRequests: string[];

  // Context
  timeToFirstBuild: number | null; // Seconds
  encounteredErrors: boolean;
  errorDetails: ErrorDetail[] | null;

  // Metadata
  feedbackSource: FeedbackSource;
  submittedAt: string; // ISO 8601
}

export interface ErrorDetail {
  type: 'dependency' | 'build' | 'runtime' | 'configuration';
  message: string;
  resolved: boolean;
  timestamp?: string;
}

export interface SubmitFeedbackRequest {
  projectOutcomeId: string;
  overallSatisfaction: number; // Required
  patternUsefulness?: number;
  codeQuality?: number;
  documentationClarity?: number;
  setupEase?: number;
  positiveAspects?: string[];
  negativeAspects?: string[];
  additionalComments?: string;
  wouldRecommend?: boolean;
  likelihoodToReuse?: number;
  featureRequests?: string[];
  timeToFirstBuild?: number;
  encounteredErrors?: boolean;
  errorDetails?: ErrorDetail[];
  feedbackSource?: FeedbackSource;
}

// ============================================================================
// Pattern Analytics Types
// ============================================================================

export interface PatternAnalytics {
  patternId: string;
  patternName: string;

  // Usage Metrics
  totalProjects: number;
  totalUses?: number; // Alias for totalProjects
  projectsLast30Days: number;
  projectsLast7Days: number;

  // Health Metrics
  successfulBuilds: number;
  successfulProjects?: number; // Alias for successfulBuilds
  failedBuilds: number;
  buildSuccessRate: number | null; // Percentage (0-100)

  // Feedback Metrics
  feedbackCount: number;
  avgSatisfaction: number | null; // 1-5
  averageSatisfaction?: number | null; // Alias for avgSatisfaction
  avgUsefulness: number | null; // 1-5
  avgNps: number | null; // 1-10
  recommendationCount: number;

  // Test Metrics
  averageTestPassRate?: number | null; // Test pass rate percentage

  // Time Metrics
  avgTimeToBuildMinutes: number | null;

  // Last Activity
  lastActivity: string | null; // ISO 8601
}

export interface TrendDataPoint {
  date: string; // ISO 8601 date
  value: number;
  label?: string;
}

export interface PatternTrends {
  patternId: string;
  satisfaction: TrendDataPoint[]; // Last 30 days
  usage: TrendDataPoint[]; // Last 30 days
  buildSuccess: TrendDataPoint[]; // Last 30 days
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardSummary {
  totalProjects: number;
  activeProjects: number;
  archivedProjects: number;
  averageSatisfaction: number | null; // 1-5
  topPatterns: PatternAnalytics[]; // Top 5 by usage
  recentProjects: ProjectOutcome[]; // Last 10
  feedbackRate: number; // Percentage of projects with feedback
}

export interface ProjectHealthIndicator {
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  message: string;
  lastChecked: string | null;
}

// ============================================================================
// Feedback Collection UI Types
// ============================================================================

export interface FeedbackFormData {
  overallSatisfaction: number;
  patternUsefulness: number;
  codeQuality: number;
  documentationClarity: number;
  setupEase: number;
  positiveAspects: string[];
  negativeAspects: string[];
  additionalComments: string;
  wouldRecommend: boolean | null;
  likelihoodToReuse: number;
  featureRequests: string[];
}

export const POSITIVE_ASPECTS = [
  { value: 'fast', label: 'Fast scaffolding' },
  { value: 'clean-code', label: 'Clean code quality' },
  { value: 'good-docs', label: 'Clear documentation' },
  { value: 'easy-setup', label: 'Easy setup' },
  { value: 'complete', label: 'Complete structure' },
  { value: 'customizable', label: 'Highly customizable' },
] as const;

export const NEGATIVE_ASPECTS = [
  { value: 'slow', label: 'Slow generation' },
  { value: 'buggy', label: 'Encountered bugs' },
  { value: 'poor-docs', label: 'Poor documentation' },
  { value: 'complex', label: 'Too complex' },
  { value: 'incomplete', label: 'Missing files' },
  { value: 'hard-customize', label: 'Hard to customize' },
] as const;

// ============================================================================
// API Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// ============================================================================
// Utility Types
// ============================================================================

export type OutcomeFilter = {
  status?: ProjectStatus;
  patternId?: string;
  userId?: string;
  fromDate?: string; // ISO 8601
  toDate?: string; // ISO 8601
};

export type FeedbackFilter = {
  projectOutcomeId?: string;
  minSatisfaction?: number;
  wouldRecommend?: boolean;
  fromDate?: string;
  toDate?: string;
};
