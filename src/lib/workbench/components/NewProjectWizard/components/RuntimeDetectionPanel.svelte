<!--
  RuntimeDetectionPanel.svelte

  Allows users to scan an existing project directory to detect
  technology stack and get automatic pattern recommendations.
-->
<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { open } from '@tauri-apps/plugin-dialog';
  import type {
    RecommendationResult,
    RuntimeAnalysisOptions,
    PatternRecommendation
  } from '$lib/workbench/types/runtime-detection';
  import type { ArchitecturePattern } from '$lib/workbench/types/architecture';
  import { getPattern } from '$lib/data/architecture-patterns';
  import PatternCard from '../../ArchitecturePatterns/PatternCard.svelte';

  interface Props {
    onPatternSelect: (pattern: ArchitecturePattern) => void;
  }

  let { onPatternSelect }: Props = $props();

  // State
  let isAnalyzing = $state(false);
  let selectedDirectory = $state<string | null>(null);
  let analysisResult = $state<RecommendationResult | null>(null);
  let error = $state<string | null>(null);
  let isExpanded = $state(true);

  // Select directory
  async function selectDirectory() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Project Directory to Analyze'
      });

      if (selected && typeof selected === 'string') {
        selectedDirectory = selected;
        error = null;
      }
    } catch (err) {
      error = `Failed to select directory: ${err}`;
      console.error('Directory selection error:', err);
    }
  }

  // Analyze project
  async function analyzeProject() {
    if (!selectedDirectory) {
      error = 'Please select a directory first';
      return;
    }

    isAnalyzing = true;
    error = null;

    try {
      const options: RuntimeAnalysisOptions = {
        projectPath: selectedDirectory,
        maxDepth: 3,
        exclude: ['node_modules', 'target', 'dist', 'build', '.git'],
        analyzeDependencies: true,
        readPackageFiles: true
      };

      const result = await invoke<RecommendationResult>('analyze_project_runtime', { options });
      analysisResult = result;
    } catch (err) {
      error = `Analysis failed: ${err}`;
      console.error('Analysis error:', err);
    } finally {
      isAnalyzing = false;
    }
  }

  // Get pattern from recommendation
  function getPatternFromRecommendation(rec: PatternRecommendation): ArchitecturePattern | undefined {
    return getPattern(rec.patternId);
  }

  // Get confidence badge color
  function getConfidenceBadgeClass(confidence: 'high' | 'medium' | 'low'): string {
    switch (confidence) {
      case 'high': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
  }

  // Reset analysis
  function reset() {
    selectedDirectory = null;
    analysisResult = null;
    error = null;
  }
</script>

<div class="border-2 border-dashed border-gunmetal-600 rounded-lg overflow-hidden">
  <!-- Header -->
  <button
    type="button"
    onclick={() => isExpanded = !isExpanded}
    class="w-full p-4 bg-gunmetal-800/50 hover:bg-gunmetal-800 transition-colors flex items-center justify-between"
  >
    <div class="flex items-center gap-3">
      <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
      <div class="text-left">
        <div class="font-semibold text-zinc-200">
          Scan Existing Project
        </div>
        <div class="text-xs text-zinc-500 mt-0.5">
          Automatically detect technology stack and get pattern recommendations
        </div>
      </div>
    </div>
    <svg
      class="w-5 h-5 text-zinc-400 transition-transform {isExpanded ? 'rotate-180' : ''}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  <!-- Content -->
  {#if isExpanded}
    <div class="p-4 space-y-4 bg-gunmetal-900/30">
      {#if !analysisResult}
        <!-- Directory Selection -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <button
              type="button"
              onclick={selectDirectory}
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Select Directory
            </button>
            {#if selectedDirectory}
              <div class="flex-1 min-w-0">
                <div class="text-xs text-zinc-400">Selected:</div>
                <div class="text-sm text-zinc-200 truncate" title={selectedDirectory}>
                  {selectedDirectory}
                </div>
              </div>
            {/if}
          </div>

          {#if selectedDirectory}
            <button
              type="button"
              onclick={analyzeProject}
              disabled={isAnalyzing}
              class="w-full px-4 py-3 bg-ember-600 hover:bg-ember-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {#if isAnalyzing}
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Project...
              {:else}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Analyze Project
              {/if}
            </button>
          {/if}
        </div>
      {:else}
        <!-- Analysis Results -->
        <div class="space-y-4">
          <!-- Header with Reset Button -->
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold text-zinc-300">Analysis Results</h4>
            <button
              type="button"
              onclick={reset}
              class="text-xs text-zinc-400 hover:text-zinc-200 underline"
            >
              Scan Different Project
            </button>
          </div>

          <!-- Tech Stack Summary -->
          <div class="p-3 bg-gunmetal-800 border border-gunmetal-700 rounded-lg space-y-2">
            <div class="text-xs font-medium text-zinc-400 uppercase">Detected Stack</div>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span class="text-zinc-500">Language:</span>
                <span class="text-zinc-200 ml-1 font-medium">{analysisResult.techStack.primaryLanguage}</span>
              </div>
              {#if analysisResult.techStack.frontendFramework}
                <div>
                  <span class="text-zinc-500">Frontend:</span>
                  <span class="text-zinc-200 ml-1 font-medium">{analysisResult.techStack.frontendFramework}</span>
                </div>
              {/if}
              {#if analysisResult.techStack.backendFramework}
                <div>
                  <span class="text-zinc-500">Backend:</span>
                  <span class="text-zinc-200 ml-1 font-medium">{analysisResult.techStack.backendFramework}</span>
                </div>
              {/if}
              {#if analysisResult.techStack.databases.length > 0}
                <div>
                  <span class="text-zinc-500">Database:</span>
                  <span class="text-zinc-200 ml-1 font-medium">{analysisResult.techStack.databases.join(', ')}</span>
                </div>
              {/if}
            </div>
            <div class="flex items-center gap-2 pt-2 border-t border-gunmetal-700">
              <span class="text-xs text-zinc-500">Confidence:</span>
              <div class="flex-1 bg-gunmetal-900 rounded-full h-2">
                <div
                  class="bg-blue-500 h-2 rounded-full transition-all"
                  style="width: {analysisResult.techStack.confidence}%"
                ></div>
              </div>
              <span class="text-xs text-zinc-300 font-medium">{analysisResult.techStack.confidence}%</span>
            </div>
          </div>

          <!-- Pattern Recommendations -->
          {#if analysisResult.recommendations.length > 0}
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-ember-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h4 class="text-sm font-semibold text-zinc-300">
                  Recommended Patterns ({analysisResult.recommendations.length})
                </h4>
              </div>

              <div class="space-y-3">
                {#each analysisResult.recommendations as rec (rec.patternId)}
                  {@const pattern = getPatternFromRecommendation(rec)}
                  {#if pattern}
                    <div class="border border-gunmetal-700 rounded-lg overflow-hidden">
                      <!-- Pattern Card -->
                      <PatternCard
                        {pattern}
                        selected={false}
                        onClick={() => onPatternSelect(pattern)}
                      />

                      <!-- Recommendation Details -->
                      <div class="p-3 bg-gunmetal-800/50 border-t border-gunmetal-700 space-y-2">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <span class="text-xs text-zinc-500">Match Score:</span>
                            <span class="text-sm font-bold text-ember-400">{rec.score}/100</span>
                          </div>
                          <span class="px-2 py-0.5 text-xs font-medium rounded border {getConfidenceBadgeClass(rec.confidence)}">
                            {rec.confidence} confidence
                          </span>
                        </div>

                        {#if rec.reasons.length > 0}
                          <div class="space-y-1">
                            <div class="text-xs font-medium text-zinc-400">Why this pattern?</div>
                            <ul class="space-y-0.5">
                              {#each rec.reasons as reason}
                                <li class="text-xs text-zinc-300 flex items-start gap-1">
                                  <svg class="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                  </svg>
                                  <span>{reason}</span>
                                </li>
                              {/each}
                            </ul>
                          </div>
                        {/if}

                        {#if rec.warnings.length > 0}
                          <div class="space-y-1">
                            <div class="text-xs font-medium text-yellow-400">Considerations:</div>
                            <ul class="space-y-0.5">
                              {#each rec.warnings as warning}
                                <li class="text-xs text-yellow-300/80 flex items-start gap-1">
                                  <svg class="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                                  </svg>
                                  <span>{warning}</span>
                                </li>
                              {/each}
                            </ul>
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {:else}
            <div class="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div class="flex items-start gap-2">
                <svg class="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <div class="text-sm text-yellow-200">
                  No pattern recommendations found. The detected technology stack doesn't match any available patterns. Try browsing patterns manually below.
                </div>
              </div>
            </div>
          {/if}

          <!-- Metadata -->
          <div class="text-xs text-zinc-500 flex items-center justify-between pt-2 border-t border-gunmetal-700">
            <span>Scanned {analysisResult.metadata.filesScanned} files</span>
            <span>Analysis took {analysisResult.metadata.duration}ms</span>
          </div>
        </div>
      {/if}

      <!-- Error Display -->
      {#if error}
        <div class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div class="flex items-start gap-2">
            <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <div class="text-sm text-red-200">{error}</div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
