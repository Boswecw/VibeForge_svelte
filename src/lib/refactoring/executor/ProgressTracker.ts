/**
 * Progress Tracker
 *
 * Monitors and calculates execution progress for refactoring projects
 */

import type {
	RefactoringProject,
	ExecutionProgress,
	PhaseExecution,
	TaskExecution,
	ExecutionStatus
} from '../types/execution';
import type { RefactoringPlan } from '../types/planning';

/**
 * Progress Tracker
 *
 * Tracks execution state and calculates progress metrics
 */
export class ProgressTracker {
	/**
	 * Calculates current progress from project state
	 */
	calculateProgress(project: RefactoringProject): ExecutionProgress {
		const totalPhases = project.plan.phases.length;
		const totalTasks = this.countTotalTasks(project.plan);

		const completedPhases = this.countCompletedPhases(project.phases);
		const completedTasks = this.countCompletedTasks(project.phases);

		const percentage = this.calculatePercentage(completedTasks, totalTasks);

		const currentPhase = this.getCurrentPhase(project.phases, totalPhases);
		const currentTask = this.getCurrentTask(project.phases);

		const estimatedTimeRemaining = this.estimateTimeRemaining(
			project.plan,
			completedTasks,
			totalTasks,
			project.startedAt
		);

		return {
			currentPhase,
			currentTask,
			totalPhases,
			totalTasks,
			completedPhases,
			completedTasks,
			percentage,
			estimatedTimeRemaining
		};
	}

	/**
	 * Updates progress after task completion
	 */
	updateProgress(
		currentProgress: ExecutionProgress,
		taskCompleted: boolean
	): ExecutionProgress {
		if (!taskCompleted) {
			return currentProgress;
		}

		const completedTasks = currentProgress.completedTasks + 1;
		const percentage = this.calculatePercentage(completedTasks, currentProgress.totalTasks);

		return {
			...currentProgress,
			completedTasks,
			percentage
		};
	}

	/**
	 * Counts total tasks across all phases
	 */
	private countTotalTasks(plan: RefactoringPlan): number {
		return plan.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
	}

	/**
	 * Counts completed phases
	 */
	private countCompletedPhases(phases: PhaseExecution[]): number {
		return phases.filter((phase) => phase.status === 'completed').length;
	}

	/**
	 * Counts completed tasks across all phases
	 */
	private countCompletedTasks(phases: PhaseExecution[]): number {
		return phases.reduce((sum, phase) => {
			const completed = phase.tasks.filter((task) => task.status === 'completed').length;
			return sum + completed;
		}, 0);
	}

	/**
	 * Calculates completion percentage
	 */
	private calculatePercentage(completed: number, total: number): number {
		if (total === 0) return 0;
		return Math.round((completed / total) * 100);
	}

	/**
	 * Gets current phase number
	 */
	private getCurrentPhase(phases: PhaseExecution[], totalPhases: number): number {
		// Find first incomplete phase
		const currentPhase = phases.find(
			(phase) => phase.status !== 'completed' && phase.status !== 'failed'
		);

		return currentPhase ? currentPhase.phase : totalPhases;
	}

	/**
	 * Gets current task ID
	 */
	private getCurrentTask(phases: PhaseExecution[]): string | undefined {
		// Find current phase
		const currentPhase = phases.find(
			(phase) => phase.status !== 'completed' && phase.status !== 'failed'
		);

		if (!currentPhase) return undefined;

		// Find current task in phase
		const currentTask = currentPhase.tasks.find(
			(task) => task.status !== 'completed' && task.status !== 'failed'
		);

		return currentTask?.taskId;
	}

	/**
	 * Estimates time remaining based on progress and elapsed time
	 */
	private estimateTimeRemaining(
		plan: RefactoringPlan,
		completedTasks: number,
		totalTasks: number,
		startedAt?: string
	): number | undefined {
		if (!startedAt || completedTasks === 0) {
			// Use plan estimate
			return plan.totalEstimatedHours * 60; // Convert to minutes
		}

		// Calculate based on actual progress
		const elapsedMs = Date.now() - new Date(startedAt).getTime();
		const elapsedMinutes = elapsedMs / (1000 * 60);

		const avgMinutesPerTask = elapsedMinutes / completedTasks;
		const remainingTasks = totalTasks - completedTasks;

		return Math.round(avgMinutesPerTask * remainingTasks);
	}

	/**
	 * Checks if a phase is complete
	 */
	isPhaseComplete(phase: PhaseExecution): boolean {
		return phase.status === 'completed' && phase.tasks.every((task) => task.status === 'completed');
	}

	/**
	 * Checks if a task is in progress
	 */
	isTaskRunning(task: TaskExecution): boolean {
		return task.status === 'running' || task.status === 'verifying';
	}

	/**
	 * Gets phase progress summary
	 */
	getPhaseProgress(phase: PhaseExecution): {
		total: number;
		completed: number;
		failed: number;
		running: number;
		percentage: number;
	} {
		const total = phase.tasks.length;
		const completed = phase.tasks.filter((t) => t.status === 'completed').length;
		const failed = phase.tasks.filter((t) => t.status === 'failed').length;
		const running = phase.tasks.filter((t) => this.isTaskRunning(t)).length;
		const percentage = this.calculatePercentage(completed, total);

		return { total, completed, failed, running, percentage };
	}

	/**
	 * Determines overall project status
	 */
	determineProjectStatus(phases: PhaseExecution[]): ExecutionStatus {
		if (phases.length === 0) return 'idle';

		const anyFailed = phases.some((p) => p.status === 'failed');
		if (anyFailed) return 'failed';

		const allCompleted = phases.every((p) => p.status === 'completed');
		if (allCompleted) return 'completed';

		const anyRunning = phases.some((p) => p.status === 'running');
		if (anyRunning) return 'running';

		const anyVerifying = phases.some((p) => p.status === 'verifying');
		if (anyVerifying) return 'verifying';

		const anyPaused = phases.some((p) => p.status === 'paused');
		if (anyPaused) return 'paused';

		return 'preparing';
	}
}
