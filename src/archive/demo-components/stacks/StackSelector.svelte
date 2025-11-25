<!-- @component
no description yet
-->
<script lang="ts">
  import { onMount } from "svelte";
  import type {
    StackProfile,
    StackCategory,
  } from "$lib/core/types/stack-profiles";
  import { ALL_STACKS } from "$lib/data/stack-profiles";
  import StackCard from "./StackCard.svelte";
  import StackComparison from "./StackComparison.svelte";

  export let selectedStackId: string | null = null;
  export let onSelect: ((stack: StackProfile) => void) | undefined = undefined;
  export let multiSelect = false;
  export let showComparison = false;
  export let filterLanguages: string[] = []; // Language IDs to filter by

  let stacks: StackProfile[] = [];
  let filteredStacks: StackProfile[] = [];
  let loading = true;
  let error: string | null = null;

  // Filters
  let searchQuery = "";
  let selectedCategory: StackCategory | "all" = "all";
  let selectedComplexity: string = "all";
  let sortBy: "popularity" | "name" | "complexity" = "popularity";

  // Multi-select state
  let selectedStacks: Set<string> = new Set();
  $: if (!multiSelect && selectedStackId) {
    selectedStacks = new Set([selectedStackId]);
  }

  // Comparison mode
  $: comparisonStacks = Array.from(selectedStacks)
    .map((id) => stacks.find((s) => s.id === id))
    .filter((s): s is StackProfile => s !== undefined);

  const categories: Array<{ value: StackCategory | "all"; label: string }> = [
    { value: "all", label: "All Stacks" },
    { value: "web", label: "Web" },
    { value: "mobile", label: "Mobile" },
    { value: "desktop", label: "Desktop" },
    { value: "fullstack", label: "Full Stack" },
    { value: "backend", label: "Backend" },
    { value: "ai", label: "AI/ML" },
  ];

  const complexities = [
    { value: "all", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "expert", label: "Expert" },
  ];

  onMount(async () => {
    try {
      loading = true;
      // Use local stack data
      stacks = ALL_STACKS;
      applyFilters();
      error = null;
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
    } finally {
      loading = false;
    }
  });

  function applyFilters() {
    let result = [...stacks];

    // Language compatibility filter (from parent component)
    if (filterLanguages.length > 0) {
      result = result.filter((s) =>
        filterLanguages.every((langId) =>
          s.compatibleLanguages.includes(langId)
        )
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.features.some((f) => f.toLowerCase().includes(query)) ||
          Object.values(s.technologies)
            .flat()
            .some((t: string) => t.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((s) => s.category === selectedCategory);
    }

    // Complexity filter
    if (selectedComplexity !== "all") {
      result = result.filter((s) => s.complexity === selectedComplexity);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "popularity") {
        return b.popularity - a.popularity;
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "complexity") {
        const order = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };
        return order[a.complexity] - order[b.complexity];
      }
      return 0;
    });

    filteredStacks = result;
  }

  $: {
    searchQuery;
    selectedCategory;
    selectedComplexity;
    sortBy;
    filterLanguages;
    applyFilters();
  }

  function handleStackClick(stack: StackProfile) {
    if (multiSelect) {
      if (selectedStacks.has(stack.id)) {
        selectedStacks.delete(stack.id);
      } else {
        selectedStacks.add(stack.id);
      }
      selectedStacks = selectedStacks; // Trigger reactivity
    } else {
      selectedStackId = stack.id;
      onSelect?.(stack);
    }
  }

  async function loadRecommendations() {
    try {
      // Basic local recommendation: sort by popularity
      // In a real app, this would call the API
      applyFilters();
    } catch (err) {
      console.error("Failed to load recommendations:", err);
    }
  }
</script>

<div class="stack-selector">
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"
      />
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
      <strong>Error:</strong>
      {error}
    </div>
  {:else if showComparison && comparisonStacks.length >= 2}
    <div class="mb-4">
      <button
        class="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-2"
        on:click={() => (showComparison = false)}
      >
        ← Back to selection
      </button>
    </div>
    <StackComparison stacks={comparisonStacks} />
  {:else}
    <!-- Filters -->
    <div class="mb-6 space-y-4">
      <!-- Search -->
      <div class="relative">
        <input
          type="text"
          placeholder="Search stacks, technologies, features..."
          class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          bind:value={searchQuery}
        />
        <svg
          class="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <!-- Filter row -->
      <div class="flex flex-wrap gap-3">
        <!-- Category -->
        <select
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          bind:value={selectedCategory}
        >
          {#each categories as cat}
            <option value={cat.value}>{cat.label}</option>
          {/each}
        </select>

        <!-- Complexity -->
        <select
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          bind:value={selectedComplexity}
        >
          {#each complexities as comp}
            <option value={comp.value}>{comp.label}</option>
          {/each}
        </select>

        <!-- Sort -->
        <select
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          bind:value={sortBy}
        >
          <option value="popularity">Most Popular</option>
          <option value="name">Name (A-Z)</option>
          <option value="complexity">Complexity</option>
        </select>

        <!-- Recommendations button -->
        <button
          class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-medium text-sm"
          on:click={loadRecommendations}
        >
          ✨ Get Recommendations
        </button>

        {#if multiSelect && selectedStacks.size >= 2}
          <button
            class="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
            on:click={() => (showComparison = true)}
          >
            Compare ({selectedStacks.size})
          </button>
        {/if}
      </div>
    </div>

    <!-- Results count -->
    <div class="mb-4 text-sm text-gray-600">
      Showing {filteredStacks.length} of {stacks.length} stacks
      {#if multiSelect && selectedStacks.size > 0}
        <span class="text-indigo-600 font-medium">
          • {selectedStacks.size} selected
        </span>
      {/if}
    </div>

    <!-- Stack grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each filteredStacks as stack (stack.id)}
        <StackCard
          {stack}
          selected={selectedStacks.has(stack.id)}
          onClick={() => handleStackClick(stack)}
        />
      {/each}
    </div>

    {#if filteredStacks.length === 0}
      <div class="text-center py-12 text-gray-500">
        <p class="text-lg font-medium mb-2">No stacks found</p>
        <p class="text-sm">Try adjusting your filters or search query</p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .stack-selector {
    width: 100%;
  }
</style>
