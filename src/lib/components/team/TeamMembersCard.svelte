<script lang="ts">
  import type { TeamMember, TeamRole } from '$lib/types/team';
  import { Users, Crown, Shield, User } from 'lucide-svelte';

  interface Props {
    members: TeamMember[];
    isLoading?: boolean;
    onRemove?: (userId: number) => void;
    onUpdateRole?: (userId: number, role: TeamRole) => void;
    canManage?: boolean;
  }

  let { members, isLoading = false, onRemove, onUpdateRole, canManage = false }: Props = $props();

  function getRoleIcon(role: TeamRole) {
    switch (role) {
      case 'owner':
        return Crown;
      case 'admin':
        return Shield;
      default:
        return User;
    }
  }

  function getRoleColor(role: TeamRole): string {
    switch (role) {
      case 'owner':
        return 'text-warning-amber-400';
      case 'admin':
        return 'text-electric-blue-400';
      case 'member':
        return 'text-forge-green-400';
      default:
        return 'text-zinc-400';
    }
  }
</script>

<div class="team-members-card bg-gunmetal-900 border border-gunmetal-700 rounded-lg p-6">
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-2">
      <Users class="w-5 h-5 text-electric-blue-400" />
      <h2 class="text-lg font-semibold text-zinc-100">Team Members</h2>
      <span class="text-sm text-zinc-400">({members.length})</span>
    </div>
  </div>

  {#if isLoading}
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue-400"></div>
    </div>
  {:else if members.length === 0}
    <div class="text-center py-8 text-zinc-400">
      <p>No team members yet.</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each members as member}
        {@const RoleIcon = getRoleIcon(member.role)}
        <div
          class="flex items-center justify-between p-3 bg-gunmetal-800 rounded-lg hover:bg-gunmetal-750 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gunmetal-700 flex items-center justify-center">
              <User class="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p class="text-sm font-medium text-zinc-200">
                {member.userName || member.userEmail || `User ${member.userId}`}
              </p>
              <div class="flex items-center gap-1.5 mt-0.5">
                <RoleIcon class="w-3.5 h-3.5 {getRoleColor(member.role)}" />
                <p class="text-xs {getRoleColor(member.role)} capitalize">{member.role}</p>
              </div>
            </div>
          </div>

          {#if canManage && member.role !== 'owner'}
            <div class="flex items-center gap-2">
              {#if onUpdateRole && member.role !== 'admin'}
                <button
                  onclick={() => onUpdateRole?.(member.userId, 'admin')}
                  class="text-xs px-2 py-1 rounded bg-gunmetal-700 text-zinc-300 hover:bg-gunmetal-600 transition-colors"
                >
                  Make Admin
                </button>
              {/if}
              {#if onRemove}
                <button
                  onclick={() => onRemove?.(member.userId)}
                  class="text-xs px-2 py-1 rounded bg-danger-red-900/20 text-danger-red-400 hover:bg-danger-red-900/30 transition-colors"
                >
                  Remove
                </button>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .team-members-card {
    transition: border-color 0.2s;
  }

  .team-members-card:hover {
    border-color: rgb(var(--color-electric-blue-500) / 0.5);
  }
</style>
