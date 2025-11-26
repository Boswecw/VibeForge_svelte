/**
 * Task Generator
 *
 * Generates concrete refactoring tasks from codebase analysis
 */

import type {
	CodebaseAnalysis,
	DetectedIssue,
	CodebaseMetrics
} from '../types/analysis';
import type { RefactoringTask, TaskPriority } from '../types/planning';

/**
 * Task Generator
 *
 * Converts analysis results into actionable refactoring tasks
 */
export class TaskGenerator {
	/**
	 * Generates tasks from codebase analysis
	 */
	generate(analysis: CodebaseAnalysis): RefactoringTask[] {
		const tasks: RefactoringTask[] = [];

		// Generate tasks from detected issues
		tasks.push(...this.generateFromIssues(analysis.issues));

		// Generate tasks from low metrics
		tasks.push(...this.generateFromMetrics(analysis.metrics));

		// Add IDs and timestamps
		return tasks.map((task, index) => ({
			...task,
			id: `task-${Date.now()}-${index}`,
			createdAt: new Date().toISOString()
		}));
	}

	/**
	 * Generates tasks from detected issues
	 */
	private generateFromIssues(issues: DetectedIssue[]): Omit<RefactoringTask, 'id' | 'createdAt'>[] {
		return issues.map((issue) => {
			const priority = this.issueSeverityToPriority(issue.severity);

			return {
				title: issue.title,
				description: issue.description,
				category: issue.category,
				priority,
				estimatedHours: this.estimateHoursFromIssue(issue),
				dependencies: [],
				affectedFiles: issue.files,
				acceptanceCriteria: [
					issue.suggestion || 'Issue resolved',
					'All tests passing',
					'TypeScript compilation successful'
				],
				status: 'pending' as const
			};
		});
	}

	/**
	 * Generates tasks from low metrics
	 */
	private generateFromMetrics(
		metrics: CodebaseMetrics
	): Omit<RefactoringTask, 'id' | 'createdAt'>[] {
		const tasks: Omit<RefactoringTask, 'id' | 'createdAt'>[] = [];

		// Low test coverage
		if (metrics.testCoverage.lines < 80) {
			const coverageGap = 80 - metrics.testCoverage.lines;
			tasks.push({
				title: 'Increase Test Coverage',
				description: `Current coverage is ${metrics.testCoverage.lines}%. Need to reach 80% minimum.`,
				category: 'testing',
				priority: 'high',
				estimatedHours: Math.ceil(coverageGap / 5), // 1 hour per 5% coverage
				dependencies: [],
				affectedFiles: metrics.testCoverage.uncoveredFiles,
				acceptanceCriteria: [
					'Test coverage ≥ 80%',
					'All new tests passing',
					'Existing tests still passing'
				],
				status: 'pending'
			});
		}

		// Failing tests
		if (metrics.testCoverage.failingTests > 0) {
			tasks.push({
				title: 'Fix Failing Tests',
				description: `${metrics.testCoverage.failingTests} tests are currently failing`,
				category: 'testing',
				priority: 'critical',
				estimatedHours: metrics.testCoverage.failingTests * 0.5,
				dependencies: [],
				affectedFiles: [],
				acceptanceCriteria: ['All tests passing', 'No test failures'],
				status: 'pending'
			});
		}

		// Type errors
		if (metrics.typeSafety.typeErrorCount > 0) {
			tasks.push({
				title: 'Fix TypeScript Errors',
				description: `${metrics.typeSafety.typeErrorCount} TypeScript compilation errors`,
				category: 'type-safety',
				priority: 'critical',
				estimatedHours: metrics.typeSafety.typeErrorCount * 0.25,
				dependencies: [],
				affectedFiles: [],
				acceptanceCriteria: [
					'Zero TypeScript errors',
					'Strict mode enabled',
					'All files compile successfully'
				],
				status: 'pending'
			});
		}

		// Missing strict mode
		if (!metrics.typeSafety.strictMode) {
			tasks.push({
				title: 'Enable TypeScript Strict Mode',
				description: 'Enable strict mode for better type safety',
				category: 'type-safety',
				priority: 'high',
				estimatedHours: 4,
				dependencies: ['fix-typescript-errors'], // Must fix errors first
				affectedFiles: ['tsconfig.json'],
				acceptanceCriteria: [
					'strict: true in tsconfig.json',
					'All files compile with strict mode',
					'No new type errors introduced'
				],
				status: 'pending'
			});
		}

		// Excessive TODOs
		if (metrics.quality.todoCount > 50) {
			tasks.push({
				title: 'Reduce TODO Comments',
				description: `${metrics.quality.todoCount} TODO comments should be addressed or removed`,
				category: 'code-quality',
				priority: 'medium',
				estimatedHours: Math.ceil(metrics.quality.todoCount / 10),
				dependencies: [],
				affectedFiles: [],
				acceptanceCriteria: [
					'TODO count < 50',
					'Critical TODOs addressed',
					'Outdated TODOs removed'
				],
				status: 'pending'
			});
		}

		return tasks;
	}

	/**
	 * Converts issue severity to task priority
	 */
	private issueSeverityToPriority(severity: DetectedIssue['severity']): TaskPriority {
		switch (severity) {
			case 'error':
				return 'critical';
			case 'warning':
				return 'high';
			case 'info':
				return 'medium';
			default:
				return 'low';
		}
	}

	/**
	 * Estimates hours required for an issue
	 */
	private estimateHoursFromIssue(issue: DetectedIssue): number {
		// Base estimate on severity and affected files
		const baseHours = issue.severity === 'error' ? 2 : 1;
		const fileMultiplier = Math.min(issue.files.length * 0.5, 4);

		return Math.ceil(baseHours + fileMultiplier);
	}
}
