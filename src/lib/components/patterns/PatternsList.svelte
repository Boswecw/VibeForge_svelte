<script lang="ts">
  import { theme } from '$lib/stores/themeStore';

  type PatternCategory = 'coding' | 'writing' | 'analysis' | 'evaluation' | 'research';
  type PatternComplexity = 'basic' | 'intermediate' | 'advanced';

  interface Pattern {
    id: string;
    name: string;
    category: PatternCategory;
    useCase: string;
    models: string[];
    complexity: PatternComplexity;
    tags: string[];
    updatedAt: string;
    summary: string;
  }

  interface Props {
    patterns: Pattern[];
    activePatternId: string | null;
    onSelect: (id: string) => void;
  }

  let { patterns, activePatternId, onSelect }: Props = $props();

  const categoryLabels: Record<PatternCategory, string> = {
    coding: 'Coding',
    writing: 'Writing',
    analysis: 'Analysis',
    evaluation: 'Evaluation',
    research: 'Research'
  };
</script>

<!-- Scrollable list of patterns -->
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
      Patterns
    </h2>
    <span class={`text-xs ${
      $theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
    }`}>
      {patterns.length} {patterns.length === 1 ? 'pattern' : 'patterns'}
    </span>
  </div>

  <!-- List of patterns -->
  {#if patterns.length === 0}
    <div class={`border border-dashed rounded-md p-6 text-center text-xs ${
      $theme === 'dark'
        ? 'border-slate-700 text-slate-500'
        : 'border-slate-300 text-slate-500'
    }`}>
      <p>No patterns match your filters.</p>
      <p class="mt-1 text-[11px]">Try adjusting your search or category filters.</p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each patterns as pattern (pattern.id)}
        {@const isActive = activePatternId === pattern.id}
        <button
          type="button"
          class={`w-full text-left rounded-md border px-3 py-2 flex flex-col gap-1.5 transition-colors ${
            isActive
              ? $theme === 'dark'
                ? 'border-amber-400 bg-slate-950 ring-1 ring-amber-400/30'
                : 'border-amber-500 bg-amber-50 ring-1 ring-amber-500/20'
              : $theme === 'dark'
                ? 'border-slate-700 bg-slate-950 hover:bg-slate-900 hover:border-slate-600'
                : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
          }`}
          onclick={() => onSelect(pattern.id)}
        >
          <!-- Name and category badge -->
          <div class="flex items-start justify-between gap-2">
            <span class={`text-xs font-medium leading-tight ${
              isActive
                ? $theme === 'dark'
                  ? 'text-slate-100'
                  : 'text-slate-900'
                : $theme === 'dark'
                  ? 'text-slate-200'
                  : 'text-slate-800'
            }`}>
              {pattern.name}
            </span>
            <span class={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] border font-medium shrink-0 capitalize ${
              isActive
                ? $theme === 'dark'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-amber-100 text-amber-700 border-amber-300'
                : $theme === 'dark'
                  ? 'bg-slate-900 text-slate-400 border-slate-700'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              {categoryLabels[pattern.category]}
            </span>
          </div>

          <!-- Use case, updated time, and complexity -->
          <div class="flex items-center justify-between gap-2 text-[11px]">
            <span class={
              $theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }>
              {pattern.useCase} • {pattern.updatedAt}
            </span>
            <span class={`capitalize ${
              $theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              {pattern.complexity}
            </span>
          </div>

          <!-- Model chips -->
          {#if pattern.models.length > 0}
            <div class="flex items-center gap-1 flex-wrap">
              {#each pattern.models as model}
                <span class={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] ${
                  $theme === 'dark'
                    ? 'bg-slate-900 text-slate-500 border border-slate-700'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {model}
                </span>
              {/each}
            </div>
          {/if}

          <!-- Summary (truncated to 2 lines) -->
          <p class={`text-[11px] line-clamp-2 leading-relaxed ${
            $theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {pattern.summary}
          </p>
        </button>
      {/each}
    </div>
  {/if}
</section>
