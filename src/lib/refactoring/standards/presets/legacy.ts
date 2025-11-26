/**
 * Legacy Quality Standards Preset
 *
 * For maintaining older codebases - realistic expectations.
 * - 40% test coverage (start somewhere!)
 * - 'any' types tolerated
 * - TypeScript in relaxed mode
 * - TODO comments are reality of legacy code
 */

import type { QualityStandards } from '../../types/standards';

export const legacyStandards: QualityStandards = {
	id: 'preset-legacy',
	name: 'Legacy',
	description: '40% coverage, incremental improvement. Realistic standards for legacy codebases.',
	preset: 'legacy',
	isDefault: false,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),

	testing: {
		minimumCoverage: 40, // Start somewhere
		requireUnitTests: false, // Add gradually
		requireComponentTests: false,
		requireE2ETests: false
	},

	typeSafety: {
		allowAnyTypes: true, // Accept reality of legacy code
		maxTypeErrors: 50, // Work down gradually
		requireStrictMode: false,
		allowImplicitAny: true
	},

	codeQuality: {
		maxFileSize: 800, // Legacy files are often large
		maxFunctionLength: 150, // Legacy functions are often long
		maxComplexity: 30, // Higher complexity in legacy code
		requireDocstrings: false,
		allowTodoComments: true,
		maxTodoCount: 100 // Legacy code has many TODOs
	},

	architecture: {
		enforceFileStructure: false, // Don't force restructure
		requireIndexFiles: false,
		maxImportDepth: 8, // Deep imports common in legacy
		forbiddenPatterns: [], // No restrictions
		requiredPatterns: [] // No requirements
	}
};
