/**
 * Analyzer Unit Tests
 *
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import { FileSystemScanner } from '../FileSystemScanner';
import { TechStackDetector } from '../TechStackDetector';
import { PatternDetector } from '../PatternDetector';
import { IssueDetector } from '../IssueDetector';
import { CodebaseAnalyzer } from '../CodebaseAnalyzer';
import type { FileInfo, CodebaseMetrics, TechStack } from '../../types/analysis';

describe('FileSystemScanner', () => {
	it('should create scanner with default config', () => {
		const scanner = new FileSystemScanner();
		const config = scanner.getConfig();

		expect(config.excludeDirs).toContain('node_modules');
		expect(config.excludeDirs).toContain('.git');
	});

	it('should allow custom config', () => {
		const scanner = new FileSystemScanner({
			excludeDirs: ['custom'],
			maxDepth: 5
		});
		const config = scanner.getConfig();

		expect(config.excludeDirs).toContain('custom');
		expect(config.maxDepth).toBe(5);
	});
});

describe('PatternDetector', () => {
	it('should detect store pattern', async () => {
		const detector = new PatternDetector();
		const files: FileInfo[] = [
			{
				path: '/test/src/stores/theme.svelte.ts',
				relativePath: 'src/stores/theme.svelte.ts',
				type: 'typescript',
				extension: '.ts',
				size: 1000,
				lines: 50,
				isTest: false,
				lastModified: new Date().toISOString()
			}
		];
		const techStack: TechStack = {
			framework: 'sveltekit',
			language: 'typescript',
			stateManagement: 'svelte-runes',
			dependencies: []
		};

		const patterns = await detector.detect(files, techStack);

		expect(patterns.length).toBeGreaterThan(0);
		const storePattern = patterns.find(p => p.type === 'store-pattern');
		expect(storePattern).toBeDefined();
		expect(storePattern?.confidence).toBeGreaterThan(0);
	});
});

describe('IssueDetector', () => {
	it('should detect low coverage issue', async () => {
		const detector = new IssueDetector();
		const metrics: CodebaseMetrics = {
			testCoverage: {
				lines: 50,
				statements: 50,
				branches: 50,
				functions: 50,
				uncoveredFiles: [],
				totalTests: 10,
				passingTests: 10,
				failingTests: 0
			},
			typeSafety: {
				totalFiles: 100,
				typedFiles: 90,
				jsFiles: 10,
				anyTypeCount: 0,
				typeErrorCount: 0,
				strictMode: true,
				noImplicitAny: true,
				typeCheckPassed: true
			},
			quality: {
				avgFileSize: 200,
				largestFile: { path: 'test.ts', lines: 300 },
				avgFunctionLength: 20,
				maxComplexity: 10,
				todoCount: 5,
				fixmeCount: 0,
				eslintErrors: 0,
				eslintWarnings: 0
			},
			size: {
				totalLines: 10000,
				codeLines: 7500,
				commentLines: 1500,
				blankLines: 1000
			}
		};

		const issues = await detector.detect([], metrics, []);

		expect(issues.length).toBeGreaterThan(0);
		const coverageIssue = issues.find(i => i.title.includes('Coverage'));
		expect(coverageIssue).toBeDefined();
		expect(coverageIssue?.severity).toBe('error');
	});

	it('should detect high TODO count issue', async () => {
		const detector = new IssueDetector();
		const metrics: CodebaseMetrics = {
			testCoverage: {
				lines: 90,
				statements: 90,
				branches: 90,
				functions: 90,
				uncoveredFiles: [],
				totalTests: 100,
				passingTests: 100,
				failingTests: 0
			},
			typeSafety: {
				totalFiles: 100,
				typedFiles: 100,
				jsFiles: 0,
				anyTypeCount: 0,
				typeErrorCount: 0,
				strictMode: true,
				noImplicitAny: true,
				typeCheckPassed: true
			},
			quality: {
				avgFileSize: 200,
				largestFile: { path: 'test.ts', lines: 300 },
				avgFunctionLength: 20,
				maxComplexity: 10,
				todoCount: 60,
				fixmeCount: 0,
				eslintErrors: 0,
				eslintWarnings: 0
			},
			size: {
				totalLines: 10000,
				codeLines: 7500,
				commentLines: 1500,
				blankLines: 1000
			}
		};

		const issues = await detector.detect([], metrics, []);

		const todoIssue = issues.find(i => i.title.includes('TODO'));
		expect(todoIssue).toBeDefined();
		expect(todoIssue?.severity).toBe('warning');
	});
});

describe('CodebaseAnalyzer', () => {
	it('should create analyzer with config', () => {
		const analyzer = new CodebaseAnalyzer({
			excludeDirs: ['test']
		});

		expect(analyzer).toBeDefined();
	});
});
