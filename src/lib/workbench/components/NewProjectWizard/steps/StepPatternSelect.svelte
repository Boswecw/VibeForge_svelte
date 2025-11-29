<!--
  StepPatternSelect.svelte

  Wizard step for selecting an architecture pattern.
  Allows filtering by category, complexity, and search.
-->
<script lang="ts">
  import PatternCard from '../../ArchitecturePatterns/PatternCard.svelte';
  import {
    getAllPatterns,
    getPatternsByCategory,
    getPatternsByComplexity,
    searchPatternsByUseCase,
    getRecommendedPatterns
  } from '$lib/data/architecture-patterns';
  import type { ArchitectureCategory, ComplexityLevel, ArchitecturePattern } from '../../../types/architecture';
  import type { ProjectConfig } from '../../../types/project';

  interface Props {
    config: ProjectConfig;
  }

  let { config }: Props = $props();

  // Filter state
  let categoryFilter = $state<ArchitectureCategory | 'all'>('all');
  let complexityFilter = $state<ComplexityLevel | 'all'>('all');
  let searchQuery = $state('');
  let showRecommended = $state(true);
  let showLegacyMode = $state(false);

  // Get all patterns
  const allPatterns = getAllPatterns();

  // Filtered patterns
  const filteredPatterns = $derived((): ArchitecturePattern[] => {
    let patterns = allPatterns;

    // Filter by category
    if (categoryFilter !== 'all') {
      patterns = patterns.filter(p => p.category === categoryFilter);
    }

    // Filter by complexity
    if (complexityFilter !== 'all') {
      patterns = patterns.filter(p => p.complexity === complexityFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      patterns = patterns.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.displayName.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.idealFor.some(use => use.toLowerCase().includes(query))
      );
    }

    return patterns;
  });

  // Recommended patterns
  const recommendedPatterns = $derived((): ArchitecturePattern[] => {
    if (!showRecommended || !config.projectType) return [];

    const recommendations = getRecommendedPatterns({
      category: config.projectType === 'web' ? 'web' :
               config.projectType === 'fullstack' ? 'web' :
               config.projectType === 'api' ? 'backend' :
               config.projectType === 'cli' ? 'cli' : undefined,
      complexity: 'intermediate'
    });

    return recommendations.slice(0, 3).map(r => r.pattern);
  });

  // Handle pattern selection
  function selectPattern(pattern: ArchitecturePattern) {
    config.architecturePattern = pattern;
  }

  // Toggle legacy single-component mode
  function useLegacyMode() {
    showLegacyMode = !showLegacyMode;
    if (showLegacyMode) {
      config.architecturePattern = null;
    }
  }

  // Language selection (for legacy mode)
  const languages = [
    { value: 'javascript-typescript', label: 'JavaScript/TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'rust', label: 'Rust' },
    { value: 'go', label: 'Go' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' }
  ];

  // Categories for filter
  const categories: Array<{ value: ArchitectureCategory | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'desktop', label: 'Desktop' },
    { value: 'web', label: 'Web' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'backend', label: 'Backend' },
    { value: 'cli', label: 'CLI' },
    { value: 'ai-ml', label: 'AI/ML' },
    { value: 'microservices', label: 'Microservices' }
  ];

  // Complexity levels for filter
  const complexityLevels: Array<{ value: ComplexityLevel | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'simple', label: 'Simple' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'complex', label: 'Complex' },
    { value: 'enterprise', label: 'Enterprise' }
  ];
</script>

<div class="space-y-6">
  <!-- Header -->
  <div>
    <h2 class="text-2xl font-bold text-zinc-100 mb-2">
      Choose Architecture Pattern
    </h2>
    <p class="text-sm text-zinc-400">
      Select a multi-component architecture pattern, or use legacy single-component mode.
    </p>
  </div>

  <!-- Filters -->
  <div class="bg-gunmetal-900 border border-gunmetal-700 rounded-lg p-4 space-y-4">
    <!-- Search -->
    <div>
      <label for="pattern-search" class="sr-only">Search patterns</label>
      <input
        id="pattern-search"
        type="text"
        bind:value={searchQuery}
        placeholder="Search patterns by name or use case..."
        class="
          w-full px-4 py-2.5 rounded-lg
          bg-gunmetal-800 border border-gunmetal-700
          text-zinc-100 placeholder:text-zinc-600
          focus:outline-none focus:border-ember-500 focus:ring-2 focus:ring-ember-500/50
          transition-all
        "
      />
    </div>

    <!-- Category & Complexity Filters -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Category Filter -->
      <div>
        <label for="category-filter" class="block text-xs font-medium text-zinc-400 mb-2">
          Category
        </label>
        <select
          id="category-filter"
          bind:value={categoryFilter}
          class="
            w-full px-3 py-2 rounded-lg
            bg-gunmetal-800 border border-gunmetal-700
            text-zinc-100 text-sm
            focus:outline-none focus:border-ember-500
            transition-all
          "
        >
          {#each categories as cat}
            <option value={cat.value}>{cat.label}</option>
          {/each}
        </select>
      </div>

      <!-- Complexity Filter -->
      <div>
        <label for="complexity-filter" class="block text-xs font-medium text-zinc-400 mb-2">
          Complexity
        </label>
        <select
          id="complexity-filter"
          bind:value={complexityFilter}
          class="
            w-full px-3 py-2 rounded-lg
            bg-gunmetal-800 border border-gunmetal-700
            text-zinc-100 text-sm
            focus:outline-none focus:border-ember-500
            transition-all
          "
        >
          {#each complexityLevels as level}
            <option value={level.value}>{level.label}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Show Recommended Toggle -->
    <label class="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        bind:checked={showRecommended}
        class="
          w-4 h-4 rounded
          bg-gunmetal-800 border-gunmetal-700
          text-ember-600 focus:ring-ember-500
        "
      />
      <span class="text-sm text-zinc-300">Show recommended patterns</span>
    </label>
  </div>

  <!-- Recommended Patterns -->
  {#if showRecommended && recommendedPatterns().length > 0}
    <div>
      <h3 class="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
        <svg class="w-4 h-4 text-ember-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Recommended for {config.projectType || 'your project'}
      </h3>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {#each recommendedPatterns() as pattern (pattern.id)}
          <PatternCard
            {pattern}
            selected={config.architecturePattern?.id === pattern.id}
            onClick={() => selectPattern(pattern)}
          />
        {/each}
      </div>
    </div>
  {/if}

  <!-- All Patterns -->
  <div>
    <h3 class="text-sm font-semibold text-zinc-300 mb-3">
      {#if filteredPatterns().length === allPatterns.length}
        All Patterns ({allPatterns.length})
      {:else}
        Filtered Patterns ({filteredPatterns().length})
      {/if}
    </h3>

    {#if filteredPatterns().length > 0}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {#each filteredPatterns() as pattern (pattern.id)}
          <PatternCard
            {pattern}
            selected={config.architecturePattern?.id === pattern.id}
            onClick={() => selectPattern(pattern)}
          />
        {/each}
      </div>
    {:else}
      <div class="text-center py-12 bg-gunmetal-900 border border-gunmetal-700 rounded-lg">
        <svg class="w-12 h-12 mx-auto text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-zinc-400 text-sm">No patterns match your filters</p>
        <button
          type="button"
          onclick={() => {
            categoryFilter = 'all';
            complexityFilter = 'all';
            searchQuery = '';
          }}
          class="mt-3 text-sm text-ember-400 hover:text-ember-300"
        >
          Clear filters
        </button>
      </div>
    {/if}
  </div>

  <!-- Legacy Mode Option -->
  <div class="border-t border-gunmetal-700 pt-4">
    <button
      type="button"
      onclick={useLegacyMode}
      class="
        w-full p-4 text-left rounded-lg border-2 transition-all
        {showLegacyMode
          ? 'border-ember-500 bg-gunmetal-800'
          : 'border-gunmetal-700 hover:border-gunmetal-600'}
      "
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <div>
            <div class="font-medium text-zinc-200">
              Use Legacy Single-Component Mode
            </div>
            <div class="text-xs text-zinc-500 mt-0.5">
              Select individual language and framework (classic wizard flow)
            </div>
          </div>
        </div>
        <svg
          class="w-5 h-5 text-zinc-400 transition-transform {showLegacyMode ? 'rotate-180' : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>

    <!-- Legacy Language Selector (Expanded) -->
    {#if showLegacyMode}
      <div class="mt-4 p-4 bg-gunmetal-900 border border-gunmetal-700 rounded-lg space-y-3">
        <h4 class="text-sm font-medium text-zinc-300">Select Primary Language</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
          {#each languages as lang}
            <button
              type="button"
              onclick={() => {
                config.primaryLanguage = lang.value;
                config.architecturePattern = null;
              }}
              class="
                px-3 py-2 text-sm rounded-lg border transition-all
                {config.primaryLanguage === lang.value
                  ? 'border-ember-500 bg-ember-500/10 text-ember-400'
                  : 'border-gunmetal-700 text-zinc-300 hover:border-gunmetal-600'}
              "
            >
              {lang.label}
            </button>
          {/each}
        </div>
        {#if config.primaryLanguage}
          <p class="text-xs text-zinc-500">
            Selected: <span class="text-ember-400 font-medium">{languages.find(l => l.value === config.primaryLanguage)?.label}</span>
          </p>
        {/if}
      </div>
    {/if}
  </div>
</div>
