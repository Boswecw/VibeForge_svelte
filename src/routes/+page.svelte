<script lang="ts">
  import ContextColumn from '$lib/components/ContextColumn.svelte';
  import PromptColumn from '$lib/components/PromptColumn.svelte';
  import OutputColumn from '$lib/components/OutputColumn.svelte';

  import { activeContexts } from '$lib/stores/contextStore';
  import { promptState, estimatedTokens } from '$lib/stores/promptStore';
  import { runState } from '$lib/stores/runStore';
  import { theme } from '$lib/stores/themeStore';
  import type { ContextBlock } from '$lib/types/context';
  import { get } from 'svelte/store';

  type ModelOption = {
    id: string;
    label: string;
  };

  const models: ModelOption[] = [
    { id: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { id: 'gpt-5.1', label: 'GPT-5.1' },
    { id: 'local-llm', label: 'Local LLM' }
  ];

  let selectedModelId = $state(models[0].id);

  const runPrompt = () => {
    const prompt = get(promptState).text.trim();
    const contexts = get(activeContexts) as ContextBlock[];
    const model = models.find((m) => m.id === selectedModelId) ?? models[0];

    if (!prompt) {
      // no-op for now; later we can add a toast or inline warning
      return;
    }

    const contextTitles = contexts.map((c) => c.title);

    const mockOutput = [
      `Model: ${model.label}`,
      '',
      'This is a placeholder output. In the real system, this text will come from the backend, which calls the selected LLM using:',
      '- The current prompt',
      '- The active context blocks',
      '- The selected model configuration',
      '',
      'You can now design how results are evaluated, compared, and saved.'
    ].join('\n');

    const run = {
      id: `run-${Date.now()}`,
      modelId: model.id,
      modelLabel: model.label,
      createdAt: new Date().toISOString(),
      promptSnapshot: prompt,
      contextTitles,
      status: 'success' as const,
      outputText: mockOutput
    };

    runState.addRun(run);
  };
</script>

<!-- Workbench shell with max-width constraint for comfortable viewing -->
<div class="flex-1 flex flex-col max-w-[1920px] mx-auto w-full">
  <!-- Workbench header: model selection and primary actions -->
  <div
    class={`border-b px-6 py-4 flex items-center justify-between transition-colors ${
      $theme === 'dark'
        ? 'border-slate-700'
        : 'border-slate-200'
    }`}
  >
    <div class="flex flex-col gap-1">
      <h1 class={`text-base font-semibold tracking-tight ${
        $theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
      }`}>Workbench</h1>
      <p class={`text-xs ${
        $theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
      }`}>
        Context → Prompt → Output → Compare
      </p>
    </div>
    <div class="flex items-center gap-3">
      <select
        class={`border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
          $theme === 'dark'
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-300 text-slate-900'
        }`}
        bind:value={selectedModelId}
      >
        {#each models as m}
          <option value={m.id}>{m.label}</option>
        {/each}
      </select>
      <button
        type="button"
        class={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
          $theme === 'dark'
            ? 'bg-amber-500 text-slate-900 hover:bg-amber-600 shadow-lg shadow-amber-500/20'
            : 'bg-amber-500 text-slate-900 hover:bg-amber-600 shadow-md'
        }`}
        onclick={runPrompt}
      >
        Run Prompt
      </button>
    </div>
  </div>

  <!-- 3-column grid: Context | Prompt (wider) | Output, with generous spacing -->
  <div class="flex-1 px-6 py-6 overflow-auto">
    <div class="grid grid-cols-1 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)_minmax(0,0.9fr)] gap-6 h-full">
      <!-- Context column -->
      <ContextColumn />

      <!-- Prompt column (visually emphasized as the main workspace) -->
      <PromptColumn />

      <!-- Output column -->
      <OutputColumn />
    </div>
  </div>

  <!-- Status bar: workspace info and metrics -->
  <footer
    class={`border-t text-xs px-6 py-3 flex items-center justify-between transition-colors ${
      $theme === 'dark'
        ? 'border-slate-700 text-slate-400'
        : 'border-slate-200 text-slate-500'
    }`}
  >
    <span>Ready • No active runs</span>
    <span>Workspace: Default • Theme: {$theme === 'dark' ? 'Dark' : 'Light'} • Tokens: ~{$estimatedTokens}</span>
  </footer>
</div>
