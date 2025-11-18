<script lang="ts">
  import { theme } from '$lib/stores/themeStore';

  type RunStatus = 'success' | 'error' | 'partial';
  type DateRange = '24h' | '7d' | '30d' | 'all';

  interface Props {
    searchQuery: string;
    selectedWorkspace: string | 'all';
    selectedModel: string | 'all';
    selectedStatus: RunStatus | 'all';
    selectedDateRange: DateRange;
    availableWorkspaces: string[];
    availableModels: string[];
  }

  let {
    searchQuery = $bindable(),
    selectedWorkspace = $bindable(),
    selectedModel = $bindable(),
    selectedStatus = $bindable(),
    selectedDateRange = $bindable(),
    availableWorkspaces,
    availableModels
  }: Props = $props();

  const statusOptions: Array<{ value: RunStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'success', label: 'Success' },
    { value: 'error', label: 'Error' },
    { value: 'partial', label: 'Partial' }
  ];

  const dateRangeOptions: Array<{ value: DateRange; label: string }> = [
    { value: '24h', label: '24h' },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
    { value: 'all', label: 'All' }
  ];

  const clearAllFilters = () => {
    searchQuery = '';
    selectedWorkspace = 'all';
    selectedModel = 'all';
    selectedStatus = 'all';
    selectedDateRange = 'all';
  };
</script>

<!-- Filters panel: workspace, model, status, date range, and search -->
<section class={`rounded-lg border p-3 flex flex-col gap-3 transition-colors ${
  $theme === 'dark'
    ? 'border-slate-700 bg-slate-900'
    : 'border-slate-200 bg-white shadow-sm'
}`}>
  <!-- Section header -->
  <div class="flex items-center justify-between">
    <h2 class={`text-xs font-semibold ${
      $theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
    }`}>
      Filters
    </h2>
    {#if searchQuery || selectedWorkspace !== 'all' || selectedModel !== 'all' || selectedStatus !== 'all' || selectedDateRange !== 'all'}
      <button
        type="button"
        class={`text-xs transition-colors ${
          $theme === 'dark'
            ? 'text-amber-400 hover:text-amber-300'
            : 'text-amber-600 hover:text-amber-700'
        }`}
        onclick={clearAllFilters}
      >
        Clear all
      </button>
    {/if}
  </div>

  <!-- Search input -->
  <div>
    <label class={`block text-xs mb-1.5 ${
      $theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
    }`}>
      Search
    </label>
    <input
      type="text"
      placeholder="Search by prompt or label..."
      class={`w-full px-3 py-1.5 rounded-md border text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
        $theme === 'dark'
          ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500'
          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
      }`}
      bind:value={searchQuery}
    />
  </div>

  <!-- Date Range filter -->
  <div>
    <label class={`block text-xs mb-1.5 ${
      $theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
    }`}>
      Date Range
    </label>
    <div class="flex gap-1.5">
      {#each dateRangeOptions as option}
        <button
          type="button"
          class={`flex-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            selectedDateRange === option.value
              ? $theme === 'dark'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
              : $theme === 'dark'
                ? 'bg-slate-950 text-slate-400 border border-slate-700 hover:bg-slate-800'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
          onclick={() => (selectedDateRange = option.value)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Workspace filter -->
  <div>
    <label class={`block text-xs mb-1.5 ${
      $theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
    }`}>
      Workspace
    </label>
    <select
      class={`w-full px-3 py-1.5 rounded-md border text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
        $theme === 'dark'
          ? 'bg-slate-950 border-slate-700 text-slate-100'
          : 'bg-white border-slate-300 text-slate-900'
      }`}
      bind:value={selectedWorkspace}
    >
      <option value="all">All Workspaces</option>
      {#each availableWorkspaces as workspace}
        <option value={workspace}>{workspace}</option>
      {/each}
    </select>
  </div>

  <!-- Model filter -->
  <div>
    <label class={`block text-xs mb-1.5 ${
      $theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
    }`}>
      Model
    </label>
    <div class="flex flex-wrap gap-1.5">
      <button
        type="button"
        class={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
          selectedModel === 'all'
            ? $theme === 'dark'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
            : $theme === 'dark'
              ? 'bg-slate-950 text-slate-400 border border-slate-700 hover:bg-slate-800'
              : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
        }`}
        onclick={() => (selectedModel = 'all')}
      >
        All
      </button>
      {#each availableModels as model}
        <button
          type="button"
          class={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            selectedModel === model
              ? $theme === 'dark'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
              : $theme === 'dark'
                ? 'bg-slate-950 text-slate-400 border border-slate-700 hover:bg-slate-800'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
          onclick={() => (selectedModel = model)}
        >
          {model}
        </button>
      {/each}
    </div>
  </div>

  <!-- Status filter -->
  <div>
    <label class={`block text-xs mb-1.5 ${
      $theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
    }`}>
      Status
    </label>
    <div class="flex gap-1.5">
      {#each statusOptions as option}
        <button
          type="button"
          class={`flex-1 px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
            selectedStatus === option.value
              ? $theme === 'dark'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
              : $theme === 'dark'
                ? 'bg-slate-950 text-slate-400 border border-slate-700 hover:bg-slate-800'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
          onclick={() => (selectedStatus = option.value)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  </div>
</section>
