<!-- @component
### Props
- `subtitle` **string** = `Manage workspace, appearance, models, and data preferences`
- `title` **string** = `Settings`

no description yet
-->
<script lang="ts">
  import { theme } from "$lib/stores/themeStore";

  interface Props {
    title?: string;
    subtitle?: string;
  }

  let {
    title = "Settings",
    subtitle = "Manage workspace, appearance, models, and data preferences",
  }: Props = $props();
</script>

<!-- Settings header: title and subtitle -->
<header
  class={`rounded-lg border p-4 flex flex-col gap-2 transition-colors ${
    $theme === "dark"
      ? "bg-slate-900 border-slate-700"
      : "bg-white border-slate-200 shadow-sm"
  }`}
>
  <h1
    class={`text-base font-semibold tracking-tight ${
      $theme === "dark" ? "text-slate-100" : "text-slate-900"
    }`}
  >
    {title}
  </h1>
  <p
    class={`text-xs ${$theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
  >
    {subtitle}
  </p>
</header>
