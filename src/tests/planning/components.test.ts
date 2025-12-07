/**
 * Planning UI Components Tests
 * Basic validation tests for component exports and structure
 */

import { describe, it, expect } from 'vitest';

// ==============================================================================
// COMPONENT IMPORT TESTS
// ==============================================================================

describe('Planning Components', () => {
	it('should export RequestInput component', async () => {
		const module = await import('$lib/workbench/planning/components/RequestInput.svelte');
		expect(module.default).toBeDefined();
	});

	it('should export StageCard component', async () => {
		const module = await import('$lib/workbench/planning/components/StageCard.svelte');
		expect(module.default).toBeDefined();
	});

	it('should export ProgressTracker component', async () => {
		const module = await import('$lib/workbench/planning/components/ProgressTracker.svelte');
		expect(module.default).toBeDefined();
	});

	it('should export OutputDisplay component', async () => {
		const module = await import('$lib/workbench/planning/components/OutputDisplay.svelte');
		expect(module.default).toBeDefined();
	});

	it('should export PlanningPanel component', async () => {
		const module = await import('$lib/workbench/planning/components/PlanningPanel.svelte');
		expect(module.default).toBeDefined();
	});

	it('should export all components from index', async () => {
		const module = await import('$lib/workbench/planning/components');
		expect(module.RequestInput).toBeDefined();
		expect(module.StageCard).toBeDefined();
		expect(module.ProgressTracker).toBeDefined();
		expect(module.OutputDisplay).toBeDefined();
		expect(module.PlanningPanel).toBeDefined();
	});
});

// NOTE: Full component rendering tests require a browser environment.
// Use Playwright or Vitest browser mode for comprehensive UI testing.
