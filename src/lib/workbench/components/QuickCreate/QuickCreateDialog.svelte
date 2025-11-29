<!--
  QuickCreateDialog.svelte

  Quick project creation dialog for power users.
  Minimal fields, sensible defaults, fast workflow.
-->
<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { projectStore, wizardStore } from '../../stores';
  import { ALL_STACKS } from '$lib/data/stack-profiles';
  import { LANGUAGES } from '$lib/data/languages';
  import type { ProjectType } from '../../types/wizard';

  interface Props {
    isOpen?: boolean;
    onClose?: () => void;
  }

  // Use props object directly
  const props = $props<Props>();

  // Helper for isOpen with default
  const isOpen = $derived(props.isOpen ?? false);

  // Quick create state (minimal fields)
  let projectName = $state('');
  let primaryLanguage = $state('javascript-typescript');
  let stackId = $state('t3-stack');
  let outputPath = $state('');
  let isCreating = $state(false);
  let error = $state<string | null>(null);

  // Validation
  const isValid = $derived(
    projectName.trim().length >= 2 &&
    /^[a-z0-9-_]+$/i.test(projectName) &&
    primaryLanguage &&
    stackId &&
    outputPath.trim().length > 0
  );

  // Popular stacks for quick access
  const popularStacks = $derived(
    ALL_STACKS
      .filter(s => s.popularity >= 70)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 6)
  );

  // Popular languages
  const popularLanguages = $derived(
    Object.values(LANGUAGES)
      .filter(l => ['javascript-typescript', 'python', 'rust', 'go', 'java', 'csharp'].includes(l.id))
  );

  async function handleCreate(): Promise<void> {
    if (!isValid || isCreating) return;

    isCreating = true;
    error = null;

    try {
      const selectedStack = ALL_STACKS.find(s => s.id === stackId);
      if (!selectedStack) throw new Error('Stack not found');

      // Create wizard data with sensible defaults
      const wizardData = {
        projectName,
        projectDescription: `A ${selectedStack.name} project`,
        projectType: selectedStack.category as ProjectType,
        complexity: 'moderate' as const,
        primaryLanguage,
        secondaryLanguages: [],
        languagesConsidered: [],
        selectedStack,
        stacksCompared: [],
        aiRecommendations: [],
        architecturesConsidered: [], // For Phase 1 - empty for legacy mode
        componentConfigs: new Map(), // For Phase 1 - empty for legacy mode
        features: {
          testing: true,
          docker: false,
          ci: false,
        },
        teamSize: 1,
        timeline: 'month' as const,
        outputPath,
        generateReadme: true,
        initGit: true,
      };

      await projectStore.createFromWizard(wizardData);

      // Success - close dialog
      reset();
      props.onClose?.();
    } catch (e) {
      console.error('Quick create failed:', e);
      error = e instanceof Error ? e.message : 'Failed to create project';
    } finally {
      isCreating = false;
    }
  }

  function reset(): void {
    projectName = '';
    primaryLanguage = 'javascript-typescript';
    stackId = 't3-stack';
    outputPath = '';
    error = null;
  }

  function handleClose(): void {
    if (!isCreating) {
      reset();
      props.onClose?.();
    }
  }

  function handleOpenWizard(): void {
    if (!isCreating) {
      reset();
      props.onClose?.();
      // Open wizard after Quick Create closes
      wizardStore.open();
    }
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && !isCreating) {
      e.preventDefault();
      handleClose();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && isValid) {
      e.preventDefault();
      handleCreate();
    }
  }

  async function selectDirectory(): Promise<void> {
    // TODO: Integrate with Tauri file dialog
    console.log('Directory selector not yet implemented');
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-40 bg-blacksteel-950/80 backdrop-blur-sm"
    transition:fade={{ duration: 150 }}
    on:click={handleClose}
    on:keydown={(e) => e.key === 'Escape' && handleClose()}
    role="button"
    tabindex="-1"
    aria-label="Close quick create"
  />

  <!-- Dialog -->
  <div
    class="fixed inset-4 z-50 flex items-center justify-center pointer-events-none"
    role="dialog"
    aria-modal="true"
    aria-labelledby="quick-create-title"
  >
    <div
      class="
        relative w-full max-w-lg
        bg-gunmetal-900 border border-gunmetal-700 rounded-xl
        shadow-2xl shadow-blacksteel-950/50
        pointer-events-auto
        flex flex-col
      "
      transition:fly={{ y: -20, duration: 200, easing: cubicOut }}
    >
      <!-- Header -->
      <header class="flex items-center justify-between px-6 py-4 border-b border-gunmetal-700">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-ember-600/20 border border-ember-500 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-ember-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 id="quick-create-title" class="text-lg font-semibold text-zinc-100">
              Quick Create
            </h2>
            <p class="text-xs text-zinc-500">
              Fast project setup with defaults
            </p>
          </div>
        </div>

        <button
          type="button"
          class="p-2 text-zinc-400 hover:text-zinc-100 transition-colors rounded-lg hover:bg-gunmetal-800"
          aria-label="Close"
          on:click={handleClose}
          disabled={isCreating}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <!-- Content -->
      <div class="p-6 space-y-4">
        {#if error}
          <div class="p-3 bg-red-900/20 border border-red-800 rounded-lg text-sm text-red-400">
            {error}
          </div>
        {/if}

        <!-- Project Name -->
        <div>
          <label for="qc-name" class="block text-sm font-medium text-zinc-300 mb-2">
            Project Name <span class="text-red-400">*</span>
          </label>
          <input
            id="qc-name"
            type="text"
            bind:value={projectName}
            placeholder="my-awesome-project"
            class="
              w-full px-4 py-2.5
              bg-gunmetal-800 border border-gunmetal-700 rounded-lg
              text-zinc-100 placeholder:text-zinc-600
              focus:outline-none focus:border-ember-500 focus:ring-2 focus:ring-ember-500/50
              transition-all
            "
            autofocus
            disabled={isCreating}
          />
        </div>

        <!-- Language & Stack (Side by Side) -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="qc-lang" class="block text-sm font-medium text-zinc-300 mb-2">
              Language
            </label>
            <select
              id="qc-lang"
              bind:value={primaryLanguage}
              class="
                w-full px-3 py-2.5
                bg-gunmetal-800 border border-gunmetal-700 rounded-lg
                text-zinc-100 text-sm
                focus:outline-none focus:border-ember-500 focus:ring-2 focus:ring-ember-500/50
                transition-all
              "
              disabled={isCreating}
            >
              {#each popularLanguages as lang}
                <option value={lang.id}>{lang.name}</option>
              {/each}
            </select>
          </div>

          <div>
            <label for="qc-stack" class="block text-sm font-medium text-zinc-300 mb-2">
              Stack
            </label>
            <select
              id="qc-stack"
              bind:value={stackId}
              class="
                w-full px-3 py-2.5
                bg-gunmetal-800 border border-gunmetal-700 rounded-lg
                text-zinc-100 text-sm
                focus:outline-none focus:border-ember-500 focus:ring-2 focus:ring-ember-500/50
                transition-all
              "
              disabled={isCreating}
            >
              {#each popularStacks as stack}
                <option value={stack.id}>{stack.displayName || stack.name}</option>
              {/each}
            </select>
          </div>
        </div>

        <!-- Output Path -->
        <div>
          <label for="qc-path" class="block text-sm font-medium text-zinc-300 mb-2">
            Output Directory <span class="text-red-400">*</span>
          </label>
          <div class="flex gap-2">
            <input
              id="qc-path"
              type="text"
              bind:value={outputPath}
              placeholder="/path/to/projects"
              class="
                flex-1 px-4 py-2.5
                bg-gunmetal-800 border border-gunmetal-700 rounded-lg
                text-zinc-100 placeholder:text-zinc-600
                focus:outline-none focus:border-ember-500 focus:ring-2 focus:ring-ember-500/50
                transition-all
              "
              disabled={isCreating}
            />
            <button
              type="button"
              class="px-3 py-2.5 bg-gunmetal-800 border border-gunmetal-700 rounded-lg hover:bg-gunmetal-700 transition-colors disabled:opacity-50"
              on:click={selectDirectory}
              disabled={isCreating}
              aria-label="Browse"
            >
              <svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Info -->
        <div class="p-3 bg-blue-900/10 border border-blue-800 rounded-lg text-xs text-zinc-400">
          <p class="font-medium text-blue-400 mb-1">Default Settings</p>
          <ul class="space-y-0.5">
            <li>• Testing framework included</li>
            <li>• README auto-generated</li>
            <li>• Git repository initialized</li>
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <footer class="flex items-center justify-between px-6 py-4 border-t border-gunmetal-700 bg-gunmetal-900/50">
        <div class="text-xs text-zinc-500">
          Need more options? <button type="button" class="text-ember-400 hover:text-ember-300" on:click={handleOpenWizard}>Use wizard</button>
        </div>

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
          disabled={!isValid || isCreating}
          on:click={handleCreate}
        >
          {#if isCreating}
            <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Creating...
          {:else}
            Create
            <span class="text-xs opacity-75">⌘↵</span>
          {/if}
        </button>
      </footer>
    </div>
  </div>
{/if}
