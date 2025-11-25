/**
 * VibeForge Wizard Type Definitions
 *
 * Types for the modal wizard flow that guides users through project creation.
 */

import type { StackProfile, StackCategory } from '$lib/core/types/stack-profiles';

// ============================================================================
// WIZARD STEP TYPES
// ============================================================================

export type WizardStep = 'intent' | 'languages' | 'stack' | 'config' | 'launch';

export const WIZARD_STEPS: WizardStep[] = ['intent', 'languages', 'stack', 'config', 'launch'];

export interface WizardStepMeta {
  title: string;
  description: string;
  teaches: string;  // What workbench feature this step introduces
}

export const WIZARD_STEP_META: Record<WizardStep, WizardStepMeta> = {
  intent: {
    title: 'Project Intent',
    description: "Define what you're building",
    teaches: 'Context Panel',
  },
  languages: {
    title: 'Languages',
    description: 'Choose your tech stack foundation',
    teaches: 'Language Contexts',
  },
  stack: {
    title: 'Stack',
    description: 'Select frameworks and tools',
    teaches: 'AI Recommendations',
  },
  config: {
    title: 'Configure',
    description: 'Fine-tune your setup',
    teaches: 'Settings Panel',
  },
  launch: {
    title: 'Launch',
    description: 'Create your project',
    teaches: 'Project Workspace',
  },
};

// ============================================================================
// PROJECT TYPES
// ============================================================================

export type ProjectType = StackCategory | 'cli' | 'library' | 'fullstack' | 'data-pipeline' | 'ml-project';

export type Complexity = 'simple' | 'moderate' | 'complex' | 'enterprise';

export type Timeline = 'sprint' | 'month' | 'quarter' | 'year';

export interface FeatureSelection {
  authentication?: boolean;
  database?: boolean;
  api?: boolean;
  testing?: boolean;
  docker?: boolean;
  ci?: boolean;
  monitoring?: boolean;
  [key: string]: boolean | undefined;
}

// ============================================================================
// WIZARD DATA
// ============================================================================

export interface WizardData {
  // Step 1: Intent
  projectName: string;
  projectDescription: string;
  projectType: ProjectType;
  complexity: Complexity;

  // Step 2: Languages
  primaryLanguage: string | null;
  secondaryLanguages: string[];
  languagesConsidered: string[];  // For learning tracking

  // Step 3: Stack
  selectedStack: StackProfile | null;
  stacksCompared: string[];        // For learning tracking
  aiRecommendations: StackRecommendation[];

  // Step 4: Config
  features: FeatureSelection;
  teamSize: number;
  timeline: Timeline;

  // Step 5: Launch
  outputPath: string;
  generateReadme: boolean;
  initGit: boolean;
}

export interface StackRecommendation {
  stack: StackProfile;
  confidence: number;        // 0-1
  reasoning: string;
  matchScore: number;        // 0-100
  successRate: number;       // Historical success %
  source: 'ai' | 'empirical' | 'hybrid';
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// WIZARD STATE
// ============================================================================

export interface WizardState {
  isOpen: boolean;
  currentStep: WizardStep;
  canProceed: boolean;
  isSubmitting: boolean;

  data: WizardData;
  validation: Record<WizardStep, ValidationResult>;

  // Learning integration
  sessionId: string | null;
  startedAt: Date | null;
}

// ============================================================================
// WIZARD OPTIONS
// ============================================================================

export interface WizardOpenOptions {
  skipToStep?: WizardStep;
  loadDraft?: boolean;
}

export interface WizardCloseOptions {
  saveDraft?: boolean;
}
