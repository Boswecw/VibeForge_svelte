/**
 * License Types for VibeForge Cortex
 * Freemium licensing system with feature gates
 */

/**
 * License tiers for freemium model
 */
export type LicenseTier = 'free' | 'trial' | 'pro' | 'enterprise';

/**
 * Available feature flags
 */
export enum FeatureFlag {
	// Free tier features
	WORKBENCH_BASIC = 'workbench_basic',
	WIZARD = 'wizard',
	SCAFFOLDING = 'scaffolding',
	CODE_ANALYSIS_BASIC = 'code_analysis_basic',
	LOCAL_HISTORY = 'local_history', // 500 runs

	// Trial/Pro features
	ORCHESTRATOR_MULTI_AI = 'orchestrator_multi_ai', // ChatGPT ↔ Claude workflow
	EXECUTION_CLOUD = 'execution_cloud',
	CLOUD_HISTORY = 'cloud_history', // 100 runs (trial), unlimited (pro)
	MODEL_COMPARISON = 'model_comparison',
	SMART_ROUTING = 'smart_routing',
	ADVANCED_ANALYTICS = 'advanced_analytics',

	// Pro-only features
	TEAM_WORKSPACES = 'team_workspaces',
	UNLIMITED_RUNS = 'unlimited_runs',
	PRIORITY_SUPPORT = 'priority_support',
	CUSTOM_MODELS = 'custom_models',

	// Enterprise features
	SSO = 'sso',
	AUDIT_LOGS = 'audit_logs',
	SLA = 'sla',
	DEDICATED_SUPPORT = 'dedicated_support'
}

/**
 * Usage limits for each tier
 */
export interface LicenseLimits {
	/** Maximum orchestrator runs per month (null = unlimited) */
	orchestratorRunsPerMonth: number | null;
	/** Maximum local history runs (null = unlimited) */
	localHistoryRuns: number | null;
	/** Maximum cloud history runs (null = unlimited) */
	cloudHistoryRuns: number | null;
	/** Maximum team members (null = unlimited) */
	teamMembers: number | null;
	/** Maximum workspaces (null = unlimited) */
	workspaces: number | null;
}

/**
 * License state
 */
export interface License {
	/** License tier */
	tier: LicenseTier;
	/** User ID */
	userId: string;
	/** User email */
	email: string;
	/** License expiration date (null = never expires) */
	expiresAt: Date | null;
	/** Trial end date (null = not in trial) */
	trialEndsAt: Date | null;
	/** Available features for this license */
	features: Set<FeatureFlag>;
	/** Usage limits */
	limits: LicenseLimits;
	/** Current orchestrator usage this month */
	orchestratorUsageThisMonth: number;
	/** License created date */
	createdAt: Date;
	/** Last validated date */
	lastValidatedAt: Date | null;
}

/**
 * License validation response from backend
 */
export interface LicenseValidationResponse {
	valid: boolean;
	tier: LicenseTier;
	userId: string;
	email: string;
	expiresAt: string | null;
	trialEndsAt: string | null;
	features: FeatureFlag[];
	limits: LicenseLimits;
	orchestratorUsageThisMonth: number;
	message?: string;
	error?: string;
}

/**
 * Tier configurations
 */
export const TIER_CONFIGS: Record<LicenseTier, { features: FeatureFlag[]; limits: LicenseLimits }> = {
	free: {
		features: [
			FeatureFlag.WORKBENCH_BASIC,
			FeatureFlag.WIZARD,
			FeatureFlag.SCAFFOLDING,
			FeatureFlag.CODE_ANALYSIS_BASIC,
			FeatureFlag.LOCAL_HISTORY
		],
		limits: {
			orchestratorRunsPerMonth: 0,
			localHistoryRuns: 500,
			cloudHistoryRuns: 0,
			teamMembers: 1,
			workspaces: 1
		}
	},
	trial: {
		features: [
			// Free tier features
			FeatureFlag.WORKBENCH_BASIC,
			FeatureFlag.WIZARD,
			FeatureFlag.SCAFFOLDING,
			FeatureFlag.CODE_ANALYSIS_BASIC,
			FeatureFlag.LOCAL_HISTORY,
			// Trial features
			FeatureFlag.ORCHESTRATOR_MULTI_AI,
			FeatureFlag.EXECUTION_CLOUD,
			FeatureFlag.CLOUD_HISTORY,
			FeatureFlag.MODEL_COMPARISON,
			FeatureFlag.SMART_ROUTING
		],
		limits: {
			orchestratorRunsPerMonth: 20,
			localHistoryRuns: 500,
			cloudHistoryRuns: 100,
			teamMembers: 1,
			workspaces: 3
		}
	},
	pro: {
		features: [
			// Free + Trial features
			FeatureFlag.WORKBENCH_BASIC,
			FeatureFlag.WIZARD,
			FeatureFlag.SCAFFOLDING,
			FeatureFlag.CODE_ANALYSIS_BASIC,
			FeatureFlag.LOCAL_HISTORY,
			FeatureFlag.ORCHESTRATOR_MULTI_AI,
			FeatureFlag.EXECUTION_CLOUD,
			FeatureFlag.CLOUD_HISTORY,
			FeatureFlag.MODEL_COMPARISON,
			FeatureFlag.SMART_ROUTING,
			FeatureFlag.ADVANCED_ANALYTICS,
			// Pro features
			FeatureFlag.TEAM_WORKSPACES,
			FeatureFlag.UNLIMITED_RUNS,
			FeatureFlag.PRIORITY_SUPPORT,
			FeatureFlag.CUSTOM_MODELS
		],
		limits: {
			orchestratorRunsPerMonth: null, // unlimited
			localHistoryRuns: null,
			cloudHistoryRuns: null,
			teamMembers: 10,
			workspaces: null
		}
	},
	enterprise: {
		features: Object.values(FeatureFlag), // All features
		limits: {
			orchestratorRunsPerMonth: null,
			localHistoryRuns: null,
			cloudHistoryRuns: null,
			teamMembers: null,
			workspaces: null
		}
	}
};

/**
 * Create a default free license
 */
export function createFreeLicense(userId: string = 'anonymous', email: string = ''): License {
	const config = TIER_CONFIGS.free;
	return {
		tier: 'free',
		userId,
		email,
		expiresAt: null,
		trialEndsAt: null,
		features: new Set(config.features),
		limits: config.limits,
		orchestratorUsageThisMonth: 0,
		createdAt: new Date(),
		lastValidatedAt: null
	};
}

/**
 * Start a trial license
 */
export function startTrial(license: License): License {
	const config = TIER_CONFIGS.trial;
	const trialEndsAt = new Date();
	trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

	return {
		...license,
		tier: 'trial',
		trialEndsAt,
		features: new Set(config.features),
		limits: config.limits,
		orchestratorUsageThisMonth: 0
	};
}

/**
 * Check if a license has a specific feature
 */
export function hasFeature(license: License, feature: FeatureFlag): boolean {
	return license.features.has(feature);
}

/**
 * Check if trial is expired
 */
export function isTrialExpired(license: License): boolean {
	if (license.tier !== 'trial' || !license.trialEndsAt) {
		return false;
	}
	return new Date() > license.trialEndsAt;
}

/**
 * Get remaining trial days
 */
export function getTrialDaysRemaining(license: License): number {
	if (license.tier !== 'trial' || !license.trialEndsAt) {
		return 0;
	}
	const now = new Date();
	const diff = license.trialEndsAt.getTime() - now.getTime();
	return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Check if license is expired
 */
export function isLicenseExpired(license: License): boolean {
	if (!license.expiresAt) {
		return false;
	}
	return new Date() > license.expiresAt;
}

/**
 * Check if user can use orchestrator (has quota remaining)
 */
export function canUseOrchestrator(license: License): boolean {
	// Must have the feature
	if (!hasFeature(license, FeatureFlag.ORCHESTRATOR_MULTI_AI)) {
		return false;
	}

	// Trial expired?
	if (isTrialExpired(license)) {
		return false;
	}

	// License expired?
	if (isLicenseExpired(license)) {
		return false;
	}

	// Check quota
	const limit = license.limits.orchestratorRunsPerMonth;
	if (limit === null) {
		return true; // unlimited
	}

	return license.orchestratorUsageThisMonth < limit;
}

/**
 * Increment orchestrator usage
 */
export function incrementOrchestratorUsage(license: License): License {
	return {
		...license,
		orchestratorUsageThisMonth: license.orchestratorUsageThisMonth + 1
	};
}

/**
 * Reset monthly usage (called at start of each month)
 */
export function resetMonthlyUsage(license: License): License {
	return {
		...license,
		orchestratorUsageThisMonth: 0
	};
}
