<script lang="ts">
	/**
	 * ExecutionHistory component - Shows recent prompt execution history
	 * Displays execution results with status, cost, latency, and timestamp
	 */

	import Tag from '$lib/ui/primitives/Tag.svelte';
	import Button from '$lib/ui/primitives/Button.svelte';

	interface ExecutionRecord {
		id: string;
		timestamp: string;
		model: string;
		status: 'success' | 'error' | 'pending';
		cost: number;
		tokens: number;
		latency: number; // in ms
		errorMessage?: string;
	}

	// Mock data - in production this would come from a store
	const executions = $state<ExecutionRecord[]>([
		{
			id: '1',
			timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
			model: 'gpt-4',
			status: 'success',
			cost: 0.045,
			tokens: 1500,
			latency: 2340,
		},
		{
			id: '2',
			timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
			model: 'claude-3.5-sonnet',
			status: 'success',
			cost: 0.032,
			tokens: 1200,
			latency: 1850,
		},
		{
			id: '3',
			timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
			model: 'gpt-4',
			status: 'error',
			cost: 0.002,
			tokens: 150,
			latency: 450,
			errorMessage: 'Context length exceeded',
		},
	]);

	// Calculate aggregate metrics
	const totalExecutions = $derived(executions.length);
	const successfulExecutions = $derived(executions.filter(e => e.status === 'success').length);
	const successRate = $derived(
		totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0
	);
	const totalCost = $derived(
		executions.reduce((sum, e) => sum + e.cost, 0)
	);
	const avgLatency = $derived(
		totalExecutions > 0
			? Math.round(executions.reduce((sum, e) => sum + e.latency, 0) / totalExecutions)
			: 0
	);

	function formatTime(isoString: string): string {
		const date = new Date(isoString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		return date.toLocaleDateString();
	}

	function formatCost(cost: number): string {
		return `$${cost.toFixed(3)}`;
	}

	function formatLatency(ms: number): string {
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(1)}s`;
	}

	function formatTokens(count: number): string {
		if (count >= 1000) {
			return `${(count / 1000).toFixed(1)}k`;
		}
		return count.toString();
	}

	function handleViewDetails(id: string) {
		console.log('View execution details:', id);
		// TODO: Open execution details modal
	}

	function handleClearHistory() {
		if (confirm('Clear all execution history?')) {
			// TODO: Clear history
			console.log('Clear history');
		}
	}
</script>

<div class="execution-history bg-forge-gunmetal rounded-lg border border-slate-700">
	<!-- Header -->
	<div class="p-4 border-b border-slate-800 flex items-center justify-between">
		<div>
			<h3 class="text-sm font-semibold text-slate-100">Execution History</h3>
			<p class="text-xs text-slate-500 mt-0.5">{totalExecutions} recent runs</p>
		</div>
		<Button variant="ghost" size="sm" onclick={handleClearHistory}>
			{#snippet children()}
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
				</svg>
				Clear
			{/snippet}
		</Button>
	</div>

	<!-- Aggregate Stats -->
	<div class="grid grid-cols-3 gap-3 p-4 border-b border-slate-800">
		<div class="bg-forge-blacksteel rounded-lg p-3 border border-slate-800">
			<div class="text-xs text-slate-500 mb-1">Success Rate</div>
			<div class="text-lg font-semibold {successRate >= 80 ? 'text-green-400' : successRate >= 60 ? 'text-yellow-400' : 'text-red-400'}">
				{successRate}%
			</div>
		</div>

		<div class="bg-forge-blacksteel rounded-lg p-3 border border-slate-800">
			<div class="text-xs text-slate-500 mb-1">Total Cost</div>
			<div class="text-lg font-semibold text-amber-400">{formatCost(totalCost)}</div>
		</div>

		<div class="bg-forge-blacksteel rounded-lg p-3 border border-slate-800">
			<div class="text-xs text-slate-500 mb-1">Avg Latency</div>
			<div class="text-lg font-semibold text-blue-400">{formatLatency(avgLatency)}</div>
		</div>
	</div>

	<!-- Execution List -->
	<div class="max-h-96 overflow-y-auto">
		{#if executions.length > 0}
			<div class="divide-y divide-slate-800">
				{#each executions as execution (execution.id)}
					<button
						onclick={() => handleViewDetails(execution.id)}
						class="w-full p-4 hover:bg-slate-800/50 transition-colors text-left"
					>
						<div class="flex items-start justify-between gap-3">
							<div class="flex-1 min-w-0">
								<!-- Header -->
								<div class="flex items-center gap-2 mb-1">
									<Tag variant={execution.status === 'success' ? 'success' : execution.status === 'error' ? 'error' : 'default'} size="sm">
										{#snippet children()}
											{execution.status}
										{/snippet}
									</Tag>
									<span class="text-xs text-slate-500">{execution.model}</span>
									<span class="text-xs text-slate-600">•</span>
									<span class="text-xs text-slate-500">{formatTime(execution.timestamp)}</span>
								</div>

								<!-- Error message -->
								{#if execution.errorMessage}
									<p class="text-xs text-red-400 mt-1">{execution.errorMessage}</p>
								{/if}

								<!-- Metrics -->
								<div class="flex items-center gap-4 mt-2 text-xs text-slate-500">
									<span class="flex items-center gap-1">
										<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
										</svg>
										{formatTokens(execution.tokens)}
									</span>
									<span class="flex items-center gap-1">
										<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
											<path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path>
											<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"></path>
										</svg>
										{formatCost(execution.cost)}
									</span>
									<span class="flex items-center gap-1">
										<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
											<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
										</svg>
										{formatLatency(execution.latency)}
									</span>
								</div>
							</div>

							<!-- Chevron -->
							<svg class="w-5 h-5 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
							</svg>
						</div>
					</button>
				{/each}
			</div>
		{:else}
			<div class="p-8 text-center text-slate-500">
				<svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
				</svg>
				<p class="text-sm">No execution history yet</p>
				<p class="text-xs mt-1">Run a prompt to see execution metrics</p>
			</div>
		{/if}
	</div>
</div>
