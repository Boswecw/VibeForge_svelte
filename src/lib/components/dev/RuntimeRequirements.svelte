<script lang="ts">
  /**
   * Runtime Requirements Component
   * Phase 2.7.3: Wizard Runtime Integration
   *
   * Displays runtime requirements for selected languages/stacks with status indicators
   */

  import { invoke } from '@tauri-apps/api/tauri';
  import { onMount } from 'svelte';

  // ============================================================================
  // Types
  // ============================================================================

  interface RuntimeStatus {
    id: string;
    name: string;
    category: string;
    required: boolean;
    installed: boolean;
    onPath: boolean;
    version: string | null;
    path: string | null;
    lastChecked: number | null;
    notes: string | null;
  }

  interface RuntimeCheckResult {
    runtimes: RuntimeStatus[];
    allRequiredMet: boolean;
    missingRequired: string[];
    containerOnly: string[];
    timestamp: number;
  }

  // ============================================================================
  // Props
  // ============================================================================

  interface Props {
    requiredRuntimes?: string[]; // Runtime IDs that are required for this configuration
    showInstallButton?: boolean; // Show install guide button
    compact?: boolean; // Compact display mode
    onInstallClick?: (runtimeId: string) => void; // Callback for install button
  }

  let {
    requiredRuntimes = [],
    showInstallButton = true,
    compact = false,
    onInstallClick
  }: Props = $props();

  // ============================================================================
  // State
  // ============================================================================

  let allRuntimes = $state<RuntimeStatus[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);

  // ============================================================================
  // Computed
  // ============================================================================

  const filteredRuntimes = $derived(
    requiredRuntimes.length > 0
      ? allRuntimes.filter(r => requiredRuntimes.includes(r.id))
      : allRuntimes.filter(r => r.required) // Default: show all required runtimes
  );

  const allInstalled = $derived(
    filteredRuntimes.every(r => r.installed || r.notes?.includes('Container-only'))
  );

  const missingRuntimes = $derived(
    filteredRuntimes.filter(r => !r.installed && !r.notes?.includes('Container-only'))
  );

  const containerOnlyRuntimes = $derived(
    filteredRuntimes.filter(r => r.notes?.includes('Container-only'))
  );

  const installedRuntimes = $derived(filteredRuntimes.filter(r => r.installed));

  // ============================================================================
  // Functions
  // ============================================================================

  async function loadRuntimes() {
    try {
      isLoading = true;
      error = null;

      const result: RuntimeCheckResult = await invoke('check_runtimes');
      allRuntimes = result.runtimes;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load runtime status';
      console.error('[RuntimeRequirements] Error:', err);
    } finally {
      isLoading = false;
    }
  }

  function getStatusIcon(runtime: RuntimeStatus): string {
    if (runtime.notes?.includes('Container-only')) return '🐳';
    if (runtime.installed) return '✅';
    return '⚠️';
  }

  function getStatusColor(runtime: RuntimeStatus): string {
    if (runtime.notes?.includes('Container-only')) return 'text-blue-400';
    if (runtime.installed) return 'text-green-400';
    return 'text-yellow-400';
  }

  function getStatusText(runtime: RuntimeStatus): string {
    if (runtime.notes?.includes('Container-only')) return 'Container Only';
    if (runtime.installed) return `v${runtime.version}`;
    return 'Not Installed';
  }

  function handleInstallClick(runtimeId: string) {
    if (onInstallClick) {
      onInstallClick(runtimeId);
    }
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  onMount(() => {
    loadRuntimes();
  });
</script>

{#if isLoading}
  <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
    <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
    Checking runtime requirements...
  </div>
{:else if error}
  <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
    <p class="text-sm text-red-700 dark:text-red-300">{error}</p>
  </div>
{:else if filteredRuntimes.length === 0}
  <div class="text-sm text-gray-500 dark:text-gray-400">
    No specific runtime requirements
  </div>
{:else}
  <div class="runtime-requirements {compact ? 'compact' : ''}">
    <!-- Status Summary -->
    {#if !compact}
      <div class="flex items-center gap-4 mb-3 text-sm">
        <div class="flex items-center gap-1">
          <span class="text-green-400">✅</span>
          <span class="text-gray-600 dark:text-gray-400">
            {installedRuntimes.length} installed
          </span>
        </div>
        {#if missingRuntimes.length > 0}
          <div class="flex items-center gap-1">
            <span class="text-yellow-400">⚠️</span>
            <span class="text-gray-600 dark:text-gray-400">
              {missingRuntimes.length} missing
            </span>
          </div>
        {/if}
        {#if containerOnlyRuntimes.length > 0}
          <div class="flex items-center gap-1">
            <span class="text-blue-400">🐳</span>
            <span class="text-gray-600 dark:text-gray-400">
              {containerOnlyRuntimes.length} container-only
            </span>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Runtime List -->
    <div class="space-y-2">
      {#each filteredRuntimes as runtime}
        <div
          class="flex items-center justify-between p-2 border rounded-md {runtime.installed
            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
            : runtime.notes?.includes('Container-only')
              ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10'
              : 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10'}"
        >
          <div class="flex items-center gap-2">
            <span class="text-lg">{getStatusIcon(runtime)}</span>
            <div>
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {runtime.name}
              </div>
              {#if !compact}
                <div class="text-xs {getStatusColor(runtime)}">
                  {getStatusText(runtime)}
                </div>
              {/if}
            </div>
          </div>

          {#if showInstallButton && !runtime.installed && !runtime.notes?.includes('Container-only')}
            <button
              onclick={() => handleInstallClick(runtime.id)}
              class="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Install Guide
            </button>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Warning Banner -->
    {#if missingRuntimes.length > 0 && !compact}
      <div class="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
        <div class="flex items-start gap-2">
          <svg
            class="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div class="flex-1">
            <p class="text-xs font-medium text-yellow-800 dark:text-yellow-300">
              Some required runtimes are not installed
            </p>
            <p class="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
              You'll need to install them before running the project
            </p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Container Notice -->
    {#if containerOnlyRuntimes.length > 0 && !compact}
      <div class="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
        <div class="flex items-start gap-2">
          <svg
            class="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div class="flex-1">
            <p class="text-xs font-medium text-blue-800 dark:text-blue-300">
              Dev-Container Required
            </p>
            <p class="text-xs text-blue-700 dark:text-blue-400 mt-1">
              Some runtimes are only available via Dev-Container setup
            </p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Success Banner -->
    {#if allInstalled && filteredRuntimes.length > 0 && !compact}
      <div class="mt-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
        <div class="flex items-center gap-2">
          <svg
            class="w-4 h-4 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p class="text-xs font-medium text-green-800 dark:text-green-300">
            All required runtimes are ready!
          </p>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .runtime-requirements.compact .space-y-2 {
    @apply space-y-1;
  }
</style>
