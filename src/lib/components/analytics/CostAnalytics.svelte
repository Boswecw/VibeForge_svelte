<!-- @component
Cost Analytics Component
Displays cost breakdown with pie charts, line charts, and provider/category analysis
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { costTracker } from "$lib/services/modelRouter";
  import type { CostEntry } from "$lib/services/modelRouter/types";

  export let dateRange: { start: Date; end: Date };
  export let compact = false;

  interface CostSummary {
    totalCost: number;
    totalTokens: number;
    totalRequests: number;
    byProvider: Record<string, { cost: number; tokens: number; requests: number }>;
    byCategory: Record<string, { cost: number; tokens: number; requests: number }>;
  }

  let summary: CostSummary | null = null;
  let costByProvider: Map<string, number> = new Map();
  let costByCategory: Map<string, number> = new Map();
  let costByModel: Map<string, number> = new Map();
  let dailyCosts: { date: string; cost: number }[] = [];

  $: if (dateRange) {
    loadCostData();
  }

  onMount(() => {
    loadCostData();
  });

  function loadCostData() {
    summary = costTracker.getSummary(dateRange.start, dateRange.end);

    // Group by provider
    costByProvider = new Map();
    for (const [provider, cost] of summary.byProvider.entries()) {
      costByProvider.set(provider, cost);
    }

    // Group by category
    costByCategory = new Map();
    for (const [category, cost] of summary.byCategory.entries()) {
      costByCategory.set(category, cost);
    }

    // Group by model
    costByModel = new Map();
    for (const entry of summary.entries) {
      const key = `${entry.provider}/${entry.model}`;
      costByModel.set(key, (costByModel.get(key) || 0) + entry.cost);
    }

    // Daily costs for line chart
    const dailyMap = new Map<string, number>();
    for (const entry of summary.entries) {
      const date = new Date(entry.timestamp).toISOString().split("T")[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + entry.cost);
    }
    dailyCosts = Array.from(dailyMap.entries())
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function getProviderColor(provider: string): string {
    const colors: Record<string, string> = {
      openai: "#10a37f",
      anthropic: "#d4a574",
      ollama: "#6366f1",
    };
    return colors[provider] || "#64748b";
  }

  function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      recommendation: "#3b82f6",
      explanation: "#10b981",
      validation: "#f59e0b",
      analysis: "#8b5cf6",
      code_generation: "#ef4444",
    };
    return colors[category] || "#64748b";
  }

  function calculatePercentage(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
  }
</script>

<div class="space-y-6">
  {#if summary}
    <!-- Total Cost Summary -->
    {#if !compact}
      <div
        class="bg-forge-gunmetal rounded-lg p-6 border border-forge-steelgray"
      >
        <h3 class="text-sm font-semibold text-slate-100 mb-4">Cost Summary</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div class="text-xs text-slate-400">Total Spent</div>
            <div class="text-2xl font-bold text-forge-ember mt-1">
              ${summary.total.toFixed(4)}
            </div>
          </div>
          <div>
            <div class="text-xs text-slate-400">Number of Calls</div>
            <div class="text-2xl font-bold text-blue-400 mt-1">
              {summary.entries.length}
            </div>
          </div>
          <div>
            <div class="text-xs text-slate-400">Avg Cost per Call</div>
            <div class="text-2xl font-bold text-green-400 mt-1">
              ${summary.entries.length > 0
                ? (summary.total / summary.entries.length).toFixed(4)
                : "0.0000"}
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Daily Cost Trend (Line Chart) -->
    <div class="bg-forge-gunmetal rounded-lg p-6 border border-forge-steelgray">
      <h3 class="text-sm font-semibold text-slate-100 mb-4">
        Daily Cost Trend
      </h3>
      {#if dailyCosts.length > 0}
        <div class="space-y-2">
          {#each dailyCosts as day}
            <div class="flex items-center gap-3">
              <div class="text-xs text-slate-400 w-24">{day.date}</div>
              <div
                class="flex-1 h-6 bg-forge-blacksteel rounded-full overflow-hidden"
              >
                <div
                  class="h-full bg-linear-to-r from-green-500 to-forge-ember transition-all"
                  style="width: {calculatePercentage(
                    day.cost,
                    Math.max(...dailyCosts.map((d) => d.cost))
                  )}%"
                />
              </div>
              <div class="text-xs font-medium text-slate-100 w-20 text-right">
                ${day.cost.toFixed(4)}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-sm text-slate-400 text-center py-8">
          No cost data available
        </div>
      {/if}
    </div>

    <!-- Cost by Provider (Pie Chart) -->
    <div
      class="grid grid-cols-1 {compact
        ? 'lg:grid-cols-1'
        : 'lg:grid-cols-2'} gap-6"
    >
      <div
        class="bg-forge-gunmetal rounded-lg p-6 border border-forge-steelgray"
      >
        <h3 class="text-sm font-semibold text-slate-100 mb-4">
          Cost by Provider
        </h3>
        {#if costByProvider.size > 0}
          <div class="space-y-3">
            {#each Array.from(costByProvider.entries()).sort((a, b) => b[1] - a[1]) as [provider, cost]}
              <div>
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-3 h-3 rounded-full"
                      style="background-color: {getProviderColor(provider)}"
                    />
                    <span class="text-sm text-slate-100 capitalize"
                      >{provider}</span
                    >
                  </div>
                  <span class="text-sm font-medium text-slate-100"
                    >${cost.toFixed(4)}</span
                  >
                </div>
                <div
                  class="h-2 bg-forge-blacksteel rounded-full overflow-hidden"
                >
                  <div
                    class="h-full transition-all"
                    style="width: {calculatePercentage(
                      cost,
                      summary.total
                    )}%; background-color: {getProviderColor(provider)}"
                  />
                </div>
                <div class="text-xs text-slate-400 mt-1">
                  {calculatePercentage(cost, summary.total).toFixed(1)}% of
                  total
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-sm text-slate-400 text-center py-8">
            No provider data
          </div>
        {/if}
      </div>

      <!-- Cost by Category -->
      {#if !compact}
        <div
          class="bg-forge-gunmetal rounded-lg p-6 border border-forge-steelgray"
        >
          <h3 class="text-sm font-semibold text-slate-100 mb-4">
            Cost by Category
          </h3>
          {#if costByCategory.size > 0}
            <div class="space-y-3">
              {#each Array.from(costByCategory.entries()).sort((a, b) => b[1] - a[1]) as [category, cost]}
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-3 h-3 rounded-full"
                        style="background-color: {getCategoryColor(category)}"
                      />
                      <span class="text-sm text-slate-100 capitalize"
                        >{category.replace("_", " ")}</span
                      >
                    </div>
                    <span class="text-sm font-medium text-slate-100"
                      >${cost.toFixed(4)}</span
                    >
                  </div>
                  <div
                    class="h-2 bg-forge-blacksteel rounded-full overflow-hidden"
                  >
                    <div
                      class="h-full transition-all"
                      style="width: {calculatePercentage(
                        cost,
                        summary.total
                      )}%; background-color: {getCategoryColor(category)}"
                    />
                  </div>
                  <div class="text-xs text-slate-400 mt-1">
                    {calculatePercentage(cost, summary.total).toFixed(1)}% of
                    total
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-sm text-slate-400 text-center py-8">
              No category data
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Cost by Model (Table) -->
    {#if !compact}
      <div
        class="bg-forge-gunmetal rounded-lg p-6 border border-forge-steelgray"
      >
        <h3 class="text-sm font-semibold text-slate-100 mb-4">Cost by Model</h3>
        {#if costByModel.size > 0}
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-forge-steelgray">
                  <th class="text-left text-xs font-medium text-slate-400 pb-2"
                    >Model</th
                  >
                  <th class="text-right text-xs font-medium text-slate-400 pb-2"
                    >Cost</th
                  >
                  <th class="text-right text-xs font-medium text-slate-400 pb-2"
                    >% of Total</th
                  >
                </tr>
              </thead>
              <tbody>
                {#each Array.from(costByModel.entries()).sort((a, b) => b[1] - a[1]) as [model, cost]}
                  <tr class="border-b border-forge-steelgray/50">
                    <td class="py-2 text-sm text-slate-100">{model}</td>
                    <td
                      class="py-2 text-sm text-slate-100 text-right font-medium"
                      >${cost.toFixed(4)}</td
                    >
                    <td class="py-2 text-sm text-slate-400 text-right">
                      {calculatePercentage(cost, summary.total).toFixed(1)}%
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <div class="text-sm text-slate-400 text-center py-8">
            No model data
          </div>
        {/if}
      </div>
    {/if}
  {:else}
    <div class="text-sm text-slate-400 text-center py-12">
      Loading cost data...
    </div>
  {/if}
</div>
