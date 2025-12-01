<!-- @component
no description yet
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Language, LanguageCategory } from '$lib/data/languages';
	import { LANGUAGES } from '$lib/data/languages';
	
	export let selectedLanguages: string[] = [];
	export let maxSelection: number | undefined = undefined;
	export let onChange: ((languages: string[]) => void) | undefined = undefined;
	export let projectType: 'web' | 'mobile' | 'api' | 'ai' | undefined = undefined;
	
	let languages: Language[] = [];
	let categories: Record<LanguageCategory, Language[]> = {
		frontend: [],
		backend: [],
		systems: [],
		mobile: []
	};
	let loading = true;
	let error: string | null = null;
	let activeTab: LanguageCategory = 'frontend';
	let recommendations: Language[] = [];
	let showRecommendations = false;
	
	const categoryInfo = {
		frontend: {
			icon: '🎨',
			title: 'Frontend',
			description: 'User interface and client-side development'
		},
		backend: {
			icon: '⚙️',
			title: 'Backend',
			description: 'Server-side logic and APIs'
		},
		systems: {
			icon: '🔧',
			title: 'Systems',
			description: 'Low-level and infrastructure code'
		},
		mobile: {
			icon: '📱',
			title: 'Mobile',
			description: 'Native and cross-platform mobile'
		}
	};
	
	onMount(async () => {
		await loadLanguages();
		if (projectType) {
			await loadRecommendations();
		}
	});
	
	async function loadLanguages() {
		try {
			loading = true;
			
			// Use local language data
			languages = Object.values(LANGUAGES);
			
			// Group by category
			for (const lang of languages) {
				if (!categories[lang.category]) {
					categories[lang.category] = [];
				}
				categories[lang.category].push(lang);
			}
			
			categories = categories; // Trigger reactivity
			error = null;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			loading = false;
		}
	}
	
	async function loadRecommendations() {
		if (!projectType) return;
		
		try {
			// Basic recommendation logic based on project type
			if (projectType === 'web') {
				recommendations = [
					LANGUAGES['javascript-typescript'],
					LANGUAGES['python']
				].filter(Boolean) as Language[];
			} else if (projectType === 'mobile') {
				recommendations = [
					LANGUAGES['javascript-typescript'],
					LANGUAGES['dart']
				].filter(Boolean) as Language[];
			} else if (projectType === 'ai') {
				recommendations = [
					LANGUAGES['python'],
					LANGUAGES['javascript-typescript']
				].filter(Boolean) as Language[];
			} else if (projectType === 'api') {
				recommendations = [
					LANGUAGES['python'],
					LANGUAGES['nodejs'],
					LANGUAGES['go']
				].filter(Boolean) as Language[];
			}
			showRecommendations = recommendations.length > 0;
		} catch (err) {
			console.error('Failed to load recommendations:', err);
		}
	}
	
	function toggleLanguage(languageId: string) {
		if (selectedLanguages.includes(languageId)) {
			selectedLanguages = selectedLanguages.filter(id => id !== languageId);
		} else {
			if (maxSelection && selectedLanguages.length >= maxSelection) {
				// Remove first selected to make room
				selectedLanguages = [...selectedLanguages.slice(1), languageId];
			} else {
				selectedLanguages = [...selectedLanguages, languageId];
			}
		}
		onChange?.(selectedLanguages);
	}
	
	function applyRecommendations() {
		selectedLanguages = recommendations.map(r => r.id);
		onChange?.(selectedLanguages);
		showRecommendations = false;
	}
	
	function clearSelection() {
		selectedLanguages = [];
		onChange?.(selectedLanguages);
	}
</script>

<div class="language-selector">
	{#if loading}
		<div class="flex items-center justify-center py-8">
			<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
		</div>
	{:else if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
			<strong>Error:</strong> {error}
		</div>
	{:else}
		<!-- Header -->
		<div class="mb-6">
			<div class="flex items-center justify-between mb-2">
				<h3 class="text-xl font-bold text-gray-900">Select Languages</h3>
				{#if selectedLanguages.length > 0}
					<button
						class="text-sm text-gray-600 hover:text-gray-800"
						on:click={clearSelection}
					>
						Clear ({selectedLanguages.length})
					</button>
				{/if}
			</div>
			{#if maxSelection}
				<p class="text-sm text-gray-600">
					Select up to {maxSelection} language{maxSelection > 1 ? 's' : ''}
				</p>
			{/if}
		</div>
		
		<!-- Recommendations banner -->
		{#if showRecommendations && recommendations.length > 0}
			<div class="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
				<div class="flex items-start justify-between mb-3">
					<div>
						<h4 class="font-semibold text-indigo-900 mb-1">✨ Recommended for {projectType} project</h4>
						<p class="text-sm text-indigo-700">Based on industry best practices</p>
					</div>
					<button
						class="text-indigo-600 hover:text-indigo-800"
						on:click={() => showRecommendations = false}
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
						</svg>
					</button>
				</div>
				<div class="flex flex-wrap gap-2 mb-3">
					{#each recommendations as lang}
						<div class="flex items-center gap-2 px-3 py-2 bg-white border border-indigo-300 rounded-lg">
							<span class="text-2xl">{lang.icon}</span>
							<span class="font-medium text-gray-900">{lang.name}</span>
						</div>
					{/each}
				</div>
				<button
					class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
					on:click={applyRecommendations}
				>
					Apply Recommendations
				</button>
			</div>
		{/if}
		
		<!-- Category tabs -->
		<div class="mb-6 border-b border-gray-200">
			<div class="flex gap-1 overflow-x-auto">
				{#each Object.entries(categoryInfo) as [key, info]}
					<button
						class="flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors"
						class:border-indigo-500={activeTab === key}
						class:text-indigo-600={activeTab === key}
						class:border-transparent={activeTab !== key}
						class:text-gray-600={activeTab !== key}
						on:click={() => activeTab = key as LanguageCategory}
					>
						<span class="text-xl">{info.icon}</span>
						<div class="text-left">
							<div>{info.title}</div>
							<div class="text-xs opacity-75">{categories[key as LanguageCategory]?.length || 0} languages</div>
						</div>
					</button>
				{/each}
			</div>
		</div>
		
		<!-- Language grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
			{#each categories[activeTab] || [] as language (language.id)}
				<button
					class="language-card text-left p-4 rounded-lg border-2 transition-all duration-200"
					class:border-indigo-500={selectedLanguages.includes(language.id)}
					class:bg-indigo-50={selectedLanguages.includes(language.id)}
					class:border-gray-200={!selectedLanguages.includes(language.id)}
					class:hover:border-gray-300={!selectedLanguages.includes(language.id)}
					class:shadow-md={selectedLanguages.includes(language.id)}
					on:click={() => toggleLanguage(language.id)}
				>
				<div class="flex items-start justify-between mb-2">
					<div class="flex items-center gap-3 flex-1 min-w-0">
						<span class="text-3xl shrink-0">{language.icon}</span>
							<div class="flex-1 min-w-0">
								<h4 class="font-bold text-gray-900 truncate">{language.name}</h4>
								<p class="text-xs text-gray-600 capitalize">{language.ecosystemSupport} ecosystem</p>
							</div>
					</div>
					{#if selectedLanguages.includes(language.id)}
						<svg class="w-6 h-6 text-indigo-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
						{/if}
					</div>
					<p class="text-sm text-gray-700 line-clamp-2">{language.description}</p>
					{#if language.compatibleStacks.length > 0}
						<div class="mt-2 text-xs text-gray-500">
							{language.compatibleStacks.length} compatible stack{language.compatibleStacks.length > 1 ? 's' : ''}
						</div>
					{/if}
				</button>
			{/each}
		</div>
		
		<!-- Selection summary -->
		{#if selectedLanguages.length > 0}
			<div class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
				<h4 class="font-semibold text-gray-900 mb-2">Selected Languages ({selectedLanguages.length})</h4>
				<div class="flex flex-wrap gap-2">
					{#each selectedLanguages as langId}
						{@const lang = languages.find(l => l.id === langId)}
						{#if lang}
							<div class="flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded-full">
								<span class="text-lg">{lang.icon}</span>
								<span class="text-sm font-medium">{lang.name}</span>
								<button
									class="text-gray-400 hover:text-gray-600"
									on:click|stopPropagation={() => toggleLanguage(langId)}
								>
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
									</svg>
								</button>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.language-card:hover {
		transform: translateY(-2px);
	}
	
	.line-clamp-2 {
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}
</style>
