<script lang="ts">
  /**
   * VersionDiff - Side-by-side diff viewer for comparing versions
   */

  import { onMount } from "svelte";
  import * as monaco from "monaco-editor";
  import { versionStore } from "$lib/stores/versions";

  interface Props {
    class?: string;
  }

  let { class: className = "" }: Props = $props();

  let containerRef: HTMLDivElement | null = $state(null);
  let diffEditor: monaco.editor.IStandaloneDiffEditor | null = $state(null);
  let viewMode: "side-by-side" | "inline" = $state("side-by-side");

  const versionState = $derived($versionStore);
  const compareResult = $derived(versionState.compareResult);

  function toggleViewMode() {
    viewMode = viewMode === "side-by-side" ? "inline" : "side-by-side";
    if (diffEditor) {
      diffEditor.updateOptions({
        renderSideBySide: viewMode === "side-by-side",
      });
    }
  }

  function handleNavigateNext() {
    if (diffEditor) {
      const navigation = diffEditor.getLineChanges();
      // Monaco provides navigation through actions
      diffEditor
        .getModifiedEditor()
        .getAction("editor.action.diffReview.next")
        ?.run();
    }
  }

  function handleNavigatePrev() {
    if (diffEditor) {
      diffEditor
        .getModifiedEditor()
        .getAction("editor.action.diffReview.prev")
        ?.run();
    }
  }

  onMount(() => {
    if (!containerRef) return;

    // Configure custom diff theme
    monaco.editor.defineTheme("vibeforge-diff", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955" },
        { token: "keyword", foreground: "569CD6" },
        { token: "string", foreground: "CE9178" },
      ],
      colors: {
        "editor.background": "#0b0f17",
        "editor.foreground": "#f8fafc",
        "diffEditor.insertedTextBackground": "#22c55e20",
        "diffEditor.removedTextBackground": "#ef444420",
        "diffEditor.insertedLineBackground": "#22c55e15",
        "diffEditor.removedLineBackground": "#ef444415",
        "diffEditor.diagonalFill": "#1e293b80",
        "editorLineNumber.foreground": "#64748b",
        "editorGutter.background": "#0f172a",
      },
    });

    // Initialize diff editor with enhanced options
    diffEditor = monaco.editor.createDiffEditor(containerRef, {
      theme: "vibeforge-diff",
      automaticLayout: true,
      renderSideBySide: true,
      readOnly: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 13,
      lineHeight: 20,
      padding: { top: 12, bottom: 12 },
      // Enhanced diff options
      renderIndicators: true,
      renderMarginRevertIcon: true,
      ignoreTrimWhitespace: false,
      diffWordWrap: "on",
      maxComputationTime: 5000,
      // Show inline changes within lines
      diffAlgorithm: "advanced",
    });

    return () => {
      diffEditor?.dispose();
    };
  });

  // Update diff editor when comparison result changes
  $effect(() => {
    if (diffEditor && compareResult) {
      const originalModel = monaco.editor.createModel(
        compareResult.fromContent,
        "markdown"
      );
      const modifiedModel = monaco.editor.createModel(
        compareResult.toContent,
        "markdown"
      );

      diffEditor.setModel({
        original: originalModel,
        modified: modifiedModel,
      });
    }
  });
</script>

<div class="version-diff flex flex-col h-full {className}">
  {#if compareResult}
    <!-- Diff Header -->
    <div class="px-4 py-3 bg-forge-steel border-b border-slate-700">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <div class="text-xs text-slate-400">Comparing versions:</div>
          <div class="flex items-center gap-1.5">
            <span class="text-sm font-medium text-slate-200">
              v{compareResult.fromVersion.versionNumber}
            </span>
            {#if compareResult.fromVersion.autoSaved}
              <span
                class="px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-300 rounded"
                >AUTO</span
              >
            {/if}
          </div>
          <svg
            class="w-4 h-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          <div class="flex items-center gap-1.5">
            <span class="text-sm font-medium text-slate-200">
              v{compareResult.toVersion.versionNumber}
            </span>
            {#if compareResult.toVersion.autoSaved}
              <span
                class="px-1.5 py-0.5 text-[10px] bg-blue-500/20 text-blue-300 rounded"
                >AUTO</span
              >
            {/if}
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- View Mode Toggle -->
          <div
            class="flex items-center gap-1 bg-forge-gunmetal rounded border border-slate-700"
          >
            <button
              class="px-2 py-1 text-xs transition-colors rounded-l {viewMode ===
              'side-by-side'
                ? 'bg-forge-ember text-slate-900'
                : 'text-slate-400 hover:text-slate-200'}"
              onclick={() => {
                if (viewMode !== "side-by-side") toggleViewMode();
              }}
              title="Side-by-side view"
            >
              Split
            </button>
            <button
              class="px-2 py-1 text-xs transition-colors rounded-r {viewMode ===
              'inline'
                ? 'bg-forge-ember text-slate-900'
                : 'text-slate-400 hover:text-slate-200'}"
              onclick={() => {
                if (viewMode !== "inline") toggleViewMode();
              }}
              title="Unified inline view"
            >
              Unified
            </button>
          </div>

          <!-- Navigation Controls -->
          <div class="flex items-center gap-1 border border-slate-700 rounded">
            <button
              class="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors rounded-l"
              onclick={handleNavigatePrev}
              title="Previous change"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>
            <button
              class="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors rounded-r"
              onclick={handleNavigateNext}
              title="Next change"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          <button
            class="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
            onclick={() => versionStore.clearComparison()}
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Close
          </button>
        </div>
      </div>

      <!-- Version Timestamps -->
      <div class="flex items-center gap-6 mb-2 text-xs text-slate-500">
        <div class="flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clip-rule="evenodd"
            />
          </svg>
          <span
            >{new Date(
              compareResult.fromVersion.createdAt
            ).toLocaleString()}</span
          >
        </div>
        <div class="flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clip-rule="evenodd"
            />
          </svg>
          <span
            >{new Date(
              compareResult.toVersion.createdAt
            ).toLocaleString()}</span
          >
        </div>
      </div>

      <!-- Diff Stats with Visual Indicators -->
      <div class="flex items-center gap-3">
        {#if compareResult.diff.addedLines > 0}
          <div
            class="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded"
          >
            <svg
              class="w-3.5 h-3.5 text-emerald-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-xs font-medium text-emerald-400">
              {compareResult.diff.addedLines} line{compareResult.diff
                .addedLines !== 1
                ? "s"
                : ""}
            </span>
          </div>
        {/if}
        {#if compareResult.diff.removedLines > 0}
          <div
            class="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded"
          >
            <svg
              class="w-3.5 h-3.5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-xs font-medium text-red-400">
              {compareResult.diff.removedLines} line{compareResult.diff
                .removedLines !== 1
                ? "s"
                : ""}
            </span>
          </div>
        {/if}
        {#if compareResult.diff.changedChars > 0}
          <div
            class="flex items-center gap-1.5 px-2 py-1 bg-slate-700/50 rounded"
          >
            <svg
              class="w-3.5 h-3.5 text-slate-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
              />
            </svg>
            <span class="text-xs font-medium text-slate-400">
              {compareResult.diff.changedChars} char{compareResult.diff
                .changedChars !== 1
                ? "s"
                : ""}
            </span>
          </div>
        {/if}
        {#if compareResult.diff.addedLines === 0 && compareResult.diff.removedLines === 0}
          <div
            class="flex items-center gap-1.5 px-2 py-1 bg-slate-700/50 rounded"
          >
            <svg
              class="w-3.5 h-3.5 text-slate-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-xs font-medium text-slate-400"
              >No line changes</span
            >
          </div>
        {/if}
      </div>
    </div>

    <!-- Monaco Diff Editor -->
    <div class="flex-1 min-h-0" bind:this={containerRef} />
  {:else}
    <!-- Empty State -->
    <div class="flex-1 flex items-center justify-center p-6">
      <div class="text-center">
        <div class="text-sm text-slate-400 mb-2">No comparison selected</div>
        <div class="text-xs text-slate-500">
          Select two versions to compare from the history panel
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .version-diff {
    background-color: var(--forge-gunmetal);
  }
</style>
