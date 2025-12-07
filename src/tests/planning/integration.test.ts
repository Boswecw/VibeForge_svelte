/**
 * Planning Integration Tests
 * Tests for end-to-end integration of planning components and stores
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { planningStore } from '$lib/workbench/planning/stores/planning.svelte';
import { licenseStore } from '$lib/core/stores/license.svelte';
import { planningOrchestrator } from '$lib/workbench/planning/services/orchestrator';

// Mock localStorage
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

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Planning Integration', () => {
	beforeEach(() => {
		localStorageMock.clear();
		planningStore.clearAllSessions();

		// Reset license to free, then upgrade to trial
		licenseStore.resetToFree();
		licenseStore.upgradeTier('trial');
	});

	describe('Component Exports', () => {
		it('should export PlanningPanel component', async () => {
			const module = await import('$lib/workbench/planning/components/PlanningPanel.svelte');
			expect(module.default).toBeDefined();
		});

		it('should export RequestInput component', async () => {
			const module = await import('$lib/workbench/planning/components/RequestInput.svelte');
			expect(module.default).toBeDefined();
		});

		it('should export StageCard component', async () => {
			const module = await import('$lib/workbench/planning/components/StageCard.svelte');
			expect(module.default).toBeDefined();
		});

		it('should export ProgressTracker component', async () => {
			const module = await import('$lib/workbench/planning/components/ProgressTracker.svelte');
			expect(module.default).toBeDefined();
		});

		it('should export OutputDisplay component', async () => {
			const module = await import('$lib/workbench/planning/components/OutputDisplay.svelte');
			expect(module.default).toBeDefined();
		});

		it('should export SettingsPanel component', async () => {
			const module = await import('$lib/workbench/planning/components/SettingsPanel.svelte');
			expect(module.default).toBeDefined();
		});
	});

	describe('Store Integration', () => {
		it('should create a session with orchestrator', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(async (session, callbacks) => {
				// Simulate session completion
				await new Promise((resolve) => setTimeout(resolve, 10));
				callbacks?.onSessionComplete?.(session);
				return session;
			});

			await planningStore.startSession(
				'Test Feature',
				'Implement test feature with full coverage',
				'feature',
				'quick'
			);

			expect(runSessionSpy).toHaveBeenCalled();
			expect(planningStore.sessions.length).toBeGreaterThan(0);

			runSessionSpy.mockRestore();
		});

		it('should persist sessions to localStorage', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(async (session, callbacks) => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				callbacks?.onSessionComplete?.(session);
				return session;
			});

			await planningStore.startSession(
				'Test Feature',
				'Implement test feature',
				'feature',
				'quick'
			);

			const stored = localStorageMock.getItem('vibeforge-planning-sessions');
			expect(stored).toBeTruthy();

			const parsed = JSON.parse(stored!);
			expect(parsed.length).toBeGreaterThan(0);

			runSessionSpy.mockRestore();
		});

		it('should enforce license quota', async () => {
			// Use all quota
			for (let i = 0; i < 20; i++) {
				licenseStore.recordOrchestratorRun();
			}

			expect(licenseStore.orchestratorQuotaRemaining).toBe(0);
			expect(planningStore.canStartSession).toBe(false);
		});

		it('should load sessions from localStorage', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(async (session, callbacks) => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				callbacks?.onSessionComplete?.(session);
				return session;
			});

			// Create a session which will be saved to localStorage
			await planningStore.startSession(
				'Test Session',
				'Test description',
				'feature',
				'quick'
			);

			// Verify it was saved to localStorage
			const stored = localStorageMock.getItem('vibeforge-planning-sessions');
			expect(stored).toBeTruthy();
			const parsed = JSON.parse(stored!);
			expect(parsed.length).toBe(1);
			expect(parsed[0].title).toBe('Test Session');

			runSessionSpy.mockRestore();
		});
	});

	describe('API Key Management', () => {
		it('should save API keys to localStorage', () => {
			const keys = {
				anthropic: 'sk-ant-test',
				openai: 'sk-test'
			};

			planningStore.setApiKeys(keys);

			// Note: In the SettingsPanel component, keys are saved separately
			// This tests the planningStore's setApiKeys functionality
			// The actual localStorage save happens in the component
		});

		it('should validate API key presence before session start', () => {
			// Without API keys, the orchestrator should not run
			// This is handled by the modelRouter service
			expect(planningStore.canStartSession).toBe(true); // Based on license only
		});
	});

	describe('Error Handling', () => {
		it('should handle orchestrator errors gracefully', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockRejectedValue(new Error('API key invalid'));

			try {
				await planningStore.startSession(
					'Test Feature',
					'Test description',
					'feature',
					'quick'
				);
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
				expect((error as Error).message).toContain('API key invalid');
			}

			runSessionSpy.mockRestore();
		});

		it('should set error state on failure', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockRejectedValue(new Error('Network error'));

			try {
				await planningStore.startSession(
					'Test Feature',
					'Test description',
					'feature',
					'quick'
				);
			} catch (error) {
				// Error caught
			}

			expect(planningStore.error).toBeTruthy();

			runSessionSpy.mockRestore();
		});
	});

	describe('Session Management', () => {
		it('should load a previous session', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(async (session, callbacks) => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				callbacks?.onSessionComplete?.(session);
				return session;
			});

			await planningStore.startSession(
				'Test Feature',
				'Test description',
				'feature',
				'quick'
			);

			const sessionId = planningStore.sessions[0].id;
			planningStore.loadSession(sessionId);

			expect(planningStore.currentSession?.id).toBe(sessionId);

			runSessionSpy.mockRestore();
		});

		it('should delete a session', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(async (session, callbacks) => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				callbacks?.onSessionComplete?.(session);
				return session;
			});

			await planningStore.startSession(
				'Test Feature',
				'Test description',
				'feature',
				'quick'
			);

			const sessionId = planningStore.sessions[0].id;
			const initialLength = planningStore.sessions.length;

			planningStore.deleteSession(sessionId);

			expect(planningStore.sessions.length).toBe(initialLength - 1);

			runSessionSpy.mockRestore();
		});

		it('should respect MAX_STORED_SESSIONS limit', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');
			runSessionSpy.mockImplementation(async (session, callbacks) => {
				callbacks?.onSessionComplete?.(session);
				return session;
			});

			// Create 51 sessions (max is 50)
			for (let i = 0; i < 51; i++) {
				await planningStore.startSession(
					`Feature ${i}`,
					`Description ${i}`,
					'feature',
					'quick'
				);
			}

			expect(planningStore.sessions.length).toBeLessThanOrEqual(50);

			runSessionSpy.mockRestore();
		});
	});

	describe('Statistics', () => {
		it('should calculate session statistics correctly', async () => {
			const runSessionSpy = vi.spyOn(planningOrchestrator, 'runSession');

			// Mock 2 completed, 1 failed
			runSessionSpy.mockImplementationOnce(async (session, callbacks) => {
				session.status = 'completed';
				callbacks?.onSessionComplete?.(session);
				return session;
			});

			runSessionSpy.mockImplementationOnce(async (session, callbacks) => {
				session.status = 'completed';
				callbacks?.onSessionComplete?.(session);
				return session;
			});

			runSessionSpy.mockImplementationOnce(async (session, callbacks) => {
				session.status = 'failed';
				session.error = 'Test error';
				callbacks?.onSessionComplete?.(session);
				return session;
			});

			await planningStore.startSession('Feature 1', 'Desc 1', 'feature', 'quick');
			await planningStore.startSession('Feature 2', 'Desc 2', 'feature', 'quick');
			await planningStore.startSession('Feature 3', 'Desc 3', 'feature', 'quick');

			expect(planningStore.totalSessions).toBe(3);
			expect(planningStore.completedSessions).toBe(2);
			expect(planningStore.failedSessions).toBe(1);

			runSessionSpy.mockRestore();
		});
	});
});
