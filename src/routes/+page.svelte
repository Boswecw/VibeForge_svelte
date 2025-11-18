<script lang="ts">
  import ContextColumn from '$lib/components/ContextColumn.svelte';
  import PromptColumn from '$lib/components/PromptColumn.svelte';
  import OutputColumn from '$lib/components/OutputColumn.svelte';

  import { activeContexts } from '$lib/stores/contextStore';
  import { promptState } from '$lib/stores/promptStore';
  import { runState } from '$lib/stores/runStore';
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

<!-- Workbench header -->
<div
  class="border-b border-forge-line px-4 py-3 flex items-center justify-between"
>
  <div class="flex flex-col gap-1">
    <h1 class="text-sm font-semibold">Workbench</h1>
    <p class="text-[11px] text-forge-textMuted">
      Context → Prompt → Output → Compare
    </p>
  </div>
  <div class="flex items-center gap-2 text-xs">
    <select
      class="bg-forge-steel border border-forge-line rounded-md px-2 py-1 text-xs focus:outline-none"
      bind:value={selectedModelId}
    >
      {#each models as m}
        <option value={m.id}>{m.label}</option>
      {/each}
    </select>
    <button
      type="button"
      class="px-3 py-1 rounded-md bg-forge-ember text-black text-xs font-semibold shadow-ember hover:bg-forge-emberHover transition"
      onclick={runPrompt}
    >
      Run Prompt
    </button>
  </div>
</div>

<!-- Three column layout -->
<section class="flex-1 grid grid-cols-3 gap-3 p-3 overflow-hidden">
  <!-- Context column -->
  <ContextColumn />

  <!-- Prompt column -->
  <PromptColumn />

  <!-- Output column -->
  <OutputColumn />
</section>

<!-- Status bar -->
<footer
  class="h-7 border-t border-forge-line text-[11px] text-forge-textMuted px-3 flex items-center justify-between"
>
  <span>Ready • No active runs</span>
  <span>Workspace: Default • Forge Theme: Dark</span>
</footer>
