/**
 * EditorAnalyzer Unit Tests
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EditorAnalyzer } from '../EditorAnalyzer';
import type { EditorContent } from '../EditorAnalyzer';

describe('EditorAnalyzer', () => {
	let analyzer: EditorAnalyzer;

	beforeEach(() => {
		analyzer = new EditorAnalyzer();
	});

	// ============================================================================
	// INITIALIZATION
	// ============================================================================

	describe('Initialization', () => {
		it('should create analyzer instance', () => {
			expect(analyzer).toBeDefined();
			expect(analyzer).toBeInstanceOf(EditorAnalyzer);
		});
	});

	// ============================================================================
	// SINGLE FILE ANALYSIS - JAVASCRIPT/TYPESCRIPT
	// ============================================================================

	describe('analyzeSingleFile - JavaScript/TypeScript', () => {
		it('should detect any type usage', async () => {
			const content: EditorContent = {
				content: 'function test(param: any) { return param; }',
				filename: 'test.ts',
				language: 'typescript'
			};

			const result = await analyzer.analyzeSingleFile(content);

			expect(result.issues.length).toBeGreaterThan(0);
			const anyIssue = result.issues.find(i => i.title.includes('any'));
			expect(anyIssue).toBeDefined();
			expect(anyIssue?.severity).toBe('warning');
			expect(anyIssue?.category).toBe('type-safety');
		});

		it('should detect var usage', async () => {
			const content: EditorContent = {
				content: 'var x = 10; var y = 20;',
				filename: 'test.js',
				language: 'javascript'
			};

			const result = await analyzer.analyzeSingleFile(content);

			const varIssue = result.issues.find(i => i.title.includes('var'));
			expect(varIssue).toBeDefined();
			expect(varIssue?.severity).toBe('warning');
			expect(varIssue?.category).toBe('code-quality');
		});

		it('should detect console statements', async () => {
			const content: EditorContent = {
				content: 'console.log("debug"); console.error("error");',
				filename: 'test.js',
				language: 'javascript'
			};

			const result = await analyzer.analyzeSingleFile(content);

			const consoleIssues = result.issues.filter(i => i.title.includes('Console'));
			expect(consoleIssues.length).toBeGreaterThan(0);
		});

		it('should detect loose equality', async () => {
			const content: EditorContent = {
				content: 'if (a == b) { } if (c != d) { }',
				filename: 'test.js',
				language: 'javascript'
			};

			const result = await analyzer.analyzeSingleFile(content);

			const equalityIssue = result.issues.find(i => i.title.includes('strict equality'));
			expect(equalityIssue).toBeDefined();
			expect(equalityIssue?.severity).toBe('warning');
		});

		it('should handle clean JavaScript code', async () => {
			const content: EditorContent = {
				content: 'const x = 10; const y = 20; if (x === y) { }',
				filename: 'test.js',
				language: 'javascript'
			};

			const result = await analyzer.analyzeSingleFile(content);

			// Should only have generic issues (if any)
			const jsIssues = result.issues.filter(
				i => i.category === 'type-safety' || i.title.includes('var')
			);
			expect(jsIssues.length).toBe(0);
		});
	});

	// ============================================================================
	// SINGLE FILE ANALYSIS - PYTHON
	// ============================================================================

	describe('analyzeSingleFile - Python', () => {
		it('should detect Python 2 print statements', async () => {
			const content: EditorContent = {
				content: 'print "Hello World"',
				filename: 'test.py',
				language: 'python'
			};

			const result = await analyzer.analyzeSingleFile(content);

			const printIssue = result.issues.find(i => i.title.includes('print'));
			expect(printIssue).toBeDefined();
			expect(printIssue?.severity).toBe('error');
			expect(printIssue?.category).toBe('code-quality');
		});

		it('should detect mutable default arguments', async () => {
			const content: EditorContent = {
				content: 'def foo(x=[]):\n    pass',
				filename: 'test.py',
				language: 'python'
			};

			const result = await analyzer.analyzeSingleFile(content);

			const mutableIssue = result.issues.find(i => i.title.includes('Mutable'));
			expect(mutableIssue).toBeDefined();
			expect(mutableIssue?.severity).toBe('error');
		});

		it('should handle clean Python code', async () => {
			const content: EditorContent = {
				content: 'def foo(x=None):\n    print("hello")\n    return x',
				filename: 'test.py',
				language: 'python'
			};

			const result = await analyzer.analyzeSingleFile(content);

			// Should not have Python-specific errors
			const pyErrors = result.issues.filter(
				i => i.title.includes('print') && i.severity === 'error'
			);
			expect(pyErrors.length).toBe(0);
		});
	});

	// ============================================================================
	// SINGLE FILE ANALYSIS - GENERIC CHECKS
	// ============================================================================

	describe('analyzeSingleFile - Generic Checks', () => {
		it('should detect long lines', async () => {
			const longLine = 'const x = "' + 'a'.repeat(150) + '";';
			const content: EditorContent = {
				content: longLine,
				filename: 'test.ts',
				language: 'typescript'
			};

			const result = await analyzer.analyzeSingleFile(content);

			const longLineIssue = result.issues.find(i => i.title.includes('exceed 120'));
			expect(longLineIssue).toBeDefined();
			expect(longLineIssue?.severity).toBe('info');
		});

		it('should detect trailing whitespace', async () => {
			const content: EditorContent = {
				content: 'const x = 10;   \nconst y = 20;  ',
				filename: 'test.ts',
				language: 'typescript'
			};

			const result = await analyzer.analyzeSingleFile(content);

			const whitespaceIssue = result.issues.find(i => i.title.includes('trailing whitespace'));
			expect(whitespaceIssue).toBeDefined();
			expect(whitespaceIssue?.severity).toBe('info');
		});

		it('should group multiple long lines', async () => {
			const lines = Array(5).fill('const x = "' + 'a'.repeat(150) + '";').join('\n');
			const content: EditorContent = {
				content: lines,
				filename: 'test.ts',
				language: 'typescript'
			};

			const result = await analyzer.analyzeSingleFile(content);

			const longLineIssue = result.issues.find(i => i.title.includes('5 line'));
			expect(longLineIssue).toBeDefined();
		});
	});

	// ============================================================================
	// MULTIPLE FILES ANALYSIS
	// ============================================================================

	describe('analyzeMultipleFiles', () => {
		it('should analyze multiple files', async () => {
			const files = new Map<string, string>([
				['src/test1.ts', 'function test(x: any) { return x; }'],
				['src/test2.js', 'var x = 10;'],
				['src/test3.py', 'print "hello"']
			]);

			const result = await analyzer.analyzeMultipleFiles(files);

			expect(result.issues.length).toBeGreaterThan(0);

			// Should have issues from all files
			const tsIssues = result.issues.filter(i => i.files.some(f => f.includes('test1.ts')));
			const jsIssues = result.issues.filter(i => i.files.some(f => f.includes('test2.js')));
			const pyIssues = result.issues.filter(i => i.files.some(f => f.includes('test3.py')));

			expect(tsIssues.length).toBeGreaterThan(0);
			expect(jsIssues.length).toBeGreaterThan(0);
			expect(pyIssues.length).toBeGreaterThan(0);
		});

		it('should handle empty file map', async () => {
			const files = new Map<string, string>();

			const result = await analyzer.analyzeMultipleFiles(files);

			expect(result.issues.length).toBe(0);
			expect(result.summary.score).toBe(100);
			expect(result.summary.health).toBe('excellent');
		});

		it('should calculate correct summary for multiple files', async () => {
			const files = new Map<string, string>([
				['src/clean.ts', 'const x: number = 10;'],
				['src/clean2.ts', 'const y: string = "hello";']
			]);

			const result = await analyzer.analyzeMultipleFiles(files);

			expect(result.summary.score).toBeGreaterThanOrEqual(90);
			expect(result.summary.health).toMatch(/excellent|good/);
		});
	});

	// ============================================================================
	// HEALTH SCORING
	// ============================================================================

	describe('Health Scoring', () => {
		it('should score 100 for no issues', async () => {
			const content: EditorContent = {
				content: 'const x: number = 10;',
				filename: 'test.ts',
				language: 'typescript'
			};

			const result = await analyzer.analyzeSingleFile(content);

			expect(result.summary.score).toBe(100);
			expect(result.summary.health).toBe('excellent');
		});

		it('should penalize for errors', async () => {
			const content: EditorContent = {
				content: 'print "old python"',
				filename: 'test.py',
				language: 'python'
			};

			const result = await analyzer.analyzeSingleFile(content);

			expect(result.summary.score).toBeLessThan(100);
			expect(result.issues.some(i => i.severity === 'error')).toBe(true);
		});

		it('should penalize for warnings', async () => {
			const content: EditorContent = {
				content: 'function test(x: any) { return x; }',
				filename: 'test.ts',
				language: 'typescript'
			};

			const result = await analyzer.analyzeSingleFile(content);

			expect(result.summary.score).toBeLessThan(100);
			expect(result.issues.some(i => i.severity === 'warning')).toBe(true);
		});

		it('should calculate correct health status', async () => {
			// Excellent: no issues
			let content: EditorContent = {
				content: 'const x = 10;',
				filename: 'test.js',
				language: 'javascript'
			};
			let result = await analyzer.analyzeSingleFile(content);
			expect(result.summary.health).toBe('excellent');

			// Good: some warnings but no errors
			content = {
				content: 'var a = 1; var b = 2;',
				filename: 'test.js',
				language: 'javascript'
			};
			result = await analyzer.analyzeSingleFile(content);
			expect(result.summary.health).toBe('good');

			// Poor: has errors
			content = {
				content: 'print "test"\nprint "test2"',
				filename: 'test.py',
				language: 'python'
			};
			result = await analyzer.analyzeSingleFile(content);
			expect(result.summary.health).toBe('poor');
		});
	});

	// ============================================================================
	// SUMMARY GENERATION
	// ============================================================================

	describe('Summary Generation', () => {
		it('should generate highlights for clean code', async () => {
			const content: EditorContent = {
				content: 'const x: number = 10;\nconst y: string = "hello";',
				filename: 'test.ts',
				language: 'typescript'
			};

			const result = await analyzer.analyzeSingleFile(content);

			expect(result.summary.highlights.length).toBeGreaterThan(0);
		});

		it('should generate concerns for issues', async () => {
			const content: EditorContent = {
				content: 'function test(x: any) { var y = x; return y; }',
				filename: 'test.ts',
				language: 'typescript'
			};

			const result = await analyzer.analyzeSingleFile(content);

			expect(result.summary.concerns.length).toBeGreaterThan(0);
		});

		it('should include file count in multiple file analysis', async () => {
			const files = new Map<string, string>([
				['file1.ts', 'const x = 1;'],
				['file2.ts', 'const y = 2;'],
				['file3.ts', 'const z = 3;']
			]);

			const result = await analyzer.analyzeMultipleFiles(files);

			expect(result.structure.totalFiles).toBe(3);
		});
	});

	// ============================================================================
	// LANGUAGE DETECTION
	// ============================================================================

	describe('Language Detection', () => {
		it('should handle .ts files as TypeScript', async () => {
			const content: EditorContent = {
				content: 'const x: any = 10;',
				filename: 'test.ts',
				language: 'typescript'
			};

			const result = await analyzer.analyzeSingleFile(content);

			const anyIssue = result.issues.find(i => i.title.includes('any'));
			expect(anyIssue).toBeDefined();
		});

		it('should handle .js files as JavaScript', async () => {
			const content: EditorContent = {
				content: 'var x = 10;',
				filename: 'test.js',
				language: 'javascript'
			};

			const result = await analyzer.analyzeSingleFile(content);

			const varIssue = result.issues.find(i => i.title.includes('var'));
			expect(varIssue).toBeDefined();
		});

		it('should handle .py files as Python', async () => {
			const content: EditorContent = {
				content: 'print "test"',
				filename: 'test.py',
				language: 'python'
			};

			const result = await analyzer.analyzeSingleFile(content);

			const printIssue = result.issues.find(i => i.title.includes('print'));
			expect(printIssue).toBeDefined();
		});

		it('should handle markdown files with generic checks only', async () => {
			const content: EditorContent = {
				content: 'Line with trailing space   \n# Header',
				filename: 'README.md',
				language: 'markdown'
			};

			const result = await analyzer.analyzeSingleFile(content);

			// Should only have generic issues
			expect(result.issues.every(i => i.category !== 'type-safety')).toBe(true);
		});
	});

	// ============================================================================
	// EDGE CASES
	// ============================================================================

	describe('Edge Cases', () => {
		it('should handle empty content', async () => {
			const content: EditorContent = {
				content: '',
				filename: 'test.ts',
				language: 'typescript'
			};

			const result = await analyzer.analyzeSingleFile(content);

			expect(result.issues.length).toBe(0);
			expect(result.summary.score).toBe(100);
		});

		it('should handle very long files', async () => {
			const longContent = Array(1000).fill('const x = 10;').join('\n');
			const content: EditorContent = {
				content: longContent,
				filename: 'test.ts',
				language: 'typescript'
			};

			const result = await analyzer.analyzeSingleFile(content);

			expect(result).toBeDefined();
			expect(result.summary).toBeDefined();
		});

		it('should handle files with mixed issues', async () => {
			const content: EditorContent = {
				content: `
					function test(x: any) {
						var y = 10;
						return x;
					}
				`,
				filename: 'test.ts',
				language: 'typescript'
			};

			const result = await analyzer.analyzeSingleFile(content);

			expect(result.issues.length).toBeGreaterThanOrEqual(2);
			expect(result.issues.some(i => i.title.includes('any'))).toBe(true);
			expect(result.issues.some(i => i.title.includes('var'))).toBe(true);
		});

		it('should handle special characters in content', async () => {
			const content: EditorContent = {
				content: 'const emoji = "🎉"; const unicode = "\\u0041";',
				filename: 'test.ts',
				language: 'typescript'
			};

			const result = await analyzer.analyzeSingleFile(content);

			expect(result).toBeDefined();
			expect(result.issues.length).toBeGreaterThanOrEqual(0);
		});
	});
});
