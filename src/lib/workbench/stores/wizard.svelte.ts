/**
 * VibeForge Wizard Store
 *
 * Manages the modal wizard state using Svelte 5 runes.
 * The wizard guides users through project creation while teaching workbench concepts.
 */

import { browser } from '$app/environment';
import type {
  WizardState,
  WizardStep,
  WizardData,
  ValidationResult,
  WizardOpenOptions,
  WizardCloseOptions,
} from '../types/wizard';

// ============================================================================
// CONSTANTS
// ============================================================================

const STEP_ORDER: WizardStep[] = ['intent', 'languages', 'stack', 'config', 'launch'];
const STORAGE_KEY = 'vibeforge:wizard-draft';

// ============================================================================
// INITIAL STATE FACTORY
// ============================================================================

function createInitialData(): WizardData {
  return {
    projectName: '',
    projectDescription: '',
    projectType: 'web',
    complexity: 'moderate',
    primaryLanguage: null,
    secondaryLanguages: [],
    languagesConsidered: [],
    selectedStack: null,
    stacksCompared: [],
    aiRecommendations: [],
    features: {},
    teamSize: 1,
    timeline: 'month',
    outputPath: '',
    generateReadme: true,
    initGit: true,
  };
}

function createInitialValidation(): Record<WizardStep, ValidationResult> {
  return {
    intent: { isValid: false, errors: [], warnings: [] },
    languages: { isValid: false, errors: [], warnings: [] },
    stack: { isValid: false, errors: [], warnings: [] },
    config: { isValid: true, errors: [], warnings: [] },  // Optional step
    launch: { isValid: false, errors: [], warnings: [] },
  };
}

function createInitialState(): WizardState {
  return {
    isOpen: false,
    currentStep: 'intent',
    canProceed: false,
    isSubmitting: false,
    data: createInitialData(),
    validation: createInitialValidation(),
    sessionId: null,
    startedAt: null,
  };
}

// ============================================================================
// STATE
// ============================================================================

const state = $state<WizardState>(createInitialState());

// ============================================================================
// DERIVED STATE
// ============================================================================

const currentStepIndex = $derived(STEP_ORDER.indexOf(state.currentStep));
const isFirstStep = $derived(currentStepIndex === 0);
const isLastStep = $derived(currentStepIndex === STEP_ORDER.length - 1);
const progress = $derived(((currentStepIndex + 1) / STEP_ORDER.length) * 100);

const canGoBack = $derived(!isFirstStep && !state.isSubmitting);
const canGoForward = $derived(
  state.validation[state.currentStep].isValid && !state.isSubmitting
);

const currentStepValidation = $derived(state.validation[state.currentStep]);

const projectSummary = $derived({
  name: state.data.projectName,
  type: state.data.projectType,
  languages: [state.data.primaryLanguage, ...state.data.secondaryLanguages].filter(Boolean),
  stack: state.data.selectedStack?.name ?? 'None selected',
  features: Object.entries(state.data.features)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name),
  path: state.data.outputPath,
});

// ============================================================================
// PERSISTENCE
// ============================================================================

function saveDraft(): void {
  if (!browser) return;
  try {
    const draft = {
      data: state.data,
      currentStep: state.currentStep,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch (e) {
    console.error('Failed to save wizard draft:', e);
  }
}

function loadDraft(): boolean {
  if (!browser) return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const draft = JSON.parse(stored);
      const savedAt = new Date(draft.savedAt);
      const hoursSince = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60);

      // Only restore if less than 24 hours old
      if (hoursSince < 24) {
        state.data = { ...createInitialData(), ...draft.data };
        state.currentStep = draft.currentStep;
        validateCurrentStep();
        return true;
      }
    }
  } catch (e) {
    console.error('Failed to load wizard draft:', e);
  }
  return false;
}

function clearDraft(): void {
  if (!browser) return;
  localStorage.removeItem(STORAGE_KEY);
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateStep(step: WizardStep, data: WizardData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (step) {
    case 'intent':
      if (!data.projectName.trim()) {
        errors.push('Project name is required');
      } else if (data.projectName.length < 2) {
        errors.push('Project name must be at least 2 characters');
      } else if (!/^[a-z0-9-_]+$/i.test(data.projectName)) {
        errors.push('Project name can only contain letters, numbers, hyphens, and underscores');
      }
      if (!data.projectDescription.trim()) {
        warnings.push('A description helps AI provide better recommendations');
      }
      break;

    case 'languages':
      if (!data.primaryLanguage) {
        errors.push('Select a primary language');
      }
      if (data.secondaryLanguages.length > 4) {
        warnings.push('More than 4 languages may increase project complexity');
      }
      break;

    case 'stack':
      if (!data.selectedStack) {
        errors.push('Select a technology stack');
      }
      break;

    case 'config':
      // Config step is optional, always valid
      break;

    case 'launch':
      if (!data.outputPath.trim()) {
        errors.push('Select an output directory');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateCurrentStep(): void {
  const result = validateStep(state.currentStep, state.data);
  state.validation[state.currentStep] = result;
}

function validateAllSteps(): void {
  for (const step of STEP_ORDER) {
    state.validation[step] = validateStep(step, state.data);
  }
}

// ============================================================================
// ACTIONS
// ============================================================================

async function open(options?: WizardOpenOptions): Promise<void> {
  // Start learning session (non-blocking)
  try {
    // TODO: Implement startProjectSession in vibeforgeClient
    // const vibeforgeClient = await import('$lib/core/api/vibeforgeClient');
    // const session = await vibeforgeClient.startProjectSession();
    // state.sessionId = session.id;
    state.sessionId = `session_${Date.now()}`;
  } catch (e) {
    console.warn('Learning session not started:', e);
  }

  state.startedAt = new Date();

  // Optionally load previous draft
  if (options?.loadDraft) {
    loadDraft();
  }

  // Optionally skip to step (for power users)
  if (options?.skipToStep) {
    state.currentStep = options.skipToStep;
  }

  validateCurrentStep();
  state.isOpen = true;
}

function close(options?: WizardCloseOptions): void {
  if (options?.saveDraft && state.data.projectName) {
    saveDraft();
  }
  state.isOpen = false;
}

function goToStep(step: WizardStep): void {
  const targetIndex = STEP_ORDER.indexOf(step);
  const currentIndex = STEP_ORDER.indexOf(state.currentStep);

  // Can always go back, but can only go forward if current is valid
  if (targetIndex < currentIndex || state.validation[state.currentStep].isValid) {
    state.currentStep = step;
    validateCurrentStep();
    saveDraft();
  }
}

function nextStep(): void {
  if (!canGoForward) return;

  const nextIndex = currentStepIndex + 1;
  if (nextIndex < STEP_ORDER.length) {
    trackStepCompletion(state.currentStep);
    state.currentStep = STEP_ORDER[nextIndex];
    validateCurrentStep();
    saveDraft();
  }
}

function previousStep(): void {
  if (!canGoBack) return;

  const prevIndex = currentStepIndex - 1;
  if (prevIndex >= 0) {
    state.currentStep = STEP_ORDER[prevIndex];
    validateCurrentStep();
  }
}

function updateData<K extends keyof WizardData>(key: K, value: WizardData[K]): void {
  state.data[key] = value;
  validateCurrentStep();
}

function setSubmitting(submitting: boolean): void {
  state.isSubmitting = submitting;
}

function reset(): void {
  Object.assign(state, createInitialState());
  clearDraft();
}

// ============================================================================
// LEARNING INTEGRATION
// ============================================================================

async function trackStepCompletion(step: WizardStep): Promise<void> {
  if (!state.sessionId) return;

  try {
    // TODO: Implement trackWizardStep in vibeforgeClient
    console.debug('Track step:', step, getStepTrackingData(step));
    // const vibeforgeClient = await import('$lib/core/api/vibeforgeClient');
    // await vibeforgeClient.trackWizardStep({
    //   sessionId: state.sessionId,
    //   step,
    //   completedAt: new Date().toISOString(),
    //   data: getStepTrackingData(step),
    // });
  } catch (e) {
    console.warn('Failed to track step completion:', e);
  }
}

function getStepTrackingData(step: WizardStep): Record<string, unknown> {
  switch (step) {
    case 'intent':
      return {
        projectType: state.data.projectType,
        complexity: state.data.complexity,
        descriptionLength: state.data.projectDescription.length,
      };
    case 'languages':
      return {
        primaryLanguage: state.data.primaryLanguage,
        secondaryCount: state.data.secondaryLanguages.length,
        languagesConsidered: state.data.languagesConsidered,
      };
    case 'stack':
      return {
        selectedStack: state.data.selectedStack?.id,
        stacksCompared: state.data.stacksCompared,
        usedAiRecommendation: state.data.aiRecommendations.some(
          (r) => r.stack.id === state.data.selectedStack?.id
        ),
      };
    default:
      return {};
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const wizardStore = {
  // State (readonly via getters)
  get isOpen() { return state.isOpen; },
  get currentStep() { return state.currentStep; },
  get isSubmitting() { return state.isSubmitting; },
  get data() { return state.data; },
  get validation() { return state.validation; },
  get sessionId() { return state.sessionId; },
  get startedAt() { return state.startedAt; },

  // Derived
  get currentStepIndex() { return currentStepIndex; },
  get isFirstStep() { return isFirstStep; },
  get isLastStep() { return isLastStep; },
  get progress() { return progress; },
  get canGoBack() { return canGoBack; },
  get canGoForward() { return canGoForward; },
  get currentStepValidation() { return currentStepValidation; },
  get projectSummary() { return projectSummary; },

  // Actions
  open,
  close,
  goToStep,
  nextStep,
  previousStep,
  updateData,
  setSubmitting,
  reset,
  validateCurrentStep,
  validateAllSteps,
  saveDraft,
  loadDraft,
  clearDraft,
};
