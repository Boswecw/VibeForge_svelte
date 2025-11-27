<script lang="ts">
	import type { FileTreeNode } from '../stores/source.svelte';
	import FileTreeItem from './FileTreeItem.svelte';

	interface Props {
		files: FileTreeNode[];
		onSelect?: (path: string) => void;
	}

	let { files, onSelect }: Props = $props();
</script>

<div class="file-tree text-sm">
	{#if files.length === 0}
		<div class="text-center py-4 text-slate-500 text-sm">
			<p>No files found</p>
		</div>
	{:else}
		{#each files as node (node.path)}
			<FileTreeItem {node} {onSelect} depth={0} />
		{/each}
	{/if}
</div>

<style>
	.file-tree {
		max-height: 400px;
		overflow-y: auto;
	}
</style>
