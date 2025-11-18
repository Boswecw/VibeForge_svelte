<!-- @component
### Props
- `! preset` **Preset | null**
- `mode` **"workbench" | "quick-run"** = `workbench`
- `onApplyPreset` **(preset: Preset) =► void** = `() =► {}`

Detail panel showing full preset info and apply action
-->
<script lang="ts">
  import { theme } from "$lib/stores/themeStore";
  import type { Preset } from "$lib/stores/presets";

  interface Props {
    preset: Preset | null;
    mode?: "workbench" | "quick-run";
    onApplyPreset?: (preset: Preset) => void;
  }

  const {
    preset,
    mode = "workbench",
    onApplyPreset = () => {},
  }: Props = $props();

  const applyLabel =
    mode === "workbench" ? "Apply to Workbench" : "Apply to Quick Run";
</script>

<!-- Preset detail panel -->
<section
  class={`border-t px-4 py-3 flex flex-col gap-3 text-xs ${
    $theme === "dark"
      ? "border-slate-800 bg-slate-950"
      : "border-slate-200 bg-slate-50"
  }`}
>
  {#if preset}
    <!-- Header -->
    <header class="flex items-center justify-between gap-2">
      <div class="flex flex-col gap-0.5 flex-1 min-w-0">
        <h3
          class={`text-xs font-semibold truncate ${
            $theme === "dark" ? "text-slate-100" : "text-slate-900"
          }`}
        >
          {preset.name}
        </h3>
        <p
          class={`text-[10px] truncate ${
            $theme === "dark" ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {preset.workspace} · {preset.category}
        </p>
      </div>
    </header>

    <!-- Tags -->
    {#if preset.tags?.length}
      <div class="flex flex-wrap gap-1">
        {#each preset.tags as tag (tag)}
          <span
            class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] ${
              $theme === "dark"
                ? "border-slate-700 text-slate-300"
                : "border-slate-300 text-slate-600"
            }`}
          >
            {tag}
          </span>
        {/each}
      </div>
    {/if}

    <!-- Base Prompt -->
    <section class="flex flex-col gap-1">
      <h4
        class={`text-[10px] font-semibold ${
          $theme === "dark" ? "text-slate-100" : "text-slate-900"
        }`}
      >
        Base prompt
      </h4>
      <div
        class={`rounded-md border p-2 text-[10px] font-mono leading-relaxed whitespace-pre-wrap max-h-[120px] overflow-y-auto ${
          $theme === "dark"
            ? "bg-slate-900 border-slate-700 text-slate-200"
            : "bg-white border-slate-300 text-slate-800"
        }`}
      >
        {preset.basePrompt}
      </div>
    </section>

    <!-- Context References -->
    <section class="flex flex-col gap-1">
      <h4
        class={`text-[10px] font-semibold ${
          $theme === "dark" ? "text-slate-100" : "text-slate-900"
        }`}
      >
        Context refs
      </h4>
      {#if preset.contextRefs?.length}
        <div class="flex flex-wrap gap-2 text-[10px]">
          {#each preset.contextRefs as ctx (ctx.id)}
            <span
              class={`inline-flex items-center rounded-full border px-2 py-0.5 ${
                $theme === "dark"
                  ? "border-slate-700 text-slate-300"
                  : "border-slate-300 text-slate-600"
              }`}
            >
              {ctx.label}
            </span>
          {/each}
        </div>
      {:else}
        <p
          class={`text-[10px] ${
            $theme === "dark" ? "text-slate-400" : "text-slate-500"
          }`}
        >
          None
        </p>
      {/if}
    </section>

    <!-- Models -->
    <section class="flex flex-col gap-1">
      <h4
        class={`text-[10px] font-semibold ${
          $theme === "dark" ? "text-slate-100" : "text-slate-900"
        }`}
      >
        Models
      </h4>
      <div class="flex flex-wrap gap-2 text-[10px]">
        {#each preset.models as model (model)}
          <span
            class={`inline-flex items-center rounded-full border px-2 py-0.5 ${
              $theme === "dark"
                ? "border-slate-700 text-slate-300"
                : "border-slate-300 text-slate-600"
            }`}
          >
            {model}
          </span>
        {/each}
      </div>
    </section>

    <!-- Actions -->
    <footer
      class="flex items-center justify-between gap-2 text-[10px] pt-2 border-t"
      class:border-slate-800={$theme === "dark"}
      class:border-slate-200={$theme !== "dark"}
    >
      <div class="flex gap-2">
        <button
          class="px-3 py-1.5 rounded-md bg-amber-500 text-slate-900 font-medium text-[11px] hover:bg-amber-600 transition-colors"
          onclick={() => onApplyPreset(preset)}
          title={applyLabel}
        >
          Apply
        </button>
        <button
          class={`px-3 py-1.5 rounded-md border text-[11px] transition-colors ${
            $theme === "dark"
              ? "border-slate-700 text-slate-300 hover:bg-slate-900"
              : "border-slate-300 text-slate-600 hover:bg-slate-100"
          }`}
          disabled
          title="Edit preset (coming soon)"
        >
          Edit
        </button>
      </div>
      <span
        class={`text-[9px] ${
          $theme === "dark" ? "text-slate-500" : "text-slate-400"
        }`}
      >
        {preset.id}
      </span>
    </footer>
  {:else}
    <div class="flex items-center justify-center py-6">
      <p
        class={`text-[11px] ${
          $theme === "dark" ? "text-slate-400" : "text-slate-500"
        }`}
      >
        Select a preset to view details.
      </p>
    </div>
  {/if}
</section>
