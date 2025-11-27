/**
 * Claude Code Bridge
 *
 * Spawns Claude Code sessions and streams execution output for AI-powered refactoring.
 */

import type { ClaudeCodeSession } from '../types/execution';
import type { RefactoringTask } from '../types/planning';

export interface ClaudeCodeConfig {
	/**
	 * Working directory for Claude Code execution
	 */
	workingDirectory: string;

	/**
	 * Whether to actually spawn Claude Code (false for simulation)
	 */
	enabled?: boolean;

	/**
	 * Maximum execution time in milliseconds
	 */
	timeout?: number;

	/**
	 * Claude Code executable path (defaults to system `claude`)
	 */
	claudePath?: string;
}

export type SessionEventType = 'started' | 'output' | 'error' | 'file_modified' | 'file_created' | 'file_deleted' | 'completed' | 'failed';

export interface SessionEvent {
	type: SessionEventType;
	data: string;
	timestamp: string;
}

export type SessionEventHandler = (event: SessionEvent) => void;

/**
 * Claude Code Bridge
 *
 * Provides integration with Claude Code CLI for automated task execution.
 * Handles:
 * - Spawning Claude Code processes
 * - Streaming output and events
 * - Tracking file modifications
 * - Session lifecycle management
 */
export class ClaudeCodeBridge {
	private config: ClaudeCodeConfig;
	private activeSessions: Map<string, ClaudeCodeSession>;
	private eventHandlers: Map<string, SessionEventHandler[]>;

	constructor(config: ClaudeCodeConfig) {
		this.config = {
			enabled: false, // Default to simulation mode
			timeout: 600000, // 10 minutes default
			claudePath: 'claude',
			...config
		};

		this.activeSessions = new Map();
		this.eventHandlers = new Map();
	}

	/**
	 * Starts a new Claude Code session for a task
	 */
	async startSession(task: RefactoringTask, prompt: string): Promise<ClaudeCodeSession> {
		const session: ClaudeCodeSession = {
			id: `session-${task.id}-${Date.now()}`,
			taskId: task.id,
			startedAt: new Date().toISOString(),
			prompt,
			status: 'running',
			output: [],
			errors: [],
			filesModified: [],
			filesCreated: [],
			filesDeleted: []
		};

		this.activeSessions.set(session.id, session);

		// Emit started event
		this.emitEvent(session.id, {
			type: 'started',
			data: `Started Claude Code session for task: ${task.title}`,
			timestamp: session.startedAt
		});

		if (!this.config.enabled) {
			// Simulation mode
			await this.simulateSession(session, task);
		} else {
			// Real execution
			await this.executeSession(session, task, prompt);
		}

		return session;
	}

	/**
	 * Subscribes to session events
	 */
	onSessionEvent(sessionId: string, handler: SessionEventHandler): () => void {
		if (!this.eventHandlers.has(sessionId)) {
			this.eventHandlers.set(sessionId, []);
		}

		const handlers = this.eventHandlers.get(sessionId)!;
		handlers.push(handler);

		// Return unsubscribe function
		return () => {
			const index = handlers.indexOf(handler);
			if (index > -1) {
				handlers.splice(index, 1);
			}
		};
	}

	/**
	 * Gets the current status of a session
	 */
	getSession(sessionId: string): ClaudeCodeSession | undefined {
		return this.activeSessions.get(sessionId);
	}

	/**
	 * Cancels a running session
	 */
	async cancelSession(sessionId: string): Promise<void> {
		const session = this.activeSessions.get(sessionId);
		if (!session) {
			throw new Error(`Session not found: ${sessionId}`);
		}

		if (session.status !== 'running') {
			return; // Already completed/failed
		}

		session.status = 'cancelled';
		session.endedAt = new Date().toISOString();

		this.emitEvent(sessionId, {
			type: 'failed',
			data: 'Session cancelled by user',
			timestamp: session.endedAt
		});

		// In real implementation, this would kill the child process
	}

	/**
	 * Emits an event to all subscribers
	 */
	private emitEvent(sessionId: string, event: SessionEvent): void {
		const handlers = this.eventHandlers.get(sessionId) || [];
		for (const handler of handlers) {
			handler(event);
		}
	}

	/**
	 * Simulates a Claude Code session for testing
	 */
	private async simulateSession(session: ClaudeCodeSession, task: RefactoringTask): Promise<void> {
		// Simulate realistic execution with delays
		await this.delay(500);

		// Simulate file modifications
		for (const file of task.files) {
			session.filesModified.push(file);
			this.emitEvent(session.id, {
				type: 'file_modified',
				data: file,
				timestamp: new Date().toISOString()
			});

			await this.delay(200);
		}

		// Simulate output
		const simulatedOutput = [
			`Reading task: ${task.title}`,
			`Analyzing ${task.files.length} files...`,
			'Running refactoring operations...',
			'Verifying changes...',
			'All acceptance criteria met ✓'
		];

		for (const output of simulatedOutput) {
			session.output.push(output);
			this.emitEvent(session.id, {
				type: 'output',
				data: output,
				timestamp: new Date().toISOString()
			});

			await this.delay(300);
		}

		// Complete session
		session.status = 'completed';
		session.endedAt = new Date().toISOString();

		this.emitEvent(session.id, {
			type: 'completed',
			data: 'Session completed successfully',
			timestamp: session.endedAt
		});
	}

	/**
	 * Executes a real Claude Code session
	 */
	private async executeSession(
		session: ClaudeCodeSession,
		task: RefactoringTask,
		prompt: string
	): Promise<void> {
		try {
			// In a real implementation, this would:
			// 1. Spawn Claude Code process with the prompt
			// 2. Stream stdout/stderr to session.output/errors
			// 3. Watch for file changes in working directory
			// 4. Update session status based on process exit
			// 5. Handle timeout

			// This requires Node.js child_process, which is not available in browser
			// Must be implemented in server-side code ($lib/server)

			throw new Error(
				'Real Claude Code execution not implemented. ' +
					'This requires server-side implementation in $lib/server ' +
					'with Node.js child_process to spawn Claude Code CLI.'
			);
		} catch (error) {
			session.status = 'failed';
			session.endedAt = new Date().toISOString();
			session.errors.push(String(error));

			this.emitEvent(session.id, {
				type: 'failed',
				data: String(error),
				timestamp: session.endedAt
			});

			throw error;
		}
	}

	/**
	 * Utility: Delay for simulation
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Cleans up completed/failed sessions
	 */
	cleanupSession(sessionId: string): void {
		this.activeSessions.delete(sessionId);
		this.eventHandlers.delete(sessionId);
	}

	/**
	 * Gets all active sessions
	 */
	getActiveSessions(): ClaudeCodeSession[] {
		return Array.from(this.activeSessions.values()).filter((s) => s.status === 'running');
	}

	/**
	 * Waits for a session to complete
	 */
	async waitForCompletion(sessionId: string, timeoutMs?: number): Promise<ClaudeCodeSession> {
		const timeout = timeoutMs || this.config.timeout!;
		const startTime = Date.now();

		return new Promise((resolve, reject) => {
			const checkStatus = () => {
				const session = this.activeSessions.get(sessionId);

				if (!session) {
					reject(new Error(`Session not found: ${sessionId}`));
					return;
				}

				if (session.status === 'completed') {
					resolve(session);
					return;
				}

				if (session.status === 'failed' || session.status === 'cancelled') {
					reject(new Error(`Session ${session.status}: ${session.errors.join(', ')}`));
					return;
				}

				// Check timeout
				if (Date.now() - startTime > timeout) {
					this.cancelSession(sessionId);
					reject(new Error(`Session timed out after ${timeout}ms`));
					return;
				}

				// Check again in 100ms
				setTimeout(checkStatus, 100);
			};

			checkStatus();
		});
	}
}
