<script lang="ts">
  import { wizardStore } from '../../stores';
  import {
    Step1Intent,
    Step2Languages,
    Step3Stack,
    Step4Configuration,
    Step5Review,
    StepPatternSelect,
    StepComponentConfig,
  } from './steps';

  // Dynamic step names based on mode
  const stepNames = $derived(() => {
    const isPatternMode = wizardStore.config.architecturePattern !== null;
    return [
      'Project Intent',
      'Architecture',
      isPatternMode ? 'Components' : 'Stack',
      'Configuration',
      'Review & Launch',
    ];
  });

  function handleClose() {
    wizardStore.close();
  }

  function handleNext() {
    if (wizardStore.canGoNext) {
      wizardStore.nextStep();
    }
  }

  function handleBack() {
    if (wizardStore.canGoBack) {
      wizardStore.previousStep();
    }
  }

  function handleCreate() {
    wizardStore.createProject();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!wizardStore.isOpen) return;

    if (event.key === 'Escape') {
      handleClose();
    } else if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      if (wizardStore.currentStep === wizardStore.totalSteps) {
        handleCreate();
      } else {
        handleNext();
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if wizardStore.isOpen}

  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/50 z-40"
    on:click={handleClose}
    on:keydown={(e) => e.key === 'Escape' && handleClose()}
    role="button"
    tabindex="-1"
    aria-label="Close wizard"
  ></div>

  <!-- Dialog -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="wizard-title"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      on:click={(e) => e.stopPropagation()}
    >
      <!-- Header with Progress -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 id="wizard-title" class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          New Project
        </h2>

        <!-- Step Progress Indicator -->
        <div class="flex items-center justify-between">
          {#each stepNames() as stepName, index}
            <div class="flex items-center flex-1">
              <!-- Step Circle -->
              <button
                type="button"
                on:click={() => wizardStore.goToStep(index + 1)}
                class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all {(index + 1) === wizardStore.currentStep
                  ? 'bg-blue-600 text-white'
                  : (index + 1) < wizardStore.currentStep
                    ? 'bg-green-600 text-white cursor-pointer hover:bg-green-700'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'}"
                aria-label="Step {index + 1}: {stepName}"
              >
                {#if (index + 1) < wizardStore.currentStep}
                  ✓
                {:else}
                  {index + 1}
                {/if}
              </button>

              <!-- Step Label (show on larger screens) -->
              <span
                class="hidden md:block ml-2 text-xs {(index + 1) === wizardStore.currentStep
                  ? 'text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-500 dark:text-gray-400'}"
              >
                {stepName}
              </span>

              <!-- Connector Line -->
              {#if index < stepNames().length - 1}
                <div
                  class="hidden sm:block flex-1 h-0.5 mx-2 {(index + 1) < wizardStore.currentStep
                    ? 'bg-green-600'
                    : 'bg-gray-300 dark:bg-gray-600'}"
                ></div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Step Content -->
      <div class="flex-1 overflow-y-auto px-6 py-6">
        {#if wizardStore.currentStep === 1}
          <Step1Intent config={wizardStore.config} />
        {:else if wizardStore.currentStep === 2}
          <!-- Step 2: Pattern Selection (with embedded legacy mode) -->
          <StepPatternSelect config={wizardStore.config} />
        {:else if wizardStore.currentStep === 3}
          <!-- Step 3: Component Config (pattern) OR Stack (legacy) -->
          {#if wizardStore.config.architecturePattern}
            <StepComponentConfig config={wizardStore.config} />
          {:else}
            <Step3Stack config={wizardStore.config} />
          {/if}
        {:else if wizardStore.currentStep === 4}
          <Step4Configuration config={wizardStore.config} />
        {:else if wizardStore.currentStep === 5}
          <Step5Review config={wizardStore.config} />
        {/if}
      </div>

      <!-- Footer with Actions -->
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <button
          type="button"
          on:click={handleClose}
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
          Cancel
        </button>

        <div class="flex items-center gap-2">
          {#if wizardStore.canGoBack}
            <button
              type="button"
              on:click={handleBack}
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Back
            </button>
          {/if}

          {#if wizardStore.currentStep === wizardStore.totalSteps}
            <button
              type="button"
              on:click={handleCreate}
              class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
            >
              Create Project
            </button>
          {:else}
            <button
              type="button"
              on:click={handleNext}
              disabled={!wizardStore.isCurrentStepValid}
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md"
            >
              Next
            </button>
          {/if}
        </div>
      </div>

      <!-- Keyboard Hint -->
      <div class="px-6 py-2 bg-gray-50 dark:bg-gray-900 text-center">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Press <kbd class="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">⌘</kbd>
          <kbd class="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↵</kbd> to
          {wizardStore.currentStep === wizardStore.totalSteps ? 'create' : 'continue'}
        </p>
      </div>
    </div>
  </div>
{/if}
