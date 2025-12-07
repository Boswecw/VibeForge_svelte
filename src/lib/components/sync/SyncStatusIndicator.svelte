<script lang="ts">
/**
 * VF-301: Sync Status Indicator Component
 *
 * Displays current sync status with visual indicators:
 * - Online/Offline status
 * - Syncing progress
 * - Sync conflicts
 * - Last synced timestamp
 * - Manual sync button
 */

import { workspaceStore } from '$lib/core/stores/workspace.svelte';

interface Props {
  /** Show detailed status (default: false) */
  detailed?: boolean;
  /** Show manual sync button (default: true) */
  showSyncButton?: boolean;
  /** Compact mode (smaller, less detail) */
  compact?: boolean;
}

let {
  detailed = false,
  showSyncButton = true,
  compact = false
}: Props = $props();

// Get sync status from store
const syncStatus = $derived(workspaceStore.syncStatus);
const isOnline = $derived(workspaceStore.isOnline);
const hasPendingChanges = $derived(workspaceStore.hasPendingChanges);
const hasConflicts = $derived(workspaceStore.hasConflicts);
const currentSyncStatus = $derived(workspaceStore.currentWorkspaceSyncStatus);

// Status display helpers
const statusConfig = $derived.by(() => {
  if (!isOnline) {
    return {
      icon: '○',
      label: 'Offline',
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
      description: 'Changes will sync when online',
    };
  }

  if (hasConflicts) {
    return {
      icon: '⚠',
      label: 'Conflict',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'Sync conflicts detected - manual resolution needed',
    };
  }

  switch (syncStatus) {
    case 'syncing':
      return {
        icon: '⟳',
        label: 'Syncing',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        description: 'Synchronizing changes...',
      };
    case 'synced':
      return {
        icon: '✓',
        label: 'Synced',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        description: 'All changes synced',
      };
    case 'error':
      return {
        icon: '✗',
        label: 'Error',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        description: 'Sync failed - will retry',
      };
    case 'offline':
      return {
        icon: '○',
        label: 'Offline',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        description: 'Working offline',
      };
    default:
      return {
        icon: '○',
        label: 'Idle',
        color: 'text-gray-400',
        bgColor: 'bg-gray-50',
        description: 'Ready to sync',
      };
  }
});

const lastSyncedText = $derived.by(() => {
  if (!currentSyncStatus?.lastSynced) return 'Never';

  const lastSynced = currentSyncStatus.lastSynced;
  const now = new Date();
  const diffMs = now.getTime() - lastSynced.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return lastSynced.toLocaleDateString();
});

// Manual sync handler
async function handleSyncClick() {
  try {
    await workspaceStore.forceSyncAll();
  } catch (err) {
    console.error('Manual sync failed:', err);
  }
}
</script>

<!-- Compact Mode -->
{#if compact}
  <div
    class="flex items-center gap-2 px-2 py-1 rounded {statusConfig.bgColor}"
    title={statusConfig.description}
  >
    <span class="{statusConfig.color} text-sm">{statusConfig.icon}</span>
    {#if hasPendingChanges}
      <span class="text-xs text-gray-600">●</span>
    {/if}
  </div>

<!-- Normal/Detailed Mode -->
{:else}
  <div class="flex items-center gap-3 px-3 py-2 rounded-lg border {statusConfig.bgColor} border-gray-200">
    <!-- Status Icon & Label -->
    <div class="flex items-center gap-2">
      <span
        class="{statusConfig.color} text-lg font-semibold"
        class:animate-spin={syncStatus === 'syncing'}
      >
        {statusConfig.icon}
      </span>
      <div class="flex flex-col">
        <span class="text-sm font-medium {statusConfig.color}">
          {statusConfig.label}
        </span>
        {#if detailed}
          <span class="text-xs text-gray-500">
            {statusConfig.description}
          </span>
        {/if}
      </div>
    </div>

    <!-- Pending Changes Indicator -->
    {#if hasPendingChanges && detailed}
      <div class="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-xs text-blue-700">
        <span>●</span>
        <span>Pending</span>
      </div>
    {/if}

    <!-- Last Synced Timestamp -->
    {#if detailed && currentSyncStatus}
      <span class="text-xs text-gray-500 ml-auto">
        {lastSyncedText}
      </span>
    {/if}

    <!-- Manual Sync Button -->
    {#if showSyncButton && isOnline}
      <button
        onclick={handleSyncClick}
        disabled={syncStatus === 'syncing'}
        class="ml-auto px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Manually trigger sync"
      >
        Sync Now
      </button>
    {/if}

    <!-- Error Message -->
    {#if detailed && workspaceStore.error && syncStatus === 'error'}
      <div class="w-full mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
        {workspaceStore.error}
      </div>
    {/if}
  </div>
{/if}

<style>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
