<script lang="ts">
  import { theme } from '$lib/stores/themeStore';

  type PatternCategory = 'coding' | 'writing' | 'analysis' | 'evaluation' | 'research';
  type PatternComplexity = 'basic' | 'intermediate' | 'advanced';

  interface PatternSlot {
    name: string;
    label: string;
    description: string;
  }

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
    template: string;
    slots?: PatternSlot[];
  }

  interface Props {
    pattern: Pattern | null;
    onSendToWorkbench: (pattern: Pattern) => void;
    onCopyPattern: (pattern: Pattern) => void;
  }

  let { pattern, onSendToWorkbench, onCopyPattern }: Props = $props();

  const categoryLabels: Record<PatternCategory, string> = {
    coding: 'Coding',
    writing: 'Writing',
    analysis: 'Analysis',
    evaluation: 'Evaluation',
    research: 'Research'
  };
</script>

<!-- Detail panel for selected pattern -->
<section class={`rounded-lg border p-4 flex flex-col gap-4 transition-colors min-h-[600px] ${
  $theme === 'dark'
    ? 'border-slate-700 bg-slate-900'
    : 'border-slate-200 bg-white shadow-sm'
}`}>
  {#if !pattern}
    <!-- Empty state when no pattern is selected -->
    <div class="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div class={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
        $theme === 'dark'
          ? 'bg-slate-950 border border-slate-700'
          : 'bg-slate-50 border border-slate-200'
      }`}>
        <span class="text-3xl">🧩</span>
      </div>
      <h3 class={`text-sm font-semibold mb-2 ${
        $theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
      }`}>
        No pattern selected
      </h3>
      <p class={`text-xs leading-relaxed max-w-md ${
        $theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
      }`}>
        Select a pattern from the list to view its structure, variables, and template. You can then send it to the Workbench or copy it.
      </p>
    </div>
  {:else}
    <!-- Header with name, category, and complexity -->
    <div class="flex flex-col gap-2">
      <div class="flex items-start justify-between gap-3">
        <h2 class={`text-sm font-semibold leading-tight ${
          $theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}>
          {pattern.name}
        </h2>
        <span class={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] border font-medium shrink-0 capitalize ${
          $theme === 'dark'
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            : 'bg-amber-100 text-amber-700 border-amber-300'
        }`}>
          {categoryLabels[pattern.category]}
        </span>
      </div>

      <!-- Metadata line -->
      <div class={`text-[11px] flex items-center gap-2 ${
        $theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
      }`}>
        <span>{pattern.useCase}</span>
        <span>•</span>
        <span>Updated {pattern.updatedAt}</span>
        <span>•</span>
        <span class="capitalize">{pattern.complexity} pattern</span>
      </div>
    </div>

    <!-- Tags -->
    {#if pattern.tags.length > 0}
      <div class="flex flex-wrap gap-2">
        {#each pattern.tags as tag}
          <span class={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${
            $theme === 'dark'
              ? 'bg-slate-950 border-slate-700 text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            {tag}
          </span>
        {/each}
      </div>
    {/if}

    <!-- Models -->
    {#if pattern.models.length > 0}
      <div class={`text-[11px] ${
        $theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
      }`}>
        <span class="font-medium">Best with:</span> {pattern.models.join(', ')}
      </div>
    {/if}

    <!-- Summary -->
    <div class={`border-t pt-4 ${
      $theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
    }`}>
      <h3 class={`text-xs font-semibold mb-2 ${
        $theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
      }`}>
        Summary
      </h3>
      <p class={`text-xs leading-relaxed ${
        $theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
      }`}>
        {pattern.summary}
      </p>
    </div>

    <!-- Variables / Slots -->
    {#if pattern.slots && pattern.slots.length > 0}
      <div>
        <h3 class={`text-xs font-semibold mb-2 ${
          $theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
        }`}>
          Variables ({pattern.slots.length})
        </h3>
        <div class={`rounded-md border p-3 space-y-2 ${
          $theme === 'dark'
            ? 'bg-slate-950 border-slate-800'
            : 'bg-slate-50 border-slate-200'
        }`}>
          {#each pattern.slots as slot}
            <div class="text-[11px]">
              <span class={`font-mono font-semibold ${
                $theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
              }`}>
                {`{{${slot.name}}}`}
              </span>
              <span class={`mx-1.5 ${
                $theme === 'dark' ? 'text-slate-600' : 'text-slate-400'
              }`}>
                •
              </span>
              <span class={`font-medium ${
                $theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
              }`}>
                {slot.label}:
              </span>
              <span class={
                $theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }>
                {slot.description}
              </span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Template Preview -->
    <div class="flex-1 flex flex-col">
      <h3 class={`text-xs font-semibold mb-2 ${
        $theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
      }`}>
        Template
      </h3>
      <div class={`rounded-md border p-3 text-xs font-mono leading-relaxed overflow-y-auto flex-1 max-h-[280px] ${
        $theme === 'dark'
          ? 'bg-slate-950 border-slate-800 text-slate-200'
          : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        <pre class="whitespace-pre-wrap">{pattern.template}</pre>
      </div>
    </div>

    <!-- Actions -->
    <div class={`border-t pt-4 flex items-center justify-between gap-3 ${
      $theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
    }`}>
      <div class="flex gap-2">
        <button
          type="button"
          class={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            $theme === 'dark'
              ? 'bg-amber-500 text-slate-900 hover:bg-amber-600 shadow-md shadow-amber-500/20'
              : 'bg-amber-500 text-slate-900 hover:bg-amber-600 shadow-md'
          }`}
          onclick={() => onSendToWorkbench(pattern)}
        >
          Send to Workbench
        </button>
        <button
          type="button"
          class={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
            $theme === 'dark'
              ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-200'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-700'
          }`}
          onclick={() => onCopyPattern(pattern)}
        >
          Copy Pattern
        </button>
        <button
          type="button"
          class={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
            $theme === 'dark'
              ? 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-700'
          }`}
          disabled
          title="Coming soon"
        >
          Duplicate
        </button>
      </div>

      <!-- Pattern ID (subtle reference) -->
      <span class={`text-[11px] font-mono ${
        $theme === 'dark' ? 'text-slate-600' : 'text-slate-400'
      }`}>
        ID: {pattern.id}
      </span>
    </div>
  {/if}
</section>
