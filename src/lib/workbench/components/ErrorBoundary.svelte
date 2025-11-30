<!--
  ErrorBoundary.svelte

  Catches and displays rendering errors in child components.
  Provides a user-friendly error message with retry functionality.
-->
<script lang="ts">
  import { toastStore } from '$lib/stores/toast.svelte';

  interface Props {
    fallback?: string;
    onError?: (error: Error) => void;
    children?: import('svelte').Snippet;
  }

  let { fallback = 'Something went wrong. Please try again.', onError, children }: Props = $props();

  let error = $state<Error | null>(null);
  let errorInfo = $state<string | null>(null);

  function handleError(err: Error, info?: string) {
    error = err;
    errorInfo = info || null;

    // Log to console for debugging
    console.error('ErrorBoundary caught error:', err);
    if (info) console.error('Error info:', info);

    // Show toast notification
    toastStore.error('An error occurred. Please refresh or try again.');

    // Call custom error handler if provided
    if (onError) {
      onError(err);
    }
  }

  function retry() {
    error = null;
    errorInfo = null;
  }

  // Global error handler (for async errors)
  if (typeof window !== 'undefined') {
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, err) => {
      if (err) {
        handleError(err, `${message} at ${source}:${lineno}:${colno}`);
      }
      if (originalOnError) {
        originalOnError(message, source, lineno, colno, err);
      }
      return false;
    };
  }
</script>

{#if error}
  <!-- Error Display -->
  <div class="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
    <div class="mb-6">
      <!-- Error Icon -->
      <svg
        class="w-16 h-16 text-red-500 mx-auto mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>

      <!-- Error Message -->
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {fallback}
      </h3>

      {#if error.message}
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {error.message}
        </p>
      {/if}

      {#if errorInfo}
        <details class="mt-4 text-left max-w-md mx-auto">
          <summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            Technical Details
          </summary>
          <pre class="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
            {errorInfo}
          </pre>
        </details>
      {/if}
    </div>

    <!-- Actions -->
    <div class="flex gap-3">
      <button
        type="button"
        onclick={retry}
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>

      <button
        type="button"
        onclick={() => window.location.reload()}
        class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        Refresh Page
      </button>
    </div>
  </div>
{:else}
  <!-- Render children -->
  {@render children?.()}
{/if}
