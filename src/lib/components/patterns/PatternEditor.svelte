<script lang="ts">
/**
 * VF-310: Pattern Editor Component
 *
 * Form for creating and editing prompt patterns:
 * - Pattern metadata (name, description, category, tags)
 * - Template editor with variable highlighting
 * - Variable auto-extraction and configuration
 * - Pattern validation
 * - Save/cancel actions
 */

import type { PromptPattern, PatternCategory, TemplateVariable } from '$lib/core/types';
import { patternsStore } from '$lib/core/stores';
import { extractVariables, validatePattern } from '$lib/core/types';

interface Props {
	/** Pattern being edited (null for new pattern) */
	pattern?: PromptPattern | null;
	/** Callback when pattern saved */
	onSave?: (pattern: PromptPattern) => void;
	/** Callback when editing cancelled */
	onCancel?: () => void;
}

let { pattern = null, onSave, onCancel }: Props = $props();

// Get editing pattern from store if not provided
const editingPattern = $derived(pattern || patternsStore.editingPattern);

// Local state for form fields
let name = $state(editingPattern?.name || '');
let description = $state(editingPattern?.description || '');
let template = $state(editingPattern?.template || '');
let category = $state<PatternCategory>(editingPattern?.category || 'coding');
let tags = $state<string[]>(editingPattern?.tags || []);
let variables = $state<TemplateVariable[]>(editingPattern?.variables || []);
let outputFormat = $state<string>(editingPattern?.outputFormat || 'markdown');
let recommendedModels = $state<string[]>(editingPattern?.recommendedModels || []);
let isPublic = $state(editingPattern?.isPublic || false);

// New tag input
let newTag = $state('');
let newModel = $state('');

// Validation errors
let errors = $state<string[]>([]);

// Extract variables from template when template changes
$effect(() => {
	if (template) {
		const extractedVars = extractVariables(template);

		// Add new variables that don't exist yet
		for (const varName of extractedVars) {
			if (!variables.find((v) => v.name === varName)) {
				variables = [
					...variables,
					{
						name: varName,
						label: varName.charAt(0).toUpperCase() + varName.slice(1),
						description: '',
						type: 'string',
						required: true,
						placeholder: `Enter ${varName}...`,
						exampleValue: ''
					}
				];
			}
		}

		// Remove variables that are no longer in template
		variables = variables.filter((v) => extractedVars.includes(v.name));
	}
});

// Handle add tag
function handleAddTag() {
	if (newTag.trim() && !tags.includes(newTag.trim())) {
		tags = [...tags, newTag.trim()];
		newTag = '';
	}
}

// Handle remove tag
function handleRemoveTag(tag: string) {
	tags = tags.filter((t) => t !== tag);
}

// Handle add model
function handleAddModel() {
	if (newModel.trim() && !recommendedModels.includes(newModel.trim())) {
		recommendedModels = [...recommendedModels, newModel.trim()];
		newModel = '';
	}
}

// Handle remove model
function handleRemoveModel(model: string) {
	recommendedModels = recommendedModels.filter((m) => m !== model);
}

// Handle update variable
function handleUpdateVariable(index: number, field: keyof TemplateVariable, value: any) {
	variables = variables.map((v, i) =>
		i === index ? { ...v, [field]: value } : v
	);
}

// Handle save
function handleSave() {
	// Build pattern object
	const patternData: PromptPattern = {
		id: editingPattern?.id || `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		name,
		description,
		template,
		variables,
		category,
		tags,
		author: editingPattern?.author || 'user',
		outputFormat: outputFormat as any,
		recommendedModels: recommendedModels.length > 0 ? recommendedModels : undefined,
		isBuiltIn: editingPattern?.isBuiltIn || false,
		isPublic,
		usageCount: editingPattern?.usageCount || 0,
		averageRating: editingPattern?.averageRating,
		ratingCount: editingPattern?.ratingCount,
		createdAt: editingPattern?.createdAt || new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		version: editingPattern?.version || 1
	};

	// Validate
	const validationErrors = validatePattern(patternData);
	if (validationErrors.length > 0) {
		errors = validationErrors;
		return;
	}

	// Save
	patternsStore.savePattern(patternData);
	onSave?.(patternData);
	errors = [];
}

// Handle cancel
function handleCancel() {
	patternsStore.cancelEdit();
	onCancel?.();
}

// Categories for dropdown
const categories: Array<{ id: PatternCategory; label: string }> = [
	{ id: 'coding', label: 'Coding' },
	{ id: 'writing', label: 'Writing' },
	{ id: 'analysis', label: 'Analysis' },
	{ id: 'debugging', label: 'Debugging' },
	{ id: 'refactoring', label: 'Refactoring' },
	{ id: 'documentation', label: 'Documentation' },
	{ id: 'testing', label: 'Testing' },
	{ id: 'design', label: 'Design' },
	{ id: 'planning', label: 'Planning' },
	{ id: 'learning', label: 'Learning' }
];
</script>

<div class="pattern-editor bg-white border border-gray-200 rounded-lg shadow-lg max-w-5xl mx-auto">
	<!-- Header -->
	<div class="p-6 border-b border-gray-200">
		<h2 class="text-2xl font-bold text-gray-800">
			{editingPattern ? 'Edit Pattern' : 'Create New Pattern'}
		</h2>
		<p class="text-sm text-gray-500 mt-1">
			Create a reusable prompt template with variables
		</p>
	</div>

	<!-- Form -->
	<div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
		<!-- Error Display -->
		{#if errors.length > 0}
			<div class="p-4 bg-red-50 border border-red-200 rounded">
				<h4 class="text-sm font-semibold text-red-700 mb-2">Validation Errors:</h4>
				<ul class="list-disc list-inside text-sm text-red-600 space-y-1">
					{#each errors as error}
						<li>{error}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Basic Info -->
		<div class="grid grid-cols-2 gap-4">
			<!-- Name -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">
					Pattern Name <span class="text-red-500">*</span>
				</label>
				<input
					type="text"
					bind:value={name}
					placeholder="e.g., Code Review, Bug Analysis"
					class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>
			</div>

			<!-- Category -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">
					Category <span class="text-red-500">*</span>
				</label>
				<select
					bind:value={category}
					class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					{#each categories as cat}
						<option value={cat.id}>{cat.label}</option>
					{/each}
				</select>
			</div>
		</div>

		<!-- Description -->
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2">
				Description <span class="text-red-500">*</span>
			</label>
			<textarea
				bind:value={description}
				placeholder="Brief description of what this pattern does..."
				rows="3"
				class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
				required
			></textarea>
		</div>

		<!-- Template -->
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2">
				Prompt Template <span class="text-red-500">*</span>
			</label>
			<p class="text-xs text-gray-500 mb-2">
				Use {'{{variableName}}'} syntax for variables. Variables will be extracted automatically.
			</p>
			<textarea
				bind:value={template}
				placeholder="Enter your prompt template with {{variables}} placeholders..."
				rows="10"
				class="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				required
			></textarea>
		</div>

		<!-- Variables (Auto-extracted) -->
		{#if variables.length > 0}
			<div>
				<h3 class="text-sm font-medium text-gray-700 mb-3">
					Variables ({variables.length}) - Auto-extracted from template
				</h3>
				<div class="space-y-3">
					{#each variables as variable, index}
						<div class="p-4 bg-blue-50 border border-blue-200 rounded">
							<div class="grid grid-cols-2 gap-3 mb-3">
								<!-- Variable Name (read-only) -->
								<div>
									<label class="block text-xs font-medium text-gray-700 mb-1">
										Variable Name
									</label>
									<input
										type="text"
										value={variable.name}
										readonly
										class="w-full px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono"
									/>
								</div>

								<!-- Label -->
								<div>
									<label class="block text-xs font-medium text-gray-700 mb-1">
										Label
									</label>
									<input
										type="text"
										value={variable.label}
										oninput={(e) => handleUpdateVariable(index, 'label', e.currentTarget.value)}
										class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
									/>
								</div>
							</div>

							<!-- Description -->
							<div class="mb-3">
								<label class="block text-xs font-medium text-gray-700 mb-1">
									Description
								</label>
								<input
									type="text"
									value={variable.description}
									oninput={(e) => handleUpdateVariable(index, 'description', e.currentTarget.value)}
									placeholder="Describe what this variable represents..."
									class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
								/>
							</div>

							<div class="grid grid-cols-3 gap-3">
								<!-- Type -->
								<div>
									<label class="block text-xs font-medium text-gray-700 mb-1">
										Type
									</label>
									<select
										value={variable.type}
										onchange={(e) => handleUpdateVariable(index, 'type', e.currentTarget.value)}
										class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
									>
										<option value="string">String</option>
										<option value="number">Number</option>
										<option value="boolean">Boolean</option>
										<option value="array">Array</option>
										<option value="code">Code</option>
									</select>
								</div>

								<!-- Required -->
								<div>
									<label class="block text-xs font-medium text-gray-700 mb-1">
										Required
									</label>
									<label class="flex items-center gap-2 cursor-pointer">
										<input
											type="checkbox"
											checked={variable.required}
											onchange={(e) => handleUpdateVariable(index, 'required', e.currentTarget.checked)}
											class="rounded"
										/>
										<span class="text-sm">Required</span>
									</label>
								</div>

								<!-- Example Value -->
								<div>
									<label class="block text-xs font-medium text-gray-700 mb-1">
										Example
									</label>
									<input
										type="text"
										value={variable.exampleValue || ''}
										oninput={(e) => handleUpdateVariable(index, 'exampleValue', e.currentTarget.value)}
										placeholder="Example value..."
										class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
									/>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Tags -->
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2">
				Tags
			</label>
			<div class="flex gap-2 mb-2">
				<input
					type="text"
					bind:value={newTag}
					placeholder="Add tag (e.g., api, testing, security)"
					onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
					class="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<button
					onclick={handleAddTag}
					class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
				>
					Add
				</button>
			</div>
			{#if tags.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each tags as tag}
						<span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2">
							{tag}
							<button onclick={() => handleRemoveTag(tag)} class="hover:text-purple-900">
								×
							</button>
						</span>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Advanced Settings -->
		<div class="grid grid-cols-2 gap-4">
			<!-- Output Format -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">
					Expected Output Format
				</label>
				<select
					bind:value={outputFormat}
					class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="markdown">Markdown</option>
					<option value="json">JSON</option>
					<option value="code">Code</option>
					<option value="text">Plain Text</option>
				</select>
			</div>

			<!-- Public/Private -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">
					Visibility
				</label>
				<label class="flex items-center gap-2 cursor-pointer px-3 py-2 border border-gray-300 rounded">
					<input
						type="checkbox"
						bind:checked={isPublic}
						class="rounded"
					/>
					<span class="text-sm">Make this pattern public</span>
				</label>
			</div>
		</div>

		<!-- Recommended Models -->
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2">
				Recommended Models (Optional)
			</label>
			<div class="flex gap-2 mb-2">
				<input
					type="text"
					bind:value={newModel}
					placeholder="Add model (e.g., claude-3.5-sonnet, gpt-4)"
					onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddModel())}
					class="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<button
					onclick={handleAddModel}
					class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
				>
					Add
				</button>
			</div>
			{#if recommendedModels.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each recommendedModels as model}
						<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-2">
							{model}
							<button onclick={() => handleRemoveModel(model)} class="hover:text-green-900">
								×
							</button>
						</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Footer Actions -->
	<div class="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
		<button
			onclick={handleCancel}
			class="px-6 py-2 border border-gray-300 rounded hover:bg-white transition-colors"
		>
			Cancel
		</button>
		<button
			onclick={handleSave}
			class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
		>
			{editingPattern ? 'Save Changes' : 'Create Pattern'}
		</button>
	</div>
</div>
