/**
 * Coverage Rule Evaluator
 *
 * Evaluates test coverage metrics against standards.
 */

import type { RuleEvaluation } from '../../types/standards';
import type { TestCoverageMetrics } from '../../types/analysis';

export interface CoverageRuleConfig {
	minimumCoverage: number;
	requireUnitTests: boolean;
	requireComponentTests: boolean;
	requireE2ETests: boolean;
}

export class CoverageRule {
	/**
	 * Evaluate if coverage meets minimum threshold
	 */
	static evaluateMinimumCoverage(
		coverage: TestCoverageMetrics,
		threshold: number
	): RuleEvaluation {
		const passed = coverage.lines >= threshold;

		return {
			ruleId: 'minimum-coverage',
			ruleName: `Minimum ${threshold}% test coverage`,
			passed,
			actual: coverage.lines,
			expected: threshold,
			message: passed
				? `Coverage ${coverage.lines}% meets minimum ${threshold}%`
				: `Coverage ${coverage.lines}% below minimum ${threshold}%`,
			severity: 'error'
		};
	}

	/**
	 * Evaluate if unit tests exist
	 */
	static evaluateUnitTestsExist(coverage: TestCoverageMetrics): RuleEvaluation {
		const passed = coverage.totalTests > 0;

		return {
			ruleId: 'unit-tests-exist',
			ruleName: 'Unit tests must exist',
			passed,
			actual: coverage.totalTests,
			expected: '> 0',
			message: passed ? `${coverage.totalTests} unit tests found` : 'No unit tests found',
			severity: 'error'
		};
	}

	/**
	 * Evaluate if all tests are passing
	 */
	static evaluateAllTestsPassing(coverage: TestCoverageMetrics): RuleEvaluation {
		const passed = coverage.failingTests === 0;

		return {
			ruleId: 'all-tests-passing',
			ruleName: 'All tests must pass',
			passed,
			actual: coverage.failingTests,
			expected: 0,
			message: passed
				? `All ${coverage.passingTests} tests passing`
				: `${coverage.failingTests} tests failing`,
			severity: 'error'
		};
	}

	/**
	 * Evaluate coverage branch percentage
	 */
	static evaluateBranchCoverage(
		coverage: TestCoverageMetrics,
		threshold: number
	): RuleEvaluation {
		const passed = coverage.branches >= threshold;

		return {
			ruleId: 'branch-coverage',
			ruleName: `Branch coverage ≥ ${threshold}%`,
			passed,
			actual: coverage.branches,
			expected: threshold,
			message: passed
				? `Branch coverage ${coverage.branches}% meets threshold`
				: `Branch coverage ${coverage.branches}% below ${threshold}%`,
			severity: 'warning'
		};
	}

	/**
	 * Evaluate function coverage percentage
	 */
	static evaluateFunctionCoverage(
		coverage: TestCoverageMetrics,
		threshold: number
	): RuleEvaluation {
		const passed = coverage.functions >= threshold;

		return {
			ruleId: 'function-coverage',
			ruleName: `Function coverage ≥ ${threshold}%`,
			passed,
			actual: coverage.functions,
			expected: threshold,
			message: passed
				? `Function coverage ${coverage.functions}% meets threshold`
				: `Function coverage ${coverage.functions}% below ${threshold}%`,
			severity: 'warning'
		};
	}

	/**
	 * Evaluate complete coverage configuration
	 */
	static evaluateAll(
		coverage: TestCoverageMetrics,
		config: CoverageRuleConfig
	): RuleEvaluation[] {
		const rules: RuleEvaluation[] = [];

		// Minimum coverage
		rules.push(this.evaluateMinimumCoverage(coverage, config.minimumCoverage));

		// Unit tests exist
		if (config.requireUnitTests) {
			rules.push(this.evaluateUnitTestsExist(coverage));
		}

		// All tests passing
		rules.push(this.evaluateAllTestsPassing(coverage));

		// Branch coverage
		rules.push(this.evaluateBranchCoverage(coverage, config.minimumCoverage));

		// Function coverage
		rules.push(this.evaluateFunctionCoverage(coverage, config.minimumCoverage));

		return rules;
	}
}
