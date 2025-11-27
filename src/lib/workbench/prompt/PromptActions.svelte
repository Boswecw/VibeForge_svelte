<script lang="ts">
	/**
	 * PromptActions component - Primary action buttons for prompts
	 * Run, Save, Clear, and template management
	 */

	import { promptStore, modelsStore, runsStore } from '$lib/core/stores';
	import { analysisStore } from '../stores/analysis.svelte';
	import { editorAnalyzer } from '$lib/refactoring/analyzer/EditorAnalyzer';
	import Button from '$lib/ui/primitives/Button.svelte';

	interface Props {
		onrun?: () => void;
	}

	const { onrun }: Props = $props();

	const isEmpty = $derived(promptStore.isEmpty);
	const selectedCount = $derived(modelsStore.selectedCount);
	const isExecuting = $derived(runsStore.isExecuting);
	const isAnalyzing = $derived(analysisStore.isAnalyzing);

	const canRun = $derived(!isEmpty && selectedCount > 0 && !isExecuting);
	const canAnalyze = $derived(!isEmpty && !isAnalyzing);

	function handleRun() {
		if (!canRun) return;
		onrun?.();
	}

	function handleSave() {
		// Phase 2: Implement save to templates
		console.log('Save prompt as template');
		alert('Save prompt functionality - Phase 2');
	}

	function handleClear() {
		if (confirm('Clear the current prompt?')) {
			promptStore.clearText();
		}
	}

	function handleLoadTemplate() {
		// Phase 2: Implement template loading
		console.log('Load template');
		alert('Load template functionality - Phase 2');
	}

	async function handleAnalyze() {
		if (!canAnalyze) return;

		analysisStore.setAnalyzing(true);

		try {
			const analysis = await editorAnalyzer.analyzeSingleFile({
				content: promptStore.text,
				filename: 'prompt.md',
				language: 'markdown'
			});

			analysisStore.setAnalysis(analysis);
		} catch (error) {
			console.error('Analysis failed:', error);
			analysisStore.setError(error instanceof Error ? error.message : 'Analysis failed');
		}
	}
</script>

<div class="prompt-actions flex items-center gap-3 p-4 bg-forge-gunmetal border-t border-slate-800">
	<!-- Primary Action: Run -->
	<button
		onclick={handleRun}
		disabled={!canRun}
		class="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-forge-ember text-forge-blacksteel font-medium rounded-lg hover:bg-amber-500 active:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
	>
		{#if isExecuting}
			<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
				></path>
			</svg>
			Running...
		{:else}
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
				></path>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
			Run
			{#if selectedCount > 1}
				<span class="text-xs opacity-75">({selectedCount} models)</span>
			{/if}
		{/if}
	</button>

	<!-- Secondary Actions -->
	<div class="flex items-center gap-2">
		<!-- Analyze Code -->
		<button
			onclick={handleAnalyze}
			disabled={!canAnalyze}
			class="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-medium"
			title="Analyze code quality"
		>
			{#if isAnalyzing}
				<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					></path>
				</svg>
			{:else}
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
					></path>
				</svg>
			{/if}
			Analyze
		</button>

		<!-- Save as Template -->
		<button
			onclick={handleSave}
			disabled={isEmpty}
			class="p-3 bg-forge-steel text-slate-300 rounded-lg hover:bg-slate-600 active:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
			title="Save as template"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
				></path>
			</svg>
		</button>

		<!-- Load Template -->
		<button
			onclick={handleLoadTemplate}
			class="p-3 bg-forge-steel text-slate-300 rounded-lg hover:bg-slate-600 active:bg-slate-700 transition-all duration-200"
			title="Load template"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				></path>
			</svg>
		</button>

		<!-- Clear -->
		<button
			onclick={handleClear}
			disabled={isEmpty}
			class="p-3 bg-forge-steel text-slate-300 rounded-lg hover:bg-red-600/20 hover:text-red-400 active:bg-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
			title="Clear prompt"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
				></path>
			</svg>
		</button>
	</div>
</div>
