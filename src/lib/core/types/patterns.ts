/**
 * VF-310: Prompt Patterns Library - Type Definitions
 *
 * Comprehensive type system for reusable prompt patterns with:
 * - Pattern templates with variable extraction
 * - Categorization and tagging system
 * - Metadata tracking (author, usage stats, ratings)
 * - Import/export support
 */

/**
 * Pattern Category - High-level classification
 */
export type PatternCategory =
	| 'coding' // Code-related patterns (review, generation, refactoring)
	| 'writing' // Documentation, content creation, copywriting
	| 'analysis' // Bug analysis, performance analysis, security audit
	| 'debugging' // Debugging workflows, error investigation
	| 'refactoring' // Code improvement and refactoring
	| 'documentation' // Documentation generation
	| 'testing' // Test generation and QA
	| 'design' // Architecture and design review
	| 'planning' // Project planning and estimation
	| 'learning'; // Code explanation and learning

/**
 * Variable Definition - Template variable metadata
 */
export interface TemplateVariable {
	/** Variable name (matches {{name}} in template) */
	name: string;
	/** Human-readable label */
	label: string;
	/** Description of what this variable represents */
	description: string;
	/** Variable type for validation */
	type: 'string' | 'number' | 'boolean' | 'array' | 'code';
	/** Is this variable required? */
	required: boolean;
	/** Default value if not provided */
	defaultValue?: string;
	/** Placeholder text for input field */
	placeholder?: string;
	/** Example value for pattern preview */
	exampleValue?: string;
}

/**
 * Prompt Pattern - Reusable prompt template
 */
export interface PromptPattern {
	/** Unique pattern ID */
	id: string;
	/** Pattern name (e.g., "Code Review", "Bug Root Cause Analysis") */
	name: string;
	/** Short description of what this pattern does */
	description: string;
	/** Full prompt template with {{variable}} placeholders */
	template: string;
	/** Extracted variables from template */
	variables: TemplateVariable[];
	/** Primary category */
	category: PatternCategory;
	/** Additional tags for filtering (e.g., ["typescript", "react", "api"]) */
	tags: string[];
	/** Pattern author (username or "VibeForge" for built-in) */
	author: string;
	/** Expected output type/format */
	outputFormat?: 'markdown' | 'json' | 'code' | 'text';
	/** Recommended model(s) for this pattern */
	recommendedModels?: string[];
	/** Is this a built-in pattern? */
	isBuiltIn: boolean;
	/** Is this pattern publicly shared? */
	isPublic: boolean;
	/** Usage count (how many times used) */
	usageCount: number;
	/** Average rating (1-5 stars) */
	averageRating?: number;
	/** Number of ratings */
	ratingCount?: number;
	/** Creation timestamp */
	createdAt: string;
	/** Last updated timestamp */
	updatedAt: string;
	/** Version number (for updates) */
	version: number;
}

/**
 * Pattern Search Filters
 */
export interface PatternFilters {
	/** Search query (name, description, tags) */
	query?: string;
	/** Filter by category */
	category?: PatternCategory;
	/** Filter by tags (match any) */
	tags?: string[];
	/** Filter by author */
	author?: string;
	/** Only show built-in patterns */
	builtInOnly?: boolean;
	/** Only show public patterns */
	publicOnly?: boolean;
	/** Minimum rating */
	minRating?: number;
	/** Sort by field */
	sortBy?: 'name' | 'usage' | 'rating' | 'recent';
	/** Sort direction */
	sortDirection?: 'asc' | 'desc';
}

/**
 * Pattern Rating - User rating for a pattern
 */
export interface PatternRating {
	/** Rating ID */
	id: string;
	/** Pattern ID */
	patternId: string;
	/** User ID who rated */
	userId: string;
	/** Star rating (1-5) */
	stars: number;
	/** Optional review comment */
	comment?: string;
	/** Rating timestamp */
	createdAt: string;
}

/**
 * Pattern Export Format - For import/export
 */
export interface PatternExport {
	/** Pattern data */
	pattern: PromptPattern;
	/** Export timestamp */
	exportedAt: string;
	/** Export version (for compatibility) */
	exportVersion: '1.0';
}

/**
 * Pattern Collection - Grouped patterns
 */
export interface PatternCollection {
	/** Collection ID */
	id: string;
	/** Collection name */
	name: string;
	/** Collection description */
	description: string;
	/** Pattern IDs in this collection */
	patternIds: string[];
	/** Collection author */
	author: string;
	/** Is this collection public? */
	isPublic: boolean;
	/** Creation timestamp */
	createdAt: string;
	/** Last updated timestamp */
	updatedAt: string;
}

/**
 * VF-313: AI Pattern Suggestions Types
 */

/**
 * Pattern Intent - Detected intent from prompt text
 */
export type PatternIntent =
	| 'code_review' // Review code quality, best practices
	| 'bug_analysis' // Debug errors, find root causes
	| 'documentation' // Generate docs, README, changelog
	| 'testing' // Create tests, test scenarios
	| 'refactoring' // Improve code structure
	| 'api_design' // Design or review APIs
	| 'performance' // Performance analysis, optimization
	| 'security' // Security audit, vulnerability detection
	| 'planning' // Feature planning, task estimation
	| 'explanation' // Explain code, concepts
	| 'generation' // Generate new code
	| 'migration' // Migration planning
	| 'general'; // General purpose, no specific intent

/**
 * Pattern Suggestion - Suggested pattern with relevance score
 */
export interface PatternSuggestion {
	/** The suggested pattern */
	pattern: PromptPattern;
	/** Confidence score (0-100) */
	confidence: number;
	/** Detected intent that led to this suggestion */
	intent: PatternIntent;
	/** Reason for suggestion (for user transparency) */
	reason: string;
	/** Matching keywords that triggered this suggestion */
	matchingKeywords: string[];
}

/**
 * Pattern Usage Statistics - Track user behavior for learning
 */
export interface PatternUsageStats {
	/** Pattern ID */
	patternId: string;
	/** Total times suggested */
	suggestionCount: number;
	/** Times user accepted (clicked apply) */
	acceptCount: number;
	/** Times user rejected (dismissed) */
	rejectCount: number;
	/** Accept rate (acceptCount / suggestionCount) */
	acceptRate: number;
	/** Last suggested timestamp */
	lastSuggestedAt?: string;
	/** Last accepted timestamp */
	lastAcceptedAt?: string;
}

/**
 * Pattern Match Result - Full matching analysis
 */
export interface PatternMatchResult {
	/** Detected intent from prompt */
	detectedIntent: PatternIntent;
	/** Intent confidence (0-100) */
	intentConfidence: number;
	/** Extracted keywords from prompt */
	keywords: string[];
	/** All pattern suggestions (sorted by confidence) */
	suggestions: PatternSuggestion[];
	/** Analysis took this many milliseconds */
	analysisDurationMs: number;
}

/**
 * Helper function to extract variables from template
 * @param template Template string with {{variable}} syntax
 * @returns Array of variable names
 */
export function extractVariables(template: string): string[] {
	const regex = /\{\{([^}]+)\}\}/g;
	const matches = template.matchAll(regex);
	const variables = new Set<string>();

	for (const match of matches) {
		variables.add(match[1].trim());
	}

	return Array.from(variables);
}

/**
 * Helper function to substitute variables in template
 * @param template Template string with {{variable}} syntax
 * @param values Variable values map
 * @returns Rendered template with substituted values
 */
export function substituteVariables(
	template: string,
	values: Record<string, string>
): string {
	let result = template;

	for (const [key, value] of Object.entries(values)) {
		const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
		result = result.replace(regex, value);
	}

	return result;
}

/**
 * Helper function to validate pattern template
 * @param pattern Pattern to validate
 * @returns Validation errors (empty if valid)
 */
export function validatePattern(pattern: PromptPattern): string[] {
	const errors: string[] = [];

	if (!pattern.name || pattern.name.trim().length === 0) {
		errors.push('Pattern name is required');
	}

	if (!pattern.template || pattern.template.trim().length === 0) {
		errors.push('Pattern template is required');
	}

	if (!pattern.category) {
		errors.push('Pattern category is required');
	}

	// Check that all template variables have definitions
	const templateVars = extractVariables(pattern.template);
	const definedVars = new Set(pattern.variables.map((v) => v.name));

	for (const varName of templateVars) {
		if (!definedVars.has(varName)) {
			errors.push(`Template variable "${varName}" is not defined`);
		}
	}

	// Check that all defined variables are used in template
	for (const variable of pattern.variables) {
		if (!templateVars.includes(variable.name)) {
			errors.push(
				`Defined variable "${variable.name}" is not used in template`
			);
		}
	}

	return errors;
}

/**
 * Helper function to create a blank pattern
 * @returns New blank pattern with defaults
 */
export function createBlankPattern(): PromptPattern {
	return {
		id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		name: '',
		description: '',
		template: '',
		variables: [],
		category: 'coding',
		tags: [],
		author: '',
		isBuiltIn: false,
		isPublic: false,
		usageCount: 0,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		version: 1
	};
}
