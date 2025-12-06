/**
 * VibeForge V2 - Anthropic Claude Provider
 *
 * Anthropic Claude API client with streaming support
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
} from './types';
import { calculateCost } from './utils';

// ============================================================================
// ANTHROPIC API TYPES
// ============================================================================

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  stop_sequences?: string[];
  stream?: boolean;
  system?: string;
}

interface AnthropicContent {
  type: 'text';
  text: string;
}

interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
}

interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: AnthropicContent[];
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  usage: AnthropicUsage;
}

interface AnthropicStreamEvent {
  type:
    | 'message_start'
    | 'content_block_start'
    | 'content_block_delta'
    | 'content_block_stop'
    | 'message_delta'
    | 'message_stop';
  index?: number;
  delta?: {
    type: 'text_delta';
    text: string;
  };
  message?: Partial<AnthropicResponse>;
  usage?: Partial<AnthropicUsage>;
}

interface AnthropicError {
  type: 'error';
  error: {
    type: string;
    message: string;
  };
}

// ============================================================================
// ANTHROPIC PROVIDER
// ============================================================================

export class AnthropicProvider extends BaseLLMProvider {
  private baseURL: string;
  private apiVersion: string = '2023-06-01';

  constructor(config: LLMProviderConfig) {
    super(config);
    this.baseURL = config.baseURL || 'https://api.anthropic.com';
  }

  getProvider(): LLMProvider {
    return 'anthropic';
  }

  // ============================================================================
  // API KEY VALIDATION
  // ============================================================================

  async validateApiKey(): Promise<boolean> {
    try {
      // Try a minimal request to validate the API key
      const response = await fetch(`${this.baseURL}/v1/messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
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
    const anthropicRequest = this.convertRequest(request);

    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(anthropicRequest),
    });

    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }

    const data: AnthropicResponse = await response.json();
    return this.convertResponse(data);
  }

  // ============================================================================
  // STREAMING COMPLETION
  // ============================================================================

  protected async executeStreamingCompletion(
    request: LLMCompletionRequest,
    options: LLMStreamOptions
  ): Promise<void> {
    const anthropicRequest = this.convertRequest(request);
    anthropicRequest.stream = true;

    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(anthropicRequest),
    });

    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    await this.processStream(response.body, options);
  }

  private async processStream(
    body: ReadableStream<Uint8Array>,
    options: LLMStreamOptions
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let messageId = '';
    let model = '';
    let fullContent = '';
    let usage: LLMUsage | undefined;

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
            const event: AnthropicStreamEvent = JSON.parse(data);

            switch (event.type) {
              case 'message_start':
                if (event.message) {
                  messageId = event.message.id || '';
                  model = event.message.model || '';
                  if (event.message.usage) {
                    usage = {
                      promptTokens: event.message.usage.input_tokens || 0,
                      completionTokens: event.message.usage.output_tokens || 0,
                      totalTokens:
                        (event.message.usage.input_tokens || 0) +
                        (event.message.usage.output_tokens || 0),
                    };
                  }
                }
                break;

              case 'content_block_delta':
                if (event.delta?.text) {
                  fullContent += event.delta.text;
                  const chunk: LLMStreamChunk = {
                    id: messageId,
                    model,
                    content: event.delta.text,
                  };
                  options.onChunk(chunk);
                }
                break;

              case 'message_delta':
                if (event.usage) {
                  if (usage) {
                    usage.completionTokens = event.usage.output_tokens || 0;
                    usage.totalTokens = usage.promptTokens + usage.completionTokens;
                  }
                }
                break;

              case 'message_stop':
                // Stream complete
                break;
            }
          } catch (error) {
            console.error('Error parsing SSE event:', error, data);
          }
        }
      }

      // Call onComplete with final response
      if (usage) {
        usage.estimatedCost = calculateCost(usage, model).totalCost;
      }

      const finalResponse: LLMCompletionResponse = {
        id: messageId,
        model,
        content: fullContent,
        finishReason: 'stop',
        usage: usage || {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
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

  private convertRequest(request: LLMCompletionRequest): AnthropicRequest {
    // Separate system messages from user/assistant messages
    const systemMessages = request.messages.filter((m) => m.role === 'system');
    const otherMessages = request.messages.filter((m) => m.role !== 'system');

    // Combine system messages into a single system prompt
    const systemPrompt =
      systemMessages.length > 0
        ? systemMessages.map((m) => m.content).join('\n\n')
        : undefined;

    // Convert to Anthropic format
    const messages: AnthropicMessage[] = otherMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    return {
      model: request.model,
      messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature,
      top_p: request.topP,
      stop_sequences: request.stop,
      stream: request.stream,
      system: systemPrompt,
    };
  }

  private convertResponse(response: AnthropicResponse): LLMCompletionResponse {
    const content = response.content.map((c) => c.text).join('');

    const usage: LLMUsage = {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    };

    usage.estimatedCost = calculateCost(usage, response.model).totalCost;

    return {
      id: response.id,
      model: response.model,
      content,
      finishReason: this.mapStopReason(response.stop_reason),
      usage,
    };
  }

  private mapStopReason(
    reason: 'end_turn' | 'max_tokens' | 'stop_sequence'
  ): 'stop' | 'length' | 'function_call' | 'content_filter' | 'error' {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'stop';
    }
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  private async handleErrorResponse(response: Response): Promise<LLMError> {
    let errorData: AnthropicError | undefined;

    try {
      errorData = await response.json();
    } catch {
      // Ignore JSON parse errors
    }

    const message =
      errorData?.error?.message || response.statusText || 'Unknown error';
    const errorType = errorData?.error?.type || 'unknown_error';

    // Map Anthropic error types to LLM error codes
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
      'x-api-key': this.config.apiKey,
      'anthropic-version': this.apiVersion,
    };
  }
}
