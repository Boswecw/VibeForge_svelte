<!-- @component
no description yet
-->
<script lang="ts">
  import { wizardStore, canProceed, wizardProgress } from "$lib/stores/wizard";
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  export let onComplete: (() => void) | undefined = undefined;

  const steps = [
    {
      id: 1,
      title: "Project Intent",
      description: "Define your project goals",
      icon: "🎯",
    },
    {
      id: 2,
      title: "Languages",
      description: "Select programming languages",
      icon: "📘",
    },
    {
      id: 3,
      title: "Stack",
      description: "Choose your tech stack",
      icon: "📦",
    },
    {
      id: 4,
      title: "Configuration",
      description: "Configure your project",
      icon: "⚙️",
    },
    { id: 5, title: "Review", description: "Review and generate", icon: "✅" },
  ];

  $: currentStep = $wizardStore.currentStep;
  $: completedSteps = $wizardStore.completedSteps;
  $: progress = $wizardProgress;
  $: canGoNext = $canProceed;

  function handleNext() {
    if (currentStep === 5) {
      onComplete?.();
    } else {
      wizardStore.nextStep();
    }
  }

  function handlePrevious() {
    wizardStore.previousStep();
  }

  function goToStep(stepId: number) {
    // Allow navigating to completed steps or current step
    if (stepId <= currentStep || completedSteps.has(stepId - 1)) {
      wizardStore.goToStep(stepId);
    }
  }
</script>

<div
  class="wizard-shell min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-8"
>
  <div class="max-w-6xl mx-auto px-4">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-2">Create New Project</h1>
      <p class="text-lg text-gray-600">
        Let's build something amazing together
      </p>
    </div>

    <!-- Progress bar -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700">
          Step {currentStep} of {steps.length}
        </span>
        <span class="text-sm text-gray-600">
          {Math.round(progress)}% Complete
        </span>
      </div>
      <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          class="h-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
          style="width: {progress}%"
        />
      </div>
    </div>

    <!-- Step indicators -->
    <div class="mb-8">
      <div class="flex items-center justify-between relative">
        <!-- Connection line -->
        <div class="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
        <div
          class="absolute top-6 left-0 h-0.5 bg-indigo-500 -z-10 transition-all duration-500"
          style="width: {((currentStep - 1) / (steps.length - 1)) * 100}%"
        />

        {#each steps as step}
          <button
            class="flex flex-col items-center group"
            class:cursor-pointer={step.id <= currentStep ||
              completedSteps.has(step.id - 1)}
            class:cursor-not-allowed={step.id > currentStep &&
              !completedSteps.has(step.id - 1)}
            on:click={() => goToStep(step.id)}
            disabled={step.id > currentStep && !completedSteps.has(step.id - 1)}
          >
            <!-- Circle -->
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-300 mb-2 border-2"
              class:bg-indigo-500={step.id === currentStep}
              class:border-indigo-500={step.id === currentStep}
              class:bg-green-500={completedSteps.has(step.id)}
              class:border-green-500={completedSteps.has(step.id)}
              class:text-white={step.id === currentStep ||
                completedSteps.has(step.id)}
              class:bg-white={step.id !== currentStep &&
                !completedSteps.has(step.id)}
              class:border-gray-300={step.id !== currentStep &&
                !completedSteps.has(step.id)}
              class:text-gray-400={step.id !== currentStep &&
                !completedSteps.has(step.id)}
              class:group-hover:border-indigo-400={step.id <= currentStep ||
                completedSteps.has(step.id - 1)}
              class:shadow-lg={step.id === currentStep}
            >
              {#if completedSteps.has(step.id)}
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              {:else}
                {step.icon}
              {/if}
            </div>

            <!-- Label -->
            <div class="text-center hidden sm:block">
              <div
                class="text-sm font-medium transition-colors"
                class:text-indigo-600={step.id === currentStep}
                class:text-green-600={completedSteps.has(step.id)}
                class:text-gray-900={step.id !== currentStep &&
                  !completedSteps.has(step.id) &&
                  step.id <= currentStep}
                class:text-gray-400={step.id > currentStep &&
                  !completedSteps.has(step.id - 1)}
              >
                {step.title}
              </div>
              <div class="text-xs text-gray-500 hidden lg:block">
                {step.description}
              </div>
            </div>
          </button>
        {/each}
      </div>
    </div>

    <!-- Main content area -->
    <div class="bg-white rounded-xl shadow-lg p-8 mb-6">
      <div class="min-h-[500px]">
        {#key currentStep}
          <div
            in:fly={{ x: 20, duration: 300, easing: cubicOut }}
            out:fade={{ duration: 150 }}
          >
            <slot />
          </div>
        {/key}
      </div>
    </div>

    <!-- Navigation buttons -->
    <div class="flex items-center justify-between">
      <button
        class="px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        class:invisible={currentStep === 1}
        disabled={currentStep === 1}
        on:click={handlePrevious}
      >
        ← Previous
      </button>

      <div class="flex gap-3">
        <button
          class="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          on:click={() => wizardStore.saveDraft()}
        >
          💾 Save Draft
        </button>

        <button
          class="px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          class:bg-indigo-600={canGoNext}
          class:hover:bg-indigo-700={canGoNext}
          class:text-white={canGoNext}
          class:bg-gray-300={!canGoNext}
          class:text-gray-500={!canGoNext}
          class:shadow-lg={canGoNext && currentStep === 5}
          disabled={!canGoNext}
          on:click={handleNext}
        >
          {#if currentStep === 5}
            🚀 Generate Project
          {:else}
            Next →
          {/if}
        </button>
      </div>
    </div>

    <!-- Helper text -->
    {#if !canGoNext}
      <div class="mt-4 text-center">
        <p
          class="text-sm text-amber-600 flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
          Please complete all required fields to continue
        </p>
      </div>
    {/if}
  </div>
</div>

<style>
  .wizard-shell {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
