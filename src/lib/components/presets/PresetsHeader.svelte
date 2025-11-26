<!-- @component
### Props
- `mode` **"workbench" | "quick-run"** = `workbench`
- `onClose` **() =► void** = `() =► {}`

Drawer header with title, subtitle, and close button
-->
<script lang="ts">
  import { themeStore } from "$lib/core/stores";

  interface Props {
    mode?: "workbench" | "quick-run";
    onClose?: () => void;
  }

  const { mode = "workbench", onClose = () => {} }: Props = $props();

  const subtitles = {
    workbench: "Apply structured prompt presets to the Workbench.",
    "quick-run": "Apply lightweight presets to Quick Run.",
  };
</script>

<!-- Presets drawer header -->
<header
  class={`flex items-start justify-between gap-2 px-4 py-3 border-b text-xs ${
    themeStore.current === "dark"
      ? "border-slate-800 bg-slate-950"
      : "border-slate-200 bg-slate-50"
  }`}
>
  <div class="flex flex-col gap-0.5 flex-1">
    <h2
      class={`text-sm font-semibold ${
        themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
      }`}
    >
      Presets &amp; Favorites
    </h2>
    <p
      class={`text-[11px] ${
        themeStore.current === "dark" ? "text-slate-400" : "text-slate-500"
      }`}
    >
      {subtitles[mode]}
    </p>
  </div>
  <button
    class={`px-2 py-1 rounded-md text-xs transition-colors ${
      themeStore.current === "dark"
        ? "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
        : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"
    }`}
    onclick={onClose}
    title="Close drawer"
  >
    ✕
  </button>
</header>
