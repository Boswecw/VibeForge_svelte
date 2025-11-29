/**
 * VibeForge Wizard Type Definitions
 *
 * Types for the modal wizard flow that guides users through project creation.
 */

import type { StackProfile, StackCategory } from '$lib/core/types/stack-profiles';
import type { ArchitecturePattern } from './architecture';

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

/**
 * Configuration for a single component in an architecture pattern
 *
 * Allows users to override default settings for pattern components.
 *
 * @example
 * ```typescript
 * const config: ComponentConfig = {
 *   componentId: 'backend',
 *   language: 'rust',
 *   framework: 'tauri',
 *   location: 'src-tauri',
 *   includeTests: true,
 *   includeDocker: false,
 *   includeCi: true
 * };
 * ```
 */
export interface ComponentConfig {
	/** ID of the component being configured */
	componentId: string;

	// Override defaults
	/** Override language selection */
	language?: string;

	/** Override framework selection */
	framework?: string;

	/** Override file location */
	location?: string;

	// Optional features
	/** Include test scaffolding */
	includeTests: boolean;

	/** Include Docker configuration */
	includeDocker: boolean;

	/** Include CI/CD configuration */
	includeCi: boolean;

	// Component-specific config
	/** Additional component-specific configuration */
	customConfig?: Record<string, any>;
}

// ============================================================================
// WIZARD DATA
// ============================================================================

/**
 * Complete wizard data structure
 *
 * Includes both legacy single-stack fields and new architecture pattern fields
 * for backward compatibility during transition.
 */
export interface WizardData {
  // Step 1: Intent
  projectName: string;
  projectDescription: string;
  projectType: ProjectType;
  complexity: Complexity;

  // Step 2: Architecture Pattern (NEW - replaces single language/stack for multi-component projects)
  /** Selected architecture pattern (NEW) */
  architecturePattern?: ArchitecturePattern;

  /** Architectures considered during selection (NEW - for learning tracking) */
  architecturesConsidered: string[];

  // Step 2: Languages (LEGACY - kept for backward compatibility)
  /** Primary language (legacy - use architecturePattern for new projects) */
  primaryLanguage: string | null;

  /** Secondary languages (legacy) */
  secondaryLanguages: string[];

  /** Languages considered (legacy - for learning tracking) */
  languagesConsidered: string[];

  // Step 3: Stack (LEGACY - kept for backward compatibility)
  /** Selected stack (legacy - use architecturePattern for new projects) */
  selectedStack: StackProfile | null;

  /** Stacks compared (legacy - for learning tracking) */
  stacksCompared: string[];

  /** AI recommendations (legacy) */
  aiRecommendations: StackRecommendation[];

  // Step 3: Component Configuration (NEW)
  /** Configuration for each component in the architecture pattern (NEW) */
  componentConfigs: Map<string, ComponentConfig>;

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
