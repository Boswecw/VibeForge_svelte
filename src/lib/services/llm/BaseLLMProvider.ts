/**
 * Base LLM Provider Interface
 * Abstract class that all provider implementations must extend
 */

import type {
	LLMChatRequest,
	LLMChatResponse,
	LLMStreamChunk,
	LLMModelInfo,
	LLMProviderStatus,
	LLMConfig
} from "./types";

export abstract class BaseLLMProvider {
	protected config: LLMConfig;
	protected providerName: string;

	constructor(config: LLMConfig, providerName: string) {
		this.config = config;
		this.providerName = providerName;
	}

	/**
	 * Send a chat completion request
	 * @param request Chat request with messages and parameters
	 * @returns Chat response with content and usage stats
	 */
	abstract chat(request: LLMChatRequest): Promise<LLMChatResponse>;

	/**
	 * Send a streaming chat completion request
	 * @param request Chat request with messages and parameters
	 * @returns Async generator yielding stream chunks
	 */
	abstract stream(request: LLMChatRequest): AsyncGenerator<LLMStreamChunk>;

	/**
	 * Count tokens in a string (provider-specific tokenization)
	 * @param text Text to count tokens for
	 * @param model Optional model name for accurate counting
	 * @returns Number of tokens
	 */
	abstract countTokens(text: string, model?: string): Promise<number>;

	/**
	 * Get list of available models from this provider
	 * @returns Array of model information
	 */
	abstract getModels(): Promise<LLMModelInfo[]>;

	/**
	 * Check if provider is available and configured correctly
	 * @returns Provider status with availability info
	 */
	abstract checkStatus(): Promise<LLMProviderStatus>;

	/**
	 * Estimate cost for a request
	 * @param promptTokens Number of prompt tokens
	 * @param completionTokens Number of completion tokens
	 * @param model Model name
	 * @returns Estimated cost in USD
	 */
	abstract estimateCost(
		promptTokens: number,
		completionTokens: number,
		model: string
	): number;

	/**
	 * Update provider configuration
	 * @param config New configuration (partial)
	 */
	updateConfig(config: Partial<LLMConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Get current configuration
	 * @returns Current config (sanitized, no API keys)
	 */
	getConfig(): Omit<LLMConfig, "apiKey"> {
		const { apiKey, ...sanitized } = this.config;
		return sanitized;
	}

	/**
	 * Retry logic with exponential backoff
	 * @param fn Function to retry
	 * @param maxAttempts Maximum number of attempts
	 * @param baseDelay Base delay in ms
	 * @returns Result of successful attempt
	 */
	protected async retryWithBackoff<T>(
		fn: () => Promise<T>,
		maxAttempts: number = this.config.retryAttempts,
		baseDelay: number = this.config.retryDelay
	): Promise<T> {
		let lastError: Error | undefined;

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			try {
				return await fn();
			} catch (error) {
				lastError = error as Error;

				// Don't retry on auth errors
				if (error instanceof Error && error.name === "LLMAuthError") {
					throw error;
				}

				// Don't retry on last attempt
				if (attempt === maxAttempts - 1) {
					throw error;
				}

				// Calculate delay with exponential backoff
				const delay = baseDelay * Math.pow(2, attempt);
				const jitter = Math.random() * delay * 0.1; // 10% jitter
				await new Promise((resolve) => setTimeout(resolve, delay + jitter));
			}
		}

		throw lastError;
	}

	/**
	 * Create timeout promise
	 * @param ms Timeout in milliseconds
	 * @returns Promise that rejects after timeout
	 */
	protected timeoutPromise(ms: number): Promise<never> {
		return new Promise((_, reject) =>
			setTimeout(() => {
				reject(
					new Error(
						`Request timed out after ${ms}ms for provider ${this.providerName}`
					)
				);
			}, ms)
		);
	}

	/**
	 * Sanitize error for logging (remove sensitive info)
	 * @param error Original error
	 * @returns Sanitized error message
	 */
	protected sanitizeError(error: unknown): string {
		if (error instanceof Error) {
			return error.message.replace(/\b[A-Za-z0-9_-]{20,}\b/g, "[REDACTED]");
		}
		return String(error);
	}
}
