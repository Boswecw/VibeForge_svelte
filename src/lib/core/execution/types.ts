/**
 * VibeForge V2 - Execution Engine Types
 *
 * Types for the prompt execution engine that orchestrates context assembly,
 * prompt construction, and parallel LLM execution.
 */

import type { ContextBlock, Model, PromptRun, RunStatus } from '$lib/core/types';
import type { LLMMessage, LLMUsage } from '$lib/core/llm/types';

// ============================================================================
// EXECUTION REQUEST
// ============================================================================

export interface ExecutionRequest {
  /** The prompt text (with or without template variables) */
  prompt: string;

  /** Active context blocks to include */
  contextBlocks: ContextBlock[];

  /** Models to execute the prompt with (parallel execution) */
  models: Model[];

  /** Template variables to substitute */
  variables?: Record<string, string>;

  /** MCP tool results to include in context */
  toolResults?: ToolResult[];

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface ToolResult {
  /** Tool identifier */
  toolId: string;

  /** Tool name for display */
  toolName: string;

  /** Tool invocation arguments */
  arguments: Record<string, unknown>;

  /** Tool execution result */
  result: unknown;

  /** Timestamp of tool execution */
  executedAt: string;

  /** Whether the tool succeeded */
  success: boolean;

  /** Error message if failed */
  error?: string;
}

// ============================================================================
// EXECUTION CONTEXT
// ============================================================================

export interface ExecutionContext {
  /** System context (active context blocks assembled) */
  systemContext: string;

  /** User prompt (with variables resolved) */
  userPrompt: string;

  /** Messages formatted for LLM */
  messages: LLMMessage[];

  /** Metadata about the context */
  metadata: {
    contextBlockCount: number;
    toolResultCount: number;
    totalContextTokens: number;
    userPromptTokens: number;
  };
}

// ============================================================================
// EXECUTION RESULT
// ============================================================================

export interface ExecutionResult {
  /** Unique run ID */
  runId: string;

  /** Model that was executed */
  model: Model;

  /** Execution status */
  status: RunStatus;

  /** Generated output */
  output: string;

  /** Token usage */
  usage: LLMUsage;

  /** Execution duration in milliseconds */
  durationMs: number;

  /** Start timestamp */
  startedAt: string;

  /** Completion timestamp */
  completedAt?: string;

  /** Error message if failed */
  error?: string;

  /** Finish reason from LLM */
  finishReason?: string;
}

// ============================================================================
// STREAMING EVENTS
// ============================================================================

export type StreamEventType =
  | 'start'
  | 'token'
  | 'usage'
  | 'complete'
  | 'error';

export interface StreamEvent {
  /** Event type */
  type: StreamEventType;

  /** Run ID this event belongs to */
  runId: string;

  /** Model ID */
  modelId: string;

  /** Event data */
  data: StreamEventData;

  /** Timestamp */
  timestamp: string;
}

export type StreamEventData =
  | StreamStartData
  | StreamTokenData
  | StreamUsageData
  | StreamCompleteData
  | StreamErrorData;

export interface StreamStartData {
  type: 'start';
  runId: string;
  modelId: string;
}

export interface StreamTokenData {
  type: 'token';
  token: string;
  index: number;
}

export interface StreamUsageData {
  type: 'usage';
  usage: LLMUsage;
}

export interface StreamCompleteData {
  type: 'complete';
  output: string;
  usage: LLMUsage;
  finishReason: string;
}

export interface StreamErrorData {
  type: 'error';
  error: string;
  code?: string;
}

// ============================================================================
// EXECUTION OPTIONS
// ============================================================================

export interface ExecutionOptions {
  /** Enable streaming (default: true) */
  stream?: boolean;

  /** Save runs to backend (default: true) */
  persist?: boolean;

  /** Parallel execution (default: true) */
  parallel?: boolean;

  /** Maximum tokens for output */
  maxTokens?: number;

  /** Temperature (0-1) */
  temperature?: number;

  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;

  /** Callback for stream events */
  onStreamEvent?: (event: StreamEvent) => void;

  /** Callback for execution progress */
  onProgress?: (progress: ExecutionProgress) => void;
}

export interface ExecutionProgress {
  /** Total models to execute */
  total: number;

  /** Completed models */
  completed: number;

  /** Failed models */
  failed: number;

  /** Currently running models */
  running: number;

  /** Progress percentage (0-100) */
  percentage: number;
}

// ============================================================================
// CONTEXT ASSEMBLY
// ============================================================================

export interface ContextAssemblyOptions {
  /** Maximum context tokens (default: unlimited) */
  maxTokens?: number;

  /** Priority order for context blocks */
  priorityOrder?: 'manual' | 'kind' | 'recent';

  /** Include tool results (default: true) */
  includeToolResults?: boolean;

  /** Format for tool results */
  toolResultFormat?: 'json' | 'text';
}

// ============================================================================
// TEMPLATE PROCESSING
// ============================================================================

export interface TemplateProcessingResult {
  /** Resolved prompt text */
  resolved: string;

  /** Variables that were substituted */
  substituted: string[];

  /** Variables that were missing */
  missing: string[];

  /** Whether all variables were resolved */
  complete: boolean;
}
