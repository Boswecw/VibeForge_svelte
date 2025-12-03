<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createWebSocketClient, type WebSocketClient } from '$lib/services/websocket-client';
  import type {
    ProgressData,
    InferenceResult,
    ConnectionStatus,
  } from '$lib/types/streaming';
  import {
    getStageLabel,
    getStageIcon,
    getStageColor,
    formatDuration,
    formatProgress,
  } from '$lib/types/streaming';

  interface Props {
    inference_id: string;
    user_id?: string;
    autoConnect?: boolean;
    showProgress?: boolean;
    showControls?: boolean;
  }

  let {
    inference_id,
    user_id,
    autoConnect = true,
    showProgress = true,
    showControls = true,
  }: Props = $props();

  // State
  let wsClient: WebSocketClient | null = null;
  let connectionStatus = $state<ConnectionStatus>('connecting');
  let streamingText = $state<string>('');
  let progress = $state<ProgressData | null>(null);
  let result = $state<InferenceResult | null>(null);
  let error = $state<string | null>(null);
  let cancelled = $state(false);

  // Connect to WebSocket
  function connect() {
    if (wsClient) {
      wsClient.disconnect();
    }

    wsClient = createWebSocketClient(
      inference_id,
      {
        onConnected: (event) => {
          console.log('Connected:', event);
        },

        onProgress: (event) => {
          progress = event.data;
        },

        onChunk: (event) => {
          streamingText += event.data.chunk;
        },

        onStageStart: (event) => {
          console.log('Stage started:', event.data.stage);
        },

        onStageComplete: (event) => {
          console.log('Stage completed:', event.data.stage);
        },

        onComplete: (event) => {
          result = event.data.result;
          if (event.data.result.output) {
            streamingText = event.data.result.output;
          }
        },

        onError: (event) => {
          error = event.data.error;
        },

        onCancelled: (event) => {
          cancelled = true;
        },

        onConnectionChange: (status) => {
          connectionStatus = status;
        },
      },
      user_id
    );

    wsClient.connect();
  }

  function disconnect() {
    wsClient?.disconnect();
    wsClient = null;
  }

  function cancel() {
    wsClient?.cancel();
  }

  onMount(() => {
    if (autoConnect) {
      connect();
    }
  });

  onDestroy(() => {
    disconnect();
  });
</script>

<div class="streaming-inference">
  <!-- Connection Status -->
  <div class="status-bar" class:connected={connectionStatus === 'connected'} class:error={connectionStatus === 'error'}>
    <div class="status-indicator">
      <span class="status-dot" class:active={connectionStatus === 'connected'}></span>
      <span class="status-text">{connectionStatus}</span>
    </div>

    {#if showControls}
      <div class="controls">
        {#if connectionStatus === 'connected' && !result && !cancelled}
          <button class="cancel-button" onclick={cancel}>
            Cancel
          </button>
        {/if}

        {#if connectionStatus === 'disconnected'}
          <button class="reconnect-button" onclick={connect}>
            Reconnect
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Progress Bar -->
  {#if showProgress && progress && !result && !cancelled}
    <div class="progress-section">
      <div class="progress-header">
        <div class="progress-info">
          {#if progress.current_stage}
            <span class="stage-icon">{getStageIcon(progress.current_stage)}</span>
            <span class="stage-label">{getStageLabel(progress.current_stage)}</span>
          {/if}
        </div>
        <span class="progress-percentage">{formatProgress(progress.overall_progress)}</span>
      </div>

      <div class="progress-bar">
        <div
          class="progress-fill"
          style="width: {progress.overall_progress}%; background: {progress.current_stage ? getStageColor(progress.current_stage) : '#3b82f6'}"
        ></div>
      </div>

      <div class="progress-details">
        {#if progress.estimated_remaining_seconds !== null}
          <span class="time-remaining">
            ~{formatDuration(progress.estimated_remaining_seconds)} remaining
          </span>
        {/if}
        <span class="time-elapsed">
          {formatDuration(progress.elapsed_time_seconds)} elapsed
        </span>
      </div>

      <!-- Stages List -->
      <div class="stages-list">
        {#each progress.stages as stage}
          <div class="stage-item" class:active={stage.status === 'in_progress'} class:complete={stage.status === 'complete'}>
            <span class="stage-icon-small">{getStageIcon(stage.stage)}</span>
            <span class="stage-name">{getStageLabel(stage.stage)}</span>
            {#if stage.status === 'complete'}
              <span class="stage-check">✓</span>
            {:else if stage.status === 'in_progress'}
              <span class="stage-spinner">⟳</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Streaming Text Output -->
  <div class="output-section">
    {#if error}
      <div class="error-message">
        <span class="error-icon">❌</span>
        <div class="error-content">
          <strong>Error:</strong>
          <p>{error}</p>
        </div>
      </div>
    {:else if cancelled}
      <div class="cancelled-message">
        <span class="cancelled-icon">🚫</span>
        <p>Inference cancelled</p>
      </div>
    {:else if streamingText}
      <div class="streaming-text">
        {streamingText}
        {#if !result}
          <span class="cursor">▊</span>
        {/if}
      </div>
    {:else if connectionStatus === 'connected'}
      <div class="waiting-message">
        <div class="pulse-loader"></div>
        <p>Waiting for response...</p>
      </div>
    {/if}
  </div>

  <!-- Result Metadata -->
  {#if result}
    <div class="result-metadata">
      <div class="metadata-item">
        <span class="metadata-label">Model:</span>
        <span class="metadata-value">{result.model_id || 'Unknown'}</span>
      </div>
      {#if result.evaluation_score !== undefined}
        <div class="metadata-item">
          <span class="metadata-label">Quality:</span>
          <span class="metadata-value">{(result.evaluation_score * 100).toFixed(1)}%</span>
        </div>
      {/if}
      {#if result.tokens_used !== undefined}
        <div class="metadata-item">
          <span class="metadata-label">Tokens:</span>
          <span class="metadata-value">{result.tokens_used.toLocaleString()}</span>
        </div>
      {/if}
      {#if result.latency_ms !== undefined}
        <div class="metadata-item">
          <span class="metadata-label">Latency:</span>
          <span class="metadata-value">{(result.latency_ms / 1000).toFixed(2)}s</span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .streaming-inference {
    background: var(--surface);
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid var(--border);
  }

  /* Status Bar */
  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--surface-secondary);
    border-radius: 6px;
    margin-bottom: 1rem;
    border: 1px solid var(--border);
  }

  .status-bar.connected {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.1);
  }

  .status-bar.error {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #9ca3af;
    animation: pulse 2s infinite;
  }

  .status-dot.active {
    background: #10b981;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .status-text {
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: capitalize;
    color: var(--text-primary);
  }

  .controls {
    display: flex;
    gap: 0.5rem;
  }

  .cancel-button, .reconnect-button {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .cancel-button {
    background: #ef4444;
    color: white;
  }

  .cancel-button:hover {
    background: #dc2626;
  }

  .reconnect-button {
    background: var(--accent-primary);
    color: white;
  }

  .reconnect-button:hover {
    background: var(--accent-primary-hover);
  }

  /* Progress Section */
  .progress-section {
    margin-bottom: 1.5rem;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .progress-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .stage-icon {
    font-size: 1.25rem;
  }

  .stage-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .progress-percentage {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .progress-bar {
    height: 8px;
    background: var(--surface-tertiary);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    transition: width 0.3s ease, background 0.3s ease;
  }

  .progress-details {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }

  /* Stages List */
  .stages-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.5rem;
  }

  .stage-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: var(--surface-secondary);
    border-radius: 4px;
    font-size: 0.75rem;
    opacity: 0.5;
    transition: all 0.2s;
  }

  .stage-item.active {
    opacity: 1;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid #3b82f6;
  }

  .stage-item.complete {
    opacity: 0.7;
  }

  .stage-icon-small {
    font-size: 1rem;
  }

  .stage-name {
    flex: 1;
    font-weight: 500;
  }

  .stage-check {
    color: #10b981;
  }

  .stage-spinner {
    animation: rotate 1s linear infinite;
  }

  @keyframes rotate {
    to { transform: rotate(360deg); }
  }

  /* Output Section */
  .output-section {
    min-height: 200px;
    padding: 1rem;
    background: var(--surface-secondary);
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .streaming-text {
    color: var(--text-primary);
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .cursor {
    animation: blink 1s infinite;
    color: var(--accent-primary);
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  .error-message, .cancelled-message {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 6px;
  }

  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
  }

  .cancelled-message {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid #f59e0b;
    align-items: center;
  }

  .error-icon, .cancelled-icon {
    font-size: 1.5rem;
  }

  .error-content strong {
    display: block;
    margin-bottom: 0.25rem;
    color: #ef4444;
  }

  .waiting-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem 1rem;
    color: var(--text-secondary);
  }

  .pulse-loader {
    width: 40px;
    height: 40px;
    border: 3px solid var(--surface-tertiary);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Result Metadata */
  .result-metadata {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem;
    background: var(--surface-secondary);
    border-radius: 6px;
  }

  .metadata-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .metadata-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .metadata-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  @media (max-width: 768px) {
    .stages-list {
      grid-template-columns: 1fr;
    }
  }
</style>
