/**
 * Planning Store for Cortex Multi-AI Planning
 * Manages planning sessions with Svelte 5 runes
 */

import { browser } from '$app/environment';
import type {
	PlanningSession,
	PlanningStage,
	RequestType,
	PipelineType
} from '$lib/workbench/planning/types';
import {
	createPlanningSession,
	getCurrentStage,
	isSessionComplete,
	getSessionProgress
} from '$lib/workbench/planning/types';
import { planningOrchestrator } from '$lib/workbench/planning/services/orchestrator';
import { licenseStore } from '$lib/core/stores/license.svelte';

// ==============================================================================
// CONSTANTS
// ==============================================================================

const STORAGE_KEY = 'vibeforge-planning-sessions';
const MAX_STORED_SESSIONS = 50; // Limit stored sessions

// ==============================================================================
// PLANNING STATE
// ==============================================================================

const state = $state<{
	sessions: PlanningSession[];
	currentSession: PlanningSession | null;
	isRunning: boolean;
	isPaused: boolean;
	streamingOutput: string;
	error: string | null;
}>({
	sessions: browser ? loadSessionsFromStorage() : [],
	currentSession: null,
	isRunning: false,
	isPaused: false,
	streamingOutput: '',
	error: null
});

// ==============================================================================
// DERIVED STATE
// ==============================================================================

const currentStage = $derived(
	state.currentSession ? getCurrentStage(state.currentSession) : null
);

const progress = $derived(state.currentSession ? getSessionProgress(state.currentSession) : 0);

const canStartSession = $derived.by(() => {
	// Must not be running
	if (state.isRunning) return false;

	// Must have orchestrator permission from license
	if (!licenseStore.canUseOrchestrator) return false;

	return true;
});

const sessionComplete = $derived(
	state.currentSession ? isSessionComplete(state.currentSession) : false
);

const hasDeliverable = $derived(!!state.currentSession?.deliverable);

// Session statistics
const totalSessions = $derived(state.sessions.length);
const completedSessions = $derived(
	state.sessions.filter((s) => s.status === 'completed').length
);
const failedSessions = $derived(state.sessions.filter((s) => s.status === 'failed').length);

// ==============================================================================
// STORAGE HELPERS
// ==============================================================================

function loadSessionsFromStorage(): PlanningSession[] {
	if (!browser) return [];

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return [];

		const parsed = JSON.parse(stored);

		// Convert date strings back to Date objects
		return parsed.map((session: any) => ({
			...session,
			createdAt: new Date(session.createdAt),
			startedAt: session.startedAt ? new Date(session.startedAt) : null,
			pausedAt: session.pausedAt ? new Date(session.pausedAt) : null,
			completedAt: session.completedAt ? new Date(session.completedAt) : null,
			stages: session.stages.map((stage: any) => ({
				...stage,
				startedAt: stage.startedAt ? new Date(stage.startedAt) : null,
				completedAt: stage.completedAt ? new Date(stage.completedAt) : null
			}))
		}));
	} catch (error) {
		console.error('Failed to load sessions from storage:', error);
		return [];
	}
}

function saveSessionsToStorage(sessions: PlanningSession[]) {
	if (!browser) return;

	try {
		// Only keep the most recent sessions
		const sessionsToStore = sessions.slice(0, MAX_STORED_SESSIONS);

		const serialized = sessionsToStore.map((session) => ({
			...session,
			createdAt: session.createdAt.toISOString(),
			startedAt: session.startedAt?.toISOString() || null,
			pausedAt: session.pausedAt?.toISOString() || null,
			completedAt: session.completedAt?.toISOString() || null,
			stages: session.stages.map((stage) => ({
				...stage,
				startedAt: stage.startedAt?.toISOString() || null,
				completedAt: stage.completedAt?.toISOString() || null
			}))
		}));

		localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
	} catch (error) {
		console.error('Failed to save sessions to storage:', error);
	}
}

// ==============================================================================
// ACTIONS
// ==============================================================================

/**
 * Create and start a new planning session
 */
async function startSession(
	title: string,
	description: string,
	requestType: RequestType = 'feature',
	pipelineType: PipelineType = 'default'
): Promise<void> {
	// Check permissions
	if (!canStartSession) {
		state.error = 'Cannot start session: no permission or already running';
		return;
	}

	// Record usage
	licenseStore.recordOrchestratorRun();

	// Create new session
	const session = createPlanningSession(title, description, requestType, pipelineType);

	// Set as current session
	state.currentSession = session;
	state.isRunning = true;
	state.isPaused = false;
	state.streamingOutput = '';
	state.error = null;

	try {
		// Run the session through orchestrator
		await planningOrchestrator.runSession(session, {
			onStageStart: (index) => {
				if (state.currentSession) {
					state.currentSession.currentStageIndex = index;
				}
			},
			onStageProgress: (index, token) => {
				state.streamingOutput += token;
			},
			onStageComplete: (index, stage) => {
				if (state.currentSession) {
					state.currentSession.stages[index] = stage;
					state.streamingOutput = ''; // Clear streaming output
				}
			},
			onSessionComplete: (completedSession) => {
				state.currentSession = completedSession;
				state.isRunning = false;

				// Add to sessions list
				state.sessions.unshift(completedSession);
				saveSessionsToStorage(state.sessions);
			},
			onError: (error) => {
				state.error = error.message;
				state.isRunning = false;
			}
		});
	} catch (error) {
		state.error = error instanceof Error ? error.message : 'Unknown error';
		state.isRunning = false;

		// Still save the failed session
		if (state.currentSession) {
			state.sessions.unshift(state.currentSession);
			saveSessionsToStorage(state.sessions);
		}
	}
}

/**
 * Pause the current session
 */
function pauseSession() {
	if (!state.isRunning || state.isPaused) return;

	planningOrchestrator.pause();
	state.isPaused = true;
}

/**
 * Resume the paused session
 */
function resumeSession() {
	if (!state.isPaused) return;

	planningOrchestrator.resume();
	state.isPaused = false;
}

/**
 * Abort the current session
 */
function abortSession() {
	if (!state.isRunning) return;

	planningOrchestrator.abort();
	state.isRunning = false;
	state.isPaused = false;
	state.error = 'Session aborted by user';

	// Save the aborted session
	if (state.currentSession) {
		state.sessions.unshift(state.currentSession);
		saveSessionsToStorage(state.sessions);
	}
}

/**
 * Inject user context at current or next stage
 */
function injectContext(content: string, stageIndex?: number) {
	if (!state.currentSession) return;

	const targetIndex =
		stageIndex !== undefined ? stageIndex : state.currentSession.currentStageIndex + 1;

	planningOrchestrator.injectContext(state.currentSession, targetIndex, content);
}

/**
 * Load a previous session
 */
function loadSession(sessionId: string) {
	const session = state.sessions.find((s) => s.id === sessionId);
	if (session) {
		state.currentSession = session;
		state.streamingOutput = '';
		state.error = null;
	}
}

/**
 * Delete a session
 */
function deleteSession(sessionId: string) {
	state.sessions = state.sessions.filter((s) => s.id !== sessionId);
	saveSessionsToStorage(state.sessions);

	// Clear current session if it was deleted
	if (state.currentSession?.id === sessionId) {
		state.currentSession = null;
		state.streamingOutput = '';
	}
}

/**
 * Clear all sessions
 */
function clearAllSessions() {
	state.sessions = [];
	state.currentSession = null;
	state.isRunning = false;
	state.isPaused = false;
	state.streamingOutput = '';
	state.error = null;
	saveSessionsToStorage([]);
}

/**
 * Download deliverable files
 */
function downloadDeliverables() {
	if (!state.currentSession?.deliverable) return;

	const { implementationPlan, claudeCodePrompt } = state.currentSession.deliverable;

	// Download implementation plan
	downloadFile(implementationPlan.content, implementationPlan.filename);

	// Download Claude Code prompt
	downloadFile(claudeCodePrompt.content, claudeCodePrompt.filename);
}

/**
 * Helper to download a file
 */
function downloadFile(content: string, filename: string) {
	if (!browser) return;

	const blob = new Blob([content], { type: 'text/markdown' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * Set API keys for providers
 */
function setApiKeys(keys: {
	anthropic?: string;
	openai?: string;
	xai?: string;
	google?: string;
}) {
	if (keys.anthropic) planningOrchestrator.setApiKey('anthropic', keys.anthropic);
	if (keys.openai) planningOrchestrator.setApiKey('openai', keys.openai);
	if (keys.xai) planningOrchestrator.setApiKey('xai', keys.xai);
	if (keys.google) planningOrchestrator.setApiKey('google', keys.google);
}

// ==============================================================================
// EXPORTS
// ==============================================================================

export const planningStore = {
	// State (getters)
	get sessions() {
		return state.sessions;
	},
	get currentSession() {
		return state.currentSession;
	},
	get isRunning() {
		return state.isRunning;
	},
	get isPaused() {
		return state.isPaused;
	},
	get streamingOutput() {
		return state.streamingOutput;
	},
	get error() {
		return state.error;
	},

	// Derived (session state)
	get currentStage() {
		return currentStage;
	},
	get progress() {
		return progress;
	},
	get canStartSession() {
		return canStartSession;
	},
	get sessionComplete() {
		return sessionComplete;
	},
	get hasDeliverable() {
		return hasDeliverable;
	},

	// Derived (statistics)
	get totalSessions() {
		return totalSessions;
	},
	get completedSessions() {
		return completedSessions;
	},
	get failedSessions() {
		return failedSessions;
	},

	// Actions
	startSession,
	pauseSession,
	resumeSession,
	abortSession,
	injectContext,
	loadSession,
	deleteSession,
	clearAllSessions,
	downloadDeliverables,
	setApiKeys
};
