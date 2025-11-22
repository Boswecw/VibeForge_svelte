<!-- @component
no description yet
-->
<script lang="ts">
  import { neuroforgeStore } from "$lib/stores/neuroforgeStore";
  import { theme } from "$lib/stores/themeStore";
  import ResearchPanel from "./research/ResearchPanel.svelte";

  let selectedTab: string | null = null;
  let showResearch = false;

  // Set first tab as active when responses change
  $: {
    if ($neuroforgeStore.responses.length > 0 && !selectedTab) {
      selectedTab = $neuroforgeStore.responses[0].output_id;
    }
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-US").format(num);
  };
</script>

<!-- Output Column: View model outputs -->
<section
  class={`flex flex-col rounded-lg border transition-colors ${
    $theme === "dark"
      ? "border-slate-700 bg-slate-900"
      : "border-slate-200 bg-white shadow-sm"
  }`}
>
  <header
    class={`px-4 py-3 border-b ${
      $theme === "dark" ? "border-slate-700" : "border-slate-200"
    }`}
  >
    <div class="flex items-center justify-between gap-4">
      <h2
        class={`text-sm font-semibold tracking-tight ${
          $theme === "dark" ? "text-slate-100" : "text-slate-900"
        }`}
      >
        Output
      </h2>
      {#if $neuroforgeStore.isExecuting}
        <div class="flex items-center gap-2 text-xs">
          <div class="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span class={$theme === "dark" ? "text-blue-400" : "text-blue-600"}>
            Executing...
          </span>
        </div>
      {:else if $neuroforgeStore.currentRunId}
        <span
          class={`text-xs ${
            $theme === "dark" ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Run ID: {$neuroforgeStore.currentRunId.substring(0, 8)}
        </span>
      {:else}
        <span
          class={`text-xs italic ${
            $theme === "dark" ? "text-slate-500" : "text-slate-500"
          }`}
        >
          No runs yet
        </span>
      {/if}
    </div>
  </header>

  <!-- Response tabs -->
  {#if $neuroforgeStore.responses.length > 0}
    <div
      class={`flex overflow-x-auto border-b ${
        $theme === "dark" ? "border-slate-700/60" : "border-slate-200"
      }`}
    >
      {#each $neuroforgeStore.responses as response (response.output_id)}
        <button
          type="button"
          onclick={() => {
            selectedTab = response.output_id;
            showResearch = false;
          }}
          class={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
            selectedTab === response.output_id && !showResearch
              ? $theme === "dark"
                ? "border-blue-500 text-blue-400 bg-slate-950/50"
                : "border-blue-500 text-blue-600 bg-slate-50"
              : $theme === "dark"
              ? "border-transparent text-slate-400 hover:text-slate-200"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          {response.model}
        </button>
      {/each}

      <!-- Research Tab -->
      <button
        type="button"
        onclick={() => {
          showResearch = true;
          selectedTab = null;
        }}
        class={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
          showResearch
            ? $theme === "dark"
              ? "border-amber-500 text-amber-400 bg-slate-950/50"
              : "border-amber-500 text-amber-600 bg-slate-50"
            : $theme === "dark"
            ? "border-transparent text-slate-400 hover:text-slate-200"
            : "border-transparent text-slate-600 hover:text-slate-900"
        }`}
      >
        🔍 Research
      </button>
    </div>
  {:else}
    <!-- Research Tab (no responses) -->
    <div
      class={`flex border-b ${
        $theme === "dark" ? "border-slate-700/60" : "border-slate-200"
      }`}
    >
      <button
        type="button"
        onclick={() => {
          showResearch = true;
          selectedTab = null;
        }}
        class={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
          showResearch
            ? $theme === "dark"
              ? "border-amber-500 text-amber-400 bg-slate-950/50"
              : "border-amber-500 text-amber-600 bg-slate-50"
            : $theme === "dark"
            ? "border-transparent text-slate-400 hover:text-slate-200"
            : "border-transparent text-slate-600 hover:text-slate-900"
        }`}
      >
        🔍 Research
      </button>
    </div>
  {/if}

  <!-- Main output area -->
  <div
    class={`flex-1 overflow-y-auto ${
      $theme === "dark" ? "text-slate-300" : "text-slate-700"
    }`}
  >
    {#if showResearch}
      <!-- Research Panel -->
      <div class="h-full">
        <ResearchPanel />
      </div>
    {:else if $neuroforgeStore.isExecuting}
      <div class="flex items-center justify-center h-32">
        <div
          class={`text-sm italic ${
            $theme === "dark" ? "text-slate-500" : "text-slate-500"
          }`}
        >
          Executing prompt across selected models...
        </div>
      </div>
    {:else if $neuroforgeStore.error}
      <div
        class={`p-3 rounded-md text-xs m-4 ${
          $theme === "dark"
            ? "bg-red-950/50 border border-red-900 text-red-300"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}
      >
        <strong>Error:</strong>
        {$neuroforgeStore.error}
      </div>
    {:else if selectedTab && $neuroforgeStore.responses.length > 0}
      <div class="p-4 space-y-3">
        {#each $neuroforgeStore.responses as response}
          {#if response.output_id === selectedTab}
            <!-- Output text -->
            <div
              class={`rounded-md border p-4 ${
                $theme === "dark"
                  ? "border-slate-700 bg-slate-950"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <pre
                class={`whitespace-pre-wrap text-sm leading-relaxed font-mono ${
                  $theme === "dark" ? "text-slate-100" : "text-slate-900"
                }`}>{response.text}</pre>
            </div>

            <!-- Metrics -->
            <div
              class={`grid grid-cols-3 gap-3 p-3 rounded-md border ${
                $theme === "dark"
                  ? "border-slate-700 bg-slate-950/50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div>
                <p
                  class={`text-xs font-medium ${
                    $theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Tokens
                </p>
                <p
                  class={`text-sm font-mono ${
                    $theme === "dark" ? "text-slate-200" : "text-slate-900"
                  }`}
                >
                  {formatNumber(response.usage.total_tokens || 0)}
                </p>
              </div>
              <div>
                <p
                  class={`text-xs font-medium ${
                    $theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Latency
                </p>
                <p
                  class={`text-sm font-mono ${
                    $theme === "dark" ? "text-slate-200" : "text-slate-900"
                  }`}
                >
                  {response.latency_ms}ms
                </p>
              </div>
              <div>
                <p
                  class={`text-xs font-medium ${
                    $theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Finish Reason
                </p>
                <p
                  class={`text-xs font-mono ${
                    $theme === "dark" ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  {response.finish_reason || "unknown"}
                </p>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {:else}
      <div class="flex items-center justify-center h-32">
        <p
          class={`text-xs italic text-center ${
            $theme === "dark" ? "text-slate-500" : "text-slate-500"
          }`}
        >
          {showResearch
            ? "Enter a research query in the Research tab"
            : "Run a prompt in the Prompt column to see model output here."}
        </p>
      </div>
    {/if}
  </div>
</section>
