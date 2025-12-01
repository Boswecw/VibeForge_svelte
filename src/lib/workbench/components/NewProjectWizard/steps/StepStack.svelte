<!--
  StepStack.svelte

  Step 3: Select technology stack
  Phase 3.5: Enhanced Stack Advisor with intelligent scoring
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { wizardStore } from '../../../stores/wizard.svelte';
  import { ALL_STACKS, STACK_PROFILES } from '$lib/data/stack-profiles';
  import type { StackProfile } from '$lib/core/types/stack-profiles';
  import { stackAdvisor } from '$lib/workbench/services/stackAdvisor';
  import type { StackScore, RecommendationExplanation } from '$lib/workbench/types/stack-advisor';

  // State for stack advisor recommendations
  let stackScores = $state<Map<string, StackScore>>(new Map());
  let stackExplanations = $state<Map<string, RecommendationExplanation>>(new Map());
  let isLoadingRecommendations = $state(false);
  let showExplanation = $state<string | null>(null); // Stack ID of currently shown explanation

  // Calculate stack recommendations on mount or when pattern changes
  onMount(async () => {
    await calculateStackRecommendations();
  });

  $effect(() => {
    // Recalculate when pattern changes
    const pattern = wizardStore.data.selectedPattern;
    if (pattern) {
      calculateStackRecommendations();
    }
  });

  async function calculateStackRecommendations() {
    const pattern = wizardStore.data.selectedPattern;
    if (!pattern) return;

    isLoadingRecommendations = true;
    try {
      const response = await stackAdvisor.calculateScores({
        stacks: ALL_STACKS,
        patternId: pattern.id,
        patternName: pattern.name,
        projectType: pattern.category,
        includeExplanations: true,
      });

      // Build maps for quick lookup
      const scoresMap = new Map<string, StackScore>();
      const explanationsMap = new Map<string, RecommendationExplanation>();

      response.recommendations.forEach((rec) => {
        scoresMap.set(rec.stack.id, rec.score);
        if (rec.explanation) {
          explanationsMap.set(rec.stack.id, rec.explanation);
        }
      });

      stackScores = scoresMap;
      stackExplanations = explanationsMap;
    } catch (err) {
      console.error('Failed to calculate stack recommendations:', err);
    } finally {
      isLoadingRecommendations = false;
    }
  }

  // Filter stacks based on selected language
  const compatibleStacks = $derived(() => {
    const primaryLang = wizardStore.data.primaryLanguage;
    if (!primaryLang) return ALL_STACKS;

    // Filter stacks that are compatible with the primary language
    // For now, show all stacks (future: implement language compatibility)
    return ALL_STACKS;
  });

  // Sort stacks by recommendation score (highest first)
  const sortedStacks = $derived(() => {
    const stacks = compatibleStacks();
    if (stackScores.size === 0) return stacks;

    return [...stacks].sort((a, b) => {
      const scoreA = stackScores.get(a.id)?.finalScore || 0;
      const scoreB = stackScores.get(b.id)?.finalScore || 0;
      return scoreB - scoreA; // Descending order
    });
  });

  // Reactive bindings to wizard store
  let selectedStack = $state(wizardStore.data.selectedStack);

  // Sync to store on change
  $effect(() => {
    wizardStore.updateData('selectedStack', selectedStack);
  });

  const validation = $derived(wizardStore.validation.stack);

  function selectStack(stack: StackProfile): void {
    selectedStack = stack;
  }

  function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      web: 'Web',
      mobile: 'Mobile',
      desktop: 'Desktop',
      api: 'API/Backend',
      ai: 'AI/ML',
    };
    return labels[category] || category;
  }

  function getMaturityBadge(maturity: string): { color: string; label: string } {
    const badges: Record<string, { color: string; label: string }> = {
      experimental: { color: 'text-purple-400 bg-purple-900/20 border-purple-500', label: 'Experimental' },
      stable: { color: 'text-blue-400 bg-blue-900/20 border-blue-500', label: 'Stable' },
      mature: { color: 'text-green-400 bg-green-900/20 border-green-500', label: 'Mature' },
      legacy: { color: 'text-amber-400 bg-amber-900/20 border-amber-500', label: 'Legacy' },
    };
    return badges[maturity] || badges.stable;
  }

  function getConfidenceBadgeClass(confidence: 'high' | 'medium' | 'low'): string {
    switch (confidence) {
      case 'high':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
    }
  }

  function getScoreBadgeClass(score: number): string {
    if (score >= 70) return 'bg-green-500/10 text-green-400 border-green-500/30';
    if (score >= 50) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
  }

  function toggleExplanation(stackId: string) {
    if (showExplanation === stackId) {
      showExplanation = null;
    } else {
      showExplanation = stackId;
    }
  }
</script>

<div class="space-y-6">
  <!-- Stack Selection -->
  <div>
    <h3 class="text-sm font-medium text-zinc-300 mb-3">
      Choose Your Stack <span class="text-red-400">*</span>
    </h3>
    <p class="text-xs text-zinc-500 mb-4">
      Select a proven technology stack for your project
    </p>

    {#if isLoadingRecommendations}
      <div class="flex items-center justify-center py-8">
        <svg class="animate-spin h-6 w-6 text-ember-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="ml-2 text-sm text-zinc-400">Calculating recommendations...</span>
      </div>
    {/if}

    <div class="space-y-3 max-h-[500px] overflow-y-auto pr-2">
      {#each sortedStacks() as stack}
        {@const isSelected = selectedStack?.id === stack.id}
        {@const maturityBadge = getMaturityBadge(stack.maturity)}
        {@const score = stackScores.get(stack.id)}
        {@const explanation = stackExplanations.get(stack.id)}
        <button
          type="button"
          class="
            w-full p-4 rounded-lg border text-left transition-all relative
            {isSelected
              ? 'bg-ember-600/20 border-ember-500 ring-2 ring-ember-500/50'
              : 'bg-gunmetal-800 border-gunmetal-700 hover:border-gunmetal-600'}
          "
          on:click={() => selectStack(stack)}
        >
          <!-- Recommendation Badge (Top Right) -->
          {#if score && score.finalScore >= 70}
            <div class="absolute top-2 right-2 px-2 py-1 bg-ember-500 text-white text-xs font-bold rounded-md flex items-center gap-1">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              RECOMMENDED
            </div>
          {/if}
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                {#if stack.icon}
                  <span class="text-2xl">{stack.icon}</span>
                {/if}
                <div>
                  <h4 class="text-base font-semibold {isSelected ? 'text-ember-400' : 'text-zinc-100'}">
                    {stack.displayName || stack.name}
                  </h4>
                  {#if stack.tagline}
                    <p class="text-xs text-zinc-500">{stack.tagline}</p>
                  {/if}
                </div>
              </div>

              <p class="text-sm text-zinc-400 mb-3">
                {stack.description}
              </p>

              <!-- Badges -->
              <div class="flex flex-wrap gap-2">
                <!-- Score Badge (Phase 3.5) -->
                {#if score}
                  <span class="inline-flex items-center px-2 py-1 rounded text-xs font-semibold border {getScoreBadgeClass(score.finalScore)}">
                    Score: {score.finalScore.toFixed(0)}/100
                  </span>
                {/if}

                <!-- Confidence Badge (Phase 3.5) -->
                {#if score}
                  <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium border capitalize {getConfidenceBadgeClass(score.confidence)}">
                    {score.confidence} confidence
                  </span>
                {/if}

                <span class="inline-flex items-center px-2 py-1 rounded text-xs border {maturityBadge.color}">
                  {maturityBadge.label}
                </span>
                <span class="inline-flex items-center px-2 py-1 rounded text-xs border text-zinc-400 bg-gunmetal-800 border-gunmetal-600">
                  {getCategoryLabel(stack.category)}
                </span>
                {#if stack.popularity >= 80}
                  <span class="inline-flex items-center px-2 py-1 rounded text-xs border text-emerald-400 bg-emerald-900/20 border-emerald-500">
                    ⭐ Popular
                  </span>
                {/if}
              </div>

              <!-- Technologies Preview -->
              <div class="mt-3 flex flex-wrap gap-1.5">
                {#if stack.technologies.frontend && stack.technologies.frontend.length > 0}
                  {#each stack.technologies.frontend.slice(0, 3) as tech}
                    <span class="px-2 py-0.5 bg-gunmetal-900 border border-gunmetal-700 rounded text-xs text-zinc-400">
                      {tech.name}
                    </span>
                  {/each}
                {/if}
                {#if stack.technologies.backend && stack.technologies.backend.length > 0}
                  {#each stack.technologies.backend.slice(0, 3) as tech}
                    <span class="px-2 py-0.5 bg-gunmetal-900 border border-gunmetal-700 rounded text-xs text-zinc-400">
                      {tech.name}
                    </span>
                  {/each}
                {/if}
              </div>

              <!-- "Why this stack?" Button (Phase 3.5) -->
              {#if explanation}
                <div class="mt-3">
                  <button
                    type="button"
                    class="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                    onclick={(e) => {
                      e.stopPropagation();
                      toggleExplanation(stack.id);
                    }}
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {showExplanation === stack.id ? 'Hide details' : 'Why this stack?'}
                  </button>
                </div>
              {/if}
            </div>

            {#if isSelected}
              <div class="flex-shrink-0">
                <svg class="w-6 h-6 text-ember-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            {/if}
          </div>
        </button>

        <!-- Explanation Panel (Phase 3.5) -->
        {#if showExplanation === stack.id && explanation}
          <div class="mt-2 p-4 bg-gunmetal-900/50 border border-blue-500/30 rounded-lg space-y-3">
            <!-- Primary Reason -->
            <div class="pb-2 border-b border-gunmetal-700">
              <p class="text-sm text-blue-300 font-medium">
                {explanation.primaryReason}
              </p>
            </div>

            <!-- Pros & Cons -->
            <div class="grid grid-cols-2 gap-4">
              {#if explanation.pros.length > 0}
                <div>
                  <h5 class="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    Pros
                  </h5>
                  <ul class="space-y-1">
                    {#each explanation.pros as pro}
                      <li class="text-xs text-zinc-300 flex items-start gap-1">
                        <span class="text-green-500 mt-0.5">•</span>
                        <span>{pro}</span>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}

              {#if explanation.cons.length > 0}
                <div>
                  <h5 class="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    Considerations
                  </h5>
                  <ul class="space-y-1">
                    {#each explanation.cons as con}
                      <li class="text-xs text-zinc-400 flex items-start gap-1">
                        <span class="text-yellow-500 mt-0.5">•</span>
                        <span>{con}</span>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>

            <!-- Success Stories -->
            {#if explanation.successStories && explanation.successStories.length > 0}
              <div class="pt-2 border-t border-gunmetal-700">
                <h5 class="text-xs font-semibold text-ember-400 mb-2">Historical Success</h5>
                {#each explanation.successStories as story}
                  <div class="text-xs text-zinc-400">
                    <span class="text-green-400 font-semibold">{story.successRate.toFixed(0)}%</span>
                    success rate across
                    <span class="text-zinc-300 font-medium">{story.projectCount}</span>
                    {story.projectCount === 1 ? 'project' : 'projects'} using {story.patternName}
                  </div>
                {/each}
              </div>
            {/if}

            <!-- Explanation Factors -->
            {#if explanation.factors.length > 0}
              <div class="pt-2 border-t border-gunmetal-700">
                <h5 class="text-xs font-semibold text-zinc-400 mb-2">Score Breakdown</h5>
                <div class="space-y-1.5">
                  {#each explanation.factors as factor}
                    <div class="flex items-start gap-2">
                      <div class={`
                        flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5
                        ${factor.sentiment === 'positive' ? 'bg-green-500' : factor.sentiment === 'negative' ? 'bg-red-500' : 'bg-zinc-500'}
                      `}></div>
                      <div class="flex-1">
                        <p class="text-xs text-zinc-300 font-medium">{factor.label}</p>
                        <p class="text-xs text-zinc-500">{factor.description}</p>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      {/each}
    </div>

    {#if validation.errors.some(e => e.includes('stack'))}
      <p class="mt-2 text-sm text-red-400">
        {validation.errors.find(e => e.includes('stack'))}
      </p>
    {/if}
  </div>

  <!-- Selected Stack Details -->
  {#if selectedStack}
    <div class="p-4 bg-gunmetal-800/50 border border-gunmetal-700 rounded-lg">
      <h4 class="text-sm font-medium text-zinc-300 mb-3">Selected Stack</h4>

      <div class="space-y-3">
        <div>
          <p class="text-xs font-medium text-zinc-500 mb-1">Strengths</p>
          <ul class="space-y-1">
            {#each selectedStack.strengths.slice(0, 3) as strength}
              <li class="text-xs text-zinc-400 flex items-start gap-2">
                <span class="text-green-500 mt-0.5">✓</span>
                <span>{strength}</span>
              </li>
            {/each}
          </ul>
        </div>

        {#if selectedStack.idealFor && selectedStack.idealFor.length > 0}
          <div>
            <p class="text-xs font-medium text-zinc-500 mb-1">Ideal For</p>
            <div class="flex flex-wrap gap-1.5">
              {#each selectedStack.idealFor.slice(0, 4) as ideal}
                <span class="px-2 py-0.5 bg-blue-900/20 border border-blue-700 rounded text-xs text-blue-400">
                  {ideal}
                </span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
