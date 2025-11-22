<script lang="ts">
	/**
	 * Button component with Forge design system variants
	 * Supports primary, secondary, ghost, and icon-only variants
	 */

	interface Props {
		variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		onclick?: (event: MouseEvent) => void;
		children?: import('svelte').Snippet;
		class?: string;
	}

	const {
		variant = 'primary',
		size = 'md',
		disabled = false,
		type = 'button',
		onclick,
		children,
		class: className = ''
	}: Props = $props();

	// Base styles
	const baseClasses =
		'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forge-ember focus:ring-offset-2 focus:ring-offset-forge-blacksteel disabled:opacity-50 disabled:cursor-not-allowed';

	// Variant styles
	const variantClasses = {
		primary:
			'bg-forge-ember text-forge-blacksteel hover:bg-amber-500 active:bg-amber-600 shadow-sm hover:shadow-md',
		secondary:
			'bg-forge-steel text-slate-200 hover:bg-slate-600 active:bg-slate-700 border border-slate-600 hover:border-slate-500',
		ghost:
			'bg-transparent text-slate-300 hover:bg-forge-gunmetal active:bg-forge-steel hover:text-white',
		icon: 'bg-transparent text-slate-400 hover:bg-forge-gunmetal hover:text-white active:bg-forge-steel rounded-lg p-2'
	};

	// Size styles
	const sizeClasses = {
		sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
		md: 'px-4 py-2 text-base rounded-lg gap-2',
		lg: 'px-6 py-3 text-lg rounded-lg gap-2.5'
	};

	// Icon variant has fixed padding regardless of size
	const iconSizeClasses = {
		sm: 'p-1.5',
		md: 'p-2',
		lg: 'p-3'
	};

	const computedClasses = $derived(
		`${baseClasses} ${variantClasses[variant]} ${variant === 'icon' ? iconSizeClasses[size] : sizeClasses[size]} ${className}`
	);
</script>

<button {type} {disabled} onclick={onclick} class={computedClasses}>
	{#if children}
		{@render children()}
	{/if}
</button>
