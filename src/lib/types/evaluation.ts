export type EvaluationStatus = "draft" | "in-progress" | "completed";

export interface ContextBlockRef {
  name: string;
  type: string;
}

export interface EvaluationOutput {
  id: string;
  model: string;
  text: string;
  score?: number; // 1–5
  label?: string; // e.g., "Best overall", "Hallucinated detail"
  isWinner?: boolean;
}

export interface EvaluationSession {
  id: string;
  name: string;
  workspace: string;
  project: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  models: string[];
  status: EvaluationStatus;
  tags: string[];
  promptSummary: string;
  prompt: string;
  contextBlocks: ContextBlockRef[];
  outputs: EvaluationOutput[];
  notes?: string;
}
