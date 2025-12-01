<!--
  StepIntent.svelte

  Step 1: Define project intent (name, description, type, complexity)
-->
<script lang="ts">
  import { wizardStore } from '../../../stores/wizard.svelte';
  import type { ProjectType, Complexity } from '../../../types/wizard';

  const projectTypes: { value: ProjectType; label: string; icon: string }[] = [
    { value: 'web', label: 'Web Application', icon: '🌐' },
    { value: 'api', label: 'API / Backend', icon: '⚡' },
    { value: 'fullstack', label: 'Full Stack', icon: '🏗️' },
    { value: 'cli', label: 'CLI Tool', icon: '💻' },
    { value: 'library', label: 'Library / Package', icon: '📦' },
    { value: 'desktop', label: 'Desktop App', icon: '🖥️' },
    { value: 'mobile', label: 'Mobile App', icon: '📱' },
    { value: 'data-pipeline', label: 'Data Pipeline', icon: '🔄' },
    { value: 'ml-project', label: 'ML / AI Project', icon: '🤖' },
  ];

  const complexityLevels: { value: Complexity; label: string; description: string }[] = [
    { value: 'simple', label: 'Simple', description: 'Quick prototype or small tool' },
    { value: 'moderate', label: 'Moderate', description: 'Standard project with typical features' },
    { value: 'complex', label: 'Complex', description: 'Large project with many integrations' },
    { value: 'enterprise', label: 'Enterprise', description: 'Mission-critical with strict requirements' },
  ];

  // Reactive bindings to wizard store
  let projectName = $state(wizardStore.config.projectName);
  let projectDescription = $state(wizardStore.config.projectDescription);
  let projectType = $state(wizardStore.config.projectType);
  let complexity = $state(wizardStore.config.complexity);

  // Sync to store on change
  $effect(() => {
    wizardStore.config.projectName = projectName;
  });

  $effect(() => {
    wizardStore.config.projectDescription = projectDescription;
  });

  $effect(() => {
    wizardStore.config.projectType = projectType;
  });

  $effect(() => {
    wizardStore.config.complexity = complexity;
  });

  // Validation - check if project name is valid (3-50 chars)
  const nameError = $derived(
    !projectName || projectName.trim().length < 3
      ? 'Project name must be at least 3 characters'
      : projectName.length > 50
        ? 'Project name must be less than 50 characters'
        : null
  );

  const typeError = $derived(
    projectType === null ? 'Please select a project type' : null
  );
</script>

<div class="space-y-6">
  <!-- Project Name -->
  <div>
    <label for="project-name" class="block text-sm font-medium text-zinc-300 mb-2">
      Project Name <span class="text-red-400">*</span>
    </label>
    <input
      id="project-name"
      type="text"
      bind:value={projectName}
      placeholder="my-awesome-project"
      class="
        w-full px-4 py-3
        bg-gunmetal-800 border rounded-lg
        text-zinc-100 placeholder:text-zinc-600
        focus:outline-none focus:ring-2 focus:ring-ember-500/50
        transition-all
        {nameError
          ? 'border-red-500'
          : 'border-gunmetal-700 focus:border-ember-500'}
      "
      autofocus
    />
    {#if nameError}
      <p class="mt-1 text-sm text-red-400">
        {nameError}
      </p>
    {/if}
  </div>

  <!-- Project Description -->
  <div>
    <label for="project-description" class="block text-sm font-medium text-zinc-300 mb-2">
      Description
      <span class="text-zinc-500 font-normal">(helps AI recommendations)</span>
    </label>
    <textarea
      id="project-description"
      bind:value={projectDescription}
      placeholder="Describe what you're building and its main purpose..."
      rows="3"
      class="
        w-full px-4 py-3
        bg-gunmetal-800 border border-gunmetal-700 rounded-lg
        text-zinc-100 placeholder:text-zinc-600
        focus:outline-none focus:border-ember-500 focus:ring-2 focus:ring-ember-500/50
        transition-all resize-none
      "
    />
  </div>

  <!-- Project Type -->
  <div>
    <label class="block text-sm font-medium text-zinc-300 mb-3">
      Project Type <span class="text-red-400">*</span>
    </label>
    <div class="grid grid-cols-3 gap-2">
      {#each projectTypes as type}
        <button
          type="button"
          class="
            flex items-center gap-2 px-3 py-2.5
            rounded-lg border text-left transition-all
            {projectType === type.value
              ? 'bg-ember-600/20 border-ember-500 text-ember-400'
              : 'bg-gunmetal-800 border-gunmetal-700 text-zinc-400 hover:border-gunmetal-600 hover:text-zinc-300'}
          "
          on:click={() => projectType = type.value}
        >
          <span class="text-lg">{type.icon}</span>
          <span class="text-sm">{type.label}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Complexity -->
  <div>
    <label class="block text-sm font-medium text-zinc-300 mb-3">
      Complexity
    </label>
    <div class="grid grid-cols-2 gap-2">
      {#each complexityLevels as level}
        <button
          type="button"
          class="
            flex flex-col px-4 py-3
            rounded-lg border text-left transition-all
            {complexity === level.value
              ? 'bg-ember-600/20 border-ember-500'
              : 'bg-gunmetal-800 border-gunmetal-700 hover:border-gunmetal-600'}
          "
          on:click={() => complexity = level.value}
        >
          <span
            class="text-sm font-medium {complexity === level.value ? 'text-ember-400' : 'text-zinc-300'}"
          >
            {level.label}
          </span>
          <span class="text-xs text-zinc-500 mt-0.5">{level.description}</span>
        </button>
      {/each}
    </div>
  </div>
</div>
