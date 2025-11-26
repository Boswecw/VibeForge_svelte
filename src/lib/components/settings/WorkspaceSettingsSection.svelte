<!-- @component
no description yet
-->
<script lang="ts">
  import { themeStore } from "$lib/core/stores";

  // Type for model IDs
  type ModelId = "claude" | "gpt" | "local";

  // Local state for workspace settings
  let defaultWorkspace = $state("AuthorForge");
  let defaultModels = $state<Record<ModelId, boolean>>({
    claude: true,
    gpt: true,
    local: false,
  });
  let scoringScale = $state<"1-5" | "1-10">("1-5");
  let requireWinner = $state(true);

  const workspaces = [
    "AuthorForge",
    "VibeForge Dev",
    "Leopold",
    "Research Lab",
  ];
  const models: Array<{ id: ModelId; label: string }> = [
    { id: "claude", label: "Claude" },
    { id: "gpt", label: "GPT-5.x" },
    { id: "local", label: "Local" },
  ];
  const scoringScales = ["1-5", "1-10"] as const;
</script>

<!-- Workspace settings section -->
<section
  class={`rounded-lg border p-4 flex flex-col gap-3 transition-colors ${
    themeStore.current === "dark"
      ? "bg-slate-900 border-slate-700"
      : "bg-white border-slate-200 shadow-sm"
  }`}
>
  <div class="flex flex-col gap-1">
    <h2
      class={`text-sm font-semibold ${
        themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
      }`}
    >
      Workspace Settings
    </h2>
    <p
      class={`text-xs ${
        themeStore.current === "dark" ? "text-slate-400" : "text-slate-500"
      }`}
    >
      Configure default workspace and evaluation preferences.
    </p>
  </div>

  <div class="flex flex-col gap-4">
    <!-- Default workspace -->
    <div class="flex flex-col gap-1.5">
      <label
        class={`text-xs font-medium ${
          themeStore.current === "dark" ? "text-slate-300" : "text-slate-700"
        }`}
      >
        Default Workspace
      </label>
      <select
        bind:value={defaultWorkspace}
        class={`border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
          themeStore.current === "dark"
            ? "bg-slate-950 border-slate-700 text-slate-100"
            : "bg-slate-50 border-slate-200 text-slate-900"
        }`}
      >
        {#each workspaces as ws}
          <option value={ws}>{ws}</option>
        {/each}
      </select>
      <p
        class={`text-[11px] ${
          themeStore.current === "dark" ? "text-slate-500" : "text-slate-600"
        }`}
      >
        New runs and evaluations will use this workspace by default.
      </p>
    </div>

    <!-- Default models -->
    <div class="flex flex-col gap-1.5">
      <label
        class={`text-xs font-medium ${
          themeStore.current === "dark" ? "text-slate-300" : "text-slate-700"
        }`}
      >
        Default Models for New Runs
      </label>
      <div class="flex flex-wrap gap-2">
        {#each models as model}
          <label
            class={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
              defaultModels[model.id]
                ? themeStore.current === "dark"
                  ? "bg-amber-500/20 border-amber-500 text-amber-300"
                  : "bg-amber-50 border-amber-400 text-amber-700"
                : themeStore.current === "dark"
                ? "bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-900"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
            }`}
          >
            <input
              type="checkbox"
              bind:checked={defaultModels[model.id]}
              class="w-3.5 h-3.5 accent-amber-500"
            />
            <span>{model.label}</span>
          </label>
        {/each}
      </div>
    </div>

    <!-- Scoring scale -->
    <div class="flex flex-col gap-1.5">
      <label
        class={`text-xs font-medium ${
          themeStore.current === "dark" ? "text-slate-300" : "text-slate-700"
        }`}
      >
        Default Scoring Scale
      </label>
      <div class="flex gap-2">
        {#each scoringScales as scale}
          <button
            type="button"
            class={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
              scoringScale === scale
                ? themeStore.current === "dark"
                  ? "bg-amber-500/20 border-amber-500 text-amber-300"
                  : "bg-amber-50 border-amber-400 text-amber-700"
                : themeStore.current === "dark"
                ? "bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-900"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
            }`}
            onclick={() => (scoringScale = scale)}
          >
            {scale}
          </button>
        {/each}
      </div>
      <p
        class={`text-[11px] ${
          themeStore.current === "dark" ? "text-slate-500" : "text-slate-600"
        }`}
      >
        Used in evaluation sessions for consistent scoring.
      </p>
    </div>

    <!-- Require winner toggle -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex flex-col gap-0.5">
        <label
          class={`text-xs font-medium ${
            themeStore.current === "dark" ? "text-slate-300" : "text-slate-700"
          }`}
        >
          Require Winner Selection
        </label>
        <p
          class={`text-[11px] ${
            themeStore.current === "dark" ? "text-slate-500" : "text-slate-600"
          }`}
        >
          Require a preferred model to complete evaluations
        </p>
      </div>
      <button
        type="button"
        class={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
          requireWinner
            ? themeStore.current === "dark"
              ? "bg-amber-500/20 border-amber-500 text-amber-300"
              : "bg-amber-50 border-amber-400 text-amber-700"
            : themeStore.current === "dark"
            ? "bg-slate-950 border-slate-700 text-slate-400"
            : "bg-slate-50 border-slate-200 text-slate-600"
        }`}
        onclick={() => (requireWinner = !requireWinner)}
      >
        {requireWinner ? "On" : "Off"}
      </button>
    </div>
  </div>

  <!-- TODO: Persist workspace settings to backend -->
  <p
    class={`text-[11px] ${
      themeStore.current === "dark" ? "text-slate-600" : "text-slate-500"
    }`}
  >
    💾 TODO: Save these settings to per-user backend storage
  </p>
</section>
