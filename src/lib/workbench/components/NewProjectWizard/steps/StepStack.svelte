<!--
  StepStack.svelte

  Step 3: Select technology stack
-->
<script lang="ts">
  import { wizardStore } from '../../../stores/wizard.svelte';
  import { ALL_STACKS, STACK_PROFILES } from '$lib/data/stack-profiles';
  import type { StackProfile } from '$lib/core/types/stack-profiles';

  // Filter stacks based on selected language
  const compatibleStacks = $derived(() => {
    const primaryLang = wizardStore.data.primaryLanguage;
    if (!primaryLang) return ALL_STACKS;

    // Filter stacks that are compatible with the primary language
    // For now, show all stacks (future: implement language compatibility)
    return ALL_STACKS;
  });

  // Reactive bindings to wizard store
  let selectedStack = $state(wizardStore.data.selectedStack);

  // Sync to store on change
  $effect(() => {
    wizardStore.updateData('selectedStack', selectedStack);
  });

  const validation = $derived(wizardStore.validation.stack);

  function selectStack(stack: StackProfile): void {
    selectedStack = stack;
  }

  function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      web: 'Web',
      mobile: 'Mobile',
      desktop: 'Desktop',
      api: 'API/Backend',
      ai: 'AI/ML',
    };
    return labels[category] || category;
  }

  function getMaturityBadge(maturity: string): { color: string; label: string } {
    const badges: Record<string, { color: string; label: string }> = {
      experimental: { color: 'text-purple-400 bg-purple-900/20 border-purple-500', label: 'Experimental' },
      stable: { color: 'text-blue-400 bg-blue-900/20 border-blue-500', label: 'Stable' },
      mature: { color: 'text-green-400 bg-green-900/20 border-green-500', label: 'Mature' },
      legacy: { color: 'text-amber-400 bg-amber-900/20 border-amber-500', label: 'Legacy' },
    };
    return badges[maturity] || badges.stable;
  }
</script>

<div class="space-y-6">
  <!-- Stack Selection -->
  <div>
    <h3 class="text-sm font-medium text-zinc-300 mb-3">
      Choose Your Stack <span class="text-red-400">*</span>
    </h3>
    <p class="text-xs text-zinc-500 mb-4">
      Select a proven technology stack for your project
    </p>

    <div class="space-y-3 max-h-[500px] overflow-y-auto pr-2">
      {#each compatibleStacks() as stack}
        {@const isSelected = selectedStack?.id === stack.id}
        {@const maturityBadge = getMaturityBadge(stack.maturity)}
        <button
          type="button"
          class="
            w-full p-4 rounded-lg border text-left transition-all
            {isSelected
              ? 'bg-ember-600/20 border-ember-500 ring-2 ring-ember-500/50'
              : 'bg-gunmetal-800 border-gunmetal-700 hover:border-gunmetal-600'}
          "
          on:click={() => selectStack(stack)}
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                {#if stack.icon}
                  <span class="text-2xl">{stack.icon}</span>
                {/if}
                <div>
                  <h4 class="text-base font-semibold {isSelected ? 'text-ember-400' : 'text-zinc-100'}">
                    {stack.displayName || stack.name}
                  </h4>
                  {#if stack.tagline}
                    <p class="text-xs text-zinc-500">{stack.tagline}</p>
                  {/if}
                </div>
              </div>

              <p class="text-sm text-zinc-400 mb-3">
                {stack.description}
              </p>

              <!-- Badges -->
              <div class="flex flex-wrap gap-2">
                <span class="inline-flex items-center px-2 py-1 rounded text-xs border {maturityBadge.color}">
                  {maturityBadge.label}
                </span>
                <span class="inline-flex items-center px-2 py-1 rounded text-xs border text-zinc-400 bg-gunmetal-800 border-gunmetal-600">
                  {getCategoryLabel(stack.category)}
                </span>
                {#if stack.popularity >= 80}
                  <span class="inline-flex items-center px-2 py-1 rounded text-xs border text-emerald-400 bg-emerald-900/20 border-emerald-500">
                    ⭐ Popular
                  </span>
                {/if}
              </div>

              <!-- Technologies Preview -->
              <div class="mt-3 flex flex-wrap gap-1.5">
                {#if stack.technologies.frontend && stack.technologies.frontend.length > 0}
                  {#each stack.technologies.frontend.slice(0, 3) as tech}
                    <span class="px-2 py-0.5 bg-gunmetal-900 border border-gunmetal-700 rounded text-xs text-zinc-400">
                      {tech.name}
                    </span>
                  {/each}
                {/if}
                {#if stack.technologies.backend && stack.technologies.backend.length > 0}
                  {#each stack.technologies.backend.slice(0, 3) as tech}
                    <span class="px-2 py-0.5 bg-gunmetal-900 border border-gunmetal-700 rounded text-xs text-zinc-400">
                      {tech.name}
                    </span>
                  {/each}
                {/if}
              </div>
            </div>

            {#if isSelected}
              <div class="flex-shrink-0">
                <svg class="w-6 h-6 text-ember-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            {/if}
          </div>
        </button>
      {/each}
    </div>

    {#if validation.errors.some(e => e.includes('stack'))}
      <p class="mt-2 text-sm text-red-400">
        {validation.errors.find(e => e.includes('stack'))}
      </p>
    {/if}
  </div>

  <!-- Selected Stack Details -->
  {#if selectedStack}
    <div class="p-4 bg-gunmetal-800/50 border border-gunmetal-700 rounded-lg">
      <h4 class="text-sm font-medium text-zinc-300 mb-3">Selected Stack</h4>

      <div class="space-y-3">
        <div>
          <p class="text-xs font-medium text-zinc-500 mb-1">Strengths</p>
          <ul class="space-y-1">
            {#each selectedStack.strengths.slice(0, 3) as strength}
              <li class="text-xs text-zinc-400 flex items-start gap-2">
                <span class="text-green-500 mt-0.5">✓</span>
                <span>{strength}</span>
              </li>
            {/each}
          </ul>
        </div>

        {#if selectedStack.idealFor && selectedStack.idealFor.length > 0}
          <div>
            <p class="text-xs font-medium text-zinc-500 mb-1">Ideal For</p>
            <div class="flex flex-wrap gap-1.5">
              {#each selectedStack.idealFor.slice(0, 4) as ideal}
                <span class="px-2 py-0.5 bg-blue-900/20 border border-blue-700 rounded text-xs text-blue-400">
                  {ideal}
                </span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
