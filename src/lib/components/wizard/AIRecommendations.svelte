<!-- @component
no description yet
-->
<script lang="ts">
  import type { StackRecommendation } from "$lib/services/recommendations";
  import { createEventDispatcher } from "svelte";

  export let recommendations: StackRecommendation[] = [];
  export let confidence: number = 0;
  export let summary: string = "";
  export let usedLLM: boolean = false;
  export let loading: boolean = false;

  const dispatch = createEventDispatcher<{
    selectStack: { stackId: string };
    explainStack: { stackName: string; stackId: string };
  }>();

  function handleSelectStack(stackId: string) {
    dispatch("selectStack", { stackId });
  }

  function handleExplainStack(stackName: string, stackId: string) {
    dispatch("explainStack", { stackName, stackId });
  }

  function getConfidenceColor(conf: number): string {
    if (conf >= 0.8) return "text-green-600";
    if (conf >= 0.6) return "text-yellow-600";
    return "text-orange-600";
  }

  function getConfidenceLabel(conf: number): string {
    if (conf >= 0.8) return "High Confidence";
    if (conf >= 0.6) return "Medium Confidence";
    return "Low Confidence";
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-orange-500";
  }
</script>

<div class="ai-recommendations">
  {#if loading}
    <div class="loading-state">
      <div class="spinner" />
      <p>Generating AI-powered recommendations...</p>
    </div>
  {:else if recommendations.length > 0}
    <div class="recommendations-header">
      <div class="header-title">
        <h3>🤖 AI-Powered Recommendations</h3>
        {#if usedLLM}
          <span class="llm-badge">Powered by AI</span>
        {:else}
          <span class="empirical-badge">Based on Data</span>
        {/if}
      </div>
      <div class="confidence-indicator {getConfidenceColor(confidence)}">
        <span class="confidence-value">{Math.round(confidence * 100)}%</span>
        <span class="confidence-label">{getConfidenceLabel(confidence)}</span>
      </div>
    </div>

    {#if summary}
      <div class="summary">
        <p>{summary}</p>
      </div>
    {/if}

    <div class="recommendations-list">
      {#each recommendations as rec, index (rec.stackId)}
        <div class="recommendation-card" class:top-pick={index === 0}>
          {#if index === 0}
            <div class="top-pick-badge">⭐ Top Pick</div>
          {/if}

          <div class="card-header">
            <div class="stack-info">
              <h4>{rec.stackName}</h4>
              <span class="source-badge {rec.source}">{rec.source}</span>
            </div>
            <div class="score-container">
              <div class="score-value">{Math.round(rec.score)}</div>
              <div class="score-label">Score</div>
            </div>
          </div>

          <div class="score-bar">
            <div
              class="score-fill {getScoreColor(rec.score)}"
              style="width: {rec.score}%"
            />
          </div>

          <div class="card-body">
            {#if rec.strengths.length > 0}
              <div class="strengths">
                <h5>✅ Strengths</h5>
                <ul>
                  {#each rec.strengths as strength}
                    <li>{strength}</li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if rec.concerns.length > 0}
              <div class="concerns">
                <h5>⚠️ Considerations</h5>
                <ul>
                  {#each rec.concerns as concern}
                    <li>{concern}</li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if rec.bestFor}
              <div class="best-for">
                <strong>Best for:</strong>
                {rec.bestFor}
              </div>
            {/if}

            {#if rec.reasoning && usedLLM}
              <div class="reasoning">
                <strong>Reasoning:</strong>
                {rec.reasoning}
              </div>
            {/if}
          </div>

          <div class="card-actions">
            <button
              class="btn-select"
              onclick={() => handleSelectStack(rec.stackId)}
            >
              Select This Stack
            </button>
            {#if usedLLM}
              <button
                class="btn-explain"
                onclick={() => handleExplainStack(rec.stackName, rec.stackId)}
              >
                Why? 🤔
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <p>
        No recommendations available. Select languages to see AI-powered stack
        suggestions.
      </p>
    </div>
  {/if}
</div>

<style>
  .ai-recommendations {
    margin: 2rem 0;
    padding: 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: white;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .recommendations-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    color: white;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .header-title h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .llm-badge,
  .empirical-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .llm-badge {
    background: rgba(255, 255, 255, 0.3);
    color: white;
  }

  .empirical-badge {
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
  }

  .confidence-indicator {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    background: rgba(255, 255, 255, 0.2);
    padding: 0.5rem 1rem;
    border-radius: 8px;
  }

  .confidence-value {
    font-size: 1.5rem;
    font-weight: 700;
  }

  .confidence-label {
    font-size: 0.75rem;
    opacity: 0.9;
  }

  .summary {
    background: rgba(255, 255, 255, 0.15);
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    color: white;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .recommendations-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .recommendation-card {
    background: white;
    border-radius: 10px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: relative;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .recommendation-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .recommendation-card.top-pick {
    border: 2px solid #fbbf24;
  }

  .top-pick-badge {
    position: absolute;
    top: -12px;
    right: 1rem;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .stack-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .stack-info h4 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
  }

  .source-badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .source-badge.llm {
    background: #dbeafe;
    color: #1e40af;
  }

  .source-badge.empirical {
    background: #fef3c7;
    color: #92400e;
  }

  .source-badge.hybrid {
    background: #e0e7ff;
    color: #4338ca;
  }

  .score-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    min-width: 70px;
  }

  .score-value {
    font-size: 1.75rem;
    font-weight: 800;
    line-height: 1;
  }

  .score-label {
    font-size: 0.7rem;
    opacity: 0.9;
    margin-top: 0.25rem;
  }

  .score-bar {
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 1rem;
  }

  .score-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .strengths,
  .concerns {
    padding: 0.75rem;
    border-radius: 6px;
  }

  .strengths {
    background: #f0fdf4;
    border-left: 4px solid #22c55e;
  }

  .concerns {
    background: #fffbeb;
    border-left: 4px solid #f59e0b;
  }

  .strengths h5,
  .concerns h5 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    font-weight: 700;
  }

  .strengths ul,
  .concerns ul {
    margin: 0;
    padding-left: 1.5rem;
    list-style: disc;
  }

  .strengths li,
  .concerns li {
    font-size: 0.875rem;
    line-height: 1.6;
    margin-bottom: 0.25rem;
  }

  .best-for,
  .reasoning {
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 6px;
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .best-for strong,
  .reasoning strong {
    color: #4b5563;
    display: block;
    margin-bottom: 0.25rem;
  }

  .card-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .btn-select,
  .btn-explain {
    flex: 1;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-select {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .btn-select:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .btn-explain {
    background: white;
    color: #667eea;
    border: 2px solid #667eea;
  }

  .btn-explain:hover {
    background: #f5f3ff;
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
  }

  @media (max-width: 768px) {
    .recommendations-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .confidence-indicator {
      align-self: flex-start;
    }

    .card-header {
      flex-direction: column;
      gap: 1rem;
    }

    .score-container {
      align-self: flex-start;
    }

    .card-actions {
      flex-direction: column;
    }
  }
</style>
