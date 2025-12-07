/**
 * License Store Tests
 * Tests for Svelte 5 rune-based license store with 100% coverage
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { licenseStore } from '$lib/core/stores/license.svelte';
import { FeatureFlag, TIER_CONFIGS } from '$lib/core/types/license';

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

const fetchMock = vi.fn();
global.fetch = fetchMock;

// ==============================================================================
// TESTS
// ==============================================================================

describe('License Store', () => {
	beforeEach(() => {
		localStorageMock.clear();
		fetchMock.mockClear();
		// Reset to free tier
		licenseStore.resetToFree();
	});

	// ============================================================================
	// INITIALIZATION
	// ============================================================================

	describe('initialization', () => {
		it('should initialize with free tier by default', () => {
			expect(licenseStore.tier).toBe('free');
			expect(licenseStore.isFree).toBe(true);
			expect(licenseStore.license.userId).toBe('anonymous');
		});

		it('should have correct free tier features', () => {
			const freeFeatures = TIER_CONFIGS.free.features;
			freeFeatures.forEach((feature) => {
				expect(licenseStore.checkFeature(feature)).toBe(true);
			});
		});

		it('should not have premium features on free tier', () => {
			expect(licenseStore.checkFeature(FeatureFlag.ORCHESTRATOR_MULTI_AI)).toBe(false);
			expect(licenseStore.checkFeature(FeatureFlag.EXECUTION_CLOUD)).toBe(false);
			expect(licenseStore.checkFeature(FeatureFlag.TEAM_WORKSPACES)).toBe(false);
		});
	});

	// ============================================================================
	// DERIVED STATE - TIER CHECKS
	// ============================================================================

	describe('tier checks', () => {
		it('should correctly identify free tier', () => {
			expect(licenseStore.isFree).toBe(true);
			expect(licenseStore.isTrial).toBe(false);
			expect(licenseStore.isPro).toBe(false);
			expect(licenseStore.isEnterprise).toBe(false);
		});

		it('should correctly identify trial tier', () => {
			licenseStore.beginTrial();
			expect(licenseStore.isFree).toBe(false);
			expect(licenseStore.isTrial).toBe(true);
			expect(licenseStore.isPro).toBe(false);
			expect(licenseStore.isEnterprise).toBe(false);
		});

		it('should correctly identify pro tier', () => {
			licenseStore.upgradeTier('pro');
			expect(licenseStore.isFree).toBe(false);
			expect(licenseStore.isTrial).toBe(false);
			expect(licenseStore.isPro).toBe(true);
			expect(licenseStore.isEnterprise).toBe(false);
		});

		it('should correctly identify enterprise tier', () => {
			licenseStore.upgradeTier('enterprise');
			expect(licenseStore.isFree).toBe(false);
			expect(licenseStore.isTrial).toBe(false);
			expect(licenseStore.isPro).toBe(false);
			expect(licenseStore.isEnterprise).toBe(true);
		});
	});

	// ============================================================================
	// TRIAL MANAGEMENT
	// ============================================================================

	describe('trial management', () => {
		it('should start a trial from free tier', () => {
			licenseStore.beginTrial();

			expect(licenseStore.tier).toBe('trial');
			expect(licenseStore.isTrial).toBe(true);
			expect(licenseStore.license.trialEndsAt).toBeTruthy();
		});

		it('should set trial end date to 14 days from now', () => {
			licenseStore.beginTrial();

			const trialEnd = licenseStore.license.trialEndsAt;
			expect(trialEnd).toBeTruthy();

			if (trialEnd) {
				const now = new Date();
				const diff = trialEnd.getTime() - now.getTime();
				const days = diff / (1000 * 60 * 60 * 24);

				// Should be approximately 14 days (allow small tolerance)
				expect(days).toBeGreaterThan(13.9);
				expect(days).toBeLessThan(14.1);
			}
		});

		it('should not start trial if already on paid tier', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			licenseStore.upgradeTier('pro');
			licenseStore.beginTrial();

			expect(licenseStore.tier).toBe('pro');
			expect(consoleSpy).toHaveBeenCalled();

			consoleSpy.mockRestore();
		});

		it('should calculate trial days remaining correctly', () => {
			licenseStore.beginTrial();

			const daysRemaining = licenseStore.trialDaysRemaining;
			expect(daysRemaining).toBeGreaterThanOrEqual(13);
			expect(daysRemaining).toBeLessThanOrEqual(14);
		});

		it('should detect expired trial', () => {
			licenseStore.beginTrial();

			// Manually set trial end date to the past
			const expiredDate = new Date();
			expiredDate.setDate(expiredDate.getDate() - 1);

			licenseStore.license.trialEndsAt = expiredDate;

			expect(licenseStore.trialExpired).toBe(true);
			expect(licenseStore.canUseOrchestrator).toBe(false);
		});

		it('should return 0 days remaining for expired trial', () => {
			licenseStore.beginTrial();

			const expiredDate = new Date();
			expiredDate.setDate(expiredDate.getDate() - 1);
			licenseStore.license.trialEndsAt = expiredDate;

			expect(licenseStore.trialDaysRemaining).toBe(0);
		});
	});

	// ============================================================================
	// TIER UPGRADES
	// ============================================================================

	describe('tier upgrades', () => {
		it('should upgrade from free to trial', () => {
			licenseStore.beginTrial();

			expect(licenseStore.tier).toBe('trial');
			expect(licenseStore.checkFeature(FeatureFlag.ORCHESTRATOR_MULTI_AI)).toBe(true);
		});

		it('should upgrade from trial to pro', () => {
			licenseStore.beginTrial();
			licenseStore.upgradeTier('pro');

			expect(licenseStore.tier).toBe('pro');
			expect(licenseStore.license.trialEndsAt).toBeNull();
			expect(licenseStore.checkFeature(FeatureFlag.TEAM_WORKSPACES)).toBe(true);
		});

		it('should clear trial date when upgrading to pro', () => {
			licenseStore.beginTrial();
			expect(licenseStore.license.trialEndsAt).toBeTruthy();

			licenseStore.upgradeTier('pro');
			expect(licenseStore.license.trialEndsAt).toBeNull();
		});

		it('should have all features on enterprise tier', () => {
			licenseStore.upgradeTier('enterprise');

			Object.values(FeatureFlag).forEach((feature) => {
				expect(licenseStore.checkFeature(feature)).toBe(true);
			});
		});
	});

	// ============================================================================
	// FEATURE CHECKS
	// ============================================================================

	describe('feature checks', () => {
		it('should grant basic features on free tier', () => {
			expect(licenseStore.checkFeature(FeatureFlag.WORKBENCH_BASIC)).toBe(true);
			expect(licenseStore.checkFeature(FeatureFlag.WIZARD)).toBe(true);
			expect(licenseStore.checkFeature(FeatureFlag.SCAFFOLDING)).toBe(true);
		});

		it('should deny orchestrator on free tier', () => {
			expect(licenseStore.canUseOrchestrator).toBe(false);
			expect(licenseStore.checkFeature(FeatureFlag.ORCHESTRATOR_MULTI_AI)).toBe(false);
		});

		it('should grant orchestrator on trial tier', () => {
			licenseStore.beginTrial();

			expect(licenseStore.canUseOrchestrator).toBe(true);
			expect(licenseStore.checkFeature(FeatureFlag.ORCHESTRATOR_MULTI_AI)).toBe(true);
		});

		it('should grant orchestrator on pro tier', () => {
			licenseStore.upgradeTier('pro');

			expect(licenseStore.canUseOrchestrator).toBe(true);
			expect(licenseStore.checkFeature(FeatureFlag.ORCHESTRATOR_MULTI_AI)).toBe(true);
		});

		it('should deny features if trial expired', () => {
			licenseStore.beginTrial();

			// Expire the trial
			const expiredDate = new Date();
			expiredDate.setDate(expiredDate.getDate() - 1);
			licenseStore.license.trialEndsAt = expiredDate;

			expect(licenseStore.canUseOrchestrator).toBe(false);
			expect(licenseStore.canUseCloudExecution).toBe(false);
			expect(licenseStore.canUseModelComparison).toBe(false);
		});

		it('should check cloud execution availability', () => {
			expect(licenseStore.canUseCloudExecution).toBe(false);

			licenseStore.beginTrial();
			expect(licenseStore.canUseCloudExecution).toBe(true);

			licenseStore.upgradeTier('pro');
			expect(licenseStore.canUseCloudExecution).toBe(true);
		});

		it('should check model comparison availability', () => {
			expect(licenseStore.canUseModelComparison).toBe(false);

			licenseStore.beginTrial();
			expect(licenseStore.canUseModelComparison).toBe(true);
		});

		it('should check team workspaces availability', () => {
			expect(licenseStore.canUseTeamWorkspaces).toBe(false);

			licenseStore.beginTrial();
			expect(licenseStore.canUseTeamWorkspaces).toBe(false);

			licenseStore.upgradeTier('pro');
			expect(licenseStore.canUseTeamWorkspaces).toBe(true);
		});
	});

	// ============================================================================
	// USAGE TRACKING
	// ============================================================================

	describe('usage tracking', () => {
		it('should track orchestrator usage on trial', () => {
			licenseStore.beginTrial();

			expect(licenseStore.license.orchestratorUsageThisMonth).toBe(0);

			licenseStore.recordOrchestratorRun();
			expect(licenseStore.license.orchestratorUsageThisMonth).toBe(1);

			licenseStore.recordOrchestratorRun();
			expect(licenseStore.license.orchestratorUsageThisMonth).toBe(2);
		});

		it('should calculate quota remaining on trial', () => {
			licenseStore.beginTrial();

			const initialQuota = licenseStore.orchestratorQuotaRemaining;
			expect(initialQuota).toBe(20); // Trial limit

			licenseStore.recordOrchestratorRun();
			expect(licenseStore.orchestratorQuotaRemaining).toBe(19);
		});

		it('should have null quota on pro (unlimited)', () => {
			licenseStore.upgradeTier('pro');

			expect(licenseStore.orchestratorQuotaRemaining).toBeNull();
		});

		it('should deny orchestrator when quota exhausted', () => {
			licenseStore.beginTrial();

			// Exhaust quota
			for (let i = 0; i < 20; i++) {
				licenseStore.recordOrchestratorRun();
			}

			expect(licenseStore.canUseOrchestrator).toBe(false);
			expect(licenseStore.orchestratorQuotaRemaining).toBe(0);
		});

		it('should reset monthly usage', () => {
			licenseStore.beginTrial();

			licenseStore.recordOrchestratorRun();
			licenseStore.recordOrchestratorRun();
			expect(licenseStore.license.orchestratorUsageThisMonth).toBe(2);

			licenseStore.resetUsage();
			expect(licenseStore.license.orchestratorUsageThisMonth).toBe(0);
		});
	});

	// ============================================================================
	// PERSISTENCE
	// ============================================================================

	describe('localStorage persistence', () => {
		it('should persist license to localStorage on trial start', () => {
			licenseStore.beginTrial();

			const stored = localStorageMock.getItem('vibeforge-license');
			expect(stored).toBeTruthy();

			const parsed = JSON.parse(stored!);
			expect(parsed.tier).toBe('trial');
		});

		it('should persist license on upgrade', () => {
			licenseStore.upgradeTier('pro');

			const stored = localStorageMock.getItem('vibeforge-license');
			expect(stored).toBeTruthy();

			const parsed = JSON.parse(stored!);
			expect(parsed.tier).toBe('pro');
		});

		it('should persist license on usage tracking', () => {
			licenseStore.beginTrial();
			licenseStore.recordOrchestratorRun();

			const stored = localStorageMock.getItem('vibeforge-license');
			const parsed = JSON.parse(stored!);

			expect(parsed.orchestratorUsageThisMonth).toBe(1);
		});

		it('should persist user info', () => {
			licenseStore.setUserInfo('user123', 'user@example.com');

			expect(licenseStore.license.userId).toBe('user123');
			expect(licenseStore.license.email).toBe('user@example.com');

			const stored = localStorageMock.getItem('vibeforge-license');
			const parsed = JSON.parse(stored!);

			expect(parsed.userId).toBe('user123');
			expect(parsed.email).toBe('user@example.com');
		});
	});

	// ============================================================================
	// API VALIDATION
	// ============================================================================

	describe('license validation', () => {
		it('should validate license with backend', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					valid: true,
					tier: 'pro',
					userId: 'user123',
					email: 'user@example.com',
					expiresAt: null,
					trialEndsAt: null,
					features: TIER_CONFIGS.pro.features,
					limits: TIER_CONFIGS.pro.limits,
					orchestratorUsageThisMonth: 5
				})
			});

			const result = await licenseStore.validateLicense();

			expect(result).toBe(true);
			expect(licenseStore.tier).toBe('pro');
			expect(licenseStore.license.userId).toBe('user123');
			expect(licenseStore.license.orchestratorUsageThisMonth).toBe(5);
		});

		it('should handle validation failure', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					valid: false,
					error: 'License expired'
				})
			});

			const result = await licenseStore.validateLicense();

			expect(result).toBe(false);
			expect(licenseStore.validationError).toBe('License expired');
		});

		it('should handle network errors during validation', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			fetchMock.mockRejectedValueOnce(new Error('Network error'));

			const result = await licenseStore.validateLicense();

			expect(result).toBe(false);
			expect(licenseStore.validationError).toContain('Network error');

			consoleErrorSpy.mockRestore();
		});

		it('should set isValidating flag during validation', async () => {
			fetchMock.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						setTimeout(() => {
							resolve({
								ok: true,
								json: async () => ({
									valid: true,
									tier: 'free',
									userId: 'anonymous',
									email: '',
									expiresAt: null,
									trialEndsAt: null,
									features: TIER_CONFIGS.free.features,
									limits: TIER_CONFIGS.free.limits,
									orchestratorUsageThisMonth: 0
								})
							});
						}, 100);
					})
			);

			const promise = licenseStore.validateLicense();
			expect(licenseStore.isValidating).toBe(true);

			await promise;
			expect(licenseStore.isValidating).toBe(false);
		});

		it('should handle HTTP errors during validation', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			fetchMock.mockResolvedValueOnce({
				ok: false,
				statusText: 'Server Error'
			});

			const result = await licenseStore.validateLicense();

			expect(result).toBe(false);
			expect(licenseStore.validationError).toContain('Server Error');

			consoleErrorSpy.mockRestore();
		});
	});

	// ============================================================================
	// EDGE CASES
	// ============================================================================

	describe('edge cases', () => {
		it('should handle rapid tier changes', () => {
			licenseStore.beginTrial();
			licenseStore.upgradeTier('pro');
			licenseStore.resetToFree();
			licenseStore.beginTrial();

			expect(licenseStore.tier).toBe('trial');
		});

		it('should handle license expiration', () => {
			licenseStore.upgradeTier('pro');

			// Set expiration to past
			const expiredDate = new Date();
			expiredDate.setDate(expiredDate.getDate() - 1);
			licenseStore.license.expiresAt = expiredDate;

			expect(licenseStore.licenseExpired).toBe(true);
			expect(licenseStore.checkFeature(FeatureFlag.ORCHESTRATOR_MULTI_AI)).toBe(false);
		});

		it('should handle null expiration date', () => {
			licenseStore.upgradeTier('pro');

			expect(licenseStore.license.expiresAt).toBeNull();
			expect(licenseStore.licenseExpired).toBe(false);
		});

		it('should reset to free tier correctly', () => {
			licenseStore.beginTrial();
			licenseStore.recordOrchestratorRun();

			licenseStore.resetToFree();

			expect(licenseStore.tier).toBe('free');
			expect(licenseStore.license.orchestratorUsageThisMonth).toBe(0);
			expect(licenseStore.license.trialEndsAt).toBeNull();
		});

		it('should preserve user info on reset', () => {
			licenseStore.setUserInfo('user123', 'user@example.com');
			licenseStore.resetToFree();

			expect(licenseStore.license.userId).toBe('user123');
			expect(licenseStore.license.email).toBe('user@example.com');
		});
	});
});
