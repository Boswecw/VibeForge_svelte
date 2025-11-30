/**
 * Wizard Store
 * 
 * Manages wizard state, project configuration, and draft persistence
 */

import { browser } from '$app/environment';
import type { ProjectConfig } from '../types/project';
import { DEFAULT_PROJECT_CONFIG } from '../types/project';
import { toastStore } from '$lib/stores/toast.svelte';
import type { ScaffoldConfig } from '../types/scaffolding';

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
    toastStore.warning('Could not load saved wizard draft. Starting fresh.');
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

    // Provide user-friendly error messages
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      toastStore.error('Storage full. Cannot save wizard progress. Please clear browser data.');
    } else {
      toastStore.error('Could not save wizard progress. Changes may be lost.');
    }
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
    // Silent fail for clear - not critical to user experience
  }
}

class WizardStore {
  isOpen = $state(false);
  currentStep = $state(1);

  // Project configuration
  config = $state<ProjectConfig>({ ...DEFAULT_PROJECT_CONFIG });

  // Scaffolding state
  scaffoldConfig = $state<ScaffoldConfig | null>(null);
  isScaffolding = $state(false);

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
  async createProject(): Promise<void> {
    try {
      // Determine if we're using pattern mode or legacy mode
      const isPatternMode = this.config.architecturePattern !== null;

      if (isPatternMode) {
        await this.createPatternProject();
      } else {
        await this.createLegacyProject();
      }

      // Clear draft after successful creation
      clearDraft();

      // Reset and close
      this.config = { ...DEFAULT_PROJECT_CONFIG };
      this.currentStep = 1;
      this.close();

      // Success toast
      toastStore.success('Project created successfully!');
    } catch (error) {
      console.error('Failed to create project:', error);
      const message = error instanceof Error ? error.message : 'Failed to create project';
      toastStore.error(message);
      throw error;
    }
  }

  /**
   * Create project using architecture pattern (Phase 3)
   * Now triggers ScaffoldingModal instead of directly invoking Tauri
   */
  private async createPatternProject(): Promise<void> {
    if (!this.config.architecturePattern) {
      throw new Error('No architecture pattern selected');
    }

    // Build scaffold configuration for the ScaffoldingModal
    const scaffoldConfig: ScaffoldConfig = {
      patternId: this.config.architecturePattern.id,
      patternName: this.config.architecturePattern.displayName,
      projectName: this.config.projectName,
      projectDescription: this.config.projectDescription,
      projectPath: this.config.projectPath,
      components: this.config.architecturePattern.components.map((component) => {
        // Get custom config for this component if it exists
        const customConfig = this.config.componentConfigs.get(component.id);

        return {
          id: component.id,
          role: component.role,
          name: component.name,
          language: customConfig?.language || component.language,
          framework: customConfig?.framework || component.framework,
          location: customConfig?.location || component.location,
          scaffolding: {
            directories: component.scaffolding.directories.map(dir => ({
              path: dir.path,
              description: dir.description,
              subdirectories: dir.subdirectories,
              files: dir.files?.map(f => ({
                path: f.path,
                content: f.content,
                templateEngine: 'handlebars' as const,
                overwritable: true
              }))
            })),
            files: component.scaffolding.files.map(file => ({
              path: file.path,
              content: file.content,
              templateEngine: 'handlebars' as const,
              overwritable: true
            }))
          },
          customConfig: customConfig ? {
            includeTests: customConfig.includeTests,
            includeDocker: customConfig.includeDocker,
            includeCi: customConfig.includeCi
          } : undefined
        };
      }),
      features: {
        testing: this.config.features.testing,
        linting: this.config.features.linting,
        git: this.config.features.git,
        docker: this.config.features.docker,
        ci: this.config.features.ci
      }
    };

    // Set scaffolding config and trigger modal
    this.scaffoldConfig = scaffoldConfig;
    this.isScaffolding = true;

    // Don't close wizard yet - ScaffoldingModal will handle that
  }

  /**
   * Handle scaffolding completion
   */
  handleScaffoldingComplete(result: any): void {
    console.log('Scaffolding complete:', result);

    // Clear draft after successful creation
    clearDraft();

    // Reset scaffolding state
    this.scaffoldConfig = null;
    this.isScaffolding = false;

    // Reset and close wizard
    this.config = { ...DEFAULT_PROJECT_CONFIG };
    this.currentStep = 1;
    this.close();

    // Success toast
    toastStore.success(`Project created with ${result.filesCreated} files!`);
  }

  /**
   * Handle scaffolding error
   */
  handleScaffoldingError(error: Error): void {
    console.error('Scaffolding error:', error);

    // Reset scaffolding state but keep wizard open
    this.isScaffolding = false;
    this.scaffoldConfig = null;

    // Show error toast
    toastStore.error(error.message || 'Failed to create project');
  }

  /**
   * Handle scaffolding cancellation
   */
  handleScaffoldingCancel(): void {
    console.log('Scaffolding cancelled');

    // Reset scaffolding state
    this.isScaffolding = false;
    this.scaffoldConfig = null;
  }

  /**
   * Create project using legacy single-stack mode (Phase 1/2)
   */
  private async createLegacyProject(): Promise<void> {
    if (!this.config.primaryLanguage || !this.config.stack) {
      throw new Error('Primary language and stack are required for legacy mode');
    }

    const legacyConfig = {
      name: this.config.projectName,
      description: this.config.projectDescription,
      project_type: this.config.projectType || 'web',
      languages: [
        this.config.primaryLanguage,
        ...this.config.additionalLanguages,
      ],
      stack_id: this.config.stack,
      database: null,
      authentication: null,
      deployment_platform: null,
      environment_variables: {},
      features: Object.keys(this.config.features).filter(
        (key) => this.config.features[key as keyof typeof this.config.features]
      ),
    };

    // Check if we're in Tauri environment
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      const { invoke } = await import('@tauri-apps/api/core');

      const result = await invoke<{
        success: boolean;
        project_path: string;
        message: string;
        files_created: number;
      }>('generate_project', {
        config: legacyConfig,
        outputDir: this.config.projectPath,
      });

      console.log('Legacy project generated:', result);
      console.log(`Created ${result.files_created} files`);
      console.log(`Project path: ${result.project_path}`);
    } else {
      // In development/web mode, just simulate
      console.log('Legacy project generation (simulated):', legacyConfig);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
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
