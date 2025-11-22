<script lang="ts">
  /**
   * CommandPalette - Cmd+K command palette for quick actions
   */

  import { onMount } from "svelte";
  import { paletteStore, filteredCommands } from "$lib/stores/palette";
  import { shortcutManager } from "$lib/core/shortcuts";
  import type { Command } from "$lib/stores/palette";

  const paletteState = $derived($paletteStore);
  const commands = $derived($filteredCommands);

  let searchInput: HTMLInputElement | null = $state(null);

  // Focus search input when palette opens
  $effect(() => {
    if (paletteState.isOpen && searchInput) {
      searchInput.focus();
    }
  });

  function handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        paletteStore.close();
        break;
      case "ArrowUp":
        event.preventDefault();
        paletteStore.selectPrevious();
        break;
      case "ArrowDown":
        event.preventDefault();
        paletteStore.selectNext(commands.length - 1);
        break;
      case "Enter":
        event.preventDefault();
        executeSelected();
        break;
    }
  }

  function executeSelected() {
    const selected = commands[paletteState.selectedIndex];
    if (selected) {
      selected.handler();
      paletteStore.close();
    }
  }

  function executeCommand(command: Command) {
    command.handler();
    paletteStore.close();
  }

  function handleBackdropClick() {
    paletteStore.close();
  }
</script>

{#if paletteState.isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
    onclick={handleBackdropClick}
    role="presentation"
  />

  <!-- Palette -->
  <div
    class="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] pointer-events-none"
  >
    <div
      class="command-palette w-full max-w-2xl bg-forge-steel border border-slate-700 rounded-lg shadow-2xl pointer-events-auto animate-slideDown"
      onkeydown={handleKeyDown}
    >
      <!-- Search Input -->
      <div class="p-4 border-b border-slate-700">
        <div class="flex items-center gap-3">
          <!-- Search Icon -->
          <svg
            class="w-5 h-5 text-slate-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <!-- Input -->
          <input
            bind:this={searchInput}
            type="text"
            placeholder="Type a command or search..."
            class="flex-1 bg-transparent text-slate-100 placeholder-slate-500 outline-none text-sm"
            value={paletteState.query}
            oninput={(e) => paletteStore.setQuery(e.currentTarget.value)}
          />

          <!-- Close hint -->
          <kbd class="px-2 py-1 text-xs bg-slate-800 text-slate-400 rounded">
            Esc
          </kbd>
        </div>
      </div>

      <!-- Commands List -->
      <div class="max-h-96 overflow-y-auto">
        {#if commands.length === 0}
          <!-- Empty State -->
          <div class="p-8 text-center text-slate-500">
            <p class="text-sm">No commands found</p>
            <p class="text-xs mt-1">Try a different search term</p>
          </div>
        {:else}
          <div class="p-2">
            {#each commands as command, index}
              <button
                type="button"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors {index ===
                paletteState.selectedIndex
                  ? 'bg-blue-500/20 border border-blue-500/30'
                  : 'hover:bg-slate-700/50 border border-transparent'}"
                onclick={() => executeCommand(command)}
              >
                <!-- Icon -->
                {#if command.icon}
                  <span class="text-lg flex-shrink-0">{command.icon}</span>
                {:else}
                  <div class="w-5 h-5 flex-shrink-0" />
                {/if}

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-slate-200">
                    {command.name}
                  </div>
                  {#if command.description}
                    <div class="text-xs text-slate-400 truncate">
                      {command.description}
                    </div>
                  {/if}
                </div>

                <!-- Shortcut -->
                {#if command.shortcut}
                  <div class="flex items-center gap-1 flex-shrink-0">
                    {#each command.shortcut as key}
                      <kbd
                        class="px-1.5 py-0.5 text-xs bg-slate-800 text-slate-400 rounded"
                      >
                        {shortcutManager.formatShortcut([key])}
                      </kbd>
                    {/each}
                  </div>
                {/if}

                <!-- Category Badge -->
                <span
                  class="px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded flex-shrink-0"
                >
                  {command.category}
                </span>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div
        class="px-4 py-2 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500"
      >
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1">
            <kbd class="px-1.5 py-0.5 bg-slate-800 rounded">↑↓</kbd>
            Navigate
          </span>
          <span class="flex items-center gap-1">
            <kbd class="px-1.5 py-0.5 bg-slate-800 rounded">↵</kbd>
            Select
          </span>
        </div>
        <span>{commands.length} command{commands.length !== 1 ? "s" : ""}</span>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.15s ease-out;
  }

  .animate-slideDown {
    animation: slideDown 0.2s ease-out;
  }

  .command-palette {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
</style>
