import { writable, derived, get } from "svelte/store";
import type { StackCategory } from "$lib/core/types/stack-profiles";

// Wizard state types
export interface ProjectIntent {
  name: string;
  description: string;
  projectType: StackCategory | "";
  teamSize: "solo" | "small" | "medium" | "large";
  timeline: "sprint" | "month" | "quarter" | "long-term";
}

export interface ProjectConfiguration {
  environmentVariables: Record<string, string>;
  database?: "postgresql" | "mongodb" | "mysql" | "sqlite" | "none";
  authentication?: "jwt" | "session" | "oauth" | "none";
  deploymentPlatform?: "vercel" | "netlify" | "aws" | "docker" | "manual";
  features: string[];
}

export interface WizardState {
  currentStep: number;
  completedSteps: Set<number>;

  // Step 1: Project Intent
  intent: ProjectIntent;

  // Step 2: Language Selection
  selectedLanguages: string[];

  // Step 3: Stack Selection
  selectedStackId: string | null;

  // Step 4: Configuration
  configuration: ProjectConfiguration;

  // Metadata
  createdAt: string;
  lastModified: string;
  draftId?: string;
}

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  isComplete: boolean;
  isValid: boolean;
}

// Default state
const defaultState: WizardState = {
  currentStep: 1,
  completedSteps: new Set(),
  intent: {
    name: "",
    description: "",
    projectType: "",
    teamSize: "solo",
    timeline: "month",
  },
  selectedLanguages: [],
  selectedStackId: null,
  configuration: {
    environmentVariables: {},
    features: [],
  },
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString(),
};

// Create the main wizard store
function createWizardStore() {
  const { subscribe, set, update } = writable<WizardState>(defaultState);

  return {
    subscribe,

    // Navigation
    goToStep: (step: number) => {
      update((state) => ({
        ...state,
        currentStep: step,
        lastModified: new Date().toISOString(),
      }));
    },

    nextStep: () => {
      update((state) => {
        const newStep = Math.min(state.currentStep + 1, 5);
        const completed = new Set(state.completedSteps);
        completed.add(state.currentStep);

        return {
          ...state,
          currentStep: newStep,
          completedSteps: completed,
          lastModified: new Date().toISOString(),
        };
      });
    },

    previousStep: () => {
      update((state) => ({
        ...state,
        currentStep: Math.max(state.currentStep - 1, 1),
        lastModified: new Date().toISOString(),
      }));
    },

    // Step 1: Project Intent
    updateIntent: (intent: Partial<ProjectIntent>) => {
      update((state) => ({
        ...state,
        intent: { ...state.intent, ...intent },
        lastModified: new Date().toISOString(),
      }));
    },

    // Step 2: Language Selection
    setLanguages: (languages: string[]) => {
      update((state) => ({
        ...state,
        selectedLanguages: languages,
        lastModified: new Date().toISOString(),
      }));
    },

    addLanguage: (languageId: string) => {
      update((state) => ({
        ...state,
        selectedLanguages: [...state.selectedLanguages, languageId],
        lastModified: new Date().toISOString(),
      }));
    },

    removeLanguage: (languageId: string) => {
      update((state) => ({
        ...state,
        selectedLanguages: state.selectedLanguages.filter(
          (id) => id !== languageId
        ),
        lastModified: new Date().toISOString(),
      }));
    },

    // Step 3: Stack Selection
    setStack: (stackId: string | null) => {
      update((state) => ({
        ...state,
        selectedStackId: stackId,
        lastModified: new Date().toISOString(),
      }));
    },

    // Step 4: Configuration
    updateConfiguration: (config: Partial<ProjectConfiguration>) => {
      update((state) => ({
        ...state,
        configuration: { ...state.configuration, ...config },
        lastModified: new Date().toISOString(),
      }));
    },

    setEnvironmentVariable: (key: string, value: string) => {
      update((state) => ({
        ...state,
        configuration: {
          ...state.configuration,
          environmentVariables: {
            ...state.configuration.environmentVariables,
            [key]: value,
          },
        },
        lastModified: new Date().toISOString(),
      }));
    },

    removeEnvironmentVariable: (key: string) => {
      update((state) => {
        const { [key]: removed, ...rest } =
          state.configuration.environmentVariables;
        return {
          ...state,
          configuration: {
            ...state.configuration,
            environmentVariables: rest,
          },
          lastModified: new Date().toISOString(),
        };
      });
    },

    // Persistence
    saveDraft: (draftId?: string) => {
      const state = get(wizardStore);
      const id = draftId || crypto.randomUUID();
      const draftState = { ...state, draftId: id };

      localStorage.setItem(`wizard-draft-${id}`, JSON.stringify(draftState));
      update((s) => ({ ...s, draftId: id }));

      return id;
    },

    loadDraft: (draftId: string) => {
      const saved = localStorage.getItem(`wizard-draft-${draftId}`);
      if (saved) {
        const state = JSON.parse(saved) as WizardState;
        // Restore Set from array
        state.completedSteps = new Set(Array.from(state.completedSteps || []));
        set(state);
        return true;
      }
      return false;
    },

    listDrafts: () => {
      const drafts: { id: string; name: string; modified: string }[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("wizard-draft-")) {
          const saved = localStorage.getItem(key);
          if (saved) {
            const state = JSON.parse(saved) as WizardState;
            drafts.push({
              id: state.draftId || key.replace("wizard-draft-", ""),
              name: state.intent.name || "Untitled Project",
              modified: state.lastModified,
            });
          }
        }
      }
      return drafts.sort(
        (a, b) =>
          new Date(b.modified).getTime() - new Date(a.modified).getTime()
      );
    },

    deleteDraft: (draftId: string) => {
      localStorage.removeItem(`wizard-draft-${draftId}`);
    },

    // Reset
    reset: () => {
      set({
        ...defaultState,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      });
    },
  };
}

export const wizardStore = createWizardStore();

// Derived stores for validation
export const isStep1Valid = derived(wizardStore, ($wizard) => {
  return (
    $wizard.intent.name.trim().length >= 3 &&
    $wizard.intent.description.trim().length >= 10 &&
    $wizard.intent.projectType !== ""
  );
});

export const isStep2Valid = derived(wizardStore, ($wizard) => {
  return $wizard.selectedLanguages.length > 0;
});

export const isStep3Valid = derived(wizardStore, ($wizard) => {
  return $wizard.selectedStackId !== null;
});

export const isStep4Valid = derived(wizardStore, ($wizard) => {
  // Configuration is optional, always valid
  return true;
});

export const canProceed = derived(
  [wizardStore, isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid],
  ([$wizard, $step1, $step2, $step3, $step4]) => {
    switch ($wizard.currentStep) {
      case 1:
        return $step1;
      case 2:
        return $step2;
      case 3:
        return $step3;
      case 4:
        return $step4;
      case 5:
        return true; // Review step
      default:
        return false;
    }
  }
);

// Progress percentage
export const wizardProgress = derived(wizardStore, ($wizard) => {
  return ($wizard.completedSteps.size / 5) * 100;
});
