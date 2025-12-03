<script lang="ts">
	import { refactoringStore } from '$lib/stores/refactoringStore.svelte';
	import { RefactoringAutomation } from '$lib/refactoring';
	import AnalysisResults from './AnalysisResults.svelte';

	let refactoringState = $derived(refactoringStore.state);
	let isAnalyzing = $derived(refactoringStore.isAnalyzing);
	let analysis = $derived(refactoringStore.analysis);

	let projectPath = $state('');
	let automation: RefactoringAutomation | null = null;

	async function handleAnalyze() {
		if (!projectPath.trim()) {
			alert('Please enter a project path');
			return;
		}

		try {
			refactoringStore.startAnalysis();
			refactoringStore.setRepositoryPath(projectPath);

			automation = new RefactoringAutomation({
				repositoryPath: projectPath,
				enableLearning: refactoringState.enableLearning,
				createCheckpoints: refactoringState.createCheckpoints
			});

			// Store automation instance for later use
			refactoringStore.setAutomation(automation);

			const result = await automation.analyze(projectPath);
			refactoringStore.completeAnalysis(result);
		} catch (error) {
			refactoringStore.failAnalysis(error instanceof Error ? error.message : 'Analysis failed');
		}
	}

	function handleContinueToPlan() {
		refactoringStore.startPlanning();
	}
</script>

<div class="analyze-step">
	<div class="step-header">
		<h2>Step 1: Analyze Codebase</h2>
		<p class="step-description">
			Scan your codebase to collect metrics, detect patterns, and identify quality issues.
		</p>
	</div>

	{#if !analysis}
		<div class="input-section">
			<div class="form-group">
				<label for="project-path">Project Path</label>
				<input
					id="project-path"
					type="text"
					bind:value={projectPath}
					placeholder="/path/to/your/project"
					disabled={isAnalyzing}
				/>
				<p class="help-text">Enter the absolute path to your project directory</p>
			</div>

			<div class="settings">
				<h3>Analysis Settings</h3>

				<label class="checkbox">
					<input
						type="checkbox"
						checked={refactoringState.enableLearning}
						onchange={(e) => refactoringStore.setEnableLearning(e.currentTarget.checked)}
						disabled={isAnalyzing}
					/>
					<span>Enable continuous learning (NeuroForge integration)</span>
				</label>

				<label class="checkbox">
					<input
						type="checkbox"
						checked={refactoringState.createCheckpoints}
						onchange={(e) => refactoringStore.setCreateCheckpoints(e.currentTarget.checked)}
						disabled={isAnalyzing}
					/>
					<span>Create git checkpoints during execution</span>
				</label>
			</div>

			<div class="actions">
				<button class="btn-secondary" onclick={() => refactoringStore.reset()} disabled={isAnalyzing}>
					Cancel
				</button>

				<button class="btn-primary" onclick={handleAnalyze} disabled={isAnalyzing}>
					{isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
				</button>
			</div>

			{#if refactoringState.analyzeError}
				<div class="error-message">
					<strong>Error:</strong>
					{refactoringState.analyzeError}
				</div>
			{/if}
		</div>
	{:else}
		<AnalysisResults {analysis} />

		<div class="actions">
			<button class="btn-secondary" onclick={() => refactoringStore.resetToStep('analyze')}>
				Analyze Again
			</button>

			<button class="btn-primary" onclick={handleContinueToPlan}> Continue to Planning </button>
		</div>
	{/if}
</div>

<style>
	.analyze-step {
		max-width: 900px;
		margin: 0 auto;
	}

	.step-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.step-header h2 {
		font-size: 1.75rem;
		margin-bottom: 0.5rem;
	}

	.step-description {
		color: var(--text-secondary);
		font-size: 1rem;
	}

	.input-section {
		background: var(--bg-secondary);
		border-radius: 12px;
		padding: 2rem;
		border: 1px solid var(--border-color);
	}

	.form-group {
		margin-bottom: 2rem;
	}

	label {
		display: block;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
	}

	input[type='text'] {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 1rem;
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	input[type='text']:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	input[type='text']:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.help-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-top: 0.5rem;
	}

	.settings {
		margin-bottom: 2rem;
	}

	.settings h3 {
		font-size: 1.125rem;
		margin-bottom: 1rem;
	}

	.checkbox {
		display: flex;
		align-items: center;
		margin-bottom: 1rem;
		cursor: pointer;
	}

	.checkbox input {
		margin-right: 0.75rem;
		cursor: pointer;
	}

	.checkbox span {
		font-weight: 400;
		color: var(--text-primary);
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		font-weight: 600;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary {
		color: white;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.btn-secondary {
		color: var(--text-primary);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
	}

	.btn-secondary:hover:not(:disabled) {
		background: var(--bg-tertiary);
	}

	.btn-secondary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.error-message {
		margin-top: 1rem;
		padding: 1rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		color: #991b1b;
	}

	.error-message strong {
		display: block;
		margin-bottom: 0.25rem;
	}
</style>
