<!--
  ScaffoldingModal.svelte

  Full-screen modal showing project scaffolding progress.
  Displays real-time updates during file generation, dependency installation, and git initialization.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { ScaffoldConfig, ScaffoldProgressEvent, ScaffoldResult } from '../../types/scaffolding';
	import { generateProject, listenToScaffoldingProgress } from '../../services/scaffolder';
	import { getStageIcon, getStageName, getStageIndex, isStageActive, isStageCompleted } from '../../types/scaffolding';
	import type { UnlistenFn } from '@tauri-apps/api/event';

	// ============================================================================
	// PROPS
	// ============================================================================

	interface Props {
		config: ScaffoldConfig | null;
		onComplete?: (result: ScaffoldResult) => void;
		onError?: (error: Error) => void;
		onCancel?: () => void;
	}

	let { config, onComplete, onError, onCancel }: Props = $props();

	// ============================================================================
	// STATE
	// ============================================================================

	let isOpen = $state(false);
	let progress = $state<ScaffoldProgressEvent | null>(null);
	let result = $state<ScaffoldResult | null>(null);
	let error = $state<Error | null>(null);
	let log = $state<ScaffoldProgressEvent[]>([]);
	let unlisten: UnlistenFn | null = null;

	// ============================================================================
	// COMPUTED
	// ============================================================================

	let currentStage = $derived(progress?.stage || 'preparing');
	let currentProgress = $derived(progress?.progress || 0);
	let isComplete = $derived(currentStage === 'complete');
	let hasError = $derived(currentStage === 'error' || error !== null);

	const stages = [
		{ id: 'preparing', name: 'Preparing', icon: '📋' },
		{ id: 'files', name: 'Creating Files', icon: '📁' },
		{ id: 'dependencies', name: 'Installing Dependencies', icon: '📦' },
		{ id: 'git', name: 'Initializing Git', icon: '🔧' }
	] as const;

	// ============================================================================
	// LIFECYCLE
	// ============================================================================

	onMount(async () => {
		if (config) {
			await startScaffolding();
		}

		// Listen to progress events
		unlisten = await listenToScaffoldingProgress((event) => {
			progress = event;
			log = [...log, event];
		});
	});

	onDestroy(() => {
		if (unlisten) {
			unlisten();
		}
	});

	// ============================================================================
	// METHODS
	// ============================================================================

	async function startScaffolding() {
		if (!config) return;

		isOpen = true;
		progress = {
			stage: 'preparing',
			progress: 0,
			message: 'Preparing to create project...'
		};
		log = [progress];

		try {
			// Start file generation
			updateProgress('files', 5, 'Creating project directories...');

			const scaffoldResult = await generateProject(config);

			// Success!
			result = scaffoldResult;
			updateProgress('complete', 100, 'Project created successfully!');

			if (onComplete) {
				onComplete(scaffoldResult);
			}
		} catch (err) {
			const errorObj = err instanceof Error ? err : new Error(String(err));
			error = errorObj;
			updateProgress('error', currentProgress, `Error: ${errorObj.message}`);

			if (onError) {
				onError(errorObj);
			}
		}
	}

	function updateProgress(stage: ScaffoldProgressEvent['stage'], progressValue: number, message: string, details?: string) {
		const event: ScaffoldProgressEvent = {
			stage,
			progress: progressValue,
			message,
			details
		};
		progress = event;
		log = [...log, event];
	}

	function handleClose() {
		if (isComplete || hasError) {
			isOpen = false;
			if (onCancel) {
				onCancel();
			}
		}
	}

	function handleCancel() {
		// TODO: Implement cancellation
		isOpen = false;
		if (onCancel) {
			onCancel();
		}
	}
</script>

{#if isOpen && config}
	<div class="modal-overlay" onclick={handleClose} role="button" tabindex="-1">
		<div class="modal-content" onclick|stopPropagation role="dialog">
			<!-- Header -->
			<div class="modal-header">
				<div>
					<h2>
						{#if isComplete}
							✅ Project Created Successfully!
						{:else if hasError}
							❌ Scaffolding Failed
						{:else}
							Creating Project: {config.projectName}
						{/if}
					</h2>
					<p class="text-sm text-zinc-400">
						{#if isComplete}
							Your project is ready to use
						{:else if hasError}
							An error occurred during scaffolding
						{:else}
							{progress?.message || 'Initializing...'}
						{/if}
					</p>
				</div>

				{#if isComplete || hasError}
					<button class="close-btn" onclick={handleClose} aria-label="Close">
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
							<path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
						</svg>
					</button>
				{/if}
			</div>

			<!-- Progress Steps -->
			{#if !isComplete && !hasError}
				<div class="progress-steps">
					{#each stages as stage, index}
						<div
							class="step"
							class:active={isStageActive(currentStage, stage.id)}
							class:completed={isStageCompleted(currentStage, stage.id)}
						>
							<div class="step-icon">{stage.icon}</div>
							<div class="step-label">{stage.name}</div>
							{#if index < stages.length - 1}
								<div class="step-connector" class:completed={isStageCompleted(currentStage, stage.id)}></div>
							{/if}
						</div>
					{/each}
				</div>

				<!-- Progress Bar -->
				<div class="progress-bar-container">
					<div class="progress-bar-bg">
						<div class="progress-bar-fill" style="width: {currentProgress}%"></div>
					</div>
					<span class="progress-percentage">{currentProgress}%</span>
				</div>
			{/if}

			<!-- Log Output -->
			<div class="log-container">
				<div class="log-header">
					<span>📜 Log</span>
					<span class="log-count">{log.length} events</span>
				</div>
				<div class="log-content">
					{#each log as event}
						<div class="log-entry">
							<span class="log-icon">{getStageIcon(event.stage)}</span>
							<span class="log-message">{event.message}</span>
							{#if event.details}
								<div class="log-details">{event.details}</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Success Screen -->
			{#if isComplete && result}
				<div class="success-panel">
					<div class="success-stats">
						<div class="stat">
							<span class="stat-icon">📁</span>
							<span class="stat-value">{result.filesCreated}</span>
							<span class="stat-label">files created</span>
						</div>
						<div class="stat">
							<span class="stat-icon">🧩</span>
							<span class="stat-value">{result.componentsGenerated.length}</span>
							<span class="stat-label">components</span>
						</div>
					</div>

					<div class="next-steps">
						<h3>Next Steps:</h3>
						<ol>
							<li>cd {config.projectName}</li>
							<li>npm run dev (or equivalent)</li>
							<li>Start building! 🚀</li>
						</ol>
					</div>

					<div class="action-buttons">
						<button class="btn-primary" onclick={() => {
							// TODO: Open in VS Code
							handleClose();
						}}>
							Open in VS Code
						</button>
						<button class="btn-secondary" onclick={handleClose}>
							Close
						</button>
					</div>
				</div>
			{/if}

			<!-- Error Screen -->
			{#if hasError && error}
				<div class="error-panel">
					<p class="error-message">{error.message}</p>
					<div class="action-buttons">
						<button class="btn-primary" onclick={() => {
							// Reset and retry
							error = null;
							result = null;
							log = [];
							startScaffolding();
						}}>
							Try Again
						</button>
						<button class="btn-secondary" onclick={handleClose}>
							Cancel
						</button>
					</div>
				</div>
			{/if}

			<!-- Cancel Button (only during scaffolding) -->
			{#if !isComplete && !hasError}
				<div class="modal-footer">
					<button class="btn-text" onclick={handleCancel}>
						Cancel
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(4px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.modal-content {
		background: #18181b;
		border-radius: 12px;
		border: 1px solid #27272a;
		max-width: 700px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
	}

	.modal-header {
		padding: 24px;
		border-bottom: 1px solid #27272a;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.modal-header h2 {
		font-size: 20px;
		font-weight: 600;
		color: #f4f4f5;
		margin: 0 0 4px;
	}

	.close-btn {
		background: none;
		border: none;
		color: #a1a1aa;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.close-btn:hover {
		background: #27272a;
		color: #f4f4f5;
	}

	/* Progress Steps */
	.progress-steps {
		padding: 24px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: relative;
	}

	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		position: relative;
		flex: 1;
	}

	.step-icon {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: #27272a;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
		border: 2px solid #3f3f46;
		transition: all 0.3s;
	}

	.step.active .step-icon {
		background: #6366f1;
		border-color: #6366f1;
		box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
		animation: pulse 2s ease-in-out infinite;
	}

	.step.completed .step-icon {
		background: #10b981;
		border-color: #10b981;
	}

	@keyframes pulse {
		0%,
		100% {
			box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
		}
		50% {
			box-shadow: 0 0 30px rgba(99, 102, 241, 0.8);
		}
	}

	.step-label {
		font-size: 12px;
		color: #71717a;
		text-align: center;
		transition: color 0.3s;
	}

	.step.active .step-label {
		color: #f4f4f5;
		font-weight: 500;
	}

	.step.completed .step-label {
		color: #a1a1aa;
	}

	.step-connector {
		position: absolute;
		top: 24px;
		left: 50%;
		right: -50%;
		height: 2px;
		background: #3f3f46;
		z-index: -1;
		transition: background 0.3s;
	}

	.step-connector.completed {
		background: #10b981;
	}

	/* Progress Bar */
	.progress-bar-container {
		padding: 0 24px 24px;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.progress-bar-bg {
		flex: 1;
		height: 8px;
		background: #27272a;
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-bar-fill {
		height: 100%;
		background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.progress-percentage {
		font-size: 14px;
		font-weight: 600;
		color: #a1a1aa;
		min-width: 40px;
		text-align: right;
	}

	/* Log */
	.log-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-top: 1px solid #27272a;
	}

	.log-header {
		padding: 12px 24px;
		background: #09090b;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 14px;
		color: #a1a1aa;
		border-bottom: 1px solid #27272a;
	}

	.log-count {
		font-size: 12px;
		color: #71717a;
	}

	.log-content {
		flex: 1;
		overflow-y: auto;
		padding: 12px 24px;
		max-height: 300px;
	}

	.log-entry {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		padding: 8px 0;
		font-size: 13px;
		color: #d4d4d8;
		font-family: 'Monaco', 'Courier New', monospace;
	}

	.log-icon {
		flex-shrink: 0;
	}

	.log-message {
		flex: 1;
	}

	.log-details {
		margin-top: 4px;
		padding-left: 24px;
		font-size: 12px;
		color: #71717a;
	}

	/* Success Panel */
	.success-panel {
		padding: 24px;
	}

	.success-stats {
		display: flex;
		gap: 24px;
		margin-bottom: 24px;
	}

	.stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 16px;
		background: #27272a;
		border-radius: 8px;
	}

	.stat-icon {
		font-size: 32px;
	}

	.stat-value {
		font-size: 24px;
		font-weight: 700;
		color: #f4f4f5;
	}

	.stat-label {
		font-size: 12px;
		color: #a1a1aa;
	}

	.next-steps {
		background: #09090b;
		border: 1px solid #27272a;
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 24px;
	}

	.next-steps h3 {
		font-size: 14px;
		font-weight: 600;
		color: #f4f4f5;
		margin: 0 0 12px;
	}

	.next-steps ol {
		margin: 0;
		padding-left: 20px;
		color: #d4d4d8;
		font-size: 13px;
		line-height: 1.8;
	}

	/* Error Panel */
	.error-panel {
		padding: 24px;
	}

	.error-message {
		padding: 16px;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 8px;
		color: #fca5a5;
		margin-bottom: 24px;
	}

	/* Buttons */
	.action-buttons {
		display: flex;
		gap: 12px;
	}

	.btn-primary,
	.btn-secondary {
		flex: 1;
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.btn-primary {
		background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
		color: white;
	}

	.btn-primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
	}

	.btn-secondary {
		background: #27272a;
		color: #d4d4d8;
	}

	.btn-secondary:hover {
		background: #3f3f46;
	}

	.modal-footer {
		padding: 16px 24px;
		border-top: 1px solid #27272a;
		display: flex;
		justify-content: center;
	}

	.btn-text {
		background: none;
		border: none;
		color: #a1a1aa;
		font-size: 14px;
		cursor: pointer;
		padding: 8px 16px;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.btn-text:hover {
		background: #27272a;
		color: #f4f4f5;
	}

	/* Scrollbar */
	.log-content::-webkit-scrollbar {
		width: 8px;
	}

	.log-content::-webkit-scrollbar-track {
		background: #18181b;
	}

	.log-content::-webkit-scrollbar-thumb {
		background: #3f3f46;
		border-radius: 4px;
	}

	.log-content::-webkit-scrollbar-thumb:hover {
		background: #52525b;
	}
</style>
