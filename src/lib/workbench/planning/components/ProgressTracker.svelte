<!--
  Progress Tracker Component
  Visual progress indicator showing session completion status
-->
<script lang="ts">
	import type { PlanningSession } from '$lib/workbench/planning/types';

	// ========================================================================
	// PROPS
	// ========================================================================

	interface Props {
		session: PlanningSession | null;
		progress: number; // 0-100
	}

	let { session, progress }: Props = $props();

	// ========================================================================
	// DERIVED STATE
	// ========================================================================

	const stages = $derived(session?.stages || []);
	const totalStages = $derived(stages.length);
	const completedStages = $derived(
		stages.filter((s) => s.status === 'completed').length
	);
	const currentStageIndex = $derived(session?.currentStageIndex ?? -1);

	const statusText = $derived.by(() => {
		if (!session) return 'No session';
		switch (session.status) {
			case 'active':
				return 'In Progress';
			case 'paused':
				return 'Paused';
			case 'completed':
				return 'Completed';
			case 'failed':
				return 'Failed';
			case 'cancelled':
				return 'Cancelled';
			default:
				return 'Unknown';
		}
	});

	const statusClass = $derived.by(() => {
		if (!session) return '';
		switch (session.status) {
			case 'active':
				return 'status-active';
			case 'paused':
				return 'status-paused';
			case 'completed':
				return 'status-completed';
			case 'failed':
				return 'status-failed';
			case 'cancelled':
				return 'status-cancelled';
			default:
				return '';
		}
	});
</script>

<!-- ======================================================================== -->
<!-- TEMPLATE -->
<!-- ======================================================================== -->

<div class="progress-tracker">
	<!-- Header -->
	<div class="progress-header">
		<div class="progress-title">
			{#if session}
				<h3>{session.title}</h3>
				<span class="status-badge {statusClass}">{statusText}</span>
			{:else}
				<h3>No Active Session</h3>
			{/if}
		</div>
		{#if session}
			<div class="progress-stats">
				<span class="stat">
					{completedStages}/{totalStages} Stages
				</span>
				<span class="stat">{Math.round(progress)}% Complete</span>
			</div>
		{/if}
	</div>

	<!-- Progress Bar -->
	{#if session}
		<div class="progress-bar-container">
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progress}%"></div>
			</div>
		</div>

		<!-- Stage Steps -->
		<div class="progress-steps">
			{#each stages as stage, i}
				<div
					class="progress-step"
					class:active={i === currentStageIndex}
					class:completed={stage.status === 'completed'}
					class:failed={stage.status === 'failed'}
				>
					<div class="step-marker">
						{#if stage.status === 'completed'}
							<span class="step-icon">✓</span>
						{:else if stage.status === 'failed'}
							<span class="step-icon">✗</span>
						{:else if i === currentStageIndex}
							<span class="step-icon running">⟳</span>
						{:else}
							<span class="step-number">{i + 1}</span>
						{/if}
					</div>
					<div class="step-label">{stage.config.name}</div>
				</div>
			{/each}
		</div>

		<!-- Session Info -->
		<div class="session-info">
			{#if session.totalTokens > 0}
				<div class="info-item">
					<span class="info-label">Total Tokens:</span>
					<span class="info-value">{session.totalTokens.toLocaleString()}</span>
				</div>
			{/if}
			{#if session.totalCost > 0}
				<div class="info-item">
					<span class="info-label">Total Cost:</span>
					<span class="info-value">${session.totalCost.toFixed(4)}</span>
				</div>
			{/if}
			{#if session.startedAt}
				<div class="info-item">
					<span class="info-label">Started:</span>
					<span class="info-value">
						{session.startedAt.toLocaleTimeString()}
					</span>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- ======================================================================== -->
<!-- STYLES -->
<!-- ======================================================================== -->

<style>
	.progress-tracker {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
	}

	.progress-title {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	h3 {
		margin: 0;
		font-size: 1.25rem;
		color: var(--color-text-primary);
	}

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.625rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-active {
		background: var(--color-primary-bg, #e3f2fd);
		color: var(--color-primary, #4a90e2);
	}

	.status-paused {
		background: var(--color-warning-bg, #fff3e0);
		color: var(--color-warning, #ff9800);
	}

	.status-completed {
		background: var(--color-success-bg, #e8f5e9);
		color: var(--color-success, #4caf50);
	}

	.status-failed {
		background: var(--color-error-bg, #ffebee);
		color: var(--color-error, #f44336);
	}

	.status-cancelled {
		background: var(--color-surface-secondary, #f5f5f5);
		color: var(--color-text-secondary, #999);
	}

	.progress-stats {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.25rem;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.progress-bar-container {
		margin-bottom: 1.5rem;
	}

	.progress-bar {
		height: 8px;
		background: var(--color-surface-secondary, #f0f0f0);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(
			90deg,
			var(--color-primary, #4a90e2),
			var(--color-primary-light, #64b5f6)
		);
		transition: width 0.3s ease;
	}

	.progress-steps {
		display: flex;
		justify-content: space-between;
		margin-bottom: 1.5rem;
		gap: 0.5rem;
	}

	.progress-step {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.step-marker {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		border: 2px solid var(--color-border);
		background: var(--color-surface);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		transition: all 0.2s;
	}

	.progress-step.active .step-marker {
		border-color: var(--color-primary, #4a90e2);
		background: var(--color-primary, #4a90e2);
		color: white;
	}

	.progress-step.completed .step-marker {
		border-color: var(--color-success, #4caf50);
		background: var(--color-success, #4caf50);
		color: white;
	}

	.progress-step.failed .step-marker {
		border-color: var(--color-error, #f44336);
		background: var(--color-error, #f44336);
		color: white;
	}

	.step-icon {
		font-size: 1.125rem;
		line-height: 1;
	}

	.step-icon.running {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.step-number {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.step-label {
		font-size: 0.75rem;
		text-align: center;
		color: var(--color-text-secondary);
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.progress-step.active .step-label {
		color: var(--color-primary, #4a90e2);
		font-weight: 600;
	}

	.session-info {
		display: flex;
		gap: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.875rem;
	}

	.info-item {
		display: flex;
		gap: 0.5rem;
	}

	.info-label {
		color: var(--color-text-secondary);
	}

	.info-value {
		font-weight: 600;
		color: var(--color-text-primary);
	}
</style>
