<script lang="ts">
	import { licenseStore } from '$lib/core/stores';

	let dismissed = $state(false);

	const show = $derived(
		!dismissed &&
			licenseStore.isTrial &&
			!licenseStore.trialExpired &&
			licenseStore.trialDaysRemaining <= 7
	);

	const daysRemaining = $derived(licenseStore.trialDaysRemaining);
	const quotaRemaining = $derived(licenseStore.orchestratorQuotaRemaining);

	const urgencyClass = $derived.by(() => {
		if (daysRemaining <= 1) return 'bg-red-500/20 border-red-500/30';
		if (daysRemaining <= 3) return 'bg-orange-500/20 border-orange-500/30';
		return 'bg-forge-ember/20 border-forge-ember/30';
	});

	function dismiss() {
		dismissed = true;
	}

	function upgrade() {
		window.open('https://vibeforge.dev/pricing', '_blank');
	}
</script>

{#if show}
	<div
		class="relative border-b {urgencyClass} px-4 py-3 backdrop-blur-sm transition-all"
		role="alert"
	>
		<div class="mx-auto flex max-w-6xl items-center justify-between gap-4">
			<!-- Message -->
			<div class="flex items-center gap-3">
				<span class="text-2xl">⏰</span>
				<div>
					<p class="font-semibold text-white">
						{#if daysRemaining === 0}
							Your trial expires today!
						{:else if daysRemaining === 1}
							1 day left in your trial
						{:else}
							{daysRemaining} days left in your trial
						{/if}
					</p>
					<p class="text-sm text-forge-steel">
						{#if quotaRemaining !== null}
							{quotaRemaining} orchestrator runs remaining this month
						{:else}
							Unlimited orchestrator runs
						{/if}
					</p>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex items-center gap-3">
				<button
					onclick={upgrade}
					class="rounded-lg bg-forge-ember px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-forge-ember/90"
				>
					Upgrade Now
				</button>
				<button
					onclick={dismiss}
					class="text-forge-steel transition-colors hover:text-white"
					aria-label="Dismiss"
				>
					<svg
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}
