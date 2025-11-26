<script lang="ts">
  import { wizardStore } from '../../../stores';
  import { LANGUAGES } from '../../../types/project';

  let { config } = $props<{ config: typeof wizardStore.config }>();
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
      {#each LANGUAGES.filter(l => l.value !== config.primaryLanguage) as language}
        <button
          type="button"
          onclick={() => {
            if (config.additionalLanguages.includes(language.value)) {
              config.additionalLanguages = config.additionalLanguages.filter(l => l !== language.value);
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
</div>
