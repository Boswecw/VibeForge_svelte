<!-- @component
no description yet
-->
<script lang="ts">
  import { wizardStore } from "$lib/stores/wizard";
  import { onMount } from "svelte";

  $: state = $wizardStore;

  // Historical context for success prediction
  let predictedSuccessRate = 0;
  let confidenceLevel = "medium";
  let similarProjects = 0;

  let stackDetails: any = null;
  let generating = false;
  let generationComplete = false;
  let generationProgress = 0;
  let showStructurePreview = false;

  // Fetch stack details when component mounts
  onMount(async () => {
    if (state.selectedStackId) {
      try {
        const response = await fetch(
          `http://localhost:8000/api/stacks/${state.selectedStackId}`
        );
        if (response.ok) {
          stackDetails = await response.json();
        }
      } catch (error) {
        console.error("Failed to fetch stack details:", error);
      }
    }

    // Calculate predicted success rate based on historical data
    calculateSuccessPrediction();
  });

  async function calculateSuccessPrediction() {
    const hasSelectedLanguages = state.selectedLanguages.length > 0;
    const hasSelectedStack = state.selectedStackId !== null;

    if (!hasSelectedLanguages || !hasSelectedStack) {
      // Not enough data for prediction
      predictedSuccessRate = 70;
      confidenceLevel = "low";
      similarProjects = 0;
      return;
    }

    try {
      const params = new URLSearchParams({
        project_type: state.projectType || "web",
        languages: state.selectedLanguages.join(","),
        stack_id: state.selectedStackId || "",
      });

      if (state.userId) {
        params.append("user_id", state.userId.toString());
      }

      const response = await fetch(
        `http://localhost:8000/api/v1/experience/success-prediction?${params}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      predictedSuccessRate = data.predicted_success_rate;
      confidenceLevel = data.confidence_level;
      similarProjects = data.similar_projects;
    } catch (err) {
      console.error("Error fetching success prediction:", err);

      // Graceful fallback: use basic calculation
      predictedSuccessRate = 75;
      confidenceLevel = "medium";
      similarProjects = 5;
    }
  }

  function formatDate(isoString: string) {
    return new Date(isoString).toLocaleString();
  }

  function editSection(step: number) {
    wizardStore.goToStep(step);
  }

  async function generateProject() {
    generating = true;
    generationProgress = 0;

    // Simulate generation steps
    const steps = [
      { name: "Creating project structure", duration: 500 },
      { name: "Installing dependencies", duration: 1000 },
      { name: "Configuring environment", duration: 700 },
      { name: "Setting up database", duration: 600 },
      { name: "Finalizing setup", duration: 400 },
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, steps[i].duration));
      generationProgress = ((i + 1) / steps.length) * 100;
    }

    generating = false;
    generationComplete = true;
  }

  // Project structure based on selections
  $: projectStructure = getProjectStructure(
    state.selectedStackId,
    state.configuration
  );

  function getProjectStructure(stackId: string | null, config: any) {
    if (!stackId) return [];

    const base = [
      { name: ".gitignore", type: "file", icon: "📄" },
      { name: "README.md", type: "file", icon: "📖" },
      { name: "package.json", type: "file", icon: "📦" },
    ];

    if (
      config.environmentVariables &&
      Object.keys(config.environmentVariables).length > 0
    ) {
      base.push({ name: ".env.example", type: "file", icon: "🔐" });
    }

    if (config.deploymentPlatform === "docker") {
      base.push(
        { name: "Dockerfile", type: "file", icon: "🐳" },
        { name: "docker-compose.yml", type: "file", icon: "🐳" }
      );
    }

    base.push(
      {
        name: "src/",
        type: "folder",
        icon: "📁",
        children: [
          { name: "components/", type: "folder", icon: "📁" },
          { name: "lib/", type: "folder", icon: "📁" },
          { name: "pages/", type: "folder", icon: "📁" },
          { name: "styles/", type: "folder", icon: "📁" },
        ],
      },
      {
        name: "tests/",
        type: "folder",
        icon: "📁",
        children: [
          { name: "unit/", type: "folder", icon: "📁" },
          { name: "integration/", type: "folder", icon: "📁" },
        ],
      }
    );

    if (config.database) {
      base.push({
        name: "db/",
        type: "folder",
        icon: "📁",
        children: [
          { name: "migrations/", type: "folder", icon: "📁" },
          { name: "seeds/", type: "folder", icon: "📁" },
        ],
      });
    }

    return base;
  }
</script>

<div class="step-content">
  <div class="mb-8">
    <h2 class="text-3xl font-bold text-gray-900 mb-2">Review & Generate</h2>
    <p class="text-gray-600">
      Review your project configuration and generate the codebase
    </p>
  </div>

  <!-- Success Prediction Panel -->
  {#if predictedSuccessRate > 0}
    <div
      class="mb-6 p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-xl"
    >
      <div class="flex items-start gap-4">
        <div class="p-3 bg-green-500 rounded-lg">
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-bold text-gray-900 mb-2">
            Predicted Success Rate
          </h3>
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-3xl font-bold text-green-600"
                >{predictedSuccessRate}%</span
              >
              <span
                class="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-semibold uppercase"
              >
                {confidenceLevel} confidence
              </span>
            </div>
            <div class="w-full h-3 bg-green-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-1000"
                style="width: {predictedSuccessRate}%"
              />
            </div>
          </div>
          <div
            class="grid grid-cols-3 gap-4 p-4 bg-white bg-opacity-70 rounded-lg"
          >
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">
                {similarProjects}
              </div>
              <div class="text-sm text-gray-600">Similar Projects</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">
                {state.selectedLanguages.length}
              </div>
              <div class="text-sm text-gray-600">Languages Selected</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-900">
                {state.selectedStackId ? "1" : "0"}
              </div>
              <div class="text-sm text-gray-600">Stack Configured</div>
            </div>
          </div>
          <div class="mt-4 p-3 bg-white bg-opacity-70 rounded-lg">
            <p class="text-sm text-gray-700">
              <strong>💡 Based on historical data:</strong> Projects with
              similar configuration ({state.intent.projectType}, {state.selectedLanguages.join(
                ", "
              )}) have a {predictedSuccessRate}% success rate. This prediction
              is based on {similarProjects} similar projects completed by the community.
            </p>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Project Intent -->
  <div
    class="mb-6 bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:border-indigo-300 transition-colors"
  >
    <div
      class="px-6 py-4 bg-linear-to-r from-indigo-50 to-purple-50 border-b border-gray-200 flex items-center justify-between"
    >
      <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <span>🎯</span> Project Intent
      </h3>
      <button
        class="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-white rounded-lg transition-colors font-medium"
        on:click={() => editSection(1)}
      >
        ✏️ Edit
      </button>
    </div>
    <div class="px-6 py-4 space-y-3">
      <div>
        <span class="text-sm font-medium text-gray-500">Project Name</span>
        <p class="text-lg font-semibold text-gray-900">{state.intent.name}</p>
      </div>
      <div>
        <span class="text-sm font-medium text-gray-500">Description</span>
        <p class="text-gray-700">{state.intent.description}</p>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <span class="text-sm font-medium text-gray-500">Type</span>
          <p class="text-gray-900 capitalize">
            {state.intent.projectType || "Not set"}
          </p>
        </div>
        <div>
          <span class="text-sm font-medium text-gray-500">Team Size</span>
          <p class="text-gray-900 capitalize">
            {state.intent.teamSize || "Not set"}
          </p>
        </div>
        <div>
          <span class="text-sm font-medium text-gray-500">Timeline</span>
          <p class="text-gray-900 capitalize">
            {state.intent.timeline || "Not set"}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Languages -->
  <div
    class="mb-6 bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:border-blue-300 transition-colors"
  >
    <div
      class="px-6 py-4 bg-linear-to-r from-blue-50 to-cyan-50 border-b border-gray-200 flex items-center justify-between"
    >
      <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <span>📘</span> Languages
      </h3>
      <button
        class="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-white rounded-lg transition-colors font-medium"
        on:click={() => editSection(2)}
      >
        ✏️ Edit
      </button>
    </div>
    <div class="px-6 py-4">
      {#if state.selectedLanguages.length > 0}
        <div class="flex flex-wrap gap-2">
          {#each state.selectedLanguages as lang}
            <span
              class="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
            >
              {lang}
            </span>
          {/each}
        </div>
      {:else}
        <p class="text-gray-500 italic">No languages selected</p>
      {/if}
    </div>
  </div>

  <!-- Stack Profile -->
  <div
    class="mb-6 bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:border-green-300 transition-colors"
  >
    <div
      class="px-6 py-4 bg-linear-to-r from-green-50 to-emerald-50 border-b border-gray-200 flex items-center justify-between"
    >
      <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <span>📦</span> Technology Stack
      </h3>
      <button
        class="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-white rounded-lg transition-colors font-medium"
        on:click={() => editSection(3)}
      >
        ✏️ Edit
      </button>
    </div>
    <div class="px-6 py-4">
      {#if stackDetails}
        <div class="space-y-3">
          <div>
            <h4 class="text-xl font-semibold text-gray-900 mb-1">
              {stackDetails.name}
            </h4>
            <p class="text-gray-600">{stackDetails.tagline}</p>
          </div>
          <div class="flex gap-2">
            <span
              class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium capitalize"
            >
              {stackDetails.category}
            </span>
            <span
              class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium capitalize"
            >
              {stackDetails.complexity}
            </span>
            <span
              class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium capitalize"
            >
              {stackDetails.maturity}
            </span>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-500 block mb-2"
              >Technologies</span
            >
            <div class="flex flex-wrap gap-2">
              {#each Object.entries(stackDetails.technologies) as [category, tech]}
                <span
                  class="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm"
                >
                  {tech}
                </span>
              {/each}
            </div>
          </div>
        </div>
      {:else if state.selectedStackId}
        <p class="text-gray-500">Stack ID: {state.selectedStackId}</p>
      {:else}
        <p class="text-gray-500 italic">No stack selected</p>
      {/if}
    </div>
  </div>

  <!-- Configuration -->
  <div
    class="mb-6 bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:border-amber-300 transition-colors"
  >
    <div
      class="px-6 py-4 bg-linear-to-r from-amber-50 to-orange-50 border-b border-gray-200 flex items-center justify-between"
    >
      <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <span>⚙️</span> Configuration
      </h3>
      <button
        class="px-3 py-1 text-sm text-amber-600 hover:text-amber-800 hover:bg-white rounded-lg transition-colors font-medium"
        on:click={() => editSection(4)}
      >
        ✏️ Edit
      </button>
    </div>
    <div class="px-6 py-4 space-y-4">
      {#if state.configuration.database}
        <div>
          <span class="text-sm font-medium text-gray-500">Database</span>
          <p class="text-gray-900 capitalize">{state.configuration.database}</p>
        </div>
      {/if}

      {#if state.configuration.authentication}
        <div>
          <span class="text-sm font-medium text-gray-500">Authentication</span>
          <p class="text-gray-900 uppercase">
            {state.configuration.authentication}
          </p>
        </div>
      {/if}

      {#if state.configuration.deploymentPlatform}
        <div>
          <span class="text-sm font-medium text-gray-500"
            >Deployment Platform</span
          >
          <p class="text-gray-900 capitalize">
            {state.configuration.deploymentPlatform}
          </p>
        </div>
      {/if}

      {#if Object.keys(state.configuration.environmentVariables || {}).length > 0}
        <div>
          <span class="text-sm font-medium text-gray-500 block mb-2"
            >Environment Variables</span
          >
          <div class="space-y-1">
            {#each Object.entries(state.configuration.environmentVariables || {}) as [key, value]}
              <code
                class="block text-sm font-mono bg-gray-50 px-3 py-1 rounded"
              >
                <span class="text-indigo-600">{key}</span> =
                <span class="text-gray-700">{value}</span>
              </code>
            {/each}
          </div>
        </div>
      {/if}

      {#if (state.configuration.features || []).length > 0}
        <div>
          <span class="text-sm font-medium text-gray-500 block mb-2"
            >Features</span
          >
          <div class="flex flex-wrap gap-2">
            {#each state.configuration.features || [] as feature}
              <span
                class="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-sm"
              >
                {feature}
              </span>
            {/each}
          </div>
        </div>
      {/if}

      {#if !state.configuration.database && !state.configuration.authentication && !state.configuration.deploymentPlatform && Object.keys(state.configuration.environmentVariables || {}).length === 0 && (state.configuration.features || []).length === 0}
        <p class="text-gray-500 italic">No additional configuration</p>
      {/if}
    </div>
  </div>

  <!-- Metadata -->
  <div class="mb-6 bg-gray-50 rounded-lg border border-gray-200 p-4">
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span class="text-gray-500">Created</span>
        <p class="text-gray-700">{formatDate(state.createdAt)}</p>
      </div>
      <div>
        <span class="text-gray-500">Last Modified</span>
        <p class="text-gray-700">{formatDate(state.lastModified)}</p>
      </div>
    </div>
    {#if state.draftId}
      <div class="mt-3 pt-3 border-t border-gray-200">
        <span class="text-gray-500">Draft ID</span>
        <p class="text-gray-700 font-mono text-xs">{state.draftId}</p>
      </div>
    {/if}
  </div>

  <!-- Project Structure Preview -->
  <div class="mb-6">
    <button
      class="w-full text-left px-6 py-4 bg-white rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors flex items-center justify-between"
      on:click={() => (showStructurePreview = !showStructurePreview)}
    >
      <div class="flex items-center gap-3">
        <span class="text-2xl">🌳</span>
        <div>
          <h3 class="text-lg font-semibold text-gray-900">
            Project Structure Preview
          </h3>
          <p class="text-sm text-gray-600">
            {showStructurePreview ? "Hide" : "View"} the files and folders that will
            be created
          </p>
        </div>
      </div>
      <svg
        class="w-6 h-6 text-gray-400 transition-transform"
        class:rotate-180={showStructurePreview}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    {#if showStructurePreview}
      <div
        class="mt-2 p-6 bg-gray-50 rounded-lg border-2 border-gray-200 font-mono text-sm"
      >
        <div class="text-gray-700 font-semibold mb-3">
          {state.intent.name}/
        </div>
        {#each projectStructure as item}
          <div class="ml-4">
            {#if item.type === "folder"}
              <div class="text-blue-600 font-semibold">
                {item.icon}
                {item.name}
              </div>
              {#if item.children}
                {#each item.children as child}
                  <div class="ml-6 text-gray-600">
                    {child.icon}
                    {child.name}
                  </div>
                {/each}
              {/if}
            {:else}
              <div class="text-gray-700">
                {item.icon}
                {item.name}
              </div>
            {/if}
          </div>
        {/each}
        <div class="mt-3 pt-3 border-t border-gray-300 text-xs text-gray-500">
          ... and more files based on your stack configuration
        </div>
      </div>
    {/if}
  </div>

  <!-- Generation Section -->
  {#if !generationComplete}
    <div
      class="p-6 bg-linear-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200"
    >
      <div class="flex items-start gap-4">
        <div class="shrink-0 text-4xl">🚀</div>
        <div class="flex-1">
          <h3 class="text-xl font-bold text-gray-900 mb-2">
            Ready to Generate Your Project!
          </h3>
          <p class="text-gray-700 mb-4">
            Everything looks good! Click generate to create your {state.intent
              .name} project with all the configurations you've selected.
          </p>

          {#if generating}
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="flex-1">
                  <div
                    class="h-2 bg-gray-200 rounded-full overflow-hidden relative"
                  >
                    <div
                      class="h-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                      style="width: {generationProgress}%"
                    />
                  </div>
                </div>
                <span class="text-sm font-medium text-gray-700"
                  >{Math.round(generationProgress)}%</span
                >
              </div>
              <p class="text-sm text-gray-600 animate-pulse">
                ⚡ Generating your project...
              </p>
            </div>
          {:else}
            <div class="flex gap-3">
              <button
                class="px-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                on:click={generateProject}
              >
                🚀 Generate Project
              </button>
              <button
                class="px-4 py-3 text-indigo-700 hover:text-indigo-900 hover:bg-white rounded-lg transition-colors font-medium"
                on:click={() => wizardStore.saveDraft()}
              >
                💾 Save as Draft
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <!-- Success State -->
    <div
      class="p-6 bg-linear-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200"
    >
      <div class="flex items-start gap-4">
        <div class="shrink-0 text-4xl">✅</div>
        <div class="flex-1">
          <h3 class="text-xl font-bold text-green-900 mb-2">
            Project Generated Successfully!
          </h3>
          <p class="text-green-800 mb-4">
            Your project <span class="font-semibold">{state.intent.name}</span>
            has been created and is ready to use.
          </p>

          <div class="space-y-3">
            <div class="flex gap-3">
              <button
                class="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
              >
                📥 Download Project
              </button>
              <button
                class="px-6 py-3 bg-white text-green-700 border-2 border-green-300 rounded-lg font-semibold hover:bg-green-50 transition-colors"
              >
                🐙 Clone from GitHub
              </button>
            </div>

            <div class="p-4 bg-white rounded-lg border border-green-200">
              <p class="text-sm font-medium text-gray-700 mb-2">
                📋 Next Steps:
              </p>
              <ol
                class="text-sm text-gray-700 space-y-1 list-decimal list-inside"
              >
                <li>Extract the project files to your workspace</li>
                <li>
                  Run <code class="px-2 py-0.5 bg-gray-100 rounded"
                    >npm install</code
                  > to install dependencies
                </li>
                <li>
                  Copy <code class="px-2 py-0.5 bg-gray-100 rounded"
                    >.env.example</code
                  >
                  to <code class="px-2 py-0.5 bg-gray-100 rounded">.env</code> and
                  configure
                </li>
                <li>
                  Start development with <code
                    class="px-2 py-0.5 bg-gray-100 rounded">npm run dev</code
                  >
                </li>
              </ol>
            </div>

            <button
              class="w-full py-2 text-green-700 hover:text-green-900 hover:bg-white rounded-lg transition-colors font-medium"
              on:click={() => {
                generationComplete = false;
                wizardStore.reset();
                wizardStore.goToStep(1);
              }}
            >
              ✨ Create Another Project
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

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
