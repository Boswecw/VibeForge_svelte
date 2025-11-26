<!-- @component
### Props
- `subtitle` **string** = `Compare and score model outputs`
- `title` **string** = `Evaluations`

no description yet
-->
<script lang="ts">
  import { themeStore } from "$lib/core/stores";

  interface Props {
    title?: string;
    subtitle?: string;
  }

  let {
    title = "Evaluations",
    subtitle = "Compare and score model outputs",
  }: Props = $props();
</script>

<!-- Evaluations header: title and subtitle -->
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
