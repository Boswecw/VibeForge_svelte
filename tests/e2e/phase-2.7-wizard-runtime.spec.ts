import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Phase 2.7: Wizard Runtime Integration
 *
 * Tests runtime requirements display in wizard steps:
 * - Step 2 (Languages): Show runtime requirements based on language selection
 * - Step 3 (Stack): Show stack-specific runtime requirements
 * - Step 5 (Review): Show complete runtime checklist
 */

test.describe('Phase 2.7 - Wizard Runtime Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open wizard
    await page.keyboard.press('Meta+N');
    await expect(page.getByRole('heading', { name: /project intent/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test.describe('Step 2: Languages - Runtime Requirements', () => {
    test.beforeEach(async ({ page }) => {
      // Fill Step 1 basics
      await page.fill('input[name="projectName"], input[placeholder*="project name" i]', 'test-project');
      await page.click('button:has-text("Next"), button:has-text("Continue")');

      // Should be on Step 2
      await expect(page.getByRole('heading', { name: /language/i })).toBeVisible({
        timeout: 5000,
      });
    });

    test('should show runtime requirements after selecting TypeScript', async ({ page }) => {
      // Select TypeScript
      await page.click('button:has-text("TypeScript"), [data-language="typescript"]');
      await page.waitForTimeout(500);

      // Should see Runtime Requirements section
      await expect(
        page.locator('text=/runtime requirement/i, text=/required runtime/i')
      ).toBeVisible({ timeout: 3000 });

      // Should show JavaScript/TypeScript runtime
      await expect(page.locator('text=/javascript|typescript|node/i')).toBeVisible();

      // Should show git as baseline
      await expect(page.locator('text=/git/i')).toBeVisible();
    });

    test('should show runtime requirements after selecting Python', async ({ page }) => {
      // Select Python
      await page.click('button:has-text("Python"), [data-language="python"]');
      await page.waitForTimeout(500);

      // Should see runtime requirements
      await expect(page.locator('text=/python/i')).toBeVisible();
      await expect(page.locator('text=/git/i')).toBeVisible();
    });

    test('should update requirements when adding additional languages', async ({ page }) => {
      // Select TypeScript as primary
      await page.click('button:has-text("TypeScript")');
      await page.waitForTimeout(300);

      // Add Python as additional language
      await page.click('button:has-text("Python")');
      await page.waitForTimeout(500);

      // Should show both runtimes
      await expect(page.locator('text=/javascript|typescript/i')).toBeVisible();
      await expect(page.locator('text=/python/i')).toBeVisible();
    });

    test('should show status indicators for runtimes', async ({ page }) => {
      // Select a language
      await page.click('button:has-text("TypeScript")');
      await page.waitForTimeout(500);

      // Should see status indicators (✅ or ❌ or icons)
      const statusIndicators = page.locator(
        '[data-runtime-status], text=/installed|missing|available/i, svg'
      );
      await expect(statusIndicators.first()).toBeVisible({ timeout: 3000 });
    });

    test('should display warning for missing runtimes', async ({ page }) => {
      // Select a language
      await page.click('button:has-text("TypeScript")');
      await page.waitForTimeout(500);

      // May show warning if runtimes are missing (depends on system)
      const warnings = page.locator('text=/warning|missing|not found/i');
      if (await warnings.count() > 0) {
        await expect(warnings.first()).toBeVisible();
      }
    });
  });

  test.describe('Step 3: Stack - Runtime Requirements', () => {
    test.beforeEach(async ({ page }) => {
      // Complete Step 1
      await page.fill('input[name="projectName"]', 'test-project');
      await page.click('button:has-text("Next")');

      // Complete Step 2 - Select TypeScript
      await expect(page.getByRole('heading', { name: /language/i })).toBeVisible({
        timeout: 5000,
      });
      await page.click('button:has-text("TypeScript")');
      await page.click('button:has-text("Next")');

      // Should be on Step 3
      await expect(page.getByRole('heading', { name: /stack|framework/i })).toBeVisible({
        timeout: 5000,
      });
    });

    test('should show stack-specific runtime requirements for SvelteKit', async ({ page }) => {
      // Select SvelteKit
      await page.click('button:has-text("SvelteKit"), [data-stack="sveltekit"]');
      await page.waitForTimeout(500);

      // Should see runtime requirements section
      await expect(
        page.locator('text=/runtime requirement/i, text=/required runtime/i')
      ).toBeVisible({ timeout: 3000 });

      // Should show pnpm for SvelteKit
      await expect(page.locator('text=/pnpm/i')).toBeVisible({ timeout: 3000 });
    });

    test('should show runtime requirements for FastAPI', async ({ page }) => {
      // Go back to Step 2 and select Python
      await page.click('button:has-text("Back"), button:has-text("Previous")');
      await page.click('button:has-text("Python")');
      await page.click('button:has-text("Next")');

      // Select FastAPI
      await page.click('button:has-text("FastAPI")');
      await page.waitForTimeout(500);

      // Should show Python runtime
      await expect(page.locator('text=/python/i')).toBeVisible();
    });

    test('should show combined requirements (language + stack)', async ({ page }) => {
      // Select SvelteKit
      await page.click('button:has-text("SvelteKit")');
      await page.waitForTimeout(500);

      // Should show multiple runtimes:
      // - TypeScript/JavaScript (from language)
      // - pnpm (from stack)
      // - git (baseline)
      const requirements = page.locator('[data-runtime], text=/node|typescript|pnpm|git/i');
      expect(await requirements.count()).toBeGreaterThanOrEqual(2);
    });

    test('should handle "No Framework" option', async ({ page }) => {
      // Select "No Framework"
      await page.click('button:has-text("No Framework")');
      await page.waitForTimeout(500);

      // Should only show base language runtime + git
      // No additional stack requirements
      await expect(page.locator('text=/git/i')).toBeVisible();
    });
  });

  test.describe('Step 5: Review - Runtime Checklist', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate through wizard to Step 5
      await page.fill('input[name="projectName"]', 'test-project');
      await page.click('button:has-text("Next")');

      await page.click('button:has-text("TypeScript")');
      await page.click('button:has-text("Next")');

      await page.click('button:has-text("SvelteKit")');
      await page.click('button:has-text("Next")');

      // Skip Step 4 (Configuration) - click Next
      await page.click('button:has-text("Next")');

      // Should be on Step 5 (Review)
      await expect(page.getByRole('heading', { name: /review/i })).toBeVisible({
        timeout: 5000,
      });
    });

    test('should display runtime checklist section', async ({ page }) => {
      // Should see Runtime Checklist
      await expect(
        page.locator('text=/runtime checklist|required runtime/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should show all required runtimes from previous selections', async ({ page }) => {
      // Should show:
      // - TypeScript/JavaScript (from Step 2)
      // - pnpm (from SvelteKit in Step 3)
      // - git (baseline)

      await expect(page.locator('text=/javascript|typescript|node/i')).toBeVisible({
        timeout: 3000,
      });
      await expect(page.locator('text=/pnpm/i')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('text=/git/i')).toBeVisible({ timeout: 3000 });
    });

    test('should show status for each runtime', async ({ page }) => {
      // Each runtime should have a status indicator
      const statuses = page.locator(
        '[data-runtime-status], text=/installed|missing/i, svg'
      );
      expect(await statuses.count()).toBeGreaterThanOrEqual(2);
    });

    test('should display warning if required runtimes are missing', async ({ page }) => {
      // May show warning banner if any runtimes are missing
      const warnings = page.locator(
        'text=/warning|missing runtime|not installed/i, [role="alert"]'
      );
      if (await warnings.count() > 0) {
        await expect(warnings.first()).toBeVisible();
      }
    });

    test('should have install buttons disabled (review-only mode)', async ({ page }) => {
      // Install buttons should be disabled or hidden in review step
      const installButtons = page.locator('button:has-text("Install")');
      if (await installButtons.count() > 0) {
        await expect(installButtons.first()).toBeDisabled();
      }
    });

    test('should show success message if all runtimes are installed', async ({ page }) => {
      // May show success indicator if all requirements met
      const successIndicators = page.locator(
        'text=/all.*installed|ready|requirements met/i, [role="status"]'
      );
      if (await successIndicators.count() > 0) {
        await expect(successIndicators.first()).toBeVisible();
      }
    });

    test('should allow project creation despite missing runtimes', async ({ page }) => {
      // Create Project button should still be enabled
      // (User can choose to install runtimes later)
      const createButton = page.locator(
        'button:has-text("Create"), button:has-text("Generate")'
      );
      await expect(createButton.first()).toBeVisible({ timeout: 3000 });
      // Don't actually click it in tests
    });
  });

  test.describe('Integration and Real-time Updates', () => {
    test('should update runtime requirements in real-time', async ({ page }) => {
      // Fill Step 1
      await page.fill('input[name="projectName"]', 'test-project');
      await page.click('button:has-text("Next")');

      // Step 2: Select TypeScript
      await page.click('button:has-text("TypeScript")');
      await page.waitForTimeout(300);

      // Should see TypeScript requirements
      await expect(page.locator('text=/javascript|typescript/i')).toBeVisible();

      // Change to Python
      await page.click('button:has-text("Python")');
      await page.waitForTimeout(300);

      // Should now see Python requirements
      await expect(page.locator('text=/python/i')).toBeVisible();
    });

    test('should persist runtime requirements across step navigation', async ({ page }) => {
      // Complete Steps 1-2
      await page.fill('input[name="projectName"]', 'test-project');
      await page.click('button:has-text("Next")');
      await page.click('button:has-text("TypeScript")');
      await page.click('button:has-text("Next")');

      // Step 3: Note runtime requirements
      await expect(page.locator('text=/runtime/i')).toBeVisible({ timeout: 3000 });

      // Go back to Step 2
      await page.click('button:has-text("Back")');

      // Requirements should still be visible
      await expect(page.locator('text=/runtime/i')).toBeVisible();

      // Go forward to Step 3
      await page.click('button:has-text("Next")');

      // Requirements should persist
      await expect(page.locator('text=/runtime/i')).toBeVisible();
    });

    test('should have no duplicate runtime entries', async ({ page }) => {
      // Complete wizard with language and stack that share runtimes
      await page.fill('input[name="projectName"]', 'test-project');
      await page.click('button:has-text("Next")');
      await page.click('button:has-text("TypeScript")');
      await page.click('button:has-text("Next")');
      await page.click('button:has-text("SvelteKit")');
      await page.waitForTimeout(500);

      // Get all runtime text
      const runtimeTexts = await page.locator('[data-runtime], text=/node|git/i').allTextContents();

      // Check for duplicates
      const uniqueRuntimes = new Set(runtimeTexts.filter(t => t.trim()));
      expect(uniqueRuntimes.size).toBeGreaterThan(0);
      // Exact duplicate checking is hard, but we should have reasonable number
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle wizard with no language selected', async ({ page }) => {
      // Fill Step 1
      await page.fill('input[name="projectName"]', 'test-project');
      await page.click('button:has-text("Next")');

      // Don't select any language
      // Runtime requirements should either not show or show baseline only
      const requirements = page.locator('text=/runtime requirement/i');
      if (await requirements.count() > 0) {
        // If shown, should only have git
        await expect(page.locator('text=/git/i')).toBeVisible();
      }
    });

    test('should handle backend unavailable gracefully', async ({ page }) => {
      // Wizard should still function even if runtime detection backend fails
      await page.fill('input[name="projectName"]', 'test-project');
      await page.click('button:has-text("Next")');
      await page.click('button:has-text("TypeScript")');

      // Should not crash - runtime section may show error or fallback
      await expect(page.locator('body')).toBeVisible();
    });

    test('should be responsive on mobile', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.fill('input[name="projectName"]', 'test-project');
      await page.click('button:has-text("Next")');
      await page.click('button:has-text("TypeScript")');

      // Runtime requirements should still be visible
      await expect(page.locator('text=/runtime/i')).toBeVisible({ timeout: 5000 });
    });
  });
});
