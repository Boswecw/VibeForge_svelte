<!--
  StepPatternSelect.svelte

  Wizard step for selecting an architecture pattern.
  Allows filtering by category, complexity, and search.
-->
<script lang="ts">
  import PatternCard from '../../ArchitecturePatterns/PatternCard.svelte';
  import PatternComparisonView from '../../ArchitecturePatterns/PatternComparisonView.svelte';
  import PatternFilters from '../components/PatternFilters.svelte';
  import RuntimeDetectionPanel from '../components/RuntimeDetectionPanel.svelte';
  import { patternComparison, comparisonCount } from '$lib/stores/patternComparison';
  import {
    getAllPatterns,
    getPatternsByCategory,
    getPatternsByComplexity,
    searchPatternsByUseCase,
    getRecommendedPatterns
  } from '$lib/data/architecture-patterns';
  import type { ArchitectureCategory, ComplexityLevel, ArchitecturePattern } from '../../../types/architecture';
  import type { ProjectConfig } from '../../../types/project';
  import { successPredictor } from '$lib/services/successPredictor';
  import type { SuccessPrediction } from '$lib/types/success-prediction';
  import { formatProbability, getSuccessProbabilityColor, getConfidenceBadgeClass } from '$lib/types/success-prediction';
  import TeamRecommendations from '../TeamRecommendations.svelte';

  interface Props {
    config: ProjectConfig;
  }

  let { config }: Props = $props();

  // Filter state
  let categoryFilter = $state<ArchitectureCategory | 'all'>('all');
  let complexityFilter = $state<ComplexityLevel | 'all'>('all');
  let searchQuery = $state('');
  let debouncedSearchQuery = $state('');
  let showRecommended = $state(true);
  let showLegacyMode = $state(false);

  // Success prediction state
  let currentPrediction = $state<SuccessPrediction | null>(null);
  let isLoadingPrediction = $state(false);
  let showPredictionPanel = $state(false);

  // Debounce search query (300ms delay)
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      debouncedSearchQuery = searchQuery;
    }, 300);

    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  });

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

    // Search filter (using debounced query for performance)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
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
  async function selectPattern(pattern: ArchitecturePattern) {
    config.architecturePattern = pattern;
    await calculateSuccessPrediction(pattern);
    showPredictionPanel = true;
  }

  // Calculate success prediction for selected pattern
  async function calculateSuccessPrediction(pattern: ArchitecturePattern) {
    isLoadingPrediction = true;
    currentPrediction = null;

    try {
      // Map architecture complexity to prediction complexity
      const complexityMap: Record<ComplexityLevel, 'simple' | 'intermediate' | 'complex'> = {
        'simple': 'simple',
        'intermediate': 'intermediate',
        'complex': 'complex',
        'enterprise': 'complex' // Map enterprise to complex
      };

      const prediction = await successPredictor.predictSuccess({
        patternId: pattern.id,
        stackId: config.selectedStack,
        userId: undefined, // TODO: Add user ID from auth system
        metadata: {
          primaryLanguage: config.primaryLanguage ?? '',
          complexity: complexityMap[pattern.complexity],
          includesTests: config.includeTests,
          includesCI: config.includeCI
        }
      });

      currentPrediction = prediction;
    } catch (error) {
      console.error('Failed to calculate success prediction:', error);
      currentPrediction = null;
    } finally {
      isLoadingPrediction = false;
    }
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

  // Filter callbacks
  function handleSearchChange(value: string) {
    searchQuery = value;
  }

  function handleCategoryChange(value: ArchitectureCategory | 'all') {
    categoryFilter = value;
  }

  function handleComplexityChange(value: ComplexityLevel | 'all') {
    complexityFilter = value;
  }

  function handleRecommendedToggle(value: boolean) {
    showRecommended = value;
  }
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

  <!-- Runtime Detection Panel -->
  <RuntimeDetectionPanel onPatternSelect={selectPattern} />

  <!-- Team Recommendations -->
  <TeamRecommendations />

  <!-- Filters -->
  <PatternFilters
    {searchQuery}
    {categoryFilter}
    {complexityFilter}
    {showRecommended}
    onSearchChange={handleSearchChange}
    onCategoryChange={handleCategoryChange}
    onComplexityChange={handleComplexityChange}
    onRecommendedToggle={handleRecommendedToggle}
  />

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
            debouncedSearchQuery = ''; // Clear debounced query immediately
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

  <!-- Success Prediction Panel -->
  {#if showPredictionPanel && config.architecturePattern}
    <div class="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-6">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-zinc-100">Success Prediction</h3>
            <p class="text-sm text-zinc-400">For {config.architecturePattern.displayName}</p>
          </div>
        </div>
        <button
          type="button"
          onclick={() => showPredictionPanel = false}
          class="text-zinc-400 hover:text-zinc-200 transition-colors"
          aria-label="Close prediction panel"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {#if isLoadingPrediction}
        <div class="flex items-center justify-center py-8">
          <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      {:else if currentPrediction}
        <!-- Probability Display -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-gunmetal-900/50 rounded-lg p-4">
            <p class="text-sm text-zinc-400 mb-1">Success Probability</p>
            <p class="text-3xl font-bold {getSuccessProbabilityColor(currentPrediction.probability)}">
              {formatProbability(currentPrediction.probability)}
            </p>
          </div>
          <div class="bg-gunmetal-900/50 rounded-lg p-4">
            <p class="text-sm text-zinc-400 mb-1">Confidence</p>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border capitalize {getConfidenceBadgeClass(currentPrediction.confidence)}">
              {currentPrediction.confidence}
            </span>
          </div>
          <div class="bg-gunmetal-900/50 rounded-lg p-4">
            <p class="text-sm text-zinc-400 mb-1">Data Sample</p>
            <p class="text-2xl font-bold text-zinc-200">{currentPrediction.sampleSize} projects</p>
          </div>
        </div>

        <!-- Contributing Factors -->
        <div class="mb-4">
          <h4 class="text-sm font-semibold text-zinc-300 mb-3">Contributing Factors</h4>
          <div class="space-y-2">
            {#each currentPrediction.factors as factor}
              <div class="bg-gunmetal-900/50 rounded-lg p-3">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-zinc-200">{factor.name}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-zinc-400">{(factor.weight * 100).toFixed(0)}% weight</span>
                    <span class="text-sm font-semibold {factor.impact > 0 ? 'text-green-400' : factor.impact < 0 ? 'text-red-400' : 'text-zinc-400'}">
                      {factor.value.toFixed(0)}
                    </span>
                  </div>
                </div>
                <p class="text-xs text-zinc-500">{factor.description}</p>
                <!-- Progress bar showing factor value -->
                <div class="mt-2 h-1 bg-gunmetal-700 rounded-full overflow-hidden">
                  <div
                    class="h-full transition-all {factor.value >= 75 ? 'bg-green-500' : factor.value >= 50 ? 'bg-yellow-500' : 'bg-red-500'}"
                    style="width: {factor.value}%"
                  ></div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Confidence Reasons -->
        {#if currentPrediction.confidenceReasons.length > 0}
          <div class="bg-gunmetal-900/50 rounded-lg p-4">
            <h4 class="text-sm font-semibold text-zinc-300 mb-2">Why this confidence level?</h4>
            <ul class="space-y-1 text-sm text-zinc-400">
              {#each currentPrediction.confidenceReasons as reason}
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <span>{reason}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      {:else}
        <div class="text-center py-8 text-zinc-400">
          <p>Unable to calculate prediction at this time.</p>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Floating Compare Button -->
  {#if $comparisonCount > 0}
    <button
      type="button"
      class="fixed bottom-8 right-8 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 z-50"
      onclick={() => patternComparison.open()}
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      Compare ({$comparisonCount})
    </button>
  {/if}

  <!-- Pattern Comparison View -->
  <PatternComparisonView onSelect={selectPattern} />
</div>
