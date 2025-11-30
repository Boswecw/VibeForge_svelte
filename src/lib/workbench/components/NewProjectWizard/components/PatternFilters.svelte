<!--
  PatternFilters.svelte

  Filter controls for architecture pattern selection.
  Includes search, category, complexity, and recommendation toggles.
-->
<script lang="ts">
  import type { ArchitectureCategory, ComplexityLevel } from '$lib/workbench/types/architecture';

  interface Props {
    searchQuery: string;
    categoryFilter: ArchitectureCategory | 'all';
    complexityFilter: ComplexityLevel | 'all';
    showRecommended: boolean;
    onSearchChange: (value: string) => void;
    onCategoryChange: (value: ArchitectureCategory | 'all') => void;
    onComplexityChange: (value: ComplexityLevel | 'all') => void;
    onRecommendedToggle: (value: boolean) => void;
  }

  let {
    searchQuery,
    categoryFilter,
    complexityFilter,
    showRecommended,
    onSearchChange,
    onCategoryChange,
    onComplexityChange,
    onRecommendedToggle
  }: Props = $props();

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

<div class="bg-gunmetal-900 border border-gunmetal-700 rounded-lg p-4 space-y-4">
  <!-- Search -->
  <div>
    <label for="pattern-search" class="sr-only">Search patterns</label>
    <input
      id="pattern-search"
      type="text"
      value={searchQuery}
      oninput={(e) => onSearchChange(e.currentTarget.value)}
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
        value={categoryFilter}
        onchange={(e) => onCategoryChange(e.currentTarget.value as ArchitectureCategory | 'all')}
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
        value={complexityFilter}
        onchange={(e) => onComplexityChange(e.currentTarget.value as ComplexityLevel | 'all')}
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
      checked={showRecommended}
      onchange={(e) => onRecommendedToggle(e.currentTarget.checked)}
      class="
        w-4 h-4 rounded
        bg-gunmetal-800 border-gunmetal-700
        text-ember-600 focus:ring-ember-500
      "
    />
    <span class="text-sm text-zinc-300">Show recommended patterns</span>
  </label>
</div>
