<script lang="ts">
  /**
   * DeploymentPanel - Deploy prompts as APIs with environment management
   */

  import { onMount } from "svelte";
  import { toastStore } from "$lib/stores/toast.svelte";
  import * as deploymentClient from "$lib/core/api/deploymentClient";
  import type { Deployment, SDKSnippets } from "$lib/core/api/deploymentClient";

  interface Props {
    promptId: string;
    class?: string;
  }

  let { promptId, class: className = "" }: Props = $props();

  let selectedEnv = $state<"dev" | "staging" | "prod">("dev");
  let isDeploying = $state(false);
  let isLoadingDeployments = $state(true);
  let showSDKSnippets = $state(false);
  let deployedEndpoint = $state<string | null>(null);
  let sdkSnippets = $state<SDKSnippets | null>(null);

  // Deployment history - fetched from API
  let deployments = $state<Deployment[]>([]);

  async function loadDeployments() {
    try {
      isLoadingDeployments = true;
      deployments = await deploymentClient.listDeployments(promptId);
    } catch (error) {
      console.error("Failed to load deployments:", error);
      toastStore.error("Failed to load deployment history");
    } finally {
      isLoadingDeployments = false;
    }
  }

  async function handleDeploy() {
    isDeploying = true;
    try {
      const deployment = await deploymentClient.deployPrompt(
        promptId,
        selectedEnv
      );

      deployedEndpoint = deployment.endpoint;

      // Fetch SDK snippets
      sdkSnippets = await deploymentClient.getSDKSnippets(
        promptId,
        deployment.endpoint
      );

      // Reload deployment history
      await loadDeployments();

      toastStore.success("Deployment successful!", 5000);
      showSDKSnippets = true;
    } catch (error) {
      console.error("Deployment error:", error);
      toastStore.error("Deployment failed. Please try again.");
    } finally {
      isDeploying = false;
    }
  }

  onMount(() => {
    loadDeployments();
  });

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toastStore.success("Copied to clipboard!");
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
</script>

<div class="deployment-panel flex flex-col gap-4 {className}">
  <!-- Deploy Section -->
  <div class="bg-forge-gunmetal border border-slate-700 rounded-lg p-4">
    <h3 class="text-lg font-semibold text-slate-100 mb-3">Deploy as API</h3>
    <p class="text-sm text-slate-400 mb-4">
      Deploy this prompt as a production-ready API endpoint
    </p>

    <div class="flex items-center gap-3">
      <!-- Environment Selector -->
      <div class="flex-1">
        <label class="block text-xs font-medium text-slate-400 mb-2">
          Environment
        </label>
        <div
          class="flex items-center gap-1 bg-forge-deep-slate rounded border border-slate-700 p-1"
        >
          <button
            class="flex-1 px-3 py-2 text-sm transition-colors rounded {selectedEnv ===
            'dev'
              ? 'bg-forge-ember text-slate-900'
              : 'text-slate-400 hover:text-slate-200'}"
            onclick={() => (selectedEnv = "dev")}
          >
            Development
          </button>
          <button
            class="flex-1 px-3 py-2 text-sm transition-colors rounded {selectedEnv ===
            'staging'
              ? 'bg-forge-ember text-slate-900'
              : 'text-slate-400 hover:text-slate-200'}"
            onclick={() => (selectedEnv = "staging")}
          >
            Staging
          </button>
          <button
            class="flex-1 px-3 py-2 text-sm transition-colors rounded {selectedEnv ===
            'prod'
              ? 'bg-forge-ember text-slate-900'
              : 'text-slate-400 hover:text-slate-200'}"
            onclick={() => (selectedEnv = "prod")}
          >
            Production
          </button>
        </div>
      </div>

      <!-- Deploy Button -->
      <div class="pt-6">
        <button
          class="px-6 py-2 bg-forge-ember text-slate-900 font-medium rounded hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          onclick={handleDeploy}
          disabled={isDeploying}
        >
          {#if isDeploying}
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Deploying...
          {:else}
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Deploy
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- SDK Snippets (shown after successful deployment) -->
  {#if showSDKSnippets && deployedEndpoint}
    <div class="bg-forge-gunmetal border border-slate-700 rounded-lg p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-slate-100">API Endpoint</h3>
        <button
          class="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          onclick={() => (showSDKSnippets = false)}
          aria-label="Close SDK snippets"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="bg-forge-deep-slate border border-slate-700 rounded p-3 mb-4">
        <div class="flex items-center justify-between">
          <code class="text-sm text-green-400 font-mono"
            >{deployedEndpoint}</code
          >
          <button
            class="ml-2 px-2 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            onclick={() =>
              deployedEndpoint && copyToClipboard(deployedEndpoint)}
          >
            Copy
          </button>
        </div>
      </div>

      <div class="space-y-3">
        {#if sdkSnippets}
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-slate-300">TypeScript</span>
              <button
                class="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                onclick={() => copyToClipboard(sdkSnippets.typescript)}
              >
                Copy code
              </button>
            </div>
            <pre
              class="bg-forge-deep-slate border border-slate-700 rounded p-3 text-xs text-slate-300 overflow-x-auto"><code>{sdkSnippets.typescript}</code></pre>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-slate-300">Python</span>
              <button
                class="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                onclick={() => copyToClipboard(sdkSnippets.python)}
              >
                Copy code
              </button>
            </div>
            <pre
              class="bg-forge-deep-slate border border-slate-700 rounded p-3 text-xs text-slate-300 overflow-x-auto"><code>{sdkSnippets.python}</code></pre>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-slate-300">cURL</span>
              <button
                class="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                onclick={() => copyToClipboard(sdkSnippets.curl)}
              >
                Copy code
              </button>
            </div>
            <pre
              class="bg-forge-deep-slate border border-slate-700 rounded p-3 text-xs text-slate-300 overflow-x-auto"><code>{sdkSnippets.curl}</code></pre>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Deployment History -->
  <div class="bg-forge-gunmetal border border-slate-700 rounded-lg p-4">
    <h3 class="text-lg font-semibold text-slate-100 mb-3">
      Deployment History
    </h3>

    {#if isLoadingDeployments}
      <div class="flex items-center justify-center py-8 text-slate-400">
        <svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Loading deployments...
      </div>
    {:else if deployments.length === 0}
      <div class="text-center py-8 text-slate-400">
        No deployments yet. Deploy your first API above!
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-700">
              <th
                class="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase tracking-wide"
              >
                Environment
              </th>
              <th
                class="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase tracking-wide"
              >
                Endpoint
              </th>
              <th
                class="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase tracking-wide"
              >
                Version
              </th>
              <th
                class="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase tracking-wide"
              >
                Deployed
              </th>
              <th
                class="text-left py-2 px-3 text-xs font-medium text-slate-400 uppercase tracking-wide"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {#each deployments as deployment (deployment.id)}
              <tr
                class="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors"
              >
                <td class="py-3 px-3">
                  <span
                    class="px-2 py-1 text-xs font-medium rounded {deployment.environment ===
                    'prod'
                      ? 'bg-green-900/30 text-green-400'
                      : deployment.environment === 'staging'
                      ? 'bg-yellow-900/30 text-yellow-400'
                      : 'bg-blue-900/30 text-blue-400'}"
                  >
                    {deployment.environment}
                  </span>
                </td>
                <td class="py-3 px-3">
                  <code class="text-xs text-slate-300 font-mono">
                    {deployment.endpoint}
                  </code>
                </td>
                <td class="py-3 px-3 text-slate-300">{deployment.version}</td>
                <td class="py-3 px-3 text-slate-400">
                  {formatDate(deployment.deployedAt)}
                </td>
                <td class="py-3 px-3">
                  <span
                    class="flex items-center gap-1 text-xs {deployment.status ===
                    'active'
                      ? 'text-green-400'
                      : 'text-slate-500'}"
                  >
                    <span
                      class="w-2 h-2 rounded-full {deployment.status ===
                      'active'
                        ? 'bg-green-400'
                        : 'bg-slate-500'}"
                    />
                    {deployment.status}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<style>
  pre {
    font-family: "Fira Code", "Consolas", "Monaco", monospace;
  }
</style>
