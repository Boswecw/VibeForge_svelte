<!--
  WelcomeScreen.svelte

  First-visit welcome screen that introduces users to VibeForge
  and offers to launch the wizard or skip to workbench.
-->
<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { wizardStore, userPreferencesStore } from '../stores';

  interface Props {
    isOpen?: boolean;
    onClose?: () => void;
  }

  let { isOpen = false, onClose }: Props = $props();

  function handleStartWizard(): void {
    userPreferencesStore.update('showWizardOnFirstVisit', false);
    wizardStore.open();
    onClose?.();
  }

  function handleSkip(): void {
    userPreferencesStore.update('showWizardOnFirstVisit', false);
    userPreferencesStore.update('skipWizard', true);
    onClose?.();
  }

  function handleLearnMore(): void {
    // TODO: Navigate to docs or show tour
    console.log('Learn more about VibeForge');
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 bg-blacksteel-950/90 backdrop-blur-sm"
    transition:fade={{ duration: 200 }}
  />

  <!-- Welcome Modal -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="welcome-title"
  >
    <div
      class="
        relative w-full max-w-2xl
        bg-gunmetal-900 border border-gunmetal-700 rounded-xl
        shadow-2xl shadow-blacksteel-950/50
        overflow-hidden
      "
      transition:fly={{ y: 20, duration: 300, easing: cubicOut }}
    >
      <!-- Header with gradient -->
      <div class="relative px-8 pt-8 pb-6 bg-gradient-to-br from-gunmetal-800 to-gunmetal-900">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0">
            <div class="w-16 h-16 bg-ember-600 rounded-xl flex items-center justify-center">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div class="flex-1">
            <h1 id="welcome-title" class="text-2xl font-bold text-zinc-100 mb-2">
              Welcome to VibeForge
            </h1>
            <p class="text-zinc-400">
              Your AI-powered prompt engineering workbench
            </p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="px-8 py-6 space-y-6">
        <!-- Features Grid -->
        <div class="grid grid-cols-2 gap-4">
          <div class="p-4 bg-gunmetal-800/50 border border-gunmetal-700 rounded-lg">
            <div class="text-2xl mb-2">🚀</div>
            <h3 class="text-sm font-medium text-zinc-300 mb-1">Guided Wizard</h3>
            <p class="text-xs text-zinc-500">
              Step-by-step project creation with AI recommendations
            </p>
          </div>

          <div class="p-4 bg-gunmetal-800/50 border border-gunmetal-700 rounded-lg">
            <div class="text-2xl mb-2">⚡</div>
            <h3 class="text-sm font-medium text-zinc-300 mb-1">3-Column Workbench</h3>
            <p class="text-xs text-zinc-500">
              Context, prompts, and outputs in one powerful interface
            </p>
          </div>

          <div class="p-4 bg-gunmetal-800/50 border border-gunmetal-700 rounded-lg">
            <div class="text-2xl mb-2">🎯</div>
            <h3 class="text-sm font-medium text-zinc-300 mb-1">Smart Context</h3>
            <p class="text-xs text-zinc-500">
              Auto-generated context blocks from your project setup
            </p>
          </div>

          <div class="p-4 bg-gunmetal-800/50 border border-gunmetal-700 rounded-lg">
            <div class="text-2xl mb-2">📊</div>
            <h3 class="text-sm font-medium text-zinc-300 mb-1">Learning System</h3>
            <p class="text-xs text-zinc-500">
              Tracks what works to improve future recommendations
            </p>
          </div>
        </div>

        <!-- Getting Started -->
        <div class="p-4 bg-blue-900/10 border border-blue-800 rounded-lg">
          <h3 class="text-sm font-medium text-blue-400 mb-2">
            Ready to Get Started?
          </h3>
          <p class="text-xs text-zinc-400 mb-3">
            We recommend starting with the wizard to set up your first project.
            It'll teach you the workbench features as you go.
          </p>
          <div class="flex items-center gap-2 text-xs text-zinc-500">
            <span class="text-ember-500">→</span>
            Power users can use <kbd class="px-2 py-0.5 bg-gunmetal-800 border border-gunmetal-700 rounded text-zinc-400">⌘N</kbd> anytime
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="px-8 py-6 bg-gunmetal-900/50 border-t border-gunmetal-700 flex items-center justify-between">
        <button
          type="button"
          class="text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
          on:click={handleLearnMore}
        >
          Learn More
        </button>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="px-4 py-2 text-sm text-zinc-300 hover:text-zinc-100 transition-colors"
            on:click={handleSkip}
          >
            Skip for Now
          </button>

          <button
            type="button"
            class="
              px-5 py-2 text-sm font-medium rounded-lg
              bg-ember-600 text-white
              hover:bg-ember-500
              transition-colors
              flex items-center gap-2
            "
            on:click={handleStartWizard}
          >
            Start Wizard
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
