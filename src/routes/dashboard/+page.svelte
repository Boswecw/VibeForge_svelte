<!--
  Dashboard Page - Project Outcomes & Feedback Tracking
  Phase 3.4: Outcome Tracking & Feedback Loop
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { projectOutcomesStore } from '$lib/stores/projectOutcomes.svelte';
  import ProjectCard from '$lib/components/ProjectCard.svelte';
  import FeedbackModal from '$lib/workbench/components/Feedback/FeedbackModal.svelte';
  import type { ProjectStatus } from '$lib/types/outcome';

  // Local state
  let searchQuery = $state('');
  let selectedStatus = $state<ProjectStatus | 'all'>('all');
  let selectedPattern = $state<string>('all');

  // Store state
  let outcomes = $derived(projectOutcomesStore.outcomes);
  let isLoading = $derived(projectOutcomesStore.isLoadingOutcomes);
  let currentPage = $derived(projectOutcomesStore.currentPage);
  let totalPages = $derived(projectOutcomesStore.totalPages);
  let dashboardSummary = $derived(projectOutcomesStore.dashboardSummary);
  let showFeedbackModal = $derived(projectOutcomesStore.showFeedbackModal);
  let pendingFeedback = $derived(projectOutcomesStore.pendingFeedback);

  // Computed
  let filteredOutcomes = $derived(() => {
    let filtered = outcomes;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.projectName.toLowerCase().includes(query) ||
          o.patternName.toLowerCase().includes(query) ||
          o.projectPath.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((o) => o.status === selectedStatus);
    }

    // Filter by pattern
    if (selectedPattern !== 'all') {
      filtered = filtered.filter((o) => o.patternId === selectedPattern);
    }

    return filtered;
  });

  let uniquePatterns = $derived(() => {
    const patterns = new Set(outcomes.map((o) => ({ id: o.patternId, name: o.patternName })));
    return Array.from(patterns);
  });

  let pendingFeedbackProject = $derived(
    pendingFeedback ? outcomes.find((o) => o.id === pendingFeedback) : null
  );

  // Lifecycle
  onMount(() => {
    projectOutcomesStore.fetchOutcomes(1);
    projectOutcomesStore.fetchDashboardSummary();
  });

  // Methods
  function handlePageChange(page: number) {
    projectOutcomesStore.fetchOutcomes(page);
  }

  function handleRefresh() {
    projectOutcomesStore.fetchOutcomes(currentPage);
    projectOutcomesStore.fetchDashboardSummary();
  }

  function clearFilters() {
    searchQuery = '';
    selectedStatus = 'all';
    selectedPattern = 'all';
  }
</script>

<svelte:head>
  <title>Dashboard - VibeForge</title>
</svelte:head>

<div class="dashboard-page flex flex-col h-full bg-forge-blacksteel overflow-hidden">
  <!-- Header -->
  <div class="border-b border-gunmetal-700 bg-gunmetal-900 px-6 py-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-zinc-100">Project Dashboard</h1>
        <p class="text-sm text-zinc-400 mt-1">
          Track your scaffolded projects and provide feedback
        </p>
      </div>

      <button
        type="button"
        class="flex items-center gap-2 px-4 py-2 bg-ember-500 text-white rounded-md hover:bg-ember-600 transition-colors"
        onclick={handleRefresh}
        disabled={isLoading}
      >
        <svg
          class="w-4 h-4 {isLoading ? 'animate-spin' : ''}"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Refresh
      </button>
    </div>

    <!-- Summary Stats -->
    {#if dashboardSummary}
      <div class="grid grid-cols-4 gap-4 mt-4">
        <div class="stat-card">
          <div class="text-3xl font-bold text-zinc-100">
            {dashboardSummary.totalProjects}
          </div>
          <div class="text-sm text-zinc-400">Total Projects</div>
        </div>

        <div class="stat-card">
          <div class="text-3xl font-bold text-green-500">
            {dashboardSummary.activeProjects}
          </div>
          <div class="text-sm text-zinc-400">Active</div>
        </div>

        <div class="stat-card">
          <div class="text-3xl font-bold text-zinc-500">
            {dashboardSummary.archivedProjects}
          </div>
          <div class="text-sm text-zinc-400">Archived</div>
        </div>

        <div class="stat-card">
          <div class="text-3xl font-bold text-ember-500">
            {dashboardSummary.averageSatisfaction?.toFixed(1) || 'N/A'}
          </div>
          <div class="text-sm text-zinc-400">Avg Rating</div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Filters -->
  <div class="border-b border-gunmetal-700 bg-gunmetal-900 px-6 py-3">
    <div class="flex items-center gap-4">
      <!-- Search -->
      <div class="flex-1">
        <div class="relative">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
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
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search projects..."
            class="w-full pl-10 pr-4 py-2 bg-gunmetal-800 border border-gunmetal-700 rounded-md text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-ember-500"
          />
        </div>
      </div>

      <!-- Status Filter -->
      <select
        bind:value={selectedStatus}
        class="px-4 py-2 bg-gunmetal-800 border border-gunmetal-700 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-ember-500"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="archived">Archived</option>
        <option value="deleted">Deleted</option>
      </select>

      <!-- Pattern Filter -->
      <select
        bind:value={selectedPattern}
        class="px-4 py-2 bg-gunmetal-800 border border-gunmetal-700 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-ember-500"
      >
        <option value="all">All Patterns</option>
        {#each uniquePatterns() as pattern}
          <option value={pattern.id}>{pattern.name}</option>
        {/each}
      </select>

      <!-- Clear Filters -->
      {#if searchQuery || selectedStatus !== 'all' || selectedPattern !== 'all'}
        <button
          type="button"
          class="px-4 py-2 bg-gunmetal-700 text-zinc-300 rounded-md hover:bg-gunmetal-600 transition-colors"
          onclick={clearFilters}
        >
          Clear
        </button>
      {/if}
    </div>
  </div>

  <!-- Projects Grid -->
  <div class="flex-1 overflow-y-auto p-6">
    {#if isLoading && outcomes.length === 0}
      <!-- Loading State -->
      <div class="flex items-center justify-center h-64">
        <div class="text-center">
          <svg
            class="animate-spin h-8 w-8 text-ember-500 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p class="text-zinc-400">Loading projects...</p>
        </div>
      </div>
    {:else if filteredOutcomes().length === 0}
      <!-- Empty State -->
      <div class="flex items-center justify-center h-64">
        <div class="text-center">
          <svg
            class="w-16 h-16 text-zinc-600 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 class="text-lg font-semibold text-zinc-300 mb-1">No projects found</h3>
          <p class="text-sm text-zinc-500">
            {#if searchQuery || selectedStatus !== 'all' || selectedPattern !== 'all'}
              Try adjusting your filters or search query
            {:else}
              Start scaffolding projects to see them here
            {/if}
          </p>
        </div>
      </div>
    {:else}
      <!-- Projects Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {#each filteredOutcomes() as project (project.id)}
          <ProjectCard {project} />
        {/each}
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="flex items-center justify-center gap-2 mt-6">
          <button
            type="button"
            class="px-4 py-2 bg-gunmetal-700 text-zinc-300 rounded-md hover:bg-gunmetal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onclick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            Previous
          </button>

          <div class="flex items-center gap-1">
            {#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1) as page}
              <button
                type="button"
                class="px-3 py-1 rounded-md {currentPage === page
                  ? 'bg-ember-500 text-white'
                  : 'bg-gunmetal-700 text-zinc-300 hover:bg-gunmetal-600'} transition-colors"
                onclick={() => handlePageChange(page)}
                disabled={isLoading}
              >
                {page}
              </button>
            {/each}
            {#if totalPages > 5}
              <span class="text-zinc-500">...</span>
              <button
                type="button"
                class="px-3 py-1 rounded-md bg-gunmetal-700 text-zinc-300 hover:bg-gunmetal-600 transition-colors"
                onclick={() => handlePageChange(totalPages)}
                disabled={isLoading}
              >
                {totalPages}
              </button>
            {/if}
          </div>

          <button
            type="button"
            class="px-4 py-2 bg-gunmetal-700 text-zinc-300 rounded-md hover:bg-gunmetal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onclick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            Next
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- Feedback Modal -->
{#if showFeedbackModal && pendingFeedbackProject}
  <FeedbackModal
    projectOutcomeId={pendingFeedbackProject.id}
    projectName={pendingFeedbackProject.projectName}
    patternName={pendingFeedbackProject.patternName}
  />
{/if}

<style>
  .stat-card {
    padding: 16px;
    background: rgba(63, 63, 70, 0.3);
    border: 1px solid #3f3f46;
    border-radius: 12px;
  }
</style>
