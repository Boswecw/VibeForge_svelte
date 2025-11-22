/**
 * VibeForge - Keyboard Shortcuts Manager
 *
 * Centralized keyboard shortcut handling for the application.
 */

export interface ShortcutAction {
  id: string;
  name: string;
  description: string;
  category: string;
  shortcut: string[];
  handler: () => void;
  icon?: string;
}

export interface ShortcutCategory {
  id: string;
  name: string;
  shortcuts: ShortcutAction[];
}

class ShortcutManager {
  private shortcuts: Map<string, ShortcutAction> = new Map();
  private listeners: Set<(event: KeyboardEvent) => void> = new Set();

  /**
   * Register a keyboard shortcut
   */
  register(action: ShortcutAction) {
    const key = this.getShortcutKey(action.shortcut);
    this.shortcuts.set(key, action);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(shortcut: string[]) {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.delete(key);
  }

  /**
   * Handle keyboard event
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    const key = this.getEventKey(event);
    const action = this.shortcuts.get(key);

    if (action) {
      event.preventDefault();
      event.stopPropagation();
      action.handler();
      return true;
    }

    return false;
  }

  /**
   * Get shortcut key from array
   */
  private getShortcutKey(shortcut: string[]): string {
    return shortcut
      .map((k) => k.toLowerCase())
      .sort()
      .join("+");
  }

  /**
   * Get key from keyboard event
   */
  private getEventKey(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey) parts.push("ctrl");
    if (event.metaKey) parts.push("meta");
    if (event.altKey) parts.push("alt");
    if (event.shiftKey) parts.push("shift");

    const key = event.key.toLowerCase();
    if (!["control", "meta", "alt", "shift"].includes(key)) {
      parts.push(key);
    }

    return parts.sort().join("+");
  }

  /**
   * Get all registered shortcuts grouped by category
   */
  getShortcutsByCategory(): ShortcutCategory[] {
    const categories = new Map<string, ShortcutAction[]>();

    for (const action of this.shortcuts.values()) {
      if (!categories.has(action.category)) {
        categories.set(action.category, []);
      }
      categories.get(action.category)!.push(action);
    }

    return Array.from(categories.entries()).map(([id, shortcuts]) => ({
      id,
      name: this.getCategoryName(id),
      shortcuts,
    }));
  }

  /**
   * Get all registered shortcuts
   */
  getAllShortcuts(): ShortcutAction[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Format shortcut for display
   */
  formatShortcut(shortcut: string[]): string {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

    return shortcut
      .map((key) => {
        switch (key.toLowerCase()) {
          case "meta":
            return isMac ? "⌘" : "Win";
          case "ctrl":
            return isMac ? "⌃" : "Ctrl";
          case "alt":
            return isMac ? "⌥" : "Alt";
          case "shift":
            return isMac ? "⇧" : "Shift";
          case "enter":
            return "↵";
          case "escape":
            return "Esc";
          case "backspace":
            return "⌫";
          case "delete":
            return "Del";
          default:
            return key.toUpperCase();
        }
      })
      .join(isMac ? "" : "+");
  }

  /**
   * Get category display name
   */
  private getCategoryName(id: string): string {
    const names: Record<string, string> = {
      editing: "Editing",
      navigation: "Navigation",
      execution: "Execution",
      search: "Search",
      general: "General",
    };
    return names[id] || id;
  }

  /**
   * Clear all shortcuts
   */
  clear() {
    this.shortcuts.clear();
  }
}

// Global shortcut manager instance
export const shortcutManager = new ShortcutManager();
