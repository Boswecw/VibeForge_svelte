<!-- @component
### Props
- `subtitle` **string** = `Switch, create, or manage your work environments.`
- `title` **string** = `Workspaces`

Page header for workspaces management screen
-->
<script lang="ts">
  import { themeStore } from "$lib/core/stores";

  interface Props {
    title?: string;
    subtitle?: string;
  }

  let {
    title = "Workspaces",
    subtitle = "Switch, create, or manage your work environments.",
  }: Props = $props();
</script>

<!-- Workspace management header: title and subtitle -->
<header
  class={`rounded-lg border p-4 flex flex-col gap-2 transition-colors ${
    themeStore.current === "dark"
      ? "bg-slate-900 border-slate-700"
      : "bg-white border-slate-200 shadow-sm"
  }`}
>
  <h1
    class={`text-base font-semibold tracking-tight ${
      themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
    }`}
  >
    {title}
  </h1>
  <p
    class={`text-xs ${themeStore.current === "dark" ? "text-slate-400" : "text-slate-500"}`}
  >
    {subtitle}
  </p>
</header>
