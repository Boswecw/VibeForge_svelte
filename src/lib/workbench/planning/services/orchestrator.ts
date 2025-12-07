/**
 * Planning Orchestrator for Cortex Multi-AI Planning
 * Coordinates the 4-stage ChatGPT ↔ Claude workflow
 */

import type {
	PlanningSession,
	PlanningStage,
	StageConfig,
	ProgressEvent,
	TwoFileDeliverable
} from '$lib/workbench/planning/types';
import { ModelRouter } from './modelRouter';

// ==============================================================================
// ORCHESTRATOR CLASS
// ==============================================================================

export class PlanningOrchestrator {
	private router: ModelRouter;
	private pausePromise: Promise<void> | null = null;
	private pauseResolve: (() => void) | null = null;
	private aborted = false;

	constructor(router?: ModelRouter) {
		this.router = router || new ModelRouter();
	}

	/**
	 * Run a planning session through all stages
	 */
	async runSession(
		session: PlanningSession,
		callbacks?: {
			onStageStart?: (stageIndex: number) => void;
			onStageProgress?: (stageIndex: number, token: string) => void;
			onStageComplete?: (stageIndex: number, stage: PlanningStage) => void;
			onSessionComplete?: (session: PlanningSession) => void;
			onError?: (error: Error) => void;
		}
	): Promise<PlanningSession> {
		this.aborted = false;
		session.startedAt = new Date();
		session.status = 'active';

		try {
			// Execute each stage sequentially
			for (let i = session.currentStageIndex; i < session.stages.length; i++) {
				// Check if aborted
				if (this.aborted) {
					session.status = 'cancelled';
					session.error = 'Session was cancelled by user';
					break;
				}

				// Check if paused
				if (this.pausePromise) {
					session.status = 'paused';
					session.pausedAt = new Date();
					await this.pausePromise;
					session.status = 'active';
					session.pausedAt = null;
				}

				const stage = session.stages[i];
				session.currentStageIndex = i;

				// Execute stage
				try {
					callbacks?.onStageStart?.(i);
					await this.executeStage(session, stage, callbacks);
					callbacks?.onStageComplete?.(i, stage);

					// Update session totals
					if (stage.result) {
						session.totalTokens += stage.result.tokensUsed.total;
						session.totalCost += stage.result.cost;
					}
				} catch (error) {
					stage.status = 'failed';
					stage.error = error instanceof Error ? error.message : 'Unknown error';
					session.status = 'failed';
					session.error = stage.error;
					callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)));
					throw error;
				}
			}

			// Parse deliverable if final stage completed
			if (
				session.currentStageIndex >= session.stages.length - 1 &&
				session.stages[session.stages.length - 1].status === 'completed'
			) {
				const finalStage = session.stages[session.stages.length - 1];
				session.deliverable = this.parseDeliverable(finalStage.output);
				session.status = 'completed';
				session.completedAt = new Date();
				callbacks?.onSessionComplete?.(session);
			}

			return session;
		} catch (error) {
			session.status = 'failed';
			session.error = error instanceof Error ? error.message : 'Unknown error';
			throw error;
		}
	}

	/**
	 * Execute a single stage
	 */
	private async executeStage(
		session: PlanningSession,
		stage: PlanningStage,
		callbacks?: {
			onStageProgress?: (stageIndex: number, token: string) => void;
		}
	): Promise<void> {
		stage.status = 'running';
		stage.startedAt = new Date();
		stage.streamingOutput = '';

		// Build input from previous stages and user injections
		stage.input = this.buildStageInput(session, stage);

		// Assemble context from previous stages
		stage.previousContext = this.assemblePreviousContext(session, stage.index);

		try {
			// Call the model
			const result = await this.router.call({
				model: stage.config.model,
				provider: stage.config.provider,
				prompt: stage.input,
				systemPrompt: stage.config.systemPrompt,
				maxTokens: stage.config.maxTokens,
				temperature: stage.config.temperature,
				onProgress: (token) => {
					stage.streamingOutput += token;
					callbacks?.onStageProgress?.(stage.index, token);
				}
			});

			// Store result
			stage.output = result.content;
			stage.result = result;
			stage.status = 'completed';
			stage.completedAt = new Date();
		} catch (error) {
			stage.status = 'failed';
			stage.error = error instanceof Error ? error.message : 'Unknown error';
			throw error;
		}
	}

	/**
	 * Build input prompt for a stage
	 */
	private buildStageInput(session: PlanningSession, stage: PlanningStage): string {
		const { type } = stage.config;
		const template = stage.config.promptTemplate;

		// Variable substitutions
		let input = template;

		// Replace {description} with user's description
		input = input.replace(/{description}/g, session.description);

		// Replace {title} with user's title
		input = input.replace(/{title}/g, session.title);

		// Replace previous stage outputs
		if (type === 'review' || type === 'refinement' || type === 'final') {
			const previousStages = session.stages.slice(0, stage.index);

			// Get initial output (stage 0)
			const initialStage = previousStages.find((s) => s.config.type === 'initial');
			if (initialStage) {
				input = input.replace(/{initialOutput}/g, initialStage.output);
				input = input.replace(/{previousOutput}/g, initialStage.output);
			}

			// Get review output
			const reviewStages = previousStages.filter((s) => s.config.type === 'review');
			if (reviewStages.length > 0) {
				const latestReview = reviewStages[reviewStages.length - 1];
				input = input.replace(/{reviewOutput}/g, latestReview.output);
			}

			// Get refinement output
			const refinementStages = previousStages.filter((s) => s.config.type === 'refinement');
			if (refinementStages.length > 0) {
				const latestRefinement = refinementStages[refinementStages.length - 1];
				input = input.replace(/{refinedOutput}/g, latestRefinement.output);
			}
		}

		// Add user injections if any
		if (stage.userInjections.length > 0) {
			input += '\n\n---USER CONTEXT---\n';
			input += stage.userInjections.join('\n\n');
		}

		return input;
	}

	/**
	 * Assemble context from previous stages
	 */
	private assemblePreviousContext(session: PlanningSession, currentIndex: number): string[] {
		const context: string[] = [];

		for (let i = 0; i < currentIndex; i++) {
			const stage = session.stages[i];
			if (stage.status === 'completed' && stage.output) {
				context.push(`[${stage.config.name}]:\n${stage.output}`);
			}
		}

		return context;
	}

	/**
	 * Parse two-file deliverable from final stage output
	 */
	private parseDeliverable(finalOutput: string): TwoFileDeliverable | null {
		try {
			// Extract implementation plan
			const planMatch = finalOutput.match(
				/---BEGIN IMPLEMENTATION PLAN---([\s\S]*?)---END IMPLEMENTATION PLAN---/
			);
			const implementationPlan = planMatch ? planMatch[1].trim() : '';

			// Extract Claude Code prompt
			const promptMatch = finalOutput.match(
				/---BEGIN CLAUDE CODE PROMPT---([\s\S]*?)---END CLAUDE CODE PROMPT---/
			);
			const claudeCodePrompt = promptMatch ? promptMatch[1].trim() : '';

			if (!implementationPlan || !claudeCodePrompt) {
				console.warn('Could not parse complete deliverable from final output');
				return null;
			}

			// Extract metadata
			const metadata = this.extractMetadata(implementationPlan);

			return {
				implementationPlan: {
					content: implementationPlan,
					filename: `${this.sanitizeFilename(metadata.title)}_plan.md`
				},
				claudeCodePrompt: {
					content: claudeCodePrompt,
					filename: `${this.sanitizeFilename(metadata.title)}_prompt.md`
				},
				metadata
			};
		} catch (error) {
			console.error('Failed to parse deliverable:', error);
			return null;
		}
	}

	/**
	 * Extract metadata from implementation plan
	 */
	private extractMetadata(plan: string): {
		title: string;
		estimatedTime: string;
		phases: string[];
		successCriteria: string[];
	} {
		// Extract title (first heading)
		const titleMatch = plan.match(/^#\s+(.+)$/m);
		const title = titleMatch ? titleMatch[1] : 'Untitled Plan';

		// Extract estimated time
		const timeMatch = plan.match(/(?:estimated|total)\s+time:?\s*([^\n]+?)(?:\n|$)/i);
		const estimatedTime = timeMatch ? timeMatch[1].trim() : 'Not specified';

		// Extract phases (look for numbered lists or headings with "Phase")
		const phases: string[] = [];
		const phaseMatches = plan.matchAll(/^#{2,3}\s+(?:Phase|Step)\s+\d+:?\s*(.+?)$/gmi);
		for (const match of phaseMatches) {
			phases.push(match[1].trim());
		}

		// Extract success criteria
		const successCriteria: string[] = [];
		const criteriaSection = plan.match(/success criteria:?\s*([\s\S]*?)(?:\n#{1,3}\s|$)/i);
		if (criteriaSection) {
			const criteriaMatches = criteriaSection[1].matchAll(/[✓✅-]\s*(.+?)(?:\n|$)/g);
			for (const match of criteriaMatches) {
				successCriteria.push(match[1].trim());
			}
		}

		return {
			title,
			estimatedTime,
			phases,
			successCriteria
		};
	}

	/**
	 * Sanitize filename
	 */
	private sanitizeFilename(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_+|_+$/g, '')
			.substring(0, 50);
	}

	/**
	 * Pause the session (will pause after current stage completes)
	 */
	pause() {
		if (!this.pausePromise) {
			this.pausePromise = new Promise<void>((resolve) => {
				this.pauseResolve = resolve;
			});
		}
	}

	/**
	 * Resume the session
	 */
	resume() {
		if (this.pauseResolve) {
			this.pauseResolve();
			this.pauseResolve = null;
			this.pausePromise = null;
		}
	}

	/**
	 * Abort the session
	 */
	abort() {
		this.aborted = true;
		this.router.abort();
		this.resume(); // Resume if paused to allow abort to complete
	}

	/**
	 * Inject user context at a specific stage
	 */
	injectContext(session: PlanningSession, stageIndex: number, content: string) {
		if (stageIndex >= 0 && stageIndex < session.stages.length) {
			session.stages[stageIndex].userInjections.push(content);
		}
	}

	/**
	 * Set API key for a provider
	 */
	setApiKey(provider: 'anthropic' | 'openai' | 'xai' | 'google', apiKey: string) {
		this.router.setApiKey(provider, apiKey);
	}
}

// ==============================================================================
// SINGLETON INSTANCE
// ==============================================================================

export const planningOrchestrator = new PlanningOrchestrator();
