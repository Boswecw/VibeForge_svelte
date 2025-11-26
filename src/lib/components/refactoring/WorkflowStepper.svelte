<script lang="ts">
	import { refactoringStore } from '$lib/stores/refactoringStore.svelte';

	const steps = [
		{ id: 'analyze', label: 'Analyze', icon: '📊' },
		{ id: 'plan', label: 'Plan', icon: '🎯' },
		{ id: 'execute', label: 'Execute', icon: '🚀' },
		{ id: 'complete', label: 'Complete', icon: '✅' }
	] as const;

	const { currentStep } = $derived(refactoringStore);

	function getStepStatus(stepId: string) {
		if (!currentStep) return 'pending';

		const currentIndex = steps.findIndex((s) => s.id === currentStep);
		const stepIndex = steps.findIndex((s) => s.id === stepId);

		if (stepIndex < currentIndex) return 'completed';
		if (stepIndex === currentIndex) return 'active';
		return 'pending';
	}
</script>

<div class="workflow-stepper">
	{#each steps as step, index}
		{@const status = getStepStatus(step.id)}

		<div class="step" class:active={status === 'active'} class:completed={status === 'completed'}>
			<div class="step-indicator">
				<div class="step-number">
					{#if status === 'completed'}
						<span class="checkmark">✓</span>
					{:else}
						{step.icon}
					{/if}
				</div>
			</div>

			<div class="step-content">
				<div class="step-label">{step.label}</div>
			</div>
		</div>

		{#if index < steps.length - 1}
			<div class="step-connector" class:active={getStepStatus(steps[index + 1].id) !== 'pending'}>
			</div>
		{/if}
	{/each}
</div>

<style>
	.workflow-stepper {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 3rem;
		padding: 2rem;
		background: var(--bg-secondary);
		border-radius: 12px;
		border: 1px solid var(--border-color);
	}

	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
	}

	.step-indicator {
		margin-bottom: 0.5rem;
	}

	.step-number {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 600;
		background: var(--bg-primary);
		border: 2px solid var(--border-color);
		color: var(--text-secondary);
		transition: all 0.3s;
	}

	.step.active .step-number {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-color: #667eea;
		color: white;
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
	}

	.step.completed .step-number {
		background: #10b981;
		border-color: #10b981;
		color: white;
	}

	.checkmark {
		font-weight: bold;
	}

	.step-content {
		text-align: center;
	}

	.step-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-secondary);
		transition: color 0.3s;
	}

	.step.active .step-label {
		color: #667eea;
	}

	.step.completed .step-label {
		color: #10b981;
	}

	.step-connector {
		flex: 1;
		min-width: 80px;
		height: 2px;
		background: var(--border-color);
		margin: 0 1rem;
		margin-bottom: 2.5rem;
		transition: background 0.3s;
	}

	.step-connector.active {
		background: linear-gradient(90deg, #10b981 0%, #667eea 100%);
	}

	@media (max-width: 768px) {
		.workflow-stepper {
			flex-direction: column;
			align-items: stretch;
		}

		.step {
			flex-direction: row;
			justify-content: flex-start;
			padding: 1rem;
		}

		.step-indicator {
			margin-bottom: 0;
			margin-right: 1rem;
		}

		.step-number {
			width: 48px;
			height: 48px;
			font-size: 1.25rem;
		}

		.step-content {
			text-align: left;
			flex: 1;
		}

		.step-connector {
			min-width: 0;
			width: 2px;
			height: 40px;
			margin: 0.5rem 0 0.5rem 1.5rem;
		}
	}
</style>
