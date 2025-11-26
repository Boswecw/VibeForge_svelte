/**
 * Codebase Analysis Type Definitions
 *
 * Types for analyzing codebases: structure, tech stack, metrics, patterns, issues.
 */

export type FileType =
	| 'typescript'
	| 'javascript'
	| 'svelte'
	| 'css'
	| 'html'
	| 'json'
	| 'markdown'
	| 'other';

export type Framework =
	| 'sveltekit'
	| 'svelte'
	| 'nextjs'
	| 'react'
	| 'vue'
	| 'express'
	| 'fastapi'
	| 'django'
	| 'unknown';

export type StateManagement =
	| 'svelte-runes'
	| 'svelte-stores'
	| 'redux'
	| 'zustand'
	| 'pinia'
	| 'vuex'
	| 'none';

export interface FileInfo {
	path: string;
	relativePath: string;
	type: FileType;
	extension: string;
	size: number; // Bytes
	lines: number;
	isTest: boolean;
	lastModified: string;
}

export interface DirectoryStructure {
	totalFiles: number;
	totalDirectories: number;
	totalSize: number; // Bytes
	files: FileInfo[];
	filesByType: Record<FileType, number>;
	testFiles: number;
	sourceFiles: number;
}

/**
 * Result of file system scan
 * (Alias for DirectoryStructure for clarity in scanner code)
 */
export type FileScanResult = DirectoryStructure;

export interface TechStack {
	framework: Framework;
	language: 'typescript' | 'javascript';
	cssFramework?: string;
	testFramework?: string;
	buildTool?: string;
	stateManagement: StateManagement;
	dependencies: {
		name: string;
		version: string;
		type: 'dependency' | 'devDependency';
	}[];
}

export interface TestCoverageMetrics {
	lines: number; // Percentage 0-100
	statements: number;
	branches: number;
	functions: number;
	uncoveredFiles: string[];
	totalTests: number;
	passingTests: number;
	failingTests: number;
}

export interface TypeSafetyMetrics {
	totalFiles: number;
	typedFiles: number; // .ts/.tsx files
	jsFiles: number; // .js/.jsx files
	anyTypeCount: number;
	typeErrorCount: number;
	strictMode: boolean;
	noImplicitAny: boolean;
	typeCheckPassed: boolean;
}

export interface CodeQualityMetrics {
	avgFileSize: number; // Lines
	largestFile: { path: string; lines: number };
	avgFunctionLength: number;
	maxComplexity: number;
	todoCount: number;
	fixmeCount: number;
	eslintErrors: number;
	eslintWarnings: number;
}

/**
 * Size Metrics
 */
export interface SizeMetrics {
	totalLines: number;
	codeLines: number;
	commentLines: number;
	blankLines: number;
}

export interface CodebaseMetrics {
	testCoverage: TestCoverageMetrics;
	typeSafety: TypeSafetyMetrics;
	quality: CodeQualityMetrics;
	size: SizeMetrics;
}

export type PatternType =
	| 'store-pattern'
	| 'api-pattern'
	| 'component-pattern'
	| 'routing-pattern'
	| 'testing-pattern';

export interface DetectedPattern {
	type: PatternType;
	name: string;
	description: string;
	files: string[];
	confidence: number; // 0-1
	isConsistent: boolean;
}

export type IssueSeverity = 'error' | 'warning' | 'info';
export type IssueCategory =
	| 'testing'
	| 'type-safety'
	| 'code-quality'
	| 'architecture'
	| 'security';

export interface DetectedIssue {
	id: string;
	category: IssueCategory;
	severity: IssueSeverity;
	title: string;
	description: string;
	files: string[];
	lineNumbers?: number[];
	suggestion?: string;
	autoFixable: boolean;
}

export interface CodebaseAnalysis {
	id: string;
	path: string;
	analyzedAt: string;
	gitCommit?: string;
	gitBranch?: string;

	structure: DirectoryStructure;
	techStack: TechStack;
	metrics: CodebaseMetrics;
	patterns: DetectedPattern[];
	issues: DetectedIssue[];

	summary: {
		health: 'excellent' | 'good' | 'fair' | 'poor';
		score: number; // 0-100
		highlights: string[];
		concerns: string[];
	};
}
