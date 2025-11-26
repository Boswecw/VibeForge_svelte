/**
 * Type Safety Rule Evaluator
 *
 * Evaluates TypeScript type safety metrics against standards.
 */

import type { RuleEvaluation } from '../../types/standards';
import type { TypeSafetyMetrics } from '../../types/analysis';

export interface TypeSafetyRuleConfig {
	allowAnyTypes: boolean;
	maxTypeErrors: number;
	requireStrictMode: boolean;
	allowImplicitAny: boolean;
}

export class TypeSafetyRule {
	/**
	 * Evaluate 'any' types usage
	 */
	static evaluateAnyTypes(
		metrics: TypeSafetyMetrics,
		allowAnyTypes: boolean
	): RuleEvaluation {
		if (!allowAnyTypes) {
			const passed = metrics.anyTypeCount === 0;
			return {
				ruleId: 'no-any-types',
				ruleName: 'No "any" types allowed',
				passed,
				actual: metrics.anyTypeCount,
				expected: 0,
				message: passed ? 'No "any" types found' : `${metrics.anyTypeCount} "any" types found`,
				severity: 'error'
			};
		} else {
			// Warning if excessive 'any' types
			const passed = metrics.anyTypeCount <= 20;
			return {
				ruleId: 'excessive-any-types',
				ruleName: '"any" types should be minimized',
				passed,
				actual: metrics.anyTypeCount,
				expected: '<= 20',
				message: passed
					? `${metrics.anyTypeCount} "any" types is acceptable`
					: `${metrics.anyTypeCount} "any" types - consider reducing`,
				severity: 'warning'
			};
		}
	}

	/**
	 * Evaluate type error count
	 */
	static evaluateTypeErrors(
		metrics: TypeSafetyMetrics,
		maxTypeErrors: number
	): RuleEvaluation {
		const passed = metrics.typeErrorCount <= maxTypeErrors;

		return {
			ruleId: 'max-type-errors',
			ruleName: `Maximum ${maxTypeErrors} type errors`,
			passed,
			actual: metrics.typeErrorCount,
			expected: maxTypeErrors,
			message: passed
				? `${metrics.typeErrorCount} type errors within limit`
				: `${metrics.typeErrorCount} type errors exceeds limit of ${maxTypeErrors}`,
			severity: 'error'
		};
	}

	/**
	 * Evaluate TypeScript strict mode
	 */
	static evaluateStrictMode(
		metrics: TypeSafetyMetrics,
		requireStrictMode: boolean
	): RuleEvaluation {
		if (!requireStrictMode) {
			return {
				ruleId: 'strict-mode-optional',
				ruleName: 'TypeScript strict mode (optional)',
				passed: true,
				actual: metrics.strictMode,
				expected: 'optional',
				message: metrics.strictMode
					? 'Strict mode enabled (recommended)'
					: 'Strict mode disabled',
				severity: 'info'
			};
		}

		const passed = metrics.strictMode;
		return {
			ruleId: 'strict-mode-required',
			ruleName: 'TypeScript strict mode required',
			passed,
			actual: metrics.strictMode,
			expected: true,
			message: passed ? 'Strict mode enabled' : 'Strict mode not enabled',
			severity: 'error'
		};
	}

	/**
	 * Evaluate noImplicitAny setting
	 */
	static evaluateNoImplicitAny(
		metrics: TypeSafetyMetrics,
		allowImplicitAny: boolean
	): RuleEvaluation {
		if (allowImplicitAny) {
			return {
				ruleId: 'implicit-any-allowed',
				ruleName: 'Implicit "any" allowed',
				passed: true,
				actual: !metrics.noImplicitAny,
				expected: 'allowed',
				message: 'Implicit "any" is allowed',
				severity: 'info'
			};
		}

		const passed = metrics.noImplicitAny;
		return {
			ruleId: 'no-implicit-any',
			ruleName: 'No implicit "any"',
			passed,
			actual: metrics.noImplicitAny,
			expected: true,
			message: passed ? 'noImplicitAny enabled' : 'noImplicitAny not enabled',
			severity: 'error'
		};
	}

	/**
	 * Evaluate type check passing
	 */
	static evaluateTypeCheckPassing(metrics: TypeSafetyMetrics): RuleEvaluation {
		const passed = metrics.typeCheckPassed;

		return {
			ruleId: 'type-check-passing',
			ruleName: 'TypeScript type check must pass',
			passed,
			actual: metrics.typeCheckPassed,
			expected: true,
			message: passed ? 'Type check passed' : 'Type check failed',
			severity: 'error'
		};
	}

	/**
	 * Evaluate TypeScript file percentage
	 */
	static evaluateTypeScriptPercentage(metrics: TypeSafetyMetrics): RuleEvaluation {
		const tsPercentage =
			metrics.totalFiles > 0 ? (metrics.typedFiles / metrics.totalFiles) * 100 : 0;
		const passed = tsPercentage >= 80; // 80% TypeScript files

		return {
			ruleId: 'typescript-percentage',
			ruleName: 'Majority of files should be TypeScript',
			passed,
			actual: tsPercentage,
			expected: '>= 80%',
			message: passed
				? `${tsPercentage.toFixed(1)}% TypeScript files`
				: `Only ${tsPercentage.toFixed(1)}% TypeScript files`,
			severity: 'warning'
		};
	}

	/**
	 * Evaluate complete type safety configuration
	 */
	static evaluateAll(
		metrics: TypeSafetyMetrics,
		config: TypeSafetyRuleConfig
	): RuleEvaluation[] {
		const rules: RuleEvaluation[] = [];

		// 'any' types
		rules.push(this.evaluateAnyTypes(metrics, config.allowAnyTypes));

		// Type errors
		rules.push(this.evaluateTypeErrors(metrics, config.maxTypeErrors));

		// Strict mode
		rules.push(this.evaluateStrictMode(metrics, config.requireStrictMode));

		// No implicit any
		rules.push(this.evaluateNoImplicitAny(metrics, config.allowImplicitAny));

		// Type check passing
		rules.push(this.evaluateTypeCheckPassing(metrics));

		// TypeScript percentage
		rules.push(this.evaluateTypeScriptPercentage(metrics));

		return rules;
	}
}
