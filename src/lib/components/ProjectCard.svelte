<!--
  ProjectCard.svelte

  Displays a project outcome card with health indicators and actions
  Phase 3.4: Outcome Tracking & Feedback Loop
-->
<script lang="ts">
  import type { ProjectOutcome } from '$lib/types/outcome';
  import { projectOutcomesStore } from '$lib/stores/projectOutcomes.svelte';

  interface Props {
    project: ProjectOutcome;
    showActions?: boolean;
    onClick?: () => void;
  }

  let { project, showActions = true, onClick }: Props = $props();

  // Computed values
  let healthStatus = $derived(getHealthStatus(project));
  let timeSinceCreated = $derived(getTimeSinceCreated(project.createdAt));
  let hasFeedback = $derived(
    projectOutcomesStore.feedbacks.some((f) => f.projectOutcomeId === project.id)
  );

  // Methods
  function getHealthStatus(proj: ProjectOutcome): {
    status: 'healthy' | 'warning' | 'error' | 'unknown';
    icon: string;
    color: string;
    message: string;
  } {
    if (!proj.lastBuildStatus) {
      return {
        status: 'unknown',
        icon: '⚪',
        color: 'text-zinc-500',
        message: 'No build data',
      };
    }

    if (proj.lastBuildStatus === 'failure') {
      return {
        status: 'error',
        icon: '🔴',
        color: 'text-red-500',
        message: 'Build failing',
      };
    }

    if (proj.testPassRate !== null && proj.testPassRate < 80) {
      return {
        status: 'warning',
        icon: '🟡',
        color: 'text-yellow-500',
        message: `Tests: ${proj.testPassRate}%`,
      };
    }

    return {
      status: 'healthy',
      icon: '🟢',
      color: 'text-green-500',
      message: 'All systems operational',
    };
  }

  function getTimeSinceCreated(timestamp: string): string {
    const now = new Date();
    const created = new Date(timestamp);
    const diff = now.getTime() - created.getTime();

    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  function handleAddFeedback() {
    projectOutcomesStore.promptFeedback(project.id);
  }

  function handleArchive() {
    if (confirm(`Archive "${project.projectName}"?`)) {
      projectOutcomesStore.archiveOutcome(project.id);
    }
  }

  function handleViewDetails() {
    if (onClick) {
      onClick();
    } else {
      // Navigate to project details page (future)
      console.log('View details:', project.id);
    }
  }

  function openProjectFolder() {
    // Future: Open project folder in file manager
    console.log('Open folder:', project.projectPath);
  }
</script>

<div
  class="project-card group relative bg-gunmetal-900 border border-gunmetal-700 rounded-xl p-5 hover:border-ember-500/50 transition-all duration-200 hover:shadow-lg cursor-pointer"
  onclick={handleViewDetails}
  role="button"
  tabindex="0"
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleViewDetails();
    }
  }}
>
  <!-- Header -->
  <div class="flex items-start justify-between mb-3">
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <!-- Health Indicator -->
        <span class="text-lg" title={healthStatus.message}>
          {healthStatus.icon}
        </span>

        <!-- Project Name -->
        <h3 class="text-lg font-semibold text-zinc-100 truncate">
          {project.projectName}
        </h3>
      </div>

      <!-- Pattern Badge -->
      <div class="flex items-center gap-2 flex-wrap">
        <span
          class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-ember-500/10 text-ember-400 border border-ember-500/20"
        >
          {project.patternName}
        </span>

        <!-- Status Badge -->
        {#if project.status === 'archived'}
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-700 text-zinc-400"
          >
            Archived
          </span>
        {/if}
      </div>
    </div>

    <!-- Actions Menu -->
    {#if showActions}
      <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {#if !hasFeedback}
          <button
            type="button"
            class="action-btn"
            onclick={(e) => {
              e.stopPropagation();
              handleAddFeedback();
            }}
            title="Add feedback"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </button>
        {/if}

        <button
          type="button"
          class="action-btn"
          onclick={(e) => {
            e.stopPropagation();
            handleArchive();
          }}
          title="Archive project"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
        </button>
      </div>
    {/if}
  </div>

  <!-- Project Path -->
  <p class="text-xs text-zinc-500 mb-3 truncate" title={project.projectPath}>
    📁 {project.projectPath}
  </p>

  <!-- Stats Grid -->
  <div class="grid grid-cols-3 gap-3 mb-3">
    <!-- Files Created -->
    <div class="stat-item">
      <div class="text-2xl font-bold text-zinc-100">{project.filesCreated}</div>
      <div class="text-xs text-zinc-500">Files</div>
    </div>

    <!-- Components -->
    <div class="stat-item">
      <div class="text-2xl font-bold text-zinc-100">
        {project.componentsGenerated.length}
      </div>
      <div class="text-xs text-zinc-500">Components</div>
    </div>

    <!-- Languages -->
    <div class="stat-item">
      <div class="text-2xl font-bold text-zinc-100">{project.languagesUsed.length}</div>
      <div class="text-xs text-zinc-500">Languages</div>
    </div>
  </div>

  <!-- Languages & Dependencies -->
  <div class="flex flex-wrap gap-1.5 mb-3">
    {#each project.languagesUsed.slice(0, 3) as language}
      <span class="tech-badge">{language}</span>
    {/each}
    {#if project.languagesUsed.length > 3}
      <span class="tech-badge bg-gunmetal-700 text-zinc-500">
        +{project.languagesUsed.length - 3}
      </span>
    {/if}
  </div>

  <!-- Health Metrics (if available) -->
  {#if project.lastBuildStatus || project.testPassRate !== null || project.deploymentStatus}
    <div class="border-t border-gunmetal-700 pt-3 space-y-2">
      <!-- Build Status -->
      {#if project.lastBuildStatus}
        <div class="flex items-center justify-between text-sm">
          <span class="text-zinc-400">Build:</span>
          <span
            class={project.lastBuildStatus === 'success'
              ? 'text-green-500 font-medium'
              : 'text-red-500 font-medium'}
          >
            {project.lastBuildStatus === 'success' ? '✓ Success' : '✗ Failed'}
          </span>
        </div>
      {/if}

      <!-- Test Pass Rate -->
      {#if project.testPassRate !== null}
        <div class="flex items-center justify-between text-sm">
          <span class="text-zinc-400">Tests:</span>
          <div class="flex items-center gap-2">
            <div class="w-20 h-1.5 bg-gunmetal-700 rounded-full overflow-hidden">
              <div
                class="h-full {project.testPassRate >= 80
                  ? 'bg-green-500'
                  : project.testPassRate >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'}"
                style="width: {project.testPassRate}%"
              ></div>
            </div>
            <span class="text-zinc-300 font-medium">{project.testPassRate}%</span>
          </div>
        </div>
      {/if}

      <!-- Deployment Status -->
      {#if project.deploymentStatus}
        <div class="flex items-center justify-between text-sm">
          <span class="text-zinc-400">Deployment:</span>
          <span class="text-zinc-300 capitalize">
            {#if project.deploymentStatus === 'deployed'}
              🚀 {project.deploymentStatus}
            {:else if project.deploymentStatus === 'staging'}
              🔧 {project.deploymentStatus}
            {:else}
              💻 {project.deploymentStatus}
            {/if}
          </span>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Footer -->
  <div class="flex items-center justify-between mt-3 pt-3 border-t border-gunmetal-700">
    <span class="text-xs text-zinc-500">{timeSinceCreated}</span>

    <div class="flex items-center gap-2">
      <!-- Feedback Indicator -->
      {#if hasFeedback}
        <span class="text-xs text-green-500 flex items-center gap-1" title="Feedback submitted">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          Reviewed
        </span>
      {:else}
        <span class="text-xs text-zinc-500">No feedback yet</span>
      {/if}
    </div>
  </div>
</div>

<style>
  .project-card:focus {
    outline: 2px solid #f97316;
    outline-offset: 2px;
  }

  .action-btn {
    padding: 6px;
    background: rgba(249, 115, 22, 0.1);
    border: 1px solid rgba(249, 115, 22, 0.3);
    border-radius: 6px;
    color: #a1a1aa;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background: rgba(249, 115, 22, 0.2);
    border-color: rgba(249, 115, 22, 0.5);
    color: #f97316;
  }

  .stat-item {
    text-align: center;
    padding: 8px;
    background: rgba(63, 63, 70, 0.3);
    border-radius: 8px;
  }

  .tech-badge {
    padding: 4px 8px;
    background: rgba(249, 115, 22, 0.1);
    border: 1px solid rgba(249, 115, 22, 0.2);
    border-radius: 4px;
    font-size: 11px;
    color: #f97316;
    font-weight: 500;
  }
</style>
