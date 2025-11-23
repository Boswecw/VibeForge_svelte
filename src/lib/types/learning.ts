/**
 * VibeForge Learning Layer Types
 *
 * TypeScript interfaces matching DataForge Pydantic schemas
 * for the learning layer that tracks user behavior and outcomes.
 */

// ============================================================================
// Enums
// ============================================================================

export type ProjectType =
  | "web"
  | "mobile"
  | "desktop"
  | "api"
  | "ai_ml"
  | "other";

export type OutcomeStatus = "success" | "partial" | "failure" | "unknown";

// ============================================================================
// VibeForge Project Types
// ============================================================================

export interface VibeForgeProjectBase {
  project_name: string;
  project_type: ProjectType;
  description?: string;
  selected_languages: string[];
  selected_stack: string;
  intent_description?: string;
  team_size?: number;
  timeline_estimate?: string;
  complexity_score?: number;
}

export interface VibeForgeProjectCreate extends VibeForgeProjectBase {
  user_id?: number;
}

export interface VibeForgeProjectUpdate {
  project_name?: string;
  description?: string;
  complexity_score?: number;
}

export interface VibeForgeProjectResponse extends VibeForgeProjectBase {
  id: number;
  user_id?: number;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// Project Session Types
// ============================================================================

export interface ProjectSessionBase {
  project_id: number;
  steps_completed?: number[];
  steps_revisited?: number[];
  languages_viewed?: string[];
  languages_considered?: string[];
  languages_final?: string[];
  stacks_viewed?: string[];
  stacks_compared?: string[];
  stack_recommended?: string;
  stack_final?: string;
  stack_override?: boolean;
  llm_queries?: number;
  llm_provider_used?: string;
  llm_tokens_consumed?: number;
  abandoned?: boolean;
  feedback_rating?: number;
}

export interface ProjectSessionCreate extends ProjectSessionBase {}

export interface ProjectSessionUpdate {
  session_completed_at?: string;
  session_duration_seconds?: number;
  steps_completed?: number[];
  steps_revisited?: number[];
  languages_viewed?: string[];
  languages_considered?: string[];
  languages_final?: string[];
  stacks_viewed?: string[];
  stacks_compared?: string[];
  stack_recommended?: string;
  stack_final?: string;
  stack_override?: boolean;
  llm_queries?: number;
  llm_provider_used?: string;
  llm_tokens_consumed?: number;
  abandoned?: boolean;
  feedback_rating?: number;
}

export interface ProjectSessionResponse extends ProjectSessionBase {
  id: number;
  session_started_at: string;
  session_completed_at?: string;
  session_duration_seconds?: number;
  created_at: string;
}

// ============================================================================
// Stack Outcome Types
// ============================================================================

export interface StackOutcomeBase {
  project_id: number;
  stack_id: string;
  project_type: ProjectType;
  languages_used: string[];
  outcome_status: OutcomeStatus;
  build_successful?: boolean;
  tests_passed?: boolean;
  deployed_successfully?: boolean;
  build_time_seconds?: number;
  test_pass_rate?: number;
  deployment_time_seconds?: number;
  user_satisfaction?: number;
  would_recommend?: boolean;
  issues_count?: number;
  issue_types?: string[];
  fix_iterations?: number;
  notes?: string;
}

export interface StackOutcomeCreate extends StackOutcomeBase {}

export interface StackOutcomeUpdate {
  outcome_status?: OutcomeStatus;
  build_successful?: boolean;
  tests_passed?: boolean;
  deployed_successfully?: boolean;
  build_time_seconds?: number;
  test_pass_rate?: number;
  deployment_time_seconds?: number;
  user_satisfaction?: number;
  would_recommend?: boolean;
  issues_count?: number;
  issue_types?: string[];
  fix_iterations?: number;
  notes?: string;
}

export interface StackOutcomeResponse extends StackOutcomeBase {
  id: number;
  recorded_at: string;
  updated_at?: string;
}

// ============================================================================
// Model Performance Types
// ============================================================================

export interface ModelPerformanceBase {
  session_id?: number;
  provider: string;
  model_name: string;
  prompt_type: string;
  response_time_ms?: number;
  tokens_prompt?: number;
  tokens_completion?: number;
  tokens_total?: number;
  recommendation_accepted?: boolean;
  recommendation_helpful?: boolean;
  recommendation_confidence?: number;
  experiment_id?: string;
  variant?: string;
  context_data?: Record<string, any>;
}

export interface ModelPerformanceCreate extends ModelPerformanceBase {}

export interface ModelPerformanceUpdate {
  response_time_ms?: number;
  tokens_prompt?: number;
  tokens_completion?: number;
  tokens_total?: number;
  recommendation_accepted?: boolean;
  recommendation_helpful?: boolean;
  recommendation_confidence?: number;
  context_data?: Record<string, any>;
}

export interface ModelPerformanceResponse extends ModelPerformanceBase {
  id: number;
  logged_at: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface StackSuccessRate {
  stack_id: string;
  total_uses: number;
  success_count: number;
  success_rate: number;
  avg_build_time?: number;
  avg_test_pass_rate?: number;
  avg_satisfaction?: number;
}

export interface UserPreferenceSummary {
  user_id?: number;
  total_projects: number;
  favorite_languages: string[];
  favorite_stacks: string[];
  avg_complexity: number;
  most_common_project_type: ProjectType;
  total_sessions: number;
  avg_session_duration_seconds?: number;
  completion_rate: number;
}

export interface LanguageTrend {
  language_id: string;
  times_viewed: number;
  times_selected: number;
  selection_rate: number;
  most_paired_with: string[];
}

// ============================================================================
// Request/Response Wrappers
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface ApiError {
  detail: string;
  status_code: number;
}
