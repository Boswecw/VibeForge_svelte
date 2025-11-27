/**
 * Editor Analyzer
 *
 * Analyzes code from editor content rather than file system.
 * Adapter for analyzing pasted code or GitHub repository files.
 */

import type {
	CodebaseAnalysis,
	DetectedIssue,
	TechStack,
	Framework,
	StateManagement,
	DirectoryStructure,
	CodebaseMetrics,
	IssueSeverity,
	IssueCategory
} from '../types/analysis';
import { architectureDetector } from './ArchitectureDetector';
import { securityDetector } from './SecurityDetector';
import { performanceDetector } from './PerformanceDetector';
import { bestPracticesDetector } from './BestPracticesDetector';

export interface EditorContent {
	content: string;
	language: string; // 'typescript', 'javascript', 'python', etc.
	filename?: string; // Optional filename hint
}

export interface AnalyzeOptions {
	/** Multiple files (for GitHub repos) */
	files?: Map<string, string>;
	/** Single file content (for pasted code) */
	singleFile?: EditorContent;
}

/**
 * Analyzes code from editor content rather than file system
 */
export class EditorAnalyzer {
	/**
	 * Analyze single file/snippet pasted into editor
	 */
	async analyzeSingleFile(content: EditorContent): Promise<CodebaseAnalysis> {
		const issues: DetectedIssue[] = [];

		// Detect language if not provided
		const language = content.language || this.detectLanguage(content.content);
		const filename = content.filename || 'editor';

		// Run language-specific checks
		if (language === 'typescript' || language === 'javascript') {
			issues.push(...this.analyzeJavaScript(content.content, filename));
		} else if (language === 'python') {
			issues.push(...this.analyzePython(content.content, filename));
		}

		// Run generic checks
		issues.push(...this.analyzeGeneric(content.content, filename));

		// Run advanced detectors
		issues.push(...architectureDetector.detectIssues(content.content, filename, language));
		issues.push(...securityDetector.detectIssues(content.content, filename, language));
		issues.push(...performanceDetector.detectIssues(content.content, filename, language));
		issues.push(...bestPracticesDetector.detectIssues(content.content, filename, language));

		const lines = content.content.split('\n');

		// Build structure
		const structure: DirectoryStructure = {
			totalFiles: 1,
			totalDirectories: 0,
			totalSize: content.content.length,
			sourceFiles: 1,
			testFiles: 0,
			files: [
				{
					path: content.filename || 'editor',
					relativePath: content.filename || 'editor',
					type: this.mapLanguageToFileType(language),
					extension: this.getExtension(language),
					size: content.content.length,
					lines: lines.length,
					isTest: false,
					lastModified: new Date().toISOString()
				}
			],
			filesByType: {
				typescript: language === 'typescript' ? 1 : 0,
				javascript: language === 'javascript' ? 1 : 0,
				svelte: 0,
				css: 0,
				html: 0,
				json: 0,
				markdown: 0,
				other: language !== 'typescript' && language !== 'javascript' ? 1 : 0
			}
		};

		// Build analysis result
		return {
			id: `analysis-${Date.now()}`,
			path: content.filename || 'editor',
			analyzedAt: new Date().toISOString(),
			structure,
			techStack: this.detectTechStack(content.content, language),
			metrics: this.calculateMetrics(content.content, issues, lines.length),
			patterns: [],
			issues,
			summary: this.generateSummary(issues)
		};
	}

	/**
	 * Analyze multiple files (from GitHub)
	 */
	async analyzeMultipleFiles(files: Map<string, string>): Promise<CodebaseAnalysis> {
		const allIssues: DetectedIssue[] = [];
		const fileInfos = [];

		for (const [path, content] of files) {
			const language = this.detectLanguageFromPath(path);
			const fileAnalysis = await this.analyzeSingleFile({
				content,
				language,
				filename: path
			});

			// Merge issues (they already have the correct file path from analyzeSingleFile)
			allIssues.push(...fileAnalysis.issues);
			fileInfos.push(...fileAnalysis.structure.files);
		}

		const totalLines = fileInfos.reduce((sum, f) => sum + f.lines, 0);

		// Build structure
		const structure: DirectoryStructure = {
			totalFiles: files.size,
			totalDirectories: new Set([...files.keys()].map((p) => p.split('/').slice(0, -1).join('/')))
				.size,
			totalSize: fileInfos.reduce((sum, f) => sum + f.size, 0),
			sourceFiles: fileInfos.filter((f) => !f.isTest).length,
			testFiles: fileInfos.filter((f) => f.isTest).length,
			files: fileInfos,
			filesByType: {
				typescript: fileInfos.filter((f) => f.type === 'typescript').length,
				javascript: fileInfos.filter((f) => f.type === 'javascript').length,
				svelte: fileInfos.filter((f) => f.type === 'svelte').length,
				css: fileInfos.filter((f) => f.type === 'css').length,
				html: fileInfos.filter((f) => f.type === 'html').length,
				json: fileInfos.filter((f) => f.type === 'json').length,
				markdown: fileInfos.filter((f) => f.type === 'markdown').length,
				other: fileInfos.filter((f) => f.type === 'other').length
			}
		};

		// Aggregate results
		return {
			id: `analysis-${Date.now()}`,
			path: 'repository',
			analyzedAt: new Date().toISOString(),
			structure,
			techStack: this.detectTechStackFromFiles(files),
			metrics: this.calculateAggregateMetrics(files, allIssues, totalLines),
			patterns: [],
			issues: allIssues,
			summary: this.generateSummary(allIssues)
		};
	}

	/**
	 * JavaScript/TypeScript specific analysis
	 */
	private analyzeJavaScript(content: string, filename: string): DetectedIssue[] {
		const issues: DetectedIssue[] = [];
		const lines = content.split('\n');

		lines.forEach((line, index) => {
			const lineNum = index + 1;

			// Check for 'any' type
			if (/:\s*any\b/.test(line)) {
				issues.push({
					id: `any-${filename}-${lineNum}`,
					severity: 'warning',
					category: 'type-safety',
					title: 'Avoid using "any" type',
					description: 'Use a specific type instead of "any" to maintain type safety',
					files: [filename],
					lineNumbers: [lineNum],
					suggestion: 'Replace "any" with a specific type or create a custom interface',
					autoFixable: false
				});
			}

			// Check for var usage
			if (/\bvar\s+\w+/.test(line)) {
				issues.push({
					id: `var-${filename}-${lineNum}`,
					severity: 'warning',
					category: 'code-quality',
					title: 'Use "let" or "const" instead of "var"',
					description: 'var has function scope which can lead to bugs. Use let or const for block scope.',
					files: [filename],
					lineNumbers: [lineNum],
					suggestion: 'Replace "var" with "let" for mutable variables or "const" for constants',
					autoFixable: true
				});
			}

			// Check for console.log
			if (/console\.(log|warn|error|debug|info)/.test(line)) {
				issues.push({
					id: `console-${filename}-${lineNum}`,
					severity: 'info',
					category: 'code-quality',
					title: 'Console statement found',
					description: 'Remove console statements before production deployment',
					files: [filename],
					lineNumbers: [lineNum],
					suggestion: 'Use a proper logging library or remove before deployment',
					autoFixable: true
				});
			}

			// Check for == instead of ===
			if (/[^=!]==[^=]/.test(line)) {
				issues.push({
					id: `equality-${filename}-${lineNum}`,
					severity: 'warning',
					category: 'code-quality',
					title: 'Use strict equality',
					description: 'Use "===" instead of "==" for strict equality comparison',
					files: [filename],
					lineNumbers: [lineNum],
					suggestion: 'Replace "==" with "===" for type-safe comparison',
					autoFixable: true
				});
			}
		});

		return issues;
	}

	/**
	 * Python specific analysis
	 */
	private analyzePython(content: string, filename: string): DetectedIssue[] {
		const issues: DetectedIssue[] = [];
		const lines = content.split('\n');

		lines.forEach((line, index) => {
			const lineNum = index + 1;

			// Check for print statements (Python 2 style)
			if (/^print\s+[^(]/.test(line.trim())) {
				issues.push({
					id: `print-${filename}-${lineNum}`,
					severity: 'error',
					category: 'code-quality',
					title: 'Use print() function syntax',
					description: 'Python 3 requires print() function syntax instead of print statement',
					files: [filename],
					lineNumbers: [lineNum],
					suggestion: 'Add parentheses: print("text") instead of print "text"',
					autoFixable: true
				});
			}

			// Check for mutable default arguments
			if (/def\s+\w+\([^)]*=\s*(\[\]|\{\})/.test(line)) {
				issues.push({
					id: `mutable-default-${filename}-${lineNum}`,
					severity: 'error',
					category: 'code-quality',
					title: 'Mutable default argument',
					description:
						'Mutable default arguments can lead to unexpected behavior. Use None and initialize inside function.',
					files: [filename],
					lineNumbers: [lineNum],
					suggestion: 'Use None as default and initialize inside function: def func(arg=None): arg = arg or []',
					autoFixable: false
				});
			}
		});

		return issues;
	}

	/**
	 * Generic analysis (any language)
	 */
	private analyzeGeneric(content: string, filename: string): DetectedIssue[] {
		const issues: DetectedIssue[] = [];
		const lines = content.split('\n');

		// Group long lines
		const longLines: number[] = [];
		lines.forEach((line, index) => {
			if (line.length > 120) {
				longLines.push(index + 1);
			}
		});

		if (longLines.length > 0) {
			issues.push({
				id: `long-lines-${filename}`,
				severity: 'info',
				category: 'code-quality',
				title: `${longLines.length} line(s) exceed 120 characters`,
				description: 'Long lines can reduce readability. Consider breaking them into multiple lines.',
				files: [filename],
				lineNumbers: longLines,
				suggestion: 'Break long lines at logical points or use string concatenation',
				autoFixable: false
			});
		}

		// Group trailing whitespace
		const trailingWsLines: number[] = [];
		lines.forEach((line, index) => {
			if (/\s+$/.test(line)) {
				trailingWsLines.push(index + 1);
			}
		});

		if (trailingWsLines.length > 0) {
			issues.push({
				id: `trailing-ws-${filename}`,
				severity: 'info',
				category: 'code-quality',
				title: `${trailingWsLines.length} line(s) have trailing whitespace`,
				description: 'Trailing whitespace can cause unnecessary diffs in version control',
				files: [filename],
				lineNumbers: trailingWsLines,
				suggestion: 'Configure your editor to remove trailing whitespace on save',
				autoFixable: true
			});
		}

		return issues;
	}

	private detectLanguage(content: string): string {
		if (content.includes('import React') || content.includes('useState')) return 'typescript';
		if (content.includes('def ') && content.includes(':')) return 'python';
		if (content.includes('func ') && content.includes('->')) return 'swift';
		if (content.includes('fn ') && content.includes('->')) return 'rust';
		if (content.includes('function') || content.includes('=>')) return 'javascript';
		return 'plaintext';
	}

	private detectLanguageFromPath(path: string): string {
		const ext = path.split('.').pop()?.toLowerCase();
		const map: Record<string, string> = {
			ts: 'typescript',
			tsx: 'typescript',
			js: 'javascript',
			jsx: 'javascript',
			py: 'python',
			rs: 'rust',
			go: 'go',
			swift: 'swift',
			java: 'java',
			svelte: 'svelte'
		};
		return map[ext || ''] || 'plaintext';
	}

	private mapLanguageToFileType(language: string): any {
		const map: Record<string, any> = {
			typescript: 'typescript',
			javascript: 'javascript',
			python: 'other',
			svelte: 'svelte',
			rust: 'other',
			go: 'other'
		};
		return map[language] || 'other';
	}

	private getExtension(language: string): string {
		const map: Record<string, string> = {
			typescript: '.ts',
			javascript: '.js',
			python: '.py',
			rust: '.rs',
			svelte: '.svelte'
		};
		return map[language] || '.txt';
	}

	private detectTechStack(content: string, language: string): TechStack {
		return {
			framework: this.detectFramework(content),
			language: (language === 'typescript' ? 'typescript' : 'javascript') as 'typescript' | 'javascript',
			cssFramework: undefined,
			testFramework: undefined,
			buildTool: undefined,
			stateManagement: 'none' as StateManagement,
			dependencies: []
		};
	}

	private detectFramework(content: string): Framework {
		if (content.includes('import React') || content.includes('from "react"')) return 'react';
		if (content.includes('<script') && content.includes('$:')) return 'svelte';
		if (content.includes('@Component')) return 'unknown';
		if (content.includes('Vue.component') || content.includes('defineComponent')) return 'vue';
		if (content.includes('FastAPI') || content.includes('from fastapi')) return 'fastapi';
		if (content.includes('from django')) return 'django';
		if (content.includes('express()')) return 'express';
		return 'unknown';
	}

	private detectTechStackFromFiles(files: Map<string, string>): TechStack {
		// Check package.json if present
		const packageJson = files.get('package.json');
		if (packageJson) {
			try {
				const pkg = JSON.parse(packageJson);
				const deps = { ...pkg.dependencies, ...pkg.devDependencies };

				let framework: Framework = 'unknown';
				if (deps['@sveltejs/kit']) framework = 'sveltekit';
				else if (deps.svelte) framework = 'svelte';
				else if (deps.next) framework = 'nextjs';
				else if (deps.react) framework = 'react';
				else if (deps.vue) framework = 'vue';
				else if (deps.express) framework = 'express';

				return {
					language: deps.typescript ? 'typescript' : 'javascript',
					framework,
					buildTool: deps.vite ? 'Vite' : deps.webpack ? 'Webpack' : undefined,
					testFramework: deps.vitest ? 'Vitest' : deps.jest ? 'Jest' : undefined,
					cssFramework: deps.tailwindcss ? 'Tailwind' : undefined,
					stateManagement: deps['@reduxjs/toolkit']
						? 'redux'
						: deps.zustand
							? 'zustand'
							: ('none' as StateManagement),
					dependencies: Object.entries({ ...pkg.dependencies }).map(([name, version]) => ({
						name,
						version: version as string,
						type: 'dependency' as const
					}))
				};
			} catch (e) {
				// Invalid JSON, fall through
			}
		}

		return {
			language: 'javascript',
			framework: 'unknown',
			stateManagement: 'none',
			dependencies: []
		};
	}

	private calculateMetrics(content: string, issues: DetectedIssue[], totalLines: number): CodebaseMetrics {
		const lines = content.split('\n');
		const commentLines = lines.filter((l) => l.trim().startsWith('//')).length;
		const blankLines = lines.filter((l) => !l.trim()).length;

		return {
			testCoverage: {
				lines: 0,
				statements: 0,
				branches: 0,
				functions: 0,
				uncoveredFiles: [],
				totalTests: 0,
				passingTests: 0,
				failingTests: 0
			},
			typeSafety: {
				totalFiles: 1,
				typedFiles: 0,
				jsFiles: 1,
				anyTypeCount: issues.filter((i) => i.title.includes('any')).length,
				typeErrorCount: 0,
				strictMode: false,
				noImplicitAny: false,
				typeCheckPassed: true
			},
			quality: {
				avgFileSize: totalLines,
				largestFile: { path: 'editor', lines: totalLines },
				avgFunctionLength: 0,
				maxComplexity: 0,
				todoCount: 0,
				fixmeCount: 0,
				eslintErrors: 0,
				eslintWarnings: 0
			},
			size: {
				totalLines,
				codeLines: totalLines - blankLines - commentLines,
				commentLines,
				blankLines
			}
		};
	}

	private calculateAggregateMetrics(
		files: Map<string, string>,
		issues: DetectedIssue[],
		totalLines: number
	): CodebaseMetrics {
		let totalBlankLines = 0;
		let totalCommentLines = 0;

		for (const content of files.values()) {
			const lines = content.split('\n');
			totalBlankLines += lines.filter((l) => !l.trim()).length;
			totalCommentLines += lines.filter((l) => l.trim().startsWith('//')).length;
		}

		return {
			testCoverage: {
				lines: 0,
				statements: 0,
				branches: 0,
				functions: 0,
				uncoveredFiles: [],
				totalTests: 0,
				passingTests: 0,
				failingTests: 0
			},
			typeSafety: {
				totalFiles: files.size,
				typedFiles: [...files.keys()].filter((p) => p.endsWith('.ts') || p.endsWith('.tsx')).length,
				jsFiles: [...files.keys()].filter((p) => p.endsWith('.js') || p.endsWith('.jsx')).length,
				anyTypeCount: issues.filter((i) => i.title.includes('any')).length,
				typeErrorCount: 0,
				strictMode: false,
				noImplicitAny: false,
				typeCheckPassed: true
			},
			quality: {
				avgFileSize: Math.floor(totalLines / files.size),
				largestFile: { path: 'unknown', lines: 0 },
				avgFunctionLength: 0,
				maxComplexity: 0,
				todoCount: 0,
				fixmeCount: 0,
				eslintErrors: 0,
				eslintWarnings: 0
			},
			size: {
				totalLines,
				codeLines: totalLines - totalBlankLines - totalCommentLines,
				commentLines: totalCommentLines,
				blankLines: totalBlankLines
			}
		};
	}

	private generateSummary(issues: DetectedIssue[]): {
		health: 'excellent' | 'good' | 'fair' | 'poor';
		score: number;
		highlights: string[];
		concerns: string[];
	} {
		const errors = issues.filter((i) => i.severity === 'error').length;
		const warnings = issues.filter((i) => i.severity === 'warning').length;
		const suggestions = issues.filter((i) => i.severity === 'info').length;

		let health: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
		if (errors > 0) health = 'poor';
		else if (warnings > 5) health = 'fair';
		else if (warnings > 0) health = 'good';

		const score = Math.max(0, 100 - errors * 10 - warnings * 3 - suggestions * 1);

		const highlights: string[] = [];
		const concerns: string[] = [];

		if (errors === 0 && warnings === 0) {
			highlights.push('No errors or warnings found');
		}
		if (errors === 0 && warnings > 0) {
			highlights.push('No critical errors');
		}

		if (errors > 0) {
			concerns.push(`${errors} error(s) need immediate attention`);
		}
		if (warnings > 5) {
			concerns.push(`${warnings} warnings should be addressed`);
		}

		const categories = new Set(issues.map((i) => i.category));
		if (categories.has('type-safety')) {
			concerns.push('Type safety issues detected');
		}
		if (categories.has('security')) {
			concerns.push('Security vulnerabilities found');
		}

		return {
			health,
			score,
			highlights,
			concerns
		};
	}
}

export const editorAnalyzer = new EditorAnalyzer();
