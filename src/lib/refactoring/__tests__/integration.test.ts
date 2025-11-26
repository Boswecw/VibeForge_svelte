/**
 * Integration Tests
 *
 * Tests the complete refactoring automation workflow
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RefactoringAutomation } from '../RefactoringAutomation';
import { balancedStandards, strictStandards } from '../standards/presets';
import type { CodebaseAnalysis } from '../types/analysis';

// Mock analysis helper
function createMockAnalysis(): CodebaseAnalysis {
	return {
		id: 'analysis-1',
		path: '/test/project',
		analyzedAt: new Date().toISOString(),
		structure: {
			totalFiles: 100,
			totalDirectories: 10,
			totalSize: 50000,
			files: [],
			filesByType: {
				typescript: 50,
				javascript: 20,
				svelte: 15,
				css: 10,
				html: 3,
				json: 2,
				markdown: 0,
				other: 0
			},
			testFiles: 25,
			sourceFiles: 75
		},
		techStack: {
			framework: 'sveltekit',
			language: 'typescript',
			stateManagement: 'svelte-runes',
			dependencies: []
		},
		metrics: {
			testCoverage: {
				lines: 60,
				statements: 60,
				branches: 60,
				functions: 60,
				uncoveredFiles: ['file1.ts', 'file2.ts'],
				totalTests: 50,
				passingTests: 50,
				failingTests: 0
			},
			typeSafety: {
				totalFiles: 100,
				typedFiles: 90,
				jsFiles: 10,
				anyTypeCount: 5,
				typeErrorCount: 0,
				strictMode: false,
				noImplicitAny: false,
				typeCheckPassed: true
			},
			quality: {
				avgFileSize: 200,
				largestFile: { path: 'big.ts', lines: 600 },
				avgFunctionLength: 30,
				maxComplexity: 15,
				todoCount: 60,
				fixmeCount: 5,
				eslintErrors: 0,
				eslintWarnings: 10
			},
			size: {
				totalLines: 10000,
				codeLines: 7500,
				commentLines: 1500,
				blankLines: 1000
			}
		},
		patterns: [],
		issues: [
			{
				id: 'issue-1',
				category: 'testing',
				severity: 'error',
				title: 'Low Test Coverage',
				description: 'Coverage is below 80%',
				files: [],
				suggestion: 'Add more tests',
				autoFixable: false
			}
		],
		summary: {
			health: 'fair',
			score: 65,
			highlights: [],
			concerns: ['Low test coverage']
		}
	};
}

describe('RefactoringAutomation Integration', () => {
	let automation: RefactoringAutomation;

	beforeEach(() => {
		automation = new RefactoringAutomation({
			repositoryPath: '/test/project',
			enableLearning: false, // Disable for tests
			createCheckpoints: false // Disable for tests
		});
	});

	it('should complete full refactoring workflow', async () => {
		// Step 1: Analyze (mocked)
		const initialAnalysis = createMockAnalysis();

		// Step 2: Create plan
		const plan = await automation.createPlan(initialAnalysis, {
			standards: balancedStandards,
			complexity: 'medium'
		});

		expect(plan).toBeDefined();
		expect(plan.phases.length).toBeGreaterThan(0);
		expect(plan.totalEstimatedHours).toBeGreaterThan(0);
		expect(plan.prompts.length).toBeGreaterThan(0);

		// Validate plan
		const validation = automation.validatePlan(plan);
		expect(validation.valid).toBe(true);
		expect(validation.errors).toHaveLength(0);

		// Step 3: Execute
		const project = await automation.execute(plan, initialAnalysis);

		expect(project).toBeDefined();
		expect(project.status).toBe('running');
		expect(project.plan).toBe(plan);

		// Step 4: Monitor progress
		const initialProgress = automation.getProgress(project);
		expect(initialProgress.percentage).toBe(0);
		expect(initialProgress.completedTasks).toBe(0);

		// Execute first task
		const phase = project.phases[0];
		const task = phase.tasks[0];
		const updatedProject = await automation.executeTask(project, phase.phase, task.taskId);

		const midProgress = automation.getProgress(updatedProject);
		expect(midProgress.completedTasks).toBe(1);
		expect(midProgress.percentage).toBeGreaterThan(0);

		// Complete phase
		const completedPhaseProject = await automation.completePhase(
			updatedProject,
			phase.phase
		);

		expect(completedPhaseProject.phases[0].status).toBe('completed');

		// Step 5: Complete project
		const finalAnalysis = createMockAnalysis();
		finalAnalysis.metrics.testCoverage.lines = 85; // Improved coverage

		const { project: finalProject, outcome } = await automation.complete(
			completedPhaseProject,
			finalAnalysis,
			initialAnalysis
		);

		expect(finalProject.status).toBe('completed');
		expect(outcome).toBeDefined();
		expect(outcome.coverageAfter).toBeGreaterThan(outcome.coverageBefore);
		expect(outcome.totalTasks).toBe(plan.phases.reduce((sum, p) => sum + p.tasks.length, 0));
	});

	it('should use different quality standards', async () => {
		const analysis = createMockAnalysis();

		// Plan with balanced standards (80% coverage)
		const balancedPlan = await automation.createPlan(analysis, {
			standards: balancedStandards
		});

		// Plan with strict standards (100% coverage)
		const strictPlan = await automation.createPlan(analysis, {
			standards: strictStandards
		});

		// Strict should generate more tasks
		const balancedTaskCount = balancedPlan.phases.reduce((sum, p) => sum + p.tasks.length, 0);
		const strictTaskCount = strictPlan.phases.reduce((sum, p) => sum + p.tasks.length, 0);

		expect(strictTaskCount).toBeGreaterThanOrEqual(balancedTaskCount);
	});

	it('should handle task failure gracefully', async () => {
		const analysis = createMockAnalysis();
		const plan = await automation.createPlan(analysis);
		const project = await automation.execute(plan, analysis);

		const phase = project.phases[0];
		const task = phase.tasks[0];
		const error = new Error('Task execution failed');

		const failedProject = await automation.handleFailure(project, phase.phase, task.taskId, error);

		expect(failedProject.status).toBe('failed');
		expect(failedProject.error).toBeDefined();
		expect(failedProject.error?.message).toBe('Task execution failed');
		expect(failedProject.error?.phase).toBe(phase.phase);
		expect(failedProject.error?.task).toBe(task.taskId);
	});

	it('should provide access to component instances', () => {
		const analyzer = automation.getAnalyzer();
		const planner = automation.getPlanner();
		const executor = automation.getExecutor();
		const learningLoop = automation.getLearningLoop();

		expect(analyzer).toBeDefined();
		expect(planner).toBeDefined();
		expect(executor).toBeDefined();
		expect(learningLoop).toBeDefined();
	});

	it('should get current configuration', () => {
		const config = automation.getConfig();

		expect(config.repositoryPath).toBe('/test/project');
		expect(config.enableLearning).toBe(false);
		expect(config.createCheckpoints).toBe(false);
		expect(config.defaultStandards).toBe(balancedStandards);
	});

	it('should enable/disable learning', () => {
		const learningLoop = automation.getLearningLoop();

		automation.setLearningEnabled(true);
		expect(learningLoop.getConfig().enabled).toBe(true);

		automation.setLearningEnabled(false);
		expect(learningLoop.getConfig().enabled).toBe(false);
	});
});

describe('End-to-End Scenarios', () => {
	it('should handle legacy codebase refactoring', async () => {
		const automation = new RefactoringAutomation({
			repositoryPath: '/legacy/project',
			enableLearning: false
		});

		// Legacy codebase: low coverage, many TODOs, type errors
		const analysis = createMockAnalysis();
		analysis.metrics.testCoverage.lines = 30;
		analysis.metrics.quality.todoCount = 200;
		analysis.metrics.typeSafety.typeErrorCount = 15;

		// Start with legacy standards
		const { legacyStandards } = await import('../standards/presets');
		const plan = await automation.createPlan(analysis, {
			standards: legacyStandards,
			complexity: 'high' // Legacy code is complex
		});

		expect(plan.phases.length).toBeGreaterThan(0);
		expect(plan.totalEstimatedHours).toBeGreaterThan(0);

		// Should have tasks for coverage, TODOs, and type errors
		const allTasks = plan.phases.flatMap(p => p.tasks);
		expect(allTasks.some(t => t.category === 'testing')).toBe(true);
		expect(allTasks.some(t => t.category === 'type-safety')).toBe(true);
	});

	it('should handle startup project refactoring', async () => {
		const automation = new RefactoringAutomation({
			repositoryPath: '/startup/project',
			enableLearning: false
		});

		// Startup codebase: decent coverage, some TODOs
		const analysis = createMockAnalysis();
		analysis.metrics.testCoverage.lines = 55;
		analysis.metrics.quality.todoCount = 100;

		const { startupStandards } = await import('../standards/presets');
		const plan = await automation.createPlan(analysis, {
			standards: startupStandards,
			complexity: 'medium'
		});

		expect(plan.phases.length).toBeGreaterThan(0);

		// Should have fewer tasks than legacy (better starting point)
		const taskCount = plan.phases.reduce((sum, p) => sum + p.tasks.length, 0);
		expect(taskCount).toBeLessThan(10); // Reasonable task count
	});

	it('should handle high-quality codebase refinement', async () => {
		const automation = new RefactoringAutomation({
			repositoryPath: '/excellent/project',
			enableLearning: false
		});

		// High-quality codebase: good coverage, few TODOs
		const analysis = createMockAnalysis();
		analysis.metrics.testCoverage.lines = 92;
		analysis.metrics.quality.todoCount = 10;
		analysis.metrics.typeSafety.strictMode = true;

		const plan = await automation.createPlan(analysis, {
			standards: strictStandards,
			complexity: 'low' // High quality = lower complexity
		});

		expect(plan.phases.length).toBeGreaterThan(0);

		// Should have minimal tasks (just pushing to 100%)
		const taskCount = plan.phases.reduce((sum, p) => sum + p.tasks.length, 0);
		expect(taskCount).toBeLessThanOrEqual(5); // Very few remaining tasks
	});
});
