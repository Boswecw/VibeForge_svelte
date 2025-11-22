import { writable, derived } from "svelte/store";
import type { ContextBlock } from "$lib/types/context";
import * as dataforgeClient from "$lib/core/api/dataforgeClient";

const initialContexts: ContextBlock[] = [
  {
    id: "ctx-system-vibeforge",
    title: "VibeForge System Instructions",
    kind: "system",
    description:
      "Global rules for VibeForge: prompt workbench, not chat UI. 3-column layout: Context | Prompt | Output. No marketing fluff.",
    tags: ["system", "vibeforge", "rules"],
    isActive: true,
    lastUpdated: new Date().toISOString(),
    source: "global",
  },
  {
    id: "ctx-design-forge-theme",
    title: "Forge Design System",
    kind: "design",
    description:
      "Forge identity: dark forged metals, ember accent, 3-column workbench, low cognitive load, professional tone.",
    tags: ["design-system", "forge", "theme"],
    isActive: true,
    lastUpdated: new Date().toISOString(),
    source: "workspace",
  },
  {
    id: "ctx-project-authorforge",
    title: "AuthorForge Project Context",
    kind: "project",
    description:
      "AuthorForge: professional writing app with Forge-themed modules (Hearth, Foundry, Smithy, Anvil, Bloom, Lore).",
    tags: ["authorforge", "project"],
    isActive: false,
    lastUpdated: new Date().toISOString(),
    source: "workspace",
  },
  {
    id: "ctx-code-review",
    title: "Code Review Pattern",
    kind: "code",
    description:
      "Detailed code review context optimized for vibe coding and due diligence on complex repos.",
    tags: ["code-review", "pattern"],
    isActive: false,
    lastUpdated: new Date().toISOString(),
    source: "local",
  },
];

function createContextStore() {
  const { subscribe, update, set } = writable<ContextBlock[]>(initialContexts);

  return {
    subscribe,
    // Load contexts from DataForge backend
    loadContexts: async (workspaceId?: string) => {
      try {
        const response = await dataforgeClient.listContextBlocks(workspaceId);
        if (response.success && response.data) {
          set(response.data.items);
        }
      } catch (error) {
        console.error("Failed to load contexts from DataForge:", error);
        // Keep using initial/cached contexts on error
      }
    },
    toggleActive: (id: string) =>
      update((list) =>
        list.map((ctx) =>
          ctx.id === id ? { ...ctx, isActive: !ctx.isActive } : ctx
        )
      ),
    setActiveOnly: (ids: string[]) =>
      update((list) =>
        list.map((ctx) => ({ ...ctx, isActive: ids.includes(ctx.id) }))
      ),
    updateContext: (updated: ContextBlock) =>
      update((list) =>
        list.map((ctx) => (ctx.id === updated.id ? updated : ctx))
      ),
  };
}

export const contexts = createContextStore();

export const activeContexts = derived(contexts, ($contexts) =>
  $contexts.filter((c) => c.isActive)
);

export const inactiveContexts = derived(contexts, ($contexts) =>
  $contexts.filter((c) => !c.isActive)
);
