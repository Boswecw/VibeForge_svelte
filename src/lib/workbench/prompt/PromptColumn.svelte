<script lang="ts">
  /**
   * PromptColumn component - Main container for prompt editing
   * Center column of the 3-column workbench layout
   *
   * VF-313: Integrated AI Pattern Suggestions
   */

  import {
    promptStore,
    modelsStore,
    contextBlocksStore,
    runsStore,
    patternsStore, // VF-313
  } from "$lib/core/stores";
  import SectionHeader from "$lib/ui/primitives/SectionHeader.svelte";
  import PromptEditor from "./PromptEditor.svelte";
  import ModelSelector from "./ModelSelector.svelte";
  import PromptActions from "./PromptActions.svelte";
  import { PatternSuggestions } from "$lib/components/patterns"; // VF-313

  // VF-313: Pattern suggestions state
  let showSuggestions = $state(true);
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // VF-313: Watch prompt text changes and suggest patterns (debounced)
  $effect(() => {
    const text = promptStore.text;

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Debounce pattern suggestions (wait 500ms after user stops typing)
    if (text && text.trim().length >= 10) {
      debounceTimer = setTimeout(() => {
        patternsStore.suggestPatterns(text);
      }, 500);
    } else {
      // Clear suggestions for very short prompts
      patternsStore.clearSuggestions();
    }
  });

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

  // VF-313: Handle pattern application
  function handleApplyPattern(pattern: import("$lib/core/types").PromptPattern) {
    // Replace current prompt with pattern template
    promptStore.setText(pattern.template);

    // Hide suggestions after applying
    showSuggestions = false;

    // Focus editor
    window.dispatchEvent(new Event("focus-editor"));
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

    <!-- VF-313: Pattern Suggestions Panel (Collapsible) -->
    {#if patternsStore.currentSuggestions.length > 0 && showSuggestions}
      <div class="shrink-0 px-4 pb-2">
        <div class="bg-forge-gunmetal border border-slate-800 rounded-lg p-3">
          <PatternSuggestions
            onApply={handleApplyPattern}
            compact={true}
            maxHeight="300px"
          />
        </div>
      </div>
    {/if}

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
