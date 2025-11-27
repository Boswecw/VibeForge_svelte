<script lang="ts">
	/**
	 * ContextColumn component - Main container for context management
	 * Left column of the 3-column workbench layout
	 */

	import { contextBlocksStore, promptStore } from '$lib/core/stores';
	import Button from '$lib/ui/primitives/Button.svelte';
	import SectionHeader from '$lib/ui/primitives/SectionHeader.svelte';
	import Tag from '$lib/ui/primitives/Tag.svelte';
	import ContextBlockCard from './ContextBlockCard.svelte';
	import ContextBlockEditor from './ContextBlockEditor.svelte';
	import ContextMetrics from './ContextMetrics.svelte';
	import McpToolsSection from './McpToolsSection.svelte';
	import PromptSelector from '../prompts/PromptSelector.svelte';
	import { SourcePanel } from '../source';

	let showEditor = $state(false);
	let showInactive = $state(false);
	let activeTab = $state<'context' | 'prompts'>('prompts');
	let draggedBlockId = $state<string | null>(null);
	let dropTargetId = $state<string | null>(null);

	function handleNewBlock() {
		showEditor = true;
	}

	function handleCloseEditor() {
		showEditor = false;
	}

	function handleActivateAll() {
		contextBlocksStore.activateAll();
	}

	function handleDeactivateAll() {
		contextBlocksStore.deactivateAll();
	}

	// Drag and drop handlers
	function handleDragStart(blockId: string) {
		draggedBlockId = blockId;
	}

	function handleDragOver(e: DragEvent, blockId: string) {
		e.preventDefault();
		if (draggedBlockId && draggedBlockId !== blockId) {
			dropTargetId = blockId;
		}
	}

	function handleDragLeave() {
		dropTargetId = null;
	}

	function handleDrop(e: DragEvent, targetId: string) {
		e.preventDefault();
		if (draggedBlockId && draggedBlockId !== targetId) {
			contextBlocksStore.reorderBlock(draggedBlockId, targetId);
		}
		draggedBlockId = null;
		dropTargetId = null;
	}

	function handleDragEnd() {
		draggedBlockId = null;
		dropTargetId = null;
	}

	// Format token count
	function formatTokens(count: number): string {
		if (count >= 1000) {
			return `${(count / 1000).toFixed(1)}k`;
		}
		return count.toString();
	}

	// Calculate cost estimation for active context
	// Rough estimate: $0.03 per 1K input tokens for GPT-4
	const estimatedCost = $derived(
		(contextBlocksStore.totalActiveTokens / 1000) * 0.03
	);

	function formatCost(cost: number): string {
		if (cost < 0.01) return '<$0.01';
		return `$${cost.toFixed(3)}`;
	}

	function handleFileSelect(path: string, content: string) {
		// Load file content into prompt editor
		promptStore.setText(content);

		// Dispatch event to focus editor (prompt column will listen)
		window.dispatchEvent(new CustomEvent('focus-editor'));
	}
</script>

<div class="context-column flex flex-col h-full bg-forge-blacksteel">
	<!-- Column Header with Tabs -->
	<div class="shrink-0 border-b border-slate-800">
		<div class="p-4 pb-0">
			<SectionHeader title={activeTab === 'context' ? 'Context' : 'Prompts'} description={activeTab === 'context' ? 'Manage context blocks and tools' : 'Browse and load saved prompts'} level={2}>
				<svelte:fragment slot="actions">
					{#if activeTab === 'context'}
						<Button variant="primary" size="sm" onclick={handleNewBlock}>
							{#snippet children()}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
								</svg>
								New
							{/snippet}
						</Button>
					{/if}
				</svelte:fragment>
			</SectionHeader>
		</div>

		<!-- Tab Navigation -->
		<div class="flex border-b border-slate-800">
			<button
				onclick={() => (activeTab = 'prompts')}
				class="flex-1 px-4 py-3 text-sm font-medium transition-colors relative {activeTab === 'prompts'
					? 'text-forge-ember'
					: 'text-slate-400 hover:text-slate-300'}"
			>
				Prompts
				{#if activeTab === 'prompts'}
					<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-forge-ember"></div>
				{/if}
			</button>
			<button
				onclick={() => (activeTab = 'context')}
				class="flex-1 px-4 py-3 text-sm font-medium transition-colors relative {activeTab === 'context'
					? 'text-forge-ember'
					: 'text-slate-400 hover:text-slate-300'}"
			>
				Context
				{#if activeTab === 'context'}
					<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-forge-ember"></div>
				{/if}
			</button>
		</div>

		{#if activeTab === 'context'}
			<!-- Context Stats -->
			<div class="px-4 py-3 space-y-2 border-b border-slate-800">
				<div class="flex items-center gap-2 flex-wrap">
					<Tag variant={contextBlocksStore.activeBlocks.length > 0 ? 'success' : 'default'} size="sm">
						{#snippet children()}
							<svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
								<path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path>
							</svg>
							{contextBlocksStore.activeBlocks.length} / {contextBlocksStore.blocks.length}
						{/snippet}
					</Tag>

					{#if contextBlocksStore.totalActiveTokens > 0}
						<Tag variant="info" size="sm">
							{#snippet children()}
								<svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
								</svg>
								{formatTokens(contextBlocksStore.totalActiveTokens)}
							{/snippet}
						</Tag>
						<Tag variant="warning" size="sm">
							{#snippet children()}
								<svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
									<path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path>
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"></path>
								</svg>
								~{formatCost(estimatedCost)}
							{/snippet}
						</Tag>
					{/if}

					{#if contextBlocksStore.blocks.length > 0}
						<div class="ml-auto">
							<Button variant="ghost" size="sm" onclick={showInactive ? handleDeactivateAll : handleActivateAll}>
								{#snippet children()}
									{#if contextBlocksStore.activeBlocks.length === contextBlocksStore.blocks.length}
										<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
										</svg>
										Disable All
									{:else}
										<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
										</svg>
										Enable All
									{/if}
								{/snippet}
							</Button>
						</div>
					{/if}
				</div>
				
				<!-- Drag hint -->
				{#if contextBlocksStore.activeBlocks.length > 1}
					<div class="text-xs text-slate-500 flex items-center gap-1">
						<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
							<path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
						</svg>
						Drag to reorder
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Scrollable Content Area -->
	<div class="flex-1 overflow-y-auto {activeTab === 'context' ? 'p-4 space-y-4' : ''}">
		{#if activeTab === 'prompts'}
			<!-- Prompts Tab -->
			<PromptSelector />
		{:else}
			<!-- Context Tab -->
			<!-- Editor (when open) -->
			{#if showEditor}
				<ContextBlockEditor onclose={handleCloseEditor} />
			{/if}

			<!-- Context Metrics -->
			{#if contextBlocksStore.blocks.length > 0}
				<ContextMetrics />
			{/if}

		<!-- Active Context Blocks -->
		{#if contextBlocksStore.activeBlocks.length > 0}
			<div class="space-y-3">
				{#each contextBlocksStore.activeBlocks as block (block.id)}
					<ContextBlockCard 
						{block} 
						isDragging={draggedBlockId === block.id}
						isDropTarget={dropTargetId === block.id}
						onDragStart={() => handleDragStart(block.id)}
						onDragOver={(e) => handleDragOver(e, block.id)}
						onDragLeave={handleDragLeave}
						onDrop={(e) => handleDrop(e, block.id)}
						onDragEnd={handleDragEnd}
					/>
				{/each}
			</div>
		{/if}

		<!-- Inactive Blocks Section -->
		{#if contextBlocksStore.inactiveBlocks.length > 0}
			<div class="mt-4">
				<button
					onclick={() => (showInactive = !showInactive)}
					class="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors mb-3"
				>
					<svg
						class="w-4 h-4 transition-transform duration-200 {showInactive ? 'rotate-90' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
					</svg>
					<span>Inactive Blocks ({contextBlocksStore.inactiveBlocks.length})</span>
				</button>

				{#if showInactive}
					<div class="space-y-3">
						{#each contextBlocksStore.inactiveBlocks as block (block.id)}
							<ContextBlockCard {block} />
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Empty State -->
		{#if contextBlocksStore.blocks.length === 0 && !showEditor}
			<div class="text-center py-12 text-slate-500">
				<svg class="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
				</svg>
				<p class="text-base mb-2">No context blocks yet</p>
				<p class="text-sm mb-4">Add context blocks to provide background information</p>
				<Button variant="primary" size="md" onclick={handleNewBlock}>
					{#snippet children()}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
						</svg>
						Create First Block
					{/snippet}
				</Button>
			</div>
		{/if}

			<!-- MCP Tools Section -->
			<div class="mt-6">
				<McpToolsSection />
			</div>

			<!-- Source Panel (GitHub Integration) -->
			<div class="mt-6">
				<SourcePanel onFileSelect={handleFileSelect} />
			</div>
		{/if}
	</div>
</div>
