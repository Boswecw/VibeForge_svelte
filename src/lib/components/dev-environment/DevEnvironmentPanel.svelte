<!-- @component
no description yet
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import {
		checkRuntimes,
		refreshRuntimeCache,
		getInstallInstructions,
		type RuntimeCheckResult
	} from '$lib/api/runtimeClient';
	import RuntimeStatusTable from './RuntimeStatusTable.svelte';

	let result: RuntimeCheckResult | null = $state(null);
	let loading = $state(true);
	let error: string | null = $state(null);
	let selectedCategory = $state<'all' | 'frontend' | 'backend' | 'systems' | 'mobile'>('all');
	let showInstructionsModal = $state(false);
	let selectedRuntimeId = $state<string | null>(null);
	let instructions = $state<string>('');

	onMount(async () => {
		await loadRuntimes();
	});

	async function loadRuntimes() {
		loading = true;
		error = null;
		try {
			result = await checkRuntimes();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load runtime status';
			console.error('Failed to load runtimes:', err);
		} finally {
			loading = false;
		}
	}

	async function handleRefresh() {
		await refreshRuntimeCache();
		await loadRuntimes();
	}

	async function handleShowInstructions(runtimeId: string) {
		selectedRuntimeId = runtimeId;
		showInstructionsModal = true;
		instructions = await getInstallInstructions(runtimeId);
	}

	function closeModal() {
		showInstructionsModal = false;
		selectedRuntimeId = null;
		instructions = '';
	}

	const categories = [
		{ id: 'all', label: 'All Runtimes', emoji: '🔧' },
		{ id: 'frontend', label: 'Frontend', emoji: '🎨' },
		{ id: 'backend', label: 'Backend', emoji: '⚙️' },
		{ id: 'systems', label: 'Systems', emoji: '💻' },
		{ id: 'mobile', label: 'Mobile', emoji: '📱' }
	] as const;

	const stats = $derived.by(() => {
		if (!result) return null;
		return {
			total: result.runtimes.length,
			installed: result.runtimes.filter((r) => r.installed).length,
			missing: result.runtimes.filter((r) => !r.installed && !r.notes?.includes('Container'))
				.length,
			containerOnly: result.container_only.length
		};
	});
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-gray-900">Development Environment</h2>
      <p class="mt-1 text-sm text-gray-600">
        Check your system for installed language runtimes and development tools
      </p>
    </div>
    <button
      onclick={handleRefresh}
      disabled={loading}
      class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? "⟳ Checking..." : "↻ Refresh"}
    </button>
  </div>

  <!-- Error State -->
  {#if error}
    <div class="rounded-lg border border-red-200 bg-red-50 p-4">
      <div class="flex items-start gap-3">
        <span class="text-2xl">⚠️</span>
        <div>
          <h3 class="font-medium text-red-900">Error Loading Runtime Status</h3>
          <p class="mt-1 text-sm text-red-700">{error}</p>
          <button
            onclick={handleRefresh}
            class="mt-2 text-sm font-medium text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Stats Cards -->
  {#if stats && !loading}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Runtimes</p>
            <p class="mt-1 text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <span class="text-4xl">🔧</span>
        </div>
      </div>

      <div class="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-green-700">Installed</p>
            <p class="mt-1 text-3xl font-bold text-green-900">
              {stats.installed}
            </p>
          </div>
          <span class="text-4xl">✅</span>
        </div>
      </div>

      <div
        class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-yellow-700">Missing</p>
            <p class="mt-1 text-3xl font-bold text-yellow-900">
              {stats.missing}
            </p>
          </div>
          <span class="text-4xl">⚠️</span>
        </div>
      </div>

      <div class="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-blue-700">Container-Only</p>
            <p class="mt-1 text-3xl font-bold text-blue-900">
              {stats.containerOnly}
            </p>
          </div>
          <span class="text-4xl">🐳</span>
        </div>
      </div>
    </div>
  {/if}

  <!-- Category Tabs -->
  <div class="border-b border-gray-200">
    <nav class="flex gap-2">
      {#each categories as category}
        <button
          onclick={() => (selectedCategory = category.id)}
          class={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            selectedCategory === category.id
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
          }`}
        >
          <span class="mr-1.5">{category.emoji}</span>
          {category.label}
        </button>
      {/each}
    </nav>
  </div>

  <!-- Runtime Table -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin text-6xl mb-4">⟳</div>
        <p class="text-gray-600">Checking your development environment...</p>
      </div>
    </div>
  {:else if result}
    <RuntimeStatusTable
      runtimes={result.runtimes}
      category={selectedCategory}
      onShowInstructions={handleShowInstructions}
    />
  {/if}

  <!-- Missing Required Warning -->
  {#if result && result.missing_required.length > 0}
    <div class="rounded-lg border border-red-200 bg-red-50 p-4">
      <div class="flex items-start gap-3">
        <span class="text-2xl">❌</span>
        <div class="flex-1">
          <h3 class="font-medium text-red-900">Missing Required Runtimes</h3>
          <p class="mt-1 text-sm text-red-700">
            The following required runtimes are not installed on your system:
          </p>
          <ul class="mt-2 list-disc list-inside text-sm text-red-700">
            {#each result.missing_required as missing}
              <li>{missing}</li>
            {/each}
          </ul>
          <p class="mt-2 text-sm text-red-600">
            Please install these runtimes before continuing with project
            creation.
          </p>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Installation Instructions Modal -->
{#if showInstructionsModal}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    onclick={closeModal}
    role="presentation"
  >
    <div
      class="relative max-w-2xl w-full mx-4 bg-white rounded-lg shadow-xl"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div
        class="flex items-center justify-between border-b border-gray-200 px-6 py-4"
      >
        <h3 class="text-lg font-semibold text-gray-900">
          Installation Instructions
        </h3>
        <button
          onclick={closeModal}
          class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      <div class="px-6 py-4">
        <pre
          class="whitespace-pre-wrap rounded-lg bg-gray-900 p-4 text-sm text-gray-100 font-mono overflow-x-auto">{instructions}</pre>
      </div>

      <div class="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
        <button
          onclick={() => navigator.clipboard.writeText(instructions)}
          class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors"
        >
          📋 Copy
        </button>
        <button
          onclick={closeModal}
          class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
