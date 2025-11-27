<script lang="ts">
	import type { FileTreeNode } from '../stores/source.svelte';

	interface Props {
		node: FileTreeNode;
		depth: number;
		onSelect?: (path: string) => void;
	}

	let { node, depth, onSelect }: Props = $props();

	let expanded = $state(depth < 2); // Auto-expand first 2 levels

	const icon = $derived(
		node.type === 'directory' ? (expanded ? '📂' : '📁') : getFileIcon(node.name)
	);

	function getFileIcon(name: string): string {
		if (name.endsWith('.ts') || name.endsWith('.tsx')) return '🔷';
		if (name.endsWith('.js') || name.endsWith('.jsx')) return '🟨';
		if (name.endsWith('.svelte')) return '🟠';
		if (name.endsWith('.json')) return '📋';
		if (name.endsWith('.md')) return '📝';
		if (name.endsWith('.css')) return '🎨';
		return '📄';
	}

	function handleClick() {
		if (node.type === 'directory') {
			expanded = !expanded;
		} else {
			onSelect?.(node.path);
		}
	}
</script>

<div>
	<button
		class="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-700/50 text-left"
		style="padding-left: {depth * 12 + 8}px"
		onclick={handleClick}
	>
		<span class="text-xs">{icon}</span>
		<span class="truncate text-slate-300">{node.name}</span>
	</button>

	{#if node.type === 'directory' && expanded && node.children}
		{#each node.children as child (child.path)}
			<svelte:self node={child} depth={depth + 1} {onSelect} />
		{/each}
	{/if}
</div>
