<script lang="ts">
	import { licenseStore } from '$lib/core/stores';
	import { FeatureFlag } from '$lib/core/types';
	import UpgradePrompt from './UpgradePrompt.svelte';

	interface Props {
		/** Feature flag to check */
		feature: FeatureFlag;
		/** Content to show when feature is available */
		children: any;
		/** Custom message when feature is unavailable (optional) */
		fallbackMessage?: string;
		/** Show upgrade prompt instead of fallback (default: true) */
		showUpgradePrompt?: boolean;
	}

	let {
		feature,
		children,
		fallbackMessage,
		showUpgradePrompt = true
	}: Props = $props();

	// Check if feature is available
	const hasAccess = $derived(licenseStore.checkFeature(feature));
</script>

{#if hasAccess}
	<!-- Feature is available - render children -->
	{@render children()}
{:else if showUpgradePrompt}
	<!-- Show upgrade prompt -->
	<UpgradePrompt {feature} />
{:else if fallbackMessage}
	<!-- Show custom fallback message -->
	<div
		class="rounded-lg border border-forge-steel/30 bg-forge-gunmetal/50 p-6 text-center backdrop-blur-sm"
	>
		<div class="mb-2 text-xl">🔒</div>
		<p class="text-sm text-forge-steel">{fallbackMessage}</p>
	</div>
{/if}
