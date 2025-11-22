<script lang="ts">
	/**
	 * OutputViewer component - Display LLM response with formatting
	 */

	import type { PromptRun } from '$lib/core/types';

	interface Props {
		run: PromptRun;
	}

	const { run }: Props = $props();

	// Simple markdown-like formatting (Phase 2 can use a full markdown library)
	function formatOutput(text: string): string {
		// For now, preserve whitespace and line breaks
		return text;
	}
</script>

<div class="output-viewer flex-1 overflow-y-auto p-4 bg-forge-blacksteel">
	{#if run.status === 'running'}
		<!-- Loading State -->
		<div class="flex items-center justify-center h-full text-slate-500">
			<div class="text-center">
				<svg
					class="w-12 h-12 mx-auto mb-4 animate-spin text-forge-ember"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					></path>
				</svg>
				<p class="text-base">Generating response...</p>
				<p class="text-sm text-slate-600 mt-1">Model: {run.modelId}</p>
			</div>
		</div>
	{:else if run.status === 'failed'}
		<!-- Error State -->
		<div class="flex items-center justify-center h-full text-red-400">
			<div class="text-center max-w-md">
				<svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
				<p class="text-base font-medium mb-2">Run Failed</p>
				{#if run.error}
					<p class="text-sm text-red-300">{run.error}</p>
				{/if}
			</div>
		</div>
	{:else if run.output}
		<!-- Success State - Display Output -->
		<div class="prose prose-invert prose-slate max-w-none">
			<pre
				class="whitespace-pre-wrap font-sans text-slate-200 text-base leading-relaxed">{formatOutput(run.output)}</pre>
		</div>
	{:else}
		<!-- Empty State -->
		<div class="flex items-center justify-center h-full text-slate-500">
			<div class="text-center">
				<svg class="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					></path>
				</svg>
				<p class="text-base">No output available</p>
			</div>
		</div>
	{/if}
</div>
