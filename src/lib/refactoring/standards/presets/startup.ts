/**
 * Startup Quality Standards Preset
 *
 * For early-stage projects prioritizing speed over perfection.
 * - 60% test coverage
 * - Some 'any' types acceptable
 * - TypeScript with relaxed settings
 * - TODO comments allowed
 */

import type { QualityStandards } from '../../types/standards';

export const startupStandards: QualityStandards = {
	id: 'preset-startup',
	name: 'Startup',
	description:
		'60% coverage, move fast. Acceptable quality for early-stage rapid development.',
	preset: 'startup',
	isDefault: false,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),

	testing: {
		minimumCoverage: 60,
		requireUnitTests: true,
		requireComponentTests: false, // Optional
		requireE2ETests: false // Optional
	},

	typeSafety: {
		allowAnyTypes: true, // Acceptable for rapid prototyping
		maxTypeErrors: 20, // More tolerance
		requireStrictMode: false, // Relaxed for speed
		allowImplicitAny: true // Acceptable
	},

	codeQuality: {
		maxFileSize: 500, // Lines per file - more relaxed
		maxFunctionLength: 100, // Lines per function
		maxComplexity: 20, // Cyclomatic complexity
		requireDocstrings: false,
		allowTodoComments: true,
		maxTodoCount: 50 // More TODOs acceptable
	},

	architecture: {
		enforceFileStructure: false, // Flexible structure
		requireIndexFiles: false, // Not required
		maxImportDepth: 5,
		forbiddenPatterns: [], // No forbidden patterns
		requiredPatterns: [] // No required patterns
	}
};
