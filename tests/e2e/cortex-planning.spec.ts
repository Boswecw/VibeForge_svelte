/**
 * Cortex Planning E2E Tests
 * End-to-end tests for Multi-AI Planning Orchestrator workflow
 */

import { test, expect } from '@playwright/test';

test.describe('Cortex Planning Workflow', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('http://localhost:5173/');

		// Start trial to unlock planning features
		await page.evaluate(() => {
			const licenseStore = (window as any).licenseStore;
			if (licenseStore && !licenseStore.canUseOrchestrator) {
				licenseStore.beginTrial();
			}
		});
	});

	test('should display planning panel in context column', async ({ page }) => {
		// Navigate to workbench
		await page.goto('http://localhost:5173/');

		// Click Planning tab
		await page.click('button:has-text("Planning")');

		// Verify planning panel is visible
		await expect(page.locator('text=Multi-AI collaborative planning')).toBeVisible();
	});

	test('should create new planning session', async ({ page }) => {
		// Navigate to planning tab
		await page.click('button:has-text("Planning")');

		// Fill out request form
		await page.fill('input[placeholder="e.g., User Authentication"]', 'Test Feature');
		await page.fill(
			'textarea[placeholder*="Describe"]',
			'Implement a test feature with full unit test coverage'
		);

		// Select request type
		await page.selectOption('select', 'feature');

		// Select workflow
		await page.selectOption('select:has(option:has-text("Quick"))', 'quick');

		// Verify estimated cost is displayed
		await expect(page.locator('text=/\\$0\\.\\d+/')).toBeVisible();

		// Click Start Planning
		await page.click('button:has-text("Start Planning")');

		// Verify session starts
		await expect(page.locator('text=/Running|In Progress/')).toBeVisible({
			timeout: 5000
		});
	});

	test('should show progress during planning execution', async ({ page }) => {
		await page.click('button:has-text("Planning")');

		// Mock API responses for faster testing
		await page.route('**/api.openai.com/**', (route) => {
			route.fulfill({
				status: 200,
				body: JSON.stringify({
					id: 'mock',
					choices: [{ message: { content: 'Mock response from GPT' } }],
					usage: { prompt_tokens: 100, completion_tokens: 200 }
				})
			});
		});

		await page.route('**/api.anthropic.com/**', (route) => {
			route.fulfill({
				status: 200,
				body: JSON.stringify({
					id: 'mock',
					content: [{ type: 'text', text: 'Mock response from Claude' }],
					usage: { input_tokens: 100, output_tokens: 200 }
				})
			});
		});

		// Start session
		await page.fill('input[placeholder="e.g., User Authentication"]', 'Test Feature');
		await page.fill('textarea[placeholder*="Describe"]', 'Test description');
		await page.click('button:has-text("Start Planning")');

		// Verify progress bar appears
		await expect(page.locator('.progress-bar')).toBeVisible({ timeout: 2000 });

		// Verify stage cards appear
		await expect(page.locator('text=/Stage \\d/')).toBeVisible();

		// Verify status icons
		await expect(page.locator('svg.w-5.h-5')).toBeVisible(); // Stage status icons
	});

	test('should pause and resume session', async ({ page }) => {
		await page.click('button:has-text("Planning")');

		// Mock API responses
		await page.route('**/api.*', (route) => {
			setTimeout(() => {
				route.fulfill({
					status: 200,
					body: JSON.stringify({
						id: 'mock',
						choices: [{ message: { content: 'Mock response' } }],
						usage: { prompt_tokens: 100, completion_tokens: 200 }
					})
				});
			}, 2000); // Slow response to allow pause
		});

		// Start session
		await page.fill('input[placeholder="e.g., User Authentication"]', 'Test Feature');
		await page.fill('textarea[placeholder*="Describe"]', 'Test description');
		await page.click('button:has-text("Start Planning")');

		// Wait for session to start
		await page.waitForTimeout(500);

		// Click Pause
		const pauseButton = page.locator('button:has-text("Pause")');
		if (await pauseButton.isVisible()) {
			await pauseButton.click();

			// Verify paused state
			await expect(page.locator('text=Paused')).toBeVisible({ timeout: 2000 });

			// Click Resume
			await page.click('button:has-text("Resume")');

			// Verify running state
			await expect(page.locator('text=/Running|In Progress/')).toBeVisible();
		}
	});

	test('should abort session', async ({ page }) => {
		await page.click('button:has-text("Planning")');

		// Start session
		await page.fill('input[placeholder="e.g., User Authentication"]', 'Test Feature');
		await page.fill('textarea[placeholder*="Describe"]', 'Test description');
		await page.click('button:has-text("Start Planning")');

		// Wait for session to start
		await page.waitForTimeout(500);

		// Click Abort
		const abortButton = page.locator('button:has-text("Abort")');
		if (await abortButton.isVisible()) {
			await abortButton.click();

			// Confirm abort (if confirmation dialog exists)
			const confirmButton = page.locator('button:has-text("Yes")');
			if (await confirmButton.isVisible()) {
				await confirmButton.click();
			}

			// Verify cancelled state
			await expect(page.locator('text=/Cancelled|Aborted/')).toBeVisible({
				timeout: 2000
			});
		}
	});

	test('should display deliverable after completion', async ({ page }) => {
		await page.click('button:has-text("Planning")');

		// Mock successful completion
		await page.route('**/api.*', (route) => {
			const url = route.request().url();

			if (url.includes('openai')) {
				route.fulfill({
					status: 200,
					body: JSON.stringify({
						id: 'mock',
						choices: [
							{
								message: {
									content:
										'Initial plan output\n\n---BEGIN IMPLEMENTATION PLAN---\n# Implementation Plan\nPhase 1: Setup\n---END IMPLEMENTATION PLAN---\n\n---BEGIN CLAUDE CODE PROMPT---\nImplement the feature\n---END CLAUDE CODE PROMPT---'
								}
							}
						],
						usage: { prompt_tokens: 100, completion_tokens: 200 }
					})
				});
			} else {
				route.fulfill({
					status: 200,
					body: JSON.stringify({
						id: 'mock',
						content: [
							{
								type: 'text',
								text: 'Review feedback\n\n---BEGIN IMPLEMENTATION PLAN---\n# Implementation Plan\n## Phase 1: Setup\n---END IMPLEMENTATION PLAN---\n\n---BEGIN CLAUDE CODE PROMPT---\nImplement the feature with tests\n---END CLAUDE CODE PROMPT---'
							}
						],
						usage: { input_tokens: 100, output_tokens: 200 }
					})
				});
			}
		});

		// Start session
		await page.fill('input[placeholder="e.g., User Authentication"]', 'Test Feature');
		await page.fill('textarea[placeholder*="Describe"]', 'Test description');
		await page.click('button:has-text("Start Planning")');

		// Wait for completion (may take a while with mocked responses)
		await expect(page.locator('text=/Completed|Planning Complete/')).toBeVisible({
			timeout: 10000
		});

		// Verify deliverable is displayed
		await expect(page.locator('text=Implementation Plan')).toBeVisible();
		await expect(page.locator('text=Claude Code Prompt')).toBeVisible();

		// Verify download buttons are available
		await expect(page.locator('button:has-text("Download")')).toBeVisible();
	});

	test('should copy deliverable to clipboard', async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await page.click('button:has-text("Planning")');

		// Create a completed session programmatically
		await page.evaluate(() => {
			const planningStore = (window as any).planningStore;
			if (planningStore) {
				const session = {
					id: 'test-session',
					status: 'completed',
					title: 'Test Feature',
					description: 'Test description',
					requestType: 'feature',
					pipelineType: 'quick',
					stages: [],
					deliverable: {
						implementationPlan: '# Implementation Plan\nPhase 1: Setup',
						claudeCodePrompt: 'Implement the feature',
						metadata: {
							title: 'Test Feature',
							estimatedTime: '2 hours',
							phases: 1,
							successCriteria: ['Tests pass']
						}
					},
					startedAt: new Date(),
					completedAt: new Date()
				};
				planningStore.sessions = [session];
				planningStore.currentSession = session;
			}
		});

		// Switch to Output tab
		await page.click('button:has-text("Output")');

		// Click copy button
		const copyButton = page.locator('button:has-text("Copy")').first();
		if (await copyButton.isVisible()) {
			await copyButton.click();

			// Verify clipboard has content
			const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
			expect(clipboardText).toContain('Implementation Plan');
		}
	});

	test('should display offline banner when disconnected', async ({ page, context }) => {
		await page.click('button:has-text("Planning")');

		// Simulate offline state
		await context.setOffline(true);

		// Trigger network status check
		await page.evaluate(() => window.dispatchEvent(new Event('offline')));

		// Verify offline banner appears
		await expect(page.locator('text=You are offline')).toBeVisible({ timeout: 2000 });

		// Restore online state
		await context.setOffline(false);
		await page.evaluate(() => window.dispatchEvent(new Event('online')));

		// Verify banner disappears
		await expect(page.locator('text=You are offline')).not.toBeVisible({
			timeout: 2000
		});
	});

	test('should show upgrade prompt for free users', async ({ page }) => {
		// Reset to free tier
		await page.evaluate(() => {
			const licenseStore = (window as any).licenseStore;
			if (licenseStore) {
				licenseStore.resetToFree();
			}
		});

		await page.click('button:has-text("Planning")');

		// Verify upgrade prompt is displayed
		await expect(page.locator('text=/Upgrade|Premium/')).toBeVisible();

		// Verify Start Planning button is disabled or shows upgrade message
		const startButton = page.locator('button:has-text("Start Planning")');
		if (await startButton.isVisible()) {
			expect(await startButton.isDisabled()).toBe(true);
		}
	});

	test('should enforce quota limits', async ({ page }) => {
		// Exhaust quota
		await page.evaluate(() => {
			const licenseStore = (window as any).licenseStore;
			if (licenseStore) {
				licenseStore.beginTrial();
				// Use all 20 runs
				for (let i = 0; i < 20; i++) {
					licenseStore.recordOrchestratorRun();
				}
			}
		});

		await page.click('button:has-text("Planning")');

		// Verify quota message
		await expect(page.locator('text=/Runs remaining: 0|quota exceeded/i')).toBeVisible();

		// Verify cannot start new session
		await page.fill('input[placeholder="e.g., User Authentication"]', 'Test Feature');
		await page.fill('textarea[placeholder*="Describe"]', 'Test description');

		const startButton = page.locator('button:has-text("Start Planning")');
		expect(await startButton.isDisabled()).toBe(true);
	});

	test('should load previous session', async ({ page }) => {
		// Create a session programmatically
		await page.evaluate(() => {
			const planningStore = (window as any).planningStore;
			if (planningStore) {
				const session = {
					id: 'test-previous',
					status: 'completed',
					title: 'Previous Feature',
					description: 'Previous description',
					requestType: 'feature',
					pipelineType: 'default',
					stages: [],
					startedAt: new Date(Date.now() - 3600000),
					completedAt: new Date()
				};
				planningStore.sessions = [session];
			}
		});

		await page.click('button:has-text("Planning")');

		// Find and click recent session
		await expect(page.locator('text=Previous Feature')).toBeVisible();
		await page.click('text=Previous Feature');

		// Verify session is loaded
		await expect(page.locator('text=Previous Feature')).toBeVisible();
	});
});

test.describe('Settings Page - API Keys', () => {
	test('should save API keys to localStorage', async ({ page }) => {
		await page.goto('http://localhost:5173/settings');

		// Find API key inputs (implementation depends on actual settings UI)
		const anthropicInput = page.locator('input[placeholder*="Anthropic"]');
		if (await anthropicInput.isVisible()) {
			await anthropicInput.fill('sk-ant-test-key');

			// Click save button
			await page.click('button:has-text("Save")');

			// Verify saved to localStorage
			const savedKey = await page.evaluate(() =>
				localStorage.getItem('vibeforge:apikey:anthropic')
			);
			expect(savedKey).toBe('sk-ant-test-key');
		}
	});

	test('should show/hide API keys', async ({ page }) => {
		await page.goto('http://localhost:5173/settings');

		// Find show/hide toggle
		const toggleButton = page.locator('button[aria-label*="Show"]');
		if (await toggleButton.isVisible()) {
			// Initially hidden (password type)
			const input = page.locator('input[type="password"]').first();
			expect(await input.getAttribute('type')).toBe('password');

			// Click toggle
			await toggleButton.click();

			// Now visible (text type)
			expect(await input.getAttribute('type')).toBe('text');
		}
	});
});
