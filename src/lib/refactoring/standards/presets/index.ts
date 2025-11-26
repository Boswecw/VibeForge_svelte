/**
 * Quality Standards Presets Barrel Export
 *
 * Four preset quality standards for different use cases:
 * - Strict: 100% coverage, production-critical
 * - Balanced: 80% coverage, recommended default
 * - Startup: 60% coverage, rapid development
 * - Legacy: 40% coverage, incremental improvement
 */

export { strictStandards } from './strict';
export { balancedStandards } from './balanced';
export { startupStandards } from './startup';
export { legacyStandards } from './legacy';

import type { QualityStandards } from '../../types/standards';
import { strictStandards } from './strict';
import { balancedStandards } from './balanced';
import { startupStandards } from './startup';
import { legacyStandards } from './legacy';

/**
 * All preset standards in an array
 */
export const allPresets: QualityStandards[] = [
	balancedStandards, // Default first
	strictStandards,
	startupStandards,
	legacyStandards
];

/**
 * Get preset by ID
 */
export function getPresetById(id: string): QualityStandards | undefined {
	return allPresets.find((preset) => preset.id === id);
}

/**
 * Get preset by name
 */
export function getPresetByName(name: string): QualityStandards | undefined {
	return allPresets.find((preset) => preset.name.toLowerCase() === name.toLowerCase());
}

/**
 * Get default preset (Balanced)
 */
export function getDefaultPreset(): QualityStandards {
	return balancedStandards;
}

/**
 * Check if a preset ID is valid
 */
export function isValidPreset(id: string): boolean {
	return allPresets.some((preset) => preset.id === id);
}
