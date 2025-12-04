<!--
  StepLaunch.svelte

  Step 5: Review and launch the project
-->
<script lang="ts">
  import { wizardStore } from '../../../stores/wizard.svelte';
  import { LANGUAGES } from '$lib/data/languages';

  // Reactive bindings to wizard store
  let outputPath = $state(wizardStore.config.outputPath);
  let generateReadme = $state(wizardStore.config.generateReadme);
  let initGit = $state(wizardStore.config.initGit);

  // Sync to store on change
  $effect(() => {
    wizardStore.config.outputPath = outputPath;
  });

  $effect(() => {
    wizardStore.config.generateReadme = generateReadme;
  });

  $effect(() => {
    wizardStore.config.initGit = initGit;
  });

  // Validation
  const outputPathError = $derived(
    !outputPath || outputPath.trim().length === 0 ? 'Output directory is required' : null
  );

  // Compute project summary from config
  const summary = $derived({
    name: wizardStore.config.projectName,
    type: wizardStore.config.projectType || 'Unknown',
    languages: [
      wizardStore.config.primaryLanguage,
      ...wizardStore.config.additionalLanguages
    ].filter(Boolean),
    stack: wizardStore.config.stack || wizardStore.config.architecturePattern?.displayName || 'Not selected'
  });

  // Get enabled features
  const enabledFeatures = $derived(
    Object.entries(wizardStore.config.features)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name)
  );

  async function selectDirectory(): Promise<void> {
    // TODO: Integrate with Tauri file dialog when backend is ready
    // For now, allow manual path entry
    console.log('Directory selector not yet implemented');

    // Future implementation:
    // const { open } = await import('@tauri-apps/plugin-dialog');
    // const selected = await open({
    //   directory: true,
    //   multiple: false,
    //   title: 'Select Project Directory',
    // });
    // if (selected && typeof selected === 'string') {
    //   outputPath = selected;
    // }
  }
</script>

<div class="space-y-6">
  <!-- Project Summary -->
  <div class="p-4 bg-gunmetal-800/50 border border-gunmetal-700 rounded-lg">
    <h3 class="text-sm font-medium text-zinc-300 mb-3">Project Summary</h3>

    <div class="space-y-3">
      <div>
        <p class="text-xs font-medium text-zinc-500 mb-1">Name</p>
        <p class="text-sm text-zinc-100">{summary.name}</p>
      </div>

      <div>
        <p class="text-xs font-medium text-zinc-500 mb-1">Type</p>
        <p class="text-sm text-zinc-100 capitalize">{summary.type}</p>
      </div>

      <div>
        <p class="text-xs font-medium text-zinc-500 mb-1">Languages</p>
        <div class="flex flex-wrap gap-1.5 mt-1">
          {#each summary.languages as langId}
            {#if langId && LANGUAGES[langId]}
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gunmetal-900 border border-gunmetal-700 rounded text-xs text-zinc-400">
                <span>{LANGUAGES[langId].icon}</span>
                <span>{LANGUAGES[langId].name}</span>
              </span>
            {/if}
          {/each}
        </div>
      </div>

      <div>
        <p class="text-xs font-medium text-zinc-500 mb-1">Stack</p>
        <p class="text-sm text-zinc-100">{summary.stack}</p>
      </div>

      {#if enabledFeatures.length > 0}
        <div>
          <p class="text-xs font-medium text-zinc-500 mb-1">Features</p>
          <div class="flex flex-wrap gap-1.5 mt-1">
            {#each enabledFeatures as feature}
              <span class="px-2 py-0.5 bg-blue-900/20 border border-blue-700 rounded text-xs text-blue-400 capitalize">
                {feature}
              </span>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Output Path -->
  <div>
    <label for="output-path" class="block text-sm font-medium text-zinc-300 mb-2">
      Output Directory <span class="text-red-400">*</span>
    </label>
    <div class="flex gap-2">
      <input
        id="output-path"
        type="text"
        bind:value={outputPath}
        placeholder="/path/to/projects"
        class="
          flex-1 px-4 py-3
          bg-gunmetal-800 border rounded-lg
          text-zinc-100 placeholder:text-zinc-600
          focus:outline-none focus:ring-2 focus:ring-ember-500/50
          transition-all
          {outputPathError
            ? 'border-red-500'
            : 'border-gunmetal-700 focus:border-ember-500'}
        "
      />
      <button
        type="button"
        class="px-4 py-3 bg-gunmetal-800 border border-gunmetal-700 rounded-lg hover:bg-gunmetal-700 transition-colors"
        on:click={selectDirectory}
        aria-label="Browse for directory"
      >
        <svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </button>
    </div>
    {#if outputPathError}
      <p class="mt-1 text-sm text-red-400">
        {outputPathError}
      </p>
    {:else if outputPath}
      <p class="mt-1 text-xs text-zinc-500">
        Project will be created at: <code class="text-zinc-400">{outputPath}/{summary.name}</code>
      </p>
    {/if}
  </div>

  <!-- Options -->
  <div class="space-y-3">
    <label class="flex items-start gap-3 cursor-pointer group">
      <div class="flex-shrink-0 mt-0.5">
        <div
          class="
            w-5 h-5 rounded border-2 flex items-center justify-center transition-all
            {generateReadme
              ? 'bg-blue-600 border-blue-500'
              : 'border-gunmetal-600 group-hover:border-gunmetal-500'}
          "
        >
          {#if generateReadme}
            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          {/if}
        </div>
      </div>
      <input
        type="checkbox"
        bind:checked={generateReadme}
        class="sr-only"
      />
      <div class="flex-1">
        <p class="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">
          Generate README
        </p>
        <p class="text-xs text-zinc-500">
          Create a comprehensive README with setup instructions
        </p>
      </div>
    </label>

    <label class="flex items-start gap-3 cursor-pointer group">
      <div class="flex-shrink-0 mt-0.5">
        <div
          class="
            w-5 h-5 rounded border-2 flex items-center justify-center transition-all
            {initGit
              ? 'bg-blue-600 border-blue-500'
              : 'border-gunmetal-600 group-hover:border-gunmetal-500'}
          "
        >
          {#if initGit}
            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          {/if}
        </div>
      </div>
      <input
        type="checkbox"
        bind:checked={initGit}
        class="sr-only"
      />
      <div class="flex-1">
        <p class="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">
          Initialize Git Repository
        </p>
        <p class="text-xs text-zinc-500">
          Set up version control with .gitignore
        </p>
      </div>
    </label>
  </div>

  <!-- Info Box -->
  <div class="p-4 bg-blue-900/10 border border-blue-800 rounded-lg">
    <div class="flex gap-3">
      <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div class="flex-1">
        <p class="text-sm font-medium text-blue-400 mb-1">What Happens Next?</p>
        <ul class="text-xs text-zinc-400 space-y-1">
          <li>• Project structure will be generated</li>
          <li>• Dependencies will be configured</li>
          <li>• Workbench will be initialized with project context</li>
          <li>• You'll be ready to start coding!</li>
        </ul>
      </div>
    </div>
  </div>
</div>
