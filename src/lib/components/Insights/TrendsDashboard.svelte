<script lang="ts">
/**
 * Trends Dashboard - Phase 4.5
 * Comprehensive analytics dashboard for cross-project insights.
 */

import { onMount } from 'svelte';
import type {
  TechnologyUsage,
  StackCombination,
  PatternInsight,
  TrendData,
  InsightsStatistics,
  TrendType,
  PatternCategory,
} from '$lib/types/insights';
import {
  getTrendIcon,
  getTrendColor,
  getTrendLabel,
  getCategoryIcon,
  getCategoryLabel,
  formatSuccessRate,
  formatTrendingScore,
  formatScore,
  getSuccessRateColor,
  getTrendingScoreColor,
  sortByUsage,
  sortByTrending,
  getTopN,
} from '$lib/types/insights';
import {
  getTopTechnologies,
  getTrendingTechnologies,
  getPopularCombinations,
  getPatternRecommendations,
  getInsightsStatistics,
  getTopTrending,
  getInsightsStatus,
} from '$lib/services/insights-client';

// ============================================================================
// State
// ============================================================================

let loading = $state(true);
let error = $state<string | null>(null);
let autoRefresh = $state(false);
let refreshInterval: NodeJS.Timeout | null = null;

// Data
let topTechnologies = $state<TechnologyUsage[]>([]);
let trendingTechnologies = $state<TechnologyUsage[]>([]);
let popularCombinations = $state<StackCombination[]>([]);
let patternRecommendations = $state<PatternInsight[]>([]);
let statistics = $state<InsightsStatistics | null>(null);
let risingTrends = $state<TrendData[]>([]);
let decliningTrends = $state<TrendData[]>([]);

// UI State
let selectedCategory = $state<PatternCategory | 'all'>('all');
let selectedTab = $state<'technologies' | 'combinations' | 'patterns' | 'trends'>('technologies');

// ============================================================================
// Lifecycle
// ============================================================================

onMount(async () => {
  await loadAllData();

  return () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  };
});

// ============================================================================
// Data Loading
// ============================================================================

async function loadAllData() {
  loading = true;
  error = null;

  try {
    // Check if insights service is available
    const status = await getInsightsStatus();
    if (!status.pattern_analyzer_initialized || !status.trend_calculator_initialized) {
      error = 'Insights services are not initialized. Please analyze some projects first.';
      return;
    }

    // Load all data in parallel
    const [
      topTechData,
      trendingTechData,
      combosData,
      patternsData,
      statsData,
      risingData,
      decliningData,
    ] = await Promise.all([
      getTopTechnologies({ limit: 10 }),
      getTrendingTechnologies({ limit: 10 }),
      getPopularCombinations({ min_usage: 2, limit: 10 }),
      getPatternRecommendations({ limit: 10 }),
      getInsightsStatistics(),
      getTopTrending({ trend_type: 'rising', limit: 5 }),
      getTopTrending({ trend_type: 'declining', limit: 5 }),
    ]);

    topTechnologies = topTechData;
    trendingTechnologies = trendingTechData;
    popularCombinations = combosData;
    patternRecommendations = patternsData;
    statistics = statsData;
    risingTrends = risingData;
    decliningTrends = decliningData;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load insights data';
    console.error('Error loading insights:', err);
  } finally {
    loading = false;
  }
}

function toggleAutoRefresh() {
  autoRefresh = !autoRefresh;

  if (autoRefresh) {
    refreshInterval = setInterval(() => {
      loadAllData();
    }, 60000); // Refresh every 60 seconds
  } else {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }
}

// ============================================================================
// Computed Values
// ============================================================================

const filteredTechnologies = $derived(() => {
  if (selectedCategory === 'all') return topTechnologies;
  return topTechnologies.filter((tech) => tech.category === selectedCategory);
});

</script>

<div class="trends-dashboard">
  <!-- Header -->
  <div class="dashboard-header">
    <div class="header-left">
      <h2>📊 Cross-Project Insights</h2>
      <p>Ecosystem-wide technology trends and patterns</p>
    </div>
    <div class="header-right">
      <button
        class="refresh-button"
        class:active={autoRefresh}
        onclick={toggleAutoRefresh}
        title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
      >
        {autoRefresh ? '⏸️' : '▶️'}
        {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
      </button>
      <button class="refresh-button" onclick={() => loadAllData()}>
        🔄 Refresh
      </button>
    </div>
  </div>

  <!-- Statistics Overview -->
  {#if statistics}
    <div class="statistics-grid">
      <div class="stat-card">
        <div class="stat-icon">🔧</div>
        <div class="stat-value">{statistics.total_technologies}</div>
        <div class="stat-label">Technologies Tracked</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-value">{statistics.total_projects}</div>
        <div class="stat-label">Projects Analyzed</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏗️</div>
        <div class="stat-value">{statistics.total_patterns}</div>
        <div class="stat-label">Patterns Used</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-value">{formatSuccessRate(statistics.avg_success_rate)}</div>
        <div class="stat-label">Avg Success Rate</div>
      </div>
    </div>
  {/if}

  <!-- Loading State -->
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading insights...</p>
    </div>
  {/if}

  <!-- Error State -->
  {#if error}
    <div class="error-state">
      <p>⚠️ {error}</p>
      <button onclick={() => loadAllData()}>Retry</button>
    </div>
  {/if}

  <!-- Main Content -->
  {#if !loading && !error}
    <!-- Tabs -->
    <div class="tabs">
      <button
        class="tab"
        class:active={selectedTab === 'technologies'}
        onclick={() => (selectedTab = 'technologies')}
      >
        🔧 Technologies
      </button>
      <button
        class="tab"
        class:active={selectedTab === 'combinations'}
        onclick={() => (selectedTab = 'combinations')}
      >
        📦 Stack Combinations
      </button>
      <button
        class="tab"
        class:active={selectedTab === 'patterns'}
        onclick={() => (selectedTab = 'patterns')}
      >
        🏗️ Pattern Insights
      </button>
      <button
        class="tab"
        class:active={selectedTab === 'trends'}
        onclick={() => (selectedTab = 'trends')}
      >
        📈 Trends
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Technologies Tab -->
      {#if selectedTab === 'technologies'}
        <div class="technologies-section">
          <div class="section-header">
            <h3>Top Technologies by Usage</h3>
          </div>

          <div class="technology-list">
            {#each topTechnologies as tech}
              <div class="technology-item">
                <div class="tech-header">
                  <span class="tech-icon">{getCategoryIcon(tech.category)}</span>
                  <span class="tech-name">{tech.tech_name}</span>
                  <span class="tech-category">{getCategoryLabel(tech.category)}</span>
                </div>

                <div class="tech-metrics">
                  <div class="metric">
                    <span class="metric-label">Usage:</span>
                    <span class="metric-value">{tech.usage_count} projects</span>
                  </div>
                  <div class="metric">
                    <span class="metric-label">Success Rate:</span>
                    <span
                      class="metric-value"
                      style="color: {getSuccessRateColor(tech.success_rate)}"
                    >
                      {formatSuccessRate(tech.success_rate)}
                    </span>
                  </div>
                  <div class="metric">
                    <span class="metric-label">Trending:</span>
                    <span
                      class="metric-value"
                      style="color: {getTrendingScoreColor(tech.trending_score)}"
                    >
                      {formatTrendingScore(tech.trending_score)}
                    </span>
                  </div>
                </div>

                <div class="tech-bar">
                  <div
                    class="tech-bar-fill"
                    style="width: {(tech.usage_count / topTechnologies[0].usage_count) * 100}%; background-color: {getSuccessRateColor(tech.success_rate)}"
                  ></div>
                </div>
              </div>
            {/each}
          </div>

          <div class="section-header" style="margin-top: 2rem;">
            <h3>📈 Trending Technologies</h3>
          </div>

          <div class="trending-list">
            {#each trendingTechnologies as tech}
              <div class="trending-item">
                <span class="trending-icon">{getCategoryIcon(tech.category)}</span>
                <span class="trending-name">{tech.tech_name}</span>
                <span class="trending-score" style="color: {getTrendingScoreColor(tech.trending_score)}">
                  {formatTrendingScore(tech.trending_score)}
                </span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Stack Combinations Tab -->
      {#if selectedTab === 'combinations'}
        <div class="combinations-section">
          <div class="section-header">
            <h3>Popular Stack Combinations</h3>
          </div>

          <div class="combinations-list">
            {#each popularCombinations as combo}
              <div class="combination-item">
                <div class="combo-header">
                  <div class="combo-technologies">
                    {#each combo.technologies as tech}
                      <span class="combo-tech-badge">{tech}</span>
                    {/each}
                  </div>
                  <span class="combo-count">Used {combo.usage_count}× </span>
                </div>

                <div class="combo-metrics">
                  <div class="metric">
                    <span class="metric-label">Success Rate:</span>
                    <span
                      class="metric-value"
                      style="color: {getSuccessRateColor(combo.success_rate)}"
                    >
                      {formatSuccessRate(combo.success_rate)}
                    </span>
                  </div>
                  <div class="metric">
                    <span class="metric-label">Avg Project Size:</span>
                    <span class="metric-value">{combo.avg_project_size.toLocaleString()} LOC</span>
                  </div>
                </div>

                {#if combo.common_patterns.length > 0}
                  <div class="combo-patterns">
                    <span class="patterns-label">Common Patterns:</span>
                    {#each combo.common_patterns as pattern}
                      <span class="pattern-badge">{pattern}</span>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Pattern Insights Tab -->
      {#if selectedTab === 'patterns'}
        <div class="patterns-section">
          <div class="section-header">
            <h3>Recommended Architecture Patterns</h3>
          </div>

          <div class="patterns-list">
            {#each patternRecommendations as pattern}
              <div class="pattern-item">
                <div class="pattern-header">
                  <span class="pattern-icon">{getCategoryIcon(pattern.category)}</span>
                  <span class="pattern-name">{pattern.pattern_name}</span>
                </div>

                <div class="pattern-scores">
                  <div class="score-item">
                    <span class="score-label">Popularity</span>
                    <div class="score-bar">
                      <div
                        class="score-bar-fill"
                        style="width: {pattern.popularity_score}%; background: linear-gradient(90deg, #3b82f6, #8b5cf6)"
                      ></div>
                    </div>
                    <span class="score-value">{formatScore(pattern.popularity_score)}</span>
                  </div>

                  <div class="score-item">
                    <span class="score-label">Recommendation</span>
                    <div class="score-bar">
                      <div
                        class="score-bar-fill"
                        style="width: {pattern.recommendation_score}%; background: linear-gradient(90deg, #10b981, #3b82f6)"
                      ></div>
                    </div>
                    <span class="score-value">{formatScore(pattern.recommendation_score)}</span>
                  </div>
                </div>

                <div class="pattern-metrics">
                  <span class="metric-badge">
                    {pattern.usage_count} projects
                  </span>
                  <span
                    class="metric-badge"
                    style="background-color: {getSuccessRateColor(pattern.success_rate)}20; color: {getSuccessRateColor(pattern.success_rate)}"
                  >
                    {formatSuccessRate(pattern.success_rate)} success rate
                  </span>
                </div>

                {#if pattern.common_technologies.length > 0}
                  <div class="pattern-technologies">
                    <span class="tech-label">Common Technologies:</span>
                    {#each pattern.common_technologies.slice(0, 5) as tech}
                      <span class="tech-badge-small">{tech}</span>
                    {/each}
                    {#if pattern.common_technologies.length > 5}
                      <span class="tech-badge-small more">+{pattern.common_technologies.length - 5} more</span>
                    {/if}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Trends Tab -->
      {#if selectedTab === 'trends'}
        <div class="trends-section">
          <div class="trends-grid">
            <!-- Rising Trends -->
            <div class="trend-column">
              <div class="trend-column-header rising">
                <span class="trend-icon">📈</span>
                <h3>Rising</h3>
              </div>

              <div class="trend-items">
                {#each risingTrends as trend}
                  <div class="trend-item rising">
                    <div class="trend-name">{trend.entity_name}</div>
                    <div class="trend-change">+{trend.change_percent.toFixed(1)}%</div>
                    <div class="trend-confidence">
                      Confidence: {(trend.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Declining Trends -->
            <div class="trend-column">
              <div class="trend-column-header declining">
                <span class="trend-icon">📉</span>
                <h3>Declining</h3>
              </div>

              <div class="trend-items">
                {#each decliningTrends as trend}
                  <div class="trend-item declining">
                    <div class="trend-name">{trend.entity_name}</div>
                    <div class="trend-change">{trend.change_percent.toFixed(1)}%</div>
                    <div class="trend-confidence">
                      Confidence: {(trend.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
.trends-dashboard {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.header-left h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  color: var(--text-primary);
}

.header-left p {
  margin: 0;
  color: var(--text-secondary);
}

.header-right {
  display: flex;
  gap: 0.75rem;
}

.refresh-button {
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.refresh-button:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
}

.refresh-button.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

/* Statistics Grid */
.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem;
  text-align: center;
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Loading and Error States */
.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border: 4px solid var(--border-color);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state p {
  color: var(--error-color);
  margin-bottom: 1rem;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-color);
}

.tab {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
  margin-bottom: -2px;
}

.tab:hover {
  background: var(--bg-secondary);
  border-bottom-color: var(--accent-primary);
}

.tab.active {
  border-bottom-color: var(--accent-primary);
  font-weight: 600;
  color: var(--accent-primary);
}

/* Tab Content */
.tab-content {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Section Header */
.section-header {
  margin-bottom: 1rem;
}

.section-header h3 {
  font-size: 1.25rem;
  color: var(--text-primary);
  margin: 0;
}

/* Technology List */
.technology-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.technology-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.technology-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tech-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.tech-icon {
  font-size: 1.5rem;
}

.tech-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.tech-category {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-left: auto;
}

.tech-metrics {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-weight: 600;
  font-size: 0.95rem;
}

.tech-bar {
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.tech-bar-fill {
  height: 100%;
  transition: width 0.3s;
}

/* Trending List */
.trending-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.75rem;
}

.trending-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.trending-icon {
  font-size: 1.25rem;
}

.trending-name {
  flex: 1;
  font-weight: 500;
}

.trending-score {
  font-weight: 600;
  font-size: 0.95rem;
}

/* Combinations */
.combinations-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.combination-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem;
}

.combo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.combo-technologies {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.combo-tech-badge {
  padding: 0.375rem 0.75rem;
  background: var(--accent-primary);
  color: white;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.combo-count {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.combo-metrics {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.combo-patterns {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.patterns-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.pattern-badge {
  padding: 0.25rem 0.5rem;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-size: 0.75rem;
}

/* Pattern Insights */
.patterns-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.pattern-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.25rem;
}

.pattern-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.pattern-icon {
  font-size: 1.5rem;
}

.pattern-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.pattern-scores {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.score-item {
  display: grid;
  grid-template-columns: 100px 1fr 80px;
  align-items: center;
  gap: 1rem;
}

.score-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.score-bar {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.score-bar-fill {
  height: 100%;
  transition: width 0.3s;
}

.score-value {
  text-align: right;
  font-weight: 600;
  font-size: 0.875rem;
}

.pattern-metrics {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.metric-badge {
  padding: 0.375rem 0.75rem;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-size: 0.875rem;
}

.pattern-technologies {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tech-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.tech-badge-small {
  padding: 0.25rem 0.5rem;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-size: 0.75rem;
}

.tech-badge-small.more {
  background: var(--accent-primary);
  color: white;
}

/* Trends Section */
.trends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.trend-column {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.trend-column-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.trend-column-header.rising {
  background: linear-gradient(135deg, #10b981, #3b82f6);
  color: white;
}

.trend-column-header.declining {
  background: linear-gradient(135deg, #ef4444, #f59e0b);
  color: white;
}

.trend-column-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.trend-icon {
  font-size: 1.5rem;
}

.trend-items {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.trend-item {
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.trend-item.rising {
  background: rgba(16, 185, 129, 0.05);
}

.trend-item.declining {
  background: rgba(239, 68, 68, 0.05);
}

.trend-name {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.trend-change {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.trend-item.rising .trend-change {
  color: #10b981;
}

.trend-item.declining .trend-change {
  color: #ef4444;
}

.trend-confidence {
  font-size: 0.75rem;
  color: var(--text-secondary);
}
</style>
