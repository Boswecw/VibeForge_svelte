import { writable, derived } from "svelte/store";
import * as promptsClient from "$lib/core/api/promptsClient";
import type { Prompt as ApiPrompt } from "$lib/core/api/promptsClient";

export type PresetCategory =
  | "coding"
  | "writing"
  | "analysis"
  | "evaluation"
  | "other";

export interface ContextRef {
  id: string;
  label: string;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  workspace: string;
  tags: string[];
  basePrompt: string;
  contextRefs: ContextRef[];
  models: string[];
  pinned: boolean;
  updatedAt: string;
}

// Mock presets data
const mockPresets: Preset[] = [
  {
    id: "preset-1",
    name: "Story Beat Expander",
    description:
      "Expand a story outline into detailed beats with character arcs.",
    category: "writing",
    workspace: "AuthorForge",
    tags: ["story", "outline", "Claude-first"],
    basePrompt: `You are a creative writing assistant specializing in story structure.

Given a brief plot outline, expand it into detailed story beats with:
- Act structure (setup, confrontation, resolution)
- Character arcs for each protagonist
- Major turning points
- Emotional beats
- Pacing notes

Format: Markdown with clear sections for each act.`,
    contextRefs: [
      { id: "ctx-1", label: "AuthorForge design rules" },
      { id: "ctx-2", label: "Three-act structure guide" },
    ],
    models: ["Claude"],
    pinned: true,
    updatedAt: "2 days ago",
  },
  {
    id: "preset-2",
    name: "Code Review: Safety & Correctness",
    description:
      "Review code for security issues, edge cases, and performance.",
    category: "coding",
    workspace: "VibeForge Dev",
    tags: ["security", "review", "production"],
    basePrompt: `You are an expert code reviewer focusing on:
1. Security vulnerabilities (injection, XSS, CSRF, etc.)
2. Edge case handling and error scenarios
3. Performance bottlenecks
4. Memory leaks or resource management issues
5. Best practices and code style

Provide:
- Severity level (CRITICAL, HIGH, MEDIUM, LOW)
- Specific line references
- Actionable recommendations
- Code examples for fixes`,
    contextRefs: [
      { id: "ctx-3", label: "Security checklist" },
      { id: "ctx-4", label: "Current codebase summary" },
    ],
    models: ["Claude", "GPT-5.x"],
    pinned: true,
    updatedAt: "5 days ago",
  },
  {
    id: "preset-3",
    name: "Prompt Evaluation Harness",
    description:
      "Systematic evaluation framework for comparing prompt variations.",
    category: "evaluation",
    workspace: "VibeForge Dev",
    tags: ["evaluation", "comparison", "scientific"],
    basePrompt: `Compare the following prompts on these dimensions:
1. Clarity & specificity
2. Likelihood of accurate response
3. Potential for hallucination
4. Creativity vs. precision tradeoff
5. Token efficiency

For each prompt:
- Rate 1-10 on each dimension
- Identify strengths and weaknesses
- Suggest improvements
- Estimate likelihood of success with different models`,
    contextRefs: [],
    models: ["Claude", "GPT-5.x", "Local"],
    pinned: true,
    updatedAt: "today",
  },
  {
    id: "preset-4",
    name: "Worldbuilding Lore Expander",
    description: "Generate deep lore and history for fictional worlds.",
    category: "writing",
    workspace: "AuthorForge",
    tags: ["worldbuilding", "fantasy", "lore", "detailed"],
    basePrompt: `You are a world-building expert for fiction authors.

Given a basic world concept, generate:
1. Historical timeline (major events, wars, discoveries)
2. Political systems and power structures
3. Magic or technology systems with rules
4. Major cultures and their values
5. Economic systems and trade
6. Languages or naming conventions
7. Geography and how it influences society

Be creative but internally consistent. Use world-building frameworks like MUSH or similar.`,
    contextRefs: [{ id: "ctx-5", label: "Fantasy genre tropes" }],
    models: ["Claude"],
    pinned: false,
    updatedAt: "1 week ago",
  },
  {
    id: "preset-5",
    name: "API Documentation Generator",
    description: "Generate comprehensive API documentation from code.",
    category: "coding",
    workspace: "VibeForge Dev",
    tags: ["documentation", "API", "TypeScript"],
    basePrompt: `Generate comprehensive API documentation for the following code.

Include:
1. Function/method signatures with types
2. Parameter descriptions and constraints
3. Return types and possible errors
4. Example usage for each function
5. Edge cases and limitations
6. Integration notes for consumers

Format as Markdown. Be precise and complete.`,
    contextRefs: [{ id: "ctx-6", label: "Documentation template" }],
    models: ["GPT-5.x", "Claude"],
    pinned: false,
    updatedAt: "3 days ago",
  },
  {
    id: "preset-6",
    name: "Data Analysis Summary",
    description: "Analyze datasets and extract key insights.",
    category: "analysis",
    workspace: "Leopold",
    tags: ["analysis", "data", "insights"],
    basePrompt: `Analyze the provided dataset and generate:
1. Summary statistics (mean, median, std dev, outliers)
2. Key trends and patterns
3. Anomalies or unexpected findings
4. Correlations between variables
5. Actionable insights
6. Recommended next steps for investigation

Be quantitative. Reference specific data points.`,
    contextRefs: [],
    models: ["Local", "GPT-5.x"],
    pinned: false,
    updatedAt: "4 days ago",
  },
];

// Helper to convert API prompt to Preset format
function apiPromptToPreset(apiPrompt: ApiPrompt): Preset {
  return {
    id: apiPrompt.id,
    name: apiPrompt.name,
    description: apiPrompt.description || "",
    category: (apiPrompt.category as PresetCategory) || "other",
    workspace: apiPrompt.workspace,
    tags: apiPrompt.tags,
    basePrompt: apiPrompt.basePrompt,
    contextRefs: apiPrompt.contextRefs.map((ref) => ({ id: ref, label: ref })),
    models: apiPrompt.models,
    pinned: apiPrompt.pinned,
    updatedAt: new Date(apiPrompt.updatedAt).toLocaleDateString(),
  };
}

// Create writable store
function createPresetsStore() {
  const { subscribe, set, update } = writable<Preset[]>([]);
  const { subscribe: subscribeSelected, set: setSelected } =
    writable<Preset | null>(null);
  let isLoading = false;

  return {
    subscribe,

    // Selected preset management
    selectedPreset: {
      subscribe: subscribeSelected,
      set: setSelected,
      clear: () => setSelected(null),
    },

    // Load all prompts from API
    load: async (workspace?: string) => {
      if (isLoading) return;
      isLoading = true;

      const result = await promptsClient.listPrompts({
        workspace,
        pageSize: 100,
      });

      if (result.success && result.data) {
        const presets = result.data.prompts.map(apiPromptToPreset);
        set(presets);
      } else {
        console.error("Failed to load prompts:", result.error);
        // Fallback to mock data if API fails
        set(mockPresets);
      }

      isLoading = false;
    },

    togglePinned: async (id: string) => {
      // Optimistic update
      update((presets) =>
        presets.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p))
      );

      // Get current state
      let preset: Preset | undefined;
      subscribe((presets) => {
        preset = presets.find((p) => p.id === id);
      })();

      if (!preset) return;

      // Persist to API
      const result = await promptsClient.updatePrompt(id, {
        pinned: preset.pinned,
      });

      if (!result.success) {
        console.error("Failed to toggle pin:", result.error);
        // Revert on failure
        update((presets) =>
          presets.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p))
        );
      }
    },

    updatePreset: async (updated: Preset) => {
      // Optimistic update
      update((presets) =>
        presets.map((p) => (p.id === updated.id ? updated : p))
      );

      // Persist to API
      const result = await promptsClient.updatePrompt(updated.id, {
        name: updated.name,
        description: updated.description,
        category: updated.category,
        workspace: updated.workspace,
        tags: updated.tags,
        basePrompt: updated.basePrompt,
        contextRefs: updated.contextRefs.map((ref) => ref.id),
        models: updated.models,
        pinned: updated.pinned,
      });

      if (!result.success) {
        console.error("Failed to update preset:", result.error);
        // Reload on failure
        const reloadResult = await promptsClient.listPrompts({
          workspace: updated.workspace,
        });
        if (reloadResult.success && reloadResult.data) {
          set(reloadResult.data.prompts.map(apiPromptToPreset));
        }
      }
    },

    createPreset: async (preset: Omit<Preset, "id" | "updatedAt">) => {
      // Create via API
      const result = await promptsClient.createPrompt({
        name: preset.name,
        description: preset.description,
        category: preset.category,
        workspace: preset.workspace,
        tags: preset.tags,
        basePrompt: preset.basePrompt,
        contextRefs: preset.contextRefs.map((ref) => ref.id),
        models: preset.models,
        pinned: preset.pinned,
      });

      if (result.success && result.data) {
        const newPreset = apiPromptToPreset(result.data);
        update((presets) => [...presets, newPreset]);
        return newPreset;
      } else {
        console.error("Failed to create preset:", result.error);
        throw new Error(result.error?.message || "Failed to create preset");
      }
    },

    deletePreset: async (id: string) => {
      // Optimistic delete
      update((presets) => presets.filter((p) => p.id !== id));

      // Persist to API
      const result = await promptsClient.deletePrompt(id);

      if (!result.success) {
        console.error("Failed to delete preset:", result.error);
        // Reload on failure
        const reloadResult = await promptsClient.listPrompts();
        if (reloadResult.success && reloadResult.data) {
          set(reloadResult.data.prompts.map(apiPromptToPreset));
        }
      }
    },

    duplicatePreset: async (id: string) => {
      // Get the preset to duplicate
      let presetToDuplicate: Preset | undefined;
      subscribe((presets) => {
        presetToDuplicate = presets.find((p) => p.id === id);
      })();

      if (!presetToDuplicate) {
        console.error("Preset not found:", id);
        return null;
      }

      // Create a copy with modified name
      const duplicate = await this.createPreset({
        ...presetToDuplicate,
        name: `${presetToDuplicate.name} (Copy)`,
        pinned: false,
      });

      return duplicate;
    },
  };
}

export const presets = createPresetsStore();

// Derived store for pinned presets
export const pinnedPresets = derived(presets, ($presets) =>
  $presets.filter((p) => p.pinned).sort((a, b) => a.name.localeCompare(b.name))
);

// Derived store for all presets sorted
export const allPresets = derived(presets, ($presets) =>
  $presets.sort((a, b) => a.name.localeCompare(b.name))
);
