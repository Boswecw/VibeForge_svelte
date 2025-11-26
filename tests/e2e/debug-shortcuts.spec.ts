import { test, expect } from '@playwright/test';

test('Debug: Check shortcut registration and execution', async ({ page }) => {
  // Capture all console messages
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    console.log(text);
  });

  // Navigate to the app
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Wait a bit for initialization
  await page.waitForTimeout(1000);

  console.log('\n===  CONSOLE LOGS AFTER PAGE LOAD ===');
  consoleMessages.forEach(msg => console.log(msg));
  console.log('=== END CONSOLE LOGS ===\n');

  // Try the keyboard shortcut
  console.log('\n=== PRESSING Meta+Shift+N ===\n');
  await page.keyboard.press('Meta+Shift+N');

  // Wait a bit
  await page.waitForTimeout(500);

  console.log('\n=== CONSOLE LOGS AFTER KEYPRESS ===');
  consoleMessages.forEach(msg => console.log(msg));
  console.log('=== END CONSOLE LOGS ===\n');

  // Check if Quick Create appeared
  const quickCreateVisible = await page.locator('text=Quick Create').isVisible().catch(() => false);
  console.log('Quick Create visible:', quickCreateVisible);
});
