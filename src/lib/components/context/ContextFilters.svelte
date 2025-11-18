<script lang="ts">
  import { theme } from '$lib/stores/themeStore';

  type ContextType = 'design-system' | 'project-spec' | 'code-summary' | 'style-guide' | 'knowledge-pack';

  interface Props {
    searchQuery: string;
    selectedType: ContextType | 'all';
    selectedTags: string[];
    allTags: string[];
  }

  let { searchQuery = $bindable(), selectedType = $bindable(), selectedTags = $bindable(), allTags }: Props = $props();

  const typeOptions: Array<{ value: ContextType | 'all'; label: string }> = [
    { value: 'all', label: 'All Types' },
    { value: 'design-system', label: 'Design System' },
    { value: 'project-spec', label: 'Project Spec' },
    { value: 'code-summary', label: 'Code Summary' },
    { value: 'style-guide', label: 'Style Guide' },
    { value: 'knowledge-pack', label: 'Knowledge Pack' }
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter((t) => t !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }
  };

  const clearAllFilters = () => {
    searchQuery = '';
    selectedType = 'all';
    selectedTags = [];
  };
</script>

<!-- Filters panel: search, type filter, and tag selection -->
<section class={`rounded-lg border p-4 flex flex-col gap-3 transition-colors ${
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
    {#if searchQuery || selectedType !== 'all' || selectedTags.length > 0}
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
      placeholder="Search by name, summary, or tags..."
      class={`w-full px-3 py-1.5 rounded-md border text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
        $theme === 'dark'
          ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder-slate-500'
          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
      }`}
      bind:value={searchQuery}
    />
  </div>

  <!-- Type filter (segmented buttons) -->
  <div>
    <label class={`block text-xs mb-1.5 ${
      $theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
    }`}>
      Type
    </label>
    <div class="flex flex-wrap gap-1.5">
      {#each typeOptions as option}
        <button
          type="button"
          class={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            selectedType === option.value
              ? $theme === 'dark'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
              : $theme === 'dark'
                ? 'bg-slate-950 text-slate-400 border border-slate-700 hover:bg-slate-800'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
          onclick={() => (selectedType = option.value)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Tag chips (scrollable) -->
  {#if allTags.length > 0}
    <div>
      <label class={`block text-xs mb-1.5 ${
        $theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
      }`}>
        Tags
        {#if selectedTags.length > 0}
          <span class={$theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}>
            ({selectedTags.length} selected)
          </span>
        {/if}
      </label>
      <div class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
        {#each allTags as tag}
          {@const isSelected = selectedTags.includes(tag)}
          <button
            type="button"
            class={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium transition-colors ${
              isSelected
                ? $theme === 'dark'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
                : $theme === 'dark'
                  ? 'bg-slate-950 text-slate-400 border-slate-700 hover:bg-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            onclick={() => toggleTag(tag)}
          >
            {tag}
            {#if isSelected}
              <span class="ml-1">✓</span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</section>
