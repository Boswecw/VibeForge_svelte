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
    blocks: ContextBlock[];
    activeContextId: string | null;
    onSelect: (id: string) => void;
  }

  let { blocks, activeContextId, onSelect }: Props = $props();

  const typeLabels: Record<ContextType, string> = {
    'design-system': 'Design System',
    'project-spec': 'Project Spec',
    'code-summary': 'Code Summary',
    'style-guide': 'Style Guide',
    'knowledge-pack': 'Knowledge Pack'
  };
</script>

<!-- Scrollable list of context blocks -->
<section class={`rounded-lg border p-3 flex flex-col gap-2 overflow-y-auto max-h-[600px] transition-colors ${
  themeStore.current === 'dark'
    ? 'border-slate-700 bg-slate-900'
    : 'border-slate-200 bg-white shadow-sm'
}`}>
  <!-- Section header -->
  <div class="flex items-center justify-between mb-1">
    <h2 class={`text-xs font-semibold ${
      themeStore.current === 'dark' ? 'text-slate-300' : 'text-slate-700'
    }`}>
      Context Blocks
    </h2>
    <span class={`text-xs ${
      themeStore.current === 'dark' ? 'text-slate-500' : 'text-slate-400'
    }`}>
      {blocks.length} {blocks.length === 1 ? 'item' : 'items'}
    </span>
  </div>

  <!-- List of context blocks -->
  {#if blocks.length === 0}
    <div class={`border border-dashed rounded-md p-6 text-center text-xs ${
      themeStore.current === 'dark'
        ? 'border-slate-700 text-slate-500'
        : 'border-slate-300 text-slate-500'
    }`}>
      <p>No context blocks match your filters.</p>
      <p class="mt-1 text-[11px]">Try adjusting your search or type filters.</p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each blocks as block (block.id)}
        {@const isActive = activeContextId === block.id}
        <button
          type="button"
          class={`w-full text-left rounded-md border px-3 py-2 flex flex-col gap-1.5 transition-colors ${
            isActive
              ? themeStore.current === 'dark'
                ? 'border-amber-400 bg-slate-950 ring-1 ring-amber-400/30'
                : 'border-amber-500 bg-amber-50 ring-1 ring-amber-500/20'
              : themeStore.current === 'dark'
                ? 'border-slate-700 bg-slate-950 hover:bg-slate-900 hover:border-slate-600'
                : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
          }`}
          onclick={() => onSelect(block.id)}
        >
          <!-- Name and type badge -->
          <div class="flex items-start justify-between gap-2">
            <span class={`text-xs font-medium leading-tight ${
              isActive
                ? themeStore.current === 'dark'
                  ? 'text-slate-100'
                  : 'text-slate-900'
                : themeStore.current === 'dark'
                  ? 'text-slate-200'
                  : 'text-slate-800'
            }`}>
              {block.name}
            </span>
            <span class={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] border font-medium shrink-0 ${
              isActive
                ? themeStore.current === 'dark'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-amber-100 text-amber-700 border-amber-300'
                : themeStore.current === 'dark'
                  ? 'bg-slate-900 text-slate-400 border-slate-700'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              {typeLabels[block.type]}
            </span>
          </div>

          <!-- Project, updated time, and size -->
          <div class="flex items-center justify-between gap-2 text-[11px]">
            <span class={
              themeStore.current === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }>
              {block.project ?? 'Global'} • {block.updatedAt}
            </span>
            <span class={`capitalize ${
              themeStore.current === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              {block.size}
            </span>
          </div>

          <!-- Summary (truncated to 2 lines) -->
          <p class={`text-[11px] line-clamp-2 leading-relaxed ${
            themeStore.current === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {block.summary}
          </p>

          <!-- Tag preview (show first 3 tags) -->
          {#if block.tags.length > 0}
            <div class="flex flex-wrap gap-1 mt-0.5">
              {#each block.tags.slice(0, 3) as tag}
                <span class={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] ${
                  themeStore.current === 'dark'
                    ? 'bg-slate-900 text-slate-500'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {tag}
                </span>
              {/each}
              {#if block.tags.length > 3}
                <span class={`inline-flex items-center px-1.5 py-0.5 text-[10px] ${
                  themeStore.current === 'dark' ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  +{block.tags.length - 3} more
                </span>
              {/if}
            </div>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</section>
