<script lang="ts">
  import { wizardStore } from '../../../stores';
  import { LANGUAGES } from '../../../types/project';
  import RuntimeRequirements from '$lib/components/dev/RuntimeRequirements.svelte';

  let { config } = $props<{ config: typeof wizardStore.config }>();

  // Map language selections to runtime IDs
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

  // Type for language items
  type LanguageItem = { value: string; label: string };

  const requiredRuntimes = $derived(() => {
    const runtimes: string[] = [];
    if (config.primaryLanguage && languageToRuntime[config.primaryLanguage]) {
      runtimes.push(languageToRuntime[config.primaryLanguage]);
    }
    config.additionalLanguages.forEach((lang: string) => {
      if (languageToRuntime[lang] && !runtimes.includes(languageToRuntime[lang])) {
        runtimes.push(languageToRuntime[lang]);
      }
    });
    // Always include git as baseline requirement
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
      Select Languages
    </h2>
    <p class="text-sm text-gray-600 dark:text-gray-400">
      Choose your primary programming language
    </p>
  </div>

  <!-- Primary Language -->
  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Primary Language *
    </label>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
      {#each LANGUAGES as language}
        <button
          type="button"
          data-language={language.value}
          onclick={() => (config.primaryLanguage = language.value)}
          class="p-4 text-center border rounded-lg transition-all {config.primaryLanguage === language.value
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'}"
        >
          <div class="font-medium text-gray-900 dark:text-white">
            {language.label}
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- Additional Languages -->
  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Additional Languages (Optional)
    </label>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
      {#each LANGUAGES.filter((l) => l.value !== config.primaryLanguage) as language}
        <button
          type="button"
          onclick={() => {
            if (config.additionalLanguages.includes(language.value)) {
              config.additionalLanguages = config.additionalLanguages.filter((l) => l !== language.value);
            } else {
              config.additionalLanguages = [...config.additionalLanguages, language.value];
            }
          }}
          class="p-3 text-center border rounded-lg transition-all {config.additionalLanguages.includes(language.value)
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700'}"
        >
          <div class="text-sm font-medium text-gray-900 dark:text-white">
            {language.label}
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- Runtime Requirements -->
  {#if config.primaryLanguage}
    <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Runtime Requirements
      </h3>
      <RuntimeRequirements requiredRuntimes={requiredRuntimes()} />
    </div>
  {/if}
</div>
