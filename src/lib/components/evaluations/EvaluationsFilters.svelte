<!-- @component
### Props
- `!$ dateRange` **'7d' | '30d' | 'all'**
- `!$ modelFilter` **string**
- `! onDateRangeChange` **(range: '7d' | '30d' | 'all') =► void**
- `! onModelFilterChange` **(model: string) =► void**
- `! onSearchChange` **(query: string) =► void**
- `! onStatusFilterChange` **(status: EvaluationStatus | 'all') =► void**
- `! onWorkspaceChange` **(workspace: string) =► void**
- `!$ searchQuery` **string**
- `!$ statusFilter` **EvaluationStatus | 'all'**
- `!$ workspace` **string**

no description yet
-->
<script lang="ts">
  import { theme } from '$lib/stores/themeStore';
  import type { EvaluationStatus } from '$lib/types/evaluation';

  interface Props {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    workspace: string;
    onWorkspaceChange: (workspace: string) => void;
    modelFilter: string;
    onModelFilterChange: (model: string) => void;
    statusFilter: EvaluationStatus | 'all';
    onStatusFilterChange: (status: EvaluationStatus | 'all') => void;
    dateRange: '7d' | '30d' | 'all';
    onDateRangeChange: (range: '7d' | '30d' | 'all') => void;
  }

  let {
    searchQuery = $bindable(),
    onSearchChange,
    workspace = $bindable(),
    onWorkspaceChange,
    modelFilter = $bindable(),
    onModelFilterChange,
    statusFilter = $bindable(),
    onStatusFilterChange,
    dateRange = $bindable(),
    onDateRangeChange
  }: Props = $props();

  const workspaces = ['All Workspaces', 'AuthorForge', 'VibeForge Dev', 'Research Lab'];
  const models = ['All Models', 'Claude', 'GPT-5.x', 'Local'];
  const statuses: (EvaluationStatus | 'all')[] = ['all', 'draft', 'in-progress', 'completed'];
  const dateRanges: ('7d' | '30d' | 'all')[] = ['7d', '30d', 'all'];
</script>

<!-- Compact filters panel -->
<section
  class={`rounded-lg border p-3 flex flex-col gap-3 transition-colors ${
    $theme === 'dark'
      ? 'bg-slate-900 border-slate-700'
      : 'bg-white border-slate-200 shadow-sm'
  }`}
>
  <!-- Search input -->
  <div class="flex flex-col gap-1">
    <label class={`text-xs font-medium ${
      $theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
    }`}>
      Search
    </label>
    <input
      type="text"
      placeholder="Search evaluations by name or tag…"
      value={searchQuery}
      onchange={(e) => {
        searchQuery = (e.target as HTMLInputElement).value;
        onSearchChange(searchQuery);
      }}
      class={`w-full border rounded-md px-2.5 py-1.5 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
        $theme === 'dark'
          ? 'bg-slate-950 border-slate-700 text-slate-100'
          : 'bg-slate-50 border-slate-200 text-slate-900'
      }`}
    />
  </div>

  <!-- Workspace selector -->
  <div class="flex flex-col gap-1">
    <label class={`text-xs font-medium ${
      $theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
    }`}>
      Workspace
    </label>
    <select
      value={workspace}
      onchange={(e) => {
        workspace = (e.target as HTMLSelectElement).value;
        onWorkspaceChange(workspace);
      }}
      class={`w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
        $theme === 'dark'
          ? 'bg-slate-950 border-slate-700 text-slate-100'
          : 'bg-slate-50 border-slate-200 text-slate-900'
      }`}
    >
      {#each workspaces as ws}
        <option value={ws}>{ws}</option>
      {/each}
    </select>
  </div>

  <!-- Model filter chips -->
  <div class="flex flex-col gap-1">
    <label class={`text-xs font-medium ${
      $theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
    }`}>
      Models
    </label>
    <div class="flex flex-wrap gap-1.5">
      {#each models as model}
        {@const isActive = modelFilter === model}
        <button
          type="button"
          class={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
            isActive
              ? $theme === 'dark'
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'bg-amber-50 border-amber-500 text-amber-700'
              : $theme === 'dark'
                ? 'bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-900'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
          }`}
          onclick={() => {
            modelFilter = model;
            onModelFilterChange(model);
          }}
        >
          {model}
        </button>
      {/each}
    </div>
  </div>

  <!-- Status filter chips -->
  <div class="flex flex-col gap-1">
    <label class={`text-xs font-medium ${
      $theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
    }`}>
      Status
    </label>
    <div class="flex flex-wrap gap-1.5">
      {#each statuses as status}
        {@const isActive = statusFilter === status}
        <button
          type="button"
          class={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
            isActive
              ? $theme === 'dark'
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'bg-amber-50 border-amber-500 text-amber-700'
              : $theme === 'dark'
                ? 'bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-900'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
          }`}
          onclick={() => {
            statusFilter = status;
            onStatusFilterChange(status);
          }}
        >
          {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
        </button>
      {/each}
    </div>
  </div>

  <!-- Date range filter chips -->
  <div class="flex flex-col gap-1">
    <label class={`text-xs font-medium ${
      $theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
    }`}>
      Date Range
    </label>
    <div class="flex gap-1.5">
      {#each dateRanges as range}
        {@const isActive = dateRange === range}
        <button
          type="button"
          class={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
            isActive
              ? $theme === 'dark'
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'bg-amber-50 border-amber-500 text-amber-700'
              : $theme === 'dark'
                ? 'bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-900'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
          }`}
          onclick={() => {
            dateRange = range;
            onDateRangeChange(range);
          }}
        >
          {range === 'all' ? 'All Time' : range}
        </button>
      {/each}
    </div>
  </div>
</section>
