<script lang="ts">
  import { onMount } from 'svelte';
  import type { MLPredictionRequest } from '$lib/types/ml';
  import { predictProjectSuccess, assessProjectRisk } from '$lib/services/ml-client';
  import PredictionCard from './PredictionCard.svelte';
  import RiskAssessmentPanel from './RiskAssessmentPanel.svelte';

  interface Props {
    projectData: MLPredictionRequest['project_data'];
    teamData?: MLPredictionRequest['team_data'];
    autoLoad?: boolean;
  }

  let { projectData, teamData, autoLoad = false }: Props = $props();

  let predictionState = $state<{
    loading: boolean;
    data: any;
    error: string | null;
  }>({
    loading: false,
    data: null,
    error: null,
  });

  let assessmentState = $state<{
    loading: boolean;
    data: any;
    error: string | null;
  }>({
    loading: false,
    data: null,
    error: null,
  });

  let activeTab = $state<'prediction' | 'risk'>('prediction');

  async function loadPrediction() {
    predictionState.loading = true;
    predictionState.error = null;

    try {
      const request: MLPredictionRequest = {
        project_data: projectData,
        team_data: teamData,
      };

      const prediction = await predictProjectSuccess(request);
      predictionState.data = prediction;
    } catch (error) {
      predictionState.error = error instanceof Error ? error.message : 'Failed to load prediction';
    } finally {
      predictionState.loading = false;
    }
  }

  async function loadRiskAssessment() {
    assessmentState.loading = true;
    assessmentState.error = null;

    try {
      const request: MLPredictionRequest = {
        project_data: projectData,
        team_data: teamData,
      };

      const assessment = await assessProjectRisk(request);
      assessmentState.data = assessment;
    } catch (error) {
      assessmentState.error = error instanceof Error ? error.message : 'Failed to load risk assessment';
    } finally {
      assessmentState.loading = false;
    }
  }

  async function loadAllInsights() {
    await Promise.all([loadPrediction(), loadRiskAssessment()]);
  }

  onMount(() => {
    if (autoLoad) {
      loadAllInsights();
    }
  });
</script>

<div class="ml-insights">
  <div class="insights-header">
    <h2>ML-Powered Project Insights</h2>
    <button class="refresh-button" onclick={loadAllInsights} disabled={predictionState.loading || assessmentState.loading}>
      {predictionState.loading || assessmentState.loading ? 'Loading...' : 'Refresh Insights'}
    </button>
  </div>

  {#if !predictionState.data && !assessmentState.data && !predictionState.loading && !assessmentState.loading}
    <div class="empty-state">
      <p>No insights loaded yet.</p>
      <button class="load-button" onclick={loadAllInsights}>
        Load ML Insights
      </button>
    </div>
  {:else}
    <div class="insights-tabs">
      <button
        class="tab-button"
        class:active={activeTab === 'prediction'}
        onclick={() => activeTab = 'prediction'}
      >
        Success Prediction
      </button>
      <button
        class="tab-button"
        class:active={activeTab === 'risk'}
        onclick={() => activeTab = 'risk'}
      >
        Risk Assessment
      </button>
    </div>

    <div class="insights-content">
      {#if activeTab === 'prediction'}
        {#if predictionState.loading}
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Analyzing project success probability...</p>
          </div>
        {:else if predictionState.error}
          <div class="error-state">
            <p class="error-message">{predictionState.error}</p>
            <button onclick={loadPrediction}>Retry</button>
          </div>
        {:else if predictionState.data}
          <PredictionCard prediction={predictionState.data} />
        {/if}
      {:else if activeTab === 'risk'}
        {#if assessmentState.loading}
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Assessing project risks...</p>
          </div>
        {:else if assessmentState.error}
          <div class="error-state">
            <p class="error-message">{assessmentState.error}</p>
            <button onclick={loadRiskAssessment}>Retry</button>
          </div>
        {:else if assessmentState.data}
          <RiskAssessmentPanel assessment={assessmentState.data} />
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .ml-insights {
    background: var(--surface);
    border-radius: 8px;
    padding: 1.5rem;
  }

  .insights-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .insights-header h2 {
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
    transition: background 0.2s;
  }

  .load-button:hover {
    background: var(--accent-primary-hover);
  }

  .insights-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .tab-button {
    padding: 0.75rem 1.5rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-button:hover {
    color: var(--text-primary);
  }

  .tab-button.active {
    color: var(--accent-primary);
    border-bottom-color: var(--accent-primary);
  }

  .insights-content {
    min-height: 300px;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--surface-tertiary);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-state p {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .error-state {
    text-align: center;
    padding: 2rem 1rem;
    background: var(--surface-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
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
    font-size: 0.875rem;
    cursor: pointer;
  }

  .error-state button:hover {
    background: var(--accent-primary-hover);
  }
</style>
