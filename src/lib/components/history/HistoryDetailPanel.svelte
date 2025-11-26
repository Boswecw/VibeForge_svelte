<script lang="ts">
  import { themeStore } from '$lib/core/stores';

  type RunStatus = 'success' | 'error' | 'partial';

  interface TokenUsage {
    input: number;
    output: number;
    total: number;
  }

  interface ContextBlock {
    name: string;
    type: string;
  }

  interface RunOutput {
    model: string;
    summary: string;
    status: string;
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
    fullPrompt: string;
    contextBlocks: ContextBlock[];
    outputs: RunOutput[];
  }

  interface Props {
    run: HistoryRun | null;
    onOpenInWorkbench: (run: HistoryRun) => void;
    onDuplicateRun: (run: HistoryRun) => void;
    onToggleStar: (id: string) => void;
  }

  let { run, onOpenInWorkbench, onDuplicateRun, onToggleStar }: Props = $props();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
</script>

<!-- Detail panel for selected run -->
<section class={`rounded-lg border p-4 flex flex-col gap-4 transition-colors min-h-[600px] ${
  themeStore.current === 'dark'
    ? 'border-slate-700 bg-slate-900'
    : 'border-slate-200 bg-white shadow-sm'
}`}>
  {#if !run}
    <!-- Empty state when no run is selected -->
    <div class="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div class={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
        themeStore.current === 'dark'
          ? 'bg-slate-950 border border-slate-700'
          : 'bg-slate-50 border border-slate-200'
      }`}>
        <span class="text-3xl">🕒</span>
      </div>
      <h3 class={`text-sm font-semibold mb-2 ${
        themeStore.current === 'dark' ? 'text-slate-300' : 'text-slate-700'
      }`}>
        No run selected
      </h3>
      <p class={`text-xs leading-relaxed max-w-md ${
        themeStore.current === 'dark' ? 'text-slate-400' : 'text-slate-500'
      }`}>
        Select a run from the history list to inspect its prompt, context, and outputs. You can then open it in the Workbench or create a duplicate.
      </p>
    </div>
  {:else}
    <!-- Header with run info -->
    <header class="flex flex-col gap-2">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1">
          <h2 class={`text-sm font-semibold leading-tight mb-1 ${
            themeStore.current === 'dark' ? 'text-slate-100' : 'text-slate-900'
          }`}>
            Run at {formatTime(run.timestamp)}
          </h2>
          <p class={`text-[11px] ${
            themeStore.current === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {run.workspace}{run.project ? ` • ${run.project}` : ''}
          </p>
        </div>
        <span class={`inline-flex items-center rounded-full px-2.5 py-1 border text-[11px] font-medium capitalize ${
          run.status === 'success'
            ? themeStore.current === 'dark'
              ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
              : 'border-emerald-500 text-emerald-700 bg-emerald-50'
            : run.status === 'error'
              ? themeStore.current === 'dark'
                ? 'border-rose-500/40 text-rose-400 bg-rose-500/10'
                : 'border-rose-500 text-rose-700 bg-rose-50'
              : themeStore.current === 'dark'
                ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                : 'border-amber-500 text-amber-700 bg-amber-50'
        }`}>
          {run.status}
        </span>
      </div>

      <!-- Metadata line -->
      <div class={`text-[11px] ${
        themeStore.current === 'dark' ? 'text-slate-400' : 'text-slate-500'
      }`}>
        <span class="font-medium">Models:</span> {run.models.join(', ')}
        <span class="mx-2">•</span>
        <span class="font-medium">Tokens:</span> {run.tokenUsage.total.toLocaleString()}
        ({run.tokenUsage.input.toLocaleString()} in, {run.tokenUsage.output.toLocaleString()} out)
      </div>
    </header>

    <!-- Labels / Tags -->
    {#if run.labels && run.labels.length > 0}
      <div class="flex flex-wrap gap-2">
        {#each run.labels as label}
          <span class={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${
            themeStore.current === 'dark'
              ? 'bg-slate-950 border-slate-700 text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            {label}
          </span>
        {/each}
      </div>
    {/if}

    <!-- Prompt -->
    <section class={`flex flex-col gap-2 border-t pt-4 ${
      themeStore.current === 'dark' ? 'border-slate-700' : 'border-slate-200'
    }`}>
      <h3 class={`text-xs font-semibold ${
        themeStore.current === 'dark' ? 'text-slate-300' : 'text-slate-700'
      }`}>
        Prompt
      </h3>
      <div class={`rounded-md border p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto ${
        themeStore.current === 'dark'
          ? 'bg-slate-950 border-slate-800 text-slate-100'
          : 'bg-slate-50 border-slate-200 text-slate-900'
      }`}>
        {run.fullPrompt}
      </div>
    </section>

    <!-- Context blocks -->
    <section class="flex flex-col gap-2">
      <h3 class={`text-xs font-semibold ${
        themeStore.current === 'dark' ? 'text-slate-300' : 'text-slate-700'
      }`}>
        Context ({run.contextBlocks.length})
      </h3>
      {#if run.contextBlocks.length === 0}
        <p class={`text-[11px] ${
          themeStore.current === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          No additional context blocks were attached.
        </p>
      {:else}
        <div class="flex flex-wrap gap-2">
          {#each run.contextBlocks as block}
            <span class={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] ${
              themeStore.current === 'dark'
                ? 'bg-slate-950 border-slate-700 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              {block.name} <span class={`ml-1.5 ${
                themeStore.current === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}>• {block.type}</span>
            </span>
          {/each}
        </div>
      {/if}
    </section>

    <!-- Outputs summary -->
    <section class="flex-1 flex flex-col gap-2">
      <h3 class={`text-xs font-semibold ${
        themeStore.current === 'dark' ? 'text-slate-300' : 'text-slate-700'
      }`}>
        Outputs ({run.outputs.length})
      </h3>
      <div class="space-y-2">
        {#each run.outputs as output}
          <div class={`rounded-md border p-3 text-xs leading-relaxed ${
            themeStore.current === 'dark'
              ? 'bg-slate-950 border-slate-800'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class={`font-semibold ${
                themeStore.current === 'dark' ? 'text-slate-200' : 'text-slate-700'
              }`}>
                {output.model}
              </span>
              <span class={`text-[10px] capitalize ${
                output.status === 'success'
                  ? 'text-emerald-400'
                  : output.status === 'error'
                    ? 'text-rose-400'
                    : 'text-amber-400'
              }`}>
                {output.status}
              </span>
            </div>
            <p class={`text-[11px] leading-relaxed ${
              themeStore.current === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {output.summary}
            </p>
          </div>
        {/each}
      </div>
    </section>

    <!-- Actions -->
    <footer class={`border-t pt-4 flex items-center justify-between gap-2 ${
      themeStore.current === 'dark' ? 'border-slate-700' : 'border-slate-200'
    }`}>
      <div class="flex gap-2">
        <button
          type="button"
          class={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            themeStore.current === 'dark'
              ? 'bg-amber-500 text-slate-900 hover:bg-amber-600 shadow-md shadow-amber-500/20'
              : 'bg-amber-500 text-slate-900 hover:bg-amber-600 shadow-md'
          }`}
          onclick={() => onOpenInWorkbench(run)}
        >
          Open in Workbench
        </button>
        <button
          type="button"
          class={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
            themeStore.current === 'dark'
              ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-200'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-700'
          }`}
          onclick={() => onDuplicateRun(run)}
        >
          Duplicate Run
        </button>
      </div>

      <button
        type="button"
        class={`text-xs transition-colors ${
          run.starred
            ? 'text-amber-400 hover:text-amber-500'
            : themeStore.current === 'dark'
              ? 'text-slate-400 hover:text-amber-400'
              : 'text-slate-500 hover:text-amber-500'
        }`}
        onclick={() => onToggleStar(run.id)}
      >
        {run.starred ? '★ Starred' : '☆ Star'}
      </button>
    </footer>
  {/if}
</section>
