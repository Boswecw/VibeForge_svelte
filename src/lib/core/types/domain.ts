/**
 * VibeForge V2 - Core Domain Types
 *
 * These types represent the core domain entities for the VibeForge workbench.
 * They are designed to be framework-agnostic and represent pure business logic.
 */

// ============================================================================
// WORKSPACE
// ============================================================================

export interface Workspace {
  id: string;
  name: string;
  description: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  settings: WorkspaceSettings;
}

export interface WorkspaceSettings {
  defaultModel?: string;
  theme: 'dark' | 'light';
  autoSave: boolean;
}

// ============================================================================
// CONTEXT BLOCKS
// ============================================================================

export type ContextKind = 'system' | 'design' | 'project' | 'code' | 'workflow' | 'data';

export type ContextSource = 'global' | 'workspace' | 'local';

export interface ContextBlock {
  id: string;
  title: string;
  kind: ContextKind;
  content: string;
  description: string;
  tags: string[];
  isActive: boolean;
  source: ContextSource;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// PROMPT
// ============================================================================

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  description: string;
  variables: string[]; // e.g., ['{{userInput}}', '{{context}}']
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PromptState {
  text: string;
  variables: Record<string, string>;
  estimatedTokens: number;
}

// ============================================================================
// MODELS
// ============================================================================

export type ModelProvider = 'anthropic' | 'openai' | 'local' | 'neuroforge';

export interface Model {
  id: string;
  name: string;
  provider: ModelProvider;
  maxTokens: number;
  supportsStreaming: boolean;
  costPer1kTokens?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// RUNS (Prompt Executions)
// ============================================================================

export type RunStatus = 'pending' | 'running' | 'success' | 'error' | 'cancelled';

export interface PromptRun {
  id: string;
  workspaceId: string;
  promptSnapshot: string;
  contextBlockIds: string[];
  modelId: string;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cost?: number;
  output?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// EVALUATIONS
// ============================================================================

export interface Evaluation {
  id: string;
  name: string;
  runIds: string[];
  criteria: EvaluationCriteria[];
  results: EvaluationResult[];
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1
}

export interface EvaluationResult {
  runId: string;
  scores: Record<string, number>; // criteriaId -> score
  notes?: string;
}

// ============================================================================
// PRESETS
// ============================================================================

export interface Preset {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  promptTemplate: string;
  contextBlockIds: string[];
  modelIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PATTERNS
// ============================================================================

export interface Pattern {
  id: string;
  name: string;
  description: string;
  category: string;
  promptTemplate: string;
  exampleInputs: string[];
  exampleOutputs: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
