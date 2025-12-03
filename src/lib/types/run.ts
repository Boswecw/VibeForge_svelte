export type RunStatus = 'pending' | 'running' | 'success' | 'error' | 'cancelled' | 'completed' | 'failed';

export interface ModelRun {
  id: string;
  modelId: string;
  modelLabel: string;
  createdAt: string; // ISO
  promptSnapshot: string;
  contextTitles: string[];
  status: RunStatus;
  outputText: string;
}
