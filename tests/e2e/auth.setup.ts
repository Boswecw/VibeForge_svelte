/**
 * Playwright Auth Setup
 *
 * Handles authentication for E2E tests by:
 * 1. Logging in with test credentials
 * 2. Saving auth state to file
 * 3. Reusing across all tests
 */

import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  console.log('[Auth Setup] Starting authentication...');

  // Navigate to login page
  await page.goto('/login');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Fill in credentials (dev mode accepts any non-empty values)
  await page.fill('input[id="username"]', 'test-user');
  await page.fill('input[id="password"]', 'test-password');

  // Click sign in button
  await page.click('button[type="submit"]');

  // Wait for navigation to complete (should redirect to /)
  await page.waitForURL('/', { timeout: 10000 });

  // Verify we're authenticated by checking localStorage
  const token = await page.evaluate(() => localStorage.getItem('vibeforge_jwt_token'));
  const user = await page.evaluate(() => localStorage.getItem('vibeforge_user'));

  console.log('[Auth Setup] Token exists:', !!token);
  console.log('[Auth Setup] User exists:', !!user);

  expect(token).toBeTruthy();
  expect(user).toBeTruthy();

  // Save authentication state
  await page.context().storageState({ path: authFile });

  console.log('[Auth Setup] Authentication state saved to:', authFile);
});
