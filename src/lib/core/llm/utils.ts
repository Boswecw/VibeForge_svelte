/**
 * VibeForge V2 - LLM Utilities
 *
 * Token counting, cost estimation, and other LLM utilities
 */

import type {
  LLMModel,
  LLMMessage,
  TokenCount,
  CostEstimate,
  LLMUsage,
  LLMProvider,
} from './types';

// ============================================================================
// MODEL DEFINITIONS
// ============================================================================

export const LLM_MODELS: Record<string, LLMModel> = {
  // Anthropic Claude Models
  'claude-3-5-sonnet-20241022': {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    costPer1kInputTokens: 0.003,
    costPer1kOutputTokens: 0.015,
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctions: true,
  },
  'claude-3-opus-20240229': {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    costPer1kInputTokens: 0.015,
    costPer1kOutputTokens: 0.075,
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctions: true,
  },
  'claude-3-sonnet-20240229': {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    costPer1kInputTokens: 0.003,
    costPer1kOutputTokens: 0.015,
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctions: true,
  },
  'claude-3-haiku-20240307': {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    costPer1kInputTokens: 0.00025,
    costPer1kOutputTokens: 0.00125,
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctions: true,
  },

  // OpenAI GPT-4 Models
  'gpt-4-turbo-preview': {
    id: 'gpt-4-turbo-preview',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    costPer1kInputTokens: 0.01,
    costPer1kOutputTokens: 0.03,
    supportsStreaming: true,
    supportsVision: true,
    supportsFunctions: true,
  },
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    contextWindow: 8192,
    maxOutputTokens: 4096,
    costPer1kInputTokens: 0.03,
    costPer1kOutputTokens: 0.06,
    supportsStreaming: true,
    supportsVision: false,
    supportsFunctions: true,
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    contextWindow: 16384,
    maxOutputTokens: 4096,
    costPer1kInputTokens: 0.0005,
    costPer1kOutputTokens: 0.0015,
    supportsStreaming: true,
    supportsVision: false,
    supportsFunctions: true,
  },
};

// ============================================================================
// TOKEN COUNTING
// ============================================================================

/**
 * Estimate token count for messages
 * This is a rough approximation - actual count may vary
 */
export function estimateTokenCount(messages: LLMMessage[]): TokenCount {
  let totalTokens = 0;

  for (const message of messages) {
    // Rough estimate: 1 token ~= 4 characters
    const contentTokens = Math.ceil(message.content.length / 4);

    // Add overhead for message structure
    // OpenAI format: {"role": "user", "content": "..."} adds ~4 tokens
    // Anthropic format is similar
    const overheadTokens = 4;

    totalTokens += contentTokens + overheadTokens;
  }

  return {
    totalTokens,
    promptTokens: totalTokens,
    estimatedCompletionTokens: undefined,
  };
}

/**
 * Estimate token count for a single text string
 */
export function estimateTextTokens(text: string): number {
  // Rough estimate: 1 token ~= 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * More accurate token counting (for specific models)
 * This uses a simple heuristic - for production, consider using tiktoken
 */
export function countTokens(text: string, model?: string): number {
  // Different models may have different tokenization
  // For now, use the same estimate for all
  return estimateTextTokens(text);
}

// ============================================================================
// COST ESTIMATION
// ============================================================================

/**
 * Calculate cost for a given usage and model
 */
export function calculateCost(usage: LLMUsage, modelId: string): CostEstimate {
  const model = LLM_MODELS[modelId];

  if (!model) {
    console.warn(`Unknown model: ${modelId}, cannot calculate cost`);
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: 'USD',
    };
  }

  const inputCost = (usage.promptTokens / 1000) * model.costPer1kInputTokens;
  const outputCost = (usage.completionTokens / 1000) * model.costPer1kOutputTokens;
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
    currency: 'USD',
  };
}

/**
 * Estimate cost before making a request
 */
export function estimateCost(
  messages: LLMMessage[],
  modelId: string,
  maxCompletionTokens: number = 1000
): CostEstimate {
  const model = LLM_MODELS[modelId];

  if (!model) {
    console.warn(`Unknown model: ${modelId}, cannot estimate cost`);
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: 'USD',
    };
  }

  const tokenCount = estimateTokenCount(messages);
  const inputCost = (tokenCount.promptTokens / 1000) * model.costPer1kInputTokens;
  const outputCost = (maxCompletionTokens / 1000) * model.costPer1kOutputTokens;
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
    currency: 'USD',
  };
}

// ============================================================================
// MODEL UTILITIES
// ============================================================================

/**
 * Get model by ID
 */
export function getModel(modelId: string): LLMModel | undefined {
  return LLM_MODELS[modelId];
}

/**
 * Get all models for a provider
 */
export function getModelsByProvider(provider: LLMProvider): LLMModel[] {
  return Object.values(LLM_MODELS).filter((model) => model.provider === provider);
}

/**
 * Get all available models
 */
export function getAllModels(): LLMModel[] {
  return Object.values(LLM_MODELS);
}

/**
 * Check if a model supports streaming
 */
export function supportsStreaming(modelId: string): boolean {
  const model = LLM_MODELS[modelId];
  return model?.supportsStreaming ?? false;
}

/**
 * Check if a model supports vision
 */
export function supportsVision(modelId: string): boolean {
  const model = LLM_MODELS[modelId];
  return model?.supportsVision ?? false;
}

/**
 * Check if a model supports function calling
 */
export function supportsFunctions(modelId: string): boolean {
  const model = LLM_MODELS[modelId];
  return model?.supportsFunctions ?? false;
}

/**
 * Get the max context window for a model
 */
export function getContextWindow(modelId: string): number {
  const model = LLM_MODELS[modelId];
  return model?.contextWindow ?? 4096;
}

/**
 * Check if messages fit within model's context window
 */
export function fitsInContextWindow(messages: LLMMessage[], modelId: string): boolean {
  const tokenCount = estimateTokenCount(messages);
  const contextWindow = getContextWindow(modelId);
  return tokenCount.totalTokens <= contextWindow;
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format cost as USD string
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

/**
 * Format token count with commas
 */
export function formatTokenCount(tokens: number): string {
  return tokens.toLocaleString();
}

/**
 * Format usage as a summary string
 */
export function formatUsage(usage: LLMUsage): string {
  return `${formatTokenCount(usage.totalTokens)} tokens (${formatCost(usage.estimatedCost ?? 0)})`;
}
