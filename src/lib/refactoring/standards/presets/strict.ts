/**
 * Strict Quality Standards Preset
 *
 * For production-critical codebases requiring maximum quality.
 * - 100% test coverage
 * - Zero 'any' types
 * - Strict TypeScript mode
 * - No TODO comments in production code
 */

import type { QualityStandards } from '../../types/standards';

export const strictStandards: QualityStandards = {
	id: 'preset-strict',
	name: 'Strict',
	description: '100% coverage, zero compromises. Production-critical quality standards.',
	preset: 'strict',
	isDefault: false,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),

	testing: {
		minimumCoverage: 100,
		requireUnitTests: true,
		requireComponentTests: true,
		requireE2ETests: true
	},

	typeSafety: {
		allowAnyTypes: false,
		maxTypeErrors: 0,
		requireStrictMode: true,
		allowImplicitAny: false
	},

	codeQuality: {
		maxFileSize: 300, // Lines per file
		maxFunctionLength: 50, // Lines per function
		maxComplexity: 10, // Cyclomatic complexity
		requireDocstrings: true,
		allowTodoComments: false,
		maxTodoCount: 0
	},

	architecture: {
		enforceFileStructure: true,
		requireIndexFiles: true,
		maxImportDepth: 3,
		forbiddenPatterns: [
			'**/*.test.ts', // Tests should be in __tests__/
			'**/temp/**',
			'**/scratch/**'
		],
		requiredPatterns: ['src/lib/*/index.ts' // All directories need index exports
		]
	}
};
