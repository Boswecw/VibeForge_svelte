<script lang="ts">
/**
 * VF-310: Pattern Card Component
 *
 * Individual pattern display card with:
 * - Pattern metadata (name, description, category, tags)
 * - Usage count and rating
 * - Quick actions (use, edit, duplicate, delete)
 * - Expandable details (template, variables, examples)
 */

import type { PromptPattern } from '$lib/core/types';
import { patternsStore } from '$lib/core/stores';

interface Props {
	/** Pattern to display */
	pattern: PromptPattern;
	/** Show expanded view by default */
	expanded?: boolean;
	/** Callback when "Use Pattern" clicked */
	onUse?: (pattern: PromptPattern) => void;
	/** Callback when "Edit" clicked */
	onEdit?: (pattern: PromptPattern) => void;
	/** Callback when "Delete" clicked */
	onDelete?: (pattern: PromptPattern) => void;
}

let { pattern, expanded = false, onUse, onEdit, onDelete }: Props = $props();

let isExpanded = $state(expanded);

// Get category color
function getCategoryColor(category: string): string {
	const colors: Record<string, string> = {
		coding: 'bg-blue-100 text-blue-700',
		writing: 'bg-green-100 text-green-700',
		analysis: 'bg-purple-100 text-purple-700',
		debugging: 'bg-red-100 text-red-700',
		refactoring: 'bg-yellow-100 text-yellow-700',
		documentation: 'bg-indigo-100 text-indigo-700',
		testing: 'bg-pink-100 text-pink-700',
		design: 'bg-cyan-100 text-cyan-700',
		planning: 'bg-orange-100 text-orange-700',
		learning: 'bg-teal-100 text-teal-700'
	};
	return colors[category] || 'bg-gray-100 text-gray-700';
}

// Handle use pattern
function handleUse() {
	patternsStore.recordPatternUsage(pattern.id);
	onUse?.(pattern);
}

// Handle edit pattern
function handleEdit() {
	onEdit?.(pattern);
}

// Handle delete pattern
function handleDelete() {
	if (confirm(`Delete pattern "${pattern.name}"?`)) {
		onDelete?.(pattern);
	}
}

// Handle duplicate pattern
function handleDuplicate() {
	patternsStore.duplicatePattern(pattern.id);
}
</script>

<div class="pattern-card border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
	<!-- Card Header -->
	<div class="p-4 border-b border-gray-200">
		<div class="flex items-start justify-between">
			<!-- Pattern Info -->
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 mb-2">
					<!-- Pattern Name -->
					<h3 class="text-lg font-semibold text-gray-800 truncate">
						{pattern.name}
					</h3>

					<!-- Built-in Badge -->
					{#if pattern.isBuiltIn}
						<span class="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
							Built-in
						</span>
					{/if}
				</div>

				<!-- Description -->
				<p class="text-sm text-gray-600 mb-3 line-clamp-2">
					{pattern.description}
				</p>

				<!-- Metadata Row -->
				<div class="flex items-center gap-4 text-xs text-gray-500">
					<!-- Category -->
					<span class={`px-2 py-1 rounded-full font-medium ${getCategoryColor(pattern.category)}`}>
						{pattern.category}
					</span>

					<!-- Tags -->
					{#each pattern.tags.slice(0, 3) as tag}
						<span class="px-2 py-1 bg-gray-100 rounded">{tag}</span>
					{/each}
					{#if pattern.tags.length > 3}
						<span class="text-gray-400">+{pattern.tags.length - 3} more</span>
					{/if}

					<!-- Usage Count -->
					{#if pattern.usageCount > 0}
						<span class="flex items-center gap-1">
							<span>📊</span>
							<span>{pattern.usageCount} uses</span>
						</span>
					{/if}

					<!-- Rating -->
					{#if pattern.averageRating !== undefined}
						<span class="flex items-center gap-1">
							<span>⭐</span>
							<span>{pattern.averageRating.toFixed(1)} ({pattern.ratingCount || 0})</span>
						</span>
					{/if}
				</div>
			</div>

			<!-- Expand/Collapse Button -->
			<button
				onclick={() => (isExpanded = !isExpanded)}
				class="ml-4 px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
				aria-label={isExpanded ? 'Collapse' : 'Expand'}
			>
				{isExpanded ? '▲' : '▼'}
			</button>
		</div>
	</div>

	<!-- Expanded Details -->
	{#if isExpanded}
		<div class="p-4 space-y-4">
			<!-- Template Preview -->
			<div>
				<h4 class="text-sm font-semibold text-gray-700 mb-2">Template:</h4>
				<div class="p-3 bg-gray-50 border border-gray-200 rounded text-xs font-mono text-gray-800 max-h-40 overflow-y-auto whitespace-pre-wrap">
					{pattern.template}
				</div>
			</div>

			<!-- Variables -->
			{#if pattern.variables.length > 0}
				<div>
					<h4 class="text-sm font-semibold text-gray-700 mb-2">
						Variables ({pattern.variables.length}):
					</h4>
					<div class="space-y-2">
						{#each pattern.variables as variable}
							<div class="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
								<div class="flex items-center gap-2 mb-1">
									<span class="font-mono text-blue-700">{'{{'}}{variable.name}{'}}'}</span>
									{#if variable.required}
										<span class="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">Required</span>
									{/if}
									<span class="text-xs text-gray-500">{variable.type}</span>
								</div>
								<p class="text-xs text-gray-600">{variable.description}</p>
								{#if variable.exampleValue}
									<p class="text-xs text-gray-500 mt-1">
										Example: <span class="font-mono">{variable.exampleValue}</span>
									</p>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Recommended Models -->
			{#if pattern.recommendedModels && pattern.recommendedModels.length > 0}
				<div>
					<h4 class="text-sm font-semibold text-gray-700 mb-2">Recommended Models:</h4>
					<div class="flex flex-wrap gap-2">
						{#each pattern.recommendedModels as model}
							<span class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">{model}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Output Format -->
			{#if pattern.outputFormat}
				<div>
					<h4 class="text-sm font-semibold text-gray-700 mb-2">Output Format:</h4>
					<span class="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">{pattern.outputFormat}</span>
				</div>
			{/if}

			<!-- Metadata -->
			<div class="pt-3 border-t border-gray-200">
				<div class="grid grid-cols-2 gap-3 text-xs text-gray-500">
					<div>
						<span class="font-medium">Author:</span> {pattern.author}
					</div>
					<div>
						<span class="font-medium">Version:</span> {pattern.version}
					</div>
					<div>
						<span class="font-medium">Created:</span> {new Date(pattern.createdAt).toLocaleDateString()}
					</div>
					<div>
						<span class="font-medium">Updated:</span> {new Date(pattern.updatedAt).toLocaleDateString()}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Card Actions -->
	<div class="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
		<!-- Primary Actions -->
		<div class="flex gap-2">
			<button
				onclick={handleUse}
				class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
			>
				Use Pattern
			</button>
			{#if !pattern.isBuiltIn}
				<button
					onclick={handleEdit}
					class="px-4 py-2 border border-gray-300 text-sm rounded hover:bg-white transition-colors"
				>
					Edit
				</button>
			{/if}
		</div>

		<!-- Secondary Actions -->
		<div class="flex gap-2">
			<button
				onclick={handleDuplicate}
				class="px-3 py-2 border border-gray-300 text-sm rounded hover:bg-white transition-colors"
				title="Duplicate for customization"
			>
				📋 Duplicate
			</button>
			{#if !pattern.isBuiltIn}
				<button
					onclick={handleDelete}
					class="px-3 py-2 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50 transition-colors"
					title="Delete pattern"
				>
					🗑️ Delete
				</button>
			{/if}
		</div>
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
