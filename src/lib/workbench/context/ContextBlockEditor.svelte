<script lang="ts">
	/**
	 * ContextBlockEditor component - Add/edit context blocks
	 * Modal or inline form for creating and editing context blocks
	 */

	import type { ContextBlock, ContextKind, ContextSource } from '$lib/core/types';
	import { contextBlocksStore } from '$lib/core/stores';
	import Button from '$lib/ui/primitives/Button.svelte';
	import Input from '$lib/ui/primitives/Input.svelte';
	import Panel from '$lib/ui/primitives/Panel.svelte';
	import SectionHeader from '$lib/ui/primitives/SectionHeader.svelte';

	interface Props {
		block?: ContextBlock;
		onclose?: () => void;
	}

	const { block, onclose }: Props = $props();

	// Form state
	let title = $state(block?.title || '');
	let content = $state(block?.content || '');
	let description = $state(block?.description || '');
	let tags = $state<string[]>(block?.tags || []);
	let source = $state<ContextSource>(block?.source || 'local');
	let kind: ContextKind = $state(block?.kind || 'code');
	let isActive = $state(block?.isActive ?? true);

	const isEditing = $derived(!!block);

	// Validation
	const isValid = $derived(title.trim().length > 0 && content.trim().length > 0);

	// Token estimate
	const estimatedTokens = $derived(Math.ceil(content.length / 4));

	function handleSave() {
		if (!isValid) return;

		if (isEditing && block) {
			// Update existing block
			contextBlocksStore.updateBlock(block.id, {
				title,
				content,
				description,
				tags,
				source,
				kind,
				isActive,
				updatedAt: new Date().toISOString()
			});
		} else {
			// Create new block
			const newBlock: ContextBlock = {
				id: `ctx_${Date.now()}`,
				title,
				content,
				description,
				tags,
				source,
				kind,
				isActive,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			contextBlocksStore.addBlock(newBlock);
		}

		onclose?.();
	}

	function handleCancel() {
		onclose?.();
	}

	const kindOptions: { value: ContextKind; label: string }[] = [
		{ value: 'system', label: 'System' },
		{ value: 'design', label: 'Design' },
		{ value: 'project', label: 'Project' },
		{ value: 'code', label: 'Code' },
		{ value: 'workflow', label: 'Workflow' },
		{ value: 'data', label: 'Data' }
	];

	const sourceOptions: { value: ContextSource; label: string }[] = [
		{ value: 'global', label: 'Global' },
		{ value: 'workspace', label: 'Workspace' },
		{ value: 'local', label: 'Local' }
	];
</script>

<Panel variant="elevated" padding="lg" class="context-block-editor">
	<SectionHeader title={isEditing ? 'Edit Context Block' : 'New Context Block'} level={3} />

	<div class="space-y-4 mt-4">
		<!-- Title -->
		<div>
			<Input
				value={title}
				oninput={(e) => title = e.currentTarget.value}
				label="Title"
				placeholder="Enter a descriptive title"
				required={true}
			/>
		</div>

		<!-- Kind & Source -->
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="kind" class="block text-sm font-medium text-slate-300 mb-2">
					Kind <span class="text-red-500 ml-1">*</span>
				</label>
				<select
					id="kind"
					bind:value={kind}
					class="w-full px-4 py-2 bg-forge-gunmetal border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:border-forge-ember focus:ring-forge-ember/50 transition-all"
				>
					{#each kindOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="source" class="block text-sm font-medium text-slate-300 mb-2">
					Source <span class="text-red-500 ml-1">*</span>
				</label>
				<select
					id="source"
					bind:value={source}
					class="w-full px-4 py-2 bg-forge-gunmetal border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:border-forge-ember focus:ring-forge-ember/50 transition-all"
				>
					{#each sourceOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Content -->
		<div>
			<label for="content" class="block text-sm font-medium text-slate-300 mb-2">
				Content <span class="text-red-500 ml-1">*</span>
			</label>
			<textarea
				id="content"
				bind:value={content}
				placeholder="Paste or enter your context content here..."
				rows="12"
				class="w-full px-4 py-2 bg-forge-gunmetal border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 font-mono text-sm focus:outline-none focus:ring-2 focus:border-forge-ember focus:ring-forge-ember/50 transition-all resize-y"
			></textarea>
			<p class="mt-2 text-sm text-slate-400">~{estimatedTokens} tokens</p>
		</div>

		<!-- Active Toggle -->
		<div class="flex items-center gap-3">
			<label for="active-toggle" class="text-sm font-medium text-slate-300">
				Include in context
			</label>
			<button
				id="active-toggle"
				type="button"
				onclick={() => (isActive = !isActive)}
				class="w-12 h-6 rounded-full transition-colors duration-200 relative
					{isActive ? 'bg-forge-ember' : 'bg-slate-600'}"
				aria-label={isActive ? 'Deactivate' : 'Activate'}
			>
				<div
					class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
						{isActive ? 'left-6' : 'left-0.5'}"
				></div>
			</button>
		</div>

		<!-- Actions -->
		<div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
			<Button variant="ghost" size="md" onclick={handleCancel}>
				{#snippet children()}Cancel{/snippet}
			</Button>

			<Button variant="primary" size="md" disabled={!isValid} onclick={handleSave}>
				{#snippet children()}
					{isEditing ? 'Update' : 'Create'} Block
				{/snippet}
			</Button>
		</div>
	</div>
</Panel>
