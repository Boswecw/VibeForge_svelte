/**
 * Scaffolding Types
 *
 * TypeScript types for project scaffolding functionality.
 * Matches Rust types in src-tauri/src/pattern_generator.rs
 */

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export type ScaffoldStage = 'preparing' | 'files' | 'dependencies' | 'git' | 'complete' | 'error';

export interface ScaffoldProgressEvent {
	/** Current scaffolding stage */
	stage: ScaffoldStage;

	/** Progress percentage (0-100) */
	progress: number;

	/** User-facing progress message */
	message: string;

	/** Optional detailed log output */
	details?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface ScaffoldConfig {
	/** Architecture pattern ID (e.g., "fullstack-web") */
	patternId: string;

	/** Pattern display name (e.g., "Full-Stack Web App") */
	patternName: string;

	/** Project name (e.g., "my-awesome-app") */
	projectName: string;

	/** Project description */
	projectDescription: string;

	/** Absolute path to project directory (parent folder) */
	projectPath: string;

	/** Components to generate */
	components: ComponentConfig[];

	/** Feature flags */
	features: FeatureFlags;
}

export interface ComponentConfig {
	/** Unique component ID */
	id: string;

	/** Component role (e.g., "backend", "frontend", "database") */
	role: string;

	/** Component display name */
	name: string;

	/** Programming language */
	language: string;

	/** Framework/library name */
	framework: string;

	/** Relative path within project */
	location: string;

	/** Scaffolding configuration */
	scaffolding: ScaffoldingDetails;

	/** Custom configuration (pattern-specific) */
	customConfig?: Record<string, unknown>;
}

export interface ScaffoldingDetails {
	/** Directories to create */
	directories: DirectoryDefinition[];

	/** Files to create */
	files: FileDefinition[];
}

export interface DirectoryDefinition {
	/** Directory path (relative to component location) */
	path: string;

	/** Optional description */
	description?: string;

	/** Subdirectories (recursive) */
	subdirectories?: DirectoryDefinition[];

	/** Files in this directory */
	files?: FileDefinition[];
}

export interface FileDefinition {
	/** File path (relative to parent directory) */
	path: string;

	/** File content (may contain Handlebars templates) */
	content: string;

	/** Template engine to use ("handlebars" or "none") */
	templateEngine: 'handlebars' | 'none';

	/** Whether file can be overwritten if it exists */
	overwritable: boolean;
}

export interface FeatureFlags {
	/** Include testing setup (Jest, Vitest, pytest, etc.) */
	testing: boolean;

	/** Include linting/formatting (ESLint, Prettier, etc.) */
	linting: boolean;

	/** Initialize git repository */
	git: boolean;

	/** Include Docker configuration */
	docker: boolean;

	/** Include CI/CD configuration */
	ci: boolean;
}

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface ScaffoldResult {
	/** Whether scaffolding was successful */
	success: boolean;

	/** Absolute path to generated project */
	projectPath: string;

	/** Success/error message */
	message: string;

	/** Number of files created */
	filesCreated: number;

	/** List of component IDs that were generated */
	componentsGenerated: string[];
}

export interface ScaffoldError {
	/** Error stage where failure occurred */
	stage: ScaffoldStage;

	/** Error message */
	message: string;

	/** Detailed error information */
	details?: string;

	/** Whether project files were rolled back */
	rolledBack: boolean;
}

// ============================================================================
// UI STATE
// ============================================================================

export interface ScaffoldingState {
	/** Whether scaffolding is in progress */
	isScaffolding: boolean;

	/** Current progress event */
	progress: ScaffoldProgressEvent | null;

	/** Scaffolding result (on success) */
	result: ScaffoldResult | null;

	/** Scaffolding error (on failure) */
	error: ScaffoldError | null;

	/** Log of all progress events */
	log: ScaffoldProgressEvent[];
}

export const DEFAULT_SCAFFOLDING_STATE: ScaffoldingState = {
	isScaffolding: false,
	progress: null,
	result: null,
	error: null,
	log: []
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user-friendly stage name
 */
export function getStageName(stage: ScaffoldStage): string {
	switch (stage) {
		case 'preparing':
			return 'Preparing';
		case 'files':
			return 'Creating Files';
		case 'dependencies':
			return 'Installing Dependencies';
		case 'git':
			return 'Initializing Git';
		case 'complete':
			return 'Complete';
		case 'error':
			return 'Error';
	}
}

/**
 * Get stage icon emoji
 */
export function getStageIcon(stage: ScaffoldStage): string {
	switch (stage) {
		case 'preparing':
			return '📋';
		case 'files':
			return '📁';
		case 'dependencies':
			return '📦';
		case 'git':
			return '🔧';
		case 'complete':
			return '✅';
		case 'error':
			return '❌';
	}
}

/**
 * Get stage order index for progress indicator
 */
export function getStageIndex(stage: ScaffoldStage): number {
	switch (stage) {
		case 'preparing':
			return 0;
		case 'files':
			return 1;
		case 'dependencies':
			return 2;
		case 'git':
			return 3;
		case 'complete':
		case 'error':
			return 4;
	}
}

/**
 * Check if stage is active
 */
export function isStageActive(currentStage: ScaffoldStage, stage: ScaffoldStage): boolean {
	return getStageIndex(currentStage) === getStageIndex(stage);
}

/**
 * Check if stage is completed
 */
export function isStageCompleted(currentStage: ScaffoldStage, stage: ScaffoldStage): boolean {
	return getStageIndex(currentStage) > getStageIndex(stage);
}
