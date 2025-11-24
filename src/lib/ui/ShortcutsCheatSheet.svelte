<script lang="ts">
  /**
   * ShortcutsCheatSheet - Modal showing all available keyboard shortcuts
   */

  import { shortcutManager } from "$lib/core/shortcuts";
  import Button from "$lib/ui/primitives/Button.svelte";

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  const categories = $derived(shortcutManager.getShortcutsByCategory());

  function handleBackdropClick() {
    onClose();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
    onclick={handleBackdropClick}
    role="presentation"
  />

  <!-- Modal -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
  >
    <div
      class="shortcuts-modal w-full max-w-4xl max-h-[80vh] bg-forge-steel border border-slate-700 rounded-lg shadow-2xl pointer-events-auto flex flex-col"
    >
      <!-- Header -->
      <div
        class="px-6 py-4 border-b border-slate-700 flex items-center justify-between"
      >
        <div>
          <h2 class="text-lg font-semibold text-slate-100">
            Keyboard Shortcuts
          </h2>
          <p class="text-sm text-slate-400 mt-0.5">
            Quick reference for all shortcuts
          </p>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-200 transition-colors"
          onclick={onClose}
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each categories as category}
            <div class="space-y-3">
              <h3
                class="text-sm font-medium text-slate-300 uppercase tracking-wider"
              >
                {category.name}
              </h3>
              <div class="space-y-2">
                {#each category.shortcuts as shortcut}
                  <div
                    class="flex items-start justify-between gap-4 p-2 rounded hover:bg-slate-700/30"
                  >
                    <div class="flex-1 min-w-0">
                      <div class="text-sm text-slate-200">{shortcut.name}</div>
                      {#if shortcut.description}
                        <div class="text-xs text-slate-400 mt-0.5">
                          {shortcut.description}
                        </div>
                      {/if}
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                      {#each shortcut.shortcut as key}
                        <kbd
                          class="px-2 py-1 text-xs bg-slate-800 text-slate-300 rounded font-mono"
                        >
                          {shortcutManager.formatShortcut([key])}
                        </kbd>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-slate-700 flex justify-end">
        <Button variant="secondary" onclick={onClose}>Close</Button>
      </div>
    </div>
  </div>
{/if}

<style>
  .shortcuts-modal {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
</style>
