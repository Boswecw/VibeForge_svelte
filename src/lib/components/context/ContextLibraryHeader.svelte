<!-- @component
### Props
- `! filteredCount` **number**
- `! totalCount` **number**
- `onAddDocuments` **() =► void**

no description yet
-->
<script lang="ts">
  import { themeStore } from "$lib/core/stores";

  interface Props {
    totalCount: number;
    filteredCount: number;
    onAddDocuments?: () => void;
  }

  let { totalCount, filteredCount, onAddDocuments }: Props = $props();
</script>

<!-- Header section with title, description, and context block counts -->
<header class="flex flex-col gap-2">
  <div class="flex items-center justify-between">
    <div class="flex flex-col gap-1">
      <h1
        class={`text-base font-semibold tracking-tight ${
          themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
        }`}
      >
        Context Library
      </h1>
      <p
        class={`text-xs leading-relaxed ${
          themeStore.current === "dark" ? "text-slate-400" : "text-slate-500"
        }`}
      >
        Browse, search, and manage context blocks that shape your prompts in the
        Workbench
      </p>
    </div>

    <!-- Stats and actions -->
    <div class="flex items-center gap-3">
      <div
        class={`text-xs px-3 py-1.5 rounded-md border ${
          themeStore.current === "dark"
            ? "border-slate-700 bg-slate-900 text-slate-300"
            : "border-slate-200 bg-white text-slate-600"
        }`}
      >
        {#if filteredCount < totalCount}
          <span class="font-medium">{filteredCount}</span> of
          <span class="font-medium">{totalCount}</span> blocks
        {:else}
          <span class="font-medium">{totalCount}</span> total blocks
        {/if}
      </div>

      <button
        type="button"
        onclick={onAddDocuments}
        class={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
          themeStore.current === "dark"
            ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:border-slate-600"
            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white hover:border-slate-300"
        }`}
        title="Upload documents to ingest as context"
      >
        📄 Add Documents
      </button>
    </div>
  </div>
</header>
