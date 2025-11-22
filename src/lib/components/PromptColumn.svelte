<!-- @component
no description yet
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { activeContexts } from "$lib/stores/contextStore";
  import { promptState, estimatedTokens } from "$lib/stores/promptStore";
  import { theme } from "$lib/stores/themeStore";
  import { neuroforgeStore } from "$lib/stores/neuroforgeStore";
  import type { ContextBlock } from "$lib/types/context";
  import { get } from "svelte/store";

  let localText = "";
  let selectedModels: string[] = [];
  let workspaceId = "vf_ws_01"; // TODO: Get from workspace store
  let models: any[] = [];
  let isLoadingModels = false;
  let runError: string | null = null;

  // Load models on mount
  onMount(async () => {
    isLoadingModels = true;
    try {
      const response = await fetch("/api/models");
      if (!response.ok) throw new Error("Failed to load models");
      const data = await response.json();
      models = data.models;
      neuroforgeStore.setModels(data.models);
    } catch (err) {
      runError = err instanceof Error ? err.message : "Unknown error";
      neuroforgeStore.setError(runError);
    } finally {
      isLoadingModels = false;
    }
  });

  const onInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    localText = target.value;
    promptState.setText(localText);
  };

  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      selectedModels = selectedModels.filter((m) => m !== modelId);
    } else {
      selectedModels = [...selectedModels, modelId];
    }
    neuroforgeStore.selectModels(selectedModels);
  };

  const handleRun = async () => {
    if (!localText.trim()) {
      runError = "Prompt cannot be empty";
      neuroforgeStore.setError(runError);
      return;
    }
    if (selectedModels.length === 0) {
      runError = "Please select at least one model";
      neuroforgeStore.setError(runError);
      return;
    }

    neuroforgeStore.setExecuting(true);
    neuroforgeStore.setError(null);
    runError = null;

    try {
      const activeCtx = get(activeContexts) as ContextBlock[];
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          prompt: localText.trim(),
          models: selectedModels,
          contexts: activeCtx.map((c: ContextBlock) => c.id),
          system: "", // Optional system prompt
        }),
      });

      if (!response.ok) {
        const responseError = await response.json();
        throw new Error(responseError.error || "Failed to execute prompt");
      }

      const data = await response.json();
      neuroforgeStore.setCurrentRunId(data.run_id);
      neuroforgeStore.setResponses(data.responses);
    } catch (err) {
      runError = err instanceof Error ? err.message : "Execution error";
      neuroforgeStore.setError(runError);
    } finally {
      neuroforgeStore.setExecuting(false);
    }
  };

  const buildContextSummary = () => {
    const active = get(activeContexts) as ContextBlock[];
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
          />
          <span class="truncate max-w-32">{ctx.title}</span>
        </span>
      {/each}
    {/if}
  </div>

  <!-- Model selection -->\n
  <div
    class={`px-4 py-3 border-b flex flex-col gap-2 ${
      $theme === "dark" ? "border-slate-700/60" : "border-slate-200"
    }`}
  >
    <label
      for="models-select"
      class={`text-xs font-medium ${
        $theme === "dark" ? "text-slate-300" : "text-slate-700"
      }`}
    >
      Models ({selectedModels.length} selected)
    </label>
    {#if isLoadingModels}
      <p
        class={`text-xs italic ${
          $theme === "dark" ? "text-slate-500" : "text-slate-400"
        }`}
      >
        Loading models...
      </p>
    {:else if models.length === 0}
      <p
        class={`text-xs italic ${
          $theme === "dark" ? "text-slate-500" : "text-slate-400"
        }`}
      >
        No models available
      </p>
    {:else}
      <div id="models-select" class="flex flex-wrap gap-2">
        {#each models as model}
          <button
            type="button"
            onclick={() => toggleModel(model.id)}
            class={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
              selectedModels.includes(model.id)
                ? $theme === "dark"
                  ? "bg-blue-950 border-blue-700 text-blue-300"
                  : "bg-blue-50 border-blue-300 text-blue-700"
                : $theme === "dark"
                ? "bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600"
                : "bg-slate-100 border-slate-300 text-slate-600 hover:border-slate-400"
            }`}
          >
            {model.name}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Main prompt editor (monospace, generous padding) -->
  <div class="flex-1 p-4 overflow-hidden flex flex-col">
    {#if runError}
      <div
        class={`mb-3 p-2 rounded-md text-xs ${
          $theme === "dark"
            ? "bg-red-950/50 border border-red-900 text-red-300"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}
      >
        {runError}
      </div>
    {/if}
    <textarea
      class={`w-full flex-1 min-h-[280px] bg-transparent border-none outline-none resize-none text-sm font-mono leading-relaxed focus:ring-0 ${
        $theme === "dark"
          ? "text-slate-100 placeholder:text-slate-500"
          : "text-slate-900 placeholder:text-slate-400"
      }`}
      bind:value={localText}
      oninput={onInput}
      placeholder="Write your primary instruction to the model here. Active contexts will be prepended automatically when you run the prompt..."
    />

    <!-- Footer row: character count, helper hint, and run button -->
    <div
      class={`mt-3 pt-2 border-t flex items-center justify-between ${
        $theme === "dark"
          ? "border-slate-700 text-slate-500"
          : "border-slate-200 text-slate-500"
      }`}
    >
      <div class="flex items-center gap-4 text-xs">
        <span>{localText.length} characters</span>
        <span class="italic">Shift+Enter for new lines</span>
      </div>
      <button
        type="button"
        onclick={handleRun}
        disabled={$neuroforgeStore.isExecuting ||
          selectedModels.length === 0 ||
          !localText.trim()}
        class={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          $neuroforgeStore.isExecuting ||
          selectedModels.length === 0 ||
          !localText.trim()
            ? $theme === "dark"
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
            : $theme === "dark"
            ? "bg-emerald-700 text-white hover:bg-emerald-600"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        {#if $neuroforgeStore.isExecuting}
          Running...
        {:else}
          Run ({selectedModels.length})
        {/if}
      </button>
    </div>
  </div>
</section>
