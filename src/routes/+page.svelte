<script lang="ts">
  /**
   * Workbench Page - Main 3-column layout
   * Context | Prompt | Output
   */

  import ContextColumn from "$lib/workbench/context/ContextColumn.svelte";
  import PromptColumn from "$lib/workbench/prompt/PromptColumn.svelte";
  import OutputColumn from "$lib/workbench/output/OutputColumn.svelte";
  import WizardOverlay from "$lib/components/wizard/WizardOverlay.svelte";

  let wizardVisible = false;

  function openWizard() {
    wizardVisible = true;
  }

  function closeWizard() {
    wizardVisible = false;
  }
</script>

<svelte:head>
  <title>Workbench - VibeForge</title>
</svelte:head>

<!-- Floating Action Button for Wizard -->
<button
  class="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105"
  on:click={openWizard}
>
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </svg>
  <span class="font-semibold">New Project</span>
</button>

<div
  class="workbench-page flex flex-1 overflow-hidden bg-forge-blacksteel w-full h-full"
>
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

<!-- Wizard Overlay -->
<WizardOverlay bind:visible={wizardVisible} on:close={closeWizard} />
