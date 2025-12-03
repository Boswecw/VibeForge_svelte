<script lang="ts">
	/**
	 * Input component with Forge design system styling
	 * Supports text, password, email, number, and search variants
	 */

	interface Props {
		type?: 'text' | 'password' | 'email' | 'number' | 'search';
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		readonly?: boolean;
		required?: boolean;
		maxlength?: number;
		name?: string;
		id?: string;
		autocomplete?: string | null; // Allow null for HTML autocomplete attribute
		oninput?: (event: Event & { currentTarget: HTMLInputElement }) => void;
		onchange?: (event: Event & { currentTarget: HTMLInputElement }) => void;
		onfocus?: (event: FocusEvent & { currentTarget: HTMLInputElement }) => void;
		onblur?: (event: FocusEvent & { currentTarget: HTMLInputElement }) => void;
		class?: string;
		error?: boolean;
		helperText?: string;
		label?: string;
	}

	let {
		type = 'text',
		value = '',
		placeholder = '',
		disabled = false,
		readonly = false,
		required = false,
		maxlength,
		name,
		id,
		autocomplete,
		oninput,
		onchange,
		onfocus,
		onblur,
		class: className = '',
		error = false,
		helperText,
		label
	}: Props = $props();

	// Generate unique ID if not provided
	let inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

	// Base input classes
	const baseClasses =
		'w-full px-4 py-2 bg-forge-gunmetal border rounded-lg text-slate-200 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed readonly:bg-forge-steel readonly:cursor-default';

	// State-based classes
	let stateClasses = error
		? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
		: 'border-slate-600 hover:border-slate-500 focus:border-forge-ember focus:ring-forge-ember/50';

	let computedClasses = `${baseClasses} ${stateClasses} ${className}`;
</script>

{#if label}
	<label for={inputId} class="block text-sm font-medium text-slate-300 mb-2">
		{label}
		{#if required}
			<span class="text-red-500 ml-1">*</span>
		{/if}
	</label>
{/if}

<input
	id={inputId}
	type={type}
	name={name}
	placeholder={placeholder}
	disabled={disabled}
	readonly={readonly}
	required={required}
	maxlength={maxlength}
	autocomplete={autocomplete as any}
	value={value}
	oninput={oninput}
	onchange={onchange}
	onfocus={onfocus}
	onblur={onblur}
	class={computedClasses}
/>

{#if helperText}
	<p class="mt-2 text-sm {error ? 'text-red-400' : 'text-slate-400'}">
		{helperText}
	</p>
{/if}
