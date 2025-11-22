/**
 * DataForge API Type Definitions
 * 
 * DataForge serves as the knowledge engine for VibeForge:
 * - Context library management
 * - Semantic search
 * - Run history logging and retrieval
 */

// ============================================================================
// Context Types
// ============================================================================

export interface DataForgeContext {
  id: string;
  workspace_id: string;
  title: string;
  description: string;
  kind: 'system' | 'design' | 'project' | 'code' | 'workflow';
  source: 'global' | 'workspace' | 'local';
  tags: string[];
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  chunk_count?: number;
}

export interface DataForgeContextChunk {
  id: string;
  context_id: string;
  chunk_index: number;
  text: string;
  tokens?: number;
  created_at?: string;
}

export interface DataForgeContextSearchResult {
  context_id: string;
  chunk_id: string;
  title: string;
  snippet: string;
  score: number; // 0-1 similarity score
  chunk_index?: number;
}

// ============================================================================
// Run Types
// ============================================================================

export interface DataForgeContextRef {
  context_id: string;
  chunk_id: string;
  text?: string; // Optional full text
}

export interface DataForgeModelOutput {
  model: string;
  output_id: string;
  summary: string;
  full_text?: string;
  tokens_used?: {
    input: number;
    output: number;
  };
  latency_ms?: number;
}

export interface DataForgeRun {
  id: string;
  workspace_id: string;
  created_at: string; // ISO 8601
  session_id?: string;
  
  // Execution context
  prompt: string;
  system_prompt?: string;
  models: string[];
  contexts: DataForgeContextRef[];
  
  // Results
  outputs: DataForgeModelOutput[];
  
  // Metadata
  tags?: string[];
  notes?: string;
  feedback?: {
    rating?: number; // 1-5
    thumbs_up?: boolean;
    tags?: string[];
    notes?: string;
  };
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ListContextsResponse {
  contexts: DataForgeContext[];
  total: number;
}

export interface SearchContextsRequest {
  query: string;
  top_k?: number;
  filters?: {
    kind?: string;
    source?: string;
    tags?: string[];
  };
}

export interface SearchContextsResponse {
  results: DataForgeContextSearchResult[];
  total: number;
}

export interface GetContextChunkResponse {
  chunk: DataForgeContextChunk;
}

export interface LogRunRequest {
  workspace_id: string;
  session_id?: string;
  prompt: string;
  system_prompt?: string;
  models: string[];
  contexts: DataForgeContextRef[];
  outputs: DataForgeModelOutput[];
  tags?: string[];
  notes?: string;
}

export interface LogRunResponse {
  run_id: string;
  created_at: string;
}

export interface ListRunsResponse {
  runs: DataForgeRun[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// Error Types
// ============================================================================

export interface DataForgeError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface DataForgeApiError extends Error {
  status: number;
  code: string;
  message: string;
}
