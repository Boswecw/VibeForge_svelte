/**
 * Planning Orchestrator Tests
 * Tests for multi-AI planning orchestration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlanningOrchestrator } from '$lib/workbench/planning/services/orchestrator';
import { ModelRouter } from '$lib/workbench/planning/services/modelRouter';
import { createPlanningSession } from '$lib/workbench/planning/types';
import type { PlanningSession, ModelCallResult } from '$lib/workbench/planning/types';

// ==============================================================================
// MOCKS
// ==============================================================================

const createMockResult = (content: string): ModelCallResult => ({
	content,
	tokensUsed: { prompt: 100, completion: 200, total: 300 },
	cost: 0.05,
	model: 'test-model',
	provider: 'openai',
	durationMs: 1000,
	finishReason: 'stop'
});

// ==============================================================================
// TESTS
// ==============================================================================

describe('PlanningOrchestrator', () => {
	let orchestrator: PlanningOrchestrator;
	let mockRouter: ModelRouter;

	beforeEach(() => {
		mockRouter = new ModelRouter();
		orchestrator = new PlanningOrchestrator(mockRouter);
	});

	// ==========================================================================
	// SESSION EXECUTION
	// ==========================================================================

	describe('Session Execution', () => {
		it('should execute all stages in sequence', async () => {
			const session = createPlanningSession('Test Feature', 'Add a test feature', 'feature');

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockResolvedValueOnce(createMockResult('Initial plan output'));
			callSpy.mockResolvedValueOnce(createMockResult('Review feedback'));
			callSpy.mockResolvedValueOnce(createMockResult('Refined plan output'));
			callSpy.mockResolvedValueOnce(
				createMockResult(
					'---BEGIN IMPLEMENTATION PLAN---\nComplete plan\n---END IMPLEMENTATION PLAN---\n---BEGIN CLAUDE CODE PROMPT---\nExecution steps\n---END CLAUDE CODE PROMPT---'
				)
			);

			const result = await orchestrator.runSession(session);

			expect(callSpy).toHaveBeenCalledTimes(4);
			expect(result.status).toBe('completed');
			expect(result.stages[0].status).toBe('completed');
			expect(result.stages[1].status).toBe('completed');
			expect(result.stages[2].status).toBe('completed');
			expect(result.stages[3].status).toBe('completed');
		});

		it('should track session timestamps', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature');

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockResolvedValue(createMockResult('Output'));

			const result = await orchestrator.runSession(session);

			expect(result.startedAt).toBeInstanceOf(Date);
			expect(result.completedAt).toBeInstanceOf(Date);
			expect(result.completedAt!.getTime()).toBeGreaterThanOrEqual(result.startedAt!.getTime());
		});

		it('should track stage timestamps', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature', 'quick');

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockResolvedValue(createMockResult('Output'));

			const result = await orchestrator.runSession(session);

			result.stages.forEach((stage) => {
				expect(stage.startedAt).toBeInstanceOf(Date);
				expect(stage.completedAt).toBeInstanceOf(Date);
				expect(stage.completedAt!.getTime()).toBeGreaterThanOrEqual(
					stage.startedAt!.getTime()
				);
			});
		});

		it('should accumulate tokens and cost', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature', 'quick');

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockResolvedValueOnce(createMockResult('Output 1'));
			callSpy.mockResolvedValueOnce(createMockResult('Output 2'));

			const result = await orchestrator.runSession(session);

			expect(result.totalTokens).toBe(600); // 300 * 2
			expect(result.totalCost).toBe(0.1); // 0.05 * 2
		});

		it('should call onStageStart callback', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature', 'quick');

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockResolvedValue(createMockResult('Output'));

			const stageStarts: number[] = [];
			await orchestrator.runSession(session, {
				onStageStart: (index) => stageStarts.push(index)
			});

			expect(stageStarts).toEqual([0, 1]);
		});

		it('should call onStageComplete callback', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature', 'quick');

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockResolvedValue(createMockResult('Output'));

			const stageCompletes: number[] = [];
			await orchestrator.runSession(session, {
				onStageComplete: (index) => stageCompletes.push(index)
			});

			expect(stageCompletes).toEqual([0, 1]);
		});

		it('should call onSessionComplete callback', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature', 'quick');

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockResolvedValueOnce(createMockResult('Initial'));
			callSpy.mockResolvedValueOnce(
				createMockResult(
					'---BEGIN IMPLEMENTATION PLAN---\nPlan\n---END IMPLEMENTATION PLAN---\n---BEGIN CLAUDE CODE PROMPT---\nPrompt\n---END CLAUDE CODE PROMPT---'
				)
			);

			let sessionCompleted = false;
			await orchestrator.runSession(session, {
				onSessionComplete: () => {
					sessionCompleted = true;
				}
			});

			expect(sessionCompleted).toBe(true);
		});

		it('should call onStageProgress callback with tokens', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature', 'quick');

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockImplementation(async (options) => {
				// Simulate streaming
				if (options.onProgress) {
					options.onProgress('Hello');
					options.onProgress(' ');
					options.onProgress('World');
				}
				return createMockResult('Hello World');
			});

			const tokens: string[] = [];
			await orchestrator.runSession(session, {
				onStageProgress: (_, token) => tokens.push(token)
			});

			expect(tokens).toContain('Hello');
			expect(tokens).toContain(' ');
			expect(tokens).toContain('World');
		});
	});

	// ==========================================================================
	// CONTEXT ASSEMBLY
	// ==========================================================================

	describe('Context Assembly', () => {
		it('should pass user description to initial stage', async () => {
			const session = createPlanningSession('Test Feature', 'Add authentication', 'feature');

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockResolvedValue(createMockResult('Output'));

			await orchestrator.runSession(session);

			const firstCall = callSpy.mock.calls[0][0];
			expect(firstCall.prompt).toContain('Add authentication');
		});

		it('should pass previous stage output to review stage', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature');

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockResolvedValueOnce(createMockResult('Initial plan content'));
			callSpy.mockResolvedValueOnce(createMockResult('Review'));
			callSpy.mockResolvedValueOnce(createMockResult('Refinement'));
			callSpy.mockResolvedValueOnce(createMockResult('Final'));

			await orchestrator.runSession(session);

			const reviewCall = callSpy.mock.calls[1][0];
			expect(reviewCall.prompt).toContain('Initial plan content');
		});

		it('should assemble context from all previous stages', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature');

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockResolvedValue(createMockResult('Output'));

			await orchestrator.runSession(session);

			// Final stage should have context from all 3 previous stages
			const finalStage = session.stages[3];
			expect(finalStage.previousContext).toHaveLength(3);
			expect(finalStage.previousContext[0]).toContain('Initial Plan');
			expect(finalStage.previousContext[1]).toContain('Review');
			expect(finalStage.previousContext[2]).toContain('Refinement');
		});
	});

	// ==========================================================================
	// USER INJECTIONS
	// ==========================================================================

	describe('User Injections', () => {
		it('should inject user context at a stage', () => {
			const session = createPlanningSession('Test', 'Description', 'feature');

			orchestrator.injectContext(session, 1, 'Additional context for review');

			expect(session.stages[1].userInjections).toContain('Additional context for review');
		});

		it('should include user injections in stage input', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature');

			orchestrator.injectContext(session, 1, 'Consider security implications');

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockResolvedValue(createMockResult('Output'));

			await orchestrator.runSession(session);

			const reviewCall = callSpy.mock.calls[1][0];
			expect(reviewCall.prompt).toContain('Consider security implications');
			expect(reviewCall.prompt).toContain('---USER CONTEXT---');
		});

		it('should handle multiple user injections', () => {
			const session = createPlanningSession('Test', 'Description', 'feature');

			orchestrator.injectContext(session, 1, 'First injection');
			orchestrator.injectContext(session, 1, 'Second injection');

			expect(session.stages[1].userInjections).toHaveLength(2);
			expect(session.stages[1].userInjections).toContain('First injection');
			expect(session.stages[1].userInjections).toContain('Second injection');
		});

		it('should ignore injection for invalid stage index', () => {
			const session = createPlanningSession('Test', 'Description', 'feature');

			orchestrator.injectContext(session, 99, 'Invalid');

			session.stages.forEach((stage) => {
				expect(stage.userInjections).toHaveLength(0);
			});
		});
	});

	// ==========================================================================
	// PAUSE/RESUME
	// ==========================================================================

	describe('Pause and Resume', () => {
		it('should pause and resume session', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature', 'quick');

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockImplementation(
				async () =>
					new Promise((resolve) => {
						setTimeout(() => resolve(createMockResult('Output')), 100);
					})
			);

			const promise = orchestrator.runSession(session);

			// Pause after small delay
			setTimeout(() => {
				orchestrator.pause();
			}, 50);

			// Resume after another delay
			setTimeout(() => {
				orchestrator.resume();
			}, 150);

			const result = await promise;
			expect(result.status).toBe('completed');
		});
	});

	// ==========================================================================
	// ABORT
	// ==========================================================================

	describe('Abort', () => {
		it('should abort session', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature');

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockImplementation(
				async () =>
					new Promise((resolve) => {
						setTimeout(() => resolve(createMockResult('Output')), 500);
					})
			);

			const promise = orchestrator.runSession(session);

			// Abort after small delay
			setTimeout(() => orchestrator.abort(), 50);

			await promise;

			expect(session.status).toBe('cancelled');
			expect(session.error).toBe('Session was cancelled by user');
		});
	});

	// ==========================================================================
	// DELIVERABLE PARSING
	// ==========================================================================

	describe('Deliverable Parsing', () => {
		it('should parse two-file deliverable', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature', 'quick');

			const finalOutput = `
---BEGIN IMPLEMENTATION PLAN---
# User Authentication Feature

## Overview
Complete authentication system

Estimated Time: 8 hours

## Phase 1: Setup
Initial configuration

## Phase 2: Implementation
Core features

## Success Criteria
✓ Users can sign up
✓ Users can log in
✓ Passwords are hashed
---END IMPLEMENTATION PLAN---

---BEGIN CLAUDE CODE PROMPT---
You are implementing user authentication.

Step 1: Create user model
Step 2: Add authentication routes
Step 3: Implement password hashing
---END CLAUDE CODE PROMPT---
      `.trim();

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockResolvedValueOnce(createMockResult('Initial'));
			callSpy.mockResolvedValueOnce(createMockResult(finalOutput));

			const result = await orchestrator.runSession(session);

			expect(result.deliverable).toBeTruthy();
			expect(result.deliverable?.implementationPlan.content).toContain('User Authentication');
			expect(result.deliverable?.claudeCodePrompt.content).toContain('Step 1: Create user model');
		});

		it('should extract metadata from deliverable', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature', 'quick');

			const finalOutput = `
---BEGIN IMPLEMENTATION PLAN---
# User Authentication Feature

Estimated Time: 8 hours

## Phase 1: Setup
## Phase 2: Implementation
## Phase 3: Testing

## Success Criteria
✓ Users can sign up
✓ Passwords are hashed
---END IMPLEMENTATION PLAN---

---BEGIN CLAUDE CODE PROMPT---
Execution steps
---END CLAUDE CODE PROMPT---
      `.trim();

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockResolvedValueOnce(createMockResult('Initial'));
			callSpy.mockResolvedValueOnce(createMockResult(finalOutput));

			const result = await orchestrator.runSession(session);

			expect(result.deliverable?.metadata.title).toBe('User Authentication Feature');
			expect(result.deliverable?.metadata.estimatedTime).toBe('8 hours');
			expect(result.deliverable?.metadata.phases).toHaveLength(3);
			expect(result.deliverable?.metadata.successCriteria).toHaveLength(2);
		});

		it('should generate sanitized filenames', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature', 'quick');

			const finalOutput = `
---BEGIN IMPLEMENTATION PLAN---
# User Authentication & Authorization!

Plan content
---END IMPLEMENTATION PLAN---

---BEGIN CLAUDE CODE PROMPT---
Prompt content
---END CLAUDE CODE PROMPT---
      `.trim();

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockResolvedValueOnce(createMockResult('Initial'));
			callSpy.mockResolvedValueOnce(createMockResult(finalOutput));

			const result = await orchestrator.runSession(session);

			expect(result.deliverable?.implementationPlan.filename).toBe(
				'user_authentication_authorization_plan.md'
			);
			expect(result.deliverable?.claudeCodePrompt.filename).toBe(
				'user_authentication_authorization_prompt.md'
			);
		});

		it('should handle missing deliverable markers', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature', 'quick');

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockResolvedValueOnce(createMockResult('Initial'));
			callSpy.mockResolvedValueOnce(createMockResult('Invalid final output without markers'));

			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const result = await orchestrator.runSession(session);

			expect(result.deliverable).toBeNull();
			expect(consoleSpy).toHaveBeenCalled();

			consoleSpy.mockRestore();
		});
	});

	// ==========================================================================
	// ERROR HANDLING
	// ==========================================================================

	describe('Error Handling', () => {
		it('should handle stage failure', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature', 'quick');

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockResolvedValueOnce(createMockResult('Initial'));
			callSpy.mockRejectedValueOnce(new Error('API error'));

			await expect(orchestrator.runSession(session)).rejects.toThrow('API error');

			expect(session.status).toBe('failed');
			expect(session.error).toBe('API error');
			expect(session.stages[1].status).toBe('failed');
		});

		it('should call onError callback', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature', 'quick');

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockResolvedValueOnce(createMockResult('Initial'));
			callSpy.mockRejectedValueOnce(new Error('Test error'));

			let errorCalled = false;
			try {
				await orchestrator.runSession(session, {
					onError: () => {
						errorCalled = true;
					}
				});
			} catch {
				// Expected
			}

			expect(errorCalled).toBe(true);
		});

		it('should stop execution after stage failure', async () => {
			const session = createPlanningSession('Test', 'Description', 'feature');

			const callSpy = vi.spyOn(mockRouter, 'call');
			callSpy.mockResolvedValueOnce(createMockResult('Initial'));
			callSpy.mockRejectedValueOnce(new Error('Review failed'));

			try {
				await orchestrator.runSession(session);
			} catch {
				// Expected
			}

			// Only first 2 stages should have been attempted
			expect(session.stages[0].status).toBe('completed');
			expect(session.stages[1].status).toBe('failed');
			expect(session.stages[2].status).toBe('pending');
			expect(session.stages[3].status).toBe('pending');
		});
	});

	// ==========================================================================
	// API KEY MANAGEMENT
	// ==========================================================================

	describe('API Key Management', () => {
		it('should set API keys for providers', () => {
			orchestrator.setApiKey('anthropic', 'anthropic-key');
			orchestrator.setApiKey('openai', 'openai-key');
			orchestrator.setApiKey('xai', 'xai-key');
			orchestrator.setApiKey('google', 'google-key');

			// No error should be thrown
			expect(true).toBe(true);
		});
	});
});
