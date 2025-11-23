<!-- @component
Analytics Dashboard Component

Displays learning layer analytics including:
- Stack success rates
- User preferences
- Favorite stacks
- Model acceptance rates
- Session statistics
-->
<script lang="ts">
  import { onMount } from "svelte";
  import {
    learningStore,
    stackSuccessRates,
    userPreferences,
  } from "$lib/stores/learning";
  import type {
    StackSuccessRate,
    UserPreferenceSummary,
  } from "$lib/types/learning";

  export let userId: number | null = null;

  let loading = true;
  let error: string | null = null;
  let successRates: StackSuccessRate[] = [];
  let preferences: UserPreferenceSummary | null = null;
  let favoriteStacks: { stack_id: string; count: number }[] = [];
  let abandonmentData: {
    total_sessions: number;
    abandoned_count: number;
    abandonment_rate: number;
  } | null = null;

  // Subscribe to learning store
  $: successRates = $stackSuccessRates;
  $: preferences = $userPreferences;

  onMount(async () => {
    await loadAnalytics();
  });

  async function loadAnalytics() {
    loading = true;
    error = null;

    try {
      // Refresh all analytics data
      await learningStore.refreshAnalytics(userId || undefined);

      // Get favorite stacks if user ID provided
      if (userId) {
        await learningStore.fetchFavoriteStacks(userId);
        favoriteStacks = learningStore.subscribe(
          (state) => state.favoriteStacks
        );
      }

      // Get abandonment data
      const abandonment = await learningStore.getAbandonedSessions(30);
      abandonmentData = abandonment;
    } catch (err) {
      console.error("Failed to load analytics:", err);
      error = "Failed to load analytics data. Please try again.";
    } finally {
      loading = false;
    }
  }

  function getSuccessColor(rate: number): string {
    if (rate >= 0.8) return "text-green-600 bg-green-50 border-green-200";
    if (rate >= 0.6) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  }

  function getSuccessIcon(rate: number): string {
    if (rate >= 0.8) return "✅";
    if (rate >= 0.6) return "⚠️";
    return "❌";
  }

  function formatPercentage(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  function formatTime(seconds: number | undefined): string {
    if (!seconds) return "N/A";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  }
</script>

<div class="analytics-dashboard">
  {#if loading}
    <div class="flex items-center justify-center p-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"
      />
    </div>
  {:else if error}
    <div class="p-6 bg-red-50 border-2 border-red-200 rounded-xl">
      <div class="flex items-start gap-3">
        <svg
          class="w-6 h-6 text-red-600 shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
        <div>
          <h3 class="font-semibold text-red-900">Error Loading Analytics</h3>
          <p class="text-red-700 text-sm mt-1">{error}</p>
          <button
            on:click={loadAnalytics}
            class="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  {:else}
    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-gray-900 mb-2">Learning Analytics</h2>
      <p class="text-gray-600">
        Insights from historical project data to guide your decisions
      </p>
    </div>

    <!-- Stack Success Rates -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-gray-900">Stack Success Rates</h3>
        {#if successRates.length > 0}
          <span class="text-sm text-gray-500">
            {successRates.length} stacks analyzed
          </span>
        {/if}
      </div>

      {#if successRates.length === 0}
        <div
          class="p-8 bg-gray-50 border-2 border-gray-200 rounded-xl text-center"
        >
          <svg
            class="w-16 h-16 text-gray-400 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p class="text-gray-600 font-medium">
            No analytics data available yet
          </p>
          <p class="text-gray-500 text-sm mt-1">
            Complete more projects to see success rates and recommendations
          </p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each successRates as stack}
            <div
              class="p-5 bg-white border-2 rounded-xl hover:shadow-lg transition {getSuccessColor(
                stack.success_rate
              )}"
            >
              <div class="flex items-start justify-between mb-3">
                <div>
                  <h4 class="font-bold text-gray-900">{stack.stack_id}</h4>
                  <p class="text-sm text-gray-600">{stack.total_uses} uses</p>
                </div>
                <span class="text-2xl"
                  >{getSuccessIcon(stack.success_rate)}</span
                >
              </div>

              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Success Rate</span>
                  <span class="font-bold"
                    >{formatPercentage(stack.success_rate)}</span
                  >
                </div>

                {#if stack.avg_build_time}
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Avg Build Time</span>
                    <span class="font-medium"
                      >{formatTime(stack.avg_build_time)}</span
                    >
                  </div>
                {/if}

                {#if stack.avg_test_pass_rate}
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Test Pass Rate</span>
                    <span class="font-medium"
                      >{formatPercentage(stack.avg_test_pass_rate)}</span
                    >
                  </div>
                {/if}

                {#if stack.avg_satisfaction}
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">User Satisfaction</span>
                    <span class="font-medium"
                      >{stack.avg_satisfaction.toFixed(1)}/5</span
                    >
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- User Preferences -->
    {#if preferences}
      <div class="mb-8">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Your Preferences</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Total Projects -->
          <div class="p-5 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
            <div class="flex items-center gap-3">
              <div class="p-3 bg-indigo-100 rounded-lg">
                <svg
                  class="w-6 h-6 text-indigo-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                  />
                </svg>
              </div>
              <div>
                <p class="text-sm text-indigo-600 font-medium">
                  Total Projects
                </p>
                <p class="text-2xl font-bold text-indigo-900">
                  {preferences.total_projects}
                </p>
              </div>
            </div>
          </div>

          <!-- Completion Rate -->
          <div class="p-5 bg-green-50 border-2 border-green-200 rounded-xl">
            <div class="flex items-center gap-3">
              <div class="p-3 bg-green-100 rounded-lg">
                <svg
                  class="w-6 h-6 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p class="text-sm text-green-600 font-medium">
                  Completion Rate
                </p>
                <p class="text-2xl font-bold text-green-900">
                  {formatPercentage(preferences.completion_rate)}
                </p>
              </div>
            </div>
          </div>

          <!-- Avg Complexity -->
          <div class="p-5 bg-purple-50 border-2 border-purple-200 rounded-xl">
            <div class="flex items-center gap-3">
              <div class="p-3 bg-purple-100 rounded-lg">
                <svg
                  class="w-6 h-6 text-purple-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z"
                  />
                </svg>
              </div>
              <div>
                <p class="text-sm text-purple-600 font-medium">
                  Avg Complexity
                </p>
                <p class="text-2xl font-bold text-purple-900">
                  {preferences.avg_complexity.toFixed(1)}/10
                </p>
              </div>
            </div>
          </div>

          <!-- Total Sessions -->
          <div class="p-5 bg-amber-50 border-2 border-amber-200 rounded-xl">
            <div class="flex items-center gap-3">
              <div class="p-3 bg-amber-100 rounded-lg">
                <svg
                  class="w-6 h-6 text-amber-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p class="text-sm text-amber-600 font-medium">Total Sessions</p>
                <p class="text-2xl font-bold text-amber-900">
                  {preferences.total_sessions}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Favorite Languages & Stacks -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <!-- Favorite Languages -->
          {#if preferences.favorite_languages.length > 0}
            <div class="p-5 bg-white border-2 border-gray-200 rounded-xl">
              <h4 class="font-bold text-gray-900 mb-3">Favorite Languages</h4>
              <div class="flex flex-wrap gap-2">
                {#each preferences.favorite_languages as lang}
                  <span
                    class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                  >
                    {lang}
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Favorite Stacks -->
          {#if preferences.favorite_stacks.length > 0}
            <div class="p-5 bg-white border-2 border-gray-200 rounded-xl">
              <h4 class="font-bold text-gray-900 mb-3">Favorite Stacks</h4>
              <div class="flex flex-wrap gap-2">
                {#each preferences.favorite_stacks as stack}
                  <span
                    class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                  >
                    {stack}
                  </span>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Session Statistics -->
    {#if abandonmentData}
      <div class="mb-8">
        <h3 class="text-xl font-bold text-gray-900 mb-4">
          Session Statistics (Last 30 Days)
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-5 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <p class="text-sm text-blue-600 font-medium mb-1">Total Sessions</p>
            <p class="text-3xl font-bold text-blue-900">
              {abandonmentData.total_sessions}
            </p>
          </div>

          <div class="p-5 bg-red-50 border-2 border-red-200 rounded-xl">
            <p class="text-sm text-red-600 font-medium mb-1">Abandoned</p>
            <p class="text-3xl font-bold text-red-900">
              {abandonmentData.abandoned_count}
            </p>
          </div>

          <div
            class="p-5 border-2 rounded-xl {abandonmentData.abandonment_rate <
            0.2
              ? 'bg-green-50 border-green-200'
              : abandonmentData.abandonment_rate < 0.4
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'}"
          >
            <p
              class="text-sm font-medium mb-1 {abandonmentData.abandonment_rate <
              0.2
                ? 'text-green-600'
                : abandonmentData.abandonment_rate < 0.4
                ? 'text-yellow-600'
                : 'text-red-600'}"
            >
              Abandonment Rate
            </p>
            <p
              class="text-3xl font-bold {abandonmentData.abandonment_rate < 0.2
                ? 'text-green-900'
                : abandonmentData.abandonment_rate < 0.4
                ? 'text-yellow-900'
                : 'text-red-900'}"
            >
              {formatPercentage(abandonmentData.abandonment_rate)}
            </p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Refresh Button -->
    <div class="flex justify-center">
      <button
        on:click={loadAnalytics}
        class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center gap-2"
      >
        <svg
          class="w-5 h-5"
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
        Refresh Analytics
      </button>
    </div>
  {/if}
</div>

<style>
  .analytics-dashboard {
    @apply w-full;
  }
</style>
