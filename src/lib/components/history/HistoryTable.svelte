<!-- @component
### Props
- `! activeRunId` **string | null**
- `! onSelect` **(id: string) =► void**
- `! onToggleStar` **(id: string) =► void**
- `! runs` **HistoryRun[]**

no description yet
-->
<script lang="ts">
  import { theme } from '$lib/stores/themeStore';

  type RunStatus = 'success' | 'error' | 'partial';

  interface TokenUsage {
    input: number;
    output: number;
    total: number;
  }

  interface HistoryRun {
    id: string;
    workspace: string;
    project: string | null;
    timestamp: string;
    models: string[];
    status: RunStatus;
    durationMs: number;
    promptSummary: string;
    contextSummary: string;
    tokenUsage: TokenUsage;
    starred: boolean;
    labels?: string[];
  }

  interface Props {
    runs: HistoryRun[];
    activeRunId: string | null;
    onSelect: (id: string) => void;
    onToggleStar: (id: string) => void;
  }

  let { runs, activeRunId, onSelect, onToggleStar }: Props = $props();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };
</script>

<!-- Scrollable table-like view of history runs -->
<section class={`rounded-lg border p-3 flex flex-col gap-2 overflow-y-auto max-h-[600px] transition-colors ${
  $theme === 'dark'
    ? 'border-slate-700 bg-slate-900'
    : 'border-slate-200 bg-white shadow-sm'
}`}>
  <!-- Section header -->
  <div class="flex items-center justify-between mb-1">
    <h2 class={`text-xs font-semibold ${
      $theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
    }`}>
      Runs
    </h2>
    <span class={`text-xs ${
      $theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
    }`}>
      {runs.length} {runs.length === 1 ? 'run' : 'runs'}
    </span>
  </div>

  <!-- Table header row (hidden on mobile) -->
  <div class={`hidden lg:grid grid-cols-[auto_0.9fr_0.9fr_0.7fr_0.6fr_1.4fr_0.6fr_0.5fr] gap-2 text-[11px] border-b pb-1 mb-1 ${
    $theme === 'dark'
      ? 'text-slate-400 border-slate-700/40'
      : 'text-slate-500 border-slate-200'
  }`}>
    <span class="w-6"></span> <!-- star column -->
    <span>Time</span>
    <span>Workspace</span>
    <span>Models</span>
    <span>Status</span>
    <span>Prompt</span>
    <span>Tokens</span>
    <span>Duration</span>
  </div>

  <!-- List of runs -->
  {#if runs.length === 0}
    <div class={`border border-dashed rounded-md p-6 text-center text-xs ${
      $theme === 'dark'
        ? 'border-slate-700 text-slate-500'
        : 'border-slate-300 text-slate-500'
    }`}>
      <p>No runs match your filters.</p>
      <p class="mt-1 text-[11px]">Try adjusting your filters or date range.</p>
    </div>
  {:else}
    <div class="space-y-1">
      {#each runs as run (run.id)}
        {@const isActive = activeRunId === run.id}
        <div
          role="button"
          tabindex="0"
          class={`w-full text-left grid grid-cols-[auto_0.9fr_0.9fr_0.7fr_0.6fr_1.4fr_0.6fr_0.5fr] gap-2 items-center rounded-md px-2 py-1.5 text-[11px] transition-colors cursor-pointer ${
            isActive
              ? $theme === 'dark'
                ? 'bg-slate-950 ring-1 ring-amber-400/30 border border-amber-400'
                : 'bg-amber-50 ring-1 ring-amber-500/20 border border-amber-500'
              : $theme === 'dark'
                ? 'border border-transparent hover:bg-slate-900 hover:border-slate-700'
                : 'border border-transparent hover:bg-slate-50 hover:border-slate-200'
          }`}
          onclick={() => onSelect(run.id)}
          onkeydown={(e) => e.key === 'Enter' && onSelect(run.id)}
        >
          <!-- Star column -->
          <button
            type="button"
            class={`w-6 flex items-center justify-center text-base transition-colors ${
              run.starred
                ? 'text-amber-400 hover:text-amber-500'
                : $theme === 'dark'
                  ? 'text-slate-600 hover:text-amber-400'
                  : 'text-slate-300 hover:text-amber-500'
            }`}
            onclick={(e) => {
              e.stopPropagation();
              onToggleStar(run.id);
            }}
          >
            {run.starred ? '★' : '☆'}
          </button>

          <!-- Time -->
          <span class={isActive
            ? $theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
            : $theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
          }>
            {formatTime(run.timestamp)}
          </span>

          <!-- Workspace -->
          <span class={`truncate ${
            isActive
              ? $theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
              : $theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
          }`}>
            {run.workspace}
          </span>

          <!-- Models -->
          <span class={`truncate ${
            $theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {run.models.join(', ')}
          </span>

          <!-- Status chip -->
          <span>
            <span class={`inline-flex items-center rounded-full px-2 py-0.5 border text-[10px] font-medium capitalize ${
              run.status === 'success'
                ? $theme === 'dark'
                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                  : 'border-emerald-500 text-emerald-700 bg-emerald-50'
                : run.status === 'error'
                  ? $theme === 'dark'
                    ? 'border-rose-500/40 text-rose-400 bg-rose-500/10'
                    : 'border-rose-500 text-rose-700 bg-rose-50'
                  : $theme === 'dark'
                    ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                    : 'border-amber-500 text-amber-700 bg-amber-50'
            }`}>
              {run.status}
            </span>
          </span>

          <!-- Prompt summary -->
          <span class={`truncate ${
            isActive
              ? $theme === 'dark' ? 'text-slate-100 font-medium' : 'text-slate-900 font-medium'
              : $theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
          }`}>
            {run.promptSummary}
          </span>

          <!-- Tokens -->
          <span class={
            $theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }>
            {run.tokenUsage.total.toLocaleString()}
          </span>

          <!-- Duration -->
          <span class={
            $theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }>
            {formatDuration(run.durationMs)}
          </span>
        </div>
      {/each}
    </div>
  {/if}
</section>
