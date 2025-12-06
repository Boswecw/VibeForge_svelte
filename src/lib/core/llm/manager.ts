/**
 * VibeForge V2 - LLM Provider Manager
 *
 * Factory and manager for LLM providers
 */

import type { LLMProvider, LLMProviderConfig, RateLimitConfig } from './types';
import { BaseLLMProvider } from './base';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';

// ============================================================================
// PROVIDER FACTORY
// ============================================================================

export class LLMProviderFactory {
  /**
   * Create an LLM provider instance
   */
  static create(config: LLMProviderConfig): BaseLLMProvider {
    switch (config.provider) {
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'openai':
        return new OpenAIProvider(config);
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }

  /**
   * Create an Anthropic provider
   */
  static createAnthropic(apiKey: string, baseURL?: string): AnthropicProvider {
    return new AnthropicProvider({
      provider: 'anthropic',
      apiKey,
      baseURL,
    });
  }

  /**
   * Create an OpenAI provider
   */
  static createOpenAI(apiKey: string, baseURL?: string): OpenAIProvider {
    return new OpenAIProvider({
      provider: 'openai',
      apiKey,
      baseURL,
    });
  }
}

// ============================================================================
// PROVIDER MANAGER
// ============================================================================

export class LLMProviderManager {
  private providers: Map<LLMProvider, BaseLLMProvider> = new Map();
  private apiKeys: Map<LLMProvider, string> = new Map();

  /**
   * Set API key for a provider
   */
  setApiKey(provider: LLMProvider, apiKey: string) {
    this.apiKeys.set(provider, apiKey);

    // If provider instance exists, recreate it with new key
    if (this.providers.has(provider)) {
      this.providers.delete(provider);
    }
  }

  /**
   * Get API key for a provider
   */
  getApiKey(provider: LLMProvider): string | undefined {
    return this.apiKeys.get(provider);
  }

  /**
   * Check if API key is set for a provider
   */
  hasApiKey(provider: LLMProvider): boolean {
    return this.apiKeys.has(provider) && !!this.apiKeys.get(provider);
  }

  /**
   * Get provider instance (creates if doesn't exist)
   */
  getProvider(provider: LLMProvider): BaseLLMProvider {
    // Return cached instance if exists
    if (this.providers.has(provider)) {
      return this.providers.get(provider)!;
    }

    // Get API key
    const apiKey = this.apiKeys.get(provider);
    if (!apiKey) {
      throw new Error(`API key not set for provider: ${provider}`);
    }

    // Create new instance
    const instance = LLMProviderFactory.create({
      provider,
      apiKey,
    });

    // Cache instance
    this.providers.set(provider, instance);

    return instance;
  }

  /**
   * Validate API key for a provider
   */
  async validateApiKey(provider: LLMProvider): Promise<boolean> {
    try {
      const instance = this.getProvider(provider);
      return await instance.validateApiKey();
    } catch {
      return false;
    }
  }

  /**
   * Set rate limit configuration for a provider
   */
  setRateLimitConfig(provider: LLMProvider, config: RateLimitConfig) {
    const instance = this.getProvider(provider);
    instance.setRateLimitConfig(config);
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders(): LLMProvider[] {
    return Array.from(this.apiKeys.keys()).filter((provider) =>
      this.hasApiKey(provider)
    );
  }

  /**
   * Clear all providers and API keys
   */
  clear() {
    this.providers.clear();
    this.apiKeys.clear();
  }

  /**
   * Remove a specific provider
   */
  removeProvider(provider: LLMProvider) {
    this.providers.delete(provider);
    this.apiKeys.delete(provider);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const llmManager = new LLMProviderManager();
