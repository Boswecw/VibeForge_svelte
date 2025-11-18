export type ContextKind = 'system' | 'design' | 'project' | 'code' | 'workflow';

export type ContextSource = 'global' | 'workspace' | 'local';

export interface ContextBlock {
  id: string;
  title: string;
  kind: ContextKind;
  description: string;
  tags: string[];
  isActive: boolean;
  lastUpdated: string; // ISO date string
  source: ContextSource;
}
