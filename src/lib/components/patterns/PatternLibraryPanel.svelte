<script lang="ts">
/**
 * VF-310: Pattern Library Panel Component
 *
 * Main container for browsing and managing prompt patterns:
 * - Search and filter controls
 * - Category tabs
 * - Pattern cards grid
 * - Create new pattern button
 * - Import/export patterns
 */

import type { PromptPattern, PatternCategory } from '$lib/core/types';
import { patternsStore } from '$lib/core/stores';
import PatternCard from './PatternCard.svelte';

interface Props {
	/** Callback when pattern is selected for use */
	onUsePattern?: (pattern: PromptPattern) => void;
	/** Show create/edit controls */
	showControls?: boolean;
}

let { onUsePattern, showControls = true }: Props = $props();

// Local state
let searchQuery = $state('');
let selectedCategory = $state<PatternCategory | 'all'>('all');
let selectedTags = $state<string[]>([]);
let sortBy = $state<'name' | 'usage' | 'rating' | 'recent'>('name');
let showBuiltInOnly = $state(false);
let showImportModal = $state(false);
let importJson = $state('');

// Update filters when controls change
$effect(() => {
	patternsStore.setFilters({
		query: searchQuery || undefined,
		category: selectedCategory === 'all' ? undefined : selectedCategory,
		tags: selectedTags.length > 0 ? selectedTags : undefined,
		sortBy,
		sortDirection: sortBy === 'recent' ? 'desc' : 'asc',
		builtInOnly: showBuiltInOnly || undefined
	});
});

// Get filtered patterns
const filteredPatterns = $derived(patternsStore.filteredPatterns);
const categoryStats = $derived(patternsStore.categoryStats);
const allTags = $derived(patternsStore.allTags);

// Handle create new pattern
function handleCreatePattern() {
	patternsStore.startEditPattern();
}

// Handle edit pattern
function handleEditPattern(pattern: PromptPattern) {
	patternsStore.startEditPattern(pattern.id);
}

// Handle delete pattern
function handleDeletePattern(pattern: PromptPattern) {
	patternsStore.deletePattern(pattern.id);
}

// Handle use pattern
function handleUsePattern(pattern: PromptPattern) {
	onUsePattern?.(pattern);
}

// Handle export pattern
function handleExportPattern(pattern: PromptPattern) {
	const json = patternsStore.exportPattern(pattern.id);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `${pattern.id}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

// Handle import pattern
function handleImportPattern() {
	if (!importJson.trim()) return;
	try {
		patternsStore.importPattern(importJson);
		showImportModal = false;
		importJson = '';
	} catch (err) {
		alert(err instanceof Error ? err.message : 'Failed to import pattern');
	}
}

// Toggle tag filter
function toggleTag(tag: string) {
	if (selectedTags.includes(tag)) {
		selectedTags = selectedTags.filter((t) => t !== tag);
	} else {
		selectedTags = [...selectedTags, tag];
	}
}

// Clear all filters
function clearFilters() {
	searchQuery = '';
	selectedCategory = 'all';
	selectedTags = [];
	sortBy = 'name';
	showBuiltInOnly = false;
	patternsStore.clearFilters();
}

// Categories for tabs
const categories: Array<{ id: PatternCategory | 'all'; label: string }> = [
	{ id: 'all', label: 'All' },
	{ id: 'coding', label: 'Coding' },
	{ id: 'writing', label: 'Writing' },
	{ id: 'analysis', label: 'Analysis' },
	{ id: 'debugging', label: 'Debugging' },
	{ id: 'refactoring', label: 'Refactoring' },
	{ id: 'documentation', label: 'Docs' },
	{ id: 'testing', label: 'Testing' },
	{ id: 'design', label: 'Design' },
	{ id: 'planning', label: 'Planning' },
	{ id: 'learning', label: 'Learning' }
];
</script>

<div class="pattern-library-panel h-full flex flex-col bg-gray-50">
	<!-- Header -->
	<div class="p-4 bg-white border-b border-gray-200">
		<div class="flex items-center justify-between mb-4">
			<div>
				<h2 class="text-xl font-bold text-gray-800">Prompt Patterns Library</h2>
				<p class="text-sm text-gray-500 mt-1">
					{filteredPatterns.length} patterns
					{#if searchQuery || selectedCategory !== 'all' || selectedTags.length > 0}
						<button onclick={clearFilters} class="ml-2 text-blue-600 hover:text-blue-700">
							Clear filters
						</button>
					{/if}
				</p>
			</div>

			{#if showControls}
				<div class="flex gap-2">
					<button
						onclick={() => (showImportModal = true)}
						class="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
					>
						📥 Import
					</button>
					<button
						onclick={handleCreatePattern}
						class="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
					>
						+ New Pattern
					</button>
				</div>
			{/if}
		</div>

		<!-- Search and Filter Controls -->
		<div class="space-y-3">
			<!-- Search Bar -->
			<div class="flex gap-3">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search patterns (name, description, tags)..."
					class="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>

				<!-- Sort Dropdown -->
				<select
					bind:value={sortBy}
					class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="name">Sort by Name</option>
					<option value="usage">Sort by Usage</option>
					<option value="rating">Sort by Rating</option>
					<option value="recent">Sort by Recent</option>
				</select>

				<!-- Built-in Only Toggle -->
				<label class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
					<input type="checkbox" bind:checked={showBuiltInOnly} class="rounded" />
					<span class="text-sm">Built-in only</span>
				</label>
			</div>

			<!-- Category Tabs -->
			<div class="flex gap-2 overflow-x-auto pb-2">
				{#each categories as category}
					{@const count = category.id === 'all'
						? patternsStore.patterns.length
						: categoryStats[category.id] || 0}
					<button
						onclick={() => (selectedCategory = category.id)}
						class={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
							selectedCategory === category.id
								? 'bg-blue-600 text-white'
								: 'bg-white border border-gray-300 hover:bg-gray-50'
						}`}
					>
						{category.label} ({count})
					</button>
				{/each}
			</div>

			<!-- Tag Filters (Popular Tags) -->
			{#if allTags.length > 0}
				<div class="flex items-center gap-2 flex-wrap">
					<span class="text-xs text-gray-500">Tags:</span>
					{#each allTags.slice(0, 10) as tag}
						<button
							onclick={() => toggleTag(tag)}
							class={`px-2 py-1 text-xs rounded transition-colors ${
								selectedTags.includes(tag)
									? 'bg-purple-600 text-white'
									: 'bg-white border border-gray-300 hover:bg-gray-50'
							}`}
						>
							{tag}
						</button>
					{/each}
					{#if allTags.length > 10}
						<span class="text-xs text-gray-400">+{allTags.length - 10} more</span>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Patterns Grid -->
	<div class="flex-1 overflow-y-auto p-4">
		{#if filteredPatterns.length === 0}
			<!-- Empty State -->
			<div class="flex flex-col items-center justify-center h-full text-center">
				<span class="text-6xl mb-4">🔍</span>
				<h3 class="text-lg font-semibold text-gray-700 mb-2">No Patterns Found</h3>
				<p class="text-sm text-gray-500 max-w-md">
					{#if searchQuery || selectedCategory !== 'all' || selectedTags.length > 0}
						Try adjusting your search or filters
					{:else}
						Get started by creating your first custom pattern
					{/if}
				</p>
				{#if showControls && !searchQuery && selectedCategory === 'all' && selectedTags.length === 0}
					<button
						onclick={handleCreatePattern}
						class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						Create First Pattern
					</button>
				{/if}
			</div>
		{:else}
			<!-- Patterns Grid -->
			<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
				{#each filteredPatterns as pattern (pattern.id)}
					<PatternCard
						{pattern}
						onUse={handleUsePattern}
						onEdit={showControls ? handleEditPattern : undefined}
						onDelete={showControls ? handleDeletePattern : undefined}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Import Modal -->
{#if showImportModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
			<div class="p-6">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-gray-800">Import Pattern</h3>
					<button
						onclick={() => {
							showImportModal = false;
							importJson = '';
						}}
						class="text-gray-400 hover:text-gray-600"
					>
						✕
					</button>
				</div>

				<p class="text-sm text-gray-600 mb-4">
					Paste the JSON export of a pattern below to import it into your library.
				</p>

				<textarea
					bind:value={importJson}
					placeholder="Paste pattern JSON here..."
					class="w-full h-64 p-3 border border-gray-300 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				></textarea>

				<div class="flex justify-end gap-3 mt-4">
					<button
						onclick={() => {
							showImportModal = false;
							importJson = '';
						}}
						class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
					>
						Cancel
					</button>
					<button
						onclick={handleImportPattern}
						disabled={!importJson.trim()}
						class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Import Pattern
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
