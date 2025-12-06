/**
 * VibeForge V2 - Base LLM Provider
 *
 * Abstract base class for all LLM provider implementations
 */

import type {
  LLMProvider,
  LLMProviderConfig,
  LLMCompletionRequest,
  LLMCompletionResponse,
  LLMStreamOptions,
  LLMError,
  LLMErrorCode,
  RetryConfig,
  RetryState,
  RateLimitConfig,
  RateLimitState,
} from './types';

export abstract class BaseLLMProvider {
  protected config: LLMProviderConfig;
  protected retryConfig: RetryConfig;
  protected rateLimitConfig?: RateLimitConfig;
  protected rateLimitState?: RateLimitState;

  constructor(config: LLMProviderConfig) {
    this.config = {
      timeout: 60000,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };

    this.retryConfig = {
      maxRetries: this.config.maxRetries!,
      initialDelay: this.config.retryDelay!,
      maxDelay: 60000,
      backoffFactor: 2,
      retryableErrors: [
        'rate_limit_exceeded',
        'timeout',
        'network_error',
        'server_error',
      ],
    };
  }

  // ============================================================================
  // ABSTRACT METHODS (must be implemented by subclasses)
  // ============================================================================

  /**
   * Get the provider name
   */
  abstract getProvider(): LLMProvider;

  /**
   * Complete a prompt (non-streaming)
   */
  protected abstract executeCompletion(
    request: LLMCompletionRequest
  ): Promise<LLMCompletionResponse>;

  /**
   * Complete a prompt with streaming
   */
  protected abstract executeStreamingCompletion(
    request: LLMCompletionRequest,
    options: LLMStreamOptions
  ): Promise<void>;

  /**
   * Validate API key
   */
  abstract validateApiKey(): Promise<boolean>;

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Complete a prompt
   */
  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
    // Check rate limits
    if (this.rateLimitConfig && this.rateLimitState) {
      this.checkRateLimit(request);
    }

    // Execute with retry logic
    return this.withRetry(async () => {
      const response = await this.executeCompletion(request);

      // Update rate limit state
      if (this.rateLimitState) {
        this.updateRateLimitState(response.usage.totalTokens);
      }

      return response;
    });
  }

  /**
   * Complete a prompt with streaming
   */
  async completeStream(
    request: LLMCompletionRequest,
    options: LLMStreamOptions
  ): Promise<void> {
    // Check rate limits
    if (this.rateLimitConfig && this.rateLimitState) {
      this.checkRateLimit(request);
    }

    // Execute with retry logic
    return this.withRetry(async () => {
      await this.executeStreamingCompletion(request, {
        ...options,
        onComplete: (response) => {
          // Update rate limit state
          if (this.rateLimitState) {
            this.updateRateLimitState(response.usage.totalTokens);
          }
          options.onComplete?.(response);
        },
      });
    });
  }

  /**
   * Set rate limit configuration
   */
  setRateLimitConfig(config: RateLimitConfig) {
    this.rateLimitConfig = config;
    this.rateLimitState = {
      requestsInWindow: 0,
      tokensInWindow: 0,
      tokensToday: 0,
      windowStart: Date.now(),
      dayStart: this.getStartOfDay(),
    };
  }

  /**
   * Get current rate limit state
   */
  getRateLimitState(): RateLimitState | undefined {
    return this.rateLimitState;
  }

  // ============================================================================
  // RETRY LOGIC
  // ============================================================================

  protected async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    const state: RetryState = { attempt: 0 };

    while (state.attempt <= this.retryConfig.maxRetries) {
      try {
        return await this.withTimeout(fn(), this.config.timeout!);
      } catch (error) {
        state.attempt++;
        state.lastError = this.normalizeError(error);

        // Don't retry if not retryable or max retries exceeded
        if (
          !this.isRetryableError(state.lastError) ||
          state.attempt > this.retryConfig.maxRetries
        ) {
          throw state.lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffFactor, state.attempt - 1),
          this.retryConfig.maxDelay
        );

        state.nextRetryAt = Date.now() + delay;

        console.warn(
          `[${this.getProvider()}] Request failed, retrying in ${delay}ms (attempt ${state.attempt}/${this.retryConfig.maxRetries})`,
          state.lastError
        );

        await this.sleep(delay);
      }
    }

    throw state.lastError;
  }

  protected isRetryableError(error: LLMError): boolean {
    return this.retryConfig.retryableErrors.includes(error.code);
  }

  // ============================================================================
  // RATE LIMITING
  // ============================================================================

  protected checkRateLimit(request: LLMCompletionRequest) {
    if (!this.rateLimitConfig || !this.rateLimitState) return;

    const now = Date.now();
    const windowDuration = 60000; // 1 minute

    // Reset window if needed
    if (now - this.rateLimitState.windowStart >= windowDuration) {
      this.rateLimitState.requestsInWindow = 0;
      this.rateLimitState.tokensInWindow = 0;
      this.rateLimitState.windowStart = now;
    }

    // Reset day if needed
    if (now >= this.rateLimitState.dayStart + 86400000) {
      this.rateLimitState.tokensToday = 0;
      this.rateLimitState.dayStart = this.getStartOfDay();
    }

    // Check requests per minute
    if (this.rateLimitState.requestsInWindow >= this.rateLimitConfig.requestsPerMinute) {
      throw new LLMError(
        'rate_limit_exceeded',
        `Rate limit exceeded: ${this.rateLimitConfig.requestsPerMinute} requests per minute`,
        429,
        true
      );
    }

    // Estimate tokens for this request (rough estimate)
    const estimatedTokens = this.estimateTokens(request);

    // Check tokens per minute
    if (
      this.rateLimitState.tokensInWindow + estimatedTokens >
      this.rateLimitConfig.tokensPerMinute
    ) {
      throw new LLMError(
        'rate_limit_exceeded',
        `Rate limit exceeded: ${this.rateLimitConfig.tokensPerMinute} tokens per minute`,
        429,
        true
      );
    }

    // Check tokens per day
    if (this.rateLimitConfig.tokensPerDay) {
      if (
        this.rateLimitState.tokensToday + estimatedTokens >
        this.rateLimitConfig.tokensPerDay
      ) {
        throw new LLMError(
          'rate_limit_exceeded',
          `Rate limit exceeded: ${this.rateLimitConfig.tokensPerDay} tokens per day`,
          429,
          false
        );
      }
    }

    // Update counters
    this.rateLimitState.requestsInWindow++;
  }

  protected updateRateLimitState(tokens: number) {
    if (!this.rateLimitState) return;

    this.rateLimitState.tokensInWindow += tokens;
    this.rateLimitState.tokensToday += tokens;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  protected async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new LLMError('timeout', `Request timeout after ${timeout}ms`, undefined, true)
            ),
          timeout
        )
      ),
    ]);
  }

  protected normalizeError(error: unknown): LLMError {
    if (error instanceof LLMError) {
      return error;
    }

    if (error instanceof Error) {
      // Try to infer error code from message
      const message = error.message.toLowerCase();
      let code: LLMErrorCode = 'unknown_error';

      if (message.includes('api key') || message.includes('unauthorized')) {
        code = 'invalid_api_key';
      } else if (message.includes('rate limit')) {
        code = 'rate_limit_exceeded';
      } else if (message.includes('context') || message.includes('too long')) {
        code = 'context_length_exceeded';
      } else if (message.includes('timeout')) {
        code = 'timeout';
      } else if (message.includes('network') || message.includes('fetch')) {
        code = 'network_error';
      }

      return new LLMError(code, error.message, undefined, code !== 'invalid_api_key');
    }

    return new LLMError('unknown_error', String(error), undefined, true);
  }

  protected estimateTokens(request: LLMCompletionRequest): number {
    // Rough estimate: ~4 characters per token
    const totalChars = request.messages.reduce(
      (sum, msg) => sum + msg.content.length,
      0
    );
    return Math.ceil(totalChars / 4) + (request.maxTokens || 1000);
  }

  protected getStartOfDay(): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
