<script lang="ts">
  import { activeContexts } from '$lib/stores/contextStore';
  import { promptState, estimatedTokens } from '$lib/stores/promptStore';
  import type { ContextBlock } from '$lib/types/context';
  import { get } from 'svelte/store';

  let localText = $state('');

  const onInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    localText = target.value;
    promptState.setText(localText);
  };

  const buildContextSummary = () => {
    const active = get(activeContexts);
    if (!active.length) return 'No active contexts';
    return active.map((c: ContextBlock) => c.title).join(' • ');
  };
</script>

<div class="flex flex-col border border-forge-line rounded-lg bg-forge-steel/70 overflow-hidden">
  <header class="px-3 py-2 border-b border-forge-line flex items-center justify-between">
    <div class="flex flex-col gap-0.5">
      <span class="text-xs font-semibold">Prompt</span>
      <p class="text-[10px] text-forge-textMuted truncate max-w-[16rem]">
        {buildContextSummary()}
      </p>
    </div>
    <div class="flex items-center gap-2 text-[11px] text-forge-textMuted">
      <span>Tokens: ~{$estimatedTokens}</span>
    </div>
  </header>

  <!-- Active context chips -->
  <div class="px-3 pt-2 pb-1 border-b border-forge-line/60 flex flex-wrap gap-1.5">
    {#if $activeContexts.length === 0}
      <span class="text-[10px] text-forge-textMuted italic">
        No active contexts. Toggle some on in the Context column.
      </span>
    {:else}
      {#each $activeContexts as ctx}
        <span
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-forge-blacksteel/60 border border-forge-line text-[10px] text-forge-textDim"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-forge-ember"></span>
          <span class="truncate max-w-[7rem]">{ctx.title}</span>
        </span>
      {/each}
    {/if}
  </div>

  <!-- Prompt editor -->
  <div class="flex-1 overflow-hidden p-3">
    <textarea
      class="w-full h-full bg-transparent border-none outline-none resize-none text-xs leading-relaxed"
      bind:value={localText}
      oninput={onInput}
      placeholder="Write or assemble your prompt here. Active contexts from the left column will be applied when sending to the models..."
    ></textarea>
  </div>
</div>
