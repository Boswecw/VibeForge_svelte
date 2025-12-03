/**
 * Analysis Store (Svelte 5)
 *
 * Manages codebase analysis state using Svelte 5 runes.
 */

import type { CodebaseAnalysis } from '../types/analysis';
import type { QualityStandards } from '../types/standards';

import { CodebaseAnalyzer } from '../analyzer/CodebaseAnalyzer';
import { StandardsEngine } from '../standards/StandardsEngine';

interface AnalysisStoreState {
	/**
	 * Current analysis
	 */
	analysis: CodebaseAnalysis | null;

	/**
	 * Analyzer instance
	 */
	analyzer: CodebaseAnalyzer | null;

	/**
	 * Standards engine
	 */
	engine: StandardsEngine | null;

	/**
	 * Loading state
	 */
	isAnalyzing: boolean;

	/**
	 * Error state
	 */
	error: string | null;

	/**
	 * Analysis progress (0-100)
	 */
	progress: number;
}

/**
 * Creates an analysis store
 */
function createAnalysisStore() {
	let state = $state<AnalysisStoreState>({
		analysis: null,
		analyzer: null,
		engine: null,
		isAnalyzing: false,
		error: null,
		progress: 0
	});

	// Derived values
	const hasAnalysis = $derived(state.analysis !== null);
	const totalFiles = $derived(state.analysis?.metrics.typeSafety.totalFiles || 0);
	const totalLines = $derived(state.analysis?.metrics.size.totalLines || 0);
	const testCoverage = $derived(state.analysis?.metrics.testCoverage.lines || 0);
	const typeSafety = $derived(
		state.analysis
			? Math.round(
					(state.analysis.metrics.typeSafety.typedFiles /
						state.analysis.metrics.typeSafety.totalFiles) *
						100
			  )
			: 0
	);
	const issueCount = $derived(state.analysis?.issues.length || 0);

	return {
		// State
		get analysis() {
			return state.analysis;
		},
		get analyzer() {
			return state.analyzer;
		},
		get engine() {
			return state.engine;
		},
		get isAnalyzing() {
			return state.isAnalyzing;
		},
		get error() {
			return state.error;
		},
		get progress() {
			return state.progress;
		},

		// Derived
		get hasAnalysis() {
			return hasAnalysis;
		},
		get totalFiles() {
			return totalFiles;
		},
		get totalLines() {
			return totalLines;
		},
		get testCoverage() {
			return testCoverage;
		},
		get typeSafety() {
			return typeSafety;
		},
		get issueCount() {
			return issueCount;
		},

		// Actions

		/**
		 * Runs codebase analysis
		 */
		async analyzeCodebase(projectPath: string): Promise<CodebaseAnalysis> {
			state.isAnalyzing = true;
			state.error = null;
			state.progress = 0;

			try {
				// Create analyzer
				const analyzer = new CodebaseAnalyzer({
					excludeDirs: ['node_modules', '.git', 'dist', 'build', '.svelte-kit']
				});

				state.analyzer = analyzer;

				// Run analysis with progress tracking
				state.progress = 10;
				const analysis = await analyzer.analyze(projectPath);
				state.progress = 100;

				state.analysis = analysis;

				return analysis;
			} catch (error) {
				state.error = error instanceof Error ? error.message : String(error);
				throw error;
			} finally {
				state.isAnalyzing = false;
			}
		},

		/**
		 * Evaluates analysis against standards
		 */
		async evaluateStandards(standards: QualityStandards): Promise<void> {
			if (!state.analysis) {
				throw new Error('No analysis available');
			}

			state.isAnalyzing = true;
			state.error = null;

			try {
				const engine = new StandardsEngine(standards);
				const evaluation = await engine.evaluate(state.analysis);

				// Store engine and attach evaluation to analysis
				state.engine = engine;
				state.analysis = {
					...state.analysis,
					evaluation
				} as any; // evaluation is dynamically added
			} catch (error) {
				state.error = error instanceof Error ? error.message : String(error);
				throw error;
			} finally {
				state.isAnalyzing = false;
			}
		},

		/**
		 * Re-analyzes the codebase (refresh)
		 */
		async refreshAnalysis(): Promise<CodebaseAnalysis> {
			if (!state.analyzer) {
				throw new Error('No analyzer available');
			}

			state.isAnalyzing = true;
			state.error = null;
			state.progress = 0;

			try {
				// Get project path from current analysis
				const projectPath = state.analysis?.path || '/';

				state.progress = 10;
				const analysis = await state.analyzer.analyze(projectPath);
				state.progress = 100;

				state.analysis = analysis;

				return analysis;
			} catch (error) {
				state.error = error instanceof Error ? error.message : String(error);
				throw error;
			} finally {
				state.isAnalyzing = false;
			}
		},

		/**
		 * Clears the current analysis
		 */
		clearAnalysis(): void {
			state.analysis = null;
			state.analyzer = null;
			state.engine = null;
			state.error = null;
			state.progress = 0;
		},

		/**
		 * Updates analysis (for external updates)
		 */
		updateAnalysis(analysis: CodebaseAnalysis): void {
			state.analysis = analysis;
		},

		/**
		 * Sets analysis progress (for external tracking)
		 */
		setProgress(progress: number): void {
			state.progress = Math.max(0, Math.min(100, progress));
		}
	};
}

// Create singleton instance
export const analysisStore = createAnalysisStore();
