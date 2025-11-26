/**
 * Ollama Provider Implementation
 * Supports local LLM models via Ollama
 */

import { BaseLLMProvider } from "./BaseLLMProvider";
import type {
  LLMChatRequest,
  LLMChatResponse,
  LLMStreamChunk,
  LLMModelInfo,
  LLMProviderStatus,
  LLMConfig,
} from "./types";
import { LLMError, LLMTimeoutError } from "./types";

export class OllamaProvider extends BaseLLMProvider {
  private readonly baseUrl: string;

  constructor(config: LLMConfig) {
    super(config, "Ollama");
    this.baseUrl = config.baseUrl || "http://localhost:11434";
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
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: request.model || this.config.model,
          messages: request.messages,
          stream: false,
          options: {
            temperature: request.temperature ?? this.config.temperature,
            num_predict: request.maxTokens ?? this.config.maxTokens,
            top_p: request.topP,
            stop: request.stopSequences,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new LLMError(
          `Ollama request failed: ${errorText}`,
          "REQUEST_FAILED",
          "Ollama",
          response.status
        );
      }

      const data = await response.json();

      return {
        content: data.message.content,
        model: data.model,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        finishReason: data.done ? "stop" : null,
        metadata: {
          created_at: data.created_at,
          total_duration: data.total_duration,
          load_duration: data.load_duration,
          prompt_eval_duration: data.prompt_eval_duration,
          eval_duration: data.eval_duration,
        },
      };
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      throw new LLMError(
        `Ollama request failed: ${this.sanitizeError(error)}`,
        "REQUEST_FAILED",
        "Ollama",
        undefined,
        error
      );
    }
  }

  async *stream(request: LLMChatRequest): AsyncGenerator<LLMStreamChunk> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: request.model || this.config.model,
          messages: request.messages,
          stream: true,
          options: {
            temperature: request.temperature ?? this.config.temperature,
            num_predict: request.maxTokens ?? this.config.maxTokens,
            top_p: request.topP,
            stop: request.stopSequences,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new LLMError(
          `Ollama stream failed: ${errorText}`,
          "STREAM_FAILED",
          "Ollama",
          response.status
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new LLMError("No response body", "NO_BODY", "Ollama");
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
          if (!trimmed) continue;

          try {
            const data = JSON.parse(trimmed);

            if (data.message?.content) {
              yield {
                content: data.message.content,
                isDone: false,
              };
            }

            if (data.done) {
              yield {
                content: "",
                isDone: true,
                usage: {
                  promptTokens: data.prompt_eval_count || 0,
                  completionTokens: data.eval_count || 0,
                  totalTokens:
                    (data.prompt_eval_count || 0) + (data.eval_count || 0),
                },
              };
            }
          } catch (e) {
            console.error("Failed to parse Ollama stream data:", e);
          }
        }
      }
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      throw new LLMError(
        `Ollama stream failed: ${this.sanitizeError(error)}`,
        "STREAM_FAILED",
        "Ollama",
        undefined,
        error
      );
    }
  }

  async countTokens(text: string, model?: string): Promise<number> {
    // Ollama doesn't have a token counting endpoint, approximate
    return Math.ceil(text.length / 4);
  }

  async getModels(): Promise<LLMModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);

      if (!response.ok) {
        throw new LLMError("Failed to fetch models", "MODELS_FAILED", "Ollama");
      }

      const data = await response.json();

      return (data.models as Array<{ name: string; size: number }>).map((model) => ({
        id: model.name,
        name: model.name,
        description: `Local Ollama model (${this.formatBytes(model.size)})`,
        contextWindow: this.estimateContextWindow(model.name),
        maxOutputTokens: 2048,
        costPer1kPromptTokens: 0, // Free for local models
        costPer1kCompletionTokens: 0,
        capabilities: {
          chat: true,
          functions: false,
          vision: model.name.includes("vision") || model.name.includes("llava"),
          streaming: true,
        },
      }));
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      throw new LLMError(
        `Failed to fetch Ollama models: ${this.sanitizeError(error)}`,
        "MODELS_FAILED",
        "Ollama",
        undefined,
        error
      );
    }
  }

  async checkStatus(): Promise<LLMProviderStatus> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);

      return {
        available: response.ok,
        configured: true, // No API key needed
        latency: Date.now() - startTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        available: false,
        configured: true,
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
    // Local models are free
    return 0;
  }

  private estimateContextWindow(modelName: string): number {
    // Estimate based on model name patterns
    if (modelName.includes("70b") || modelName.includes("mixtral")) {
      return 32768;
    }
    if (modelName.includes("13b")) {
      return 8192;
    }
    if (modelName.includes("7b")) {
      return 4096;
    }
    return 2048; // Default
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}
