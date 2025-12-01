<script lang="ts">
  import { teamStore } from '$lib/stores/teamStore.svelte';
  import { Sparkles, TrendingUp, Info } from 'lucide-svelte';
  import { onMount } from 'svelte';

  interface Props {
    show?: boolean;
  }

  let { show = true }: Props = $props();

  // Store state
  let insights = $derived(teamStore.insights);
  let selectedTeam = $derived(teamStore.selectedTeam);
  let isLoadingInsights = $derived(teamStore.isLoadingInsights);
  let teams = $derived(teamStore.teams);

  // Load teams and insights on mount
  onMount(async () => {
    await teamStore.fetchTeams();

    // If user has teams, select first and fetch insights
    if (teams.length > 0 && !selectedTeam) {
      const firstTeam = teams[0];
      teamStore.selectTeam(firstTeam);
      await teamStore.fetchInsights(firstTeam.id, 30);
    }
  });

  function handleRefreshInsights() {
    if (selectedTeam) {
      teamStore.fetchInsights(selectedTeam.id, 30);
    }
  }
</script>

{#if show && selectedTeam && (insights || isLoadingInsights)}
  <div class="team-recommendations bg-electric-blue-900/10 border border-electric-blue-700/30 rounded-lg p-4 mb-4">
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center gap-2">
        <Sparkles class="w-4 h-4 text-electric-blue-400" />
        <h3 class="text-sm font-semibold text-zinc-100">
          Team Recommendations
        </h3>
        {#if selectedTeam}
          <span class="text-xs text-zinc-400">from {selectedTeam.name}</span>
        {/if}
      </div>

      {#if !isLoadingInsights}
        <button
          onclick={handleRefreshInsights}
          class="text-xs text-electric-blue-400 hover:text-electric-blue-300 transition-colors"
        >
          Refresh
        </button>
      {/if}
    </div>

    {#if isLoadingInsights}
      <div class="flex items-center gap-2 py-2">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-electric-blue-400"></div>
        <span class="text-sm text-zinc-400">Loading team insights...</span>
      </div>
    {:else if insights}
      <!-- Info Banner -->
      <div class="flex items-start gap-2 mb-3 p-2 bg-gunmetal-900/50 rounded text-xs text-zinc-400">
        <Info class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <p>
          Based on your team's project history ({insights.totalProjects} projects, {(insights.overallSuccessRate || 0 * 100).toFixed(0)}% success rate)
        </p>
      </div>

      <!-- Recommended Languages -->
      {#if insights.recommendedLanguages && insights.recommendedLanguages.length > 0}
        <div class="mb-3">
          <div class="flex items-center gap-1.5 mb-2">
            <TrendingUp class="w-3.5 h-3.5 text-forge-green-400" />
            <h4 class="text-xs font-semibold text-zinc-200">Recommended Languages</h4>
          </div>
          <div class="space-y-1.5">
            {#each insights.recommendedLanguages.slice(0, 3) as recommendation}
              <div class="flex items-start gap-2 text-xs">
                <div class="w-1 h-1 rounded-full bg-forge-green-400 mt-1.5 flex-shrink-0"></div>
                <p class="text-zinc-300">{recommendation}</p>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Recommended Stacks -->
      {#if insights.recommendedStacks && insights.recommendedStacks.length > 0}
        <div>
          <div class="flex items-center gap-1.5 mb-2">
            <TrendingUp class="w-3.5 h-3.5 text-electric-blue-400" />
            <h4 class="text-xs font-semibold text-zinc-200">Recommended Tech Stacks</h4>
          </div>
          <div class="space-y-1.5">
            {#each insights.recommendedStacks.slice(0, 3) as recommendation}
              <div class="flex items-start gap-2 text-xs">
                <div class="w-1 h-1 rounded-full bg-electric-blue-400 mt-1.5 flex-shrink-0"></div>
                <p class="text-zinc-300">{recommendation}</p>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- No Recommendations -->
      {#if (!insights.recommendedLanguages || insights.recommendedLanguages.length === 0) && (!insights.recommendedStacks || insights.recommendedStacks.length === 0)}
        <p class="text-xs text-zinc-400 italic">
          Not enough team data yet. Complete more projects to get AI-powered recommendations.
        </p>
      {/if}
    {:else}
      <p class="text-xs text-zinc-400 italic">
        No team insights available yet.
      </p>
    {/if}
  </div>
{/if}

<style>
  .team-recommendations {
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
