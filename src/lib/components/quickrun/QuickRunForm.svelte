<!-- @component
### Props
- `! activeModelIds` **string[]**
- `! prompt` **string**
- `! selectedContextIds` **string[]**
- `onContextToggle` **(id: string) =► void** = `() =► {}`
- `onModelToggle` **(id: string) =► void** = `() =► {}`
- `onPromptChange` **(text: string) =► void** = `() =► {}`
- `onReset` **() =► void** = `() =► {}`
- `onRun` **() =► void** = `() =► {}`

Quick Run form: prompt input, optional context, model selection, action buttons
-->
<script lang="ts">
  import { theme } from "$lib/stores/themeStore";

  interface ContextOption {
    id: string;
    label: string;
  }

  interface Model {
    id: string;
    label: string;
  }

  interface Props {
    prompt: string;
    selectedContextIds: string[];
    activeModelIds: string[];
    onPromptChange?: (text: string) => void;
    onContextToggle?: (id: string) => void;
    onModelToggle?: (id: string) => void;
    onRun?: () => void;
    onReset?: () => void;
  }

  const {
    prompt,
    selectedContextIds,
    activeModelIds,
    onPromptChange = () => {},
    onContextToggle = () => {},
    onModelToggle = () => {},
    onRun = () => {},
    onReset = () => {},
  }: Props = $props();

  const quickContextOptions: ContextOption[] = [
    { id: "ds-authorforge", label: "AuthorForge design rules" },
    { id: "proj-vibeforge", label: "VibeForge project spec" },
    { id: "code-summary", label: "Current file summary" },
  ];

  const models: Model[] = [
    { id: "claude", label: "Claude" },
    { id: "gpt-5x", label: "GPT-5.x" },
    { id: "local", label: "Local" },
  ];
</script>

<!-- Quick Run form panel -->
<section
  class={`rounded-lg border p-4 flex flex-col gap-4 transition-colors ${
    $theme === "dark"
      ? "bg-slate-900 border-slate-700"
      : "bg-white border-slate-200 shadow-sm"
  }`}
>
  <!-- Prompt input -->
  <div class="flex flex-col gap-1">
    <label
      for="quick-prompt"
      class={`text-xs font-semibold ${
        $theme === "dark" ? "text-slate-100" : "text-slate-900"
      }`}
    >
      Prompt
    </label>
    <textarea
      id="quick-prompt"
      value={prompt}
      onchange={(e) => onPromptChange((e.target as HTMLTextAreaElement).value)}
      oninput={(e) => onPromptChange((e.target as HTMLTextAreaElement).value)}
      placeholder="Write a short instruction for the model…"
      class={`w-full min-h-[160px] resize-y rounded-md border text-sm font-mono leading-relaxed p-3 transition-colors ${
        $theme === "dark"
          ? "bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
          : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
      }`}
    />
    <p
      class={`text-[11px] ${
        $theme === "dark" ? "text-slate-400" : "text-slate-500"
      }`}
    >
      Keep it concise. For heavier flows, use the full Workbench.
    </p>
  </div>

  <!-- Optional context -->
  <div class="flex flex-col gap-2">
    <label
      class={`text-xs font-semibold ${
        $theme === "dark" ? "text-slate-100" : "text-slate-900"
      }`}
    >
      Optional context
    </label>
    <div class="flex flex-wrap gap-2 text-[11px]">
      {#each quickContextOptions as ctx (ctx.id)}
        <button
          class={`inline-flex items-center rounded-full border px-3 py-1 transition-colors ${
            selectedContextIds.includes(ctx.id)
              ? "bg-amber-500 text-slate-900 border-amber-500 font-medium"
              : $theme === "dark"
                ? "bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-900 hover:border-slate-600"
                : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400"
          }`}
          type="button"
          onclick={() => onContextToggle(ctx.id)}
          title={selectedContextIds.includes(ctx.id) ? "Remove context" : "Add context"}
        >
          {ctx.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Model selection -->
  <div class="flex flex-col gap-2">
    <label
      class={`text-xs font-semibold ${
        $theme === "dark" ? "text-slate-100" : "text-slate-900"
      }`}
    >
      Models
    </label>
    <div class="flex flex-wrap gap-2 text-[11px]">
      {#each models as model (model.id)}
        <button
          class={`inline-flex items-center rounded-full border px-3 py-1 transition-colors ${
            activeModelIds.includes(model.id)
              ? "bg-amber-500 text-slate-900 border-amber-500 font-medium"
              : $theme === "dark"
                ? "bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-900 hover:border-slate-600"
                : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400"
          }`}
          type="button"
          onclick={() => onModelToggle(model.id)}
          title={activeModelIds.includes(model.id) ? "Deselect model" : "Select model"}
        >
          {model.label}
        </button>
      {/each}
    </div>
    <p
      class={`text-[11px] ${
        $theme === "dark" ? "text-slate-400" : "text-slate-500"
      }`}
    >
      Choose one or two models for quick comparison.
    </p>
  </div>

  <!-- Actions row -->
  <div
    class="flex items-center justify-between gap-2 text-xs pt-2 border-t"
    class:border-slate-700={$theme === "dark"}
    class:border-slate-200={$theme !== "dark"}
  >
    <div class="flex gap-2">
      <button
        class="px-4 py-1.5 rounded-md text-xs font-medium bg-amber-500 text-slate-900 hover:bg-amber-600 transition-colors"
        type="button"
        onclick={onRun}
        title="Run prompt against selected models"
      >
        Run
      </button>
      <button
        class={`px-3 py-1.5 rounded-md border transition-colors ${
          $theme === "dark"
            ? "border-slate-600 text-slate-300 hover:bg-slate-800"
            : "border-slate-300 text-slate-600 hover:bg-slate-100"
        }`}
        type="button"
        onclick={onReset}
        title="Clear prompt and reset selections"
      >
        Reset
      </button>
    </div>
    <p
      class={`text-[11px] ${
        $theme === "dark" ? "text-slate-400" : "text-slate-500"
      }`}
    >
      Mock UI. TODO: Wire to backend API.
    </p>
  </div>
</section>
