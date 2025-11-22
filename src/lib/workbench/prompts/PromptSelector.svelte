<script lang="ts">
	/**
	 * PromptSelector - Browse and load saved prompts/presets
	 */

	import { presets, pinnedPresets } from '$lib/stores/presets';
	import { promptStore } from '$lib/core/stores';
	import type { Preset } from '$lib/stores/presets';
	import Button from '$lib/ui/primitives/Button.svelte';
	import Tag from '$lib/ui/primitives/Tag.svelte';

	let searchQuery = $state('');
	let selectedCategory = $state<string>('all');
	let showPinnedOnly = $state(false);

	const categories = ['all', 'coding', 'writing', 'analysis', 'evaluation', 'other'];

	// Filter presets based on search and category
	const filteredPresets = $derived.by(() => {
		let filtered = showPinnedOnly ? $pinnedPresets : $presets;

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(p: Preset) =>
					p.name.toLowerCase().includes(query) ||
					p.description.toLowerCase().includes(query) ||
					p.tags.some((tag) => tag.toLowerCase().includes(query))
			);
		}

		if (selectedCategory !== 'all') {
			filtered = filtered.filter((p: Preset) => p.category === selectedCategory);
		}

		return filtered;
	});

	function handleLoadPreset(preset: Preset) {
		promptStore.setText(preset.basePrompt);
	}

	function handleTogglePin(preset: Preset, event: MouseEvent | KeyboardEvent) {
		event.stopPropagation();
		presets.togglePinned(preset.id);
	}

	function handlePinKeyDown(preset: Preset, event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleTogglePin(preset, event);
		}
	}

	function formatDate(dateStr: string): string {
		// Handle relative dates like "2 days ago" or ISO dates
		if (dateStr.includes('ago') || dateStr === 'now' || dateStr === 'today') {
			return dateStr;
		}
		try {
			return new Date(dateStr).toLocaleDateString();
		} catch {
			return dateStr;
		}
	}
</script>

<div class="prompt-selector flex flex-col h-full">
	<!-- Search and Filters -->
	<div class="p-3 border-b border-slate-800 space-y-3">
		<!-- Search Input -->
		<div class="relative">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search prompts..."
				class="w-full px-3 py-2 pl-9 bg-forge-gunmetal text-slate-200 placeholder-slate-500 text-sm rounded-md border border-slate-700 focus:border-forge-ember focus:outline-none focus:ring-1 focus:ring-forge-ember"
			/>
			<svg
				class="absolute left-3 top-2.5 w-4 h-4 text-slate-500"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				></path>
			</svg>
		</div>

		<!-- Category Filter -->
		<div class="flex items-center gap-2 flex-wrap">
			{#each categories as category}
				<button
					onclick={() => (selectedCategory = category)}
					class="px-2.5 py-1 text-xs rounded-md transition-colors {selectedCategory === category
						? 'bg-forge-ember text-forge-blacksteel font-medium'
						: 'bg-forge-gunmetal text-slate-400 hover:text-slate-200 hover:bg-forge-steel'}"
				>
					{category.charAt(0).toUpperCase() + category.slice(1)}
				</button>
			{/each}
		</div>

		<!-- Pinned Filter -->
		<label class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
			<input
				type="checkbox"
				bind:checked={showPinnedOnly}
				class="w-4 h-4 rounded border-slate-600 bg-forge-gunmetal text-forge-ember focus:ring-forge-ember focus:ring-offset-forge-blacksteel"
			/>
			Show pinned only
		</label>
	</div>

	<!-- Prompts List -->
	<div class="flex-1 overflow-y-auto">
		{#if filteredPresets.length === 0}
			<div class="p-6 text-center">
				<div class="text-slate-500 text-sm">
					{#if searchQuery}
						No prompts match your search
					{:else if showPinnedOnly}
						No pinned prompts
					{:else}
						No prompts available
					{/if}
				</div>
			</div>
		{:else}
			<div class="divide-y divide-slate-800">
				{#each filteredPresets as preset (preset.id)}
					<button
						onclick={() => handleLoadPreset(preset)}
						class="w-full p-3 text-left hover:bg-forge-gunmetal transition-colors group"
					>
						<!-- Header -->
						<div class="flex items-start justify-between gap-2 mb-1">
							<div class="flex items-center gap-2 min-w-0">
								<h4 class="text-sm font-medium text-slate-200 truncate group-hover:text-forge-ember transition-colors">
									{preset.name}
								</h4>
						{#if preset.pinned}
							<span
								onclick={(e) => handleTogglePin(preset, e)}
								onkeydown={(e) => handlePinKeyDown(preset, e)}
								class="cursor-pointer text-forge-ember hover:text-forge-ember/70 transition-colors"
								title="Unpin"
								role="button"
								tabindex="0"
							>
										<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
											<path
												d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z"
											></path>
										</svg>
									</span>
								{:else}
									<span
										onclick={(e) => handleTogglePin(preset, e)}
										onkeydown={(e) => handlePinKeyDown(preset, e)}
										class="cursor-pointer text-slate-500 hover:text-forge-ember transition-colors opacity-0 group-hover:opacity-100"
										title="Pin"
										role="button"
										tabindex="0"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 20 20">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="1.5"
												d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z"
											></path>
										</svg>
									</span>
								{/if}
							</div>
							<span class="text-xs text-slate-500 shrink-0">{formatDate(preset.updatedAt)}</span>
						</div>

						<!-- Description -->
						{#if preset.description}
							<p class="text-xs text-slate-400 mb-2 line-clamp-2">{preset.description}</p>
						{/if}

						<!-- Tags and Models -->
						<div class="flex items-center gap-2 flex-wrap">
							<Tag variant="default" size="sm">
								{#snippet children()}
									{preset.category}
								{/snippet}
							</Tag>
							{#each preset.tags.slice(0, 2) as tag}
								<Tag variant="info" size="sm">
									{#snippet children()}
										{tag}
									{/snippet}
								</Tag>
							{/each}
							{#if preset.tags.length > 2}
								<span class="text-xs text-slate-500">+{preset.tags.length - 2}</span>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
