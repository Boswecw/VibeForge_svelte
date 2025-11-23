/**
 * LLM Client Service
 * High-level API for interacting with LLM providers from the frontend
 */

import { LLMProviderFactory } from "./factory";
import type {
  LLMConfig,
  LLMChatRequest,
  LLMChatResponse,
  LLMModelInfo,
} from "./types";

class LLMClientService {
  private config: LLMConfig | null = null;

  /**
   * Initialize the LLM client with configuration
   * @param config LLM configuration
   */
  initialize(config: LLMConfig): void {
    this.config = config;
    this.saveConfig(config);
  }

  /**
   * Get current configuration from localStorage
   * @returns Current config or null
   */
  getConfig(): LLMConfig | null {
    if (this.config) return this.config;

    const stored = localStorage.getItem("llm_config");
    if (stored) {
      try {
        this.config = JSON.parse(stored);
        return this.config;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Save configuration to localStorage
   * @param config Configuration to save
   */
  private saveConfig(config: LLMConfig): void {
    localStorage.setItem("llm_config", JSON.stringify(config));
  }

  /**
   * Send a chat request
   * @param messages Chat messages
   * @param options Optional overrides
   * @returns Chat response
   */
  async chat(
    messages: LLMChatRequest["messages"],
    options?: Partial<LLMChatRequest>
  ): Promise<LLMChatResponse> {
    const config = this.getConfig();
    if (!config) {
      throw new Error("LLM client not initialized. Call initialize() first.");
    }

    const provider = LLMProviderFactory.getProvider(config);
    return provider.chat({
      messages,
      model: config.model,
      ...options,
    });
  }

  /**
   * Stream a chat request
   * @param messages Chat messages
   * @param options Optional overrides
   * @returns Async generator of chunks
   */
  async *stream(
    messages: LLMChatRequest["messages"],
    options?: Partial<LLMChatRequest>
  ): AsyncGenerator<any> {
    const config = this.getConfig();
    if (!config) {
      throw new Error("LLM client not initialized. Call initialize() first.");
    }

    const provider = LLMProviderFactory.getProvider(config);
    yield* provider.stream({
      messages,
      model: config.model,
      ...options,
    });
  }

  /**
   * Get available models for current provider
   * @returns List of models
   */
  async getModels(): Promise<LLMModelInfo[]> {
    const config = this.getConfig();
    if (!config) {
      throw new Error("LLM client not initialized. Call initialize() first.");
    }

    const provider = LLMProviderFactory.getProvider(config);
    return provider.getModels();
  }

  /**
   * Count tokens in text
   * @param text Text to count
   * @returns Token count
   */
  async countTokens(text: string): Promise<number> {
    const config = this.getConfig();
    if (!config) {
      throw new Error("LLM client not initialized. Call initialize() first.");
    }

    const provider = LLMProviderFactory.getProvider(config);
    return provider.countTokens(text, config.model);
  }

  /**
   * Estimate cost for a request
   * @param promptTokens Prompt token count
   * @param completionTokens Completion token count
   * @returns Cost in USD
   */
  estimateCost(promptTokens: number, completionTokens: number): number {
    const config = this.getConfig();
    if (!config) return 0;

    const provider = LLMProviderFactory.getProvider(config);
    return provider.estimateCost(promptTokens, completionTokens, config.model);
  }

  /**
   * Check if provider is configured and available
   * @returns Status
   */
  async checkStatus(): Promise<{ available: boolean; error?: string }> {
    const config = this.getConfig();
    if (!config) {
      return { available: false, error: "Not configured" };
    }

    const provider = LLMProviderFactory.getProvider(config);
    const status = await provider.checkStatus();
    return {
      available: status.available,
      error: status.error,
    };
  }

  /**
   * Test a configuration without saving it
   * @param config Configuration to test
   * @returns Test result
   */
  async testConfig(
    config: LLMConfig
  ): Promise<{ success: boolean; error?: string }> {
    return LLMProviderFactory.testProvider(config);
  }
}

// Export singleton instance
export const llmClient = new LLMClientService();
