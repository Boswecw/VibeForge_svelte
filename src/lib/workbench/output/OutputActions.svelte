<script lang="ts">
	/**
	 * OutputActions component - Actions for output (Copy, Save, Compare)
	 */

	import type { PromptRun } from '$lib/core/types';

	interface Props {
		run: PromptRun;
	}

	const { run }: Props = $props();

	let copyButtonText = $state('Copy');

	async function handleCopy() {
		if (!run.output) return;

		try {
			await navigator.clipboard.writeText(run.output);
			copyButtonText = 'Copied!';
			setTimeout(() => {
				copyButtonText = 'Copy';
			}, 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
			alert('Failed to copy to clipboard');
		}
	}

	function handleSave() {
		if (!run.output) return;

		// Create a blob and download
		const blob = new Blob([run.output], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `output-${run.id}-${Date.now()}.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function handleCompare() {
		// Phase 2: Implement comparison view
		console.log('Compare outputs');
		alert('Compare functionality - Phase 2');
	}

	function handleRerun() {
		// Phase 2: Implement re-run with same prompt
		console.log('Re-run prompt');
		alert('Re-run functionality - Phase 2');
	}

	const hasOutput = $derived(!!run.output && run.status === 'completed');
</script>

<div
	class="output-actions flex items-center justify-between gap-3 px-4 py-3 bg-forge-gunmetal border-t border-slate-800"
>
	<div class="flex items-center gap-2">
		<!-- Copy Button -->
		<button
			onclick={handleCopy}
			disabled={!hasOutput}
			class="flex items-center gap-2 px-4 py-2 bg-forge-steel text-slate-300 rounded-lg hover:bg-slate-600 active:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
			title="Copy output to clipboard"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
				></path>
			</svg>
			{copyButtonText}
		</button>

		<!-- Save Button -->
		<button
			onclick={handleSave}
			disabled={!hasOutput}
			class="flex items-center gap-2 px-4 py-2 bg-forge-steel text-slate-300 rounded-lg hover:bg-slate-600 active:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
			title="Save output to file"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
				></path>
			</svg>
			Save
		</button>

		<!-- Compare Button -->
		<button
			onclick={handleCompare}
			class="p-2 bg-forge-steel text-slate-300 rounded-lg hover:bg-slate-600 active:bg-slate-700 transition-all duration-200"
			title="Compare with other runs"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
				></path>
			</svg>
		</button>
	</div>

	<!-- Re-run Button -->
	<button
		onclick={handleRerun}
		class="flex items-center gap-2 px-4 py-2 bg-forge-ember/10 text-forge-ember border border-forge-ember/30 rounded-lg hover:bg-forge-ember/20 transition-all duration-200 text-sm"
		title="Re-run with same prompt"
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
			></path>
		</svg>
		Re-run
	</button>
</div>
