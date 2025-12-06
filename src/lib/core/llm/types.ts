/**
 * VibeForge V2 - LLM Provider Types
 *
 * Unified types for LLM provider integration (Anthropic, OpenAI, etc.)
 */

// ============================================================================
// PROVIDER TYPES
// ============================================================================

export type LLMProvider = 'anthropic' | 'openai' | 'local';

export interface LLMProviderConfig {
  provider: LLMProvider;
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

// ============================================================================
// MODEL TYPES
// ============================================================================

export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProvider;
  contextWindow: number;
  maxOutputTokens: number;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsFunctions: boolean;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionRequest {
  model: string;
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

export interface LLMFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
    }>;
    required?: string[];
  };
}

export interface LLMCompletionRequestWithFunctions extends LLMCompletionRequest {
  functions?: LLMFunction[];
  functionCall?: 'auto' | 'none' | { name: string };
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost?: number;
}

export interface LLMCompletionResponse {
  id: string;
  model: string;
  content: string;
  finishReason: 'stop' | 'length' | 'function_call' | 'content_filter' | 'error';
  usage: LLMUsage;
  metadata?: Record<string, unknown>;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

export interface LLMStreamChunk {
  id: string;
  model: string;
  content: string;
  finishReason?: 'stop' | 'length' | 'function_call' | 'content_filter' | 'error';
  usage?: LLMUsage;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export type LLMErrorCode =
  | 'invalid_api_key'
  | 'rate_limit_exceeded'
  | 'context_length_exceeded'
  | 'content_filter'
  | 'timeout'
  | 'network_error'
  | 'server_error'
  | 'unknown_error';

export class LLMError extends Error {
  constructor(
    public code: LLMErrorCode,
    message: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

// ============================================================================
// STREAMING TYPES
// ============================================================================

export type LLMStreamCallback = (chunk: LLMStreamChunk) => void;

export interface LLMStreamOptions {
  onChunk: LLMStreamCallback;
  onComplete?: (response: LLMCompletionResponse) => void;
  onError?: (error: LLMError) => void;
}

// ============================================================================
// RATE LIMITING TYPES
// ============================================================================

export interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
  tokensPerDay?: number;
}

export interface RateLimitState {
  requestsInWindow: number;
  tokensInWindow: number;
  tokensToday: number;
  windowStart: number;
  dayStart: number;
}

// ============================================================================
// TOKEN COUNTING TYPES
// ============================================================================

export interface TokenCount {
  totalTokens: number;
  promptTokens: number;
  estimatedCompletionTokens?: number;
}

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
}

// ============================================================================
// RETRY TYPES
// ============================================================================

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: LLMErrorCode[];
}

export interface RetryState {
  attempt: number;
  lastError?: LLMError;
  nextRetryAt?: number;
}
