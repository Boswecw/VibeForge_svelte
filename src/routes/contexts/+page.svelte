<script lang="ts">
  import ContextLibraryHeader from "$lib/components/context/ContextLibraryHeader.svelte";
  import ContextFilters from "$lib/components/context/ContextFilters.svelte";
  import ContextList from "$lib/components/context/ContextList.svelte";
  import ContextDetailPanel from "$lib/components/context/ContextDetailPanel.svelte";
  import UploadIngestModal from "$lib/components/ingest/UploadIngestModal.svelte";
  import IngestQueuePanel from "$lib/components/ingest/IngestQueuePanel.svelte";
  import { theme } from "$lib/stores/themeStore";

  // Mock context block type definitions
  type ContextType =
    | "design-system"
    | "project-spec"
    | "code-summary"
    | "style-guide"
    | "knowledge-pack";
  type ContextSize = "small" | "medium" | "large";

  interface ContextBlock {
    id: string;
    name: string;
    type: ContextType;
    tags: string[];
    updatedAt: string;
    size: ContextSize;
    summary: string;
    project?: string;
    previewContent: string;
  }

  // Mock data for context blocks
  const allContextBlocks: ContextBlock[] = [
    {
      id: "ctx-001",
      name: "AuthorForge Design System",
      type: "design-system",
      tags: ["UI", "Tailwind", "Components", "AuthorForge"],
      updatedAt: "2 hours ago",
      size: "large",
      summary:
        "Complete design system for AuthorForge including color palette, typography, component patterns, and layout guidelines. Covers both Dark and Light modes.",
      project: "AuthorForge",
      previewContent: `# AuthorForge Design System

## Color Palette
- Primary: Amber (#FBBF24)
- Dark BG: Slate-950 (#0B0F17)
- Light BG: Slate-50 (#F8FAFC)

## Typography
- Headings: font-semibold tracking-tight
- Body: text-sm leading-relaxed
- Code: font-mono text-xs

## Component Patterns
- Cards: rounded-lg border with theme-aware backgrounds
- Buttons: px-4 py-2 rounded-md with hover states
- Inputs: border focus:ring-2 focus:ring-amber-500`,
    },
    {
      id: "ctx-002",
      name: "VibeForge Technical Spec",
      type: "project-spec",
      tags: ["SvelteKit", "Tailwind", "Architecture", "VibeForge"],
      updatedAt: "1 day ago",
      size: "large",
      summary:
        "Technical specification for VibeForge prompt workbench. Includes architecture decisions, data models, component hierarchy, and integration points.",
      project: "VibeForge",
      previewContent: `# VibeForge Technical Specification

## Tech Stack
- Framework: SvelteKit + Svelte 5
- Styling: Tailwind CSS v4
- Type Safety: TypeScript
- State: Svelte stores with localStorage persistence

## Core Features
1. Context management (library + active contexts)
2. Prompt editor with token estimation
3. Multi-model run execution
4. Output comparison and history
5. Pattern library and recipes

## Architecture
- Route-based pages with shared layout
- Store-based state management
- Theme system with Dark/Light modes`,
    },
    {
      id: "ctx-003",
      name: "Svelte 5 Best Practices",
      type: "knowledge-pack",
      tags: ["Svelte", "Patterns", "Best Practices"],
      updatedAt: "3 days ago",
      size: "medium",
      summary:
        "Compilation of Svelte 5 best practices including runes ($state, $derived, $effect), reactivity patterns, and component composition strategies.",
      previewContent: `# Svelte 5 Best Practices

## Runes
- Use $state() for reactive variables
- Use $derived() for computed values
- Use $effect() for side effects
- Avoid mixing runes with legacy reactive declarations

## Component Patterns
- Keep components small and focused
- Use props for data down, events for data up
- Leverage context API for deep prop drilling
- Export functions for imperative APIs

## Performance
- Minimize reactive dependencies
- Use keyed each blocks for lists
- Debounce expensive operations`,
    },
    {
      id: "ctx-004",
      name: "Tailwind v4 Migration Guide",
      type: "code-summary",
      tags: ["Tailwind", "Migration", "CSS"],
      updatedAt: "5 days ago",
      size: "small",
      summary:
        "Quick reference for migrating from Tailwind v3 to v4, covering CSS syntax changes, theme configuration, and plugin integration.",
      previewContent: `# Tailwind v4 Migration

## Key Changes
1. CSS-first configuration with @import and @theme
2. Remove tailwind.config.js (use CSS @theme instead)
3. Add @tailwindcss/vite plugin to vite.config

## Before (v3)
@tailwind base;
@tailwind components;
@tailwind utilities;

## After (v4)
@import "tailwindcss";

@theme {
  --color-primary: #FBBF24;
}`,
    },
    {
      id: "ctx-005",
      name: "API Response Handling Patterns",
      type: "code-summary",
      tags: ["TypeScript", "Error Handling", "API"],
      updatedAt: "1 week ago",
      size: "medium",
      summary:
        "Common patterns for handling API responses, errors, loading states, and type-safe data fetching in TypeScript applications.",
      project: "Shared",
      previewContent: `# API Response Patterns

## Type-Safe Fetch
interface ApiResponse<T> {
  data?: T;
  error?: string;
  loading: boolean;
}

async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
    const data = await response.json();
    return { data, loading: false };
  } catch (error) {
    return { error: error.message, loading: false };
  }
}`,
    },
    {
      id: "ctx-006",
      name: "Forge Suite Style Guide",
      type: "style-guide",
      tags: ["Writing", "Tone", "Voice", "Forge"],
      updatedAt: "2 weeks ago",
      size: "small",
      summary:
        "Editorial style guide for Forge Suite products. Covers tone of voice, terminology, UI copy patterns, and brand voice guidelines.",
      previewContent: `# Forge Suite Style Guide

## Tone of Voice
- Professional yet approachable
- Technically accurate without jargon
- Concise and action-oriented
- Helpful, not prescriptive

## UI Copy Patterns
- Buttons: Verb + Noun (e.g., "Run Prompt", "Send to Workbench")
- Empty states: Explain what + why + next action
- Error messages: What happened + how to fix

## Terminology
- "Context blocks" not "contexts" or "snippets"
- "Workbench" not "workspace" or "playground"
- "Run" a prompt, "Execute" is too formal`,
    },
    {
      id: "ctx-007",
      name: "Dark Mode Color Theory",
      type: "design-system",
      tags: ["Design", "Color", "Accessibility", "Dark Mode"],
      updatedAt: "2 weeks ago",
      size: "small",
      summary:
        "Principles and practices for designing effective dark mode color schemes with proper contrast ratios and visual hierarchy.",
      previewContent: `# Dark Mode Color Theory

## Principles
1. Not pure black - use dark grays (slate-950, gunmetal)
2. Reduce contrast compared to light mode
3. Use warm grays for text, not pure white
4. Accent colors slightly desaturated

## Contrast Ratios (WCAG AA)
- Body text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI elements: 3:1 minimum

## VibeForge Palette
- Background: slate-950 (#0B0F17)
- Panels: slate-900 (#111827)
- Text primary: slate-100
- Text muted: slate-400`,
    },
    {
      id: "ctx-008",
      name: "LLM Prompt Engineering Patterns",
      type: "knowledge-pack",
      tags: ["LLM", "Prompting", "Patterns"],
      updatedAt: "3 weeks ago",
      size: "large",
      summary:
        "Collection of proven prompt engineering patterns including chain-of-thought, few-shot learning, role prompting, and structured output techniques.",
      previewContent: `# LLM Prompt Engineering Patterns

## Chain of Thought
Encourage step-by-step reasoning:
"Let's think through this step by step..."

## Few-Shot Learning
Provide 2-3 examples before the task:
Example 1: Input → Output
Example 2: Input → Output
Now you try: [Your input]

## Role Prompting
"You are an expert TypeScript developer..."

## Structured Output
"Respond in JSON format with keys: summary, steps, code"

## Context Injection
Prepend relevant documentation, specs, or examples
before the main instruction.`,
    },
  ];

  // Document ingestion types
  interface IngestDocument {
    id: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    title: string;
    workspace: string;
    category: "reference" | "docs" | "code" | "research" | "other";
    tags: string[];
    status: "queued" | "processing" | "ready" | "error";
    createdAt: string;
    updatedAt: string;
    errorMessage?: string;
  }

  // Local state for filters and selection
  let searchQuery = $state("");
  let selectedType = $state<ContextType | "all">("all");
  let selectedTags = $state<string[]>([]);
  let activeContextId = $state<string | null>(null);

  // Ingest modal and queue state
  let isUploadOpen = $state(false);
  let ingestQueue = $state<IngestDocument[]>([]);

  // Derive all unique tags from the data
  const allTags = $derived.by(() => {
    const tagSet = new Set<string>();
    allContextBlocks.forEach((block) => {
      block.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  });

  // Filtered context blocks based on search, type, and tags
  const filteredBlocks = $derived.by(() => {
    return allContextBlocks.filter((block) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          block.name.toLowerCase().includes(query) ||
          block.summary.toLowerCase().includes(query) ||
          block.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Type filter
      if (selectedType !== "all" && block.type !== selectedType) {
        return false;
      }

      // Tag filter (if any tags selected, block must have at least one)
      if (selectedTags.length > 0) {
        const hasSelectedTag = selectedTags.some((tag) =>
          block.tags.includes(tag)
        );
        if (!hasSelectedTag) return false;
      }

      return true;
    });
  });

  // Get the active context block
  const activeBlock = $derived.by(() => {
    if (!activeContextId) return null;
    return allContextBlocks.find((b) => b.id === activeContextId) ?? null;
  });

  // Handler for selecting a context block
  const selectBlock = (id: string) => {
    activeContextId = id;
  };

  // Handler for ingesting documents
  const handleIngest = (docs: IngestDocument[]) => {
    ingestQueue = [...ingestQueue, ...docs];
    isUploadOpen = false;
    console.log(
      `Ingested ${docs.length} document(s). Queue now has ${ingestQueue.length} total.`
    );
  };

  // Handler for simulating progress on queue items
  const handleSimulateProgress = () => {
    ingestQueue = ingestQueue.map((doc) => {
      if (doc.status === "queued") {
        return {
          ...doc,
          status: "processing" as const,
          updatedAt: new Date().toISOString(),
        };
      }
      if (doc.status === "processing") {
        return {
          ...doc,
          status: "ready" as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return doc;
    });
  };

  // Handler for sending to workbench
  const sendToWorkbench = (block: ContextBlock) => {
    // TODO: Integrate with workbench context store
    // This would normally call something like:
    // contexts.add({ id: block.id, title: block.name, kind: mapTypeToKind(block.type), ... })
    console.log("Send to Workbench:", block.name);
    alert(
      `"${block.name}" will be added to active contexts in the Workbench (integration pending)`
    );
  };
</script>

<!-- Context Library main layout: filters + list (left), detail panel (right) -->
<main class="flex-1 overflow-auto">
  <div class="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
    <!-- Header with title, description, and stats -->
    <ContextLibraryHeader
      totalCount={allContextBlocks.length}
      filteredCount={filteredBlocks.length}
      onAddDocuments={() => (isUploadOpen = true)}
    />

    <!-- 2-column grid: left (filters + list), right (detail panel) -->
    <div
      class="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)] gap-4"
    >
      <!-- LEFT SIDE: Filters and list -->
      <div class="flex flex-col gap-4">
        <!-- Filters panel -->
        <ContextFilters
          bind:searchQuery
          bind:selectedType
          bind:selectedTags
          {allTags}
        />

        <!-- Context list -->
        <ContextList
          blocks={filteredBlocks}
          {activeContextId}
          onSelect={selectBlock}
        />
      </div>

      <!-- RIGHT SIDE: Detail panel -->
      <ContextDetailPanel
        block={activeBlock}
        onSendToWorkbench={sendToWorkbench}
      />
    </div>

    <!-- Ingest Queue Panel (below library UI) -->
    {#if ingestQueue.length > 0}
      <div
        class="mt-8 border-t {$theme === 'dark'
          ? 'border-slate-700'
          : 'border-slate-200'} pt-6"
      >
        <IngestQueuePanel
          {ingestQueue}
          onSimulateProgress={handleSimulateProgress}
        />
      </div>
    {/if}
  </div>
</main>

<!-- Upload Modal -->
<UploadIngestModal
  open={isUploadOpen}
  onClose={() => (isUploadOpen = false)}
  onIngest={handleIngest}
  workspace="default"
/>
