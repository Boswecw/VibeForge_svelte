<script lang="ts">
  import WizardShell from "$lib/components/wizard/WizardShell.svelte";
  import Step1Intent from "$lib/components/wizard/steps/Step1Intent.svelte";
  import Step2Languages from "$lib/components/wizard/steps/Step2Languages.svelte";
  import Step3Stack from "$lib/components/wizard/steps/Step3Stack.svelte";
  import Step4Config from "$lib/components/wizard/steps/Step4Config.svelte";
  import Step5Review from "$lib/components/wizard/steps/Step5Review.svelte";
  import { wizardStore } from "$lib/stores/wizard";
  import { goto } from "$app/navigation";

  $: currentStep = $wizardStore.currentStep;

  function handleComplete() {
    console.log("Project generation complete!", $wizardStore);
    alert("Project configuration complete! Generation would start here.");
    // TODO: Call backend API to generate project
    // TODO: Navigate to project dashboard
  }

  function handleReset() {
    if (confirm("Reset wizard and start over?")) {
      wizardStore.reset();
    }
  }
</script>

<svelte:head>
  <title>Create New Project - VibeForge</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-8 text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-2">
        ✨ VibeForge Project Creator
      </h1>
      <p class="text-gray-600">
        Generate production-ready codebases with AI-powered automation
      </p>
    </div>

    <!-- Wizard -->
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

    <!-- Debug/Reset Controls -->
    <div class="mt-8 flex justify-center gap-4">
      <button
        class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
        on:click={handleReset}
      >
        🔄 Reset Wizard
      </button>
      <a
        href="/demo"
        class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
      >
        ← Back to Demo
      </a>
    </div>

    <!-- Debug Info (dev only) -->
    {#if import.meta.env.DEV}
      <details class="mt-8 p-4 bg-white rounded-lg border border-gray-200">
        <summary class="cursor-pointer font-medium text-gray-700">
          🐛 Debug Info (dev only)
        </summary>
        <pre
          class="mt-4 p-4 bg-gray-50 rounded text-xs overflow-auto max-h-96">
{JSON.stringify($wizardStore, null, 2)}
				</pre>
      </details>
    {/if}
  </div>
</div>
