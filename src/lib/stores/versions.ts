/**
 * VibeForge - Version Control Store
 *
 * Svelte store for managing prompt versions with auto-save.
 */

import { writable, derived } from "svelte/store";
import type {
  Version,
  VersionSummary,
  VersionCreate,
  VersionCompareResponse,
} from "$lib/core/api/versionsClient";
import { versionsClient } from "$lib/core/api";
import { toastStore } from "./toast.svelte";

// ============================================================================
// Types
// ============================================================================

interface VersionState {
  // Current prompt being versioned
  currentPromptId: string | null;

  // All versions for current prompt
  versions: VersionSummary[];
  currentVersionId: string | null;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;

  // Auto-save state
  lastSaveTime: number | null;
  hasUnsavedChanges: boolean;

  // Comparison state
  compareFrom: VersionSummary | null;
  compareTo: VersionSummary | null;
  compareResult: VersionCompareResponse | null;

  // Error state
  error: string | null;
}

const initialState: VersionState = {
  currentPromptId: null,
  versions: [],
  currentVersionId: null,
  isLoading: false,
  isSaving: false,
  lastSaveTime: null,
  hasUnsavedChanges: false,
  compareFrom: null,
  compareTo: null,
  compareResult: null,
  error: null,
};

// ============================================================================
// Store
// ============================================================================

function createVersionStore() {
  const { subscribe, set, update } = writable<VersionState>(initialState);

  // Auto-save timer
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    subscribe,

    /**
     * Load versions for a prompt
     */
    async loadVersions(promptId: string) {
      update((state) => ({ ...state, isLoading: true, error: null }));

      const result = await versionsClient.versionsClient.listVersions(promptId);

      if (result.error) {
        update((state) => ({
          ...state,
          isLoading: false,
          error: result.error || null,
        }));
        return;
      }

      if (result.data) {
        update((state) => ({
          ...state,
          currentPromptId: promptId,
          versions: result.data!.versions,
          currentVersionId: result.data!.currentVersionId,
          isLoading: false,
          error: null,
        }));
      }
    },

    /**
     * Create a new version (manual or auto-save)
     */
    async saveVersion(
      promptId: string,
      content: string,
      autoSaved: boolean = true,
      changeSummary?: string
    ): Promise<boolean> {
      update((state) => ({ ...state, isSaving: true, error: null }));

      const versionData: VersionCreate = {
        content,
        autoSaved,
        changeSummary,
      };

      const result = await versionsClient.versionsClient.createVersion(
        promptId,
        versionData
      );

      if (result.error) {
        update((state) => ({
          ...state,
          isSaving: false,
          error: result.error || null,
        }));
        toastStore.error("Failed to save version: " + result.error);
        return false;
      }

      if (result.data) {
        // Reload versions to get updated list
        await this.loadVersions(promptId);

        update((state) => ({
          ...state,
          isSaving: false,
          hasUnsavedChanges: false,
          lastSaveTime: Date.now(),
          error: null,
        }));

        // Show toast notification
        if (!autoSaved) {
          toastStore.success("Version saved successfully");
        }

        return true;
      }

      return false;
    },

    /**
     * Schedule auto-save (debounced)
     */
    scheduleAutoSave(
      promptId: string,
      content: string,
      debounceMs: number = 2000
    ) {
      // Clear existing timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      // Mark as having unsaved changes
      update((state) => ({ ...state, hasUnsavedChanges: true }));

      // Schedule new save
      autoSaveTimer = setTimeout(() => {
        this.saveVersion(promptId, content, true);
      }, debounceMs);
    },

    /**
     * Cancel pending auto-save
     */
    cancelAutoSave() {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
      }
      update((state) => ({ ...state, hasUnsavedChanges: false }));
    },

    /**
     * Restore a specific version
     */
    async restoreVersion(
      promptId: string,
      versionId: string
    ): Promise<Version | null> {
      update((state) => ({ ...state, isLoading: true, error: null }));

      const result = await versionsClient.versionsClient.restoreVersion(
        promptId,
        versionId
      );

      if (result.error) {
        update((state) => ({
          ...state,
          isLoading: false,
          error: result.error || null,
        }));
        toastStore.error("Failed to restore version: " + result.error);
        return null;
      }

      if (result.data) {
        // Reload versions to get updated list
        await this.loadVersions(promptId);

        update((state) => ({ ...state, isLoading: false, error: null }));

        toastStore.success("Version restored successfully");

        return result.data;
      }

      return null;
    },

    /**
     * Get a specific version
     */
    async getVersion(
      promptId: string,
      versionId: string
    ): Promise<Version | null> {
      const result = await versionsClient.versionsClient.getVersion(
        promptId,
        versionId
      );

      if (result.error) {
        update((state) => ({ ...state, error: result.error || null }));
        return null;
      }

      return result.data || null;
    },

    /**
     * Compare two versions
     */
    async compareVersions(promptId: string, fromId: string, toId: string) {
      update((state) => ({ ...state, isLoading: true, error: null }));

      const result = await versionsClient.versionsClient.compareVersions(
        promptId,
        fromId,
        toId
      );

      if (result.error) {
        update((state) => ({
          ...state,
          isLoading: false,
          error: result.error || null,
        }));
        return;
      }

      if (result.data) {
        update((state) => ({
          ...state,
          compareFrom: result.data!.fromVersion,
          compareTo: result.data!.toVersion,
          compareResult: result.data!,
          isLoading: false,
          error: null,
        }));
      }
    },

    /**
     * Clear comparison state
     */
    clearComparison() {
      update((state) => ({
        ...state,
        compareFrom: null,
        compareTo: null,
        compareResult: null,
      }));
    },

    /**
     * Clear error
     */
    clearError() {
      update((state) => ({ ...state, error: null }));
    },

    /**
     * Reset store
     */
    reset() {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
      }
      set(initialState);
    },
  };
}

export const versionStore = createVersionStore();

// ============================================================================
// Derived Stores
// ============================================================================

/**
 * Get versions sorted by version number (newest first)
 */
export const sortedVersions = derived(
  versionStore,
  ($store) => $store.versions
);

/**
 * Get current version
 */
export const currentVersion = derived(
  versionStore,
  ($store) => $store.versions.find((v) => v.isCurrent) || null
);

/**
 * Check if auto-save is enabled
 */
export const canAutoSave = derived(
  versionStore,
  ($store) => $store.currentPromptId !== null && !$store.isSaving
);
