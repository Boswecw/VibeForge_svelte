<script lang="ts">
  import { themeStore } from '$lib/core/stores';

  interface Props {
    totalCount: number;
    filteredCount: number;
  }

  let { totalCount, filteredCount }: Props = $props();
</script>

<!-- Header section with title, description, and pattern counts -->
<header class="flex flex-col gap-2">
  <div class="flex items-center justify-between">
    <div class="flex flex-col gap-1">
      <h1 class={`text-base font-semibold tracking-tight ${
        themeStore.current === 'dark' ? 'text-slate-100' : 'text-slate-900'
      }`}>
        Patterns & Recipes
      </h1>
      <p class={`text-xs leading-relaxed ${
        themeStore.current === 'dark' ? 'text-slate-400' : 'text-slate-500'
      }`}>
        Reusable prompt templates for common workflows and LLM tasks
      </p>
    </div>

    <!-- Stats and actions -->
    <div class="flex items-center gap-3">
      <div class={`text-xs px-3 py-1.5 rounded-md border ${
        themeStore.current === 'dark'
          ? 'border-slate-700 bg-slate-900 text-slate-300'
          : 'border-slate-200 bg-white text-slate-600'
      }`}>
        {#if filteredCount < totalCount}
          <span class="font-medium">{filteredCount}</span> of <span class="font-medium">{totalCount}</span> patterns
        {:else}
          <span class="font-medium">{totalCount}</span> total patterns
        {/if}
      </div>

      <button
        type="button"
        class={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
          themeStore.current === 'dark'
            ? 'border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-700'
        }`}
        disabled
        title="Coming soon"
      >
        + New Pattern (coming soon)
      </button>
    </div>
  </div>
</header>
