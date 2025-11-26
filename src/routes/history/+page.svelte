<script lang="ts">
  import HistoryHeader from "$lib/components/history/HistoryHeader.svelte";
  import HistoryFilters from "$lib/components/history/HistoryFilters.svelte";
  import HistoryTable from "$lib/components/history/HistoryTable.svelte";
  import HistoryDetailPanel from "$lib/components/history/HistoryDetailPanel.svelte";
  import { themeStore } from "$lib/core/stores";

  // History run type definitions
  type RunStatus = "success" | "error" | "partial";
  type DateRange = "24h" | "7d" | "30d" | "all";

  interface TokenUsage {
    input: number;
    output: number;
    total: number;
  }

  interface ContextBlock {
    name: string;
    type: string;
  }

  interface RunOutput {
    model: string;
    summary: string;
    status: string;
  }

  interface HistoryRun {
    id: string;
    workspace: string;
    project: string | null;
    timestamp: string;
    models: string[];
    status: RunStatus;
    durationMs: number;
    promptSummary: string;
    contextSummary: string;
    tokenUsage: TokenUsage;
    starred: boolean;
    labels?: string[];
    fullPrompt: string;
    contextBlocks: ContextBlock[];
    outputs: RunOutput[];
  }

  // Mock history runs data
  const allRuns: HistoryRun[] = [
    {
      id: "run-001",
      workspace: "VibeForge Dev",
      project: null,
      timestamp: "2025-11-18T09:30:00Z",
      models: ["Claude", "GPT-5.x"],
      status: "success",
      durationMs: 3420,
      promptSummary:
        "Generate API documentation for user authentication endpoints",
      contextSummary:
        "3 context blocks: Design System, API Spec, Code Examples",
      tokenUsage: { input: 2340, output: 1820, total: 4160 },
      starred: true,
      labels: ["good result", "documentation"],
      fullPrompt: `Generate comprehensive API documentation for our user authentication system.

Include:
- Endpoint descriptions
- Request/response examples
- Error codes and handling
- Rate limiting information

Target audience: External developers integrating with our API.`,
      contextBlocks: [
        { name: "VibeForge Design System", type: "design-system" },
        { name: "Authentication API Spec", type: "project-spec" },
        { name: "Code Examples", type: "code-summary" },
      ],
      outputs: [
        {
          model: "Claude",
          summary:
            "Comprehensive documentation with code examples, clear error handling, and security best practices. Well-structured and developer-friendly.",
          status: "success",
        },
        {
          model: "GPT-5.x",
          summary:
            "Good documentation with detailed examples. Slightly less emphasis on security considerations compared to Claude output.",
          status: "success",
        },
      ],
    },
    {
      id: "run-002",
      workspace: "AuthorForge",
      project: "Novel Planning",
      timestamp: "2025-11-18T08:15:00Z",
      models: ["Claude"],
      status: "success",
      durationMs: 2180,
      promptSummary: "Expand story beat: protagonist discovers hidden message",
      contextSummary: "2 context blocks: Character Profiles, World Building",
      tokenUsage: { input: 1890, output: 2450, total: 4340 },
      starred: false,
      labels: ["creative writing", "scene expansion"],
      fullPrompt: `Expand the following story beat into a 500-word scene:

**Beat:** The protagonist discovers a hidden message in their late mentor's journal.

**Setting:** A dimly lit study, late evening

**Tone:** Mystery, emotional discovery

Focus on sensory details and character emotion. Show the protagonist's internal conflict between grief and curiosity.`,
      contextBlocks: [
        { name: "Main Character Profile", type: "project" },
        { name: "Story World Rules", type: "design" },
      ],
      outputs: [
        {
          model: "Claude",
          summary:
            "Excellent scene with rich sensory details, emotional depth, and natural dialogue. Balanced pacing between action and introspection.",
          status: "success",
        },
      ],
    },
    {
      id: "run-003",
      workspace: "VibeForge Dev",
      project: null,
      timestamp: "2025-11-17T16:45:00Z",
      models: ["Claude", "GPT-5.x", "Local"],
      status: "partial",
      durationMs: 5240,
      promptSummary: "Code review: React component with performance issues",
      contextSummary: "1 context block: Code Review Pattern",
      tokenUsage: { input: 3120, output: 980, total: 4100 },
      starred: false,
      labels: ["code review", "performance"],
      fullPrompt: `Review this React component for performance issues:

\`\`\`jsx
function UserList({ users }) {
  return (
    <div>
      {users.map((user, index) => (
        <div key={index} onClick={() => handleClick(user)}>
          {user.name} - {user.email}
        </div>
      ))}
    </div>
  );
}
\`\`\`

Identify issues and suggest improvements.`,
      contextBlocks: [{ name: "Code Review Pattern", type: "code" }],
      outputs: [
        {
          model: "Claude",
          summary:
            "Identified key issues: index as key, inline arrow function, missing memoization. Provided detailed fixes with explanations.",
          status: "success",
        },
        {
          model: "GPT-5.x",
          summary:
            "Good analysis of the key prop issue and event handler problems. Suggested React.memo and useCallback optimizations.",
          status: "success",
        },
        {
          model: "Local",
          summary: "Error: Connection timeout",
          status: "error",
        },
      ],
    },
    {
      id: "run-004",
      workspace: "AuthorForge",
      project: "Marketing Copy",
      timestamp: "2025-11-17T14:20:00Z",
      models: ["Claude"],
      status: "success",
      durationMs: 1650,
      promptSummary: "Generate landing page hero copy for AuthorForge",
      contextSummary: "2 context blocks: Brand Voice, Product Features",
      tokenUsage: { input: 980, output: 620, total: 1600 },
      starred: true,
      labels: ["marketing", "approved"],
      fullPrompt: `Create compelling hero section copy for AuthorForge landing page.

Target audience: Fiction writers, novelists, screenwriters

Key message: AuthorForge helps you organize ideas and build worlds faster

Tone: Professional yet approachable, inspiring

Include: Headline (8-12 words), subheading (15-25 words), CTA button text`,
      contextBlocks: [
        { name: "AuthorForge Brand Voice", type: "design" },
        { name: "Product Features", type: "project" },
      ],
      outputs: [
        {
          model: "Claude",
          summary:
            'Strong, action-oriented copy. Headline: "Build Worlds. Tell Stories. Create Magic." Perfect balance of emotion and clarity.',
          status: "success",
        },
      ],
    },
    {
      id: "run-005",
      workspace: "VibeForge Dev",
      project: null,
      timestamp: "2025-11-16T11:30:00Z",
      models: ["GPT-5.x"],
      status: "error",
      durationMs: 890,
      promptSummary: "Analyze dataset: user engagement metrics Q4 2024",
      contextSummary: "No context blocks",
      tokenUsage: { input: 450, output: 0, total: 450 },
      starred: false,
      labels: ["data analysis", "error"],
      fullPrompt: `Analyze the following user engagement metrics for Q4 2024:

[Dataset would be here]

Provide insights on trends, anomalies, and recommendations for improvement.`,
      contextBlocks: [],
      outputs: [
        {
          model: "GPT-5.x",
          summary: "Error: Invalid API key. Please check your configuration.",
          status: "error",
        },
      ],
    },
    {
      id: "run-006",
      workspace: "AuthorForge",
      project: "Character Development",
      timestamp: "2025-11-15T19:00:00Z",
      models: ["Claude"],
      status: "success",
      durationMs: 2950,
      promptSummary: "Generate character backstory for antagonist",
      contextSummary:
        "3 context blocks: Story Outline, World Rules, Character Template",
      tokenUsage: { input: 2210, output: 3140, total: 5350 },
      starred: true,
      labels: ["character dev", "excellent"],
      fullPrompt: `Create a detailed backstory for the main antagonist.

Character brief:
- Name: Dr. Elena Winters
- Role: Former colleague turned rival
- Motivation: Control over the research project

Include:
- Childhood influences
- Key turning points
- Relationship with protagonist
- Current goals and methods

Aim for 800-1000 words with psychological depth.`,
      contextBlocks: [
        { name: "Story Outline", type: "project" },
        { name: "World Building Rules", type: "design" },
        { name: "Character Template", type: "workflow" },
      ],
      outputs: [
        {
          model: "Claude",
          summary:
            "Exceptional backstory with nuanced motivation. Creates sympathy for antagonist while maintaining conflict. Rich psychological detail.",
          status: "success",
        },
      ],
    },
  ];

  // Local state for filters and selection
  let searchQuery = $state("");
  let selectedWorkspace = $state<string | "all">("all");
  let selectedModel = $state<string | "all">("all");
  let selectedStatus = $state<RunStatus | "all">("all");
  let selectedDateRange = $state<DateRange>("all");
  let activeRunId = $state<string | null>(null);

  // Derive unique workspaces
  const availableWorkspaces = $derived.by(() => {
    const workspaceSet = new Set<string>();
    allRuns.forEach((run) => {
      workspaceSet.add(run.workspace);
    });
    return Array.from(workspaceSet).sort();
  });

  // Derive unique models
  const availableModels = $derived.by(() => {
    const modelSet = new Set<string>();
    allRuns.forEach((run) => {
      run.models.forEach((model) => modelSet.add(model));
    });
    return Array.from(modelSet).sort();
  });

  // Filter runs based on current filters
  const filteredRuns = $derived.by(() => {
    const now = new Date();
    const rangeMs: Record<DateRange, number> = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      all: Infinity,
    };

    return allRuns.filter((run) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          run.promptSummary.toLowerCase().includes(query) ||
          run.labels?.some((label) => label.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Workspace filter
      if (selectedWorkspace !== "all" && run.workspace !== selectedWorkspace) {
        return false;
      }

      // Model filter
      if (selectedModel !== "all" && !run.models.includes(selectedModel)) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all" && run.status !== selectedStatus) {
        return false;
      }

      // Date range filter
      if (selectedDateRange !== "all") {
        const runTime = new Date(run.timestamp);
        const timeDiff = now.getTime() - runTime.getTime();
        if (timeDiff > rangeMs[selectedDateRange]) {
          return false;
        }
      }

      return true;
    });
  });

  // Get the active run
  const activeRun = $derived.by(() => {
    if (!activeRunId) return null;
    return allRuns.find((r) => r.id === activeRunId) ?? null;
  });

  // Handler for selecting a run
  const selectRun = (id: string) => {
    activeRunId = id;
  };

  // Handler for toggling star
  const toggleStar = (runId: string) => {
    const run = allRuns.find((r) => r.id === runId);
    if (run) {
      run.starred = !run.starred;
    }
  };

  // Handler for opening in workbench
  const openInWorkbench = (run: HistoryRun) => {
    // TODO: Wire "Open in Workbench" to route with run data pre-loaded
    // This would normally navigate to "/" with run data:
    // goto('/', { state: { prompt: run.fullPrompt, contexts: run.contextBlocks } })
    console.log("Open in Workbench:", run.id);
    alert(
      `"${run.promptSummary}" will be loaded into the Workbench (integration pending)`
    );
  };

  // Handler for duplicating run
  const duplicateRun = (run: HistoryRun) => {
    console.log("Duplicate run:", run.id);
    alert(`Creating duplicate of "${run.promptSummary}" (feature pending)`);
  };
</script>

<!-- History main layout: filters + table (left), run detail panel (right) -->
<main class="flex-1 overflow-hidden flex flex-col bg-forge-blacksteel">
  <div class="flex-1 overflow-auto px-8 py-6 flex flex-col gap-6">
    <!-- Header with title, description, and stats -->
    <HistoryHeader
      totalCount={allRuns.length}
      filteredCount={filteredRuns.length}
    />

    <!-- 2-column grid: left (filters + table), right (detail panel) -->
    <div class="grid grid-cols-[320px_1fr] gap-6 flex-1 overflow-hidden">
      <!-- LEFT SIDE: Filters and history table -->
      <div class="flex flex-col gap-4 overflow-hidden">
        <!-- Filters panel -->
        <HistoryFilters
          bind:searchQuery
          bind:selectedWorkspace
          bind:selectedModel
          bind:selectedStatus
          bind:selectedDateRange
          {availableWorkspaces}
          {availableModels}
        />

        <!-- History table -->
        <div class="flex-1 overflow-y-auto">
          <HistoryTable
            runs={filteredRuns}
            {activeRunId}
            onSelect={selectRun}
            onToggleStar={toggleStar}
          />
        </div>
      </div>

      <!-- RIGHT SIDE: Detail panel -->
      <div class="overflow-y-auto">
        <HistoryDetailPanel
          run={activeRun}
          onOpenInWorkbench={openInWorkbench}
          onDuplicateRun={duplicateRun}
          onToggleStar={toggleStar}
        />
      </div>
    </div>
  </div>
</main>
