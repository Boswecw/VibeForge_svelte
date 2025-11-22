<script lang="ts">
	/**
	 * WorkbenchShell component - 3-column responsive container
	 * Layout: Context Column | Prompt Column | Output Column
	 */

	interface Props {
		contextColumn?: import('svelte').Snippet;
		promptColumn?: import('svelte').Snippet;
		outputColumn?: import('svelte').Snippet;
	}

	const { contextColumn, promptColumn, outputColumn }: Props = $props();

	// Column visibility state (for responsive behavior)
	let showContext = $state(true);
	let showPrompt = $state(true);
	let showOutput = $state(true);

	// Column width distribution
	// Default: Context 25% | Prompt 40% | Output 35%
	// Can be enhanced with resizable panels in Phase 2
</script>

<div class="workbench-shell flex flex-1 overflow-hidden bg-forge-blacksteel">
	<!-- Context Column (Left) -->
	{#if showContext}
		<div class="context-column w-1/4 min-w-[300px] max-w-[400px] border-r border-slate-800 flex flex-col overflow-hidden">
			{#if contextColumn}
				{@render contextColumn()}
			{:else}
				<div class="flex items-center justify-center h-full text-slate-500">
					Context Column
				</div>
			{/if}
		</div>
	{/if}

	<!-- Prompt Column (Center) -->
	{#if showPrompt}
		<div class="prompt-column flex-1 min-w-[400px] border-r border-slate-800 flex flex-col overflow-hidden">
			{#if promptColumn}
				{@render promptColumn()}
			{:else}
				<div class="flex items-center justify-center h-full text-slate-500">
					Prompt Column
				</div>
			{/if}
		</div>
	{/if}

	<!-- Output Column (Right) -->
	{#if showOutput}
		<div class="output-column flex-1 min-w-[400px] flex flex-col overflow-hidden">
			{#if outputColumn}
				{@render outputColumn()}
			{:else}
				<div class="flex items-center justify-center h-full text-slate-500">
					Output Column
				</div>
			{/if}
		</div>
	{/if}

	<!-- Column Toggle Controls (for responsive/collapsed states) -->
	<!-- This is a placeholder for Phase 2 enhancements -->
	<!--
	<div class="absolute top-4 right-4 flex gap-2">
		<button onclick={() => showContext = !showContext}>Context</button>
		<button onclick={() => showPrompt = !showPrompt}>Prompt</button>
		<button onclick={() => showOutput = !showOutput}>Output</button>
	</div>
	-->
</div>

<style>
	.workbench-shell {
		/* Ensure the shell takes full available height */
		height: calc(100vh - 3.5rem - 2rem); /* 100vh - topbar - statusbar */
	}

	/* Responsive breakpoints for smaller screens */
	@media (max-width: 1280px) {
		.context-column {
			width: 20%;
			min-width: 250px;
		}
	}

	@media (max-width: 1024px) {
		.context-column,
		.output-column {
			width: 30%;
			min-width: 300px;
		}
	}

	/* Very small screens - consider stacking or hiding columns */
	@media (max-width: 768px) {
		.workbench-shell {
			flex-direction: column;
		}

		.context-column,
		.prompt-column,
		.output-column {
			width: 100%;
			min-width: auto;
			max-width: none;
			border-right: none;
			border-bottom: 1px solid rgb(30 41 59); /* slate-800 */
		}
	}
</style>
