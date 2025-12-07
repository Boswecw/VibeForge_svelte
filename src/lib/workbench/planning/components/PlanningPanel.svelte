<!--
  Planning Panel Component
  Main container for the Cortex Multi-AI Planning Orchestrator
-->
<script lang="ts">
	import { planningStore } from '$lib/workbench/planning/stores/planning.svelte';
	import RequestInput from './RequestInput.svelte';
	import ProgressTracker from './ProgressTracker.svelte';
	import StageCard from './StageCard.svelte';
	import OutputDisplay from './OutputDisplay.svelte';

	// ========================================================================
	// STATE
	// ========================================================================

	let activeTab = $state<'request' | 'stages' | 'output'>('request');

	// ========================================================================
	// DERIVED STATE
	// ========================================================================

	const currentSession = $derived(planningStore.currentSession);
	const isRunning = $derived(planningStore.isRunning);
	const isPaused = $derived(planningStore.isPaused);
	const progress = $derived(planningStore.progress);
	const streamingOutput = $derived(planningStore.streamingOutput);
	const currentStage = $derived(planningStore.currentStage);

	// Auto-switch tabs when session starts
	$effect(() => {
		if (isRunning && activeTab === 'request') {
			activeTab = 'stages';
		}
	});

	// ========================================================================
	// HANDLERS
	// ========================================================================

	function handlePause() {
		planningStore.pauseSession();
	}

	function handleResume() {
		planningStore.resumeSession();
	}

	function handleAbort() {
		if (confirm('Are you sure you want to abort this planning session?')) {
			planningStore.abortSession();
		}
	}

	function handleNewRequest() {
		activeTab = 'request';
	}
</script>

<!-- ======================================================================== -->
<!-- TEMPLATE -->
<!-- ======================================================================== -->

<div class="planning-panel">
	<!-- Header -->
	<div class="panel-header">
		<div class="header-title">
			<h2>🧠 Cortex Planning Orchestrator</h2>
			<p class="header-subtitle">Multi-AI collaborative planning powered by ChatGPT ↔ Claude</p>
		</div>
		{#if currentSession && isRunning}
			<div class="session-controls">
				{#if isPaused}
					<button class="control-btn resume" onclick={handleResume}>
						▶ Resume
					</button>
				{:else}
					<button class="control-btn pause" onclick={handlePause}>
						⏸ Pause
					</button>
				{/if}
				<button class="control-btn abort" onclick={handleAbort}>
					⏹ Abort
				</button>
			</div>
		{/if}
	</div>

	<!-- Progress Tracker (always visible when session exists) -->
	{#if currentSession}
		<ProgressTracker session={currentSession} {progress} />
	{/if}

	<!-- Tabs -->
	<div class="panel-tabs">
		<button
			class="tab"
			class:active={activeTab === 'request'}
			onclick={() => (activeTab = 'request')}
			disabled={isRunning}
		>
			New Request
		</button>
		<button
			class="tab"
			class:active={activeTab === 'stages'}
			onclick={() => (activeTab = 'stages')}
			disabled={!currentSession}
		>
			Stages {#if currentSession}({currentSession.stages.length}){/if}
		</button>
		<button
			class="tab"
			class:active={activeTab === 'output'}
			onclick={() => (activeTab = 'output')}
			disabled={!currentSession}
		>
			Output
		</button>
	</div>

	<!-- Tab Content -->
	<div class="panel-content">
		{#if activeTab === 'request'}
			<!-- Request Input -->
			<RequestInput />

			<!-- Recent Sessions -->
			{#if planningStore.sessions.length > 0}
				<div class="recent-sessions">
					<h3>Recent Sessions</h3>
					<div class="session-list">
						{#each planningStore.sessions.slice(0, 5) as session}
							<button
								class="session-item"
								onclick={() => planningStore.loadSession(session.id)}
							>
								<div class="session-item-title">{session.title}</div>
								<div class="session-item-meta">
									<span class="session-status status-{session.status}">{session.status}</span>
									<span class="session-date">
										{session.createdAt.toLocaleDateString()}
									</span>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		{:else if activeTab === 'stages'}
			<!-- Stage Cards -->
			<div class="stages-container">
				{#if currentSession}
					{#each currentSession.stages as stage, i}
						<StageCard
							{stage}
							index={i}
							isActive={i === currentSession.currentStageIndex}
							isStreaming={i === currentSession.currentStageIndex && isRunning}
							{streamingOutput}
						/>
					{/each}
				{/if}
			</div>
		{:else if activeTab === 'output'}
			<!-- Output Display -->
			<OutputDisplay session={currentSession} {streamingOutput} />
		{/if}
	</div>

	<!-- Session Statistics -->
	{#if planningStore.sessions.length > 0}
		<div class="panel-footer">
			<div class="footer-stats">
				<div class="stat">
					<span class="stat-value">{planningStore.totalSessions}</span>
					<span class="stat-label">Total</span>
				</div>
				<div class="stat">
					<span class="stat-value">{planningStore.completedSessions}</span>
					<span class="stat-label">Completed</span>
				</div>
				<div class="stat">
					<span class="stat-value">{planningStore.failedSessions}</span>
					<span class="stat-label">Failed</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- ======================================================================== -->
<!-- STYLES -->
<!-- ======================================================================== -->

<style>
	.planning-panel {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
		padding: 1.5rem;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.header-title h2 {
		margin: 0;
		font-size: 1.75rem;
		color: var(--color-text-primary);
	}

	.header-subtitle {
		margin: 0.5rem 0 0 0;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.session-controls {
		display: flex;
		gap: 0.75rem;
	}

	.control-btn {
		padding: 0.5rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.control-btn.pause {
		background: var(--color-warning, #ff9800);
		color: white;
		border-color: var(--color-warning, #ff9800);
	}

	.control-btn.resume {
		background: var(--color-success, #4caf50);
		color: white;
		border-color: var(--color-success, #4caf50);
	}

	.control-btn.abort {
		background: var(--color-error, #f44336);
		color: white;
		border-color: var(--color-error, #f44336);
	}

	.control-btn:hover {
		opacity: 0.9;
	}

	.panel-tabs {
		display: flex;
		gap: 0.5rem;
		border-bottom: 2px solid var(--color-border);
	}

	.tab {
		padding: 0.75rem 1.5rem;
		border: none;
		background: none;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		cursor: pointer;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		transition: all 0.2s;
	}

	.tab:hover:not(:disabled) {
		color: var(--color-text-primary);
	}

	.tab.active {
		color: var(--color-primary, #4a90e2);
		border-bottom-color: var(--color-primary, #4a90e2);
	}

	.tab:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.panel-content {
		min-height: 400px;
	}

	.stages-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.recent-sessions {
		margin-top: 2rem;
	}

	.recent-sessions h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		color: var(--color-text-primary);
	}

	.session-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.session-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
		width: 100%;
	}

	.session-item:hover {
		background: var(--color-surface-hover, #f0f0f0);
		border-color: var(--color-primary, #4a90e2);
	}

	.session-item-title {
		font-weight: 500;
		color: var(--color-text-primary);
	}

	.session-item-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.75rem;
	}

	.session-status {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-weight: 600;
		text-transform: uppercase;
	}

	.status-completed {
		background: var(--color-success-bg, #e8f5e9);
		color: var(--color-success, #4caf50);
	}

	.status-failed {
		background: var(--color-error-bg, #ffebee);
		color: var(--color-error, #f44336);
	}

	.status-active {
		background: var(--color-primary-bg, #e3f2fd);
		color: var(--color-primary, #4a90e2);
	}

	.session-date {
		color: var(--color-text-secondary);
	}

	.panel-footer {
		padding-top: 1.5rem;
		border-top: 2px solid var(--color-border);
	}

	.footer-stats {
		display: flex;
		justify-content: center;
		gap: 3rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.stat-label {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
</style>
