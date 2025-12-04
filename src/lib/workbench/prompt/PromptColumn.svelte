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
  import { neuroforgeClient, dataforgeClient } from "$lib/core/api";
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

    // Start execution
    runsStore.startExecution();

    try {
      // Execute prompt with selected models
      const response = await neuroforgeClient.executePrompt({
        workspaceId: "vibeforge_workspace", // TODO: Get from workspace context
        prompt: promptStore.resolvedPrompt,
        contextBlocks: contextBlocksStore.activeBlocks.map((b) => b.id),
        modelIds: modelsStore.selectedModels.map((m) => m.id),
      });

      // Extract runs from API response
      const runs = response.data || [];

      // Add runs to store
      for (const run of runs) {
        runsStore.addRun(run);
      }

      // Set the first run as active
      if (runs.length > 0) {
        runsStore.setActiveRun(runs[0].id);
      }

      // Log to DataForge asynchronously (don't block UI)
      dataforgeClient
        .logRun({
          userId: "default_user", // TODO: Get from auth context
          workspaceId: "vibeforge_workspace", // TODO: Get from workspace context
          promptText: promptStore.resolvedPrompt,
          contextBlocks: contextBlocksStore.activeBlocks.map((b) => b.id),
          models: runs.map((run) => ({
            modelId: run.modelId,
            responseText: run.output,
            tokensUsed: run.tokenCount || 0,
            latencyMs: run.latency || 0,
            error: run.error,
          })),
        })
        .catch((err) => {
          console.warn("Failed to log run to DataForge:", err);
        });

      runsStore.completeExecution();
    } catch (error) {
      console.error("Run failed:", error);
      runsStore.completeExecution();
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
