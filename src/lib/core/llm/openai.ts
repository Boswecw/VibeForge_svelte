/**
 * VibeForge V2 - OpenAI Provider
 *
 * OpenAI API client with streaming support
 */

import { BaseLLMProvider } from './base';
import type {
  LLMProvider,
  LLMProviderConfig,
  LLMCompletionRequest,
  LLMCompletionResponse,
  LLMStreamOptions,
  LLMError,
  LLMStreamChunk,
  LLMUsage,
  LLMMessage,
} from './types';
import { calculateCost } from './utils';

// ============================================================================
// OPENAI API TYPES
// ============================================================================

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  stream?: boolean;
}

interface OpenAIChoice {
  index: number;
  message: {
    role: 'assistant';
    content: string;
  };
  finish_reason: 'stop' | 'length' | 'content_filter' | 'function_call' | null;
}

interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenAIResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: OpenAIUsage;
}

interface OpenAIStreamChoice {
  index: number;
  delta: {
    role?: 'assistant';
    content?: string;
  };
  finish_reason: 'stop' | 'length' | 'content_filter' | 'function_call' | null;
}

interface OpenAIStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: OpenAIStreamChoice[];
}

interface OpenAIErrorResponse {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

// ============================================================================
// OPENAI PROVIDER
// ============================================================================

export class OpenAIProvider extends BaseLLMProvider {
  private baseURL: string;

  constructor(config: LLMProviderConfig) {
    super(config);
    this.baseURL = config.baseURL || 'https://api.openai.com';
  }

  getProvider(): LLMProvider {
    return 'openai';
  }

  // ============================================================================
  // API KEY VALIDATION
  // ============================================================================

  async validateApiKey(): Promise<boolean> {
    try {
      // Try to list models to validate the API key
      const response = await fetch(`${this.baseURL}/v1/models`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // COMPLETION (NON-STREAMING)
  // ============================================================================

  protected async executeCompletion(
    request: LLMCompletionRequest
  ): Promise<LLMCompletionResponse> {
    const openaiRequest = this.convertRequest(request);

    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(openaiRequest),
    });

    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }

    const data: OpenAIResponse = await response.json();
    return this.convertResponse(data);
  }

  // ============================================================================
  // STREAMING COMPLETION
  // ============================================================================

  protected async executeStreamingCompletion(
    request: LLMCompletionRequest,
    options: LLMStreamOptions
  ): Promise<void> {
    const openaiRequest = this.convertRequest(request);
    openaiRequest.stream = true;

    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(openaiRequest),
    });

    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    await this.processStream(response.body, request, options);
  }

  private async processStream(
    body: ReadableStream<Uint8Array>,
    request: LLMCompletionRequest,
    options: LLMStreamOptions
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let messageId = '';
    let model = '';
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const chunk: OpenAIStreamChunk = JSON.parse(data);

            if (!messageId) {
              messageId = chunk.id;
              model = chunk.model;
            }

            for (const choice of chunk.choices) {
              if (choice.delta.content) {
                fullContent += choice.delta.content;
                const streamChunk: LLMStreamChunk = {
                  id: messageId,
                  model,
                  content: choice.delta.content,
                };
                options.onChunk(streamChunk);
              }

              if (choice.finish_reason) {
                // Stream complete for this choice
              }
            }
          } catch (error) {
            console.error('Error parsing SSE event:', error, data);
          }
        }
      }

      // Estimate usage for streaming (OpenAI doesn't provide usage in stream)
      const usage = this.estimateUsage(request.messages, fullContent, model);

      const finalResponse: LLMCompletionResponse = {
        id: messageId,
        model,
        content: fullContent,
        finishReason: 'stop',
        usage,
      };

      options.onComplete?.(finalResponse);
    } catch (error) {
      const llmError = this.normalizeError(error);
      options.onError?.(llmError);
      throw llmError;
    } finally {
      reader.releaseLock();
    }
  }

  // ============================================================================
  // REQUEST/RESPONSE CONVERSION
  // ============================================================================

  private convertRequest(request: LLMCompletionRequest): OpenAIRequest {
    const messages: OpenAIMessage[] = request.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    return {
      model: request.model,
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      top_p: request.topP,
      frequency_penalty: request.frequencyPenalty,
      presence_penalty: request.presencePenalty,
      stop: request.stop,
      stream: request.stream,
    };
  }

  private convertResponse(response: OpenAIResponse): LLMCompletionResponse {
    const choice = response.choices[0];

    if (!choice) {
      throw new Error('No choices in OpenAI response');
    }

    const usage: LLMUsage = {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
    };

    usage.estimatedCost = calculateCost(usage, response.model).totalCost;

    return {
      id: response.id,
      model: response.model,
      content: choice.message.content,
      finishReason: this.mapFinishReason(choice.finish_reason),
      usage,
    };
  }

  private mapFinishReason(
    reason: 'stop' | 'length' | 'content_filter' | 'function_call' | null
  ): 'stop' | 'length' | 'function_call' | 'content_filter' | 'error' {
    if (!reason) return 'stop';
    return reason;
  }

  // ============================================================================
  // USAGE ESTIMATION
  // ============================================================================

  private estimateUsage(
    messages: LLMMessage[],
    completionContent: string,
    model: string
  ): LLMUsage {
    // Rough estimate: 1 token ~= 4 characters
    const promptTokens = messages.reduce(
      (sum, msg) => sum + Math.ceil(msg.content.length / 4),
      0
    );
    const completionTokens = Math.ceil(completionContent.length / 4);
    const totalTokens = promptTokens + completionTokens;

    const usage: LLMUsage = {
      promptTokens,
      completionTokens,
      totalTokens,
    };

    usage.estimatedCost = calculateCost(usage, model).totalCost;

    return usage;
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  private async handleErrorResponse(response: Response): Promise<LLMError> {
    let errorData: OpenAIErrorResponse | undefined;

    try {
      errorData = await response.json();
    } catch {
      // Ignore JSON parse errors
    }

    const message =
      errorData?.error?.message || response.statusText || 'Unknown error';
    const errorType = errorData?.error?.type || 'unknown_error';
    const errorCode = errorData?.error?.code;

    // Map OpenAI error types to LLM error codes
    let code: LLMError['code'] = 'unknown_error';
    let retryable = false;

    if (response.status === 401) {
      code = 'invalid_api_key';
      retryable = false;
    } else if (response.status === 429) {
      code = 'rate_limit_exceeded';
      retryable = true;
    } else if (response.status >= 500) {
      code = 'server_error';
      retryable = true;
    } else if (errorCode === 'context_length_exceeded') {
      code = 'context_length_exceeded';
      retryable = false;
    } else if (errorType === 'invalid_request_error') {
      if (message.toLowerCase().includes('context') || message.toLowerCase().includes('token')) {
        code = 'context_length_exceeded';
      }
    }

    throw new LLMError(code, message, response.status, retryable);
  }

  // ============================================================================
  // HEADERS
  // ============================================================================

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiKey}`,
    };
  }
}
