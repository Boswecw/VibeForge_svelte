/**
 * Anthropic Claude Provider Implementation
 * Supports Claude 3 Opus, Sonnet, and Haiku models
 */

import { BaseLLMProvider } from "./BaseLLMProvider";
import type {
  LLMChatRequest,
  LLMChatResponse,
  LLMStreamChunk,
  LLMModelInfo,
  LLMProviderStatus,
} from "./types";
import {
  LLMError,
  LLMRateLimitError,
  LLMAuthError,
  LLMTimeoutError,
} from "./types";

export class AnthropicProvider extends BaseLLMProvider {
  private readonly baseUrl: string;

  constructor(config: any) {
    super(config, "Anthropic");
    this.baseUrl = config.baseUrl || "https://api.anthropic.com/v1";
  }

  async chat(request: LLMChatRequest): Promise<LLMChatResponse> {
    return this.retryWithBackoff(async () => {
      const response = await Promise.race([
        this.makeChatRequest(request),
        this.timeoutPromise(this.config.timeout),
      ]);

      return response;
    });
  }

  private async makeChatRequest(
    request: LLMChatRequest
  ): Promise<LLMChatResponse> {
    try {
      // Anthropic requires system messages to be separate
      const systemMessage = request.messages.find((m) => m.role === "system");
      const conversationMessages = request.messages.filter(
        (m) => m.role !== "system"
      );

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey || "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: request.model || this.config.model,
          messages: conversationMessages,
          system: systemMessage?.content,
          max_tokens: request.maxTokens ?? this.config.maxTokens,
          temperature: request.temperature ?? this.config.temperature,
          stream: false,
          stop_sequences: request.stopSequences,
          top_p: request.topP,
        }),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();

      return {
        content: data.content[0].text,
        model: data.model,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
        finishReason:
          data.stop_reason === "end_turn" ? "stop" : data.stop_reason,
        metadata: {
          id: data.id,
          type: data.type,
        },
      };
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      throw new LLMError(
        `Anthropic request failed: ${this.sanitizeError(error)}`,
        "REQUEST_FAILED",
        "Anthropic",
        undefined,
        error
      );
    }
  }

  async *stream(request: LLMChatRequest): AsyncGenerator<LLMStreamChunk> {
    try {
      const systemMessage = request.messages.find((m) => m.role === "system");
      const conversationMessages = request.messages.filter(
        (m) => m.role !== "system"
      );

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey || "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: request.model || this.config.model,
          messages: conversationMessages,
          system: systemMessage?.content,
          max_tokens: request.maxTokens ?? this.config.maxTokens,
          temperature: request.temperature ?? this.config.temperature,
          stream: true,
          stop_sequences: request.stopSequences,
          top_p: request.topP,
        }),
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new LLMError("No response body", "NO_BODY", "Anthropic");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);

            if (data.type === "content_block_delta" && data.delta?.text) {
              yield {
                content: data.delta.text,
                isDone: false,
              };
            }

            if (data.type === "message_stop") {
              yield {
                content: "",
                isDone: true,
                usage: data.usage
                  ? {
                      promptTokens: data.usage.input_tokens,
                      completionTokens: data.usage.output_tokens,
                      totalTokens:
                        data.usage.input_tokens + data.usage.output_tokens,
                    }
                  : undefined,
              };
            }
          } catch (e) {
            console.error("Failed to parse SSE data:", e);
          }
        }
      }
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      throw new LLMError(
        `Anthropic stream failed: ${this.sanitizeError(error)}`,
        "STREAM_FAILED",
        "Anthropic",
        undefined,
        error
      );
    }
  }

  async countTokens(text: string, model?: string): Promise<number> {
    // Rough approximation: Claude uses similar tokenization to GPT
    return Math.ceil(text.length / 4);
  }

  async getModels(): Promise<LLMModelInfo[]> {
    // Anthropic doesn't have a models endpoint, return known models
    return [
      this.getModelInfo("claude-3-opus-20240229"),
      this.getModelInfo("claude-3-sonnet-20240229"),
      this.getModelInfo("claude-3-haiku-20240307"),
      this.getModelInfo("claude-3-5-sonnet-20241022"),
    ];
  }

  async checkStatus(): Promise<LLMProviderStatus> {
    const startTime = Date.now();

    try {
      // Simple health check with a minimal request
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey || "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          messages: [{ role: "user", content: "test" }],
          max_tokens: 1,
        }),
      });

      return {
        available: response.ok || response.status === 400, // 400 is ok for test
        configured: Boolean(this.config.apiKey),
        latency: Date.now() - startTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        available: false,
        configured: Boolean(this.config.apiKey),
        error: this.sanitizeError(error),
        latency: Date.now() - startTime,
        lastChecked: new Date(),
      };
    }
  }

  estimateCost(
    promptTokens: number,
    completionTokens: number,
    model: string
  ): number {
    const modelInfo = this.getModelInfo(model);
    const promptCost = (promptTokens / 1000) * modelInfo.costPer1kPromptTokens;
    const completionCost =
      (completionTokens / 1000) * modelInfo.costPer1kCompletionTokens;
    return promptCost + completionCost;
  }

  private getModelInfo(modelId: string): LLMModelInfo {
    const modelSpecs: Record<string, Partial<LLMModelInfo>> = {
      "claude-3-opus-20240229": {
        name: "Claude 3 Opus",
        description: "Most capable Claude model for complex tasks",
        contextWindow: 200000,
        maxOutputTokens: 4096,
        costPer1kPromptTokens: 0.015,
        costPer1kCompletionTokens: 0.075,
      },
      "claude-3-sonnet-20240229": {
        name: "Claude 3 Sonnet",
        description: "Balanced performance and speed",
        contextWindow: 200000,
        maxOutputTokens: 4096,
        costPer1kPromptTokens: 0.003,
        costPer1kCompletionTokens: 0.015,
      },
      "claude-3-haiku-20240307": {
        name: "Claude 3 Haiku",
        description: "Fastest and most compact Claude model",
        contextWindow: 200000,
        maxOutputTokens: 4096,
        costPer1kPromptTokens: 0.00025,
        costPer1kCompletionTokens: 0.00125,
      },
      "claude-3-5-sonnet-20241022": {
        name: "Claude 3.5 Sonnet",
        description: "Latest and most capable Sonnet model",
        contextWindow: 200000,
        maxOutputTokens: 8192,
        costPer1kPromptTokens: 0.003,
        costPer1kCompletionTokens: 0.015,
      },
    };

    const spec = modelSpecs[modelId] || {};

    return {
      id: modelId,
      name: spec.name || modelId,
      description: spec.description || `Anthropic ${modelId}`,
      contextWindow: spec.contextWindow || 200000,
      maxOutputTokens: spec.maxOutputTokens || 4096,
      costPer1kPromptTokens: spec.costPer1kPromptTokens || 0.003,
      costPer1kCompletionTokens: spec.costPer1kCompletionTokens || 0.015,
      capabilities: {
        chat: true,
        functions: false,
        vision: modelId.includes("opus") || modelId.includes("sonnet"),
        streaming: true,
      },
    };
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    const status = response.status;
    let errorData: any;

    try {
      errorData = await response.json();
    } catch {
      errorData = { error: { message: await response.text() } };
    }

    const message =
      errorData.error?.message || errorData.message || "Unknown error";

    if (status === 401 || status === 403) {
      throw new LLMAuthError(
        `Anthropic authentication failed: ${message}`,
        "Anthropic"
      );
    }

    if (status === 429) {
      const retryAfter = response.headers.get("retry-after");
      throw new LLMRateLimitError(
        `Anthropic rate limit exceeded: ${message}`,
        "Anthropic",
        retryAfter ? parseInt(retryAfter) : undefined
      );
    }

    if (status === 408 || status === 504) {
      throw new LLMTimeoutError(
        `Anthropic request timed out: ${message}`,
        "Anthropic",
        this.config.timeout
      );
    }

    throw new LLMError(message, "API_ERROR", "Anthropic", status);
  }
}
