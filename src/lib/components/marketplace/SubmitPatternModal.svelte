<script lang="ts">
/**
 * VF-312: Submit Pattern Modal
 *
 * Modal for submitting new patterns to the marketplace:
 * - Select pattern from local library
 * - Add submission notes
 * - Terms and conditions acceptance
 */

import type { PromptPattern } from '$lib/core/types';
import { patternsStore, marketplaceStore } from '$lib/core/stores';

interface Props {
	/** Callback when modal should close */
	onClose: () => void;
	/** Callback when pattern submitted successfully */
	onSubmitted?: (submissionId: string) => void;
}

let { onClose, onSubmitted }: Props = $props();

// Local state
let selectedPatternId = $state<string | null>(null);
let submissionNotes = $state('');
let agreeToTerms = $state(false);
let isSubmitting = $state(false);
let error = $state<string | null>(null);

// Get custom patterns (can't submit built-in patterns)
const customPatterns = $derived(patternsStore.customPatterns);
const selectedPattern = $derived(
	selectedPatternId
		? patternsStore.patterns.find((p) => p.id === selectedPatternId)
		: null
);

// Handle submit
async function handleSubmit() {
	if (!selectedPattern || !agreeToTerms) return;

	isSubmitting = true;
	error = null;

	try {
		const submission = await marketplaceStore.submitPattern(selectedPattern);
		onSubmitted?.(submission.id);
		onClose();
	} catch (err) {
		error = err instanceof Error ? err.message : 'Failed to submit pattern';
	} finally {
		isSubmitting = false;
	}
}
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
	<div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
		<div class="p-6">
			<!-- Header -->
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-2xl font-bold text-gray-800">Submit Pattern to Marketplace</h2>
				<button onclick={onClose} class="text-gray-400 hover:text-gray-600 text-2xl">
					×
				</button>
			</div>

			<!-- Error Display -->
			{#if error}
				<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded">
					<p class="text-red-700">{error}</p>
				</div>
			{/if}

			<!-- Pattern Selection -->
			<div class="mb-6">
				<label class="block text-sm font-medium text-gray-700 mb-2">
					Select Pattern <span class="text-red-500">*</span>
				</label>
				{#if customPatterns.length === 0}
					<div class="p-4 bg-yellow-50 border border-yellow-200 rounded text-center">
						<p class="text-yellow-700 text-sm">
							You don't have any custom patterns yet. Create a pattern in the Patterns Library first.
						</p>
					</div>
				{:else}
					<select
						bind:value={selectedPatternId}
						class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value={null}>Choose a pattern...</option>
						{#each customPatterns as pattern}
							<option value={pattern.id}>
								{pattern.name} ({pattern.category})
							</option>
						{/each}
					</select>
				{/if}
			</div>

			<!-- Pattern Preview -->
			{#if selectedPattern}
				<div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
					<h3 class="font-medium text-blue-800 mb-2">{selectedPattern.name}</h3>
					<p class="text-sm text-blue-700 mb-2">{selectedPattern.description}</p>
					<div class="flex items-center gap-4 text-xs text-blue-600">
						<span>Category: {selectedPattern.category}</span>
						<span>•</span>
						<span>Variables: {selectedPattern.variables.length}</span>
						<span>•</span>
						<span>Tags: {selectedPattern.tags.join(', ')}</span>
					</div>
				</div>
			{/if}

			<!-- Submission Notes -->
			<div class="mb-6">
				<label class="block text-sm font-medium text-gray-700 mb-2">
					Submission Notes (optional)
				</label>
				<textarea
					bind:value={submissionNotes}
					rows="4"
					placeholder="Add any notes for the reviewers (e.g., use cases, best practices)..."
					class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
				></textarea>
				<p class="text-xs text-gray-500 mt-1">{submissionNotes.length} / 500 characters</p>
			</div>

			<!-- Guidelines -->
			<div class="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
				<h3 class="font-medium text-gray-800 mb-2">📋 Submission Guidelines</h3>
				<ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
					<li>Pattern must be original or properly attributed</li>
					<li>Description should be clear and helpful</li>
					<li>Template should be well-tested</li>
					<li>Variables should have descriptive labels</li>
					<li>No inappropriate, spam, or malicious content</li>
					<li>Review typically takes 1-3 business days</li>
				</ul>
			</div>

			<!-- Terms Acceptance -->
			<div class="mb-6">
				<label class="flex items-start gap-2 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={agreeToTerms}
						class="mt-1 rounded"
					/>
					<span class="text-sm text-gray-700">
						I agree to the
						<button class="text-blue-600 hover:text-blue-700">Terms of Service</button>
						and
						<button class="text-blue-600 hover:text-blue-700">Community Guidelines</button>,
						and confirm that this pattern is original or properly attributed.
						<span class="text-red-500">*</span>
					</span>
				</label>
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-3">
				<button
					onclick={onClose}
					class="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
					disabled={isSubmitting}
				>
					Cancel
				</button>
				<button
					onclick={handleSubmit}
					disabled={!selectedPattern || !agreeToTerms || isSubmitting}
					class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSubmitting ? 'Submitting...' : 'Submit for Review'}
				</button>
			</div>
		</div>
	</div>
</div>
