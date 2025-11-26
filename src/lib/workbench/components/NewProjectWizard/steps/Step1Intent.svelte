<script lang="ts">
  import { wizardStore } from '../../../stores';
  import { PROJECT_TYPES } from '../../../types/project';

  let { config } = $props<{ config: typeof wizardStore.config }>();
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
      Project Intent
    </h2>
    <p class="text-sm text-gray-600 dark:text-gray-400">
      Tell us about your project vision
    </p>
  </div>

  <!-- Project Name -->
  <div>
    <label for="project-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Project Name *
    </label>
    <input
      id="project-name"
      name="projectName"
      type="text"
      bind:value={config.projectName}
      placeholder="my-awesome-project"
      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      required
    />
    {#if config.projectName && (config.projectName.length < 3 || config.projectName.length > 50)}
      <p class="text-xs text-red-600 dark:text-red-400 mt-1">
        Name must be between 3 and 50 characters
      </p>
    {/if}
  </div>

  <!-- Project Description -->
  <div>
    <label for="project-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Description
    </label>
    <textarea
      id="project-description"
      name="projectDescription"
      bind:value={config.projectDescription}
      placeholder="A brief description of what your project does..."
      rows="3"
      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
    ></textarea>
  </div>

  <!-- Project Type -->
  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Project Type *
    </label>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      {#each PROJECT_TYPES as type}
        <button
          type="button"
          data-testid="project-type-{type.value}"
          onclick={() => (config.projectType = type.value)}
          class="p-4 text-left border rounded-lg transition-all {config.projectType === type.value
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'}"
        >
          <div class="font-medium text-gray-900 dark:text-white">
            {type.label}
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {type.description}
          </div>
        </button>
      {/each}
    </div>
  </div>
</div>
