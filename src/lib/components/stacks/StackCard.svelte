<!-- @component
no description yet
-->
<script lang="ts">
  import { onMount } from "svelte";
  import type { StackProfile } from "$lib/data/stack-profiles";
  import { learningStore, stackSuccessRates } from "$lib/stores/learning";
  import type { StackSuccessRate } from "$lib/types/learning";

  export let stack: StackProfile;
  export let selected = false;
  export let compact = false;
  export let onClick: (() => void) | undefined = undefined;

  // Success prediction data
  let successData: StackSuccessRate | null = null;
  $: successRates = $stackSuccessRates;
  
  // Find success data for this stack
  $: {
    successData = successRates.find(sr => 
      sr.stack_id.toLowerCase() === stack.id.toLowerCase() || 
      sr.stack_id.toLowerCase().includes(stack.id.toLowerCase())
    ) || null;
  }

  function getSuccessColor(rate: number): string {
    if (rate >= 0.8) return "text-green-600 bg-green-100 border-green-300";
    if (rate >= 0.6) return "text-yellow-600 bg-yellow-100 border-yellow-300";
    return "text-red-600 bg-red-100 border-red-300";
  }

  function formatPercentage(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  function formatTime(seconds: number | undefined): string {
    if (!seconds) return "N/A";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  }

  const categoryColors = {
    web: "bg-blue-500",
    mobile: "bg-green-500",
    desktop: "bg-purple-500",
    fullstack: "bg-indigo-500",
    backend: "bg-orange-500",
    ai: "bg-pink-500",
  };

  const complexityColors = {
    beginner: "text-green-600 bg-green-50",
    intermediate: "text-yellow-600 bg-yellow-50",
    advanced: "text-orange-600 bg-orange-50",
    expert: "text-red-600 bg-red-50",
  };

  const maturityColors = {
    experimental: "text-purple-600 bg-purple-50",
    stable: "text-blue-600 bg-blue-50",
    mature: "text-green-600 bg-green-50",
    legacy: "text-gray-600 bg-gray-50",
  };
</script>

<div
  class="stack-card rounded-lg border-2 transition-all duration-200 hover:shadow-lg"
  class:border-indigo-500={selected}
  class:border-gray-200={!selected}
  class:shadow-md={selected}
  class:cursor-pointer={onClick}
  class:compact
  on:click={onClick}
  on:keydown={(e) => e.key === "Enter" && onClick?.()}
  role={onClick ? "button" : undefined}
  tabindex={onClick ? 0 : undefined}
>
  <div class="p-4" class:p-3={compact}>
    <!-- Header -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center gap-3 flex-1">
        <div class="text-4xl" class:text-3xl={compact}>
          {stack.icon}
        </div>
        <div class="flex-1 min-w-0">
          <h3
            class="text-lg font-bold text-gray-900 truncate"
            class:text-base={compact}
          >
            {stack.name}
          </h3>
          {#if stack.tagline}
            <p class="text-sm text-gray-600 line-clamp-1">{stack.tagline}</p>
          {/if}
        </div>
      </div>

      {#if selected}
        <div class="flex-shrink-0 ml-2">
          <svg
            class="w-6 h-6 text-indigo-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      {/if}
    </div>

    <!-- Description -->
    {#if !compact}
      <p class="text-sm text-gray-700 mb-3 line-clamp-2">
        {stack.description}
      </p>
    {/if}

    <!-- Tags -->
    <div class="flex flex-wrap gap-2 mb-3">
      <span
        class="px-2 py-1 text-xs font-medium text-white rounded {categoryColors[
          stack.category
        ]}"
      >
        {stack.category}
      </span>
      <span
        class="px-2 py-1 text-xs font-medium rounded {complexityColors[
          stack.complexity
        ]}"
      >
        {stack.complexity}
      </span>
      <span
        class="px-2 py-1 text-xs font-medium rounded {maturityColors[
          stack.maturity
        ]}"
      >
        {stack.maturity}
      </span>
      
      <!-- Success Prediction Badge -->
      {#if successData}
        <span
          class="px-2 py-1 text-xs font-bold rounded border {getSuccessColor(successData.success_rate)}"
          title="Historical success rate based on {successData.total_uses} projects"
        >
          ✨ {formatPercentage(successData.success_rate)} Success
        </span>
      {/if}
    </div>

    <!-- Success Metrics (if available) -->
    {#if successData && !compact}
      <div class="mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <div class="grid grid-cols-3 gap-2 text-xs">
          {#if successData.avg_build_time}
            <div class="text-center">
              <div class="text-gray-600 font-medium">Build Time</div>
              <div class="text-gray-900 font-semibold">{formatTime(successData.avg_build_time)}</div>
            </div>
          {/if}
          {#if successData.avg_test_pass_rate}
            <div class="text-center">
              <div class="text-gray-600 font-medium">Test Pass</div>
              <div class="text-gray-900 font-semibold">{formatPercentage(successData.avg_test_pass_rate)}</div>
            </div>
          {/if}
          {#if successData.avg_satisfaction}
            <div class="text-center">
              <div class="text-gray-600 font-medium">Satisfaction</div>
              <div class="text-gray-900 font-semibold">{successData.avg_satisfaction.toFixed(1)}/5</div>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Technologies (compact view) -->
    {#if !compact}
      <div class="space-y-2">
        {#if stack.technologies.frontend?.length}
          <div class="flex items-center gap-2 text-xs">
            <span class="text-gray-500 font-medium w-20">Frontend:</span>
            <span class="text-gray-700"
              >{stack.technologies.frontend.join(", ")}</span
            >
          </div>
        {/if}
        {#if stack.technologies.backend?.length}
          <div class="flex items-center gap-2 text-xs">
            <span class="text-gray-500 font-medium w-20">Backend:</span>
            <span class="text-gray-700"
              >{stack.technologies.backend.join(", ")}</span
            >
          </div>
        {/if}
        {#if stack.technologies.database?.length}
          <div class="flex items-center gap-2 text-xs">
            <span class="text-gray-500 font-medium w-20">Database:</span>
            <span class="text-gray-700"
              >{stack.technologies.database.join(", ")}</span
            >
          </div>
        {/if}
      </div>
    {/if}

    <!-- Features (non-compact) -->
    {#if !compact && stack.features.length > 0}
      <div class="mt-3 pt-3 border-t border-gray-200">
        <div class="flex flex-wrap gap-1">
          {#each stack.features.slice(0, 6) as feature}
            <span class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
              {feature}
            </span>
          {/each}
          {#if stack.features.length > 6}
            <span class="px-2 py-1 text-xs text-gray-500">
              +{stack.features.length - 6} more
            </span>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Popularity indicator -->
    {#if stack.popularity > 7}
      <div class="mt-3 flex items-center gap-1 text-xs text-yellow-600">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>
        <span>Popular choice</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .stack-card {
    background: white;
  }

  .stack-card:hover {
    transform: translateY(-2px);
  }

  .stack-card.compact {
    min-height: auto;
  }

  .line-clamp-1 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }

  .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
</style>
