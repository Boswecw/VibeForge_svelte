<!--
  StepLanguages.svelte

  Step 2: Select primary and secondary languages
-->
<script lang="ts">
  import { wizardStore } from '../../../stores/wizard.svelte';
  import { LANGUAGES, type Language } from '$lib/data/languages';

  // Convert languages object to array
  const allLanguages = Object.values(LANGUAGES);

  // Group by category for better organization
  const languagesByCategory = $derived({
    frontend: allLanguages.filter(l => l.category === 'frontend'),
    backend: allLanguages.filter(l => l.category === 'backend'),
    systems: allLanguages.filter(l => l.category === 'systems'),
    mobile: allLanguages.filter(l => l.category === 'mobile'),
  });

  // Reactive bindings to wizard store
  let primaryLanguage = $state(wizardStore.data.primaryLanguage);
  let secondaryLanguages = $state([...wizardStore.data.secondaryLanguages]);

  // Sync to store on change
  $effect(() => {
    wizardStore.updateData('primaryLanguage', primaryLanguage);
  });

  $effect(() => {
    wizardStore.updateData('secondaryLanguages', secondaryLanguages);
  });

  const validation = $derived(wizardStore.validation.languages);

  function setPrimary(langId: string): void {
    primaryLanguage = langId;
    // Remove from secondary if it was there
    secondaryLanguages = secondaryLanguages.filter(id => id !== langId);
  }

  function toggleSecondary(langId: string): void {
    if (langId === primaryLanguage) return; // Can't add primary to secondary

    if (secondaryLanguages.includes(langId)) {
      secondaryLanguages = secondaryLanguages.filter(id => id !== langId);
    } else {
      secondaryLanguages = [...secondaryLanguages, langId];
    }
  }

  function isSelected(langId: string): boolean {
    return langId === primaryLanguage || secondaryLanguages.includes(langId);
  }

  function getSelectionType(langId: string): 'primary' | 'secondary' | null {
    if (langId === primaryLanguage) return 'primary';
    if (secondaryLanguages.includes(langId)) return 'secondary';
    return null;
  }
</script>

<div class="space-y-6">
  <!-- Primary Language -->
  <div>
    <h3 class="text-sm font-medium text-zinc-300 mb-3">
      Primary Language <span class="text-red-400">*</span>
    </h3>
    <p class="text-xs text-zinc-500 mb-4">
      The main language your project will be written in
    </p>

    <div class="space-y-4">
      {#each Object.entries(languagesByCategory) as [category, langs]}
        {#if langs.length > 0}
          <div>
            <p class="text-xs font-medium text-zinc-500 uppercase mb-2">{category}</p>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {#each langs as lang}
                {@const selectionType = getSelectionType(lang.id)}
                <button
                  type="button"
                  class="
                    flex items-center gap-2 px-3 py-2.5
                    rounded-lg border text-left transition-all
                    {selectionType === 'primary'
                      ? 'bg-ember-600/20 border-ember-500 ring-2 ring-ember-500/50'
                      : selectionType === 'secondary'
                        ? 'bg-blue-600/20 border-blue-500'
                        : 'bg-gunmetal-800 border-gunmetal-700 hover:border-gunmetal-600'}
                  "
                  on:click={() => setPrimary(lang.id)}
                >
                  <span class="text-lg">{lang.icon}</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-zinc-100 truncate">{lang.name}</p>
                    {#if selectionType === 'primary'}
                      <p class="text-xs text-ember-400">Primary</p>
                    {:else if selectionType === 'secondary'}
                      <p class="text-xs text-blue-400">Secondary</p>
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      {/each}
    </div>

    {#if validation.errors.some(e => e.includes('language'))}
      <p class="mt-2 text-sm text-red-400">
        {validation.errors.find(e => e.includes('language'))}
      </p>
    {/if}
  </div>

  <!-- Secondary Languages (Optional) -->
  {#if primaryLanguage}
    <div>
      <h3 class="text-sm font-medium text-zinc-300 mb-3">
        Secondary Languages (Optional)
      </h3>
      <p class="text-xs text-zinc-500 mb-4">
        Additional languages you'll use in this project
      </p>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {#each allLanguages.filter(l => l.id !== primaryLanguage) as lang}
          {@const isSecondary = secondaryLanguages.includes(lang.id)}
          <button
            type="button"
            class="
              flex items-center gap-2 px-3 py-2.5
              rounded-lg border text-left transition-all
              {isSecondary
                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                : 'bg-gunmetal-800 border-gunmetal-700 text-zinc-400 hover:border-gunmetal-600 hover:text-zinc-300'}
            "
            on:click={() => toggleSecondary(lang.id)}
          >
            <span class="text-lg">{lang.icon}</span>
            <span class="text-sm flex-1 truncate">{lang.name}</span>
            {#if isSecondary}
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            {/if}
          </button>
        {/each}
      </div>

      {#if validation.warnings.some(w => w.includes('language'))}
        <p class="mt-2 text-sm text-amber-400">
          ⚠️ {validation.warnings.find(w => w.includes('language'))}
        </p>
      {/if}
    </div>
  {/if}

  <!-- Selected Summary -->
  {#if primaryLanguage}
    <div class="p-4 bg-gunmetal-800/50 border border-gunmetal-700 rounded-lg">
      <h4 class="text-xs font-medium text-zinc-400 mb-2">Selected Languages</h4>
      <div class="flex flex-wrap gap-2">
        {#if LANGUAGES[primaryLanguage]}
          {@const primary = LANGUAGES[primaryLanguage]}
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-ember-600/20 border border-ember-500 rounded-lg text-xs text-ember-400">
            <span>{primary.icon}</span>
            <span>{primary.name}</span>
            <span class="text-ember-500">•</span>
            <span class="text-ember-500">Primary</span>
          </span>
        {/if}
        {#each secondaryLanguages as langId}
          {#if LANGUAGES[langId]}
            {@const lang = LANGUAGES[langId]}
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/20 border border-blue-500 rounded-lg text-xs text-blue-400">
              <span>{lang.icon}</span>
              <span>{lang.name}</span>
            </span>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</div>
