<script lang="ts">
	/**
	 * Tag component - badges and labels with Forge design system styling
	 * Used for status indicators, categories, and metadata display
	 */

	interface Props {
		variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
		size?: 'sm' | 'md' | 'lg';
		removable?: boolean;
		onremove?: () => void;
		children?: import('svelte').Snippet;
		class?: string;
	}

	const {
		variant = 'default',
		size = 'md',
		removable = false,
		onremove,
		children,
		class: className = ''
	}: Props = $props();

	// Base tag styles
	const baseClasses =
		'inline-flex items-center font-medium rounded-md transition-all duration-200';

	// Variant styles
	const variantClasses = {
		default: 'bg-forge-steel text-slate-300 border border-slate-600',
		primary: 'bg-forge-ember/20 text-forge-ember border border-forge-ember/30',
		success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
		warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
		error: 'bg-red-500/20 text-red-400 border border-red-500/30',
		info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
	};

	// Size styles
	const sizeClasses = {
		sm: 'px-2 py-0.5 text-xs gap-1',
		md: 'px-2.5 py-1 text-sm gap-1.5',
		lg: 'px-3 py-1.5 text-base gap-2'
	};

	const computedClasses = $derived(
		`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
	);

	function handleRemove(event: MouseEvent) {
		event.stopPropagation();
		onremove?.();
	}
</script>

<span class={computedClasses}>
	{#if children}
		{@render children()}
	{/if}

	{#if removable}
		<button
			type="button"
			onclick={handleRemove}
			class="ml-1 hover:bg-black/20 rounded-full p-0.5 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-current"
			aria-label="Remove tag"
		>
			<svg
				class="w-3 h-3"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				></path>
			</svg>
		</button>
	{/if}
</span>
