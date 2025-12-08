/**
 * Planning Orchestrator for Cortex Multi-AI Planning
 * Coordinates the 4-stage ChatGPT ↔ Claude workflow
 */

import type {
	PlanningSession,
	PlanningStage,
	StageConfig,
	ProgressEvent,
	TwoFileDeliverable,
	PlanningSessionWithVersions,
	RefinementRequest,
	PlanVersion,
	MultiPathExecution,
	VariantType,
	VariantConfig
} from '$lib/workbench/planning/types';
import { createPlanVersion, DEFAULT_STAGE_CONFIGS } from '$lib/workbench/planning/types';
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

	// ==============================================================================
	// VF-321: ITERATIVE REFINEMENT METHODS
	// ==============================================================================

	/**
	 * Create a version snapshot of the current session state
	 * Called after deliverable completion to save a version
	 */
	private createVersionSnapshot(
		session: PlanningSessionWithVersions,
		refinementRequest: RefinementRequest | null
	): PlanVersion {
		const versionNumber = session.versionHistory.length + 1;
		const version = createPlanVersion(session, versionNumber, refinementRequest);
		session.versionHistory.push(version);
		session.currentVersion = versionNumber;
		return version;
	}

	/**
	 * Resume a completed session for refinement
	 * Prepares the session to accept new refinement stages
	 */
	resumeSession(session: PlanningSessionWithVersions): PlanningSessionWithVersions {
		// Validate session can be resumed
		if (session.status !== 'completed') {
			throw new Error('Cannot resume session: session is not completed');
		}

		if (!session.deliverable) {
			throw new Error('Cannot resume session: session has no deliverable');
		}

		// Create version snapshot of current state if not already versioned
		if (session.versionHistory.length === 0) {
			this.createVersionSnapshot(session, null); // v1 has no refinement request
		}

		// Reset session status for refinement
		session.status = 'active';
		session.completedAt = null;

		return session;
	}

	/**
	 * Refine an existing session by adding new requirements
	 * Adds refinement stages (refinement → review → final) with the new context
	 */
	async refineSession(
		session: PlanningSessionWithVersions,
		refinementRequest: RefinementRequest,
		callbacks?: {
			onStageStart?: (stageIndex: number) => void;
			onStageProgress?: (stageIndex: number, token: string) => void;
			onStageComplete?: (stageIndex: number, stage: PlanningStage) => void;
			onSessionComplete?: (session: PlanningSession) => void;
			onError?: (error: Error) => void;
		}
	): Promise<PlanningSessionWithVersions> {
		// Ensure session is ready for refinement
		if (session.status === 'completed' || session.versionHistory.length === 0) {
			this.resumeSession(session);
		}

		// Get current version number
		const currentVersionNumber = session.currentVersion;

		// Get the latest deliverable (from current version or session)
		const latestVersion = session.versionHistory[session.versionHistory.length - 1];
		const latestPlan = latestVersion?.deliverable?.implementationPlan?.content || '';

		// Create new refinement stages
		const refinementStageIndex = session.stages.length;

		// Stage 1: Refinement (ChatGPT) - Update plan with new requirements
		const refinementStage: PlanningStage = {
			id: `stage_${refinementStageIndex}`,
			index: refinementStageIndex,
			config: {
				type: 'refinement',
				name: `Refinement v${currentVersionNumber + 1}`,
				...DEFAULT_STAGE_CONFIGS.refinement,
				promptTemplate: this.buildRefinementPrompt(latestPlan, refinementRequest)
			},
			status: 'pending',
			input: '',
			output: '',
			streamingOutput: '',
			previousContext: [],
			userInjections: [],
			result: null,
			startedAt: null,
			completedAt: null,
			error: null
		};

		// Stage 2: Review (Claude) - Review the refined plan
		const reviewStage: PlanningStage = {
			id: `stage_${refinementStageIndex + 1}`,
			index: refinementStageIndex + 1,
			config: {
				type: 'review',
				name: `Review v${currentVersionNumber + 1}`,
				...DEFAULT_STAGE_CONFIGS.review,
				promptTemplate: `Review the following refined implementation plan and identify any gaps, concerns, or improvements needed:\n\n{refinedOutput}\n\nProvide your analysis.`
			},
			status: 'pending',
			input: '',
			output: '',
			streamingOutput: '',
			previousContext: [],
			userInjections: [],
			result: null,
			startedAt: null,
			completedAt: null,
			error: null
		};

		// Stage 3: Final (Claude) - Generate updated two-file deliverable
		const finalStage: PlanningStage = {
			id: `stage_${refinementStageIndex + 2}`,
			index: refinementStageIndex + 2,
			config: {
				type: 'final',
				name: `Final Deliverable v${currentVersionNumber + 1}`,
				...DEFAULT_STAGE_CONFIGS.final,
				promptTemplate: `Based on the refined plan and review feedback, generate the final two-file deliverable:\n\nRefined Plan:\n{refinedOutput}\n\nReview Feedback:\n{reviewOutput}\n\nGenerate:\n1. Implementation Plan (markdown)\n2. Claude Code Prompt\n\nFormat:\n---BEGIN IMPLEMENTATION PLAN---\n[content]\n---END IMPLEMENTATION PLAN---\n\n---BEGIN CLAUDE CODE PROMPT---\n[content]\n---END CLAUDE CODE PROMPT---`
			},
			status: 'pending',
			input: '',
			output: '',
			streamingOutput: '',
			previousContext: [],
			userInjections: [],
			result: null,
			startedAt: null,
			completedAt: null,
			error: null
		};

		// Add stages to session
		session.stages.push(refinementStage, reviewStage, finalStage);

		// Execute new stages
		try {
			await this.runSession(session, callbacks);

			// Create version snapshot after successful refinement
			if (session.status === 'completed' && session.deliverable) {
				this.createVersionSnapshot(session, refinementRequest);
			}

			return session;
		} catch (error) {
			// Remove failed stages to allow retry
			session.stages = session.stages.slice(0, refinementStageIndex);
			throw error;
		}
	}

	/**
	 * Build refinement prompt with new requirements
	 */
	private buildRefinementPrompt(currentPlan: string, refinementRequest: RefinementRequest): string {
		let prompt = `You are refining an existing implementation plan to incorporate new requirements.\n\n`;
		prompt += `Current Implementation Plan:\n${currentPlan}\n\n`;
		prompt += `New Requirements to Incorporate:\n`;

		refinementRequest.requirements.forEach((req, index) => {
			prompt += `${index + 1}. ${req}\n`;
		});

		if (refinementRequest.additionalContext) {
			prompt += `\nAdditional Context:\n${refinementRequest.additionalContext}\n`;
		}

		if (refinementRequest.focusSections && refinementRequest.focusSections.length > 0) {
			prompt += `\nFocus on updating these sections:\n`;
			refinementRequest.focusSections.forEach((section) => {
				prompt += `- ${section}\n`;
			});
		}

		prompt += `\nInstructions:\n`;
		prompt += `1. Review the current plan carefully\n`;
		prompt += `2. Identify where each new requirement fits\n`;
		prompt += `3. Update relevant sections to incorporate the requirements\n`;
		prompt += `4. Maintain the overall structure and quality\n`;
		prompt += `5. Add new sections if needed\n`;
		prompt += `6. Update time estimates and success criteria accordingly\n\n`;
		prompt += `Output the complete updated implementation plan.`;

		return prompt;
	}

	/**
	 * Run a versioned session (overload for PlanningSessionWithVersions)
	 * Creates version snapshot after completion
	 */
	async runVersionedSession(
		session: PlanningSessionWithVersions,
		callbacks?: {
			onStageStart?: (stageIndex: number) => void;
			onStageProgress?: (stageIndex: number, token: string) => void;
			onStageComplete?: (stageIndex: number, stage: PlanningStage) => void;
			onSessionComplete?: (session: PlanningSession) => void;
			onError?: (error: Error) => void;
		}
	): Promise<PlanningSessionWithVersions> {
		// Run the session
		await this.runSession(session, callbacks);

		// Create version snapshot if completed and no versions exist yet (initial run)
		if (session.status === 'completed' && session.deliverable && session.versionHistory.length === 0) {
			this.createVersionSnapshot(session, null); // v1 has no refinement request
		}

		return session;
	}

	// ==============================================================================
	// VF-322: MULTI-PATH PLANNING
	// ==============================================================================

	/**
	 * Run multi-path planning execution
	 * Executes multiple variants (optimistic, conservative, experimental) in parallel or sequential
	 */
	async runMultiPath(
		execution: MultiPathExecution,
		callbacks?: {
			onVariantStart?: (variant: VariantType) => void;
			onVariantProgress?: (variant: VariantType, stageIndex: number, token: string) => void;
			onVariantComplete?: (variant: VariantType, session: PlanningSession) => void;
			onExecutionComplete?: (execution: MultiPathExecution) => void;
			onBudgetExceeded?: (totalCost: number, maxCost: number) => void;
			onError?: (variant: VariantType, error: Error) => void;
		}
	): Promise<MultiPathExecution> {
		execution.status = 'running';
		execution.startedAt = new Date();

		try {
			if (execution.parallel) {
				// Run all variants in parallel
				await this.runVariantsParallel(execution, callbacks);
			} else {
				// Run variants sequentially
				await this.runVariantsSequential(execution, callbacks);
			}

			execution.status = 'completed';
			execution.completedAt = new Date();
			callbacks?.onExecutionComplete?.(execution);
		} catch (error) {
			execution.status = 'failed';
			execution.error = error instanceof Error ? error.message : 'Unknown error';
			throw error;
		}

		return execution;
	}

	/**
	 * Run variants in parallel
	 */
	private async runVariantsParallel(
		execution: MultiPathExecution,
		callbacks?: any
	): Promise<void> {
		const promises = Array.from(execution.sessions.entries()).map(([variant, session]) =>
			this.runVariant(execution, variant, session, callbacks)
		);

		await Promise.all(promises);
	}

	/**
	 * Run variants sequentially
	 */
	private async runVariantsSequential(
		execution: MultiPathExecution,
		callbacks?: any
	): Promise<void> {
		for (const [variant, session] of execution.sessions.entries()) {
			await this.runVariant(execution, variant, session, callbacks);

			// Check budget after each variant
			if (execution.maxCostUSD && execution.totalCost >= execution.maxCostUSD) {
				execution.status = 'budget_exceeded';
				callbacks?.onBudgetExceeded?.(execution.totalCost, execution.maxCostUSD);
				break;
			}
		}
	}

	/**
	 * Run a single variant
	 */
	private async runVariant(
		execution: MultiPathExecution,
		variant: VariantType,
		session: PlanningSession,
		callbacks?: any
	): Promise<void> {
		// Find variant config
		const variantConfig = execution.variants.find((v) => v.type === variant);
		if (!variantConfig) {
			throw new Error(`Variant config not found for ${variant}`);
		}

		callbacks?.onVariantStart?.(variant);

		try {
			// Apply variant-specific configuration to session stages
			this.applyVariantConfig(session, variantConfig);

			// Run the session
			await this.runSession(session, {
				onStageStart: (index) => {
					// Update session state
				},
				onStageProgress: (index, token) => {
					callbacks?.onVariantProgress?.(variant, index, token);
				},
				onStageComplete: (index, stage) => {
					// Update cost tracking
					if (stage.result) {
						execution.totalCost += stage.result.cost;
					}
				},
				onSessionComplete: (completedSession) => {
					// Update session in execution
					execution.sessions.set(variant, completedSession);
					callbacks?.onVariantComplete?.(variant, completedSession);
				},
				onError: (error) => {
					callbacks?.onError?.(variant, error);
				}
			});
		} catch (error) {
			callbacks?.onError?.(variant, error as Error);
			throw error;
		}
	}

	/**
	 * Apply variant-specific configuration to session stages
	 */
	private applyVariantConfig(session: PlanningSession, config: VariantConfig): void {
		// Override model and provider for all stages
		session.stages.forEach((stage) => {
			stage.config.model = config.model;
			stage.config.provider = config.provider;
			stage.config.temperature = config.temperature;
			stage.config.maxTokens = config.maxTokens;

			// Override system prompt if provided
			if (config.systemPromptOverride) {
				stage.config.systemPrompt = config.systemPromptOverride;
			}

			// Override prompt template if provided
			if (config.promptTemplateOverride) {
				stage.config.promptTemplate = config.promptTemplateOverride;
			}

			// Inject variant assumptions into the first stage
			if (stage.index === 0) {
				const assumptionsText = `\n\n**Planning Assumptions (${config.name}):**\n${config.assumptions.map((a) => `- ${a}`).join('\n')}`;
				stage.config.promptTemplate += assumptionsText;
			}
		});
	}
}

// ==============================================================================
// SINGLETON INSTANCE
// ==============================================================================

export const planningOrchestrator = new PlanningOrchestrator();
