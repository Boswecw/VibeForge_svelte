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
		const createdAt = new Date().toISOString();
		const totalTasks = tasks.length;
		const qualityGates = phases.map((p) => p.gate);

		const plan: RefactoringPlan = {
			id: this.generatePlanId(),
			analysisId: analysis.id,
			standardsId: config.standards.id,
			createdAt,
			updatedAt: createdAt,

			name: `Refactoring Plan for ${analysis.techStack.framework} Project`,
			description: `Comprehensive refactoring plan to improve code quality from ${analysis.summary.health} to ${config.standards.preset} standards`,
			goals: this.generateGoals(analysis, config.standards),

			phases,
			estimate: this.createCostEstimate(bufferedTotalHours),
			totalEstimatedHours: bufferedTotalHours,
			prompts,
			qualityGates,

			riskFactors: this.identifyRiskFactors(analysis, totalTasks),
			prerequisites: ['Git repository with clean working tree', 'All tests passing before starting'],
			deliverables: ['Refactored codebase', 'Updated tests', 'Quality metrics report'],

			status: 'draft'
		};

		// Fix circular reference: update prompts to reference the plan
		for (const prompt of prompts) {
			prompt.plan = plan;
		}

		return plan;
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

	/**
	 * Generates goals for the refactoring plan
	 */
	private generateGoals(analysis: CodebaseAnalysis, standards: QualityStandards): string[] {
		const goals: string[] = [];

		// Test coverage goal
		if (analysis.metrics.testCoverage.lines < standards.testing.minimumCoverage) {
			goals.push(`Achieve ${standards.testing.minimumCoverage}% test coverage`);
		}

		// Type safety goal
		if (analysis.metrics.typeSafety.typeErrorCount > 0) {
			goals.push('Eliminate all TypeScript compilation errors');
		}

		if (!analysis.metrics.typeSafety.strictMode && standards.typeSafety.requireStrictMode) {
			goals.push('Enable TypeScript strict mode');
		}

		// Code quality goal
		if (analysis.metrics.quality.todoCount > standards.codeQuality.maxTodoCount) {
			goals.push(`Reduce TODO comments to under ${standards.codeQuality.maxTodoCount}`);
		}

		// General quality improvement
		goals.push(`Improve overall code health from ${analysis.summary.health} to ${standards.preset} standards`);

		return goals;
	}

	/**
	 * Creates a cost estimate breakdown
	 */
	private createCostEstimate(totalHours: number): import('../types/planning').CostEstimate {
		const developmentHours = totalHours * 0.6; // 60% development
		const testingHours = totalHours * 0.25; // 25% testing
		const reviewHours = totalHours * 0.15; // 15% review

		return {
			developmentHours,
			testingHours,
			reviewHours,
			totalHours,
			weekEstimate: Math.ceil(totalHours / 40),
			assumptions: [
				'40-hour work week',
				'Experienced developer familiar with codebase',
				'No major blockers or external dependencies',
				'Automated tools available for refactoring'
			]
		};
	}

	/**
	 * Identifies risk factors based on analysis
	 */
	private identifyRiskFactors(
		analysis: CodebaseAnalysis,
		totalTasks: number
	): { factor: string; impact: 'high' | 'medium' | 'low'; mitigation: string }[] {
		const risks: { factor: string; impact: 'high' | 'medium' | 'low'; mitigation: string }[] = [];

		// Large number of tasks
		if (totalTasks > 50) {
			risks.push({
				factor: 'Large number of refactoring tasks',
				impact: 'high',
				mitigation: 'Break into smaller phases with quality gates between each'
			});
		}

		// Failing tests
		if (analysis.metrics.testCoverage.failingTests > 0) {
			risks.push({
				factor: 'Existing test failures',
				impact: 'high',
				mitigation: 'Fix all failing tests before starting refactoring'
			});
		}

		// Low test coverage
		if (analysis.metrics.testCoverage.lines < 50) {
			risks.push({
				factor: 'Low test coverage',
				impact: 'high',
				mitigation: 'Add tests incrementally during refactoring to catch regressions'
			});
		}

		// Type errors
		if (analysis.metrics.typeSafety.typeErrorCount > 10) {
			risks.push({
				factor: 'Many TypeScript errors',
				impact: 'medium',
				mitigation: 'Address type errors in early phases before other refactoring'
			});
		}

		return risks;
	}
}
