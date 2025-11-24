<!-- @component
Budget Tracker Component
Displays current budget status with progress bars and alerts
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { costTracker } from "$lib/services/modelRouter";

  export let dateRange: { start: Date; end: Date };

  let budget: any = null;

  $: if (dateRange) {
    loadBudget();
  }

  onMount(() => {
    loadBudget();
  });

  function loadBudget() {
    budget = costTracker.getBudget();
  }

  function getProgressColor(percentage: number, threshold: number): string {
    if (percentage >= threshold * 100) return "from-orange-500 to-red-500";
    if (percentage >= threshold * 100 * 0.75)
      return "from-yellow-500 to-orange-500";
    return "from-green-500 to-blue-500";
  }

  function calculatePercentage(spent: number, limit: number): number {
    return limit > 0 ? (spent / limit) * 100 : 0;
  }
</script>

<div class="bg-forge-gunmetal rounded-lg p-6 border border-forge-steelgray">
  <h3 class="text-sm font-semibold text-slate-100 mb-4">Budget Status</h3>

  {#if budget}
    <div class="space-y-4">
      <!-- Daily Budget -->
      {#if budget.dailyLimit}
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-slate-300">Daily Budget</span>
            <span class="text-sm font-medium text-slate-100">
              ${budget.dailySpent.toFixed(2)} / ${budget.dailyLimit.toFixed(2)}
            </span>
          </div>
          <div class="h-3 bg-forge-blacksteel rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r transition-all {getProgressColor(
                calculatePercentage(budget.dailySpent, budget.dailyLimit),
                budget.warningThreshold
              )}"
              style="width: {Math.min(
                calculatePercentage(budget.dailySpent, budget.dailyLimit),
                100
              )}%"
            />
          </div>
          <div class="text-xs text-slate-400 mt-1">
            {calculatePercentage(budget.dailySpent, budget.dailyLimit).toFixed(
              1
            )}% used
            {#if calculatePercentage(budget.dailySpent, budget.dailyLimit) >= budget.warningThreshold * 100}
              <span class="text-orange-400 ml-2">⚠️ Approaching limit</span>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Weekly Budget -->
      {#if budget.weeklyLimit}
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-slate-300">Weekly Budget</span>
            <span class="text-sm font-medium text-slate-100">
              ${budget.weeklySpent.toFixed(2)} / ${budget.weeklyLimit.toFixed(
                2
              )}
            </span>
          </div>
          <div class="h-3 bg-forge-blacksteel rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r transition-all {getProgressColor(
                calculatePercentage(budget.weeklySpent, budget.weeklyLimit),
                budget.warningThreshold
              )}"
              style="width: {Math.min(
                calculatePercentage(budget.weeklySpent, budget.weeklyLimit),
                100
              )}%"
            />
          </div>
          <div class="text-xs text-slate-400 mt-1">
            {calculatePercentage(
              budget.weeklySpent,
              budget.weeklyLimit
            ).toFixed(1)}% used
          </div>
        </div>
      {/if}

      <!-- Monthly Budget -->
      {#if budget.monthlyLimit}
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-slate-300">Monthly Budget</span>
            <span class="text-sm font-medium text-slate-100">
              ${budget.monthlySpent.toFixed(2)} / ${budget.monthlyLimit.toFixed(
                2
              )}
            </span>
          </div>
          <div class="h-3 bg-forge-blacksteel rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r transition-all {getProgressColor(
                calculatePercentage(budget.monthlySpent, budget.monthlyLimit),
                budget.warningThreshold
              )}"
              style="width: {Math.min(
                calculatePercentage(budget.monthlySpent, budget.monthlyLimit),
                100
              )}%"
            />
          </div>
          <div class="text-xs text-slate-400 mt-1">
            {calculatePercentage(
              budget.monthlySpent,
              budget.monthlyLimit
            ).toFixed(1)}% used
          </div>
        </div>
      {/if}

      {#if !budget.dailyLimit && !budget.weeklyLimit && !budget.monthlyLimit}
        <div class="text-sm text-slate-400 text-center py-4">
          No budget limits configured. Set limits in Settings to track spending.
        </div>
      {/if}
    </div>
  {:else}
    <div class="text-sm text-slate-400 text-center py-4">
      No budget data available
    </div>
  {/if}
</div>
