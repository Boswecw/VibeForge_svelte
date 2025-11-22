<script lang="ts">
  /**
   * VersionHistory - Version timeline and history UI
   */

  import {
    versionStore,
    sortedVersions,
    currentVersion,
  } from "$lib/stores/versions";
  import { presets } from "$lib/stores/presets";
  import Button from "$lib/ui/primitives/Button.svelte";
  import type { VersionSummary } from "$lib/core/api/versionsClient";

  interface Props {
    promptId: string;
  }

  let { promptId }: Props = $props();

  const versions = $derived($sortedVersions);
  const current = $derived($currentVersion);
  const versionState = $derived($versionStore);
  const selectedPreset = $derived($presets.selectedPreset);

  let selectedForCompare: string | null = $state(null);

  $effect(() => {
    // Load versions when prompt changes
    if (promptId) {
      versionStore.loadVersions(promptId);
    }
  });

  function handleRestore(versionId: string) {
    versionStore.restoreVersion(promptId, versionId);
  }

  function handleViewVersion(version: VersionSummary) {
    // Load version content and show in editor (view-only)
    versionStore.getVersion(promptId, version.id);
  }

  function handleCompare(version: VersionSummary) {
    if (!current) return;

    if (!selectedForCompare) {
      selectedForCompare = version.id;
    } else {
      // Compare selected version with this one
      versionStore.compareVersions(promptId, selectedForCompare, version.id);
      selectedForCompare = null;
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }
</script>

<div class="version-history flex flex-col h-full">
  <!-- Header -->
  <div class="px-4 py-3 border-b border-slate-800">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-slate-200">Version History</h3>
      {#if versions.length > 0}
        <span class="text-xs text-slate-400"
          >{versions.length} version{versions.length !== 1 ? "s" : ""}</span
        >
      {/if}
    </div>
  </div>

  <!-- Loading State -->
  {#if versionState.isLoading}
    <div class="flex-1 flex items-center justify-center">
      <div class="text-sm text-slate-400">Loading versions...</div>
    </div>
  {:else if versions.length === 0}
    <!-- Empty State -->
    <div
      class="flex-1 flex flex-col items-center justify-center p-6 text-center"
    >
      <div class="text-slate-400 text-sm mb-2">No versions yet</div>
      <div class="text-slate-500 text-xs">
        Versions are created automatically as you edit
      </div>
    </div>
  {:else}
    <!-- Version Timeline -->
    <div class="flex-1 overflow-y-auto">
      <div class="p-4 space-y-3">
        {#each versions as version}
          <div
            class="version-item rounded-lg border p-3 transition-colors {version.isCurrent
              ? 'bg-blue-500/10 border-blue-500/30'
              : selectedForCompare === version.id
              ? 'bg-purple-500/10 border-purple-500/30'
              : 'bg-forge-steel border-slate-700 hover:border-slate-600'}"
          >
            <!-- Version Header -->
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium text-slate-300">
                    v{version.versionNumber}
                  </span>
                  {#if version.isCurrent}
                    <span
                      class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-500/20 text-blue-400"
                    >
                      Current
                    </span>
                  {/if}
                  {#if version.autoSaved}
                    <span
                      class="px-1.5 py-0.5 text-[10px] rounded bg-slate-700 text-slate-400"
                    >
                      Auto
                    </span>
                  {:else}
                    <span
                      class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/20 text-emerald-400"
                    >
                      Manual
                    </span>
                  {/if}
                </div>
                <div class="text-xs text-slate-400 mt-0.5">
                  {formatDate(version.createdAt)}
                </div>
              </div>
            </div>

            <!-- Summary/Preview -->
            {#if version.changeSummary}
              <div class="text-xs text-slate-300 mb-2 italic">
                {version.changeSummary}
              </div>
            {/if}
            <div class="text-xs text-slate-500 mb-3 truncate">
              {version.contentPreview}
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onclick={() => handleViewVersion(version)}
              >
                View
              </Button>

              {#if !version.isCurrent}
                <Button
                  size="sm"
                  variant="ghost"
                  onclick={() => handleRestore(version.id)}
                >
                  Restore
                </Button>
              {/if}

              <Button
                size="sm"
                variant="ghost"
                onclick={() => handleCompare(version)}
              >
                {selectedForCompare === version.id ? "Cancel" : "Compare"}
              </Button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Error Display -->
  {#if versionState.error}
    <div class="px-4 py-2 bg-red-500/10 border-t border-red-500/30">
      <div class="text-xs text-red-400">{versionState.error}</div>
    </div>
  {/if}
</div>

<style>
  .version-history {
    background-color: var(--forge-gunmetal);
  }
</style>
