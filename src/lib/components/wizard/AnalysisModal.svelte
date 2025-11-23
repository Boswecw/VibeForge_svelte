<!-- @component
Code Analysis Modal - Analyze existing projects and import configuration
-->
<script lang="ts">
  import { onDestroy } from "svelte";
  import { codeAnalyzerService } from "$lib/services/codeAnalyzer";
  import { wizardStore } from "$lib/stores/wizard";
  import type { AnalysisResult, ProjectProfile } from "$lib/services/codeAnalyzer";

  export let isOpen = false;

  let analysisState: "idle" | "analyzing" | "complete" | "error" = "idle";
  let analysisResult: AnalysisResult | null = null;
  let profile: ProjectProfile | null = null;
  let errorMessage = "";
  let progressPercent = 0;
  let statusMessage = "Initializing...";

  // Progress simulation during analysis
  let progressInterval: ReturnType<typeof setInterval> | null = null;

  function close() {
    isOpen = false;
    resetState();
  }

  function resetState() {
    analysisState = "idle";
    analysisResult = null;
    profile = null;
    errorMessage = "";
    progressPercent = 0;
    statusMessage = "Initializing...";
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }

  async function startAnalysis() {
    analysisState = "analyzing";
    progressPercent = 0;
    statusMessage = "Scanning project directory...";

    // Start progress simulation
    progressInterval = setInterval(() => {
      if (progressPercent < 90) {
        progressPercent += Math.random() * 10;
        if (progressPercent > 90) progressPercent = 90;

        // Update status messages
        if (progressPercent < 20) {
          statusMessage = "Scanning project directory...";
        } else if (progressPercent < 40) {
          statusMessage = "Detecting languages and frameworks...";
        } else if (progressPercent < 60) {
          statusMessage = "Parsing configuration files...";
        } else if (progressPercent < 80) {
          statusMessage = "Analyzing dependencies...";
        } else {
          statusMessage = "Matching to VibeForge stacks...";
        }
      }
    }, 300);

    try {
      const result = await codeAnalyzerService.analyzeProject();
      
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      progressPercent = 100;
      analysisResult = result;

      if (result.success && result.profile) {
        profile = result.profile;
        analysisState = "complete";
        statusMessage = "Analysis complete!";
      } else {
        analysisState = "error";
        errorMessage = result.error || "Analysis failed";
      }
    } catch (error) {
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      analysisState = "error";
      errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Analysis error:", error);
    }
  }

  function importToWizard() {
    if (!profile) return;

    try {
      const wizardState = codeAnalyzerService.profileToWizardState(profile);
      wizardStore.update((state) => ({
        ...state,
        ...wizardState,
      }));

      close();
    } catch (error) {
      console.error("Failed to import:", error);
      errorMessage = "Failed to import configuration";
    }
  }

  function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  }

  function getConfidenceBadge(confidence: number): string {
    if (confidence >= 0.8) return "🟢";
    if (confidence >= 0.6) return "🟡";
    return "🔴";
  }

  onDestroy(() => {
    if (progressInterval) {
      clearInterval(progressInterval);
    }
  });
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onclick={close}
    role="button"
    tabindex="-1"
    onkeydown={(e) => e.key === "Escape" && close()}
  >
    <!-- Modal -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          {#if analysisState === "idle"}
            📁 Analyze Existing Project
          {:else if analysisState === "analyzing"}
            ⚙️ Analyzing Project...
          {:else if analysisState === "complete"}
            ✅ Analysis Complete
          {:else}
            ❌ Analysis Failed
          {/if}
        </h2>
        <button
          onclick={close}
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
        {#if analysisState === "idle"}
          <!-- Initial State -->
          <div class="text-center py-8">
            <div class="mb-6">
              <svg class="w-20 h-20 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              Analyze Your Existing Project
            </h3>
            <p class="text-gray-600 dark:text-gray-300 mb-6 max-w-lg mx-auto">
              Select a project folder and we'll automatically detect:
            </p>
            <ul class="text-left max-w-md mx-auto space-y-2 mb-8">
              <li class="flex items-start">
                <span class="text-green-500 mr-2">✓</span>
                <span class="text-gray-700 dark:text-gray-300">Languages and frameworks used</span>
              </li>
              <li class="flex items-start">
                <span class="text-green-500 mr-2">✓</span>
                <span class="text-gray-700 dark:text-gray-300">Database and authentication setup</span>
              </li>
              <li class="flex items-start">
                <span class="text-green-500 mr-2">✓</span>
                <span class="text-gray-700 dark:text-gray-300">Project structure and dependencies</span>
              </li>
              <li class="flex items-start">
                <span class="text-green-500 mr-2">✓</span>
                <span class="text-gray-700 dark:text-gray-300">Matching VibeForge stack profiles</span>
              </li>
            </ul>
            <button
              onclick={startAnalysis}
              class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              📂 Select Project Folder
            </button>
          </div>

        {:else if analysisState === "analyzing"}
          <!-- Analyzing State -->
          <div class="py-8">
            <div class="mb-6">
              <div class="relative w-32 h-32 mx-auto">
                <svg class="animate-spin w-full h-full text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>

            <div class="max-w-md mx-auto">
              <div class="mb-4">
                <div class="flex justify-between text-sm mb-2">
                  <span class="text-gray-600 dark:text-gray-300">{statusMessage}</span>
                  <span class="text-gray-600 dark:text-gray-300">{Math.round(progressPercent)}%</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    class="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style="width: {progressPercent}%"
                  ></div>
                </div>
              </div>

              {#if analysisResult}
                <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                  Scanned {analysisResult.filesScanned} files in {analysisResult.analysisTimeMs}ms
                </p>
              {/if}
            </div>
          </div>

        {:else if analysisState === "complete" && profile}
          <!-- Complete State -->
          <div class="space-y-6">
            <!-- Summary Header -->
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                📁 {profile.projectName}
              </h3>
              <p class="text-sm text-green-700 dark:text-green-300">
                Scanned {analysisResult!.filesScanned} files in {analysisResult!.analysisTimeMs}ms
              </p>
            </div>

            <!-- Languages -->
            {#if profile.languages.length > 0}
              <div>
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Languages Detected</h4>
                <div class="space-y-2">
                  {#each profile.languages.slice(0, 5) as lang}
                    <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded p-3">
                      <div class="flex items-center gap-3">
                        <span class="text-2xl">{getConfidenceBadge(lang.confidence)}</span>
                        <div>
                          <div class="font-medium text-gray-900 dark:text-white">{lang.name}</div>
                          <div class="text-sm text-gray-500 dark:text-gray-400">
                            {lang.files.length} files • {lang.lineCount.toLocaleString()} lines
                          </div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class={`text-sm font-semibold ${getConfidenceColor(lang.confidence)}`}>
                          {Math.round(lang.confidence * 100)}%
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Frameworks -->
            {#if profile.frameworks.length > 0}
              <div>
                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Frameworks & Tools</h4>
                <div class="grid grid-cols-2 gap-2">
                  {#each profile.frameworks.slice(0, 6) as framework}
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                      <div class="flex items-center justify-between mb-1">
                        <span class="font-medium text-blue-900 dark:text-blue-100">{framework.name}</span>
                        <span class="text-xs">{getConfidenceBadge(framework.confidence)}</span>
                      </div>
                      {#if framework.version}
                        <div class="text-xs text-blue-700 dark:text-blue-300">v{framework.version}</div>
                      {/if}
                      <div class="text-xs text-blue-600 dark:text-blue-400 mt-1 capitalize">
                        {framework.category}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Infrastructure -->
            <div class="grid grid-cols-2 gap-4">
              {#if profile.database}
                <div class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded p-3">
                  <h5 class="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">Database</h5>
                  <div class="flex items-center justify-between">
                    <span class="text-purple-700 dark:text-purple-300 font-medium">{profile.database.type}</span>
                    <span class="text-xs">{getConfidenceBadge(profile.database.confidence)}</span>
                  </div>
                </div>
              {/if}

              {#if profile.authentication}
                <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded p-3">
                  <h5 class="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-2">Authentication</h5>
                  <div class="flex items-center justify-between">
                    <span class="text-orange-700 dark:text-orange-300 font-medium uppercase">{profile.authentication.method}</span>
                    <span class="text-xs">{getConfidenceBadge(profile.authentication.confidence)}</span>
                  </div>
                </div>
              {/if}
            </div>

            <!-- Project Type -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded p-4">
              <h5 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Project Type</h5>
              <div class="flex gap-2 flex-wrap">
                {#if profile.hasFrontend}
                  <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">Frontend</span>
                {/if}
                {#if profile.hasBackend}
                  <span class="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">Backend</span>
                {/if}
                {#if profile.hasMobile}
                  <span class="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">Mobile</span>
                {/if}
                {#if profile.hasTests}
                  <span class="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded">Testing</span>
                {/if}
                {#if profile.hasDocker}
                  <span class="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded">Docker</span>
                {/if}
                {#if profile.hasCI}
                  <span class="px-2 py-1 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 text-xs rounded">CI/CD</span>
                {/if}
              </div>
            </div>

            <!-- Suggested Stack -->
            {#if profile.suggestedStackId}
              <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h5 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Suggested VibeForge Stack</h5>
                <div class="flex items-center justify-between">
                  <span class="text-lg font-bold text-blue-900 dark:text-blue-100">{profile.suggestedStackId}</span>
                  {#if profile.stackMatchConfidence}
                    <span class={`text-sm font-semibold ${getConfidenceColor(profile.stackMatchConfidence)}`}>
                      {Math.round(profile.stackMatchConfidence * 100)}% match
                    </span>
                  {/if}
                </div>
              </div>
            {/if}
          </div>

        {:else if analysisState === "error"}
          <!-- Error State -->
          <div class="text-center py-8">
            <div class="mb-6">
              <svg class="w-20 h-20 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Analysis Failed</h3>
            <p class="text-red-600 dark:text-red-400 mb-6">{errorMessage}</p>
            <button
              onclick={resetState}
              class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        <button
          onclick={close}
          class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
        {#if analysisState === "complete" && profile}
          <button
            onclick={importToWizard}
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            ✨ Import to Wizard
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
