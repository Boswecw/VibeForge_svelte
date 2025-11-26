<script lang="ts">
  import { wizardStore } from '../../../stores';

  let { config } = $props<{ config: typeof wizardStore.config }>();

  const features = [
    { key: 'testing', label: 'Testing', description: 'Include test framework and example tests' },
    { key: 'linting', label: 'Linting & Formatting', description: 'ESLint, Prettier, or language-specific linters' },
    { key: 'git', label: 'Git Repository', description: 'Initialize Git with .gitignore' },
    { key: 'docker', label: 'Docker', description: 'Dockerfile and docker-compose.yml' },
    { key: 'ci', label: 'CI/CD', description: 'GitHub Actions or GitLab CI configuration' },
  ];
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
      Configure Features
    </h2>
    <p class="text-sm text-gray-600 dark:text-gray-400">
      Select additional features for your project
    </p>
  </div>

  <!-- Features -->
  <div class="space-y-3">
    {#each features as feature}
      <label
        class="flex items-start p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 dark:hover:border-blue-700 {config.features[feature.key]
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-300 dark:border-gray-600'}"
      >
        <input
          type="checkbox"
          bind:checked={config.features[feature.key]}
          class="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <div class="ml-3 flex-1">
          <div class="font-medium text-gray-900 dark:text-white">
            {feature.label}
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {feature.description}
          </div>
        </div>
      </label>
    {/each}
  </div>

  <!-- Project Path -->
  <div>
    <label for="project-path" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Project Path
    </label>
    <input
      id="project-path"
      type="text"
      bind:value={config.projectPath}
      placeholder="~"
      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
    />
    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
      Where to create the project (default: home directory)
    </p>
  </div>

  <!-- License -->
  <div>
    <label for="license" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      License
    </label>
    <select
      id="license"
      bind:value={config.license}
      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
    >
      <option value="MIT">MIT</option>
      <option value="Apache-2.0">Apache 2.0</option>
      <option value="GPL-3.0">GPL 3.0</option>
      <option value="BSD-3-Clause">BSD 3-Clause</option>
      <option value="ISC">ISC</option>
      <option value="UNLICENSED">Unlicensed (Private)</option>
    </select>
  </div>
</div>
