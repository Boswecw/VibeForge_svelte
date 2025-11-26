<!-- @component
### Props
- `! mode` **"create" | "edit"**
- `! open` **boolean**
- `initialWorkspace` **Workspace | null** = `null`
- `onCancel` **() =► void** = `() =► {}`
- `onSave` **(workspace: Workspace) =► void** = `() =► {}`

Right-side slide-in drawer for workspace creation and editing
-->
<script lang="ts">
  import { themeStore } from "$lib/core/stores";
  import type { Workspace } from "$lib/types/workspace";

  interface Props {
    open: boolean;
    mode: "create" | "edit";
    initialWorkspace?: Workspace | null;
    onSave?: (workspace: Workspace) => void;
    onCancel?: () => void;
  }

  const {
    open,
    mode,
    initialWorkspace = null,
    onSave = () => {},
    onCancel = () => {},
  }: Props = $props();

  // Form state
  let name = $state(initialWorkspace?.name || "");
  let slug = $state(initialWorkspace?.slug || "");
  let description = $state(initialWorkspace?.description || "");
  let tags = $state(initialWorkspace?.tags?.join(", ") || "");
  let selectedModels = $state(initialWorkspace?.models || []);
  let evaluationScale = $state<"1-5" | "1-10">(
    initialWorkspace?.settings?.defaultEvaluationScale || "1-5"
  );
  let requireWinner = $state(
    initialWorkspace?.settings?.requireWinner || false
  );

  const availableModels = ["Claude", "GPT-5.x", "Local", "Gemini"];

  // Auto-generate slug from name
  $effect(() => {
    if (mode === "create" || !initialWorkspace) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }
  });

  const handleSave = () => {
    if (!name.trim()) {
      alert("Workspace name is required");
      return;
    }

    const workspace: Workspace = {
      id: initialWorkspace?.id || Date.now().toString(),
      name: name.trim(),
      slug: slug.trim() || "untitled",
      description: description.trim(),
      createdAt: initialWorkspace?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: initialWorkspace?.isDefault || false,
      status: initialWorkspace?.status || "active",
      models: selectedModels,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t),
      settings: {
        defaultEvaluationScale: evaluationScale as "1-5" | "1-10",
        requireWinner,
      },
      stats: initialWorkspace?.stats || {
        totalRuns: 0,
      },
    };

    onSave(workspace);
    // TODO: Wire workspace create/update to backend or global store
  };

  const toggleModel = (model: string) => {
    if (selectedModels.includes(model)) {
      selectedModels = selectedModels.filter((m) => m !== model);
    } else {
      selectedModels = [...selectedModels, model];
    }
  };
</script>

<!-- Overlay backdrop -->
{#if open}
  <div
    class="fixed inset-0 z-40 bg-black/40"
    onclick={onCancel}
    role="button"
    tabindex="-1"
  ></div>
{/if}

<!-- Right-side drawer -->
<div
  class={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-y-auto transform transition-transform duration-300 ${
    open ? "translate-x-0" : "translate-x-full"
  } ${
    themeStore.current === "dark"
      ? "bg-slate-900 border-l border-slate-700"
      : "bg-white border-l border-slate-200"
  }`}
>
  <!-- Header -->
  <div
    class={`sticky top-0 border-b px-4 py-3 flex items-center justify-between ${
      themeStore.current === "dark" ? "border-slate-700" : "border-slate-200"
    }`}
  >
    <h2
      class={`text-sm font-semibold ${
        themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
      }`}
    >
      {mode === "create" ? "New workspace" : "Edit workspace"}
    </h2>
    <button
      class={`text-lg leading-none hover:opacity-70 transition-opacity ${
        themeStore.current === "dark" ? "text-slate-400" : "text-slate-600"
      }`}
      onclick={onCancel}
      title="Close drawer"
    >
      ✕
    </button>
  </div>

  <!-- Form -->
  <div class="p-4 flex flex-col gap-4">
    <!-- Name -->
    <div class="flex flex-col gap-1">
      <label
        for="workspace-name"
        class={`text-xs font-semibold ${
          themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
        }`}
      >
        Workspace name
        <span class="text-rose-400">*</span>
      </label>
      <input
        id="workspace-name"
        type="text"
        bind:value={name}
        placeholder="e.g., AuthorForge"
        class={`rounded-md px-3 py-2 text-xs border transition-colors ${
          themeStore.current === "dark"
            ? "bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-amber-500"
            : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500"
        } focus:outline-none`}
      />
    </div>

    <!-- Slug -->
    <div class="flex flex-col gap-1">
      <label
        for="workspace-slug"
        class={`text-xs font-semibold ${
          themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
        }`}
      >
        Slug (URL-safe)
      </label>
      <input
        id="workspace-slug"
        type="text"
        bind:value={slug}
        placeholder="auto-generated"
        class={`rounded-md px-3 py-2 text-xs border transition-colors ${
          themeStore.current === "dark"
            ? "bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-amber-500"
            : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500"
        } focus:outline-none`}
      />
      <p
        class={`text-[10px] ${
          themeStore.current === "dark" ? "text-slate-500" : "text-slate-500"
        }`}
      >
        Auto-generated from name
      </p>
    </div>

    <!-- Description -->
    <div class="flex flex-col gap-1">
      <label
        for="workspace-desc"
        class={`text-xs font-semibold ${
          themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
        }`}
      >
        Description
      </label>
      <textarea
        id="workspace-desc"
        bind:value={description}
        placeholder="Brief description of this workspace..."
        rows="3"
        class={`rounded-md px-3 py-2 text-xs border resize-none transition-colors ${
          themeStore.current === "dark"
            ? "bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-amber-500"
            : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500"
        } focus:outline-none`}
      ></textarea>
    </div>

    <!-- Tags -->
    <div class="flex flex-col gap-1">
      <label
        for="workspace-tags"
        class={`text-xs font-semibold ${
          themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
        }`}
      >
        Tags (comma-separated)
      </label>
      <input
        id="workspace-tags"
        type="text"
        bind:value={tags}
        placeholder="e.g., authoring, research"
        class={`rounded-md px-3 py-2 text-xs border transition-colors ${
          themeStore.current === "dark"
            ? "bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-amber-500"
            : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500"
        } focus:outline-none`}
      />
    </div>

    <!-- Default models -->
    <div class="flex flex-col gap-2">
      <label
        class={`text-xs font-semibold ${
          themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
        }`}
      >
        Default models
      </label>
      <div class="flex flex-wrap gap-2">
        {#each availableModels as model (model)}
          <label
            class={`flex items-center gap-2 text-[11px] cursor-pointer px-2 py-1 rounded-md border transition-colors ${
              selectedModels.includes(model)
                ? themeStore.current === "dark"
                  ? "border-amber-500 bg-amber-950/40"
                  : "border-amber-500 bg-amber-50"
                : themeStore.current === "dark"
                ? "border-slate-700 hover:border-slate-600"
                : "border-slate-300 hover:border-slate-200"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedModels.includes(model)}
              onchange={() => toggleModel(model)}
              class="w-3 h-3 cursor-pointer"
            />
            <span>{model}</span>
          </label>
        {/each}
      </div>
    </div>

    <!-- Evaluation scale -->
    <div class="flex flex-col gap-2">
      <label
        class={`text-xs font-semibold ${
          themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
        }`}
      >
        Evaluation scale
      </label>
      <div class="flex gap-3">
        {#each ["1-5", "1-10"] as scale (scale)}
          <label
            class={`flex items-center gap-2 text-[11px] cursor-pointer px-3 py-1 rounded-md border transition-colors ${
              evaluationScale === scale
                ? themeStore.current === "dark"
                  ? "border-amber-500 bg-amber-950/40"
                  : "border-amber-500 bg-amber-50"
                : themeStore.current === "dark"
                ? "border-slate-700 hover:border-slate-600"
                : "border-slate-300 hover:border-slate-200"
            }`}
          >
            <input
              type="radio"
              name="evaluation-scale"
              value={scale}
              bind:group={evaluationScale}
              class="w-3 h-3 cursor-pointer"
            />
            <span>{scale}</span>
          </label>
        {/each}
      </div>
    </div>

    <!-- Require winner -->
    <label
      class={`flex items-center gap-2 text-[11px] cursor-pointer px-2 py-1 rounded-md ${
        themeStore.current === "dark" ? "text-slate-300" : "text-slate-700"
      }`}
    >
      <input
        type="checkbox"
        bind:checked={requireWinner}
        class="w-4 h-4 cursor-pointer"
      />
      <span>Require winner for completion</span>
    </label>

    <!-- Actions -->
    <div
      class="flex gap-2 justify-end pt-4 border-t"
      class:border-slate-700={themeStore.current === "dark"}
      class:border-slate-200={themeStore.current !== "dark"}
    >
      <button
        class={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
          themeStore.current === "dark"
            ? "border-slate-700 text-slate-300 hover:bg-slate-800"
            : "border-slate-300 text-slate-600 hover:bg-slate-100"
        }`}
        onclick={onCancel}
      >
        Cancel
      </button>
      <button
        class="px-3 py-1.5 rounded-md text-xs font-medium bg-amber-500 text-slate-900 hover:bg-amber-600 transition-colors"
        onclick={handleSave}
      >
        {mode === "create" ? "Create" : "Save"}
      </button>
    </div>
  </div>
</div>
