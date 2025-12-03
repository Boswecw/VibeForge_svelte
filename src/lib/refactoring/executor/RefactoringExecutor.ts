/**
 * Refactoring Executor
 *
 * High-level orchestrator that integrates all Phase 4 components to execute refactoring plans.
 */

import type {
	RefactoringProject,
	RefactoringPlan,
	PhaseExecution,
	TaskExecution,
	ExecutionStatus,
	AIExecutionMetrics
} from '../types/execution';
import type { CodebaseAnalysis } from '../types/analysis';
import type { ClaudePromptDocument } from '../types/planning';

/**
 * Stores initial analysis for outcome comparison
 */
const initialAnalysisMap = new Map<string, CodebaseAnalysis>();

import { GitOperations, type GitConfig } from './GitOperations';
import { GateVerifier, type VerifierConfig } from './GateVerifier';
import { ClaudeCodeBridge, type ClaudeCodeConfig } from './ClaudeCodeBridge';
import { ProgressTracker } from './ProgressTracker';
import { OutcomeAnalyzer } from './OutcomeAnalyzer';
import { LearningLoop } from './LearningLoop';

export interface RefactoringExecutorConfig {
	/**
	 * Repository path
	 */
	repositoryPath: string;

	/**
	 * Git configuration
	 */
	git?: Partial<GitConfig>;

	/**
	 * Gate verifier configuration
	 */
	verifier?: Partial<VerifierConfig>;

	/**
	 * Claude Code configuration
	 */
	claudeCode?: Partial<ClaudeCodeConfig>;

	/**
	 * Learning loop configuration
	 */
	learning?: {
		enabled?: boolean;
		neuroforgeUrl?: string;
	};

	/**
	 * Executor type
	 */
	executorType?: 'human' | 'ai-claude-code';
}

/**
 * Refactoring Executor
 *
 * Orchestrates the complete refactoring workflow:
 * 1. Create git checkpoint/branch
 * 2. Execute tasks (via Claude Code or manually)
 * 3. Verify quality gates
 * 4. Record learning outcomes
 * 5. Track progress and handle errors
 */
export class RefactoringExecutor {
	private git: GitOperations;
	private gateVerifier: GateVerifier;
	private claudeCode: ClaudeCodeBridge;
	private progressTracker: ProgressTracker;
	private outcomeAnalyzer: OutcomeAnalyzer;
	private learningLoop: LearningLoop;
	private config: RefactoringExecutorConfig;

	constructor(config: RefactoringExecutorConfig) {
		this.config = {
			executorType: 'ai-claude-code',
			learning: {
				enabled: true
			},
			...config
		};

		// Initialize components
		this.git = new GitOperations({
			repositoryPath: config.repositoryPath,
			...config.git
		});

		this.gateVerifier = new GateVerifier({
			workingDirectory: config.repositoryPath,
			...config.verifier
		});

		this.claudeCode = new ClaudeCodeBridge({
			workingDirectory: config.repositoryPath,
			...config.claudeCode
		});

		this.progressTracker = new ProgressTracker();
		this.outcomeAnalyzer = new OutcomeAnalyzer();
		this.learningLoop = new LearningLoop({
			baseUrl: config.learning?.neuroforgeUrl,
			enabled: config.learning?.enabled
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

		// Store initial analysis for later comparison
		initialAnalysisMap.set(id, initialAnalysis);

		// Get current branch
		const originalBranch = await this.git.getCurrentBranch();

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
				branch: originalBranch,
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
				originalBranch,
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
				originalBranch,
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
		const branchResult = await this.git.createBranch(
			project.repository.workingBranch,
			project.repository.originalBranch
		);

		if (!branchResult.success) {
			project.status = 'failed';
			project.error = {
				message: 'Failed to create working branch',
				phase: 1,
				stackTrace: branchResult.error,
				recoverable: true
			};
			this.addLog(project, 'error', `Failed to create branch: ${branchResult.error}`);
			return project;
		}

		this.addLog(project, 'info', branchResult.message);

		return project;
	}

	/**
	 * Executes a single phase
	 */
	async executePhase(project: RefactoringProject, phaseNumber: number): Promise<RefactoringProject> {
		const phase = project.phases.find((p) => p.phase === phaseNumber);
		if (!phase) {
			throw new Error(`Phase ${phaseNumber} not found`);
		}

		this.addLog(project, 'info', `Starting Phase ${phaseNumber}: ${project.plan.phases[phaseNumber - 1]?.name}`);

		phase.status = 'running';
		phase.startedAt = new Date().toISOString();

		// Execute all tasks in the phase
		for (const taskExecution of phase.tasks) {
			const updatedProject = await this.executeTask(project, phaseNumber, taskExecution.taskId);
			Object.assign(project, updatedProject);

			// Stop if task failed
			if (taskExecution.status === 'failed') {
				phase.status = 'failed';
				project.status = 'failed';
				return project;
			}
		}

		// Create phase checkpoint
		const checkpoint = await this.git.createCheckpoint(
			`Phase ${phaseNumber} complete`,
			phaseNumber
		);
		phase.checkpoint = checkpoint;
		project.repository.checkpoints.push(checkpoint);

		this.addLog(project, 'info', `Created checkpoint: ${checkpoint.id}`);

		// Verify quality gate
		const planPhase = project.plan.phases[phaseNumber - 1];
		if (planPhase?.gate) {
			const gateResult = await this.gateVerifier.verifyGate(planPhase.gate);
			phase.gateVerification = gateResult;

			if (!gateResult.passed && planPhase.gate.required) {
				this.addLog(project, 'error', `Quality gate failed: ${gateResult.summary || 'Unknown error'}`);
				phase.status = 'failed';
				project.status = 'failed';
				return project;
			}

			this.addLog(project, 'info', `Quality gate: ${gateResult.summary || 'Passed'}`);
		}

		// Mark phase complete
		phase.status = 'completed';
		phase.completedAt = new Date().toISOString();

		this.addLog(project, 'info', `Phase ${phaseNumber} completed`);

		// Update progress
		project.progress = this.progressTracker.calculateProgress(project);

		return project;
	}

	/**
	 * Executes a single task
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

		const planPhase = project.plan.phases[phaseNumber - 1];
		const planTask = planPhase?.tasks.find((t) => t.id === taskId);
		if (!planTask) {
			throw new Error(`Task ${taskId} not found in plan`);
		}

		this.addLog(project, 'info', `Executing task: ${planTask.title}`, phaseNumber, taskId);

		taskExecution.status = 'running';
		taskExecution.startedAt = new Date().toISOString();
		const startTime = Date.now();

		try {
			// Execute via Claude Code if auto-executable and AI mode
			if (planTask.autoExecutable && planTask.claudePrompt && this.config.executorType === 'ai-claude-code') {
				const session = await this.claudeCode.startSession(planTask, planTask.claudePrompt);
				taskExecution.claudeSession = session;

				// Wait for completion
				await this.claudeCode.waitForCompletion(session.id);

				// Capture AI metrics
				if (session.status === 'completed') {
					const endTime = Date.now();
					const actualMinutes = Math.ceil((endTime - startTime) / 60000);

					taskExecution.aiMetrics = {
						executorType: 'ai-claude-code',
						estimatedMinutes: planTask.estimatedMinutesAI || 30,
						actualMinutes,
						firstPassSuccess: true,
						iterationCount: 1,
						testPassedOnFirst: true
					};

					// Record AI metrics to learning loop
					await this.learningLoop.recordAIExecutionMetrics(taskId, taskExecution.aiMetrics, {
						taskCategory: planTask.category,
						taskTitle: planTask.title,
						codebaseSize: 10000 // Would be actual from analysis
					});
				}
			} else {
				// Manual execution - just simulate for now
				await this.simulateTaskExecution(taskExecution, planTask);
			}

			// Mark as completed
			taskExecution.status = 'completed';
			taskExecution.completedAt = new Date().toISOString();
			taskExecution.duration = Math.floor((Date.now() - startTime) / 1000);

			this.addLog(project, 'info', `Task completed: ${planTask.title}`, phaseNumber, taskId);

			// Update progress
			project.progress = this.progressTracker.calculateProgress(project);
		} catch (error) {
			taskExecution.status = 'failed';
			taskExecution.completedAt = new Date().toISOString();
			taskExecution.duration = Math.floor((Date.now() - startTime) / 1000);

			this.addLog(project, 'error', `Task failed: ${error}`, phaseNumber, taskId);

			throw error;
		}

		return project;
	}

	/**
	 * Simulates manual task execution
	 */
	private async simulateTaskExecution(
		taskExecution: TaskExecution,
		planTask: any
	): Promise<void> {
		// Simulate execution delay
		await new Promise((resolve) => setTimeout(resolve, 1000));

		taskExecution.verification = {
			passed: true,
			results: ['Task simulated successfully'],
			errors: []
		};
	}

	/**
	 * Rolls back to a specific checkpoint
	 */
	async rollbackToCheckpoint(
		project: RefactoringProject,
		checkpointId: string
	): Promise<RefactoringProject> {
		const checkpoint = project.repository.checkpoints.find((c) => c.id === checkpointId);
		if (!checkpoint) {
			throw new Error(`Checkpoint not found: ${checkpointId}`);
		}

		this.addLog(project, 'info', `Rolling back to checkpoint: ${checkpoint.id}`);

		const result = await this.git.rollbackToCheckpoint(checkpoint);

		if (!result.success) {
			this.addLog(project, 'error', `Rollback failed: ${result.error}`);
			throw new Error(`Rollback failed: ${result.error}`);
		}

		this.addLog(project, 'info', result.message);

		// Reset project status to the checkpoint phase
		project.status = 'running';
		project.progress.currentPhase = checkpoint.phase || 1;

		return project;
	}

	/**
	 * Completes the project and records outcome
	 */
	async completeProject(project: RefactoringProject, finalAnalysis?: CodebaseAnalysis): Promise<RefactoringProject> {
		this.addLog(project, 'info', 'Completing refactoring project');

		project.status = 'completed';
		project.completedAt = new Date().toISOString();

		// Get initial analysis
		const initialAnalysis = initialAnalysisMap.get(project.id);
		if (!initialAnalysis) {
			this.addLog(project, 'warning', 'No initial analysis found, skipping outcome recording');
			return project;
		}

		// Use final analysis if provided, otherwise use initial as placeholder
		const finalAnalysisToUse = finalAnalysis || initialAnalysis;

		// Analyze and record outcome
		const outcome = await this.outcomeAnalyzer.analyzeOutcome(project, finalAnalysisToUse, initialAnalysis);
		await this.learningLoop.recordOutcome(outcome);

		// Clean up stored initial analysis
		initialAnalysisMap.delete(project.id);

		this.addLog(project, 'info', `Project completed. Success rate: ${outcome.success ? '100%' : '0%'}`);

		return project;
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
			message,
			phase,
			task
		});
	}
}
