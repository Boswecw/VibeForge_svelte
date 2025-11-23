/**
 * OpenAI Provider Implementation
 * Supports GPT-4, GPT-3.5-turbo, and other OpenAI models
 */

import { BaseLLMProvider } from "./BaseLLMProvider";
import type {
	LLMChatRequest,
	LLMChatResponse,
	LLMStreamChunk,
	LLMModelInfo,
	LLMProviderStatus
} from "./types";
import { LLMError, LLMRateLimitError, LLMAuthError, LLMTimeoutError } from "./types";

export class OpenAIProvider extends BaseLLMProvider {
	private readonly baseUrl: string;

	constructor(config: any) {
		super(config, "OpenAI");
		this.baseUrl = config.baseUrl || "https://api.openai.com/v1";
	}

	async chat(request: LLMChatRequest): Promise<LLMChatResponse> {
		return this.retryWithBackoff(async () => {
			const response = await Promise.race([
				this.makeChatRequest(request),
				this.timeoutPromise(this.config.timeout)
			]);

			return response;
		});
	}

	private async makeChatRequest(request: LLMChatRequest): Promise<LLMChatResponse> {
		try {
			const response = await fetch(`${this.baseUrl}/chat/completions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.config.apiKey}`
				},
				body: JSON.stringify({
					model: request.model || this.config.model,
					messages: request.messages,
					temperature: request.temperature ?? this.config.temperature,
					max_tokens: request.maxTokens ?? this.config.maxTokens,
					stream: false,
					stop: request.stopSequences,
					top_p: request.topP,
					frequency_penalty: request.frequencyPenalty,
					presence_penalty: request.presencePenalty
				})
			});

			if (!response.ok) {
				await this.handleErrorResponse(response);
			}

			const data = await response.json();

			return {
				content: data.choices[0].message.content,
				model: data.model,
				usage: {
					promptTokens: data.usage.prompt_tokens,
					completionTokens: data.usage.completion_tokens,
					totalTokens: data.usage.total_tokens
				},
				finishReason: data.choices[0].finish_reason,
				metadata: {
					id: data.id,
					created: data.created
				}
			};
		} catch (error) {
			if (error instanceof LLMError) {
				throw error;
			}
			throw new LLMError(
				`OpenAI request failed: ${this.sanitizeError(error)}`,
				"REQUEST_FAILED",
				"OpenAI",
				undefined,
				error
			);
		}
	}

	async *stream(request: LLMChatRequest): AsyncGenerator<LLMStreamChunk> {
		try {
			const response = await fetch(`${this.baseUrl}/chat/completions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.config.apiKey}`
				},
				body: JSON.stringify({
					model: request.model || this.config.model,
					messages: request.messages,
					temperature: request.temperature ?? this.config.temperature,
					max_tokens: request.maxTokens ?? this.config.maxTokens,
					stream: true,
					stop: request.stopSequences,
					top_p: request.topP,
					frequency_penalty: request.frequencyPenalty,
					presence_penalty: request.presencePenalty
				})
			});

			if (!response.ok) {
				await this.handleErrorResponse(response);
			}

			const reader = response.body?.getReader();
			if (!reader) {
				throw new LLMError("No response body", "NO_BODY", "OpenAI");
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
					if (!trimmed || trimmed === "data: [DONE]") continue;

					if (trimmed.startsWith("data: ")) {
						const jsonStr = trimmed.slice(6);
						try {
							const data = JSON.parse(jsonStr);
							const delta = data.choices[0]?.delta;

							if (delta?.content) {
								yield {
									content: delta.content,
									isDone: false
								};
							}

							if (data.choices[0]?.finish_reason) {
								yield {
									content: "",
									isDone: true,
									usage: data.usage
										? {
												promptTokens: data.usage.prompt_tokens,
												completionTokens: data.usage.completion_tokens,
												totalTokens: data.usage.total_tokens
										  }
										: undefined
								};
							}
						} catch (e) {
							console.error("Failed to parse SSE data:", e);
						}
					}
				}
			}
		} catch (error) {
			if (error instanceof LLMError) {
				throw error;
			}
			throw new LLMError(
				`OpenAI stream failed: ${this.sanitizeError(error)}`,
				"STREAM_FAILED",
				"OpenAI",
				undefined,
				error
			);
		}
	}

	async countTokens(text: string, model?: string): Promise<number> {
		// Rough approximation: 1 token ≈ 4 characters
		// For production, use tiktoken library
		return Math.ceil(text.length / 4);
	}

	async getModels(): Promise<LLMModelInfo[]> {
		try {
			const response = await fetch(`${this.baseUrl}/models`, {
				headers: {
					Authorization: `Bearer ${this.config.apiKey}`
				}
			});

			if (!response.ok) {
				await this.handleErrorResponse(response);
			}

			const data = await response.json();

			// Filter to chat models only and add metadata
			const chatModels = data.data
				.filter((model: any) => model.id.includes("gpt"))
				.map((model: any) => this.getModelInfo(model.id));

			return chatModels;
		} catch (error) {
			if (error instanceof LLMError) {
				throw error;
			}
			throw new LLMError(
				`Failed to fetch models: ${this.sanitizeError(error)}`,
				"MODELS_FAILED",
				"OpenAI",
				undefined,
				error
			);
		}
	}

	async checkStatus(): Promise<LLMProviderStatus> {
		const startTime = Date.now();

		try {
			// Simple health check: list models
			await fetch(`${this.baseUrl}/models`, {
				headers: {
					Authorization: `Bearer ${this.config.apiKey}`
				}
			});

			return {
				available: true,
				configured: Boolean(this.config.apiKey),
				latency: Date.now() - startTime,
				lastChecked: new Date()
			};
		} catch (error) {
			return {
				available: false,
				configured: Boolean(this.config.apiKey),
				error: this.sanitizeError(error),
				latency: Date.now() - startTime,
				lastChecked: new Date()
			};
		}
	}

	estimateCost(promptTokens: number, completionTokens: number, model: string): number {
		const modelInfo = this.getModelInfo(model);
		const promptCost = (promptTokens / 1000) * modelInfo.costPer1kPromptTokens;
		const completionCost = (completionTokens / 1000) * modelInfo.costPer1kCompletionTokens;
		return promptCost + completionCost;
	}

	private getModelInfo(modelId: string): LLMModelInfo {
		// OpenAI model pricing and specs (as of Nov 2025)
		const modelSpecs: Record<string, Partial<LLMModelInfo>> = {
			"gpt-4": {
				contextWindow: 8192,
				maxOutputTokens: 4096,
				costPer1kPromptTokens: 0.03,
				costPer1kCompletionTokens: 0.06
			},
			"gpt-4-turbo": {
				contextWindow: 128000,
				maxOutputTokens: 4096,
				costPer1kPromptTokens: 0.01,
				costPer1kCompletionTokens: 0.03
			},
			"gpt-4o": {
				contextWindow: 128000,
				maxOutputTokens: 4096,
				costPer1kPromptTokens: 0.0025,
				costPer1kCompletionTokens: 0.01
			},
			"gpt-3.5-turbo": {
				contextWindow: 16385,
				maxOutputTokens: 4096,
				costPer1kPromptTokens: 0.0005,
				costPer1kCompletionTokens: 0.0015
			}
		};

		// Find matching spec (partial match for model variants)
		const specKey = Object.keys(modelSpecs).find((key) => modelId.startsWith(key));
		const spec = specKey ? modelSpecs[specKey] : {};

		return {
			id: modelId,
			name: modelId,
			description: `OpenAI ${modelId} model`,
			contextWindow: spec.contextWindow || 4096,
			maxOutputTokens: spec.maxOutputTokens || 2048,
			costPer1kPromptTokens: spec.costPer1kPromptTokens || 0.01,
			costPer1kCompletionTokens: spec.costPer1kCompletionTokens || 0.03,
			capabilities: {
				chat: true,
				functions: true,
				vision: modelId.includes("vision") || modelId.includes("4o"),
				streaming: true
			}
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

		const message = errorData.error?.message || "Unknown error";

		if (status === 401 || status === 403) {
			throw new LLMAuthError(`OpenAI authentication failed: ${message}`, "OpenAI");
		}

		if (status === 429) {
			const retryAfter = response.headers.get("retry-after");
			throw new LLMRateLimitError(
				`OpenAI rate limit exceeded: ${message}`,
				"OpenAI",
				retryAfter ? parseInt(retryAfter) : undefined
			);
		}

		if (status === 408 || status === 504) {
			throw new LLMTimeoutError(
				`OpenAI request timed out: ${message}`,
				"OpenAI",
				this.config.timeout
			);
		}

		throw new LLMError(message, "API_ERROR", "OpenAI", status);
	}
}
