<!-- @component
### Props
- `! availableModels` **string[]**
- `!$ searchQuery` **string**
- `!$ selectedCategory` **PatternCategory | "all"**
- `!$ selectedComplexity` **PatternComplexity | "all"**
- `!$ selectedModel` **string | "all"**

no description yet
-->
<script lang="ts">
  import { theme } from "$lib/stores/themeStore";

  type PatternCategory =
    | "coding"
    | "writing"
    | "analysis"
    | "evaluation"
    | "research";
  type PatternComplexity = "basic" | "intermediate" | "advanced";

  interface Props {
    searchQuery: string;
    selectedCategory: PatternCategory | "all";
    selectedComplexity: PatternComplexity | "all";
    selectedModel: string | "all";
    availableModels: string[];
  }

  let {
    searchQuery = $bindable(),
    selectedCategory = $bindable(),
    selectedComplexity = $bindable(),
    selectedModel = $bindable(),
    availableModels,
  }: Props = $props();

  const categoryOptions: Array<{
    value: PatternCategory | "all";
    label: string;
  }> = [
    { value: "all", label: "All" },
    { value: "coding", label: "Coding" },
    { value: "writing", label: "Writing" },
    { value: "analysis", label: "Analysis" },
    { value: "evaluation", label: "Evaluation" },
    { value: "research", label: "Research" },
  ];

  const complexityOptions: Array<{
    value: PatternComplexity | "all";
    label: string;
  }> = [
    { value: "all", label: "All" },
    { value: "basic", label: "Basic" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  const clearAllFilters = () => {
    searchQuery = "";
    selectedCategory = "all";
    selectedComplexity = "all";
    selectedModel = "all";
  };
</script>

<!-- Filters panel: search, category, complexity, and model filters -->
<section
  class={`rounded-lg border p-4 flex flex-col gap-3 transition-colors ${
    $theme === "dark"
      ? "border-slate-700 bg-slate-900"
      : "border-slate-200 bg-white shadow-sm"
  }`}
>
  <!-- Section header -->
  <div class="flex items-center justify-between">
    <h2
      class={`text-xs font-semibold ${
        $theme === "dark" ? "text-slate-300" : "text-slate-700"
      }`}
    >
      Filters
    </h2>
    {#if searchQuery || selectedCategory !== "all" || selectedComplexity !== "all" || selectedModel !== "all"}
      <button
        type="button"
        class={`text-xs transition-colors ${
          $theme === "dark"
            ? "text-amber-400 hover:text-amber-300"
            : "text-amber-600 hover:text-amber-700"
        }`}
        onclick={clearAllFilters}
      >
        Clear all
      </button>
    {/if}
  </div>

  <!-- Search input -->
  <div>
    <label
      class={`block text-xs mb-1.5 ${
        $theme === "dark" ? "text-slate-400" : "text-slate-600"
      }`}
    >
      Search
    </label>
    <input
      type="text"
      placeholder="Search by name or use case..."
      class={`w-full px-3 py-1.5 rounded-md border text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
        $theme === "dark"
          ? "bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500"
          : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
      }`}
      bind:value={searchQuery}
    />
  </div>

  <!-- Category filter -->
  <div>
    <label
      class={`block text-xs mb-1.5 ${
        $theme === "dark" ? "text-slate-400" : "text-slate-600"
      }`}
    >
      Category
    </label>
    <div class="flex flex-wrap gap-1.5">
      {#each categoryOptions as option}
        <button
          type="button"
          class={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            selectedCategory === option.value
              ? $theme === "dark"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-amber-50 text-amber-700 border border-amber-200"
              : $theme === "dark"
              ? "bg-slate-950 text-slate-400 border border-slate-700 hover:bg-slate-800"
              : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
          }`}
          onclick={() => (selectedCategory = option.value)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Complexity filter -->
  <div>
    <label
      class={`block text-xs mb-1.5 ${
        $theme === "dark" ? "text-slate-400" : "text-slate-600"
      }`}
    >
      Complexity
    </label>
    <div class="flex flex-wrap gap-1.5">
      {#each complexityOptions as option}
        <button
          type="button"
          class={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            selectedComplexity === option.value
              ? $theme === "dark"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-amber-50 text-amber-700 border border-amber-200"
              : $theme === "dark"
              ? "bg-slate-950 text-slate-400 border border-slate-700 hover:bg-slate-800"
              : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
          }`}
          onclick={() => (selectedComplexity = option.value)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Model filter -->
  {#if availableModels.length > 0}
    <div>
      <label
        class={`block text-xs mb-1.5 ${
          $theme === "dark" ? "text-slate-400" : "text-slate-600"
        }`}
      >
        Model
      </label>
      <div class="flex flex-wrap gap-1.5">
        <button
          type="button"
          class={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            selectedModel === "all"
              ? $theme === "dark"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-amber-50 text-amber-700 border border-amber-200"
              : $theme === "dark"
              ? "bg-slate-950 text-slate-400 border border-slate-700 hover:bg-slate-800"
              : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
          }`}
          onclick={() => (selectedModel = "all")}
        >
          All Models
        </button>
        {#each availableModels as model}
          <button
            type="button"
            class={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              selectedModel === model
                ? $theme === "dark"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
                : $theme === "dark"
                ? "bg-slate-950 text-slate-400 border border-slate-700 hover:bg-slate-800"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
            onclick={() => (selectedModel = model)}
          >
            {model}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</section>
