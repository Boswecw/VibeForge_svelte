/**
 * TODO Comment Rule Evaluator
 *
 * Evaluates TODO/FIXME comments against code quality standards.
 */

import type { RuleEvaluation } from '../../types/standards';
import type { CodeQualityMetrics } from '../../types/analysis';

export interface TodoRuleConfig {
	allowTodoComments: boolean;
	maxTodoCount: number;
	allowFixmeComments: boolean;
	maxFixmeCount: number;
}

export class TodoRule {
	/**
	 * Evaluate TODO comment count
	 */
	static evaluateTodoCount(
		metrics: CodeQualityMetrics,
		allowTodos: boolean,
		maxCount: number
	): RuleEvaluation {
		if (!allowTodos) {
			const passed = metrics.todoCount === 0;
			return {
				ruleId: 'no-todos',
				ruleName: 'TODO comments not allowed',
				passed,
				actual: metrics.todoCount,
				expected: 0,
				message: passed ? 'No TODO comments' : `${metrics.todoCount} TODO comments found`,
				severity: 'error'
			};
		}

		const passed = metrics.todoCount <= maxCount;
		return {
			ruleId: 'max-todos',
			ruleName: `Maximum ${maxCount} TODO comments`,
			passed,
			actual: metrics.todoCount,
			expected: maxCount,
			message: passed
				? `${metrics.todoCount} TODO comments within limit`
				: `${metrics.todoCount} TODO comments exceeds limit of ${maxCount}`,
			severity: 'warning'
		};
	}

	/**
	 * Evaluate FIXME comment count
	 */
	static evaluateFixmeCount(metrics: CodeQualityMetrics, maxCount: number): RuleEvaluation {
		const passed = metrics.fixmeCount <= maxCount;

		return {
			ruleId: 'max-fixmes',
			ruleName: `Maximum ${maxCount} FIXME comments`,
			passed,
			actual: metrics.fixmeCount,
			expected: maxCount,
			message: passed
				? `${metrics.fixmeCount} FIXME comments within limit`
				: `${metrics.fixmeCount} FIXME comments exceeds limit of ${maxCount}`,
			severity: 'warning'
		};
	}

	/**
	 * Evaluate total technical debt comments
	 */
	static evaluateTotalTechnicalDebt(
		metrics: CodeQualityMetrics,
		maxTotal: number
	): RuleEvaluation {
		const total = metrics.todoCount + metrics.fixmeCount;
		const passed = total <= maxTotal;

		return {
			ruleId: 'max-technical-debt',
			ruleName: `Maximum ${maxTotal} technical debt comments (TODO + FIXME)`,
			passed,
			actual: total,
			expected: maxTotal,
			message: passed
				? `${total} technical debt comments within limit`
				: `${total} technical debt comments exceeds limit of ${maxTotal}`,
			severity: 'warning'
		};
	}

	/**
	 * Check for TODO comments in production code
	 */
	static evaluateProductionTodos(metrics: CodeQualityMetrics): RuleEvaluation {
		// This would require file-level analysis to determine if TODOs are in production code
		// For now, just warn if there are any TODOs
		const passed = metrics.todoCount === 0;

		return {
			ruleId: 'production-todos',
			ruleName: 'No TODOs in production code',
			passed,
			actual: metrics.todoCount,
			expected: 0,
			message: passed
				? 'No TODOs in production code'
				: `${metrics.todoCount} TODOs found - review before production`,
			severity: 'info'
		};
	}

	/**
	 * Evaluate TODO/FIXME ratio (FIXMEs are more urgent)
	 */
	static evaluateTodoFixmeRatio(metrics: CodeQualityMetrics): RuleEvaluation {
		if (metrics.todoCount + metrics.fixmeCount === 0) {
			return {
				ruleId: 'todo-fixme-ratio',
				ruleName: 'FIXME/TODO ratio',
				passed: true,
				actual: 0,
				expected: 'N/A',
				message: 'No technical debt comments',
				severity: 'info'
			};
		}

		const ratio = metrics.fixmeCount / (metrics.todoCount + metrics.fixmeCount);
		const passed = ratio <= 0.3; // FIXMEs should be < 30% of total

		return {
			ruleId: 'fixme-ratio',
			ruleName: 'FIXME comments should be < 30% of technical debt',
			passed,
			actual: `${(ratio * 100).toFixed(1)}%`,
			expected: '<= 30%',
			message: passed
				? `${metrics.fixmeCount} FIXMEs (${(ratio * 100).toFixed(1)}%) is acceptable`
				: `${metrics.fixmeCount} FIXMEs (${(ratio * 100).toFixed(1)}%) - too many urgent items`,
			severity: 'warning'
		};
	}

	/**
	 * Evaluate complete TODO rule configuration
	 */
	static evaluateAll(metrics: CodeQualityMetrics, config: TodoRuleConfig): RuleEvaluation[] {
		const rules: RuleEvaluation[] = [];

		// TODO count
		rules.push(this.evaluateTodoCount(metrics, config.allowTodoComments, config.maxTodoCount));

		// FIXME count
		if (config.allowFixmeComments !== undefined) {
			rules.push(this.evaluateFixmeCount(metrics, config.maxFixmeCount || 10));
		}

		// Total technical debt
		const maxTotal = Math.max(config.maxTodoCount, 50);
		rules.push(this.evaluateTotalTechnicalDebt(metrics, maxTotal));

		// TODO/FIXME ratio
		rules.push(this.evaluateTodoFixmeRatio(metrics));

		return rules;
	}
}
