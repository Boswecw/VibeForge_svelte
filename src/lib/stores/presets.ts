import { writable, derived } from "svelte/store";

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

// Create writable store
function createPresetsStore() {
  const { subscribe, set, update } = writable<Preset[]>(mockPresets);

  return {
    subscribe,

    togglePinned: (id: string) => {
      update((presets) =>
        presets.map((p) =>
          p.id === id ? { ...p, pinned: !p.pinned, updatedAt: "now" } : p
        )
      );
      // TODO: Persist to backend
    },

    updatePreset: (updated: Preset) => {
      update((presets) =>
        presets.map((p) =>
          p.id === updated.id ? { ...updated, updatedAt: "now" } : p
        )
      );
      // TODO: Persist to backend
    },

    createPreset: (preset: Omit<Preset, "id" | "updatedAt">) => {
      const newPreset: Preset = {
        ...preset,
        id: `preset-${Date.now()}`,
        updatedAt: "now",
      };
      update((presets) => [...presets, newPreset]);
      // TODO: Persist to backend
      return newPreset;
    },

    deletePreset: (id: string) => {
      update((presets) => presets.filter((p) => p.id !== id));
      // TODO: Persist to backend
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
