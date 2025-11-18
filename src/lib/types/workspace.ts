export interface WorkspaceSettings {
  defaultEvaluationScale: "1-5" | "1-10";
  requireWinner: boolean;
}

export interface WorkspaceStats {
  totalRuns: number;
  lastRunAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
  status: "active" | "archived";
  models: string[];
  tags: string[];
  settings: WorkspaceSettings;
  stats: WorkspaceStats;
}
