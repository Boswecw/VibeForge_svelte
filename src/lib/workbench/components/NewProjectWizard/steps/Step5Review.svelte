<script lang="ts">
  import { wizardStore } from '../../../stores';
  import { PROJECT_TYPES, LANGUAGES, STACKS } from '../../../types/project';
  import RuntimeRequirements from '$lib/components/dev/RuntimeRequirements.svelte';

  let { config } = $props<{ config: typeof wizardStore.config }>();

  const projectType = $derived(PROJECT_TYPES.find(t => t.value === config.projectType));
  const primaryLanguage = $derived(LANGUAGES.find(l => l.value === config.primaryLanguage));
  const stack = $derived(STACKS.find(s => s.value === config.stack));

  const enabledFeatures = $derived(
    Object.entries(config.features)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key)
  );

  // Compute required runtimes based on full configuration
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

  const requiredRuntimes = $derived.by(() => {
    const runtimes: string[] = [];

    // Add language runtime
    if (config.primaryLanguage && languageToRuntime[config.primaryLanguage]) {
      runtimes.push(languageToRuntime[config.primaryLanguage]);
    }

    // Add additional language runtimes
    config.additionalLanguages.forEach((lang: string) => {
      const runtime = languageToRuntime[lang];
      if (runtime && !runtimes.includes(runtime)) {
        runtimes.push(runtime);
      }
    });

    // Add stack-specific runtimes
    if (config.stack && config.stack !== 'none' && stackRuntimeRequirements[config.stack]) {
      stackRuntimeRequirements[config.stack].forEach((runtime: string) => {
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
      Review & Launch
    </h2>
    <p class="text-sm text-gray-600 dark:text-gray-400">
      Review your project configuration before creating
    </p>
  </div>

  <!-- Project Summary -->
  <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
    <!-- Project Name & Description -->
    <div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {config.projectName}
      </h3>
      {#if config.projectDescription}
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {config.projectDescription}
        </p>
      {/if}
    </div>

    <!-- Divider -->
    <div class="border-t border-gray-200 dark:border-gray-700"></div>

    <!-- Details Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <!-- Project Type -->
      <div>
        <div class="text-gray-500 dark:text-gray-400">Project Type</div>
        <div class="font-medium text-gray-900 dark:text-white mt-1">
          {projectType?.label || 'Unknown'}
        </div>
      </div>

      <!-- Language -->
      <div>
        <div class="text-gray-500 dark:text-gray-400">Primary Language</div>
        <div class="font-medium text-gray-900 dark:text-white mt-1">
          {primaryLanguage?.label || 'Unknown'}
        </div>
      </div>

      <!-- Stack -->
      <div>
        <div class="text-gray-500 dark:text-gray-400">Stack</div>
        <div class="font-medium text-gray-900 dark:text-white mt-1">
          {stack?.label || config.stack === 'none' ? 'No Framework' : 'Unknown'}
        </div>
      </div>

      <!-- Path -->
      <div>
        <div class="text-gray-500 dark:text-gray-400">Location</div>
        <div class="font-medium text-gray-900 dark:text-white mt-1 font-mono text-xs">
          {config.projectPath}
        </div>
      </div>

      <!-- License -->
      <div>
        <div class="text-gray-500 dark:text-gray-400">License</div>
        <div class="font-medium text-gray-900 dark:text-white mt-1">
          {config.license}
        </div>
      </div>

      <!-- Features -->
      <div>
        <div class="text-gray-500 dark:text-gray-400">Features</div>
        <div class="font-medium text-gray-900 dark:text-white mt-1">
          {#if enabledFeatures.length > 0}
            {enabledFeatures.join(', ')}
          {:else}
            None
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Runtime Checklist -->
  <div>
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
      Runtime Checklist
    </h3>
    <RuntimeRequirements requiredRuntimes={requiredRuntimes} showInstallButton={false} />
  </div>

  <!-- Ready to create info -->
  <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
    <p class="text-sm text-blue-800 dark:text-blue-300">
      <strong>Ready to create!</strong> Click "Create Project" to scaffold your new project with the selected configuration.
    </p>
  </div>
</div>
