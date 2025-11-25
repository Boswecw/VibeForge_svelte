/**
 * VibeForge Project Type Definitions
 *
 * Types for active project state and project management.
 */

import type { StackProfile } from '$lib/core/types/stack-profiles';
import type { ProjectType, FeatureSelection, Complexity, Timeline } from './wizard';

// ============================================================================
// PROJECT
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description: string;
  path: string;
  projectType: ProjectType;
  primaryLanguage: string;
  secondaryLanguages: string[];
  stack: StackProfile;
  features: FeatureSelection;
  createdAt: string;
  lastOpenedAt: string;
}

export interface ProjectConfig {
  id: string;
  name: string;
  description: string;
  path: string;
  projectType: ProjectType;
  primaryLanguage: string;
  secondaryLanguages: string[];
  stack: StackProfile;
  features: FeatureSelection;
  createdAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  path: string;
  lastOpened: string;
  stack: string;
  primaryLanguage: string;
}

// ============================================================================
// PROJECT CREATION
// ============================================================================

export interface ProjectGenerationConfig {
  name: string;
  description: string;
  projectType: ProjectType;
  primaryLanguage: string;
  secondaryLanguages: string[];
  stack: StackProfile | null;
  features: FeatureSelection;
  outputPath: string;
  generateReadme: boolean;
  initGit: boolean;
}

export interface ProjectGenerationResult {
  projectId: string;
  path: string;
  filesCreated: string[];
}

// ============================================================================
// PROJECT TRACKING (Learning Integration)
// ============================================================================

export interface ProjectCreationRecord {
  projectId: string;
  projectType: ProjectType;
  primaryLanguage: string;
  secondaryLanguages: string[];
  stackId: string;
  features: string[];
  complexity: Complexity;
  teamSize: number;
  timeline: Timeline;
  languagesConsidered: string[];
  stacksCompared: string[];
  usedAiRecommendation: boolean;
}
