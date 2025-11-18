<script lang="ts">
  import { theme } from '$lib/stores/themeStore';

  interface Props {
    totalCount: number;
    filteredCount: number;
  }

  let { totalCount, filteredCount }: Props = $props();
</script>

<!-- Header section with title, description, and run counts -->
<header class="flex flex-col gap-2">
  <div class="flex items-center justify-between">
    <div class="flex flex-col gap-1">
      <h1 class={`text-base font-semibold tracking-tight ${
        $theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
      }`}>
        History
      </h1>
      <p class={`text-xs leading-relaxed ${
        $theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
      }`}>
        Review past runs and re-use successful prompts in the Workbench
      </p>
    </div>

    <!-- Stats -->
    <div class="flex items-center gap-3">
      <div class={`text-xs px-3 py-1.5 rounded-md border ${
        $theme === 'dark'
          ? 'border-slate-700 bg-slate-900 text-slate-300'
          : 'border-slate-200 bg-white text-slate-600'
      }`}>
        {#if filteredCount < totalCount}
          <span class="font-medium">{filteredCount}</span> of <span class="font-medium">{totalCount}</span> runs
        {:else}
          <span class="font-medium">{totalCount}</span> total runs
        {/if}
      </div>
    </div>
  </div>
</header>
