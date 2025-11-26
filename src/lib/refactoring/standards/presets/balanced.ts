/**
 * Balanced Quality Standards Preset
 *
 * For most production applications requiring good quality.
 * - 80% test coverage
 * - Minimal 'any' types
 * - TypeScript strict mode
 * - Limited TODO comments
 */

import type { QualityStandards } from '../../types/standards';

export const balancedStandards: QualityStandards = {
	id: 'preset-balanced',
	name: 'Balanced',
	description:
		'80% coverage, pragmatic quality. Recommended for most production applications.',
	preset: 'balanced',
	isDefault: true, // Default preset
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),

	testing: {
		minimumCoverage: 80,
		requireUnitTests: true,
		requireComponentTests: true,
		requireE2ETests: false // Optional for balanced
	},

	typeSafety: {
		allowAnyTypes: false, // Discouraged but not blocked
		maxTypeErrors: 5, // Minimal acceptable errors
		requireStrictMode: true,
		allowImplicitAny: false
	},

	codeQuality: {
		maxFileSize: 400, // Lines per file
		maxFunctionLength: 75, // Lines per function
		maxComplexity: 15, // Cyclomatic complexity
		requireDocstrings: false, // Recommended but not required
		allowTodoComments: true,
		maxTodoCount: 20 // Reasonable limit
	},

	architecture: {
		enforceFileStructure: true,
		requireIndexFiles: true,
		maxImportDepth: 4,
		forbiddenPatterns: ['**/temp/**', '**/scratch/**'],
		requiredPatterns: [
			'src/lib/*/index.ts' // Major directories need index exports
		]
	}
};
