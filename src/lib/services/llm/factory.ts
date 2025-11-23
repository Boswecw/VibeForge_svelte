/**
 * LLM Provider Factory
 * Creates and manages LLM provider instances
 */

import { BaseLLMProvider } from "./BaseLLMProvider";
import { OpenAIProvider } from "./OpenAIProvider";
import { AnthropicProvider } from "./AnthropicProvider";
import { OllamaProvider } from "./OllamaProvider";
import type { LLMConfig, LLMProviderType } from "./types";
import { LLMError } from "./types";

export class LLMProviderFactory {
  private static instances: Map<string, BaseLLMProvider> = new Map();

  /**
   * Create or get a provider instance
   * @param config Provider configuration
   * @returns Provider instance
   */
  static getProvider(config: LLMConfig): BaseLLMProvider {
    const cacheKey = `${config.provider}-${config.model}`;

    // Return cached instance if exists
    if (this.instances.has(cacheKey)) {
      const instance = this.instances.get(cacheKey)!;
      instance.updateConfig(config);
      return instance;
    }

    // Create new instance
    const provider = this.createProvider(config);
    this.instances.set(cacheKey, provider);
    return provider;
  }

  /**
   * Create a new provider instance
   * @param config Provider configuration
   * @returns New provider instance
   */
  private static createProvider(config: LLMConfig): BaseLLMProvider {
    switch (config.provider) {
      case "openai":
        return new OpenAIProvider(config);
      case "anthropic":
        return new AnthropicProvider(config);
      case "ollama":
        return new OllamaProvider(config);
      default:
        throw new LLMError(
          `Unknown provider: ${config.provider}`,
          "UNKNOWN_PROVIDER",
          config.provider
        );
    }
  }

  /**
   * Clear all cached provider instances
   */
  static clearCache(): void {
    this.instances.clear();
  }

  /**
   * Get default configuration for a provider
   * @param provider Provider type
   * @returns Default configuration
   */
  static getDefaultConfig(provider: LLMProviderType): Partial<LLMConfig> {
    const baseConfig = {
      temperature: 0.7,
      maxTokens: 2048,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    };

    switch (provider) {
      case "openai":
        return {
          ...baseConfig,
          provider: "openai",
          model: "gpt-4o",
          baseUrl: "https://api.openai.com/v1",
        };
      case "anthropic":
        return {
          ...baseConfig,
          provider: "anthropic",
          model: "claude-3-5-sonnet-20241022",
          baseUrl: "https://api.anthropic.com/v1",
        };
      case "ollama":
        return {
          ...baseConfig,
          provider: "ollama",
          model: "llama2",
          baseUrl: "http://localhost:11434",
        };
      case "custom":
        return {
          ...baseConfig,
          provider: "custom",
          model: "custom-model",
        };
    }
  }

  /**
   * Test a provider configuration
   * @param config Configuration to test
   * @returns Test result
   */
  static async testProvider(
    config: LLMConfig
  ): Promise<{ success: boolean; error?: string; latency?: number }> {
    try {
      const provider = this.createProvider(config);
      const status = await provider.checkStatus();

      return {
        success: status.available,
        error: status.error,
        latency: status.latency,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
