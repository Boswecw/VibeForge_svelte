import { describe, it, expect, beforeEach, vi } from "vitest";
import { OpenAIProvider } from "$lib/services/llm/openaiProvider";
// @ts-expect-error - Old test file, types have been refactored
import type { LLMRequest, LLMResponse } from "$lib/types/llm";

describe("OpenAIProvider", () => {
  let provider: OpenAIProvider;
  const mockApiKey = "test-api-key";

  beforeEach(() => {
    provider = new OpenAIProvider(mockApiKey);
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with correct provider name", () => {
      expect(provider.name).toBe("openai");
    });

    it("should have correct available models", () => {
      const models = provider.getAvailableModels();
      expect(models).toContain("gpt-4");
      expect(models).toContain("gpt-4o");
      expect(models).toContain("gpt-3.5-turbo");
      expect(models.length).toBeGreaterThan(0);
    });

    it("should throw error when no API key provided", () => {
      expect(() => new OpenAIProvider("")).toThrow();
    });
  });

  describe("generateCompletion", () => {
    const mockRequest: LLMRequest = {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello!" },
      ],
      temperature: 0.7,
      maxTokens: 100,
    };

    it("should make successful API call", async () => {
      const mockResponse: LLMResponse = {
        content: "Hello! How can I help you?",
        model: "gpt-3.5-turbo",
        usage: {
          promptTokens: 15,
          completionTokens: 10,
          totalTokens: 25,
        },
        finishReason: "stop",
      };

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { content: mockResponse.content },
              finish_reason: "stop",
            },
          ],
          usage: {
            prompt_tokens: 15,
            completion_tokens: 10,
            total_tokens: 25,
          },
          model: "gpt-3.5-turbo",
        }),
      });

      const response = await provider.generateCompletion(mockRequest);

      expect(response.content).toBe(mockResponse.content);
      expect(response.model).toBe("gpt-3.5-turbo");
      expect(response.usage.totalTokens).toBe(25);
      expect(fetch).toHaveBeenCalledWith(
        "https://api.openai.com/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: `Bearer ${mockApiKey}`,
          }),
        })
      );
    });

    it("should handle API errors gracefully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      await expect(provider.generateCompletion(mockRequest)).rejects.toThrow();
    });

    it("should handle network errors", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      await expect(provider.generateCompletion(mockRequest)).rejects.toThrow(
        "Network error"
      );
    });

    it("should respect temperature parameter", async () => {
      const requestWithTemp = { ...mockRequest, temperature: 0.5 };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            { message: { content: "Response" }, finish_reason: "stop" },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          model: "gpt-3.5-turbo",
        }),
      });

      await provider.generateCompletion(requestWithTemp);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"temperature":0.5'),
        })
      );
    });

    it("should respect maxTokens parameter", async () => {
      const requestWithMaxTokens = { ...mockRequest, maxTokens: 200 };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            { message: { content: "Response" }, finish_reason: "stop" },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          model: "gpt-3.5-turbo",
        }),
      });

      await provider.generateCompletion(requestWithMaxTokens);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"max_tokens":200'),
        })
      );
    });
  });

  describe("calculateCost", () => {
    it("should calculate cost correctly for gpt-3.5-turbo", () => {
      const cost = provider.calculateCost("gpt-3.5-turbo", 1000, 500);
      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe("number");
    });

    it("should calculate cost correctly for gpt-4", () => {
      const cost = provider.calculateCost("gpt-4", 1000, 500);
      expect(cost).toBeGreaterThan(0);
      // GPT-4 should be more expensive than GPT-3.5
      const gpt35Cost = provider.calculateCost("gpt-3.5-turbo", 1000, 500);
      expect(cost).toBeGreaterThan(gpt35Cost);
    });

    it("should return 0 for unknown model", () => {
      const cost = provider.calculateCost("unknown-model", 1000, 500);
      expect(cost).toBe(0);
    });

    it("should handle zero tokens", () => {
      const cost = provider.calculateCost("gpt-3.5-turbo", 0, 0);
      expect(cost).toBe(0);
    });
  });

  describe("validateModel", () => {
    it("should validate supported models", () => {
      expect(provider.validateModel("gpt-3.5-turbo")).toBe(true);
      expect(provider.validateModel("gpt-4")).toBe(true);
      expect(provider.validateModel("gpt-4o")).toBe(true);
    });

    it("should reject unsupported models", () => {
      expect(provider.validateModel("claude-2")).toBe(false);
      expect(provider.validateModel("unknown-model")).toBe(false);
      expect(provider.validateModel("")).toBe(false);
    });
  });
});
