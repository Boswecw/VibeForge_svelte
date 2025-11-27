/**
 * ArchitectureDetector - Detects architectural and structural code issues
 *
 * Detects:
 * - Excessive function complexity (cyclomatic complexity)
 * - Deep nesting levels
 * - God classes/functions (too many responsibilities)
 * - Long parameter lists
 * - Callback hell
 */

import type { DetectedIssue } from '../types/analysis';

export class ArchitectureDetector {
	/**
	 * Detect all architecture issues in code
	 */
	detectIssues(content: string, filename: string, language: string): DetectedIssue[] {
		const issues: DetectedIssue[] = [];

		issues.push(...this.detectComplexity(content, filename, language));
		issues.push(...this.detectDeepNesting(content, filename, language));
		issues.push(...this.detectGodFunctions(content, filename, language));
		issues.push(...this.detectLongParameterLists(content, filename, language));
		issues.push(...this.detectCallbackHell(content, filename, language));

		return issues;
	}

	/**
	 * Detect functions with high cyclomatic complexity
	 */
	private detectComplexity(content: string, filename: string, language: string): DetectedIssue[] {
		const issues: DetectedIssue[] = [];

		if (!['javascript', 'typescript'].includes(language)) {
			return issues;
		}

		const lines = content.split('\n');
		const functionPattern = /(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|(?:async\s+)?function\s*\()/;

		let currentFunction: { name: string; startLine: number; complexity: number } | null = null;
		let braceDepth = 0;

		lines.forEach((line, index) => {
			const trimmed = line.trim();

			// Start of function
			if (functionPattern.test(trimmed) && !currentFunction) {
				const match = trimmed.match(/(?:function\s+(\w+)|const\s+(\w+))/);
				currentFunction = {
					name: match?.[1] || match?.[2] || 'anonymous',
					startLine: index + 1,
					complexity: 1 // Base complexity
				};
				braceDepth = 0;
			}

			if (currentFunction) {
				// Count decision points
				const decisions = [
					/\bif\s*\(/g,
					/\belse\s+if\s*\(/g,
					/\bfor\s*\(/g,
					/\bwhile\s*\(/g,
					/\bcase\s+/g,
					/\bcatch\s*\(/g,
					/&&/g,
					/\|\|/g,
					/\?/g // Ternary
				];

				decisions.forEach(pattern => {
					const matches = trimmed.match(pattern);
					if (matches) {
						currentFunction!.complexity += matches.length;
					}
				});

				// Track brace depth
				braceDepth += (trimmed.match(/{/g) || []).length;
				braceDepth -= (trimmed.match(/}/g) || []).length;

				// End of function
				if (braceDepth === 0 && trimmed.includes('}')) {
					if (currentFunction.complexity > 10) {
						issues.push({
							id: `complexity-${filename}-${currentFunction.startLine}`,
							severity: currentFunction.complexity > 15 ? 'warning' : 'info',
							category: 'architecture',
							title: `Function "${currentFunction.name}" has high complexity (${currentFunction.complexity})`,
							description: `Cyclomatic complexity of ${currentFunction.complexity} exceeds recommended threshold of 10. Consider refactoring into smaller functions.`,
							files: [filename],
							lineNumbers: [currentFunction.startLine],
							suggestion: 'Extract logical blocks into separate, well-named functions',
							autoFixable: false
						});
					}
					currentFunction = null;
				}
			}
		});

		return issues;
	}

	/**
	 * Detect deeply nested code blocks
	 */
	private detectDeepNesting(content: string, filename: string, language: string): DetectedIssue[] {
		const issues: DetectedIssue[] = [];
		const MAX_NESTING = 4;

		const lines = content.split('\n');
		let currentDepth = 0;
		const deeplyNestedLines: number[] = [];

		lines.forEach((line, index) => {
			const trimmed = line.trim();

			// Increase depth on opening braces
			const openBraces = (trimmed.match(/{/g) || []).length;
			const closeBraces = (trimmed.match(/}/g) || []).length;

			currentDepth += openBraces;

			if (currentDepth > MAX_NESTING) {
				deeplyNestedLines.push(index + 1);
			}

			currentDepth -= closeBraces;
			currentDepth = Math.max(0, currentDepth); // Prevent negative
		});

		if (deeplyNestedLines.length > 0) {
			issues.push({
				id: `deep-nesting-${filename}`,
				severity: 'warning',
				category: 'architecture',
				title: `${deeplyNestedLines.length} line(s) with excessive nesting (>${MAX_NESTING} levels)`,
				description: 'Deep nesting reduces readability and increases cognitive load',
				files: [filename],
				lineNumbers: deeplyNestedLines.slice(0, 10), // Limit to first 10
				suggestion: 'Use early returns, extract functions, or flatten conditions',
				autoFixable: false
			});
		}

		return issues;
	}

	/**
	 * Detect god functions (functions that do too much)
	 */
	private detectGodFunctions(content: string, filename: string, language: string): DetectedIssue[] {
		const issues: DetectedIssue[] = [];
		const MAX_LINES = 50;

		if (!['javascript', 'typescript', 'python'].includes(language)) {
			return issues;
		}

		const lines = content.split('\n');
		const functionPattern = language === 'python'
			? /^def\s+(\w+)\s*\(/
			: /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\()/;

		let currentFunction: { name: string; startLine: number; lineCount: number } | null = null;
		let braceDepth = 0;

		lines.forEach((line, index) => {
			const trimmed = line.trim();

			if (functionPattern.test(trimmed)) {
				const match = trimmed.match(functionPattern);
				currentFunction = {
					name: match?.[1] || match?.[2] || 'anonymous',
					startLine: index + 1,
					lineCount: 0
				};
				braceDepth = 0;
			}

			if (currentFunction) {
				currentFunction.lineCount++;

				braceDepth += (trimmed.match(/{/g) || []).length;
				braceDepth -= (trimmed.match(/}/g) || []).length;

				if (braceDepth === 0 && (trimmed.includes('}') || (language === 'python' && trimmed === ''))) {
					if (currentFunction.lineCount > MAX_LINES) {
						issues.push({
							id: `god-function-${filename}-${currentFunction.startLine}`,
							severity: 'warning',
							category: 'architecture',
							title: `Function "${currentFunction.name}" is too long (${currentFunction.lineCount} lines)`,
							description: `Functions longer than ${MAX_LINES} lines are harder to understand and maintain`,
							files: [filename],
							lineNumbers: [currentFunction.startLine],
							suggestion: 'Break into smaller, focused functions following Single Responsibility Principle',
							autoFixable: false
						});
					}
					currentFunction = null;
				}
			}
		});

		return issues;
	}

	/**
	 * Detect functions with too many parameters
	 */
	private detectLongParameterLists(content: string, filename: string, language: string): DetectedIssue[] {
		const issues: DetectedIssue[] = [];
		const MAX_PARAMS = 5;

		const functionPattern = language === 'python'
			? /def\s+(\w+)\s*\(([^)]*)\)/g
			: /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\))/g;

		const lines = content.split('\n');
		lines.forEach((line, index) => {
			const matches = [...line.matchAll(functionPattern)];

			matches.forEach(match => {
				const functionName = match[1] || match[2] || 'anonymous';
				const params = match[language === 'python' ? 2 : 3] || '';
				const paramCount = params.split(',').filter(p => p.trim()).length;

				if (paramCount > MAX_PARAMS) {
					issues.push({
						id: `long-params-${filename}-${index}`,
						severity: 'info',
						category: 'architecture',
						title: `Function "${functionName}" has ${paramCount} parameters`,
						description: `Functions with more than ${MAX_PARAMS} parameters are harder to use and test`,
						files: [filename],
						lineNumbers: [index + 1],
						suggestion: 'Use an options object or split into multiple functions',
						autoFixable: false
					});
				}
			});
		});

		return issues;
	}

	/**
	 * Detect callback hell / promise chains
	 */
	private detectCallbackHell(content: string, filename: string, language: string): DetectedIssue[] {
		const issues: DetectedIssue[] = [];

		if (!['javascript', 'typescript'].includes(language)) {
			return issues;
		}

		const lines = content.split('\n');
		const callbackPattern = /\.then\s*\(/g;

		lines.forEach((line, index) => {
			const thenCount = (line.match(callbackPattern) || []).length;

			if (thenCount >= 3) {
				issues.push({
					id: `callback-hell-${filename}-${index}`,
					severity: 'warning',
					category: 'architecture',
					title: 'Promise chain may be difficult to follow',
					description: 'Long promise chains can be hard to read and debug',
					files: [filename],
					lineNumbers: [index + 1],
					suggestion: 'Consider using async/await syntax for better readability',
					autoFixable: false
				});
			}
		});

		// Detect nested callbacks (callback hell)
		let callbackDepth = 0;
		lines.forEach((line, index) => {
			if (/\bfunction\s*\(/.test(line) || /\(.*\)\s*=>/.test(line)) {
				callbackDepth++;
				if (callbackDepth >= 3) {
					issues.push({
						id: `nested-callback-${filename}-${index}`,
						severity: 'warning',
						category: 'architecture',
						title: 'Deeply nested callbacks detected',
						description: 'Callback hell makes code hard to read and maintain',
						files: [filename],
						lineNumbers: [index + 1],
						suggestion: 'Refactor to use async/await or extract functions',
						autoFixable: false
					});
				}
			}
			if (line.trim() === '}' || line.trim() === '});') {
				callbackDepth = Math.max(0, callbackDepth - 1);
			}
		});

		return issues;
	}
}

export const architectureDetector = new ArchitectureDetector();
