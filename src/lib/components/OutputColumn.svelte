<script lang="ts">
  import { runs, activeRun, runState } from '$lib/stores/runStore';
  import type { ModelRun } from '$lib/types/run';

  let view: 'primary' | 'history' = $state('primary');

  const setActive = (id: string) => {
    runState.setActiveRun(id);
    view = 'primary';
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };
</script>

<div class="flex flex-col border border-forge-line rounded-lg bg-forge-gunmetal/60 overflow-hidden">
  <header class="px-3 py-2 border-b border-forge-line flex items-center justify-between text-xs">
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="px-2 py-1 rounded-md text-[11px]
          {view === 'primary'
            ? 'bg-forge-steel text-forge-textBright'
            : 'text-forge-textDim hover:bg-forge-steel/60'}"
        onclick={() => (view = 'primary')}
      >
        Primary
      </button>
      <button
        type="button"
        class="px-2 py-1 rounded-md text-[11px]
          {view === 'history'
            ? 'bg-forge-steel text-forge-textBright'
            : 'text-forge-textDim hover:bg-forge-steel/60'}"
        onclick={() => (view = 'history')}
      >
        History ({$runs.length})
      </button>
    </div>

    {#if $activeRun}
      <span class="text-[11px] text-forge-textMuted truncate max-w-[14rem]">
        {$activeRun.modelLabel} • {formatTime($activeRun.createdAt)}
      </span>
    {:else}
      <span class="text-[11px] text-forge-textMuted">No runs yet</span>
    {/if}
  </header>

  {#if view === 'primary'}
    <div class="flex-1 overflow-y-auto p-3 text-xs text-forge-textMuted">
      {#if $activeRun}
        <div class="mb-2 text-[11px] text-forge-textDim flex flex-wrap gap-1.5">
          {#if $activeRun.contextTitles.length > 0}
            {#each $activeRun.contextTitles as title}
              <span class="px-2 py-0.5 rounded-full bg-forge-blacksteel/60 border border-forge-line text-[10px]">
                {title}
              </span>
            {/each}
          {:else}
            <span class="italic">No contexts were active for this run.</span>
          {/if}
        </div>
        <pre class="whitespace-pre-wrap text-[12px] leading-relaxed text-forge-textBright">{$activeRun.outputText}</pre>
      {:else}
        <p class="text-[11px] text-forge-textMuted">
          Run a prompt to see model output here. Results will be shown with context chips and can
          be compared via the History view.
        </p>
      {/if}
    </div>
  {:else}
    <!-- History view -->
    <div class="flex-1 overflow-y-auto p-3 text-xs text-forge-textMuted">
      {#if $runs.length === 0}
        <p class="text-[11px] text-forge-textMuted">
          No history yet. When you run prompts, each run will appear here.
        </p>
      {:else}
        <div class="space-y-1.5">
          {#each $runs as run (run.id)}
            <button
              type="button"
              class="w-full text-left px-2 py-1.5 rounded-md border border-forge-line/60
                hover:bg-forge-steel/40 text-[11px]
                {$activeRun && $activeRun.id === run.id
                  ? 'bg-forge-steel/60 text-forge-textBright'
                  : 'text-forge-textDim'}"
              onclick={() => setActive(run.id)}
            >
              <div class="flex items-center justify-between gap-2">
                <span class="truncate max-w-[12rem]">
                  {run.modelLabel}
                </span>
                <span class="text-forge-textMuted">
                  {formatTime(run.createdAt)}
                </span>
              </div>
              <div class="text-[10px] text-forge-textMuted truncate">
                {run.contextTitles.length
                  ? run.contextTitles.join(' • ')
                  : 'No contexts'}
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
