<!-- @component
### Props
- `activeModels` **string[]** = `[]`
- `connectionStatus` **"ok" | "warning" | "error"** = `ok`
- `lastRunCost` **number** = `0`
- `lastRunTokens` **number** = `0`
- `project` **string** = `Untitled`
- `workspace` **string** = `VibeForge`

Reusable status bar displaying workspace, models, metrics, and system health
-->
<script lang="ts">
  import { theme } from "$lib/stores/themeStore";

  interface Props {
    workspace?: string;
    project?: string;
    activeModels?: string[];
    lastRunTokens?: number;
    lastRunCost?: number;
    connectionStatus?: "ok" | "warning" | "error";
  }

  const {
    workspace = "VibeForge",
    project = "Untitled",
    activeModels = [],
    lastRunTokens = 0,
    lastRunCost = 0,
    connectionStatus = "ok",
  }: Props = $props();

  const statusIndicator = {
    ok: { color: "emerald", icon: "●", label: "Connected" },
    warning: { color: "amber", icon: "⚠", label: "Degraded" },
    error: { color: "rose", icon: "✕", label: "Offline" },
  };

  const status = statusIndicator[connectionStatus];
</script>

<!-- Status bar: workspace, models, metrics, connection -->
<footer
  class={`rounded-lg border p-3 flex items-center justify-between gap-4 text-xs transition-colors ${
    $theme === "dark"
      ? "bg-slate-900 border-slate-700"
      : "bg-white border-slate-200 shadow-sm"
  }`}
>
  <div class="flex items-center gap-4 flex-1 min-w-0">
    <!-- Workspace & Project -->
    <div class="flex flex-col gap-0.5 min-w-0">
      <span
        class={`text-[11px] font-semibold truncate ${
          $theme === "dark" ? "text-slate-100" : "text-slate-900"
        }`}
      >
        {workspace}
      </span>
      <span
        class={`text-[10px] truncate ${
          $theme === "dark" ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {project}
      </span>
    </div>

    <!-- Models -->
    {#if activeModels.length > 0}
      <div
        class="flex items-center gap-1 pl-3 border-l"
        class:border-slate-700={$theme === "dark"}
        class:border-slate-300={$theme !== "dark"}
      >
        <span
          class={`text-[10px] ${
            $theme === "dark" ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Models:
        </span>
        <div class="flex gap-1">
          {#each activeModels as model (model)}
            <span
              class={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${
                $theme === "dark"
                  ? "bg-slate-800 text-amber-400"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {model}
            </span>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Last Run Stats -->
    {#if lastRunTokens > 0}
      <div
        class="flex items-center gap-2 pl-3 border-l"
        class:border-slate-700={$theme === "dark"}
        class:border-slate-300={$theme !== "dark"}
      >
        <span
          class={`text-[10px] ${
            $theme === "dark" ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Last run:
        </span>
        <span
          class={`text-[10px] font-mono ${
            $theme === "dark" ? "text-slate-300" : "text-slate-700"
          }`}
        >
          {lastRunTokens} tokens
        </span>
        <span
          class={`text-[10px] font-mono ${
            $theme === "dark" ? "text-slate-300" : "text-slate-700"
          }`}
        >
          ${lastRunCost.toFixed(4)}
        </span>
      </div>
    {/if}
  </div>

  <!-- Connection Status -->
  <div
    class="flex items-center gap-2 pl-3 border-l shrink-0"
    class:border-slate-700={$theme === "dark"}
    class:border-slate-300={$theme !== "dark"}
  >
    <span
      class={`text-[10px] flex items-center gap-1 font-medium ${
        status.color === "emerald"
          ? $theme === "dark"
            ? "text-emerald-400"
            : "text-emerald-700"
          : status.color === "amber"
          ? $theme === "dark"
            ? "text-amber-400"
            : "text-amber-700"
          : $theme === "dark"
          ? "text-rose-400"
          : "text-rose-700"
      }`}
    >
      <span class="text-[8px]">{status.icon}</span>
      {status.label}
    </span>
  </div>
</footer>
