/**
 * VibeForge V2 - LLM Module Exports
 *
 * Unified exports for LLM provider integration
 */

// Types
export type {
  LLMProvider,
  LLMProviderConfig,
  LLMModel,
  LLMMessage,
  LLMCompletionRequest,
  LLMCompletionRequestWithFunctions,
  LLMCompletionResponse,
  LLMStreamChunk,
  LLMStreamOptions,
  LLMStreamCallback,
  LLMUsage,
  LLMFunction,
  LLMErrorCode,
  RateLimitConfig,
  RateLimitState,
  TokenCount,
  CostEstimate,
  RetryConfig,
  RetryState,
} from './types';

// Error class
export { LLMError } from './types';

// Base provider
export { BaseLLMProvider } from './base';

// Concrete providers
export { AnthropicProvider } from './anthropic';
export { OpenAIProvider } from './openai';

// Manager and factory
export { LLMProviderFactory, LLMProviderManager, llmManager } from './manager';

// Utilities
export {
  // Model definitions
  LLM_MODELS,
  // Token counting
  estimateTokenCount,
  estimateTextTokens,
  countTokens,
  // Cost calculation
  calculateCost,
  estimateCost,
  // Model utilities
  getModel,
  getModelsByProvider,
  getAllModels,
  supportsStreaming,
  supportsVision,
  supportsFunctions,
  getContextWindow,
  fitsInContextWindow,
  // Formatting
  formatCost,
  formatTokenCount,
  formatUsage,
} from './utils';
