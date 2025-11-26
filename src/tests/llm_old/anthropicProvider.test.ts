import { describe, it, expect, beforeEach, vi } from "vitest";
import { AnthropicProvider } from "$lib/services/llm/anthropicProvider";
import type { LLMRequest, LLMResponse } from "$lib/types/llm";

describe("AnthropicProvider", () => {
  let provider: AnthropicProvider;
  const mockApiKey = "test-api-key";

  beforeEach(() => {
    provider = new AnthropicProvider(mockApiKey);
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with correct provider name", () => {
      expect(provider.name).toBe("anthropic");
    });

    it("should have correct available models", () => {
      const models = provider.getAvailableModels();
      expect(models).toContain("claude-opus");
      expect(models).toContain("claude-sonnet");
      expect(models).toContain("claude-haiku");
    });

    it("should throw error when no API key provided", () => {
      expect(() => new AnthropicProvider("")).toThrow();
    });
  });

  describe("generateCompletion", () => {
    const mockRequest: LLMRequest = {
      model: "claude-sonnet",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello!" },
      ],
      temperature: 0.7,
      maxTokens: 100,
    };

    it("should make successful API call", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: "Hello! How can I help you?" }],
          usage: {
            input_tokens: 15,
            output_tokens: 10,
          },
          model: "claude-sonnet",
          stop_reason: "end_turn",
        }),
      });

      const response = await provider.generateCompletion(mockRequest);

      expect(response.content).toBe("Hello! How can I help you?");
      expect(response.model).toBe("claude-sonnet");
      expect(response.usage.totalTokens).toBe(25);
      expect(fetch).toHaveBeenCalledWith(
        "https://api.anthropic.com/v1/messages",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "x-api-key": mockApiKey,
            "anthropic-version": "2023-06-01",
          }),
        })
      );
    });

    it("should handle API errors", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      });

      await expect(provider.generateCompletion(mockRequest)).rejects.toThrow();
    });

    it("should convert system messages correctly", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: "Response" }],
          usage: { input_tokens: 10, output_tokens: 5 },
          model: "claude-sonnet",
          stop_reason: "end_turn",
        }),
      });

      await provider.generateCompletion(mockRequest);

      const callBody = JSON.parse((fetch as any).mock.calls[0][1].body);
      expect(callBody.system).toBe("You are a helpful assistant.");
      expect(callBody.messages[0].role).toBe("user");
    });
  });

  describe("calculateCost", () => {
    it("should calculate cost correctly for claude-sonnet", () => {
      const cost = provider.calculateCost("claude-sonnet", 1000, 500);
      expect(cost).toBeGreaterThan(0);
    });

    it("should calculate different costs for different models", () => {
      const opusCost = provider.calculateCost("claude-opus", 1000, 500);
      const sonnetCost = provider.calculateCost("claude-sonnet", 1000, 500);
      const haikuCost = provider.calculateCost("claude-haiku", 1000, 500);

      expect(opusCost).toBeGreaterThan(sonnetCost);
      expect(sonnetCost).toBeGreaterThan(haikuCost);
    });

    it("should return 0 for unknown model", () => {
      const cost = provider.calculateCost("unknown-model", 1000, 500);
      expect(cost).toBe(0);
    });
  });

  describe("validateModel", () => {
    it("should validate supported models", () => {
      expect(provider.validateModel("claude-opus")).toBe(true);
      expect(provider.validateModel("claude-sonnet")).toBe(true);
      expect(provider.validateModel("claude-haiku")).toBe(true);
    });

    it("should reject unsupported models", () => {
      expect(provider.validateModel("gpt-4")).toBe(false);
      expect(provider.validateModel("unknown-model")).toBe(false);
    });
  });
});
