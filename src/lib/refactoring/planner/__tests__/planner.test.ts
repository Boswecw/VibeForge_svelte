/**
 * Planner Tests
 *
 * Tests for all planner components
 */

import { describe, it, expect } from 'vitest';
import { TaskGenerator } from '../TaskGenerator';
import { PhaseGenerator } from '../PhaseGenerator';
import { EstimationEngine } from '../EstimationEngine';
import { PromptGenerator } from '../PromptGenerator';
import { RefactoringPlanner } from '../RefactoringPlanner';
import type { CodebaseAnalysis, CodebaseMetrics, DetectedIssue } from '../../types/analysis';
import type { RefactoringTask, TaskPriority } from '../../types/planning';
import type { QualityStandards } from '../../types/standards';
import { balancedStandards } from '../../standards/presets';

// Helper to create mock analysis
function createMockAnalysis(overrides?: Partial<CodebaseAnalysis>): CodebaseAnalysis {
	const mockMetrics: CodebaseMetrics = {
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
	};

	const mockIssues: DetectedIssue[] = [
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
	];

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
		metrics: mockMetrics,
		patterns: [],
		issues: mockIssues,
		summary: {
			health: 'fair',
			score: 65,
			highlights: [],
			concerns: ['Low test coverage']
		},
		...overrides
	};
}

describe('TaskGenerator', () => {
	it('should generate tasks from analysis', () => {
		const generator = new TaskGenerator();
		const analysis = createMockAnalysis();

		const tasks = generator.generate(analysis);

		expect(tasks.length).toBeGreaterThan(0);
		expect(tasks[0]).toHaveProperty('id');
		expect(tasks[0]).toHaveProperty('title');
		expect(tasks[0]).toHaveProperty('category');
		expect(tasks[0]).toHaveProperty('priority');
	});

	it('should generate task for low coverage', () => {
		const generator = new TaskGenerator();
		const analysis = createMockAnalysis();

		const tasks = generator.generate(analysis);

		const coverageTask = tasks.find((t) => t.title.includes('Coverage'));
		expect(coverageTask).toBeDefined();
		expect(coverageTask?.category).toBe('testing');
	});

	it('should generate task for missing strict mode', () => {
		const generator = new TaskGenerator();
		const analysis = createMockAnalysis();

		const tasks = generator.generate(analysis);

		const strictTask = tasks.find((t) => t.title.includes('Strict Mode'));
		expect(strictTask).toBeDefined();
		expect(strictTask?.category).toBe('type-safety');
	});
});

describe('PhaseGenerator', () => {
	it('should group tasks into phases', () => {
		const generator = new PhaseGenerator();
		const tasks: RefactoringTask[] = [
			{
				id: 'task-1',
				title: 'Fix Critical Bug',
				description: 'Fix it',
				category: 'testing',
				priority: 'critical',
				estimatedHours: 2,
				dependencies: [],
				affectedFiles: [],
				acceptanceCriteria: [],
				status: 'pending',
				createdAt: new Date().toISOString()
			},
			{
				id: 'task-2',
				title: 'Improve Docs',
				description: 'Better docs',
				category: 'code-quality',
				priority: 'low',
				estimatedHours: 1,
				dependencies: [],
				affectedFiles: [],
				acceptanceCriteria: [],
				status: 'pending',
				createdAt: new Date().toISOString()
			}
		];

		const phases = generator.generate(tasks);

		expect(phases.length).toBeGreaterThan(0);
		expect(phases[0]).toHaveProperty('number');
		expect(phases[0]).toHaveProperty('tasks');
		expect(phases[0].tasks.length).toBeGreaterThan(0);
	});

	it('should put critical tasks in first phase', () => {
		const generator = new PhaseGenerator();
		const tasks: RefactoringTask[] = [
			{
				id: 'task-1',
				title: 'Fix Critical Bug',
				description: 'Fix it',
				category: 'testing',
				priority: 'critical',
				estimatedHours: 2,
				dependencies: [],
				affectedFiles: [],
				acceptanceCriteria: [],
				status: 'pending',
				createdAt: new Date().toISOString()
			}
		];

		const phases = generator.generate(tasks);

		expect(phases[0].name).toContain('Critical');
		expect(phases[0].required).toBe(true);
	});
});

describe('EstimationEngine', () => {
	it('should refine task estimates', () => {
		const engine = new EstimationEngine();
		const tasks: RefactoringTask[] = [
			{
				id: 'task-1',
				title: 'Add Tests',
				description: 'Add tests',
				category: 'testing',
				priority: 'high',
				estimatedHours: 5,
				dependencies: [],
				affectedFiles: [],
				acceptanceCriteria: [],
				status: 'pending',
				createdAt: new Date().toISOString()
			}
		];

		const refined = engine.refineTaskEstimates(tasks, []);

		expect(refined.length).toBe(1);
		expect(refined[0].estimatedHours).toBeGreaterThan(0);
	});

	it('should calculate total estimate', () => {
		const engine = new EstimationEngine();
		const tasks: RefactoringTask[] = [
			{
				id: 'task-1',
				title: 'Task 1',
				description: '',
				category: 'testing',
				priority: 'high',
				estimatedHours: 3,
				dependencies: [],
				affectedFiles: [],
				acceptanceCriteria: [],
				status: 'pending',
				createdAt: new Date().toISOString()
			},
			{
				id: 'task-2',
				title: 'Task 2',
				description: '',
				category: 'testing',
				priority: 'high',
				estimatedHours: 2,
				dependencies: [],
				affectedFiles: [],
				acceptanceCriteria: [],
				status: 'pending',
				createdAt: new Date().toISOString()
			}
		];

		const total = engine.calculateTotalEstimate(tasks);

		expect(total).toBe(5);
	});

	it('should add buffer based on complexity', () => {
		const engine = new EstimationEngine();

		expect(engine.addBuffer(10, 'low')).toBe(11); // 10% buffer
		expect(engine.addBuffer(10, 'medium')).toBe(13); // 25% buffer (rounded)
		expect(engine.addBuffer(10, 'high')).toBe(15); // 50% buffer
	});
});

describe('PromptGenerator', () => {
	it('should generate task prompt', () => {
		const generator = new PromptGenerator();
		const task: RefactoringTask = {
			id: 'task-1',
			title: 'Increase Coverage',
			description: 'Add more tests',
			category: 'testing',
			priority: 'high',
			estimatedHours: 4,
			dependencies: [],
			affectedFiles: ['file1.ts'],
			acceptanceCriteria: ['Coverage >= 80%'],
			status: 'pending',
			createdAt: new Date().toISOString()
		};

		const prompt = generator.generateTaskPrompt(task, balancedStandards);

		expect(prompt.taskId).toBe(task.id);
		expect(prompt.title).toBe(task.title);
		expect(prompt.content).toContain('Increase Coverage');
		expect(prompt.content).toContain('Coverage >= 80%');
	});

	it('should generate plan summary prompt', () => {
		const generator = new PromptGenerator();
		const phases = [
			{
				id: 'phase-1',
				name: 'Phase 1',
				description: 'First phase',
				number: 1,
				tasks: [],
				estimatedHours: 5,
				status: 'pending' as const,
				required: true
			}
		];

		const prompt = generator.generatePlanSummaryPrompt(phases, balancedStandards);

		expect(prompt.title).toContain('Summary');
		expect(prompt.content).toContain('Phase 1');
	});
});

describe('RefactoringPlanner', () => {
	it('should create complete plan', async () => {
		const planner = new RefactoringPlanner();
		const analysis = createMockAnalysis();
		const config = {
			standards: balancedStandards,
			complexity: 'medium' as const
		};

		const plan = await planner.createPlan(analysis, config);

		expect(plan).toHaveProperty('id');
		expect(plan).toHaveProperty('phases');
		expect(plan).toHaveProperty('prompts');
		expect(plan.phases.length).toBeGreaterThan(0);
		expect(plan.prompts.length).toBeGreaterThan(0);
	});

	it('should validate plan', () => {
		const planner = new RefactoringPlanner();
		const validPlan = {
			id: 'plan-1',
			analysisId: 'analysis-1',
			standardsId: 'preset-balanced',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			name: 'Test Plan',
			description: 'Test plan for validation',
			goals: ['Test validation'],
			phases: [
				{
					id: 'phase-1',
					name: 'Phase 1',
					description: 'First phase',
					number: 1,
					tasks: [
						{
							id: 'task-1',
							title: 'Task 1',
							description: '',
							category: 'testing' as const,
							priority: 'high' as const,
							estimatedHours: 2,
							dependencies: [],
							affectedFiles: [],
							acceptanceCriteria: [],
							status: 'pending' as const,
							createdAt: new Date().toISOString()
						}
					],
					estimatedHours: 2,
					status: 'pending' as const,
					required: true
				}
			],
			estimate: {
				totalHours: 2,
				breakdown: { testing: 2 },
				confidence: 'medium' as const
			},
			totalEstimatedHours: 2,
			prompts: [
				{
					taskId: 'task-1',
					title: 'Task 1',
					content: 'content',
					generatedAt: new Date().toISOString()
				}
			],
			qualityGates: [],
			riskFactors: [],
			prerequisites: [],
			deliverables: [],
			status: 'draft' as const
		};

		const result = planner.validatePlan(validPlan as any);

		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});
});
