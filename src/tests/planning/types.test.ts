/**
 * Planning Types Tests
 * Tests for planning type system and helper functions
 */

import { describe, it, expect } from 'vitest';
import {
	type StageType,
	type StageStatus,
	type Provider,
	type RequestType,
	type SessionStatus,
	type PipelineType,
	type PlanningSession,
	type PlanningStage,
	type PipelineConfig,
	DEFAULT_STAGE_CONFIGS,
	DEFAULT_PLANNING_CONFIG,
	QUICK_PLANNING_CONFIG,
	DEEP_PLANNING_CONFIG,
	PIPELINES,
	getPipeline,
	listPipelines,
	estimatePipelineCost,
	createPlanningSession,
	getCurrentStage,
	isSessionComplete,
	getSessionProgress
} from '$lib/workbench/planning/types';

// ==============================================================================
// ENUMS & TYPES
// ==============================================================================

describe('Planning Types - Enums', () => {
	it('should define all stage types', () => {
		const stageTypes: StageType[] = ['initial', 'review', 'refinement', 'final'];
		expect(stageTypes).toHaveLength(4);
	});

	it('should define all stage statuses', () => {
		const statuses: StageStatus[] = ['pending', 'running', 'completed', 'failed', 'skipped'];
		expect(statuses).toHaveLength(5);
	});

	it('should define all providers', () => {
		const providers: Provider[] = ['anthropic', 'openai', 'xai', 'google'];
		expect(providers).toHaveLength(4);
	});

	it('should define all request types', () => {
		const requestTypes: RequestType[] = [
			'feature',
			'refactor',
			'bugfix',
			'analysis',
			'architecture'
		];
		expect(requestTypes).toHaveLength(5);
	});

	it('should define all session statuses', () => {
		const sessionStatuses: SessionStatus[] = [
			'active',
			'paused',
			'completed',
			'failed',
			'cancelled'
		];
		expect(sessionStatuses).toHaveLength(5);
	});

	it('should define all pipeline types', () => {
		const pipelineTypes: PipelineType[] = ['default', 'quick', 'deep'];
		expect(pipelineTypes).toHaveLength(3);
	});
});

// ==============================================================================
// DEFAULT CONFIGURATIONS
// ==============================================================================

describe('Planning Types - Default Configs', () => {
	it('should have stage config for initial', () => {
		const config = DEFAULT_STAGE_CONFIGS.initial;

		expect(config.provider).toBe('openai');
		expect(config.model).toContain('gpt-4');
		expect(config.maxTokens).toBeGreaterThan(0);
		expect(config.temperature).toBeGreaterThanOrEqual(0);
		expect(config.temperature).toBeLessThanOrEqual(1);
		expect(config.skippable).toBe(false);
	});

	it('should have stage config for review', () => {
		const config = DEFAULT_STAGE_CONFIGS.review;

		expect(config.provider).toBe('anthropic');
		expect(config.model).toContain('claude');
		expect(config.skippable).toBe(false);
	});

	it('should have stage config for refinement', () => {
		const config = DEFAULT_STAGE_CONFIGS.refinement;

		expect(config.provider).toBe('openai');
		expect(config.skippable).toBe(true); // Refinement is skippable
	});

	it('should have stage config for final', () => {
		const config = DEFAULT_STAGE_CONFIGS.final;

		expect(config.provider).toBe('anthropic');
		expect(config.maxTokens).toBeGreaterThan(4000); // Final needs more tokens
		expect(config.temperature).toBeLessThan(0.7); // Final is more deterministic
	});

	it('should have default planning config with 4 stages', () => {
		expect(DEFAULT_PLANNING_CONFIG.type).toBe('default');
		expect(DEFAULT_PLANNING_CONFIG.stages).toHaveLength(4);
		expect(DEFAULT_PLANNING_CONFIG.estimatedDuration).toBeGreaterThan(0);
		expect(DEFAULT_PLANNING_CONFIG.maxIterations).toBeGreaterThanOrEqual(1);
	});

	it('should have quick planning config with 2 stages', () => {
		expect(QUICK_PLANNING_CONFIG.type).toBe('quick');
		expect(QUICK_PLANNING_CONFIG.stages).toHaveLength(2);
		expect(QUICK_PLANNING_CONFIG.estimatedDuration).toBeLessThan(
			DEFAULT_PLANNING_CONFIG.estimatedDuration
		);
	});

	it('should have deep planning config with 6 stages', () => {
		expect(DEEP_PLANNING_CONFIG.type).toBe('deep');
		expect(DEEP_PLANNING_CONFIG.stages).toHaveLength(6);
		expect(DEEP_PLANNING_CONFIG.estimatedDuration).toBeGreaterThan(
			DEFAULT_PLANNING_CONFIG.estimatedDuration
		);
	});

	it('should have all pipelines in PIPELINES object', () => {
		expect(PIPELINES.default).toEqual(DEFAULT_PLANNING_CONFIG);
		expect(PIPELINES.quick).toEqual(QUICK_PLANNING_CONFIG);
		expect(PIPELINES.deep).toEqual(DEEP_PLANNING_CONFIG);
	});
});

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

describe('Planning Types - getPipeline', () => {
	it('should get default pipeline', () => {
		const pipeline = getPipeline('default');
		expect(pipeline).toEqual(DEFAULT_PLANNING_CONFIG);
	});

	it('should get quick pipeline', () => {
		const pipeline = getPipeline('quick');
		expect(pipeline).toEqual(QUICK_PLANNING_CONFIG);
	});

	it('should get deep pipeline', () => {
		const pipeline = getPipeline('deep');
		expect(pipeline).toEqual(DEEP_PLANNING_CONFIG);
	});
});

describe('Planning Types - listPipelines', () => {
	it('should list all pipelines', () => {
		const pipelines = listPipelines();

		expect(pipelines).toHaveLength(3);
		expect(pipelines).toContain(DEFAULT_PLANNING_CONFIG);
		expect(pipelines).toContain(QUICK_PLANNING_CONFIG);
		expect(pipelines).toContain(DEEP_PLANNING_CONFIG);
	});
});

describe('Planning Types - estimatePipelineCost', () => {
	it('should estimate cost for default pipeline', () => {
		const cost = estimatePipelineCost(DEFAULT_PLANNING_CONFIG);

		expect(cost).toBeGreaterThan(0);
		expect(cost).toBeLessThan(1); // Should be under $1
	});

	it('should estimate cost for quick pipeline', () => {
		const cost = estimatePipelineCost(QUICK_PLANNING_CONFIG);

		expect(cost).toBeGreaterThan(0);
		expect(cost).toBeLessThan(estimatePipelineCost(DEFAULT_PLANNING_CONFIG));
	});

	it('should estimate cost for deep pipeline', () => {
		const cost = estimatePipelineCost(DEEP_PLANNING_CONFIG);

		expect(cost).toBeGreaterThan(estimatePipelineCost(DEFAULT_PLANNING_CONFIG));
	});

	it('should calculate based on provider costs', () => {
		// Quick has: openai + anthropic
		const quickCost = estimatePipelineCost(QUICK_PLANNING_CONFIG);

		// Anthropic is more expensive than OpenAI
		expect(quickCost).toBeCloseTo(0.12 + 0.15, 2);
	});
});

describe('Planning Types - createPlanningSession', () => {
	it('should create a session with default pipeline', () => {
		const session = createPlanningSession(
			'Test Feature',
			'Implement a test feature',
			'feature'
		);

		expect(session.id).toContain('session_');
		expect(session.title).toBe('Test Feature');
		expect(session.description).toBe('Implement a test feature');
		expect(session.requestType).toBe('feature');
		expect(session.pipeline.type).toBe('default');
		expect(session.status).toBe('active');
		expect(session.stages).toHaveLength(4);
		expect(session.currentStageIndex).toBe(0);
		expect(session.deliverable).toBeNull();
		expect(session.totalTokens).toBe(0);
		expect(session.totalCost).toBe(0);
		expect(session.userId).toBe('anonymous');
		expect(session.workspaceId).toBe('default');
		expect(session.createdAt).toBeInstanceOf(Date);
	});

	it('should create a session with quick pipeline', () => {
		const session = createPlanningSession(
			'Quick Refactor',
			'Refactor component',
			'refactor',
			'quick'
		);

		expect(session.pipeline.type).toBe('quick');
		expect(session.stages).toHaveLength(2);
	});

	it('should create a session with deep pipeline', () => {
		const session = createPlanningSession(
			'Deep Architecture',
			'Architectural changes',
			'architecture',
			'deep'
		);

		expect(session.pipeline.type).toBe('deep');
		expect(session.stages).toHaveLength(6);
	});

	it('should create a session with custom user and workspace', () => {
		const session = createPlanningSession(
			'Test',
			'Description',
			'bugfix',
			'default',
			'user123',
			'workspace456'
		);

		expect(session.userId).toBe('user123');
		expect(session.workspaceId).toBe('workspace456');
	});

	it('should create stages with correct initial state', () => {
		const session = createPlanningSession('Test', 'Description', 'feature');

		session.stages.forEach((stage, index) => {
			expect(stage.id).toContain(session.id);
			expect(stage.index).toBe(index);
			expect(stage.status).toBe('pending');
			expect(stage.input).toBe('');
			expect(stage.output).toBe('');
			expect(stage.result).toBeNull();
			expect(stage.error).toBeNull();
			expect(stage.startedAt).toBeNull();
			expect(stage.completedAt).toBeNull();
			expect(stage.previousContext).toEqual([]);
			expect(stage.userInjections).toEqual([]);
		});
	});

	it('should generate unique session IDs', () => {
		const session1 = createPlanningSession('Test 1', 'Description', 'feature');
		const session2 = createPlanningSession('Test 2', 'Description', 'feature');

		expect(session1.id).not.toBe(session2.id);
	});
});

describe('Planning Types - getCurrentStage', () => {
	it('should get the current stage', () => {
		const session = createPlanningSession('Test', 'Description', 'feature');

		const currentStage = getCurrentStage(session);

		expect(currentStage).not.toBeNull();
		expect(currentStage?.index).toBe(0);
		expect(currentStage?.config.type).toBe('initial');
	});

	it('should return null when all stages complete', () => {
		const session = createPlanningSession('Test', 'Description', 'feature');
		session.currentStageIndex = session.stages.length;

		const currentStage = getCurrentStage(session);

		expect(currentStage).toBeNull();
	});

	it('should return correct stage as session progresses', () => {
		const session = createPlanningSession('Test', 'Description', 'feature');

		// Stage 0
		expect(getCurrentStage(session)?.index).toBe(0);

		// Stage 1
		session.currentStageIndex = 1;
		expect(getCurrentStage(session)?.index).toBe(1);
		expect(getCurrentStage(session)?.config.type).toBe('review');

		// Stage 2
		session.currentStageIndex = 2;
		expect(getCurrentStage(session)?.index).toBe(2);
		expect(getCurrentStage(session)?.config.type).toBe('refinement');

		// Stage 3
		session.currentStageIndex = 3;
		expect(getCurrentStage(session)?.index).toBe(3);
		expect(getCurrentStage(session)?.config.type).toBe('final');
	});
});

describe('Planning Types - isSessionComplete', () => {
	it('should return false for active session', () => {
		const session = createPlanningSession('Test', 'Description', 'feature');

		expect(isSessionComplete(session)).toBe(false);
	});

	it('should return true when status is completed', () => {
		const session = createPlanningSession('Test', 'Description', 'feature');
		session.status = 'completed';

		expect(isSessionComplete(session)).toBe(true);
	});

	it('should return true when all stages processed', () => {
		const session = createPlanningSession('Test', 'Description', 'feature');
		session.currentStageIndex = session.stages.length;

		expect(isSessionComplete(session)).toBe(true);
	});

	it('should return false for paused session', () => {
		const session = createPlanningSession('Test', 'Description', 'feature');
		session.status = 'paused';

		expect(isSessionComplete(session)).toBe(false);
	});
});

describe('Planning Types - getSessionProgress', () => {
	it('should return 0% for new session', () => {
		const session = createPlanningSession('Test', 'Description', 'feature');

		expect(getSessionProgress(session)).toBe(0);
	});

	it('should return 25% when 1 of 4 stages complete', () => {
		const session = createPlanningSession('Test', 'Description', 'feature');
		session.stages[0].status = 'completed';

		expect(getSessionProgress(session)).toBe(25);
	});

	it('should return 50% when 2 of 4 stages complete', () => {
		const session = createPlanningSession('Test', 'Description', 'feature');
		session.stages[0].status = 'completed';
		session.stages[1].status = 'completed';

		expect(getSessionProgress(session)).toBe(50);
	});

	it('should return 75% when 3 of 4 stages complete', () => {
		const session = createPlanningSession('Test', 'Description', 'feature');
		session.stages[0].status = 'completed';
		session.stages[1].status = 'completed';
		session.stages[2].status = 'completed';

		expect(getSessionProgress(session)).toBe(75);
	});

	it('should return 100% when all stages complete', () => {
		const session = createPlanningSession('Test', 'Description', 'feature');
		session.stages.forEach((stage) => {
			stage.status = 'completed';
		});

		expect(getSessionProgress(session)).toBe(100);
	});

	it('should only count completed stages (not running or failed)', () => {
		const session = createPlanningSession('Test', 'Description', 'feature');
		session.stages[0].status = 'completed';
		session.stages[1].status = 'running';
		session.stages[2].status = 'failed';
		session.stages[3].status = 'pending';

		expect(getSessionProgress(session)).toBe(25);
	});

	it('should handle empty stages array', () => {
		const session = createPlanningSession('Test', 'Description', 'feature');
		session.stages = [];

		expect(getSessionProgress(session)).toBe(0);
	});

	it('should work with quick pipeline (2 stages)', () => {
		const session = createPlanningSession('Test', 'Description', 'feature', 'quick');
		session.stages[0].status = 'completed';

		expect(getSessionProgress(session)).toBe(50);
	});

	it('should work with deep pipeline (6 stages)', () => {
		const session = createPlanningSession('Test', 'Description', 'feature', 'deep');
		session.stages[0].status = 'completed';
		session.stages[1].status = 'completed';
		session.stages[2].status = 'completed';

		expect(getSessionProgress(session)).toBe(50);
	});
});

// ==============================================================================
// INTEGRATION TESTS
// ==============================================================================

describe('Planning Types - Integration', () => {
	it('should create complete workflow for default pipeline', () => {
		const session = createPlanningSession(
			'New Feature',
			'Add user authentication',
			'feature'
		);

		// Session created
		expect(session.status).toBe('active');
		expect(session.stages).toHaveLength(4);

		// Stage sequence is correct
		expect(session.stages[0].config.type).toBe('initial');
		expect(session.stages[0].config.provider).toBe('openai');

		expect(session.stages[1].config.type).toBe('review');
		expect(session.stages[1].config.provider).toBe('anthropic');

		expect(session.stages[2].config.type).toBe('refinement');
		expect(session.stages[2].config.provider).toBe('openai');

		expect(session.stages[3].config.type).toBe('final');
		expect(session.stages[3].config.provider).toBe('anthropic');

		// Progress tracking
		expect(getSessionProgress(session)).toBe(0);
		expect(getCurrentStage(session)?.config.type).toBe('initial');
		expect(isSessionComplete(session)).toBe(false);
	});

	it('should simulate complete session lifecycle', () => {
		const session = createPlanningSession('Test', 'Description', 'feature');

		// Start
		expect(session.status).toBe('active');
		expect(getCurrentStage(session)?.index).toBe(0);

		// Complete stage 1
		session.stages[0].status = 'completed';
		session.currentStageIndex = 1;
		expect(getSessionProgress(session)).toBe(25);
		expect(getCurrentStage(session)?.config.type).toBe('review');

		// Complete stage 2
		session.stages[1].status = 'completed';
		session.currentStageIndex = 2;
		expect(getSessionProgress(session)).toBe(50);

		// Complete stage 3
		session.stages[2].status = 'completed';
		session.currentStageIndex = 3;
		expect(getSessionProgress(session)).toBe(75);

		// Complete final stage
		session.stages[3].status = 'completed';
		session.currentStageIndex = 4;
		session.status = 'completed';
		expect(getSessionProgress(session)).toBe(100);
		expect(isSessionComplete(session)).toBe(true);
	});
});
