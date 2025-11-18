<script lang="ts">
  import { page } from '$app/stores';

  const navItems = [
    { label: 'Workbench', icon: '⚒️', href: '/' },
    { label: 'Context Library', icon: '📚', href: '/contexts' },
    { label: 'Patterns & Recipes', icon: '🧩', href: '/patterns' },
    { label: 'History', icon: '🕒', href: '/history' },
    { label: 'Evaluations', icon: '📊', href: '/evals' },
    { label: 'Settings', icon: '⚙️', href: '/settings' }
  ];
</script>

<nav class="w-56 border-r border-forge-line bg-forge-gunmetal/80 flex flex-col">
  <div class="flex-1 overflow-y-auto py-3">
    <ul class="space-y-1 px-2">
      {#each navItems as item}
        <li>
          <a
            href={item.href}
            class="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs
              {$page.url.pathname === item.href
                ? 'bg-forge-steel text-forge-textBright shadow-ember'
                : 'text-forge-textDim hover:bg-forge-steel/60 hover:text-forge-textBright'}"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </a>
        </li>
      {/each}
    </ul>
  </div>

  <div
    class="border-t border-forge-line p-2 text-[11px] text-forge-textMuted flex flex-col gap-1"
  >
    <button
      class="w-full text-left px-2 py-1 rounded-md hover:bg-forge-steel/60 text-xs"
    >
      + New Workspace
    </button>
    <span class="text-[10px]">VibeForge • Forge Suite</span>
    <span class="text-[10px]">v0.1.0 • Internal</span>
  </div>
</nav>
