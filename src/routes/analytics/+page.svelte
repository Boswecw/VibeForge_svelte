<script lang="ts">
  /**
   * Analytics Dashboard
   * Phase 3.6: Success Prediction & Analytics Dashboard
   *
   * Displays comprehensive analytics on pattern performance, success rates,
   * and project trends using historical outcome data.
   */

  import { onMount } from 'svelte';
  import { successPredictor } from '$lib/services/successPredictor';
  import type {
    AnalyticsSummary,
    PatternPerformance,
    TrendDataPoint,
  } from '$lib/types/success-prediction';
  import { projectOutcomesStore } from '$lib/stores/projectOutcomes.svelte';
  import { formatProbability } from '$lib/types/success-prediction';
  import type { TrendPeriod } from '$lib/stores/trendData.svelte';

  // State
  let summary = $state<AnalyticsSummary | null>(null);
  let patternPerformance = $state<PatternPerformance[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let selectedPatternId = $state<string | null>(null);
  let selectedPeriod = $state<TrendPeriod>(30); // Default to 30 days

  // Load analytics data
  onMount(async () => {
    await loadAnalytics();
  });

  async function loadAnalytics() {
    isLoading = true;
    error = null;

    try {
      // Fetch summary
      summary = await successPredictor.getAnalyticsSummary();

      // Fetch pattern performance for all patterns
      await projectOutcomesStore.fetchAnalytics();
      const analytics = projectOutcomesStore.analytics;

      const performances: PatternPerformance[] = [];
      for (const pattern of analytics) {
        const perf = await successPredictor.getPatternPerformance(pattern.patternId);
        if (perf) {
          performances.push(perf);
        }
      }

      // Sort by success rate descending
      patternPerformance = performances.sort((a, b) => b.successRate - a.successRate);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load analytics';
      console.error('Analytics load error:', err);
    } finally {
      isLoading = false;
    }
  }

  function selectPattern(patternId: string) {
    selectedPatternId = selectedPatternId === patternId ? null : patternId;
  }

  function getSuccessRateColor(rate: number): string {
    if (rate >= 80) return 'text-green-400';
    if (rate >= 60) return 'text-yellow-400';
    return 'text-red-400';
  }

  function getSatisfactionColor(rating: number): string {
    if (rating >= 4) return 'text-green-400';
    if (rating >= 3) return 'text-yellow-400';
    return 'text-red-400';
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Export functions
  function exportToCSV() {
    if (!patternPerformance.length) return;

    const headers = [
      'Pattern Name',
      'Pattern ID',
      'Total Projects',
      'Successful Projects',
      'Success Rate (%)',
      'Avg Satisfaction',
      'Avg Test Pass Rate (%)',
      'NPS Score',
      'Deployed Projects',
      'Last Updated'
    ];

    const rows = patternPerformance.map(p => [
      p.patternName,
      p.patternId,
      p.totalProjects,
      p.successfulProjects,
      p.successRate.toFixed(2),
      p.averageSatisfaction.toFixed(2),
      p.averageTestPassRate.toFixed(2),
      p.npsScore,
      p.deployedProjects,
      p.lastUpdated
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    downloadFile(csv, `vibeforge-analytics-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  }

  function exportToJSON() {
    if (!summary || !patternPerformance.length) return;

    const data = {
      exportDate: new Date().toISOString(),
      period: `${selectedPeriod} days`,
      summary,
      patternPerformance
    };

    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `vibeforge-analytics-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  }

  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function setPeriod(period: number) {
    selectedPeriod = period as TrendPeriod;
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-zinc-100">
  <!-- Header -->
  <div class="border-b border-zinc-700/50 bg-zinc-900/80 backdrop-blur-sm">
    <div class="container mx-auto px-6 py-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p class="mt-2 text-zinc-400">Project success metrics and pattern performance insights</p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Export Dropdown -->
          <div class="relative group">
            <button
              class="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors flex items-center gap-2"
              disabled={isLoading || !patternPerformance.length}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
            <div class="absolute right-0 mt-2 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onclick={exportToCSV}
                class="w-full px-4 py-2 text-left hover:bg-zinc-700 transition-colors first:rounded-t-lg flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              <button
                onclick={exportToJSON}
                class="w-full px-4 py-2 text-left hover:bg-zinc-700 transition-colors last:rounded-b-lg flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Export JSON
              </button>
            </div>
          </div>

          <!-- Refresh Button -->
          <button
            onclick={loadAnalytics}
            class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2"
            disabled={isLoading}
          >
            <svg class="w-4 h-4" class:animate-spin={isLoading} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <!-- Date Range Selector -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-zinc-400">Time Period:</span>
        <div class="flex gap-2">
          {#each [7, 30, 90] as period}
            <button
              onclick={() => setPeriod(period)}
              class="px-3 py-1.5 text-sm rounded-lg transition-colors {selectedPeriod === period ? 'bg-blue-600 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}"
              disabled={isLoading}
            >
              {period} days
            </button>
          {/each}
        </div>
        {#if selectedPeriod}
          <span class="text-xs text-zinc-500 ml-2">Showing last {selectedPeriod} days of data</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="container mx-auto px-6 py-8">
    {#if error}
      <!-- Error State -->
      <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
        <p class="text-red-400">{error}</p>
        <button
          onclick={loadAnalytics}
          class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    {:else if isLoading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-20">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="mt-4 text-zinc-400">Loading analytics data...</p>
        </div>
      </div>
    {:else if summary}
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Total Projects Card -->
        <div class="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-zinc-400 text-sm">Total Projects</p>
              <p class="text-3xl font-bold mt-2">{summary.totalProjects}</p>
            </div>
            <div class="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Success Rate Card -->
        <div class="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-zinc-400 text-sm">Overall Success Rate</p>
              <p class="text-3xl font-bold mt-2 {getSuccessRateColor(summary.overallSuccessRate)}">
                {formatProbability(summary.overallSuccessRate)}
              </p>
            </div>
            <div class="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Average Satisfaction Card -->
        <div class="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-zinc-400 text-sm">Avg Satisfaction</p>
              <p class="text-3xl font-bold mt-2 {getSatisfactionColor(summary.averageSatisfaction)}">
                {summary.averageSatisfaction.toFixed(1)}/5
              </p>
            </div>
            <div class="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Total Feedback Card -->
        <div class="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-zinc-400 text-sm">Total Feedback</p>
              <p class="text-3xl font-bold mt-2">{summary.totalFeedback}</p>
            </div>
            <div class="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Performers -->
      {#if summary.topPattern || summary.mostUsedPattern}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {#if summary.topPattern}
            <div class="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-6">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-green-400">Top Performing Pattern</h3>
              </div>
              <p class="text-2xl font-bold">{summary.topPattern.name}</p>
              <p class="text-zinc-400 mt-2">
                Success Rate: <span class="text-green-400 font-semibold">{formatProbability(summary.topPattern.successRate)}</span>
              </p>
            </div>
          {/if}

          {#if summary.mostUsedPattern}
            <div class="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg p-6">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 class="text-lg font-semibold text-blue-400">Most Used Pattern</h3>
              </div>
              <p class="text-2xl font-bold">{summary.mostUsedPattern.name}</p>
              <p class="text-zinc-400 mt-2">
                Projects: <span class="text-blue-400 font-semibold">{summary.mostUsedPattern.usageCount}</span>
              </p>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Pattern Performance Table -->
      <div class="bg-zinc-800/50 border border-zinc-700/50 rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-zinc-700/50">
          <h2 class="text-xl font-semibold">Pattern Performance Comparison</h2>
          <p class="text-sm text-zinc-400 mt-1">Click a pattern to view detailed trends</p>
        </div>

        {#if patternPerformance.length === 0}
          <div class="p-12 text-center text-zinc-400">
            <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>No pattern performance data available yet.</p>
            <p class="text-sm mt-2">Create projects and submit feedback to see analytics.</p>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-zinc-900/50">
                <tr class="text-left text-sm text-zinc-400">
                  <th class="px-6 py-3 font-medium">Pattern</th>
                  <th class="px-6 py-3 font-medium text-center">Total Projects</th>
                  <th class="px-6 py-3 font-medium text-center">Success Rate</th>
                  <th class="px-6 py-3 font-medium text-center">Avg Satisfaction</th>
                  <th class="px-6 py-3 font-medium text-center">Test Pass Rate</th>
                  <th class="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-700/50">
                {#each patternPerformance as pattern}
                  <tr class="hover:bg-zinc-700/30 transition-colors">
                    <td class="px-6 py-4">
                      <div class="font-medium">{pattern.patternName}</div>
                      <div class="text-sm text-zinc-400">{pattern.patternId}</div>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-zinc-700/50 text-zinc-300">
                        {pattern.totalProjects}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <span class="text-lg font-semibold {getSuccessRateColor(pattern.successRate)}">
                        {formatProbability(pattern.successRate)}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <div class="flex items-center justify-center gap-1">
                        <span class="text-lg font-semibold {getSatisfactionColor(pattern.averageSatisfaction)}">
                          {pattern.averageSatisfaction.toFixed(1)}
                        </span>
                        <span class="text-zinc-500">/5</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-center">
                      <span class="text-lg font-semibold {getSuccessRateColor(pattern.averageTestPassRate)}">
                        {formatProbability(pattern.averageTestPassRate)}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <button
                        onclick={() => selectPattern(pattern.patternId)}
                        class="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                      >
                        {selectedPatternId === pattern.patternId ? 'Hide Trends' : 'View Trends'}
                      </button>
                    </td>
                  </tr>

                  {#if selectedPatternId === pattern.patternId}
                    <tr>
                      <td colspan="6" class="px-6 py-6 bg-zinc-900/50">
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <!-- Success Rate Trend -->
                          <div class="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
                            <h4 class="text-sm font-medium text-zinc-400 mb-3">Success Rate Trend ({selectedPeriod} days)</h4>
                            <div class="h-32 flex items-end justify-between gap-1">
                              {#each pattern.trends.successRate as point, i}
                                <div class="flex-1 flex flex-col items-center">
                                  <div
                                    class="w-full bg-gradient-to-t from-green-500/50 to-green-400/50 rounded-t transition-all hover:opacity-80"
                                    style="height: {(point.value / 100) * 100}%"
                                    title="{point.label}: {point.value.toFixed(1)}%"
                                  ></div>
                                  {#if i % 5 === 0}
                                    <span class="text-[10px] text-zinc-500 mt-1">{point.label}</span>
                                  {/if}
                                </div>
                              {/each}
                            </div>
                          </div>

                          <!-- Satisfaction Trend -->
                          <div class="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
                            <h4 class="text-sm font-medium text-zinc-400 mb-3">Satisfaction Trend ({selectedPeriod} days)</h4>
                            <div class="h-32 flex items-end justify-between gap-1">
                              {#each pattern.trends.satisfaction as point, i}
                                <div class="flex-1 flex flex-col items-center">
                                  <div
                                    class="w-full bg-gradient-to-t from-yellow-500/50 to-yellow-400/50 rounded-t transition-all hover:opacity-80"
                                    style="height: {(point.value / 100) * 100}%"
                                    title="{point.label}: {point.value.toFixed(1)}/5"
                                  ></div>
                                  {#if i % 5 === 0}
                                    <span class="text-[10px] text-zinc-500 mt-1">{point.label}</span>
                                  {/if}
                                </div>
                              {/each}
                            </div>
                          </div>

                          <!-- Usage Trend -->
                          <div class="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
                            <h4 class="text-sm font-medium text-zinc-400 mb-3">Usage Trend ({selectedPeriod} days)</h4>
                            <div class="h-32 flex items-end justify-between gap-1">
                              {#each pattern.trends.usage as point, i}
                                <div class="flex-1 flex flex-col items-center">
                                  <div
                                    class="w-full bg-gradient-to-t from-blue-500/50 to-blue-400/50 rounded-t transition-all hover:opacity-80"
                                    style="height: {point.value > 0 ? Math.max((point.value / Math.max(...pattern.trends.usage.map(p => p.value))) * 100, 5) : 0}%"
                                    title="{point.label}: {point.value.toFixed(1)} projects"
                                  ></div>
                                  {#if i % 5 === 0}
                                    <span class="text-[10px] text-zinc-500 mt-1">{point.label}</span>
                                  {/if}
                                </div>
                              {/each}
                            </div>
                          </div>
                        </div>

                        <div class="mt-4 text-xs text-zinc-500 text-right">
                          Last updated: {formatDate(pattern.lastUpdated)}
                        </div>
                      </td>
                    </tr>
                  {/if}
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="mt-8 text-center text-sm text-zinc-500">
        <p>Last updated: {formatDate(summary.lastUpdated)}</p>
      </div>
    {:else}
      <!-- No Data State -->
      <div class="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-12 text-center">
        <svg class="w-20 h-20 mx-auto mb-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 class="text-xl font-semibold text-zinc-300 mb-2">No Analytics Data Available</h3>
        <p class="text-zinc-400">Create projects and submit feedback to see analytics here.</p>
      </div>
    {/if}
  </div>
</div>
