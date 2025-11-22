<script lang="ts">
	/**
	 * OutputColumn component - Main container for output display
	 * Right column of the 3-column workbench layout
	 */

	import { runsStore } from '$lib/core/stores';
	import SectionHeader from '$lib/ui/primitives/SectionHeader.svelte';
	import OutputViewer from './OutputViewer.svelte';
	import RunMetadata from './RunMetadata.svelte';
	import OutputActions from './OutputActions.svelte';

	const runs = $derived(runsStore.runs);
	const activeRun = $derived(runsStore.activeRun);
	const latestRun = $derived(runsStore.latestRun);

	// Display active run or latest run
	const displayRun = $derived(activeRun || latestRun);

	// Show run selector if multiple runs
	let showRunSelector = $state(false);

	function handleSelectRun(runId: string) {
		runsStore.setActiveRun(runId);
		showRunSelector = false;
	}
</script>

<div class="output-column flex flex-col h-full bg-forge-blacksteel">
	<!-- Column Header -->
	<div class="shrink-0 p-4 border-b border-slate-800">
		<SectionHeader title="Output" description="View and manage LLM responses" level={2}>
			{#snippet actions()}
				{#if runs.length > 1}
					<button
						onclick={() => (showRunSelector = !showRunSelector)}
						class="px-3 py-1.5 text-sm rounded-md bg-forge-steel text-slate-300 hover:bg-slate-600 transition-colors flex items-center gap-2"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
						History ({runs.length})
					</button>
				{/if}
			{/snippet}
		</SectionHeader>

		<!-- Run Selector Dropdown -->
		{#if showRunSelector && runs.length > 1}
			<div class="mt-3 bg-forge-gunmetal border border-slate-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
				{#each runs.slice(0, 10) as run}
					<button
						onclick={() => handleSelectRun(run.id)}
						class="w-full px-3 py-2 flex items-center justify-between hover:bg-forge-steel transition-colors text-left border-b border-slate-800 last:border-b-0"
					>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<span class="text-sm text-slate-200">{run.modelId}</span>
								<span
									class="px-1.5 py-0.5 text-xs rounded capitalize {run.status === 'completed'
										? 'bg-emerald-500/20 text-emerald-400'
										: run.status === 'failed'
											? 'bg-red-500/20 text-red-400'
											: 'bg-amber-500/20 text-amber-400'}"
								>
									{run.status}
								</span>
							</div>
							<div class="text-xs text-slate-500 mt-0.5">
								{run.createdAt.toLocaleTimeString()}
								{#if run.metrics?.totalTokens}
									• {run.metrics.totalTokens} tokens
								{/if}
							</div>
						</div>

						{#if displayRun?.id === run.id}
							<svg class="w-4 h-4 text-forge-ember shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								></path>
							</svg>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Content Area -->
	<div class="flex-1 flex flex-col overflow-hidden">
		{#if displayRun}
			<!-- Run Metadata -->
			<div class="shrink-0 p-4">
				<RunMetadata run={displayRun} />
			</div>

			<!-- Output Viewer (scrollable) -->
			<div class="flex-1 overflow-hidden flex flex-col">
				<OutputViewer run={displayRun} />
			</div>

			<!-- Output Actions -->
			<div class="shrink-0">
				<OutputActions run={displayRun} />
			</div>
		{:else}
			<!-- Empty State -->
			<div class="flex-1 flex items-center justify-center text-slate-500">
				<div class="text-center">
					<svg class="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						></path>
					</svg>
					<p class="text-base mb-2">No output yet</p>
					<p class="text-sm text-slate-600">Run a prompt to see the results here</p>
				</div>
			</div>
		{/if}
	</div>
</div>
