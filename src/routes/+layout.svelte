<script lang="ts">
  import '../app.css';

  const navItems = [
    { label: 'Workbench', icon: '⚒️', href: '/', active: true },
    { label: 'Context Library', icon: '📚', href: '/contexts' },
    { label: 'Patterns & Recipes', icon: '🧩', href: '/patterns' },
    { label: 'History', icon: '🕒', href: '/history' },
    { label: 'Evaluations', icon: '📊', href: '/evals' },
    { label: 'Settings', icon: '⚙️', href: '/settings' }
  ];

  let darkMode = true;

  const toggleTheme = () => {
    darkMode = !darkMode;
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', darkMode);
    }
  };
</script>

<svelte:window on:load={() => {
  // Ensure dark mode by default on first load
  document.documentElement.classList.add('dark');
}} />

<div class:dark={darkMode} class="min-h-screen bg-forge-blacksteel text-forge-textBright flex flex-col">
  <!-- Top bar -->
  <header class="flex items-center justify-between px-4 py-3 border-b border-forge-line bg-forge-gunmetal/80 backdrop-blur">
    <div class="flex items-center gap-3">
      <div class="h-8 w-8 rounded-md bg-gradient-to-br from-forge-ember to-forge-emberHover shadow-ember flex items-center justify-center text-black font-bold">
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
        on:click={toggleTheme}
      >
        {darkMode ? 'Dark' : 'Light'}
      </button>
      <div class="h-8 w-8 rounded-full bg-forge-steel flex items-center justify-center text-[10px]">
        CB
      </div>
    </div>
  </header>

  <div class="flex flex-1 overflow-hidden">
    <!-- Left navigation -->
    <nav class="w-56 border-r border-forge-line bg-forge-gunmetal/80 flex flex-col">
      <div class="flex-1 overflow-y-auto py-3">
        <ul class="space-y-1 px-2">
          {#each navItems as item}
            <li>
              <a
                href={item.href}
                class="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs
                  {item.active
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

      <div class="border-t border-forge-line p-2 text-[11px] text-forge-textMuted flex flex-col gap-1">
        <button class="w-full text-left px-2 py-1 rounded-md hover:bg-forge-steel/60 text-xs">
          + New Workspace
        </button>
        <span class="text-[10px]">VibeForge • Forge Suite</span>
        <span class="text-[10px]">v0.1.0 • Internal</span>
      </div>
    </nav>

    <!-- Main content -->
    <main class="flex-1 flex flex-col bg-forge-blacksteel">
      <!-- Workbench header -->
      <div class="border-b border-forge-line px-4 py-3 flex items-center justify-between">
        <div class="flex flex-col gap-1">
          <h1 class="text-sm font-semibold">Workbench</h1>
          <p class="text-[11px] text-forge-textMuted">
            Context → Prompt → Output → Compare
          </p>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <select
            class="bg-forge-steel border border-forge-line rounded-md px-2 py-1 text-xs focus:outline-none"
          >
            <option>Claude 3.5 Sonnet</option>
            <option>GPT-5.1</option>
            <option>Local LLM</option>
          </select>
          <button class="px-3 py-1 rounded-md bg-forge-ember text-black text-xs font-semibold shadow-ember">
            Run Prompt
          </button>
        </div>
      </div>

      <!-- Three column layout -->
      <section class="flex-1 grid grid-cols-3 gap-3 p-3 overflow-hidden">
        <!-- Context column -->
        <div class="flex flex-col border border-forge-line rounded-lg bg-forge-gunmetal/60 overflow-hidden">
          <header class="px-3 py-2 border-b border-forge-line flex items-center justify-between">
            <span class="text-xs font-semibold">Context</span>
            <button class="text-[11px] text-forge-ember hover:underline">
              Manage
            </button>
          </header>
          <div class="flex-1 overflow-y-auto p-3 text-xs text-forge-textDim space-y-2">
            <p class="text-forge-textMuted">
              Add system prompts, design docs, project specs, and code summaries here.
              Active contexts will be applied to the prompt in the center column.
            </p>
            <div class="border border-dashed border-forge-line rounded-md p-2 text-[11px] text-forge-textMuted">
              + Drop in a context block or select from your library.
            </div>
          </div>
        </div>

        <!-- Prompt column -->
        <div class="flex flex-col border border-forge-line rounded-lg bg-forge-steel/70 overflow-hidden">
          <header class="px-3 py-2 border-b border-forge-line flex items-center justify-between">
            <span class="text-xs font-semibold">Prompt</span>
            <div class="flex items-center gap-2 text-[11px] text-forge-textMuted">
              <span>Tokens: ~0</span>
            </div>
          </header>
          <div class="flex-1 overflow-hidden p-3">
            <textarea
              class="w-full h-full bg-transparent border-none outline-none resize-none text-xs leading-relaxed"
              placeholder="Write or assemble your prompt here. Context from the left column will be prepended or merged depending on your mode..."
            ></textarea>
          </div>
        </div>

        <!-- Output column -->
        <div class="flex flex-col border border-forge-line rounded-lg bg-forge-gunmetal/60 overflow-hidden">
          <header class="px-3 py-2 border-b border-forge-line flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <button class="px-2 py-1 rounded-md bg-forge-steel text-forge-textBright text-[11px]">
                Primary
              </button>
              <button class="px-2 py-1 rounded-md text-forge-textDim text-[11px] hover:bg-forge-steel/60">
                Compare
              </button>
            </div>
            <span class="text-[11px] text-forge-textMuted">No runs yet</span>
          </header>
          <div class="flex-1 overflow-y-auto p-3 text-xs text-forge-textMuted">
            Model outputs will appear here with tools for comparison, scoring, and saving.
          </div>
        </div>
      </section>

      <!-- Status bar -->
      <footer class="h-7 border-t border-forge-line text-[11px] text-forge-textMuted px-3 flex items-center justify-between">
        <span>Ready • No active runs</span>
        <span>Workspace: Default • Forge Theme: Dark</span>
      </footer>
    </main>
  </div>
</div>
