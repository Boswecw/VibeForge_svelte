/**
 * Standards Engine
 *
 * Core engine for evaluating codebases against user-configured quality standards.
 * Generates quality gates and verifies compliance.
 *
 * KEY PRINCIPLE: Standards are USER-configurable, not hardcoded.
 */

import type {
	QualityStandards,
	StandardsEvaluation,
	CategoryEvaluation,
	RuleEvaluation,
	QualityGate,
	QualityGateCheck,
	GateVerificationResult
} from '../types/standards';
import type { CodebaseAnalysis } from '../types/analysis';

export class StandardsEngine {
	private standards: QualityStandards;

	constructor(standards: QualityStandards) {
		this.standards = standards;
	}

	/**
	 * Evaluate a codebase analysis against the configured standards
	 */
	evaluate(analysis: CodebaseAnalysis): StandardsEvaluation {
		const testingEval = this.evaluateTesting(analysis);
		const typeSafetyEval = this.evaluateTypeSafety(analysis);
		const codeQualityEval = this.evaluateCodeQuality(analysis);
		const architectureEval = this.evaluateArchitecture(analysis);

		const totalRules =
			testingEval.rules.length +
			typeSafetyEval.rules.length +
			codeQualityEval.rules.length +
			architectureEval.rules.length;

		const passedRules =
			testingEval.passedCount +
			typeSafetyEval.passedCount +
			codeQualityEval.passedCount +
			architectureEval.passedCount;

		const failedRules =
			testingEval.failedCount +
			typeSafetyEval.failedCount +
			codeQualityEval.failedCount +
			architectureEval.failedCount;

		const allErrors = [
			...testingEval.rules,
			...typeSafetyEval.rules,
			...codeQualityEval.rules,
			...architectureEval.rules
		];

		const errorCount = allErrors.filter((r) => r.severity === 'error' && !r.passed).length;
		const warningCount = allErrors.filter((r) => r.severity === 'warning' && !r.passed).length;

		const passed =
			testingEval.passed &&
			typeSafetyEval.passed &&
			codeQualityEval.passed &&
			architectureEval.passed;

		return {
			standardsId: this.standards.id,
			evaluatedAt: new Date().toISOString(),
			passed,
			categories: {
				testing: testingEval,
				typeSafety: typeSafetyEval,
				codeQuality: codeQualityEval,
				architecture: architectureEval
			},
			summary: {
				totalRules,
				passedRules,
				failedRules,
				errorCount,
				warningCount
			}
		};
	}

	/**
	 * Evaluate testing standards
	 */
	private evaluateTesting(analysis: CodebaseAnalysis): CategoryEvaluation {
		const rules: RuleEvaluation[] = [];
		const coverage = analysis.metrics.testCoverage;

		// Rule: Minimum coverage
		const coveragePassed = coverage.lines >= this.standards.testing.minimumCoverage;
		rules.push({
			ruleId: 'minimum-coverage',
			ruleName: `Minimum ${this.standards.testing.minimumCoverage}% test coverage`,
			passed: coveragePassed,
			actual: coverage.lines,
			expected: this.standards.testing.minimumCoverage,
			message: coveragePassed
				? `Coverage ${coverage.lines}% meets minimum ${this.standards.testing.minimumCoverage}%`
				: `Coverage ${coverage.lines}% below minimum ${this.standards.testing.minimumCoverage}%`,
			severity: 'error'
		});

		// Rule: Unit tests required
		if (this.standards.testing.requireUnitTests) {
			const hasUnitTests = coverage.totalTests > 0;
			rules.push({
				ruleId: 'require-unit-tests',
				ruleName: 'Unit tests required',
				passed: hasUnitTests,
				actual: coverage.totalTests,
				expected: '> 0',
				message: hasUnitTests
					? `${coverage.totalTests} unit tests found`
					: 'No unit tests found',
				severity: 'error'
			});
		}

		// Rule: All tests passing
		const allTestsPassing = coverage.failingTests === 0;
		rules.push({
			ruleId: 'tests-passing',
			ruleName: 'All tests must pass',
			passed: allTestsPassing,
			actual: coverage.failingTests,
			expected: 0,
			message: allTestsPassing
				? `All ${coverage.passingTests} tests passing`
				: `${coverage.failingTests} tests failing`,
			severity: 'error'
		});

		const passedCount = rules.filter((r) => r.passed).length;
		const failedCount = rules.filter((r) => !r.passed).length;

		return {
			category: 'testing',
			passed: failedCount === 0,
			rules,
			passedCount,
			failedCount
		};
	}

	/**
	 * Evaluate type safety standards
	 */
	private evaluateTypeSafety(analysis: CodebaseAnalysis): CategoryEvaluation {
		const rules: RuleEvaluation[] = [];
		const typeSafety = analysis.metrics.typeSafety;

		// Rule: Allow 'any' types
		if (!this.standards.typeSafety.allowAnyTypes) {
			const noAnyTypes = typeSafety.anyTypeCount === 0;
			rules.push({
				ruleId: 'no-any-types',
				ruleName: 'No "any" types allowed',
				passed: noAnyTypes,
				actual: typeSafety.anyTypeCount,
				expected: 0,
				message: noAnyTypes
					? 'No "any" types found'
					: `${typeSafety.anyTypeCount} "any" types found`,
				severity: 'error'
			});
		} else {
			// Warning if too many 'any' types
			const reasonableAnyCount = typeSafety.anyTypeCount <= 20;
			rules.push({
				ruleId: 'any-types-warning',
				ruleName: '"any" types should be minimized',
				passed: reasonableAnyCount,
				actual: typeSafety.anyTypeCount,
				expected: '<= 20',
				message: reasonableAnyCount
					? `${typeSafety.anyTypeCount} "any" types is acceptable`
					: `${typeSafety.anyTypeCount} "any" types - consider reducing`,
				severity: 'warning'
			});
		}

		// Rule: Maximum type errors
		const typeErrorsPassed = typeSafety.typeErrorCount <= this.standards.typeSafety.maxTypeErrors;
		rules.push({
			ruleId: 'max-type-errors',
			ruleName: `Maximum ${this.standards.typeSafety.maxTypeErrors} type errors`,
			passed: typeErrorsPassed,
			actual: typeSafety.typeErrorCount,
			expected: this.standards.typeSafety.maxTypeErrors,
			message: typeErrorsPassed
				? `${typeSafety.typeErrorCount} type errors within limit`
				: `${typeSafety.typeErrorCount} type errors exceeds limit of ${this.standards.typeSafety.maxTypeErrors}`,
			severity: 'error'
		});

		// Rule: Strict mode
		if (this.standards.typeSafety.requireStrictMode) {
			rules.push({
				ruleId: 'strict-mode',
				ruleName: 'TypeScript strict mode required',
				passed: typeSafety.strictMode,
				actual: typeSafety.strictMode,
				expected: true,
				message: typeSafety.strictMode ? 'Strict mode enabled' : 'Strict mode not enabled',
				severity: 'error'
			});
		}

		const passedCount = rules.filter((r) => r.passed).length;
		const failedCount = rules.filter((r) => !r.passed).length;

		return {
			category: 'typeSafety',
			passed: rules.filter((r) => r.severity === 'error' && !r.passed).length === 0,
			rules,
			passedCount,
			failedCount
		};
	}

	/**
	 * Evaluate code quality standards
	 */
	private evaluateCodeQuality(analysis: CodebaseAnalysis): CategoryEvaluation {
		const rules: RuleEvaluation[] = [];
		const quality = analysis.metrics.quality;

		// Rule: Maximum file size
		const fileSizePassed = quality.largestFile.lines <= this.standards.codeQuality.maxFileSize;
		rules.push({
			ruleId: 'max-file-size',
			ruleName: `Maximum ${this.standards.codeQuality.maxFileSize} lines per file`,
			passed: fileSizePassed,
			actual: quality.largestFile.lines,
			expected: this.standards.codeQuality.maxFileSize,
			message: fileSizePassed
				? `Largest file ${quality.largestFile.lines} lines within limit`
				: `File ${quality.largestFile.path} has ${quality.largestFile.lines} lines (max ${this.standards.codeQuality.maxFileSize})`,
			severity: 'warning'
		});

		// Rule: TODO comments
		if (!this.standards.codeQuality.allowTodoComments) {
			const noTodos = quality.todoCount === 0;
			rules.push({
				ruleId: 'no-todos',
				ruleName: 'TODO comments not allowed',
				passed: noTodos,
				actual: quality.todoCount,
				expected: 0,
				message: noTodos ? 'No TODO comments' : `${quality.todoCount} TODO comments found`,
				severity: 'error'
			});
		} else {
			const todosWithinLimit = quality.todoCount <= this.standards.codeQuality.maxTodoCount;
			rules.push({
				ruleId: 'max-todos',
				ruleName: `Maximum ${this.standards.codeQuality.maxTodoCount} TODO comments`,
				passed: todosWithinLimit,
				actual: quality.todoCount,
				expected: this.standards.codeQuality.maxTodoCount,
				message: todosWithinLimit
					? `${quality.todoCount} TODO comments within limit`
					: `${quality.todoCount} TODO comments exceeds limit of ${this.standards.codeQuality.maxTodoCount}`,
				severity: 'warning'
			});
		}

		const passedCount = rules.filter((r) => r.passed).length;
		const failedCount = rules.filter((r) => !r.passed).length;

		return {
			category: 'codeQuality',
			passed: rules.filter((r) => r.severity === 'error' && !r.passed).length === 0,
			rules,
			passedCount,
			failedCount
		};
	}

	/**
	 * Evaluate architecture standards
	 */
	private evaluateArchitecture(analysis: CodebaseAnalysis): CategoryEvaluation {
		const rules: RuleEvaluation[] = [];

		// Rule: Enforce file structure
		if (this.standards.architecture.enforceFileStructure) {
			const hasGoodStructure = analysis.structure.totalDirectories > 3; // Basic check
			rules.push({
				ruleId: 'enforce-structure',
				ruleName: 'File structure must be organized',
				passed: hasGoodStructure,
				actual: analysis.structure.totalDirectories,
				expected: '> 3 directories',
				message: hasGoodStructure
					? 'File structure is organized'
					: 'File structure needs organization',
				severity: 'warning'
			});
		}

		// Rule: Forbidden patterns
		if (this.standards.architecture.forbiddenPatterns.length > 0) {
			const hasForbiddenFiles = analysis.structure.files.some((file) =>
				this.standards.architecture.forbiddenPatterns.some((pattern) =>
					file.relativePath.includes(pattern.replace(/\*/g, ''))
				)
			);

			rules.push({
				ruleId: 'no-forbidden-patterns',
				ruleName: 'No forbidden file patterns',
				passed: !hasForbiddenFiles,
				actual: hasForbiddenFiles,
				expected: false,
				message: hasForbiddenFiles
					? 'Forbidden file patterns detected'
					: 'No forbidden patterns found',
				severity: 'error'
			});
		}

		const passedCount = rules.filter((r) => r.passed).length;
		const failedCount = rules.filter((r) => !r.passed).length;

		return {
			category: 'architecture',
			passed: rules.filter((r) => r.severity === 'error' && !r.passed).length === 0,
			rules,
			passedCount,
			failedCount
		};
	}

	/**
	 * Generate quality gates based on configured standards
	 */
	generateGates(): QualityGate[] {
		const gates: QualityGate[] = [];

		// Phase 1: Setup & Planning
		gates.push({
			id: 'gate-phase-1',
			name: 'Phase 1: Setup & Planning',
			description: 'Initial setup and refactoring plan approval',
			phase: 1,
			checks: [
				{
					id: 'plan-approved',
					name: 'Refactoring plan approved',
					description: 'User has reviewed and approved the generated plan',
					threshold: true,
					autoVerify: false
				},
				{
					id: 'git-clean',
					name: 'Git working directory clean',
					description: 'No uncommitted changes in repository',
					threshold: true,
					command: 'git status --porcelain',
					autoVerify: true
				}
			],
			required: true
		});

		// Phase 2: Testing
		gates.push({
			id: 'gate-phase-2',
			name: 'Phase 2: Test Coverage',
			description: `Achieve ${this.standards.testing.minimumCoverage}% test coverage`,
			phase: 2,
			checks: [
				{
					id: 'minimum-coverage',
					name: `Coverage ≥ ${this.standards.testing.minimumCoverage}%`,
					description: `Test coverage meets user-configured threshold of ${this.standards.testing.minimumCoverage}%`,
					threshold: this.standards.testing.minimumCoverage,
					command: 'pnpm test:coverage',
					autoVerify: true
				},
				{
					id: 'tests-passing',
					name: 'All tests passing',
					description: 'No failing tests',
					threshold: 0,
					command: 'pnpm test',
					autoVerify: true
				}
			],
			required: true
		});

		// Phase 3: Type Safety
		gates.push({
			id: 'gate-phase-3',
			name: 'Phase 3: Type Safety',
			description: `Type errors ≤ ${this.standards.typeSafety.maxTypeErrors}`,
			phase: 3,
			checks: [
				{
					id: 'max-type-errors',
					name: `Type errors ≤ ${this.standards.typeSafety.maxTypeErrors}`,
					description: `Type error count meets user-configured threshold`,
					threshold: this.standards.typeSafety.maxTypeErrors,
					command: 'pnpm check',
					autoVerify: true
				}
			],
			required: true
		});

		// Phase 4: Code Quality
		gates.push({
			id: 'gate-phase-4',
			name: 'Phase 4: Code Quality',
			description: 'Code quality standards met',
			phase: 4,
			checks: [
				{
					id: 'build-succeeds',
					name: 'Production build succeeds',
					description: 'Code builds without errors',
					threshold: true,
					command: 'pnpm build',
					autoVerify: true
				}
			],
			required: false // Quality is important but not blocking
		});

		return gates;
	}

	/**
	 * Verify a quality gate
	 */
	async verifyGate(gate: QualityGate, analysis: CodebaseAnalysis): Promise<GateVerificationResult> {
		const checkResults = [];

		for (const check of gate.checks) {
			let passed = false;
			let actual: number | boolean | string = '';

			if (check.id === 'minimum-coverage') {
				actual = analysis.metrics.testCoverage.lines;
				passed = actual >= (check.threshold as number);
			} else if (check.id === 'tests-passing') {
				actual = analysis.metrics.testCoverage.failingTests;
				passed = actual === 0;
			} else if (check.id === 'max-type-errors') {
				actual = analysis.metrics.typeSafety.typeErrorCount;
				passed = actual <= (check.threshold as number);
			}

			checkResults.push({
				checkId: check.id,
				passed,
				actual,
				message: passed
					? `✓ ${check.name}: ${actual}`
					: `✗ ${check.name}: ${actual} (expected ${check.threshold})`
			});
		}

		const allPassed = checkResults.every((r) => r.passed);

		return {
			gateId: gate.id,
			verifiedAt: new Date().toISOString(),
			passed: allPassed,
			checks: checkResults
		};
	}

	/**
	 * Get current standards
	 */
	getStandards(): QualityStandards {
		return { ...this.standards };
	}

	/**
	 * Update standards (creates new engine)
	 */
	static withStandards(standards: QualityStandards): StandardsEngine {
		return new StandardsEngine(standards);
	}
}
