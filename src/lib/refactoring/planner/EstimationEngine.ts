/**
 * Estimation Engine
 *
 * Refines time estimates using historical data and learning
 */

import type { RefactoringTask, RefactoringPhase, TaskCategory } from '../types/planning';
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

				// Also update AI estimate based on refined human estimate
				const refinedAIEstimate = this.convertHoursToAIMinutes(refinedEstimate, task.category);

				return {
					...task,
					estimatedHours: refinedEstimate,
					estimatedMinutesAI: refinedAIEstimate,
					aiEstimateConfidence: confidence
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

	/**
	 * AI Estimation Methods
	 * Convert human hours to AI minutes based on task category speed multipliers
	 */

	/**
	 * Converts human hours to AI minutes based on task category
	 * AI speed multipliers: testing=8x, type-safety=12x, code-quality=10x, architecture=6x, documentation=15x
	 */
	convertHoursToAIMinutes(hours: number, category: TaskCategory): number {
		const speedMultipliers: Record<TaskCategory, number> = {
			'testing': 8,
			'type-safety': 12,
			'code-quality': 10,
			'architecture': 6,
			'documentation': 15
		};

		const multiplier = speedMultipliers[category];
		return Math.ceil((hours * 60) / multiplier);
	}

	/**
	 * Converts AI minutes back to human hours (for comparison/reporting)
	 */
	convertAIMinutesToHours(minutes: number, category: TaskCategory): number {
		const speedMultipliers: Record<TaskCategory, number> = {
			'testing': 8,
			'type-safety': 12,
			'code-quality': 10,
			'architecture': 6,
			'documentation': 15
		};

		const multiplier = speedMultipliers[category];
		return (minutes * multiplier) / 60;
	}

	/**
	 * Refines AI estimates using learning data
	 * Similar to refineTaskEstimates but for AI-specific timing
	 */
	refineAIEstimates(
		tasks: RefactoringTask[],
		recommendations: TaskRecommendation[] = []
	): RefactoringTask[] {
		return tasks.map((task) => {
			const recommendation = this.findMatchingRecommendation(task, recommendations);

			if (recommendation && recommendation.estimate) {
				// Convert learned human estimate to AI minutes
				const learnedAIMinutes = this.convertHoursToAIMinutes(
					recommendation.estimate.hours,
					task.category
				);
				const currentAIEstimate = task.estimatedMinutesAI;
				const confidence = recommendation.confidence;

				// Blend learned and current AI estimates based on confidence
				const refinedAIEstimate = Math.ceil(
					learnedAIMinutes * confidence + currentAIEstimate * (1 - confidence)
				);

				return {
					...task,
					estimatedMinutesAI: refinedAIEstimate,
					aiEstimateConfidence: confidence
				};
			}

			return task;
		});
	}

	/**
	 * Calculates total estimated AI minutes for all tasks
	 */
	calculateTotalAIEstimate(tasks: RefactoringTask[]): number {
		return tasks.reduce((sum, task) => sum + (task.estimatedMinutesAI || 0), 0);
	}
}
