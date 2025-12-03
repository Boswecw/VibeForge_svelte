/**
 * Real-Time Streaming Types - Phase 4.4
 * Type definitions for WebSocket-based streaming inference
 */

// ============================================================================
// Enums
// ============================================================================

export type StreamEventType =
  | 'connected'
  | 'progress'
  | 'chunk'
  | 'stage_start'
  | 'stage_complete'
  | 'complete'
  | 'error'
  | 'cancelled'
  | 'heartbeat';

export type ProgressStage =
  | 'initializing'
  | 'context_building'
  | 'prompt_construction'
  | 'model_routing'
  | 'model_inference'
  | 'evaluation'
  | 'post_processing'
  | 'complete'
  | 'error';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// ============================================================================
// Event Interfaces
// ============================================================================

export interface StreamEvent {
  type: StreamEventType;
  inference_id: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface ConnectedEvent extends StreamEvent {
  type: 'connected';
  data: {
    connection_id: string;
    inference_id: string;
    message: string;
  };
}

export interface ProgressEvent extends StreamEvent {
  type: 'progress';
  data: ProgressData;
}

export interface ChunkEvent extends StreamEvent {
  type: 'chunk';
  data: {
    chunk: string;
    metadata?: Record<string, unknown>;
  };
}

export interface StageStartEvent extends StreamEvent {
  type: 'stage_start';
  data: {
    stage: ProgressStage;
    message: string;
    overall_progress: number;
  };
}

export interface StageCompleteEvent extends StreamEvent {
  type: 'stage_complete';
  data: {
    stage: ProgressStage;
    message: string;
    overall_progress: number;
    metadata?: Record<string, unknown>;
  };
}

export interface CompleteEvent extends StreamEvent {
  type: 'complete';
  data: {
    result: InferenceResult;
    elapsed_time_seconds: number | null;
  };
}

export interface ErrorEvent extends StreamEvent {
  type: 'error';
  data: {
    error: string;
    details?: Record<string, unknown>;
  };
}

export interface CancelledEvent extends StreamEvent {
  type: 'cancelled';
  data: {
    message: string;
  };
}

export interface HeartbeatEvent extends StreamEvent {
  type: 'heartbeat';
  data: {
    timestamp: string;
  };
}

// ============================================================================
// Progress Data
// ============================================================================

export interface ProgressData {
  inference_id: string;
  overall_progress: number; // 0-100
  current_stage: ProgressStage | null;
  stages: StageInfo[];
  started_at: string;
  completed_at: string | null;
  elapsed_time_seconds: number;
  estimated_remaining_seconds: number | null;
  error_message: string | null;
}

export interface StageInfo {
  stage: ProgressStage;
  status: 'pending' | 'in_progress' | 'complete' | 'error';
  progress_percent: number; // 0-100
  message: string;
  started_at: string | null;
  completed_at: string | null;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Inference Result
// ============================================================================

export interface InferenceResult {
  inference_id: string;
  output: string;
  evaluation_score?: number;
  evaluation_passed?: boolean;
  model_id?: string;
  provider?: string;
  tokens_used?: number;
  latency_ms?: number;
  [key: string]: unknown;
}

// ============================================================================
// WebSocket Client Config
// ============================================================================

export interface WebSocketConfig {
  url: string;
  inference_id: string;
  user_id?: string;
  reconnect?: boolean;
  reconnect_interval?: number; // milliseconds
  max_reconnect_attempts?: number;
}

export interface WebSocketState {
  status: ConnectionStatus;
  connected_at: Date | null;
  disconnected_at: Date | null;
  error: Error | null;
  reconnect_attempts: number;
}

// ============================================================================
// Event Handlers
// ============================================================================

export interface StreamEventHandlers {
  onConnected?: (event: ConnectedEvent) => void;
  onProgress?: (event: ProgressEvent) => void;
  onChunk?: (event: ChunkEvent) => void;
  onStageStart?: (event: StageStartEvent) => void;
  onStageComplete?: (event: StageCompleteEvent) => void;
  onComplete?: (event: CompleteEvent) => void;
  onError?: (event: ErrorEvent) => void;
  onCancelled?: (event: CancelledEvent) => void;
  onHeartbeat?: (event: HeartbeatEvent) => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getStageLabel(stage: ProgressStage): string {
  const labels: Record<ProgressStage, string> = {
    initializing: 'Initializing',
    context_building: 'Building Context',
    prompt_construction: 'Constructing Prompt',
    model_routing: 'Routing Model',
    model_inference: 'Generating Response',
    evaluation: 'Evaluating Quality',
    post_processing: 'Post-Processing',
    complete: 'Complete',
    error: 'Error',
  };
  return labels[stage] || stage;
}

export function getStageIcon(stage: ProgressStage): string {
  const icons: Record<ProgressStage, string> = {
    initializing: '🔄',
    context_building: '📚',
    prompt_construction: '✍️',
    model_routing: '🧭',
    model_inference: '🤖',
    evaluation: '✅',
    post_processing: '⚙️',
    complete: '✨',
    error: '❌',
  };
  return icons[stage] || '●';
}

export function getStageColor(stage: ProgressStage): string {
  const colors: Record<ProgressStage, string> = {
    initializing: '#3b82f6', // blue-500
    context_building: '#8b5cf6', // purple-500
    prompt_construction: '#06b6d4', // cyan-500
    model_routing: '#10b981', // green-500
    model_inference: '#f59e0b', // amber-500
    evaluation: '#14b8a6', // teal-500
    post_processing: '#6366f1', // indigo-500
    complete: '#22c55e', // green-500
    error: '#ef4444', // red-500
  };
  return colors[stage] || '#6b7280';
}

export function getStatusColor(status: 'pending' | 'in_progress' | 'complete' | 'error'): string {
  const colors = {
    pending: '#9ca3af', // gray-400
    in_progress: '#3b82f6', // blue-500
    complete: '#10b981', // green-500
    error: '#ef4444', // red-500
  };
  return colors[status];
}

export function formatDuration(seconds: number): string {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`;
  }
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

export function formatProgress(progress: number): string {
  return `${Math.round(progress)}%`;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isConnectedEvent(event: StreamEvent): event is ConnectedEvent {
  return event.type === 'connected';
}

export function isProgressEvent(event: StreamEvent): event is ProgressEvent {
  return event.type === 'progress';
}

export function isChunkEvent(event: StreamEvent): event is ChunkEvent {
  return event.type === 'chunk';
}

export function isStageStartEvent(event: StreamEvent): event is StageStartEvent {
  return event.type === 'stage_start';
}

export function isStageCompleteEvent(event: StreamEvent): event is StageCompleteEvent {
  return event.type === 'stage_complete';
}

export function isCompleteEvent(event: StreamEvent): event is CompleteEvent {
  return event.type === 'complete';
}

export function isErrorEvent(event: StreamEvent): event is ErrorEvent {
  return event.type === 'error';
}

export function isCancelledEvent(event: StreamEvent): event is CancelledEvent {
  return event.type === 'cancelled';
}

export function isHeartbeatEvent(event: StreamEvent): event is HeartbeatEvent {
  return event.type === 'heartbeat';
}

// ============================================================================
// Validation
// ============================================================================

export function validateStreamEvent(data: unknown): data is StreamEvent {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const event = data as Record<string, unknown>;

  return (
    typeof event.type === 'string' &&
    typeof event.inference_id === 'string' &&
    typeof event.data === 'object' &&
    typeof event.timestamp === 'string'
  );
}

export function parseStreamEvent(data: unknown): StreamEvent | null {
  if (!validateStreamEvent(data)) {
    return null;
  }
  return data as StreamEvent;
}
