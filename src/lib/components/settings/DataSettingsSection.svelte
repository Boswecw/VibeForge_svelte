<!-- @component
no description yet
-->
<script lang="ts">
  import { themeStore } from "$lib/core/stores";

  let historyRetention = $state("30d");
  let allowRawOutputs = $state(true);

  const retentionOptions = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "all", label: "All runs" },
  ];

  const handleExport = () => {
    // TODO: Implement export functionality
    alert("TODO: Export settings and evaluations as JSON");
  };

  const handleDeleteHistory = () => {
    // TODO: Implement delete with confirmation
    alert("TODO: Show confirmation dialog and delete history");
  };
</script>

<!-- Data & Privacy section -->
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
      Data & Privacy
    </h2>
    <p
      class={`text-xs ${
        themeStore.current === "dark" ? "text-slate-400" : "text-slate-500"
      }`}
    >
      Manage data retention, exports, and deletion.
    </p>
  </div>

  <div class="flex flex-col gap-4">
    <!-- History retention -->
    <div class="flex flex-col gap-1.5">
      <label
        class={`text-xs font-medium ${
          themeStore.current === "dark" ? "text-slate-300" : "text-slate-700"
        }`}
      >
        Keep Run History
      </label>
      <select
        bind:value={historyRetention}
        class={`border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
          themeStore.current === "dark"
            ? "bg-slate-950 border-slate-700 text-slate-100"
            : "bg-slate-50 border-slate-200 text-slate-900"
        }`}
      >
        {#each retentionOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
      <p
        class={`text-[11px] ${
          themeStore.current === "dark" ? "text-slate-500" : "text-slate-600"
        }`}
      >
        Older runs will be automatically deleted based on your selection.
      </p>
      <!-- TODO comment -->
      <p
        class={`text-[10px] ${
          themeStore.current === "dark" ? "text-slate-700" : "text-slate-400"
        }`}
      >
        💾 TODO: Implement retention policy and auto-cleanup
      </p>
    </div>

    <!-- Raw outputs toggle -->
    <div
      class="flex items-center justify-between gap-2 border-t pt-3"
      class:border-slate-700={themeStore.current === "dark"}
      class:border-slate-200={themeStore.current !== "dark"}
    >
      <div>
        <label
          class={`text-xs font-medium ${
            themeStore.current === "dark" ? "text-slate-300" : "text-slate-700"
          }`}
        >
          Store Raw Outputs
        </label>
        <p
          class={`text-[11px] ${
            themeStore.current === "dark" ? "text-slate-500" : "text-slate-600"
          }`}
        >
          Allow saving full model outputs for re-review and analysis
        </p>
      </div>
      <button
        type="button"
        class={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
          allowRawOutputs
            ? themeStore.current === "dark"
              ? "bg-green-500/20 border border-green-600 text-green-300"
              : "bg-green-50 border border-green-300 text-green-700"
            : themeStore.current === "dark"
            ? "bg-slate-950 border border-slate-700 text-slate-400"
            : "bg-slate-50 border border-slate-200 text-slate-600"
        }`}
        onclick={() => (allowRawOutputs = !allowRawOutputs)}
      >
        {allowRawOutputs ? "✓" : "○"}
      </button>
    </div>

    <!-- Actions -->
    <div
      class="flex flex-col gap-2 border-t pt-3"
      class:border-slate-700={themeStore.current === "dark"}
      class:border-slate-200={themeStore.current !== "dark"}
    >
      <p
        class={`text-xs font-medium ${
          themeStore.current === "dark" ? "text-slate-300" : "text-slate-700"
        }`}
      >
        Data Management
      </p>
      <div class="grid sm:grid-cols-2 grid-cols-1 gap-2">
        <button
          type="button"
          class={`px-3 py-2 rounded-md border text-xs font-medium transition-colors ${
            themeStore.current === "dark"
              ? "bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-900"
              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white"
          }`}
          onclick={handleExport}
        >
          📥 Export Settings & Evaluations
        </button>
        <button
          type="button"
          class={`px-3 py-2 rounded-md border text-xs font-medium transition-colors ${
            themeStore.current === "dark"
              ? "bg-red-950/20 border-red-800 text-red-400 hover:bg-red-950/40"
              : "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
          }`}
          onclick={handleDeleteHistory}
        >
          🗑️ Delete All History
        </button>
      </div>
      <p
        class={`text-[11px] ${
          themeStore.current === "dark" ? "text-slate-500" : "text-slate-600"
        }`}
      >
        ⚠️ These actions are placeholders. Implement confirmation dialogs before
        permanent deletion.
      </p>
    </div>
  </div>

  <!-- Info banner -->
  <div
    class={`rounded-md border p-3 ${
      themeStore.current === "dark"
        ? "bg-slate-950/50 border-slate-800 text-slate-400"
        : "bg-amber-50 border-amber-200 text-amber-700"
    }`}
  >
    <p class="text-[11px]">
      <span class="font-semibold">💾 Placeholder Notice:</span> These controls are
      non-functional. Wire them to your backend when ready.
    </p>
  </div>
</section>
