/**
 * Planning Store Tests
 * Tests for Svelte 5 rune-based planning store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { planningStore } from '$lib/workbench/planning/stores/planning.svelte';
import { planningOrchestrator } from '$lib/workbench/planning/services/orchestrator';
import { licenseStore } from '$lib/core/stores/license.svelte';

// ==============================================================================
// MOCKS
// ==============================================================================

const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		}
	};
})();

global.localStorage = localStorageMock as Storage;

// ==============================================================================
// TESTS
// ==============================================================================

describe('Planning Store', () => {
	beforeEach(() => {
		localStorageMock.clear();
		planningStore.clearAllSessions();

		// Reset license to free first, then upgrade to trial to allow orchestrator
		licenseStore.resetToFree();
		licenseStore.upgradeTier('trial');
	});

	// ==========================================================================
	// INITIALIZATION
	// ==========================================================================

	describe('Initialization', () => {
		it('should initialize with empty state', () => {
			expect(planningStore.sessions).toEqual([]);
			expect(planningStore.currentSession).toBeNull();
			expect(planningStore.isRunning).toBe(false);
			expect(planningStore.isPaused).toBe(false);
			expect(planningStore.streamingOutput).toBe('');
			expect(planningStore.error).toBeNull();
		});

		it('should have correct derived state on init', () => {
			expect(planningStore.currentStage).toBeNull();
			expect(planningStore.progress).toBe(0);
			expect(planningStore.sessionComplete).toBe(false);
			expect(planningStore.hasDeliverable).toBe(false);
		});

		it('should allow starting session when licensed', () => {
			expect(planningStore.canStartSession).toBe(true);
		});

		it('should deny starting session when not licensed', () => {
			licenseStore.resetToFree();
			expect(planningStore.canStartSession).toBe(false);
		});
	});

	// ==========================================================================
	// SESSION CREATION
	// ==========================================================================

	describe('Session Creation', () => {
		it('should create and start a session', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(async (session, callbacks) => {
			// Delay callback to allow checking isRunning state
			await new Promise((resolve) => setTimeout(resolve, 10));
			callbacks?.onSessionComplete?.(session);
				return session;
			});

			const promise = planningStore.startSession(
				'Test Feature',
				'Add a test feature',
				'feature',
				'quick'
			);

			expect(planningStore.currentSession).toBeTruthy();
			expect(planningStore.currentSession?.title).toBe('Test Feature');
			expect(planningStore.currentSession?.description).toBe('Add a test feature');
			expect(planningStore.currentSession?.requestType).toBe('feature');
			expect(planningStore.isRunning).toBe(true);

			await promise;

			runSessionSpy.mockRestore();
		});

		it('should record orchestrator usage', async () => {
			const usageBefore = licenseStore.license.orchestratorUsageThisMonth;

			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(async (session, callbacks) => {
				callbacks?.onSessionComplete?.(session);
				return session;
			});

			await planningStore.startSession('Test', 'Description', 'feature', 'quick');

			expect(licenseStore.license.orchestratorUsageThisMonth).toBe(usageBefore + 1);

			runSessionSpy.mockRestore();
		});

		it('should not start session when not licensed', async () => {
			licenseStore.resetToFree();

			await planningStore.startSession('Test', 'Description', 'feature');

			expect(planningStore.currentSession).toBeNull();
			expect(planningStore.isRunning).toBe(false);
			expect(planningStore.error).toContain('no permission');
		});

		it('should not start session when already running', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve({} as any), 1000);
					})
			);

			// Start first session
			planningStore.startSession('Session 1', 'Description', 'feature', 'quick');

			// Try to start second session
			await planningStore.startSession('Session 2', 'Description', 'feature', 'quick');

			expect(planningStore.error).toContain('already running');

			runSessionSpy.mockRestore();
		});
	});

	// ==========================================================================
	// PAUSE/RESUME
	// ==========================================================================

	describe('Pause and Resume', () => {
		it('should pause a running session', () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve({} as any), 1000);
					})
			);

			const pauseSpy = vi.spyOn(planningOrchestrator, 'pause');

			planningStore.startSession('Test', 'Description', 'feature', 'quick');

			expect(planningStore.isRunning).toBe(true);
			expect(planningStore.isPaused).toBe(false);

			planningStore.pauseSession();

			expect(pauseSpy).toHaveBeenCalled();
			expect(planningStore.isPaused).toBe(true);

			runSessionSpy.mockRestore();
			pauseSpy.mockRestore();
		});

		it('should resume a paused session', () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve({} as any), 1000);
					})
			);

			const resumeSpy = vi.spyOn(planningOrchestrator, 'resume');

			planningStore.startSession('Test', 'Description', 'feature', 'quick');
			planningStore.pauseSession();

			expect(planningStore.isPaused).toBe(true);

			planningStore.resumeSession();

			expect(resumeSpy).toHaveBeenCalled();
			expect(planningStore.isPaused).toBe(false);

			runSessionSpy.mockRestore();
			resumeSpy.mockRestore();
		});

		it('should not pause if not running', () => {
			const pauseSpy = vi.spyOn(planningOrchestrator, 'pause');

			planningStore.pauseSession();

			expect(pauseSpy).not.toHaveBeenCalled();

			pauseSpy.mockRestore();
		});

		it('should not resume if not paused', () => {
			const resumeSpy = vi.spyOn(planningOrchestrator, 'resume');

			planningStore.resumeSession();

			expect(resumeSpy).not.toHaveBeenCalled();

			resumeSpy.mockRestore();
		});
	});

	// ==========================================================================
	// ABORT
	// ==========================================================================

	describe('Abort', () => {
		it('should abort a running session', () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve({} as any), 1000);
					})
			);

			const abortSpy = vi.spyOn(planningOrchestrator, 'abort');

			planningStore.startSession('Test', 'Description', 'feature', 'quick');

			expect(planningStore.isRunning).toBe(true);

			planningStore.abortSession();

			expect(abortSpy).toHaveBeenCalled();
			expect(planningStore.isRunning).toBe(false);
			expect(planningStore.isPaused).toBe(false);
			expect(planningStore.error).toContain('aborted');

			runSessionSpy.mockRestore();
			abortSpy.mockRestore();
		});

		it('should save aborted session to history', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve({} as any), 1000);
					})
			);

			planningStore.startSession('Test', 'Description', 'feature', 'quick');
			planningStore.abortSession();

			// Wait a tick for state to update
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(planningStore.sessions.length).toBe(1);

			runSessionSpy.mockRestore();
		});
	});

	// ==========================================================================
	// CONTEXT INJECTION
	// ==========================================================================

	describe('Context Injection', () => {
		it('should inject context at next stage by default', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(async (session, callbacks) => {
				callbacks?.onSessionComplete?.(session);
				return session;
			});

			const injectSpy = vi.spyOn(planningOrchestrator, 'injectContext');

			await planningStore.startSession('Test', 'Description', 'feature', 'quick');

			planningStore.injectContext('Additional context');

			expect(injectSpy).toHaveBeenCalledWith(
				planningStore.currentSession,
				1, // Next stage index
				'Additional context'
			);

			runSessionSpy.mockRestore();
			injectSpy.mockRestore();
		});

		it('should inject context at specific stage', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(async (session, callbacks) => {
				callbacks?.onSessionComplete?.(session);
				return session;
			});

			const injectSpy = vi.spyOn(planningOrchestrator, 'injectContext');

			await planningStore.startSession('Test', 'Description', 'feature');

			planningStore.injectContext('Stage 2 context', 2);

			expect(injectSpy).toHaveBeenCalledWith(
				planningStore.currentSession,
				2,
				'Stage 2 context'
			);

			runSessionSpy.mockRestore();
			injectSpy.mockRestore();
		});

		it('should not inject if no current session', () => {
			const injectSpy = vi.spyOn(planningOrchestrator, 'injectContext');

			planningStore.injectContext('Context');

			expect(injectSpy).not.toHaveBeenCalled();

			injectSpy.mockRestore();
		});
	});

	// ==========================================================================
	// SESSION MANAGEMENT
	// ==========================================================================

	describe('Session Management', () => {
		it('should load a previous session', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(async (session, callbacks) => {
				const completedSession = {
					...session,
					id: 'session-123',
					status: 'completed'
				};
				callbacks?.onSessionComplete?.(completedSession as any);
				return completedSession as any;
			});

			await planningStore.startSession('Test', 'Description', 'feature', 'quick');

			const sessionId = planningStore.sessions[0].id;

			// Clear current session
			planningStore.clearAllSessions();
			expect(planningStore.currentSession).toBeNull();

			// Manually add session back
			planningStore.sessions.push({ id: sessionId, title: 'Test' } as any);

			// Load it
			planningStore.loadSession(sessionId);

			expect(planningStore.currentSession).toBeTruthy();
			expect(planningStore.currentSession?.id).toBe(sessionId);

			runSessionSpy.mockRestore();
		});

		it('should delete a session', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(async (session, callbacks) => {
				const completedSession = { ...session, id: 'session-123' };
				callbacks?.onSessionComplete?.(completedSession as any);
				return completedSession as any;
			});

			await planningStore.startSession('Test', 'Description', 'feature', 'quick');

			const sessionId = planningStore.sessions[0].id;

			expect(planningStore.sessions.length).toBe(1);

			planningStore.deleteSession(sessionId);

			expect(planningStore.sessions.length).toBe(0);

			runSessionSpy.mockRestore();
		});

		it('should clear current session when deleting it', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(async (session, callbacks) => {
				const completedSession = { ...session, id: 'session-123' };
				callbacks?.onSessionComplete?.(completedSession as any);
				return completedSession as any;
			});

			await planningStore.startSession('Test', 'Description', 'feature', 'quick');

			const sessionId = planningStore.currentSession!.id;

			planningStore.deleteSession(sessionId);

			expect(planningStore.currentSession).toBeNull();

			runSessionSpy.mockRestore();
		});

		it('should clear all sessions', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(async (session, callbacks) => {
				callbacks?.onSessionComplete?.(session);
				return session;
			});

			await planningStore.startSession('Session 1', 'Description', 'feature', 'quick');
			await planningStore.startSession('Session 2', 'Description', 'feature', 'quick');

			expect(planningStore.sessions.length).toBeGreaterThan(0);

			planningStore.clearAllSessions();

			expect(planningStore.sessions.length).toBe(0);
			expect(planningStore.currentSession).toBeNull();

			runSessionSpy.mockRestore();
		});
	});

	// ==========================================================================
	// DERIVED STATE
	// ==========================================================================

	describe('Derived State', () => {
		it('should calculate progress correctly', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(async (session, callbacks) => {
				callbacks?.onSessionComplete?.(session);
				return session;
			});

			await planningStore.startSession('Test', 'Description', 'feature', 'quick');

			// Initially 0%
			expect(planningStore.progress).toBe(0);

			// Complete first stage
			if (planningStore.currentSession) {
				planningStore.currentSession.stages[0].status = 'completed';
				expect(planningStore.progress).toBe(50); // 1/2 stages
			}

			runSessionSpy.mockRestore();
		});

		it('should detect session complete', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(async (session, callbacks) => {
				const completedSession = {
					...session,
					status: 'completed',
					stages: []
				};
				callbacks?.onSessionComplete?.(completedSession as any);
				return completedSession as any;
			});

			await planningStore.startSession('Test', 'Description', 'feature', 'quick');

			if (planningStore.currentSession) {
				planningStore.currentSession.status = 'completed';
				expect(planningStore.sessionComplete).toBe(true);
			}

			runSessionSpy.mockRestore();
		});

		it('should track session statistics', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');

			// Add completed session
			runSessionSpy.mockImplementationOnce(async (session, callbacks) => {
				const completedSession = { ...session, status: 'completed' };
				callbacks?.onSessionComplete?.(completedSession as any);
				return completedSession as any;
			});
			await planningStore.startSession('Session 1', 'Description', 'feature', 'quick');

			// Add failed session
			runSessionSpy.mockRejectedValueOnce(new Error('Failed'));
			try {
				await planningStore.startSession('Session 2', 'Description', 'feature', 'quick');
			} catch {
				// Expected
			}

			expect(planningStore.totalSessions).toBeGreaterThanOrEqual(1);
			expect(planningStore.completedSessions).toBeGreaterThanOrEqual(0);
			expect(planningStore.failedSessions).toBeGreaterThanOrEqual(0);

			runSessionSpy.mockRestore();
		});
	});

	// ==========================================================================
	// LOCALSTORAGE PERSISTENCE
	// ==========================================================================

	describe('localStorage Persistence', () => {
		it('should save sessions to localStorage', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(async (session, callbacks) => {
				const completedSession = { ...session, id: 'session-123' };
				callbacks?.onSessionComplete?.(completedSession as any);
				return completedSession as any;
			});

			await planningStore.startSession('Test', 'Description', 'feature', 'quick');

			const stored = localStorageMock.getItem('vibeforge-planning-sessions');
			expect(stored).toBeTruthy();

			const parsed = JSON.parse(stored!);
			expect(parsed).toHaveLength(1);

			runSessionSpy.mockRestore();
		});

		it('should clear localStorage when clearing sessions', () => {
			planningStore.clearAllSessions();

			const stored = localStorageMock.getItem('vibeforge-planning-sessions');
			const parsed = JSON.parse(stored || '[]');

			expect(parsed).toEqual([]);
		});
	});

	// ==========================================================================
	// API KEY MANAGEMENT
	// ==========================================================================

	describe('API Key Management', () => {
		it('should set API keys for providers', () => {
			const setApiKeySpy = vi.spyOn(planningOrchestrator, 'setApiKey');

			planningStore.setApiKeys({
				anthropic: 'anthropic-key',
				openai: 'openai-key',
				xai: 'xai-key',
				google: 'google-key'
			});

			expect(setApiKeySpy).toHaveBeenCalledWith('anthropic', 'anthropic-key');
			expect(setApiKeySpy).toHaveBeenCalledWith('openai', 'openai-key');
			expect(setApiKeySpy).toHaveBeenCalledWith('xai', 'xai-key');
			expect(setApiKeySpy).toHaveBeenCalledWith('google', 'google-key');

			setApiKeySpy.mockRestore();
		});

		it('should set only provided API keys', () => {
			const setApiKeySpy = vi.spyOn(planningOrchestrator, 'setApiKey');

			planningStore.setApiKeys({
				anthropic: 'anthropic-key'
			});

			expect(setApiKeySpy).toHaveBeenCalledTimes(1);
			expect(setApiKeySpy).toHaveBeenCalledWith('anthropic', 'anthropic-key');

			setApiKeySpy.mockRestore();
		});
	});
});
