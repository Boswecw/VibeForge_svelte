<script lang="ts">
	/**
	 * ModelSelector component - Model selection and configuration
	 * Allows selecting multiple models for parallel execution
	 */

	import { modelsStore } from '$lib/core/stores';
	import Button from '$lib/ui/primitives/Button.svelte';
	import Panel from '$lib/ui/primitives/Panel.svelte';
	import SectionHeader from '$lib/ui/primitives/SectionHeader.svelte';

	const models = $derived(modelsStore.models);
	const selectedIds = $derived(modelsStore.selectedIds);
	const modelsByProvider = $derived(modelsStore.modelsByProvider);
	const selectedCount = $derived(modelsStore.selectedCount);
	const estimatedCost = $derived(modelsStore.estimatedCost);

	let isExpanded = $state(false);

	function toggleModel(modelId: string) {
		modelsStore.toggleModel(modelId);
	}

	function handleSelectAll() {
		modelsStore.selectAll();
	}

	function handleClearSelection() {
		modelsStore.clearSelection();
	}

	// Group models by provider for organized display
	const providers = $derived(Object.keys(modelsByProvider));
</script>

<Panel variant="bordered" padding="md" class="model-selector">
	<button
		onclick={() => (isExpanded = !isExpanded)}
		class="w-full flex items-center justify-between hover:bg-forge-steel/50 -m-4 p-4 rounded-lg transition-colors"
	>
		<div class="flex items-center gap-3">
			<svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
				></path>
			</svg>
			<div class="text-left">
				<h4 class="text-sm font-semibold text-slate-200">Models</h4>
				<p class="text-xs text-slate-400">
					{selectedCount} selected
					{#if selectedCount > 0 && estimatedCost}
						• ~${estimatedCost(1000, 1000).toFixed(4)}/run
					{/if}
				</p>
			</div>
		</div>

		<svg
			class="w-5 h-5 text-slate-400 transition-transform duration-200 {isExpanded
				? 'rotate-180'
				: ''}"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M19 9l-7 7-7-7"
			></path>
		</svg>
	</button>

	{#if isExpanded}
		<div class="mt-4 space-y-4">
			<!-- Selection Actions -->
			<div class="flex items-center justify-end gap-2">
				<button
					onclick={handleSelectAll}
					class="px-3 py-1.5 text-sm rounded-md bg-transparent text-slate-300 hover:bg-forge-gunmetal transition-colors"
				>
					Select All
				</button>
				<button
					onclick={handleClearSelection}
					class="px-3 py-1.5 text-sm rounded-md bg-transparent text-slate-300 hover:bg-forge-gunmetal transition-colors"
				>
					Clear
				</button>
			</div>

			<!-- Models by Provider -->
			<div class="space-y-4">
				{#each providers as provider}
					<div>
						<h5 class="text-xs font-semibold text-slate-400 uppercase mb-2">{provider}</h5>
						<div class="space-y-2">
							{#each modelsByProvider[provider] as model}

								<label
									class="flex items-center gap-3 p-2 rounded-lg hover:bg-forge-steel transition-colors cursor-pointer"
								>
									<!-- Checkbox -->
									<input
										type="checkbox"
										checked={selectedIds.includes(model.id)}
										onchange={() => toggleModel(model.id)}
										class="w-4 h-4 rounded border-slate-600 bg-forge-gunmetal text-forge-ember focus:ring-2 focus:ring-forge-ember focus:ring-offset-0 transition-colors cursor-pointer"
									/>

									<!-- Model Info -->
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2">
											<span class="text-sm font-medium text-slate-200">{model.name}</span>
											{#if model.contextWindow}
												<span class="text-xs text-slate-500"
													>{(model.contextWindow / 1000).toFixed(0)}k ctx</span
												>
											{/if}
										</div>
										{#if model.description}
											<p class="text-xs text-slate-400 truncate">{model.description}</p>
										{/if}
									</div>

									<!-- Pricing -->
									{#if model.pricing}
										<div class="text-xs text-slate-500 text-right">
											<div>${((model.pricing.inputCostPer1kTokens || 0) * 1000).toFixed(2)}/1M in</div>
											<div>${((model.pricing.outputCostPer1kTokens || 0) * 1000).toFixed(2)}/1M out</div>
										</div>
									{/if}
								</label>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<!-- Empty State -->
			{#if models.length === 0}
				<div class="text-center py-6 text-slate-500">
					<p class="text-sm">No models available</p>
				</div>
			{/if}
		</div>
	{/if}
</Panel>
