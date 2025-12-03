/**
 * VibeForge Project Store
 *
 * Manages the active project state and handles wizard-to-workbench handoff.
 */

import { browser } from '$app/environment';
import type { WizardData } from '../types/wizard';
import type {
  Project,
  ProjectSummary,
  ProjectGenerationResult,
  ProjectCreationRecord
} from '../types/project';
import type { ContextBlock } from '$lib/core/types/domain';

// ============================================================================
// CONSTANTS
// ============================================================================

const RECENT_KEY = 'vibeforge:recent-projects';
const MAX_RECENT = 10;

// ============================================================================
// STATE
// ============================================================================

interface ProjectState {
  current: Project | null;
  isLoading: boolean;
  error: string | null;
  recentProjects: ProjectSummary[];
}

function loadRecentProjects(): ProjectSummary[] {
  if (!browser) return [];
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

const state = $state<ProjectState>({
  current: null,
  isLoading: false,
  error: null,
  recentProjects: loadRecentProjects(),
});

// ============================================================================
// DERIVED
// ============================================================================

const hasActiveProject = $derived(state.current !== null);
const projectName = $derived(state.current?.name ?? '');
const projectPath = $derived(state.current?.path ?? '');
const projectStack = $derived(state.current?.stack.name ?? '');

// ============================================================================
// PERSISTENCE
// ============================================================================

function saveRecentProject(project: ProjectSummary): void {
  if (!browser) return;

  // Remove if already exists, add to front
  const filtered = state.recentProjects.filter((p) => p.id !== project.id);
  const updated = [project, ...filtered].slice(0, MAX_RECENT);

  state.recentProjects = updated;
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

function removeRecentProject(projectId: string): void {
  if (!browser) return;

  state.recentProjects = state.recentProjects.filter((p) => p.id !== projectId);
  localStorage.setItem(RECENT_KEY, JSON.stringify(state.recentProjects));
}

// ============================================================================
// WIZARD HANDOFF - THE CRITICAL FUNCTION
// ============================================================================

async function createFromWizard(wizardData: WizardData): Promise<Project> {
  state.isLoading = true;
  state.error = null;

  try {
    // 1. Generate project files via Tauri backend (stubbed for now)
    const generationResult = await generateProject(wizardData);

    // 2. Create project object
    const project: Project = {
      id: generationResult.projectId,
      name: wizardData.projectName,
      description: wizardData.projectDescription,
      path: generationResult.path,
      projectType: wizardData.projectType,
      primaryLanguage: wizardData.primaryLanguage!,
      secondaryLanguages: wizardData.secondaryLanguages,
      stack: wizardData.selectedStack!,
      features: {
        testing: wizardData.features.testing ?? true,
        linting: true, // Always enabled by default
        git: true, // Always enabled by default
        docker: wizardData.features.docker ?? false,
        ci: wizardData.features.ci ?? false,
      },
      createdAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
    };

    // 3. Initialize workbench state from project
    await initializeWorkbenchFromProject(project, wizardData);

    // 4. Track project creation for learning (non-blocking)
    trackProjectCreation(project, wizardData).catch(console.warn);

    // 5. Save to recent projects
    saveRecentProject({
      id: project.id,
      name: project.name,
      path: project.path,
      lastOpened: project.lastOpenedAt,
      stack: project.stack.name,
      primaryLanguage: project.primaryLanguage,
    });

    // 6. Set as current project
    state.current = project;
    state.isLoading = false;

    return project;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create project';
    state.error = message;
    state.isLoading = false;
    throw new Error(message);
  }
}

// ============================================================================
// PROJECT GENERATION (STUB)
// ============================================================================

async function generateProject(wizardData: WizardData): Promise<ProjectGenerationResult> {
  // TODO: Replace with actual Tauri invoke when backend is ready
  // For now, simulate project generation
  await new Promise(resolve => setTimeout(resolve, 1000));

  const projectId = `proj_${Date.now()}`;
  return {
    projectId,
    path: wizardData.outputPath + '/' + wizardData.projectName,
    filesCreated: [
      'README.md',
      'package.json',
      '.gitignore',
      'src/index.ts',
    ],
  };

  // Future implementation:
  // const { invoke } = await import('@tauri-apps/api/core');
  // return await invoke<ProjectGenerationResult>('generate_project', {
  //   config: {
  //     name: wizardData.projectName,
  //     description: wizardData.projectDescription,
  //     projectType: wizardData.projectType,
  //     primaryLanguage: wizardData.primaryLanguage,
  //     secondaryLanguages: wizardData.secondaryLanguages,
  //     stack: wizardData.selectedStack,
  //     features: wizardData.features,
  //     outputPath: wizardData.outputPath,
  //     generateReadme: wizardData.generateReadme,
  //     initGit: wizardData.initGit,
  //   },
  // });
}

// ============================================================================
// WORKBENCH INITIALIZATION
// ============================================================================

async function initializeWorkbenchFromProject(
  project: Project,
  wizardData: WizardData
): Promise<void> {
  // Import stores dynamically to avoid circular dependencies
  const { workspaceStore } = await import('$lib/core/stores/workspace.svelte');
  const { contextBlocksStore } = await import('$lib/core/stores/contextBlocks.svelte');
  const { promptStore } = await import('$lib/core/stores/prompt.svelte');

  // 1. Set up workspace
  workspaceStore.setWorkspace({
    id: project.id,
    name: project.name,
    description: project.description,
    settings: {
      theme: 'dark',
      autoSave: true,
      defaultModel: 'claude-3.5-sonnet',
    },
    createdAt: project.createdAt,
    updatedAt: project.createdAt,
  });

  // 2. Create initial context blocks from project data
  const contextBlocks = generateInitialContextBlocks(project, wizardData);
  contextBlocksStore.setBlocks(contextBlocks);

  // 3. Set up initial prompt template
  const initialPrompt = generateInitialPrompt(project);
  promptStore.setText(initialPrompt);

  // 4. Load language-specific patterns (optional, non-blocking)
  loadLanguagePatterns(project.primaryLanguage).catch(console.warn);
}

function generateInitialContextBlocks(
  project: Project,
  wizardData: WizardData
): ContextBlock[] {
  const blocks: ContextBlock[] = [];

  // System context with project info
  blocks.push({
    id: 'ctx-project-system',
    title: 'Project Context',
    kind: 'system',
    content: `You are assisting with ${project.name}, a ${project.projectType} project.

## Project Overview
${project.description || 'No description provided.'}

## Tech Stack
- Primary Language: ${project.primaryLanguage}
${project.secondaryLanguages.length > 0 ? `- Secondary Languages: ${project.secondaryLanguages.join(', ')}` : ''}
- Stack: ${project.stack.name}
${project.stack.displayName ? `- Framework: ${project.stack.displayName}` : ''}

## Guidelines
- Follow ${project.primaryLanguage} best practices
- Use consistent code style
- Write clear, documented code`,
    description: 'Auto-generated project context from wizard',
    tags: ['system', 'project', 'auto-generated'],
    isActive: true,
    source: 'workspace',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: { autoGenerated: true, source: 'wizard' },
  });

  // Stack-specific context
  if (project.stack.description) {
    blocks.push({
      id: 'ctx-stack-info',
      title: `${project.stack.name} Stack`,
      kind: 'project',
      content: project.stack.description,
      description: 'Stack profile information',
      tags: ['stack', 'auto-generated'],
      isActive: true,
      source: 'workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { autoGenerated: true, source: 'stack-profile' },
    });
  }

  // Feature-specific contexts (inactive by default)
  const enabledFeatures = Object.entries(wizardData.features)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name);

  if (enabledFeatures.includes('authentication')) {
    blocks.push({
      id: 'ctx-feature-auth',
      title: 'Authentication Guidelines',
      kind: 'workflow',
      content: `## Authentication Implementation
- Use secure password hashing (bcrypt/argon2)
- Implement JWT or session-based auth
- Follow OWASP authentication guidelines
- Never store plain text passwords
- Implement proper session management`,
      description: 'Authentication best practices',
      tags: ['authentication', 'security', 'auto-generated'],
      isActive: false,
      source: 'workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { autoGenerated: true, source: 'feature-auth' },
    });
  }

  if (enabledFeatures.includes('database')) {
    blocks.push({
      id: 'ctx-feature-db',
      title: 'Database Guidelines',
      kind: 'workflow',
      content: `## Database Best Practices
- Use parameterized queries (prevent SQL injection)
- Implement proper migrations
- Add appropriate indexes
- Use connection pooling
- Handle transactions properly`,
      description: 'Database best practices',
      tags: ['database', 'security', 'auto-generated'],
      isActive: false,
      source: 'workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { autoGenerated: true, source: 'feature-db' },
    });
  }

  if (enabledFeatures.includes('testing')) {
    blocks.push({
      id: 'ctx-feature-testing',
      title: 'Testing Guidelines',
      kind: 'workflow',
      content: `## Testing Best Practices
- Write unit tests for business logic
- Use integration tests for API endpoints
- Maintain high code coverage (80%+)
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)`,
      description: 'Testing best practices',
      tags: ['testing', 'quality', 'auto-generated'],
      isActive: false,
      source: 'workspace',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { autoGenerated: true, source: 'feature-testing' },
    });
  }

  return blocks;
}

function generateInitialPrompt(project: Project): string {
  return `# Working on: ${project.name}

Describe what you'd like to build or the problem you're solving:

`;
}

async function loadLanguagePatterns(language: string): Promise<void> {
  try {
    // TODO: Implement getLanguagePatterns in vibeforgeClient
    // For now, skip language patterns loading
    console.debug('Language patterns loading not yet implemented for:', language);

    // patterns.forEach((pattern) => {
    //   contextBlocksStore.addBlock({
    //     id: `pattern-${pattern.id}`,
    //     kind: 'code',
    //     title: pattern.name,
    //     content: pattern.template,
    //     isActive: false,
    //     metadata: { source: 'language-patterns', language },
    //   });
    // });
  } catch (e) {
    // Patterns are optional
    console.debug('Language patterns not available:', e);
  }
}

// ============================================================================
// LEARNING INTEGRATION
// ============================================================================

async function trackProjectCreation(
  project: Project,
  wizardData: WizardData
): Promise<void> {
  try {
    // TODO: Implement in vibeforgeClient
    console.debug('Project creation tracking not yet implemented');

    // const { vibeforgeClient } = await import('$lib/core/api/vibeforgeClient');
    //
    // const record: ProjectCreationRecord = {
    //   projectId: project.id,
    //   projectType: project.projectType,
    //   primaryLanguage: project.primaryLanguage,
    //   secondaryLanguages: project.secondaryLanguages,
    //   stackId: project.stack.id,
    //   features: Object.keys(wizardData.features).filter((k) => wizardData.features[k]),
    //   complexity: wizardData.complexity,
    //   teamSize: wizardData.teamSize,
    //   timeline: wizardData.timeline,
    //   languagesConsidered: wizardData.languagesConsidered,
    //   stacksCompared: wizardData.stacksCompared,
    //   usedAiRecommendation: wizardData.aiRecommendations.some(
    //     (r) => r.stack.id === project.stack.id
    //   ),
    // };
    //
    // await vibeforgeClient.recordProjectCreation(record);
  } catch (e) {
    // Non-blocking - learning is optional
    console.warn('Failed to track project creation:', e);
  }
}

// ============================================================================
// PROJECT OPERATIONS
// ============================================================================

async function openProject(projectPath: string): Promise<Project> {
  state.isLoading = true;
  state.error = null;

  try {
    // TODO: Implement with Tauri when backend is ready
    // For now, throw an error
    throw new Error('Project opening not yet implemented');

    // Future implementation:
    // const { invoke } = await import('@tauri-apps/api/core');
    // const config = await invoke<Project>('load_project_config', { path: projectPath });
    //
    // const project: Project = {
    //   ...config,
    //   lastOpenedAt: new Date().toISOString(),
    // };
    //
    // // Initialize workbench with minimal wizard data
    // await initializeWorkbenchFromProject(project, {
    //   projectName: project.name,
    //   projectDescription: project.description,
    //   projectType: project.projectType,
    //   complexity: 'moderate',
    //   primaryLanguage: project.primaryLanguage,
    //   secondaryLanguages: project.secondaryLanguages,
    //   languagesConsidered: [],
    //   selectedStack: project.stack,
    //   stacksCompared: [],
    //   aiRecommendations: [],
    //   features: project.features,
    //   teamSize: 1,
    //   timeline: 'month',
    //   outputPath: project.path,
    //   generateReadme: false,
    //   initGit: false,
    // });
    //
    // saveRecentProject({
    //   id: project.id,
    //   name: project.name,
    //   path: project.path,
    //   lastOpened: project.lastOpenedAt,
    //   stack: project.stack.name,
    //   primaryLanguage: project.primaryLanguage,
    // });
    //
    // state.current = project;
    // state.isLoading = false;
    //
    // return project;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to open project';
    state.error = message;
    state.isLoading = false;
    throw new Error(message);
  }
}

async function closeProject(): Promise<void> {
  const { workspaceStore } = await import('$lib/core/stores/workspace.svelte');
  const { contextBlocksStore } = await import('$lib/core/stores/contextBlocks.svelte');
  const { promptStore } = await import('$lib/core/stores/prompt.svelte');

  state.current = null;

  // Clear workbench state
  contextBlocksStore.setBlocks([]);
  promptStore.setText('');
  workspaceStore.clearWorkspace();
}

function clearError(): void {
  state.error = null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const projectStore = {
  // State
  get current() { return state.current; },
  get isLoading() { return state.isLoading; },
  get error() { return state.error; },
  get recentProjects() { return state.recentProjects; },

  // Derived
  get hasActiveProject() { return hasActiveProject; },
  get projectName() { return projectName; },
  get projectPath() { return projectPath; },
  get projectStack() { return projectStack; },

  // Actions
  createFromWizard,
  openProject,
  closeProject,
  clearError,
  removeRecentProject,
};
