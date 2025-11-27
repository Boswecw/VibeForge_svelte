/**
 * Progress Store (Svelte 5)
 *
 * Manages execution progress and real-time updates using Svelte 5 runes.
 */

import type { ExecutionProgress, TaskExecution, PhaseExecution } from '../types/execution';

interface ProgressStoreState {
	/**
	 * Current execution progress
	 */
	progress: ExecutionProgress | null;

	/**
	 * Real-time logs
	 */
	logs: Array<{
		timestamp: string;
		level: 'info' | 'warning' | 'error';
		message: string;
		phase?: number;
		task?: string;
	}>;

	/**
	 * Active phase
	 */
	activePhase: PhaseExecution | null;

	/**
	 * Active task
	 */
	activeTask: TaskExecution | null;

	/**
	 * Whether execution is paused
	 */
	isPaused: boolean;

	/**
	 * Estimated time remaining (minutes)
	 */
	estimatedTimeRemaining: number | null;
}

/**
 * Creates a progress store
 */
function createProgressStore() {
	let state = $state<ProgressStoreState>({
		progress: null,
		logs: [],
		activePhase: null,
		activeTask: null,
		isPaused: false,
		estimatedTimeRemaining: null
	});

	// Derived values
	const hasProgress = $derived(state.progress !== null);
	const percentComplete = $derived(state.progress?.percentage || 0);
	const currentPhase = $derived(state.progress?.currentPhase || 0);
	const totalPhases = $derived(state.progress?.totalPhases || 0);
	const completedTasks = $derived(state.progress?.completedTasks || 0);
	const totalTasks = $derived(state.progress?.totalTasks || 0);
	const remainingTasks = $derived(totalTasks - completedTasks);

	// Recent logs (last 50)
	const recentLogs = $derived(state.logs.slice(-50));

	// Error logs only
	const errorLogs = $derived(state.logs.filter((log) => log.level === 'error'));

	return {
		// State
		get progress() {
			return state.progress;
		},
		get logs() {
			return state.logs;
		},
		get activePhase() {
			return state.activePhase;
		},
		get activeTask() {
			return state.activeTask;
		},
		get isPaused() {
			return state.isPaused;
		},
		get estimatedTimeRemaining() {
			return state.estimatedTimeRemaining;
		},

		// Derived
		get hasProgress() {
			return hasProgress;
		},
		get percentComplete() {
			return percentComplete;
		},
		get currentPhase() {
			return currentPhase;
		},
		get totalPhases() {
			return totalPhases;
		},
		get completedTasks() {
			return completedTasks;
		},
		get totalTasks() {
			return totalTasks;
		},
		get remainingTasks() {
			return remainingTasks;
		},
		get recentLogs() {
			return recentLogs;
		},
		get errorLogs() {
			return errorLogs;
		},

		// Actions

		/**
		 * Updates progress
		 */
		updateProgress(progress: ExecutionProgress): void {
			state.progress = progress;
		},

		/**
		 * Sets active phase
		 */
		setActivePhase(phase: PhaseExecution | null): void {
			state.activePhase = phase;
		},

		/**
		 * Sets active task
		 */
		setActiveTask(task: TaskExecution | null): void {
			state.activeTask = task;
		},

		/**
		 * Adds a log entry
		 */
		addLog(
			level: 'info' | 'warning' | 'error',
			message: string,
			phase?: number,
			task?: string
		): void {
			state.logs.push({
				timestamp: new Date().toISOString(),
				level,
				message,
				phase,
				task
			});

			// Keep only last 1000 logs to prevent memory issues
			if (state.logs.length > 1000) {
				state.logs = state.logs.slice(-1000);
			}
		},

		/**
		 * Clears all logs
		 */
		clearLogs(): void {
			state.logs = [];
		},

		/**
		 * Sets estimated time remaining
		 */
		setEstimatedTimeRemaining(minutes: number | null): void {
			state.estimatedTimeRemaining = minutes;
		},

		/**
		 * Pauses execution
		 */
		pause(): void {
			state.isPaused = true;
		},

		/**
		 * Resumes execution
		 */
		resume(): void {
			state.isPaused = false;
		},

		/**
		 * Resets all progress
		 */
		reset(): void {
			state.progress = null;
			state.logs = [];
			state.activePhase = null;
			state.activeTask = null;
			state.isPaused = false;
			state.estimatedTimeRemaining = null;
		},

		/**
		 * Calculates progress percentage from phase and task counts
		 */
		calculateProgress(completedPhases: number, completedTasks: number, totalTasks: number): number {
			if (totalTasks === 0) return 0;
			return Math.round((completedTasks / totalTasks) * 100);
		}
	};
}

// Create singleton instance
export const progressStore = createProgressStore();
