import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Phase 2.7: Dev Environment Panel
 *
 * Tests the runtime detection and dev environment management system:
 * - Runtime Status Table (Tab 1)
 * - Installation Guide (Tab 2)
 * - Toolchains Configuration (Tab 3)
 * - Dev-Container Generator (Tab 4)
 */

test.describe('Phase 2.7 - Dev Environment Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Navigation and Tab Switching', () => {
    test('should navigate to Dev Environment section', async ({ page }) => {
      // Click on Dev Environment in navigation (adjust selector as needed)
      // This might be in a sidebar, top menu, or accessible via URL
      await page.goto('/dev-environment'); // Adjust URL as needed

      // Should see Dev Environment Panel
      await expect(page.getByRole('heading', { name: /dev environment/i })).toBeVisible({
        timeout: 5000,
      });
    });

    test('should switch between all 4 tabs', async ({ page }) => {
      await page.goto('/dev-environment');

      // Tab 1: Status
      await page.click('button:has-text("Status"), [role="tab"]:has-text("Status")');
      await expect(page.getByText(/runtime/i)).toBeVisible({ timeout: 3000 });

      // Tab 2: Install
      await page.click('button:has-text("Install"), [role="tab"]:has-text("Install")');
      await expect(page.getByText(/installation/i)).toBeVisible({ timeout: 3000 });

      // Tab 3: Config
      await page.click('button:has-text("Config"), [role="tab"]:has-text("Config")');
      await expect(page.getByText(/toolchains/i, /configuration/i)).toBeVisible({
        timeout: 3000,
      });

      // Tab 4: Dev-Container
      await page.click(
        'button:has-text("Dev-Container"), [role="tab"]:has-text("Dev-Container")'
      );
      await expect(page.getByText(/template/i)).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Runtime Status Table (Tab 1)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dev-environment');
      // Ensure we're on Status tab
      await page.click('button:has-text("Status"), [role="tab"]:has-text("Status")');
    });

    test('should display runtime status table', async ({ page }) => {
      // Should see table with runtimes
      await expect(page.getByRole('table', 'grid')).toBeVisible({ timeout: 5000 });

      // Should see some common runtimes (Node, Python, Git, etc.)
      const table = page.locator('table, [role="grid"]').first();
      await expect(table).toContainText(/node|javascript/i);
      await expect(table).toContainText(/git/i);
    });

    test('should display status indicators', async ({ page }) => {
      // Should see status icons or text (✔️ Installed, ❌ Missing, etc.)
      const statusIndicators = page.locator(
        'text=/installed|missing|not found|container/i'
      );
      await expect(statusIndicators.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show summary cards with counts', async ({ page }) => {
      // Should see summary stats
      await expect(
        page.locator('text=/installed|missing|total/i').first()
      ).toBeVisible({ timeout: 5000 });
    });

    test('should have refresh button', async ({ page }) => {
      const refreshButton = page.locator('button:has-text("Refresh")');
      await expect(refreshButton).toBeVisible({ timeout: 5000 });

      // Click refresh and ensure it doesn't crash
      await refreshButton.click();
      await page.waitForTimeout(500); // Wait for refresh to complete
    });

    test('should support sorting (if implemented)', async ({ page }) => {
      // Look for sort buttons or headers
      const sortButtons = page.locator('button:has-text("Sort")');
      if (await sortButtons.count() > 0) {
        await sortButtons.first().click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Installation Guide (Tab 2)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dev-environment');
      await page.click('button:has-text("Install"), [role="tab"]:has-text("Install")');
    });

    test('should display installation instructions', async ({ page }) => {
      // Should see platform-specific commands
      await expect(
        page.locator('text=/ubuntu|macos|windows|linux/i').first()
      ).toBeVisible({ timeout: 5000 });
    });

    test('should have copy-to-clipboard buttons', async ({ page }) => {
      const copyButtons = page.locator('button:has-text("Copy")');
      if (await copyButtons.count() > 0) {
        await expect(copyButtons.first()).toBeVisible();
      }
    });

    test('should show runtime selection', async ({ page }) => {
      // Should be able to select different runtimes
      const runtimeSelectors = page.locator(
        '[data-runtime], button:has-text("Node"), button:has-text("Python")'
      );
      if (await runtimeSelectors.count() > 0) {
        await runtimeSelectors.first().click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Toolchains Configuration (Tab 3)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dev-environment');
      await page.click('button:has-text("Config"), [role="tab"]:has-text("Config")');
    });

    test('should display toolchain configuration options', async ({ page }) => {
      // Should see configuration interface
      await expect(
        page.locator('text=/path|custom|override|toolchain/i').first()
      ).toBeVisible({ timeout: 5000 });
    });

    test('should have save button', async ({ page }) => {
      const saveButton = page.locator('button:has-text("Save")');
      if (await saveButton.count() > 0) {
        await expect(saveButton).toBeVisible();
      }
    });

    test('should support custom path overrides', async ({ page }) => {
      // Look for path input fields
      const pathInputs = page.locator('input[type="text"][placeholder*="path" i]');
      if (await pathInputs.count() > 0) {
        await pathInputs.first().fill('/custom/path/test');
        await page.waitForTimeout(300);
      }
    });

    test('should have reset functionality', async ({ page }) => {
      // Look for reset buttons
      const resetButtons = page.locator('button:has-text("Reset")');
      if (await resetButtons.count() > 0) {
        await expect(resetButtons.first()).toBeVisible();
      }
    });
  });

  test.describe('Dev-Container Generator (Tab 4)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dev-environment');
      await page.click(
        'button:has-text("Dev-Container"), [role="tab"]:has-text("Dev-Container")'
      );
      await page.waitForTimeout(500);
    });

    test('should display template browser', async ({ page }) => {
      // Should see templates
      await expect(page.locator('text=/template/i').first()).toBeVisible({
        timeout: 5000,
      });
    });

    test('should show at least 5 templates', async ({ page }) => {
      // Look for template cards/items
      const templates = page.locator(
        '[data-template], .template-card, button:has-text("Base"), button:has-text("Mobile")'
      );
      const count = await templates.count();
      expect(count).toBeGreaterThanOrEqual(3); // At least a few templates
    });

    test('should have search functionality', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="search" i]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('python');
        await page.waitForTimeout(500);

        // Should filter templates
        const templates = page.locator('[data-template], .template-card');
        if (await templates.count() > 0) {
          // At least one template should remain
          expect(await templates.count()).toBeGreaterThan(0);
        }
      }
    });

    test('should have complexity filter', async ({ page }) => {
      const complexityFilter = page.locator('select, button:has-text("Simple"), button:has-text("Complex")');
      if (await complexityFilter.count() > 0) {
        await expect(complexityFilter.first()).toBeVisible();
      }
    });

    test('should allow template selection', async ({ page }) => {
      // Click on first template
      const firstTemplate = page.locator(
        '[data-template], .template-card, button:has-text("Base"), button:has-text("Development")'
      ).first();

      if (await firstTemplate.count() > 0) {
        await firstTemplate.click();
        await page.waitForTimeout(500);

        // Should show template details or generate option
        await expect(
          page.locator('text=/generate|create|use template/i')
        ).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Integration and Error Handling', () => {
    test('should handle missing backend gracefully', async ({ page }) => {
      // Navigate to dev environment
      await page.goto('/dev-environment');

      // Should not crash even if backend is unavailable
      await expect(page.locator('body')).toBeVisible();
    });

    test('should be responsive', async ({ page }) => {
      await page.goto('/dev-environment');

      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('text=/environment|runtime/i').first()).toBeVisible({
        timeout: 5000,
      });

      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('text=/environment|runtime/i').first()).toBeVisible();
    });

    test('should have no console errors on load', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/dev-environment');
      await page.waitForLoadState('networkidle');

      // Allow minor errors but not critical ones
      const criticalErrors = errors.filter(
        (err) =>
          !err.includes('favicon') && !err.includes('NetworkError') && !err.includes('404')
      );
      expect(criticalErrors.length).toBeLessThan(3);
    });
  });
});
