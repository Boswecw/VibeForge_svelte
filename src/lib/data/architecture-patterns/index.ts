/**
 * Architecture Patterns Registry
 *
 * Central registry for all available architecture patterns.
 * Provides discovery and filtering functions for the wizard.
 */

import type {
	ArchitecturePattern,
	ArchitectureCategory
} from '$lib/workbench/types/architecture';
import { cliToolPattern } from './cli-tool';
import { desktopAppPattern } from './desktop-app';
import { fullstackWebPattern } from './fullstack-web';
import { microservicesPattern } from './microservices';
import { restApiBackendPattern } from './rest-api-backend';
import { staticSitePattern } from './static-site';
import { spaPattern } from './spa';

// ============================================================================
// PATTERN REGISTRY
// ============================================================================

/**
 * All available architecture patterns
 *
 * @example
 * ```typescript
 * const pattern = ARCHITECTURE_PATTERNS['desktop-app'];
 * ```
 */
export const ARCHITECTURE_PATTERNS = {
	'cli-tool': cliToolPattern,
	'desktop-app': desktopAppPattern,
	'fullstack-web': fullstackWebPattern,
	'microservices': microservicesPattern,
	'rest-api-backend': restApiBackendPattern,
	'static-site': staticSitePattern,
	'spa': spaPattern
} as const;

/**
 * Type-safe pattern IDs
 */
export type ArchitecturePatternId = keyof typeof ARCHITECTURE_PATTERNS;

// ============================================================================
// DISCOVERY FUNCTIONS
// ============================================================================

/**
 * Get a pattern by ID
 *
 * @param id - Pattern identifier
 * @returns Pattern if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const pattern = getPattern('desktop-app');
 * if (pattern) {
 *   console.log(pattern.displayName); // "Desktop Application"
 * }
 * ```
 */
export function getPattern(id: string): ArchitecturePattern | undefined {
	return ARCHITECTURE_PATTERNS[id as ArchitecturePatternId];
}

/**
 * Get all available patterns
 *
 * @returns Array of all patterns
 *
 * @example
 * ```typescript
 * const patterns = getAllPatterns();
 * patterns.forEach(p => console.log(p.displayName));
 * ```
 */
export function getAllPatterns(): ArchitecturePattern[] {
	return Object.values(ARCHITECTURE_PATTERNS);
}

/**
 * Get patterns by category
 *
 * @param category - Architecture category to filter by
 * @returns Patterns matching the category
 *
 * @example
 * ```typescript
 * const webPatterns = getPatternsByCategory('web');
 * const desktopPatterns = getPatternsByCategory('desktop');
 * ```
 */
export function getPatternsByCategory(category: ArchitectureCategory): ArchitecturePattern[] {
	return getAllPatterns().filter((p) => p.category === category);
}

/**
 * Get patterns matching complexity level
 *
 * @param complexity - Desired complexity level
 * @returns Patterns matching the complexity
 *
 * @example
 * ```typescript
 * const beginnerPatterns = getPatternsByComplexity('simple');
 * const advancedPatterns = getPatternsByComplexity('complex');
 * ```
 */
export function getPatternsByComplexity(
	complexity: 'simple' | 'intermediate' | 'complex' | 'enterprise'
): ArchitecturePattern[] {
	return getAllPatterns().filter((p) => p.complexity === complexity);
}

/**
 * Get most popular patterns
 *
 * @param limit - Maximum number of patterns to return (default: 5)
 * @returns Top patterns sorted by popularity
 *
 * @example
 * ```typescript
 * const topPatterns = getPopularPatterns(3);
 * // Returns 3 most popular patterns
 * ```
 */
export function getPopularPatterns(limit = 5): ArchitecturePattern[] {
	return getAllPatterns()
		.sort((a, b) => b.popularity - a.popularity)
		.slice(0, limit);
}

/**
 * Search patterns by use case
 *
 * @param query - Search query (matches against idealFor and notIdealFor)
 * @returns Patterns matching the use case
 *
 * @example
 * ```typescript
 * const patterns = searchPatternsByUseCase('desktop');
 * // Returns patterns ideal for desktop applications
 * ```
 */
export function searchPatternsByUseCase(query: string): ArchitecturePattern[] {
	const lowerQuery = query.toLowerCase();

	return getAllPatterns().filter((pattern) => {
		// Check if query matches any ideal use case
		const matchesIdeal = pattern.idealFor.some((useCase) =>
			useCase.toLowerCase().includes(lowerQuery)
		);

		// Exclude if query matches any non-ideal use case
		const matchesNotIdeal = pattern.notIdealFor.some((useCase) =>
			useCase.toLowerCase().includes(lowerQuery)
		);

		return matchesIdeal && !matchesNotIdeal;
	});
}

/**
 * Get patterns requiring specific tools
 *
 * @param tools - Tools the user has available
 * @returns Patterns compatible with available tools
 *
 * @example
 * ```typescript
 * const rustPatterns = getPatternsByTools(['Rust', 'cargo']);
 * ```
 */
export function getPatternsByTools(tools: string[]): ArchitecturePattern[] {
	const lowerTools = tools.map((t) => t.toLowerCase());

	return getAllPatterns().filter((pattern) => {
		// Check if all required tools are available
		return pattern.prerequisites.tools.every((requiredTool) =>
			lowerTools.some((availableTool) => requiredTool.toLowerCase().includes(availableTool))
		);
	});
}

/**
 * Get recommended patterns based on project characteristics
 *
 * @param criteria - Project criteria for recommendations
 * @returns Recommended patterns with scores
 *
 * @example
 * ```typescript
 * const recommendations = getRecommendedPatterns({
 *   category: 'web',
 *   complexity: 'intermediate',
 *   useCase: 'SaaS application'
 * });
 * ```
 */
export function getRecommendedPatterns(criteria: {
	category?: ArchitectureCategory;
	complexity?: 'simple' | 'intermediate' | 'complex' | 'enterprise';
	useCase?: string;
}): Array<{ pattern: ArchitecturePattern; score: number }> {
	const patterns = getAllPatterns();
	const scored = patterns.map((pattern) => {
		let score = pattern.popularity; // Base score from popularity

		// Boost score for category match
		if (criteria.category && pattern.category === criteria.category) {
			score += 30;
		}

		// Boost score for complexity match
		if (criteria.complexity && pattern.complexity === criteria.complexity) {
			score += 20;
		}

		// Boost score for use case match
		if (criteria.useCase) {
			const lowerUseCase = criteria.useCase.toLowerCase();
			const matchesIdeal = pattern.idealFor.some((useCase) =>
				useCase.toLowerCase().includes(lowerUseCase)
			);
			const matchesNotIdeal = pattern.notIdealFor.some((useCase) =>
				useCase.toLowerCase().includes(lowerUseCase)
			);

			if (matchesIdeal) score += 40;
			if (matchesNotIdeal) score -= 50;
		}

		return { pattern, score };
	});

	// Sort by score descending
	return scored.sort((a, b) => b.score - a.score);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate a pattern has all required fields
 *
 * @param pattern - Pattern to validate
 * @returns Validation errors (empty array if valid)
 *
 * @example
 * ```typescript
 * const errors = validatePattern(desktopAppPattern);
 * if (errors.length > 0) {
 *   console.error('Pattern invalid:', errors);
 * }
 * ```
 */
export function validatePattern(pattern: ArchitecturePattern): string[] {
	const errors: string[] = [];

	// Required fields
	if (!pattern.id) errors.push('Missing id');
	if (!pattern.name) errors.push('Missing name');
	if (!pattern.displayName) errors.push('Missing displayName');
	if (!pattern.components || pattern.components.length === 0) {
		errors.push('Must have at least one component');
	}

	// Validate component dependencies reference real components
	pattern.components.forEach((component) => {
		component.dependencies.forEach((dep) => {
			const exists = pattern.components.some((c) => c.id === dep.componentId);
			if (!exists) {
				errors.push(`Component ${component.id} depends on non-existent ${dep.componentId}`);
			}
		});
	});

	return errors;
}

/**
 * Validate all patterns in the registry
 *
 * @returns Map of pattern IDs to their validation errors
 *
 * @example
 * ```typescript
 * const validation = validateAllPatterns();
 * Object.entries(validation).forEach(([id, errors]) => {
 *   if (errors.length > 0) {
 *     console.error(`Pattern ${id}:`, errors);
 *   }
 * });
 * ```
 */
export function validateAllPatterns(): Record<string, string[]> {
	const results: Record<string, string[]> = {};

	getAllPatterns().forEach((pattern) => {
		results[pattern.id] = validatePattern(pattern);
	});

	return results;
}
