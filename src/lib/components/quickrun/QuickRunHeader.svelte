<!-- @component
### Props
- `onOpenPresets` **() =► void**
- `onOpenSavePreset` **() =► void**
- `workspace` **string** = `VibeForge Dev`

Header for Quick Run page with title, subtitle, and workspace info
-->
<script lang="ts">
  import { theme } from "$lib/stores/themeStore";

  interface Props {
    workspace?: string;
    onOpenPresets?: () => void;
    onOpenSavePreset?: () => void;
  }

  const {
    workspace = "VibeForge Dev",
    onOpenPresets,
    onOpenSavePreset,
  }: Props = $props();
</script>

<!-- Quick Run header -->
<section
  class={`rounded-lg border p-4 flex items-center justify-between gap-4 transition-colors ${
    $theme === "dark"
      ? "bg-slate-900 border-slate-700"
      : "bg-white border-slate-200 shadow-sm"
  }`}
>
  <div class="flex flex-col gap-1">
    <h1
      class={`text-base font-semibold tracking-tight ${
        $theme === "dark" ? "text-slate-100" : "text-slate-900"
      }`}
    >
      Quick Run
    </h1>
    <p
      class={`text-[11px] ${
        $theme === "dark" ? "text-slate-400" : "text-slate-500"
      }`}
    >
      Lightweight prompt runner for experiments and quick checks.
    </p>
  </div>
  <div class="flex items-center gap-2 text-xs">
    <button
      type="button"
      class={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
        $theme === "dark"
          ? "border border-slate-700 text-slate-300 hover:bg-slate-800"
          : "border border-slate-300 text-slate-600 hover:bg-slate-100"
      }`}
      onclick={onOpenSavePreset}
      title="Save current configuration as a preset"
    >
      💾 Save
    </button>
    <button
      type="button"
      class={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
        $theme === "dark"
          ? "border border-slate-700 text-slate-300 hover:bg-slate-800"
          : "border border-slate-300 text-slate-600 hover:bg-slate-100"
      }`}
      onclick={onOpenPresets}
      title="Open Presets drawer"
    >
      ⭐ Presets
    </button>
    <span
      class={`text-[11px] ${
        $theme === "dark" ? "text-slate-400" : "text-slate-500"
      }`}
    >
      Workspace: <span class="font-semibold">{workspace}</span>
    </span>
  </div>
</section>
