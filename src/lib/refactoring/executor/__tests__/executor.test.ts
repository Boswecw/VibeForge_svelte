/**
 * Executor Tests
 *
 * Tests for all executor components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProgressTracker } from '../ProgressTracker';
import { OutcomeAnalyzer } from '../OutcomeAnalyzer';
import { LearningLoop } from '../LearningLoop';
import { TaskExecutor } from '../TaskExecutor';
import type {
	RefactoringProject,
	PhaseExecution,
	TaskExecution,
	ExecutionStatus
} from '../../types/execution';
import type { RefactoringPlan } from '../../types/planning';
import type { CodebaseAnalysis, CodebaseMetrics } from '../../types/analysis';

// Helper to create mock project
function createMockProject(): RefactoringProject {
	const mockPlan: RefactoringPlan = {
		id: 'plan-1',
		analysisId: 'analysis-1',
		standardsId: 'preset-balanced',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		name: 'Test Refactoring Plan',
		description: 'Mock plan for testing',
		goals: ['Improve code quality', 'Add tests'],
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
						description: 'First task',
						category: 'testing',
						priority: 'high',
						estimatedHours: 2,
						dependencies: [],
						affectedFiles: [],
						acceptanceCriteria: [],
						status: 'pending',
						createdAt: new Date().toISOString()
					},
					{
						id: 'task-2',
						title: 'Task 2',
						description: 'Second task',
						category: 'type-safety',
						priority: 'medium',
						estimatedHours: 3,
						dependencies: [],
						affectedFiles: [],
						acceptanceCriteria: [],
						status: 'pending',
						createdAt: new Date().toISOString()
					}
				],
				estimatedHours: 5,
				status: 'pending',
				required: true
			}
		],
		estimate: {
			totalHours: 5,
			breakdown: { testing: 2, type_safety: 3 },
			confidence: 'medium'
		},
		totalEstimatedHours: 5,
		prompts: [],
		qualityGates: [],
		riskFactors: [],
		prerequisites: [],
		deliverables: [],
		status: 'draft'
	};

	const mockPhaseExecution: PhaseExecution = {
		phase: 1,
		status: 'idle',
		tasks: [
			{
				taskId: 'task-1',
				status: 'idle',
				logs: []
			},
			{
				taskId: 'task-2',
				status: 'idle',
				logs: []
			}
		],
		checkpoint: {
			id: 'checkpoint-1',
			branch: 'main',
			commit: '',
			message: 'Phase 1 checkpoint',
			createdAt: new Date().toISOString(),
			phase: 1
		}
	};

	return {
		id: 'project-1',
		planId: 'plan-1',
		createdAt: new Date().toISOString(),
		status: 'preparing',
		progress: {
			currentPhase: 1,
			totalPhases: 1,
			totalTasks: 2,
			completedPhases: 0,
			completedTasks: 0,
			percentage: 0
		},
		plan: mockPlan,
		phases: [mockPhaseExecution],
		repository: {
			path: '/test/project',
			originalBranch: 'main',
			workingBranch: 'refactor-project-1',
			checkpoints: []
		},
		logs: []
	};
}

// Helper to create mock analysis
function createMockAnalysis(overrides?: Partial<CodebaseMetrics>): CodebaseAnalysis {
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
			},
			...overrides
		},
		patterns: [],
		issues: [],
		summary: {
			health: 'fair',
			score: 65,
			highlights: [],
			concerns: []
		}
	};
}

describe('ProgressTracker', () => {
	let tracker: ProgressTracker;

	beforeEach(() => {
		tracker = new ProgressTracker();
	});

	it('should calculate initial progress', () => {
		const project = createMockProject();
		const progress = tracker.calculateProgress(project);

		expect(progress.totalPhases).toBe(1);
		expect(progress.totalTasks).toBe(2);
		expect(progress.completedPhases).toBe(0);
		expect(progress.completedTasks).toBe(0);
		expect(progress.percentage).toBe(0);
	});

	it('should calculate progress with completed tasks', () => {
		const project = createMockProject();
		project.phases[0].tasks[0].status = 'completed';

		const progress = tracker.calculateProgress(project);

		expect(progress.completedTasks).toBe(1);
		expect(progress.percentage).toBe(50);
	});

	it('should calculate progress with completed phase', () => {
		const project = createMockProject();
		project.phases[0].status = 'completed';
		project.phases[0].tasks[0].status = 'completed';
		project.phases[0].tasks[1].status = 'completed';

		const progress = tracker.calculateProgress(project);

		expect(progress.completedPhases).toBe(1);
		expect(progress.completedTasks).toBe(2);
		expect(progress.percentage).toBe(100);
	});

	it('should get current phase', () => {
		const project = createMockProject();
		const progress = tracker.calculateProgress(project);

		expect(progress.currentPhase).toBe(1);
	});

	it('should estimate time remaining', () => {
		const project = createMockProject();
		project.startedAt = new Date(Date.now() - 60000).toISOString(); // Started 1 minute ago
		project.phases[0].tasks[0].status = 'completed';

		const progress = tracker.calculateProgress(project);

		expect(progress.estimatedTimeRemaining).toBeDefined();
		expect(progress.estimatedTimeRemaining).toBeGreaterThan(0);
	});

	it('should check if phase is complete', () => {
		const project = createMockProject();
		const phase = project.phases[0];

		expect(tracker.isPhaseComplete(phase)).toBe(false);

		phase.status = 'completed';
		phase.tasks[0].status = 'completed';
		phase.tasks[1].status = 'completed';

		expect(tracker.isPhaseComplete(phase)).toBe(true);
	});

	it('should get phase progress summary', () => {
		const project = createMockProject();
		const phase = project.phases[0];
		phase.tasks[0].status = 'completed';

		const summary = tracker.getPhaseProgress(phase);

		expect(summary.total).toBe(2);
		expect(summary.completed).toBe(1);
		expect(summary.percentage).toBe(50);
	});
});

describe('OutcomeAnalyzer', () => {
	let analyzer: OutcomeAnalyzer;

	beforeEach(() => {
		analyzer = new OutcomeAnalyzer();
	});

	it('should analyze successful outcome', async () => {
		const project = createMockProject();
		project.status = 'completed';
		project.startedAt = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
		project.completedAt = new Date().toISOString();
		project.phases[0].status = 'completed';
		project.phases[0].tasks[0].status = 'completed';
		project.phases[0].tasks[0].duration = 3600; // 1 hour
		project.phases[0].tasks[0].verification = {
			passed: true,
			results: ['Tests passing'],
			errors: []
		};
		project.phases[0].tasks[1].status = 'completed';
		project.phases[0].tasks[1].duration = 3600; // 1 hour
		project.phases[0].tasks[1].verification = {
			passed: true,
			results: ['Tests passing'],
			errors: []
		};
		project.phases[0].gateVerification = {
			gateId: 'gate-1',
			passed: true,
			checks: [],
			summary: 'Passed',
			verifiedAt: new Date().toISOString()
		};

		const initialAnalysis = createMockAnalysis();
		const finalAnalysis = createMockAnalysis({
			testCoverage: {
				lines: 85,
				statements: 85,
				branches: 85,
				functions: 85,
				uncoveredFiles: [],
				totalTests: 100,
				passingTests: 100,
				failingTests: 0
			}
		});

		const outcome = await analyzer.analyzeOutcome(project, finalAnalysis, initialAnalysis);

		expect(outcome.success).toBe(true);
		expect(outcome.totalTasks).toBe(2);
		expect(outcome.completedTasks).toBe(2);
		expect(outcome.coverageAfter).toBeGreaterThan(outcome.coverageBefore);
	});

	it('should generate estimation feedback', () => {
		const project = createMockProject();
		project.phases[0].tasks[0].status = 'completed';
		project.phases[0].tasks[0].startedAt = new Date(Date.now() - 7200000).toISOString(); // 2 hours ago
		project.phases[0].tasks[0].completedAt = new Date().toISOString();
		project.phases[0].tasks[0].duration = 7200; // 2 hours

		const feedback = analyzer.generateEstimationFeedback(project);

		expect(feedback.length).toBeGreaterThan(0);
		expect(feedback[0]).toHaveProperty('estimatedHours');
		expect(feedback[0]).toHaveProperty('actualHours');
		expect(feedback[0]).toHaveProperty('accuracy');
	});

	it('should rate excellent outcomes', async () => {
		const project = createMockProject();
		project.status = 'completed';
		project.phases[0].status = 'completed';
		project.phases[0].tasks[0].status = 'completed';
		project.phases[0].tasks[0].duration = 7200; // 2 hours (matches estimate)
		project.phases[0].tasks[0].verification = {
			passed: true,
			results: ['Tests passing'],
			errors: []
		};
		project.phases[0].tasks[1].status = 'completed';
		project.phases[0].tasks[1].duration = 10800; // 3 hours (matches estimate)
		project.phases[0].tasks[1].verification = {
			passed: true,
			results: ['Tests passing'],
			errors: []
		};
		project.phases[0].gateVerification = {
			gateId: 'gate-1',
			passed: true,
			checks: [],
			summary: 'Passed',
			verifiedAt: new Date().toISOString()
		};

		const initialAnalysis = createMockAnalysis({ testCoverage: { lines: 40 } as any });
		const finalAnalysis = createMockAnalysis({
			testCoverage: {
				lines: 85,
				statements: 85,
				branches: 85,
				functions: 85,
				uncoveredFiles: [],
				totalTests: 100,
				passingTests: 100,
				failingTests: 0
			}
		});
		finalAnalysis.summary.score = 90;

		const outcome = await analyzer.analyzeOutcome(project, finalAnalysis, initialAnalysis);

		expect(outcome.rating).toBe('excellent');
	});
});

describe('LearningLoop', () => {
	let learningLoop: LearningLoop;

	beforeEach(() => {
		learningLoop = new LearningLoop({ enabled: false }); // Disabled for tests
	});

	it('should create learning loop with config', () => {
		const config = learningLoop.getConfig();

		expect(config.baseUrl).toBeDefined();
		expect(config.enabled).toBe(false);
	});

	it('should skip recording when disabled', async () => {
		const outcome: any = {
			id: 'outcome-1',
			projectId: 'project-1',
			success: true
		};

		// Should not throw when disabled
		await learningLoop.recordOutcome(outcome);
	});

	it('should enable/disable learning', () => {
		learningLoop.setEnabled(true);
		expect(learningLoop.getConfig().enabled).toBe(true);

		learningLoop.setEnabled(false);
		expect(learningLoop.getConfig().enabled).toBe(false);
	});

	it('should convert recommendations to estimates', () => {
		const recommendations: any[] = [
			{
				task: {
					title: 'Add tests',
					category: 'testing',
					priority: 'high'
				},
				estimate: {
					hours: 4,
					confidence: 0.8
				}
			}
		];

		const estimates = learningLoop.convertRecommendationsToEstimates(recommendations);

		expect(estimates.length).toBe(1);
		expect(estimates[0].suggestedEstimateHours).toBe(4);
		expect(estimates[0].confidence).toBe(0.8);
	});
});

describe('TaskExecutor', () => {
	let executor: TaskExecutor;

	beforeEach(() => {
		executor = new TaskExecutor({
			repositoryPath: '/test/project',
			enableLearning: false,
			createCheckpoints: false
		});
	});

	it('should create project from plan', async () => {
		const plan: RefactoringPlan = {
			id: 'plan-1',
			analysisId: 'analysis-1',
			standardsId: 'preset-balanced',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			name: 'Test Plan',
			description: 'Test refactoring plan',
			goals: ['Test goals'],
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
							description: 'First task',
							category: 'testing',
							priority: 'high',
							estimatedHours: 2,
							dependencies: [],
							affectedFiles: [],
							acceptanceCriteria: [],
							status: 'pending',
							createdAt: new Date().toISOString()
						}
					],
					estimatedHours: 2,
					status: 'pending',
					required: true
				}
			],
			estimate: {
				totalHours: 2,
				breakdown: { testing: 2 },
				confidence: 'medium'
			},
			totalEstimatedHours: 2,
			prompts: [],
			qualityGates: [],
			riskFactors: [],
			prerequisites: [],
			deliverables: [],
			status: 'draft'
		};

		const analysis = createMockAnalysis();
		const project = await executor.createProject(plan, analysis);

		expect(project).toHaveProperty('id');
		expect(project.plan).toBe(plan);
		expect(project.phases.length).toBe(1);
		expect(project.status).toBe('preparing');
	});

	it('should start project', async () => {
		const project = createMockProject();
		const started = await executor.startProject(project);

		expect(started.status).toBe('running');
		expect(started.startedAt).toBeDefined();
	});

	it('should execute task', async () => {
		const project = createMockProject();
		await executor.startProject(project);

		const executed = await executor.executeTask(project, 1, 'task-1');

		const task = executed.phases[0].tasks.find((t) => t.taskId === 'task-1');
		expect(task?.status).toBe('completed');
		expect(task?.completedAt).toBeDefined();
	});

	it('should complete phase', async () => {
		const project = createMockProject();
		project.phases[0].tasks[0].status = 'completed';
		project.phases[0].tasks[1].status = 'completed';

		const completed = await executor.completePhase(project, 1);

		expect(completed.phases[0].status).toBe('completed');
		expect(completed.phases[0].completedAt).toBeDefined();
	});

	it('should complete project with outcome', async () => {
		const project = createMockProject();
		project.status = 'running';
		project.phases[0].status = 'completed';
		project.phases[0].tasks[0].status = 'completed';
		project.phases[0].tasks[1].status = 'completed';

		const initialAnalysis = createMockAnalysis();
		const finalAnalysis = createMockAnalysis({
			testCoverage: {
				lines: 85,
				statements: 85,
				branches: 85,
				functions: 85,
				uncoveredFiles: [],
				totalTests: 100,
				passingTests: 100,
				failingTests: 0
			}
		});

		const result = await executor.completeProject(project, finalAnalysis, initialAnalysis);

		expect(result.project.status).toBe('completed');
		expect(result.outcome).toBeDefined();
		expect(result.outcome.success).toBeDefined();
	});

	it('should handle task failure', async () => {
		const project = createMockProject();
		const error = new Error('Task execution failed');

		const failed = await executor.handleTaskFailure(project, 1, 'task-1', error);

		expect(failed.status).toBe('failed');
		expect(failed.error).toBeDefined();
		expect(failed.error?.message).toBe('Task execution failed');
	});

	it('should get executor config', () => {
		const config = executor.getConfig();

		expect(config.repositoryPath).toBe('/test/project');
		expect(config.enableLearning).toBe(false);
	});
});
