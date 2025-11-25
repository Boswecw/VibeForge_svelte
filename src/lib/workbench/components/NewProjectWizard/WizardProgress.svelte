<!--
  WizardProgress.svelte

  Step indicator for the wizard showing progress and allowing navigation.
-->
<script lang="ts">
  import { wizardStore } from '../../stores/wizard.svelte';
  import { WIZARD_STEP_META, type WizardStep } from '../../types/wizard';

  const steps: WizardStep[] = ['intent', 'languages', 'stack', 'config', 'launch'];

  function getStepStatus(step: WizardStep, index: number): 'completed' | 'current' | 'upcoming' {
    const currentIndex = wizardStore.currentStepIndex;
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'upcoming';
  }

  function canNavigateToStep(step: WizardStep, index: number): boolean {
    const currentIndex = wizardStore.currentStepIndex;
    // Can always go back, can only go forward if current is valid
    return index < currentIndex || (index === currentIndex + 1 && wizardStore.canGoForward);
  }

  function handleStepClick(step: WizardStep, index: number): void {
    if (index < wizardStore.currentStepIndex) {
      wizardStore.goToStep(step);
    }
  }
</script>

<div class="px-6 py-3 border-b border-gunmetal-800 bg-gunmetal-900/30">
  <div class="flex items-center justify-between">
    {#each steps as step, index}
      {@const status = getStepStatus(step, index)}
      {@const meta = WIZARD_STEP_META[step]}
      {@const isClickable = index < wizardStore.currentStepIndex}

      <!-- Step indicator -->
      <button
        type="button"
        class="
          flex items-center gap-2 group
          {isClickable ? 'cursor-pointer' : 'cursor-default'}
        "
        disabled={!isClickable}
        on:click={() => handleStepClick(step, index)}
      >
        <!-- Circle -->
        <div
          class="
            w-8 h-8 rounded-full flex items-center justify-center
            text-sm font-medium transition-all
            {status === 'completed'
              ? 'bg-ember-600 text-white'
              : status === 'current'
                ? 'bg-ember-600/20 text-ember-400 ring-2 ring-ember-500'
                : 'bg-gunmetal-800 text-zinc-500'}
            {isClickable ? 'group-hover:ring-2 group-hover:ring-ember-500/50' : ''}
          "
        >
          {#if status === 'completed'}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          {:else}
            {index + 1}
          {/if}
        </div>

        <!-- Label (hidden on mobile) -->
        <span
          class="
            hidden sm:block text-sm transition-colors
            {status === 'current'
              ? 'text-zinc-100 font-medium'
              : status === 'completed'
                ? 'text-zinc-400'
                : 'text-zinc-600'}
            {isClickable ? 'group-hover:text-zinc-300' : ''}
          "
        >
          {meta.title}
        </span>
      </button>

      <!-- Connector line -->
      {#if index < steps.length - 1}
        <div
          class="
            flex-1 h-0.5 mx-2
            {index < wizardStore.currentStepIndex
              ? 'bg-ember-600'
              : 'bg-gunmetal-700'}
          "
        />
      {/if}
    {/each}
  </div>
</div>
