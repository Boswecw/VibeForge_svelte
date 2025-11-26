import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Workbench Golden Path
 *
 * Tests the core workbench workflow:
 * 1. Load workspace
 * 2. Select/add context blocks
 * 3. Write prompt
 * 4. Execute on model
 * 5. View output
 */

test.describe('Workbench Golden Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full workflow: context → prompt → execution → output', async ({ page }) => {
    // =======================================================================
    // STEP 1: Navigate to workbench (assuming it's the main page or route)
    // =======================================================================

    // Wait for workbench to load - look for the three columns
    await expect(page.locator('text=Context')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Prompt')).toBeVisible();
    await expect(page.locator('text=Output')).toBeVisible();

    // =======================================================================
    // STEP 2: Switch to Context tab and add/select context blocks
    // =======================================================================

    // Click on Context tab
    const contextTab = page.locator('button:has-text("Context")').first();
    await contextTab.click();

    // Check if there are existing context blocks
    const blockCards = page.locator('[data-testid="context-block-card"], .context-block-card');
    const blockCount = await blockCards.count();

    if (blockCount === 0) {
      // No blocks exist - create a new one
      const newButton = page.locator('button:has-text("New")').first();
      await newButton.click({ timeout: 5000 });

      // Fill in the context block editor (if it opens)
      // Note: Adjust selectors based on actual ContextBlockEditor implementation
      const titleInput = page.locator('input[placeholder*="title"], input[name="title"]').first();
      if (await titleInput.isVisible({ timeout: 2000 })) {
        await titleInput.fill('Test Context Block');

        // Fill content
        const contentArea = page.locator('textarea[placeholder*="content"], textarea[name="content"]').first();
        await contentArea.fill('This is test context for the LLM to use.');

        // Save the block
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Add")').first();
        await saveButton.click();
      }
    } else {
      // Blocks exist - ensure at least one is active
      // Look for inactive blocks and activate one if needed
      const inactiveSection = page.locator('text=Inactive Blocks');
      if (await inactiveSection.isVisible({ timeout: 2000 })) {
        // Click to expand inactive blocks
        await inactiveSection.click();

        // Activate the first inactive block
        const toggleButton = page.locator('[data-testid="toggle-active"], button:has-text("Activate")').first();
        if (await toggleButton.isVisible({ timeout: 2000 })) {
          await toggleButton.click();
        }
      }
    }

    // Verify at least one context block is active
    const activeBlocksCount = page.locator('text=/\\d+ \\/ \\d+/').first();
    await expect(activeBlocksCount).toBeVisible({ timeout: 5000 });
    const countText = await activeBlocksCount.textContent();
    expect(countText).toMatch(/[1-9]\d* \/ \d+/); // At least 1 active

    // =======================================================================
    // STEP 3: Write a prompt
    // =======================================================================

    // Locate the prompt editor textarea
    const promptEditor = page.locator('textarea[placeholder*="prompt"], textarea[placeholder*="Compose"], .prompt-editor textarea').first();
    await expect(promptEditor).toBeVisible({ timeout: 5000 });

    // Type a simple prompt
    await promptEditor.fill('Summarize the context provided above in one sentence.');

    // Verify prompt was entered
    const promptValue = await promptEditor.inputValue();
    expect(promptValue.length).toBeGreaterThan(0);

    // =======================================================================
    // STEP 4: Select a model and execute
    // =======================================================================

    // Look for model selector
    const modelSelector = page.locator('select[name="model"], button:has-text("Select Model"), [data-testid="model-selector"]').first();

    if (await modelSelector.isVisible({ timeout: 3000 })) {
      // If it's a select dropdown
      if ((await modelSelector.elementHandle())?.evaluate(el => el.tagName === 'SELECT')) {
        // Select first available model
        await modelSelector.selectOption({ index: 1 });
      } else {
        // If it's a button/dialog, click to open
        await modelSelector.click();

        // Select first model from list
        const firstModel = page.locator('[data-testid="model-option"], .model-option').first();
        if (await firstModel.isVisible({ timeout: 2000 })) {
          await firstModel.click();
        }
      }
    }

    // Find and click the Run/Execute button
    const runButton = page.locator('button:has-text("Run"), button:has-text("Execute"), button:has-text("Send")').first();
    await expect(runButton).toBeVisible({ timeout: 5000 });
    await runButton.click();

    // =======================================================================
    // STEP 5: Verify output is displayed
    // =======================================================================

    // Wait for execution to complete - look for output in the Output column
    // This might take a few seconds depending on the API

    // Check for loading state first
    const loadingIndicator = page.locator('text=Loading, text=Running, [data-testid="loading"]');
    if (await loadingIndicator.isVisible({ timeout: 2000 })) {
      // Wait for loading to finish
      await expect(loadingIndicator).not.toBeVisible({ timeout: 30000 });
    }

    // Verify output is shown
    // Look for output viewer or response text
    const outputViewer = page.locator('.output-viewer, [data-testid="output-viewer"], .output-column').first();
    await expect(outputViewer).toBeVisible({ timeout: 5000 });

    // Check that output contains some content (not empty state)
    const emptyState = page.locator('text=No output yet');
    await expect(emptyState).not.toBeVisible({ timeout: 5000 });

    // Verify some output text is present
    const outputContent = await outputViewer.textContent();
    expect(outputContent?.length).toBeGreaterThan(0);

    // =======================================================================
    // STEP 6: Verify metadata is shown (tokens, model, timing)
    // =======================================================================

    // Look for run metadata section
    const metadata = page.locator('[data-testid="run-metadata"], .run-metadata').first();
    if (await metadata.isVisible({ timeout: 3000 })) {
      // Verify it contains useful info
      const metadataText = await metadata.textContent();
      expect(metadataText).toBeTruthy();
      // Might contain tokens, model name, timing, etc.
    }

    console.log('✅ Golden path completed successfully');
  });

  test('should handle multiple model execution', async ({ page }) => {
    // Navigate to workbench
    await expect(page.locator('text=Prompt')).toBeVisible({ timeout: 10000 });

    // Go to context tab and ensure a block is active
    const contextTab = page.locator('button:has-text("Context")').first();
    await contextTab.click();

    // Enable all blocks if available
    const enableAllButton = page.locator('button:has-text("Enable All")');
    if (await enableAllButton.isVisible({ timeout: 2000 })) {
      await enableAllButton.click();
    }

    // Write prompt
    const promptEditor = page.locator('textarea[placeholder*="prompt"], textarea[placeholder*="Compose"], .prompt-editor textarea').first();
    await expect(promptEditor).toBeVisible({ timeout: 5000 });
    await promptEditor.fill('What is 2+2?');

    // Select multiple models if possible
    const modelSelector = page.locator('[data-testid="model-selector"], button:has-text("Select Model")').first();
    if (await modelSelector.isVisible({ timeout: 3000 })) {
      await modelSelector.click();

      // Try to select multiple models (if multi-select is supported)
      const modelOptions = page.locator('[data-testid="model-option"], .model-option');
      const modelCount = await modelOptions.count();

      if (modelCount > 1) {
        // Select first two models
        await modelOptions.nth(0).click();
        await modelOptions.nth(1).click();
      }
    }

    // Execute
    const runButton = page.locator('button:has-text("Run"), button:has-text("Execute")').first();
    await runButton.click();

    // Verify multiple runs appear (if supported)
    const historyButton = page.locator('button:has-text("History")');
    if (await historyButton.isVisible({ timeout: 5000 })) {
      await historyButton.click();

      // Should show run list
      const runList = page.locator('[data-testid="run-list"], .run-selector');
      await expect(runList).toBeVisible({ timeout: 5000 });
    }

    console.log('✅ Multiple model execution tested');
  });

  test('should save and load prompt templates', async ({ page }) => {
    // Navigate to workbench
    await expect(page.locator('text=Prompt')).toBeVisible({ timeout: 10000 });

    // Switch to Prompts tab in context column
    const promptsTab = page.locator('button:has-text("Prompts")').first();
    await promptsTab.click();

    // Check if there are existing prompt templates
    const templateList = page.locator('[data-testid="prompt-template"], .prompt-template');
    const templateCount = await templateList.count();

    if (templateCount > 0) {
      // Load first template
      await templateList.first().click();

      // Verify prompt editor is populated
      const promptEditor = page.locator('textarea[placeholder*="prompt"], .prompt-editor textarea').first();
      const promptValue = await promptEditor.inputValue();
      expect(promptValue.length).toBeGreaterThan(0);

      console.log('✅ Prompt template loaded successfully');
    } else {
      console.log('⚠️  No existing prompt templates found');
    }
  });

  test('should toggle context blocks and see token count update', async ({ page }) => {
    // Navigate to workbench
    await expect(page.locator('text=Context')).toBeVisible({ timeout: 10000 });

    // Go to context tab
    const contextTab = page.locator('button:has-text("Context")').first();
    await contextTab.click();

    // Get initial token count
    const tokenDisplay = page.locator('text=/\\d+k?/').first();
    const initialTokens = await tokenDisplay.textContent();

    // Toggle a block (activate or deactivate)
    const toggleButton = page.locator('[data-testid="toggle-active"], .toggle-active-button').first();
    if (await toggleButton.isVisible({ timeout: 3000 })) {
      await toggleButton.click();

      // Wait for token count to update
      await page.waitForTimeout(500);

      // Verify token count changed
      const newTokens = await tokenDisplay.textContent();
      expect(newTokens).not.toBe(initialTokens);

      console.log('✅ Token count updated after toggling block');
    }
  });

  test('should show error when running without model selection', async ({ page }) => {
    // Navigate to workbench
    await expect(page.locator('text=Prompt')).toBeVisible({ timeout: 10000 });

    // Write prompt without selecting model
    const promptEditor = page.locator('textarea[placeholder*="prompt"], .prompt-editor textarea').first();
    await expect(promptEditor).toBeVisible({ timeout: 5000 });
    await promptEditor.fill('Test prompt');

    // Try to run without selecting a model
    const runButton = page.locator('button:has-text("Run"), button:has-text("Execute")').first();

    // Clear any existing model selection first
    // (implementation specific)

    await runButton.click();

    // Should show an alert or error message
    page.once('dialog', dialog => {
      expect(dialog.message()).toMatch(/select.*model/i);
      dialog.accept();
    });

    // Or check for error message in UI
    const errorMessage = page.locator('text=/select.*model/i, [role="alert"]');
    const isDialogOrMessage = await Promise.race([
      page.waitForEvent('dialog', { timeout: 3000 }).then(() => true),
      errorMessage.isVisible({ timeout: 3000 })
    ]);

    expect(isDialogOrMessage).toBeTruthy();

    console.log('✅ Error handling verified');
  });
});
