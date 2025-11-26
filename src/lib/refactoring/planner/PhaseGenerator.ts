/**
 * Phase Generator
 *
 * Groups refactoring tasks into logical phases based on dependencies and categories
 */

import type { RefactoringTask, RefactoringPhase } from '../types/planning';

/**
 * Phase Generator
 *
 * Organizes tasks into phases with proper dependency ordering
 */
export class PhaseGenerator {
	/**
	 * Generates phases from tasks
	 */
	generate(tasks: RefactoringTask[]): RefactoringPhase[] {
		// Sort tasks by priority and dependencies
		const sortedTasks = this.sortTasksByDependencies(tasks);

		// Group into phases
		const phases: RefactoringPhase[] = [];

		// Phase 1: Critical fixes (must be done first)
		const criticalTasks = sortedTasks.filter((t) => t.priority === 'critical');
		if (criticalTasks.length > 0) {
			phases.push(this.createPhase(1, 'Critical Fixes', criticalTasks, true));
		}

		// Phase 2: High priority tasks
		const highPriorityTasks = sortedTasks.filter((t) => t.priority === 'high');
		if (highPriorityTasks.length > 0) {
			const phaseNumber = phases.length + 1;
			phases.push(this.createPhase(phaseNumber, 'High Priority', highPriorityTasks, true));
		}

		// Phase 3: Medium priority tasks
		const mediumPriorityTasks = sortedTasks.filter((t) => t.priority === 'medium');
		if (mediumPriorityTasks.length > 0) {
			const phaseNumber = phases.length + 1;
			phases.push(this.createPhase(phaseNumber, 'Medium Priority', mediumPriorityTasks, false));
		}

		// Phase 4: Low priority tasks
		const lowPriorityTasks = sortedTasks.filter((t) => t.priority === 'low');
		if (lowPriorityTasks.length > 0) {
			const phaseNumber = phases.length + 1;
			phases.push(this.createPhase(phaseNumber, 'Low Priority', lowPriorityTasks, false));
		}

		return phases;
	}

	/**
	 * Creates a phase from tasks
	 */
	private createPhase(
		number: number,
		name: string,
		tasks: RefactoringTask[],
		required: boolean
	): RefactoringPhase {
		const totalEstimatedHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);

		return {
			id: `phase-${number}`,
			name,
			description: this.generatePhaseDescription(tasks),
			number,
			tasks,
			estimatedHours: totalEstimatedHours,
			status: 'pending',
			required
		};
	}

	/**
	 * Generates a description for a phase based on its tasks
	 */
	private generatePhaseDescription(tasks: RefactoringTask[]): string {
		const categories = new Set(tasks.map((t) => t.category));
		const categoryList = Array.from(categories).join(', ');

		return `Address ${tasks.length} task${tasks.length > 1 ? 's' : ''} in: ${categoryList}`;
	}

	/**
	 * Sorts tasks by dependencies (tasks with no dependencies first)
	 */
	private sortTasksByDependencies(tasks: RefactoringTask[]): RefactoringTask[] {
		const sorted: RefactoringTask[] = [];
		const remaining = [...tasks];
		const completed = new Set<string>();

		// Keep sorting until all tasks are placed
		while (remaining.length > 0) {
			// Find tasks with no unmet dependencies
			const ready = remaining.filter((task) =>
				task.dependencies.every((dep) => completed.has(dep))
			);

			if (ready.length === 0) {
				// No tasks are ready - circular dependency or invalid dep
				// Just add remaining tasks
				sorted.push(...remaining);
				break;
			}

			// Sort ready tasks by priority
			ready.sort((a, b) => this.comparePriority(a.priority, b.priority));

			// Add to sorted list
			sorted.push(...ready);

			// Mark as completed
			ready.forEach((task) => completed.add(task.id));

			// Remove from remaining
			ready.forEach((task) => {
				const index = remaining.indexOf(task);
				if (index > -1) {
					remaining.splice(index, 1);
				}
			});
		}

		return sorted;
	}

	/**
	 * Compares task priorities (for sorting)
	 * Returns negative if a has higher priority than b
	 */
	private comparePriority(a: RefactoringTask['priority'], b: RefactoringTask['priority']): number {
		const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
		return priorityOrder[a] - priorityOrder[b];
	}
}
