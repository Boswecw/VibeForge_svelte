<script lang="ts">
  /**
   * Comments - Comment thread system for collaborative prompt editing
   */

  import { onMount } from "svelte";
  import { toastStore } from "$lib/stores/toast.svelte";

  interface Comment {
    id: string;
    author: string;
    authorId: string;
    content: string;
    createdAt: string;
    updatedAt?: string;
    lineNumber?: number;
    resolved: boolean;
    replies: Comment[];
  }

  interface Props {
    promptId: string;
    class?: string;
  }

  let { promptId, class: className = "" }: Props = $props();

  let comments = $state<Comment[]>([]);
  let newCommentText = $state("");
  let replyingTo = $state<string | null>(null);
  let replyText = $state("");
  let editingCommentId = $state<string | null>(null);
  let editText = $state("");
  let isLoading = $state(true);
  let showResolved = $state(false);

  // Mock current user
  const currentUser = {
    id: "user_123",
    name: "Test User",
  };

  // Mock comments data - will be replaced with API
  const mockComments: Comment[] = [
    {
      id: "comment_1",
      author: "Alice Johnson",
      authorId: "user_456",
      content:
        "Should we add more specific instructions about the character's background?",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      lineNumber: 5,
      resolved: false,
      replies: [
        {
          id: "comment_1_1",
          author: "Bob Smith",
          authorId: "user_789",
          content: "Good point! I'll add that in the next revision.",
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          resolved: false,
          replies: [],
        },
      ],
    },
    {
      id: "comment_2",
      author: "Test User",
      authorId: "user_123",
      content:
        "The tone might be too formal. Let's make it more conversational.",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      resolved: true,
      replies: [],
    },
  ];

  function loadComments() {
    // TODO: Load from API
    setTimeout(() => {
      comments = mockComments;
      isLoading = false;
    }, 500);
  }

  function formatTimestamp(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  async function handleAddComment() {
    if (!newCommentText.trim()) return;

    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      author: currentUser.name,
      authorId: currentUser.id,
      content: newCommentText.trim(),
      createdAt: new Date().toISOString(),
      resolved: false,
      replies: [],
    };

    // TODO: Send to API
    comments = [...comments, newComment];
    newCommentText = "";
    toastStore.success("Comment added");
  }

  async function handleAddReply(parentId: string) {
    if (!replyText.trim()) return;

    const newReply: Comment = {
      id: `reply_${Date.now()}`,
      author: currentUser.name,
      authorId: currentUser.id,
      content: replyText.trim(),
      createdAt: new Date().toISOString(),
      resolved: false,
      replies: [],
    };

    // Find parent comment and add reply
    comments = comments.map((comment) => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...comment.replies, newReply],
        };
      }
      return comment;
    });

    replyText = "";
    replyingTo = null;
    toastStore.success("Reply added");
  }

  function startEdit(comment: Comment) {
    editingCommentId = comment.id;
    editText = comment.content;
  }

  function cancelEdit() {
    editingCommentId = null;
    editText = "";
  }

  async function handleEditComment(commentId: string) {
    if (!editText.trim()) return;

    // TODO: Send to API
    comments = comments.map((comment) => {
      if (comment.id === commentId) {
        return {
          ...comment,
          content: editText.trim(),
          updatedAt: new Date().toISOString(),
        };
      }
      // Check replies
      return {
        ...comment,
        replies: comment.replies.map((reply) =>
          reply.id === commentId
            ? {
                ...reply,
                content: editText.trim(),
                updatedAt: new Date().toISOString(),
              }
            : reply
        ),
      };
    });

    editingCommentId = null;
    editText = "";
    toastStore.success("Comment updated");
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    // TODO: Send to API
    comments = comments.filter((c) => c.id !== commentId);
    toastStore.success("Comment deleted");
  }

  async function handleToggleResolved(commentId: string) {
    comments = comments.map((comment) =>
      comment.id === commentId
        ? { ...comment, resolved: !comment.resolved }
        : comment
    );
    toastStore.success("Comment status updated");
  }

  const filteredComments = $derived(
    showResolved ? comments : comments.filter((c) => !c.resolved)
  );

  onMount(() => {
    loadComments();
  });
</script>

<div class="comments-panel flex flex-col h-full {className}">
  <!-- Header -->
  <div class="flex items-center justify-between p-4 border-b border-slate-700">
    <div class="flex items-center gap-2">
      <h3 class="text-lg font-semibold text-slate-100">Comments</h3>
      <span
        class="px-2 py-0.5 text-xs font-medium bg-slate-700 text-slate-300 rounded"
      >
        {comments.length}
      </span>
    </div>
    <button
      class="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
      onclick={() => (showResolved = !showResolved)}
    >
      <input type="checkbox" bind:checked={showResolved} class="w-3 h-3" />
      Show resolved
    </button>
  </div>

  <!-- Comments List -->
  <div class="flex-1 overflow-y-auto p-4 space-y-4">
    {#if isLoading}
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
        Loading comments...
      </div>
    {:else if filteredComments.length === 0}
      <div class="text-center py-8 text-slate-400">
        <svg
          class="w-12 h-12 mx-auto mb-3 text-slate-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {showResolved ? "No comments yet" : "No unresolved comments"}
      </div>
    {:else}
      {#each filteredComments as comment (comment.id)}
        <div
          class="comment-card bg-forge-gunmetal border border-slate-700 rounded-lg p-3 {comment.resolved
            ? 'opacity-60'
            : ''}"
        >
          <!-- Comment Header -->
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-full bg-forge-ember flex items-center justify-center text-slate-900 font-medium text-sm"
              >
                {comment.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <div class="text-sm font-medium text-slate-200">
                  {comment.author}
                </div>
                <div class="text-xs text-slate-500">
                  {formatTimestamp(comment.createdAt)}
                  {#if comment.updatedAt}
                    <span class="ml-1">(edited)</span>
                  {/if}
                  {#if comment.lineNumber}
                    <span class="ml-1">• Line {comment.lineNumber}</span>
                  {/if}
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1">
              {#if comment.authorId === currentUser.id}
                <button
                  class="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                  onclick={() => startEdit(comment)}
                  title="Edit"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  class="p-1 text-slate-400 hover:text-red-400 transition-colors"
                  onclick={() => handleDeleteComment(comment.id)}
                  title="Delete"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              {/if}
              <button
                class="p-1 text-slate-400 hover:text-green-400 transition-colors"
                onclick={() => handleToggleResolved(comment.id)}
                title={comment.resolved
                  ? "Mark as unresolved"
                  : "Mark as resolved"}
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Comment Content -->
          {#if editingCommentId === comment.id}
            <div class="mb-2">
              <textarea
                bind:value={editText}
                class="w-full px-3 py-2 bg-forge-deep-slate border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-forge-ember resize-none"
                rows="3"
                placeholder="Edit your comment..."
              />
              <div class="flex items-center gap-2 mt-2">
                <button
                  class="px-3 py-1 bg-forge-ember text-slate-900 text-xs font-medium rounded hover:bg-orange-500 transition-colors"
                  onclick={() => handleEditComment(comment.id)}
                >
                  Save
                </button>
                <button
                  class="px-3 py-1 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                  onclick={cancelEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
          {:else}
            <p class="text-sm text-slate-300 mb-3">{comment.content}</p>
          {/if}

          <!-- Replies -->
          {#if comment.replies.length > 0}
            <div class="ml-6 space-y-2 border-l-2 border-slate-700 pl-3">
              {#each comment.replies as reply (reply.id)}
                <div class="reply-card">
                  <div class="flex items-start justify-between mb-1">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-slate-200 font-medium text-xs"
                      >
                        {reply.author.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span class="text-xs font-medium text-slate-300">
                          {reply.author}
                        </span>
                        <span class="text-xs text-slate-500 ml-2">
                          {formatTimestamp(reply.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p class="text-xs text-slate-400 ml-8">{reply.content}</p>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Reply Input -->
          {#if replyingTo === comment.id}
            <div class="ml-6 mt-2">
              <textarea
                bind:value={replyText}
                class="w-full px-3 py-2 bg-forge-deep-slate border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-forge-ember resize-none"
                rows="2"
                placeholder="Write a reply..."
              />
              <div class="flex items-center gap-2 mt-2">
                <button
                  class="px-3 py-1 bg-forge-ember text-slate-900 text-xs font-medium rounded hover:bg-orange-500 transition-colors"
                  onclick={() => handleAddReply(comment.id)}
                >
                  Reply
                </button>
                <button
                  class="px-3 py-1 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                  onclick={() => {
                    replyingTo = null;
                    replyText = "";
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          {:else}
            <button
              class="ml-6 mt-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              onclick={() => (replyingTo = comment.id)}
            >
              Reply
            </button>
          {/if}
        </div>
      {/each}
    {/if}
  </div>

  <!-- New Comment Input -->
  <div class="p-4 border-t border-slate-700">
    <textarea
      bind:value={newCommentText}
      class="w-full px-3 py-2 bg-forge-gunmetal border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-forge-ember resize-none mb-2"
      rows="3"
      placeholder="Add a comment..."
    />
    <button
      class="w-full px-4 py-2 bg-forge-ember text-slate-900 font-medium rounded hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      onclick={handleAddComment}
      disabled={!newCommentText.trim()}
    >
      Add Comment
    </button>
  </div>
</div>

<style>
  .comment-card {
    transition: all 0.2s ease;
  }

  .comment-card:hover {
    border-color: rgb(100, 116, 139);
  }
</style>
