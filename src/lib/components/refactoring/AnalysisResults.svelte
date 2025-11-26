<script lang="ts">
	import type { CodebaseAnalysis } from '$lib/refactoring/types/analysis';

	interface Props {
		analysis: CodebaseAnalysis;
	}

	let { analysis }: Props = $props();

	function getHealthColor(health: string) {
		switch (health) {
			case 'excellent':
				return '#10b981';
			case 'good':
				return '#3b82f6';
			case 'fair':
				return '#f59e0b';
			case 'poor':
				return '#ef4444';
			default:
				return '#6b7280';
		}
	}
</script>

<div class="analysis-results">
	<div class="summary-section">
		<h3>Analysis Summary</h3>

		<div class="summary-grid">
			<div class="summary-card health">
				<div class="card-header">
					<span class="label">Overall Health</span>
					<span class="value" style="color: {getHealthColor(analysis.summary.health)}">
						{analysis.summary.health.toUpperCase()}
					</span>
				</div>
				<div class="card-body">
					<div class="score">
						<div class="score-circle" style="--score: {analysis.summary.score}">
							<span class="score-text">{analysis.summary.score}</span>
						</div>
					</div>
				</div>
			</div>

			<div class="summary-card">
				<div class="card-header">
					<span class="label">Tech Stack</span>
				</div>
				<div class="card-body">
					<div class="tech-info">
						<div>
							<strong>Framework:</strong>
							{analysis.techStack.framework}
						</div>
						<div>
							<strong>Language:</strong>
							{analysis.techStack.language}
						</div>
						<div>
							<strong>State:</strong>
							{analysis.techStack.stateManagement}
						</div>
					</div>
				</div>
			</div>

			<div class="summary-card">
				<div class="card-header">
					<span class="label">Files</span>
				</div>
				<div class="card-body">
					<div class="stats">
						<div class="stat">
							<span class="stat-value">{analysis.structure.totalFiles}</span>
							<span class="stat-label">Total Files</span>
						</div>
						<div class="stat">
							<span class="stat-value">{analysis.structure.sourceFiles}</span>
							<span class="stat-label">Source</span>
						</div>
						<div class="stat">
							<span class="stat-value">{analysis.structure.testFiles}</span>
							<span class="stat-label">Tests</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="metrics-section">
		<h3>Code Metrics</h3>

		<div class="metrics-grid">
			<div class="metric-card">
				<h4>Test Coverage</h4>
				<div class="progress-bar">
					<div class="progress-fill" style="width: {analysis.metrics.testCoverage.lines}%"></div>
					<span class="progress-text">{analysis.metrics.testCoverage.lines}%</span>
				</div>
				<div class="metric-details">
					<div>
						<strong>{analysis.metrics.testCoverage.totalTests}</strong> tests
					</div>
					<div>
						<strong>{analysis.metrics.testCoverage.passingTests}</strong> passing
					</div>
					{#if analysis.metrics.testCoverage.failingTests > 0}
						<div class="error">
							<strong>{analysis.metrics.testCoverage.failingTests}</strong> failing
						</div>
					{/if}
				</div>
			</div>

			<div class="metric-card">
				<h4>Type Safety</h4>
				<div class="metric-stats">
					<div class="metric-row">
						<span>Typed Files:</span>
						<strong>
							{analysis.metrics.typeSafety.typedFiles}/{analysis.metrics.typeSafety.totalFiles}
						</strong>
					</div>
					<div class="metric-row">
						<span>Any Types:</span>
						<strong>{analysis.metrics.typeSafety.anyTypeCount}</strong>
					</div>
					<div class="metric-row">
						<span>Type Errors:</span>
						<strong class:error={analysis.metrics.typeSafety.typeErrorCount > 0}>
							{analysis.metrics.typeSafety.typeErrorCount}
						</strong>
					</div>
					<div class="metric-row">
						<span>Strict Mode:</span>
						<strong class:success={analysis.metrics.typeSafety.strictMode}>
							{analysis.metrics.typeSafety.strictMode ? 'Enabled' : 'Disabled'}
						</strong>
					</div>
				</div>
			</div>

			<div class="metric-card">
				<h4>Code Quality</h4>
				<div class="metric-stats">
					<div class="metric-row">
						<span>TODO Comments:</span>
						<strong>{analysis.metrics.quality.todoCount}</strong>
					</div>
					<div class="metric-row">
						<span>FIXME Comments:</span>
						<strong>{analysis.metrics.quality.fixmeCount}</strong>
					</div>
					<div class="metric-row">
						<span>Max Complexity:</span>
						<strong>{analysis.metrics.quality.maxComplexity}</strong>
					</div>
					<div class="metric-row">
						<span>Avg File Size:</span>
						<strong>{analysis.metrics.quality.avgFileSize} lines</strong>
					</div>
				</div>
			</div>

			<div class="metric-card">
				<h4>Codebase Size</h4>
				<div class="metric-stats">
					<div class="metric-row">
						<span>Total Lines:</span>
						<strong>{analysis.metrics.size.totalLines.toLocaleString()}</strong>
					</div>
					<div class="metric-row">
						<span>Code Lines:</span>
						<strong>{analysis.metrics.size.codeLines.toLocaleString()}</strong>
					</div>
					<div class="metric-row">
						<span>Comment Lines:</span>
						<strong>{analysis.metrics.size.commentLines.toLocaleString()}</strong>
					</div>
					<div class="metric-row">
						<span>Blank Lines:</span>
						<strong>{analysis.metrics.size.blankLines.toLocaleString()}</strong>
					</div>
				</div>
			</div>
		</div>
	</div>

	{#if analysis.issues.length > 0}
		<div class="issues-section">
			<h3>Detected Issues ({analysis.issues.length})</h3>

			<div class="issues-list">
				{#each analysis.issues as issue}
					<div class="issue-card" class:error={issue.severity === 'error'} class:warning={issue.severity === 'warning'}>
						<div class="issue-header">
							<span class="issue-severity">{issue.severity}</span>
							<span class="issue-category">{issue.category}</span>
						</div>
						<h5>{issue.title}</h5>
						<p>{issue.description}</p>
						{#if issue.suggestion}
							<div class="issue-suggestion">
								<strong>Suggestion:</strong>
								{issue.suggestion}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.analysis-results {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 2rem;
		border: 1px solid var(--border-color);
		margin-bottom: 2rem;
	}

	.summary-section,
	.metrics-section,
	.issues-section {
		margin-bottom: 2rem;
	}

	.summary-section h3,
	.metrics-section h3,
	.issues-section h3 {
		font-size: 1.25rem;
		margin-bottom: 1rem;
		color: var(--text-primary);
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.summary-card {
		background: var(--bg-primary);
		border-radius: 8px;
		padding: 1.5rem;
		border: 1px solid var(--border-color);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.value {
		font-size: 1.125rem;
		font-weight: 700;
	}

	.score {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.score-circle {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		background: conic-gradient(
			#667eea 0%,
			#667eea calc(var(--score) * 1%),
			var(--bg-secondary) calc(var(--score) * 1%),
			var(--bg-secondary) 100%
		);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.score-circle::before {
		content: '';
		position: absolute;
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: var(--bg-primary);
	}

	.score-text {
		position: relative;
		z-index: 1;
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.tech-info,
	.stats {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.stats {
		flex-direction: row;
		justify-content: space-around;
	}

	.stat {
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.stat-label {
		display: block;
		font-size: 0.75rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
	}

	.metric-card {
		background: var(--bg-primary);
		border-radius: 8px;
		padding: 1.5rem;
		border: 1px solid var(--border-color);
	}

	.metric-card h4 {
		font-size: 1rem;
		margin-bottom: 1rem;
		color: var(--text-primary);
	}

	.progress-bar {
		position: relative;
		height: 32px;
		background: var(--bg-secondary);
		border-radius: 16px;
		overflow: hidden;
		margin-bottom: 1rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
		transition: width 0.3s;
	}

	.progress-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-weight: 700;
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.metric-details,
	.metric-stats {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.metric-row {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border-color);
	}

	.metric-row:last-child {
		border-bottom: none;
	}

	.success {
		color: #10b981 !important;
	}

	.error {
		color: #ef4444 !important;
	}

	.issues-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.issue-card {
		background: var(--bg-primary);
		border-radius: 8px;
		padding: 1.5rem;
		border-left: 4px solid var(--border-color);
	}

	.issue-card.error {
		border-left-color: #ef4444;
		background: #fef2f2;
	}

	.issue-card.warning {
		border-left-color: #f59e0b;
		background: #fffbeb;
	}

	.issue-header {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.issue-severity,
	.issue-category {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.issue-severity {
		background: #ef4444;
		color: white;
	}

	.issue-card.warning .issue-severity {
		background: #f59e0b;
	}

	.issue-category {
		background: var(--bg-secondary);
		color: var(--text-secondary);
	}

	.issue-card h5 {
		font-size: 1rem;
		margin-bottom: 0.5rem;
	}

	.issue-card p {
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
	}

	.issue-suggestion {
		margin-top: 1rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.issue-suggestion strong {
		display: block;
		margin-bottom: 0.25rem;
	}
</style>
