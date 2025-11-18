export type RunStatus = 'success' | 'error';

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
