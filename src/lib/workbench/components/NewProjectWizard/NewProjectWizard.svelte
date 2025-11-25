<!--
  NewProjectWizard.svelte

  Modal wizard for guided project creation.
  Overlays the workbench and teaches workbench concepts as users progress.
-->
<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { wizardStore } from '../../stores/wizard.svelte';
  import { projectStore } from '../../stores/project.svelte';
  import { WIZARD_STEP_META } from '../../types/wizard';
  import WizardProgress from './WizardProgress.svelte';
  import StepIntent from './steps/StepIntent.svelte';
  import StepLanguages from './steps/StepLanguages.svelte';
  import StepStack from './steps/StepStack.svelte';
  import StepConfig from './steps/StepConfig.svelte';
  import StepLaunch from './steps/StepLaunch.svelte';

  // Step components map
  const stepComponents = {
    intent: StepIntent,
    languages: StepLanguages,
    stack: StepStack,
    config: StepConfig,
    launch: StepLaunch,
  } as const;

  // Error state for launch
  let launchError = $state<string | null>(null);

  // Current step metadata
  const currentMeta = $derived(WIZARD_STEP_META[wizardStore.currentStep]);

  // Keyboard shortcuts
  function handleKeydown(e: KeyboardEvent): void {
    if (!wizardStore.isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (wizardStore.isLastStep) {
        handleLaunch();
      } else if (wizardStore.canGoForward) {
        wizardStore.nextStep();
      }
    }
  }

  function handleClose(): void {
    // Prompt to save draft if there's data
    if (wizardStore.data.projectName) {
      wizardStore.close({ saveDraft: true });
    } else {
      wizardStore.close();
    }
  }

  async function handleLaunch(): Promise<void> {
    if (!wizardStore.canGoForward || wizardStore.isSubmitting) return;

    launchError = null;
    wizardStore.setSubmitting(true);

    try {
      // Create project from wizard data
      await projectStore.createFromWizard(wizardStore.data);

      // Clear wizard state
      wizardStore.reset();

      // Modal closes automatically when isOpen becomes false
    } catch (e) {
      console.error('Failed to create project:', e);
      launchError = e instanceof Error ? e.message : 'Failed to create project';
      wizardStore.setSubmitting(false);
    }
  }

  function handleBackdropClick(e: MouseEvent): void {
    // Only close if clicking the backdrop itself, not the modal
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if wizardStore.isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-40 bg-blacksteel-950/80 backdrop-blur-sm"
    transition:fade={{ duration: 200 }}
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === 'Escape' && handleClose()}
    role="button"
    tabindex="-1"
    aria-label="Close wizard"
  />

  <!-- Modal -->
  <div
    class="fixed inset-4 z-50 flex items-center justify-center pointer-events-none"
    role="dialog"
    aria-modal="true"
    aria-labelledby="wizard-title"
  >
    <div
      class="
        relative w-full max-w-3xl max-h-[90vh]
        bg-gunmetal-900 border border-gunmetal-700 rounded-xl
        shadow-2xl shadow-blacksteel-950/50
        pointer-events-auto
        flex flex-col
      "
      transition:fly={{ y: 20, duration: 300, easing: cubicOut }}
    >
      <!-- Header -->
      <header class="flex items-center justify-between px-6 py-4 border-b border-gunmetal-700">
        <div>
          <h2 id="wizard-title" class="text-lg font-semibold text-zinc-100">
            {currentMeta.title}
          </h2>
          <p class="text-sm text-zinc-400 mt-0.5">
            {currentMeta.description}
          </p>
        </div>

        <button
          type="button"
          class="p-2 text-zinc-400 hover:text-zinc-100 transition-colors rounded-lg hover:bg-gunmetal-800"
          aria-label="Close wizard"
          on:click={handleClose}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <!-- Progress -->
      <WizardProgress />

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-6 py-6">
        {#if launchError && wizardStore.isLastStep}
          <div class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-400">
            {launchError}
          </div>
        {/if}

        <svelte:component this={stepComponents[wizardStore.currentStep]} />
      </div>

      <!-- Footer -->
      <footer class="flex items-center justify-between px-6 py-4 border-t border-gunmetal-700 bg-gunmetal-900/50">
        <!-- Teaching hint -->
        <div class="text-xs text-zinc-500">
          <span class="text-ember-500">→</span>
          This sets up your <span class="text-zinc-400">{currentMeta.teaches}</span>
        </div>

        <!-- Navigation -->
        <div class="flex items-center gap-3">
          {#if !wizardStore.isFirstStep}
            <button
              type="button"
              class="px-4 py-2 text-sm text-zinc-300 hover:text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!wizardStore.canGoBack}
              on:click={() => wizardStore.previousStep()}
            >
              Back
            </button>
          {/if}

          {#if wizardStore.isLastStep}
            <button
              type="button"
              class="
                px-5 py-2 text-sm font-medium rounded-lg
                bg-ember-600 text-white
                hover:bg-ember-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
                flex items-center gap-2
              "
              disabled={!wizardStore.canGoForward || wizardStore.isSubmitting}
              on:click={handleLaunch}
            >
              {#if wizardStore.isSubmitting}
                <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              {:else}
                Create Project
                <span class="text-xs opacity-75">⌘↵</span>
              {/if}
            </button>
          {:else}
            <button
              type="button"
              class="
                px-5 py-2 text-sm font-medium rounded-lg
                bg-gunmetal-700 text-zinc-100
                hover:bg-gunmetal-600
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
              disabled={!wizardStore.canGoForward}
              on:click={() => wizardStore.nextStep()}
            >
              Continue
              <span class="ml-1 text-xs opacity-75">⌘↵</span>
            </button>
          {/if}
        </div>
      </footer>
    </div>
  </div>
{/if}
