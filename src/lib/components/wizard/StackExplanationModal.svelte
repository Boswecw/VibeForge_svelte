<!-- @component
no description yet
-->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { stackRecommendationService } from "$lib/services/recommendations";

  export let isOpen: boolean = false;
  export let stackName: string = "";
  export let projectType: string = "";
  export let languages: string[] = [];

  const dispatch = createEventDispatcher<{ close: void }>();

  let explanation: string = "";
  let loading: boolean = false;
  let error: string = "";

  $: if (isOpen && stackName) {
    loadExplanation();
  }

  async function loadExplanation() {
    loading = true;
    error = "";
    explanation = "";

    try {
      explanation = await stackRecommendationService.explainStack(
        stackName,
        projectType,
        languages
      );
    } catch (err) {
      console.error("Failed to load explanation:", err);
      error = err instanceof Error ? err.message : "Failed to load explanation";
      // Fallback explanation
      explanation = `${stackName} is a well-established technology stack that combines multiple frameworks and tools to provide a comprehensive development solution.`;
    } finally {
      loading = false;
    }
  }

  function handleClose() {
    dispatch("close");
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }
</script>

{#if isOpen}
  <div class="modal-backdrop" onclick={handleBackdropClick} role="presentation">
    <div
      class="modal-content"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div class="modal-header">
        <h2 id="modal-title">Why {stackName}?</h2>
        <button
          class="close-button"
          onclick={handleClose}
          aria-label="Close modal"
        >
          ✕
        </button>
      </div>

      <div class="modal-body">
        {#if loading}
          <div class="loading-state">
            <div class="spinner" />
            <p>Generating detailed explanation...</p>
          </div>
        {:else if error}
          <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Unable to Generate Explanation</h3>
            <p>{error}</p>
            <p class="fallback-note">
              Please ensure you have configured an LLM provider in settings.
            </p>
          </div>
        {:else}
          <div class="explanation-content">
            <div class="ai-badge">
              <span class="badge-icon">🤖</span>
              <span class="badge-text">AI-Generated Explanation</span>
            </div>
            <p>{explanation}</p>
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        <button class="btn-close" onclick={handleClose}>Close</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 600px;
    width: 100%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #6b7280;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    line-height: 1;
    transition: color 0.2s;
    border-radius: 4px;
  }

  .close-button:hover {
    color: #1f2937;
    background: #f3f4f6;
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: #6b7280;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error-state {
    text-align: center;
    padding: 2rem;
  }

  .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .error-state h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: #dc2626;
  }

  .error-state p {
    color: #6b7280;
    margin: 0.5rem 0;
    line-height: 1.6;
  }

  .fallback-note {
    margin-top: 1rem;
    padding: 0.75rem;
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
    border-radius: 4px;
    font-size: 0.875rem;
    color: #92400e;
  }

  .explanation-content {
    padding: 1rem;
  }

  .ai-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .badge-icon {
    font-size: 1.25rem;
  }

  .explanation-content p {
    font-size: 1rem;
    line-height: 1.8;
    color: #374151;
    margin: 0;
    white-space: pre-wrap;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
  }

  .btn-close {
    padding: 0.75rem 1.5rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-close:hover {
    background: #5568d3;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  @media (max-width: 640px) {
    .modal-content {
      max-width: 100%;
      max-height: 90vh;
    }

    .modal-header h2 {
      font-size: 1.25rem;
    }

    .modal-body {
      padding: 1rem;
    }

    .explanation-content {
      padding: 0.5rem;
    }
  }
</style>
