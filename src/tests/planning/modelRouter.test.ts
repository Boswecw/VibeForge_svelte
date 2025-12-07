/**
 * Model Router Tests
 * Tests for LLM model router service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ModelRouter } from '$lib/workbench/planning/services/modelRouter';
import type { ModelCallOptions, ModelCallResult } from '$lib/workbench/planning/types';

// ==============================================================================
// MOCKS
// ==============================================================================

const fetchMock = vi.fn();
global.fetch = fetchMock;

// ==============================================================================
// TESTS
// ==============================================================================

describe('ModelRouter', () => {
	let router: ModelRouter;

	beforeEach(() => {
		router = new ModelRouter();
		fetchMock.mockClear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// ==========================================================================
	// API KEY MANAGEMENT
	// ==========================================================================

	describe('API Key Management', () => {
		it('should set API key for a provider', () => {
			router.setApiKey('anthropic', 'test-key');
			// No error should be thrown
			expect(true).toBe(true);
		});

		it('should throw error when API key not set', async () => {
			const options: ModelCallOptions = {
				model: 'claude-3-5-sonnet-20241022',
				provider: 'anthropic',
				prompt: 'Test prompt'
			};

			await expect(router.call(options)).rejects.toThrow(
				'API key not set for provider: anthropic'
			);
		});

		it('should allow setting multiple provider keys', () => {
			router.setApiKey('anthropic', 'anthropic-key');
			router.setApiKey('openai', 'openai-key');
			router.setApiKey('xai', 'xai-key');
			router.setApiKey('google', 'google-key');

			expect(true).toBe(true);
		});
	});

	// ==========================================================================
	// NON-STREAMING CALLS
	// ==========================================================================

	describe('Non-Streaming Calls', () => {
		it('should call Anthropic API successfully', async () => {
			router.setApiKey('anthropic', 'test-key');

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					content: [{ text: 'Response from Claude' }],
					usage: {
						input_tokens: 10,
						output_tokens: 20
					}
				})
			});

			const options: ModelCallOptions = {
				model: 'claude-3-5-sonnet-20241022',
				provider: 'anthropic',
				prompt: 'Test prompt',
				systemPrompt: 'System prompt'
			};

			const result = await router.call(options);

			expect(result.content).toBe('Response from Claude');
			expect(result.tokensUsed.prompt).toBe(10);
			expect(result.tokensUsed.completion).toBe(20);
			expect(result.tokensUsed.total).toBe(30);
			expect(result.provider).toBe('anthropic');
			expect(result.model).toBe('claude-3-5-sonnet-20241022');
			expect(result.cost).toBeGreaterThan(0);
			expect(result.durationMs).toBeGreaterThanOrEqual(0);
		});

		it('should call OpenAI API successfully', async () => {
			router.setApiKey('openai', 'test-key');

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					choices: [{ message: { content: 'Response from GPT-4' } }],
					usage: {
						prompt_tokens: 15,
						completion_tokens: 25,
						total_tokens: 40
					}
				})
			});

			const options: ModelCallOptions = {
				model: 'gpt-4-turbo-2024-04-09',
				provider: 'openai',
				prompt: 'Test prompt'
			};

			const result = await router.call(options);

			expect(result.content).toBe('Response from GPT-4');
			expect(result.tokensUsed.total).toBe(40);
			expect(result.provider).toBe('openai');
		});

		it('should call xAI API successfully', async () => {
			router.setApiKey('xai', 'test-key');

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					choices: [{ message: { content: 'Response from Grok' } }],
					usage: {
						prompt_tokens: 12,
						completion_tokens: 28,
						total_tokens: 40
					}
				})
			});

			const options: ModelCallOptions = {
				model: 'grok-beta',
				provider: 'xai',
				prompt: 'Test prompt'
			};

			const result = await router.call(options);

			expect(result.content).toBe('Response from Grok');
			expect(result.provider).toBe('xai');
		});

		it('should call Google API successfully', async () => {
			router.setApiKey('google', 'test-key');

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					candidates: [
						{
							content: {
								parts: [{ text: 'Response from Gemini' }]
							}
						}
					],
					usageMetadata: {
						promptTokenCount: 10,
						candidatesTokenCount: 20,
						totalTokenCount: 30
					}
				})
			});

			const options: ModelCallOptions = {
				model: 'gemini-1.5-pro',
				provider: 'google',
				prompt: 'Test prompt'
			};

			const result = await router.call(options);

			expect(result.content).toBe('Response from Gemini');
			expect(result.provider).toBe('google');
			expect(result.tokensUsed.total).toBe(30);
		});
	});

	// ==========================================================================
	// STREAMING CALLS
	// ==========================================================================

	describe('Streaming Calls', () => {
		it('should handle Anthropic streaming', async () => {
			router.setApiKey('anthropic', 'test-key');

			const mockStream = new ReadableStream({
				start(controller) {
					controller.enqueue(
						new TextEncoder().encode(
							'data: {"type":"content_block_delta","delta":{"text":"Hello"}}\n\n'
						)
					);
					controller.enqueue(
						new TextEncoder().encode(
							'data: {"type":"content_block_delta","delta":{"text":" World"}}\n\n'
						)
					);
					controller.enqueue(
						new TextEncoder().encode('data: {"type":"message_stop"}\n\n')
					);
					controller.close();
				}
			});

			fetchMock.mockResolvedValueOnce({
				ok: true,
				body: mockStream
			});

			const tokens: string[] = [];
			const options: ModelCallOptions = {
				model: 'claude-3-5-sonnet-20241022',
				provider: 'anthropic',
				prompt: 'Test prompt',
				onProgress: (token) => tokens.push(token)
			};

			const result = await router.call(options);

			expect(result.content).toBe('Hello World');
			expect(tokens).toEqual(['Hello', ' World']);
		});

		it('should handle OpenAI streaming', async () => {
			router.setApiKey('openai', 'test-key');

			const mockStream = new ReadableStream({
				start(controller) {
					controller.enqueue(
						new TextEncoder().encode(
							'data: {"choices":[{"delta":{"content":"Test"}}]}\n\n'
						)
					);
					controller.enqueue(
						new TextEncoder().encode(
							'data: {"choices":[{"delta":{"content":" Response"}}]}\n\n'
						)
					);
					controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
					controller.close();
				}
			});

			fetchMock.mockResolvedValueOnce({
				ok: true,
				body: mockStream
			});

			const tokens: string[] = [];
			const options: ModelCallOptions = {
				model: 'gpt-4-turbo-2024-04-09',
				provider: 'openai',
				prompt: 'Test prompt',
				onProgress: (token) => tokens.push(token)
			};

			const result = await router.call(options);

			expect(result.content).toBe('Test Response');
			expect(tokens).toEqual(['Test', ' Response']);
		});

		it('should estimate tokens when not provided in stream', async () => {
			router.setApiKey('anthropic', 'test-key');

			const mockStream = new ReadableStream({
				start(controller) {
					controller.enqueue(
						new TextEncoder().encode(
							'data: {"type":"content_block_delta","delta":{"text":"Hello"}}\n\n'
						)
					);
					controller.close();
				}
			});

			fetchMock.mockResolvedValueOnce({
				ok: true,
				body: mockStream
			});

			const options: ModelCallOptions = {
				model: 'claude-3-5-sonnet-20241022',
				provider: 'anthropic',
				prompt: 'Test prompt',
				onProgress: () => {}
			};

			const result = await router.call(options);

			expect(result.tokensUsed.prompt).toBeGreaterThan(0);
			expect(result.tokensUsed.completion).toBeGreaterThan(0);
		});
	});

	// ==========================================================================
	// ABORT FUNCTIONALITY
	// ==========================================================================

	describe('Abort Functionality', () => {
		it('should abort ongoing request', async () => {
			router.setApiKey('anthropic', 'test-key');

			fetchMock.mockImplementationOnce(
				() =>
					new Promise((_, reject) => {
						setTimeout(() => {
							const error = new Error('Aborted');
							error.name = 'AbortError';
							reject(error);
						}, 100);
					})
			);

			const options: ModelCallOptions = {
				model: 'claude-3-5-sonnet-20241022',
				provider: 'anthropic',
				prompt: 'Test prompt'
			};

			const promise = router.call(options);

			// Abort after small delay
			setTimeout(() => router.abort(), 50);

			await expect(promise).rejects.toThrow('Request was cancelled');
		});

		it('should handle external abort signal', async () => {
			router.setApiKey('anthropic', 'test-key');

			const abortController = new AbortController();

			fetchMock.mockImplementationOnce(
				() =>
					new Promise((_, reject) => {
						setTimeout(() => {
							const error = new Error('Aborted');
							error.name = 'AbortError';
							reject(error);
						}, 100);
					})
			);

			const options: ModelCallOptions = {
				model: 'claude-3-5-sonnet-20241022',
				provider: 'anthropic',
				prompt: 'Test prompt',
				signal: abortController.signal
			};

			const promise = router.call(options);

			setTimeout(() => abortController.abort(), 50);

			await expect(promise).rejects.toThrow('Request was cancelled');
		});
	});

	// ==========================================================================
	// COST CALCULATION
	// ==========================================================================

	describe('Cost Calculation', () => {
		it('should calculate cost for Claude Sonnet', async () => {
			router.setApiKey('anthropic', 'test-key');

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					content: [{ text: 'Response' }],
					usage: {
						input_tokens: 1000,
						output_tokens: 2000
					}
				})
			});

			const options: ModelCallOptions = {
				model: 'claude-3-5-sonnet-20241022',
				provider: 'anthropic',
				prompt: 'Test'
			};

			const result = await router.call(options);

			// Cost = (1000 / 1M * $3) + (2000 / 1M * $15) = $0.003 + $0.03 = $0.033
			expect(result.cost).toBeCloseTo(0.033, 4);
		});

		it('should calculate cost for GPT-4 Turbo', async () => {
			router.setApiKey('openai', 'test-key');

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					choices: [{ message: { content: 'Response' } }],
					usage: {
						prompt_tokens: 1000,
						completion_tokens: 2000,
						total_tokens: 3000
					}
				})
			});

			const options: ModelCallOptions = {
				model: 'gpt-4-turbo-2024-04-09',
				provider: 'openai',
				prompt: 'Test'
			};

			const result = await router.call(options);

			// Cost = (1000 / 1M * $10) + (2000 / 1M * $30) = $0.01 + $0.06 = $0.07
			expect(result.cost).toBeCloseTo(0.07, 4);
		});

		it('should return 0 cost for unknown model', async () => {
			router.setApiKey('openai', 'test-key');

			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					choices: [{ message: { content: 'Response' } }],
					usage: {
						prompt_tokens: 100,
						completion_tokens: 200,
						total_tokens: 300
					}
				})
			});

			const options: ModelCallOptions = {
				model: 'unknown-model',
				provider: 'openai',
				prompt: 'Test'
			};

			const result = await router.call(options);

			expect(result.cost).toBe(0);
			expect(consoleSpy).toHaveBeenCalledWith(
				'No pricing data for model: unknown-model'
			);

			consoleSpy.mockRestore();
		});
	});

	// ==========================================================================
	// ERROR HANDLING
	// ==========================================================================

	describe('Error Handling', () => {
		it('should handle API errors', async () => {
			router.setApiKey('anthropic', 'test-key');

			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 401,
				text: async () => 'Invalid API key'
			});

			const options: ModelCallOptions = {
				model: 'claude-3-5-sonnet-20241022',
				provider: 'anthropic',
				prompt: 'Test'
			};

			await expect(router.call(options)).rejects.toThrow('API error (401)');
		});

		it('should handle network errors', async () => {
			router.setApiKey('anthropic', 'test-key');

			fetchMock.mockRejectedValueOnce(new Error('Network error'));

			const options: ModelCallOptions = {
				model: 'claude-3-5-sonnet-20241022',
				provider: 'anthropic',
				prompt: 'Test'
			};

			await expect(router.call(options)).rejects.toThrow('Network error');
		});

		it('should handle null response body in streaming', async () => {
			router.setApiKey('anthropic', 'test-key');

			fetchMock.mockResolvedValueOnce({
				ok: true,
				body: null
			});

			const options: ModelCallOptions = {
				model: 'claude-3-5-sonnet-20241022',
				provider: 'anthropic',
				prompt: 'Test',
				onProgress: () => {}
			};

			await expect(router.call(options)).rejects.toThrow('Response body is null');
		});
	});

	// ==========================================================================
	// REQUEST OPTIONS
	// ==========================================================================

	describe('Request Options', () => {
		it('should use default maxTokens if not provided', async () => {
			router.setApiKey('anthropic', 'test-key');

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					content: [{ text: 'Response' }],
					usage: {
						input_tokens: 10,
						output_tokens: 20
					}
				})
			});

			const options: ModelCallOptions = {
				model: 'claude-3-5-sonnet-20241022',
				provider: 'anthropic',
				prompt: 'Test'
			};

			await router.call(options);

			const callArgs = fetchMock.mock.calls[0];
			const requestBody = JSON.parse(callArgs[1].body);

			expect(requestBody.max_tokens).toBe(4000);
		});

		it('should use custom maxTokens', async () => {
			router.setApiKey('anthropic', 'test-key');

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					content: [{ text: 'Response' }],
					usage: {
						input_tokens: 10,
						output_tokens: 20
					}
				})
			});

			const options: ModelCallOptions = {
				model: 'claude-3-5-sonnet-20241022',
				provider: 'anthropic',
				prompt: 'Test',
				maxTokens: 8000
			};

			await router.call(options);

			const callArgs = fetchMock.mock.calls[0];
			const requestBody = JSON.parse(callArgs[1].body);

			expect(requestBody.max_tokens).toBe(8000);
		});

		it('should use custom temperature', async () => {
			router.setApiKey('anthropic', 'test-key');

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					content: [{ text: 'Response' }],
					usage: {
						input_tokens: 10,
						output_tokens: 20
					}
				})
			});

			const options: ModelCallOptions = {
				model: 'claude-3-5-sonnet-20241022',
				provider: 'anthropic',
				prompt: 'Test',
				temperature: 0.5
			};

			await router.call(options);

			const callArgs = fetchMock.mock.calls[0];
			const requestBody = JSON.parse(callArgs[1].body);

			expect(requestBody.temperature).toBe(0.5);
		});
	});
});
