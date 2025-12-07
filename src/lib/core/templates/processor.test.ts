/**
 * VF-311: Enhanced Template Processor Tests
 */

import { describe, it, expect } from 'vitest';
import {
	EnhancedTemplateProcessor,
	renderTemplate,
	validateTemplate,
	extractTemplateVariables
} from './processor';

describe('EnhancedTemplateProcessor', () => {
	describe('Basic variable substitution', () => {
		it('should substitute simple variables', () => {
			const template = 'Hello, {{name}}!';
			const context = { name: 'World' };
			const result = renderTemplate(template, context);
			expect(result).toBe('Hello, World!');
		});

		it('should handle multiple variables', () => {
			const template = '{{greeting}}, {{name}}! You are {{age}} years old.';
			const context = { greeting: 'Hello', name: 'Alice', age: 30 };
			const result = renderTemplate(template, context);
			expect(result).toBe('Hello, Alice! You are 30 years old.');
		});

		it('should handle dot notation for nested objects', () => {
			const template = 'User: {{user.name}}, Email: {{user.email}}';
			const context = {
				user: {
					name: 'Bob',
					email: 'bob@example.com'
				}
			};
			const result = renderTemplate(template, context);
			expect(result).toBe('User: Bob, Email: bob@example.com');
		});

		it('should use default value for undefined variables', () => {
			const template = 'Hello, {{name}}!';
			const context = {};
			const result = renderTemplate(template, context, { defaultValue: 'Guest' });
			expect(result).toBe('Hello, Guest!');
		});

		it('should throw in strict mode for undefined variables', () => {
			const template = 'Hello, {{name}}!';
			const context = {};
			expect(() => {
				renderTemplate(template, context, { strict: true });
			}).toThrow('Undefined variable: name');
		});
	});

	describe('Default value syntax', () => {
		it('should use inline default value', () => {
			const template = 'Hello, {{name:Anonymous}}!';
			const context = {};
			const result = renderTemplate(template, context);
			expect(result).toBe('Hello, Anonymous!');
		});

		it('should prefer actual value over default', () => {
			const template = 'Hello, {{name:Anonymous}}!';
			const context = { name: 'Alice' };
			const result = renderTemplate(template, context);
			expect(result).toBe('Hello, Alice!');
		});

		it('should use inline default with filters', () => {
			const template = 'Hello, {{name:guest|uppercase}}!';
			const context = {};
			const result = renderTemplate(template, context);
			expect(result).toBe('Hello, GUEST!');
		});
	});

	describe('Filters', () => {
		it('should apply single filter', () => {
			const template = '{{name|uppercase}}';
			const context = { name: 'alice' };
			const result = renderTemplate(template, context);
			expect(result).toBe('ALICE');
		});

		it('should apply multiple filters (chaining)', () => {
			const template = '{{text|uppercase|truncate:5}}';
			const context = { text: 'hello world' };
			const result = renderTemplate(template, context);
			expect(result).toBe('HELLO...');
		});

		it('should apply filters with arguments', () => {
			const template = '{{name|prepend:"Mr. "}}';
			const context = { name: 'Smith' };
			const result = renderTemplate(template, context);
			expect(result).toBe('Mr. Smith');
		});

		it('should apply numeric filters', () => {
			const template = 'Price: {{price|currency:"USD"}}';
			const context = { price: 19.99 };
			const result = renderTemplate(template, context);
			expect(result).toContain('19.99'); // Contains because currency format varies by locale
		});

		it('should use custom filters', () => {
			const template = '{{name|shout}}';
			const context = { name: 'hello' };
			const customFilters = {
				shout: (value: string) => value.toUpperCase() + '!!!'
			};
			const result = renderTemplate(template, context, { customFilters });
			expect(result).toBe('HELLO!!!');
		});
	});

	describe('Conditional blocks', () => {
		it('should render then block when condition is true', () => {
			const template = '{{#if isActive}}Active{{/if}}';
			const context = { isActive: true };
			const result = renderTemplate(template, context);
			expect(result).toBe('Active');
		});

		it('should not render then block when condition is false', () => {
			const template = '{{#if isActive}}Active{{/if}}';
			const context = { isActive: false };
			const result = renderTemplate(template, context);
			expect(result).toBe('');
		});

		it('should render else block when condition is false', () => {
			const template = '{{#if isActive}}Active{{else}}Inactive{{/if}}';
			const context = { isActive: false };
			const result = renderTemplate(template, context);
			expect(result).toBe('Inactive');
		});

		it('should handle equality comparison', () => {
			const template = '{{#if status == "active"}}OK{{/if}}';
			const context = { status: 'active' };
			const result = renderTemplate(template, context);
			expect(result).toBe('OK');
		});

		it('should handle inequality comparison', () => {
			const template = '{{#if count != 0}}Has items{{/if}}';
			const context = { count: 5 };
			const result = renderTemplate(template, context);
			expect(result).toBe('Has items');
		});

		it('should handle greater than comparison', () => {
			const template = '{{#if age > 18}}Adult{{else}}Minor{{/if}}';
			const context = { age: 25 };
			const result = renderTemplate(template, context);
			expect(result).toBe('Adult');
		});

		it('should handle negation', () => {
			const template = '{{#if !isDeleted}}Visible{{/if}}';
			const context = { isDeleted: false };
			const result = renderTemplate(template, context);
			expect(result).toBe('Visible');
		});

		it('should handle nested conditionals', () => {
			const template = '{{#if user}}{{#if user.isAdmin}}Admin{{else}}User{{/if}}{{/if}}';
			const context = { user: { isAdmin: true } };
			const result = renderTemplate(template, context);
			expect(result).toBe('Admin');
		});
	});

	describe('Loop blocks', () => {
		it('should loop over array items', () => {
			const template = '{{#each items as item}}{{item}} {{/each}}';
			const context = { items: ['a', 'b', 'c'] };
			const result = renderTemplate(template, context);
			expect(result).toBe('a b c ');
		});

		it('should access item properties in loop', () => {
			const template = '{{#each users as user}}{{user.name}} {{/each}}';
			const context = {
				users: [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }]
			};
			const result = renderTemplate(template, context);
			expect(result).toBe('Alice Bob Charlie ');
		});

		it('should provide index in loop', () => {
			const template = '{{#each items as item, i}}{{i}}:{{item}} {{/each}}';
			const context = { items: ['x', 'y', 'z'] };
			const result = renderTemplate(template, context);
			expect(result).toBe('0:x 1:y 2:z ');
		});

		it('should handle nested loops', () => {
			const template = '{{#each groups as group}}{{#each group as item}}{{item}}{{/each}} {{/each}}';
			const context = {
				groups: [
					['a', 'b'],
					['c', 'd']
				]
			};
			const result = renderTemplate(template, context);
			expect(result).toBe('ab cd ');
		});

		it('should handle empty arrays', () => {
			const template = '{{#each items as item}}{{item}}{{/each}}Empty';
			const context = { items: [] };
			const result = renderTemplate(template, context);
			expect(result).toBe('Empty');
		});

		it('should apply filters inside loops', () => {
			const template = '{{#each names as name}}{{name|uppercase}} {{/each}}';
			const context = { names: ['alice', 'bob'] };
			const result = renderTemplate(template, context);
			expect(result).toBe('ALICE BOB ');
		});
	});

	describe('Complex templates', () => {
		it('should handle combination of features', () => {
			const template = `
Hello, {{name|capitalize}}!

{{#if items}}
Your items:
{{#each items as item, i}}
  {{i}}. {{item.name}} - {{item.price|currency:"USD"}}
{{/each}}
{{else}}
No items found.
{{/if}}
			`.trim();

			const context = {
				name: 'john',
				items: [
					{ name: 'Book', price: 12.99 },
					{ name: 'Pen', price: 2.5 }
				]
			};

			const result = renderTemplate(template, context);
			expect(result).toContain('Hello, John!');
			expect(result).toContain('Your items:');
			expect(result).toContain('0. Book');
			expect(result).toContain('1. Pen');
		});

		it('should handle deeply nested structures', () => {
			const template = '{{user.profile.address.city}}';
			const context = {
				user: {
					profile: {
						address: {
							city: 'New York'
						}
					}
				}
			};
			const result = renderTemplate(template, context);
			expect(result).toBe('New York');
		});
	});

	describe('Template validation', () => {
		it('should validate correct templates', () => {
			const template = '{{name}}';
			const errors = validateTemplate(template);
			expect(errors).toHaveLength(0);
		});

		it('should detect unclosed if blocks', () => {
			const template = '{{#if condition}}text';
			const errors = validateTemplate(template);
			expect(errors.length).toBeGreaterThan(0);
			expect(errors[0]).toContain('Mismatched {{#if}} blocks');
		});

		it('should detect unclosed each blocks', () => {
			const template = '{{#each items as item}}text';
			const errors = validateTemplate(template);
			expect(errors.length).toBeGreaterThan(0);
			expect(errors[0]).toContain('Mismatched {{#each}} blocks');
		});

		it('should validate complex templates', () => {
			const template = '{{#if a}}{{#each b as c}}{{c}}{{/each}}{{/if}}';
			const errors = validateTemplate(template);
			expect(errors).toHaveLength(0);
		});
	});

	describe('Variable extraction', () => {
		it('should extract simple variables', () => {
			const template = 'Hello, {{name}}!';
			const variables = extractTemplateVariables(template);
			expect(variables).toContain('name');
		});

		it('should extract multiple variables', () => {
			const template = '{{greeting}}, {{name}}! You are {{age}}.';
			const variables = extractTemplateVariables(template);
			expect(variables).toContain('greeting');
			expect(variables).toContain('name');
			expect(variables).toContain('age');
		});

		it('should extract variables from conditionals', () => {
			const template = '{{#if isActive}}Yes{{/if}}';
			const variables = extractTemplateVariables(template);
			expect(variables).toContain('isActive');
		});

		it('should extract variables from loops', () => {
			const template = '{{#each items as item}}{{item}}{{/each}}';
			const variables = extractTemplateVariables(template);
			expect(variables).toContain('items');
		});

		it('should not duplicate variables', () => {
			const template = '{{name}} {{name}} {{name}}';
			const variables = extractTemplateVariables(template);
			expect(variables.filter((v) => v === 'name')).toHaveLength(1);
		});

		it('should strip filters when extracting', () => {
			const template = '{{name|uppercase}}';
			const variables = extractTemplateVariables(template);
			expect(variables).toContain('name');
			expect(variables).not.toContain('name|uppercase');
		});

		it('should strip default values when extracting', () => {
			const template = '{{name:Anonymous}}';
			const variables = extractTemplateVariables(template);
			expect(variables).toContain('name');
			expect(variables).not.toContain('name:Anonymous');
		});
	});

	describe('Error handling', () => {
		it('should handle malformed filter syntax gracefully', () => {
			const template = '{{name|}}';
			const context = { name: 'test' };
			// Should not throw, just handle gracefully
			const result = renderTemplate(template, context);
			expect(result).toBeTruthy();
		});

		it('should throw on unknown filter', () => {
			const template = '{{name|unknownfilter}}';
			const context = { name: 'test' };
			expect(() => {
				renderTemplate(template, context);
			}).toThrow('Unknown filter: unknownfilter');
		});

		it('should handle null values', () => {
			const template = '{{value}}';
			const context = { value: null };
			const result = renderTemplate(template, context);
			expect(result).toBe('');
		});

		it('should handle undefined nested paths', () => {
			const template = '{{user.profile.name}}';
			const context = { user: {} };
			const result = renderTemplate(template, context);
			expect(result).toBe('');
		});
	});

	describe('Edge cases', () => {
		it('should handle empty template', () => {
			const result = renderTemplate('', {});
			expect(result).toBe('');
		});

		it('should handle template with no variables', () => {
			const result = renderTemplate('Just plain text', {});
			expect(result).toBe('Just plain text');
		});

		it('should handle whitespace in variable names', () => {
			const template = '{{ name }}';
			const context = { name: 'Alice' };
			const result = renderTemplate(template, context);
			expect(result).toBe('Alice');
		});

		it('should preserve newlines and whitespace', () => {
			const template = 'Line 1\n{{name}}\nLine 3';
			const context = { name: 'Line 2' };
			const result = renderTemplate(template, context);
			expect(result).toBe('Line 1\nLine 2\nLine 3');
		});

		it('should handle special characters in text', () => {
			const template = 'Symbols: !@#$%^&*() {{name}}';
			const context = { name: 'test' };
			const result = renderTemplate(template, context);
			expect(result).toBe('Symbols: !@#$%^&*() test');
		});
	});
});
