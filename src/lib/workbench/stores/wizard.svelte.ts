/**
 * Wizard Store
 * 
 * Manages wizard state, project configuration, and draft persistence
 */

import { browser } from '$app/environment';
import type { ProjectConfig } from '../types/project';
import { DEFAULT_PROJECT_CONFIG } from '../types/project';

const STORAGE_KEY = 'vibeforge:wizard-draft';

/**
 * Load draft from localStorage
 */
function loadDraft(): ProjectConfig | null {
  if (!browser) return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert componentConfigs from object to Map
      if (parsed.componentConfigs && typeof parsed.componentConfigs === 'object') {
        parsed.componentConfigs = new Map(Object.entries(parsed.componentConfigs));
      } else {
        parsed.componentConfigs = new Map();
      }
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load wizard draft:', error);
  }

  return null;
}

/**
 * Save draft to localStorage
 */
function saveDraft(config: ProjectConfig): void {
  if (!browser) return;

  try {
    // Convert Map to object for JSON serialization
    const serializable = {
      ...config,
      componentConfigs: Object.fromEntries(config.componentConfigs)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (error) {
    console.error('Failed to save wizard draft:', error);
  }
}

/**
 * Clear draft from localStorage
 */
function clearDraft(): void {
  if (!browser) return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear wizard draft:', error);
  }
}

class WizardStore {
  isOpen = $state(false);
  currentStep = $state(1);

  // Project configuration
  config = $state<ProjectConfig>({ ...DEFAULT_PROJECT_CONFIG });

  constructor() {
    // Note: Cannot use $effect here as store is instantiated at module level
    // Draft saving is handled manually in methods that modify config
  }

  /**
   * Get total steps (always 5, but content changes based on mode)
   */
  get totalSteps(): number {
    return 5;
  }

  /**
   * Open wizard (load draft if exists)
   */
  open() {
    const draft = loadDraft();
    if (draft) {
      this.config = draft;
    } else {
      this.config = { ...DEFAULT_PROJECT_CONFIG };
    }
    this.currentStep = 1;
    this.isOpen = true;
  }

  /**
   * Close wizard
   */
  close() {
    this.isOpen = false;
  }

  /**
   * Go to next step
   */
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      if (this.isOpen) saveDraft(this.config);
    }
  }

  /**
   * Go to previous step
   */
  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  /**
   * Go to specific step
   */
  goToStep(step: number) {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  /**
   * Check if current step is valid
   *
   * Step flow (5 steps, dynamic content):
   *   1. Intent
   *   2. Pattern Selection (select pattern OR "use legacy mode")
   *   3. Component Config (if pattern) OR Stack (if legacy)
   *   4. Configuration
   *   5. Review
   */
  get isCurrentStepValid(): boolean {
    const isPatternMode = this.config.architecturePattern !== null;
    const isLegacyMode = this.config.primaryLanguage !== null;

    switch (this.currentStep) {
      case 1: // Project Intent
        return (
          this.config.projectName.trim().length >= 3 &&
          this.config.projectName.trim().length <= 50 &&
          this.config.projectType !== null
        );

      case 2: // Pattern Selection (must select pattern OR legacy mode)
        return isPatternMode || isLegacyMode;

      case 3: // Component Config (pattern) OR Stack (legacy)
        if (isPatternMode) {
          return true; // Component configs are optional
        } else if (isLegacyMode) {
          return this.config.stack !== null;
        } else {
          return false; // Need to select mode first
        }

      case 4: // Configuration
        return true; // Features are optional

      case 5: // Review
        return true; // Always valid

      default:
        return false;
    }
  }

  /**
   * Check if we can go to next step
   */
  get canGoNext(): boolean {
    return this.currentStep < this.totalSteps && this.isCurrentStepValid;
  }

  /**
   * Check if we can go back
   */
  get canGoBack(): boolean {
    return this.currentStep > 1;
  }

  /**
   * Create project and close wizard
   */
  createProject() {
    // TODO: Actually create the project via API
    console.log('Creating project:', this.config);
    
    // Clear draft
    clearDraft();
    
    // Reset and close
    this.config = { ...DEFAULT_PROJECT_CONFIG };
    this.currentStep = 1;
    this.close();
  }

  /**
   * Discard draft and close
   */
  discardAndClose() {
    clearDraft();
    this.config = { ...DEFAULT_PROJECT_CONFIG };
    this.currentStep = 1;
    this.close();
  }
}

export const wizardStore = new WizardStore();
