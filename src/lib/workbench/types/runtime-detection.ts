/**
 * Runtime Detection System Types
 *
 * Type definitions for analyzing existing projects and recommending
 * architecture patterns based on detected technology stack.
 */

import type { ArchitecturePatternId } from '$lib/data/architecture-patterns';

// ============================================================================
// DETECTED TECHNOLOGIES
// ============================================================================

/**
 * Programming languages detected in a project
 */
export type DetectedLanguage =
	| 'typescript'
	| 'javascript'
	| 'python'
	| 'rust'
	| 'go'
	| 'java'
	| 'csharp'
	| 'unknown';

/**
 * Frameworks and libraries detected in a project
 */
export type DetectedFramework =
	| 'sveltekit'
	| 'svelte'
	| 'react'
	| 'vue'
	| 'fastapi'
	| 'express'
	| 'nextjs'
	| 'tauri'
	| 'electron'
	| 'flask'
	| 'django'
	| 'unknown';

/**
 * Build tools and package managers detected
 */
export type DetectedBuildTool =
	| 'vite'
	| 'webpack'
	| 'npm'
	| 'pnpm'
	| 'yarn'
	| 'cargo'
	| 'poetry'
	| 'pip'
	| 'unknown';

/**
 * Database systems detected
 */
export type DetectedDatabase =
	| 'postgresql'
	| 'mysql'
	| 'sqlite'
	| 'mongodb'
	| 'redis'
	| 'none'
	| 'unknown';

/**
 * Project structure types
 */
export type ProjectStructure =
	| 'monorepo'
	| 'single-app'
	| 'multi-service'
	| 'library'
	| 'unknown';

// ============================================================================
// TECHNOLOGY STACK
// ============================================================================

/**
 * Complete technology stack detected in a project
 */
export interface TechnologyStack {
	/** Primary programming language */
	primaryLanguage: DetectedLanguage;

	/** Additional languages found */
	additionalLanguages: DetectedLanguage[];

	/** Frontend framework (if any) */
	frontendFramework?: DetectedFramework;

	/** Backend framework (if any) */
	backendFramework?: DetectedFramework;

	/** Desktop/mobile framework (if any) */
	desktopFramework?: DetectedFramework;

	/** Build tools detected */
	buildTools: DetectedBuildTool[];

	/** Database systems detected */
	databases: DetectedDatabase[];

	/** Project structure type */
	structure: ProjectStructure;

	/** Package files found */
	packageFiles: {
		packageJson?: boolean;
		cargoToml?: boolean;
		requirementsTxt?: boolean;
		poetryLock?: boolean;
		goMod?: boolean;
	};

	/** Config files found */
	configFiles: {
		viteConfig?: boolean;
		svelteConfig?: boolean;
		tauriConfig?: boolean;
		dockerCompose?: boolean;
		dockerfile?: boolean;
	};

	/** Confidence score (0-100) */
	confidence: number;
}

// ============================================================================
// FILE INDICATORS
// ============================================================================

/**
 * File patterns that indicate specific technologies
 */
export interface FileIndicator {
	/** File name or glob pattern */
	pattern: string;

	/** Technology indicated by this file */
	technology: DetectedLanguage | DetectedFramework | DetectedBuildTool | DetectedDatabase;

	/** Confidence weight (higher = stronger indicator) */
	weight: number;

	/** Whether this file must exist (vs. optional) */
	required?: boolean;
}

// ============================================================================
// PATTERN RECOMMENDATIONS
// ============================================================================

/**
 * A recommended architecture pattern with score
 */
export interface PatternRecommendation {
	/** Pattern ID */
	patternId: ArchitecturePatternId;

	/** Recommendation score (0-100) */
	score: number;

	/** Why this pattern was recommended */
	reasons: string[];

	/** Potential issues or mismatches */
	warnings: string[];

	/** Confidence level */
	confidence: 'high' | 'medium' | 'low';
}

/**
 * Complete pattern recommendation result
 */
export interface RecommendationResult {
	/** Detected technology stack */
	techStack: TechnologyStack;

	/** Recommended patterns, sorted by score (highest first) */
	recommendations: PatternRecommendation[];

	/** Analysis metadata */
	metadata: {
		/** Number of files scanned */
		filesScanned: number;

		/** Analysis duration in milliseconds */
		duration: number;

		/** Timestamp of analysis */
		timestamp: Date;
	};
}

// ============================================================================
// ANALYSIS OPTIONS
// ============================================================================

/**
 * Options for runtime detection analysis
 */
export interface RuntimeAnalysisOptions {
	/** Project directory to analyze */
	projectPath: string;

	/** Maximum depth to scan directories */
	maxDepth?: number;

	/** Patterns to exclude from scanning */
	exclude?: string[];

	/** Whether to analyze dependencies */
	analyzeDependencies?: boolean;

	/** Whether to read package.json/Cargo.toml contents */
	readPackageFiles?: boolean;
}

// ============================================================================
// DETECTOR INTERFACE
// ============================================================================

/**
 * Technology stack detector interface
 */
export interface TechStackDetector {
	/**
	 * Detect technology stack in a project
	 */
	detect(options: RuntimeAnalysisOptions): Promise<TechnologyStack>;

	/**
	 * Get confidence score for detected stack
	 */
	getConfidence(stack: TechnologyStack): number;
}

/**
 * Pattern recommender interface
 */
export interface PatternRecommender {
	/**
	 * Recommend patterns based on technology stack
	 */
	recommend(stack: TechnologyStack): PatternRecommendation[];

	/**
	 * Calculate score for a specific pattern
	 */
	scorePattern(stack: TechnologyStack, patternId: ArchitecturePatternId): number;
}

// ============================================================================
// EXPORTS
// ============================================================================

// Types are already exported inline above - no need to re-export
// (Removed duplicate exports to fix TypeScript conflicts)
