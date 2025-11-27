/**
 * Git Operations
 *
 * Provides Git integration for refactoring checkpoints, rollbacks, and branch management.
 */

import type { GitCheckpoint, GitOperationResult } from '../types/execution';

export interface GitConfig {
	/**
	 * Path to the repository
	 */
	repositoryPath: string;

	/**
	 * Whether to use git operations (false for testing/simulation)
	 */
	enabled?: boolean;

	/**
	 * Whether to auto-push to remote
	 */
	autoPush?: boolean;
}

/**
 * Git Operations
 *
 * Handles all git operations for refactoring automation:
 * - Branch creation and switching
 * - Checkpoint commits with tagging
 * - Rollback to previous checkpoints
 * - Status and verification
 */
export class GitOperations {
	private config: GitConfig;

	constructor(config: GitConfig) {
		this.config = {
			enabled: true,
			autoPush: false,
			...config
		};
	}

	/**
	 * Gets the current branch name
	 */
	async getCurrentBranch(): Promise<string> {
		if (!this.config.enabled) {
			return 'main';
		}

		try {
			// Execute git command to get current branch
			const result = await this.executeGitCommand(['rev-parse', '--abbrev-ref', 'HEAD']);

			if (!result.success || !result.stdout) {
				throw new Error('Failed to get current branch');
			}

			return result.stdout.trim();
		} catch (error) {
			throw new Error(`Failed to get current branch: ${error}`);
		}
	}

	/**
	 * Creates a new branch from the current HEAD
	 */
	async createBranch(branchName: string, fromBranch?: string): Promise<GitOperationResult> {
		if (!this.config.enabled) {
			return {
				success: true,
				message: `[SIMULATED] Created branch: ${branchName}`
			};
		}

		try {
			// Checkout the base branch if specified
			if (fromBranch) {
				await this.executeGitCommand(['checkout', fromBranch]);
			}

			// Create new branch
			const result = await this.executeGitCommand(['checkout', '-b', branchName]);

			if (!result.success) {
				return {
					success: false,
					message: `Failed to create branch: ${branchName}`,
					error: result.stderr || 'Unknown error'
				};
			}

			return {
				success: true,
				message: `Created and switched to branch: ${branchName}`
			};
		} catch (error) {
			return {
				success: false,
				message: `Failed to create branch: ${branchName}`,
				error: String(error)
			};
		}
	}

	/**
	 * Switches to an existing branch
	 */
	async switchBranch(branchName: string): Promise<GitOperationResult> {
		if (!this.config.enabled) {
			return {
				success: true,
				message: `[SIMULATED] Switched to branch: ${branchName}`
			};
		}

		try {
			const result = await this.executeGitCommand(['checkout', branchName]);

			if (!result.success) {
				return {
					success: false,
					message: `Failed to switch to branch: ${branchName}`,
					error: result.stderr || 'Unknown error'
				};
			}

			return {
				success: true,
				message: `Switched to branch: ${branchName}`
			};
		} catch (error) {
			return {
				success: false,
				message: `Failed to switch to branch: ${branchName}`,
				error: String(error)
			};
		}
	}

	/**
	 * Creates a checkpoint commit with all staged/unstaged changes
	 */
	async createCheckpoint(
		message: string,
		phase?: number,
		taskId?: string
	): Promise<GitCheckpoint> {
		if (!this.config.enabled) {
			return {
				id: `checkpoint-${Date.now()}`,
				branch: 'main',
				commit: `simulated-${Date.now()}`,
				message,
				createdAt: new Date().toISOString(),
				phase: phase || 0,
				task: taskId
			};
		}

		try {
			// Stage all changes
			await this.executeGitCommand(['add', '-A']);

			// Check if there are changes to commit
			const statusResult = await this.executeGitCommand(['status', '--porcelain']);
			if (!statusResult.stdout || statusResult.stdout.trim() === '') {
				// No changes, get current commit
				const commitResult = await this.executeGitCommand(['rev-parse', 'HEAD']);
				const currentBranch = await this.getCurrentBranch();

				return {
					id: `checkpoint-${Date.now()}`,
					branch: currentBranch,
					commit: commitResult.stdout?.trim() || '',
					message: `${message} (no changes)`,
					createdAt: new Date().toISOString(),
					phase: phase || 0,
					task: taskId
				};
			}

			// Create commit
			const commitResult = await this.executeGitCommand(['commit', '-m', message]);

			if (!commitResult.success) {
				throw new Error(`Failed to create commit: ${commitResult.stderr}`);
			}

			// Get commit hash
			const hashResult = await this.executeGitCommand(['rev-parse', 'HEAD']);
			const commitHash = hashResult.stdout?.trim() || '';

			// Create tag for checkpoint
			const tagName = `checkpoint-phase${phase || 0}-${Date.now()}`;
			await this.executeGitCommand(['tag', '-a', tagName, '-m', message]);

			// Get current branch
			const currentBranch = await this.getCurrentBranch();

			// Auto-push if configured
			if (this.config.autoPush) {
				await this.executeGitCommand(['push', 'origin', currentBranch, '--tags']);
			}

			return {
				id: tagName,
				branch: currentBranch,
				commit: commitHash,
				message,
				createdAt: new Date().toISOString(),
				phase: phase || 0,
				task: taskId
			};
		} catch (error) {
			throw new Error(`Failed to create checkpoint: ${error}`);
		}
	}

	/**
	 * Rolls back to a specific checkpoint
	 */
	async rollbackToCheckpoint(checkpoint: GitCheckpoint): Promise<GitOperationResult> {
		if (!this.config.enabled) {
			return {
				success: true,
				message: `[SIMULATED] Rolled back to checkpoint: ${checkpoint.id}`
			};
		}

		try {
			// Hard reset to the checkpoint commit
			const result = await this.executeGitCommand(['reset', '--hard', checkpoint.commit]);

			if (!result.success) {
				return {
					success: false,
					message: `Failed to rollback to checkpoint: ${checkpoint.id}`,
					error: result.stderr || 'Unknown error'
				};
			}

			return {
				success: true,
				message: `Rolled back to checkpoint: ${checkpoint.id} (${checkpoint.message})`,
				commit: checkpoint.commit
			};
		} catch (error) {
			return {
				success: false,
				message: `Failed to rollback to checkpoint: ${checkpoint.id}`,
				error: String(error)
			};
		}
	}

	/**
	 * Gets the status of the working directory
	 */
	async getStatus(): Promise<{
		clean: boolean;
		modified: string[];
		untracked: string[];
	}> {
		if (!this.config.enabled) {
			return {
				clean: true,
				modified: [],
				untracked: []
			};
		}

		try {
			const result = await this.executeGitCommand(['status', '--porcelain']);

			if (!result.success) {
				throw new Error('Failed to get git status');
			}

			const lines = (result.stdout || '').split('\n').filter((line) => line.trim());
			const modified: string[] = [];
			const untracked: string[] = [];

			for (const line of lines) {
				const status = line.substring(0, 2);
				const file = line.substring(3);

				if (status.includes('M') || status.includes('A') || status.includes('D')) {
					modified.push(file);
				} else if (status.includes('?')) {
					untracked.push(file);
				}
			}

			return {
				clean: lines.length === 0,
				modified,
				untracked
			};
		} catch (error) {
			throw new Error(`Failed to get status: ${error}`);
		}
	}

	/**
	 * Stashes current changes
	 */
	async stash(message?: string): Promise<GitOperationResult> {
		if (!this.config.enabled) {
			return {
				success: true,
				message: '[SIMULATED] Stashed changes'
			};
		}

		try {
			const args = ['stash', 'push'];
			if (message) {
				args.push('-m', message);
			}

			const result = await this.executeGitCommand(args);

			if (!result.success) {
				return {
					success: false,
					message: 'Failed to stash changes',
					error: result.stderr || 'Unknown error'
				};
			}

			return {
				success: true,
				message: message ? `Stashed: ${message}` : 'Stashed changes'
			};
		} catch (error) {
			return {
				success: false,
				message: 'Failed to stash changes',
				error: String(error)
			};
		}
	}

	/**
	 * Pops the most recent stash
	 */
	async popStash(): Promise<GitOperationResult> {
		if (!this.config.enabled) {
			return {
				success: true,
				message: '[SIMULATED] Popped stash'
			};
		}

		try {
			const result = await this.executeGitCommand(['stash', 'pop']);

			if (!result.success) {
				return {
					success: false,
					message: 'Failed to pop stash',
					error: result.stderr || 'Unknown error'
				};
			}

			return {
				success: true,
				message: 'Popped stash'
			};
		} catch (error) {
			return {
				success: false,
				message: 'Failed to pop stash',
				error: String(error)
			};
		}
	}

	/**
	 * Executes a git command
	 */
	private async executeGitCommand(args: string[]): Promise<{
		success: boolean;
		stdout?: string;
		stderr?: string;
	}> {
		// In a real implementation, this would execute git commands via child_process
		// For now, this is a placeholder that simulates git operations

		// This would be implemented using Node.js child_process in a real server environment
		// Since this is running in a SvelteKit context, we'd need to either:
		// 1. Make this a server-side only module (in $lib/server)
		// 2. Provide a bridge to call server-side git operations
		// 3. Use a git library that works in both environments

		throw new Error(
			'GitOperations.executeGitCommand must be implemented with actual git execution. ' +
			'This requires either: (1) moving to $lib/server for Node.js child_process, or ' +
			'(2) using a git library compatible with SvelteKit'
		);
	}
}
