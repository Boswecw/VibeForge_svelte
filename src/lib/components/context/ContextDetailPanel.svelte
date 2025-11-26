<script lang="ts">
  import { themeStore } from '$lib/core/stores';

  type ContextType = 'design-system' | 'project-spec' | 'code-summary' | 'style-guide' | 'knowledge-pack';
  type ContextSize = 'small' | 'medium' | 'large';

  interface ContextBlock {
    id: string;
    name: string;
    type: ContextType;
    tags: string[];
    updatedAt: string;
    size: ContextSize;
    summary: string;
    project?: string;
    previewContent: string;
  }

  interface Props {
    block: ContextBlock | null;
    onSendToWorkbench: (block: ContextBlock) => void;
  }

  let { block, onSendToWorkbench }: Props = $props();

  const typeLabels: Record<ContextType, string> = {
    'design-system': 'Design System',
    'project-spec': 'Project Spec',
    'code-summary': 'Code Summary',
    'style-guide': 'Style Guide',
    'knowledge-pack': 'Knowledge Pack'
  };
</script>

<!-- Detail panel for selected context block -->
<section class={`rounded-lg border p-4 flex flex-col gap-4 transition-colors min-h-[600px] ${
  themeStore.current === 'dark'
    ? 'border-slate-700 bg-slate-900'
    : 'border-slate-200 bg-white shadow-sm'
}`}>
  {#if !block}
    <!-- Empty state when no block is selected -->
    <div class="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div class={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
        themeStore.current === 'dark'
          ? 'bg-slate-950 border border-slate-700'
          : 'bg-slate-50 border border-slate-200'
      }`}>
        <span class="text-3xl">📚</span>
      </div>
      <h3 class={`text-sm font-semibold mb-2 ${
        themeStore.current === 'dark' ? 'text-slate-300' : 'text-slate-700'
      }`}>
        No context selected
      </h3>
      <p class={`text-xs leading-relaxed max-w-md ${
        themeStore.current === 'dark' ? 'text-slate-400' : 'text-slate-500'
      }`}>
        Select a context block from the list to see its details, preview its content, and send it to the Workbench.
      </p>
    </div>
  {:else}
    <!-- Header with name, type, and project -->
    <div class="flex flex-col gap-2">
      <div class="flex items-start justify-between gap-3">
        <h2 class={`text-sm font-semibold leading-tight ${
          themeStore.current === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}>
          {block.name}
        </h2>
        <span class={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] border font-medium shrink-0 ${
          themeStore.current === 'dark'
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            : 'bg-amber-100 text-amber-700 border-amber-300'
        }`}>
          {typeLabels[block.type]}
        </span>
      </div>

      <!-- Metadata line -->
      <div class={`text-[11px] flex items-center gap-2 ${
        themeStore.current === 'dark' ? 'text-slate-400' : 'text-slate-500'
      }`}>
        <span>{block.project ?? 'Global'}</span>
        <span>•</span>
        <span>Updated {block.updatedAt}</span>
        <span>•</span>
        <span class="capitalize">{block.size} context</span>
      </div>
    </div>

    <!-- Tags -->
    {#if block.tags.length > 0}
      <div class="flex flex-wrap gap-2">
        {#each block.tags as tag}
          <span class={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${
            themeStore.current === 'dark'
              ? 'bg-slate-950 border-slate-700 text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            {tag}
          </span>
        {/each}
      </div>
    {/if}

    <!-- Summary -->
    <div class={`border-t pt-4 ${
      themeStore.current === 'dark' ? 'border-slate-700' : 'border-slate-200'
    }`}>
      <h3 class={`text-xs font-semibold mb-2 ${
        themeStore.current === 'dark' ? 'text-slate-300' : 'text-slate-700'
      }`}>
        Summary
      </h3>
      <p class={`text-xs leading-relaxed ${
        themeStore.current === 'dark' ? 'text-slate-300' : 'text-slate-600'
      }`}>
        {block.summary}
      </p>
    </div>

    <!-- Preview content -->
    <div class="flex-1 flex flex-col">
      <h3 class={`text-xs font-semibold mb-2 ${
        themeStore.current === 'dark' ? 'text-slate-300' : 'text-slate-700'
      }`}>
        Preview
      </h3>
      <div class={`rounded-md border p-3 text-xs font-mono leading-relaxed overflow-y-auto flex-1 max-h-[280px] ${
        themeStore.current === 'dark'
          ? 'bg-slate-950 border-slate-800 text-slate-200'
          : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        <pre class="whitespace-pre-wrap">{block.previewContent}</pre>
      </div>
    </div>

    <!-- Actions -->
    <div class={`border-t pt-4 flex items-center justify-between gap-3 ${
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
          onclick={() => onSendToWorkbench(block)}
        >
          Send to Workbench
        </button>
        <button
          type="button"
          class={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
            themeStore.current === 'dark'
              ? 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-700'
          }`}
          disabled
          title="Coming soon"
        >
          Edit
        </button>
        <button
          type="button"
          class={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
            themeStore.current === 'dark'
              ? 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-700'
          }`}
          disabled
          title="Coming soon"
        >
          Duplicate
        </button>
      </div>

      <!-- Context ID (subtle reference) -->
      <span class={`text-[11px] font-mono ${
        themeStore.current === 'dark' ? 'text-slate-600' : 'text-slate-400'
      }`}>
        ID: {block.id}
      </span>
    </div>
  {/if}
</section>
