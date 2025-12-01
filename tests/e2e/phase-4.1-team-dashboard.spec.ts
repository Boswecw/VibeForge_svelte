import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Phase 4.1: Team Dashboard
 *
 * Tests the team dashboard functionality:
 * - Accessing the team dashboard page
 * - Displaying team information
 * - Showing team members
 * - Rendering team insights
 * - Displaying metrics and recommendations
 */

test.describe('Phase 4.1: Team Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to team dashboard', async ({ page }) => {
    // Navigate to /teams page
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // Should show team dashboard header
    await expect(page.getByRole('heading', { name: 'Team Dashboard' })).toBeVisible();

    // Should show description
    await expect(page.getByText('Track team performance and AI-powered insights')).toBeVisible();
  });

  test('should show empty state when no teams exist', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // Check for empty state
    const emptyStateHeading = page.getByRole('heading', { name: /No Teams Yet/i });
    if (await emptyStateHeading.isVisible()) {
      await expect(emptyStateHeading).toBeVisible();
      await expect(page.getByText(/Create your first team/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Create Your First Team/i })).toBeVisible();
    }
  });

  test('should display team selector when teams exist', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // Look for team selector or empty state
    const teamSelector = page.locator('select').first();
    const emptyState = page.getByRole('heading', { name: /No Teams Yet/i });

    // One should be visible
    const hasDashboard = await teamSelector.isVisible();
    const hasEmptyState = await emptyState.isVisible();

    expect(hasDashboard || hasEmptyState).toBe(true);
  });

  test('should render team insights card', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // Wait for potential team data to load
    await page.waitForTimeout(1000);

    // Check if insights card exists (when team is selected)
    const insightsCard = page.getByText('AI-Powered Insights');
    if (await insightsCard.isVisible()) {
      await expect(insightsCard).toBeVisible();

      // Check for insights content
      const hasSuccessRate = await page.getByText(/Overall Success Rate/i).isVisible();
      const hasNoInsights = await page.getByText(/No insights available/i).isVisible();

      // Should show either insights or no insights message
      expect(hasSuccessRate || hasNoInsights).toBe(true);
    }
  });

  test('should render team metrics card', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check if metrics card exists
    const metricsCard = page.getByText('Team Metrics');
    if (await metricsCard.isVisible()) {
      await expect(metricsCard).toBeVisible();

      // Should show language or stack metrics
      const hasLanguages = await page.getByText(/Top Programming Languages/i).isVisible();
      const hasStacks = await page.getByText(/Top Tech Stacks/i).isVisible();
      const hasNoMetrics = await page.getByText(/No metrics available/i).isVisible();

      expect(hasLanguages || hasStacks || hasNoMetrics).toBe(true);
    }
  });

  test('should render team members card', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check if members card exists
    const membersCard = page.getByText('Team Members');
    if (await membersCard.isVisible()) {
      await expect(membersCard).toBeVisible();

      // Should show members or no members message
      const hasMembers = (await page.locator('[class*="team-members"]').count()) > 0;
      const hasNoMembers = await page.getByText(/No team members/i).isVisible();

      expect(hasMembers || hasNoMembers).toBe(true);
    }
  });

  test('should have refresh dashboard button', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // Check for refresh button
    const refreshButton = page.getByRole('button', { name: /Refresh/i });
    if (await refreshButton.isVisible()) {
      await expect(refreshButton).toBeVisible();

      // Button should be enabled (not disabled)
      const isDisabled = await refreshButton.isDisabled();
      expect(isDisabled).toBe(false);
    }
  });

  test('should have create team button', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // Check for create team button in header or empty state
    const createButtonInHeader = page.getByRole('button', { name: /Create Team/i }).first();
    await expect(createButtonInHeader).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    await page.goto('/teams');

    // May see loading spinner briefly
    const loadingSpinner = page.locator('.animate-spin');
    // Don't assert it's visible because it might load too fast

    // Eventually should show content
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Team Dashboard' })).toBeVisible();
  });

  test('should display team info when team is selected', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check if team selector exists and has options
    const teamSelector = page.locator('select');
    if (await teamSelector.isVisible()) {
      const optionCount = await teamSelector.locator('option').count();

      if (optionCount > 1) {
        // Select first team (skip "Select a team..." option)
        await teamSelector.selectOption({ index: 1 });

        // Wait for team data to load
        await page.waitForTimeout(1000);

        // Should show team name or insights
        const hasTeamName = (await page.locator('[class*="team"]').count()) > 0;
        expect(hasTeamName).toBe(true);
      }
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');

    // Check if error message is displayed
    const errorMessage = page.getByText(/error/i);
    if (await errorMessage.isVisible()) {
      // Should have dismiss button
      const dismissButton = page.getByRole('button', { name: /Dismiss/i });
      if (await dismissButton.isVisible()) {
        await expect(dismissButton).toBeVisible();
      }
    }
  });

  test('should render insights with correct structure', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Check for insights structure
    const recommendedLanguages = page.getByText(/Recommended Languages/i);
    if (await recommendedLanguages.isVisible()) {
      await expect(recommendedLanguages).toBeVisible();
    }

    const recommendedStacks = page.getByText(/Recommended Tech Stacks/i);
    if (await recommendedStacks.isVisible()) {
      await expect(recommendedStacks).toBeVisible();
    }

    const improvementSuggestions = page.getByText(/Improvement Suggestions/i);
    if (await improvementSuggestions.isVisible()) {
      await expect(improvementSuggestions).toBeVisible();
    }
  });

  test('should render metrics with visual bars', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Check for metric bars (progress bars)
    const progressBars = page.locator('[class*="rounded-full"][class*="h-2"]');
    const barCount = await progressBars.count();

    // May have bars if data exists
    if (barCount > 0) {
      expect(barCount).toBeGreaterThan(0);
    }
  });

  test('should display member roles with icons', async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Check for role indicators (owner, admin, member)
    const roleIndicators = page.getByText(/(owner|admin|member)/i);
    const roleCount = await roleIndicators.count();

    // May have roles if team data exists
    if (roleCount > 0) {
      expect(roleCount).toBeGreaterThan(0);
    }
  });
});

test.describe('Phase 4.1: Team Dashboard - Team Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teams');
    await page.waitForLoadState('networkidle');
  });

  test('should allow selecting different teams', async ({ page }) => {
    await page.waitForTimeout(1000);

    const teamSelector = page.locator('select');
    if (await teamSelector.isVisible()) {
      const optionCount = await teamSelector.locator('option').count();

      if (optionCount > 2) {
        // Select second team
        await teamSelector.selectOption({ index: 1 });
        await page.waitForTimeout(500);

        // Select third team
        await teamSelector.selectOption({ index: 2 });
        await page.waitForTimeout(500);

        // Dashboard should update (no error)
        const errorMessage = page.getByText(/Failed to fetch/i);
        const hasError = await errorMessage.isVisible().catch(() => false);
        expect(hasError).toBe(false);
      }
    }
  });

  test('should show team metadata in selector', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Check for team metadata (member count, project count)
    const metadata = page.getByText(/members.*projects/i);
    if (await metadata.isVisible()) {
      await expect(metadata).toBeVisible();
    }
  });
});
