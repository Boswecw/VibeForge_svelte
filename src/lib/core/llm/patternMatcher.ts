/**
 * VF-313: AI Pattern Suggestions - Pattern Matcher Service
 *
 * Analyzes prompt text to suggest relevant patterns with confidence scores.
 *
 * Algorithm:
 * 1. Extract keywords from prompt text
 * 2. Classify intent based on keywords and patterns
 * 3. Match patterns against detected intent and keywords
 * 4. Rank patterns by relevance score
 * 5. Return top 3-5 suggestions with confidence scores
 */

import type {
	PromptPattern,
	PatternIntent,
	PatternSuggestion,
	PatternMatchResult,
	PatternUsageStats
} from '$lib/core/types';

/**
 * Stop words to exclude from keyword extraction
 */
const STOP_WORDS = new Set([
	'the',
	'a',
	'an',
	'and',
	'or',
	'but',
	'in',
	'on',
	'at',
	'to',
	'for',
	'of',
	'with',
	'by',
	'from',
	'as',
	'is',
	'are',
	'was',
	'were',
	'be',
	'been',
	'being',
	'have',
	'has',
	'had',
	'do',
	'does',
	'did',
	'will',
	'would',
	'should',
	'could',
	'may',
	'might',
	'can',
	'this',
	'that',
	'these',
	'those',
	'i',
	'you',
	'he',
	'she',
	'it',
	'we',
	'they',
	'me',
	'him',
	'her',
	'us',
	'them',
	'my',
	'your',
	'his',
	'our',
	'their',
	'what',
	'which',
	'who',
	'when',
	'where',
	'why',
	'how'
]);

/**
 * Intent detection patterns - keywords that indicate specific intents
 */
const INTENT_PATTERNS: Record<PatternIntent, string[]> = {
	code_review: [
		'review',
		'check',
		'analyze',
		'quality',
		'best practices',
		'improvements',
		'suggestions',
		'feedback',
		'critique'
	],
	bug_analysis: [
		'bug',
		'error',
		'issue',
		'problem',
		'fix',
		'debug',
		'broken',
		'not working',
		'crash',
		'exception',
		'traceback',
		'stacktrace'
	],
	documentation: [
		'document',
		'docs',
		'readme',
		'changelog',
		'comment',
		'docstring',
		'explain',
		'describe',
		'instructions'
	],
	testing: [
		'test',
		'testing',
		'unit test',
		'e2e',
		'integration test',
		'spec',
		'assertion',
		'coverage'
	],
	refactoring: [
		'refactor',
		'improve',
		'clean up',
		'optimize',
		'restructure',
		'simplify',
		'rewrite'
	],
	api_design: [
		'api',
		'endpoint',
		'route',
		'rest',
		'graphql',
		'swagger',
		'openapi',
		'schema'
	],
	performance: [
		'performance',
		'slow',
		'fast',
		'optimize',
		'speed',
		'efficiency',
		'bottleneck',
		'latency'
	],
	security: [
		'security',
		'vulnerability',
		'exploit',
		'attack',
		'injection',
		'xss',
		'csrf',
		'auth',
		'authentication'
	],
	planning: [
		'plan',
		'estimate',
		'schedule',
		'timeline',
		'roadmap',
		'tasks',
		'breakdown'
	],
	explanation: [
		'explain',
		'how does',
		'what is',
		'why',
		'understand',
		'learn',
		'teach'
	],
	generation: [
		'generate',
		'create',
		'build',
		'write',
		'implement',
		'make',
		'develop'
	],
	migration: ['migrate', 'upgrade', 'port', 'convert', 'transition'],
	general: []
};

/**
 * Pattern Matcher Service
 */
export class PatternMatcher {
	private usageStats: Map<string, PatternUsageStats> = new Map();

	/**
	 * Load usage stats from localStorage
	 */
	constructor() {
		this.loadUsageStats();
	}

	/**
	 * Analyze prompt text and suggest relevant patterns
	 * @param promptText User's prompt text
	 * @param availablePatterns All available patterns to match against
	 * @param limit Maximum number of suggestions to return (default: 5)
	 * @returns Pattern match result with suggestions
	 */
	analyzePrompt(
		promptText: string,
		availablePatterns: PromptPattern[],
		limit: number = 5
	): PatternMatchResult {
		const startTime = performance.now();

		// 1. Extract keywords
		const keywords = this.extractKeywords(promptText);

		// 2. Classify intent
		const { intent, confidence } = this.classifyIntent(promptText, keywords);

		// 3. Match patterns
		const suggestions = this.matchPatterns(
			promptText,
			keywords,
			intent,
			availablePatterns,
			limit
		);

		const analysisDurationMs = Math.max(1, Math.round(performance.now() - startTime));

		return {
			detectedIntent: intent,
			intentConfidence: confidence,
			keywords,
			suggestions,
			analysisDurationMs
		};
	}

	/**
	 * Extract meaningful keywords from prompt text
	 * @param text Prompt text
	 * @returns Array of keywords
	 */
	private extractKeywords(text: string): string[] {
		// Normalize: lowercase, remove punctuation
		const normalized = text
			.toLowerCase()
			.replace(/[^\w\s]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

		// Split into words
		const words = normalized.split(' ');

		// Filter stop words and short words
		const keywords = words.filter((word) => {
			return word.length > 2 && !STOP_WORDS.has(word);
		});

		// Remove duplicates and return
		return Array.from(new Set(keywords));
	}

	/**
	 * Classify user intent based on keywords and patterns
	 * @param text Prompt text
	 * @param keywords Extracted keywords
	 * @returns Detected intent and confidence score
	 */
	private classifyIntent(
		text: string,
		keywords: string[]
	): { intent: PatternIntent; confidence: number } {
		const textLower = text.toLowerCase();
		const scores: Record<PatternIntent, number> = {
			code_review: 0,
			bug_analysis: 0,
			documentation: 0,
			testing: 0,
			refactoring: 0,
			api_design: 0,
			performance: 0,
			security: 0,
			planning: 0,
			explanation: 0,
			generation: 0,
			migration: 0,
			general: 0
		};

		// Score each intent based on keyword matches
		for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
			for (const pattern of patterns) {
				// Check if pattern appears in text
				if (textLower.includes(pattern.toLowerCase())) {
					scores[intent as PatternIntent] += 2; // Full phrase match = 2 points
				}

				// Check if pattern words appear in keywords
				const patternWords = pattern.toLowerCase().split(' ');
				const matchingWords = patternWords.filter((word) => keywords.includes(word));
				scores[intent as PatternIntent] += matchingWords.length; // 1 point per word
			}
		}

		// Apply intent priority: domain-specific intents (docs, testing) should override generic "generation"
		// If we have both a specific intent and generation, boost the specific one
		const specificIntents = ['documentation', 'testing', 'refactoring', 'bug_analysis', 'code_review'];
		for (const specificIntent of specificIntents) {
			if (scores[specificIntent as PatternIntent] > 0 && scores.generation > 0) {
				// Boost specific intent to ensure it wins over generic "generation"
				scores[specificIntent as PatternIntent] += 3;
			}
		}

		// Find intent with highest score
		let maxScore = 0;
		let detectedIntent: PatternIntent = 'general';

		for (const [intent, score] of Object.entries(scores)) {
			if (score > maxScore) {
				maxScore = score;
				detectedIntent = intent as PatternIntent;
			}
		}

		// Calculate confidence (0-100)
		// Higher scores = higher confidence, with diminishing returns
		// Use a more generous formula that gives 67% confidence at score 4, 75% at score 6
		const confidence = maxScore > 0 ? Math.min(100, Math.round((maxScore / (maxScore + 2)) * 100)) : 50;

		return { intent: detectedIntent, confidence };
	}

	/**
	 * Match patterns against detected intent and keywords
	 * @param text Original prompt text
	 * @param keywords Extracted keywords
	 * @param intent Detected intent
	 * @param patterns Available patterns
	 * @param limit Max suggestions
	 * @returns Sorted pattern suggestions
	 */
	private matchPatterns(
		text: string,
		keywords: string[],
		intent: PatternIntent,
		patterns: PromptPattern[],
		limit: number
	): PatternSuggestion[] {
		const suggestions: PatternSuggestion[] = [];

		for (const pattern of patterns) {
			const score = this.scorePattern(pattern, text, keywords, intent);

			if (score.confidence > 30) {
				// Only suggest patterns with >30% confidence
				suggestions.push(score);
			}
		}

		// Sort by confidence (descending) and return top N
		return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
	}

	/**
	 * Score a single pattern against prompt
	 * @param pattern Pattern to score
	 * @param text Original prompt text
	 * @param keywords Extracted keywords
	 * @param intent Detected intent
	 * @returns Pattern suggestion with confidence score
	 */
	private scorePattern(
		pattern: PromptPattern,
		text: string,
		keywords: string[],
		intent: PatternIntent
	): PatternSuggestion {
		let score = 0;
		const matchingKeywords: string[] = [];
		const reasons: string[] = [];

		// 1. Intent match (30 points)
		const intentCategoryMap: Record<PatternIntent, string[]> = {
			code_review: ['coding'],
			bug_analysis: ['debugging', 'analysis'],
			documentation: ['documentation', 'writing'],
			testing: ['testing'],
			refactoring: ['refactoring', 'coding'],
			api_design: ['design', 'coding'],
			performance: ['analysis', 'coding'],
			security: ['analysis', 'coding'],
			planning: ['planning'],
			explanation: ['learning'],
			generation: ['coding', 'writing'],
			migration: ['planning', 'coding'],
			general: []
		};

		const relevantCategories = intentCategoryMap[intent] || [];
		if (relevantCategories.includes(pattern.category)) {
			score += 30;
			reasons.push(`Category matches ${intent} intent`);
		}

		// 2. Keyword matches in pattern name/description/tags (40 points max)
		const patternText = [
			pattern.name,
			pattern.description,
			...pattern.tags
		].join(' ').toLowerCase();

		let keywordMatches = 0;
		for (const keyword of keywords) {
			if (patternText.includes(keyword)) {
				keywordMatches++;
				matchingKeywords.push(keyword);
			}
		}

		const keywordScore = Math.min(40, keywordMatches * 8); // 8 points per keyword, max 40
		score += keywordScore;

		if (keywordMatches > 0) {
			reasons.push(`${keywordMatches} matching keyword${keywordMatches > 1 ? 's' : ''}`);
		}

		// 3. Usage statistics (20 points max)
		const stats = this.usageStats.get(pattern.id);
		if (stats) {
			// Boost score based on accept rate (0-1 → 0-20 points)
			const usageBoost = Math.round(stats.acceptRate * 20);
			score += usageBoost;

			if (usageBoost > 10) {
				reasons.push(`Popular pattern (${Math.round(stats.acceptRate * 100)}% accept rate)`);
			}
		}

		// 4. Built-in patterns get small boost (10 points)
		if (pattern.isBuiltIn) {
			score += 10;
		}

		// Normalize to 0-100 confidence score
		const confidence = Math.min(100, score);

		// Build reason string
		const reason = reasons.length > 0 ? reasons.join(', ') : 'General relevance';

		return {
			pattern,
			confidence,
			intent,
			reason,
			matchingKeywords
		};
	}

	/**
	 * Record that a pattern was suggested
	 * @param patternId Pattern ID
	 */
	recordSuggestion(patternId: string): void {
		const stats = this.usageStats.get(patternId) || this.createEmptyStats(patternId);

		stats.suggestionCount++;
		stats.lastSuggestedAt = new Date().toISOString();

		this.usageStats.set(patternId, stats);
		this.saveUsageStats();
	}

	/**
	 * Record that a pattern was accepted (user clicked apply)
	 * @param patternId Pattern ID
	 */
	recordAccept(patternId: string): void {
		const stats = this.usageStats.get(patternId) || this.createEmptyStats(patternId);

		stats.acceptCount++;
		stats.lastAcceptedAt = new Date().toISOString();
		stats.acceptRate = stats.acceptCount / stats.suggestionCount;

		this.usageStats.set(patternId, stats);
		this.saveUsageStats();
	}

	/**
	 * Record that a pattern was rejected (user dismissed)
	 * @param patternId Pattern ID
	 */
	recordReject(patternId: string): void {
		const stats = this.usageStats.get(patternId) || this.createEmptyStats(patternId);

		stats.rejectCount++;
		stats.acceptRate = stats.acceptCount / stats.suggestionCount;

		this.usageStats.set(patternId, stats);
		this.saveUsageStats();
	}

	/**
	 * Get usage stats for a pattern
	 * @param patternId Pattern ID
	 * @returns Usage stats or undefined
	 */
	getStats(patternId: string): PatternUsageStats | undefined {
		return this.usageStats.get(patternId);
	}

	/**
	 * Reset usage stats for a pattern
	 * @param patternId Pattern ID
	 */
	resetStats(patternId: string): void {
		this.usageStats.delete(patternId);
		this.saveUsageStats();
	}

	/**
	 * Reset all usage stats
	 */
	resetAllStats(): void {
		this.usageStats.clear();
		this.saveUsageStats();
	}

	/**
	 * Create empty usage stats for a pattern
	 */
	private createEmptyStats(patternId: string): PatternUsageStats {
		return {
			patternId,
			suggestionCount: 0,
			acceptCount: 0,
			rejectCount: 0,
			acceptRate: 0
		};
	}

	/**
	 * Load usage stats from localStorage
	 */
	private loadUsageStats(): void {
		if (typeof window === 'undefined') return;

		try {
			const stored = localStorage.getItem('vibeforge-pattern-usage-stats');
			if (stored) {
				const data = JSON.parse(stored);
				this.usageStats = new Map(Object.entries(data));
			}
		} catch (error) {
			console.error('Failed to load pattern usage stats:', error);
		}
	}

	/**
	 * Save usage stats to localStorage
	 */
	private saveUsageStats(): void {
		if (typeof window === 'undefined') return;

		try {
			const data = Object.fromEntries(this.usageStats);
			localStorage.setItem('vibeforge-pattern-usage-stats', JSON.stringify(data));
		} catch (error) {
			console.error('Failed to save pattern usage stats:', error);
		}
	}
}

/**
 * Singleton instance
 */
export const patternMatcher = new PatternMatcher();
