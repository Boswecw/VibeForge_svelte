<!-- @component
no description yet
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { wizardStore } from "$lib/stores/wizard";
  import { learningStore } from "$lib/stores/learning";
  import { ALL_STACKS } from "$lib/data/stack-profiles/index";
  import type { StackProfile } from "$lib/core/types/stack-profiles";
  import { 
    checkRuntimes, 
    checkLanguageRequirements,
    type RuntimeCheckResult
  } from "$lib/api/runtimeClient";

  $: configuration = $wizardStore.configuration;
  $: selectedStackId = $wizardStore.selectedStackId;
  $: selectedStack = selectedStackId
    ? ALL_STACKS.find((s) => s.id === selectedStackId)
    : null;
  $: selectedLanguages = $wizardStore.selectedLanguages;
  
  // Runtime check state
  let runtimeCheck: RuntimeCheckResult | null = null;
  let runtimeReady = false;

  // Smart defaults based on stack
  let envTemplates: Record<string, string> = {};
  let recommendedAuth: string | null = null;
  let recommendedDb: string | null = null;
  let recommendedDeployment: string | null = null;

  onMount(async () => {
    applySmartDefaults();
    await loadRuntimeCheck();
    // Track step completion
    learningStore.trackStepCompleted(4);
  });
  
  async function loadRuntimeCheck() {
    try {
      runtimeCheck = await checkRuntimes();
      if (runtimeCheck && selectedLanguages.length > 0) {
        const requirements = checkLanguageRequirements(runtimeCheck, selectedLanguages);
        runtimeReady = requirements.allMet;
      }
    } catch (error) {
      console.error("Failed to check runtimes:", error);
      runtimeCheck = null;
    }
  }

  $: if (selectedStackId) {
    applySmartDefaults();
  }

  function applySmartDefaults() {
    if (!selectedStack) return;

    // Generate environment variable templates based on stack
    envTemplates = getEnvTemplates(selectedStack);

    // Recommend database based on stack
    recommendedDb = getRecommendedDatabase(selectedStack);

    // Recommend auth based on stack
    recommendedAuth = getRecommendedAuth(selectedStack);

    // Recommend deployment platform
    recommendedDeployment = getRecommendedDeployment(selectedStack);

    // Auto-apply if nothing selected yet
    if (!configuration.database && recommendedDb) {
      updateConfig("database", recommendedDb);
    }
    if (!configuration.authentication && recommendedAuth) {
      updateConfig("authentication", recommendedAuth);
    }
    if (!configuration.deploymentPlatform && recommendedDeployment) {
      updateConfig("deploymentPlatform", recommendedDeployment);
    }
  }

  function getEnvTemplates(stack: StackProfile): Record<string, string> {
    const templates: Record<string, string> = {};

    // Common for all stacks
    templates["NODE_ENV"] = "development";
    templates["PORT"] = "3000";

    // Stack-specific templates
    if (stack.id.includes("nextjs") || stack.id === "t3-stack") {
      templates["NEXTAUTH_SECRET"] = "your-secret-here";
      templates["NEXTAUTH_URL"] = "http://localhost:3000";
    }

    if (stack.id.includes("django") || stack.id.includes("fastapi")) {
      templates["SECRET_KEY"] = "your-secret-key";
      templates["DEBUG"] = "True";
      templates["ALLOWED_HOSTS"] = "localhost,127.0.0.1";
    }

    if (stack.id.includes("fastapi")) {
      templates["DATABASE_URL"] = "postgresql://user:pass@localhost:5432/db";
    }

    if (stack.id === "t3-stack") {
      templates["DATABASE_URL"] = "postgresql://user:pass@localhost:5432/db";
    }

    if (stack.id.includes("mern")) {
      templates["MONGODB_URI"] = "mongodb://localhost:27017/mydb";
      templates["JWT_SECRET"] = "your-jwt-secret";
    }

    return templates;
  }

  function getRecommendedDatabase(stack: StackProfile): string | null {
    if (stack.id.includes("mern")) return "mongodb";
    if (stack.id.includes("django")) return "postgresql";
    if (stack.id.includes("fastapi")) return "postgresql";
    if (stack.id === "t3-stack") return "postgresql";
    if (stack.id.includes("laravel")) return "mysql";
    if (stack.id.includes("golang")) return "postgresql";
    return null;
  }

  function getRecommendedAuth(stack: StackProfile): string | null {
    if (stack.id === "t3-stack" || stack.id.includes("nextjs")) return "oauth";
    if (stack.id.includes("fastapi")) return "jwt";
    if (stack.id.includes("mern")) return "jwt";
    if (stack.id.includes("django")) return "session";
    return null;
  }

  function getRecommendedDeployment(stack: StackProfile): string | null {
    if (stack.id.includes("nextjs") || stack.id === "t3-stack") return "vercel";
    if (stack.id.includes("sveltekit") || stack.id.includes("solid"))
      return "netlify";
    if (stack.id.includes("fastapi") || stack.id.includes("django"))
      return "docker";
    if (stack.id.includes("golang")) return "docker";
    return "vercel";
  }

  const databaseOptions = [
    {
      value: "postgresql",
      label: "PostgreSQL",
      icon: "🐘",
      description: "Production-ready relational database",
    },
    {
      value: "mysql",
      label: "MySQL",
      icon: "🐬",
      description: "Popular open-source RDBMS",
    },
    {
      value: "mongodb",
      label: "MongoDB",
      icon: "🍃",
      description: "Flexible document database",
    },
    {
      value: "sqlite",
      label: "SQLite",
      icon: "📦",
      description: "Lightweight embedded database",
    },
    {
      value: "redis",
      label: "Redis",
      icon: "⚡",
      description: "In-memory data store",
    },
  ];

  const authOptions = [
    {
      value: "jwt",
      label: "JWT",
      icon: "🔑",
      description: "Token-based authentication",
    },
    {
      value: "oauth",
      label: "OAuth 2.0",
      icon: "🔐",
      description: "Third-party auth (Google, GitHub)",
    },
    {
      value: "session",
      label: "Session",
      icon: "🍪",
      description: "Traditional session-based auth",
    },
    {
      value: "firebase",
      label: "Firebase Auth",
      icon: "🔥",
      description: "Firebase authentication",
    },
  ];

  const deploymentOptions = [
    {
      value: "vercel",
      label: "Vercel",
      icon: "▲",
      description: "Zero-config deployment",
    },
    {
      value: "netlify",
      label: "Netlify",
      icon: "🌐",
      description: "Modern web deployment",
    },
    {
      value: "docker",
      label: "Docker",
      icon: "🐳",
      description: "Containerized deployment",
    },
    {
      value: "aws",
      label: "AWS",
      icon: "☁️",
      description: "Amazon Web Services",
    },
    {
      value: "heroku",
      label: "Heroku",
      icon: "💜",
      description: "Platform as a Service",
    },
  ];

  const commonFeatures = [
    "API documentation (Swagger/OpenAPI)",
    "Database migrations",
    "Unit testing setup",
    "E2E testing setup",
    "CI/CD pipeline",
    "Docker containerization",
    "Environment variable management",
    "Logging and monitoring",
    "Error tracking (Sentry)",
    "Code formatting (Prettier/ESLint)",
    "Git hooks (Husky)",
    "Type checking",
  ];

  let newEnvKey = "";
  let newEnvValue = "";

  function updateConfig(field: string, value: any) {
    wizardStore.updateConfiguration({ [field]: value });
  }

  function addEnvVariable() {
    if (newEnvKey.trim() && newEnvValue.trim()) {
      wizardStore.setEnvironmentVariable(newEnvKey.trim(), newEnvValue.trim());
      newEnvKey = "";
      newEnvValue = "";
    }
  }

  function applyEnvTemplate(key: string) {
    if (envTemplates[key]) {
      newEnvKey = key;
      newEnvValue = envTemplates[key];
    }
  }

  function removeEnvVariable(key: string) {
    wizardStore.removeEnvironmentVariable(key);
  }

  function getCompatibilityWarning(
    option: string,
    type: "database" | "auth" | "deployment"
  ): string | null {
    if (!selectedStack) return null;

    if (type === "database") {
      if (option === "mongodb" && !selectedStack.id.includes("mern"))
        return "MongoDB works best with MERN stacks";
      if (option === "mysql" && selectedStack.id.includes("mern"))
        return "PostgreSQL or MongoDB recommended for MERN";
    }

    return null;
  }

  function toggleFeature(feature: string) {
    const features = configuration.features || [];
    if (features.includes(feature)) {
      updateConfig(
        "features",
        features.filter((f) => f !== feature)
      );
    } else {
      updateConfig("features", [...features, feature]);
    }
  }

  $: envEntries = Object.entries(configuration.environmentVariables || {});
  $: selectedFeatures = configuration.features || [];
</script>

<div class="step-content">
  <div class="mb-8">
    <h2 class="text-3xl font-bold text-gray-900 mb-2">
      Configure Your Project
    </h2>
    <p class="text-gray-600">
      Optional settings to customize your project setup
    </p>
  </div>

  <!-- Runtime Status Summary -->
  {#if runtimeCheck}
    <div class="mb-6 p-4 rounded-lg border-2 {runtimeReady ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}">
      <div class="flex items-start gap-3">
        <span class="text-2xl">{runtimeReady ? '✅' : '⚠️'}</span>
        <div class="flex-1">
          <h4 class="font-medium {runtimeReady ? 'text-green-900' : 'text-amber-900'}">
            Development Environment Status
          </h4>
          {#if runtimeReady}
            <p class="text-sm {runtimeReady ? 'text-green-800' : 'text-amber-800'} mt-1">
              All required language runtimes are installed and ready.
            </p>
          {:else}
            <p class="text-sm text-amber-800 mt-1">
              Some required runtimes are missing. Your project will still be generated, but you'll need to install them before running it.
            </p>
            <a 
              href="/dev-environment" 
              class="inline-flex items-center text-sm font-medium text-amber-700 hover:text-amber-900 underline mt-2"
            >
              Check Runtime Status →
            </a>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Database Selection -->
  <div class="mb-8">
    <h3 class="text-lg font-semibold text-gray-900 mb-3">Database</h3>
    {#if selectedStack && recommendedDb}
      <p class="text-sm text-gray-600 mb-3">
        💡 Recommended for {selectedStack.name}:
        <span class="font-medium text-indigo-600">
          {databaseOptions.find((d) => d.value === recommendedDb)?.label}
        </span>
      </p>
    {/if}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {#each databaseOptions as db}
        {@const warning = getCompatibilityWarning(db.value, "database")}
        <button
          class="text-left p-4 border-2 rounded-lg transition-all hover:border-indigo-300 relative"
          class:border-indigo-500={configuration.database === db.value}
          class:bg-indigo-50={configuration.database === db.value}
          class:border-gray-200={configuration.database !== db.value}
          on:click={() =>
            updateConfig(
              "database",
              configuration.database === db.value ? undefined : db.value
            )}
        >
          {#if db.value === recommendedDb}
            <span
              class="absolute -top-2 -right-2 px-2 py-1 bg-indigo-500 text-white text-xs rounded-full font-medium"
            >
              ⭐ Recommended
            </span>
          {/if}
          <div class="flex items-start gap-3">
            <span class="text-2xl">{db.icon}</span>
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-gray-900">{db.label}</h4>
              <p class="text-sm text-gray-600">{db.description}</p>
              {#if warning}
                <p class="text-xs text-amber-600 mt-1">⚠️ {warning}</p>
              {/if}
            </div>
            {#if configuration.database === db.value}
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

  <!-- Authentication -->
  <div class="mb-8">
    <h3 class="text-lg font-semibold text-gray-900 mb-3">Authentication</h3>
    {#if selectedStack && recommendedAuth}
      <p class="text-sm text-gray-600 mb-3">
        💡 Recommended for {selectedStack.name}:
        <span class="font-medium text-indigo-600">
          {authOptions.find((a) => a.value === recommendedAuth)?.label}
        </span>
      </p>
    {/if}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      {#each authOptions as auth}
        <button
          class="text-left p-4 border-2 rounded-lg transition-all hover:border-indigo-300 relative"
          class:border-indigo-500={configuration.authentication === auth.value}
          class:bg-indigo-50={configuration.authentication === auth.value}
          class:border-gray-200={configuration.authentication !== auth.value}
          on:click={() =>
            updateConfig(
              "authentication",
              configuration.authentication === auth.value
                ? undefined
                : auth.value
            )}
        >
          {#if auth.value === recommendedAuth}
            <span
              class="absolute -top-2 -right-2 px-2 py-1 bg-indigo-500 text-white text-xs rounded-full font-medium"
            >
              ⭐ Recommended
            </span>
          {/if}
          <div class="flex items-start gap-3">
            <span class="text-2xl">{auth.icon}</span>
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-gray-900">{auth.label}</h4>
              <p class="text-sm text-gray-600">{auth.description}</p>
            </div>
            {#if configuration.authentication === auth.value}
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

  <!-- Deployment Platform -->
  <div class="mb-8">
    <h3 class="text-lg font-semibold text-gray-900 mb-3">
      Deployment Platform
    </h3>
    {#if selectedStack && recommendedDeployment}
      <p class="text-sm text-gray-600 mb-3">
        💡 Recommended for {selectedStack.name}:
        <span class="font-medium text-indigo-600">
          {deploymentOptions.find((d) => d.value === recommendedDeployment)
            ?.label}
        </span>
      </p>
    {/if}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {#each deploymentOptions as deploy}
        <button
          class="text-left p-4 border-2 rounded-lg transition-all hover:border-indigo-300 relative"
          class:border-indigo-500={configuration.deploymentPlatform ===
            deploy.value}
          class:bg-indigo-50={configuration.deploymentPlatform === deploy.value}
          class:border-gray-200={configuration.deploymentPlatform !==
            deploy.value}
          on:click={() =>
            updateConfig(
              "deploymentPlatform",
              configuration.deploymentPlatform === deploy.value
                ? undefined
                : deploy.value
            )}
        >
          {#if deploy.value === recommendedDeployment}
            <span
              class="absolute -top-2 -right-2 px-2 py-1 bg-indigo-500 text-white text-xs rounded-full font-medium"
            >
              ⭐ Recommended
            </span>
          {/if}
          <div class="flex items-start gap-3">
            <span class="text-2xl">{deploy.icon}</span>
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-gray-900">{deploy.label}</h4>
              <p class="text-sm text-gray-600">{deploy.description}</p>
            </div>
            {#if configuration.deploymentPlatform === deploy.value}
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

  <!-- Environment Variables -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold text-gray-900">
        Environment Variables
      </h3>
      {#if Object.keys(envTemplates).length > 0 && selectedStack}
        <span class="text-sm text-indigo-600 font-medium">
          📋 {Object.keys(envTemplates).length} templates for {selectedStack.name}
        </span>
      {/if}
    </div>

    <!-- Template Suggestions -->
    {#if Object.keys(envTemplates).length > 0 && selectedStack}
      <div class="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <p class="text-sm text-gray-700 mb-2 font-medium">
          💡 Suggested variables for {selectedStack.name}:
        </p>
        <div class="flex flex-wrap gap-2">
          {#each Object.keys(envTemplates) as templateKey}
            <button
              class="px-3 py-1 bg-white border border-indigo-300 rounded-lg text-sm hover:bg-indigo-100 transition-colors"
              on:click={() => applyEnvTemplate(templateKey)}
              disabled={envEntries.some(([k]) => k === templateKey)}
            >
              {templateKey}
              {#if envEntries.some(([k]) => k === templateKey)}
                <span class="ml-1">✓</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <div class="space-y-3">
      {#if envEntries.length > 0}
        <div class="space-y-2">
          {#each envEntries as [key, value]}
            <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <code class="flex-1 text-sm font-mono">
                <span class="text-indigo-600">{key}</span> =
                <span class="text-gray-700">{value}</span>
              </code>
              <button
                class="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                on:click={() => removeEnvVariable(key)}
                title="Remove variable"
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
          {/each}
        </div>
      {/if}

      <div class="flex gap-2">
        <input
          type="text"
          placeholder="KEY"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
          bind:value={newEnvKey}
          on:keydown={(e) => e.key === "Enter" && addEnvVariable()}
        />
        <input
          type="text"
          placeholder="value"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
          bind:value={newEnvValue}
          on:keydown={(e) => e.key === "Enter" && addEnvVariable()}
        />
        <button
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!newEnvKey.trim() || !newEnvValue.trim()}
          on:click={addEnvVariable}
        >
          Add
        </button>
      </div>
    </div>
  </div>

  <!-- Additional Features -->
  <div class="mb-8">
    <h3 class="text-lg font-semibold text-gray-900 mb-3">
      Additional Features
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
      {#each commonFeatures as feature}
        <label
          class="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:border-indigo-300"
          class:border-indigo-500={selectedFeatures.includes(feature)}
          class:bg-indigo-50={selectedFeatures.includes(feature)}
          class:border-gray-200={!selectedFeatures.includes(feature)}
        >
          <input
            type="checkbox"
            checked={selectedFeatures.includes(feature)}
            on:change={() => toggleFeature(feature)}
            class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
          />
          <span class="text-sm text-gray-900">{feature}</span>
        </label>
      {/each}
    </div>
  </div>

  <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <div class="flex items-start gap-3">
      <svg
        class="w-5 h-5 text-blue-600 mt-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clip-rule="evenodd"
        />
      </svg>
      <div>
        <h4 class="font-medium text-blue-900">All settings are optional</h4>
        <p class="text-sm text-blue-800 mt-1">
          You can skip this step and configure these later
        </p>
      </div>
    </div>
  </div>
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
