<!-- @component
### Props
- `initialContextRefs` **ContextRef[]** = `[]`
- `initialModels` **string[]** = `[]`
- `initialPreset` **Preset**
- `initialPrompt` **string**
- `initialWorkspace` **string** = `VibeForge Dev`
- `mode` **"workbench" | "quick-run"** = `workbench`
- `open` **boolean** = `false`

### Events
- `close` - Modal dismissed
- `saved` with `{ preset: Preset }` - Preset successfully saved

Save current Workbench/Quick Run configuration as a reusable preset
-->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { theme } from "$lib/stores/themeStore";
  import { presets } from "$lib/stores/presets";
  import type { Preset, PresetCategory, ContextRef } from "$lib/stores/presets";

  interface Props {
    open?: boolean;
    mode?: "workbench" | "quick-run";
    initialPrompt?: string;
    initialWorkspace?: string;
    initialModels?: string[];
    initialContextRefs?: ContextRef[];
    initialPreset?: Preset;
  }

  const {
    open = false,
    mode = "workbench",
    initialPrompt = "",
    initialWorkspace = "VibeForge Dev",
    initialModels = [],
    initialContextRefs = [],
    initialPreset,
  }: Props = $props();

  const dispatch = createEventDispatcher<{
    close: void;
    saved: { preset: Preset };
  }>();

  // Form state
  let name = $state(initialPreset?.name ?? "");
  let description = $state(initialPreset?.description ?? "");
  let category = $state<PresetCategory>(initialPreset?.category ?? "coding");
  let workspace = $state(initialPreset?.workspace ?? initialWorkspace);
  let tagsInput = $state(initialPreset?.tags?.join(", ") ?? "");
  let pinned = $state(initialPreset?.pinned ?? false);

  // Read-only captured state
  const models = $derived(initialPreset?.models ?? initialModels);
  const contextRefs = $derived(
    initialPreset?.contextRefs ?? initialContextRefs
  );
  const basePrompt = $derived(initialPreset?.basePrompt ?? initialPrompt);

  const categories: PresetCategory[] = [
    "coding",
    "writing",
    "analysis",
    "evaluation",
    "other",
  ];

  // Validation
  const isValid = $derived(
    name.trim().length > 0 && basePrompt.trim().length > 0
  );

  function handleSave() {
    if (!isValid) return;

    const now = new Date().toISOString();
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const preset: Preset = {
      id: initialPreset?.id ?? `preset-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category,
      workspace,
      tags,
      basePrompt,
      contextRefs,
      models,
      pinned,
      updatedAt: now,
    };

    if (initialPreset) {
      presets.updatePreset(preset);
      // TODO: Show toast: "Preset updated"
    } else {
      presets.createPreset({
        name: preset.name,
        description: preset.description,
        category: preset.category,
        workspace: preset.workspace,
        tags: preset.tags,
        basePrompt: preset.basePrompt,
        contextRefs: preset.contextRefs,
        models: preset.models,
        pinned: preset.pinned,
      });
      // TODO: Show toast: "Preset saved"
    }

    dispatch("saved", { preset });
    dispatch("close");
  }

  function handleClose() {
    dispatch("close");
  }
</script>

<!-- Save as Preset modal -->
{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/40"
      onclick={handleClose}
      role="button"
      tabindex="-1"
    />

    <!-- Panel -->
    <div
      class={`relative w-full max-w-lg rounded-lg border shadow-lg mx-4 transition-colors ${
        $theme === "dark"
          ? "bg-slate-950 border-slate-800"
          : "bg-white border-slate-200"
      }`}
    >
      <!-- Header -->
      <header
        class={`flex items-center justify-between px-4 py-3 border-b ${
          $theme === "dark" ? "border-slate-800" : "border-slate-200"
        }`}
      >
        <div class="flex flex-col gap-0.5">
          <h2
            class={`text-sm font-semibold ${
              $theme === "dark" ? "text-slate-100" : "text-slate-900"
            }`}
          >
            {initialPreset ? "Edit preset" : "Save as preset"}
          </h2>
          <p
            class={`text-[11px] ${
              $theme === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Capture this configuration as a reusable favorite.
          </p>
        </div>
        <button
          type="button"
          class={`text-[11px] transition-colors ${
            $theme === "dark"
              ? "text-slate-400 hover:text-slate-100"
              : "text-slate-500 hover:text-slate-900"
          }`}
          onclick={handleClose}
          title="Close modal"
        >
          ✕
        </button>
      </header>

      <!-- Body: Form fields -->
      <div
        class={`px-4 py-3 flex flex-col gap-3 text-xs border-b ${
          $theme === "dark" ? "border-slate-800" : "border-slate-200"
        } max-h-[60vh] overflow-y-auto`}
      >
        <!-- Name -->
        <div class="flex flex-col gap-1">
          <label
            class={`text-xs font-semibold ${
              $theme === "dark" ? "text-slate-100" : "text-slate-900"
            }`}
          >
            Name *
          </label>
          <input
            type="text"
            class={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
              $theme === "dark"
                ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
            }`}
            placeholder="Story Beat Expander – v3"
            bind:value={name}
          />
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-1">
          <label
            class={`text-xs font-semibold ${
              $theme === "dark" ? "text-slate-100" : "text-slate-900"
            }`}
          >
            Description
          </label>
          <textarea
            class={`rounded-md border px-2 py-1.5 text-xs leading-relaxed resize-y min-h-[60px] transition-colors ${
              $theme === "dark"
                ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
            }`}
            placeholder="Short note about when and how to use this preset."
            bind:value={description}
          />
        </div>

        <!-- Category (segmented control) -->
        <div class="flex flex-col gap-1">
          <label
            class={`text-xs font-semibold ${
              $theme === "dark" ? "text-slate-100" : "text-slate-900"
            }`}
          >
            Category
          </label>
          <div class="flex flex-wrap gap-2 text-[11px]">
            {#each categories as option (option)}
              <button
                type="button"
                class={`px-3 py-1.5 rounded-full border transition-colors ${
                  category === option
                    ? "bg-amber-500 text-slate-900 border-amber-500 font-medium"
                    : $theme === "dark"
                    ? "bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600"
                    : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                }`}
                onclick={() => (category = option)}
              >
                {option}
              </button>
            {/each}
          </div>
        </div>

        <!-- Workspace (readonly) -->
        <div class="flex flex-col gap-1">
          <label
            class={`text-xs font-semibold ${
              $theme === "dark" ? "text-slate-100" : "text-slate-900"
            }`}
          >
            Workspace
          </label>
          <input
            type="text"
            class={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
              $theme === "dark"
                ? "bg-slate-900 border-slate-700 text-slate-100"
                : "bg-slate-50 border-slate-300 text-slate-900"
            }`}
            value={workspace}
            readonly
          />
          <p
            class={`text-[11px] ${
              $theme === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Preset will be associated with this workspace.
          </p>
        </div>

        <!-- Tags -->
        <div class="flex flex-col gap-1">
          <label
            class={`text-xs font-semibold ${
              $theme === "dark" ? "text-slate-100" : "text-slate-900"
            }`}
          >
            Tags
          </label>
          <input
            type="text"
            class={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
              $theme === "dark"
                ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
            }`}
            placeholder="story, outline, Claude-first"
            bind:value={tagsInput}
          />
          <p
            class={`text-[11px] ${
              $theme === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Comma-separated. Example: <code>story, outline, evaluation</code>
          </p>
        </div>

        <!-- Pinned toggle -->
        <div
          class={`flex items-center justify-between py-1 ${
            $theme === "dark" ? "text-slate-300" : "text-slate-700"
          }`}
        >
          <label
            class="inline-flex items-center gap-2 text-[11px] cursor-pointer"
          >
            <input type="checkbox" bind:checked={pinned} />
            <span>Pin to favorites</span>
          </label>
          <span
            class={`text-[11px] ${
              $theme === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Pinned presets show up first in the drawer.
          </span>
        </div>

        <!-- Preview: Models -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div class="flex flex-col gap-1 text-[11px]">
            <h3
              class={`font-semibold ${
                $theme === "dark" ? "text-slate-100" : "text-slate-900"
              }`}
            >
              Models
            </h3>
            {#if models.length}
              <div class="flex flex-wrap gap-2">
                {#each models as model (model)}
                  <span
                    class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${
                      $theme === "dark"
                        ? "bg-slate-900 border-slate-700 text-slate-200"
                        : "bg-slate-50 border-slate-300 text-slate-700"
                    }`}
                  >
                    {model}
                  </span>
                {/each}
              </div>
            {:else}
              <p
                class={`text-[11px] ${
                  $theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
              >
                No models selected.
              </p>
            {/if}
          </div>

          <!-- Preview: Context refs -->
          <div class="flex flex-col gap-1 text-[11px]">
            <h3
              class={`font-semibold ${
                $theme === "dark" ? "text-slate-100" : "text-slate-900"
              }`}
            >
              Context refs
            </h3>
            {#if contextRefs.length}
              <div class="flex flex-wrap gap-2">
                {#each contextRefs as ctx (ctx.id)}
                  <span
                    class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${
                      $theme === "dark"
                        ? "bg-slate-900 border-slate-700 text-slate-200"
                        : "bg-slate-50 border-slate-300 text-slate-700"
                    }`}
                  >
                    {ctx.label}
                  </span>
                {/each}
              </div>
            {:else}
              <p
                class={`text-[11px] ${
                  $theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
              >
                No extra context attached.
              </p>
            {/if}
          </div>
        </div>

        <!-- Preview: Base prompt -->
        <div class="flex flex-col gap-1 text-[11px]">
          <h3
            class={`font-semibold ${
              $theme === "dark" ? "text-slate-100" : "text-slate-900"
            }`}
          >
            Base prompt
          </h3>
          <div
            class={`rounded-md border p-2 font-mono leading-relaxed max-h-[120px] overflow-y-auto whitespace-pre-wrap text-[10px] ${
              $theme === "dark"
                ? "bg-slate-900 border-slate-700 text-slate-300"
                : "bg-slate-50 border-slate-300 text-slate-700"
            }`}
          >
            {basePrompt || "No prompt text available."}
          </div>
        </div>
      </div>

      <!-- Footer: Actions -->
      <footer
        class={`flex items-center justify-between px-4 py-3 border-t ${
          $theme === "dark" ? "border-slate-800" : "border-slate-200"
        }`}
      >
        <button
          type="button"
          class={`px-3 py-1.5 rounded-md border text-[11px] font-medium transition-colors ${
            $theme === "dark"
              ? "border-slate-600 text-slate-300 hover:bg-slate-800"
              : "border-slate-300 text-slate-600 hover:bg-slate-100"
          }`}
          onclick={handleClose}
        >
          Cancel
        </button>

        <button
          type="button"
          class={`px-4 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
            isValid
              ? "bg-amber-500 text-slate-900 hover:bg-amber-600"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          }`}
          onclick={handleSave}
          disabled={!isValid}
        >
          {initialPreset ? "Save changes" : "Save preset"}
        </button>
      </footer>
    </div>
  </div>
{/if}
