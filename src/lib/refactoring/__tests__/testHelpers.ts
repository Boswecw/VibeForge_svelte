/**
 * Test Helpers
 *
 * Utility functions for creating complete test objects
 */

import type { RefactoringTask, RefactoringPhase, RefactoringPlan } from '../types/planning';
import type { QualityGate } from '../types/standards';

/**
 * Creates a complete RefactoringTask with sensible defaults
 */
export function createTestTask(overrides: Partial<RefactoringTask> = {}): RefactoringTask {
	const defaults: RefactoringTask = {
		id: `task-test-${Date.now()}`,
		phase: 1,
		category: 'testing',
		priority: 'high',
		status: 'pending',
		createdAt: new Date().toISOString(),

		title: 'Test Task',
		description: 'Test task description',
		rationale: 'Test rationale',

		estimatedHours: 2,
		actualHours: undefined,

		// AI-specific estimate (minutes, not hours)
		estimatedMinutesAI: 15, // ~8x faster than human
		aiEstimateConfidence: 0.8,

		files: [],
		affectedFiles: [], // Legacy alias
		dependencies: [],
		blockedBy: undefined,

		acceptance: ['All tests passing'],
		acceptanceCriteria: ['All tests passing'], // Legacy alias
		commands: undefined,

		autoExecutable: false,
		claudePrompt: undefined
	};

	return { ...defaults, ...overrides };
}

/**
 * Creates a complete RefactoringPhase with sensible defaults
 */
export function createTestPhase(overrides: Partial<RefactoringPhase> = {}): RefactoringPhase {
	const defaults: RefactoringPhase = {
		id: `phase-test-1`,
		phase: 1,
		number: 1, // Legacy alias
		name: 'Test Phase',
		description: 'Test phase description',
		required: true,

		tasks: [],
		gate: createTestGate(),

		estimatedHours: 0,
		actualHours: undefined,

		startedAt: undefined,
		completedAt: undefined,
		status: 'pending'
	};

	return { ...defaults, ...overrides };
}

/**
 * Creates a complete QualityGate with sensible defaults
 */
export function createTestGate(overrides: Partial<QualityGate> = {}): QualityGate {
	const defaults: QualityGate = {
		id: `gate-test-1`,
		name: 'Test Quality Gate',
		description: 'Test gate description',
		phase: 1,
		checks: [],
		required: true
	};

	return { ...defaults, ...overrides };
}

/**
 * Creates a minimal RefactoringPlan for testing
 */
export function createTestPlan(overrides: Partial<RefactoringPlan> = {}): RefactoringPlan {
	const createdAt = new Date().toISOString();

	const defaults: RefactoringPlan = {
		id: `plan-test-${Date.now()}`,
		analysisId: 'analysis-test',
		standardsId: 'standards-test',
		createdAt,
		updatedAt: createdAt,

		name: 'Test Refactoring Plan',
		description: 'Test plan description',
		goals: ['Test goal'],

		phases: [],
		estimate: {
			developmentHours: 0,
			testingHours: 0,
			reviewHours: 0,
			totalHours: 0,
			weekEstimate: 0,
			assumptions: []
		},
		totalEstimatedHours: 0,
		prompts: [],
		qualityGates: [],

		riskFactors: [],
		prerequisites: [],
		deliverables: [],

		status: 'draft'
	};

	return { ...defaults, ...overrides };
}
