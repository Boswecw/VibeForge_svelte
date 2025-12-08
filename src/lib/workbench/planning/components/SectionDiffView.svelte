<script lang="ts">
/**
 * VF-320: Section Diff View Component
 *
 * Displays section-level diffs between two plans:
 * - Added, removed, changed, unchanged sections
 * - Similarity scores for changed sections
 * - Content diff with line-by-line changes
 */

import type { SectionDiff } from '../types';

interface Props {
	/** Section diffs to display */
	diffs: SectionDiff[];
}

let { diffs }: Props = $props();

// Expand/collapse state for each diff
let expandedDiffs = $state<Set<number>>(new Set());

function toggleDiff(index: number) {
	if (expandedDiffs.has(index)) {
		expandedDiffs.delete(index);
	} else {
		expandedDiffs.add(index);
	}
	expandedDiffs = new Set(expandedDiffs);
}

// Get color for diff type
function getDiffColor(type: SectionDiff['type']): string {
	switch (type) {
		case 'added':
			return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
		case 'removed':
			return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20';
		case 'changed':
			return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
		default:
			return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800';
	}
}

// Get icon for diff type
function getDiffIcon(type: SectionDiff['type']): string {
	switch (type) {
		case 'added':
			return '+ ';
		case 'removed':
			return '- ';
		case 'changed':
			return '~';
		default:
			return '=';
	}
}

// Get label for diff type
function getDiffLabel(type: SectionDiff['type']): string {
	switch (type) {
		case 'added':
			return 'Added';
		case 'removed':
			return 'Removed';
		case 'changed':
			return 'Changed';
		default:
			return 'Unchanged';
	}
}
</script>

<div class="section-diff-view space-y-4">
	<!-- Summary -->
	<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
		<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
			Section Comparison Summary
		</h3>
		<div class="grid grid-cols-4 gap-4 text-center">
			<div>
				<div class="text-2xl font-bold text-green-600 dark:text-green-400">
					{diffs.filter((d) => d.type === 'added').length}
				</div>
				<div class="text-xs text-gray-500 dark:text-gray-400">Added</div>
			</div>
			<div>
				<div class="text-2xl font-bold text-red-600 dark:text-red-400">
					{diffs.filter((d) => d.type === 'removed').length}
				</div>
				<div class="text-xs text-gray-500 dark:text-gray-400">Removed</div>
			</div>
			<div>
				<div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
					{diffs.filter((d) => d.type === 'changed').length}
				</div>
				<div class="text-xs text-gray-500 dark:text-gray-400">Changed</div>
			</div>
			<div>
				<div class="text-2xl font-bold text-gray-600 dark:text-gray-400">
					{diffs.filter((d) => d.type === 'unchanged').length}
				</div>
				<div class="text-xs text-gray-500 dark:text-gray-400">Unchanged</div>
			</div>
		</div>
	</div>

	<!-- Diff List -->
	{#each diffs as diff, index}
		{#if diff.type !== 'unchanged'}
			{@const isExpanded = expandedDiffs.has(index)}
			<div class="rounded-lg border {getDiffColor(diff.type)} overflow-hidden">
				<!-- Header -->
				<button
					onclick={() => toggleDiff(index)}
					class="w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-80 transition-colors"
				>
					<div class="flex items-center gap-3">
						<span class="font-mono text-sm">
							{getDiffIcon(diff.type)}
						</span>
						<div class="text-left">
							<div class="font-medium text-gray-800 dark:text-gray-100">
								{diff.sectionA?.title || diff.sectionB?.title || 'Unknown Section'}
							</div>
							<div class="text-xs text-gray-500 dark:text-gray-400">
								{getDiffLabel(diff.type)}
								{#if diff.similarity !== undefined}
									• {diff.similarity}% similarity
								{/if}
							</div>
						</div>
					</div>
					<span class="text-gray-400 dark:text-gray-600">
						{isExpanded ? '▼' : '▶'}
					</span>
				</button>

				<!-- Content -->
				{#if isExpanded}
					<div class="border-t border-gray-200 dark:border-gray-700 p-4">
						{#if diff.type === 'added' && diff.sectionB}
							<!-- Added Section -->
							<div class="prose prose-sm dark:prose-invert max-w-none">
								<h4 class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
									New Content:
								</h4>
								<pre class="text-xs bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto whitespace-pre-wrap">{diff.sectionB.content}</pre>
							</div>
						{:else if diff.type === 'removed' && diff.sectionA}
							<!-- Removed Section -->
							<div class="prose prose-sm dark:prose-invert max-w-none">
								<h4 class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
									Removed Content:
								</h4>
								<pre class="text-xs bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto whitespace-pre-wrap">{diff.sectionA.content}</pre>
							</div>
						{:else if diff.type === 'changed' && diff.contentDiff}
							<!-- Changed Section: Show diff -->
							<div class="grid grid-cols-2 gap-4">
								<div>
									<h4 class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
										Session A:
									</h4>
									<pre class="text-xs bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto whitespace-pre-wrap h-64">{diff.sectionA?.content}</pre>
								</div>
								<div>
									<h4 class="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
										Session B:
									</h4>
									<pre class="text-xs bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto whitespace-pre-wrap h-64">{diff.sectionB?.content}</pre>
								</div>
							</div>

							<!-- Content Diff Details -->
							{#if diff.contentDiff.added.length > 0 || diff.contentDiff.removed.length > 0 || diff.contentDiff.modified.length > 0}
								<div class="mt-4 space-y-2">
									{#if diff.contentDiff.added.length > 0}
										<div>
											<h5 class="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
												+ Added Lines ({diff.contentDiff.added.length}):
											</h5>
											<div class="text-xs bg-green-50 dark:bg-green-900/20 p-2 rounded space-y-0.5">
												{#each diff.contentDiff.added.slice(0, 5) as line}
													<div class="text-green-800 dark:text-green-300">{line}</div>
												{/each}
												{#if diff.contentDiff.added.length > 5}
													<div class="text-green-600 dark:text-green-400 text-xs">
														... and {diff.contentDiff.added.length - 5} more
													</div>
												{/if}
											</div>
										</div>
									{/if}

									{#if diff.contentDiff.removed.length > 0}
										<div>
											<h5 class="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
												- Removed Lines ({diff.contentDiff.removed.length}):
											</h5>
											<div class="text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded space-y-0.5">
												{#each diff.contentDiff.removed.slice(0, 5) as line}
													<div class="text-red-800 dark:text-red-300">{line}</div>
												{/each}
												{#if diff.contentDiff.removed.length > 5}
													<div class="text-red-600 dark:text-red-400 text-xs">
														... and {diff.contentDiff.removed.length - 5} more
													</div>
												{/if}
											</div>
										</div>
									{/if}

									{#if diff.contentDiff.modified.length > 0}
										<div>
											<h5 class="text-xs font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
												~ Modified Lines ({diff.contentDiff.modified.length}):
											</h5>
											<div class="text-xs bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded space-y-0.5">
												{#each diff.contentDiff.modified.slice(0, 3) as line}
													<div class="text-yellow-800 dark:text-yellow-300 whitespace-pre-wrap">{line}</div>
												{/each}
												{#if diff.contentDiff.modified.length > 3}
													<div class="text-yellow-600 dark:text-yellow-400 text-xs">
														... and {diff.contentDiff.modified.length - 3} more
													</div>
												{/if}
											</div>
										</div>
									{/if}
								</div>
							{/if}
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	{/each}

	<!-- Empty State -->
	{#if diffs.filter((d) => d.type !== 'unchanged').length === 0}
		<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
			<span class="text-4xl mb-2 block">✓</span>
			<p class="text-sm text-gray-600 dark:text-gray-400">
				All sections are identical between the two plans.
			</p>
		</div>
	{/if}
</div>

<style>
	pre {
		font-family: 'Courier New', Courier, monospace;
	}
</style>
