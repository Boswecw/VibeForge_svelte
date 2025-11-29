/**
 * Project Configuration Types
 */

import type { ArchitecturePattern } from './architecture';
import type { ComponentConfig } from './wizard';

export type ProjectType = 'web' | 'api' | 'library' | 'cli' | 'fullstack';

export interface ProjectConfig {
  // Step 1: Project Intent
  projectName: string;
  projectDescription: string;
  projectType: ProjectType | null;

  // Step 2: Architecture Pattern (NEW - Phase 2)
  architecturePattern: ArchitecturePattern | null;
  componentConfigs: Map<string, ComponentConfig>;

  // Step 3: Languages (Legacy - for single-component projects)
  primaryLanguage: string | null;
  additionalLanguages: string[];

  // Step 4: Stack (Legacy - for single-component projects)
  stack: string | null;

  // Step 5: Configuration
  features: {
    testing: boolean;
    linting: boolean;
    git: boolean;
    docker: boolean;
    ci: boolean;
  };

  // Additional
  projectPath: string;
  license: string;
}

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  projectName: '',
  projectDescription: '',
  projectType: null,
  architecturePattern: null,
  componentConfigs: new Map(),
  primaryLanguage: null,
  additionalLanguages: [],
  stack: null,
  features: {
    testing: true,
    linting: true,
    git: true,
    docker: false,
    ci: false,
  },
  projectPath: '~',
  license: 'MIT',
};

export const PROJECT_TYPES: Array<{ value: ProjectType; label: string; description: string }> = [
  {
    value: 'web',
    label: 'Web Application',
    description: 'Frontend web application with UI',
  },
  {
    value: 'api',
    label: 'API / Backend',
    description: 'RESTful API or backend service',
  },
  {
    value: 'fullstack',
    label: 'Full-Stack',
    description: 'Frontend + Backend application',
  },
  {
    value: 'library',
    label: 'Library',
    description: 'Reusable library or package',
  },
  {
    value: 'cli',
    label: 'CLI Tool',
    description: 'Command-line application',
  },
];

export const LANGUAGES = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
];

export const STACKS = [
  { value: 'sveltekit', label: 'SvelteKit', languages: ['typescript', 'javascript'] },
  { value: 'nextjs', label: 'Next.js', languages: ['typescript', 'javascript'] },
  { value: 'react', label: 'React', languages: ['typescript', 'javascript'] },
  { value: 'vue', label: 'Vue', languages: ['typescript', 'javascript'] },
  { value: 'express', label: 'Express', languages: ['typescript', 'javascript'] },
  { value: 'fastapi', label: 'FastAPI', languages: ['python'] },
  { value: 'django', label: 'Django', languages: ['python'] },
  { value: 'actix', label: 'Actix Web', languages: ['rust'] },
  { value: 'gin', label: 'Gin', languages: ['go'] },
  { value: 'spring', label: 'Spring Boot', languages: ['java'] },
];
