<script lang="ts">
	import { licenseStore } from '$lib/core/stores';
	import { FeatureFlag } from '$lib/core/types';

	interface Props {
		/** Feature that triggered this prompt */
		feature: FeatureFlag;
	}

	let { feature }: Props = $props();

	let showTrialModal = $state(false);
	let isStartingTrial = $state(false);

	// Feature to tier mapping
	const featureToTier: Record<FeatureFlag, string> = {
		[FeatureFlag.WORKBENCH_BASIC]: 'Free',
		[FeatureFlag.WIZARD]: 'Free',
		[FeatureFlag.SCAFFOLDING]: 'Free',
		[FeatureFlag.CODE_ANALYSIS_BASIC]: 'Free',
		[FeatureFlag.LOCAL_HISTORY]: 'Free',
		[FeatureFlag.ORCHESTRATOR_MULTI_AI]: 'Trial / Pro',
		[FeatureFlag.EXECUTION_CLOUD]: 'Trial / Pro',
		[FeatureFlag.CLOUD_HISTORY]: 'Trial / Pro',
		[FeatureFlag.MODEL_COMPARISON]: 'Trial / Pro',
		[FeatureFlag.SMART_ROUTING]: 'Trial / Pro',
		[FeatureFlag.ADVANCED_ANALYTICS]: 'Trial / Pro',
		[FeatureFlag.TEAM_WORKSPACES]: 'Pro',
		[FeatureFlag.UNLIMITED_RUNS]: 'Pro',
		[FeatureFlag.PRIORITY_SUPPORT]: 'Pro',
		[FeatureFlag.CUSTOM_MODELS]: 'Pro',
		[FeatureFlag.SSO]: 'Enterprise',
		[FeatureFlag.AUDIT_LOGS]: 'Enterprise',
		[FeatureFlag.SLA]: 'Enterprise',
		[FeatureFlag.DEDICATED_SUPPORT]: 'Enterprise'
	};

	// Feature descriptions
	const featureDescriptions: Record<FeatureFlag, string> = {
		[FeatureFlag.WORKBENCH_BASIC]: 'Basic workbench functionality',
		[FeatureFlag.WIZARD]: 'Project creation wizard',
		[FeatureFlag.SCAFFOLDING]: 'Project scaffolding',
		[FeatureFlag.CODE_ANALYSIS_BASIC]: 'Basic code analysis',
		[FeatureFlag.LOCAL_HISTORY]: 'Local run history (500 runs)',
		[FeatureFlag.ORCHESTRATOR_MULTI_AI]:
			'Multi-AI Planning Orchestrator with ChatGPT ↔ Claude workflow',
		[FeatureFlag.EXECUTION_CLOUD]: 'Cloud-based execution',
		[FeatureFlag.CLOUD_HISTORY]: 'Cloud run history',
		[FeatureFlag.MODEL_COMPARISON]: 'Side-by-side model comparison',
		[FeatureFlag.SMART_ROUTING]: 'Intelligent model routing',
		[FeatureFlag.ADVANCED_ANALYTICS]: 'Advanced analytics and insights',
		[FeatureFlag.TEAM_WORKSPACES]: 'Collaborative team workspaces',
		[FeatureFlag.UNLIMITED_RUNS]: 'Unlimited orchestrator runs',
		[FeatureFlag.PRIORITY_SUPPORT]: 'Priority customer support',
		[FeatureFlag.CUSTOM_MODELS]: 'Custom model integration',
		[FeatureFlag.SSO]: 'Single Sign-On integration',
		[FeatureFlag.AUDIT_LOGS]: 'Comprehensive audit logging',
		[FeatureFlag.SLA]: 'Service Level Agreement',
		[FeatureFlag.DEDICATED_SUPPORT]: 'Dedicated support engineer'
	};

	const requiredTier = $derived(featureToTier[feature] || 'Pro');
	const description = $derived(featureDescriptions[feature] || 'Premium feature');

	async function startTrial() {
		isStartingTrial = true;
		try {
			licenseStore.beginTrial();
			showTrialModal = false;
		} catch (error) {
			console.error('Failed to start trial:', error);
		} finally {
			isStartingTrial = false;
		}
	}

	function closeModal() {
		showTrialModal = false;
	}
</script>

<div
	class="rounded-lg border border-forge-ember/30 bg-gradient-to-br from-forge-gunmetal/80 to-forge-blacksteel/80 p-8 backdrop-blur-sm"
>
	<!-- Icon -->
	<div class="mb-4 flex justify-center">
		<div
			class="flex h-16 w-16 items-center justify-center rounded-full bg-forge-ember/20 text-3xl"
		>
			🚀
		</div>
	</div>

	<!-- Title -->
	<h3 class="mb-2 text-center text-2xl font-bold text-white">Premium Feature</h3>

	<!-- Description -->
	<p class="mb-4 text-center text-forge-steel">
		{description}
	</p>

	<!-- Required Tier Badge -->
	<div class="mb-6 flex justify-center">
		<span
			class="rounded-full bg-forge-ember/20 px-4 py-1 text-sm font-medium text-forge-ember"
		>
			Requires: {requiredTier}
		</span>
	</div>

	<!-- CTA Buttons -->
	<div class="flex gap-3">
		{#if licenseStore.isFree && requiredTier.includes('Trial')}
			<!-- Show "Start Free Trial" for free users -->
			<button
				onclick={() => (showTrialModal = true)}
				class="flex-1 rounded-lg bg-forge-ember px-6 py-3 font-semibold text-white transition-colors hover:bg-forge-ember/90"
			>
				Start 14-Day Free Trial
			</button>
		{:else}
			<!-- Show "Upgrade" for trial users or Pro-only features -->
			<button
				onclick={() => window.open('https://vibeforge.dev/pricing', '_blank')}
				class="flex-1 rounded-lg bg-forge-ember px-6 py-3 font-semibold text-white transition-colors hover:bg-forge-ember/90"
			>
				Upgrade to {requiredTier}
			</button>
		{/if}

		<button
			onclick={() => window.open('https://vibeforge.dev/features', '_blank')}
			class="rounded-lg border border-forge-steel/30 px-6 py-3 font-medium text-forge-steel transition-colors hover:bg-forge-steel/10"
		>
			Learn More
		</button>
	</div>
</div>

<!-- Trial Modal -->
{#if showTrialModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
		onclick={closeModal}
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
		role="button"
		tabindex="0"
	>
		<div
			class="w-full max-w-md rounded-xl border border-forge-steel/30 bg-forge-blacksteel p-8 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="-1"
		>
			<!-- Header -->
			<div class="mb-6 text-center">
				<div class="mb-2 text-4xl">✨</div>
				<h2 class="mb-2 text-2xl font-bold text-white">Start Your Free Trial</h2>
				<p class="text-forge-steel">Get full access to Cortex for 14 days</p>
			</div>

			<!-- Benefits -->
			<div class="mb-6 space-y-3">
				<div class="flex items-start gap-3">
					<span class="text-forge-ember">✓</span>
					<p class="text-sm text-white">Multi-AI Planning Orchestrator (20 runs/month)</p>
				</div>
				<div class="flex items-start gap-3">
					<span class="text-forge-ember">✓</span>
					<p class="text-sm text-white">Cloud execution with 100 run history</p>
				</div>
				<div class="flex items-start gap-3">
					<span class="text-forge-ember">✓</span>
					<p class="text-sm text-white">Model comparison and analytics</p>
				</div>
				<div class="flex items-start gap-3">
					<span class="text-forge-ember">✓</span>
					<p class="text-sm text-white">Smart routing across 4 LLM providers</p>
				</div>
			</div>

			<!-- Fine Print -->
			<p class="mb-6 text-center text-xs text-forge-steel">
				No credit card required • Cancel anytime • Automatically reverts to free tier
			</p>

			<!-- Actions -->
			<div class="flex gap-3">
				<button
					onclick={closeModal}
					disabled={isStartingTrial}
					class="flex-1 rounded-lg border border-forge-steel/30 px-6 py-3 font-medium text-forge-steel transition-colors hover:bg-forge-steel/10 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					onclick={startTrial}
					disabled={isStartingTrial}
					class="flex-1 rounded-lg bg-forge-ember px-6 py-3 font-semibold text-white transition-colors hover:bg-forge-ember/90 disabled:opacity-50"
				>
					{isStartingTrial ? 'Starting...' : 'Start Free Trial'}
				</button>
			</div>
		</div>
	</div>
{/if}
