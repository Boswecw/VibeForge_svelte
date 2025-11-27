<script lang="ts">
  /**
   * Workbench Page - Main 3-column layout
   * Context | Prompt | Output
   */

  import ContextColumn from "$lib/workbench/context/ContextColumn.svelte";
  import PromptColumn from "$lib/workbench/prompt/PromptColumn.svelte";
  import OutputColumn from "$lib/workbench/output/OutputColumn.svelte";
  import { AnalysisDrawer } from "$lib/workbench/analysis";
</script>

<svelte:head>
  <title>Workbench - VibeForge</title>
</svelte:head>

<div
  class="workbench-page flex flex-col flex-1 overflow-hidden bg-forge-blacksteel w-full h-full"
>
  <!-- Main 3-column layout -->
  <div class="flex flex-1 overflow-hidden">
    <!-- Context Column (Left) -->
    <div
      class="context-column w-[350px] border-r border-slate-800 flex flex-col overflow-hidden bg-forge-gunmetal"
    >
      <ContextColumn />
    </div>

    <!-- Prompt Column (Center) -->
    <div
      class="prompt-column flex-1 border-r border-slate-800 flex flex-col overflow-hidden"
    >
      <PromptColumn />
    </div>

    <!-- Output Column (Right) -->
    <div
      class="output-column w-[350px] flex flex-col overflow-hidden bg-forge-gunmetal"
    >
      <OutputColumn />
    </div>
  </div>

  <!-- Analysis Drawer (Bottom) -->
  <AnalysisDrawer />
</div>
