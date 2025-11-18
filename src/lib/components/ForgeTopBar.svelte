<script lang="ts">
  let darkMode = $state(true);

  const toggleTheme = () => {
    darkMode = !darkMode;
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', darkMode);
    }
  };

  // Force dark mode on first load
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      document.documentElement.classList.add('dark');
    });
  }
</script>

<header
  class="flex items-center justify-between px-4 py-3 border-b border-forge-line bg-forge-gunmetal/80 backdrop-blur"
>
  <div class="flex items-center gap-3">
    <div
      class="h-8 w-8 rounded-md bg-gradient-to-br from-forge-ember to-forge-emberHover shadow-ember flex items-center justify-center text-black font-bold"
    >
      VF
    </div>
    <div class="flex flex-col">
      <span class="text-sm font-semibold tracking-wide">VibeForge</span>
      <span class="text-xs text-forge-textMuted">Prompt Workbench</span>
    </div>
  </div>

  <div class="flex items-center gap-3 text-xs">
    <button
      type="button"
      class="px-2.5 py-1 rounded-md border border-forge-line bg-forge-steel/60 hover:bg-forge-steel transition"
    >
      Workspace: Default
    </button>
    <button
      type="button"
      class="px-2.5 py-1 rounded-md border border-forge-line bg-forge-steel/60 hover:bg-forge-steel transition"
      onclick={toggleTheme}
    >
      {darkMode ? "Dark" : "Light"}
    </button>
    <div
      class="h-8 w-8 rounded-full bg-forge-steel flex items-center justify-center text-[10px]"
    >
      CB
    </div>
  </div>
</header>
