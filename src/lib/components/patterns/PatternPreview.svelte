<script lang="ts">
/**
 * VF-310: Pattern Preview Component
 *
 * Preview a pattern with variable substitution:
 * - Form for entering variable values
 * - Live preview of rendered template
 * - Copy to clipboard
 * - Apply to prompt editor
 */

import type { PromptPattern } from '$lib/core/types';
import { substituteVariables } from '$lib/core/types';

interface Props {
	/** Pattern to preview */
	pattern: PromptPattern;
	/** Callback when "Apply to Prompt" clicked */
	onApply?: (renderedPrompt: string) => void;
	/** Callback when "Close" clicked */
	onClose?: () => void;
}

let { pattern, onApply, onClose }: Props = $props();

// Variable values (initialize with example values or defaults)
let variableValues = $state<Record<string, string>>({});

// Initialize variable values on mount
$effect(() => {
	const initialValues: Record<string, string> = {};
	for (const variable of pattern.variables) {
		initialValues[variable.name] =
			variable.exampleValue ||
			variable.defaultValue ||
			'';
	}
	variableValues = initialValues;
});

// Rendered template
const renderedTemplate = $derived.by(() => {
	try {
		return substituteVariables(pattern.template, variableValues);
	} catch (err) {
		return 'Error rendering template: ' + (err instanceof Error ? err.message : String(err));
	}
});

// Check if all required variables are filled
const allRequiredFilled = $derived.by(() => {
	return pattern.variables
		.filter((v) => v.required)
		.every((v) => variableValues[v.name]?.trim().length > 0);
});

// Copy to clipboard
async function copyToClipboard() {
	try {
		await navigator.clipboard.writeText(renderedTemplate);
		alert('Copied to clipboard!');
	} catch (err) {
		alert('Failed to copy to clipboard');
	}
}

// Apply to prompt editor
function handleApply() {
	if (!allRequiredFilled) {
		alert('Please fill in all required variables');
		return;
	}
	onApply?.(renderedTemplate);
}
</script>

<div class="pattern-preview bg-white border border-gray-200 rounded-lg shadow-xl max-w-6xl mx-auto">
	<!-- Header -->
	<div class="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
		<div class="flex items-start justify-between">
			<div>
				<h2 class="text-2xl font-bold text-gray-800 mb-2">
					Preview: {pattern.name}
				</h2>
				<p class="text-sm text-gray-600">{pattern.description}</p>
			</div>
			{#if onClose}
				<button
					onclick={onClose}
					class="text-gray-400 hover:text-gray-600 text-2xl"
					aria-label="Close"
				>
					×
				</button>
			{/if}
		</div>
	</div>

	<!-- Two-Column Layout -->
	<div class="grid grid-cols-2 divide-x divide-gray-200">
		<!-- Left: Variable Inputs -->
		<div class="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
			<h3 class="text-lg font-semibold text-gray-700 mb-4">
				Fill in Variables ({pattern.variables.length})
			</h3>

			{#if pattern.variables.length === 0}
				<p class="text-sm text-gray-500 italic">
					This pattern has no variables. The template will be used as-is.
				</p>
			{:else}
				{#each pattern.variables as variable}
					<div>
						<!-- Variable Label -->
						<label class="block text-sm font-medium text-gray-700 mb-2">
							{variable.label}
							{#if variable.required}
								<span class="text-red-500">*</span>
							{/if}
						</label>

						<!-- Variable Description -->
						{#if variable.description}
							<p class="text-xs text-gray-500 mb-2">{variable.description}</p>
						{/if}

						<!-- Input Field -->
						{#if variable.type === 'code'}
							<textarea
								bind:value={variableValues[variable.name]}
								placeholder={variable.placeholder || `Enter ${variable.name}...`}
								rows="6"
								class="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							></textarea>
						{:else if variable.type === 'boolean'}
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={variableValues[variable.name] === 'true'}
									onchange={(e) => variableValues[variable.name] = e.currentTarget.checked ? 'true' : 'false'}
									class="rounded"
								/>
								<span class="text-sm">{variable.label}</span>
							</label>
						{:else if variable.type === 'number'}
							<input
								type="number"
								bind:value={variableValues[variable.name]}
								placeholder={variable.placeholder || `Enter ${variable.name}...`}
								class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						{:else}
							<!-- String or other -->
							<textarea
								bind:value={variableValues[variable.name]}
								placeholder={variable.placeholder || `Enter ${variable.name}...`}
								rows="3"
								class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
							></textarea>
						{/if}

						<!-- Example Value Hint -->
						{#if variable.exampleValue}
							<p class="text-xs text-gray-400 mt-1">
								Example: <span class="font-mono">{variable.exampleValue}</span>
							</p>
						{/if}
					</div>
				{/each}

				<!-- Required Fields Notice -->
				{#if !allRequiredFilled}
					<div class="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
						⚠ Please fill in all required fields (marked with *)
					</div>
				{/if}
			{/if}
		</div>

		<!-- Right: Rendered Preview -->
		<div class="p-6 space-y-4 max-h-[60vh] overflow-y-auto bg-gray-50">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold text-gray-700">
					Rendered Template
				</h3>
				<button
					onclick={copyToClipboard}
					class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white"
					title="Copy to clipboard"
				>
					📋 Copy
				</button>
			</div>

			<!-- Preview Output -->
			<div class="p-4 bg-white border border-gray-200 rounded whitespace-pre-wrap text-sm font-mono text-gray-800 min-h-[200px]">
				{renderedTemplate}
			</div>

			<!-- Metadata -->
			<div class="space-y-2 text-xs text-gray-500">
				{#if pattern.recommendedModels && pattern.recommendedModels.length > 0}
					<div>
						<span class="font-medium">Recommended Models:</span>
						<div class="flex flex-wrap gap-1 mt-1">
							{#each pattern.recommendedModels as model}
								<span class="px-2 py-1 bg-green-100 text-green-700 rounded">{model}</span>
							{/each}
						</div>
					</div>
				{/if}

				{#if pattern.outputFormat}
					<div>
						<span class="font-medium">Expected Output:</span>
						<span class="ml-2">{pattern.outputFormat}</span>
					</div>
				{/if}

				<div>
					<span class="font-medium">Character Count:</span>
					<span class="ml-2">{renderedTemplate.length}</span>
				</div>

				<div>
					<span class="font-medium">Token Estimate:</span>
					<span class="ml-2">~{Math.ceil(renderedTemplate.length / 4)}</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Footer Actions -->
	<div class="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
		<div class="text-sm text-gray-500">
			{#if allRequiredFilled}
				<span class="text-green-600">✓ Ready to use</span>
			{:else}
				<span class="text-yellow-600">⚠ Fill required fields</span>
			{/if}
		</div>

		<div class="flex gap-3">
			{#if onClose}
				<button
					onclick={onClose}
					class="px-6 py-2 border border-gray-300 rounded hover:bg-white transition-colors"
				>
					Close
				</button>
			{/if}
			{#if onApply}
				<button
					onclick={handleApply}
					disabled={!allRequiredFilled}
					class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Apply to Prompt
				</button>
			{/if}
		</div>
	</div>
</div>
