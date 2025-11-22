<script lang="ts">
  import { theme } from "$lib/stores/themeStore";
  import EvaluationsHeader from "$lib/components/evaluations/EvaluationsHeader.svelte";
  import EvaluationsFilters from "$lib/components/evaluations/EvaluationsFilters.svelte";
  import EvaluationsList from "$lib/components/evaluations/EvaluationsList.svelte";
  import EvaluationDetail from "$lib/components/evaluations/EvaluationDetail.svelte";
  import type {
    EvaluationSession,
    EvaluationStatus,
  } from "$lib/types/evaluation";

  // Mock evaluation data
  const mockEvaluations: EvaluationSession[] = [
    {
      id: "eval-001",
      name: "Story beat expansion – v3",
      workspace: "AuthorForge",
      project: "Novel Drafting",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      models: ["Claude", "GPT-5.x"],
      status: "in-progress",
      tags: ["story", "consistency-test"],
      promptSummary:
        "Expand the middle act of a story to include character tension and subplot development.",
      prompt:
        "You are a professional fiction editor. Given the following story synopsis and outline, expand the middle act with:\n1. Character tension between the protagonist and secondary character\n2. A subplot that weaves into the main plot\n3. Foreshadowing of the climax\n\nSynopsis: A detective on the verge of retirement uncovers a cold case connected to her partner's death.\n\nMiddle act beat points:\n- Discover new evidence\n- Confront the prime suspect\n- Realize the conspiracy is bigger than expected",
      contextBlocks: [
        { name: "Story Guidelines", type: "design" },
        { name: "Character Profiles", type: "project" },
      ],
      outputs: [
        {
          id: "out-001-claude",
          model: "Claude",
          text: "Detective Sarah arrives at the precinct just before dawn, evidence box in hand. The case file for James—her partner of fifteen years—sits sealed in her drawer. She had buried it three years ago, just as he deserved.\n\nBut the new DNA results don't lie. The fiber evidence from the warehouse matches Marcus Chen, the mob accountant they could never pin down. Sarah's hands shake as she photographs the report.\n\nJimmy enters without knocking. \"You're here early.\" His voice carries that edge it always does when he's stressed—the same edge she heard the night of the stakeout gone wrong. Sarah has worked beside Jimmy for five years. Good detective. Solid instincts. But in his eyes now, she sees something new: recognition. Fear.\n\n\"We need to talk about the cold case files,\" she says carefully. \"The Chen investigation—there's been a development.\"\n\nJimmy's jaw tightens. \"Some cases are meant to stay buried, Sarah. For everyone's sake.\"\n\nThe implication hangs between them. Sarah realizes then that Jimmy wasn't just present the night James died. He was complicit. And she suspects he still has connections—connections that reach deeper into the department than she ever realized.\n\nAs she drives home that evening, Sarah thinks about her daughter. About the good years with James before everything went dark. She makes a choice: not to run with this, but to run toward it. James deserves justice, even if it costs her everything.\n\nIn the darkness of her car, she sets up a secure communication with a FBI contact. The conspiracy is larger. The stakes are higher. And Sarah has nothing left to lose.",
          score: 5,
          label: "Rich character tension",
          isWinner: true,
        },
        {
          id: "out-001-gpt",
          model: "GPT-5.x",
          text: "Detective Sarah arrived at the precinct and reviewed the evidence. The DNA match to Marcus Chen was clear and actionable. She decided to interview him immediately.\n\nWhen she entered the interrogation room, Marcus denied everything. Sarah presented the physical evidence and he eventually confessed to being at the warehouse but claimed he was only delivering messages for someone else.\n\nSarah realized there was a larger conspiracy. She contacted her supervisor, Captain Rodriguez, and they agreed to expand the investigation. They also brought in the FBI because the case had grown beyond the scope of local law enforcement.\n\nSarah spent the next week interviewing witnesses and gathering additional evidence. The case became increasingly complex, but they made steady progress toward uncovering the true orchestrators of the original crime.\n\nAfter two weeks of intensive work, Sarah and Rodriguez presented their findings to the District Attorney, who authorized a full grand jury investigation. Sarah felt vindicated in her decision to reopen the case.",
          score: 2,
          label: "Procedural but lacks tension",
        },
      ],
      notes:
        "Claude output shows strong narrative tension and character development. GPT output is more procedural—good plot advancement but lacks emotional depth.",
    },
    {
      id: "eval-002",
      name: "Technical documentation clarity",
      workspace: "VibeForge Dev",
      project: null,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      models: ["Claude", "Local"],
      status: "completed",
      tags: ["technical", "documentation", "code-review"],
      promptSummary:
        "Create a clear, beginner-friendly guide to setting up the VibeForge development environment.",
      prompt:
        "Write a comprehensive but concise guide for new developers to set up VibeForge for local development. Include:\n- Prerequisites (Node, pnpm)\n- Clone and install steps\n- Running dev server\n- Common troubleshooting\n\nTarget audience: intermediate developers familiar with Node/Git but new to SvelteKit.",
      contextBlocks: [
        { name: "README.md", type: "code" },
        { name: "Setup Guide", type: "workflow" },
      ],
      outputs: [
        {
          id: "out-002-claude",
          model: "Claude",
          text: 'VibeForge Development Setup Guide\n\nPrerequisites\n- Node.js 18+ (check with node --version)\n- pnpm 8+ (install globally: npm install -g pnpm)\n- Git\n\nStep 1: Clone the Repository\ngit clone https://github.com/Boswecw/VibeForge_svelte.git\ncd VibeForge_svelte\n\nStep 2: Install Dependencies\npnpm install\n\nStep 3: Start Development Server\npnpm dev\n\nThe server will start at http://localhost:5173\n\nCommon Issues\n\nIssue: "command not found: pnpm"\nSolution: Install pnpm globally with npm install -g pnpm\n\nIssue: Port 5173 already in use\nSolution: Kill the process using that port or run pnpm dev -- --port 5174\n\nIssue: Dependencies fail to install\nSolution: Delete pnpm-lock.yaml and node_modules, then run pnpm install again\n\nTesting & Validation\nRun type checking: pnpm check\nRun in watch mode: pnpm check:watch',
          score: 5,
          isWinner: true,
        },
        {
          id: "out-002-local",
          model: "Local",
          text: "Setup Instructions\n\n1. Install Node and pnpm\n2. Clone repo\n3. Run pnpm install\n4. Run pnpm dev\n5. Open browser to localhost:5173\n\nFor errors, check Node version and pnpm version.",
          score: 1,
        },
      ],
      notes:
        "Claude provides excellent structure with code blocks and comprehensive troubleshooting. Local model is too terse.",
    },
    {
      id: "eval-003",
      name: "Code review pattern evaluation",
      workspace: "VibeForge Dev",
      project: null,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      models: ["Claude", "GPT-5.x", "Local"],
      status: "draft",
      tags: ["code", "patterns", "review"],
      promptSummary:
        "Evaluate a refactored theme store implementation for best practices.",
      prompt:
        "Review this Svelte store implementation for:\n1. TypeScript type safety\n2. SSR safety (browser check placement)\n3. localStorage persistence pattern\n4. Reactivity correctness\n\nProvide a score (1-5 stars) and specific recommendations.",
      contextBlocks: [
        { name: "Svelte 5 Store Patterns", type: "code" },
        { name: "VibeForge Architecture", type: "project" },
      ],
      outputs: [
        {
          id: "out-003-claude",
          model: "Claude",
          text: "Score: 4/5 stars\n\nStrengths:\n- Browser check properly placed before localStorage access\n- Type-safe with Theme discriminated union\n- Derived stores correctly used where appropriate\n- Clean factory pattern for store creation\n\nRecommendations:\n1. Consider extracting STORAGE_KEY as a constant outside the function\n2. Add error handling for localStorage quota exceeded\n3. Consider SSR hydration: add document.documentElement attribute sync\n4. Add JSDoc comments for public methods\n\nOverall: Solid implementation that follows Svelte best practices.",
          score: 4,
        },
        {
          id: "out-003-gpt",
          model: "GPT-5.x",
          text: "Good implementation. The browser check is in the right place. Type safety looks good. Would suggest adding more error handling and comments.",
          score: 3,
        },
        {
          id: "out-003-local",
          model: "Local",
          text: "Looks fine. Uses browser correctly. Store pattern is standard.",
          score: 2,
        },
      ],
      notes: "",
    },
  ];

  // Filter and state management
  let searchQuery = $state("");
  let workspace = $state("All Workspaces");
  let modelFilter = $state("All Models");
  let statusFilter: EvaluationStatus | "all" = $state("all");
  let dateRange: "7d" | "30d" | "all" = $state("all");
  let activeEvaluationId: string | null = $state(null);

  // Local edits to evaluations (not persisted)
  let evaluations = $state(mockEvaluations);

  // Filter logic
  const filteredEvaluations = $derived.by(() => {
    let filtered = evaluations;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.promptSummary.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Workspace filter
    if (workspace !== "All Workspaces") {
      filtered = filtered.filter((e) => e.workspace === workspace);
    }

    // Model filter
    if (modelFilter !== "All Models") {
      filtered = filtered.filter((e) => e.models.includes(modelFilter));
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const cutoffDays =
        dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 999999;
      const cutoffMs = now.getTime() - cutoffDays * 24 * 60 * 60 * 1000;
      filtered = filtered.filter(
        (e) => new Date(e.updatedAt).getTime() > cutoffMs
      );
    }

    return filtered;
  });

  // Get active evaluation
  const activeEvaluation = $derived.by(() => {
    if (!activeEvaluationId) return null;
    return evaluations.find((e) => e.id === activeEvaluationId) ?? null;
  });

  // Handle output scoring and winner marking
  const handleUpdateOutput = (
    evaluationId: string,
    outputId: string,
    updates: Record<string, any>
  ) => {
    evaluations = evaluations.map((e) => {
      if (e.id === evaluationId) {
        return {
          ...e,
          outputs: e.outputs.map((o) =>
            o.id === outputId ? { ...o, ...updates } : o
          ),
        };
      }
      return e;
    });
  };

  // Handle notes update
  const handleUpdateNotes = (evaluationId: string, notes: string) => {
    evaluations = evaluations.map((e) =>
      e.id === evaluationId ? { ...e, notes } : e
    );
  };
</script>

<!-- Evaluations: left = sessions list with filters, right = comparison workspace -->
<div class="flex-1 flex flex-col bg-forge-blacksteel overflow-hidden">
  <div class={`border-b border-slate-800 px-8 py-4 shrink-0`}>
    <div class="flex flex-col gap-1">
      <h1 class="text-lg font-semibold tracking-tight text-slate-100">
        Evaluations
      </h1>
      <p class="text-sm text-slate-400">
        Compare and score model outputs for systematic evaluation
      </p>
    </div>
  </div>

  <!-- Main content: header + two-column layout -->
  <main class="flex-1 overflow-hidden flex flex-col">
    <div class="px-8 py-6 flex flex-col gap-6 h-full overflow-hidden">
      <EvaluationsHeader />

      <!-- Two-column layout: filters+list on left, detail on right -->
      <div
        class="grid gap-6 flex-1 overflow-hidden"
        style="grid-template-columns: 320px 1fr;"
      >
        <!-- LEFT SIDE: Filters + Evaluations List -->
        <div class="flex flex-col gap-4 overflow-hidden">
          <EvaluationsFilters
            bind:searchQuery
            onSearchChange={() => {}}
            bind:workspace
            onWorkspaceChange={() => {}}
            bind:modelFilter
            onModelFilterChange={() => {}}
            bind:statusFilter
            onStatusFilterChange={() => {}}
            bind:dateRange
            onDateRangeChange={() => {}}
          />

          <div class="flex-1 overflow-y-auto">
            <EvaluationsList
              evaluations={filteredEvaluations}
              {activeEvaluationId}
              onSelectEvaluation={(id) => {
                activeEvaluationId = id;
              }}
            />
          </div>
        </div>

        <!-- RIGHT SIDE: Evaluation Detail -->
        <div class="overflow-hidden">
          {#if activeEvaluation}
            <div class="h-full overflow-y-auto">
              <EvaluationDetail
                evaluation={activeEvaluation}
                onUpdateOutput={(outputId, updates) =>
                  handleUpdateOutput(activeEvaluation.id, outputId, updates)}
                onUpdateNotes={(notes) =>
                  handleUpdateNotes(activeEvaluation.id, notes)}
              />
            </div>
          {:else}
            <div
              class={`rounded-lg border p-8 flex items-center justify-center text-center h-full transition-colors ${
                $theme === "dark"
                  ? "bg-slate-900 border-slate-700"
                  : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div class="flex flex-col gap-2 max-w-sm">
                <p
                  class={`text-sm font-medium ${
                    $theme === "dark" ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Select an evaluation to begin
                </p>
                <p
                  class={`text-xs ${
                    $theme === "dark" ? "text-slate-500" : "text-slate-600"
                  }`}
                >
                  Choose an evaluation session from the list to compare model
                  outputs and assign scores.
                </p>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </main>
</div>
