<!-- @component
no description yet
-->
<script lang="ts">
  import type { StackProfile } from "$lib/data/stack-profiles";
  import StackCard from "./StackCard.svelte";

  export let stacks: StackProfile[];
  export let compactView = false;

  const categories = [
    { key: "technologies", label: "Technologies" },
    { key: "features", label: "Features" },
    { key: "requirements", label: "Requirements" },
    { key: "deployment", label: "Deployment" },
  ];

  type ComparisonRow = {
    label: string;
    values: (string | string[])[];
  };

  function getComparisonData(category: string): ComparisonRow[] {
    if (category === "technologies") {
      const rows: ComparisonRow[] = [];
      const techKeys = ["frontend", "backend", "database", "devops", "testing"];

      for (const key of techKeys) {
        const values = stacks.map(
          (s) => s.technologies[key as keyof typeof s.technologies] || []
        );
        if (values.some((v) => Array.isArray(v) && v.length > 0)) {
          rows.push({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            values,
          });
        }
      }
      return rows;
    }

    if (category === "features") {
      return [
        {
          label: "Features",
          values: stacks.map((s) => s.features),
        },
      ];
    }

    if (category === "requirements") {
      return [
        {
          label: "Prerequisites",
          values: stacks.map((s) => s.requirements.prerequisites),
        },
        {
          label: "Min Node Version",
          values: stacks.map((s) => s.requirements.node_version || "N/A"),
        },
        {
          label: "Complexity",
          values: stacks.map((s) => s.complexity),
        },
      ];
    }

    if (category === "deployment") {
      return [
        {
          label: "Platforms",
          values: stacks.map((s) => s.deployment.platforms),
        },
        {
          label: "Docker Support",
          values: stacks.map((s) =>
            s.deployment.docker_support ? "Yes" : "No"
          ),
        },
      ];
    }

    return [];
  }

  let selectedCategory = "technologies";
  $: comparisonData = getComparisonData(selectedCategory);
</script>

<div class="stack-comparison">
  <!-- Header with stack cards -->
  <div class="mb-6">
    <h2 class="text-2xl font-bold text-gray-900 mb-4">Compare Stacks</h2>
    <div
      class="grid gap-4"
      style="grid-template-columns: repeat({stacks.length}, minmax(250px, 1fr));"
    >
      {#each stacks as stack}
        <StackCard {stack} compact={true} />
      {/each}
    </div>
  </div>

  <!-- Category tabs -->
  <div class="border-b border-gray-200 mb-6">
    <div class="flex gap-4 overflow-x-auto">
      {#each categories as category}
        <button
          class="px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors"
          class:border-indigo-500={selectedCategory === category.key}
          class:text-indigo-600={selectedCategory === category.key}
          class:border-transparent={selectedCategory !== category.key}
          class:text-gray-500={selectedCategory !== category.key}
          on:click={() => (selectedCategory = category.key)}
        >
          {category.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Comparison table -->
  <div class="comparison-table overflow-x-auto">
    <table class="w-full border-collapse">
      <thead>
        <tr class="bg-gray-50">
          <th
            class="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 sticky left-0 bg-gray-50 z-10"
          >
            Feature
          </th>
          {#each stacks as stack}
            <th
              class="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-200 min-w-[200px]"
            >
              <div class="flex items-center gap-2">
                <span class="text-2xl">{stack.icon}</span>
                <span>{stack.name}</span>
              </div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each comparisonData as row}
          <tr class="border-b border-gray-200 hover:bg-gray-50">
            <td
              class="px-4 py-3 text-sm font-medium text-gray-700 sticky left-0 bg-white"
            >
              {row.label}
            </td>
            {#each row.values as value}
              <td class="px-4 py-3 text-sm text-gray-600 align-top">
                {#if Array.isArray(value)}
                  {#if value.length > 0}
                    <ul class="space-y-1">
                      {#each value as item}
                        <li class="flex items-start gap-1">
                          <span class="text-green-500 mt-0.5">✓</span>
                          <span>{item}</span>
                        </li>
                      {/each}
                    </ul>
                  {:else}
                    <span class="text-gray-400">None</span>
                  {/if}
                {:else}
                  <span>{value}</span>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Recommendation summary -->
  <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
    <h3 class="font-semibold text-blue-900 mb-2">💡 Comparison Summary</h3>
    <div class="text-sm text-blue-800 space-y-2">
      <p>
        <strong>Most Beginner-Friendly:</strong>
        {stacks.reduce((a, b) => {
          const order = {
            beginner: 0,
            intermediate: 1,
            advanced: 2,
            expert: 3,
          };
          return order[a.complexity] < order[b.complexity] ? a : b;
        }).name}
      </p>
      <p>
        <strong>Most Popular:</strong>
        {stacks.reduce((a, b) => (a.popularity > b.popularity ? a : b)).name}
      </p>
      <p>
        <strong>Best for Production:</strong>
        {stacks.find((s) => s.maturity === "mature")?.name ||
          stacks.find((s) => s.maturity === "stable")?.name ||
          "N/A"}
      </p>
    </div>
  </div>
</div>

<style>
  .comparison-table {
    position: relative;
  }

  .comparison-table table {
    border-spacing: 0;
  }

  .sticky {
    position: sticky;
  }

  @media (max-width: 768px) {
    .comparison-table {
      overflow-x: scroll;
    }
  }
</style>
