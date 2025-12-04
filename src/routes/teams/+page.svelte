<!--
  Team Dashboard Page - Phase 4.1
  Team & Organization Learning Dashboard
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { teamStore } from '$lib/stores/teamStore.svelte';
  import TeamInsightsCard from '$lib/components/team/TeamInsightsCard.svelte';
  import TeamMetricsCard from '$lib/components/team/TeamMetricsCard.svelte';
  import TeamMembersCard from '$lib/components/team/TeamMembersCard.svelte';
  import { RefreshCw, Plus, Settings, Users } from 'lucide-svelte';
  import type { TeamRole } from '$lib/types/team';

  // Store state
  let teams = $derived(teamStore.teams);
  let selectedTeam = $derived(teamStore.selectedTeam);
  let members = $derived(teamStore.members);
  let insights = $derived(teamStore.insights);
  let isLoadingDashboard = $derived(teamStore.isLoadingDashboard);
  let isLoadingInsights = $derived(teamStore.isLoadingInsights);
  let isLoadingMembers = $derived(teamStore.isLoadingMembers);
  let error = $derived(teamStore.error);
  let isAdmin = $derived(teamStore.isAdmin);

  // Local state
  let selectedTeamId = $state<number | null>(null);

  // Lifecycle
  onMount(async () => {
    await teamStore.fetchTeams();

    // Auto-select first team if available
    if (teams.length > 0 && !selectedTeamId) {
      selectedTeamId = teams[0].id;
      await loadTeamDashboard(teams[0].id);
    }
  });

  // Methods
  async function loadTeamDashboard(teamId: number) {
    selectedTeamId = teamId;
    await teamStore.fetchDashboard(teamId);
  }

  async function refreshDashboard() {
    if (selectedTeamId) {
      await teamStore.fetchDashboard(selectedTeamId);
    }
  }

  async function handleRemoveMember(userId: number) {
    if (!selectedTeamId) return;
    const confirmed = confirm('Are you sure you want to remove this member?');
    if (confirmed) {
      await teamStore.removeMember(selectedTeamId, userId);
    }
  }

  async function handleUpdateRole(userId: number, role: TeamRole) {
    if (!selectedTeamId) return;
    await teamStore.updateMemberRole(selectedTeamId, userId, role);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
</script>

<svelte:head>
  <title>Team Dashboard - VibeForge</title>
</svelte:head>

<div class="teams-page flex flex-col h-full bg-forge-blacksteel overflow-hidden">
  <!-- Header -->
  <div class="border-b border-gunmetal-700 bg-gunmetal-900 px-6 py-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-zinc-100">Team Dashboard</h1>
        <p class="text-sm text-zinc-400 mt-1">
          Track team performance and AI-powered insights
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          onclick={refreshDashboard}
          disabled={isLoadingDashboard}
          class="flex items-center gap-2 px-4 py-2 rounded bg-gunmetal-800 hover:bg-gunmetal-700 text-zinc-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw class={`w-4 h-4 ${isLoadingDashboard ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>

        <button
          class="flex items-center gap-2 px-4 py-2 rounded bg-electric-blue-600 hover:bg-electric-blue-500 text-white transition-colors"
        >
          <Plus class="w-4 h-4" />
          <span>Create Team</span>
        </button>
      </div>
    </div>

    <!-- Team Selector -->
    {#if teams.length > 0}
      <div class="mt-4 flex items-center gap-2">
        <Users class="w-4 h-4 text-zinc-400" />
        <select
          bind:value={selectedTeamId}
          onchange={() => selectedTeamId && loadTeamDashboard(selectedTeamId)}
          class="bg-gunmetal-800 border border-gunmetal-700 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-electric-blue-500"
        >
          <option value={null}>Select a team...</option>
          {#each teams as team}
            <option value={team.id}>{team.name}</option>
          {/each}
        </select>

        {#if selectedTeam}
          <span class="text-sm text-zinc-400">
            {selectedTeam.memberCount} members · {selectedTeam.projectCount} projects
          </span>

          {#if isAdmin}
            <button
              class="ml-auto flex items-center gap-2 px-3 py-1.5 rounded bg-gunmetal-800 hover:bg-gunmetal-700 text-zinc-300 transition-colors text-sm"
            >
              <Settings class="w-4 h-4" />
              <span>Settings</span>
            </button>
          {/if}
        {/if}
      </div>
    {/if}
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto p-6">
    {#if error}
      <div class="mb-4 p-4 bg-danger-red-900/20 border border-danger-red-700 rounded-lg">
        <p class="text-danger-red-400">{error}</p>
        <button
          onclick={() => teamStore.clearError()}
          class="mt-2 text-sm text-danger-red-300 hover:text-danger-red-200"
        >
          Dismiss
        </button>
      </div>
    {/if}

    {#if teams.length === 0 && !isLoadingDashboard}
      <!-- Empty State -->
      <div class="flex flex-col items-center justify-center h-full text-center">
        <div class="w-16 h-16 rounded-full bg-gunmetal-800 flex items-center justify-center mb-4">
          <Users class="w-8 h-8 text-zinc-400" />
        </div>
        <h2 class="text-xl font-semibold text-zinc-200 mb-2">No Teams Yet</h2>
        <p class="text-zinc-400 mb-6 max-w-md">
          Create your first team to start collaborating and tracking learning insights across your
          organization.
        </p>
        <button
          class="flex items-center gap-2 px-6 py-3 rounded bg-electric-blue-600 hover:bg-electric-blue-500 text-white transition-colors"
        >
          <Plus class="w-5 h-5" />
          <span>Create Your First Team</span>
        </button>
      </div>
    {:else if !selectedTeam && !isLoadingDashboard}
      <!-- No Team Selected -->
      <div class="flex flex-col items-center justify-center h-full text-center">
        <div class="w-16 h-16 rounded-full bg-gunmetal-800 flex items-center justify-center mb-4">
          <Users class="w-8 h-8 text-zinc-400" />
        </div>
        <h2 class="text-xl font-semibold text-zinc-200 mb-2">Select a Team</h2>
        <p class="text-zinc-400">Choose a team from the dropdown above to view insights.</p>
      </div>
    {:else}
      <!-- Dashboard Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Insights & Metrics -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Team Info Card -->
          {#if selectedTeam}
            <div class="bg-gunmetal-900 border border-gunmetal-700 rounded-lg p-6">
              <div class="flex items-start justify-between">
                <div>
                  <h2 class="text-xl font-bold text-zinc-100">{selectedTeam.name}</h2>
                  {#if selectedTeam.description}
                    <p class="text-sm text-zinc-400 mt-1">{selectedTeam.description}</p>
                  {/if}
                  <div class="flex items-center gap-4 mt-3 text-sm text-zinc-400">
                    {#if selectedTeam.industry}
                      <span>{selectedTeam.industry}</span>
                    {/if}
                    {#if selectedTeam.organizationType}
                      <span class="capitalize">{selectedTeam.organizationType}</span>
                    {/if}
                    <span>Created {formatDate(selectedTeam.createdAt)}</span>
                  </div>
                </div>
                {#if selectedTeam.isPublic}
                  <span class="px-2 py-1 rounded bg-forge-green-900/20 text-forge-green-400 text-xs">
                    Public
                  </span>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Insights Card -->
          <TeamInsightsCard {insights} isLoading={isLoadingInsights} />

          <!-- Metrics Card -->
          <TeamMetricsCard {insights} isLoading={isLoadingInsights} />
        </div>

        <!-- Right Column: Members -->
        <div>
          <TeamMembersCard
            {members}
            isLoading={isLoadingMembers}
            canManage={isAdmin}
            onRemove={handleRemoveMember}
            onUpdateRole={handleUpdateRole}
          />
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .teams-page {
    min-height: 100vh;
  }
</style>
