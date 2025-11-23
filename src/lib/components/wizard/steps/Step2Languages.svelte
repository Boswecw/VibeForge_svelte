<!-- @component
no description yet
-->
<script lang="ts">
  import { onMount } from "svelte";
  import LanguageSelector from "$lib/components/languages/LanguageSelector.svelte";
  import { wizardStore, isStep2Valid } from "$lib/stores/wizard";
  import type { Language, LanguageCategory } from "$lib/data/languages";
  import { LANGUAGES } from "$lib/data/languages";
  import {
    listLanguages,
    recommendLanguages,
    type LanguageRecommendationResponse,
  } from "$lib/core/api/languagesClient";

  $: selectedLanguages = $wizardStore.selectedLanguages;
  $: projectType = $wizardStore.intent.projectType;
  $: isValid = $isStep2Valid;

  // API state
  let languages: Language[] = [];
  let loading = true;
  let apiError = false;
  let recommendations: LanguageRecommendationResponse | null = null;
  let loadingRecommendations = false;

  // UI state
  let searchQuery = "";
  let selectedCategory: LanguageCategory | "all" = "all";
  let showDetailsModal = false;
  let selectedLanguageDetail: Language | null = null;

  // Validation state
  let compatibilityWarnings: string[] = [];
  let missingLayerWarnings: string[] = [];

  // Reactive filtering
  $: filteredLanguages = filterLanguages(
    languages,
    searchQuery,
    selectedCategory
  );
  $: languagesByCategory = groupByCategory(filteredLanguages);
  $: selectedLanguageObjects = selectedLanguages
    .map((id) => languages.find((l) => l.id === id))
    .filter(Boolean) as Language[];

  // Reactive validation
  $: {
    compatibilityWarnings = checkCompatibility(selectedLanguageObjects);
    missingLayerWarnings = checkMissingLayers(selectedLanguageObjects);
  }

  onMount(async () => {
    await loadLanguages();
    if (projectType) {
      await loadRecommendations();
    }
  });

  async function loadLanguages() {
    try {
      loading = true;
      apiError = false;
      const response = await listLanguages();
      languages = response.data;
    } catch (error) {
      console.error("Failed to load languages from API:", error);
      apiError = true;
      // Fallback to local data
      languages = Object.values(LANGUAGES);
    } finally {
      loading = false;
    }
  }

  async function loadRecommendations() {
    if (!projectType) return;

    try {
      loadingRecommendations = true;
      recommendations = await recommendLanguages({
        project_type: projectType,
      });
    } catch (error) {
      console.error("Failed to load recommendations:", error);
      recommendations = null;
    } finally {
      loadingRecommendations = false;
    }
  }

  function filterLanguages(
    langs: Language[],
    query: string,
    category: LanguageCategory | "all"
  ): Language[] {
    let filtered = langs;

    // Category filter
    if (category !== "all") {
      filtered = filtered.filter((l) => l.category === category);
    }

    // Search filter
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(lowerQuery) ||
          l.description.toLowerCase().includes(lowerQuery)
      );
    }

    return filtered;
  }

  function groupByCategory(
    langs: Language[]
  ): Record<LanguageCategory, Language[]> {
    return {
      frontend: langs.filter((l) => l.category === "frontend"),
      backend: langs.filter((l) => l.category === "backend"),
      mobile: langs.filter((l) => l.category === "mobile"),
      systems: langs.filter((l) => l.category === "systems"),
    };
  }

  function checkCompatibility(selectedLangs: Language[]): string[] {
    const warnings: string[] = [];

    // Check for conflicting frontend frameworks
    const frontendFrameworks = selectedLangs.filter((l) =>
      ["svelte", "solid"].includes(l.id)
    );
    if (frontendFrameworks.length > 1) {
      warnings.push(
        `Multiple frontend frameworks selected (${frontendFrameworks.map((l) => l.name).join(", ")}). Consider using just one.`
      );
    }

    // Check for unusual combinations
    const hasPython = selectedLangs.some((l) => l.id === "python");
    const hasRust = selectedLangs.some((l) => l.id === "rust");
    if (hasPython && hasRust) {
      warnings.push(
        "Python + Rust is an advanced combination. Make sure your team has expertise in both."
      );
    }

    return warnings;
  }

  function checkMissingLayers(selectedLangs: Language[]): string[] {
    const warnings: string[] = [];

    if (selectedLangs.length === 0) return warnings;

    const hasFrontend = selectedLangs.some((l) => l.category === "frontend");
    const hasBackend = selectedLangs.some((l) => l.category === "backend");

    // Warn based on project type
    if (projectType === "web") {
      if (!hasFrontend) {
        warnings.push(
          "⚠️ No frontend language selected. Web apps typically need a frontend."
        );
      }
      if (!hasBackend) {
        warnings.push(
          "💡 Consider adding a backend language for dynamic features."
        );
      }
    }

    if (projectType === "api" && hasFrontend && !hasBackend) {
      warnings.push(
        "💡 You've selected frontend languages for a backend project. Consider adding a backend language."
      );
    }

    if (projectType === "mobile" && hasBackend && !hasFrontend) {
      warnings.push(
        "💡 Consider adding a mobile framework (React Native/Flutter) if building a mobile app."
      );
    }

    return warnings;
  }

  function showDetails(language: Language) {
    selectedLanguageDetail = language;
    showDetailsModal = true;
  }

  function closeDetailsModal() {
    showDetailsModal = false;
    selectedLanguageDetail = null;
  }

  function handleLanguageSelect(event: CustomEvent<{ language: string }>) {
    wizardStore.addLanguage(event.detail.language);
  }

  function handleLanguageDeselect(event: CustomEvent<{ language: string }>) {
    wizardStore.removeLanguage(event.detail.language);
  }
</script>

<div class="step-content">
  <div class="mb-8">
    <h2 class="text-3xl font-bold text-gray-900 mb-2">
      Select Programming Languages
    </h2>
    <p class="text-gray-600">
      Choose the languages you want to use for your {projectType || "project"}
    </p>
    {#if apiError}
      <p class="mt-2 text-sm text-amber-600">
        ⚠️ Using offline language data (API unavailable)
      </p>
    {/if}
  </div>

  <!-- AI Recommendations -->
  {#if recommendations && recommendations.recommended.length > 0}
    <div class="mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
      <div class="flex items-start gap-3 mb-3">
        <div class="p-2 bg-blue-600 rounded-lg">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-gray-900 mb-1">Recommended for your {projectType} project</h3>
          <p class="text-sm text-gray-600 mb-3">{recommendations.reasoning}</p>
          <div class="flex flex-wrap gap-2">
            {#each recommendations.recommended as lang}
              <button
                class="px-4 py-2 bg-white border-2 rounded-lg hover:border-blue-400 transition-all"
                class:border-blue-500={selectedLanguages.includes(lang.id)}
                class:bg-blue-50={selectedLanguages.includes(lang.id)}
                class:border-gray-200={!selectedLanguages.includes(lang.id)}
                on:click={() => {
                  if (selectedLanguages.includes(lang.id)) {
                    handleLanguageDeselect({ detail: { language: lang.id } } as any);
                  } else {
                    handleLanguageSelect({ detail: { language: lang.id } } as any);
                  }
                }}
              >
                <div class="flex items-center gap-2">
                  <span class="text-2xl">{lang.icon}</span>
                  <div class="text-left">
                    <div class="font-semibold text-gray-900">{lang.name}</div>
                    <div class="text-xs text-gray-600">{lang.category}</div>
                  </div>
                  {#if selectedLanguages.includes(lang.id)}
                    <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {:else if loadingRecommendations}
    <div class="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
      <div class="animate-spin inline-block w-6 h-6 border-4 border-gray-300 border-t-indigo-600 rounded-full"></div>
      <p class="mt-2 text-sm text-gray-600">Loading recommendations...</p>
    </div>
  {/if}

  <!-- Selected Languages Summary -->
  {#if selectedLanguageObjects.length > 0}
    <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <div class="flex-1">
          <h4 class="font-medium text-green-900 mb-2">
            {selectedLanguageObjects.length} language{selectedLanguageObjects.length !== 1 ? "s" : ""} selected
          </h4>
          <div class="flex flex-wrap gap-2">
            {#each selectedLanguageObjects as lang}
              <div class="flex items-center gap-2 px-3 py-1.5 bg-white border border-green-300 rounded-lg">
                <span class="text-xl">{lang.icon}</span>
                <span class="font-medium text-green-900">{lang.name}</span>
                <span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{lang.category}</span>
                <button
                  class="ml-1 text-green-600 hover:text-green-800"
                  on:click={() => handleLanguageDeselect({ detail: { language: lang.id } } as any)}
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Compatibility Warnings -->
  {#if compatibilityWarnings.length > 0}
    <div class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <div class="flex-1">
          <h4 class="font-medium text-amber-900 mb-2">Compatibility Notes</h4>
          <ul class="space-y-1">
            {#each compatibilityWarnings as warning}
              <li class="text-sm text-amber-800">{warning}</li>
            {/each}
          </ul>
        </div>
      </div>
    </div>
  {/if}

  <!-- Missing Layer Warnings -->
  {#if missingLayerWarnings.length > 0}
    <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
        <div class="flex-1">
          <h4 class="font-medium text-blue-900 mb-2">Suggestions</h4>
          <ul class="space-y-1">
            {#each missingLayerWarnings as warning}
              <li class="text-sm text-blue-800">{warning}</li>
            {/each}
          </ul>
        </div>
      </div>
    </div>
  {/if}

  <!-- Search & Filters -->
  <div class="mb-6">
    <div class="flex flex-col sm:flex-row gap-4">
      <!-- Search -->
      <div class="flex-1">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Search languages..."
            bind:value={searchQuery}
          />
        </div>
      </div>

      <!-- Category Filter -->
      <div class="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
        <button
          class="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all"
          class:bg-indigo-600={selectedCategory === "all"}
          class:text-white={selectedCategory === "all"}
          class:bg-gray-100={selectedCategory !== "all"}
          class:text-gray-700={selectedCategory !== "all"}
          on:click={() => (selectedCategory = "all")}
        >
          All
        </button>
        <button
          class="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all"
          class:bg-indigo-600={selectedCategory === "frontend"}
          class:text-white={selectedCategory === "frontend"}
          class:bg-gray-100={selectedCategory !== "frontend"}
          class:text-gray-700={selectedCategory !== "frontend"}
          on:click={() => (selectedCategory = "frontend")}
        >
          🌐 Frontend
        </button>
        <button
          class="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all"
          class:bg-indigo-600={selectedCategory === "backend"}
          class:text-white={selectedCategory === "backend"}
          class:bg-gray-100={selectedCategory !== "backend"}
          class:text-gray-700={selectedCategory !== "backend"}
          on:click={() => (selectedCategory = "backend")}
        >
          ⚡ Backend
        </button>
        <button
          class="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all"
          class:bg-indigo-600={selectedCategory === "mobile"}
          class:text-white={selectedCategory === "mobile"}
          class:bg-gray-100={selectedCategory !== "mobile"}
          class:text-gray-700={selectedCategory !== "mobile"}
          on:click={() => (selectedCategory = "mobile")}
        >
          📱 Mobile
        </button>
        <button
          class="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all"
          class:bg-indigo-600={selectedCategory === "systems"}
          class:text-white={selectedCategory === "systems"}
          class:bg-gray-100={selectedCategory !== "systems"}
          class:text-gray-700={selectedCategory !== "systems"}
          on:click={() => (selectedCategory = "systems")}
        >
          🔧 Systems
        </button>
      </div>
    </div>
  </div>

  <!-- Language Grid -->
  {#if loading}
    <div class="text-center py-12">
      <div class="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-indigo-600 rounded-full"></div>
      <p class="mt-4 text-gray-600">Loading languages...</p>
    </div>
  {:else if filteredLanguages.length === 0}
    <div class="text-center py-12">
      <div class="text-6xl mb-4">🔍</div>
      <p class="text-gray-600">No languages found matching your search</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each filteredLanguages as lang}
        <button
          class="text-left p-4 border-2 rounded-xl transition-all hover:shadow-lg"
          class:border-indigo-500={selectedLanguages.includes(lang.id)}
          class:bg-indigo-50={selectedLanguages.includes(lang.id)}
          class:border-gray-200={!selectedLanguages.includes(lang.id)}
          class:hover:border-indigo-300={!selectedLanguages.includes(lang.id)}
          on:click={() => {
            if (selectedLanguages.includes(lang.id)) {
              handleLanguageDeselect({ detail: { language: lang.id } } as any);
            } else {
              handleLanguageSelect({ detail: { language: lang.id } } as any);
            }
          }}
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-3">
              <span class="text-4xl">{lang.icon}</span>
              <div>
                <h3 class="font-bold text-gray-900">{lang.name}</h3>
                <span class="text-xs text-gray-500 uppercase">{lang.category}</span>
              </div>
            </div>
            {#if selectedLanguages.includes(lang.id)}
              <svg class="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            {/if}
          </div>
          <p class="text-sm text-gray-600 mb-3">{lang.description}</p>
          <div class="flex items-center justify-between">
            <span class="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
              {lang.ecosystemSupport} ecosystem
            </span>
            <span
              class="text-xs text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              role="button"
              tabindex="0"
              on:click|stopPropagation={() => showDetails(lang)}
              on:keydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  showDetails(lang);
                }
              }}
            >
              Details →
            </span>
          </div>
        </button>
      {/each}
    </div>
  {/if}

  <!-- Validation Message -->
  {#if !isValid && !loading}
    <div class="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <div>
          <h4 class="font-medium text-amber-900">Select at least one language</h4>
          <p class="text-sm text-amber-800 mt-1">
            Choose the programming languages you'll use in your project
          </p>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Language Details Modal -->
{#if showDetailsModal && selectedLanguageDetail}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" on:click={closeDetailsModal}>
    <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" on:click|stopPropagation>
      <div class="p-6">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-4">
            <span class="text-6xl">{selectedLanguageDetail.icon}</span>
            <div>
              <h2 class="text-3xl font-bold text-gray-900">{selectedLanguageDetail.name}</h2>
              <span class="text-sm text-gray-500 uppercase">{selectedLanguageDetail.category}</span>
            </div>
          </div>
          <button class="text-gray-400 hover:text-gray-600" on:click={closeDetailsModal}>
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <p class="text-gray-700 mb-6">{selectedLanguageDetail.description}</p>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600 mb-1">Ecosystem Support</div>
            <div class="text-lg font-bold capitalize">{selectedLanguageDetail.ecosystemSupport}</div>
          </div>
          <div class="p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600 mb-1">Compatible Stacks</div>
            <div class="text-lg font-bold">{selectedLanguageDetail.compatibleStacks.length}</div>
          </div>
        </div>

        {#if selectedLanguageDetail.packageManager}
          <div class="mb-4">
            <h3 class="font-semibold text-gray-900 mb-2">Package Manager</h3>
            <p class="text-gray-700">{selectedLanguageDetail.packageManager}</p>
          </div>
        {/if}

        {#if selectedLanguageDetail.testFrameworks && selectedLanguageDetail.testFrameworks.length > 0}
          <div class="mb-4">
            <h3 class="font-semibold text-gray-900 mb-2">Test Frameworks</h3>
            <div class="flex flex-wrap gap-2">
              {#each selectedLanguageDetail.testFrameworks as framework}
                <span class="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">{framework}</span>
              {/each}
            </div>
          </div>
        {/if}

        {#if selectedLanguageDetail.buildTools && selectedLanguageDetail.buildTools.length > 0}
          <div class="mb-4">
            <h3 class="font-semibold text-gray-900 mb-2">Build Tools</h3>
            <div class="flex flex-wrap gap-2">
              {#each selectedLanguageDetail.buildTools as tool}
                <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">{tool}</span>
              {/each}
            </div>
          </div>
        {/if}

        <div class="mt-6 pt-6 border-t">
          <button
            class="w-full py-3 rounded-lg font-medium transition-all"
            class:bg-indigo-600={selectedLanguageDetail && !selectedLanguages.includes(selectedLanguageDetail.id)}
            class:text-white={selectedLanguageDetail && !selectedLanguages.includes(selectedLanguageDetail.id)}
            class:hover:bg-indigo-700={selectedLanguageDetail && !selectedLanguages.includes(selectedLanguageDetail.id)}
            class:bg-gray-200={selectedLanguageDetail && selectedLanguages.includes(selectedLanguageDetail.id)}
            class:text-gray-700={selectedLanguageDetail && selectedLanguages.includes(selectedLanguageDetail.id)}
            on:click={() => {
              if (selectedLanguageDetail) {
                if (selectedLanguages.includes(selectedLanguageDetail.id)) {
                  handleLanguageDeselect({ detail: { language: selectedLanguageDetail.id } } as any);
                } else {
                  handleLanguageSelect({ detail: { language: selectedLanguageDetail.id } } as any);
                }
                closeDetailsModal();
              }
            }}
          >
            {selectedLanguages.includes(selectedLanguageDetail.id) ? "Remove from Project" : "Add to Project"}
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
