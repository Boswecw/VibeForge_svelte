<!-- @component
no description yet
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { theme } from "$lib/stores/themeStore";
  import { researchStore } from "$lib/stores/researchStore";
  import { listResearchSources } from "$lib/api/research";
  import type {
    ResearchQuery,
    ExternalSource,
    ResearchDepth,
  } from "$lib/types/research";

  // =========================================================================
  // Component State
  // =========================================================================

  let queryText = "";
  let selectedSources: ExternalSource[] = ["github_issue", "official_docs"];
  let selectedDepth: ResearchDepth = "normal";
  let maxResults = 10;

  let availableSources: ExternalSource[] = [];
  let isSourcesLoaded = false;

  let showResults = false;
  let expandedSources = new Map<string, boolean>();

  const defaultSources: ExternalSource[] = [
    "github_issue",
    "github_discussion",
    "official_docs",
    "release_notes",
    "rfc",
    "pep",
    "security_advisory",
    "discord",
    "hn",
    "blog",
  ];

  // =========================================================================
  // Lifecycle
  // =========================================================================

  onMount(async () => {
    try {
      const response = await listResearchSources();
      if (response.sources) {
        availableSources = response.sources.map((s) => s.id);
      }
      isSourcesLoaded = true;
    } catch (err) {
      console.error("Failed to load sources:", err);
      // Fallback to default sources if API fails
      availableSources = defaultSources;
      isSourcesLoaded = true;
    }
  });

  // =========================================================================
  // Methods
  // =========================================================================

  async function executeResearch() {
    if (!queryText.trim()) {
      return;
    }

    const query: ResearchQuery = {
      query: queryText,
      sources: selectedSources,
      max_results: maxResults,
      depth: selectedDepth,
      user_id: "user-placeholder", // TODO: Get from auth context
      workspace_id: "workspace-placeholder", // TODO: Get from workspace context
    };

    showResults = true;
    await researchStore.executeQuery(query);
  }

  function toggleSourceExpanded(sourceId: string) {
    expandedSources.set(sourceId, !expandedSources.get(sourceId));
    expandedSources = expandedSources; // Trigger reactivity
  }

  function toggleSource(source: ExternalSource) {
    if (selectedSources.includes(source)) {
      selectedSources = selectedSources.filter((s) => s !== source);
    } else {
      selectedSources = [...selectedSources, source];
    }
  }

  function resetQuery() {
    queryText = "";
    selectedSources = ["github_issue", "official_docs"];
    selectedDepth = "normal";
    maxResults = 10;
    showResults = false;
    researchStore.reset();
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  function formatSourceName(source: ExternalSource): string {
    const names: Record<ExternalSource, string> = {
      github_issue: "GitHub Issues",
      github_discussion: "GitHub Discussions",
      official_docs: "Official Documentation",
      release_notes: "Release Notes",
      rfc: "RFC Documents",
      pep: "PEPs (Python)",
      security_advisory: "Security Advisories",
      discord: "Discord Servers",
      hn: "Hacker News",
      blog: "Blog Posts",
    };
    return names[source] || source;
  }

  function getSourceEmoji(source: ExternalSource): string {
    const emojis: Record<ExternalSource, string> = {
      github_issue: "🐙",
      github_discussion: "💬",
      official_docs: "📖",
      release_notes: "🚀",
      rfc: "📋",
      pep: "🐍",
      security_advisory: "🔒",
      discord: "💬",
      hn: "🎯",
      blog: "✍️",
    };
    return emojis[source] || "🔍";
  }

  function getSourceTier(source: ExternalSource): string {
    const tiers: Record<ExternalSource, string> = {
      github_issue: "Priority",
      github_discussion: "Priority",
      official_docs: "Primary",
      release_notes: "Primary",
      rfc: "Reference",
      pep: "Reference",
      security_advisory: "Critical",
      discord: "Supplementary",
      hn: "Supplementary",
      blog: "Supplementary",
    };
    return tiers[source] || "Standard";
  }
</script>

<!-- ====================================================================== -->
<!-- Main Container -->
<!-- ====================================================================== -->

<div
  class={`h-full flex flex-col gap-4 p-6 rounded-lg ${
    $theme === "dark"
      ? "bg-slate-900 border border-slate-800"
      : "bg-white border border-slate-200"
  }`}
>
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h2
      class={`text-lg font-semibold ${
        $theme === "dark" ? "text-slate-100" : "text-slate-900"
      }`}
    >
      🔍 Research Assistant
    </h2>
    {#if showResults}
      <button
        on:click={resetQuery}
        class={`px-3 py-1 text-xs rounded font-medium transition ${
          $theme === "dark"
            ? "bg-slate-700 hover:bg-slate-600 text-slate-100"
            : "bg-slate-100 hover:bg-slate-200 text-slate-900"
        }`}
      >
        Clear
      </button>
    {/if}
  </div>

  {#if !showResults}
    <!-- Query Input Section -->
    <div class="space-y-3">
      <label
        for="query-input"
        class={`block text-sm font-medium ${
          $theme === "dark" ? "text-slate-300" : "text-slate-700"
        }`}
      >
        Research Query
      </label>
      <textarea
        id="query-input"
        bind:value={queryText}
        placeholder="What would you like to research? E.g., 'How do I implement OAuth2 in SvelteKit?'"
        rows="3"
        class={`w-full px-3 py-2 rounded border text-sm resize-none focus:outline-none focus:ring-2 ${
          $theme === "dark"
            ? "bg-slate-800 border-slate-700 text-slate-100 focus:ring-amber-500"
            : "bg-slate-50 border-slate-300 text-slate-900 focus:ring-amber-400"
        }`}
      />
    </div>

    <!-- Source Selection -->
    <div class="space-y-3">
      <div
        class={`block text-sm font-medium ${
          $theme === "dark" ? "text-slate-300" : "text-slate-700"
        }`}
      >
        Research Sources
      </div>
      <div class="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
        {#each availableSources as source (source)}
          <label
            class={`flex items-center gap-2 p-2 rounded cursor-pointer transition ${
              $theme === "dark" ? "hover:bg-slate-800" : "hover:bg-slate-100"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedSources.includes(source)}
              on:change={() => toggleSource(source)}
              class="w-4 h-4 rounded"
            />
            <span class="text-sm">
              {getSourceEmoji(source)}
              {formatSourceName(source)}
            </span>
            <span
              class={`text-xs px-1.5 py-0.5 rounded ${
                getSourceTier(source) === "Priority"
                  ? $theme === "dark"
                    ? "bg-amber-900 text-amber-200"
                    : "bg-amber-100 text-amber-800"
                  : $theme === "dark"
                  ? "bg-slate-700 text-slate-300"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {getSourceTier(source)}
            </span>
          </label>
        {/each}
      </div>
    </div>

    <!-- Research Depth -->
    <div class="space-y-3">
      <label
        for="depth-select"
        class={`block text-sm font-medium ${
          $theme === "dark" ? "text-slate-300" : "text-slate-700"
        }`}
      >
        Research Depth
      </label>
      <select
        id="depth-select"
        bind:value={selectedDepth}
        class={`w-full px-3 py-2 rounded border text-sm focus:outline-none focus:ring-2 ${
          $theme === "dark"
            ? "bg-slate-800 border-slate-700 text-slate-100 focus:ring-amber-500"
            : "bg-slate-50 border-slate-300 text-slate-900 focus:ring-amber-400"
        }`}
      >
        <option value="shallow">Shallow (Quick Overview)</option>
        <option value="normal">Normal (Balanced)</option>
        <option value="deep">Deep (Comprehensive)</option>
      </select>
    </div>

    <!-- Max Results -->
    <div class="space-y-3">
      <label
        for="max-results"
        class={`block text-sm font-medium ${
          $theme === "dark" ? "text-slate-300" : "text-slate-700"
        }`}
      >
        Max Results Per Source: {maxResults}
      </label>
      <input
        id="max-results"
        type="range"
        min="1"
        max="20"
        bind:value={maxResults}
        class="w-full"
      />
    </div>

    <!-- Execute Button -->
    <button
      on:click={executeResearch}
      disabled={!queryText.trim() || $researchStore.isExecuting}
      class={`w-full py-2 px-4 rounded font-medium transition flex items-center justify-center gap-2 ${
        !queryText.trim() || $researchStore.isExecuting
          ? $theme === "dark"
            ? "bg-slate-700 text-slate-500 cursor-not-allowed"
            : "bg-slate-200 text-slate-400 cursor-not-allowed"
          : $theme === "dark"
          ? "bg-amber-600 hover:bg-amber-500 text-white"
          : "bg-amber-500 hover:bg-amber-400 text-white"
      }`}
    >
      {#if $researchStore.isExecuting}
        <span class="animate-spin">⏳</span>
        Researching...
      {:else}
        <span>🔍</span>
        Execute Research
      {/if}
    </button>
  {/if}

  <!-- Results Section -->
  {#if showResults}
    <div class="flex-1 overflow-y-auto space-y-4">
      {#if $researchStore.error}
        <!-- Error State -->
        <div
          class={`p-4 rounded-lg border ${
            $theme === "dark"
              ? "bg-red-900/20 border-red-700 text-red-100"
              : "bg-red-50 border-red-300 text-red-900"
          }`}
        >
          <div class="font-medium mb-1">⚠️ Research Error</div>
          <div class="text-sm">{$researchStore.error}</div>
          <button
            on:click={() => researchStore.clearError()}
            class={`mt-2 text-xs px-2 py-1 rounded ${
              $theme === "dark"
                ? "bg-red-700 hover:bg-red-600"
                : "bg-red-200 hover:bg-red-300"
            }`}
          >
            Dismiss
          </button>
        </div>
      {/if}

      {#if $researchStore.isExecuting}
        <!-- Loading State -->
        <div
          class={`p-4 rounded-lg flex items-center gap-3 ${
            $theme === "dark"
              ? "bg-slate-800 text-slate-300"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          <span class="animate-spin text-lg">⏳</span>
          <div>
            <div class="font-medium">Researching...</div>
            <div class="text-sm opacity-70">
              Gathering and synthesizing information
            </div>
          </div>
        </div>
      {/if}

      {#if $researchStore.currentAnswer && !$researchStore.isExecuting}
        <!-- Summary Section -->
        <div
          class={`p-4 rounded-lg border ${
            $theme === "dark"
              ? "bg-slate-800 border-slate-700"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <div
            class={`text-sm font-medium mb-2 ${
              $theme === "dark" ? "text-amber-300" : "text-amber-600"
            }`}
          >
            📋 Summary
          </div>
          <p
            class={`text-sm leading-relaxed ${
              $theme === "dark" ? "text-slate-300" : "text-slate-700"
            }`}
          >
            {$researchStore.currentAnswer.summary}
          </p>
        </div>

        <!-- Detailed Answer -->
        <div
          class={`p-4 rounded-lg border ${
            $theme === "dark"
              ? "bg-slate-800 border-slate-700"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <div
            class={`text-sm font-medium mb-2 ${
              $theme === "dark" ? "text-amber-300" : "text-amber-600"
            }`}
          >
            💡 Detailed Answer
          </div>
          <p
            class={`text-sm leading-relaxed ${
              $theme === "dark" ? "text-slate-300" : "text-slate-700"
            }`}
          >
            {$researchStore.currentAnswer.answer}
          </p>
        </div>

        <!-- Key Points -->
        {#if $researchStore.currentAnswer.bullet_points.length > 0}
          <div
            class={`p-4 rounded-lg border ${
              $theme === "dark"
                ? "bg-slate-800 border-slate-700"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div
              class={`text-sm font-medium mb-2 ${
                $theme === "dark" ? "text-amber-300" : "text-amber-600"
              }`}
            >
              ✨ Key Points
            </div>
            <ul class="space-y-1">
              {#each $researchStore.currentAnswer.bullet_points as point}
                <li
                  class={`text-sm flex gap-2 ${
                    $theme === "dark" ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  <span class="text-amber-400">•</span>
                  <span>{point}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- Sources -->
        {#if $researchStore.currentAnswer.sources.length > 0}
          <div
            class={`p-4 rounded-lg border ${
              $theme === "dark"
                ? "bg-slate-800 border-slate-700"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div
              class={`text-sm font-medium mb-3 ${
                $theme === "dark" ? "text-amber-300" : "text-amber-600"
              }`}
            >
              📚 Sources ({$researchStore.currentAnswer.sources.length})
            </div>
            <div class="space-y-2">
              {#each $researchStore.currentAnswer.sources as source, idx (source.id)}
                <button
                  type="button"
                  class={`w-full text-left p-2 rounded border cursor-pointer transition ${
                    expandedSources.get(source.id)
                      ? $theme === "dark"
                        ? "bg-slate-700 border-slate-600"
                        : "bg-slate-100 border-slate-300"
                      : $theme === "dark"
                      ? "bg-slate-800 border-slate-700 hover:bg-slate-750"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-75"
                  }`}
                  on:click={() => toggleSourceExpanded(source.id)}
                >
                  <div class="flex items-start gap-2">
                    <span
                      class={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        $theme === "dark"
                          ? "bg-slate-700 text-slate-300"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div class="flex-1">
                      <div
                        class={`text-sm font-medium flex items-center gap-1 ${
                          $theme === "dark"
                            ? "text-slate-100"
                            : "text-slate-900"
                        }`}
                      >
                        {source.title}
                        <span
                          class={`text-xs opacity-70 ${
                            (source.score ?? 0) >= 0.85
                              ? "text-green-400"
                              : "text-amber-400"
                          }`}
                        >
                          ({((source.score ?? 0) * 100).toFixed(0)}%)
                        </span>
                      </div>
                      <div
                        class={`text-xs opacity-60 ${
                          $theme === "dark"
                            ? "text-slate-400"
                            : "text-slate-600"
                        }`}
                      >
                        {source.source}
                      </div>
                    </div>
                    <span class="text-lg opacity-50">
                      {expandedSources.get(source.id) ? "▼" : "▶"}
                    </span>
                  </div>

                  {#if expandedSources.get(source.id)}
                    <div
                      class={`mt-2 pt-2 border-t ${
                        $theme === "dark"
                          ? "border-slate-600 text-slate-300"
                          : "border-slate-300 text-slate-700"
                      }`}
                    >
                      <p class="text-xs leading-relaxed mb-2 opacity-80">
                        {source.snippet}
                      </p>
                      {#if source.url}
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          class={`text-xs font-medium py-1 px-2 rounded inline-block transition ${
                            $theme === "dark"
                              ? "bg-amber-600 hover:bg-amber-500 text-white"
                              : "bg-amber-500 hover:bg-amber-400 text-white"
                          }`}
                        >
                          View Source ↗
                        </a>
                      {/if}
                    </div>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Metadata Footer -->
        <div
          class={`text-xs opacity-60 text-center py-2 ${
            $theme === "dark" ? "text-slate-400" : "text-slate-600"
          }`}
        >
          Research completed in {$researchStore.currentAnswer.took_ms}ms
          {#if $researchStore.currentAnswer.correlation_id}
            • ID: {$researchStore.currentAnswer.correlation_id.substring(0, 8)}
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
