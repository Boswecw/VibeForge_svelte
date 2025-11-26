/**
 * Refactoring Planning Type Definitions
 *
 * Types for generating refactoring plans: tasks, phases, estimates, gates.
 */

import type { QualityGate } from './standards';

export type TaskCategory =
	| 'testing'
	| 'type-safety'
	| 'code-quality'
	| 'architecture'
	| 'documentation';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped';

export interface RefactoringTask {
	id: string;
	phase: number;
	category: TaskCategory;
	priority: TaskPriority;
	status: TaskStatus;
	createdAt: string;

	title: string;
	description: string;
	rationale: string; // Why this task is needed

	estimatedHours: number;
	actualHours?: number;

	// AI-specific estimate (minutes, not hours)
	estimatedMinutesAI: number;
	aiEstimateConfidence: number; // 0-1

	files: string[];
	affectedFiles: string[]; // Legacy alias for files
	dependencies: string[]; // Task IDs that must complete first
	blockedBy?: string[]; // Issue IDs blocking this task

	acceptance: string[]; // Acceptance criteria (bullets)
	acceptanceCriteria: string[]; // Legacy alias for acceptance
	commands?: string[]; // Verification commands

	autoExecutable: boolean;
	claudePrompt?: string; // Prompt for Claude Code execution
}

export interface RefactoringPhase {
	id: string;
	phase: number;
	number: number; // Legacy alias for phase
	name: string;
	description: string;
	required: boolean;

	tasks: RefactoringTask[];
	gate: QualityGate;

	estimatedHours: number;
	actualHours?: number;

	startedAt?: string;
	completedAt?: string;
	status: 'pending' | 'in_progress' | 'completed' | 'blocked';
}

export interface TimeEstimate {
	optimistic: number; // Hours (best case)
	realistic: number; // Hours (most likely)
	pessimistic: number; // Hours (worst case)
	expected: number; // Weighted average
	confidence: number; // 0-1 confidence in estimate

	// AI estimates (in minutes)
	aiOptimisticMinutes: number;
	aiRealisticMinutes: number;
	aiPessimisticMinutes: number;
	aiExpectedMinutes: number;
	aiConfidence: number;
}

export interface CostEstimate {
	developmentHours: number;
	testingHours: number;
	reviewHours: number;
	totalHours: number;
	weekEstimate: number;
	assumptions: string[];
}

export interface RefactoringPlan {
	id: string;
	analysisId: string;
	standardsId: string;
	createdAt: string;
	updatedAt: string;

	name: string;
	description: string;
	goals: string[];

	phases: RefactoringPhase[];
	estimate: CostEstimate;
	totalEstimatedHours: number;
	prompts: ClaudePromptDocument[];
	qualityGates: QualityGate[];

	riskFactors: {
		factor: string;
		impact: 'high' | 'medium' | 'low';
		mitigation: string;
	}[];

	prerequisites: string[];
	deliverables: string[];

	status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
}

export interface PlanTemplate {
	id: string;
	name: string;
	description: string;
	category: TaskCategory;
	applicableWhen: string[]; // Conditions when template applies

	phaseTemplates: {
		name: string;
		description: string;
		taskTemplates: {
			title: string;
			description: string;
			estimatedHours: number;
			category: TaskCategory;
			priority: TaskPriority;
		}[];
	}[];
}

export interface ClaudePromptDocument {
	taskId: string;
	title: string;
	content: string;
	plan: RefactoringPlan;
	phase: number;
	generatedAt: string;

	prompt: string; // Full prompt for Claude Code
	context: {
		codebaseInfo: string;
		currentState: string;
		goals: string;
		constraints: string;
	};
	commands: string[]; // Verification commands
}

export interface ImplementationDocument {
	plan: RefactoringPlan;
	generatedAt: string;

	markdown: string; // Full implementation doc in markdown
	sections: {
		overview: string;
		phases: string;
		tasks: string;
		verification: string;
		rollback: string;
	};
}
