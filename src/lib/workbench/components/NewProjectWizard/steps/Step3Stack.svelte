<script lang="ts">
  import { wizardStore } from '../../../stores';
  import { STACKS } from '../../../types/project';
  import RuntimeRequirements from '$lib/components/dev/RuntimeRequirements.svelte';
  import TeamRecommendations from '../TeamRecommendations.svelte';

  let { config } = $props<{ config: typeof wizardStore.config }>();

  // Filter stacks based on selected primary language
  const availableStacks = $derived(
    STACKS.filter(
      stack => !config.primaryLanguage || stack.languages.includes(config.primaryLanguage)
    )
  );

  // Map language and stack to runtime requirements
  const languageToRuntime: Record<string, string> = {
    typescript: 'javascript-typescript',
    javascript: 'javascript-typescript',
    python: 'python',
    go: 'go',
    rust: 'rust',
    java: 'java',
    kotlin: 'kotlin',
    swift: 'swift',
    dart: 'dart',
  };

  const stackRuntimeRequirements: Record<string, string[]> = {
    'svelte': ['pnpm'],
    'sveltekit': ['pnpm'],
    'react': ['pnpm'],
    'next': ['pnpm'],
    'vue': ['pnpm'],
    'nuxt': ['pnpm'],
    'fastapi': ['python'],
    'flask': ['python'],
    'django': ['python'],
    'express': ['javascript-typescript', 'pnpm'],
    'nestjs': ['javascript-typescript', 'pnpm'],
  };

  const requiredRuntimes = $derived(() => {
    const runtimes: string[] = [];

    // Add language runtime
    if (config.primaryLanguage && languageToRuntime[config.primaryLanguage]) {
      runtimes.push(languageToRuntime[config.primaryLanguage]);
    }

    // Add stack-specific runtimes
    if (config.stack && config.stack !== 'none' && stackRuntimeRequirements[config.stack]) {
      stackRuntimeRequirements[config.stack].forEach(runtime => {
        if (!runtimes.includes(runtime)) {
          runtimes.push(runtime);
        }
      });
    }

    // Always include git
    if (!runtimes.includes('git')) runtimes.push('git');

    // Include npm for JavaScript/TypeScript projects
    if (config.primaryLanguage === 'typescript' || config.primaryLanguage === 'javascript') {
      if (!runtimes.includes('npm')) runtimes.push('npm');
    }

    return runtimes;
  });
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

  <!-- Team Recommendations -->
  <TeamRecommendations />

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

  <!-- Runtime Requirements -->
  {#if config.stack}
    <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Required Runtimes for Selected Stack
      </h3>
      <RuntimeRequirements requiredRuntimes={requiredRuntimes()} />
    </div>
  {/if}
</div>
