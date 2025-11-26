<!-- @component
### Props
- `! outputs` **QuickOutput[]**
- `isLoading` **boolean** = `false`

Results panel: displays outputs from each selected model side-by-side (or stacked on mobile)
-->
<script lang="ts">
  import { themeStore } from "$lib/core/stores";

  interface QuickOutput {
    id: string;
    model: string;
    text: string;
    tokens: number;
    cost: number;
  }

  interface Props {
    outputs: QuickOutput[];
    isLoading?: boolean;
  }

  const { outputs, isLoading = false }: Props = $props();
</script>

<!-- Quick Run outputs panel -->
<section
  class={`rounded-lg border p-4 flex flex-col gap-3 transition-colors ${
    themeStore.current === "dark"
      ? "bg-slate-900 border-slate-700"
      : "bg-white border-slate-200 shadow-sm"
  }`}
>
  <!-- Header -->
  <header
    class="flex items-center justify-between gap-2 pb-2 border-b"
    class:border-slate-700={themeStore.current === "dark"}
    class:border-slate-200={themeStore.current !== "dark"}
  >
    <h2
      class={`text-xs font-semibold ${
        themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
      }`}
    >
      Outputs
    </h2>
    <p
      class={`text-[11px] ${
        themeStore.current === "dark" ? "text-slate-400" : "text-slate-500"
      }`}
    >
      Results from each selected model
    </p>
  </header>

  <!-- Content -->
  {#if isLoading}
    <div class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center gap-2">
        <div
          class={`animate-spin rounded-full h-6 w-6 border-2 ${
            themeStore.current === "dark"
              ? "border-slate-600 border-t-amber-500"
              : "border-slate-300 border-t-amber-500"
          }`}
        />
        <p
          class={`text-xs ${
            themeStore.current === "dark" ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Running prompts…
        </p>
      </div>
    </div>
  {:else if outputs.length === 0}
    <div class="flex items-center justify-center py-12">
      <p
        class={`text-[11px] ${
          themeStore.current === "dark" ? "text-slate-400" : "text-slate-500"
        }`}
      >
        Run a prompt to see results here.
      </p>
    </div>
  {:else}
    <div class="grid gap-3 md:grid-cols-2 grid-cols-1">
      {#each outputs as output (output.id)}
        <article
          class={`rounded-md border p-3 flex flex-col gap-2 text-xs leading-relaxed transition-colors ${
            themeStore.current === "dark"
              ? "bg-slate-950 border-slate-800"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <!-- Output header -->
          <header
            class="flex items-center justify-between gap-2 pb-2 border-b"
            class:border-slate-700={themeStore.current === "dark"}
            class:border-slate-200={themeStore.current !== "dark"}
          >
            <span
              class={`font-semibold ${
                themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
              }`}
            >
              {output.model}
            </span>
            <span
              class={`text-[11px] ${
                themeStore.current === "dark" ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {output.tokens} tokens · ${output.cost.toFixed(4)}
            </span>
          </header>

          <!-- Output content -->
          <div
            class={`rounded-sm border p-2 max-h-[260px] overflow-y-auto text-[11px] leading-relaxed whitespace-pre-wrap ${
              themeStore.current === "dark"
                ? "bg-slate-900 border-slate-700 text-slate-200"
                : "bg-white border-slate-300 text-slate-800"
            }`}
          >
            {output.text}
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>
