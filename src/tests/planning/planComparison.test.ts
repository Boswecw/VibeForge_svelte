/**
 * VF-320: Plan Comparison Types Tests
 *
 * Tests for plan comparison helper functions:
 * - calculateSimilarity (Levenshtein distance)
 * - extractSections (markdown parsing)
 * - compareSections (diff generation)
 * - calculateCombinedScore (weighted ranking)
 */

import { describe, it, expect } from 'vitest';
import {
	calculateSimilarity,
	extractSections,
	compareSections,
	calculateCombinedScore,
	type PlanSection,
	type SectionDiff
} from '$lib/workbench/planning/types/planComparison';

describe('calculateSimilarity', () => {
	it('should return 100 for identical strings', () => {
		const result = calculateSimilarity('hello world', 'hello world');
		expect(result).toBe(100);
	});

	it('should return 0 for completely different strings', () => {
		const result = calculateSimilarity('abc', 'xyz');
		expect(result).toBe(0);
	});

	it('should return 0 when one string is empty', () => {
		expect(calculateSimilarity('', 'hello')).toBe(0);
		expect(calculateSimilarity('hello', '')).toBe(0);
	});

	it('should return 100 for two empty strings', () => {
		const result = calculateSimilarity('', '');
		expect(result).toBe(100);
	});

	it('should calculate similarity for partially matching strings', () => {
		const result = calculateSimilarity('hello world', 'hello there');
		expect(result).toBeGreaterThan(40);
		expect(result).toBeLessThan(70);
	});

	it('should be case-sensitive', () => {
		const result = calculateSimilarity('Hello', 'hello');
		expect(result).toBeLessThan(100);
	});

	it('should handle long strings efficiently', () => {
		const str1 = 'a'.repeat(1000);
		const str2 = 'a'.repeat(999) + 'b';
		const result = calculateSimilarity(str1, str2);
		expect(result).toBeGreaterThan(95);
	});
});

describe('extractSections', () => {
	it('should extract sections from markdown with ## headers', () => {
		const markdown = `
## Overview
This is the overview section.

## Phase 1
Implementation details here.

## Acceptance Criteria
Success criteria listed.
`;
		const sections = extractSections(markdown);
		expect(sections).toHaveLength(3);
		expect(sections[0].title).toBe('Overview');
		expect(sections[1].title).toBe('Phase 1');
		expect(sections[2].title).toBe('Acceptance Criteria');
	});

	it('should handle ### subsection headers', () => {
		const markdown = `
## Overview
Top level section.

### Details
Subsection details.
`;
		const sections = extractSections(markdown);
		expect(sections.length).toBeGreaterThanOrEqual(2);
		expect(sections.some((s) => s.title === 'Overview')).toBe(true);
		expect(sections.some((s) => s.title === 'Details')).toBe(true);
	});

	it('should infer section types from titles', () => {
		const markdown = `
## Overview
Content here.

## Phase 1: Setup
Phase content.

## Testing Strategy
Testing content.

## Risk Assessment
Risks listed.
`;
		const sections = extractSections(markdown);
		expect(sections.find((s) => s.title === 'Overview')?.type).toBe('overview');
		expect(sections.find((s) => s.title.includes('Phase'))?.type).toBe('phase');
		expect(sections.find((s) => s.title.includes('Testing'))?.type).toBe('testing');
		expect(sections.find((s) => s.title.includes('Risk'))?.type).toBe('risks');
	});

	it('should capture line ranges for each section', () => {
		const markdown = `
## Section 1
Line 2
Line 3

## Section 2
Line 6
Line 7
`;
		const sections = extractSections(markdown);
		expect(sections[0].lineRange).toBeDefined();
		expect(sections[0].lineRange[0]).toBeLessThan(sections[0].lineRange[1]);
		expect(sections[1].lineRange[0]).toBeGreaterThan(sections[0].lineRange[1]);
	});

	it('should handle markdown with no sections', () => {
		const markdown = 'Just plain text with no headers.';
		const sections = extractSections(markdown);
		expect(sections).toHaveLength(0);
	});

	it('should handle empty markdown', () => {
		const sections = extractSections('');
		expect(sections).toHaveLength(0);
	});

	it('should preserve section content', () => {
		const markdown = `
## Test Section
This is line 1.
This is line 2.
- Bullet point
- Another bullet
`;
		const sections = extractSections(markdown);
		expect(sections[0].content).toContain('This is line 1');
		expect(sections[0].content).toContain('Bullet point');
	});
});

describe('compareSections', () => {
	const sectionA: PlanSection = {
		id: 'section_0',
		type: 'overview',
		title: 'Overview',
		content: 'This is the overview section with some details.',
		lineRange: [1, 5]
	};

	const sectionB: PlanSection = {
		id: 'section_0',
		type: 'overview',
		title: 'Overview',
		content: 'This is the overview section with different details.',
		lineRange: [1, 5]
	};

	it('should detect added section when sectionA is undefined', () => {
		const diff = compareSections(undefined, sectionB);
		expect(diff.type).toBe('added');
		expect(diff.sectionB).toBe(sectionB);
		expect(diff.sectionA).toBeUndefined();
	});

	it('should detect removed section when sectionB is undefined', () => {
		const diff = compareSections(sectionA, undefined);
		expect(diff.type).toBe('removed');
		expect(diff.sectionA).toBe(sectionA);
		expect(diff.sectionB).toBeUndefined();
	});

	it('should throw error when both sections are undefined', () => {
		expect(() => compareSections(undefined, undefined)).toThrow();
	});

	it('should detect unchanged sections with identical content', () => {
		const identical: PlanSection = { ...sectionA };
		const diff = compareSections(sectionA, identical);
		expect(diff.type).toBe('unchanged');
		expect(diff.similarity).toBe(100);
	});

	it('should detect changed sections with different content', () => {
		const diff = compareSections(sectionA, sectionB);
		expect(diff.type).toBe('changed');
		expect(diff.similarity).toBeLessThan(100);
		expect(diff.similarity).toBeGreaterThan(0);
	});

	it('should generate content diff for changed sections', () => {
		const diff = compareSections(sectionA, sectionB);
		expect(diff.contentDiff).toBeDefined();
		expect(diff.contentDiff?.added).toBeDefined();
		expect(diff.contentDiff?.removed).toBeDefined();
		expect(diff.contentDiff?.modified).toBeDefined();
	});

	it('should identify added lines in content diff', () => {
		const sectionC: PlanSection = {
			...sectionA,
			content: 'Line 1\nLine 2'
		};
		const sectionD: PlanSection = {
			...sectionA,
			content: 'Line 1\nLine 2\nLine 3'
		};
		const diff = compareSections(sectionC, sectionD);
		expect(diff.contentDiff?.added.length).toBeGreaterThan(0);
	});

	it('should identify removed lines in content diff', () => {
		const sectionC: PlanSection = {
			...sectionA,
			content: 'Line 1\nLine 2\nLine 3'
		};
		const sectionD: PlanSection = {
			...sectionA,
			content: 'Line 1\nLine 2'
		};
		const diff = compareSections(sectionC, sectionD);
		expect(diff.contentDiff?.removed.length).toBeGreaterThan(0);
	});

	it('should identify modified lines in content diff', () => {
		const sectionC: PlanSection = {
			...sectionA,
			content: 'Line 1 original'
		};
		const sectionD: PlanSection = {
			...sectionA,
			content: 'Line 1 modified'
		};
		const diff = compareSections(sectionC, sectionD);
		expect(diff.contentDiff?.modified.length).toBeGreaterThan(0);
	});
});

describe('calculateCombinedScore', () => {
	it('should calculate weighted combined score (Quality 50%, Cost 25%, Speed 25%)', () => {
		const qualityScore = 80;
		const cost = 0.5;
		const durationMs = 30000;
		const maxCost = 1.0;
		const maxDuration = 60000;

		const combined = calculateCombinedScore(qualityScore, cost, durationMs, maxCost, maxDuration);

		// Quality: 80 * 0.5 = 40
		// Cost: ((1.0 - 0.5) / 1.0) * 100 * 0.25 = 50 * 0.25 = 12.5
		// Speed: ((60000 - 30000) / 60000) * 100 * 0.25 = 50 * 0.25 = 12.5
		// Total: 40 + 12.5 + 12.5 = 65
		expect(combined).toBe(65);
	});

	it('should return 50% quality score when cost and duration are at max', () => {
		const qualityScore = 100;
		const cost = 1.0;
		const durationMs = 60000;
		const maxCost = 1.0;
		const maxDuration = 60000;

		const combined = calculateCombinedScore(qualityScore, cost, durationMs, maxCost, maxDuration);

		// Quality: 100 * 0.5 = 50
		// Cost: 0 * 0.25 = 0
		// Speed: 0 * 0.25 = 0
		// Total: 50
		expect(combined).toBe(50);
	});

	it('should return 100 when quality is 100 and cost/duration are 0', () => {
		const qualityScore = 100;
		const cost = 0;
		const durationMs = 0;
		const maxCost = 1.0;
		const maxDuration = 60000;

		const combined = calculateCombinedScore(qualityScore, cost, durationMs, maxCost, maxDuration);

		// Quality: 100 * 0.5 = 50
		// Cost: 100 * 0.25 = 25
		// Speed: 100 * 0.25 = 25
		// Total: 100
		expect(combined).toBe(100);
	});

	it('should handle maxCost = 0 gracefully', () => {
		const combined = calculateCombinedScore(80, 0.5, 30000, 0, 60000);
		expect(combined).toBeGreaterThanOrEqual(0);
		expect(combined).toBeLessThanOrEqual(100);
	});

	it('should handle maxDuration = 0 gracefully', () => {
		const combined = calculateCombinedScore(80, 0.5, 30000, 1.0, 0);
		expect(combined).toBeGreaterThanOrEqual(0);
		expect(combined).toBeLessThanOrEqual(100);
	});

	it('should prioritize quality (50% weight)', () => {
		// High quality, high cost, high duration
		const score1 = calculateCombinedScore(100, 1.0, 60000, 1.0, 60000);

		// Low quality, low cost, low duration
		const score2 = calculateCombinedScore(0, 0, 0, 1.0, 60000);

		// Despite score2 having perfect cost/speed, quality weight should make score1 competitive
		expect(score1).toBeGreaterThan(40); // 50% of 100 quality
		expect(score2).toBeLessThan(60); // 50% of cost+speed
	});

	it('should round to nearest integer', () => {
		const combined = calculateCombinedScore(81, 0.33, 33333, 1.0, 60000);
		expect(Number.isInteger(combined)).toBe(true);
	});
});
