<script lang="ts">
/**
 * VF-312: Review Card Component
 *
 * Displays an individual pattern review with:
 * - Author info and avatar
 * - Star rating
 * - Review comment
 * - Helpful votes
 * - Timestamp
 */

import type { PatternReview } from '$lib/core/types';
import { marketplaceStore } from '$lib/core/stores';

interface Props {
	/** Review to display */
	review: PatternReview;
	/** Pattern ID (for voting) */
	patternId: string;
}

let { review, patternId }: Props = $props();

// Format date
function formatDate(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return 'Today';
	if (diffDays === 1) return 'Yesterday';
	if (diffDays < 7) return `${diffDays} days ago`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
	if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
	return `${Math.floor(diffDays / 365)} years ago`;
}

// Render stars
function renderStars(rating: number): string {
	return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
}

// Handle helpful vote
function handleHelpfulVote() {
	marketplaceStore.voteReviewHelpful(review.id, patternId);
}
</script>

<div class="review-card bg-white rounded-lg border border-gray-200 p-6">
	<!-- Header -->
	<div class="flex items-start justify-between mb-4">
		<div class="flex items-start gap-3">
			<!-- Avatar -->
			{#if review.authorAvatar}
				<img
					src={review.authorAvatar}
					alt={review.authorName}
					class="w-10 h-10 rounded-full"
				/>
			{:else}
				<div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
					{review.authorName.charAt(0).toUpperCase()}
				</div>
			{/if}

			<!-- Author and rating -->
			<div>
				<div class="font-medium text-gray-800">{review.authorName}</div>
				<div class="flex items-center gap-2 text-sm">
					<span class="text-yellow-500">{renderStars(review.rating)}</span>
					<span class="text-gray-400">•</span>
					<span class="text-gray-500">{formatDate(review.createdAt)}</span>
				</div>
			</div>
		</div>

		<!-- Rating number -->
		<div class="flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium">
			<span>⭐</span>
			<span>{review.rating}/5</span>
		</div>
	</div>

	<!-- Comment -->
	{#if review.comment}
		<p class="text-gray-700 mb-4 whitespace-pre-wrap">{review.comment}</p>
	{/if}

	<!-- Footer -->
	<div class="flex items-center gap-4 text-sm">
		<!-- Helpful votes -->
		<button
			onclick={handleHelpfulVote}
			class={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${
				review.userVotedHelpful
					? 'bg-blue-100 text-blue-700'
					: 'border border-gray-300 hover:bg-gray-50 text-gray-600'
			}`}
		>
			<span>{review.userVotedHelpful ? '👍' : '👍🏻'}</span>
			<span>Helpful</span>
			{#if review.helpful > 0}
				<span class="font-medium">({review.helpful})</span>
			{/if}
		</button>

		<!-- Updated indicator -->
		{#if review.updatedAt !== review.createdAt}
			<span class="text-xs text-gray-400 italic">
				Edited {formatDate(review.updatedAt)}
			</span>
		{/if}
	</div>
</div>
