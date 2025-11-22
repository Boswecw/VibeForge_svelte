/**
 * Research Types
 *
 * TypeScript definitions for research queries and responses.
 * Aligns with NeuroForge backend schemas.
 */

export type ExternalSource =
  | "github_issue"
  | "github_discussion"
  | "official_docs"
  | "release_notes"
  | "rfc"
  | "pep"
  | "security_advisory"
  | "discord"
  | "hn"
  | "blog";

export type ResearchDepth = "shallow" | "normal" | "deep";

export interface ResearchQuery {
  query: string;
  sources?: ExternalSource[];
  max_results?: number;
  depth?: ResearchDepth;
  user_id?: string;
  workspace_id?: string;
  filters?: Record<string, unknown>;
}

export interface ResearchSourceRef {
  id: string;
  source: ExternalSource;
  url: string;
  title: string;
  snippet: string;
  score?: number;
}

export interface ResearchAnswer {
  query: string;
  summary: string;
  answer: string;
  bullet_points: string[];
  sources: ResearchSourceRef[];
  raw_results: Record<string, unknown>[];
  depth_applied: ResearchDepth;
  took_ms: number;
  created_at: string;
  correlation_id?: string;
}

export interface ResearchError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
  correlation_id?: string;
}

export interface ResearchStatus {
  status: "idle" | "loading" | "success" | "error";
  answer?: ResearchAnswer;
  error?: ResearchError;
  isExecuting: boolean;
}
