<script lang="ts">
/**
 * VF-312: Pattern Detail Page
 *
 * Full pattern view with:
 * - Pattern overview and metadata
 * - Reviews and ratings
 * - Version history
 * - Author information
 * - Install/favorite actions
 */

import type { MarketplacePattern } from '$lib/core/types';
import { marketplaceStore } from '$lib/core/stores';
import ReviewCard from './ReviewCard.svelte';
import { onMount } from 'svelte';

interface Props {
	/** Pattern ID to display */
	patternId: string;
	/** Callback when close/back clicked */
	onClose?: () => void;
	/** Callback when install clicked */
	onInstall?: (patternId: string) => void;
}

let { patternId, onClose, onInstall }: Props = $props();

// Local state
let activeTab = $state<'overview' | 'reviews' | 'versions' | 'author'>('overview');
let showReviewModal = $state(false);
let showReportModal = $state(false);
let userRating = $state<number | undefined>(undefined);
let reviewComment = $state('');

// Subscribe to store
const pattern = $derived(marketplaceStore.selectedPattern);
const reviews = $derived(pattern ? marketplaceStore.reviews[pattern.id] || [] : []);
const isLoading = $derived(marketplaceStore.isLoading);
const error = $derived(marketplaceStore.error);
const isInstalled = $derived(
	pattern ? marketplaceStore.installedPatternIds.includes(pattern.id) : false
);
const isFavorited = $derived(
	pattern ? marketplaceStore.favoritedPatternIds.includes(pattern.id) : false
);

// Load pattern on mount
onMount(async () => {
	await marketplaceStore.loadPattern(patternId);
});

// Actions
async function handleInstall() {
	if (!pattern) return;
	await marketplaceStore.installPattern(pattern.id);
	onInstall?.(pattern.id);
}

async function handleUninstall() {
	if (!pattern) return;
	await marketplaceStore.uninstallPattern(pattern.id);
}

async function handleFavorite() {
	if (!pattern) return;
	await marketplaceStore.favoritePattern(pattern.id);
}

async function handleUnfavorite() {
	if (!pattern) return;
	await marketplaceStore.unfavoritePattern(pattern.id);
}

async function handleSubmitReview() {
	if (!pattern || !userRating) return;

	await marketplaceStore.submitReview(pattern.id, userRating, reviewComment);
	showReviewModal = false;
	userRating = undefined;
	reviewComment = '';
}

function handleReport() {
	showReportModal = true;
}

// Rating stars
function renderStars(rating: number) {
	const full = Math.floor(rating);
	const hasHalf = rating % 1 >= 0.5;
	const empty = 5 - full - (hasHalf ? 1 : 0);

	return '⭐'.repeat(full) + (hasHalf ? '⭐' : '') + '☆'.repeat(empty);
}
</script>

<div class="pattern-detail-page h-full flex flex-col bg-gray-50">
	{#if isLoading}
		<div class="flex items-center justify-center h-full">
			<div class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
				<p class="text-gray-500">Loading pattern details...</p>
			</div>
		</div>
	{:else if error}
		<div class="p-6">
			<div class="p-4 bg-red-50 border border-red-200 rounded text-center">
				<p class="text-red-700">{error}</p>
				{#if onClose}
					<button onclick={onClose} class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
						Go Back
					</button>
				{/if}
			</div>
		</div>
	{:else if pattern}
		<!-- Header -->
		<div class="bg-white border-b border-gray-200 p-6">
			<div class="max-w-5xl mx-auto">
				<!-- Back button -->
				{#if onClose}
					<button
						onclick={onClose}
						class="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-1"
					>
						← Back to Marketplace
					</button>
				{/if}

				<div class="flex items-start justify-between gap-6">
					<div class="flex-1">
						<div class="flex items-center gap-3 mb-2">
							<h1 class="text-3xl font-bold text-gray-800">{pattern.name}</h1>
							<span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
								{pattern.category}
							</span>
							{#if pattern.isBuiltIn}
								<span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
									Built-in
								</span>
							{/if}
						</div>

						<div class="flex items-center gap-4 text-sm text-gray-600 mb-3">
							<div class="flex items-center gap-1">
								<span>by</span>
								<button class="font-medium text-blue-600 hover:text-blue-700">
									{pattern.authorName}
								</button>
								{#if pattern.authorVerified}
									<span class="text-blue-600" title="Verified Author">✓</span>
								{/if}
							</div>
							<div>•</div>
							<div>v{pattern.currentVersion}</div>
							<div>•</div>
							<div>Updated {new Date(pattern.lastUpdatedAt).toLocaleDateString()}</div>
						</div>

						<p class="text-gray-700 mb-4">{pattern.description}</p>

						<!-- Stats -->
						<div class="flex items-center gap-6 text-sm">
							<div class="flex items-center gap-1">
								<span>{renderStars(pattern.averageRating || 0)}</span>
								<span class="font-medium">{pattern.averageRating?.toFixed(1) || 'N/A'}</span>
								<span class="text-gray-500">({pattern.ratingCount || 0} ratings)</span>
							</div>
							<div class="flex items-center gap-1">
								<span>📥</span>
								<span class="font-medium">{pattern.downloadCount.toLocaleString()}</span>
								<span class="text-gray-500">downloads</span>
							</div>
							<div class="flex items-center gap-1">
								<span>❤️</span>
								<span class="font-medium">{pattern.favoriteCount}</span>
								<span class="text-gray-500">favorites</span>
							</div>
						</div>
					</div>

					<!-- Actions -->
					<div class="flex flex-col gap-2 min-w-[200px]">
						{#if isInstalled}
							<button
								onclick={handleUninstall}
								class="px-6 py-3 border border-gray-300 rounded-lg text-center hover:bg-gray-50 transition-colors"
							>
								✓ Installed
							</button>
						{:else}
							<button
								onclick={handleInstall}
								class="px-6 py-3 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700 transition-colors font-medium"
							>
								Install Pattern
							</button>
						{/if}

						<button
							onclick={isFavorited ? handleUnfavorite : handleFavorite}
							class={`px-6 py-3 rounded-lg text-center transition-colors ${
								isFavorited
									? 'bg-red-100 text-red-600 hover:bg-red-200'
									: 'border border-gray-300 hover:bg-gray-50'
							}`}
						>
							{isFavorited ? '❤️ Favorited' : '🤍 Add to Favorites'}
						</button>

						<button
							onclick={handleReport}
							class="px-6 py-3 border border-gray-300 rounded-lg text-center hover:bg-gray-50 transition-colors text-sm text-gray-600"
						>
							🚩 Report
						</button>
					</div>
				</div>

				<!-- Tags -->
				{#if pattern.tags.length > 0}
					<div class="flex flex-wrap gap-2 mt-4">
						{#each pattern.tags as tag}
							<span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
								{tag}
							</span>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Tabs -->
		<div class="bg-white border-b border-gray-200">
			<div class="max-w-5xl mx-auto px-6">
				<div class="flex gap-8">
					<button
						onclick={() => (activeTab = 'overview')}
						class={`py-4 border-b-2 transition-colors ${
							activeTab === 'overview'
								? 'border-blue-600 text-blue-600 font-medium'
								: 'border-transparent text-gray-600 hover:text-gray-800'
						}`}
					>
						Overview
					</button>
					<button
						onclick={() => (activeTab = 'reviews')}
						class={`py-4 border-b-2 transition-colors ${
							activeTab === 'reviews'
								? 'border-blue-600 text-blue-600 font-medium'
								: 'border-transparent text-gray-600 hover:text-gray-800'
						}`}
					>
						Reviews ({pattern.reviewCount || 0})
					</button>
					<button
						onclick={() => (activeTab = 'versions')}
						class={`py-4 border-b-2 transition-colors ${
							activeTab === 'versions'
								? 'border-blue-600 text-blue-600 font-medium'
								: 'border-transparent text-gray-600 hover:text-gray-800'
						}`}
					>
						Versions ({pattern.versions?.length || 1})
					</button>
					<button
						onclick={() => (activeTab = 'author')}
						class={`py-4 border-b-2 transition-colors ${
							activeTab === 'author'
								? 'border-blue-600 text-blue-600 font-medium'
								: 'border-transparent text-gray-600 hover:text-gray-800'
						}`}
					>
						Author
					</button>
				</div>
			</div>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto">
			<div class="max-w-5xl mx-auto p-6">
				{#if activeTab === 'overview'}
					<!-- Overview Tab -->
					<div class="space-y-6">
						<!-- Template Preview -->
						<div class="bg-white rounded-lg border border-gray-200 p-6">
							<h2 class="text-lg font-semibold text-gray-800 mb-4">Template</h2>
							<pre class="bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto text-sm font-mono whitespace-pre-wrap">{pattern.template}</pre>
						</div>

						<!-- Variables -->
						{#if pattern.variables.length > 0}
							<div class="bg-white rounded-lg border border-gray-200 p-6">
								<h2 class="text-lg font-semibold text-gray-800 mb-4">
									Variables ({pattern.variables.length})
								</h2>
								<div class="space-y-3">
									{#each pattern.variables as variable}
										<div class="border-b border-gray-100 pb-3 last:border-0">
											<div class="flex items-center gap-2 mb-1">
												<span class="font-mono text-sm font-medium text-gray-800">
													{variable.name}
												</span>
												<span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
													{variable.type}
												</span>
												{#if variable.required}
													<span class="text-red-500 text-xs">*</span>
												{/if}
											</div>
											<p class="text-sm text-gray-600">{variable.description}</p>
											{#if variable.exampleValue}
												<p class="text-xs text-gray-400 mt-1">
													Example: <span class="font-mono">{variable.exampleValue}</span>
												</p>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Metadata -->
						<div class="bg-white rounded-lg border border-gray-200 p-6">
							<h2 class="text-lg font-semibold text-gray-800 mb-4">Additional Information</h2>
							<dl class="grid grid-cols-2 gap-4 text-sm">
								{#if pattern.outputFormat}
									<div>
										<dt class="text-gray-500">Output Format</dt>
										<dd class="font-medium text-gray-800">{pattern.outputFormat}</dd>
									</div>
								{/if}
								{#if pattern.recommendedModels && pattern.recommendedModels.length > 0}
									<div class="col-span-2">
										<dt class="text-gray-500 mb-2">Recommended Models</dt>
										<dd class="flex flex-wrap gap-2">
											{#each pattern.recommendedModels as model}
												<span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
													{model}
												</span>
											{/each}
										</dd>
									</div>
								{/if}
								<div>
									<dt class="text-gray-500">Published</dt>
									<dd class="font-medium text-gray-800">
										{new Date(pattern.publishedAt).toLocaleDateString()}
									</dd>
								</div>
								<div>
									<dt class="text-gray-500">Last Updated</dt>
									<dd class="font-medium text-gray-800">
										{new Date(pattern.lastUpdatedAt).toLocaleDateString()}
									</dd>
								</div>
							</dl>
						</div>
					</div>
				{:else if activeTab === 'reviews'}
					<!-- Reviews Tab -->
					<div class="space-y-6">
						<!-- Write Review Button -->
						<div class="bg-white rounded-lg border border-gray-200 p-6 text-center">
							<button
								onclick={() => (showReviewModal = true)}
								class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								✍️ Write a Review
							</button>
						</div>

						<!-- Reviews List -->
						{#if reviews.length === 0}
							<div class="text-center py-12">
								<p class="text-gray-500">No reviews yet. Be the first to review this pattern!</p>
							</div>
						{:else}
							<div class="space-y-4">
								{#each reviews as review (review.id)}
									<ReviewCard {review} patternId={pattern.id} />
								{/each}
							</div>
						{/if}
					</div>
				{:else if activeTab === 'versions'}
					<!-- Versions Tab -->
					<div class="space-y-4">
						{#if pattern.versions && pattern.versions.length > 0}
							{#each pattern.versions as version}
								<div class="bg-white rounded-lg border border-gray-200 p-6">
									<div class="flex items-center justify-between mb-3">
										<div>
											<h3 class="text-lg font-semibold text-gray-800">
												Version {version.version}
											</h3>
											<p class="text-sm text-gray-500">
												{new Date(version.publishedAt).toLocaleDateString()}
											</p>
										</div>
										{#if version.version === pattern.currentVersion}
											<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
												Current
											</span>
										{/if}
									</div>
									<div class="prose prose-sm max-w-none">
										<h4 class="text-sm font-medium text-gray-700 mb-2">Changelog:</h4>
										<p class="text-gray-600">{version.changelog}</p>
									</div>
								</div>
							{/each}
						{:else}
							<div class="bg-white rounded-lg border border-gray-200 p-6">
								<p class="text-sm text-gray-600">
									Version {pattern.currentVersion} - Initial release
								</p>
								<p class="text-xs text-gray-400 mt-1">
									{new Date(pattern.publishedAt).toLocaleDateString()}
								</p>
							</div>
						{/if}
					</div>
				{:else if activeTab === 'author'}
					<!-- Author Tab -->
					<div class="bg-white rounded-lg border border-gray-200 p-6">
						<div class="flex items-start gap-4">
							{#if pattern.authorAvatar}
								<img
									src={pattern.authorAvatar}
									alt={pattern.authorName}
									class="w-16 h-16 rounded-full"
								/>
							{:else}
								<div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
									{pattern.authorName.charAt(0).toUpperCase()}
								</div>
							{/if}

							<div class="flex-1">
								<div class="flex items-center gap-2 mb-2">
									<h3 class="text-xl font-semibold text-gray-800">{pattern.authorName}</h3>
									{#if pattern.authorVerified}
										<span class="text-blue-600 text-xl" title="Verified Author">✓</span>
									{/if}
								</div>
								<p class="text-sm text-gray-600 mb-4">Author information will appear here.</p>
								<button class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
									View Author Profile
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Review Modal -->
		{#if showReviewModal}
			<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
				<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
					<div class="p-6">
						<div class="flex items-center justify-between mb-6">
							<h2 class="text-xl font-bold text-gray-800">Write a Review</h2>
							<button
								onclick={() => {
									showReviewModal = false;
									userRating = undefined;
									reviewComment = '';
								}}
								class="text-gray-400 hover:text-gray-600 text-2xl"
							>
								×
							</button>
						</div>

						<!-- Rating -->
						<div class="mb-6">
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Rating <span class="text-red-500">*</span>
							</label>
							<div class="flex gap-2">
								{#each [1, 2, 3, 4, 5] as rating}
									<button
										onclick={() => (userRating = rating)}
										class={`text-3xl transition-opacity ${
											userRating && rating <= userRating
												? 'opacity-100'
												: 'opacity-30 hover:opacity-60'
										}`}
									>
										⭐
									</button>
								{/each}
							</div>
						</div>

						<!-- Comment -->
						<div class="mb-6">
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Comment (optional)
							</label>
							<textarea
								bind:value={reviewComment}
								rows="5"
								placeholder="Share your experience with this pattern..."
								class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
							></textarea>
							<p class="text-xs text-gray-500 mt-1">{reviewComment.length} / 1000 characters</p>
						</div>

						<!-- Actions -->
						<div class="flex justify-end gap-3">
							<button
								onclick={() => {
									showReviewModal = false;
									userRating = undefined;
									reviewComment = '';
								}}
								class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
							>
								Cancel
							</button>
							<button
								onclick={handleSubmitReview}
								disabled={!userRating}
								class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Submit Review
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>
