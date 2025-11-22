<script lang="ts">
  /**
   * AnalyticsDashboard - Analytics and metrics overview for prompt execution
   */

  import { onMount } from "svelte";
  import { Chart, registerables } from "chart.js";

  // Register Chart.js components
  Chart.register(...registerables);

  interface Props {
    class?: string;
  }

  let { class: className = "" }: Props = $props();

  // Time range selector
  let timeRange = $state<"24h" | "7d" | "30d" | "90d">("7d");

  // Chart references
  let successRateCanvas: HTMLCanvasElement;
  let costByModelCanvas: HTMLCanvasElement;
  let latencyDistCanvas: HTMLCanvasElement;
  let timelineCanvas: HTMLCanvasElement;

  let charts: {
    successRate?: Chart;
    costByModel?: Chart;
    latencyDist?: Chart;
    timeline?: Chart;
  } = {};

  // Mock data - will be replaced with real API data
  const metrics = $derived({
    successRate: 94.2,
    totalCost: 12.45,
    avgLatency: 1.2,
    executionCount: 156,
  });

  // Mock chart data generators
  const generateSuccessRateData = () => {
    const days =
      timeRange === "24h"
        ? 24
        : timeRange === "7d"
        ? 7
        : timeRange === "30d"
        ? 30
        : 90;
    const labels = Array.from({ length: days }, (_, i) => {
      if (timeRange === "24h") return `${i}:00`;
      return `Day ${i + 1}`;
    });
    const data = Array.from({ length: days }, () => 85 + Math.random() * 15);
    return { labels, data };
  };

  const generateCostByModelData = () => ({
    labels: [
      "GPT-4",
      "Claude 3 Sonnet",
      "GPT-3.5",
      "Claude 3 Haiku",
      "Gemini Pro",
    ],
    data: [4.2, 3.8, 1.5, 2.1, 0.9],
  });

  const generateLatencyData = () => ({
    labels: ["0-0.5s", "0.5-1s", "1-1.5s", "1.5-2s", "2-3s", "3s+"],
    data: [12, 45, 58, 28, 10, 3],
  });

  const generateTimelineData = () => {
    const hours = 24;
    const labels = Array.from({ length: hours }, (_, i) => `${i}:00`);
    const data = Array.from({ length: hours }, () =>
      Math.floor(Math.random() * 20)
    );
    return { labels, data };
  };

  function initCharts() {
    // Success Rate Over Time (Line Chart)
    const successRateData = generateSuccessRateData();
    charts.successRate = new Chart(successRateCanvas, {
      type: "line",
      data: {
        labels: successRateData.labels,
        datasets: [
          {
            label: "Success Rate %",
            data: successRateData.data,
            borderColor: "rgb(52, 211, 153)",
            backgroundColor: "rgba(52, 211, 153, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 80,
            max: 100,
            grid: { color: "rgba(148, 163, 184, 0.1)" },
            ticks: { color: "rgb(148, 163, 184)" },
          },
          x: {
            grid: { color: "rgba(148, 163, 184, 0.1)" },
            ticks: { color: "rgb(148, 163, 184)" },
          },
        },
      },
    });

    // Cost by Model (Doughnut Chart)
    const costData = generateCostByModelData();
    charts.costByModel = new Chart(costByModelCanvas, {
      type: "doughnut",
      data: {
        labels: costData.labels,
        datasets: [
          {
            data: costData.data,
            backgroundColor: [
              "rgb(248, 113, 113)",
              "rgb(251, 146, 60)",
              "rgb(251, 191, 36)",
              "rgb(163, 230, 53)",
              "rgb(56, 189, 248)",
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: { color: "rgb(148, 163, 184)", padding: 10 },
          },
        },
      },
    });

    // Latency Distribution (Bar Chart)
    const latencyData = generateLatencyData();
    charts.latencyDist = new Chart(latencyDistCanvas, {
      type: "bar",
      data: {
        labels: latencyData.labels,
        datasets: [
          {
            label: "Executions",
            data: latencyData.data,
            backgroundColor: "rgba(96, 165, 250, 0.8)",
            borderColor: "rgb(96, 165, 250)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(148, 163, 184, 0.1)" },
            ticks: { color: "rgb(148, 163, 184)" },
          },
          x: {
            grid: { display: false },
            ticks: { color: "rgb(148, 163, 184)" },
          },
        },
      },
    });

    // Execution Timeline (Line Chart)
    const timelineData = generateTimelineData();
    charts.timeline = new Chart(timelineCanvas, {
      type: "line",
      data: {
        labels: timelineData.labels,
        datasets: [
          {
            label: "Executions",
            data: timelineData.data,
            borderColor: "rgb(192, 132, 252)",
            backgroundColor: "rgba(192, 132, 252, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(148, 163, 184, 0.1)" },
            ticks: { color: "rgb(148, 163, 184)" },
          },
          x: {
            grid: { color: "rgba(148, 163, 184, 0.1)" },
            ticks: { color: "rgb(148, 163, 184)" },
          },
        },
      },
    });
  }

  function destroyCharts() {
    if (charts.successRate) charts.successRate.destroy();
    if (charts.costByModel) charts.costByModel.destroy();
    if (charts.latencyDist) charts.latencyDist.destroy();
    if (charts.timeline) charts.timeline.destroy();
    charts = {};
  }

  function handleTimeRangeChange(range: "24h" | "7d" | "30d" | "90d") {
    timeRange = range;
    // Rebuild charts with new time range data
    destroyCharts();
    setTimeout(() => initCharts(), 10);
  }

  onMount(() => {
    initCharts();
    return () => destroyCharts();
  });
</script>

<div class="analytics-dashboard flex flex-col gap-4 p-4 {className}">
  <!-- Header with Time Range Selector -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-xl font-semibold text-slate-100">Analytics Dashboard</h2>
      <p class="text-sm text-slate-400 mt-1">
        Performance metrics and execution insights
      </p>
    </div>

    <!-- Time Range Selector -->
    <div
      class="flex items-center gap-1 bg-forge-gunmetal rounded border border-slate-700 p-1"
    >
      <button
        class="px-3 py-1.5 text-xs transition-colors rounded {timeRange ===
        '24h'
          ? 'bg-forge-ember text-slate-900'
          : 'text-slate-400 hover:text-slate-200'}"
        onclick={() => handleTimeRangeChange("24h")}
      >
        24h
      </button>
      <button
        class="px-3 py-1.5 text-xs transition-colors rounded {timeRange === '7d'
          ? 'bg-forge-ember text-slate-900'
          : 'text-slate-400 hover:text-slate-200'}"
        onclick={() => handleTimeRangeChange("7d")}
      >
        7d
      </button>
      <button
        class="px-3 py-1.5 text-xs transition-colors rounded {timeRange ===
        '30d'
          ? 'bg-forge-ember text-slate-900'
          : 'text-slate-400 hover:text-slate-200'}"
        onclick={() => handleTimeRangeChange("30d")}
      >
        30d
      </button>
      <button
        class="px-3 py-1.5 text-xs transition-colors rounded {timeRange ===
        '90d'
          ? 'bg-forge-ember text-slate-900'
          : 'text-slate-400 hover:text-slate-200'}"
        onclick={() => handleTimeRangeChange("90d")}
      >
        90d
      </button>
    </div>
  </div>

  <!-- Metrics Overview Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Success Rate Card -->
    <div
      class="metric-card bg-forge-gunmetal border border-slate-700 rounded-lg p-4"
    >
      <div class="flex items-center justify-between mb-2">
        <span
          class="text-xs font-medium text-slate-400 uppercase tracking-wide"
        >
          Success Rate
        </span>
        <svg
          class="w-5 h-5 text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div class="text-3xl font-bold text-slate-100 mb-1">
        {metrics.successRate.toFixed(1)}%
      </div>
      <div class="text-xs text-slate-500">
        {Math.round(metrics.executionCount * (metrics.successRate / 100))} / {metrics.executionCount}
        successful
      </div>
    </div>

    <!-- Total Cost Card -->
    <div
      class="metric-card bg-forge-gunmetal border border-slate-700 rounded-lg p-4"
    >
      <div class="flex items-center justify-between mb-2">
        <span
          class="text-xs font-medium text-slate-400 uppercase tracking-wide"
        >
          Total Cost
        </span>
        <svg
          class="w-5 h-5 text-forge-ember"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div class="text-3xl font-bold text-slate-100 mb-1">
        ${metrics.totalCost.toFixed(2)}
      </div>
      <div class="text-xs text-slate-500">
        ${(metrics.totalCost / metrics.executionCount).toFixed(4)} avg per run
      </div>
    </div>

    <!-- Average Latency Card -->
    <div
      class="metric-card bg-forge-gunmetal border border-slate-700 rounded-lg p-4"
    >
      <div class="flex items-center justify-between mb-2">
        <span
          class="text-xs font-medium text-slate-400 uppercase tracking-wide"
        >
          Avg Latency
        </span>
        <svg
          class="w-5 h-5 text-blue-400"
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
      </div>
      <div class="text-3xl font-bold text-slate-100 mb-1">
        {metrics.avgLatency.toFixed(1)}s
      </div>
      <div class="text-xs text-slate-500">Response time</div>
    </div>

    <!-- Execution Count Card -->
    <div
      class="metric-card bg-forge-gunmetal border border-slate-700 rounded-lg p-4"
    >
      <div class="flex items-center justify-between mb-2">
        <span
          class="text-xs font-medium text-slate-400 uppercase tracking-wide"
        >
          Executions
        </span>
        <svg
          class="w-5 h-5 text-purple-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>
      <div class="text-3xl font-bold text-slate-100 mb-1">
        {metrics.executionCount}
      </div>
      <div class="text-xs text-slate-500">
        Total runs in {timeRange}
      </div>
    </div>
  </div>

  <!-- Chart Containers -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <!-- Success Rate Over Time Chart -->
    <div
      class="chart-container bg-forge-gunmetal border border-slate-700 rounded-lg p-4"
    >
      <h3 class="text-sm font-medium text-slate-300 mb-3">
        Success Rate Over Time
      </h3>
      <div class="h-64">
        <canvas bind:this={successRateCanvas} />
      </div>
    </div>

    <!-- Cost by Model Chart -->
    <div
      class="chart-container bg-forge-gunmetal border border-slate-700 rounded-lg p-4"
    >
      <h3 class="text-sm font-medium text-slate-300 mb-3">Cost by Model</h3>
      <div class="h-64">
        <canvas bind:this={costByModelCanvas} />
      </div>
    </div>

    <!-- Latency Distribution Chart -->
    <div
      class="chart-container bg-forge-gunmetal border border-slate-700 rounded-lg p-4"
    >
      <h3 class="text-sm font-medium text-slate-300 mb-3">
        Latency Distribution
      </h3>
      <div class="h-64">
        <canvas bind:this={latencyDistCanvas} />
      </div>
    </div>

    <!-- Execution Timeline Chart -->
    <div
      class="chart-container bg-forge-gunmetal border border-slate-700 rounded-lg p-4"
    >
      <h3 class="text-sm font-medium text-slate-300 mb-3">
        Execution Timeline
      </h3>
      <div class="h-64">
        <canvas bind:this={timelineCanvas} />
      </div>
    </div>
  </div>
</div>

<style>
  .metric-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
</style>
