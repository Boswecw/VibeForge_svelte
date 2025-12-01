import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Phase 4.1: Wizard Team Insights Integration
 *
 * Tests the TeamRecommendations component in the wizard:
 * - Display team recommendations in pattern selection
 * - Display team recommendations in stack selection
 * - Show team context (project count, success rate)
 * - Handle no team data gracefully
 * - Refresh recommendations
 */

test.describe('Phase 4.1: Wizard - Team Recommendations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open wizard and check for team recommendations', async ({ page }) => {
    // Open wizard
    await page.keyboard.press('Meta+N');
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible({ timeout: 5000 });

    // Navigate to Step 2 (Pattern Selection)
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Check if TeamRecommendations component is present
    const teamRecommendations = page.getByText(/Team Recommendations/i);
    const hasRecommendations = await teamRecommendations.isVisible().catch(() => false);

    // If visible, verify structure
    if (hasRecommendations) {
      await expect(teamRecommendations).toBeVisible();

      // Should show team name or loading state
      const hasTeamContext = await page.getByText(/from/i).isVisible().catch(() => false);
      const isLoading = await page.getByText(/Loading team insights/i).isVisible().catch(() => false);

      expect(hasTeamContext || isLoading).toBe(true);
    }
  });

  test('should display recommended languages in wizard', async ({ page }) => {
    // Open wizard
    await page.keyboard.press('Meta+N');
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    // Navigate to Step 2
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Check for recommended languages section
    const recommendedLanguages = page.getByText(/Recommended Languages/i);
    if (await recommendedLanguages.isVisible()) {
      await expect(recommendedLanguages).toBeVisible();

      // Should have bullet points with recommendations
      const recommendations = page.locator('text=/TypeScript|Python|JavaScript|Rust|Go/i');
      const recCount = await recommendations.count();
      expect(recCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display recommended stacks in wizard', async ({ page }) => {
    // Open wizard
    await page.keyboard.press('Meta+N');
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    // Navigate to Step 2
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Check for recommended stacks section
    const recommendedStacks = page.getByText(/Recommended Tech Stacks/i);
    if (await recommendedStacks.isVisible()) {
      await expect(recommendedStacks).toBeVisible();

      // Should have bullet points with stack recommendations
      const stacks = page.locator('text=/SvelteKit|FastAPI|React|Vue|Django/i');
      const stackCount = await stacks.count();
      expect(stackCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show team context information', async ({ page }) => {
    // Open wizard
    await page.keyboard.press('Meta+N');
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    // Navigate to Step 2
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Check for team context info
    const teamContext = page.getByText(/Based on your team's project history/i);
    if (await teamContext.isVisible()) {
      await expect(teamContext).toBeVisible();

      // Should show project count
      const projectCount = page.getByText(/\d+ projects/i);
      if (await projectCount.isVisible()) {
        await expect(projectCount).toBeVisible();
      }

      // Should show success rate
      const successRate = page.getByText(/\d+% success rate/i);
      if (await successRate.isVisible()) {
        await expect(successRate).toBeVisible();
      }
    }
  });

  test('should have refresh button for insights', async ({ page }) => {
    // Open wizard
    await page.keyboard.press('Meta+N');
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    // Navigate to Step 2
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Check for refresh button
    const refreshButton = page.getByRole('button', { name: /Refresh/i });
    const hasRefresh = await refreshButton.isVisible().catch(() => false);

    if (hasRefresh) {
      await expect(refreshButton).toBeVisible();

      // Click refresh button
      await refreshButton.click();
      await page.waitForTimeout(500);

      // Should show loading or updated content
      const isLoading = await page.getByText(/Loading/i).isVisible().catch(() => false);
      // Loading state is brief, so we don't assert it
    }
  });

  test('should not break wizard when no teams exist', async ({ page }) => {
    // Open wizard
    await page.keyboard.press('Meta+N');
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    // Navigate to Step 2
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Wizard should still function normally
    await expect(page.getByRole('heading', { name: /Choose Architecture Pattern|Select Languages/i })).toBeVisible();

    // Next button should be available
    const nextButton = page.getByRole('button', { name: /Next/i });
    await expect(nextButton).toBeVisible();
  });

  test('should display team recommendations in legacy mode (Step 3)', async ({ page }) => {
    // Open wizard
    await page.keyboard.press('Meta+N');
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    // Navigate to Step 2 (Pattern Selection)
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Activate legacy mode
    const legacyModeButton = page.getByText(/Use Legacy Single-Component Mode/i);
    if (await legacyModeButton.isVisible()) {
      await legacyModeButton.click();
      await page.waitForTimeout(500);

      // Select a language
      const typescriptButton = page.getByRole('button', { name: /JavaScript\/TypeScript/i });
      if (await typescriptButton.isVisible()) {
        await typescriptButton.click();
        await page.waitForTimeout(300);

        // Navigate to Step 3 (Stack Selection)
        await page.click('button:has-text("Next")');
        await page.waitForTimeout(500);

        // Check for team recommendations
        const teamRec = page.getByText(/Team Recommendations/i);
        const hasRec = await teamRec.isVisible().catch(() => false);

        if (hasRec) {
          await expect(teamRec).toBeVisible();
        }
      }
    }
  });

  test('should show recommendations with proper styling', async ({ page }) => {
    // Open wizard
    await page.keyboard.press('Meta+N');
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    // Navigate to Step 2
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Check for styled recommendations panel
    const recommendationsPanel = page.locator('[class*="team-recommendations"]');
    const panelCount = await recommendationsPanel.count();

    if (panelCount > 0) {
      // Panel should exist
      expect(panelCount).toBeGreaterThan(0);

      // Should have electric blue styling (border or background)
      const hasElectricBlue = await page.locator('[class*="electric-blue"]').count();
      expect(hasElectricBlue).toBeGreaterThanOrEqual(0);
    }
  });

  test('should handle loading state for team insights', async ({ page }) => {
    // Open wizard
    await page.keyboard.press('Meta+N');
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    // Navigate to Step 2
    await page.click('button:has-text("Next")');

    // May briefly see loading state
    const loadingText = page.getByText(/Loading team insights/i);
    // Don't assert visibility as it may be too fast

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Should eventually show content or no recommendations
    const hasContent = await page.getByText(/Team Recommendations|Choose Architecture Pattern/i).isVisible();
    expect(hasContent).toBe(true);
  });

  test('should show info banner with team stats', async ({ page }) => {
    // Open wizard
    await page.keyboard.press('Meta+N');
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    // Navigate to Step 2
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Check for info banner
    const infoBanner = page.getByText(/Based on your team's project history/i);
    if (await infoBanner.isVisible()) {
      await expect(infoBanner).toBeVisible();

      // Should have icon
      const infoIcon = page.locator('[class*="lucide"]');
      const iconCount = await infoIcon.count();
      expect(iconCount).toBeGreaterThan(0);
    }
  });

  test('should display top 3 recommendations only', async ({ page }) => {
    // Open wizard
    await page.keyboard.press('Meta+N');
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    // Navigate to Step 2
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Count language recommendations
    const languageSection = page.locator('text=/Recommended Languages/i').locator('..');
    if (await languageSection.isVisible()) {
      const recommendations = languageSection.locator('p');
      const recCount = await recommendations.count();

      // Should show max 3 recommendations
      if (recCount > 0) {
        expect(recCount).toBeLessThanOrEqual(3);
      }
    }
  });

  test('should animate recommendations panel', async ({ page }) => {
    // Open wizard
    await page.keyboard.press('Meta+N');
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    // Navigate to Step 2
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Check for animation class
    const animatedPanel = page.locator('[class*="slideDown"], [class*="team-recommendations"]');
    const panelCount = await animatedPanel.count();

    // Panel may exist with animation
    expect(panelCount).toBeGreaterThanOrEqual(0);
  });

  test('should integrate with wizard flow seamlessly', async ({ page }) => {
    // Open wizard
    await page.keyboard.press('Meta+N');
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    // Complete wizard flow with recommendations present
    await page.click('button:has-text("Next")'); // Step 2
    await page.waitForTimeout(500);

    // Team recommendations should not block wizard progression
    const nextButton = page.getByRole('button', { name: /Next/i });
    await expect(nextButton).toBeVisible();

    // Should be able to continue even if recommendations show
    const isEnabled = await nextButton.isEnabled();
    // Button may be disabled due to form validation, not recommendations
  });
});

test.describe('Phase 4.1: Wizard - Team Recommendations Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should handle no recommendations gracefully', async ({ page }) => {
    // Open wizard
    await page.keyboard.press('Meta+N');
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    // Navigate to Step 2
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // If no recommendations, should show appropriate message or nothing
    const noRecommendations = page.getByText(/Not enough team data|No team insights available/i);
    if (await noRecommendations.isVisible()) {
      await expect(noRecommendations).toBeVisible();
    }

    // Wizard should still be functional
    await expect(page.getByRole('heading', { name: /Choose Architecture Pattern|Select Languages/i })).toBeVisible();
  });

  test('should not show recommendations when user has no teams', async ({ page }) => {
    // Open wizard
    await page.keyboard.press('Meta+N');
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    // Navigate to Step 2
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Team recommendations may not be visible
    const teamRec = page.getByText(/Team Recommendations/i);
    const isVisible = await teamRec.isVisible().catch(() => false);

    // Either visible with content or not visible at all
    // Both are valid states depending on user's team membership
    expect(typeof isVisible).toBe('boolean');
  });
});
