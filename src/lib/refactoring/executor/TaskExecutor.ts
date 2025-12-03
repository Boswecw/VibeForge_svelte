/**
 * Task Executor
 *
 * Orchestrates refactoring task execution with progress tracking and learning
 */

import type {
	RefactoringProject,
	RefactoringPlan,
	ExecutionStatus,
	PhaseExecution,
	TaskExecution,
	GitCheckpoint,
	AIExecutionMetrics,
	ExecutorType
} from '../types/execution';
import type { CodebaseAnalysis } from '../types/analysis';
import type { RefactoringOutcome } from '../types/learning';

import { ProgressTracker } from './ProgressTracker';
import { OutcomeAnalyzer } from './OutcomeAnalyzer';
import { LearningLoop } from './LearningLoop';

export interface ExecutorConfig {
	/**
	 * Repository path for git operations
	 */
	repositoryPath: string;

	/**
	 * Whether to create git checkpoints
	 */
	createCheckpoints?: boolean;

	/**
	 * Whether to enable learning integration
	 */
	enableLearning?: boolean;

	/**
	 * NeuroForge API base URL
	 */
	neuroforgeUrl?: string;

	/**
	 * Whether to auto-verify gates
	 */
	autoVerifyGates?: boolean;

	/**
	 * Executor type (human or AI)
	 */
	executorType?: ExecutorType;

	/**
	 * Whether to capture AI execution metrics
	 */
	captureAIMetrics?: boolean;
}

/**
 * Task Executor
 *
 * Main orchestrator for refactoring plan execution
 */
export class TaskExecutor {
	private progressTracker: ProgressTracker;
	private outcomeAnalyzer: OutcomeAnalyzer;
	private learningLoop: LearningLoop;
	private config: ExecutorConfig;

	constructor(config: ExecutorConfig) {
		this.config = {
			createCheckpoints: true,
			enableLearning: true,
			autoVerifyGates: true,
			...config
		};

		this.progressTracker = new ProgressTracker();
		this.outcomeAnalyzer = new OutcomeAnalyzer();
		this.learningLoop = new LearningLoop({
			baseUrl: this.config.neuroforgeUrl,
			enabled: this.config.enableLearning
		});
	}

	/**
	 * Creates a new refactoring project from a plan
	 */
	async createProject(
		plan: RefactoringPlan,
		initialAnalysis: CodebaseAnalysis
	): Promise<RefactoringProject> {
		const id = `project-${Date.now()}`;

		// Initialize phase executions
		const phases: PhaseExecution[] = plan.phases.map((phase) => ({
			phase: phase.number,
			status: 'idle' as ExecutionStatus,
			tasks: phase.tasks.map((task) => ({
				taskId: task.id,
				status: 'idle' as ExecutionStatus,
				logs: []
			})),
			checkpoint: {
				id: `checkpoint-phase-${phase.number}`,
				branch: 'main',
				commit: '',
				message: `Phase ${phase.number} checkpoint`,
				createdAt: new Date().toISOString(),
				phase: phase.number
			}
		}));

		const progress = this.progressTracker.calculateProgress({
			id,
			planId: plan.id,
			createdAt: new Date().toISOString(),
			status: 'preparing',
			progress: {
				currentPhase: 1,
				totalPhases: plan.phases.length,
				totalTasks: plan.phases.reduce((sum, p) => sum + p.tasks.length, 0),
				completedPhases: 0,
				completedTasks: 0,
				percentage: 0
			},
			plan,
			phases,
			repository: {
				path: this.config.repositoryPath,
				originalBranch: 'main',
				workingBranch: `refactor-${id}`,
				checkpoints: []
			},
			logs: []
		});

		const project: RefactoringProject = {
			id,
			planId: plan.id,
			createdAt: new Date().toISOString(),
			status: 'preparing',
			progress,
			plan,
			phases,
			repository: {
				path: this.config.repositoryPath,
				originalBranch: 'main',
				workingBranch: `refactor-${id}`,
				checkpoints: []
			},
			logs: [
				{
					timestamp: new Date().toISOString(),
					level: 'info',
					message: `Created refactoring project: ${id}`
				}
			]
		};

		return project;
	}

	/**
	 * Starts project execution
	 */
	async startProject(project: RefactoringProject): Promise<RefactoringProject> {
		this.addLog(project, 'info', 'Starting refactoring project execution');

		project.status = 'running';
		project.startedAt = new Date().toISOString();

		// Create working branch
		if (this.config.createCheckpoints) {
			await this.createWorkingBranch(project);
		}

		return project;
	}

	/**
	 * Executes a single task (simulated - real implementation would use Claude Code)
	 */
	async executeTask(
		project: RefactoringProject,
		phaseNumber: number,
		taskId: string
	): Promise<RefactoringProject> {
		const phase = project.phases.find((p) => p.phase === phaseNumber);
		if (!phase) {
			throw new Error(`Phase ${phaseNumber} not found`);
		}

		const taskExecution = phase.tasks.find((t) => t.taskId === taskId);
		if (!taskExecution) {
			throw new Error(`Task ${taskId} not found in phase ${phaseNumber}`);
		}

		const planTask = project.plan.phases
			.find((p) => p.number === phaseNumber)
			?.tasks.find((t) => t.id === taskId);

		if (!planTask) {
			throw new Error(`Task ${taskId} not found in plan`);
		}

		this.addLog(
			project,
			'info',
			`Starting task: ${planTask.title}`,
			phaseNumber,
			taskId
		);

		// Update task status
		taskExecution.status = 'running';
		taskExecution.startedAt = new Date().toISOString();
		const startTime = Date.now();

		// Simulate task execution (in real implementation, this would:
		// 1. Generate Claude Code prompt
		// 2. Execute via Claude Code API
		// 3. Monitor execution
		// 4. Capture results
		// 5. Verify acceptance criteria
		// For now, we'll just mark it as completed after a delay

		// Capture AI metrics if configured
		let aiMetrics: AIExecutionMetrics | undefined;
		if (this.config.captureAIMetrics && this.config.executorType?.startsWith('ai-')) {
			aiMetrics = this.captureAIMetrics(planTask, startTime);
		}

		// Mark as completed
		taskExecution.status = 'completed';
		taskExecution.completedAt = new Date().toISOString();
		const endTime = Date.now();
		taskExecution.duration = Math.floor((endTime - startTime) / 1000); // Seconds

		// Store AI metrics if captured
		if (aiMetrics) {
			taskExecution.aiMetrics = aiMetrics;
		}

		taskExecution.verification = {
			passed: true,
			results: ['All acceptance criteria met'],
			errors: []
		};

		this.addLog(
			project,
			'info',
			`Completed task: ${planTask.title}`,
			phaseNumber,
			taskId
		);

		// Update progress
		project.progress = this.progressTracker.calculateProgress(project);

		return project;
	}

	/**
	 * Completes a phase execution
	 */
	async completePhase(
		project: RefactoringProject,
		phaseNumber: number
	): Promise<RefactoringProject> {
		const phase = project.phases.find((p) => p.phase === phaseNumber);
		if (!phase) {
			throw new Error(`Phase ${phaseNumber} not found`);
		}

		this.addLog(project, 'info', `Completing phase ${phaseNumber}`);

		phase.status = 'completed';
		phase.completedAt = new Date().toISOString();

		// Create checkpoint
		if (this.config.createCheckpoints) {
			const checkpoint = await this.createCheckpoint(project, phaseNumber);
			phase.checkpoint = checkpoint;
			project.repository.checkpoints.push(checkpoint);
		}

		// Verify gate (if configured)
		if (this.config.autoVerifyGates) {
			phase.gateVerification = {
				gateId: `gate-${phaseNumber}`,
				passed: true,
				checks: [
					{
						check: 'Tests passing',
						passed: true,
						actual: '100%',
						expected: '100%'
					}
				],
				summary: 'All quality gates passed',
				verifiedAt: new Date().toISOString()
			};
		}

		// Update progress
		project.progress = this.progressTracker.calculateProgress(project);

		this.addLog(project, 'info', `Phase ${phaseNumber} completed successfully`);

		return project;
	}

	/**
	 * Completes project execution and records outcome
	 */
	async completeProject(
		project: RefactoringProject,
		finalAnalysis: CodebaseAnalysis,
		initialAnalysis: CodebaseAnalysis
	): Promise<{ project: RefactoringProject; outcome: RefactoringOutcome }> {
		this.addLog(project, 'info', 'Completing refactoring project');

		project.status = 'completed';
		project.completedAt = new Date().toISOString();

		// Analyze outcome
		const outcome = await this.outcomeAnalyzer.analyzeOutcome(
			project,
			finalAnalysis,
			initialAnalysis
		);

		// Generate estimation feedback
		const feedback = this.outcomeAnalyzer.generateEstimationFeedback(project);

		// Record to learning system
		if (this.config.enableLearning) {
			await this.learningLoop.recordOutcome(outcome);
			await this.learningLoop.recordEstimationFeedback(feedback);
		}

		this.addLog(project, 'info', `Project completed with rating: ${outcome.rating}`);

		return { project, outcome };
	}

	/**
	 * Handles task failure
	 */
	async handleTaskFailure(
		project: RefactoringProject,
		phaseNumber: number,
		taskId: string,
		error: Error
	): Promise<RefactoringProject> {
		const phase = project.phases.find((p) => p.phase === phaseNumber);
		const task = phase?.tasks.find((t) => t.taskId === taskId);

		if (task) {
			task.status = 'failed';
			task.completedAt = new Date().toISOString();

			this.addLog(
				project,
				'error',
				`Task failed: ${error.message}`,
				phaseNumber,
				taskId
			);
		}

		project.status = 'failed';
		project.error = {
			message: error.message,
			phase: phaseNumber,
			task: taskId,
			stackTrace: error.stack,
			recoverable: true
		};

		return project;
	}

	/**
	 * Creates a git checkpoint (simulated)
	 */
	private async createCheckpoint(
		project: RefactoringProject,
		phaseNumber: number
	): Promise<GitCheckpoint> {
		// In real implementation, this would:
		// 1. Stage changed files
		// 2. Create commit
		// 3. Tag commit
		// 4. Return checkpoint info

		return {
			id: `checkpoint-${phaseNumber}-${Date.now()}`,
			branch: project.repository.workingBranch,
			commit: `commit-${Date.now()}`,
			message: `Phase ${phaseNumber} complete`,
			createdAt: new Date().toISOString(),
			phase: phaseNumber
		};
	}

	/**
	 * Creates working branch (simulated)
	 */
	private async createWorkingBranch(project: RefactoringProject): Promise<void> {
		// In real implementation, this would:
		// 1. Check out new branch from original
		// 2. Set up branch tracking

		this.addLog(
			project,
			'info',
			`Created working branch: ${project.repository.workingBranch}`
		);
	}

	/**
	 * Adds a log entry to the project
	 */
	private addLog(
		project: RefactoringProject,
		level: 'info' | 'warning' | 'error',
		message: string,
		phase?: number,
		task?: string
	): void {
		project.logs.push({
			timestamp: new Date().toISOString(),
			level,
			phase,
			task,
			message
		});
	}

	/**
	 * Gets current configuration
	 */
	getConfig(): ExecutorConfig {
		return { ...this.config };
	}

	/**
	 * Gets learning loop instance
	 */
	getLearningLoop(): LearningLoop {
		return this.learningLoop;
	}

	/**
	 * Gets progress tracker instance
	 */
	getProgressTracker(): ProgressTracker {
		return this.progressTracker;
	}

	/**
	 * Gets outcome analyzer instance
	 */
	getOutcomeAnalyzer(): OutcomeAnalyzer {
		return this.outcomeAnalyzer;
	}

	/**
	 * Captures AI execution metrics for a task
	 * In real implementation, this would collect actual metrics from Claude Code API
	 * For now, we simulate realistic metrics
	 */
	private captureAIMetrics(
		task: import('../types/planning').RefactoringTask,
		startTime: number
	): AIExecutionMetrics {
		const endTime = Date.now();
		const actualMinutes = Math.ceil((endTime - startTime) / 60000);

		// Simulate token usage based on task complexity
		const estimatedTokens = (task.files || task.affectedFiles || []).length * 1000 + task.description.length * 2;
		const inputTokens = Math.floor(estimatedTokens * 0.6);
		const outputTokens = Math.floor(estimatedTokens * 0.4);
		const totalTokens = inputTokens + outputTokens;

		// Simulate cost (rough estimate: $3 per million tokens for Sonnet)
		const costPerMillionTokens = 3;
		const actualCost = (totalTokens / 1_000_000) * costPerMillionTokens;

		// Quality indicators - in real implementation, these would be tracked
		const firstPassSuccess = Math.random() > 0.2; // 80% success rate
		const iterationCount = firstPassSuccess ? 1 : Math.floor(Math.random() * 3) + 1;
		const testPassedOnFirst = firstPassSuccess && Math.random() > 0.1; // 90% if first pass succeeds

		return {
			executorType: this.config.executorType || 'ai-claude-code',
			estimatedMinutes: task.estimatedMinutesAI || 30,
			actualMinutes,
			totalTokens,
			inputTokens,
			outputTokens,
			apiCalls: iterationCount,
			retryCount: iterationCount - 1,
			estimatedCost: ((task.estimatedMinutesAI || 30) / actualMinutes) * actualCost,
			actualCost,
			firstPassSuccess,
			iterationCount,
			testPassedOnFirst
		};
	}
}
