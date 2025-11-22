<!-- @component
no description yet
-->
<script lang="ts">
  import { onMount } from "svelte";
  import {
    contexts,
    activeContexts,
    inactiveContexts,
  } from "$lib/stores/contextStore";
  import {
    dataforgeStore,
    contextCount,
    searchResultCount,
  } from "$lib/stores/dataforgeStore";
  import { theme } from "$lib/stores/themeStore";
  import type { ContextBlock } from "$lib/types/context";
  import type { DataForgeContextSearchResult } from "$lib/types/dataforge";
  import { derived } from "svelte/store";

  const maxVisible = 4;

  let searchQuery = $state("");
  let searchTimeout: ReturnType<typeof setTimeout>;
  let workspaceId = "vf_ws_01"; // TODO: Get from workspace store

  // Load contexts on mount
  onMount(async () => {
    dataforgeStore.setLoadingContexts(true);
    try {
      const response = await fetch(`/api/contexts?workspace_id=${workspaceId}`);
      if (!response.ok) throw new Error("Failed to load contexts");
      const data = await response.json();
      dataforgeStore.setContexts(data.contexts);
    } catch (err) {
      dataforgeStore.setError(
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      dataforgeStore.setLoadingContexts(false);
    }
  });

  // Debounced search handler
  function handleSearch(query: string) {
    searchQuery = query;
    clearTimeout(searchTimeout);

    if (!query.trim()) {
      dataforgeStore.clearSearchResults();
      return;
    }

    dataforgeStore.setSearching(true);

    searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search-context?workspace_id=${workspaceId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: query.trim(), top_k: 10 }),
          }
        );
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        dataforgeStore.setSearchResults(data.results);
      } catch (err) {
        dataforgeStore.setError(
          err instanceof Error ? err.message : "Search error"
        );
      } finally {
        dataforgeStore.setSearching(false);
      }
    }, 300);
  }

  function onSearchInput(e: Event) {
    const target = e.target as HTMLInputElement;
    handleSearch(target.value);
  }

  const limitedActive = derived(activeContexts, ($active) =>
    $active.slice(0, maxVisible)
  );
  const moreActiveCount = derived(activeContexts, ($active) =>
    $active.length > maxVisible ? $active.length - maxVisible : 0
  );

  const limitedInactive = derived(inactiveContexts, ($inactive) =>
    $inactive.slice(0, maxVisible)
  );
  const moreInactiveCount = derived(inactiveContexts, ($inactive) =>
    $inactive.length > maxVisible ? $inactive.length - maxVisible : 0
  );

  const kindLabels: Record<ContextBlock["kind"], string> = {
    system: "System",
    design: "Design",
    project: "Project",
    code: "Code",
    workflow: "Workflow",
  };

  const sourceLabels: Record<ContextBlock["source"], string> = {
    global: "Global",
    workspace: "Workspace",
    local: "Local",
  };

  const toggle = (id: string) => {
    contexts.toggleActive(id);
  };
</script>

<!-- Context Column: Manage active context blocks -->
<section
  class={`flex flex-col rounded-lg border transition-colors ${
    $theme === "dark"
      ? "border-slate-700 bg-slate-900"
      : "border-slate-200 bg-white shadow-sm"
  }`}
>
  <header
    class={`px-4 py-3 border-b flex items-center justify-between ${
      $theme === "dark" ? "border-slate-700" : "border-slate-200"
    }`}
  >
    <h2
      class={`text-sm font-semibold tracking-tight ${
        $theme === "dark" ? "text-slate-100" : "text-slate-900"
      }`}
    >
      Context
    </h2>
    <a
      href="/contexts"
      class={`text-xs hover:underline transition-colors ${
        $theme === "dark"
          ? "text-amber-400 hover:text-amber-300"
          : "text-amber-600 hover:text-amber-700"
      }`}
    >
      Manage
    </a>
  </header>

  <!-- Search input -->
  <div
    class={`px-4 pt-3 pb-2 border-b ${
      $theme === "dark" ? "border-slate-700" : "border-slate-200"
    }`}
  >
    <input
      type="text"
      placeholder="Search contexts..."
      bind:value={searchQuery}
      onchange={onSearchInput}
      class={`w-full px-3 py-2 rounded-md text-xs transition-colors ${
        $theme === "dark"
          ? "bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500"
          : "bg-white border border-slate-300 text-slate-900 placeholder-slate-400"
      }`}
    />
    {#if $dataforgeStore.isSearching}
      <div class="mt-1 text-xs text-slate-500">Searching...</div>
    {/if}
  </div>

  <div
    class={`flex-1 overflow-y-auto p-4 space-y-4 ${
      $theme === "dark" ? "text-slate-300" : "text-slate-700"
    }`}
  >
    <!-- Display search results if any -->
    {#if searchQuery.trim() && $dataforgeStore.searchResults.length > 0}
      <div class="border-t pt-3">
        <h3
          class={`text-xs font-semibold mb-2 ${
            $theme === "dark" ? "text-slate-300" : "text-slate-700"
          }`}
        >
          Search Results ({$searchResultCount})
        </h3>
        <div class="space-y-2">
          {#each $dataforgeStore.searchResults as result (result.chunk_id)}
            <div
              class={`border rounded-md p-2 text-xs cursor-pointer transition-colors hover:bg-slate-100 ${
                $theme === "dark"
                  ? "border-slate-700 hover:bg-slate-800"
                  : "border-slate-200"
              }`}
            >
              <div class="font-medium truncate">{result.title}</div>
              <div
                class={`truncate mt-1 ${
                  $theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {result.snippet}
              </div>
              <div class="mt-1 text-slate-500">
                Match: {(result.score * 100).toFixed(0)}%
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Loading state -->
    {#if $dataforgeStore.isLoadingContexts}
      <div
        class={`text-xs ${
          $theme === "dark" ? "text-slate-500" : "text-slate-500"
        }`}
      >
        Loading contexts...
      </div>
    {/if}

    <!-- Error state -->
    {#if $dataforgeStore.error}
      <div
        class={`text-xs p-2 rounded-md ${
          $theme === "dark"
            ? "bg-red-950 text-red-200"
            : "bg-red-100 text-red-800"
        }`}
      >
        {$dataforgeStore.error}
      </div>
    {/if}
    <p
      class={`text-xs leading-relaxed ${
        $theme === "dark" ? "text-slate-400" : "text-slate-500"
      }`}
    >
      Active context blocks are prepended to your prompt. Toggle them on/off or
      manage in the Context Library.
    </p>

    <!-- Active contexts -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h3
          class={`text-xs font-semibold ${
            $theme === "dark" ? "text-slate-300" : "text-slate-700"
          }`}
        >
          Active
        </h3>
        {#if $moreActiveCount > 0}
          <span
            class={`text-xs ${
              $theme === "dark" ? "text-slate-500" : "text-slate-500"
            }`}
          >
            +{$moreActiveCount} more
          </span>
        {/if}
      </div>

      {#if $limitedActive.length === 0}
        <div
          class={`border border-dashed rounded-md p-3 text-xs ${
            $theme === "dark"
              ? "border-slate-700 text-slate-500"
              : "border-slate-300 text-slate-500"
          }`}
        >
          No active contexts. Choose from below or manage in the Context
          Library.
        </div>
      {:else}
        <div class="space-y-2">
          {#each $limitedActive as ctx}
            <button
              type="button"
              class={`w-full text-left rounded-md border px-3 py-2 flex flex-col gap-1 transition-colors ${
                $theme === "dark"
                  ? "border-slate-700 bg-slate-950 hover:bg-slate-900"
                  : "border-amber-200 bg-amber-50 hover:bg-amber-100"
              }`}
              onclick={() => toggle(ctx.id)}
            >
              <div class="flex items-center justify-between gap-2">
                <span
                  class={`text-xs font-medium truncate ${
                    $theme === "dark" ? "text-slate-100" : "text-slate-900"
                  }`}
                >
                  {ctx.title}
                </span>
                <span
                  class={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                    $theme === "dark"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-amber-100 text-amber-700 border-amber-300"
                  }`}
                >
                  On
                </span>
              </div>
              <div
                class={`flex items-center justify-between text-[11px] ${
                  $theme === "dark" ? "text-slate-400" : "text-slate-600"
                }`}
              >
                <span>{kindLabels[ctx.kind]} • {sourceLabels[ctx.source]}</span>
                <span class="truncate max-w-32">
                  {ctx.tags.join(", ")}
                </span>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Inactive contexts -->
    <div
      class={`pt-3 border-t ${
        $theme === "dark" ? "border-slate-700" : "border-slate-200"
      }`}
    >
      <div class="flex items-center justify-between mb-2">
        <h3
          class={`text-xs font-semibold ${
            $theme === "dark" ? "text-slate-300" : "text-slate-700"
          }`}
        >
          Available
        </h3>
        {#if $moreInactiveCount > 0}
          <span
            class={`text-xs ${
              $theme === "dark" ? "text-slate-500" : "text-slate-500"
            }`}
          >
            +{$moreInactiveCount} more
          </span>
        {/if}
      </div>

      {#if $limitedInactive.length === 0}
        <div
          class={`border border-dashed rounded-md p-3 text-xs ${
            $theme === "dark"
              ? "border-slate-700 text-slate-500"
              : "border-slate-300 text-slate-500"
          }`}
        >
          All contexts are currently active.
        </div>
      {:else}
        <div class="space-y-2">
          {#each $limitedInactive as ctx}
            <button
              type="button"
              class={`w-full text-left rounded-md border px-3 py-2 flex flex-col gap-1 transition-colors ${
                $theme === "dark"
                  ? "border-slate-700/60 bg-slate-950/50 hover:bg-slate-900/50"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
              onclick={() => toggle(ctx.id)}
            >
              <div class="flex items-center justify-between gap-2">
                <span
                  class={`text-xs font-medium truncate ${
                    $theme === "dark" ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  {ctx.title}
                </span>
                <span
                  class={`text-[10px] px-2 py-0.5 rounded-full border ${
                    $theme === "dark"
                      ? "border-slate-700 text-slate-500"
                      : "border-slate-300 text-slate-600"
                  }`}
                >
                  Off
                </span>
              </div>
              <div
                class={`flex items-center justify-between text-[11px] ${
                  $theme === "dark" ? "text-slate-500" : "text-slate-600"
                }`}
              >
                <span>{kindLabels[ctx.kind]} • {sourceLabels[ctx.source]}</span>
                <span class="truncate max-w-32">
                  {ctx.tags.join(", ")}
                </span>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</section>
