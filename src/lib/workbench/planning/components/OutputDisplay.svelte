<!--
  Output Display Component
  Shows streaming output and final deliverables with download options
-->
<script lang="ts">
	import { planningStore } from '$lib/workbench/planning/stores/planning.svelte';
	import type { PlanningSession } from '$lib/workbench/planning/types';

	// ========================================================================
	// PROPS
	// ========================================================================

	interface Props {
		session: PlanningSession | null;
		streamingOutput: string;
	}

	let { session, streamingOutput }: Props = $props();

	// ========================================================================
	// DERIVED STATE
	// ========================================================================

	const hasDeliverable = $derived(!!session?.deliverable);
	const deliverable = $derived(session?.deliverable);
	const currentStage = $derived(session?.stages[session?.currentStageIndex || 0]);

	// ========================================================================
	// HANDLERS
	// ========================================================================

	function handleDownload() {
		planningStore.downloadDeliverables();
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text).catch(console.error);
	}
</script>

<!-- ======================================================================== -->
<!-- TEMPLATE -->
<!-- ======================================================================== -->

<div class="output-display">
	<h3>Output</h3>

	{#if !session}
		<!-- Empty State -->
		<div class="empty-state">
			<p>No active planning session. Start a new request to see output here.</p>
		</div>
	{:else if streamingOutput && session.status === 'active'}
		<!-- Streaming Output -->
		<div class="streaming-container">
			<div class="streaming-header">
				<span class="streaming-badge">
					<span class="pulse"></span>
					Streaming from {currentStage?.config.name || 'Unknown'}
				</span>
			</div>
			<pre class="output-content streaming">{streamingOutput}</pre>
		</div>
	{:else if hasDeliverable && deliverable}
		<!-- Deliverables -->
		<div class="deliverables">
			<div class="deliverable-header">
				<h4>Planning Complete! ✓</h4>
				<button class="download-btn" onclick={handleDownload}>
					Download Both Files
				</button>
			</div>

			<!-- Implementation Plan -->
			<div class="deliverable-section">
				<div class="section-header">
					<h5>📋 Implementation Plan</h5>
					<button
						class="copy-btn"
						onclick={() => copyToClipboard(deliverable.implementationPlan.content)}
					>
						Copy
					</button>
				</div>
				<div class="metadata">
					{#if deliverable.metadata.title}
						<div class="meta-item">
							<strong>Title:</strong>
							{deliverable.metadata.title}
						</div>
					{/if}
					{#if deliverable.metadata.estimatedTime}
						<div class="meta-item">
							<strong>Estimated Time:</strong>
							{deliverable.metadata.estimatedTime}
						</div>
					{/if}
					{#if deliverable.metadata.phases.length > 0}
						<div class="meta-item">
							<strong>Phases:</strong>
							{deliverable.metadata.phases.length}
						</div>
					{/if}
				</div>
				<pre class="output-content">{deliverable.implementationPlan.content.substring(
						0,
						1000
					)}{deliverable.implementationPlan.content.length > 1000 ? '\n\n... (truncated)' : ''}</pre>
				<div class="file-info">
					File: {deliverable.implementationPlan.filename} ({deliverable.implementationPlan.content.length.toLocaleString()} chars)
				</div>
			</div>

			<!-- Claude Code Prompt -->
			<div class="deliverable-section">
				<div class="section-header">
					<h5>🤖 Claude Code Prompt</h5>
					<button
						class="copy-btn"
						onclick={() => copyToClipboard(deliverable.claudeCodePrompt.content)}
					>
						Copy
					</button>
				</div>
				<pre class="output-content">{deliverable.claudeCodePrompt.content.substring(
						0,
						1000
					)}{deliverable.claudeCodePrompt.content.length > 1000 ? '\n\n... (truncated)' : ''}</pre>
				<div class="file-info">
					File: {deliverable.claudeCodePrompt.filename} ({deliverable.claudeCodePrompt.content.length.toLocaleString()} chars)
				</div>
			</div>
		</div>
	{:else if session.status === 'failed'}
		<!-- Error State -->
		<div class="error-state">
			<h4>Session Failed</h4>
			<p>{session.error || 'Unknown error occurred'}</p>
		</div>
	{:else if session.status === 'cancelled'}
		<!-- Cancelled State -->
		<div class="cancelled-state">
			<p>Session was cancelled. Restart to try again.</p>
		</div>
	{:else}
		<!-- Waiting State -->
		<div class="waiting-state">
			<p>Waiting for output...</p>
		</div>
	{/if}
</div>

<!-- ======================================================================== -->
<!-- STYLES -->
<!-- ======================================================================== -->

<style>
	.output-display {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 1.5rem;
	}

	h3 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		color: var(--color-text-primary);
	}

	h4 {
		margin: 0 0 0.75rem 0;
		font-size: 1.125rem;
		color: var(--color-text-primary);
	}

	h5 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.empty-state,
	.waiting-state,
	.cancelled-state {
		padding: 3rem 1.5rem;
		text-align: center;
		color: var(--color-text-secondary);
	}

	.error-state {
		padding: 2rem 1.5rem;
		background: var(--color-error-bg, #ffebee);
		border: 1px solid var(--color-error-border, #fcc);
		border-radius: 4px;
		color: var(--color-error-text, #c33);
	}

	.streaming-container {
		border: 1px solid var(--color-primary, #4a90e2);
		border-radius: 4px;
		overflow: hidden;
	}

	.streaming-header {
		padding: 0.75rem 1rem;
		background: var(--color-primary-bg, #e3f2fd);
		border-bottom: 1px solid var(--color-primary, #4a90e2);
	}

	.streaming-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary, #4a90e2);
	}

	.pulse {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--color-primary, #4a90e2);
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}

	.output-content {
		padding: 1rem;
		background: var(--color-surface-secondary, #f5f5f5);
		font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
		font-size: 0.75rem;
		line-height: 1.6;
		overflow-x: auto;
		white-space: pre-wrap;
		word-wrap: break-word;
		margin: 0;
		max-height: 400px;
		overflow-y: auto;
	}

	.output-content.streaming {
		border: none;
	}

	.deliverables {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.deliverable-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--color-success, #4caf50);
	}

	.download-btn {
		padding: 0.625rem 1.25rem;
		background: var(--color-success, #4caf50);
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.download-btn:hover {
		background: var(--color-success-hover, #45a049);
	}

	.deliverable-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.copy-btn {
		padding: 0.375rem 0.75rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.copy-btn:hover {
		background: var(--color-surface-hover, #f0f0f0);
		border-color: var(--color-primary, #4a90e2);
	}

	.metadata {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		padding: 0.75rem;
		background: var(--color-surface-secondary, #f5f5f5);
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.meta-item {
		color: var(--color-text-primary);
	}

	.meta-item strong {
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.file-info {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		font-style: italic;
	}
</style>
