/**
 * Refactoring Execution Type Definitions
 *
 * Types for executing refactoring plans: Claude Code integration, Git operations, progress tracking.
 */

import type { RefactoringPlan, RefactoringPhase, RefactoringTask } from './planning';
import type { GateVerificationResult } from './standards';

export type ExecutionStatus =
	| 'idle'
	| 'preparing'
	| 'running'
	| 'verifying'
	| 'paused'
	| 'completed'
	| 'failed'
	| 'cancelled';

export interface GitCheckpoint {
	id: string;
	branch: string;
	commit: string;
	message: string;
	createdAt: string;
	phase: number;
	task?: string; // Task ID
}

export interface GitOperationResult {
	success: boolean;
	message: string;
	commit?: string;
	error?: string;
}

export interface ClaudeCodeSession {
	id: string;
	taskId: string;
	startedAt: string;
	endedAt?: string;

	prompt: string;
	status: 'running' | 'completed' | 'failed' | 'cancelled';

	output: string[];
	errors: string[];

	filesModified: string[];
	filesCreated: string[];
	filesDeleted: string[];
}

export interface TaskExecution {
	taskId: string;
	status: ExecutionStatus;
	startedAt?: string;
	completedAt?: string;
	duration?: number; // Seconds

	claudeSession?: ClaudeCodeSession;
	checkpoint?: GitCheckpoint;
	verification?: {
		passed: boolean;
		results: string[];
		errors: string[];
	};

	logs: {
		timestamp: string;
		level: 'info' | 'warning' | 'error';
		message: string;
	}[];
}

export interface PhaseExecution {
	phase: number;
	status: ExecutionStatus;
	startedAt?: string;
	completedAt?: string;

	tasks: TaskExecution[];
	gateVerification?: GateVerificationResult;

	checkpoint: GitCheckpoint;
}

export interface ExecutionProgress {
	currentPhase: number;
	currentTask?: string;

	totalPhases: number;
	totalTasks: number;

	completedPhases: number;
	completedTasks: number;

	percentage: number; // 0-100
	estimatedTimeRemaining?: number; // Minutes
}

export interface RefactoringProject {
	id: string;
	planId: string;
	createdAt: string;
	startedAt?: string;
	completedAt?: string;

	status: ExecutionStatus;
	progress: ExecutionProgress;

	plan: RefactoringPlan;
	phases: PhaseExecution[];

	repository: {
		path: string;
		originalBranch: string;
		workingBranch: string;
		checkpoints: GitCheckpoint[];
	};

	logs: {
		timestamp: string;
		level: 'info' | 'warning' | 'error';
		phase?: number;
		task?: string;
		message: string;
	}[];

	error?: {
		message: string;
		phase: number;
		task?: string;
		stackTrace?: string;
		recoverable: boolean;
	};
}

export interface ExecutionCommand {
	id: string;
	command: string;
	description: string;
	timeout: number; // Seconds
	retries: number;
}

export interface CommandResult {
	commandId: string;
	executedAt: string;
	duration: number; // Seconds

	exitCode: number;
	stdout: string;
	stderr: string;

	success: boolean;
	error?: string;
}

export interface RollbackAction {
	id: string;
	projectId: string;
	triggeredAt: string;
	triggeredBy: 'user' | 'system';

	targetCheckpoint: GitCheckpoint;
	reason: string;

	status: 'pending' | 'in_progress' | 'completed' | 'failed';
	result?: {
		success: boolean;
		message: string;
		filesRestored: number;
		error?: string;
	};
}
