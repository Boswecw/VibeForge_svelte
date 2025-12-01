<script lang="ts">
  import type { TeamInsightsResponse } from '$lib/types/team';
  import { Sparkles, TrendingUp, Lightbulb, Target } from 'lucide-svelte';

  interface Props {
    insights: TeamInsightsResponse | null;
    isLoading?: boolean;
  }

  let { insights, isLoading = false }: Props = $props();

  function formatSuccessRate(rate: number | undefined): string {
    if (!rate) return 'N/A';
    return `${(rate * 100).toFixed(1)}%`;
  }
</script>

<div class="team-insights-card bg-gunmetal-900 border border-gunmetal-700 rounded-lg p-6">
  <div class="flex items-center gap-2 mb-4">
    <Sparkles class="w-5 h-5 text-electric-blue-400" />
    <h2 class="text-lg font-semibold text-zinc-100">AI-Powered Insights</h2>
  </div>

  {#if isLoading}
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue-400"></div>
    </div>
  {:else if !insights}
    <div class="text-center py-8 text-zinc-400">
      <p>No insights available yet.</p>
      <p class="text-sm mt-2">Create projects and generate team insights to see AI recommendations.</p>
    </div>
  {:else}
    <!-- Success Rate Summary -->
    <div class="mb-6 p-4 bg-gunmetal-800 rounded-lg">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-zinc-400">Overall Success Rate</p>
          <p class="text-2xl font-bold text-forge-green-400">
            {formatSuccessRate(insights.overallSuccessRate)}
          </p>
        </div>
        <div class="text-right">
          <p class="text-sm text-zinc-400">Total Projects</p>
          <p class="text-lg font-semibold text-zinc-200">{insights.totalProjects}</p>
        </div>
      </div>
    </div>

    <!-- Recommended Languages -->
    {#if insights.recommendedLanguages.length > 0}
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-3">
          <TrendingUp class="w-4 h-4 text-forge-green-400" />
          <h3 class="text-sm font-semibold text-zinc-200">Recommended Languages</h3>
        </div>
        <div class="space-y-2">
          {#each insights.recommendedLanguages as recommendation}
            <div class="flex items-start gap-2 text-sm">
              <div class="w-1.5 h-1.5 rounded-full bg-forge-green-400 mt-1.5"></div>
              <p class="text-zinc-300">{recommendation}</p>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Recommended Stacks -->
    {#if insights.recommendedStacks.length > 0}
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-3">
          <Target class="w-4 h-4 text-electric-blue-400" />
          <h3 class="text-sm font-semibold text-zinc-200">Recommended Tech Stacks</h3>
        </div>
        <div class="space-y-2">
          {#each insights.recommendedStacks as recommendation}
            <div class="flex items-start gap-2 text-sm">
              <div class="w-1.5 h-1.5 rounded-full bg-electric-blue-400 mt-1.5"></div>
              <p class="text-zinc-300">{recommendation}</p>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Improvement Suggestions -->
    {#if insights.improvementSuggestions.length > 0}
      <div>
        <div class="flex items-center gap-2 mb-3">
          <Lightbulb class="w-4 h-4 text-warning-amber-400" />
          <h3 class="text-sm font-semibold text-zinc-200">Improvement Suggestions</h3>
        </div>
        <div class="space-y-2">
          {#each insights.improvementSuggestions as suggestion}
            <div class="flex items-start gap-2 text-sm">
              <div class="w-1.5 h-1.5 rounded-full bg-warning-amber-400 mt-1.5"></div>
              <p class="text-zinc-300">{suggestion}</p>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Session Stats -->
    <div class="mt-6 pt-6 border-t border-gunmetal-700">
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-zinc-400">Total Sessions</p>
          <p class="text-lg font-semibold text-zinc-200">{insights.totalSessions}</p>
        </div>
        <div>
          <p class="text-zinc-400">Avg Duration</p>
          <p class="text-lg font-semibold text-zinc-200">
            {insights.avgSessionDurationMinutes?.toFixed(1) || 'N/A'} min
          </p>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .team-insights-card {
    transition: border-color 0.2s;
  }

  .team-insights-card:hover {
    border-color: rgb(var(--color-electric-blue-500) / 0.5);
  }
</style>
