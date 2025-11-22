<script lang="ts">
	/**
	 * Panel component - reusable container with Forge design system styling
	 * Used for sections, cards, and column containers
	 */

	interface Props {
		variant?: 'default' | 'elevated' | 'bordered' | 'flush';
		padding?: 'none' | 'sm' | 'md' | 'lg';
		children?: import('svelte').Snippet;
		class?: string;
	}

	const {
		variant = 'default',
		padding = 'md',
		children,
		class: className = ''
	}: Props = $props();

	// Base panel styles
	const baseClasses = 'rounded-lg transition-all duration-200';

	// Variant styles
	const variantClasses = {
		default: 'bg-forge-gunmetal',
		elevated: 'bg-forge-gunmetal shadow-lg shadow-black/20',
		bordered: 'bg-forge-gunmetal border border-slate-700 hover:border-slate-600',
		flush: 'bg-transparent'
	};

	// Padding styles
	const paddingClasses = {
		none: 'p-0',
		sm: 'p-3',
		md: 'p-4',
		lg: 'p-6'
	};

	const computedClasses = $derived(
		`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`
	);
</script>

<div class={computedClasses}>
	{#if children}
		{@render children()}
	{/if}
</div>
