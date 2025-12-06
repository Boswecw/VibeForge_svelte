<script lang="ts">
  /**
   * PromptColumn component - Main container for prompt editing
   * Center column of the 3-column workbench layout
   */

  import {
    promptStore,
    modelsStore,
    contextBlocksStore,
    runsStore,
  } from "$lib/core/stores";
  import SectionHeader from "$lib/ui/primitives/SectionHeader.svelte";
  import PromptEditor from "./PromptEditor.svelte";
  import ModelSelector from "./ModelSelector.svelte";
  import PromptActions from "./PromptActions.svelte";

  async function handleRun() {
    if (modelsStore.selectedModels.length === 0) {
      alert("Please select at least one model");
      return;
    }

    if (!promptStore.resolvedPrompt) {
      alert("Please enter a prompt");
      return;
    }

    try {
      // Execute with the new execution engine
      const results = await runsStore.executeFromStores(
        promptStore.resolvedPrompt,
        modelsStore.selectedModels,
        contextBlocksStore.activeBlocks,
        promptStore.variables,
        {
          stream: true,
          parallel: true,
          maxTokens: 4096,
          temperature: 0.7,
        }
      );

      console.log(`✅ Executed ${results.length} model(s) successfully`);

      // TODO: Log to DataForge asynchronously when API client is ready
    } catch (error) {
      console.error("Run failed:", error);
      runsStore.setError(
        error instanceof Error ? error.message : "Unknown error"
      );
      alert(
        `Run failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
</script>

<div class="prompt-column flex flex-col h-full bg-forge-blacksteel">
  <!-- Column Header -->
  <div class="shrink-0 p-4 border-b border-slate-800">
    <SectionHeader
      title="Prompt"
      description="Compose and execute your prompts"
      level={2}
    />
  </div>

  <!-- Scrollable Content Area -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Model Selector (Collapsible) -->
    <div class="shrink-0 p-4">
      <ModelSelector />
    </div>

    <!-- Prompt Editor (Takes remaining space) -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <PromptEditor />
    </div>

    <!-- Actions Bar -->
    <div class="shrink-0">
      <PromptActions onrun={handleRun} />
    </div>
  </div>
</div>
