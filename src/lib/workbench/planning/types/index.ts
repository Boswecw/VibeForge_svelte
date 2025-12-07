/**
 * Planning Types for Cortex Multi-AI Planning Orchestrator
 * Complete type system for 4-stage planning workflow
 */

// ==============================================================================
// ENUMS
// ==============================================================================

/**
 * Stage types in the 4-stage workflow
 */
export type StageType = 'initial' | 'review' | 'refinement' | 'final';

/**
 * Stage execution status
 */
export type StageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/**
 * LLM providers
 */
export type Provider = 'anthropic' | 'openai' | 'xai' | 'google';

/**
 * Request types for planning
 */
export type RequestType = 'feature' | 'refactor' | 'bugfix' | 'analysis' | 'architecture';

/**
 * Planning session status
 */
export type SessionStatus = 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';

/**
 * Pipeline types
 */
export type PipelineType = 'default' | 'quick' | 'deep';

// ==============================================================================
// MODEL CALL TYPES
// ==============================================================================

/**
 * Options for calling an LLM
 */
export interface ModelCallOptions {
	/** Model identifier (e.g., 'claude-3-5-sonnet-20241022') */
	model: string;
	/** Provider */
	provider: Provider;
	/** User prompt */
	prompt: string;
	/** System prompt (optional) */
	systemPrompt?: string;
	/** Max tokens to generate */
	maxTokens?: number;
	/** Temperature (0-1) */
	temperature?: number;
	/** Streaming progress callback */
	onProgress?: (token: string) => void;
	/** Abort signal */
	signal?: AbortSignal;
}

/**
 * Result from an LLM call
 */
export interface ModelCallResult {
	/** Generated content */
	content: string;
	/** Tokens used (prompt + completion) */
	tokensUsed: {
		prompt: number;
		completion: number;
		total: number;
	};
	/** Cost in USD */
	cost: number;
	/** Model used */
	model: string;
	/** Provider */
	provider: Provider;
	/** Duration in milliseconds */
	durationMs: number;
	/** Finish reason */
	finishReason?: 'stop' | 'length' | 'content_filter' | 'error';
}

// ==============================================================================
// STAGE CONFIGURATION
// ==============================================================================

/**
 * Configuration for a single stage
 */
export interface StageConfig {
	/** Stage type */
	type: StageType;
	/** Stage name */
	name: string;
	/** Provider to use */
	provider: Provider;
	/** Model to use */
	model: string;
	/** System prompt template */
	systemPrompt: string;
	/** User prompt template */
	promptTemplate: string;
	/** Max tokens */
	maxTokens: number;
	/** Temperature */
	temperature: number;
	/** Whether this stage can be skipped */
	skippable: boolean;
}

// ==============================================================================
// PLANNING STAGE
// ==============================================================================

/**
 * A single stage in the planning workflow
 */
export interface PlanningStage {
	/** Unique stage ID */
	id: string;
	/** Stage index (0-based) */
	index: number;
	/** Stage configuration */
	config: StageConfig;
	/** Current status */
	status: StageStatus;
	/** Input prompt */
	input: string;
	/** Generated output */
	output: string;
	/** Streaming output (during execution) */
	streamingOutput?: string;
	/** Model call result */
	result: ModelCallResult | null;
	/** Error message if failed */
	error: string | null;
	/** Start timestamp */
	startedAt: Date | null;
	/** Completion timestamp */
	completedAt: Date | null;
	/** Context from previous stages */
	previousContext: string[];
	/** User injections for this stage */
	userInjections: string[];
}

// ==============================================================================
// PIPELINE CONFIGURATION
// ==============================================================================

/**
 * Pipeline configuration (pre-defined workflows)
 */
export interface PipelineConfig {
	/** Pipeline name */
	name: string;
	/** Pipeline type */
	type: PipelineType;
	/** Description */
	description: string;
	/** Stage configurations */
	stages: StageConfig[];
	/** Estimated duration (minutes) */
	estimatedDuration: number;
	/** Maximum iterations for refinement */
	maxIterations: number;
}

// ==============================================================================
// TWO-FILE DELIVERABLE
// ==============================================================================

/**
 * The two-file deliverable output
 */
export interface TwoFileDeliverable {
	/** Implementation plan */
	implementationPlan: {
		content: string;
		filename: string;
	};
	/** Claude Code execution prompt */
	claudeCodePrompt: {
		content: string;
		filename: string;
	};
	/** Extracted metadata */
	metadata: {
		title: string;
		estimatedTime: string;
		phases: string[];
		successCriteria: string[];
	};
}

// ==============================================================================
// PLANNING SESSION
// ==============================================================================

/**
 * A complete planning session
 */
export interface PlanningSession {
	/** Unique session ID */
	id: string;
	/** User's request title */
	title: string;
	/** User's request description */
	description: string;
	/** Request type */
	requestType: RequestType;
	/** Pipeline used */
	pipeline: PipelineConfig;
	/** Current session status */
	status: SessionStatus;
	/** All stages in this session */
	stages: PlanningStage[];
	/** Current stage index */
	currentStageIndex: number;
	/** Final deliverable (when completed) */
	deliverable: TwoFileDeliverable | null;
	/** Total tokens used */
	totalTokens: number;
	/** Total cost in USD */
	totalCost: number;
	/** Session created timestamp */
	createdAt: Date;
	/** Session started timestamp */
	startedAt: Date | null;
	/** Session paused timestamp */
	pausedAt: Date | null;
	/** Session completed timestamp */
	completedAt: Date | null;
	/** Error message if failed */
	error: string | null;
	/** User who created the session */
	userId: string;
	/** Workspace ID */
	workspaceId: string;
}

// ==============================================================================
// CONTEXT INJECTION
// ==============================================================================

/**
 * User context injection
 */
export interface ContextInjection {
	/** Stage index to inject at */
	stageIndex: number;
	/** Context content */
	content: string;
	/** Injection timestamp */
	injectedAt: Date;
}

// ==============================================================================
// PROGRESS EVENT
// ==============================================================================

/**
 * Progress event for streaming
 */
export interface ProgressEvent {
	type: 'token' | 'stage_start' | 'stage_complete' | 'session_complete' | 'error';
	sessionId: string;
	stageIndex?: number;
	data?: any;
	timestamp: Date;
}

// ==============================================================================
// DEFAULT CONFIGURATIONS
// ==============================================================================

/**
 * Default stage configurations
 */
export const DEFAULT_STAGE_CONFIGS: Record<StageType, Omit<StageConfig, 'type' | 'name'>> = {
	initial: {
		provider: 'openai',
		model: 'gpt-4-turbo-2024-04-09',
		systemPrompt: 'You are an expert software architect helping plan implementation details.',
		promptTemplate:
			'Create an initial implementation plan for:\n\n{description}\n\nInclude:\n1. Overview\n2. Architecture\n3. Components\n4. Data Models\n5. Implementation Phases\n6. Testing Strategy\n7. Potential Challenges',
		maxTokens: 4000,
		temperature: 0.7,
		skippable: false
	},
	review: {
		provider: 'anthropic',
		model: 'claude-3-5-sonnet-20241022',
		systemPrompt:
			'You are a technical reviewer providing constructive feedback on implementation plans.',
		promptTemplate:
			'Review this implementation plan and provide:\n\n✅ Strengths\n⚠️ Concerns\n💡 Improvements\n❓ Questions\n\nPlan:\n{previousOutput}',
		maxTokens: 3000,
		temperature: 0.6,
		skippable: false
	},
	refinement: {
		provider: 'openai',
		model: 'gpt-4-turbo-2024-04-09',
		systemPrompt: 'You are refining an implementation plan based on review feedback.',
		promptTemplate:
			'Address the review feedback and create an improved plan.\n\nOriginal Plan:\n{initialOutput}\n\nReview Feedback:\n{reviewOutput}\n\nProvide a complete, standalone improved plan.',
		maxTokens: 4500,
		temperature: 0.7,
		skippable: true
	},
	final: {
		provider: 'anthropic',
		model: 'claude-3-5-sonnet-20241022',
		systemPrompt:
			'You are creating the final two-file deliverable for autonomous execution by Claude Code.',
		promptTemplate:
			'Create the final two-file deliverable:\n\n---BEGIN IMPLEMENTATION PLAN---\n[Complete architecture, code examples, tests, success criteria]\n---END IMPLEMENTATION PLAN---\n\n---BEGIN CLAUDE CODE PROMPT---\n[Phase-by-phase autonomous execution instructions]\n---END CLAUDE CODE PROMPT---\n\nRefined Plan:\n{refinedOutput}',
		maxTokens: 8000,
		temperature: 0.5,
		skippable: false
	}
};

/**
 * Default pipeline: 4-stage ChatGPT ↔ Claude workflow
 */
export const DEFAULT_PLANNING_CONFIG: PipelineConfig = {
	name: 'Default (4-Stage)',
	type: 'default',
	description: 'ChatGPT → Claude → ChatGPT → Claude for balanced planning',
	stages: [
		{ type: 'initial', name: 'Initial Plan', ...DEFAULT_STAGE_CONFIGS.initial },
		{ type: 'review', name: 'Review', ...DEFAULT_STAGE_CONFIGS.review },
		{ type: 'refinement', name: 'Refinement', ...DEFAULT_STAGE_CONFIGS.refinement },
		{ type: 'final', name: 'Final Deliverable', ...DEFAULT_STAGE_CONFIGS.final }
	],
	estimatedDuration: 5, // minutes
	maxIterations: 2 // Allow 2 cycles through refinement
};

/**
 * Quick pipeline: 2-stage for faster planning
 */
export const QUICK_PLANNING_CONFIG: PipelineConfig = {
	name: 'Quick (2-Stage)',
	type: 'quick',
	description: 'ChatGPT → Claude for rapid planning',
	stages: [
		{ type: 'initial', name: 'Initial Plan', ...DEFAULT_STAGE_CONFIGS.initial },
		{ type: 'final', name: 'Final Deliverable', ...DEFAULT_STAGE_CONFIGS.final }
	],
	estimatedDuration: 3,
	maxIterations: 1
};

/**
 * Deep pipeline: 6-stage for comprehensive planning
 */
export const DEEP_PLANNING_CONFIG: PipelineConfig = {
	name: 'Deep (6-Stage)',
	type: 'deep',
	description: 'Extended workflow with multiple review cycles',
	stages: [
		{ type: 'initial', name: 'Initial Plan', ...DEFAULT_STAGE_CONFIGS.initial },
		{ type: 'review', name: 'Review 1', ...DEFAULT_STAGE_CONFIGS.review },
		{ type: 'refinement', name: 'Refinement 1', ...DEFAULT_STAGE_CONFIGS.refinement },
		{ type: 'review', name: 'Review 2', ...DEFAULT_STAGE_CONFIGS.review },
		{ type: 'refinement', name: 'Refinement 2', ...DEFAULT_STAGE_CONFIGS.refinement },
		{ type: 'final', name: 'Final Deliverable', ...DEFAULT_STAGE_CONFIGS.final }
	],
	estimatedDuration: 10,
	maxIterations: 3
};

/**
 * All available pipelines
 */
export const PIPELINES: Record<PipelineType, PipelineConfig> = {
	default: DEFAULT_PLANNING_CONFIG,
	quick: QUICK_PLANNING_CONFIG,
	deep: DEEP_PLANNING_CONFIG
};

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

/**
 * Get pipeline by type
 */
export function getPipeline(type: PipelineType): PipelineConfig {
	return PIPELINES[type];
}

/**
 * List all available pipelines
 */
export function listPipelines(): PipelineConfig[] {
	return Object.values(PIPELINES);
}

/**
 * Estimate cost for a pipeline
 */
export function estimatePipelineCost(pipeline: PipelineConfig): number {
	// Rough estimates based on average token usage
	const costPerStage: Record<Provider, number> = {
		anthropic: 0.15, // ~$0.15 per stage (Claude 3.5 Sonnet)
		openai: 0.12, // ~$0.12 per stage (GPT-4 Turbo)
		xai: 0.10, // ~$0.10 per stage (Grok)
		google: 0.08 // ~$0.08 per stage (Gemini)
	};

	return pipeline.stages.reduce((total, stage) => {
		return total + costPerStage[stage.provider];
	}, 0);
}

/**
 * Create a new planning session
 */
export function createPlanningSession(
	title: string,
	description: string,
	requestType: RequestType,
	pipelineType: PipelineType = 'default',
	userId: string = 'anonymous',
	workspaceId: string = 'default'
): PlanningSession {
	const pipeline = getPipeline(pipelineType);
	const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

	const stages: PlanningStage[] = pipeline.stages.map((config, index) => ({
		id: `${sessionId}_stage_${index}`,
		index,
		config,
		status: index === 0 ? 'pending' : 'pending',
		input: '',
		output: '',
		streamingOutput: undefined,
		result: null,
		error: null,
		startedAt: null,
		completedAt: null,
		previousContext: [],
		userInjections: []
	}));

	return {
		id: sessionId,
		title,
		description,
		requestType,
		pipeline,
		status: 'active',
		stages,
		currentStageIndex: 0,
		deliverable: null,
		totalTokens: 0,
		totalCost: 0,
		createdAt: new Date(),
		startedAt: null,
		pausedAt: null,
		completedAt: null,
		error: null,
		userId,
		workspaceId
	};
}

/**
 * Get current stage from session
 */
export function getCurrentStage(session: PlanningSession): PlanningStage | null {
	if (session.currentStageIndex >= session.stages.length) {
		return null;
	}
	return session.stages[session.currentStageIndex];
}

/**
 * Check if session is complete
 */
export function isSessionComplete(session: PlanningSession): boolean {
	return session.status === 'completed' || session.currentStageIndex >= session.stages.length;
}

/**
 * Get session progress percentage
 */
export function getSessionProgress(session: PlanningSession): number {
	if (session.stages.length === 0) return 0;
	const completedStages = session.stages.filter((s) => s.status === 'completed').length;
	return Math.round((completedStages / session.stages.length) * 100);
}
