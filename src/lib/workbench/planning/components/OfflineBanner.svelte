<!--
  Offline Banner Component
  Displays a warning when the user is offline, preventing planning sessions
-->
<script lang="ts">
	// ========================================================================
	// STATE
	// ========================================================================

	let isOnline = $state(typeof navigator !== 'undefined' ? navigator.onLine : true);

	// ========================================================================
	// LIFECYCLE
	// ========================================================================

	$effect(() => {
		if (typeof window === 'undefined') return;

		function handleOnline() {
			isOnline = true;
		}

		function handleOffline() {
			isOnline = false;
		}

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	});
</script>

<!-- ======================================================================== -->
<!-- TEMPLATE -->
<!-- ======================================================================== -->

{#if !isOnline}
	<div class="offline-banner">
		<div class="banner-content">
			<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
				></path>
			</svg>
			<div class="banner-text">
				<strong>You are offline</strong>
				<span>Planning sessions require an internet connection. Please check your network.</span>
			</div>
		</div>
	</div>
{/if}

<!-- ======================================================================== -->
<!-- STYLES -->
<!-- ======================================================================== -->

<style>
	.offline-banner {
		background: linear-gradient(
			135deg,
			var(--color-warning, #ff9800) 0%,
			var(--color-warning-dark, #f57c00) 100%
		);
		border: 1px solid var(--color-warning-border, #ffa726);
		border-radius: 8px;
		padding: 1rem 1.25rem;
		margin-bottom: 1rem;
		animation: slideDown 0.3s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.banner-content {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.icon {
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
		color: white;
	}

	.banner-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		color: white;
	}

	.banner-text strong {
		font-weight: 600;
		font-size: 0.9375rem;
	}

	.banner-text span {
		font-size: 0.8125rem;
		opacity: 0.95;
	}
</style>
