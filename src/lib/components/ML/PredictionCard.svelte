<script lang="ts">
  import type { MLPredictionResponse } from '$lib/types/ml';
  import { formatProbability, formatConfidence, getRiskColor } from '$lib/types/ml';

  interface Props {
    prediction: MLPredictionResponse;
    compact?: boolean;
  }

  let { prediction, compact = false }: Props = $props();

  const successPercentage = $derived(prediction.success_probability * 100);
  const confidencePercentage = $derived(prediction.confidence * 100);
  const riskColorClass = $derived(getRiskColor(prediction.risk_level));
</script>

<div class="prediction-card" class:compact>
  <div class="prediction-header">
    <h3>Success Prediction</h3>
    <span class="model-version">Model v{prediction.model_version}</span>
  </div>

  <div class="prediction-body">
    <!-- Success Probability -->
    <div class="metric-card primary">
      <div class="metric-label">Success Probability</div>
      <div class="metric-value">{formatProbability(prediction.success_probability)}</div>
      <div class="metric-bar">
        <div
          class="metric-fill success"
          style="width: {successPercentage}%"
        ></div>
      </div>
    </div>

    <!-- Confidence -->
    <div class="metric-card secondary">
      <div class="metric-label">Confidence</div>
      <div class="metric-value">{formatConfidence(prediction.confidence)}</div>
      <div class="metric-bar">
        <div
          class="metric-fill confidence"
          style="width: {confidencePercentage}%"
        ></div>
      </div>
    </div>

    <!-- Risk Level -->
    <div class="metric-card">
      <div class="metric-label">Risk Level</div>
      <div class="metric-value risk {riskColorClass}">
        {prediction.risk_level.toUpperCase()}
      </div>
    </div>
  </div>

  {#if !compact && prediction.key_factors.length > 0}
    <div class="key-factors">
      <h4>Key Influencing Factors</h4>
      <div class="factors-list">
        {#each prediction.key_factors.slice(0, 5) as factor}
          <div class="factor-item">
            <span class="factor-name">{factor.name.replace(/_/g, ' ')}</span>
            <span class="factor-contribution">{(factor.contribution * 100).toFixed(1)}%</span>
            <div class="factor-bar">
              <div
                class="factor-fill"
                style="width: {(factor.contribution * 100).toFixed(1)}%"
              ></div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="prediction-footer">
    <span class="predicted-time">
      Predicted {new Date(prediction.predicted_at).toLocaleString()}
    </span>
  </div>
</div>

<style>
  .prediction-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.5rem;
  }

  .prediction-card.compact {
    padding: 1rem;
  }

  .prediction-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .prediction-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .model-version {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    background: var(--surface-tertiary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .prediction-body {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .metric-card {
    background: var(--surface-secondary);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 1rem;
  }

  .metric-card.primary {
    border-color: var(--accent-primary);
  }

  .metric-card.secondary {
    border-color: var(--accent-secondary);
  }

  .metric-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .metric-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.75rem;
  }

  .metric-value.risk {
    font-size: 1.25rem;
  }

  .metric-bar {
    height: 6px;
    background: var(--surface-tertiary);
    border-radius: 3px;
    overflow: hidden;
  }

  .metric-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
  }

  .metric-fill.success {
    background: linear-gradient(90deg, #10b981, #34d399);
  }

  .metric-fill.confidence {
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
  }

  .key-factors {
    margin-bottom: 1rem;
  }

  .key-factors h4 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.75rem;
  }

  .factors-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .factor-item {
    position: relative;
  }

  .factor-name {
    font-size: 0.875rem;
    color: var(--text-secondary);
    text-transform: capitalize;
    display: block;
    margin-bottom: 0.25rem;
  }

  .factor-contribution {
    position: absolute;
    right: 0;
    top: 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-tertiary);
  }

  .factor-bar {
    height: 4px;
    background: var(--surface-tertiary);
    border-radius: 2px;
    overflow: hidden;
  }

  .factor-fill {
    height: 100%;
    background: var(--accent-primary);
    border-radius: 2px;
    transition: width 0.5s ease;
  }

  .prediction-footer {
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }

  .predicted-time {
    font-size: 0.75rem;
    color: var(--text-tertiary);
  }
</style>
