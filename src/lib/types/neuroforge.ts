/**
 * NeuroForge API Type Definitions
 *
 * NeuroForge serves as the AI engine and model router for VibeForge:
 * - Multi-model routing and execution
 * - Champion/challenger comparisons
 * - Usage tracking and feedback
 */

// ============================================================================
// Model Types
// ============================================================================

export interface NeuroForgeModel {
  id: string; // e.g., "nf:claude-3.5-sonnet"
  name: string;
  provider: string; // "anthropic", "openai", etc.
  display_name: string;
  description?: string;
  capabilities: {
    max_tokens: number;
    supports_vision: boolean;
    supports_function_calling: boolean;
  };
  pricing?: {
    input_token_cost: number; // per 1M tokens
    output_token_cost: number; // per 1M tokens
  };
  metadata?: {
    is_champion?: boolean;
    is_challenger?: boolean;
    category?: string;
  };
}

export interface ListModelsResponse {
  models: NeuroForgeModel[];
  total: number;
}

// ============================================================================
// Prompt Execution Types
// ============================================================================

export interface NeuroForgeContextRef {
  source: "dataforge" | "neuroforge" | "external";
  context_id?: string;
  chunk_id?: string;
  text: string; // Full text to include in context
}

export interface NeuroForgeSettings {
  temperature?: number; // 0.0 - 2.0
  max_tokens?: number;
  top_p?: number; // 0.0 - 1.0
  top_k?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  stop_sequences?: string[];
}

export interface PromptRunRequest {
  workspace_id: string;
  session_id?: string;
  models: string[]; // Array of model IDs
  prompt: string;
  system?: string;
  contexts?: NeuroForgeContextRef[];
  settings?: NeuroForgeSettings;
}

export interface NeuroForgeTokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens?: number;
  cache_read_tokens?: number;
  cache_creation_tokens?: number;
}

export interface ModelResponse {
  model: string;
  output_id: string;
  text: string;
  finish_reason?: "stop" | "length" | "error";
  usage: NeuroForgeTokenUsage;
  latency_ms: number;
  error?: {
    code: string;
    message: string;
  };
}

export interface PromptRunResponse {
  run_id: string;
  workspace_id: string;
  session_id?: string;
  created_at: string; // ISO 8601
  responses: ModelResponse[];
  total_latency_ms: number;
}

// ============================================================================
// Feedback Types (Phase 2/3)
// ============================================================================

export interface PromptFeedbackRequest {
  run_id: string;
  output_id: string;
  feedback: {
    rating?: number; // 1-5 stars
    thumbs_up?: boolean;
    tags?: string[];
    notes?: string;
  };
}

export interface PromptFeedbackResponse {
  success: boolean;
  feedback_id: string;
}

// ============================================================================
// Comparison Types (Phase 3)
// ============================================================================

export interface ModelComparison {
  run_id: string;
  models: string[];
  responses: ModelResponse[];
  champion_model?: string;
  challenger_model?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface NeuroForgeError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface NeuroForgeApiError extends Error {
  status: number;
  code: string;
  message: string;
}
