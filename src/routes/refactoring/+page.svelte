<script lang="ts">
	import { refactoringStore } from '$lib/stores/refactoringStore.svelte';
	import WorkflowStepper from '$lib/components/refactoring/WorkflowStepper.svelte';
	import AnalyzeStep from '$lib/components/refactoring/AnalyzeStep.svelte';
	import PlanStep from '$lib/components/refactoring/PlanStep.svelte';
	import ExecuteStep from '$lib/components/refactoring/ExecuteStep.svelte';
	import CompleteStep from '$lib/components/refactoring/CompleteStep.svelte';

	const { currentStep } = $derived(refactoringStore);
</script>

<div class="refactoring-page">
	<header class="page-header">
		<h1>Automated Refactoring</h1>
		<p class="subtitle">
			Intelligent codebase analysis, planning, and execution with continuous learning
		</p>
	</header>

	<WorkflowStepper />

	<main class="workflow-content">
		{#if !currentStep}
			<div class="welcome">
				<h2>Welcome to Automated Refactoring</h2>
				<p>
					This system helps you systematically improve your codebase quality through automated
					analysis, intelligent planning, and guided execution.
				</p>

				<div class="features">
					<div class="feature">
						<h3>📊 Analysis</h3>
						<p>Comprehensive codebase scanning with metrics collection and issue detection</p>
					</div>

					<div class="feature">
						<h3>🎯 Planning</h3>
						<p>AI-powered task generation with dependency-aware phase organization</p>
					</div>

					<div class="feature">
						<h3>🚀 Execution</h3>
						<p>Guided refactoring with real-time progress tracking and quality gates</p>
					</div>

					<div class="feature">
						<h3>🧠 Learning</h3>
						<p>Continuous improvement through outcome analysis and estimation feedback</p>
					</div>
				</div>

				<button class="btn-primary" onclick={() => refactoringStore.startAnalysis()}>
					Start New Refactoring
				</button>
			</div>
		{:else if currentStep === 'analyze'}
			<AnalyzeStep />
		{:else if currentStep === 'plan'}
			<PlanStep />
		{:else if currentStep === 'execute'}
			<ExecuteStep />
		{:else if currentStep === 'complete'}
			<CompleteStep />
		{/if}
	</main>
</div>

<style>
	.refactoring-page {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}

	.page-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.page-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.subtitle {
		font-size: 1.125rem;
		color: var(--text-secondary);
	}

	.workflow-content {
		min-height: 400px;
	}

	.welcome {
		text-align: center;
		max-width: 800px;
		margin: 0 auto;
		padding: 3rem 0;
	}

	.welcome h2 {
		font-size: 2rem;
		margin-bottom: 1rem;
	}

	.welcome > p {
		font-size: 1.125rem;
		color: var(--text-secondary);
		margin-bottom: 3rem;
	}

	.features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.feature {
		padding: 2rem;
		border-radius: 12px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		transition: all 0.2s;
	}

	.feature:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
	}

	.feature h3 {
		font-size: 1.25rem;
		margin-bottom: 0.5rem;
	}

	.feature p {
		color: var(--text-secondary);
		font-size: 0.95rem;
	}

	.btn-primary {
		padding: 1rem 2rem;
		font-size: 1.125rem;
		font-weight: 600;
		color: white;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
	}

	.btn-primary:active {
		transform: translateY(0);
	}
</style>
