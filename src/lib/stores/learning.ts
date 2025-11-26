/**
 * Learning Store
 *
 * Manages interaction with the VibeForge learning layer API.
 * Tracks user behavior, stack outcomes, and provides analytics
 * for adaptive recommendations.
 */

import { writable, derived, get } from "svelte/store";
import type {
  VibeForgeProjectResponse,
  ProjectSessionResponse,
  StackOutcomeResponse,
  ModelPerformanceResponse,
  UserPreferenceSummary,
  StackSuccessRate,
} from "$lib/types/learning";
import { learningClient } from "$lib/api/vibeforgeClient";

// ============================================================================
// Store State Types
// ============================================================================

interface LearningState {
  // Current wizard session
  currentProject: VibeForgeProjectResponse | null;
  currentSession: ProjectSessionResponse | null;
  sessionStartTime: number | null;

  // Tracking data
  languagesViewed: Set<string>;
  languagesConsidered: Set<string>;
  stacksViewed: Set<string>;
  stacksCompared: Set<string>;
  stepsCompleted: Set<number>;
  stepsRevisited: Set<number>;

  // LLM tracking
  llmQueries: number;
  llmProvider: string | null;
  llmTokensUsed: number;

  // Analytics (cached)
  stackSuccessRates: StackSuccessRate[];
  userPreferences: UserPreferenceSummary | null;
  favoriteStacks: { stack_id: string; count: number }[];

  // State
  isLoading: boolean;
  error: string | null;
  analyticsLastFetched: number | null;
}

const defaultState: LearningState = {
  currentProject: null,
  currentSession: null,
  sessionStartTime: null,

  languagesViewed: new Set<string>(),
  languagesConsidered: new Set<string>(),
  stacksViewed: new Set<string>(),
  stacksCompared: new Set<string>(),
  stepsCompleted: new Set<number>(),
  stepsRevisited: new Set<number>(),

  llmQueries: 0,
  llmProvider: null,
  llmTokensUsed: 0,

  stackSuccessRates: [],
  userPreferences: null,
  favoriteStacks: [],

  isLoading: false,
  error: null,
  analyticsLastFetched: null,
};

// ============================================================================
// Create Learning Store
// ============================================================================

function createLearningStore() {
  const { subscribe, set, update } = writable<LearningState>(defaultState);

  return {
    subscribe,

    // ========================================================================
    // Project Management
    // ========================================================================

    /**
     * Start a new project tracking session
     */
    async startProject(projectData: {
      project_name: string;
      project_type: string;
      description?: string;
      selected_languages: string[];
      selected_stack: string;
      intent_description?: string;
      team_size?: number;
      timeline_estimate?: string;
      complexity_score?: number;
    }): Promise<VibeForgeProjectResponse | null> {
      update((state) => ({ ...state, isLoading: true, error: null }));

      try {
        const project = await learningClient.createProject({
          ...projectData,
          project_type: projectData.project_type,
        });

        update((state) => ({
          ...state,
          currentProject: project,
          isLoading: false,
        }));

        return project;
      } catch (error) {
        console.error("Failed to create project:", error);
        update((state) => ({
          ...state,
          isLoading: false,
          error: "Failed to create project",
        }));
        return null;
      }
    },

    /**
     * Update current project
     */
    async updateProject(updates: {
      project_name?: string;
      description?: string;
      complexity_score?: number;
    }): Promise<void> {
      const state = get({ subscribe });
      if (!state.currentProject) return;

      try {
        const updated = await learningClient.updateProject(
          state.currentProject.id,
          updates
        );
        update((s) => ({ ...s, currentProject: updated }));
      } catch (error) {
        console.error("Failed to update project:", error);
      }
    },

    // ========================================================================
    // Session Management
    // ========================================================================

    /**
     * Start a new wizard session
     */
    async startSession(
      projectId: number
    ): Promise<ProjectSessionResponse | null> {
      update((state) => ({ ...state, isLoading: true, error: null }));

      try {
        const session = await learningClient.createSession({
          project_id: projectId,
          steps_completed: [],
          steps_revisited: [],
          languages_viewed: [],
          languages_considered: [],
          languages_final: [],
          stacks_viewed: [],
          stacks_compared: [],
          llm_queries: 0,
          llm_tokens_consumed: 0,
          abandoned: false,
        });

        update((state) => ({
          ...state,
          currentSession: session,
          sessionStartTime: Date.now(),
          isLoading: false,
        }));

        return session;
      } catch (error) {
        console.error("Failed to create session:", error);
        update((state) => ({
          ...state,
          isLoading: false,
          error: "Failed to create session",
        }));
        return null;
      }
    },

    /**
     * Track step completion
     */
    async trackStepCompleted(stepNumber: number): Promise<void> {
      update((state) => {
        const newSteps = new Set(state.stepsCompleted);
        newSteps.add(stepNumber);
        return { ...state, stepsCompleted: newSteps };
      });

      await this.syncSession();
    },

    /**
     * Track step revisit
     */
    async trackStepRevisited(stepNumber: number): Promise<void> {
      update((state) => {
        const newRevisits = new Set(state.stepsRevisited);
        newRevisits.add(stepNumber);
        return { ...state, stepsRevisited: newRevisits };
      });

      await this.syncSession();
    },

    /**
     * Track language view
     */
    trackLanguageViewed(languageId: string): void {
      update((state) => {
        const newViewed = new Set(state.languagesViewed);
        newViewed.add(languageId);
        return { ...state, languagesViewed: newViewed };
      });
    },

    /**
     * Track language consideration
     */
    trackLanguageConsidered(languageId: string): void {
      update((state) => {
        const newConsidered = new Set(state.languagesConsidered);
        newConsidered.add(languageId);
        return { ...state, languagesConsidered: newConsidered };
      });
    },

    /**
     * Track stack view
     */
    trackStackViewed(stackId: string): void {
      update((state) => {
        const newViewed = new Set(state.stacksViewed);
        newViewed.add(stackId);
        return { ...state, stacksViewed: newViewed };
      });
    },

    /**
     * Track stack comparison
     */
    trackStackCompared(stackId: string): void {
      update((state) => {
        const newCompared = new Set(state.stacksCompared);
        newCompared.add(stackId);
        return { ...state, stacksCompared: newCompared };
      });
    },

    /**
     * Track LLM query
     */
    trackLLMQuery(provider: string, tokensUsed: number): void {
      update((state) => ({
        ...state,
        llmQueries: state.llmQueries + 1,
        llmProvider: provider,
        llmTokensUsed: state.llmTokensUsed + tokensUsed,
      }));
    },

    /**
     * Sync session data to backend
     */
    async syncSession(): Promise<void> {
      const state = get({ subscribe });
      if (!state.currentSession) return;

      try {
        const updates = {
          steps_completed: Array.from(state.stepsCompleted),
          steps_revisited: Array.from(state.stepsRevisited),
          languages_viewed: Array.from(state.languagesViewed),
          languages_considered: Array.from(state.languagesConsidered),
          stacks_viewed: Array.from(state.stacksViewed),
          stacks_compared: Array.from(state.stacksCompared),
          llm_queries: state.llmQueries,
          llm_provider_used: state.llmProvider || undefined,
          llm_tokens_consumed: state.llmTokensUsed,
        };

        const updated = await learningClient.updateSession(
          state.currentSession.id,
          updates
        );
        update((s) => ({ ...s, currentSession: updated }));
      } catch (error) {
        console.error("Failed to sync session:", error);
      }
    },

    /**
     * Complete the current session
     */
    async completeSession(
      finalLanguages: string[],
      finalStack: string
    ): Promise<void> {
      const state = get({ subscribe });
      if (!state.currentSession || !state.sessionStartTime) return;

      const durationSeconds = Math.floor(
        (Date.now() - state.sessionStartTime) / 1000
      );

      try {
        // Final sync with completion data
        await learningClient.updateSession(state.currentSession.id, {
          languages_final: finalLanguages,
          stack_final: finalStack,
          session_duration_seconds: durationSeconds,
        });

        // Mark as complete
        await learningClient.completeSession(
          state.currentSession.id,
          durationSeconds
        );

        update((s) => ({ ...s, currentSession: null, sessionStartTime: null }));
      } catch (error) {
        console.error("Failed to complete session:", error);
      }
    },

    /**
     * Abandon the current session
     */
    async abandonSession(): Promise<void> {
      const state = get({ subscribe });
      if (!state.currentSession) return;

      try {
        await learningClient.abandonSession(state.currentSession.id);
        update((s) => ({ ...s, currentSession: null, sessionStartTime: null }));
      } catch (error) {
        console.error("Failed to abandon session:", error);
      }
    },

    // ========================================================================
    // Analytics
    // ========================================================================

    /**
     * Fetch stack success rates
     */
    async fetchStackSuccessRates(minUses: number = 3): Promise<void> {
      try {
        const rates = await learningClient.getStackSuccessRates({
          min_uses: minUses,
        });
        update((state) => ({ ...state, stackSuccessRates: rates }));
      } catch (error) {
        console.error("Failed to fetch stack success rates:", error);
      }
    },

    /**
     * Fetch user preferences
     */
    async fetchUserPreferences(userId: number): Promise<void> {
      try {
        const prefs = await learningClient.getUserPreferences(userId);
        update((state) => ({ ...state, userPreferences: prefs }));
      } catch (error) {
        console.error("Failed to fetch user preferences:", error);
      }
    },

    /**
     * Fetch favorite stacks
     */
    async fetchFavoriteStacks(
      userId: number,
      limit: number = 5
    ): Promise<void> {
      try {
        const favorites = await learningClient.getUserFavoriteStacks(
          userId,
          limit
        );
        update((state) => ({ ...state, favoriteStacks: favorites }));
      } catch (error) {
        console.error("Failed to fetch favorite stacks:", error);
      }
    },

    /**
     * Refresh all analytics
     */
    async refreshAnalytics(userId?: number): Promise<void> {
      update((state) => ({ ...state, isLoading: true }));

      try {
        await Promise.all([
          this.fetchStackSuccessRates(),
          userId ? this.fetchUserPreferences(userId) : Promise.resolve(),
          userId ? this.fetchFavoriteStacks(userId) : Promise.resolve(),
        ]);

        update((state) => ({
          ...state,
          isLoading: false,
          analyticsLastFetched: Date.now(),
        }));
      } catch (error) {
        console.error("Failed to refresh analytics:", error);
        update((state) => ({ ...state, isLoading: false }));
      }
    },

    /**
     * Get success rate for a specific stack
     */
    getStackSuccessRate(stackId: string): StackSuccessRate | undefined {
      const state = get({ subscribe });
      return state.stackSuccessRates.find((rate) => rate.stack_id === stackId);
    },

    // ========================================================================
    // Reset
    // ========================================================================

    /**
     * Reset the learning store
     */
    reset(): void {
      set(defaultState);
    },
  };
}

// ============================================================================
// Export
// ============================================================================

export const learningStore = createLearningStore();

// Derived stores for convenient access
export const currentProject = derived(
  learningStore,
  ($store) => $store.currentProject
);
export const currentSession = derived(
  learningStore,
  ($store) => $store.currentSession
);
export const stackSuccessRates = derived(
  learningStore,
  ($store) => $store.stackSuccessRates
);
export const userPreferences = derived(
  learningStore,
  ($store) => $store.userPreferences
);
export const isLearningActive = derived(
  learningStore,
  ($store) => $store.currentProject !== null && $store.currentSession !== null
);
