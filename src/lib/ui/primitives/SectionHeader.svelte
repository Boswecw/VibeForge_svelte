<script lang="ts">
	/**
	 * SectionHeader component - consistent section headers for panels and columns
	 * Supports title, description, and action slots
	 */

	interface Props {
		title: string;
		description?: string;
		level?: 1 | 2 | 3 | 4;
		divider?: boolean;
		class?: string;
	}

	const {
		title,
		description,
		level = 2,
		divider = false,
		class: className = ''
	}: Props = $props();

	// Heading size based on level
	const headingClasses = {
		1: 'text-2xl font-bold',
		2: 'text-xl font-semibold',
		3: 'text-lg font-semibold',
		4: 'text-base font-medium'
	};

	const headingClass = $derived(headingClasses[level]);
</script>

<div class="section-header {className}">
	<div
		class="flex items-center justify-between {divider
			? 'pb-3 mb-4 border-b border-slate-700'
			: 'mb-3'}"
	>
		<div class="flex-1">
			{#if level === 1}
				<h1 class="{headingClass} text-slate-100">
					{title}
				</h1>
			{:else if level === 2}
				<h2 class="{headingClass} text-slate-100">
					{title}
				</h2>
			{:else if level === 3}
				<h3 class="{headingClass} text-slate-100">
					{title}
				</h3>
			{:else}
				<h4 class="{headingClass} text-slate-100">
					{title}
				</h4>
			{/if}
			{#if description}
				<p class="mt-1 text-sm text-slate-400">{description}</p>
			{/if}
		</div>

		<div class="ml-4 flex items-center gap-2">
			<slot name="actions" />
		</div>
	</div>

	<slot />
</div>
