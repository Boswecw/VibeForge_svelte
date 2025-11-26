<script lang="ts">
  import { wizardStore } from '../../../stores';
  import { STACKS } from '../../../types/project';

  let { config } = $props<{ config: typeof wizardStore.config }>();

  // Filter stacks based on selected primary language
  const availableStacks = $derived(
    STACKS.filter(
      stack => !config.primaryLanguage || stack.languages.includes(config.primaryLanguage)
    )
  );
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
      Choose Technology Stack
    </h2>
    <p class="text-sm text-gray-600 dark:text-gray-400">
      Select the framework or stack for your project
      {#if config.primaryLanguage}
        <span class="font-medium">({config.primaryLanguage})</span>
      {/if}
    </p>
  </div>

  <!-- Stack Selection -->
  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Framework / Stack *
    </label>
    {#if availableStacks.length > 0}
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        {#each availableStacks as stack}
          <button
            type="button"
            data-stack={stack.value}
            onclick={() => (config.stack = stack.value)}
            class="p-4 text-center border rounded-lg transition-all {config.stack === stack.value
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'}"
          >
            <div class="font-medium text-gray-900 dark:text-white">
              {stack.label}
            </div>
          </button>
        {/each}
      </div>
    {:else}
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Please select a primary language first
      </p>
    {/if}
  </div>

  <!-- No framework option -->
  <div>
    <button
      type="button"
      onclick={() => (config.stack = 'none')}
      class="w-full p-3 text-left border rounded-lg transition-all {config.stack === 'none'
        ? 'border-gray-500 bg-gray-50 dark:bg-gray-800'
        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'}"
    >
      <div class="font-medium text-gray-900 dark:text-white">
        No Framework (Plain {config.primaryLanguage || 'Language'})
      </div>
      <div class="text-xs text-gray-600 dark:text-gray-400 mt-1">
        Start with a minimal setup without any framework
      </div>
    </button>
  </div>
</div>
