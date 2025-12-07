/**
 * VF-311: Enhanced Template Processor
 *
 * Advanced template engine supporting:
 * - Variable substitution: {{variableName}}
 * - Filters: {{variable|filter:arg}}
 * - Conditionals: {{#if condition}}...{{else}}...{{/if}}
 * - Loops: {{#each items}}...{{/each}}
 * - Defaults: {{variable:defaultValue}}
 * - Nested structures
 */

import { applyFilters, parseFilter, type FilterFunction } from './filters';

/**
 * Template context for variable resolution
 */
export type TemplateContext = Record<string, any>;

/**
 * Template processor options
 */
export interface TemplateOptions {
	/** Custom filter registry */
	customFilters?: Record<string, FilterFunction>;
	/** Strict mode - throw on undefined variables */
	strict?: boolean;
	/** Default value for undefined variables */
	defaultValue?: string;
}

/**
 * Template AST node types
 */
type ASTNode =
	| { type: 'text'; value: string }
	| { type: 'variable'; name: string; filters: string[]; defaultValue?: string }
	| { type: 'if'; condition: string; thenBlock: ASTNode[]; elseBlock?: ASTNode[] }
	| { type: 'each'; variable: string; itemName: string; indexName?: string; block: ASTNode[] };

/**
 * Enhanced template processor
 */
export class EnhancedTemplateProcessor {
	private options: TemplateOptions;

	constructor(options: TemplateOptions = {}) {
		this.options = {
			strict: false,
			defaultValue: '',
			...options
		};
	}

	/**
	 * Render a template with context
	 * @param template Template string
	 * @param context Variable context
	 * @returns Rendered string
	 */
	render(template: string, context: TemplateContext = {}): string {
		const ast = this.parse(template);
		return this.renderAST(ast, context);
	}

	/**
	 * Parse template into AST
	 * @param template Template string
	 * @returns AST nodes
	 */
	private parse(template: string): ASTNode[] {
		const nodes: ASTNode[] = [];
		let current = 0;

		while (current < template.length) {
			// Check for block tags ({{#if}}, {{#each}})
			const blockMatch = template.slice(current).match(/^\{\{#(if|each)\s+([^}]+)\}\}/);
			if (blockMatch) {
				const [fullMatch, blockType, expression] = blockMatch;

				if (blockType === 'if') {
					const { thenBlock, elseBlock, endPos } = this.parseIfBlock(
						template,
						current + fullMatch.length,
						expression
					);
					nodes.push({
						type: 'if',
						condition: expression.trim(),
						thenBlock,
						elseBlock
					});
					current = endPos;
					continue;
				}

				if (blockType === 'each') {
					const { block, endPos, itemName, indexName } = this.parseEachBlock(
						template,
						current + fullMatch.length,
						expression
					);
					nodes.push({
						type: 'each',
						variable: expression.split(' ')[0].trim(),
						itemName,
						indexName,
						block
					});
					current = endPos;
					continue;
				}
			}

			// Check for variable tags ({{variable}} or {{variable|filter}})
			const varMatch = template.slice(current).match(/^\{\{([^#\/}][^}]*)\}\}/);
			if (varMatch) {
				const [fullMatch, expression] = varMatch;
				const { name, filters, defaultValue } = this.parseVariable(expression);
				nodes.push({
					type: 'variable',
					name,
					filters,
					defaultValue
				});
				current += fullMatch.length;
				continue;
			}

			// Text content
			const nextTag = template.slice(current).search(/\{\{/);
			if (nextTag === -1) {
				// No more tags, rest is text
				nodes.push({
					type: 'text',
					value: template.slice(current)
				});
				break;
			} else {
				// Text until next tag
				if (nextTag > 0) {
					nodes.push({
						type: 'text',
						value: template.slice(current, current + nextTag)
					});
				}
				current += nextTag;
			}
		}

		return nodes;
	}

	/**
	 * Parse if block
	 */
	private parseIfBlock(
		template: string,
		startPos: number,
		condition: string
	): { thenBlock: ASTNode[]; elseBlock?: ASTNode[]; endPos: number } {
		let current = startPos;
		let depth = 1;
		let elsePos: number | null = null;
		let endPos: number | null = null;

		while (current < template.length && depth > 0) {
			// Check for {{#if}} (nested)
			if (template.slice(current).startsWith('{{#if')) {
				depth++;
				current += 5;
				continue;
			}

			// Check for {{else}}
			if (depth === 1 && template.slice(current).startsWith('{{else}}')) {
				elsePos = current;
				current += 8; // length of {{else}}
				continue;
			}

			// Check for {{/if}}
			if (template.slice(current).startsWith('{{/if}}')) {
				depth--;
				if (depth === 0) {
					endPos = current + 7; // length of {{/if}}
					break;
				}
				current += 7;
				continue;
			}

			current++;
		}

		if (endPos === null) {
			throw new Error(`Unclosed {{#if}} block: ${condition}`);
		}

		const thenEnd = elsePos !== null ? elsePos : endPos - 7;
		const thenBlock = this.parse(template.slice(startPos, thenEnd));

		let elseBlock: ASTNode[] | undefined;
		if (elsePos !== null) {
			elseBlock = this.parse(template.slice(elsePos + 8, endPos - 7));
		}

		return { thenBlock, elseBlock, endPos };
	}

	/**
	 * Parse each block
	 */
	private parseEachBlock(
		template: string,
		startPos: number,
		expression: string
	): { block: ASTNode[]; endPos: number; itemName: string; indexName?: string } {
		// Parse expression: "items as item" or "items as item, index"
		const parts = expression.split(' as ');
		if (parts.length !== 2) {
			throw new Error(`Invalid {{#each}} expression: ${expression}`);
		}

		const itemParts = parts[1].split(',').map((s) => s.trim());
		const itemName = itemParts[0];
		const indexName = itemParts[1];

		let current = startPos;
		let depth = 1;
		let endPos: number | null = null;

		while (current < template.length && depth > 0) {
			// Check for {{#each}} (nested)
			if (template.slice(current).startsWith('{{#each')) {
				depth++;
				current += 7;
				continue;
			}

			// Check for {{/each}}
			if (template.slice(current).startsWith('{{/each}}')) {
				depth--;
				if (depth === 0) {
					endPos = current + 9; // length of {{/each}}
					break;
				}
				current += 9;
				continue;
			}

			current++;
		}

		if (endPos === null) {
			throw new Error(`Unclosed {{#each}} block: ${expression}`);
		}

		const block = this.parse(template.slice(startPos, endPos - 9));

		return { block, endPos, itemName, indexName };
	}

	/**
	 * Parse variable expression
	 * Examples:
	 * - "name" → { name: "name", filters: [], defaultValue: undefined }
	 * - "name|uppercase" → { name: "name", filters: ["uppercase"], defaultValue: undefined }
	 * - "name:John" → { name: "name", filters: [], defaultValue: "John" }
	 * - "name:Anonymous|uppercase" → { name: "name", filters: ["uppercase"], defaultValue: "Anonymous" }
	 */
	private parseVariable(expression: string): {
		name: string;
		filters: string[];
		defaultValue?: string;
	} {
		// Split by pipe for filters first
		const parts = expression.split('|').map((s) => s.trim());
		const nameAndDefault = parts[0];
		const filters = parts.slice(1).filter((f) => f.length > 0); // Filter out empty strings

		// Check for default value syntax in the name part: variable:default
		let name = nameAndDefault;
		let defaultValue: string | undefined;
		const colonIndex = nameAndDefault.indexOf(':');
		if (colonIndex !== -1) {
			name = nameAndDefault.substring(0, colonIndex).trim();
			defaultValue = nameAndDefault.substring(colonIndex + 1).trim();
		}

		return { name, filters, defaultValue };
	}

	/**
	 * Render AST nodes
	 */
	private renderAST(nodes: ASTNode[], context: TemplateContext): string {
		return nodes.map((node) => this.renderNode(node, context)).join('');
	}

	/**
	 * Render single AST node
	 */
	private renderNode(node: ASTNode, context: TemplateContext): string {
		switch (node.type) {
			case 'text':
				return node.value;

			case 'variable': {
				let value = this.resolveVariable(node.name, context);

				// Apply default value if undefined
				if (value === undefined || value === null) {
					if (node.defaultValue !== undefined) {
						value = node.defaultValue;
					} else if (!this.options.strict) {
						value = this.options.defaultValue || '';
					} else {
						throw new Error(`Undefined variable: ${node.name}`);
					}
				}

				// Apply filters (skip empty filter names)
				if (node.filters.length > 0) {
					const validFilters = node.filters.filter((f) => f.trim().length > 0);
					if (validFilters.length > 0) {
						value = applyFilters(value, validFilters, this.options.customFilters);
					}
				}

				return String(value);
			}

			case 'if': {
				const conditionResult = this.evaluateCondition(node.condition, context);
				if (conditionResult) {
					return this.renderAST(node.thenBlock, context);
				} else if (node.elseBlock) {
					return this.renderAST(node.elseBlock, context);
				}
				return '';
			}

			case 'each': {
				const items = this.resolveVariable(node.variable, context);
				if (!Array.isArray(items)) {
					if (this.options.strict) {
						throw new Error(`{{#each}} requires an array: ${node.variable}`);
					}
					return '';
				}

				return items
					.map((item, index) => {
						const loopContext = {
							...context,
							[node.itemName]: item
						};
						if (node.indexName) {
							loopContext[node.indexName] = index;
						}
						return this.renderAST(node.block, loopContext);
					})
					.join('');
			}

			default:
				return '';
		}
	}

	/**
	 * Resolve variable from context (supports dot notation)
	 * Examples: "user.name", "items.0.title"
	 */
	private resolveVariable(path: string, context: TemplateContext): any {
		const parts = path.split('.');
		let value: any = context;

		for (const part of parts) {
			if (value === null || value === undefined) {
				return undefined;
			}
			value = value[part];
		}

		return value;
	}

	/**
	 * Evaluate condition
	 * Supports:
	 * - Variable existence: "user"
	 * - Equality: "status == 'active'"
	 * - Inequality: "count != 0"
	 * - Comparison: "age > 18", "score >= 80"
	 * - Negation: "!isDeleted"
	 */
	private evaluateCondition(condition: string, context: TemplateContext): boolean {
		condition = condition.trim();

		// Negation
		if (condition.startsWith('!')) {
			return !this.evaluateCondition(condition.slice(1), context);
		}

		// Comparison operators
		const comparisonMatch = condition.match(/^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
		if (comparisonMatch) {
			const [, left, operator, right] = comparisonMatch;
			const leftValue = this.evaluateExpression(left.trim(), context);
			const rightValue = this.evaluateExpression(right.trim(), context);

			switch (operator) {
				case '==':
					return leftValue == rightValue;
				case '!=':
					return leftValue != rightValue;
				case '>':
					return leftValue > rightValue;
				case '<':
					return leftValue < rightValue;
				case '>=':
					return leftValue >= rightValue;
				case '<=':
					return leftValue <= rightValue;
				default:
					return false;
			}
		}

		// Simple variable existence check (truthy)
		const value = this.resolveVariable(condition, context);
		return Boolean(value);
	}

	/**
	 * Evaluate expression (variable or literal)
	 */
	private evaluateExpression(expr: string, context: TemplateContext): any {
		// String literal
		if (expr.startsWith("'") || expr.startsWith('"')) {
			return expr.slice(1, -1);
		}

		// Number literal
		const num = Number(expr);
		if (!isNaN(num)) {
			return num;
		}

		// Boolean literal
		if (expr === 'true') return true;
		if (expr === 'false') return false;
		if (expr === 'null') return null;
		if (expr === 'undefined') return undefined;

		// Variable
		return this.resolveVariable(expr, context);
	}
}

/**
 * Convenience function to render a template
 * @param template Template string
 * @param context Variable context
 * @param options Template options
 * @returns Rendered string
 */
export function renderTemplate(
	template: string,
	context: TemplateContext = {},
	options: TemplateOptions = {}
): string {
	const processor = new EnhancedTemplateProcessor(options);
	return processor.render(template, context);
}

/**
 * Validate template syntax
 * @param template Template string
 * @returns Validation errors (empty if valid)
 */
export function validateTemplate(template: string): string[] {
	const errors: string[] = [];

	// Check for unclosed tags first (more specific errors)
	const openIfs = (template.match(/\{\{#if/g) || []).length;
	const closeIfs = (template.match(/\{\{\/if\}\}/g) || []).length;
	if (openIfs !== closeIfs) {
		errors.push(`Mismatched {{#if}} blocks: ${openIfs} open, ${closeIfs} close`);
	}

	const openEachs = (template.match(/\{\{#each/g) || []).length;
	const closeEachs = (template.match(/\{\{\/each\}\}/g) || []).length;
	if (openEachs !== closeEachs) {
		errors.push(`Mismatched {{#each}} blocks: ${openEachs} open, ${closeEachs} close`);
	}

	// Try to parse template (catch other errors)
	if (errors.length === 0) {
		try {
			const processor = new EnhancedTemplateProcessor();
			processor.render(template, {}); // Dry run with empty context
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			// Don't duplicate mismatch errors
			if (!message.includes('Unclosed')) {
				errors.push(message);
			}
		}
	}

	return errors;
}

/**
 * Extract all variables used in template (including nested paths)
 * @param template Template string
 * @returns Array of variable names
 */
export function extractTemplateVariables(template: string): string[] {
	const variables = new Set<string>();

	// Extract from {{variable}} tags
	const varRegex = /\{\{([^#\/}][^}]*)\}\}/g;
	let match;
	while ((match = varRegex.exec(template)) !== null) {
		const expression = match[1].trim();
		// Remove filters and defaults
		const varName = expression.split('|')[0].split(':')[0].trim();
		if (varName) {
			variables.add(varName);
		}
	}

	// Extract from {{#if condition}} blocks
	const ifRegex = /\{\{#if\s+([^}]+)\}\}/g;
	while ((match = ifRegex.exec(template)) !== null) {
		const condition = match[1].trim();
		// Extract variable from condition (simple cases)
		const condVar = condition.split(/\s+/)[0].replace('!', '');
		if (condVar && !['true', 'false', 'null', 'undefined'].includes(condVar)) {
			variables.add(condVar);
		}
	}

	// Extract from {{#each variable as item}} blocks
	const eachRegex = /\{\{#each\s+(\w+)/g;
	while ((match = eachRegex.exec(template)) !== null) {
		variables.add(match[1]);
	}

	return Array.from(variables);
}
