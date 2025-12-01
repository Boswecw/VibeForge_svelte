<script lang="ts">
  import type { TeamInsightsResponse } from '$lib/types/team';
  import { BarChart3, Code, Layers } from 'lucide-svelte';

  interface Props {
    insights: TeamInsightsResponse | null;
    isLoading?: boolean;
  }

  let { insights, isLoading = false }: Props = $props();

  function getSuccessRateColor(rate: number): string {
    if (rate >= 0.8) return 'text-forge-green-400';
    if (rate >= 0.6) return 'text-warning-amber-400';
    return 'text-danger-red-400';
  }

  function getSuccessRateBgColor(rate: number): string {
    if (rate >= 0.8) return 'bg-forge-green-400/10';
    if (rate >= 0.6) return 'bg-warning-amber-400/10';
    return 'bg-danger-red-400/10';
  }
</script>

<div class="team-metrics-card bg-gunmetal-900 border border-gunmetal-700 rounded-lg p-6">
  <div class="flex items-center gap-2 mb-4">
    <BarChart3 class="w-5 h-5 text-electric-blue-400" />
    <h2 class="text-lg font-semibold text-zinc-100">Team Metrics</h2>
  </div>

  {#if isLoading}
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue-400"></div>
    </div>
  {:else if !insights}
    <div class="text-center py-8 text-zinc-400">
      <p>No metrics available yet.</p>
    </div>
  {:else}
    <!-- Top Languages -->
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-3">
        <Code class="w-4 h-4 text-forge-green-400" />
        <h3 class="text-sm font-semibold text-zinc-200">Top Programming Languages</h3>
      </div>

      {#if insights.topLanguages.length === 0}
        <p class="text-sm text-zinc-400">No language data available</p>
      {:else}
        <div class="space-y-3">
          {#each insights.topLanguages.slice(0, 5) as lang}
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-zinc-200">{lang.language}</span>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-zinc-400">{lang.count} projects</span>
                  <span
                    class="text-xs font-semibold px-2 py-0.5 rounded {getSuccessRateBgColor(lang.successRate)} {getSuccessRateColor(lang.successRate)}"
                  >
                    {(lang.successRate * 100).toFixed(0)}% success
                  </span>
                </div>
              </div>
              <div class="w-full bg-gunmetal-800 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all duration-300"
                  class:bg-forge-green-400={lang.successRate >= 0.8}
                  class:bg-warning-amber-400={lang.successRate >= 0.6 && lang.successRate < 0.8}
                  class:bg-danger-red-400={lang.successRate < 0.6}
                  style="width: {(lang.count / insights.topLanguages[0].count) * 100}%"
                ></div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Top Stacks -->
    <div>
      <div class="flex items-center gap-2 mb-3">
        <Layers class="w-4 h-4 text-electric-blue-400" />
        <h3 class="text-sm font-semibold text-zinc-200">Top Tech Stacks</h3>
      </div>

      {#if insights.topStacks.length === 0}
        <p class="text-sm text-zinc-400">No stack data available</p>
      {:else}
        <div class="space-y-3">
          {#each insights.topStacks.slice(0, 5) as stack}
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-zinc-200">{stack.stack}</span>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-zinc-400">{stack.count} projects</span>
                  <span
                    class="text-xs font-semibold px-2 py-0.5 rounded {getSuccessRateBgColor(stack.successRate)} {getSuccessRateColor(stack.successRate)}"
                  >
                    {(stack.successRate * 100).toFixed(0)}% success
                  </span>
                </div>
              </div>
              <div class="w-full bg-gunmetal-800 rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all duration-300"
                  class:bg-forge-green-400={stack.successRate >= 0.8}
                  class:bg-warning-amber-400={stack.successRate >= 0.6 && stack.successRate < 0.8}
                  class:bg-danger-red-400={stack.successRate < 0.6}
                  style="width: {(stack.count / insights.topStacks[0].count) * 100}%"
                ></div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .team-metrics-card {
    transition: border-color 0.2s;
  }

  .team-metrics-card:hover {
    border-color: rgb(var(--color-electric-blue-500) / 0.5);
  }
</style>
