<script lang="ts">
	import { sourceStore } from '../stores/source.svelte';

	interface Props {
		onConnect?: () => void;
		onCancel?: () => void;
	}

	let { onConnect, onCancel }: Props = $props();

	let url = $state('');
	let branch = $state('main');
	let subdirectory = $state('');
	let isPrivate = $state(false);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Parse GitHub URL
	const parsed = $derived.by(() => {
		const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
		if (match) {
			return { owner: match[1], repo: match[2].replace('.git', '') };
		}
		return null;
	});

	const isValid = $derived(parsed !== null);

	async function handleConnect() {
		const info = parsed;
		if (!info) return;

		isLoading = true;
		error = null;

		try {
			await sourceStore.connect({
				owner: info.owner,
				repo: info.repo,
				branch,
				subdirectory: subdirectory || undefined,
				isPrivate
			});

			onConnect?.();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to connect';
		} finally {
			isLoading = false;
		}
	}

	async function handleOAuth() {
		// TODO: Implement GitHub OAuth flow
		// For now, just set isPrivate flag
		isPrivate = true;
	}
</script>

<!-- Modal -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
	onclick={(e) => {
		if (e.target === e.currentTarget) onCancel?.();
	}}
>
	<div
		class="bg-forge-blacksteel border border-slate-700 rounded-lg shadow-xl max-w-md w-full mx-4"
	>
		<!-- Header -->
		<div class="px-6 py-4 border-b border-slate-700">
			<h2 class="text-lg font-semibold text-slate-200">Connect GitHub Repository</h2>
		</div>

		<!-- Content -->
		<div class="p-6 space-y-4">
			<!-- URL Input -->
			<div>
				<label for="url" class="block text-sm font-medium text-slate-300 mb-2"
					>Repository URL</label
				>
				<input
					id="url"
					type="text"
					bind:value={url}
					placeholder="https://github.com/owner/repo"
					class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-forge-ember"
				/>
				{#if parsed}
					<p class="mt-1 text-xs text-green-400">
						✓ {parsed.owner}/{parsed.repo}
					</p>
				{/if}
			</div>

			<!-- Branch -->
			<div>
				<label for="branch" class="block text-sm font-medium text-slate-300 mb-2">Branch</label>
				<input
					id="branch"
					type="text"
					bind:value={branch}
					placeholder="main"
					class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-forge-ember"
				/>
			</div>

			<!-- Subdirectory (optional) -->
			<div>
				<label for="subdirectory" class="block text-sm font-medium text-slate-300 mb-2"
					>Subdirectory (optional)</label
				>
				<input
					id="subdirectory"
					type="text"
					bind:value={subdirectory}
					placeholder="src/lib"
					class="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-forge-ember"
				/>
			</div>

			<!-- Private repo toggle -->
			<div class="flex items-center gap-3">
				<input
					type="checkbox"
					id="private"
					bind:checked={isPrivate}
					class="rounded border-slate-600 bg-slate-800 text-forge-ember focus:ring-forge-ember"
				/>
				<label for="private" class="text-sm text-slate-300"> Private repository </label>
			</div>

			{#if isPrivate}
				<button
					onclick={handleOAuth}
					class="w-full px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
				>
					🔑 Authorize with GitHub
				</button>
			{/if}

			<!-- Error -->
			{#if error}
				<div
					class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
				>
					{error}
				</div>
			{/if}
		</div>

		<!-- Actions -->
		<div class="flex justify-end gap-3 px-6 py-4 border-t border-slate-700">
			<button
				onclick={onCancel}
				class="px-4 py-2 text-slate-300 hover:text-slate-100 transition-colors"
			>
				Cancel
			</button>
			<button
				onclick={handleConnect}
				disabled={!isValid || isLoading}
				class="px-4 py-2 bg-forge-ember text-white rounded-lg hover:bg-forge-ember/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isLoading ? 'Connecting...' : 'Connect'}
			</button>
		</div>
	</div>
</div>
