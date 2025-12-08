/**
 * VF-313: Pattern Matcher Tests
 *
 * Comprehensive test suite for AI pattern suggestions with:
 * - Keyword extraction
 * - Intent classification
 * - Pattern matching and scoring
 * - Usage statistics and learning
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PatternMatcher } from '$lib/core/llm/patternMatcher';
import type { PromptPattern, PatternIntent } from '$lib/core/types';

// Mock patterns for testing
const mockPatterns: PromptPattern[] = [
	{
		id: 'pattern_code_review',
		name: 'Code Review',
		description: 'Comprehensive code review analyzing quality and best practices',
		template: 'Review this code: {{code}}',
		variables: [],
		category: 'coding',
		tags: ['review', 'quality', 'best practices'],
		author: 'VibeForge',
		isBuiltIn: true,
		isPublic: true,
		usageCount: 10,
		createdAt: '2025-01-01T00:00:00Z',
		updatedAt: '2025-01-01T00:00:00Z',
		version: 1
	},
	{
		id: 'pattern_bug_fix',
		name: 'Bug Root Cause Analysis',
		description: 'Debug errors and find root causes',
		template: 'Debug this error: {{error}}',
		variables: [],
		category: 'debugging',
		tags: ['bug', 'debug', 'error'],
		author: 'VibeForge',
		isBuiltIn: true,
		isPublic: true,
		usageCount: 5,
		createdAt: '2025-01-01T00:00:00Z',
		updatedAt: '2025-01-01T00:00:00Z',
		version: 1
	},
	{
		id: 'pattern_documentation',
		name: 'Documentation Generator',
		description: 'Generate comprehensive documentation from code',
		template: 'Document this code: {{code}}',
		variables: [],
		category: 'documentation',
		tags: ['docs', 'documentation', 'comments'],
		author: 'VibeForge',
		isBuiltIn: true,
		isPublic: true,
		usageCount: 3,
		createdAt: '2025-01-01T00:00:00Z',
		updatedAt: '2025-01-01T00:00:00Z',
		version: 1
	},
	{
		id: 'pattern_test_gen',
		name: 'Unit Test Generator',
		description: 'Create comprehensive unit tests with edge cases',
		template: 'Generate tests for: {{code}}',
		variables: [],
		category: 'testing',
		tags: ['test', 'testing', 'unit test'],
		author: 'VibeForge',
		isBuiltIn: true,
		isPublic: true,
		usageCount: 7,
		createdAt: '2025-01-01T00:00:00Z',
		updatedAt: '2025-01-01T00:00:00Z',
		version: 1
	}
];

describe('PatternMatcher', () => {
	let matcher: PatternMatcher;

	beforeEach(() => {
		matcher = new PatternMatcher();
		matcher.resetAllStats(); // Clear localStorage between tests
	});

	describe('Keyword Extraction', () => {
		it('should extract keywords from simple text', () => {
			const result = matcher.analyzePrompt(
				'Review my Python code for best practices',
				mockPatterns
			);
			expect(result.keywords).toContain('review');
			expect(result.keywords).toContain('python');
			expect(result.keywords).toContain('code');
			expect(result.keywords).toContain('best');
			expect(result.keywords).toContain('practices');
		});

		it('should filter out stop words', () => {
			const result = matcher.analyzePrompt('the code is broken and needs fixing', mockPatterns);
			expect(result.keywords).not.toContain('the');
			expect(result.keywords).not.toContain('is');
			expect(result.keywords).not.toContain('and');
			expect(result.keywords).toContain('code');
			expect(result.keywords).toContain('broken');
			expect(result.keywords).toContain('needs');
			expect(result.keywords).toContain('fixing');
		});

		it('should handle punctuation and special characters', () => {
			const result = matcher.analyzePrompt(
				'Review my code! It has bugs... can you help?',
				mockPatterns
			);
			expect(result.keywords).toContain('review');
			expect(result.keywords).toContain('code');
			expect(result.keywords).toContain('bugs');
			expect(result.keywords).toContain('help');
		});

		it('should remove duplicate keywords', () => {
			const result = matcher.analyzePrompt(
				'code code code review review review',
				mockPatterns
			);
			const codeCount = result.keywords.filter((k) => k === 'code').length;
			const reviewCount = result.keywords.filter((k) => k === 'review').length;
			expect(codeCount).toBe(1);
			expect(reviewCount).toBe(1);
		});
	});

	describe('Intent Classification', () => {
		it('should detect code review intent', () => {
			const result = matcher.analyzePrompt(
				'Can you review my code for quality and best practices?',
				mockPatterns
			);
			expect(result.detectedIntent).toBe('code_review');
			expect(result.intentConfidence).toBeGreaterThan(60);
		});

		it('should detect bug analysis intent', () => {
			const result = matcher.analyzePrompt(
				'I have a bug in my code, help me debug this error',
				mockPatterns
			);
			expect(result.detectedIntent).toBe('bug_analysis');
			expect(result.intentConfidence).toBeGreaterThan(60);
		});

		it('should detect documentation intent', () => {
			const result = matcher.analyzePrompt(
				'Generate documentation for this function',
				mockPatterns
			);
			expect(result.detectedIntent).toBe('documentation');
			expect(result.intentConfidence).toBeGreaterThan(60);
		});

		it('should detect testing intent', () => {
			const result = matcher.analyzePrompt('Create unit tests for this component', mockPatterns);
			expect(result.detectedIntent).toBe('testing');
			expect(result.intentConfidence).toBeGreaterThan(60);
		});

		it('should default to general for ambiguous prompts', () => {
			const result = matcher.analyzePrompt('Hello, how are you?', mockPatterns);
			expect(result.detectedIntent).toBe('general');
		});

		it('should handle multiple intent keywords with priority', () => {
			const result = matcher.analyzePrompt(
				'Review my code and fix bugs and write tests',
				mockPatterns
			);
			// Should pick the strongest signal (most keywords matched)
			expect(result.detectedIntent).toBeDefined();
		});
	});

	describe('Pattern Matching and Scoring', () => {
		it('should suggest relevant patterns based on intent', () => {
			const result = matcher.analyzePrompt(
				'Review my TypeScript code for best practices',
				mockPatterns
			);
			expect(result.suggestions.length).toBeGreaterThan(0);
			expect(result.suggestions[0].pattern.id).toBe('pattern_code_review');
		});

		it('should rank patterns by confidence score', () => {
			const result = matcher.analyzePrompt(
				'Find bugs in my code and help me debug',
				mockPatterns
			);
			// Ensure suggestions are sorted by confidence (descending)
			for (let i = 0; i < result.suggestions.length - 1; i++) {
				expect(result.suggestions[i].confidence).toBeGreaterThanOrEqual(
					result.suggestions[i + 1].confidence
				);
			}
		});

		it('should match patterns with keyword overlap', () => {
			const result = matcher.analyzePrompt('Write unit tests for my function', mockPatterns);
			const testPattern = result.suggestions.find((s) => s.pattern.id === 'pattern_test_gen');
			expect(testPattern).toBeDefined();
			expect(testPattern!.matchingKeywords).toContain('tests');
		});

		it('should filter out low-confidence matches', () => {
			const result = matcher.analyzePrompt('Random unrelated text about weather', mockPatterns);
			// All suggestions should have confidence > 30%
			result.suggestions.forEach((s) => {
				expect(s.confidence).toBeGreaterThan(30);
			});
		});

		it('should limit suggestions to specified count', () => {
			const result = matcher.analyzePrompt('Review my code for bugs', mockPatterns, 2);
			expect(result.suggestions.length).toBeLessThanOrEqual(2);
		});

		it('should provide reason for each suggestion', () => {
			const result = matcher.analyzePrompt('Review my Python code', mockPatterns);
			result.suggestions.forEach((s) => {
				expect(s.reason).toBeDefined();
				expect(s.reason.length).toBeGreaterThan(0);
			});
		});
	});

	describe('Usage Statistics and Learning', () => {
		it('should record suggestion count', () => {
			matcher.recordSuggestion('pattern_code_review');
			const stats = matcher.getStats('pattern_code_review');
			expect(stats).toBeDefined();
			expect(stats!.suggestionCount).toBe(1);
		});

		it('should record accept count', () => {
			matcher.recordSuggestion('pattern_code_review');
			matcher.recordAccept('pattern_code_review');
			const stats = matcher.getStats('pattern_code_review');
			expect(stats!.acceptCount).toBe(1);
			expect(stats!.acceptRate).toBe(1);
		});

		it('should record reject count', () => {
			matcher.recordSuggestion('pattern_code_review');
			matcher.recordReject('pattern_code_review');
			const stats = matcher.getStats('pattern_code_review');
			expect(stats!.rejectCount).toBe(1);
			expect(stats!.acceptRate).toBe(0);
		});

		it('should calculate accept rate correctly', () => {
			const patternId = 'pattern_code_review';
			matcher.recordSuggestion(patternId);
			matcher.recordSuggestion(patternId);
			matcher.recordSuggestion(patternId);
			matcher.recordSuggestion(patternId);
			matcher.recordAccept(patternId);
			matcher.recordAccept(patternId);
			matcher.recordReject(patternId);
			matcher.recordReject(patternId);

			const stats = matcher.getStats(patternId);
			expect(stats!.suggestionCount).toBe(4);
			expect(stats!.acceptCount).toBe(2);
			expect(stats!.rejectCount).toBe(2);
			expect(stats!.acceptRate).toBe(0.5); // 2/4 = 0.5
		});

		it('should boost scores for patterns with high accept rates', () => {
			// Create high accept rate for pattern_code_review
			for (let i = 0; i < 10; i++) {
				matcher.recordSuggestion('pattern_code_review');
				matcher.recordAccept('pattern_code_review');
			}

			// Create low accept rate for pattern_bug_fix
			for (let i = 0; i < 10; i++) {
				matcher.recordSuggestion('pattern_bug_fix');
				matcher.recordReject('pattern_bug_fix');
			}

			const result = matcher.analyzePrompt('Review my code for bugs', mockPatterns);

			// Code review pattern should rank higher due to better accept rate
			const codeReviewSuggestion = result.suggestions.find(
				(s) => s.pattern.id === 'pattern_code_review'
			);
			const bugFixSuggestion = result.suggestions.find(
				(s) => s.pattern.id === 'pattern_bug_fix'
			);

			if (codeReviewSuggestion && bugFixSuggestion) {
				expect(codeReviewSuggestion.confidence).toBeGreaterThan(bugFixSuggestion.confidence);
			}
		});

		it('should reset stats for a pattern', () => {
			matcher.recordSuggestion('pattern_code_review');
			matcher.recordAccept('pattern_code_review');
			matcher.resetStats('pattern_code_review');
			const stats = matcher.getStats('pattern_code_review');
			expect(stats).toBeUndefined();
		});

		it('should reset all stats', () => {
			matcher.recordSuggestion('pattern_code_review');
			matcher.recordSuggestion('pattern_bug_fix');
			matcher.resetAllStats();
			expect(matcher.getStats('pattern_code_review')).toBeUndefined();
			expect(matcher.getStats('pattern_bug_fix')).toBeUndefined();
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty prompt text', () => {
			const result = matcher.analyzePrompt('', mockPatterns);
			expect(result.keywords).toHaveLength(0);
			expect(result.suggestions).toHaveLength(0);
		});

		it('should handle very short prompts', () => {
			const result = matcher.analyzePrompt('hi', mockPatterns);
			// Short words should be filtered
			expect(result.keywords).toHaveLength(0);
		});

		it('should handle prompts with only stop words', () => {
			const result = matcher.analyzePrompt('the and or but', mockPatterns);
			expect(result.keywords).toHaveLength(0);
		});

		it('should handle empty pattern list', () => {
			const result = matcher.analyzePrompt('Review my code', []);
			expect(result.suggestions).toHaveLength(0);
		});

		it('should handle very long prompts', () => {
			const longPrompt = 'code review '.repeat(100);
			const result = matcher.analyzePrompt(longPrompt, mockPatterns);
			expect(result.analysisDurationMs).toBeDefined();
			expect(result.suggestions.length).toBeGreaterThan(0);
		});

		it('should handle special characters and emojis', () => {
			const result = matcher.analyzePrompt(
				'Review my code 🚀 and fix bugs 🐛',
				mockPatterns
			);
			expect(result.keywords).toContain('review');
			expect(result.keywords).toContain('code');
			expect(result.keywords).toContain('fix');
			expect(result.keywords).toContain('bugs');
		});

		it('should track analysis duration', () => {
			const result = matcher.analyzePrompt('Review my code', mockPatterns);
			expect(result.analysisDurationMs).toBeGreaterThan(0);
			expect(result.analysisDurationMs).toBeLessThan(100); // Should be fast
		});
	});

	describe('Real-World Scenarios', () => {
		it('should suggest code review for typical review request', () => {
			const result = matcher.analyzePrompt(
				'Can you review this TypeScript function and suggest improvements?',
				mockPatterns
			);
			expect(result.suggestions[0].pattern.category).toBe('coding');
			expect(result.detectedIntent).toBe('code_review');
		});

		it('should suggest debugging for error messages', () => {
			const result = matcher.analyzePrompt(
				'I keep getting "TypeError: undefined is not a function" - can you help debug?',
				mockPatterns
			);
			expect(result.detectedIntent).toBe('bug_analysis');
		});

		it('should suggest documentation for doc generation', () => {
			const result = matcher.analyzePrompt(
				'Generate JSDoc comments for this function',
				mockPatterns
			);
			expect(result.detectedIntent).toBe('documentation');
		});

		it('should suggest testing for test creation', () => {
			const result = matcher.analyzePrompt(
				'Write Jest tests for this React component',
				mockPatterns
			);
			expect(result.detectedIntent).toBe('testing');
		});
	});
});
