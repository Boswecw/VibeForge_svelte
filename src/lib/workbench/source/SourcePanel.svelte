<script lang="ts">
	import { sourceStore } from '../stores/source.svelte';
	import GitHubConnector from './GitHubConnector.svelte';
	import FileTree from './FileTree.svelte';

	interface Props {
		onFileSelect?: (path: string, content: string) => void;
	}

	let { onFileSelect }: Props = $props();

	let showConnector = $state(false);

	const connected = $derived(sourceStore.isConnected);
	const repo = $derived(sourceStore.repo);
	const files = $derived(sourceStore.fileTree);

	function handleDisconnect() {
		sourceStore.disconnect();
	}

	async function handleFileSelect(path: string) {
		try {
			const content = await sourceStore.loadFile(path);
			onFileSelect?.(path, content);
		} catch (error) {
			console.error('Failed to load file:', error);
		}
	}
</script>

<div class="source-panel">
	<div class="mb-4">
		<h3 class="text-sm font-semibold text-slate-300 uppercase tracking-wide">Source</h3>
	</div>

	{#if connected && repo}
		<!-- Connected State -->
		<div class="mt-4">
			<div class="flex items-center justify-between mb-3">
				<div class="flex items-center gap-2">
					<span class="text-lg">📁</span>
					<div>
						<div class="text-sm font-medium text-slate-200">{repo.name}</div>
						<div class="text-xs text-slate-500">
							{repo.owner}/{repo.name}
						</div>
					</div>
				</div>
				<button
					onclick={handleDisconnect}
					class="text-xs text-slate-500 hover:text-red-400 transition-colors"
				>
					Disconnect
				</button>
			</div>

			<FileTree {files} onSelect={handleFileSelect} />
		</div>
	{:else}
		<!-- Empty State -->
		<div class="mt-4 space-y-3">
			<p class="text-sm text-slate-400">Connect a repository or upload files to analyze</p>

			<div class="space-y-2">
				<button
					onclick={() => (showConnector = true)}
					class="w-full flex items-center justify-start gap-2 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
				>
					<span>🔗</span>
					<span>Connect GitHub</span>
				</button>

				<button
					onclick={() => {
						/* TODO: file upload */
					}}
					class="w-full flex items-center justify-start gap-2 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
				>
					<span>📁</span>
					<span>Upload Files</span>
				</button>
			</div>
		</div>
	{/if}
</div>

{#if showConnector}
	<GitHubConnector onConnect={() => (showConnector = false)} onCancel={() => (showConnector = false)} />
{/if}
