/**
 * Learning & Recommendation Type Definitions
 *
 * Types for recording refactoring outcomes and generating AI-powered recommendations via NeuroForge.
 */

import type { RefactoringProject, ExecutorType, AIExecutionMetrics } from './execution';
import type { CodebaseAnalysis } from './analysis';

export type OutcomeRating = 'excellent' | 'good' | 'fair' | 'poor' | 'failed';

export interface RefactoringOutcome {
	id: string;
	projectId: string;
	recordedAt: string;

	// Context
	codebaseSize: number; // Total lines
	techStack: string; // e.g., "sveltekit-typescript"
	initialQuality: number; // 0-100 score
	targetStandard: string; // Standards preset used

	// Execution metrics
	totalTasks: number;
	completedTasks: number;
	failedTasks: number;
	skippedTasks: number;

	plannedHours: number;
	estimatedHours: number; // Alias for plannedHours
	actualHours: number;
	variance: number; // Percentage difference

	// AI execution metrics
	executorType: ExecutorType;
	aiMetrics?: AIExecutionMetrics;

	// AI-specific time tracking (minutes)
	plannedMinutesAI?: number;
	actualMinutesAI?: number;
	aiVariance?: number; // Percentage difference

	// Quality improvements
	coverageBefore: number;
	coverageAfter: number;
	typeErrorsBefore: number;
	typeErrorsAfter: number;
	qualityScoreBefore: number;
	qualityScoreAfter: number;
	todosBefore: number;
	todosAfter: number;

	// Success metrics
	allTestsPassed: boolean;
	buildSucceeded: boolean;
	noRegressions: boolean;
	gatesPassed: number;
	gatesFailed: number;
	totalGates: number;

	// Overall outcome
	rating: OutcomeRating;
	success: boolean;
	userSatisfaction?: number; // 1-5 rating from user

	// Estimation feedback
	estimationFeedback?: EstimationFeedback;

	notes?: string;
	lessonsLearned?: string[];
}

export interface EstimationFeedback {
	id: string;
	taskCategory: string;
	taskDescription: string;

	estimatedHours: number;
	actualHours: number;
	accuracy: number; // Percentage

	executorType: ExecutorType;

	// AI-specific tracking (minutes)
	estimatedMinutesAI?: number;
	actualMinutesAI?: number;
	aiAccuracy?: number; // Percentage

	codebaseContext: {
		size: number;
		techStack: string;
		quality: number;
	};

	factors: {
		factor: string;
		impact: 'positive' | 'negative';
		magnitude: number;
	}[];
}

export interface RecommendationRequest {
	analysis: CodebaseAnalysis;
	targetStandard: string;
	constraints?: {
		maxHours?: number;
		priorityCategories?: string[];
		excludeCategories?: string[];
	};
}

export interface TaskRecommendation {
	task: {
		title: string;
		description: string;
		category: string;
		priority: string;
	};

	// Legacy properties for backward compatibility
	taskCategory: string;
	taskPattern: string;
	suggestedEstimateHours: number;
	confidence: number; // 0-1

	estimate: {
		hours: number;
		confidence: number; // 0-1
		basedOn: string; // e.g., "15 similar projects"
	};

	impact: {
		coverageImprovement?: number;
		typeErrorsReduced?: number;
		qualityScore?: number;
	};

	risks: {
		risk: string;
		severity: 'high' | 'medium' | 'low';
		mitigation: string;
	}[];

	relevance: number; // 0-1 how relevant to this codebase
}

export interface PlanRecommendation {
	recommendedPhases: number;
	recommendedDuration: number; // Hours
	confidence: number; // 0-1

	tasks: TaskRecommendation[];

	insights: {
		insight: string;
		source: string; // e.g., "Learned from 50 SvelteKit projects"
	}[];

	warnings: {
		warning: string;
		severity: 'high' | 'medium' | 'low';
	}[];
}

export interface LearningMetrics {
	totalOutcomes: number;
	successRate: number; // Percentage
	avgAccuracy: number; // Estimation accuracy
	dataPoints: number;

	byTechStack: Record<
		string,
		{
			count: number;
			successRate: number;
			avgDuration: number;
		}
	>;

	byCategory: Record<
		string,
		{
			count: number;
			avgEstimate: number;
			avgActual: number;
			accuracy: number;
		}
	>;
}
