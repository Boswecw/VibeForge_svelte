<!--
  Stage Card Component
  Displays individual planning stage with status, progress, and results
-->
<script lang="ts">
	import type { PlanningStage } from '$lib/workbench/planning/types';

	// ========================================================================
	// PROPS
	// ========================================================================

	interface Props {
		stage: PlanningStage;
		index: number;
		isActive?: boolean;
		isStreaming?: boolean;
		streamingOutput?: string;
	}

	let { stage, index, isActive = false, isStreaming = false, streamingOutput = '' }: Props = $props();

	// ========================================================================
	// DERIVED STATE
	// ========================================================================

	const statusIcon = $derived.by(() => {
		switch (stage.status) {
			case 'completed':
				return '✓';
			case 'running':
				return '⟳';
			case 'failed':
				return '✗';
			case 'pending':
			default:
				return '○';
		}
	});

	const statusClass = $derived.by(() => {
		switch (stage.status) {
			case 'completed':
				return 'status-completed';
			case 'running':
				return 'status-running';
			case 'failed':
				return 'status-failed';
			case 'pending':
			default:
				return 'status-pending';
		}
	});

	const providerBadge = $derived.by(() => {
		switch (stage.config.provider) {
			case 'anthropic':
				return { text: 'Claude', class: 'provider-anthropic' };
			case 'openai':
				return { text: 'ChatGPT', class: 'provider-openai' };
			case 'xai':
				return { text: 'Grok', class: 'provider-xai' };
			case 'google':
				return { text: 'Gemini', class: 'provider-google' };
			default:
				return { text: stage.config.provider, class: '' };
		}
	});

	const duration = $derived.by(() => {
		if (!stage.startedAt) return null;
		const end = stage.completedAt || new Date();
		const diff = end.getTime() - stage.startedAt.getTime();
		return Math.round(diff / 1000); // seconds
	});

	let expanded = $state(false);
</script>

<!-- ======================================================================== -->
<!-- TEMPLATE -->
<!-- ======================================================================== -->

<div class="stage-card" class:active={isActive} class:expanded>
	<!-- Header -->
	<div
		class="stage-header"
		onclick={() => (expanded = !expanded)}
		onkeydown={(e) => e.key === 'Enter' && (expanded = !expanded)}
		role="button"
		tabindex="0"
	>
		<div class="stage-number">Stage {index + 1}</div>
		<div class="stage-title">
			<span class="status-icon {statusClass}">{statusIcon}</span>
			<span class="stage-name">{stage.config.name}</span>
		</div>
		<span class="expand-btn" aria-label={expanded ? 'Collapse' : 'Expand'}>
			{expanded ? '▼' : '▶'}
		</span>
	</div>

	<!-- Metadata -->
	<div class="stage-meta">
		<span class="provider-badge {providerBadge.class}">
			{providerBadge.text}
		</span>
		<span class="model-name">{stage.config.model}</span>
		{#if duration !== null}
			<span class="duration">{duration}s</span>
		{/if}
	</div>

	<!-- Progress (for running stage) -->
	{#if stage.status === 'running' && isActive}
		<div class="stage-progress">
			<div class="progress-bar">
				<div class="progress-fill"></div>
			</div>
			<span class="progress-label">Processing...</span>
		</div>
	{/if}

	<!-- Expanded Content -->
	{#if expanded}
		<div class="stage-content">
			<!-- Error -->
			{#if stage.error}
				<div class="stage-error">
					<strong>Error:</strong>
					{stage.error}
				</div>
			{/if}

			<!-- Result Stats -->
			{#if stage.result}
				<div class="result-stats">
					<div class="stat">
						<span class="stat-label">Tokens:</span>
						<span class="stat-value">{stage.result.tokensUsed.total.toLocaleString()}</span>
					</div>
					<div class="stat">
						<span class="stat-label">Cost:</span>
						<span class="stat-value">${stage.result.cost.toFixed(4)}</span>
					</div>
					<div class="stat">
						<span class="stat-label">Duration:</span>
						<span class="stat-value">{duration}s</span>
					</div>
				</div>
			{/if}

			<!-- Streaming Output -->
			{#if isStreaming && streamingOutput}
				<div class="stage-output">
					<h4>Streaming Output:</h4>
					<pre class="output-content streaming">{streamingOutput}</pre>
				</div>
			{/if}

			<!-- Completed Output -->
			{#if stage.output && !isStreaming}
				<div class="stage-output">
					<h4>Output:</h4>
					<pre class="output-content">{stage.output.substring(0, 500)}{stage.output.length > 500
							? '...'
							: ''}</pre>
					{#if stage.output.length > 500}
						<button class="view-full-btn" onclick={() => console.log(stage.output)}>
							View Full Output ({stage.output.length.toLocaleString()} chars)
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- ======================================================================== -->
<!-- STYLES -->
<!-- ======================================================================== -->

<style>
	.stage-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 1rem;
		transition: all 0.2s;
	}

	.stage-card.active {
		border-color: var(--color-primary, #4a90e2);
		box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
	}

	.stage-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		user-select: none;
	}

	.stage-number {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stage-title {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-icon {
		font-size: 1.25rem;
		line-height: 1;
	}

	.status-pending {
		color: var(--color-text-secondary, #999);
	}

	.status-running {
		color: var(--color-primary, #4a90e2);
		animation: spin 1s linear infinite;
	}

	.status-completed {
		color: var(--color-success, #4caf50);
	}

	.status-failed {
		color: var(--color-error, #f44336);
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.stage-name {
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.expand-btn {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		color: var(--color-text-secondary);
		font-size: 0.75rem;
		transition: transform 0.2s;
	}

	.expanded .expand-btn {
		transform: rotate(0deg);
	}

	.stage-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.5rem;
		font-size: 0.75rem;
	}

	.provider-badge {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-weight: 600;
		color: white;
	}

	.provider-anthropic {
		background: #b75d29;
	}

	.provider-openai {
		background: #10a37f;
	}

	.provider-xai {
		background: #000;
	}

	.provider-google {
		background: #4285f4;
	}

	.model-name {
		color: var(--color-text-secondary);
	}

	.duration {
		color: var(--color-text-secondary);
	}

	.stage-progress {
		margin-top: 0.75rem;
	}

	.progress-bar {
		height: 4px;
		background: var(--color-surface-secondary, #f0f0f0);
		border-radius: 2px;
		overflow: hidden;
		margin-bottom: 0.5rem;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-primary, #4a90e2);
		animation: progress 1.5s ease-in-out infinite;
	}

	@keyframes progress {
		0% {
			width: 0%;
		}
		50% {
			width: 70%;
		}
		100% {
			width: 100%;
		}
	}

	.progress-label {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.stage-content {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
	}

	.stage-error {
		padding: 0.75rem;
		background: var(--color-error-bg, #fee);
		border: 1px solid var(--color-error-border, #fcc);
		border-radius: 4px;
		color: var(--color-error-text, #c33);
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.result-stats {
		display: flex;
		gap: 1.5rem;
		margin-bottom: 1rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.stat-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.stage-output {
		margin-top: 1rem;
	}

	.stage-output h4 {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.output-content {
		padding: 0.75rem;
		background: var(--color-surface-secondary, #f5f5f5);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
		font-size: 0.75rem;
		line-height: 1.5;
		overflow-x: auto;
		white-space: pre-wrap;
		word-wrap: break-word;
		margin: 0;
	}

	.output-content.streaming {
		border-color: var(--color-primary, #4a90e2);
	}

	.view-full-btn {
		margin-top: 0.5rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background: var(--color-surface);
		color: var(--color-text-primary);
		font-size: 0.75rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.view-full-btn:hover {
		background: var(--color-surface-hover, #f0f0f0);
	}
</style>
