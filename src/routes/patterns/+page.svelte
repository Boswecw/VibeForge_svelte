<script lang="ts">
  import PatternsHeader from "$lib/components/patterns/PatternsHeader.svelte";
  import PatternsFilters from "$lib/components/patterns/PatternsFilters.svelte";
  import PatternsList from "$lib/components/patterns/PatternsList.svelte";
  import PatternDetailPanel from "$lib/components/patterns/PatternDetailPanel.svelte";
  import { themeStore } from "$lib/core/stores";

  // Pattern type definitions
  type PatternCategory =
    | "coding"
    | "writing"
    | "analysis"
    | "evaluation"
    | "research";
  type PatternComplexity = "basic" | "intermediate" | "advanced";

  interface PatternSlot {
    name: string;
    label: string;
    description: string;
  }

  interface Pattern {
    id: string;
    name: string;
    category: PatternCategory;
    useCase: string;
    models: string[];
    complexity: PatternComplexity;
    tags: string[];
    updatedAt: string;
    summary: string;
    template: string;
    slots?: PatternSlot[];
  }

  // Mock patterns data
  const allPatterns: Pattern[] = [
    {
      id: "pat-001",
      name: "System + Role + Constraints Prompt",
      category: "coding",
      useCase: "Code generation with clear boundaries",
      models: ["Claude", "GPT-5.x"],
      complexity: "basic",
      tags: ["Code Gen", "Structured", "Safety"],
      updatedAt: "1 day ago",
      summary:
        "A foundational pattern that establishes system role, specific task, and explicit constraints to guide model behavior.",
      template: `You are {{ROLE}}.

Your task: {{TASK}}

Constraints:
- {{CONSTRAINT_1}}
- {{CONSTRAINT_2}}
- {{CONSTRAINT_3}}

Now proceed with: {{SPECIFIC_INSTRUCTION}}`,
      slots: [
        {
          name: "ROLE",
          label: "Role",
          description: "The expert role the model should assume",
        },
        {
          name: "TASK",
          label: "Task",
          description: "The primary task to accomplish",
        },
        {
          name: "CONSTRAINT_1",
          label: "Constraint 1",
          description: "First constraint or boundary",
        },
        {
          name: "CONSTRAINT_2",
          label: "Constraint 2",
          description: "Second constraint",
        },
        {
          name: "CONSTRAINT_3",
          label: "Constraint 3",
          description: "Third constraint",
        },
        {
          name: "SPECIFIC_INSTRUCTION",
          label: "Instruction",
          description: "The specific action to take",
        },
      ],
    },
    {
      id: "pat-002",
      name: "Multi-Model Comparison Template",
      category: "evaluation",
      useCase: "Compare outputs across different models",
      models: ["Claude", "GPT-5.x", "Local"],
      complexity: "intermediate",
      tags: ["Comparison", "Evaluation", "Multi-Model"],
      updatedAt: "3 days ago",
      summary:
        "Run the same prompt across multiple models and systematically compare their responses for quality, accuracy, and style.",
      template: `Evaluate the following {{CONTENT_TYPE}} based on these criteria:

1. {{CRITERION_1}}
2. {{CRITERION_2}}
3. {{CRITERION_3}}

Content to evaluate:
{{CONTENT}}

Provide a structured evaluation with:
- Strengths
- Weaknesses
- Overall score (1-10)
- Recommendations`,
      slots: [
        {
          name: "CONTENT_TYPE",
          label: "Content Type",
          description: "Type of content (e.g., code, essay, analysis)",
        },
        {
          name: "CRITERION_1",
          label: "Criterion 1",
          description: "First evaluation criterion",
        },
        {
          name: "CRITERION_2",
          label: "Criterion 2",
          description: "Second evaluation criterion",
        },
        {
          name: "CRITERION_3",
          label: "Criterion 3",
          description: "Third evaluation criterion",
        },
        {
          name: "CONTENT",
          label: "Content",
          description: "The actual content to evaluate",
        },
      ],
    },
    {
      id: "pat-003",
      name: "Code Review (Safety & Correctness)",
      category: "coding",
      useCase: "Code review with security focus",
      models: ["Claude", "GPT-5.x"],
      complexity: "advanced",
      tags: ["Code Review", "Security", "Quality"],
      updatedAt: "5 days ago",
      summary:
        "Comprehensive code review pattern focusing on security vulnerabilities, correctness, performance, and best practices.",
      template: `Review the following {{LANGUAGE}} code for:

**Security Issues:**
- Input validation
- SQL injection risks
- XSS vulnerabilities
- Authentication/authorization flaws
- Sensitive data exposure

**Correctness:**
- Logic errors
- Edge cases
- Error handling
- Type safety

**Performance:**
- Time complexity
- Space complexity
- Resource leaks

**Best Practices:**
- Code style
- Naming conventions
- Documentation
- Testability

Code to review:
\`\`\`{{LANGUAGE}}
{{CODE}}
\`\`\`

Provide findings in this format:
1. Critical Issues (must fix)
2. Major Issues (should fix)
3. Minor Issues (nice to fix)
4. Suggestions (optional improvements)`,
      slots: [
        {
          name: "LANGUAGE",
          label: "Language",
          description: "Programming language (e.g., JavaScript, Python)",
        },
        {
          name: "CODE",
          label: "Code",
          description: "The code snippet to review",
        },
      ],
    },
    {
      id: "pat-004",
      name: "REST API Endpoint Generator",
      category: "backend",
      useCase: "API development and documentation",
      models: ["Claude", "GPT-4"],
      complexity: "intermediate",
      tags: ["REST API", "Backend", "OpenAPI", "Documentation"],
      updatedAt: "1 week ago",
      summary:
        "Generate complete REST API endpoint implementation with validation, error handling, and OpenAPI documentation.",
      template: `Generate a complete REST API endpoint for {{RESOURCE_NAME}}:

**HTTP Method:** {{HTTP_METHOD}}
**Endpoint:** {{ENDPOINT_PATH}}
**Framework:** {{FRAMEWORK}}

**Requirements:**
- Request/response schemas with validation
- Error handling (400, 401, 404, 500)
- Authentication: {{AUTH_TYPE}}
- Database operations ({{DATABASE}})
- Unit tests with {{TEST_FRAMEWORK}}
- OpenAPI/Swagger documentation

**Business Logic:**
{{BUSINESS_LOGIC}}

**Constraints:**
- Follow RESTful conventions
- Include TypeScript types (if applicable)
- Add JSDoc/docstrings
- Handle edge cases (null, empty, duplicates)
- Include rate limiting headers`,
      slots: [
        {
          name: "RESOURCE_NAME",
          label: "Resource Name",
          description: "API resource (e.g., 'users', 'products', 'orders')",
        },
        {
          name: "HTTP_METHOD",
          label: "HTTP Method",
          description: "GET, POST, PUT, PATCH, DELETE",
        },
        {
          name: "ENDPOINT_PATH",
          label: "Endpoint Path",
          description: "API route (e.g., '/api/v1/users/:id')",
        },
        {
          name: "FRAMEWORK",
          label: "Framework",
          description: "Express, FastAPI, Django, Actix-Web, etc.",
        },
        {
          name: "AUTH_TYPE",
          label: "Authentication",
          description: "JWT, OAuth, API Key, Session, None",
        },
        {
          name: "DATABASE",
          label: "Database",
          description: "PostgreSQL, MongoDB, MySQL, Redis, etc.",
        },
        {
          name: "TEST_FRAMEWORK",
          label: "Test Framework",
          description: "Jest, Pytest, Mocha, Vitest, etc.",
        },
        {
          name: "BUSINESS_LOGIC",
          label: "Business Logic",
          description: "Specific requirements and validation rules",
        },
      ],
    },
    {
      id: "pat-005",
      name: "Data Analysis Framework",
      category: "analysis",
      useCase: "Structured data exploration",
      models: ["Claude", "GPT-5.x"],
      complexity: "intermediate",
      tags: ["Data", "Analysis", "Statistics"],
      updatedAt: "1 week ago",
      summary:
        "Systematic approach to analyzing datasets: exploration, hypothesis, testing, and actionable insights.",
      template: `Analyze the following dataset:

{{DATASET_DESCRIPTION}}

**Analysis Goals:**
{{ANALYSIS_GOALS}}

**Steps:**
1. Data Exploration
   - Summary statistics
   - Distributions
   - Missing values
   - Outliers

2. Hypothesis Formation
   - Key questions to answer
   - Expected patterns

3. Analysis
   - Statistical tests
   - Correlations
   - Trends over time

4. Insights
   - Key findings
   - Actionable recommendations
   - Limitations and caveats

**Format:** Provide clear visualizations (describe charts/graphs) and concise summaries.`,
      slots: [
        {
          name: "DATASET_DESCRIPTION",
          label: "Dataset",
          description: "Description or sample of the dataset",
        },
        {
          name: "ANALYSIS_GOALS",
          label: "Goals",
          description: "What you want to learn from the data",
        },
      ],
    },
    {
      id: "pat-006",
      name: "Chain-of-Thought Reasoning",
      category: "analysis",
      useCase: "Complex problem solving",
      models: ["Claude", "GPT-5.x"],
      complexity: "basic",
      tags: ["Reasoning", "Step-by-Step", "Logic"],
      updatedAt: "2 weeks ago",
      summary:
        "Encourage step-by-step reasoning for complex problems by explicitly asking the model to show its work.",
      template: `Let's solve this problem step by step.

Problem: {{PROBLEM}}

Please:
1. Break down the problem into smaller parts
2. Solve each part systematically
3. Show your reasoning at each step
4. Verify your answer
5. Explain any assumptions made

Think through this carefully and show all your work.`,
      slots: [
        {
          name: "PROBLEM",
          label: "Problem",
          description: "The problem to solve",
        },
      ],
    },
    {
      id: "pat-007",
      name: "Few-Shot Learning Template",
      category: "coding",
      useCase: "Format-specific generation",
      models: ["Claude", "GPT-5.x"],
      complexity: "basic",
      tags: ["Few-Shot", "Examples", "Learning"],
      updatedAt: "2 weeks ago",
      summary:
        "Provide 2-3 input-output examples before asking the model to perform a similar task.",
      template: `I need you to {{TASK_DESCRIPTION}}.

Here are some examples:

Example 1:
Input: {{EXAMPLE_1_INPUT}}
Output: {{EXAMPLE_1_OUTPUT}}

Example 2:
Input: {{EXAMPLE_2_INPUT}}
Output: {{EXAMPLE_2_OUTPUT}}

Example 3:
Input: {{EXAMPLE_3_INPUT}}
Output: {{EXAMPLE_3_OUTPUT}}

Now, please do the same for:
Input: {{YOUR_INPUT}}`,
      slots: [
        {
          name: "TASK_DESCRIPTION",
          label: "Task",
          description: "Description of the task",
        },
        {
          name: "EXAMPLE_1_INPUT",
          label: "Example 1 Input",
          description: "First example input",
        },
        {
          name: "EXAMPLE_1_OUTPUT",
          label: "Example 1 Output",
          description: "First example output",
        },
        {
          name: "EXAMPLE_2_INPUT",
          label: "Example 2 Input",
          description: "Second example input",
        },
        {
          name: "EXAMPLE_2_OUTPUT",
          label: "Example 2 Output",
          description: "Second example output",
        },
        {
          name: "EXAMPLE_3_INPUT",
          label: "Example 3 Input",
          description: "Third example input",
        },
        {
          name: "EXAMPLE_3_OUTPUT",
          label: "Example 3 Output",
          description: "Third example output",
        },
        {
          name: "YOUR_INPUT",
          label: "Your Input",
          description: "The actual input to process",
        },
      ],
    },
    {
      id: "pat-008",
      name: "Research Literature Review",
      category: "research",
      useCase: "Academic research synthesis",
      models: ["Claude"],
      complexity: "advanced",
      tags: ["Research", "Academic", "Literature Review"],
      updatedAt: "3 weeks ago",
      summary:
        "Systematically review and synthesize academic literature on a topic, identifying themes, gaps, and future directions.",
      template: `Conduct a literature review on: {{TOPIC}}

**Scope:**
- Time period: {{TIME_PERIOD}}
- Key domains: {{DOMAINS}}
- Research questions: {{RESEARCH_QUESTIONS}}

**Structure:**
1. Introduction
   - Background and context
   - Research objectives

2. Methodology
   - Search strategy
   - Inclusion/exclusion criteria
   - Sources reviewed

3. Thematic Analysis
   - Major themes and patterns
   - Key findings
   - Methodological approaches

4. Gaps and Opportunities
   - What's missing in current research
   - Contradictions or debates
   - Future research directions

5. Synthesis
   - Overall conclusions
   - Implications for practice
   - Recommendations

**Provided Sources:**
{{SOURCES}}`,
      slots: [
        {
          name: "TOPIC",
          label: "Topic",
          description: "Research topic to review",
        },
        {
          name: "TIME_PERIOD",
          label: "Time Period",
          description: "Publication date range",
        },
        {
          name: "DOMAINS",
          label: "Domains",
          description: "Academic domains or fields",
        },
        {
          name: "RESEARCH_QUESTIONS",
          label: "Questions",
          description: "Specific questions to address",
        },
        {
          name: "SOURCES",
          label: "Sources",
          description: "Papers or sources to include",
        },
      ],
    },
  ];

  // Local state for filters and selection
  let searchQuery = $state("");
  let selectedCategory = $state<PatternCategory | "all">("all");
  let selectedComplexity = $state<PatternComplexity | "all">("all");
  let selectedModel = $state<string | "all">("all");
  let activePatternId = $state<string | null>(null);

  // Derive available models from all patterns
  const availableModels = $derived.by(() => {
    const modelSet = new Set<string>();
    allPatterns.forEach((pattern) => {
      pattern.models.forEach((model) => modelSet.add(model));
    });
    return Array.from(modelSet).sort();
  });

  // Filtered patterns based on search, category, complexity, and model
  const filteredPatterns = $derived.by(() => {
    return allPatterns.filter((pattern) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          pattern.name.toLowerCase().includes(query) ||
          pattern.useCase.toLowerCase().includes(query) ||
          pattern.summary.toLowerCase().includes(query) ||
          pattern.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory !== "all" && pattern.category !== selectedCategory) {
        return false;
      }

      // Complexity filter
      if (
        selectedComplexity !== "all" &&
        pattern.complexity !== selectedComplexity
      ) {
        return false;
      }

      // Model filter
      if (selectedModel !== "all" && !pattern.models.includes(selectedModel)) {
        return false;
      }

      return true;
    });
  });

  // Get the active pattern
  const activePattern = $derived.by(() => {
    if (!activePatternId) return null;
    return allPatterns.find((p) => p.id === activePatternId) ?? null;
  });

  // Handler for selecting a pattern
  const selectPattern = (id: string) => {
    activePatternId = id;
  };

  // Handler for sending to workbench
  const sendToWorkbench = (pattern: Pattern) => {
    // TODO: Wire "Send to Workbench" to pre-fill the Workbench prompt editor
    // This would normally call something like:
    // promptState.setText(pattern.template)
    console.log("Send to Workbench:", pattern.name);
    alert(
      `"${pattern.name}" will be loaded into the Workbench prompt editor (integration pending)`
    );
  };

  // Handler for copying pattern
  const copyPattern = (pattern: Pattern) => {
    navigator.clipboard.writeText(pattern.template);
    alert(`Pattern template copied to clipboard!`);
  };
</script>

<!-- Patterns / Recipes main layout: filters + list (left), pattern details (right) -->
<main class="flex-1 overflow-hidden flex flex-col bg-forge-blacksteel">
  <div class="flex-1 overflow-auto px-8 py-6 flex flex-col gap-6">
    <!-- Header with title, description, and stats -->
    <PatternsHeader
      totalCount={allPatterns.length}
      filteredCount={filteredPatterns.length}
    />

    <!-- 2-column grid: left (filters + list), right (detail panel) -->
    <div class="grid grid-cols-[320px_1fr] gap-6 flex-1 overflow-hidden">
      <!-- LEFT SIDE: Filters and list -->
      <div class="flex flex-col gap-4 overflow-hidden">
        <!-- Filters panel -->
        <PatternsFilters
          bind:searchQuery
          bind:selectedCategory
          bind:selectedComplexity
          bind:selectedModel
          {availableModels}
        />

        <!-- Patterns list -->
        <div class="flex-1 overflow-y-auto">
          <PatternsList
            patterns={filteredPatterns}
            {activePatternId}
            onSelect={selectPattern}
          />
        </div>
      </div>

      <!-- RIGHT SIDE: Detail panel -->
      <div class="overflow-y-auto">
        <PatternDetailPanel
          pattern={activePattern}
          onSendToWorkbench={sendToWorkbench}
          onCopyPattern={copyPattern}
        />
      </div>
    </div>
  </div>
</main>
