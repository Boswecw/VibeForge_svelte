import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Quick Create Dialog
 *
 * Tests the power user fast-track project creation:
 * - Opening with Cmd+Shift+N
 * - Opening via command palette
 * - Minimal form with sensible defaults
 * - Fast project creation
 * - Keyboard shortcuts within dialog
 */

test.describe('Quick Create - Opening and Closing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open Quick Create with Cmd+Shift+N', async ({ page }) => {
    // Press Cmd+Shift+N
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+N' : 'Control+Shift+N');

    // Quick Create dialog should be visible
    await expect(page.locator('text=Quick Create')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Fast project creation')).toBeVisible();
  });

  test('should open Quick Create via command palette', async ({ page }) => {
    // Open command palette
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');

    // Type "quick create"
    await page.keyboard.type('quick create');

    // Press Enter
    await page.keyboard.press('Enter');

    // Quick Create should open
    await expect(page.locator('text=Quick Create')).toBeVisible({ timeout: 5000 });
  });

  test('should close with ESC key', async ({ page }) => {
    // Open Quick Create
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+N' : 'Control+Shift+N');
    await expect(page.locator('text=Quick Create')).toBeVisible();

    // Press ESC
    await page.keyboard.press('Escape');

    // Should close
    await expect(page.locator('text=Quick Create')).not.toBeVisible({ timeout: 3000 });
  });

  test('should close by clicking backdrop', async ({ page }) => {
    // Open Quick Create
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+N' : 'Control+Shift+N');
    await expect(page.locator('text=Quick Create')).toBeVisible();

    // Click backdrop
    await page.click('.bg-black\\/50, [role="dialog"] ~ div', { force: true });

    // Should close
    await expect(page.locator('text=Quick Create')).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('Quick Create - Form Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open Quick Create
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+N' : 'Control+Shift+N');
    await expect(page.locator('text=Quick Create')).toBeVisible();
  });

  test('should show minimal form with 4 required fields', async ({ page }) => {
    // Should have project name input
    await expect(page.locator('input[placeholder*="project" i][placeholder*="name" i], input[name*="name"]')).toBeVisible();

    // Should have language selector
    await expect(page.locator('text=Primary Language')).toBeVisible();

    // Should have stack selector
    await expect(page.locator('text=Stack')).toBeVisible();

    // Should have output path
    await expect(page.locator('text=Output Path')).toBeVisible();
  });

  test('should have sensible default values', async ({ page }) => {
    // Check default values are set
    const nameInput = page.locator('input[placeholder*="project" i][placeholder*="name" i], input[name*="name"]').first();

    // Should have placeholder or default
    const placeholder = await nameInput.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();

    // Other fields should have defaults selected
    await expect(page.locator('select[name*="language"], [data-testid="language-select"]')).toBeVisible();
    await expect(page.locator('select[name*="stack"], [data-testid="stack-select"]')).toBeVisible();
  });

  test('should show sensible defaults mention', async ({ page }) => {
    // Should mention defaults like testing, readme, git
    const dialogText = await page.textContent('[role="dialog"], .modal');

    expect(dialogText).toMatch(/testing|readme|git/i);
  });
});

test.describe('Quick Create - Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+N' : 'Control+Shift+N');
    await expect(page.locator('text=Quick Create')).toBeVisible();
  });

  test('should require project name', async ({ page }) => {
    // Create button should be disabled without name
    const createButton = page.locator('button:has-text("Create"), button[type="submit"]');

    // Try to submit without name
    await expect(createButton).toBeDisabled({ timeout: 2000 });
  });

  test('should enable Create button when form is valid', async ({ page }) => {
    // Fill project name
    await page.fill('input[placeholder*="project" i][placeholder*="name" i], input[name*="name"]', 'QuickProject');

    // Create button should be enabled
    const createButton = page.locator('button:has-text("Create"), button[type="submit"]');
    await expect(createButton).toBeEnabled({ timeout: 3000 });
  });

  test('should validate project name length', async ({ page }) => {
    // Fill with very long name
    const longName = 'a'.repeat(60);
    await page.fill('input[placeholder*="project" i][placeholder*="name" i], input[name*="name"]', longName);

    // Should be truncated or show error
    const input = page.locator('input[placeholder*="project" i][placeholder*="name" i], input[name*="name"]').first();
    const value = await input.inputValue();

    expect(value.length).toBeLessThanOrEqual(50);
  });
});

test.describe('Quick Create - Project Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+N' : 'Control+Shift+N');
    await expect(page.locator('text=Quick Create')).toBeVisible();
  });

  test('should create project with Cmd+Enter shortcut', async ({ page }) => {
    // Fill project name
    await page.fill('input[placeholder*="project" i][placeholder*="name" i], input[name*="name"]', 'ShortcutProject');

    // Press Cmd+Enter to create
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Enter' : 'Control+Enter');

    // Should close dialog and initiate creation
    await expect(page.locator('text=Quick Create')).not.toBeVisible({ timeout: 5000 });

    // Should show some indication of project creation (toast, loading, etc.)
    // This depends on implementation - might show toast or redirect
  });

  test('should create project with Create button click', async ({ page }) => {
    // Fill project name
    await page.fill('input[placeholder*="project" i][placeholder*="name" i], input[name*="name"]', 'ButtonProject');

    // Click Create button
    await page.click('button:has-text("Create"), button[type="submit"]');

    // Should close dialog
    await expect(page.locator('text=Quick Create')).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Quick Create - Link to Full Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+N' : 'Control+Shift+N');
    await expect(page.locator('text=Quick Create')).toBeVisible();
  });

  test('should have link to open full wizard', async ({ page }) => {
    // Should have text like "Need more options? Use wizard"
    await expect(page.locator('text=Need more options')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("wizard"), a:has-text("wizard")')).toBeVisible();
  });

  test('should open full wizard when clicking wizard link', async ({ page }) => {
    // Click the wizard link
    await page.click('button:has-text("wizard"), a:has-text("wizard")');

    // Quick Create should close
    await expect(page.locator('text=Quick Create')).not.toBeVisible({ timeout: 3000 });

    // Full wizard should open
    await expect(page.locator('text=Project Intent')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Quick Create - Always Opens Regardless of Preference', () => {
  test('should always open Quick Create with Cmd+Shift+N even if skipWizard is false', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Set skipWizard to false
    await page.evaluate(() => {
      localStorage.setItem('vibeforge:user-preferences', JSON.stringify({
        skipWizard: false
      }));
    });

    // Press Cmd+Shift+N
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+N' : 'Control+Shift+N');

    // Should always open Quick Create (not wizard)
    await expect(page.locator('text=Quick Create')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Project Intent')).not.toBeVisible();
  });
});
