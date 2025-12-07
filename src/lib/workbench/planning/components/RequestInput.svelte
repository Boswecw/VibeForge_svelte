<!--
  Request Input Component
  Form for creating a new planning request
-->
<script lang="ts">
	import { planningStore } from '$lib/workbench/planning/stores/planning.svelte';
	import { licenseStore } from '$lib/core/stores/license.svelte';
	import type { RequestType, PipelineType } from '$lib/workbench/planning/types';
	import { PIPELINES, estimatePipelineCost } from '$lib/workbench/planning/types';

	// ========================================================================
	// STATE
	// ========================================================================

	let title = $state('');
	let description = $state('');
	let requestType = $state<RequestType>('feature');
	let pipelineType = $state<PipelineType>('default');
	let error = $state<string | null>(null);

	// ========================================================================
	// DERIVED STATE
	// ========================================================================

	const canSubmit = $derived(
		title.trim().length > 0 &&
			description.trim().length > 0 &&
			planningStore.canStartSession &&
			!planningStore.isRunning
	);

	const quotaRemaining = $derived(licenseStore.orchestratorQuotaRemaining);
	const selectedPipeline = $derived(PIPELINES[pipelineType]);
	const estimatedCost = $derived(selectedPipeline ? estimatePipelineCost(selectedPipeline) : 0);

	// ========================================================================
	// HANDLERS
	// ========================================================================

	async function handleSubmit() {
		error = null;

		// Validation
		if (!title.trim()) {
			error = 'Please enter a title';
			return;
		}

		if (!description.trim()) {
			error = 'Please enter a description';
			return;
		}

		if (!planningStore.canStartSession) {
			error = 'Cannot start session: upgrade to use orchestrator';
			return;
		}

		try {
			await planningStore.startSession(title.trim(), description.trim(), requestType, pipelineType);

			// Clear form on success
			title = '';
			description = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to start session';
		}
	}

	function handleReset() {
		title = '';
		description = '';
		requestType = 'feature';
		pipelineType = 'default';
		error = null;
	}
</script>

<!-- ======================================================================== -->
<!-- TEMPLATE -->
<!-- ======================================================================== -->

<div class="request-input">
	<h3>New Planning Request</h3>

	{#if planningStore.error}
		<div class="alert alert-error">
			{planningStore.error}
		</div>
	{/if}

	{#if error}
		<div class="alert alert-error">
			{error}
		</div>
	{/if}

	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
		<!-- Title -->
		<div class="form-group">
			<label for="title">
				Title <span class="required">*</span>
			</label>
			<input
				id="title"
				type="text"
				bind:value={title}
				placeholder="e.g., User Authentication System"
				disabled={planningStore.isRunning}
				maxlength={100}
			/>
			<small>{title.length}/100 characters</small>
		</div>

		<!-- Description -->
		<div class="form-group">
			<label for="description">
				Description <span class="required">*</span>
			</label>
			<textarea
				id="description"
				bind:value={description}
				placeholder="Describe what you want to build in detail..."
				disabled={planningStore.isRunning}
				rows={6}
				maxlength={2000}
			></textarea>
			<small>{description.length}/2000 characters</small>
		</div>

		<!-- Request Type -->
		<div class="form-group">
			<label for="request-type">Request Type</label>
			<select id="request-type" bind:value={requestType} disabled={planningStore.isRunning}>
				<option value="feature">New Feature</option>
				<option value="refactor">Refactor</option>
				<option value="bugfix">Bug Fix</option>
				<option value="enhancement">Enhancement</option>
			</select>
		</div>

		<!-- Pipeline Type -->
		<div class="form-group">
			<label for="pipeline-type">Planning Workflow</label>
			<select id="pipeline-type" bind:value={pipelineType} disabled={planningStore.isRunning}>
				<option value="quick">Quick (2 stages, ~3 min)</option>
				<option value="default">Default (4 stages, ~5 min)</option>
				<option value="deep">Deep (6 stages, ~10 min)</option>
			</select>
			{#if selectedPipeline}
				<small class="pipeline-info">
					{selectedPipeline.stages.length} stages • ~${estimatedCost.toFixed(2)} cost
				</small>
			{/if}
		</div>

		<!-- Quota Info -->
		{#if quotaRemaining !== null}
			<div class="quota-info">
				<span class="quota-label">Runs remaining this month:</span>
				<span class="quota-value">{quotaRemaining}</span>
			</div>
		{/if}

		<!-- Actions -->
		<div class="form-actions">
			<button type="button" onclick={handleReset} disabled={planningStore.isRunning}>
				Reset
			</button>
			<button type="submit" class="btn-primary" disabled={!canSubmit}>
				{planningStore.isRunning ? 'Running...' : 'Start Planning'}
			</button>
		</div>
	</form>
</div>

<!-- ======================================================================== -->
<!-- STYLES -->
<!-- ======================================================================== -->

<style>
	.request-input {
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

	.alert {
		padding: 0.75rem 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.alert-error {
		background: var(--color-error-bg, #fee);
		border: 1px solid var(--color-error-border, #fcc);
		color: var(--color-error-text, #c33);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-weight: 500;
		font-size: 0.875rem;
		color: var(--color-text-primary);
	}

	.required {
		color: var(--color-error, #c33);
	}

	input,
	textarea,
	select {
		padding: 0.625rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-size: 0.875rem;
		font-family: inherit;
		background: var(--color-input-bg, #fff);
		color: var(--color-text-primary);
		transition: border-color 0.2s;
	}

	input:focus,
	textarea:focus,
	select:focus {
		outline: none;
		border-color: var(--color-primary, #4a90e2);
	}

	input:disabled,
	textarea:disabled,
	select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	textarea {
		resize: vertical;
		min-height: 120px;
	}

	small {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.pipeline-info {
		display: block;
		margin-top: 0.25rem;
		color: var(--color-text-secondary);
	}

	.quota-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: var(--color-surface-secondary, #f5f5f5);
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.quota-label {
		color: var(--color-text-secondary);
	}

	.quota-value {
		font-weight: 600;
		color: var(--color-primary, #4a90e2);
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		margin-top: 0.5rem;
	}

	button {
		padding: 0.625rem 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		background: var(--color-surface);
		color: var(--color-text-primary);
		transition: all 0.2s;
	}

	button:hover:not(:disabled) {
		background: var(--color-surface-hover, #f0f0f0);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary {
		background: var(--color-primary, #4a90e2);
		color: white;
		border-color: var(--color-primary, #4a90e2);
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--color-primary-hover, #3a7bc8);
		border-color: var(--color-primary-hover, #3a7bc8);
	}
</style>
