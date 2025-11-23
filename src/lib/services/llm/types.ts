/**
 * LLM Provider Types & Interfaces
 * Shared types for all LLM provider implementations
 */

export type LLMProviderType = "openai" | "anthropic" | "ollama" | "custom";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMChatRequest {
  messages: LLMMessage[];
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  stopSequences?: string[];
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface LLMChatResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: "stop" | "length" | "content_filter" | "tool_calls" | null;
  metadata?: Record<string, unknown>;
}

export interface LLMStreamChunk {
  content: string;
  isDone: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMModelInfo {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  costPer1kPromptTokens: number;
  costPer1kCompletionTokens: number;
  capabilities: {
    chat: boolean;
    functions: boolean;
    vision: boolean;
    streaming: boolean;
  };
}

export interface LLMConfig {
  provider: LLMProviderType;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface LLMProviderStatus {
  available: boolean;
  configured: boolean;
  error?: string;
  latency?: number;
  lastChecked: Date;
}

export class LLMError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "LLMError";
  }
}

export class LLMRateLimitError extends LLMError {
  constructor(
    message: string,
    public provider: string,
    public retryAfter?: number
  ) {
    super(message, "RATE_LIMIT", provider);
    this.name = "LLMRateLimitError";
  }
}

export class LLMAuthError extends LLMError {
  constructor(
    message: string,
    public provider: string
  ) {
    super(message, "AUTH_ERROR", provider);
    this.name = "LLMAuthError";
  }
}

export class LLMTimeoutError extends LLMError {
  constructor(
    message: string,
    public provider: string,
    public timeout: number
  ) {
    super(message, "TIMEOUT", provider);
    this.name = "LLMTimeoutError";
  }
}
