<!-- @component
no description yet
-->
<script lang="ts">
  import { onMount } from "svelte";

  // Props
  export let userId: number | null = null;
  export let projectType: string = "";
  export let selectedLanguages: string[] = [];

  // Historical data interface
  interface LanguagePreference {
    language_id: string;
    language_name: string;
    times_selected: number;
    times_viewed: number;
    success_rate: number;
    paired_with: string[];
  }

  interface StackExperience {
    stack_id: string;
    times_used: number;
    success_rate: number;
    avg_satisfaction: number;
    avg_build_time: number;
    common_issues: string[];
  }

  interface ExperienceContext {
    user_id: number | null;
    total_projects: number;
    favorite_languages: LanguagePreference[];
    successful_stacks: StackExperience[];
    project_types: Record<string, number>;
    overall_success_rate: number;
    avg_project_complexity: number;
    recent_patterns: {
      trending_up: string[];
      trending_down: string[];
      new_explorations: string[];
      abandoned_projects: number;
    };
    timestamp: string;
  }

  // State
  let loading = false;
  let context: ExperienceContext | null = null;
  let error: string | null = null;
  let showDetails = false;

  // Fetch historical context from backend
  async function fetchContext() {
    if (!userId) {
      // New user - show empty state
      return;
    }

    loading = true;
    error = null;

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/experience/context?user_id=${userId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      context = await response.json();
    } catch (err) {
      console.error("Error fetching historical context:", err);
      error = "Unable to load historical insights. Using defaults.";

      // Graceful fallback: use mock data if backend is unavailable
      context = generateMockContext();
    } finally {
      loading = false;
    }
  }

  // Generate mock context for development
  function generateMockContext(): ExperienceContext {
    return {
      user_id: userId,
      total_projects: 12,
      favorite_languages: [
        {
          language_id: "python",
          language_name: "Python",
          times_selected: 8,
          times_viewed: 15,
          success_rate: 0.875,
          paired_with: ["typescript", "sql"],
        },
        {
          language_id: "typescript",
          language_name: "TypeScript",
          times_selected: 6,
          times_viewed: 12,
          success_rate: 0.833,
          paired_with: ["python", "svelte"],
        },
        {
          language_id: "rust",
          language_name: "Rust",
          times_selected: 3,
          times_viewed: 5,
          success_rate: 1.0,
          paired_with: ["sql"],
        },
      ],
      successful_stacks: [
        {
          stack_id: "nextjs",
          times_used: 4,
          success_rate: 0.75,
          avg_satisfaction: 4.5,
          avg_build_time: 180,
          common_issues: [],
        },
        {
          stack_id: "fastapi-ai",
          times_used: 3,
          success_rate: 1.0,
          avg_satisfaction: 5.0,
          avg_build_time: 120,
          common_issues: [],
        },
        {
          stack_id: "sveltekit",
          times_used: 2,
          success_rate: 0.5,
          avg_satisfaction: 3.5,
          avg_build_time: 240,
          common_issues: ["deployment issues"],
        },
      ],
      project_types: {
        web: 6,
        api: 3,
        ai_ml: 2,
        cli: 1,
      },
      overall_success_rate: 0.833,
      avg_project_complexity: 6.2,
      recent_patterns: {
        trending_up: ["rust", "svelte"],
        trending_down: [],
        new_explorations: ["go"],
        abandoned_projects: 1,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Get language icon/emoji
  function getLanguageIcon(languageId: string): string {
    const icons: Record<string, string> = {
      python: "🐍",
      typescript: "📘",
      javascript: "💛",
      rust: "🦀",
      go: "🐹",
      java: "☕",
      svelte: "🔥",
      react: "⚛️",
      vue: "💚",
    };
    return icons[languageId] || "📝";
  }

  // Format percentage
  function formatPercentage(rate: number): string {
    return `${Math.round(rate * 100)}%`;
  }

  // Get success rate color class
  function getSuccessColor(rate: number): string {
    if (rate >= 0.8) return "text-green-600";
    if (rate >= 0.6) return "text-yellow-600";
    return "text-red-600";
  }

  // Get satisfaction stars
  function getSatisfactionStars(rating: number): string {
    return "⭐".repeat(Math.round(rating));
  }

  onMount(() => {
    fetchContext();
  });

  // Reactive: refetch when userId changes
  $: if (userId) {
    fetchContext();
  }
</script>

<div class="historical-insights">
  {#if loading}
    <div class="loading-state">
      <div class="spinner" />
      <p>Loading your historical insights...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{error}</p>
    </div>
  {:else if !userId || !context || context.total_projects === 0}
    <div class="empty-state">
      <span class="icon">🌱</span>
      <h3>New Journey Begins!</h3>
      <p>
        This is your first project. We'll learn your preferences as you create
        more projects.
      </p>
    </div>
  {:else}
    <!-- Historical Insights Content -->
    <div class="insights-header">
      <div class="header-left">
        <span class="icon">📊</span>
        <h3>Your Historical Insights</h3>
      </div>
      <button
        class="toggle-details"
        on:click={() => (showDetails = !showDetails)}
        aria-label={showDetails ? "Hide details" : "Show details"}
      >
        {showDetails ? "▼" : "▶"}
        {showDetails ? "Hide" : "Show"} Details
      </button>
    </div>

    <!-- Summary Stats -->
    <div class="summary-stats">
      <div class="stat-card">
        <span class="stat-value">{context.total_projects}</span>
        <span class="stat-label">Projects</span>
      </div>
      <div class="stat-card">
        <span
          class="stat-value {getSuccessColor(context.overall_success_rate)}"
        >
          {formatPercentage(context.overall_success_rate)}
        </span>
        <span class="stat-label">Success Rate</span>
      </div>
      <div class="stat-card">
        <span class="stat-value"
          >{context.avg_project_complexity.toFixed(1)}/10</span
        >
        <span class="stat-label">Avg Complexity</span>
      </div>
    </div>

    <!-- Favorite Languages -->
    <div class="insight-section">
      <h4>🌟 Your Favorite Languages</h4>
      <div class="language-list">
        {#each context.favorite_languages.slice(0, 3) as lang}
          <div
            class="language-item"
            class:selected={selectedLanguages.includes(lang.language_id)}
          >
            <span class="lang-icon">{getLanguageIcon(lang.language_id)}</span>
            <div class="lang-info">
              <span class="lang-name">{lang.language_name}</span>
              <span class="lang-meta">
                {lang.times_selected} projects •
                <span class={getSuccessColor(lang.success_rate)}>
                  {formatPercentage(lang.success_rate)} success
                </span>
              </span>
              {#if lang.paired_with.length > 0}
                <span class="lang-pairs"
                  >Often with: {lang.paired_with.join(", ")}</span
                >
              {/if}
            </div>
            {#if selectedLanguages.includes(lang.language_id)}
              <span class="selected-badge">✓ Selected</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Successful Stacks -->
    <div class="insight-section">
      <h4>🎯 Your Most Successful Stacks</h4>
      <div class="stack-list">
        {#each context.successful_stacks.slice(0, 3) as stack}
          <div class="stack-item">
            <div class="stack-header">
              <span class="stack-name">{stack.stack_id}</span>
              <span class="stack-uses">{stack.times_used}x used</span>
            </div>
            <div class="stack-metrics">
              <span class={getSuccessColor(stack.success_rate)}>
                {formatPercentage(stack.success_rate)} success
              </span>
              <span>•</span>
              <span
                >{getSatisfactionStars(stack.avg_satisfaction)} satisfaction</span
              >
              <span>•</span>
              <span>{Math.round(stack.avg_build_time / 60)}min setup</span>
            </div>
            {#if stack.common_issues.length > 0}
              <div class="stack-issues">
                ⚠️ Known issues: {stack.common_issues.join(", ")}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Recent Patterns -->
    {#if showDetails && (context.recent_patterns.trending_up.length > 0 || context.recent_patterns.new_explorations.length > 0)}
      <div class="insight-section">
        <h4>📈 Recent Patterns</h4>
        {#if context.recent_patterns.trending_up.length > 0}
          <div class="pattern-item">
            <span class="pattern-icon">📈</span>
            <span class="pattern-text">
              Trending up: <strong
                >{context.recent_patterns.trending_up.join(", ")}</strong
              >
            </span>
          </div>
        {/if}
        {#if context.recent_patterns.new_explorations.length > 0}
          <div class="pattern-item">
            <span class="pattern-icon">🔍</span>
            <span class="pattern-text">
              New explorations: <strong
                >{context.recent_patterns.new_explorations.join(", ")}</strong
              >
            </span>
          </div>
        {/if}
        {#if context.recent_patterns.abandoned_projects > 0}
          <div class="pattern-item warning">
            <span class="pattern-icon">⚠️</span>
            <span class="pattern-text">
              {context.recent_patterns.abandoned_projects} abandoned project(s) recently
            </span>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Project Type Distribution -->
    {#if showDetails}
      <div class="insight-section">
        <h4>📦 Project Type Distribution</h4>
        <div class="type-distribution">
          {#each Object.entries(context.project_types).sort((a, b) => b[1] - a[1]) as [type, count]}
            <div class="type-bar">
              <span class="type-label">{type}</span>
              <div class="bar-container">
                <div
                  class="bar-fill"
                  class:highlight={type === projectType}
                  style="width: {(count / context.total_projects) * 100}%"
                />
              </div>
              <span class="type-count">{count}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Timestamp -->
    <div class="insights-footer">
      <small>Last updated: {new Date(context.timestamp).toLocaleString()}</small
      >
    </div>
  {/if}
</div>

<style>
  .historical-insights {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 20px;
    color: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  /* Loading/Error/Empty States */
  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 30px;
    text-align: center;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error-icon,
  .icon {
    font-size: 48px;
  }

  .empty-state h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }

  .empty-state p {
    margin: 0;
    opacity: 0.9;
  }

  /* Header */
  .insights-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .insights-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .toggle-details {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
  }

  .toggle-details:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* Summary Stats */
  .summary-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.15);
    padding: 16px;
    border-radius: 8px;
    text-align: center;
    backdrop-filter: blur(10px);
  }

  .stat-value {
    display: block;
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .stat-label {
    display: block;
    font-size: 12px;
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Insight Sections */
  .insight-section {
    margin-bottom: 20px;
  }

  .insight-section h4 {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 600;
  }

  /* Language List */
  .language-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .language-item {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.1);
    padding: 12px;
    border-radius: 8px;
    transition: background 0.2s;
  }

  .language-item.selected {
    background: rgba(255, 255, 255, 0.25);
    border: 2px solid rgba(255, 255, 255, 0.5);
  }

  .lang-icon {
    font-size: 24px;
  }

  .lang-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .lang-name {
    font-weight: 600;
    font-size: 14px;
  }

  .lang-meta,
  .lang-pairs {
    font-size: 12px;
    opacity: 0.9;
  }

  .selected-badge {
    background: rgba(255, 255, 255, 0.3);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }

  /* Stack List */
  .stack-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .stack-item {
    background: rgba(255, 255, 255, 0.1);
    padding: 12px;
    border-radius: 8px;
  }

  .stack-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .stack-name {
    font-weight: 600;
    font-size: 14px;
  }

  .stack-uses {
    font-size: 12px;
    opacity: 0.8;
  }

  .stack-metrics {
    display: flex;
    gap: 8px;
    font-size: 12px;
    opacity: 0.9;
  }

  .stack-issues {
    margin-top: 8px;
    padding: 8px;
    background: rgba(255, 193, 7, 0.2);
    border-radius: 4px;
    font-size: 12px;
  }

  /* Pattern Items */
  .pattern-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .pattern-item.warning {
    background: rgba(255, 193, 7, 0.2);
  }

  .pattern-icon {
    font-size: 20px;
  }

  /* Type Distribution */
  .type-distribution {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .type-bar {
    display: grid;
    grid-template-columns: 80px 1fr 40px;
    align-items: center;
    gap: 12px;
    font-size: 14px;
  }

  .type-label {
    text-transform: capitalize;
  }

  .bar-container {
    height: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: rgba(255, 255, 255, 0.4);
    transition: width 0.3s, background 0.3s;
  }

  .bar-fill.highlight {
    background: rgba(255, 255, 255, 0.7);
  }

  .type-count {
    text-align: right;
  }

  /* Footer */
  .insights-footer {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    text-align: center;
    opacity: 0.7;
  }

  /* Color utilities */
  .text-green-600 {
    color: #10b981;
  }

  .text-yellow-600 {
    color: #f59e0b;
  }

  .text-red-600 {
    color: #ef4444;
  }
</style>
