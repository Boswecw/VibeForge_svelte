/**
 * Quality Standards Type Definitions
 *
 * Defines user-configurable quality standards for code refactoring.
 * Standards are NOT hardcoded - users choose their thresholds.
 */

export type QualityPreset = 'strict' | 'balanced' | 'startup' | 'legacy' | 'custom';

export interface TestingStandards {
	minimumCoverage: number; // User's choice: 40, 60, 80, or 100
	requireUnitTests: boolean;
	requireComponentTests: boolean;
	requireE2ETests: boolean;
}

export interface TypeSafetyStandards {
	allowAnyTypes: boolean; // User's choice
	maxTypeErrors: number;
	requireStrictMode: boolean;
	allowImplicitAny: boolean;
}

export interface CodeQualityStandards {
	maxFileSize: number; // Lines per file
	maxFunctionLength: number; // Lines per function
	maxComplexity: number; // Cyclomatic complexity
	requireDocstrings: boolean;
	allowTodoComments: boolean;
	maxTodoCount: number;
}

export interface ArchitectureStandards {
	enforceFileStructure: boolean;
	requireIndexFiles: boolean;
	maxImportDepth: number;
	forbiddenPatterns: string[];
	requiredPatterns: string[];
}

export interface QualityStandards {
	id: string;
	name: string;
	description: string;
	preset: QualityPreset;
	isDefault: boolean;
	createdAt: string;
	updatedAt: string;

	testing: TestingStandards;
	typeSafety: TypeSafetyStandards;
	codeQuality: CodeQualityStandards;
	architecture: ArchitectureStandards;
}

export interface RuleEvaluation {
	ruleId: string;
	ruleName: string;
	passed: boolean;
	actual: number | boolean | string;
	expected: number | boolean | string;
	message: string;
	severity: 'error' | 'warning' | 'info';
}

export interface CategoryEvaluation {
	category: string;
	passed: boolean;
	rules: RuleEvaluation[];
	passedCount: number;
	failedCount: number;
}

export interface StandardsEvaluation {
	standardsId: string;
	evaluatedAt: string;
	passed: boolean;
	categories: {
		testing: CategoryEvaluation;
		typeSafety: CategoryEvaluation;
		codeQuality: CategoryEvaluation;
		architecture: CategoryEvaluation;
	};
	summary: {
		totalRules: number;
		passedRules: number;
		failedRules: number;
		warningCount: number;
		errorCount: number;
	};
}

export interface QualityGateCheck {
	id: string;
	name: string;
	description: string;
	threshold: number | boolean | string;
	command?: string; // Optional command to verify
	autoVerify: boolean; // Can be checked automatically
}

export interface QualityGate {
	id: string;
	name: string;
	description: string;
	phase: number;
	checks: QualityGateCheck[];
	required: boolean; // Block progression if failed
}

export interface GateVerificationResult {
	gateId: string;
	verifiedAt: string;
	passed: boolean;
	checks: {
		checkId: string;
		passed: boolean;
		actual: number | boolean | string;
		message: string;
	}[];
}
