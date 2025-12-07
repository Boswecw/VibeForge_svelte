<script lang="ts">
/**
 * VF-312: Marketplace Browser Component
 *
 * Main component for browsing community patterns:
 * - Search and filter patterns
 * - View popular, recent, and top-rated sections
 * - Quick install and favorite actions
 * - Navigate to pattern detail pages
 */

import type { MarketplacePattern, PatternCategory } from '$lib/core/types';
import { marketplaceStore } from '$lib/core/stores';
import { onMount } from 'svelte';

interface Props {
	/** Initial category filter */
	category?: PatternCategory;
	/** Callback when pattern selected */
	onSelectPattern?: (pattern: MarketplacePattern) => void;
	/** Show submit pattern button */
	showSubmit?: boolean;
}

let { category, onSelectPattern, showSubmit = true }: Props = $props();

// Local state
let searchQuery = $state('');
let selectedCategory = $state<PatternCategory | 'all'>(category || 'all');
let selectedTags = $state<string[]>([]);
let sortBy = $state<'popular' | 'recent' | 'rating' | 'downloads' | 'name'>('popular');
let minRating = $state<number | undefined>(undefined);
let showVerifiedOnly = $state(false);
let activeTab = $state<'all' | 'popular' | 'recent' | 'top-rated'>('all');

// Subscribe to store
const patterns = $derived(marketplaceStore.filteredPatterns);
const isLoading = $derived(marketplaceStore.isLoading);
const error = $derived(marketplaceStore.error);
const popularPatterns = $derived(marketplaceStore.popularPatterns);
const recentPatterns = $derived(marketplaceStore.recentPatterns);
const topRatedPatterns = $derived(marketplaceStore.topRatedPatterns);
const installedIds = $derived(marketplaceStore.installedPatternIds);
const favoritedIds = $derived(marketplaceStore.favoritedPatternIds);

// Apply filters when controls change
$effect(() => {
	marketplaceStore.setFilters({
		query: searchQuery || undefined,
		category: selectedCategory === 'all' ? undefined : selectedCategory,
		tags: selectedTags.length > 0 ? selectedTags : undefined,
		sortBy,
		minRating,
		verified: showVerifiedOnly || undefined
	});
});

// Load patterns on mount
onMount(() => {
	marketplaceStore.browsePatterns();
	marketplaceStore.loadUserProfile('current_user'); // TODO: Get actual user ID
});

// Pattern actions
async function handleInstall(patternId: string, event: Event) {
	event.stopPropagation();
	await marketplaceStore.installPattern(patternId);
}

async function handleUninstall(patternId: string, event: Event) {
	event.stopPropagation();
	await marketplaceStore.uninstallPattern(patternId);
}

async function handleFavorite(patternId: string, event: Event) {
	event.stopPropagation();
	await marketplaceStore.favoritePattern(patternId);
}

async function handleUnfavorite(patternId: string, event: Event) {
	event.stopPropagation();
	await marketplaceStore.unfavoritePattern(patternId);
}

function handleSelectPattern(pattern: MarketplacePattern) {
	onSelectPattern?.(pattern);
}

function clearFilters() {
	searchQuery = '';
	selectedCategory = 'all';
	selectedTags = [];
	sortBy = 'popular';
	minRating = undefined;
	showVerifiedOnly = false;
	marketplaceStore.clearFilters();
}

// Categories
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

// Get patterns to display based on active tab
const displayPatterns = $derived.by(() => {
	switch (activeTab) {
		case 'popular':
			return popularPatterns;
		case 'recent':
			return recentPatterns;
		case 'top-rated':
			return topRatedPatterns;
		default:
			return patterns;
	}
});
</script>

<div class="marketplace-browser h-full flex flex-col bg-gray-50">
	<!-- Header -->
	<div class="p-6 bg-white border-b border-gray-200">
		<div class="flex items-center justify-between mb-4">
			<div>
				<h1 class="text-2xl font-bold text-gray-800">Pattern Marketplace</h1>
				<p class="text-sm text-gray-500 mt-1">
					Discover and install community-created prompt patterns
				</p>
			</div>

			{#if showSubmit}
				<button
					class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
				>
					📤 Submit Pattern
				</button>
			{/if}
		</div>

		<!-- Tabs -->
		<div class="flex gap-2 mb-4">
			<button
				onclick={() => (activeTab = 'all')}
				class={`px-4 py-2 rounded transition-colors ${
					activeTab === 'all'
						? 'bg-blue-600 text-white'
						: 'bg-gray-100 hover:bg-gray-200'
				}`}
			>
				All Patterns
			</button>
			<button
				onclick={() => (activeTab = 'popular')}
				class={`px-4 py-2 rounded transition-colors ${
					activeTab === 'popular'
						? 'bg-blue-600 text-white'
						: 'bg-gray-100 hover:bg-gray-200'
				}`}
			>
				🔥 Popular
			</button>
			<button
				onclick={() => (activeTab = 'recent')}
				class={`px-4 py-2 rounded transition-colors ${
					activeTab === 'recent'
						? 'bg-blue-600 text-white'
						: 'bg-gray-100 hover:bg-gray-200'
				}`}
			>
				🆕 Recent
			</button>
			<button
				onclick={() => (activeTab = 'top-rated')}
				class={`px-4 py-2 rounded transition-colors ${
					activeTab === 'top-rated'
						? 'bg-blue-600 text-white'
						: 'bg-gray-100 hover:bg-gray-200'
				}`}
			>
				⭐ Top Rated
			</button>
		</div>

		<!-- Search and Filters (only show on "All" tab) -->
		{#if activeTab === 'all'}
			<div class="space-y-3">
				<!-- Search Bar -->
				<div class="flex gap-3">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search patterns (name, description, tags, author)..."
						class="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>

					<select
						bind:value={sortBy}
						class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="popular">Sort by Popular</option>
						<option value="recent">Sort by Recent</option>
						<option value="rating">Sort by Rating</option>
						<option value="downloads">Sort by Downloads</option>
						<option value="name">Sort by Name</option>
					</select>

					<select
						bind:value={minRating}
						class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value={undefined}>All Ratings</option>
						<option value={4}>4+ Stars</option>
						<option value={3}>3+ Stars</option>
						<option value={2}>2+ Stars</option>
					</select>

					<label class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
						<input type="checkbox" bind:checked={showVerifiedOnly} class="rounded" />
						<span class="text-sm whitespace-nowrap">Verified Only</span>
					</label>

					{#if searchQuery || selectedCategory !== 'all' || selectedTags.length > 0 || minRating || showVerifiedOnly}
						<button
							onclick={clearFilters}
							class="px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
						>
							Clear All
						</button>
					{/if}
				</div>

				<!-- Category Tabs -->
				<div class="flex gap-2 overflow-x-auto pb-2">
					{#each categories as cat}
						<button
							onclick={() => (selectedCategory = cat.id)}
							class={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
								selectedCategory === cat.id
									? 'bg-blue-600 text-white'
									: 'bg-white border border-gray-300 hover:bg-gray-50'
							}`}
						>
							{cat.label}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-y-auto p-6">
		{#if isLoading}
			<div class="flex items-center justify-center h-64">
				<div class="text-center">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p class="text-gray-500">Loading patterns...</p>
				</div>
			</div>
		{:else if error}
			<div class="p-4 bg-red-50 border border-red-200 rounded text-center">
				<p class="text-red-700">{error}</p>
			</div>
		{:else if displayPatterns.length === 0}
			<div class="flex flex-col items-center justify-center h-64 text-center">
				<span class="text-6xl mb-4">🔍</span>
				<h3 class="text-lg font-semibold text-gray-700 mb-2">No Patterns Found</h3>
				<p class="text-sm text-gray-500 max-w-md">
					{#if searchQuery || selectedCategory !== 'all'}
						Try adjusting your search or filters
					{:else}
						The marketplace is currently empty. Be the first to submit a pattern!
					{/if}
				</p>
				{#if searchQuery || selectedCategory !== 'all' || selectedTags.length > 0}
					<button
						onclick={clearFilters}
						class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						Clear Filters
					</button>
				{/if}
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each displayPatterns as pattern (pattern.id)}
					<div
						class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
						onclick={() => handleSelectPattern(pattern)}
					>
						<!-- Header -->
						<div class="flex items-start justify-between mb-3">
							<div class="flex-1">
								<h3 class="font-semibold text-gray-800 mb-1">{pattern.name}</h3>
								<div class="flex items-center gap-2 text-xs text-gray-500">
									<span>by {pattern.authorName}</span>
									{#if pattern.authorVerified}
										<span class="text-blue-600" title="Verified Author">✓</span>
									{/if}
								</div>
							</div>
							<span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
								{pattern.category}
							</span>
						</div>

						<!-- Description -->
						<p class="text-sm text-gray-600 mb-3 line-clamp-2">{pattern.description}</p>

						<!-- Stats -->
						<div class="flex items-center gap-4 text-xs text-gray-500 mb-3">
							<div class="flex items-center gap-1">
								<span>⭐</span>
								<span>{pattern.averageRating?.toFixed(1) || 'N/A'}</span>
								<span>({pattern.ratingCount || 0})</span>
							</div>
							<div class="flex items-center gap-1">
								<span>📥</span>
								<span>{pattern.downloadCount.toLocaleString()}</span>
							</div>
							<div class="flex items-center gap-1">
								<span>❤️</span>
								<span>{pattern.favoriteCount}</span>
							</div>
						</div>

						<!-- Tags -->
						{#if pattern.tags.length > 0}
							<div class="flex flex-wrap gap-1 mb-3">
								{#each pattern.tags.slice(0, 3) as tag}
									<span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
										{tag}
									</span>
								{/each}
								{#if pattern.tags.length > 3}
									<span class="text-xs text-gray-400">+{pattern.tags.length - 3}</span>
								{/if}
							</div>
						{/if}

						<!-- Actions -->
						<div class="flex gap-2">
							{#if installedIds.includes(pattern.id)}
								<button
									onclick={(e) => handleUninstall(pattern.id, e)}
									class="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
								>
									✓ Installed
								</button>
							{:else}
								<button
									onclick={(e) => handleInstall(pattern.id, e)}
									class="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
								>
									Install
								</button>
							{/if}

							<button
								onclick={(e) => favoritedIds.includes(pattern.id) ? handleUnfavorite(pattern.id, e) : handleFavorite(pattern.id, e)}
								class={`px-3 py-1.5 rounded text-sm transition-colors ${
									favoritedIds.includes(pattern.id)
										? 'bg-red-100 text-red-600'
										: 'border border-gray-300 hover:bg-gray-50'
								}`}
								title={favoritedIds.includes(pattern.id) ? 'Unfavorite' : 'Favorite'}
							>
								{favoritedIds.includes(pattern.id) ? '❤️' : '🤍'}
							</button>
						</div>
					</div>
				{/each}
			</div>

			<!-- Pagination -->
			{#if activeTab === 'all' && marketplaceStore.totalPages > 1}
				<div class="flex items-center justify-center gap-4 mt-8">
					<button
						onclick={() => marketplaceStore.loadPreviousPage()}
						disabled={marketplaceStore.currentPage === 1}
						class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						← Previous
					</button>
					<span class="text-sm text-gray-600">
						Page {marketplaceStore.currentPage} of {marketplaceStore.totalPages}
					</span>
					<button
						onclick={() => marketplaceStore.loadNextPage()}
						disabled={marketplaceStore.currentPage === marketplaceStore.totalPages}
						class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Next →
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>
