<!-- @component
### Props
- `! ingestQueue` **IngestDocument[]** = `[]`
- `onSimulateProgress` **() =► void**

no description yet
-->
<script lang="ts">
  import { themeStore } from "$lib/core/stores";

  interface IngestDocument {
    id: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    title: string;
    workspace: string;
    category: "reference" | "docs" | "code" | "research" | "other";
    tags: string[];
    status: "queued" | "processing" | "ready" | "error";
    createdAt: string;
    updatedAt: string;
    errorMessage?: string;
  }

  interface Props {
    ingestQueue: IngestDocument[];
    onSimulateProgress?: () => void;
  }

  let { ingestQueue = [], onSimulateProgress }: Props = $props();

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case "ready":
        return "border-emerald-500/50 bg-emerald-900/20 text-emerald-300";
      case "processing":
        return "border-amber-500/50 bg-amber-900/20 text-amber-300";
      case "queued":
        return "border-slate-500/50 bg-slate-800/20 text-slate-300";
      case "error":
        return "border-rose-500/50 bg-rose-900/20 text-rose-300";
      default:
        return "border-slate-500/50 bg-slate-800/20 text-slate-300";
    }
  }

  function formatTimestamp(iso: string): string {
    try {
      const date = new Date(iso);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso.split("T")[0];
    }
  }

  const recentQueue = $derived(ingestQueue.slice(0, 15));
  const queuedCount = $derived(
    ingestQueue.filter((d) => d.status === "queued").length
  );
  const processingCount = $derived(
    ingestQueue.filter((d) => d.status === "processing").length
  );
  const readyCount = $derived(
    ingestQueue.filter((d) => d.status === "ready").length
  );
  const errorCount = $derived(
    ingestQueue.filter((d) => d.status === "error").length
  );
</script>

<section
  class={`rounded-lg border p-4 flex flex-col gap-3 ${
    themeStore.current === "dark"
      ? "bg-slate-900 border-slate-800"
      : "bg-white border-slate-200 shadow-sm"
  }`}
>
  <!-- Header -->
  <header class="flex items-center justify-between gap-2">
    <div class="flex flex-col gap-0.5">
      <h2 class="text-xs font-semibold">Ingestion queue</h2>
      <p
        class={`text-[11px] ${
          themeStore.current === "dark" ? "text-slate-400" : "text-slate-500"
        }`}
      >
        Recently uploaded documents and their processing status.
      </p>
    </div>
    <div class="flex items-center gap-2">
      {#if queuedCount > 0 || processingCount > 0}
        <button
          class="px-3 py-1.5 rounded-md text-xs font-medium bg-amber-500 text-slate-900 hover:bg-amber-600 transition-colors"
          onclick={onSimulateProgress}
          type="button"
        >
          Simulate progress
        </button>
      {/if}
    </div>
  </header>

  <!-- Stats Bar -->
  {#if ingestQueue.length > 0}
    <div class="flex items-center gap-3 text-[10px]">
      {#if readyCount > 0}
        <div class="flex items-center gap-1">
          <span class="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span class={themeStore.current === "dark" ? "text-slate-300" : "text-slate-600"}>
            {readyCount} ready
          </span>
        </div>
      {/if}
      {#if processingCount > 0}
        <div class="flex items-center gap-1">
          <span class="inline-block w-2 h-2 rounded-full bg-amber-500" />
          <span class={themeStore.current === "dark" ? "text-slate-300" : "text-slate-600"}>
            {processingCount} processing
          </span>
        </div>
      {/if}
      {#if queuedCount > 0}
        <div class="flex items-center gap-1">
          <span class="inline-block w-2 h-2 rounded-full bg-slate-500" />
          <span class={themeStore.current === "dark" ? "text-slate-300" : "text-slate-600"}>
            {queuedCount} queued
          </span>
        </div>
      {/if}
      {#if errorCount > 0}
        <div class="flex items-center gap-1">
          <span class="inline-block w-2 h-2 rounded-full bg-rose-500" />
          <span class={themeStore.current === "dark" ? "text-slate-300" : "text-slate-600"}>
            {errorCount} error
          </span>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Queue Table -->
  {#if ingestQueue.length === 0}
    <p
      class={`text-xs ${
        themeStore.current === "dark" ? "text-slate-400" : "text-slate-500"
      }`}
    >
      No documents in the queue yet. Use "Add documents" above to get started.
    </p>
  {:else}
    <div class="border rounded-lg overflow-hidden">
      <!-- Header Row -->
      <div
        class={`grid grid-cols-[1.2fr_0.8fr_0.7fr_0.6fr_0.8fr_0.5fr] gap-3 px-4 py-2 text-[11px] font-medium border-b ${
          themeStore.current === "dark"
            ? "bg-slate-950 border-slate-800 text-slate-400"
            : "bg-slate-50 border-slate-200 text-slate-500"
        }`}
      >
        <span>Title</span>
        <span>Workspace</span>
        <span>Category</span>
        <span>Status</span>
        <span>Updated</span>
        <span />
      </div>

      <!-- Rows -->
      <div
        class={`max-h-96 overflow-y-auto text-xs ${
          themeStore.current === "dark"
            ? "divide-y divide-slate-800"
            : "divide-y divide-slate-200"
        }`}
      >
        {#each recentQueue as doc (doc.id)}
          <div
            class={`grid grid-cols-[1.2fr_0.8fr_0.7fr_0.6fr_0.8fr_0.5fr] gap-3 px-4 py-3 items-center transition-colors ${
              themeStore.current === "dark" ? "hover:bg-slate-900/50" : "hover:bg-slate-50"
            }`}
          >
            <!-- Title -->
            <div class="flex flex-col gap-0.5">
              <span
                class={`truncate font-medium ${
                  themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
                }`}
              >
                {doc.title}
              </span>
              {#if doc.tags.length > 0}
                <div class="flex flex-wrap gap-1">
                  {#each doc.tags.slice(0, 2) as tag}
                    <span
                      class={`text-[9px] px-1.5 py-0.5 rounded truncate ${
                        themeStore.current === "dark"
                          ? "bg-slate-800 text-slate-400"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {tag}
                    </span>
                  {/each}
                  {#if doc.tags.length > 2}
                    <span
                      class={`text-[9px] ${
                        themeStore.current === "dark" ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      +{doc.tags.length - 2}
                    </span>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Workspace -->
            <span
              class={`truncate ${
                themeStore.current === "dark" ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {doc.workspace}
            </span>

            <!-- Category -->
            <span
              class={`truncate capitalize ${
                themeStore.current === "dark" ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {doc.category}
            </span>

            <!-- Status -->
            <span
              class={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-medium whitespace-nowrap ${getStatusBadgeColor(
                doc.status
              )}`}
            >
              {#if doc.status === "processing"}
                <span
                  class="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse"
                />
              {/if}
              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
            </span>

            <!-- Updated -->
            <span
              class={`truncate text-[10px] ${
                themeStore.current === "dark" ? "text-slate-500" : "text-slate-400"
              }`}
            >
              {formatTimestamp(doc.updatedAt)}
            </span>

            <!-- Actions -->
            <div class="flex justify-end">
              {#if doc.status === "error"}
                <button
                  class={`text-[10px] font-medium px-2 py-1 rounded transition-colors ${
                    themeStore.current === "dark"
                      ? "text-rose-400 hover:bg-rose-900/20"
                      : "text-rose-600 hover:bg-rose-50"
                  }`}
                  title={doc.errorMessage || "Unknown error"}
                  type="button"
                >
                  ⚠️
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>

    {#if ingestQueue.length > 15}
      <p
        class={`text-[10px] text-center ${
          themeStore.current === "dark" ? "text-slate-500" : "text-slate-400"
        }`}
      >
        Showing 15 of {ingestQueue.length} documents. TODO: pagination/infinite scroll
      </p>
    {/if}
  {/if}
</section>

<style lang="postcss">
  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 9999px;
    background-color: rgb(71 85 105);
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: rgb(100 116 139);
  }
</style>
