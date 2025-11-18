<script lang="ts">
  import { contexts, activeContexts, inactiveContexts } from '$lib/stores/contextStore';
  import type { ContextBlock } from '$lib/types/context';
  import { derived } from 'svelte/store';

  const maxVisible = 4;

  const limitedActive = derived(activeContexts, ($active) => $active.slice(0, maxVisible));
  const moreActiveCount = derived(activeContexts, ($active) =>
    $active.length > maxVisible ? $active.length - maxVisible : 0
  );

  const limitedInactive = derived(inactiveContexts, ($inactive) => $inactive.slice(0, maxVisible));
  const moreInactiveCount = derived(inactiveContexts, ($inactive) =>
    $inactive.length > maxVisible ? $inactive.length - maxVisible : 0
  );

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

<div class="flex flex-col border border-forge-line rounded-lg bg-forge-gunmetal/60 overflow-hidden">
  <header class="px-3 py-2 border-b border-forge-line flex items-center justify-between">
    <span class="text-xs font-semibold">Context</span>
    <a
      href="/contexts"
      class="text-[11px] text-forge-ember hover:underline"
    >
      Manage
    </a>
  </header>

  <div class="flex-1 overflow-y-auto p-3 text-xs text-forge-textDim space-y-3">
    <p class="text-forge-textMuted text-[11px] leading-relaxed">
      Active context blocks are prepended or merged into your prompt. Toggle them on/off here
      or open the Context Library to manage details.
    </p>

    <!-- Active contexts -->
    <section>
      <div class="flex items-center justify-between mb-1">
        <span class="text-[11px] font-semibold text-forge-textDim">Active</span>
        {#if $moreActiveCount > 0}
          <span class="text-[10px] text-forge-textMuted">
            +{$moreActiveCount} more
          </span>
        {/if}
      </div>

      {#if $limitedActive.length === 0}
        <div class="border border-dashed border-forge-line rounded-md p-2 text-[11px] text-forge-textMuted">
          No active contexts. Choose at least one from below or from the Context Library.
        </div>
      {:else}
        <div class="space-y-1.5">
          {#each $limitedActive as ctx}
            <button
              type="button"
              class="w-full text-left rounded-md border border-forge-line bg-forge-steel/60 px-2 py-1.5 hover:bg-forge-steel flex flex-col gap-0.5"
              onclick={() => toggle(ctx.id)}
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-semibold text-forge-textBright truncate">
                  {ctx.title}
                </span>
                <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-forge-ember/10 text-forge-ember border border-forge-ember/40">
                  On
                </span>
              </div>
              <div class="flex items-center justify-between text-[10px] text-forge-textMuted">
                <span>{kindLabels[ctx.kind]} • {sourceLabels[ctx.source]}</span>
                <span class="truncate max-w-[8rem]">
                  {ctx.tags.join(', ')}
                </span>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </section>

    <!-- Inactive contexts -->
    <section class="pt-2 border-t border-forge-line/60">
      <div class="flex items-center justify-between mb-1">
        <span class="text-[11px] font-semibold text-forge-textDim">Available</span>
        {#if $moreInactiveCount > 0}
          <span class="text-[10px] text-forge-textMuted">
            +{$moreInactiveCount} more
          </span>
        {/if}
      </div>

      {#if $limitedInactive.length === 0}
        <div class="border border-dashed border-forge-line rounded-md p-2 text-[11px] text-forge-textMuted">
          All contexts are active right now.
        </div>
      {:else}
        <div class="space-y-1.5">
          {#each $limitedInactive as ctx}
            <button
              type="button"
              class="w-full text-left rounded-md border border-forge-line bg-forge-blacksteel/40 px-2 py-1.5 hover:bg-forge-steel/40 flex flex-col gap-0.5"
              onclick={() => toggle(ctx.id)}
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-semibold text-forge-textDim truncate">
                  {ctx.title}
                </span>
                <span class="text-[10px] px-1.5 py-0.5 rounded-full border border-forge-line text-forge-textMuted">
                  Off
                </span>
              </div>
              <div class="flex items-center justify-between text-[10px] text-forge-textMuted">
                <span>{kindLabels[ctx.kind]} • {sourceLabels[ctx.source]}</span>
                <span class="truncate max-w-[8rem]">
                  {ctx.tags.join(', ')}
                </span>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</div>
