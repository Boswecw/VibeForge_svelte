<!-- @component
no description yet
-->
<script lang="ts">
  import { onMount } from "svelte";

  // Props
  export let userId: number | null = null;
  export let projectType: string = "";
  export let selectedLanguages: string[] = [];
  export let stackId: string = "";

  // Recommendation interface
  interface Recommendation {
    stack_id: string;
    stack_name: string;
    confidence: number;
    reasoning: string[];
    based_on: {
      user_experience: boolean;
      language_match: boolean;
      project_type_match: boolean;
      global_success: boolean;
    };
    metrics: {
      user_success_rate?: number;
      global_success_rate: number;
      user_times_used?: number;
      avg_satisfaction?: number;
    };
  }

  // State
  let loading = false;
  let recommendations: Recommendation[] = [];
  let error: string | null = null;
  let showReasoningFor: string | null = null;

  // Fetch adaptive recommendations
  async function fetchRecommendations() {
    if (selectedLanguages.length === 0) {
      recommendations = [];
      return;
    }

    loading = true;
    error = null;

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/stacks/recommend-adaptive`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            project_type: projectType,
            selected_languages: selectedLanguages,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      recommendations = await response.json();
    } catch (err) {
      console.error("Error fetching adaptive recommendations:", err);
      error = "Unable to load personalized recommendations. Using defaults.";

      // Graceful fallback: use mock data if backend is unavailable
      recommendations = generateMockRecommendations();
    } finally {
      loading = false;
    }
  }

  // Generate mock recommendations
  function generateMockRecommendations(): Recommendation[] {
    const allRecommendations = [
      {
        stack_id: "fastapi-ai",
        stack_name: "FastAPI AI Stack",
        confidence: 0.92,
        reasoning: [
          "You have 100% success rate with this stack (3 projects)",
          "Perfect match for Python which you frequently use",
          "Strong global success rate (87%) for AI projects",
          "Average setup time is fast (2 hours)",
        ],
        based_on: {
          user_experience: true,
          language_match: true,
          project_type_match: true,
          global_success: true,
        },
        metrics: {
          user_success_rate: 1.0,
          global_success_rate: 0.87,
          user_times_used: 3,
          avg_satisfaction: 5.0,
        },
      },
      {
        stack_id: "nextjs",
        stack_name: "Next.js Fullstack",
        confidence: 0.78,
        reasoning: [
          "You have 75% success rate with this stack (4 projects)",
          "Matches your TypeScript preference",
          "Popular choice for web projects (89% global success)",
          "You rated it 4.5/5 stars on average",
        ],
        based_on: {
          user_experience: true,
          language_match: true,
          project_type_match: true,
          global_success: true,
        },
        metrics: {
          user_success_rate: 0.75,
          global_success_rate: 0.89,
          user_times_used: 4,
          avg_satisfaction: 4.5,
        },
      },
      {
        stack_id: "t3-stack",
        stack_name: "T3 Stack",
        confidence: 0.65,
        reasoning: [
          "No personal history, but highly rated globally (91% success)",
          "Perfect match for TypeScript which you use often",
          "Similar to Next.js which you know well",
          "Recommended for modern web applications",
        ],
        based_on: {
          user_experience: false,
          language_match: true,
          project_type_match: true,
          global_success: true,
        },
        metrics: {
          global_success_rate: 0.91,
          avg_satisfaction: 4.8,
        },
      },
    ];

    // Filter based on selected languages
    return allRecommendations.filter((rec) => {
      if (selectedLanguages.includes("python") && rec.stack_id === "fastapi-ai")
        return true;
      if (
        selectedLanguages.includes("typescript") &&
        ["nextjs", "t3-stack"].includes(rec.stack_id)
      )
        return true;
      return false;
    });
  }

  // Get confidence level label
  function getConfidenceLevel(confidence: number): {
    label: string;
    color: string;
  } {
    if (confidence >= 0.85) return { label: "Very High", color: "#10b981" };
    if (confidence >= 0.7) return { label: "High", color: "#3b82f6" };
    if (confidence >= 0.55) return { label: "Medium", color: "#f59e0b" };
    return { label: "Low", color: "#ef4444" };
  }

  // Format percentage
  function formatPercentage(rate: number): string {
    return `${Math.round(rate * 100)}%`;
  }

  // Toggle reasoning visibility
  function toggleReasoning(stackId: string) {
    showReasoningFor = showReasoningFor === stackId ? null : stackId;
  }

  onMount(() => {
    fetchRecommendations();
  });

  // Reactive: refetch when inputs change
  $: if (selectedLanguages.length > 0 || projectType) {
    fetchRecommendations();
  }
</script>

<div class="adaptive-recommendations">
  {#if loading}
    <div class="loading-state">
      <div class="spinner" />
      <p>Analyzing your history for personalized recommendations...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{error}</p>
    </div>
  {:else if selectedLanguages.length === 0}
    <div class="empty-state">
      <span class="icon">🎯</span>
      <p>Select languages to see personalized stack recommendations</p>
    </div>
  {:else if recommendations.length === 0}
    <div class="empty-state">
      <span class="icon">🔍</span>
      <p>No recommendations found for selected languages</p>
    </div>
  {:else}
    <!-- Recommendations Header -->
    <div class="recommendations-header">
      <span class="icon">🎯</span>
      <h3>Personalized Recommendations</h3>
      <span class="badge"
        >{recommendations.length} match{recommendations.length !== 1
          ? "es"
          : ""}</span
      >
    </div>

    <!-- Recommendations List -->
    <div class="recommendations-list">
      {#each recommendations as rec (rec.stack_id)}
        <div
          class="recommendation-card"
          class:selected={stackId === rec.stack_id}
        >
          <!-- Card Header -->
          <div class="card-header">
            <div class="header-left">
              <h4>{rec.stack_name}</h4>
              {#if rec.based_on.user_experience}
                <span class="badge-personal">👤 Personal Experience</span>
              {/if}
            </div>
            <div
              class="confidence-badge"
              style="background-color: {getConfidenceLevel(rec.confidence)
                .color}"
            >
              {getConfidenceLevel(rec.confidence).label} Confidence
            </div>
          </div>

          <!-- Confidence Bar -->
          <div class="confidence-bar-container">
            <div
              class="confidence-bar"
              style="width: {rec.confidence *
                100}%; background-color: {getConfidenceLevel(rec.confidence)
                .color}"
            />
            <span class="confidence-percentage"
              >{Math.round(rec.confidence * 100)}%</span
            >
          </div>

          <!-- Metrics -->
          <div class="metrics-grid">
            {#if rec.metrics.user_success_rate !== undefined}
              <div class="metric">
                <span class="metric-label">Your Success Rate</span>
                <span class="metric-value success"
                  >{formatPercentage(rec.metrics.user_success_rate)}</span
                >
              </div>
            {/if}
            <div class="metric">
              <span class="metric-label">Global Success Rate</span>
              <span class="metric-value"
                >{formatPercentage(rec.metrics.global_success_rate)}</span
              >
            </div>
            {#if rec.metrics.user_times_used !== undefined}
              <div class="metric">
                <span class="metric-label">Times Used</span>
                <span class="metric-value">{rec.metrics.user_times_used}x</span>
              </div>
            {/if}
            {#if rec.metrics.avg_satisfaction !== undefined}
              <div class="metric">
                <span class="metric-label">Satisfaction</span>
                <span class="metric-value"
                  >{"⭐".repeat(Math.round(rec.metrics.avg_satisfaction))}</span
                >
              </div>
            {/if}
          </div>

          <!-- Based On Indicators -->
          <div class="based-on-indicators">
            <span class="label">Based on:</span>
            {#if rec.based_on.user_experience}
              <span class="indicator active">👤 Your History</span>
            {/if}
            {#if rec.based_on.language_match}
              <span class="indicator active">🔤 Language Match</span>
            {/if}
            {#if rec.based_on.project_type_match}
              <span class="indicator active">📦 Project Type</span>
            {/if}
            {#if rec.based_on.global_success}
              <span class="indicator active">🌍 Community Data</span>
            {/if}
          </div>

          <!-- Reasoning Toggle -->
          <button
            class="reasoning-toggle"
            on:click={() => toggleReasoning(rec.stack_id)}
            aria-label={showReasoningFor === rec.stack_id
              ? "Hide reasoning"
              : "Show reasoning"}
          >
            {showReasoningFor === rec.stack_id ? "▼" : "▶"} Why this recommendation?
          </button>

          <!-- Reasoning Details -->
          {#if showReasoningFor === rec.stack_id}
            <div class="reasoning-details">
              <h5>Reasoning:</h5>
              <ul>
                {#each rec.reasoning as reason}
                  <li>{reason}</li>
                {/each}
              </ul>
            </div>
          {/if}

          <!-- Selected Badge -->
          {#if stackId === rec.stack_id}
            <div class="selected-badge">✓ Currently Selected</div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Footer Note -->
    <div class="recommendations-footer">
      <small>
        💡 Recommendations improve as you complete more projects and provide
        feedback
      </small>
    </div>
  {/if}
</div>

<style>
  .adaptive-recommendations {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  /* Loading/Error/Empty States */
  .loading-state,
  .error-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px;
    text-align: center;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top-color: #667eea;
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

  .empty-state p,
  .loading-state p {
    margin: 0;
    color: #6b7280;
  }

  /* Header */
  .recommendations-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 2px solid #e5e7eb;
  }

  .recommendations-header h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    flex: 1;
  }

  .recommendations-header .badge {
    background: #667eea;
    color: white;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
  }

  /* Recommendations List */
  .recommendations-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Recommendation Card */
  .recommendation-card {
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s;
    position: relative;
  }

  .recommendation-card:hover {
    border-color: #667eea;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  }

  .recommendation-card.selected {
    border-color: #10b981;
    background: #f0fdf4;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
  }

  /* Card Header */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .card-header h4 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
  }

  .badge-personal {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
  }

  .confidence-badge {
    padding: 8px 16px;
    border-radius: 20px;
    color: white;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Confidence Bar */
  .confidence-bar-container {
    position: relative;
    height: 32px;
    background: #f3f4f6;
    border-radius: 16px;
    margin-bottom: 16px;
    overflow: hidden;
  }

  .confidence-bar {
    height: 100%;
    border-radius: 16px;
    transition: width 0.5s ease-out;
  }

  .confidence-percentage {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-weight: 700;
    font-size: 14px;
    color: #1f2937;
  }

  /* Metrics Grid */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .metric {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .metric-label {
    font-size: 12px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .metric-value {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
  }

  .metric-value.success {
    color: #10b981;
  }

  /* Based On Indicators */
  .based-on-indicators {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .based-on-indicators .label {
    font-size: 13px;
    color: #6b7280;
    font-weight: 600;
  }

  .indicator {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    background: #e5e7eb;
    color: #6b7280;
  }

  .indicator.active {
    background: #ddd6fe;
    color: #5b21b6;
    font-weight: 600;
  }

  /* Reasoning Toggle */
  .reasoning-toggle {
    width: 100%;
    padding: 10px;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    color: #667eea;
    transition: all 0.2s;
    text-align: left;
  }

  .reasoning-toggle:hover {
    background: #e5e7eb;
    border-color: #667eea;
  }

  /* Reasoning Details */
  .reasoning-details {
    margin-top: 12px;
    padding: 16px;
    background: #f9fafb;
    border-left: 4px solid #667eea;
    border-radius: 8px;
  }

  .reasoning-details h5 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 700;
    color: #1f2937;
  }

  .reasoning-details ul {
    margin: 0;
    padding-left: 20px;
    list-style: none;
  }

  .reasoning-details li {
    margin-bottom: 8px;
    font-size: 14px;
    color: #4b5563;
    position: relative;
  }

  .reasoning-details li::before {
    content: "✓";
    position: absolute;
    left: -20px;
    color: #10b981;
    font-weight: 700;
  }

  /* Selected Badge */
  .selected-badge {
    position: absolute;
    top: -12px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  }

  /* Footer */
  .recommendations-footer {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
  }

  .recommendations-footer small {
    color: #6b7280;
    font-size: 13px;
  }
</style>
