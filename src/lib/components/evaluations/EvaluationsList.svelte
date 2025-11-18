<!-- @component
### Props
- `! activeEvaluationId` **string | null**
- `! evaluations` **EvaluationSession[]**
- `! onSelectEvaluation` **(id: string) =► void**

no description yet
-->
<script lang="ts">
  import { theme } from '$lib/stores/themeStore';
  import type { EvaluationSession, EvaluationStatus } from '$lib/types/evaluation';

  interface Props {
    evaluations: EvaluationSession[];
    activeEvaluationId: string | null;
    onSelectEvaluation: (id: string) => void;
  }

  let { evaluations, activeEvaluationId, onSelectEvaluation }: Props = $props();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadgeColor = (status: EvaluationStatus) => {
    switch (status) {
      case 'draft':
        return $theme === 'dark'
          ? 'bg-slate-700/40 text-slate-300 border-slate-600'
          : 'bg-slate-100 text-slate-700 border-slate-300';
      case 'in-progress':
        return $theme === 'dark'
          ? 'bg-blue-500/20 text-blue-300 border-blue-600'
          : 'bg-blue-50 text-blue-700 border-blue-300';
      case 'completed':
        return $theme === 'dark'
          ? 'bg-green-500/20 text-green-300 border-green-600'
          : 'bg-green-50 text-green-700 border-green-300';
    }
  };
</script>

<!-- Scrollable list of evaluation sessions -->
<section
  class={`rounded-lg border p-3 flex flex-col gap-2 overflow-y-auto max-h-[520px] transition-colors ${
    $theme === 'dark'
      ? 'bg-slate-950 border-slate-700'
      : 'bg-white border-slate-200'
  }`}
>
  <!-- Section header -->
  <div class="flex items-center justify-between mb-1 px-1">
    <h2 class={`text-xs font-semibold ${
      $theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
    }`}>
      Evaluations
    </h2>
    <span class={`text-xs ${
      $theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
    }`}>
      {evaluations.length}
    </span>
  </div>

  <!-- List of evaluation cards -->
  {#if evaluations.length === 0}
    <div class={`border border-dashed rounded-md p-6 text-center text-xs ${
      $theme === 'dark'
        ? 'border-slate-700 text-slate-500'
        : 'border-slate-300 text-slate-500'
    }`}>
      <p>No evaluations match your filters.</p>
      <p class="mt-1 text-[11px]">Try adjusting your search or filters.</p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each evaluations as evaluation (evaluation.id)}
        {@const isActive = activeEvaluationId === evaluation.id}
        <button
          type="button"
          class={`w-full text-left rounded-md border px-3 py-2 flex flex-col gap-1 transition-colors ${
            isActive
              ? $theme === 'dark'
                ? 'border-amber-400 bg-slate-900 ring-1 ring-amber-400/30'
                : 'border-amber-500 bg-amber-50 ring-1 ring-amber-500/20'
              : $theme === 'dark'
                ? 'border-slate-700 bg-slate-950 hover:bg-slate-900 hover:border-slate-600'
                : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
          }`}
          onclick={() => onSelectEvaluation(evaluation.id)}
        >
          <!-- Name and status -->
          <div class="flex items-center justify-between gap-2">
            <span class={`font-medium text-[13px] truncate ${
              isActive
                ? $theme === 'dark'
                  ? 'text-amber-400'
                  : 'text-amber-700'
                : $theme === 'dark'
                  ? 'text-slate-100'
                  : 'text-slate-900'
            }`}>
              {evaluation.name}
            </span>
            <span class={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] border font-medium ${getStatusBadgeColor(evaluation.status)}`}>
              {evaluation.status === 'in-progress' ? 'In Progress' : evaluation.status.charAt(0).toUpperCase() + evaluation.status.slice(1)}
            </span>
          </div>

          <!-- Workspace and project -->
          <div class="flex items-center justify-between gap-2">
            <span class={`text-[11px] truncate ${
              $theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {evaluation.workspace} {evaluation.project ? `· ${evaluation.project}` : ''}
            </span>
            <span class={`text-[11px] whitespace-nowrap ${
              $theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
            }`}>
              {formatDate(evaluation.updatedAt)}
            </span>
          </div>

          <!-- Models -->
          <div class="flex items-center gap-1 flex-wrap">
            {#each evaluation.models as model}
              <span class={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] border ${
                $theme === 'dark'
                  ? 'border-slate-600 text-slate-300'
                  : 'border-slate-300 text-slate-600'
              }`}>
                {model}
              </span>
            {/each}
          </div>

          <!-- Tags -->
          {#if evaluation.tags?.length}
            <div class="flex flex-wrap gap-1">
              {#each evaluation.tags as tag}
                <span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${
                  $theme === 'dark'
                    ? 'border-slate-600 text-slate-400'
                    : 'border-slate-300 text-slate-500'
                }`}>
                  #{tag}
                </span>
              {/each}
            </div>
          {/if}

          <!-- Prompt summary -->
          <p class={`text-[11px] line-clamp-2 ${
            $theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {evaluation.promptSummary}
          </p>
        </button>
      {/each}
    </div>
  {/if}
</section>
