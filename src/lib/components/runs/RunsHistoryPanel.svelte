<script lang="ts">
/**
 * VF-302: Runs History Panel Component
 *
 * Main container for displaying execution run history with offline-first sync:
 * - Complete run history from all workspaces
 * - Search and filter controls
 * - Sync status indicators
 * - Manual sync button
 * - Load more pagination
 * - Run details modal
 */

import type { PromptRun } from '$lib/core/types';
import { runsStore } from '$lib/core/stores/runs.svelte';
import RunSyncStatusIndicator from './RunSyncStatusIndicator.svelte';

interface Props {
  /** Filter by workspace ID (optional) */
  workspaceId?: string;
  /** Initial limit for runs to load */
  initialLimit?: number;
  /** Show sync status indicator */
  showSyncStatus?: boolean;
  /** Show manual sync button */
  showSyncButton?: boolean;
}

let {
  workspaceId,
  initialLimit = 50,
  showSyncStatus = true,
  showSyncButton = true,
}: Props = $props();

// Local state
let searchQuery = $state('');
let statusFilter = $state<string>('all'); // 'all' | 'success' | 'error' | 'running' | 'pending'
let selectedRunId = $state<string | null>(null);
let isExpanded = $state(false);

// Load history on mount
$effect(() => {
  runsStore.loadHistory(workspaceId, initialLimit);
});

// Filtered runs based on search and filter
const filteredRuns = $derived.by(() => {
  let runs = runsStore.runs;

  // Apply status filter
  if (statusFilter !== 'all') {
    runs = runs.filter(r => r.status === statusFilter);
  }

  // Apply search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    runs = runs.filter(r =>
      r.promptSnapshot?.toLowerCase().includes(query) ||
      r.output?.toLowerCase().includes(query) ||
      r.id.toLowerCase().includes(query)
    );
  }

  return runs;
});

// Handle manual sync
async function handleSync() {
  try {
    await runsStore.forceSyncAll();
  } catch (err) {
    console.error('Sync failed:', err);
  }
}

// Handle load more
async function handleLoadMore() {
  const newLimit = runsStore.runs.length + 50;
  await runsStore.loadHistory(workspaceId, newLimit);
}

// Helper to format timestamp
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

// Helper to format duration
function formatDuration(ms?: number): string {
  if (!ms) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

// Helper to get status color
function getStatusColor(status: string): string {
  switch (status) {
    case 'success':
      return 'text-green-600';
    case 'error':
      return 'text-red-600';
    case 'running':
      return 'text-blue-600';
    case 'pending':
      return 'text-gray-600';
    case 'cancelled':
      return 'text-orange-600';
    default:
      return 'text-gray-500';
  }
}

// Helper to get status icon
function getStatusIcon(status: string): string {
  switch (status) {
    case 'success':
      return '✓';
    case 'error':
      return '✗';
    case 'running':
      return '⟳';
    case 'pending':
      return '○';
    case 'cancelled':
      return '⊘';
    default:
      return '?';
  }
}
</script>

<div class="runs-history-panel bg-white border border-gray-200 rounded-lg shadow-sm">
  <!-- Header -->
  <div class="flex items-center justify-between p-4 border-b border-gray-200">
    <div class="flex items-center gap-3">
      <h2 class="text-lg font-semibold text-gray-800">Run History</h2>
      {#if runsStore.isLoadingHistory}
        <span class="text-sm text-gray-500">Loading...</span>
      {:else}
        <span class="text-sm text-gray-500">({filteredRuns.length} runs)</span>
      {/if}
    </div>

    <div class="flex items-center gap-3">
      <!-- Sync Status Indicator -->
      {#if showSyncStatus}
        <div class="flex items-center gap-2 text-sm">
          {#if runsStore.syncStatus === 'syncing'}
            <span class="text-blue-600">⟳ Syncing...</span>
          {:else if runsStore.syncStatus === 'synced'}
            <span class="text-green-600">✓ Synced</span>
          {:else if runsStore.syncStatus === 'offline'}
            <span class="text-gray-600">⊘ Offline</span>
          {:else if runsStore.syncStatus === 'error'}
            <span class="text-red-600">✗ Sync Error</span>
          {:else if runsStore.syncStatus === 'conflict'}
            <span class="text-yellow-600">⚠ Conflicts</span>
          {/if}
        </div>
      {/if}

      <!-- Manual Sync Button -->
      {#if showSyncButton}
        <button
          onclick={handleSync}
          disabled={!runsStore.isOnline || runsStore.syncStatus === 'syncing'}
          class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {runsStore.hasPendingChanges ? '⚠ Sync Now' : 'Sync'}
        </button>
      {/if}
    </div>
  </div>

  <!-- Search and Filter Controls -->
  <div class="p-4 bg-gray-50 border-b border-gray-200">
    <div class="flex gap-3">
      <!-- Search Input -->
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search runs (prompt, output, ID)..."
        class="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <!-- Status Filter -->
      <select
        bind:value={statusFilter}
        class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All Statuses</option>
        <option value="success">Success</option>
        <option value="error">Error</option>
        <option value="running">Running</option>
        <option value="pending">Pending</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
  </div>

  <!-- Runs List -->
  <div class="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
    {#if runsStore.isLoadingHistory && runsStore.runs.length === 0}
      <div class="flex items-center justify-center p-8">
        <span class="text-gray-500">Loading run history...</span>
      </div>

    {:else if filteredRuns.length === 0}
      <div class="flex flex-col items-center justify-center p-8 text-center">
        <span class="text-4xl mb-4">📋</span>
        <h3 class="text-lg font-semibold text-gray-700">No Runs Found</h3>
        <p class="text-sm text-gray-500 mt-2">
          {searchQuery || statusFilter !== 'all'
            ? 'Try adjusting your search or filters'
            : 'Execute a prompt to see run history'}
        </p>
      </div>

    {:else}
      {#each filteredRuns as run (run.id)}
        <div class="p-4 hover:bg-gray-50 transition-colors">
          <!-- Run Header -->
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-3">
              <!-- Status Icon -->
              <span class={`text-xl ${getStatusColor(run.status)}`}>
                {getStatusIcon(run.status)}
              </span>

              <!-- Run Info -->
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-700">
                    {run.modelId}
                  </span>
                  <span class="text-xs text-gray-500">
                    {formatTimestamp(run.startedAt)}
                  </span>
                </div>
                <div class="text-xs text-gray-500">
                  {run.totalTokens ? `${run.totalTokens} tokens` : ''}
                  {run.durationMs ? ` • ${formatDuration(run.durationMs)}` : ''}
                  {run.cost ? ` • $${run.cost.toFixed(4)}` : ''}
                </div>
              </div>
            </div>

            <!-- Run Actions -->
            <div class="flex items-center gap-2">
              <!-- Sync Status Indicator -->
              <RunSyncStatusIndicator runId={run.id} />

              <!-- Expand Button -->
              <button
                onclick={() => selectedRunId = selectedRunId === run.id ? null : run.id}
                class="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-white"
              >
                {selectedRunId === run.id ? 'Hide' : 'Details'}
              </button>
            </div>
          </div>

          <!-- Prompt Preview -->
          <div class="text-sm text-gray-600 mb-2 line-clamp-2">
            {run.promptSnapshot || 'No prompt'}
          </div>

          <!-- Expanded Details -->
          {#if selectedRunId === run.id}
            <div class="mt-3 p-3 bg-gray-50 border border-gray-200 rounded space-y-3">
              <!-- Full Prompt -->
              <div>
                <h4 class="text-xs font-semibold text-gray-700 mb-1">Prompt:</h4>
                <div class="text-xs text-gray-600 whitespace-pre-wrap font-mono bg-white p-2 rounded border border-gray-200">
                  {run.promptSnapshot || 'No prompt'}
                </div>
              </div>

              <!-- Output -->
              {#if run.output}
                <div>
                  <h4 class="text-xs font-semibold text-gray-700 mb-1">Output:</h4>
                  <div class="text-xs text-gray-600 whitespace-pre-wrap font-mono bg-white p-2 rounded border border-gray-200 max-h-60 overflow-y-auto">
                    {run.output}
                  </div>
                </div>
              {/if}

              <!-- Error -->
              {#if run.error}
                <div>
                  <h4 class="text-xs font-semibold text-red-700 mb-1">Error:</h4>
                  <div class="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    {run.error}
                  </div>
                </div>
              {/if}

              <!-- Metadata -->
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span class="font-semibold text-gray-700">Run ID:</span>
                  <span class="text-gray-600 ml-1 font-mono">{run.id}</span>
                </div>
                {#if run.workspaceId}
                  <div>
                    <span class="font-semibold text-gray-700">Workspace:</span>
                    <span class="text-gray-600 ml-1">{run.workspaceId}</span>
                  </div>
                {/if}
                {#if run.contextBlockIds && run.contextBlockIds.length > 0}
                  <div>
                    <span class="font-semibold text-gray-700">Context Blocks:</span>
                    <span class="text-gray-600 ml-1">{run.contextBlockIds.length}</span>
                  </div>
                {/if}
              </div>

              <!-- Delete Button -->
              <div class="flex justify-end">
                <button
                  onclick={async () => {
                    if (confirm('Delete this run?')) {
                      await runsStore.deleteRun(run.id);
                      selectedRunId = null;
                    }
                  }}
                  class="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete Run
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>

  <!-- Load More Footer -->
  {#if !runsStore.isLoadingHistory && filteredRuns.length > 0 && filteredRuns.length >= initialLimit}
    <div class="p-4 border-t border-gray-200 text-center">
      <button
        onclick={handleLoadMore}
        class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
      >
        Load More
      </button>
    </div>
  {/if}

  <!-- Error Display -->
  {#if runsStore.error}
    <div class="p-4 bg-red-50 border-t border-red-200 text-sm text-red-700">
      <strong>Error:</strong> {runsStore.error}
    </div>
  {/if}
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
