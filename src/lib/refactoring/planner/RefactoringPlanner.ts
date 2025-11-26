/**
 * Refactoring Planner
 *
 * Orchestrates the planning process: generates tasks, organizes phases, estimates time, and creates prompts
 */

import { TaskGenerator } from './TaskGenerator';
import { PhaseGenerator } from './PhaseGenerator';
import { EstimationEngine } from './EstimationEngine';
import { PromptGenerator } from './PromptGenerator';
import type { CodebaseAnalysis } from '../types/analysis';
import type { QualityStandards } from '../types/standards';
import type { RefactoringPlan, ClaudePromptDocument } from '../types/planning';
import type { TaskRecommendation } from '../types/learning';

/**
 * Configuration for refactoring planner
 */
export interface PlannerConfig {
	/**
	 * Quality standards to apply
	 */
	standards: QualityStandards;

	/**
	 * Learning recommendations from NeuroForge (optional)
	 */
	recommendations?: TaskRecommendation[];

	/**
	 * Project complexity for buffer calculation
	 */
	complexity?: 'low' | 'medium' | 'high';
}

/**
 * Refactoring Planner
 *
 * Main entry point for planning refactoring work
 */
export class RefactoringPlanner {
	private taskGenerator: TaskGenerator;
	private phaseGenerator: PhaseGenerator;
	private estimationEngine: EstimationEngine;
	private promptGenerator: PromptGenerator;

	constructor() {
		this.taskGenerator = new TaskGenerator();
		this.phaseGenerator = new PhaseGenerator();
		this.estimationEngine = new EstimationEngine();
		this.promptGenerator = new PromptGenerator();
	}

	/**
	 * Creates a complete refactoring plan from codebase analysis
	 */
	async createPlan(analysis: CodebaseAnalysis, config: PlannerConfig): Promise<RefactoringPlan> {
		// Step 1: Generate tasks from analysis
		let tasks = this.taskGenerator.generate(analysis);

		// Step 2: Refine estimates using learning data
		if (config.recommendations && config.recommendations.length > 0) {
			tasks = this.estimationEngine.refineTaskEstimates(tasks, config.recommendations);
		}

		// Step 3: Generate phases
		let phases = this.phaseGenerator.generate(tasks);

		// Step 4: Refine phase estimates
		phases = this.estimationEngine.refinePhaseEstimates(phases);

		// Step 5: Add buffer if specified
		const rawTotalHours = this.estimationEngine.calculateTotalEstimate(tasks);
		const bufferedTotalHours = config.complexity
			? this.estimationEngine.addBuffer(rawTotalHours, config.complexity)
			: rawTotalHours;

		// Step 6: Generate prompts
		const prompts: ClaudePromptDocument[] = [];

		// Add summary prompt
		prompts.push(this.promptGenerator.generatePlanSummaryPrompt(phases, config.standards));

		// Add phase prompts
		for (const phase of phases) {
			const phasePrompts = this.promptGenerator.generatePhasePrompts(phase, config.standards);
			prompts.push(...phasePrompts);
		}

		// Step 7: Create plan
		return {
			id: this.generatePlanId(),
			analysisId: analysis.id,
			standardsId: config.standards.id,
			createdAt: new Date().toISOString(),
			phases,
			totalEstimatedHours: bufferedTotalHours,
			prompts,
			status: 'draft'
		};
	}

	/**
	 * Generates a unique plan ID
	 */
	private generatePlanId(): string {
		return `plan-${Date.now()}-${Math.random().toString(36).substring(7)}`;
	}

	/**
	 * Validates a refactoring plan
	 */
	validatePlan(plan: RefactoringPlan): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		// Check has phases
		if (plan.phases.length === 0) {
			errors.push('Plan must have at least one phase');
		}

		// Check has tasks
		const totalTasks = plan.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
		if (totalTasks === 0) {
			errors.push('Plan must have at least one task');
		}

		// Check has prompts
		if (plan.prompts.length === 0) {
			errors.push('Plan must have prompts generated');
		}

		// Check estimates are positive
		if (plan.totalEstimatedHours <= 0) {
			errors.push('Total estimated hours must be positive');
		}

		// Check phase numbers are sequential
		const phaseNumbers = plan.phases.map((p) => p.number);
		const expectedNumbers = Array.from({ length: phaseNumbers.length }, (_, i) => i + 1);
		if (JSON.stringify(phaseNumbers) !== JSON.stringify(expectedNumbers)) {
			errors.push('Phase numbers must be sequential starting from 1');
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}
}
