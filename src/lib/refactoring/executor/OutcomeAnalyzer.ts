/**
 * Outcome Analyzer
 *
 * Evaluates refactoring results and generates outcome reports
 */

import type { RefactoringProject } from '../types/execution';
import type { CodebaseAnalysis } from '../types/analysis';
import type {
	RefactoringOutcome,
	OutcomeRating,
	EstimationFeedback
} from '../types/learning';

/**
 * Outcome Analyzer
 *
 * Analyzes refactoring execution results and quality improvements
 */
export class OutcomeAnalyzer {
	/**
	 * Analyzes project outcome and generates report
	 */
	async analyzeOutcome(
		project: RefactoringProject,
		finalAnalysis: CodebaseAnalysis,
		initialAnalysis: CodebaseAnalysis
	): Promise<RefactoringOutcome> {
		const executionMetrics = this.calculateExecutionMetrics(project);
		const qualityImprovements = this.calculateQualityImprovements(initialAnalysis, finalAnalysis);
		const successMetrics = this.calculateSuccessMetrics(project);

		const rating = this.determineRating(executionMetrics, qualityImprovements, successMetrics);
		const success = this.determineSuccess(rating, successMetrics);

		const estimationFeedback = this.generateEstimationFeedback(project);

		return {
			id: `outcome-${Date.now()}`,
			projectId: project.id,
			recordedAt: new Date().toISOString(),

			// Context
			codebaseSize: initialAnalysis.metrics.size.totalLines,
			techStack: `${initialAnalysis.techStack.framework}-${initialAnalysis.techStack.language}`,
			initialQuality: initialAnalysis.summary.score,
			targetStandard: project.plan.standardsId,

			// Execution metrics
			totalTasks: executionMetrics.totalTasks,
			completedTasks: executionMetrics.completedTasks,
			failedTasks: executionMetrics.failedTasks,
			skippedTasks: executionMetrics.skippedTasks,

			plannedHours: project.plan.totalEstimatedHours,
			estimatedHours: project.plan.totalEstimatedHours, // Legacy alias
			actualHours: executionMetrics.actualHours,
			variance: executionMetrics.variance,

			// AI execution metrics
			executorType: executionMetrics.executorType,
			aiMetrics: executionMetrics.aiMetrics,

			// AI-specific time tracking (minutes)
			plannedMinutesAI: executionMetrics.plannedMinutesAI,
			actualMinutesAI: executionMetrics.actualMinutesAI,
			aiVariance: executionMetrics.aiVariance,

			// Quality improvements
			coverageBefore: initialAnalysis.metrics.testCoverage.lines,
			coverageAfter: finalAnalysis.metrics.testCoverage.lines,
			typeErrorsBefore: initialAnalysis.metrics.typeSafety.typeErrorCount,
			typeErrorsAfter: finalAnalysis.metrics.typeSafety.typeErrorCount,

			qualityScoreBefore: initialAnalysis.summary.score,
			qualityScoreAfter: finalAnalysis.summary.score,
			todosBefore: initialAnalysis.metrics.quality.todoCount,
			todosAfter: finalAnalysis.metrics.quality.todoCount,

			// Success metrics
			allTestsPassed: successMetrics.allTestsPassed,
			buildSucceeded: successMetrics.buildSucceeded,
			noRegressions: successMetrics.noRegressions,
			gatesPassed: successMetrics.gatesPassed,
			gatesFailed: successMetrics.gatesFailed,
			totalGates: successMetrics.gatesPassed + successMetrics.gatesFailed,

			// Overall outcome
			rating,
			success,

			// Learning feedback
			estimationFeedback
		};
	}

	/**
	 * Generates estimation feedback for learning
	 */
	generateEstimationFeedback(project: RefactoringProject): EstimationFeedback[] {
		const feedback: EstimationFeedback[] = [];

		for (const phase of project.phases) {
			for (const taskExecution of phase.tasks) {
				if (!taskExecution.startedAt || !taskExecution.completedAt) continue;

				// Find corresponding task in plan
				const planPhase = project.plan.phases.find((p) => p.number === phase.phase);
				const planTask = planPhase?.tasks.find((t) => t.id === taskExecution.taskId);

				if (!planTask) continue;

				const actualHours = taskExecution.duration ? taskExecution.duration / 3600 : 0;
				const estimatedHours = planTask.estimatedHours;
				const accuracy = this.calculateEstimationAccuracy(estimatedHours, actualHours);

				// Determine executor type from metrics
				const executorType = taskExecution.aiMetrics?.executorType || 'human';

				// Calculate AI metrics if available
				const actualMinutesAI = taskExecution.aiMetrics?.actualMinutes;
				const estimatedMinutesAI = planTask.estimatedMinutesAI;
				const aiAccuracy = actualMinutesAI && estimatedMinutesAI
					? this.calculateEstimationAccuracy(estimatedMinutesAI, actualMinutesAI)
					: undefined;

				feedback.push({
					id: `feedback-${taskExecution.taskId}`,
					taskCategory: planTask.category,
					taskDescription: planTask.title,

					estimatedHours,
					actualHours,
					accuracy,

					executorType,

					// AI-specific tracking (minutes)
					estimatedMinutesAI,
					actualMinutesAI,
					aiAccuracy,

					codebaseContext: {
						size: project.plan.phases.reduce((sum, p) => sum + p.tasks.length, 0),
						techStack: project.plan.standardsId,
						quality: 70 // Could be extracted from initial analysis
					},

					factors: this.identifyEstimationFactors(estimatedHours, actualHours, planTask.category)
				});
			}
		}

		return feedback;
	}

	/**
	 * Calculates execution metrics
	 */
	private calculateExecutionMetrics(project: RefactoringProject): {
		totalTasks: number;
		completedTasks: number;
		failedTasks: number;
		skippedTasks: number;
		actualHours: number;
		variance: number;
		executorType: 'human' | 'ai-claude-code' | 'ai-cursor' | 'ai-other';
		aiMetrics?: any;
		plannedMinutesAI?: number;
		actualMinutesAI?: number;
		aiVariance?: number;
	} {
		let totalTasks = 0;
		let completedTasks = 0;
		let failedTasks = 0;
		let skippedTasks = 0;
		let totalDurationSeconds = 0;
		let totalActualMinutesAI = 0;
		let hasAIMetrics = false;

		for (const phase of project.phases) {
			totalTasks += phase.tasks.length;

			for (const task of phase.tasks) {
				if (task.status === 'completed') {
					completedTasks++;
					if (task.duration) totalDurationSeconds += task.duration;
					if (task.aiMetrics?.actualMinutes) {
						totalActualMinutesAI += task.aiMetrics.actualMinutes;
						hasAIMetrics = true;
					}
				} else if (task.status === 'failed') {
					failedTasks++;
				} else {
					skippedTasks++;
				}
			}
		}

		const actualHours = totalDurationSeconds / 3600;
		const plannedHours = project.plan.totalEstimatedHours;
		const variance = plannedHours > 0 ? ((actualHours - plannedHours) / plannedHours) * 100 : 0;

		// Calculate planned AI minutes from all tasks
		const plannedMinutesAI = project.plan.phases.reduce(
			(sum, phase) => sum + phase.tasks.reduce((taskSum, task) => taskSum + task.estimatedMinutesAI, 0),
			0
		);

		// Determine executor type (check if any task has AI metrics)
		const executorType = hasAIMetrics ? 'ai-claude-code' : 'human';

		// Calculate AI variance if we have AI metrics
		const aiVariance = hasAIMetrics && plannedMinutesAI > 0
			? ((totalActualMinutesAI - plannedMinutesAI) / plannedMinutesAI) * 100
			: undefined;

		return {
			totalTasks,
			completedTasks,
			failedTasks,
			skippedTasks,
			actualHours,
			variance,
			executorType,
			aiMetrics: undefined, // Could aggregate individual task metrics here
			plannedMinutesAI: hasAIMetrics ? plannedMinutesAI : undefined,
			actualMinutesAI: hasAIMetrics ? totalActualMinutesAI : undefined,
			aiVariance
		};
	}

	/**
	 * Calculates quality improvements
	 */
	private calculateQualityImprovements(
		initial: CodebaseAnalysis,
		final: CodebaseAnalysis
	): {
		coverageImprovement: number;
		typeErrorsReduced: number;
		qualityScoreImprovement: number;
	} {
		const coverageImprovement =
			final.metrics.testCoverage.lines - initial.metrics.testCoverage.lines;

		const typeErrorsReduced =
			initial.metrics.typeSafety.typeErrorCount - final.metrics.typeSafety.typeErrorCount;

		const qualityScoreImprovement = final.summary.score - initial.summary.score;

		return {
			coverageImprovement,
			typeErrorsReduced,
			qualityScoreImprovement
		};
	}

	/**
	 * Calculates success metrics
	 */
	private calculateSuccessMetrics(project: RefactoringProject): {
		allTestsPassed: boolean;
		buildSucceeded: boolean;
		noRegressions: boolean;
		gatesPassed: number;
		gatesFailed: number;
	} {
		let gatesPassed = 0;
		let gatesFailed = 0;

		for (const phase of project.phases) {
			if (phase.gateVerification) {
				if (phase.gateVerification.passed) {
					gatesPassed++;
				} else {
					gatesFailed++;
				}
			}
		}

		// Check last phase for test/build results
		const lastPhase = project.phases[project.phases.length - 1];
		const lastTask = lastPhase?.tasks[lastPhase.tasks.length - 1];

		const allTestsPassed = lastTask?.verification?.passed ?? false;
		const buildSucceeded = lastTask?.verification ? lastTask.verification.errors.length === 0 : false;
		const noRegressions = gatesFailed === 0;

		return {
			allTestsPassed,
			buildSucceeded,
			noRegressions,
			gatesPassed,
			gatesFailed
		};
	}

	/**
	 * Determines overall outcome rating
	 */
	private determineRating(
		execution: ReturnType<typeof this.calculateExecutionMetrics>,
		quality: ReturnType<typeof this.calculateQualityImprovements>,
		success: ReturnType<typeof this.calculateSuccessMetrics>
	): OutcomeRating {
		// Failed if any tests failed or build failed
		if (!success.allTestsPassed || !success.buildSucceeded) {
			return 'failed';
		}

		// Excellent if all gates passed and quality improved significantly
		if (
			success.gatesFailed === 0 &&
			quality.coverageImprovement >= 20 &&
			quality.qualityScoreImprovement >= 20 &&
			Math.abs(execution.variance) < 20 // Within 20% of estimate
		) {
			return 'excellent';
		}

		// Good if most gates passed and quality improved
		if (
			success.gatesFailed <= 1 &&
			quality.coverageImprovement >= 10 &&
			quality.qualityScoreImprovement >= 10
		) {
			return 'good';
		}

		// Fair if some improvement
		if (quality.coverageImprovement > 0 || quality.qualityScoreImprovement > 0) {
			return 'fair';
		}

		return 'poor';
	}

	/**
	 * Determines if refactoring was successful
	 */
	private determineSuccess(rating: OutcomeRating, success: ReturnType<typeof this.calculateSuccessMetrics>): boolean {
		return (
			success.allTestsPassed &&
			success.buildSucceeded &&
			success.noRegressions &&
			rating !== 'failed' &&
			rating !== 'poor'
		);
	}

	/**
	 * Calculates estimation accuracy percentage
	 */
	private calculateEstimationAccuracy(estimated: number, actual: number): number {
		if (estimated === 0) return 0;

		const diff = Math.abs(estimated - actual);
		const accuracy = Math.max(0, 100 - (diff / estimated) * 100);

		return Math.round(accuracy);
	}

	/**
	 * Identifies factors that affected estimation accuracy
	 */
	private identifyEstimationFactors(
		estimated: number,
		actual: number,
		category: string
	): Array<{ factor: string; impact: 'positive' | 'negative'; magnitude: number }> {
		const factors: Array<{ factor: string; impact: 'positive' | 'negative'; magnitude: number }> =
			[];

		const variance = actual - estimated;
		const variancePercent = estimated > 0 ? (variance / estimated) * 100 : 0;

		if (Math.abs(variancePercent) < 10) {
			factors.push({
				factor: 'Accurate baseline estimate',
				impact: 'positive',
				magnitude: 0.9
			});
		}

		if (variance > estimated * 0.5) {
			// Took 50%+ longer
			factors.push({
				factor: 'Unexpected complexity',
				impact: 'negative',
				magnitude: Math.min(variance / estimated, 2.0)
			});
		}

		if (variance < -estimated * 0.3) {
			// Took 30%+ less time
			factors.push({
				factor: 'Task simpler than expected',
				impact: 'positive',
				magnitude: Math.abs(variance / estimated)
			});
		}

		if (category === 'testing' && variance > 0) {
			factors.push({
				factor: 'Test writing complexity',
				impact: 'negative',
				magnitude: 0.6
			});
		}

		if (category === 'type-safety' && variance > 0) {
			factors.push({
				factor: 'Type system complexity',
				impact: 'negative',
				magnitude: 0.7
			});
		}

		return factors;
	}
}
