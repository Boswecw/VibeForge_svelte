<script lang="ts">
  import { runs, activeRun, runState } from '$lib/stores/runStore';
  import { theme } from '$lib/stores/themeStore';
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

<!-- Output Column: View model outputs and run history -->
<section class={`flex flex-col rounded-lg border transition-colors ${
  $theme === 'dark'
    ? 'border-slate-700 bg-slate-900'
    : 'border-slate-200 bg-white shadow-sm'
}`}>
  <header class={`px-4 py-3 border-b flex items-center justify-between ${
    $theme === 'dark'
      ? 'border-slate-700'
      : 'border-slate-200'
  }`}>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          view === 'primary'
            ? $theme === 'dark'
              ? 'bg-slate-950 text-slate-100 border border-slate-700'
              : 'bg-slate-100 text-slate-900 border border-slate-200'
            : $theme === 'dark'
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-600 hover:text-slate-900'
        }`}
        onclick={() => (view = 'primary')}
      >
        Primary
      </button>
      <button
        type="button"
        class={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          view === 'history'
            ? $theme === 'dark'
              ? 'bg-slate-950 text-slate-100 border border-slate-700'
              : 'bg-slate-100 text-slate-900 border border-slate-200'
            : $theme === 'dark'
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-600 hover:text-slate-900'
        }`}
        onclick={() => (view = 'history')}
      >
        History ({$runs.length})
      </button>
    </div>

    {#if $activeRun}
      <span class={`text-xs truncate max-w-xs ${
        $theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
      }`}>
        {$activeRun.modelLabel} • {formatTime($activeRun.createdAt)}
      </span>
    {:else}
      <span class={`text-xs ${
        $theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
      }`}>No runs yet</span>
    {/if}
  </header>

  {#if view === 'primary'}
    <!-- Primary output view -->
    <div class={`flex-1 overflow-y-auto p-4 space-y-3 ${
      $theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
    }`}>
      {#if $activeRun}
        <!-- Context chips used in this run -->
        {#if $activeRun.contextTitles.length > 0}
          <div class="flex flex-wrap gap-2">
            {#each $activeRun.contextTitles as title}
              <span class={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs ${
                $theme === 'dark'
                  ? 'bg-slate-950 border-slate-700 text-slate-400'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                {title}
              </span>
            {/each}
          </div>
        {/if}

        <!-- Output text -->
        <div class={`rounded-md border p-4 ${
          $theme === 'dark'
            ? 'border-slate-700 bg-slate-950'
            : 'border-slate-200 bg-slate-50'
        }`}>
          <pre class={`whitespace-pre-wrap text-sm leading-relaxed font-mono ${
            $theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
          }`}>{$activeRun.outputText}</pre>
        </div>
      {:else}
        <p class={`text-xs ${
          $theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
        }`}>
          Run a prompt to see model output here. Results will be displayed with context chips and can be compared via the History view.
        </p>
      {/if}
    </div>
  {:else}
    <!-- History view -->
    <div class={`flex-1 overflow-y-auto p-4 ${
      $theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
    }`}>
      {#if $runs.length === 0}
        <p class={`text-xs ${
          $theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
        }`}>
          No run history yet. When you execute prompts, each run will appear here for comparison.
        </p>
      {:else}
        <div class="space-y-2">
          {#each $runs as run (run.id)}
            {@const isActive = $activeRun && $activeRun.id === run.id}
            <button
              type="button"
              class={`w-full text-left px-3 py-2 rounded-md border text-xs transition-colors ${
                $theme === 'dark'
                  ? `border-slate-700/60 ${
                      isActive
                        ? 'bg-slate-950 text-slate-100 border-slate-600'
                        : 'bg-slate-950/50 text-slate-300 hover:bg-slate-900'
                    }`
                  : `border-slate-200 ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 border-slate-300'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`
              }`}
              onclick={() => setActive(run.id)}
            >
              <div class="flex items-center justify-between gap-2">
                <span class="truncate font-medium">
                  {run.modelLabel}
                </span>
                <span class={$theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}>
                  {formatTime(run.createdAt)}
                </span>
              </div>
              <div class={`text-[11px] truncate mt-1 ${
                $theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
              }`}>
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
</section>
