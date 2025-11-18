<script lang="ts">
  import { contexts } from '$lib/stores/contextStore';
  import type { ContextBlock } from '$lib/types/context';

  const kindLabels: Record<ContextBlock['kind'], string> = {
    system: 'System',
    design: 'Design',
    project: 'Project',
    code: 'Code',
    workflow: 'Workflow'
  };

  const sourceLabels: Record<ContextBlock['source'], string> = {
    global: 'Global',
    workspace: 'Workspace',
    local: 'Local'
  };

  const toggle = (id: string) => {
    contexts.toggleActive(id);
  };
</script>

<div class="flex flex-col h-full w-full p-4 gap-3">
  <header class="flex items-center justify-between">
    <div>
      <h1 class="text-sm font-semibold">Context Library</h1>
      <p class="text-[11px] text-forge-textMuted">
        Browse, tag, and activate the context blocks that shape your prompts in the Workbench.
      </p>
    </div>
    <button
      type="button"
      class="px-3 py-1 rounded-md border border-forge-line bg-forge-steel/60 hover:bg-forge-steel text-xs"
    >
      + New Context (future)
    </button>
  </header>

  <section class="flex-1 border border-forge-line rounded-lg bg-forge-gunmetal/60 overflow-hidden">
    <div class="border-b border-forge-line px-3 py-2 flex items-center justify-between text-[11px] text-forge-textMuted">
      <span>All Context Blocks</span>
      <span class="italic">Editing & creation features to be added later.</span>
    </div>

    <div class="overflow-y-auto p-3 text-xs">
      <table class="w-full border-collapse text-[11px]">
        <thead class="text-forge-textDim border-b border-forge-line">
          <tr class="text-left">
            <th class="pb-2 pr-3 font-medium">Title</th>
            <th class="pb-2 pr-3 font-medium">Kind</th>
            <th class="pb-2 pr-3 font-medium">Source</th>
            <th class="pb-2 pr-3 font-medium">Tags</th>
            <th class="pb-2 pr-3 font-medium">Active</th>
          </tr>
        </thead>
        <tbody>
          {#each $contexts as ctx}
            <tr class="border-b border-forge-line/60 hover:bg-forge-steel/40">
              <td class="py-1.5 pr-3 align-top">
                <div class="font-semibold text-forge-textBright">{ctx.title}</div>
                <div class="text-forge-textMuted line-clamp-2">
                  {ctx.description}
                </div>
              </td>
              <td class="py-1.5 pr-3 align-top text-forge-textDim">
                {kindLabels[ctx.kind]}
              </td>
              <td class="py-1.5 pr-3 align-top text-forge-textDim">
                {sourceLabels[ctx.source]}
              </td>
              <td class="py-1.5 pr-3 align-top text-forge-textMuted">
                {#if ctx.tags.length === 0}
                  <span class="italic text-forge-textMuted/70">none</span>
                {:else}
                  {ctx.tags.join(', ')}
                {/if}
              </td>
              <td class="py-1.5 pr-3 align-top">
                <button
                  type="button"
                  class="px-2 py-0.5 rounded-full text-[10px] border
                    {ctx.isActive
                      ? 'bg-forge-ember text-black border-forge-ember shadow-ember'
                      : 'bg-transparent text-forge-textMuted border-forge-line hover:bg-forge-steel/60'}"
                  onclick={() => toggle(ctx.id)}
                >
                  {ctx.isActive ? 'On' : 'Off'}
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
</div>
