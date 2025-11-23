<!-- @component
no description yet
-->
<script lang="ts">
  import { onMount } from "svelte";
  import StackSelector from "$lib/components/stacks/StackSelector.svelte";
  import StackComparison from "$lib/components/stacks/StackComparison.svelte";
  import { wizardStore, isStep3Valid } from "$lib/stores/wizard";
  import type { StackProfile } from "$lib/core/types/stack-profiles";
  import { ALL_STACKS } from "$lib/data/stack-profiles";
  import { LANGUAGES } from "$lib/data/languages";

  $: selectedStackId = $wizardStore.selectedStackId;
  $: selectedLanguages = $wizardStore.selectedLanguages;
  $: projectType = $wizardStore.intent.projectType;
  $: isValid = $isStep3Valid;

  let filteredStacks: StackProfile[] = [];
  let recommendedStacks: StackProfile[] = [];
  let selectedStack: StackProfile | null = null;
  let showComparisonModal = false;
  let comparisonStacks: StackProfile[] = [];
  let selectedForComparison = new Set<string>();
  let showDetailsModal = false;
  let detailsStack: StackProfile | null = null;

  // Reactive filtering and recommendations
  $: {
    filterAndRecommendStacks(selectedLanguages, projectType);
    if (selectedStackId) {
      selectedStack = ALL_STACKS.find((s) => s.id === selectedStackId) || null;
    }
  }

  onMount(() => {
    filterAndRecommendStacks(selectedLanguages, projectType);
  });

  function filterAndRecommendStacks(languages: string[], projType: string) {
    // Filter stacks based on language compatibility
    if (languages.length > 0) {
      filteredStacks = ALL_STACKS.filter((stack) => {
        // Check if any selected language is compatible with this stack
        return languages.some((langId) => {
          const lang = LANGUAGES[langId];
          return lang && lang.compatibleStacks.includes(stack.id);
        });
      });
    } else {
      filteredStacks = ALL_STACKS;
    }

    // Generate recommendations based on project type and languages
    recommendedStacks = getRecommendations(filteredStacks, projType, languages);
  }

  function getRecommendations(
    stacks: StackProfile[],
    projType: string,
    languages: string[]
  ): StackProfile[] {
    const recommendations: StackProfile[] = [];

    // Type-based recommendations
    if (projType === "web") {
      const hasTS = languages.includes("javascript-typescript");
      const hasPython = languages.includes("python");

      if (hasTS && hasPython) {
        recommendations.push(
          ...stacks.filter((s) =>
            ["t3-stack", "nextjs-fullstack", "mern-stack"].includes(s.id)
          )
        );
      } else if (hasTS) {
        recommendations.push(
          ...stacks.filter((s) => ["t3-stack", "mern-stack"].includes(s.id))
        );
      } else if (hasPython) {
        recommendations.push(
          ...stacks.filter((s) =>
            ["django-stack", "fastapi-ai-stack"].includes(s.id)
          )
        );
      }
    } else if (projType === "mobile") {
      recommendations.push(
        ...stacks.filter((s) => s.id === "react-native-expo")
      );
    } else if (projType === "ai") {
      recommendations.push(
        ...stacks.filter((s) => s.id === "fastapi-ai-stack")
      );
    } else if (projType === "api") {
      const hasGo = languages.includes("go");
      const hasPython = languages.includes("python");

      if (hasGo) {
        recommendations.push(
          ...stacks.filter((s) => s.id === "golang-cloud-native")
        );
      }
      if (hasPython) {
        recommendations.push(
          ...stacks.filter((s) =>
            ["fastapi-ai-stack", "django-stack"].includes(s.id)
          )
        );
      }
    }

    // Remove duplicates and return top 3
    return [...new Set(recommendations)].slice(0, 3);
  }

  function handleStackSelect(event: CustomEvent<{ stackId: string }>) {
    wizardStore.setStack(event.detail.stackId);
  }

  function toggleComparisonSelection(stackId: string) {
    if (selectedForComparison.has(stackId)) {
      selectedForComparison.delete(stackId);
    } else {
      if (selectedForComparison.size < 3) {
        selectedForComparison.add(stackId);
      }
    }
    selectedForComparison = selectedForComparison; // Trigger reactivity
  }

  function openComparisonModal() {
    if (selectedForComparison.size >= 2) {
      comparisonStacks = Array.from(selectedForComparison)
        .map(id => ALL_STACKS.find(s => s.id === id))
        .filter((s): s is StackProfile => s !== undefined);
      showComparisonModal = true;
    }
  }

  function closeComparisonModal() {
    showComparisonModal = false;
  }

  function compareRecommended() {
    comparisonStacks = recommendedStacks.slice(0, 3);
    showComparisonModal = true;
  }

  function showStackDetails(stack: StackProfile) {
    detailsStack = stack;
    showDetailsModal = true;
  }

  function closeDetailsModal() {
    showDetailsModal = false;
  }
</script>

<div class="step-content">
  <div class="mb-8">
    <h2 class="text-3xl font-bold text-gray-900 mb-2">Choose Your Stack</h2>
    <p class="text-gray-600">
      {#if selectedLanguages.length > 0}
        Showing {filteredStacks.length} stacks compatible with your selected languages
      {:else}
        Select a pre-configured technology stack for your {projectType || "project"}
      {/if}
    </p>
  </div>

  <!-- Recommendations Section -->
  {#if recommendedStacks.length > 0}
    <div class="mb-6 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl">
      <div class="flex items-start gap-3 mb-4">
        <div class="p-2 bg-indigo-600 rounded-lg">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-gray-900 mb-1">Recommended Stacks</h3>
          <p class="text-sm text-gray-600 mb-3">
            Based on your {projectType} project and selected languages
          </p>
        </div>
        <button
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          on:click={compareRecommended}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Compare
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        {#each recommendedStacks as stack}
          <div
            class="p-4 bg-white border-2 rounded-lg transition-all"
            class:border-indigo-600={selectedStackId === stack.id}
            class:bg-indigo-50={selectedStackId === stack.id}
            class:border-gray-200={selectedStackId !== stack.id}
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="text-2xl">{stack.icon}</span>
              <h4 class="font-bold text-gray-900">{stack.name}</h4>
            </div>
            <p class="text-xs text-gray-600 mb-3 line-clamp-2">{stack.tagline || stack.description.substring(0, 100)}</p>
            <div class="flex items-center gap-2 mb-3">
              <span class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full capitalize">
                {stack.requirements.complexity}
              </span>
              {#if selectedStackId === stack.id}
                <svg class="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              {/if}
            </div>
            <div class="flex gap-2">
              <button
                class="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded transition-colors"
                on:click={() => handleStackSelect({ detail: { stackId: stack.id } } as any)}
              >
                {selectedStackId === stack.id ? 'Selected' : 'Select'}
              </button>
              <button
                class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition-colors"
                on:click={() => showStackDetails(stack)}
              >
                Details
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Selected Stack Display -->
  {#if selectedStack}
    <div class="mb-6 p-5 bg-green-50 border-2 border-green-200 rounded-xl">
      <div class="flex items-start gap-4">
        <span class="text-5xl">{selectedStack.icon}</span>
        <div class="flex-1">
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1">
              <h4 class="text-xl font-bold text-green-900 mb-1">{selectedStack.name}</h4>
              <p class="text-sm text-green-700">{selectedStack.tagline || selectedStack.description.substring(0, 150)}</p>
            </div>
            <div class="flex gap-2">
              <button
                class="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded transition-colors"
                on:click={() => selectedStack && showStackDetails(selectedStack)}
              >
                View Details
              </button>
              <button
                class="text-green-700 hover:text-green-900 p-1"
                on:click={() => wizardStore.setStack(null)}
                aria-label="Deselect stack"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <div class="bg-white p-3 rounded-lg border border-green-200">
              <div class="text-xs text-gray-600 mb-1">Category</div>
              <div class="font-semibold text-gray-900 capitalize">{selectedStack.category}</div>
            </div>
            <div class="bg-white p-3 rounded-lg border border-green-200">
              <div class="text-xs text-gray-600 mb-1">Complexity</div>
              <div class="font-semibold text-gray-900 capitalize">{selectedStack.requirements.complexity}</div>
            </div>
            <div class="bg-white p-3 rounded-lg border border-green-200">
              <div class="text-xs text-gray-600 mb-1">Technologies</div>
              <div class="font-semibold text-gray-900">{Object.values(selectedStack.technologies).flat().length}</div>
            </div>
            <div class="bg-white p-3 rounded-lg border border-green-200">
              <div class="text-xs text-gray-600 mb-1">Popularity</div>
              <div class="font-semibold text-gray-900">{selectedStack.popularity}/10</div>
            </div>
          </div>

          {#if selectedStack.features.length > 0}
            <div class="mt-3">
              <div class="text-xs text-green-700 font-medium mb-2">Key Features:</div>
              <div class="flex flex-wrap gap-2">
                {#each selectedStack.features.slice(0, 4) as feature}
                  <span class="px-2 py-1 bg-white border border-green-200 rounded text-xs font-medium text-gray-700">
                    {feature}
                  </span>
                {/each}
                {#if selectedStack.features.length > 4}
                  <span class="px-2 py-1 bg-white border border-green-200 rounded text-xs text-gray-600">
                    +{selectedStack.features.length - 4} more
                  </span>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Language Filter Info -->
  {#if selectedLanguages.length > 0}
    <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
        <div class="flex-1">
          <h4 class="font-medium text-blue-900 mb-2">Language Compatibility Filter Active</h4>
          <p class="text-sm text-blue-800 mb-2">
            Showing only stacks compatible with:
          </p>
          <div class="flex flex-wrap gap-2">
            {#each selectedLanguages as langId}
              {@const lang = LANGUAGES[langId]}
              {#if lang}
                <span class="px-3 py-1 bg-white border border-blue-300 rounded-full text-sm font-medium text-blue-900 flex items-center gap-2">
                  <span>{lang.icon}</span>
                  <span>{lang.name}</span>
                </span>
              {/if}
            {/each}
          </div>
          {#if filteredStacks.length === 0}
            <p class="mt-3 text-sm text-amber-700 font-medium">
              ⚠️ No stacks found for this combination. Try selecting different languages or view all stacks.
            </p>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Stack Selector -->
  <StackSelector
    selectedStackId={selectedStackId}
    filterLanguages={selectedLanguages}
    on:select={handleStackSelect}
  />

  <!-- Validation Warning -->
  {#if !isValid}
    <div class="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <div>
          <h4 class="font-medium text-amber-900">Select a technology stack</h4>
          <p class="text-sm text-amber-800 mt-1">
            Choose a stack profile to continue to the next step
          </p>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Comparison Modal -->
{#if showComparisonModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" on:click={closeComparisonModal}>
    <div class="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden" on:click|stopPropagation>
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Stack Comparison</h2>
          <p class="text-sm text-gray-600 mt-1">Compare features, technologies, and requirements side-by-side</p>
        </div>
        <button
          class="p-2 hover:bg-white rounded-lg transition-colors"
          on:click={closeComparisonModal}
          aria-label="Close comparison modal"
        >
          <svg class="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- Modal Content -->
      <div class="p-6 overflow-y-auto" style="max-height: calc(90vh - 140px);">
        <StackComparison stacks={comparisonStacks} />
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
        <p class="text-sm text-gray-600">
          Comparing {comparisonStacks.length} stacks
        </p>
        <button
          class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          on:click={closeComparisonModal}
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Stack Details Modal -->
{#if showDetailsModal && detailsStack}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" on:click={closeDetailsModal}>
    <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" on:click|stopPropagation>
      <!-- Modal Header -->
      <div class="flex items-center gap-4 p-6 border-b border-gray-200 bg-gray-50">
        <span class="text-5xl">{detailsStack.icon}</span>
        <div class="flex-1">
          <h2 class="text-2xl font-bold text-gray-900">{detailsStack.name}</h2>
          <p class="text-sm text-gray-600 mt-1">{detailsStack.tagline || detailsStack.description.substring(0, 100)}</p>
        </div>
        <button
          class="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          on:click={closeDetailsModal}
          aria-label="Close details modal"
        >
          <svg class="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- Modal Content -->
      <div class="p-6 overflow-y-auto space-y-6" style="max-height: calc(90vh - 180px);">
        <!-- Stack Metadata -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div class="text-xs text-blue-700 font-medium mb-1">Category</div>
            <div class="text-lg font-bold text-blue-900 capitalize">{detailsStack.category}</div>
          </div>
          <div class="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div class="text-xs text-purple-700 font-medium mb-1">Complexity</div>
            <div class="text-lg font-bold text-purple-900 capitalize">{detailsStack.requirements.complexity}</div>
          </div>
          <div class="p-4 bg-green-50 rounded-lg border border-green-200">
            <div class="text-xs text-green-700 font-medium mb-1">Maturity</div>
            <div class="text-lg font-bold text-green-900 capitalize">{detailsStack.maturity}</div>
          </div>
          <div class="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div class="text-xs text-orange-700 font-medium mb-1">Popularity</div>
            <div class="text-lg font-bold text-orange-900">{detailsStack.popularity}/10</div>
          </div>
        </div>

        <!-- Description -->
        <div>
          <h3 class="text-lg font-bold text-gray-900 mb-2">Description</h3>
          <p class="text-gray-700">{detailsStack.description}</p>
        </div>

        <!-- Technologies -->
        <div>
          <h3 class="text-lg font-bold text-gray-900 mb-3">Technologies</h3>
          <div class="space-y-3">
            {#if detailsStack.technologies.frontend && detailsStack.technologies.frontend.length > 0}
              <div>
                <div class="text-sm font-medium text-gray-700 mb-2">Frontend</div>
                <div class="flex flex-wrap gap-2">
                  {#each detailsStack.technologies.frontend as tech}
                    <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {tech.name}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}
            {#if detailsStack.technologies.backend && detailsStack.technologies.backend.length > 0}
              <div>
                <div class="text-sm font-medium text-gray-700 mb-2">Backend</div>
                <div class="flex flex-wrap gap-2">
                  {#each detailsStack.technologies.backend as tech}
                    <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {tech.name}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}
            {#if detailsStack.technologies.database && detailsStack.technologies.database.length > 0}
              <div>
                <div class="text-sm font-medium text-gray-700 mb-2">Database</div>
                <div class="flex flex-wrap gap-2">
                  {#each detailsStack.technologies.database as tech}
                    <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {tech.name}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}
            {#if detailsStack.technologies.infrastructure && detailsStack.technologies.infrastructure.length > 0}
              <div>
                <div class="text-sm font-medium text-gray-700 mb-2">Infrastructure</div>
                <div class="flex flex-wrap gap-2">
                  {#each detailsStack.technologies.infrastructure as tech}
                    <span class="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                      {tech.name}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Features -->
        <div>
          <h3 class="text-lg font-bold text-gray-900 mb-3">Key Features</h3>
          <ul class="space-y-2">
            {#each detailsStack.features as feature}
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span class="text-gray-700">{feature}</span>
              </li>
            {/each}
          </ul>
        </div>

        <!-- Use Cases -->
        {#if detailsStack.idealFor && detailsStack.idealFor.length > 0}
          <div>
            <h3 class="text-lg font-bold text-gray-900 mb-3">Best For</h3>
            <div class="flex flex-wrap gap-2">
              {#each detailsStack.idealFor as useCase}
                <span class="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg text-sm font-medium">
                  {useCase}
                </span>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Deployment Info -->
        <div>
          <h3 class="text-lg font-bold text-gray-900 mb-3">Deployment</h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                <path d="M2 12a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" />
              </svg>
              <span class="text-sm font-medium text-gray-700">Vercel</span>
            </div>
            <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                <path d="M2 12a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" />
              </svg>
              <span class="text-sm font-medium text-gray-700">Netlify</span>
            </div>
            <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                <path d="M2 12a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" />
              </svg>
              <span class="text-sm font-medium text-gray-700">AWS</span>
            </div>
            <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                <path d="M2 12a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" />
              </svg>
              <span class="text-sm font-medium text-gray-700">Docker</span>
            </div>
          </div>
          <div class="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-sm font-medium text-blue-900">Production-Ready Deployment</span>
            </div>
          </div>
        </div>

        <!-- Learning Resources -->
        {#if detailsStack.resources}
          <div>
            <h3 class="text-lg font-bold text-gray-900 mb-3">Learning Resources</h3>
            <div class="space-y-2">
              {#if detailsStack.resources.officialDocs}
                <a
                  href={detailsStack.resources.officialDocs}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  <svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                  </svg>
                  <span class="text-sm font-medium text-gray-700">Official Documentation</span>
                  <svg class="w-4 h-4 text-gray-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                </a>
              {/if}
              {#if detailsStack.resources.tutorials && detailsStack.resources.tutorials.length > 0}
                {#each detailsStack.resources.tutorials as tutorial}
                  <a
                    href={tutorial}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                  >
                    <svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    <span class="text-sm font-medium text-gray-700">Tutorial</span>
                    <svg class="w-4 h-4 text-gray-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </a>
                {/each}
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-600">Ready to use this stack?</span>
        </div>
        <div class="flex gap-3">
          <button
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
            on:click={closeDetailsModal}
          >
            Close
          </button>
          <button
            class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            on:click={() => {
              if (detailsStack) {
                handleStackSelect({ detail: { stackId: detailsStack.id } } as any);
              }
              closeDetailsModal();
            }}
          >
            Select This Stack
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .step-content {
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
