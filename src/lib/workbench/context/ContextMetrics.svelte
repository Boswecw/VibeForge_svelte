<script lang="ts">
	/**
	 * ContextMetrics component - Display context usage analytics
	 * Shows aggregate metrics for context blocks
	 */

	import { contextBlocksStore } from '$lib/core/stores';
	import Tag from '$lib/ui/primitives/Tag.svelte';

	// Calculate metrics
	const totalBlocks = $derived(contextBlocksStore.blocks.length);
	const activeBlocks = $derived(contextBlocksStore.activeBlocks.length);
	const totalTokens = $derived(contextBlocksStore.totalActiveTokens);
	
	// Cost estimation (GPT-4: $0.03/1K input tokens)
	const estimatedCost = $derived((totalTokens / 1000) * 0.03);
	
	// Context efficiency (percentage of blocks active)
	const efficiency = $derived(
		totalBlocks > 0 ? Math.round((activeBlocks / totalBlocks) * 100) : 0
	);

	// Group by kind for breakdown
	const blocksByKind = $derived(contextBlocksStore.blocksByKind);
	const activeByKind = $derived(
		Object.entries(blocksByKind).map(([kind, blocks]) => ({
			kind,
			total: blocks.length,
			active: blocks.filter(b => b.isActive).length,
			tokens: blocks
				.filter(b => b.isActive)
				.reduce((sum, b) => sum + Math.ceil(b.content.length / 4), 0)
		}))
		.filter(item => item.active > 0)
		.sort((a, b) => b.tokens - a.tokens)
	);

	function formatTokens(count: number): string {
		if (count >= 1000) {
			return `${(count / 1000).toFixed(1)}k`;
		}
		return count.toString();
	}

	function formatCost(cost: number): string {
		if (cost < 0.001) return '<$0.001';
		if (cost < 0.01) return `$${cost.toFixed(3)}`;
		return `$${cost.toFixed(2)}`;
	}

	const kindColors: Record<string, 'primary' | 'info' | 'warning' | 'success' | 'default'> = {
		system: 'primary',
		design: 'info',
		project: 'warning',
		code: 'success',
		workflow: 'default',
		data: 'default'
	};
</script>

<div class="context-metrics bg-forge-gunmetal rounded-lg border border-slate-700 p-4 space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-semibold text-slate-100">Context Analytics</h3>
		<Tag variant={efficiency >= 70 ? 'success' : efficiency >= 40 ? 'warning' : 'default'} size="sm">
			{#snippet children()}
				{efficiency}% efficiency
			{/snippet}
		</Tag>
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-3 gap-3">
		<div class="bg-forge-blacksteel rounded-lg p-3 border border-slate-800">
			<div class="text-xs text-slate-500 mb-1">Active Blocks</div>
			<div class="text-xl font-semibold text-forge-ember">{activeBlocks}</div>
			<div class="text-xs text-slate-500">of {totalBlocks}</div>
		</div>

		<div class="bg-forge-blacksteel rounded-lg p-3 border border-slate-800">
			<div class="text-xs text-slate-500 mb-1">Total Tokens</div>
			<div class="text-xl font-semibold text-blue-400">{formatTokens(totalTokens)}</div>
			<div class="text-xs text-slate-500">~{totalTokens} tokens</div>
		</div>

		<div class="bg-forge-blacksteel rounded-lg p-3 border border-slate-800">
			<div class="text-xs text-slate-500 mb-1">Est. Cost</div>
			<div class="text-xl font-semibold text-amber-400">{formatCost(estimatedCost)}</div>
			<div class="text-xs text-slate-500">per request</div>
		</div>
	</div>

	<!-- Breakdown by Kind -->
	{#if activeByKind.length > 0}
		<div class="space-y-2">
			<h4 class="text-xs font-medium text-slate-400 uppercase tracking-wide">Breakdown by Type</h4>
			<div class="space-y-2">
				{#each activeByKind as item (item.kind)}
					<div class="flex items-center justify-between text-sm">
						<div class="flex items-center gap-2">
							<Tag variant={kindColors[item.kind] || 'default'} size="sm">
								{#snippet children()}
									{item.kind}
								{/snippet}
							</Tag>
							<span class="text-slate-400">{item.active} / {item.total}</span>
						</div>
						<div class="flex items-center gap-3 text-slate-500">
							<span class="flex items-center gap-1">
								<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
								</svg>
								{formatTokens(item.tokens)}
							</span>
							<span class="flex items-center gap-1">
								<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
									<path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path>
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"></path>
								</svg>
								{formatCost((item.tokens / 1000) * 0.03)}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Tips -->
	<div class="pt-3 border-t border-slate-800">
		<div class="flex items-start gap-2 text-xs text-slate-500">
			<svg class="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
			</svg>
			<p>
				{#if efficiency < 40}
					Consider activating more context blocks or removing unused ones to improve efficiency.
				{:else if totalTokens > 4000}
					High token usage may increase costs. Consider optimizing context blocks.
				{:else}
					Context usage is optimal. Toggle blocks to include/exclude them from execution.
				{/if}
			</p>
		</div>
	</div>
</div>
