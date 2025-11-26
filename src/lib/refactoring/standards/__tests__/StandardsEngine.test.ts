/**
 * Standards Engine Tests
 *
 * Tests for the core standards evaluation and gate generation engine.
 */

import { describe, it, expect } from 'vitest';
import { StandardsEngine } from '../StandardsEngine';
import { strictStandards, balancedStandards, startupStandards } from '../presets';
import type { CodebaseAnalysis } from '../../types/analysis';

// Mock codebase analysis factory
function createMockAnalysis(overrides?: Partial<CodebaseAnalysis>): CodebaseAnalysis {
	return {
		id: 'test-analysis-1',
		path: '/test/project',
		analyzedAt: new Date().toISOString(),
		structure: {
			totalFiles: 100,
			totalDirectories: 10,
			totalSize: 50000,
			files: [],
			filesByType: {
				typescript: 50,
				javascript: 20,
				svelte: 15,
				css: 10,
				html: 3,
				json: 2,
				markdown: 0,
				other: 0
			},
			testFiles: 25,
			sourceFiles: 75
		},
		techStack: {
			framework: 'sveltekit',
			language: 'typescript',
			stateManagement: 'svelte-runes',
			dependencies: []
		},
		metrics: {
			testCoverage: {
				lines: 80,
				statements: 80,
				branches: 75,
				functions: 85,
				uncoveredFiles: [],
				totalTests: 100,
				passingTests: 100,
				failingTests: 0
			},
			typeSafety: {
				totalFiles: 100,
				typedFiles: 90,
				jsFiles: 10,
				anyTypeCount: 5,
				typeErrorCount: 0,
				strictMode: true,
				noImplicitAny: true,
				typeCheckPassed: true
			},
			quality: {
				avgFileSize: 200,
				largestFile: { path: 'src/big.ts', lines: 250 },
				avgFunctionLength: 30,
				maxComplexity: 10,
				todoCount: 10,
				fixmeCount: 2,
				eslintErrors: 0,
				eslintWarnings: 5
			},
			size: {
				totalLines: 20000,
				codeLines: 15000,
				commentLines: 3000,
				blankLines: 2000
			}
		},
		patterns: [],
		issues: [],
		summary: {
			health: 'good',
			score: 85,
			highlights: [],
			concerns: []
		},
		...overrides
	};
}

describe('StandardsEngine', () => {
	describe('Constructor', () => {
		it('should create engine with standards', () => {
			const engine = new StandardsEngine(balancedStandards);
			expect(engine.getStandards()).toEqual(balancedStandards);
		});
	});

	describe('evaluate - Testing Category', () => {
		it('should pass when coverage meets balanced standards (80%)', () => {
			const engine = new StandardsEngine(balancedStandards);
			const analysis = createMockAnalysis(); // 80% coverage by default

			const result = engine.evaluate(analysis);

			expect(result.categories.testing.passed).toBe(true);
			expect(result.categories.testing.passedCount).toBeGreaterThan(0);
		});

		it('should fail when coverage below balanced standards', () => {
			const engine = new StandardsEngine(balancedStandards);
			const analysis = createMockAnalysis({
				metrics: {
					...createMockAnalysis().metrics,
					testCoverage: {
						...createMockAnalysis().metrics.testCoverage,
						lines: 75 // Below 80%
					}
				}
			});

			const result = engine.evaluate(analysis);

			expect(result.categories.testing.passed).toBe(false);
		});

		it('should fail when tests are failing', () => {
			const engine = new StandardsEngine(balancedStandards);
			const analysis = createMockAnalysis({
				metrics: {
					...createMockAnalysis().metrics,
					testCoverage: {
						...createMockAnalysis().metrics.testCoverage,
						failingTests: 5
					}
				}
			});

			const result = engine.evaluate(analysis);

			expect(result.categories.testing.passed).toBe(false);
		});

		it('should respect strict standards requiring 100% coverage', () => {
			const engine = new StandardsEngine(strictStandards);
			const analysis = createMockAnalysis(); // 80% coverage

			const result = engine.evaluate(analysis);

			expect(result.categories.testing.passed).toBe(false);
		});

		it('should pass strict standards with 100% coverage', () => {
			const engine = new StandardsEngine(strictStandards);
			const analysis = createMockAnalysis({
				metrics: {
					...createMockAnalysis().metrics,
					testCoverage: {
						...createMockAnalysis().metrics.testCoverage,
						lines: 100,
						statements: 100,
						branches: 100,
						functions: 100
					}
				}
			});

			const result = engine.evaluate(analysis);

			expect(result.categories.testing.passed).toBe(true);
		});
	});

	describe('evaluate - Type Safety Category', () => {
		it('should pass when type safety meets balanced standards', () => {
			const engine = new StandardsEngine(balancedStandards);
			const analysis = createMockAnalysis({
				metrics: {
					...createMockAnalysis().metrics,
					typeSafety: {
						...createMockAnalysis().metrics.typeSafety,
						anyTypeCount: 0 // Balanced standards don't allow any types
					}
				}
			});

			const result = engine.evaluate(analysis);

			expect(result.categories.typeSafety.passed).toBe(true);
		});

		it('should fail when any types not allowed (strict)', () => {
			const engine = new StandardsEngine(strictStandards);
			const analysis = createMockAnalysis(); // Has 5 any types

			const result = engine.evaluate(analysis);

			expect(result.categories.typeSafety.passed).toBe(false);
		});

		it('should pass strict standards with zero any types', () => {
			const engine = new StandardsEngine(strictStandards);
			const analysis = createMockAnalysis({
				metrics: {
					...createMockAnalysis().metrics,
					typeSafety: {
						...createMockAnalysis().metrics.typeSafety,
						anyTypeCount: 0
					}
				}
			});

			const result = engine.evaluate(analysis);

			expect(result.categories.typeSafety.passed).toBe(true);
		});

		it('should fail when type errors exceed limit', () => {
			const engine = new StandardsEngine(balancedStandards); // Max 5 errors
			const analysis = createMockAnalysis({
				metrics: {
					...createMockAnalysis().metrics,
					typeSafety: {
						...createMockAnalysis().metrics.typeSafety,
						typeErrorCount: 10 // Exceeds limit
					}
				}
			});

			const result = engine.evaluate(analysis);

			expect(result.categories.typeSafety.passed).toBe(false);
		});

		it('should require strict mode when configured', () => {
			const engine = new StandardsEngine(strictStandards);
			const analysis = createMockAnalysis({
				metrics: {
					...createMockAnalysis().metrics,
					typeSafety: {
						...createMockAnalysis().metrics.typeSafety,
						strictMode: false
					}
				}
			});

			const result = engine.evaluate(analysis);

			expect(result.categories.typeSafety.passed).toBe(false);
		});
	});

	describe('evaluate - Code Quality Category', () => {
		it('should pass balanced code quality standards', () => {
			const engine = new StandardsEngine(balancedStandards);
			const analysis = createMockAnalysis(); // 10 TODOs allowed

			const result = engine.evaluate(analysis);

			expect(result.categories.codeQuality.passed).toBe(true);
		});

		it('should fail strict standards with TODO comments', () => {
			const engine = new StandardsEngine(strictStandards);
			const analysis = createMockAnalysis(); // Has 10 TODOs

			const result = engine.evaluate(analysis);

			expect(result.categories.codeQuality.passed).toBe(false);
		});

		it('should pass strict standards with zero TODOs', () => {
			const engine = new StandardsEngine(strictStandards);
			const analysis = createMockAnalysis({
				metrics: {
					...createMockAnalysis().metrics,
					quality: {
						...createMockAnalysis().metrics.quality,
						todoCount: 0
					}
				}
			});

			const result = engine.evaluate(analysis);

			expect(result.categories.codeQuality.passed).toBe(true);
		});

		it('should fail when TODOs exceed user-configured limit', () => {
			const engine = new StandardsEngine(balancedStandards); // Max 20 TODOs
			const analysis = createMockAnalysis({
				metrics: {
					...createMockAnalysis().metrics,
					quality: {
						...createMockAnalysis().metrics.quality,
						todoCount: 30 // Exceeds limit
					}
				}
			});

			const result = engine.evaluate(analysis);

			// Code quality uses warnings for TODOs when allowed
			const todoRule = result.categories.codeQuality.rules.find((r) => r.ruleId === 'max-todos');
			expect(todoRule?.passed).toBe(false);
		});
	});

	describe('evaluate - Summary', () => {
		it('should calculate correct summary counts', () => {
			const engine = new StandardsEngine(balancedStandards);
			const analysis = createMockAnalysis();

			const result = engine.evaluate(analysis);

			expect(result.summary.totalRules).toBeGreaterThan(0);
			expect(result.summary.passedRules + result.summary.failedRules).toBe(
				result.summary.totalRules
			);
		});

		it('should pass overall when all categories pass', () => {
			const engine = new StandardsEngine(balancedStandards);
			const analysis = createMockAnalysis({
				metrics: {
					...createMockAnalysis().metrics,
					typeSafety: {
						...createMockAnalysis().metrics.typeSafety,
						anyTypeCount: 0 // Need 0 any types to pass balanced standards
					}
				}
			});

			const result = engine.evaluate(analysis);

			expect(result.passed).toBe(true);
		});

		it('should fail overall when any category fails', () => {
			const engine = new StandardsEngine(strictStandards);
			const analysis = createMockAnalysis(); // Won't meet strict standards

			const result = engine.evaluate(analysis);

			expect(result.passed).toBe(false);
		});

		it('should include standards ID in result', () => {
			const engine = new StandardsEngine(balancedStandards);
			const analysis = createMockAnalysis();

			const result = engine.evaluate(analysis);

			expect(result.standardsId).toBe('preset-balanced');
		});
	});

	describe('generateGates', () => {
		it('should generate 4 phase gates', () => {
			const engine = new StandardsEngine(balancedStandards);
			const gates = engine.generateGates();

			expect(gates).toHaveLength(4);
		});

		it('should generate gates with correct phase numbers', () => {
			const engine = new StandardsEngine(balancedStandards);
			const gates = engine.generateGates();

			expect(gates[0].phase).toBe(1);
			expect(gates[1].phase).toBe(2);
			expect(gates[2].phase).toBe(3);
			expect(gates[3].phase).toBe(4);
		});

		it('should use user-configured coverage threshold', () => {
			const engine = new StandardsEngine(strictStandards); // 100%
			const gates = engine.generateGates();

			const coverageGate = gates.find((g) => g.phase === 2);
			const coverageCheck = coverageGate?.checks.find((c) => c.id === 'minimum-coverage');

			expect(coverageCheck?.threshold).toBe(100);
		});

		it('should use balanced coverage threshold', () => {
			const engine = new StandardsEngine(balancedStandards); // 80%
			const gates = engine.generateGates();

			const coverageGate = gates.find((g) => g.phase === 2);
			const coverageCheck = coverageGate?.checks.find((c) => c.id === 'minimum-coverage');

			expect(coverageCheck?.threshold).toBe(80);
		});

		it('should use user-configured type error threshold', () => {
			const engine = new StandardsEngine(startupStandards); // 20 errors
			const gates = engine.generateGates();

			const typeGate = gates.find((g) => g.phase === 3);
			const typeCheck = typeGate?.checks.find((c) => c.id === 'max-type-errors');

			expect(typeCheck?.threshold).toBe(20);
		});

		it('should mark first 3 gates as required', () => {
			const engine = new StandardsEngine(balancedStandards);
			const gates = engine.generateGates();

			expect(gates[0].required).toBe(true); // Setup
			expect(gates[1].required).toBe(true); // Testing
			expect(gates[2].required).toBe(true); // Type Safety
			expect(gates[3].required).toBe(false); // Quality (not blocking)
		});

		it('should include verification commands', () => {
			const engine = new StandardsEngine(balancedStandards);
			const gates = engine.generateGates();

			const coverageCheck = gates[1].checks.find((c) => c.id === 'minimum-coverage');
			expect(coverageCheck?.command).toBe('pnpm test:coverage');

			const typeCheck = gates[2].checks.find((c) => c.id === 'max-type-errors');
			expect(typeCheck?.command).toBe('pnpm check');
		});
	});

	describe('verifyGate', () => {
		it('should verify coverage gate passes', async () => {
			const engine = new StandardsEngine(balancedStandards);
			const gates = engine.generateGates();
			const coverageGate = gates[1]; // Phase 2
			const analysis = createMockAnalysis(); // 80% coverage

			const result = await engine.verifyGate(coverageGate, analysis);

			expect(result.passed).toBe(true);
		});

		it('should verify coverage gate fails when below threshold', async () => {
			const engine = new StandardsEngine(balancedStandards);
			const gates = engine.generateGates();
			const coverageGate = gates[1];
			const analysis = createMockAnalysis({
				metrics: {
					...createMockAnalysis().metrics,
					testCoverage: {
						...createMockAnalysis().metrics.testCoverage,
						lines: 60 // Below 80%
					}
				}
			});

			const result = await engine.verifyGate(coverageGate, analysis);

			expect(result.passed).toBe(false);
		});

		it('should verify type safety gate passes', async () => {
			const engine = new StandardsEngine(balancedStandards);
			const gates = engine.generateGates();
			const typeGate = gates[2]; // Phase 3
			const analysis = createMockAnalysis(); // 0 type errors

			const result = await engine.verifyGate(typeGate, analysis);

			expect(result.passed).toBe(true);
		});

		it('should include check results', async () => {
			const engine = new StandardsEngine(balancedStandards);
			const gates = engine.generateGates();
			const coverageGate = gates[1];
			const analysis = createMockAnalysis();

			const result = await engine.verifyGate(coverageGate, analysis);

			expect(result.checks.length).toBeGreaterThan(0);
			expect(result.checks[0]).toHaveProperty('checkId');
			expect(result.checks[0]).toHaveProperty('passed');
			expect(result.checks[0]).toHaveProperty('actual');
			expect(result.checks[0]).toHaveProperty('message');
		});
	});

	describe('getStandards', () => {
		it('should return a copy of standards', () => {
			const engine = new StandardsEngine(balancedStandards);
			const standards = engine.getStandards();

			expect(standards).toEqual(balancedStandards);
			expect(standards).not.toBe(balancedStandards); // Should be a copy
		});
	});

	describe('withStandards', () => {
		it('should create new engine with different standards', () => {
			const engine = StandardsEngine.withStandards(strictStandards);

			expect(engine.getStandards()).toEqual(strictStandards);
		});
	});

	describe('User-Configured Standards Principle', () => {
		it('should evaluate using user thresholds, not hardcoded values', () => {
			// Create custom standards
			const customStandards = {
				...balancedStandards,
				id: 'custom',
				testing: {
					...balancedStandards.testing,
					minimumCoverage: 90 // Custom threshold
				}
			};

			const engine = new StandardsEngine(customStandards);
			const analysis = createMockAnalysis(); // 80% coverage

			const result = engine.evaluate(analysis);

			// Should fail because 80% < 90%
			expect(result.categories.testing.passed).toBe(false);
		});

		it('should generate gates with user thresholds', () => {
			const customStandards = {
				...balancedStandards,
				id: 'custom',
				testing: {
					...balancedStandards.testing,
					minimumCoverage: 95
				}
			};

			const engine = new StandardsEngine(customStandards);
			const gates = engine.generateGates();

			const coverageCheck = gates[1].checks.find((c) => c.id === 'minimum-coverage');
			expect(coverageCheck?.threshold).toBe(95);
		});
	});
});

describe('Additional Coverage Tests', () => {
	it('should warn about excessive any types when allowed', () => {
		const engine = new StandardsEngine(startupStandards); // Allows any types
		const analysis = createMockAnalysis({
			metrics: {
				...createMockAnalysis().metrics,
				typeSafety: {
					...createMockAnalysis().metrics.typeSafety,
					anyTypeCount: 25 // More than reasonable (20)
				}
			}
		});

		const result = engine.evaluate(analysis);

		// Should pass category (any types allowed) but have warning rule
		const anyTypeWarning = result.categories.typeSafety.rules.find(
			(r) => r.ruleId === 'any-types-warning'
		);
		expect(anyTypeWarning).toBeDefined();
		expect(anyTypeWarning?.passed).toBe(false); // 25 > 20
		expect(anyTypeWarning?.severity).toBe('warning');
	});

	it('should detect forbidden file patterns', () => {
		const customStandards = {
			...balancedStandards,
			architecture: {
				...balancedStandards.architecture,
				forbiddenPatterns: ['**/temp/**', '**/scratch/**']
			}
		};

		const engine = new StandardsEngine(customStandards);
		const analysis = createMockAnalysis({
			structure: {
				...createMockAnalysis().structure,
				files: [
					{
						path: '/project/src/temp/test.ts',
						relativePath: 'src/temp/test.ts',
						extension: 'ts',
						type: 'typescript' as const,
						size: 100,
						lines: 10,
						isTest: false,
						lastModified: new Date().toISOString()
					}
				]
			}
		});

		const result = engine.evaluate(analysis);

		const forbiddenRule = result.categories.architecture.rules.find(
			(r) => r.ruleId === 'no-forbidden-patterns'
		);
		expect(forbiddenRule).toBeDefined();
		expect(forbiddenRule?.passed).toBe(false); // File matches forbidden pattern
	});
});
