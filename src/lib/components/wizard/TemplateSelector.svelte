<!-- @component
no description yet
-->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    PROJECT_TEMPLATES,
    getPopularTemplates,
    searchTemplates,
  } from "$lib/data/project-templates";
  import type { ProjectTemplate } from "$lib/data/project-templates";

  const dispatch = createEventDispatcher<{
    select: { template: ProjectTemplate };
  }>();

  let searchQuery = "";
  let selectedCategory:
    | "all"
    | "popular"
    | "web"
    | "mobile"
    | "desktop"
    | "api"
    | "ai" = "popular";
  let selectedTemplate: string | null = null;

  $: filteredTemplates = (() => {
    if (selectedCategory === "popular") {
      return getPopularTemplates(6);
    }
    if (selectedCategory === "all") {
      return searchQuery ? searchTemplates(searchQuery) : PROJECT_TEMPLATES;
    }
    const categoryTemplates = PROJECT_TEMPLATES.filter(
      (t) => t.category === selectedCategory
    );
    return searchQuery
      ? searchTemplates(searchQuery).filter(
          (t) => t.category === selectedCategory
        )
      : categoryTemplates;
  })();

  function selectTemplate(template: ProjectTemplate) {
    selectedTemplate = template.id;
    dispatch("select", { template });
  }

  const categories = [
    { id: "popular", label: "Popular", icon: "⭐" },
    { id: "all", label: "All Templates", icon: "📦" },
    { id: "web", label: "Web", icon: "🌐" },
    { id: "mobile", label: "Mobile", icon: "📱" },
    { id: "desktop", label: "Desktop", icon: "💻" },
    { id: "api", label: "API", icon: "⚡" },
    { id: "ai", label: "AI/ML", icon: "🤖" },
  ] as const;

  const complexityColors = {
    beginner: "bg-green-100 text-green-800",
    intermediate: "bg-yellow-100 text-yellow-800",
    advanced: "bg-red-100 text-red-800",
  };
</script>

<div class="template-selector">
  <!-- Header -->
  <div class="mb-6">
    <h3 class="text-2xl font-bold text-gray-900 mb-2">Choose a Template</h3>
    <p class="text-gray-600">
      Get started quickly with a pre-configured project template
    </p>
  </div>

  <!-- Search -->
  <div class="mb-4">
    <div class="relative">
      <svg
        class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        placeholder="Search templates..."
        class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        bind:value={searchQuery}
      />
    </div>
  </div>

  <!-- Category Filter -->
  <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
    {#each categories as category}
      <button
        class="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors"
        class:bg-indigo-600={selectedCategory === category.id}
        class:text-white={selectedCategory === category.id}
        class:bg-gray-100={selectedCategory !== category.id}
        class:text-gray-700={selectedCategory !== category.id}
        class:hover:bg-indigo-700={selectedCategory === category.id}
        class:hover:bg-gray-200={selectedCategory !== category.id}
        on:click={() => (selectedCategory = category.id)}
      >
        <span class="mr-1">{category.icon}</span>
        {category.label}
      </button>
    {/each}
  </div>

  <!-- Templates Grid -->
  {#if filteredTemplates.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each filteredTemplates as template}
        <button
          class="text-left p-5 border-2 rounded-lg transition-all hover:shadow-lg hover:-translate-y-0.5"
          class:border-indigo-500={selectedTemplate === template.id}
          class:bg-indigo-50={selectedTemplate === template.id}
          class:border-gray-200={selectedTemplate !== template.id}
          class:bg-white={selectedTemplate !== template.id}
          on:click={() => selectTemplate(template)}
        >
          <!-- Template Icon & Name -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <span class="text-4xl">{template.icon}</span>
              <div>
                <h4 class="font-bold text-gray-900">{template.name}</h4>
                <span
                  class="text-xs px-2 py-0.5 rounded-full {complexityColors[
                    template.complexity
                  ]}"
                >
                  {template.complexity}
                </span>
              </div>
            </div>
            {#if selectedTemplate === template.id}
              <svg
                class="w-6 h-6 text-indigo-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            {/if}
          </div>

          <!-- Description -->
          <p class="text-sm text-gray-600 mb-3 line-clamp-2">
            {template.description}
          </p>

          <!-- Metadata -->
          <div class="space-y-2 text-xs text-gray-500">
            <div class="flex items-center gap-1">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Setup: {template.estimatedSetupTime}</span>
            </div>
            <div class="flex items-center gap-1">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>{template.teamSize} team</span>
            </div>
            <div class="flex items-center gap-1">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span>{template.features.length} features</span>
            </div>
          </div>

          <!-- Features Preview -->
          <div class="mt-3 pt-3 border-t border-gray-200">
            <div class="flex flex-wrap gap-1">
              {#each template.features.slice(0, 3) as feature}
                <span
                  class="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded"
                >
                  {feature}
                </span>
              {/each}
              {#if template.features.length > 3}
                <span
                  class="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded"
                >
                  +{template.features.length - 3} more
                </span>
              {/if}
            </div>
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <div class="text-center py-12">
      <svg
        class="w-16 h-16 text-gray-400 mx-auto mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p class="text-gray-500">No templates found matching your search</p>
    </div>
  {/if}
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .template-selector {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
