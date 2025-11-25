<script lang="ts">
  import StackSelector from "$lib/components/stacks/StackSelector.svelte";
  import LanguageSelector from "$lib/components/languages/LanguageSelector.svelte";
  import type { StackProfile } from "$lib/data/stack-profiles";

  let selectedStack: StackProfile | null = null;
  let selectedLanguages: string[] = [];
  let currentView: "stacks" | "languages" | "both" = "both";
</script>

<svelte:head>
  <title>Component Demo - VibeForge</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-2">
        VibeForge Component Demo
      </h1>
      <p class="text-lg text-gray-600">
        Interactive showcase of stack profile and language selector components
      </p>
    </div>

    <!-- View selector -->
    <div class="mb-6 flex gap-2">
      <button
        class="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        class:bg-indigo-600={currentView === "both"}
        class:text-white={currentView === "both"}
        class:bg-gray-200={currentView !== "both"}
        class:text-gray-700={currentView !== "both"}
        on:click={() => (currentView = "both")}
      >
        Both Components
      </button>
      <button
        class="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        class:bg-indigo-600={currentView === "stacks"}
        class:text-white={currentView === "stacks"}
        class:bg-gray-200={currentView !== "stacks"}
        class:text-gray-700={currentView !== "stacks"}
        on:click={() => (currentView = "stacks")}
      >
        Stack Selector Only
      </button>
      <button
        class="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        class:bg-indigo-600={currentView === "languages"}
        class:text-white={currentView === "languages"}
        class:bg-gray-200={currentView !== "languages"}
        class:text-gray-700={currentView !== "languages"}
        on:click={() => (currentView = "languages")}
      >
        Language Selector Only
      </button>
    </div>

    <!-- Components -->
    <div class="space-y-8">
      <!-- Language Selector -->
      {#if currentView === "languages" || currentView === "both"}
        <section class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            Language Selector
          </h2>
          <p class="text-gray-600 mb-6">
            Select programming languages with category tabs, visual cards, and
            smart recommendations
          </p>
          <LanguageSelector
            bind:selectedLanguages
            projectType="web"
            onChange={(langs) => {
              console.log("Selected languages:", langs);
            }}
          />
        </section>
      {/if}

      <!-- Stack Selector -->
      {#if currentView === "stacks" || currentView === "both"}
        <section class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Stack Selector</h2>
          <p class="text-gray-600 mb-6">
            Browse, filter, search, and compare technology stacks with
            intelligent recommendations
          </p>
          <StackSelector
            multiSelect={true}
            onSelect={(stack) => {
              selectedStack = stack;
              console.log("Selected stack:", stack);
            }}
          />
        </section>
      {/if}

      <!-- Integration Demo -->
      {#if currentView === "both"}
        <section
          class="bg-linear-to-r from-indigo-50 to-purple-50 rounded-lg shadow-md p-6"
        >
          <h2 class="text-2xl font-bold text-gray-900 mb-4">
            🔗 Integration Demo
          </h2>
          <p class="text-gray-600 mb-6">
            See how components work together in the Project Creation Wizard
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Selected Languages -->
            <div class="bg-white rounded-lg p-4 border-2 border-indigo-200">
              <h3 class="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span class="text-xl">📘</span>
                Selected Languages ({selectedLanguages.length})
              </h3>
              {#if selectedLanguages.length > 0}
                <ul class="space-y-2">
                  {#each selectedLanguages as langId}
                    <li class="flex items-center gap-2 text-sm">
                      <span class="w-2 h-2 bg-indigo-500 rounded-full" />
                      <code class="text-indigo-600 font-mono">{langId}</code>
                    </li>
                  {/each}
                </ul>
              {:else}
                <p class="text-sm text-gray-500 italic">
                  No languages selected
                </p>
              {/if}
            </div>

            <!-- Selected Stack -->
            <div class="bg-white rounded-lg p-4 border-2 border-purple-200">
              <h3 class="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span class="text-xl">📦</span>
                Selected Stack
              </h3>
              {#if selectedStack}
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl">{selectedStack.icon}</span>
                    <span class="font-bold">{selectedStack.name}</span>
                  </div>
                  <p class="text-sm text-gray-600">
                    {selectedStack.description}
                  </p>
                  <div class="flex flex-wrap gap-1 mt-2">
                    <span
                      class="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded"
                    >
                      {selectedStack.category}
                    </span>
                    <span
                      class="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded"
                    >
                      {selectedStack.complexity}
                    </span>
                  </div>
                </div>
              {:else}
                <p class="text-sm text-gray-500 italic">No stack selected</p>
              {/if}
            </div>
          </div>

          <!-- Next Steps -->
          <div class="mt-6 p-4 bg-white rounded-lg border-2 border-green-200">
            <h4 class="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>✅</span>
              Ready for Project Creation
            </h4>
            <p class="text-sm text-gray-600 mb-3">
              With both languages and stack selected, the wizard can now:
            </p>
            <ul class="text-sm text-gray-700 space-y-1">
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-0.5">•</span>
                <span>Generate optimized project scaffolding</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-0.5">•</span>
                <span>Configure language-specific tooling and dependencies</span
                >
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-0.5">•</span>
                <span>Set up development environment and build scripts</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-0.5">•</span>
                <span>Provide context-aware AI assistance</span>
              </li>
            </ul>
          </div>
        </section>
      {/if}
    </div>

    <!-- Footer -->
    <div class="mt-12 text-center text-sm text-gray-500">
      <p class="mb-2">VibeForge Automation System • Phase 1 Complete</p>
      <p>
        <a href="/docs" class="text-indigo-600 hover:text-indigo-800"
          >Documentation</a
        >
        <span class="mx-2">•</span>
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          class="text-indigo-600 hover:text-indigo-800">API Docs</a
        >
      </p>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
