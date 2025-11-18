<!-- @component
no description yet
-->
<script lang="ts">
  import { activeContexts } from "$lib/stores/contextStore";
  import { promptState, estimatedTokens } from "$lib/stores/promptStore";
  import { theme } from "$lib/stores/themeStore";
  import type { ContextBlock } from "$lib/types/context";
  import { get } from "svelte/store";

  let localText = $state("");

  const onInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    localText = target.value;
    promptState.setText(localText);
  };

  const buildContextSummary = () => {
    const active = get(activeContexts);
    if (!active.length) return "No active contexts";
    return active.map((c: ContextBlock) => c.title).join(" • ");
  };
</script>

<!-- Prompt Column: The primary workspace (visually emphasized) -->
<section
  class={`flex flex-col rounded-lg border transition-colors ${
    $theme === "dark"
      ? "border-slate-700 bg-slate-900"
      : "border-slate-200 bg-white shadow-sm"
  }`}
>
  <!-- Header with context summary and token count -->
  <header
    class={`px-4 py-3 border-b flex items-center justify-between ${
      $theme === "dark" ? "border-slate-700" : "border-slate-200"
    }`}
  >
    <div class="flex flex-col gap-1">
      <h2
        class={`text-sm font-semibold tracking-tight ${
          $theme === "dark" ? "text-slate-100" : "text-slate-900"
        }`}
      >
        Prompt
      </h2>
      <p
        class={`text-xs truncate max-w-md ${
          $theme === "dark" ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {buildContextSummary()}
      </p>
    </div>
    <div
      class={`flex items-center gap-2 text-xs ${
        $theme === "dark" ? "text-slate-400" : "text-slate-500"
      }`}
    >
      <span>~{$estimatedTokens} tokens</span>
    </div>
  </header>

  <!-- Active context chips row -->
  <div
    class={`px-4 py-3 border-b flex flex-wrap gap-2 ${
      $theme === "dark" ? "border-slate-700/60" : "border-slate-200"
    }`}
  >
    {#if $activeContexts.length === 0}
      <span
        class={`text-xs italic ${
          $theme === "dark" ? "text-slate-500" : "text-slate-400"
        }`}
      >
        No active contexts—toggle some in the Context column to include them.
      </span>
    {:else}
      {#each $activeContexts as ctx}
        <span
          class={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${
            $theme === "dark"
              ? "bg-slate-950 border-slate-700 text-slate-300"
              : "bg-amber-50 border-amber-200 text-amber-700"
          }`}
        >
          <span
            class={`w-1.5 h-1.5 rounded-full ${
              $theme === "dark" ? "bg-amber-500" : "bg-amber-500"
            }`}
          ></span>
          <span class="truncate max-w-32">{ctx.title}</span>
        </span>
      {/each}
    {/if}
  </div>

  <!-- Main prompt editor (monospace, generous padding) -->
  <div class="flex-1 p-4 overflow-hidden flex flex-col">
    <textarea
      class={`w-full flex-1 min-h-[280px] bg-transparent border-none outline-none resize-none text-sm font-mono leading-relaxed focus:ring-0 ${
        $theme === "dark"
          ? "text-slate-100 placeholder:text-slate-500"
          : "text-slate-900 placeholder:text-slate-400"
      }`}
      bind:value={localText}
      oninput={onInput}
      placeholder="Write your primary instruction to the model here. Active contexts will be prepended automatically when you run the prompt..."
    ></textarea>

    <!-- Footer row: character count and helper hint -->
    <div
      class={`mt-3 pt-2 border-t flex items-center justify-between text-xs ${
        $theme === "dark"
          ? "border-slate-700 text-slate-500"
          : "border-slate-200 text-slate-500"
      }`}
    >
      <span>{localText.length} characters</span>
      <span class="italic">Shift+Enter for new lines</span>
    </div>
  </div>
</section>
