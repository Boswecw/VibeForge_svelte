<!-- @component
no description yet
-->
<script lang="ts">
  import { page } from '$app/stores';
  import { theme } from '$lib/stores/themeStore';

  const navItems = [
    { label: 'Workbench', icon: '⚒️', href: '/' },
    { label: 'Quick Run', icon: '⚡', href: '/quick-run' },
    { label: 'Context Library', icon: '📚', href: '/contexts' },
    { label: 'Patterns & Recipes', icon: '🧩', href: '/patterns' },
    { label: 'History', icon: '🕒', href: '/history' },
    { label: 'Evaluations', icon: '📊', href: '/evals' },
    { label: 'Workspaces', icon: '📁', href: '/workspaces' },
    { label: 'Settings', icon: '⚙️', href: '/settings' }
  ];
</script>

<!-- Theme-aware side navigation -->
<nav class={`w-56 border-r flex flex-col transition-colors ${
  $theme === 'dark'
    ? 'border-forge-line bg-forge-gunmetal/80'
    : 'border-slate-200 bg-slate-50'
}`}>
  <div class="flex-1 overflow-y-auto py-3">
    <ul class="space-y-1 px-2">
      {#each navItems as item}
        {@const isActive = $page.url.pathname === item.href}
        <li>
          <a
            href={item.href}
            class={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
              isActive
                ? $theme === 'dark'
                  ? 'bg-forge-steel text-forge-textBright border-l-2 border-forge-ember shadow-ember'
                  : 'bg-amber-50 text-slate-900 border-l-2 border-amber-400'
                : $theme === 'dark'
                  ? 'text-forge-textDim hover:bg-forge-steel/60 hover:text-forge-textBright'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </a>
        </li>
      {/each}
    </ul>
  </div>

  <div
    class={`border-t p-2 text-[11px] flex flex-col gap-1 transition-colors ${
      $theme === 'dark'
        ? 'border-forge-line text-forge-textMuted'
        : 'border-slate-200 text-slate-500'
    }`}
  >
    <button
      class={`w-full text-left px-2 py-1 rounded-md text-xs transition-colors ${
        $theme === 'dark'
          ? 'hover:bg-forge-steel/60 text-forge-textDim'
          : 'hover:bg-white text-slate-600'
      }`}
    >
      + New Workspace
    </button>
    <span class="text-[10px]">VibeForge • Forge Suite</span>
    <span class="text-[10px]">v0.1.0 • Internal</span>
  </div>
</nav>
