/**
 * Quality Standards Presets Tests
 *
 * Tests for all preset quality standards configurations.
 */

import { describe, it, expect } from 'vitest';
import {
	strictStandards,
	balancedStandards,
	startupStandards,
	legacyStandards,
	allPresets,
	getPresetById,
	getPresetByName,
	getDefaultPreset,
	isValidPreset
} from '../presets';

describe('Quality Standards Presets', () => {
	describe('Strict Preset', () => {
		it('should require 100% coverage', () => {
			expect(strictStandards.testing.minimumCoverage).toBe(100);
		});

		it('should not allow any types', () => {
			expect(strictStandards.typeSafety.allowAnyTypes).toBe(false);
		});

		it('should require zero type errors', () => {
			expect(strictStandards.typeSafety.maxTypeErrors).toBe(0);
		});

		it('should not allow TODO comments', () => {
			expect(strictStandards.codeQuality.allowTodoComments).toBe(false);
			expect(strictStandards.codeQuality.maxTodoCount).toBe(0);
		});

		it('should require strict TypeScript mode', () => {
			expect(strictStandards.typeSafety.requireStrictMode).toBe(true);
		});

		it('should have strict preset type', () => {
			expect(strictStandards.preset).toBe('strict');
		});

		it('should not be default', () => {
			expect(strictStandards.isDefault).toBe(false);
		});

		it('should require all test types', () => {
			expect(strictStandards.testing.requireUnitTests).toBe(true);
			expect(strictStandards.testing.requireComponentTests).toBe(true);
			expect(strictStandards.testing.requireE2ETests).toBe(true);
		});
	});

	describe('Balanced Preset', () => {
		it('should require 80% coverage', () => {
			expect(balancedStandards.testing.minimumCoverage).toBe(80);
		});

		it('should discourage but not forbid any types', () => {
			expect(balancedStandards.typeSafety.allowAnyTypes).toBe(false);
		});

		it('should allow minimal type errors', () => {
			expect(balancedStandards.typeSafety.maxTypeErrors).toBe(5);
		});

		it('should allow limited TODO comments', () => {
			expect(balancedStandards.codeQuality.allowTodoComments).toBe(true);
			expect(balancedStandards.codeQuality.maxTodoCount).toBe(20);
		});

		it('should require strict TypeScript mode', () => {
			expect(balancedStandards.typeSafety.requireStrictMode).toBe(true);
		});

		it('should have balanced preset type', () => {
			expect(balancedStandards.preset).toBe('balanced');
		});

		it('should be default preset', () => {
			expect(balancedStandards.isDefault).toBe(true);
		});
	});

	describe('Startup Preset', () => {
		it('should require 60% coverage', () => {
			expect(startupStandards.testing.minimumCoverage).toBe(60);
		});

		it('should allow any types', () => {
			expect(startupStandards.typeSafety.allowAnyTypes).toBe(true);
		});

		it('should allow more type errors', () => {
			expect(startupStandards.typeSafety.maxTypeErrors).toBe(20);
		});

		it('should allow many TODO comments', () => {
			expect(startupStandards.codeQuality.allowTodoComments).toBe(true);
			expect(startupStandards.codeQuality.maxTodoCount).toBe(50);
		});

		it('should not require strict mode', () => {
			expect(startupStandards.typeSafety.requireStrictMode).toBe(false);
		});

		it('should have startup preset type', () => {
			expect(startupStandards.preset).toBe('startup');
		});

		it('should not be default', () => {
			expect(startupStandards.isDefault).toBe(false);
		});
	});

	describe('Legacy Preset', () => {
		it('should require only 40% coverage', () => {
			expect(legacyStandards.testing.minimumCoverage).toBe(40);
		});

		it('should allow any types', () => {
			expect(legacyStandards.typeSafety.allowAnyTypes).toBe(true);
		});

		it('should allow many type errors', () => {
			expect(legacyStandards.typeSafety.maxTypeErrors).toBe(50);
		});

		it('should allow many TODO comments', () => {
			expect(legacyStandards.codeQuality.allowTodoComments).toBe(true);
			expect(legacyStandards.codeQuality.maxTodoCount).toBe(100);
		});

		it('should not require strict mode', () => {
			expect(legacyStandards.typeSafety.requireStrictMode).toBe(false);
		});

		it('should have legacy preset type', () => {
			expect(legacyStandards.preset).toBe('legacy');
		});

		it('should not be default', () => {
			expect(legacyStandards.isDefault).toBe(false);
		});
	});

	describe('All Presets Array', () => {
		it('should contain all 4 presets', () => {
			expect(allPresets).toHaveLength(4);
		});

		it('should have balanced preset first (default)', () => {
			expect(allPresets[0]).toBe(balancedStandards);
		});

		it('should contain all presets', () => {
			expect(allPresets).toContain(strictStandards);
			expect(allPresets).toContain(balancedStandards);
			expect(allPresets).toContain(startupStandards);
			expect(allPresets).toContain(legacyStandards);
		});
	});

	describe('getPresetById', () => {
		it('should return preset by ID', () => {
			expect(getPresetById('preset-strict')).toBe(strictStandards);
			expect(getPresetById('preset-balanced')).toBe(balancedStandards);
			expect(getPresetById('preset-startup')).toBe(startupStandards);
			expect(getPresetById('preset-legacy')).toBe(legacyStandards);
		});

		it('should return undefined for invalid ID', () => {
			expect(getPresetById('invalid-id')).toBeUndefined();
		});
	});

	describe('getPresetByName', () => {
		it('should return preset by name (case-insensitive)', () => {
			expect(getPresetByName('Strict')).toBe(strictStandards);
			expect(getPresetByName('strict')).toBe(strictStandards);
			expect(getPresetByName('STRICT')).toBe(strictStandards);
			expect(getPresetByName('Balanced')).toBe(balancedStandards);
			expect(getPresetByName('Startup')).toBe(startupStandards);
			expect(getPresetByName('Legacy')).toBe(legacyStandards);
		});

		it('should return undefined for invalid name', () => {
			expect(getPresetByName('Invalid')).toBeUndefined();
		});
	});

	describe('getDefaultPreset', () => {
		it('should return balanced preset', () => {
			expect(getDefaultPreset()).toBe(balancedStandards);
		});
	});

	describe('isValidPreset', () => {
		it('should return true for valid preset IDs', () => {
			expect(isValidPreset('preset-strict')).toBe(true);
			expect(isValidPreset('preset-balanced')).toBe(true);
			expect(isValidPreset('preset-startup')).toBe(true);
			expect(isValidPreset('preset-legacy')).toBe(true);
		});

		it('should return false for invalid preset ID', () => {
			expect(isValidPreset('invalid-preset')).toBe(false);
			expect(isValidPreset('')).toBe(false);
		});
	});

	describe('Coverage Progression', () => {
		it('should have decreasing coverage requirements from strict to legacy', () => {
			expect(strictStandards.testing.minimumCoverage).toBeGreaterThan(
				balancedStandards.testing.minimumCoverage
			);
			expect(balancedStandards.testing.minimumCoverage).toBeGreaterThan(
				startupStandards.testing.minimumCoverage
			);
			expect(startupStandards.testing.minimumCoverage).toBeGreaterThan(
				legacyStandards.testing.minimumCoverage
			);
		});
	});

	describe('Type Error Tolerance', () => {
		it('should have increasing type error tolerance from strict to legacy', () => {
			expect(strictStandards.typeSafety.maxTypeErrors).toBeLessThan(
				balancedStandards.typeSafety.maxTypeErrors
			);
			expect(balancedStandards.typeSafety.maxTypeErrors).toBeLessThan(
				startupStandards.typeSafety.maxTypeErrors
			);
			expect(startupStandards.typeSafety.maxTypeErrors).toBeLessThan(
				legacyStandards.typeSafety.maxTypeErrors
			);
		});
	});

	describe('TODO Tolerance', () => {
		it('should have increasing TODO tolerance from strict to legacy', () => {
			expect(strictStandards.codeQuality.maxTodoCount).toBeLessThan(
				balancedStandards.codeQuality.maxTodoCount
			);
			expect(balancedStandards.codeQuality.maxTodoCount).toBeLessThan(
				startupStandards.codeQuality.maxTodoCount
			);
			expect(startupStandards.codeQuality.maxTodoCount).toBeLessThan(
				legacyStandards.codeQuality.maxTodoCount
			);
		});
	});
});
