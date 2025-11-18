<script lang="ts">
  import { accessibility, type FontSize } from '$lib/stores/accessibilityStore';
  import { theme } from '$lib/stores/themeStore';
  import vibeIcon from '$lib/assets/vibe.avif';

  let showFontMenu = $state(false);

  const fontSizes: Array<{ value: FontSize; label: string }> = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'x-large', label: 'X-Large' }
  ];

  const setFontSize = (size: FontSize) => {
    accessibility.setFontSize(size);
    showFontMenu = false;
  };

  // Close menu when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.font-size-menu')) {
      showFontMenu = false;
    }
  };

  // Close menu on Escape key
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      showFontMenu = false;
    }
  };

  $effect(() => {
    if (showFontMenu && typeof document !== 'undefined') {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeydown);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleKeydown);
      };
    }
  });

</script>

<!-- Theme-aware top bar with dynamic styling based on theme -->
<header
  class={`flex items-center justify-between px-4 py-3 border-b transition-colors ${
    $theme === 'dark'
      ? 'border-forge-line bg-forge-gunmetal/80 backdrop-blur'
      : 'border-slate-200 bg-white/95 backdrop-blur'
  }`}
>
  <div class="flex items-center gap-3">
    <div class="h-10 w-10 rounded-md overflow-hidden flex items-center justify-center bg-white p-1">
      <img src={vibeIcon} alt="VibeForge" class="h-full w-full object-contain" />
    </div>
    <div class="flex flex-col">
      <span class={`text-sm font-semibold tracking-wide ${
        $theme === 'dark' ? 'text-forge-textBright' : 'text-slate-900'
      }`}>VibeForge</span>
      <span class={`text-xs ${
        $theme === 'dark' ? 'text-forge-textMuted' : 'text-slate-500'
      }`}>Prompt Workbench</span>
    </div>
  </div>

  <div class="flex items-center gap-3 text-xs">
    <button
      type="button"
      class={`px-2.5 py-1 rounded-md border transition ${
        $theme === 'dark'
          ? 'border-forge-line bg-forge-steel/60 hover:bg-forge-steel text-forge-textDim'
          : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
      }`}
    >
      Workspace: Default
    </button>

    <!-- Font Size Control -->
    <div class="relative font-size-menu">
      <button
        type="button"
        class={`px-2.5 py-1 rounded-md border transition flex items-center gap-1 ${
          $theme === 'dark'
            ? 'border-forge-line bg-forge-steel/60 hover:bg-forge-steel text-forge-textDim'
            : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
        }`}
        onclick={() => showFontMenu = !showFontMenu}
        title="Font Size (Accessibility)"
      >
        <span class="text-sm">A</span>
        <span class="text-xs">▾</span>
      </button>

      {#if showFontMenu}
        <div class={`absolute right-0 mt-1 w-32 border rounded-md shadow-lg z-50 animate-fadeIn ${
          $theme === 'dark'
            ? 'bg-forge-gunmetal border-forge-line'
            : 'bg-white border-slate-200'
        }`}>
          {#each fontSizes as { value, label }}
            <button
              type="button"
              class={`w-full px-3 py-2 text-left text-xs transition flex items-center justify-between first:rounded-t-md last:rounded-b-md ${
                $theme === 'dark'
                  ? 'hover:bg-forge-steel text-forge-textDim'
                  : 'hover:bg-slate-50 text-slate-700'
              } ${
                $accessibility.fontSize === value
                  ? $theme === 'dark'
                    ? 'bg-forge-steel text-forge-ember'
                    : 'bg-amber-50 text-amber-600'
                  : ''
              }`}
              onclick={() => setFontSize(value)}
            >
              {label}
              {#if $accessibility.fontSize === value}
                <span class={$theme === 'dark' ? 'text-forge-ember' : 'text-amber-600'}>✓</span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Theme Toggle Button -->
    <button
      type="button"
      class={`px-2.5 py-1 rounded-md border transition flex items-center gap-1.5 ${
        $theme === 'dark'
          ? 'border-forge-line bg-forge-steel/60 hover:bg-forge-steel text-forge-textDim'
          : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
      }`}
      onclick={() => theme.toggle()}
      title="Toggle theme"
    >
      {#if $theme === 'dark'}
        <span class="text-sm">🌙</span>
        <span>Dark</span>
      {:else}
        <span class="text-sm">☀️</span>
        <span>Light</span>
      {/if}
    </button>
    <div
      class={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-semibold ${
        $theme === 'dark'
          ? 'bg-forge-steel text-forge-textDim'
          : 'bg-slate-200 text-slate-700'
      }`}
    >
      CB
    </div>
  </div>
</header>
