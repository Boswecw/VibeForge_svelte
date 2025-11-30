<!--
  PatternCard.svelte

  Displays a single architecture pattern as a selectable card.
  Shows pattern name, description, complexity, components, and use cases.
-->
<script lang="ts">
  import type { ArchitecturePattern } from '../../types/architecture';
  import { patternComparison, canAddToComparison, comparisonCount } from '$lib/stores/patternComparison';

  interface Props {
    pattern: ArchitecturePattern;
    selected?: boolean;
    onClick?: () => void;
    showCompare?: boolean;
  }

  let { pattern, selected = false, onClick, showCompare = true }: Props = $props();

  let inComparison = $derived($comparisonCount > 0 && $patternComparison.patterns.some(p => p.id === pattern.id));

  function handleCompareClick(e: MouseEvent) {
    e.stopPropagation();
    patternComparison.togglePattern(pattern);
  }

  // Get complexity color
  const complexityColor = $derived(() => {
    switch (pattern.complexity) {
      case 'simple':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'intermediate':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'complex':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'enterprise':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  });

  // Get maturity badge color
  const maturityColor = $derived(() => {
    switch (pattern.maturity) {
      case 'experimental':
        return 'bg-yellow-100 text-yellow-800';
      case 'stable':
        return 'bg-blue-100 text-blue-800';
      case 'mature':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  });
</script>

<button
  type="button"
  class="
    w-full p-5 text-left rounded-xl border-2 transition-all duration-200
    hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ember-500
    {selected
      ? 'border-ember-500 bg-ember-50/50 shadow-md'
      : 'border-gunmetal-700 bg-gunmetal-900 hover:border-ember-400'}
  "
  onclick={onClick}
>
  <!-- Header -->
  <div class="flex items-start justify-between mb-3">
    <div class="flex items-center gap-3">
      <!-- Icon -->
      <div class="text-3xl" aria-hidden="true">{pattern.icon}</div>

      <!-- Title & Category -->
      <div>
        <h3 class="text-lg font-semibold text-zinc-100">
          {pattern.displayName}
        </h3>
        <p class="text-xs text-zinc-500 capitalize">
          {pattern.category} • {pattern.components.length} components
        </p>
      </div>
    </div>

    <!-- Compare & Selected Indicators -->
    <div class="flex items-center gap-2">
      {#if showCompare}
        <button
          type="button"
          class="compare-btn {inComparison ? 'active' : ''} {!$canAddToComparison && !inComparison ? 'disabled' : ''}"
          onclick={handleCompareClick}
          disabled={!$canAddToComparison && !inComparison}
          title={inComparison ? 'Remove from comparison' : 'Add to comparison'}
        >
          {#if inComparison}
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          {/if}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>
      {/if}

      {#if selected}
        <svg
          class="w-6 h-6 text-ember-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-label="Selected"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
      {/if}
    </div>
  </div>

  <!-- Description -->
  <p class="text-sm text-zinc-400 mb-4 line-clamp-2">
    {pattern.description}
  </p>

  <!-- Components -->
  <div class="mb-4">
    <div class="flex flex-wrap gap-2">
      {#each pattern.components as component}
        <span
          class="px-2 py-1 text-xs font-medium rounded-md bg-gunmetal-800 text-zinc-300 border border-gunmetal-700"
        >
          {component.framework}
          <span class="text-zinc-500">({component.language})</span>
        </span>
      {/each}
    </div>
  </div>

  <!-- Metadata -->
  <div class="flex items-center gap-3 text-xs">
    <!-- Complexity -->
    <span
      class="px-2 py-1 rounded-md font-medium capitalize border {complexityColor()}"
    >
      {pattern.complexity}
    </span>

    <!-- Maturity -->
    <span class="px-2 py-1 rounded-md font-medium capitalize {maturityColor()}">
      {pattern.maturity}
    </span>

    <!-- Popularity -->
    <div class="flex items-center gap-1 text-zinc-500" title="Popularity: {pattern.popularity}/100">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span>{pattern.popularity}%</span>
    </div>

    <!-- Setup Time -->
    <span class="text-zinc-500">
      ⏱️ {pattern.prerequisites.timeEstimate}
    </span>
  </div>

  <!-- Ideal For (when not selected) -->
  {#if !selected && pattern.idealFor.length > 0}
    <div class="mt-3 pt-3 border-t border-gunmetal-700">
      <p class="text-xs text-zinc-500 mb-1">Ideal for:</p>
      <div class="flex flex-wrap gap-1">
        {#each pattern.idealFor.slice(0, 3) as useCase}
          <span class="text-xs text-zinc-400">• {useCase}</span>
        {/each}
        {#if pattern.idealFor.length > 3}
          <span class="text-xs text-zinc-500">+{pattern.idealFor.length - 3} more</span>
        {/if}
      </div>
    </div>
  {/if}
</button>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .compare-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 6px;
    color: #A1A1AA;
    cursor: pointer;
    transition: all 0.2s;
  }

  .compare-btn:hover:not(.disabled) {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.5);
    color: #D4D4D8;
  }

  .compare-btn.active {
    background: rgba(99, 102, 241, 0.3);
    border-color: #6366F1;
    color: #6366F1;
  }

  .compare-btn.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
