/**
 * Architecture Patterns Test Suite
 *
 * Validates pattern definitions, dependencies, and registry functions.
 */

import { describe, it, expect } from 'vitest';
import {
	ARCHITECTURE_PATTERNS,
	getPattern,
	getAllPatterns,
	getPatternsByCategory,
	getPatternsByComplexity,
	getPopularPatterns,
	searchPatternsByUseCase,
	getPatternsByTools,
	getRecommendedPatterns,
	validatePattern,
	validateAllPatterns
} from '../index';
import { desktopAppPattern } from '../desktop-app';
import { fullstackWebPattern } from '../fullstack-web';

describe('Architecture Patterns', () => {
	describe('Pattern Registry', () => {
		it('should export all patterns', () => {
			expect(ARCHITECTURE_PATTERNS).toBeDefined();
			expect(Object.keys(ARCHITECTURE_PATTERNS).length).toBeGreaterThan(0);
		});

		it('should include desktop-app pattern', () => {
			expect(ARCHITECTURE_PATTERNS['desktop-app']).toBeDefined();
			expect(ARCHITECTURE_PATTERNS['desktop-app']).toBe(desktopAppPattern);
		});

		it('should include fullstack-web pattern', () => {
			expect(ARCHITECTURE_PATTERNS['fullstack-web']).toBeDefined();
			expect(ARCHITECTURE_PATTERNS['fullstack-web']).toBe(fullstackWebPattern);
		});
	});

	describe('getPattern()', () => {
		it('should return pattern by ID', () => {
			const pattern = getPattern('desktop-app');
			expect(pattern).toBeDefined();
			expect(pattern?.id).toBe('desktop-app');
		});

		it('should return undefined for invalid ID', () => {
			const pattern = getPattern('nonexistent');
			expect(pattern).toBeUndefined();
		});
	});

	describe('getAllPatterns()', () => {
		it('should return all patterns as array', () => {
			const patterns = getAllPatterns();
			expect(Array.isArray(patterns)).toBe(true);
			expect(patterns.length).toBeGreaterThan(0);
		});

		it('should include all registered patterns', () => {
			const patterns = getAllPatterns();
			expect(patterns).toContain(desktopAppPattern);
			expect(patterns).toContain(fullstackWebPattern);
		});
	});

	describe('getPatternsByCategory()', () => {
		it('should filter patterns by category', () => {
			const desktopPatterns = getPatternsByCategory('desktop');
			expect(desktopPatterns.every((p) => p.category === 'desktop')).toBe(true);
		});

		it('should return web patterns', () => {
			const webPatterns = getPatternsByCategory('web');
			expect(webPatterns.every((p) => p.category === 'web')).toBe(true);
			expect(webPatterns).toContain(fullstackWebPattern);
		});

		it('should return empty array for non-existent category', () => {
			const patterns = getPatternsByCategory('nonexistent' as any);
			expect(patterns).toEqual([]);
		});
	});

	describe('getPatternsByComplexity()', () => {
		it('should filter patterns by complexity', () => {
			const intermediatePatterns = getPatternsByComplexity('intermediate');
			expect(intermediatePatterns.every((p) => p.complexity === 'intermediate')).toBe(true);
		});

		it('should handle simple complexity', () => {
			const simplePatterns = getPatternsByComplexity('simple');
			expect(Array.isArray(simplePatterns)).toBe(true);
		});
	});

	describe('getPopularPatterns()', () => {
		it('should return top patterns by popularity', () => {
			const topPatterns = getPopularPatterns(2);
			expect(topPatterns.length).toBeLessThanOrEqual(2);

			// Verify sorted by popularity descending
			for (let i = 0; i < topPatterns.length - 1; i++) {
				expect(topPatterns[i].popularity).toBeGreaterThanOrEqual(topPatterns[i + 1].popularity);
			}
		});

		it('should default to limit of 5', () => {
			const topPatterns = getPopularPatterns();
			expect(topPatterns.length).toBeLessThanOrEqual(5);
		});
	});

	describe('searchPatternsByUseCase()', () => {
		it('should find patterns by use case keyword', () => {
			const desktopPatterns = searchPatternsByUseCase('desktop');
			expect(desktopPatterns.length).toBeGreaterThan(0);
		});

		it('should be case insensitive', () => {
			const upper = searchPatternsByUseCase('DESKTOP');
			const lower = searchPatternsByUseCase('desktop');
			expect(upper.length).toBe(lower.length);
		});

		it('should exclude patterns where use case is not ideal', () => {
			const webPatterns = searchPatternsByUseCase('web');
			webPatterns.forEach((pattern) => {
				const notIdeal = pattern.notIdealFor.some((use) =>
					use.toLowerCase().includes('web')
				);
				expect(notIdeal).toBe(false);
			});
		});
	});

	describe('getPatternsByTools()', () => {
		it('should filter by available tools', () => {
			const rustPatterns = getPatternsByTools(['Rust', 'Node.js', 'cargo', 'npm']);
			expect(rustPatterns).toContain(desktopAppPattern);
		});

		it('should be case insensitive for tools', () => {
			const patterns1 = getPatternsByTools(['rust']);
			const patterns2 = getPatternsByTools(['Rust']);
			expect(patterns1.length).toBe(patterns2.length);
		});

		it('should return empty array if tools not available', () => {
			const patterns = getPatternsByTools(['nonexistent-tool']);
			expect(patterns).toEqual([]);
		});
	});

	describe('getRecommendedPatterns()', () => {
		it('should return scored recommendations', () => {
			const recommendations = getRecommendedPatterns({
				category: 'web',
				complexity: 'intermediate'
			});

			expect(Array.isArray(recommendations)).toBe(true);
			recommendations.forEach((rec) => {
				expect(rec.pattern).toBeDefined();
				expect(typeof rec.score).toBe('number');
			});
		});

		it('should boost score for category match', () => {
			const recommendations = getRecommendedPatterns({
				category: 'desktop'
			});

			const desktopRec = recommendations.find((r) => r.pattern.id === 'desktop-app');
			const webRec = recommendations.find((r) => r.pattern.id === 'fullstack-web');

			expect(desktopRec).toBeDefined();
			expect(webRec).toBeDefined();
			if (desktopRec && webRec) {
				expect(desktopRec.score).toBeGreaterThan(webRec.score);
			}
		});

		it('should sort by score descending', () => {
			const recommendations = getRecommendedPatterns({
				complexity: 'intermediate'
			});

			for (let i = 0; i < recommendations.length - 1; i++) {
				expect(recommendations[i].score).toBeGreaterThanOrEqual(recommendations[i + 1].score);
			}
		});
	});

	describe('Pattern Validation', () => {
		describe('Desktop App Pattern', () => {
			it('should have all required fields', () => {
				expect(desktopAppPattern.id).toBeDefined();
				expect(desktopAppPattern.name).toBeDefined();
				expect(desktopAppPattern.displayName).toBeDefined();
				expect(desktopAppPattern.components.length).toBeGreaterThan(0);
			});

			it('should have valid backend component', () => {
				const backend = desktopAppPattern.components.find((c) => c.id === 'backend');
				expect(backend).toBeDefined();
				expect(backend?.language).toBe('rust');
				expect(backend?.framework).toBe('tauri');
			});

			it('should have valid frontend component', () => {
				const frontend = desktopAppPattern.components.find((c) => c.id === 'frontend');
				expect(frontend).toBeDefined();
				expect(frontend?.language).toBe('typescript');
				expect(frontend?.framework).toBe('sveltekit');
			});

			it('should have frontend depending on backend', () => {
				const frontend = desktopAppPattern.components.find((c) => c.id === 'frontend');
				const backendDep = frontend?.dependencies.find((d) => d.componentId === 'backend');
				expect(backendDep).toBeDefined();
				expect(backendDep?.type).toBe('required');
			});

			it('should use tauri-commands integration', () => {
				expect(desktopAppPattern.integration.protocol).toBe('tauri-commands');
			});

			it('should have valid documentation', () => {
				expect(desktopAppPattern.documentation).toBeDefined();
				if (desktopAppPattern.documentation) {
					expect(desktopAppPattern.documentation.quickStart).toBeDefined();
					expect(desktopAppPattern.documentation.architecture).toBeDefined();
					expect(desktopAppPattern.documentation.deployment).toBeDefined();
					expect(desktopAppPattern.documentation.troubleshooting).toBeDefined();
				}
		});

		describe('Full-Stack Web Pattern', () => {
			it('should have all required fields', () => {
				expect(fullstackWebPattern.id).toBeDefined();
				expect(fullstackWebPattern.name).toBeDefined();
				expect(fullstackWebPattern.displayName).toBeDefined();
				expect(fullstackWebPattern.components.length).toBeGreaterThan(0);
			});

			it('should have backend, frontend, and database components', () => {
				const backend = fullstackWebPattern.components.find((c) => c.id === 'backend');
				const frontend = fullstackWebPattern.components.find((c) => c.id === 'frontend');
				const database = fullstackWebPattern.components.find((c) => c.id === 'database');

				expect(backend).toBeDefined();
				expect(frontend).toBeDefined();
				expect(database).toBeDefined();
			});

			it('should use REST API integration', () => {
				expect(fullstackWebPattern.integration.protocol).toBe('rest-api');
			});

			it('should have backend depending on database', () => {
				const backend = fullstackWebPattern.components.find((c) => c.id === 'backend');
				const dbDep = backend?.dependencies.find((d) => d.componentId === 'database');
				expect(dbDep).toBeDefined();
			});
		});

		describe('validatePattern()', () => {
			it('should validate desktop app pattern', () => {
				const errors = validatePattern(desktopAppPattern);
				expect(errors).toEqual([]);
			});

			it('should validate fullstack web pattern', () => {
				const errors = validatePattern(fullstackWebPattern);
				expect(errors).toEqual([]);
			});

			it('should detect missing required fields', () => {
				const invalidPattern: any = {
					components: []
				};
				const errors = validatePattern(invalidPattern);
				expect(errors.length).toBeGreaterThan(0);
			});

			it('should detect invalid component dependencies', () => {
				const invalidPattern: any = {
					id: 'test',
					name: 'test',
					displayName: 'Test',
					components: [
						{
							id: 'comp1',
							dependencies: [
								{
									componentId: 'nonexistent',
									type: 'required',
									relationship: 'calls'
								}
							]
						}
					]
				};
				const errors = validatePattern(invalidPattern);
				expect(errors.some((e) => e.includes('nonexistent'))).toBe(true);
			});
		});

		describe('validateAllPatterns()', () => {
			it('should validate all registered patterns', () => {
				const results = validateAllPatterns();
				Object.values(results).forEach((errors) => {
					expect(errors).toEqual([]);
				});
			});

			it('should return validation results for each pattern', () => {
				const results = validateAllPatterns();
				expect(results['desktop-app']).toBeDefined();
				expect(results['fullstack-web']).toBeDefined();
			});
		});
	});

	describe('Pattern Metadata', () => {
		it('should have valid complexity levels', () => {
			getAllPatterns().forEach((pattern) => {
				expect(['simple', 'intermediate', 'complex', 'enterprise']).toContain(pattern.complexity);
			});
		});

		it('should have valid maturity levels', () => {
			getAllPatterns().forEach((pattern) => {
				expect(['experimental', 'stable', 'mature']).toContain(pattern.maturity);
			});
		});

		it('should have popularity scores between 0 and 100', () => {
			getAllPatterns().forEach((pattern) => {
				expect(pattern.popularity).toBeGreaterThanOrEqual(0);
				expect(pattern.popularity).toBeLessThanOrEqual(100);
			});
		});
	});
});
