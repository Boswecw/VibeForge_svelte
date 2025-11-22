<script lang="ts">
  /**
   * ShareDialog - Share prompts with team members and manage permissions
   */

  import { toastStore } from "$lib/stores/toast.svelte";

  interface ShareAccess {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    role: "view" | "edit" | "admin";
    addedAt: string;
    addedBy: string;
  }

  interface Props {
    promptId: string;
    promptName: string;
    isOpen: boolean;
    onClose: () => void;
  }

  let { promptId, promptName, isOpen, onClose }: Props = $props();

  let shareLink = $state("");
  let isPublic = $state(false);
  let inviteEmail = $state("");
  let inviteRole = $state<"view" | "edit" | "admin">("view");
  let isInviting = $state(false);
  let copyLinkSuccess = $state(false);

  // Mock access list - will be fetched from API
  let accessList = $state<ShareAccess[]>([
    {
      id: "access_1",
      userId: "user_456",
      userName: "Alice Johnson",
      userEmail: "alice@example.com",
      role: "edit",
      addedAt: new Date(Date.now() - 86400000).toISOString(),
      addedBy: "You",
    },
    {
      id: "access_2",
      userId: "user_789",
      userName: "Bob Smith",
      userEmail: "bob@example.com",
      role: "view",
      addedAt: new Date(Date.now() - 172800000).toISOString(),
      addedBy: "Alice Johnson",
    },
  ]);

  // Generate share link
  $effect(() => {
    if (isOpen) {
      const baseUrl = window.location.origin;
      const visibility = isPublic ? "public" : "private";
      shareLink = `${baseUrl}/share/${promptId}?v=${visibility}`;
    }
  });

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareLink);
      copyLinkSuccess = true;
      toastStore.success("Link copied to clipboard!");
      setTimeout(() => {
        copyLinkSuccess = false;
      }, 2000);
    } catch (error) {
      toastStore.error("Failed to copy link");
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toastStore.error("Please enter a valid email address");
      return;
    }

    isInviting = true;
    try {
      // TODO: Call API to send invitation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newAccess: ShareAccess = {
        id: `access_${Date.now()}`,
        userId: `user_${Date.now()}`,
        userName: inviteEmail.split("@")[0],
        userEmail: inviteEmail,
        role: inviteRole,
        addedAt: new Date().toISOString(),
        addedBy: "You",
      };

      accessList = [...accessList, newAccess];
      inviteEmail = "";
      inviteRole = "view";
      toastStore.success("Invitation sent!");
    } catch (error) {
      toastStore.error("Failed to send invitation");
    } finally {
      isInviting = false;
    }
  }

  async function handleRoleChange(accessId: string, newRole: "view" | "edit" | "admin") {
    accessList = accessList.map((access) =>
      access.id === accessId ? { ...access, role: newRole } : access
    );
    toastStore.success("Role updated");
  }

  async function handleRemoveAccess(accessId: string) {
    if (!confirm("Remove this person's access?")) return;

    accessList = accessList.filter((access) => access.id !== accessId);
    toastStore.success("Access removed");
  }

  function formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getRoleColor(role: string): string {
    switch (role) {
      case "admin":
        return "bg-red-900/30 text-red-400";
      case "edit":
        return "bg-yellow-900/30 text-yellow-400";
      case "view":
        return "bg-blue-900/30 text-blue-400";
      default:
        return "bg-slate-700 text-slate-300";
    }
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    onclick={onClose}
    role="button"
    tabindex="0"
  >
    <!-- Dialog -->
    <div
      class="bg-forge-gunmetal border border-slate-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-slate-700">
        <div>
          <h2 class="text-xl font-semibold text-slate-100">Share Prompt</h2>
          <p class="text-sm text-slate-400 mt-1">{promptName}</p>
        </div>
        <button
          class="p-2 text-slate-400 hover:text-slate-200 transition-colors"
          onclick={onClose}
          aria-label="Close dialog"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <!-- Share Link Section -->
        <div>
          <h3 class="text-sm font-medium text-slate-300 mb-3">Share Link</h3>

          <!-- Public Toggle -->
          <div class="flex items-center justify-between mb-3 p-3 bg-forge-deep-slate rounded border border-slate-700">
            <div>
              <div class="text-sm font-medium text-slate-200">Public Access</div>
              <div class="text-xs text-slate-400 mt-1">
                Anyone with the link can {isPublic ? "view" : "cannot access"} this prompt
              </div>
            </div>
            <button
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {isPublic
                ? 'bg-forge-ember'
                : 'bg-slate-600'}"
              onclick={() => (isPublic = !isPublic)}
              role="switch"
              aria-checked={isPublic}
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {isPublic
                  ? 'translate-x-6'
                  : 'translate-x-1'}"
              ></span>
            </button>
          </div>

          <!-- Link Input -->
          <div class="flex items-center gap-2">
            <input
              type="text"
              readonly
              value={shareLink}
              class="flex-1 px-3 py-2 bg-forge-deep-slate border border-slate-700 rounded text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-forge-ember"
            />
            <button
              class="px-4 py-2 bg-forge-ember text-slate-900 font-medium rounded hover:bg-orange-500 transition-colors flex items-center gap-2"
              onclick={handleCopyLink}
            >
              {#if copyLinkSuccess}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Copied!
              {:else}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  ></path>
                </svg>
                Copy Link
              {/if}
            </button>
          </div>
        </div>

        <!-- Invite Section -->
        <div>
          <h3 class="text-sm font-medium text-slate-300 mb-3">Invite People</h3>

          <div class="flex items-center gap-2">
            <input
              type="email"
              bind:value={inviteEmail}
              placeholder="Enter email address"
              class="flex-1 px-3 py-2 bg-forge-deep-slate border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-forge-ember"
            />
            <select
              bind:value={inviteRole}
              class="px-3 py-2 bg-forge-deep-slate border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-forge-ember"
            >
              <option value="view">View</option>
              <option value="edit">Edit</option>
              <option value="admin">Admin</option>
            </select>
            <button
              class="px-4 py-2 bg-forge-ember text-slate-900 font-medium rounded hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onclick={handleInvite}
              disabled={isInviting || !inviteEmail.trim()}
            >
              {isInviting ? "Inviting..." : "Invite"}
            </button>
          </div>

          <div class="mt-2 text-xs text-slate-500">
            <strong>View:</strong> Can view the prompt • 
            <strong>Edit:</strong> Can edit the prompt • 
            <strong>Admin:</strong> Full control
          </div>
        </div>

        <!-- Access List Section -->
        <div>
          <h3 class="text-sm font-medium text-slate-300 mb-3">
            People with access ({accessList.length})
          </h3>

          <div class="space-y-2">
            {#each accessList as access (access.id)}
              <div
                class="flex items-center justify-between p-3 bg-forge-deep-slate rounded border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    class="w-10 h-10 rounded-full bg-forge-ember flex items-center justify-center text-slate-900 font-medium flex-shrink-0"
                  >
                    {access.userName.charAt(0).toUpperCase()}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-slate-200 truncate">
                      {access.userName}
                    </div>
                    <div class="text-xs text-slate-400 truncate">{access.userEmail}</div>
                    <div class="text-xs text-slate-500 mt-1">
                      Added {formatDate(access.addedAt)} by {access.addedBy}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2 flex-shrink-0 ml-4">
                  <select
                    value={access.role}
                    onchange={(e) =>
                      handleRoleChange(access.id, e.currentTarget.value as "view" | "edit" | "admin")}
                    class="px-2 py-1 text-xs bg-forge-gunmetal border border-slate-700 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-forge-ember"
                  >
                    <option value="view">View</option>
                    <option value="edit">Edit</option>
                    <option value="admin">Admin</option>
                  </select>

                  <span class="px-2 py-1 text-xs font-medium rounded {getRoleColor(access.role)}">
                    {access.role}
                  </span>

                  <button
                    class="p-1 text-slate-400 hover:text-red-400 transition-colors"
                    onclick={() => handleRemoveAccess(access.id)}
                    title="Remove access"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-2 p-4 border-t border-slate-700">
        <button
          class="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
          onclick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
