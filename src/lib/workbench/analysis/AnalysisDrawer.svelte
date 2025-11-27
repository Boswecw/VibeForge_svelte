<script lang="ts">
	import { analysisStore } from '../stores/analysis.svelte';
	import AnalysisSummary from './AnalysisSummary.svelte';
	import IssueList from './IssueList.svelte';

	interface Props {
		onClose?: () => void;
		onGeneratePlan?: () => void;
		onAddFeature?: () => void;
	}

	let { onClose, onGeneratePlan, onAddFeature }: Props = $props();

	const analysis = $derived(analysisStore.current);
	const isOpen = $derived(analysisStore.drawerOpen);
	const isMinimized = $derived(analysisStore.drawerMinimized);

	function handleIssueClick(issue: any) {
		analysisStore.selectIssue(issue);
		// TODO: Jump to line in editor
	}
</script>

{#if isOpen && analysis}
	<div
		class="analysis-drawer border-t border-slate-700 bg-forge-blacksteel transition-all duration-300"
		class:minimized={isMinimized}
	>
		<!-- Header -->
		<div class="flex items-center justify-between px-4 py-2 border-b border-slate-700">
			<div class="flex items-center gap-3">
				<span class="text-sm font-medium text-slate-200">Analysis Results</span>
				<AnalysisSummary summary={analysis.summary} compact />
			</div>
			<div class="flex items-center gap-1">
				<button
					onclick={() => analysisStore.toggleMinimize()}
					class="p-1 hover:bg-slate-700 rounded text-slate-300"
					title={isMinimized ? 'Expand' : 'Minimize'}
				>
					{isMinimized ? '▲' : '▼'}
				</button>
				<button
					onclick={onClose}
					class="p-1 hover:bg-slate-700 rounded text-slate-300"
					title="Close"
				>
					✕
				</button>
			</div>
		</div>

		<!-- Content (hidden when minimized) -->
		{#if !isMinimized}
			<div class="flex-1 overflow-auto p-4 max-h-64">
				<IssueList issues={analysis.issues} onIssueClick={handleIssueClick} />
			</div>

			<!-- Actions -->
			<div class="flex items-center gap-3 px-4 py-3 border-t border-slate-700">
				<button
					class="px-4 py-2 bg-forge-ember text-white rounded-lg hover:bg-forge-ember/90 transition-colors"
					onclick={onGeneratePlan}
				>
					Generate Fix Plan
				</button>
				<button
					class="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
					onclick={onAddFeature}
				>
					Add Feature...
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.analysis-drawer {
		display: flex;
		flex-direction: column;
	}

	.analysis-drawer.minimized {
		max-height: 3rem;
	}
</style>
