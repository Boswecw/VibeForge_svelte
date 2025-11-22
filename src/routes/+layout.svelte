<script lang="ts">
  /**
   * Root Layout for VibeForge V2
   * Includes TopBar, LeftRailNav, StatusBar, CommandPalette, and Shortcuts
   */

  import "../app.css";
  import { TopBar, LeftRailNav, StatusBar } from "$lib/ui/layout";
  import CommandPalette from "$lib/ui/CommandPalette.svelte";
  import ShortcutsCheatSheet from "$lib/ui/ShortcutsCheatSheet.svelte";
  import ToastContainer from "$lib/ui/ToastContainer.svelte";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { initializeDemoData } from "$lib/core/utils/demoData";
  import { presets } from "$lib/stores/presets";
  import { paletteStore } from "$lib/stores/palette";
  import { shortcutManager } from "$lib/core/shortcuts";
  import type { Command } from "$lib/stores/palette";
  import { initAuth, isAuthenticated, currentUser } from "$lib/auth";

  let showShortcuts = $state(false);
  let sidebarVisible = $state(true);
  let isLoginPage = $derived($page.url.pathname === "/login");

  // Initialize auth and check authentication
  onMount(() => {
    // Initialize authentication state
    initAuth();

    // Check authentication status
    const unsubscribe = isAuthenticated.subscribe((authenticated) => {
      const currentPath = window.location.pathname;

      // Redirect to login if not authenticated and not already on login page
      if (!authenticated && currentPath !== "/login") {
        goto("/login");
      }
    });

    // Initialize demo data
    initializeDemoData();

    // Load prompts from API
    presets.load().catch((err) => {
      console.error("Failed to load prompts:", err);
    });

    return unsubscribe;

    // Register global commands
    registerCommands();

    // Register global shortcuts
    registerShortcuts();
  });

  function registerCommands() {
    const commands: Command[] = [
      {
        id: "new-prompt",
        name: "New Prompt",
        description: "Create a new prompt from scratch",
        category: "Editing",
        icon: "✨",
        keywords: ["create", "add"],
        handler: () => {
          // TODO: Implement new prompt creation
          console.log("New prompt");
        },
      },
      {
        id: "duplicate-prompt",
        name: "Duplicate Prompt",
        description: "Create a copy of the current prompt",
        category: "Editing",
        icon: "📋",
        shortcut: ["meta", "d"],
        keywords: ["copy", "clone"],
        handler: async () => {
          const selectedPreset = $presets.selectedPreset;
          if (selectedPreset) {
            const duplicate = await presets.duplicatePreset(selectedPreset.id);
            if (duplicate) {
              presets.selectedPreset.set(duplicate);
            }
          }
        },
      },
      {
        id: "save-prompt",
        name: "Save Prompt",
        description: "Save current prompt version",
        category: "Editing",
        icon: "💾",
        shortcut: ["meta", "s"],
        keywords: ["save", "snapshot"],
        handler: () => {
          // Already handled in PromptEditor
          console.log("Save prompt");
        },
      },
      {
        id: "run-prompt",
        name: "Execute Prompt",
        description: "Run the current prompt",
        category: "Execution",
        icon: "▶️",
        shortcut: ["meta", "enter"],
        keywords: ["execute", "run", "play"],
        handler: () => {
          // Already handled in PromptEditor
          window.dispatchEvent(
            new CustomEvent("run-prompt", { bubbles: true })
          );
        },
      },
      {
        id: "show-shortcuts",
        name: "Show Keyboard Shortcuts",
        description: "View all available shortcuts",
        category: "General",
        icon: "⌨️",
        shortcut: ["meta", "/"],
        keywords: ["help", "keys", "hotkeys"],
        handler: () => {
          showShortcuts = true;
        },
      },
      {
        id: "open-settings",
        name: "Open Settings",
        description: "Configure VibeForge settings",
        category: "General",
        icon: "⚙️",
        keywords: ["preferences", "config"],
        handler: () => {
          // TODO: Navigate to settings
          console.log("Open settings");
        },
      },
      {
        id: "toggle-sidebar",
        name: "Toggle Sidebar",
        description: "Show or hide the left sidebar",
        category: "View",
        icon: "📱",
        shortcut: ["meta", "b"],
        keywords: ["sidebar", "panel", "hide"],
        handler: () => {
          sidebarVisible = !sidebarVisible;
        },
      },
      {
        id: "focus-editor",
        name: "Focus Editor",
        description: "Move cursor to the prompt editor",
        category: "Navigation",
        icon: "🎯",
        shortcut: ["meta", "e"],
        keywords: ["editor", "focus", "cursor"],
        handler: () => {
          // Focus the Monaco editor
          const event = new CustomEvent("focus-editor", { bubbles: true });
          window.dispatchEvent(event);
        },
      },
      {
        id: "find-in-editor",
        name: "Find in Editor",
        description: "Open find dialog in editor",
        category: "Navigation",
        icon: "🔍",
        shortcut: ["meta", "f"],
        keywords: ["find", "search"],
        handler: () => {
          // Monaco's native find will handle this
          const event = new CustomEvent("find-in-editor", { bubbles: true });
          window.dispatchEvent(event);
        },
      },
    ];

    paletteStore.registerCommands(commands);
  }

  function registerShortcuts() {
    // Cmd+K - Open command palette
    shortcutManager.register({
      id: "open-palette",
      name: "Open Command Palette",
      description: "Quick access to all commands",
      category: "navigation",
      shortcut: ["meta", "k"],
      handler: () => paletteStore.toggle(),
    });

    // Cmd+D - Duplicate prompt
    shortcutManager.register({
      id: "duplicate-prompt",
      name: "Duplicate Prompt",
      description: "Create a copy of the current prompt",
      category: "editing",
      shortcut: ["meta", "d"],
      handler: async () => {
        const current = $presets;
        // Get the selected preset (would need to be tracked in app state)
        // For now, just log
        console.log("Duplicate shortcut pressed");
      },
    });

    // Cmd+/ - Show shortcuts
    shortcutManager.register({
      id: "show-shortcuts",
      name: "Show Keyboard Shortcuts",
      description: "View all available shortcuts",
      category: "general",
      shortcut: ["meta", "/"],
      handler: () => {
        showShortcuts = true;
      },
    });

    // Cmd+B - Toggle sidebar
    shortcutManager.register({
      id: "toggle-sidebar",
      name: "Toggle Sidebar",
      description: "Show or hide the left sidebar",
      category: "view",
      shortcut: ["meta", "b"],
      handler: () => {
        sidebarVisible = !sidebarVisible;
      },
    });

    // Cmd+E - Focus editor
    shortcutManager.register({
      id: "focus-editor",
      name: "Focus Editor",
      description: "Move cursor to the prompt editor",
      category: "navigation",
      shortcut: ["meta", "e"],
      handler: () => {
        const event = new CustomEvent("focus-editor", { bubbles: true });
        window.dispatchEvent(event);
      },
    });

    // Cmd+Shift+P - Open command palette (alternate)
    shortcutManager.register({
      id: "open-palette-alt",
      name: "Open Command Palette",
      description: "Quick access to all commands (alternate)",
      category: "navigation",
      shortcut: ["meta", "shift", "p"],
      handler: () => paletteStore.toggle(),
    });
  }

  function handleGlobalKeyDown(event: KeyboardEvent) {
    shortcutManager.handleKeyDown(event);
  }
</script>

<svelte:window onkeydown={handleGlobalKeyDown} />

{#if isLoginPage}
  <!-- Login page - no app shell -->
  <slot />
{:else}
  <!-- VibeForge V2 App Shell -->
  <div class="min-h-screen flex flex-col bg-forge-blacksteel text-slate-100">
    <!-- Top Bar -->
    <TopBar />

    <!-- Main Content Area: LeftRail + Page Content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left Rail Navigation -->
      {#if sidebarVisible}
        <LeftRailNav />
      {/if}

      <!-- Page Content (slot) -->
      <main class="flex-1 flex flex-col overflow-hidden">
        <slot />
      </main>
    </div>

    <!-- Status Bar -->
    <StatusBar />
  </div>

  <!-- Global Overlays -->
  <CommandPalette />
  <ShortcutsCheatSheet
    isOpen={showShortcuts}
    onClose={() => (showShortcuts = false)}
  />
  <ToastContainer />
{/if}
