<script lang="ts">
  import type { RiskAssessmentResponse } from '$lib/types/ml';
  import { getRiskColor, getSeverityColor, formatProbability } from '$lib/types/ml';

  interface Props {
    assessment: RiskAssessmentResponse;
  }

  let { assessment }: Props = $props();

  const overallRiskPercentage = $derived(assessment.overall_risk_score * 100);
  const riskColorClass = $derived(getRiskColor(assessment.risk_level));

  // Group risk factors by category
  const riskByCategory = $derived(() => {
    const grouped = new Map<string, typeof assessment.risk_factors>();
    assessment.risk_factors.forEach(factor => {
      if (!grouped.has(factor.category)) {
        grouped.set(factor.category, []);
      }
      grouped.get(factor.category)!.push(factor);
    });
    return grouped;
  });

  const categoryColors: Record<string, string> = {
    technical: 'text-blue-600 dark:text-blue-400',
    team: 'text-purple-600 dark:text-purple-400',
    complexity: 'text-orange-600 dark:text-orange-400',
    infrastructure: 'text-green-600 dark:text-green-400',
  };
</script>

<div class="risk-assessment-panel">
  <div class="assessment-header">
    <h3>Risk Assessment</h3>
    <div class="overall-risk {riskColorClass}">
      {assessment.risk_level.toUpperCase()} RISK
    </div>
  </div>

  <!-- Overall Risk Score -->
  <div class="overall-score">
    <div class="score-label">Overall Risk Score</div>
    <div class="score-value">{(overallRiskPercentage).toFixed(1)}%</div>
    <div class="score-bar">
      <div
        class="score-fill {assessment.risk_level}"
        style="width: {overallRiskPercentage}%"
      ></div>
    </div>
    <div class="score-info">
      Success Probability: <strong>{formatProbability(assessment.success_probability)}</strong>
    </div>
  </div>

  <!-- Risk Factors by Category -->
  <div class="risk-categories">
    <h4>Risk Factors ({assessment.risk_factors.length})</h4>

    {#each [...riskByCategory()] as [category, factors]}
      <div class="category-section">
        <div class="category-header">
          <span class="category-name {categoryColors[category]}">
            {category.toUpperCase()}
          </span>
          <span class="category-count">{factors.length}</span>
        </div>

        <div class="factors-list">
          {#each factors as factor}
            <div class="risk-factor {factor.severity}">
              <div class="factor-header">
                <span class="severity-badge {getSeverityColor(factor.severity)}">
                  {factor.severity}
                </span>
                <span class="impact-score">
                  Impact: {(factor.impact_score * 100).toFixed(0)}%
                </span>
              </div>

              <div class="factor-description">
                {factor.description}
              </div>

              <div class="factor-mitigation">
                <strong>Mitigation:</strong> {factor.mitigation}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <!-- Recommendations -->
  {#if assessment.recommendations.length > 0}
    <div class="recommendations-section">
      <h4>Priority Recommendations</h4>
      <div class="recommendations-list">
        {#each assessment.recommendations as recommendation, index}
          <div class="recommendation-item">
            <span class="recommendation-number">{index + 1}</span>
            <span class="recommendation-text">{recommendation}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="assessment-footer">
    <span class="assessed-time">
      Assessed {new Date(assessment.assessed_at).toLocaleString()}
    </span>
  </div>
</div>

<style>
  .risk-assessment-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.5rem;
  }

  .assessment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .assessment-header h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .overall-risk {
    font-size: 0.875rem;
    font-weight: 700;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    background: var(--surface-secondary);
  }

  .overall-score {
    background: var(--surface-secondary);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .score-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .score-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.75rem;
  }

  .score-bar {
    height: 8px;
    background: var(--surface-tertiary);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.75rem;
  }

  .score-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  .score-fill.low {
    background: linear-gradient(90deg, #10b981, #34d399);
  }

  .score-fill.medium {
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
  }

  .score-fill.high {
    background: linear-gradient(90deg, #f97316, #fb923c);
  }

  .score-fill.critical {
    background: linear-gradient(90deg, #ef4444, #f87171);
  }

  .score-info {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .risk-categories {
    margin-bottom: 1.5rem;
  }

  .risk-categories h4 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 1rem;
  }

  .category-section {
    margin-bottom: 1.5rem;
  }

  .category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .category-name {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .category-count {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    background: var(--surface-tertiary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .factors-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .risk-factor {
    background: var(--surface-secondary);
    border-left: 3px solid var(--border);
    border-radius: 4px;
    padding: 1rem;
  }

  .risk-factor.critical {
    border-left-color: #ef4444;
  }

  .risk-factor.high {
    border-left-color: #f97316;
  }

  .risk-factor.medium {
    border-left-color: #f59e0b;
  }

  .risk-factor.low {
    border-left-color: #10b981;
  }

  .factor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .severity-badge {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .impact-score {
    font-size: 0.75rem;
    color: var(--text-tertiary);
  }

  .factor-description {
    font-size: 0.875rem;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .factor-mitigation {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    background: var(--surface-tertiary);
    padding: 0.5rem;
    border-radius: 4px;
    margin-top: 0.5rem;
  }

  .recommendations-section {
    background: var(--surface-secondary);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }

  .recommendations-section h4 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 1rem;
  }

  .recommendations-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .recommendation-item {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .recommendation-number {
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent-primary);
    color: white;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .recommendation-text {
    font-size: 0.875rem;
    color: var(--text-primary);
    line-height: 1.5;
  }

  .assessment-footer {
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }

  .assessed-time {
    font-size: 0.75rem;
    color: var(--text-tertiary);
  }
</style>
