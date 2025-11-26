/**
 * Estimation Engine
 *
 * Refines time estimates using historical data and learning
 */

import type { RefactoringTask, RefactoringPhase } from '../types/planning';
import type { TaskRecommendation } from '../types/learning';

/**
 * Estimation Engine
 *
 * Improves time estimates based on past refactoring outcomes
 */
export class EstimationEngine {
	/**
	 * Refines task estimates using learning data
	 *
	 * @param tasks - Tasks to estimate
	 * @param recommendations - Learning recommendations from NeuroForge
	 * @returns Tasks with refined estimates
	 */
	refineTaskEstimates(
		tasks: RefactoringTask[],
		recommendations: TaskRecommendation[] = []
	): RefactoringTask[] {
		return tasks.map((task) => {
			const recommendation = this.findMatchingRecommendation(task, recommendations);

			if (recommendation) {
				// Use learned estimate with confidence weighting
				const learnedEstimate = recommendation.suggestedEstimateHours;
				const currentEstimate = task.estimatedHours;
				const confidence = recommendation.confidence;

				// Blend learned and current estimates based on confidence
				const refinedEstimate = Math.round(
					learnedEstimate * confidence + currentEstimate * (1 - confidence)
				);

				return {
					...task,
					estimatedHours: refinedEstimate
				};
			}

			return task;
		});
	}

	/**
	 * Refines phase estimates
	 */
	refinePhaseEstimates(phases: RefactoringPhase[]): RefactoringPhase[] {
		return phases.map((phase) => {
			// Recalculate total from task estimates
			const totalEstimatedHours = phase.tasks.reduce(
				(sum, task) => sum + task.estimatedHours,
				0
			);

			return {
				...phase,
				estimatedHours: totalEstimatedHours
			};
		});
	}

	/**
	 * Finds a matching recommendation for a task
	 */
	private findMatchingRecommendation(
		task: RefactoringTask,
		recommendations: TaskRecommendation[]
	): TaskRecommendation | null {
		// Find recommendation with matching category and similar description
		for (const rec of recommendations) {
			if (rec.taskCategory === task.category) {
				// Check if titles are similar
				if (this.areSimilar(task.title, rec.taskPattern)) {
					return rec;
				}
			}
		}

		return null;
	}

	/**
	 * Checks if two strings are similar (simple similarity check)
	 */
	private areSimilar(a: string, b: string): boolean {
		const aNorm = a.toLowerCase().trim();
		const bNorm = b.toLowerCase().trim();

		// Exact match
		if (aNorm === bNorm) return true;

		// Contains match
		if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) return true;

		// Word overlap (simple heuristic)
		const aWords = new Set(aNorm.split(/\s+/));
		const bWords = new Set(bNorm.split(/\s+/));
		const overlap = [...aWords].filter((word) => bWords.has(word)).length;
		const minWords = Math.min(aWords.size, bWords.size);

		return overlap / minWords > 0.5; // 50% word overlap
	}

	/**
	 * Calculates total estimated hours for all tasks
	 */
	calculateTotalEstimate(tasks: RefactoringTask[]): number {
		return tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
	}

	/**
	 * Adds buffer to estimates based on project complexity
	 */
	addBuffer(estimate: number, complexity: 'low' | 'medium' | 'high'): number {
		const bufferMultipliers = {
			low: 1.1, // 10% buffer
			medium: 1.25, // 25% buffer
			high: 1.5 // 50% buffer
		};

		return Math.round(estimate * bufferMultipliers[complexity]);
	}
}
