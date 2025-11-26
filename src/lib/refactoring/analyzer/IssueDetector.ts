/**
 * Issue Detector
 *
 * Detects issues from codebase metrics and patterns
 */

import type {
	FileInfo,
	CodebaseMetrics,
	DetectedPattern,
	DetectedIssue,
	IssueSeverity
} from '../types/analysis';

/**
 * Issue Detector
 *
 * Analyzes metrics to detect potential issues
 */
export class IssueDetector {
	/**
	 * Detects issues from metrics and patterns
	 */
	async detect(
		files: FileInfo[],
		metrics: CodebaseMetrics,
		patterns: DetectedPattern[]
	): Promise<DetectedIssue[]> {
		const issues: DetectedIssue[] = [];

		// Check test coverage
		if (metrics.testCoverage.lines < 80) {
			issues.push(this.createIssue(
				'testing',
				'error',
				'Low Test Coverage',
				`Test coverage is ${metrics.testCoverage.lines}%, below recommended 80%`,
				[],
				`Increase test coverage to at least 80%`
			));
		}

		// Check type safety
		if (metrics.typeSafety.typeErrorCount > 0) {
			issues.push(this.createIssue(
				'type-safety',
				'error',
				'Type Errors Found',
				`Found ${metrics.typeSafety.typeErrorCount} TypeScript errors`,
				[],
				`Fix all TypeScript compilation errors`
			));
		}

		// Check code quality
		if (metrics.quality.todoCount > 50) {
			issues.push(this.createIssue(
				'code-quality',
				'warning',
				'High TODO Count',
				`Found ${metrics.quality.todoCount} TODO comments`,
				[],
				`Reduce TODO comments by completing or removing them`
			));
		}

		// Check for large files
		if (metrics.quality.largestFile.lines > 500) {
			issues.push(this.createIssue(
				'code-quality',
				'warning',
				'Large File Detected',
				`${metrics.quality.largestFile.path} has ${metrics.quality.largestFile.lines} lines`,
				[metrics.quality.largestFile.path],
				`Consider breaking down large files into smaller modules`
			));
		}

		return issues;
	}

	/**
	 * Creates a detected issue
	 */
	private createIssue(
		category: DetectedIssue['category'],
		severity: IssueSeverity,
		title: string,
		description: string,
		files: string[],
		suggestion: string
	): DetectedIssue {
		return {
			id: `issue-${Date.now()}-${Math.random().toString(36).substring(7)}`,
			category,
			severity,
			title,
			description,
			files,
			suggestion,
			autoFixable: false
		};
	}
}
