<script lang="ts">
  import { onMount } from 'svelte';
  import { getRoutingStats, getSavings } from '$lib/services/routing-client';
  import type { CostStatsResponse, SavingsResponse } from '$lib/types/routing';
  import {
    formatCost,
    formatPercentage,
    getTierColor,
    getComplexityColor,
  } from '$lib/types/routing';

  interface Props {
    autoLoad?: boolean;
    refreshInterval?: number; // milliseconds
  }

  let { autoLoad = true, refreshInterval }: Props = $props();

  let statsState = $state<{
    loading: boolean;
    data: CostStatsResponse | null;
    error: string | null;
  }>({
    loading: false,
    data: null,
    error: null,
  });

  let savingsState = $state<{
    loading: boolean;
    data: SavingsResponse | null;
    error: string | null;
  }>({
    loading: false,
    data: null,
    error: null,
  });

  let refreshTimer: NodeJS.Timeout | null = null;

  async function loadStats() {
    statsState.loading = true;
    statsState.error = null;

    try {
      const stats = await getRoutingStats();
      statsState.data = stats;
    } catch (error) {
      statsState.error = error instanceof Error ? error.message : 'Failed to load stats';
    } finally {
      statsState.loading = false;
    }
  }

  async function loadSavings() {
    savingsState.loading = true;
    savingsState.error = null;

    try {
      const savings = await getSavings();
      savingsState.data = savings;
    } catch (error) {
      savingsState.error = error instanceof Error ? error.message : 'Failed to load savings';
    } finally {
      savingsState.loading = false;
    }
  }

  async function refreshData() {
    await Promise.all([loadStats(), loadSavings()]);
  }

  function setupAutoRefresh() {
    if (refreshInterval && refreshInterval > 0) {
      refreshTimer = setInterval(refreshData, refreshInterval);
    }
  }

  function cleanup() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  onMount(() => {
    if (autoLoad) {
      refreshData();
    }
    setupAutoRefresh();

    return cleanup;
  });
</script>

<div class="cost-tracking">
  <div class="tracking-header">
    <h2>Cost Tracking & Optimization</h2>
    <button
      class="refresh-button"
      onclick={refreshData}
      disabled={statsState.loading || savingsState.loading}
    >
      {statsState.loading || savingsState.loading ? 'Loading...' : 'Refresh'}
    </button>
  </div>

  {#if !statsState.data && !statsState.loading}
    <div class="empty-state">
      <p>No cost data available yet.</p>
      <button class="load-button" onclick={refreshData}>Load Cost Data</button>
    </div>
  {:else}
    <!-- Savings Summary -->
    {#if savingsState.data}
      <div class="savings-card">
        <h3>Cost Savings</h3>
        <div class="savings-grid">
          <div class="metric">
            <span class="label">Total Actual Cost</span>
            <span class="value cost">{formatCost(savingsState.data.total_actual_cost)}</span>
          </div>
          <div class="metric">
            <span class="label">Baseline Cost (All Opus)</span>
            <span class="value cost-baseline">{formatCost(savingsState.data.baseline_cost)}</span>
          </div>
          <div class="metric highlight">
            <span class="label">Total Savings</span>
            <span class="value savings">{formatCost(savingsState.data.total_savings)}</span>
          </div>
          <div class="metric highlight">
            <span class="label">Savings Percentage</span>
            <span class="value percentage">{formatPercentage(savingsState.data.savings_percentage)}</span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Stats Grid -->
    {#if statsState.data}
      <div class="stats-grid">
        <!-- Overview -->
        <div class="stat-card">
          <h3>Overview</h3>
          <div class="stat-list">
            <div class="stat-item">
              <span class="stat-label">Total Requests</span>
              <span class="stat-value">{statsState.data.total_requests.toLocaleString()}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Cost</span>
              <span class="stat-value">{formatCost(statsState.data.total_cost)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Average Cost/Request</span>
              <span class="stat-value">{formatCost(statsState.data.average_cost_per_request)}</span>
            </div>
          </div>
        </div>

        <!-- Cost by Model -->
        <div class="stat-card">
          <h3>Cost by Model</h3>
          <div class="stat-list">
            {#each Object.entries(statsState.data.cost_by_model) as [model, cost]}
              <div class="stat-item">
                <span class="stat-label">{model}</span>
                <span class="stat-value">{formatCost(cost)}</span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Cost by Tier -->
        <div class="stat-card">
          <h3>Cost by Tier</h3>
          <div class="stat-list">
            {#each Object.entries(statsState.data.cost_by_tier) as [tier, cost]}
              <div class="stat-item">
                <span class="stat-label" style="color: {getTierColor(tier as any)}">{tier.toUpperCase()}</span>
                <span class="stat-value">{formatCost(cost)}</span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Cost by Complexity -->
        <div class="stat-card">
          <h3>Cost by Complexity</h3>
          <div class="stat-list">
            {#each Object.entries(statsState.data.cost_by_complexity) as [complexity, cost]}
              <div class="stat-item">
                <span class="stat-label" style="color: {getComplexityColor(complexity as any)}">{complexity.toUpperCase()}</span>
                <span class="stat-value">{formatCost(cost)}</span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Model Distribution -->
        <div class="stat-card full-width">
          <h3>Model Distribution</h3>
          <div class="distribution-bars">
            {#each Object.entries(statsState.data.model_distribution) as [model, percentage]}
              <div class="distribution-item">
                <span class="model-name">{model}</span>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: {percentage}%"></div>
                </div>
                <span class="percentage">{formatPercentage(percentage)}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    {#if statsState.error || savingsState.error}
      <div class="error-state">
        <p class="error-message">{statsState.error || savingsState.error}</p>
        <button onclick={refreshData}>Retry</button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .cost-tracking {
    background: var(--surface);
    border-radius: 8px;
    padding: 1.5rem;
  }

  .tracking-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .tracking-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .refresh-button {
    padding: 0.5rem 1rem;
    background: var(--accent-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .refresh-button:hover:not(:disabled) {
    background: var(--accent-primary-hover);
  }

  .refresh-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    background: var(--surface-secondary);
    border: 1px dashed var(--border);
    border-radius: 8px;
  }

  .empty-state p {
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }

  .load-button {
    padding: 0.75rem 1.5rem;
    background: var(--accent-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
  }

  .savings-card {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .savings-card h3 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .savings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .metric {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 1rem;
  }

  .metric.highlight {
    background: rgba(255, 255, 255, 0.2);
  }

  .metric .label {
    display: block;
    font-size: 0.875rem;
    opacity: 0.9;
    margin-bottom: 0.5rem;
  }

  .metric .value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .stat-card {
    background: var(--surface-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
  }

  .stat-card.full-width {
    grid-column: 1 / -1;
  }

  .stat-card h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .stat-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .stat-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .distribution-bars {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .distribution-item {
    display: grid;
    grid-template-columns: 200px 1fr 80px;
    align-items: center;
    gap: 1rem;
  }

  .model-name {
    font-size: 0.875rem;
    color: var(--text-primary);
    font-weight: 500;
  }

  .progress-bar {
    height: 24px;
    background: var(--surface-tertiary);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    transition: width 0.3s ease;
  }

  .percentage {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    text-align: right;
  }

  .error-state {
    text-align: center;
    padding: 2rem 1rem;
    background: var(--surface-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-top: 1rem;
  }

  .error-message {
    color: #ef4444;
    margin-bottom: 1rem;
  }

  .error-state button {
    padding: 0.5rem 1rem;
    background: var(--accent-primary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  @media (max-width: 768px) {
    .savings-grid {
      grid-template-columns: 1fr;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .distribution-item {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .percentage {
      text-align: left;
    }
  }
</style>
