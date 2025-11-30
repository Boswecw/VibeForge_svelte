/**
 * Pattern Comparison Store
 *
 * Manages the state of architecture patterns selected for comparison.
 * Allows users to compare up to 3 patterns side-by-side.
 */

import { writable, derived } from 'svelte/store';
import type { ArchitecturePattern } from '$lib/workbench/types/architecture';
import type { ArchitecturePatternId } from '$lib/data/architecture-patterns';

// ============================================================================
// TYPES
// ============================================================================

export interface ComparisonState {
	/** Patterns currently being compared */
	patterns: ArchitecturePattern[];

	/** Whether comparison view is open */
	isOpen: boolean;

	/** Maximum number of patterns that can be compared */
	maxPatterns: number;
}

// ============================================================================
// STORE
// ============================================================================

const MAX_COMPARISON_PATTERNS = 3;

const initialState: ComparisonState = {
	patterns: [],
	isOpen: false,
	maxPatterns: MAX_COMPARISON_PATTERNS
};

function createPatternComparisonStore() {
	const { subscribe, set, update } = writable<ComparisonState>(initialState);

	return {
		subscribe,

		/**
		 * Add a pattern to comparison
		 */
		addPattern: (pattern: ArchitecturePattern) => {
			update((state) => {
				// Don't add if already in comparison
				if (state.patterns.some((p) => p.id === pattern.id)) {
					return state;
				}

				// Don't add if max reached
				if (state.patterns.length >= state.maxPatterns) {
					return state;
				}

				return {
					...state,
					patterns: [...state.patterns, pattern],
					isOpen: state.patterns.length + 1 >= 2 // Auto-open when 2+ patterns
				};
			});
		},

		/**
		 * Remove a pattern from comparison
		 */
		removePattern: (patternId: ArchitecturePatternId) => {
			update((state) => {
				const patterns = state.patterns.filter((p) => p.id !== patternId);

				return {
					...state,
					patterns,
					isOpen: patterns.length >= 2 ? state.isOpen : false
				};
			});
		},

		/**
		 * Toggle a pattern in comparison
		 */
		togglePattern: (pattern: ArchitecturePattern) => {
			update((state) => {
				const exists = state.patterns.some((p) => p.id === pattern.id);

				if (exists) {
					const patterns = state.patterns.filter((p) => p.id !== pattern.id);
					return {
						...state,
						patterns,
						isOpen: patterns.length >= 2 ? state.isOpen : false
					};
				} else {
					if (state.patterns.length >= state.maxPatterns) {
						return state;
					}

					return {
						...state,
						patterns: [...state.patterns, pattern],
						isOpen: state.patterns.length + 1 >= 2
					};
				}
			});
		},

		/**
		 * Clear all patterns from comparison
		 */
		clear: () => {
			set({ ...initialState });
		},

		/**
		 * Open comparison view
		 */
		open: () => {
			update((state) => ({ ...state, isOpen: true }));
		},

		/**
		 * Close comparison view
		 */
		close: () => {
			update((state) => ({ ...state, isOpen: false }));
		},

		/**
		 * Check if a pattern is in comparison
		 */
		isInComparison: (patternId: ArchitecturePatternId): boolean => {
			let inComparison = false;
			subscribe((state) => {
				inComparison = state.patterns.some((p) => p.id === patternId);
			})();
			return inComparison;
		}
	};
}

// ============================================================================
// EXPORTS
// ============================================================================

export const patternComparison = createPatternComparisonStore();

// Derived stores
export const comparisonPatterns = derived(
	patternComparison,
	($comparison) => $comparison.patterns
);

export const comparisonCount = derived(
	patternComparison,
	($comparison) => $comparison.patterns.length
);

export const isComparisonOpen = derived(
	patternComparison,
	($comparison) => $comparison.isOpen
);

export const canAddToComparison = derived(
	patternComparison,
	($comparison) => $comparison.patterns.length < $comparison.maxPatterns
);
