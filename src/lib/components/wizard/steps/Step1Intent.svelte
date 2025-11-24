<!-- @component
no description yet
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { wizardStore, isStep1Valid } from "$lib/stores/wizard";
  import { learningStore } from "$lib/stores/learning";
  import type { StackCategory } from "$lib/core/types/stack-profiles";
  import TemplateSelector from "$lib/components/wizard/TemplateSelector.svelte";
  import AnalysisModal from "$lib/components/wizard/AnalysisModal.svelte";
  import type { ProjectTemplate } from "$lib/data/project-templates";
  import { PROJECT_TEMPLATES } from "$lib/data/project-templates";

  $: intent = $wizardStore.intent;
  $: isValid = $isStep1Valid;

  // Track step completion
  onMount(() => {
    learningStore.trackStepCompleted(1);
  });

  let useTemplate = false;
  let selectedTemplate: ProjectTemplate | null = null;
  let showAnalysisModal = false;

  // Smart validation state
  let nameCheckResult: "checking" | "available" | "taken" | null = null;
  let descriptionQuality: "poor" | "good" | "excellent" = "poor";

  // Reactive complexity estimation
  $: complexityScore = calculateComplexity(intent);
  $: estimatedSetupTime = getEstimatedTime(complexityScore, intent.teamSize);
  $: suggestedMilestones = getMilestones(intent.timeline, intent.projectType);
  $: resourceRequirements = getResourceRequirements(
    complexityScore,
    intent.teamSize
  );

  function calculateComplexity(intent: any): number {
    let score = 1; // Base complexity

    // Project type complexity
    const typeComplexity: Record<string, number> = {
      web: 2,
      mobile: 2.5,
      desktop: 3,
      backend: 2,
      ai: 3.5,
      fullstack: 3,
    };
    score *= typeComplexity[intent.projectType] || 1;

    // Team size factor
    const teamFactor: Record<string, number> = {
      solo: 1,
      small: 1.2,
      medium: 1.5,
      large: 2,
    };
    score *= teamFactor[intent.teamSize] || 1;

    // Timeline pressure
    const timelineFactor: Record<string, number> = {
      sprint: 1.5,
      month: 1.2,
      quarter: 1,
      "long-term": 0.8,
    };
    score *= timelineFactor[intent.timeline] || 1;

    return Math.round(score * 10) / 10;
  }

  function getEstimatedTime(complexity: number, teamSize: string): string {
    const baseHours = complexity * 8;
    const teamMultiplier: Record<string, number> = {
      solo: 1,
      small: 0.7,
      medium: 0.5,
      large: 0.4,
    };
    const hours = Math.round(baseHours * (teamMultiplier[teamSize] || 1));

    if (hours < 24) return `${hours} hours`;
    const days = Math.round(hours / 8);
    if (days < 7) return `${days} days`;
    const weeks = Math.round(days / 5);
    return `${weeks} weeks`;
  }

  function getMilestones(timeline: string, projectType: string): string[] {
    const milestones: Record<string, string[]> = {
      sprint: ["Setup & Architecture", "Core Feature", "Testing & Deploy"],
      month: [
        "Project Setup",
        "Phase 1 Features",
        "Phase 2 Features",
        "Testing & Launch",
      ],
      quarter: [
        "Foundation",
        "MVP Development",
        "Feature Expansion",
        "Beta Testing",
        "Production Launch",
      ],
      "long-term": [
        "Research & Planning",
        "Core Development",
        "Feature Development",
        "Testing & Refinement",
        "Soft Launch",
        "Full Release",
      ],
    };
    return milestones[timeline] || [];
  }

  function getResourceRequirements(
    complexity: number,
    teamSize: string
  ): { developers: string; skills: string[]; tools: string[] } {
    const devCount: Record<string, string> = {
      solo: "1 full-stack developer",
      small: "2-3 developers",
      medium: "4-8 developers",
      large: "10+ developers",
    };

    const skills =
      complexity > 3
        ? ["Senior developers", "DevOps expertise", "Architecture design"]
        : complexity > 2
        ? ["Mid-level developers", "Basic DevOps", "Code review"]
        : ["Junior/mid developers", "Version control", "Basic testing"];

    const tools =
      complexity > 3
        ? [
            "CI/CD pipeline",
            "Monitoring",
            "Load balancing",
            "Database clustering",
          ]
        : complexity > 2
        ? ["CI/CD", "Logging", "Database backups"]
        : ["Version control", "Basic deployment", "Error tracking"];

    return {
      developers: devCount[teamSize] || "1+ developers",
      skills,
      tools,
    };
  }

  // Mock name uniqueness check
  async function checkNameUniqueness(name: string) {
    if (name.length < 3) {
      nameCheckResult = null;
      return;
    }
    nameCheckResult = "checking";

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock logic: names with 'test' are taken
    const isTaken = name.toLowerCase().includes("test");
    nameCheckResult = isTaken ? "taken" : "available";
  }

  // Description quality analysis
  function analyzeDescription(desc: string) {
    if (desc.length < 20) {
      descriptionQuality = "poor";
    } else if (desc.length < 50 || !/\w+\s\w+\s\w+/.test(desc)) {
      descriptionQuality = "poor";
    } else if (desc.length < 100) {
      descriptionQuality = "good";
    } else {
      descriptionQuality = "excellent";
    }
  }

  // Apply smart defaults based on project type
  function applySmartDefaults(projectType: string) {
    const defaults: Record<string, { teamSize?: string; timeline?: string }> = {
      web: { teamSize: "small", timeline: "month" },
      mobile: { teamSize: "small", timeline: "quarter" },
      desktop: { teamSize: "medium", timeline: "quarter" },
      backend: { teamSize: "solo", timeline: "sprint" },
      ai: { teamSize: "small", timeline: "quarter" },
      fullstack: { teamSize: "medium", timeline: "quarter" },
    };

    const defaultValues = defaults[projectType];
    if (defaultValues && !intent.teamSize) {
      updateField("teamSize", defaultValues.teamSize);
    }
    if (defaultValues && !intent.timeline) {
      updateField("timeline", defaultValues.timeline);
    }
  }

  function handleTemplateSelect(
    event: CustomEvent<{ template: ProjectTemplate }>
  ) {
    selectedTemplate = event.detail.template;
    // Auto-fill form with template values
    updateField("name", event.detail.template.name);
    updateField("description", event.detail.template.description);
    updateField("projectType", event.detail.template.category);
    updateField("teamSize", event.detail.template.teamSize);
    updateField("timeline", event.detail.template.timeline);

    // Store recommended languages and stack for next steps
    wizardStore.setLanguages(event.detail.template.recommendedLanguages);
    wizardStore.setStack(event.detail.template.recommendedStack);

    // Switch back to form view with pre-filled data
    useTemplate = false;
  }

  function toggleTemplateMode() {
    useTemplate = !useTemplate;
    if (!useTemplate && selectedTemplate) {
      // Keep the filled data when switching back
    }
  }

  const projectTypes: Array<{
    value: StackCategory;
    label: string;
    icon: string;
    description: string;
  }> = [
    {
      value: "web",
      label: "Web Application",
      icon: "🌐",
      description: "Full-stack web apps, dashboards, portals",
    },
    {
      value: "mobile",
      label: "Mobile App",
      icon: "📱",
      description: "Native or cross-platform mobile applications",
    },
    {
      value: "desktop",
      label: "Desktop Application",
      icon: "💻",
      description: "Native desktop apps for Windows, macOS, Linux",
    },
    {
      value: "backend",
      label: "Backend API",
      icon: "⚡",
      description: "REST APIs, GraphQL servers, microservices",
    },
    {
      value: "ai",
      label: "AI/ML Project",
      icon: "🤖",
      description: "Machine learning models, data science, AI apps",
    },
    {
      value: "fullstack",
      label: "Full Stack",
      icon: "🚀",
      description: "Complete end-to-end application",
    },
  ];

  const teamSizes = [
    { value: "solo", label: "Solo", description: "Just me", icon: "👤" },
    {
      value: "small",
      label: "Small Team",
      description: "2-5 people",
      icon: "👥",
    },
    {
      value: "medium",
      label: "Medium Team",
      description: "6-15 people",
      icon: "👨‍👩‍👧‍👦",
    },
    {
      value: "large",
      label: "Large Team",
      description: "15+ people",
      icon: "🏢",
    },
  ];

  const timelines = [
    { value: "sprint", label: "Sprint", description: "1-2 weeks", icon: "⚡" },
    { value: "month", label: "Month", description: "2-4 weeks", icon: "📅" },
    {
      value: "quarter",
      label: "Quarter",
      description: "2-3 months",
      icon: "📊",
    },
    {
      value: "long-term",
      label: "Long-term",
      description: "3+ months",
      icon: "🎯",
    },
  ];

  function updateField(field: string, value: any) {
    wizardStore.updateIntent({ [field]: value });
  }
</script>

<div class="step-content">
  <div class="mb-8">
    <h2 class="text-3xl font-bold text-gray-900 mb-2">
      Tell us about your project
    </h2>
    <p class="text-gray-600">
      Help us understand what you're building so we can recommend the best tools
    </p>
  </div>

  <!-- Template/Analysis Toggle -->
  <div class="mb-6 grid grid-cols-3 gap-2">
    <button
      class="px-4 py-3 rounded-lg font-medium transition-all"
      class:bg-indigo-600={!useTemplate}
      class:text-white={!useTemplate}
      class:bg-gray-100={useTemplate}
      class:text-gray-700={useTemplate}
      on:click={() => (useTemplate = false)}
    >
      <span class="mr-2">✏️</span>
      Start from Scratch
    </button>
    <button
      class="px-4 py-3 rounded-lg font-medium transition-all"
      class:bg-indigo-600={useTemplate}
      class:text-white={useTemplate}
      class:bg-gray-100={!useTemplate}
      class:text-gray-700={!useTemplate}
      on:click={() => (useTemplate = true)}
    >
      <span class="mr-2">📦</span>
      Use a Template
      <span class="ml-1 text-xs opacity-75">({PROJECT_TEMPLATES.length})</span>
    </button>
    <button
      class="px-4 py-3 rounded-lg font-medium transition-all bg-gray-100 hover:bg-gray-200 text-gray-700"
      on:click={() => (showAnalysisModal = true)}
    >
      <span class="mr-2">📁</span>
      Analyze Existing
    </button>
  </div>

  {#if selectedTemplate && !useTemplate}
    <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div class="flex items-start gap-3">
        <span class="text-2xl">{selectedTemplate.icon}</span>
        <div class="flex-1">
          <h4 class="font-medium text-green-900">
            Template Applied: {selectedTemplate.name}
          </h4>
          <p class="text-sm text-green-700 mt-1">
            Form has been pre-filled with recommended settings. You can
            customize them below.
          </p>
        </div>
        <button
          class="text-green-600 hover:text-green-800"
          on:click={() => (selectedTemplate = null)}
          title="Clear template"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  {/if}

  {#if useTemplate}
    <TemplateSelector on:select={handleTemplateSelect} />
  {:else}
    <!-- Project Name -->
    <div class="mb-6">
      <label
        for="project-name"
        class="block text-sm font-medium text-gray-700 mb-2"
      >
        Project Name <span class="text-red-500">*</span>
      </label>
      <input
        id="project-name"
        type="text"
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        placeholder="e.g., My Awesome App"
        value={intent.name}
        on:input={(e) => {
          updateField("name", e.currentTarget.value);
          checkNameUniqueness(e.currentTarget.value);
        }}
      />
      {#if intent.name.length > 0 && intent.name.length < 3}
        <p class="mt-1 text-sm text-red-600">
          Name must be at least 3 characters
        </p>
      {:else if nameCheckResult === "checking"}
        <p class="mt-1 text-sm text-gray-500">
          <span class="inline-block animate-spin mr-1">⚪</span> Checking availability...
        </p>
      {:else if nameCheckResult === "taken"}
        <p class="mt-1 text-sm text-red-600">
          ⚠️ This name is already taken. Try a different name.
        </p>
      {:else if nameCheckResult === "available"}
        <p class="mt-1 text-sm text-green-600">✓ This name is available!</p>
      {/if}
      <p class="mt-1 text-xs text-gray-500">
        💡 Tip: Choose a unique, memorable name that reflects your project's
        purpose
      </p>
    </div>

    <!-- Project Description -->
    <div class="mb-6">
      <label
        for="project-description"
        class="block text-sm font-medium text-gray-700 mb-2"
      >
        Project Description <span class="text-red-500">*</span>
      </label>
      <textarea
        id="project-description"
        rows="4"
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
        placeholder="Describe what you're building, key features, and target users..."
        value={intent.description}
        on:input={(e) => {
          updateField("description", e.currentTarget.value);
          analyzeDescription(e.currentTarget.value);
        }}
      />
      <div class="mt-1 flex justify-between text-sm">
        {#if intent.description.length > 0 && intent.description.length < 10}
          <span class="text-red-600"
            >Description must be at least 10 characters</span
          >
        {:else if descriptionQuality === "poor"}
          <span class="text-amber-600">
            💡 Add more details about features and target users
          </span>
        {:else if descriptionQuality === "good"}
          <span class="text-blue-600"
            >👍 Good description, consider adding more specifics</span
          >
        {:else if descriptionQuality === "excellent"}
          <span class="text-green-600">✨ Excellent description!</span>
        {:else}
          <span class="text-gray-500">Be specific about your project goals</span
          >
        {/if}
        <span class="text-gray-400">{intent.description.length} characters</span
        >
      </div>
      <p class="mt-1 text-xs text-gray-500">
        💡 Tip: Include key features, target audience, and main goals (50-200
        characters recommended)
      </p>
    </div>

    <!-- Project Type -->
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-3">
        Project Type <span class="text-red-500">*</span>
      </label>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {#each projectTypes as type}
          <button
            class="text-left p-4 border-2 rounded-lg transition-all hover:border-indigo-300 hover:shadow-md"
            class:border-indigo-500={intent.projectType === type.value}
            class:bg-indigo-50={intent.projectType === type.value}
            class:border-gray-200={intent.projectType !== type.value}
            on:click={() => {
              updateField("projectType", type.value);
              applySmartDefaults(type.value);
            }}
          >
            <div class="flex items-start gap-3">
              <span class="text-3xl">{type.icon}</span>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 mb-1">{type.label}</h3>
                <p class="text-sm text-gray-600">{type.description}</p>
              </div>
              {#if intent.projectType === type.value}
                <svg
                  class="w-5 h-5 text-indigo-500 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              {/if}
            </div>
          </button>
        {/each}
      </div>
    </div>

    <!-- Team Size & Timeline -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- Team Size -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3"
          >Team Size</label
        >
        <div class="space-y-2">
          {#each teamSizes as size}
            <button
              class="w-full text-left px-4 py-3 border-2 rounded-lg transition-all hover:border-indigo-300"
              class:border-indigo-500={intent.teamSize === size.value}
              class:bg-indigo-50={intent.teamSize === size.value}
              class:border-gray-200={intent.teamSize !== size.value}
              on:click={() => updateField("teamSize", size.value)}
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="text-xl">{size.icon}</span>
                  <div>
                    <div class="font-medium text-gray-900">{size.label}</div>
                    <div class="text-sm text-gray-600">{size.description}</div>
                  </div>
                </div>
                {#if intent.teamSize === size.value}
                  <svg
                    class="w-5 h-5 text-indigo-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </div>

      <!-- Timeline -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-3"
          >Expected Timeline</label
        >
        <div class="space-y-2">
          {#each timelines as timeline}
            <button
              class="w-full text-left px-4 py-3 border-2 rounded-lg transition-all hover:border-indigo-300"
              class:border-indigo-500={intent.timeline === timeline.value}
              class:bg-indigo-50={intent.timeline === timeline.value}
              class:border-gray-200={intent.timeline !== timeline.value}
              on:click={() => updateField("timeline", timeline.value)}
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="text-xl">{timeline.icon}</span>
                  <div>
                    <div class="font-medium text-gray-900">
                      {timeline.label}
                    </div>
                    <div class="text-sm text-gray-600">
                      {timeline.description}
                    </div>
                  </div>
                </div>
                {#if intent.timeline === timeline.value}
                  <svg
                    class="w-5 h-5 text-indigo-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Timeline Estimation Widget -->
    {#if intent.projectType && intent.teamSize && intent.timeline}
      <div
        class="mt-6 p-6 bg-linear-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl"
      >
        <div class="flex items-start gap-4 mb-4">
          <div class="p-3 bg-indigo-600 rounded-lg">
            <svg
              class="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-gray-900 mb-1">
              Project Estimation
            </h3>
            <p class="text-sm text-gray-600">
              Based on your selections, here's what to expect
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <!-- Complexity Score -->
          <div class="bg-white p-4 rounded-lg border border-indigo-100">
            <div class="text-sm text-gray-600 mb-1">Complexity Score</div>
            <div class="text-3xl font-bold text-indigo-600 mb-1">
              {complexityScore}
            </div>
            <div class="text-xs text-gray-500">
              {#if complexityScore < 2}
                Simple project
              {:else if complexityScore < 3}
                Moderate complexity
              {:else if complexityScore < 4}
                Complex project
              {:else}
                Highly complex
              {/if}
            </div>
          </div>

          <!-- Estimated Setup Time -->
          <div class="bg-white p-4 rounded-lg border border-indigo-100">
            <div class="text-sm text-gray-600 mb-1">Estimated Setup</div>
            <div class="text-3xl font-bold text-purple-600 mb-1">
              {estimatedSetupTime}
            </div>
            <div class="text-xs text-gray-500">Initial project setup</div>
          </div>

          <!-- Team Size -->
          <div class="bg-white p-4 rounded-lg border border-indigo-100">
            <div class="text-sm text-gray-600 mb-1">Recommended Team</div>
            <div class="text-lg font-bold text-pink-600 mb-1">
              {resourceRequirements.developers}
            </div>
            <div class="text-xs text-gray-500">For optimal progress</div>
          </div>
        </div>

        <!-- Milestones -->
        {#if suggestedMilestones.length > 0}
          <div class="bg-white p-4 rounded-lg border border-indigo-100 mb-4">
            <h4
              class="font-semibold text-gray-900 mb-3 flex items-center gap-2"
            >
              <span>🎯</span>
              <span>Suggested Milestones</span>
            </h4>
            <div class="space-y-2">
              {#each suggestedMilestones as milestone, i}
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold shrink-0"
                  >
                    {i + 1}
                  </div>
                  <div class="text-sm text-gray-700">{milestone}</div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Resource Requirements -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Skills Needed -->
          <div class="bg-white p-4 rounded-lg border border-indigo-100">
            <h4
              class="font-semibold text-gray-900 mb-2 flex items-center gap-2"
            >
              <span>💪</span>
              <span>Skills Needed</span>
            </h4>
            <ul class="space-y-1">
              {#each resourceRequirements.skills as skill}
                <li class="text-sm text-gray-700 flex items-center gap-2">
                  <span class="text-green-500">✓</span>
                  <span>{skill}</span>
                </li>
              {/each}
            </ul>
          </div>

          <!-- Tools Required -->
          <div class="bg-white p-4 rounded-lg border border-indigo-100">
            <h4
              class="font-semibold text-gray-900 mb-2 flex items-center gap-2"
            >
              <span>🛠️</span>
              <span>Tools Required</span>
            </h4>
            <ul class="space-y-1">
              {#each resourceRequirements.tools as tool}
                <li class="text-sm text-gray-700 flex items-center gap-2">
                  <span class="text-blue-500">•</span>
                  <span>{tool}</span>
                </li>
              {/each}
            </ul>
          </div>
        </div>
      </div>
    {/if}

    <!-- Validation summary -->
    {#if !isValid}
      <div class="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div class="flex items-start gap-3">
          <svg
            class="w-5 h-5 text-amber-600 mt-0.5 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
          <div>
            <h4 class="font-medium text-amber-900 mb-1">
              Required fields missing
            </h4>
            <ul class="text-sm text-amber-800 space-y-1">
              {#if intent.name.length < 3}
                <li>• Project name (minimum 3 characters)</li>
              {/if}
              {#if intent.description.length < 10}
                <li>• Project description (minimum 10 characters)</li>
              {/if}
              {#if !intent.projectType}
                <li>• Project type selection</li>
              {/if}
            </ul>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Analysis Modal -->
<AnalysisModal bind:isOpen={showAnalysisModal} />

<style>
  .step-content {
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
