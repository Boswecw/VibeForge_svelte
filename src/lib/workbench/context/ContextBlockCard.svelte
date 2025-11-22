<script lang="ts">
	/**
	 * ContextBlockCard component - Display individual context blocks
	 * Shows block content, metadata, and controls
	 */

	import type { ContextBlock } from '$lib/core/types';
	import { contextBlocksStore } from '$lib/core/stores';
	import Button from '$lib/ui/primitives/Button.svelte';
	import Tag from '$lib/ui/primitives/Tag.svelte';

	interface Props {
		block: ContextBlock;
		isDragging?: boolean;
		isDropTarget?: boolean;
		onDragStart?: () => void;
		onDragOver?: (e: DragEvent) => void;
		onDragLeave?: () => void;
		onDrop?: (e: DragEvent) => void;
		onDragEnd?: () => void;
	}

	const { 
		block, 
		isDragging = false, 
		isDropTarget = false,
		onDragStart,
		onDragOver,
		onDragLeave,
		onDrop,
		onDragEnd
	}: Props = $props();

	// Kind-specific colors
	const kindColors = {
		system: 'primary',
		design: 'info',
		project: 'warning',
		code: 'success',
		workflow: 'default',
		data: 'default'
	} as const;

	// Format timestamp
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const hours = Math.floor(diff / (1000 * 60 * 60));

		if (hours < 1) return 'Just now';
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d ago`;
		return date.toLocaleDateString();
	}

	// Truncate content for preview
	const preview = $derived(
		block.content.length > 200 ? block.content.slice(0, 200) + '...' : block.content
	);

	// Count tokens (rough estimate: ~4 chars per token)
	const estimatedTokens = $derived(Math.ceil(block.content.length / 4));

	// Calculate cost contribution (GPT-4 pricing: $0.03 per 1K tokens)
	const costContribution = $derived((estimatedTokens / 1000) * 0.03);

	// Mock usage rate (in real app, this would come from execution history)
	const usageRate = $derived(block.metadata?.usageRate as number || 0);

	function handleToggleActive() {
		contextBlocksStore.toggleActive(block.id);
	}

	function handleRemove() {
		if (confirm(`Remove context block "${block.title}"?`)) {
			contextBlocksStore.removeBlock(block.id);
		}
	}

	function formatCost(cost: number): string {
		if (cost < 0.001) return '<$0.001';
		return `$${cost.toFixed(3)}`;
	}
</script>

<div
	role="listitem"
	draggable={block.isActive}
	ondragstart={onDragStart}
	ondragover={onDragOver}
	ondragleave={onDragLeave}
	ondrop={onDrop}
	ondragend={onDragEnd}
	class="context-block-card bg-forge-gunmetal rounded-lg border transition-all duration-200
		{block.isActive
		? 'border-forge-ember shadow-md shadow-forge-ember/10'
		: 'border-slate-700 hover:border-slate-600'}
		{isDragging ? 'opacity-50 cursor-move' : block.isActive ? 'cursor-move' : ''}
		{isDropTarget ? 'ring-2 ring-forge-ember ring-offset-2 ring-offset-forge-blacksteel' : ''}"
>
	<!-- Header -->
	<div class="p-3 border-b border-slate-700">
		<div class="flex items-start justify-between gap-2">
			<!-- Drag handle -->
			{#if block.isActive}
				<div class="shrink-0 text-slate-500 hover:text-slate-400 cursor-move pt-0.5">
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
					</svg>
				</div>
			{/if}

			<div class="flex-1 min-w-0">
				<h4 class="text-sm font-semibold text-slate-100 truncate">
					{block.title}
				</h4>
				{#if block.source}
					<p class="text-xs text-slate-400 truncate mt-0.5">{block.source}</p>
				{/if}
			</div>

			<!-- Active Toggle -->
			<button
				onclick={handleToggleActive}
				class="shrink-0 w-10 h-5 rounded-full transition-colors duration-200 relative
					{block.isActive ? 'bg-forge-ember' : 'bg-slate-600'}"
				aria-label={block.isActive ? 'Exclude from execution' : 'Include in execution'}
				title={block.isActive ? 'Exclude from execution' : 'Include in execution'}
			>
				<div
					class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
						{block.isActive ? 'left-5' : 'left-0.5'}"
				></div>
			</button>
		</div>

		<!-- Metadata -->
		<div class="flex items-center gap-2 mt-2 flex-wrap">
			<Tag variant={kindColors[block.kind] || 'default'} size="sm">
				{#snippet children()}
					{block.kind}
				{/snippet}
			</Tag>

			<span class="text-xs text-slate-500 flex items-center gap-1">
				<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
				</svg>
				{estimatedTokens}
			</span>

			{#if block.isActive}
				<span class="text-xs text-slate-500 flex items-center gap-1">
					<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
						<path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path>
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"></path>
					</svg>
					{formatCost(costContribution)}
				</span>
			{/if}

			{#if usageRate > 0}
				<span class="text-xs text-slate-500 flex items-center gap-1">
					<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
					</svg>
					{usageRate}% used
				</span>
			{/if}

			{#if block.createdAt}
				<span class="text-xs text-slate-500">•</span>
				<span class="text-xs text-slate-500">{formatDate(block.createdAt)}</span>
			{/if}
		</div>
	</div>

	<!-- Content Preview -->
	<div class="p-3">
		<pre
			class="text-xs text-slate-300 whitespace-pre-wrap font-mono overflow-hidden">{preview}</pre>
	</div>

	<!-- Actions -->
	<div class="px-3 pb-3 flex items-center justify-end gap-2">
		<Button variant="ghost" size="sm">
			{#snippet children()}
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
					></path>
				</svg>
				Edit
			{/snippet}
		</Button>

		<Button variant="ghost" size="sm" onclick={handleRemove}>
			{#snippet children()}
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					></path>
				</svg>
				Remove
			{/snippet}
		</Button>
	</div>
</div>
