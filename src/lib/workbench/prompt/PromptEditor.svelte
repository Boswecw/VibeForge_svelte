<script lang="ts">
  /**
   * PromptEditor component - Main prompt editing with Monaco editor
   * Supports template variables, token estimation, auto-save, and cost estimation
   */

  import { onMount } from "svelte";
  import { promptStore } from "$lib/core/stores";
  import { versionStore } from "$lib/stores/versions";
  import { presets } from "$lib/stores/presets";
  import {
    estimationStore,
    totalCost,
    totalTokens,
  } from "$lib/stores/estimation";
  import MonacoEditor from "$lib/ui/primitives/MonacoEditor.svelte";

  const text = $derived(promptStore.text);
  const estimatedTokens = $derived(promptStore.estimatedTokens);
  const isEmpty = $derived(promptStore.isEmpty);
  const variablePlaceholders = $derived(promptStore.variablePlaceholders);
  const allVariablesFilled = $derived(promptStore.allVariablesFilled);

  // Version control state
  const versionState = $derived($versionStore);
  const selectedPreset = $derived($presets.selectedPreset);

  // Cost estimation state
  const estimationState = $derived($estimationStore);
  const estimatedCost = $derived($totalCost);
  const estimatedTotalTokens = $derived($totalTokens);

  // Default models for estimation
  const DEFAULT_MODELS = ["gpt-4", "claude-3.5-sonnet"];

  // Placeholder text with template variable example
  const placeholderText =
    "Enter your prompt here...\n\nUse " +
    "{{variable}}" +
    " syntax for template variables\nPress Cmd+Enter to run";

  let editorInstance: any = null;

  onMount(() => {
    // Load pricing data on mount
    estimationStore.loadPricing();

    // Listen for focus-editor events
    const handleFocusEditor = () => {
      if (editorInstance) {
        editorInstance.focus();
      }
    };

    window.addEventListener("focus-editor", handleFocusEditor);

    return () => {
      window.removeEventListener("focus-editor", handleFocusEditor);
    };
  });

  function handleChange(newValue: string) {
    promptStore.setText(newValue);

    // Schedule auto-save if we have a selected preset
    if (selectedPreset?.id) {
      versionStore.scheduleAutoSave(selectedPreset.id, newValue);
    }

    // Schedule cost estimation
    if (newValue.trim()) {
      estimationStore.scheduleEstimate(newValue, DEFAULT_MODELS);
    }
  }

  function handleRunShortcut() {
    // Dispatch custom event for parent to handle
    const runEvent = new CustomEvent("run-prompt", { bubbles: true });
    window.dispatchEvent(runEvent);
  }

  function handleManualSave() {
    if (selectedPreset?.id) {
      versionStore.saveVersion(selectedPreset.id, text, false, "Manual save");
    }
  }
</script>

<svelte:window
  onkeydown={(e) => {
    // Cmd+S or Ctrl+S for manual save
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleManualSave();
    }
  }}
/>

<div class="prompt-editor flex-1 flex flex-col">
  <!-- Template Variables Info (if any) -->
  {#if variablePlaceholders.length > 0}
    <div class="px-4 py-2 bg-forge-gunmetal border-b border-slate-800">
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-400">Variables:</span>
        <div class="flex flex-wrap items-center gap-1.5">
          {#each variablePlaceholders as variable}
            <span
              class="inline-flex items-center px-2.5 py-1 text-sm font-medium rounded-md border {allVariablesFilled
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}"
            >
              {variable}
            </span>
          {/each}
        </div>
        {#if !allVariablesFilled}
          <span class="text-xs text-amber-400"
            >• Some variables need values</span
          >
        {/if}
      </div>
    </div>
  {/if}

  <!-- Textarea -->
  <div class="flex-1 min-h-0">
    <MonacoEditor
      value={text}
      language="markdown"
      placeholder={placeholderText}
      onChange={handleChange}
      onRunShortcut={handleRunShortcut}
      onEditorMount={(editor) => {
        editorInstance = editor;
      }}
      class="h-full"
    />
  </div>
  <!-- Footer with stats -->
  <div
    class="px-4 py-2 bg-forge-gunmetal border-t border-slate-800 flex items-center justify-between"
  >
    <div class="flex items-center gap-4 text-xs text-slate-400">
      <!-- Token count -->
      {#if estimatedTotalTokens > 0}
        <span class="flex items-center gap-1">
          <svg
            class="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
            />
          </svg>
          {estimatedTotalTokens} tokens
        </span>
      {:else}
        <span>~{estimatedTokens} tokens</span>
      {/if}

      <!-- Cost estimate -->
      {#if estimatedCost > 0}
        <span class="flex items-center gap-1 text-emerald-400">
          <svg
            class="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          ${estimatedCost.toFixed(4)}
        </span>
      {/if}

      {#if isEmpty}
        <span class="text-slate-500">Empty prompt</span>
      {/if}

      <!-- Save status -->
      {#if versionState.isSaving}
        <span class="text-blue-400">Saving...</span>
      {:else if versionState.hasUnsavedChanges}
        <span class="text-amber-400">Unsaved changes</span>
      {:else if versionState.lastSaveTime}
        <span class="text-emerald-400">Saved</span>
      {/if}
    </div>

    <div class="text-xs text-slate-500 flex items-center gap-3">
      <span>
        <kbd class="px-1.5 py-0.5 bg-forge-steel rounded text-slate-400">⌘</kbd>
        +
        <kbd class="px-1.5 py-0.5 bg-forge-steel rounded text-slate-400">S</kbd>
        to save
      </span>
      <span>
        <kbd class="px-1.5 py-0.5 bg-forge-steel rounded text-slate-400">⌘</kbd>
        +
        <kbd class="px-1.5 py-0.5 bg-forge-steel rounded text-slate-400"
          >Enter</kbd
        >
        to run
      </span>
    </div>
  </div>
</div>
