<!-- @component
Wizard overlay component that displays the project creation wizard as a full-screen modal
-->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import WizardShell from "./WizardShell.svelte";
  import Step1Intent from "./steps/Step1Intent.svelte";
  import Step2Languages from "./steps/Step2Languages.svelte";
  import Step3Stack from "./steps/Step3Stack.svelte";
  import Step4Config from "./steps/Step4Config.svelte";
  import Step5Review from "./steps/Step5Review.svelte";
  import { wizardStore } from "$lib/stores/wizard";

  export let visible = false;

  const dispatch = createEventDispatcher();

  $: currentStep = $wizardStore.currentStep;

  function close() {
    visible = false;
    dispatch("close");
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      close();
    }
  }

  function handleComplete() {
    console.log("Project generation complete!", $wizardStore);
    alert("Project configuration complete! Generation would start here.");
    // TODO: Call backend API to generate project
    close();
  }
</script>

{#if visible}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="fixed inset-0 z-50"
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <!-- Close Button -->
    <button
      class="absolute top-4 right-4 z-10 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      onclick={close}
      aria-label="Close wizard"
    >
      <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>

    <!-- Wizard Content -->
    <div class="w-full h-full">
      <WizardShell on:complete={handleComplete}>
        {#if currentStep === 1}
          <Step1Intent />
        {:else if currentStep === 2}
          <Step2Languages />
        {:else if currentStep === 3}
          <Step3Stack />
        {:else if currentStep === 4}
          <Step4Config />
        {:else if currentStep === 5}
          <Step5Review />
        {/if}
      </WizardShell>
    </div>
  </div>
{/if}

<style>
  /* Prevent body scroll when overlay is open */
  :global(body:has(.fixed.z-50)) {
    overflow: hidden;
  }
</style>
