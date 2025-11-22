<script lang="ts">
	/**
	 * StatusBar component - Displays workspace metrics, tokens, latency, models, and run state
	 */

	import { modelsStore, runsStore, contextBlocksStore } from '$lib/core/stores';
	import Tag from '$lib/ui/primitives/Tag.svelte';

	// Derived values from stores
	const selectedModels = $derived(modelsStore.selectedModels);
	const selectedCount = $derived(modelsStore.selectedCount);
	const activeRun = $derived(runsStore.activeRun);
	const isExecuting = $derived(runsStore.isExecuting);
	const executionProgress = $derived(runsStore.executionProgress);
	const totalActiveTokens = $derived(contextBlocksStore.totalActiveTokens);
	const latestRun = $derived(runsStore.latestRun);

	// Format numbers with commas
	function formatNumber(num: number): string {
		return num.toLocaleString();
	}

	// Format duration in ms to readable string
	function formatDuration(ms: number): string {
		if (ms < 1000) return `${ms}ms`;
		if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
		return `${(ms / 60000).toFixed(1)}m`;
	}
</script>

<footer class="statusbar bg-forge-blacksteel border-t border-slate-800">
	<div class="flex items-center justify-between h-8 px-4 text-xs">
		<!-- Left: Run Status -->
		<div class="flex items-center gap-4">
			{#if isExecuting}
				<div class="flex items-center gap-2 text-forge-ember">
					<div class="w-2 h-2 bg-forge-ember rounded-full animate-pulse"></div>
					<span class="font-medium">Running... {executionProgress}%</span>
				</div>
			{:else if latestRun}
				<div class="flex items-center gap-2 text-slate-400">
					{#if latestRun.status === 'success'}
						<svg class="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
						</svg>
						<span>Last run: {formatDuration(latestRun.durationMs || 0)}</span>
					{:else if latestRun.status === 'error'}
						<svg class="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
						</svg>
						<span class="text-red-400">Run failed</span>
					{/if}
				</div>
			{:else}
				<div class="text-slate-500">Ready</div>
			{/if}

			<!-- Token Count -->
			{#if totalActiveTokens > 0}
				<div class="flex items-center gap-1.5 text-slate-400">
					<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
					</svg>
					<span>{formatNumber(totalActiveTokens)} tokens</span>
				</div>
			{/if}
		</div>

		<!-- Center: Active Models -->
		<div class="flex items-center gap-2">
			{#if selectedCount > 0}
				<span class="text-slate-500">Models:</span>
				<div class="flex items-center gap-1.5">
					{#each selectedModels.slice(0, 3) as model}
						<Tag variant="primary" size="sm">
							{#snippet children()}
								{model.name}
							{/snippet}
						</Tag>
					{/each}
					{#if selectedCount > 3}
						<Tag variant="default" size="sm">
							{#snippet children()}
								+{selectedCount - 3}
							{/snippet}
						</Tag>
					{/if}
				</div>
			{:else}
				<span class="text-slate-500">No models selected</span>
			{/if}
		</div>

		<!-- Right: Metrics -->
		<div class="flex items-center gap-4 text-slate-400">
			{#if latestRun}
				<!-- Total Tokens -->
				{#if latestRun.totalTokens}
					<div class="flex items-center gap-1.5">
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
						</svg>
						<span>{formatNumber(latestRun.totalTokens)}</span>
					</div>
				{/if}

				<!-- Latency -->
				{#if latestRun.durationMs}
					<div class="flex items-center gap-1.5">
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						<span>{latestRun.durationMs}ms</span>
					</div>
				{/if}

				<!-- Cost -->
				{#if latestRun.cost}
					<div class="flex items-center gap-1.5">
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						<span>${latestRun.cost.toFixed(4)}</span>
					</div>
				{/if}
			{/if}

			<!-- Connection Status -->
			<div class="flex items-center gap-1.5">
				<div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
				<span>Connected</span>
			</div>
		</div>
	</div>
</footer>
