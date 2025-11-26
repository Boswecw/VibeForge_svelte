/**
 * Codebase Analyzer
 *
 * Orchestrates all analysis components to produce a complete codebase analysis
 */

import { FileSystemScanner } from './FileSystemScanner';
import { TechStackDetector } from './TechStackDetector';
import { MetricsCollector } from './MetricsCollector';
import { PatternDetector } from './PatternDetector';
import { IssueDetector } from './IssueDetector';
import type { CodebaseAnalysis } from '../types/analysis';

/**
 * Configuration for codebase analysis
 */
export interface AnalyzerConfig {
	/**
	 * Directories to exclude from scanning
	 */
	excludeDirs?: string[];

	/**
	 * File patterns to exclude
	 */
	excludePatterns?: string[];
}

/**
 * Codebase Analyzer
 *
 * Main entry point for analyzing a codebase
 */
export class CodebaseAnalyzer {
	private scanner: FileSystemScanner;
	private techDetector: TechStackDetector;
	private metricsCollector: MetricsCollector;
	private patternDetector: PatternDetector;
	private issueDetector: IssueDetector;

	constructor(config: AnalyzerConfig = {}) {
		this.scanner = new FileSystemScanner(config);
		this.techDetector = new TechStackDetector();
		this.metricsCollector = new MetricsCollector();
		this.patternDetector = new PatternDetector();
		this.issueDetector = new IssueDetector();
	}

	/**
	 * Analyzes a codebase and returns complete analysis
	 */
	async analyze(rootPath: string): Promise<CodebaseAnalysis> {
		// Step 1: Scan file system
		const structure = await this.scanner.scan(rootPath);

		// Step 2: Detect tech stack
		const techStack = await this.techDetector.detect(rootPath, structure.files);

		// Step 3: Collect metrics
		const metrics = await this.metricsCollector.collect(rootPath, structure.files);

		// Step 4: Detect patterns
		const patterns = await this.patternDetector.detect(structure.files, techStack);

		// Step 5: Detect issues
		const issues = await this.issueDetector.detect(structure.files, metrics, patterns);

		// Step 6: Generate summary
		const summary = this.generateSummary(metrics, issues);

		return {
			id: this.generateId(),
			path: rootPath,
			analyzedAt: new Date().toISOString(),
			structure,
			techStack,
			metrics,
			patterns,
			issues,
			summary
		};
	}

	/**
	 * Generates a unique ID for the analysis
	 */
	private generateId(): string {
		return `analysis-${Date.now()}-${Math.random().toString(36).substring(7)}`;
	}

	/**
	 * Generates analysis summary
	 */
	private generateSummary(
		metrics: CodebaseAnalysis['metrics'],
		issues: CodebaseAnalysis['issues']
	): CodebaseAnalysis['summary'] {
		// Calculate health score (0-100)
		let score = 100;

		// Deduct points for low coverage
		if (metrics.testCoverage.lines < 80) {
			score -= (80 - metrics.testCoverage.lines) * 0.5;
		}

		// Deduct points for type errors
		score -= Math.min(metrics.typeSafety.typeErrorCount * 2, 20);

		// Deduct points for issues
		const errorCount = issues.filter((i) => i.severity === 'error').length;
		const warningCount = issues.filter((i) => i.severity === 'warning').length;
		score -= errorCount * 5;
		score -= warningCount * 2;

		// Ensure score is between 0 and 100
		score = Math.max(0, Math.min(100, Math.round(score)));

		// Determine health status
		let health: 'excellent' | 'good' | 'fair' | 'poor';
		if (score >= 90) health = 'excellent';
		else if (score >= 75) health = 'good';
		else if (score >= 50) health = 'fair';
		else health = 'poor';

		// Generate highlights
		const highlights: string[] = [];
		if (metrics.testCoverage.lines >= 80) {
			highlights.push(`${metrics.testCoverage.lines}% test coverage`);
		}
		if (metrics.typeSafety.strictMode) {
			highlights.push('TypeScript strict mode enabled');
		}
		if (metrics.typeSafety.typeCheckPassed) {
			highlights.push('No type errors');
		}

		// Generate concerns
		const concerns: string[] = issues
			.filter((i) => i.severity === 'error')
			.map((i) => i.title);

		return {
			health,
			score,
			highlights,
			concerns
		};
	}
}
