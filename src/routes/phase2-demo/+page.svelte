<script lang="ts">
  import AnalyticsDashboard from "$lib/workbench/analytics/AnalyticsDashboard.svelte";
  import DeploymentPanel from "$lib/workbench/deployment/DeploymentPanel.svelte";
  import Comments from "$lib/workbench/collaboration/Comments.svelte";
  import ShareDialog from "$lib/workbench/collaboration/ShareDialog.svelte";
  import PromptChain from "$lib/workbench/chaining/PromptChain.svelte";

  let activeTab = $state<
    "analytics" | "deployment" | "collaboration" | "chaining"
  >("analytics");
  let showShareDialog = $state(false);
  let chainId = $state("");
</script>

<svelte:head>
  <title>Phase 2 Features - VibeForge</title>
</svelte:head>

<div class="min-h-screen bg-forge-deep-slate">
  <div class="max-w-7xl mx-auto p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-slate-100 mb-2">
        Phase 2 Features Demo
      </h1>
      <p class="text-slate-400">
        Analytics, Deployment, Collaboration, and Prompt Chaining Features for
        VibeForge
      </p>
    </div>

    <!-- Tab Navigation -->
    <div class="flex items-center gap-2 mb-6 border-b border-slate-700">
      <button
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 {activeTab ===
        'analytics'
          ? 'border-forge-ember text-slate-100'
          : 'border-transparent text-slate-400 hover:text-slate-200'}"
        onclick={() => (activeTab = "analytics")}
      >
        Analytics Dashboard
      </button>
      <button
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 {activeTab ===
        'deployment'
          ? 'border-forge-ember text-slate-100'
          : 'border-transparent text-slate-400 hover:text-slate-200'}"
        onclick={() => (activeTab = "deployment")}
      >
        Deployment Management
      </button>
      <button
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 {activeTab ===
        'collaboration'
          ? 'border-forge-ember text-slate-100'
          : 'border-transparent text-slate-400 hover:text-slate-200'}"
        onclick={() => (activeTab = "collaboration")}
      >
        Collaboration
      </button>
      <button
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 {activeTab ===
        'chaining'
          ? 'border-forge-ember text-slate-100'
          : 'border-transparent text-slate-400 hover:text-slate-200'}"
        onclick={() => (activeTab = "chaining")}
      >
        Prompt Chaining
      </button>
    </div>

    <!-- Content -->
    <div class="tab-content">
      {#if activeTab === "analytics"}
        <AnalyticsDashboard />
      {:else if activeTab === "deployment"}
        <DeploymentPanel promptId="prompt_test123" />
      {:else if activeTab === "collaboration"}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Comments Panel -->
          <div class="lg:col-span-2">
            <div
              class="bg-forge-gunmetal border border-slate-700 rounded-lg h-[600px]"
            >
              <Comments promptId="prompt_test123" class="h-full" />
            </div>
          </div>

          <!-- Actions Panel -->
          <div class="space-y-4">
            <div
              class="bg-forge-gunmetal border border-slate-700 rounded-lg p-4"
            >
              <h3 class="text-lg font-semibold text-slate-100 mb-3">
                Sharing & Permissions
              </h3>
              <p class="text-sm text-slate-400 mb-4">
                Share this prompt with your team and control who can view or
                edit it.
              </p>
              <button
                class="w-full px-4 py-2 bg-forge-ember text-slate-900 font-medium rounded hover:bg-orange-500 transition-colors"
                onclick={() => (showShareDialog = true)}
              >
                Open Share Dialog
              </button>
            </div>

            <div
              class="bg-forge-gunmetal border border-slate-700 rounded-lg p-4"
            >
              <h3 class="text-sm font-semibold text-slate-100 mb-2">
                Collaboration Features
              </h3>
              <ul class="text-xs text-slate-400 space-y-2">
                <li class="flex items-start gap-2">
                  <svg
                    class="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Threaded comments with replies
                </li>
                <li class="flex items-start gap-2">
                  <svg
                    class="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Edit and delete your comments
                </li>
                <li class="flex items-start gap-2">
                  <svg
                    class="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Mark comments as resolved
                </li>
                <li class="flex items-start gap-2">
                  <svg
                    class="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Share with public/private links
                </li>
                <li class="flex items-start gap-2">
                  <svg
                    class="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Granular permissions (View/Edit/Admin)
                </li>
                <li class="flex items-start gap-2">
                  <svg
                    class="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Team member invitations
                </li>
              </ul>
            </div>
          </div>
        </div>
      {:else if activeTab === "chaining"}
        <div
          class="bg-forge-gunmetal border border-slate-700 rounded-lg h-[700px]"
        >
          <PromptChain bind:chainId />
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Share Dialog -->
<ShareDialog
  promptId="prompt_test123"
  promptName="Test Character Prompt"
  isOpen={showShareDialog}
  onClose={() => (showShareDialog = false)}
/>
