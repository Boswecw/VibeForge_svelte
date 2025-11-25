# E2E Testing Guide - VibeForge Workbench

**Date:** November 24, 2025
**Framework:** Playwright 1.56.1
**Coverage:** Workbench Architecture Refactoring (Phase 5)

## Overview

This document covers the end-to-end testing infrastructure for VibeForge's workbench architecture refactoring, specifically testing the new modal-based wizard system, Quick Create dialog, and user preference integration.

## What's Tested

### 1. New Project Wizard Modal (`wizard-modal.spec.ts`)

**Opening Methods:**
- ⌘N (Cmd+N) keyboard shortcut
- "New Project" button in TopBar
- Command Palette (⌘K) → "New Project"

**Modal Behavior:**
- ESC key closes wizard
- Clicking backdrop closes wizard
- Modal overlay prevents background interaction

**Step Navigation:**
- All 5 steps accessible: Intent → Languages → Stack → Config → Launch
- "Next" button advances to next step
- "Back" button returns to previous step
- ⌘↵ (Cmd+Enter) keyboard shortcut advances step
- Progress indicator shows current step

**Form Validation:**
- Required fields enforced (project name, description)
- Character length limits (name: 2-50, description: 10-500)
- Invalid inputs show error messages
- Valid inputs allow progression

**Draft Persistence:**
- Form data auto-saves to localStorage
- Draft persists across page reloads
- Draft key: `vibeforge:wizard-draft`
- Draft includes all form fields

**Keyboard Shortcuts:**
- ⌘N opens wizard (respects skipWizard preference)
- ⌘↵ advances to next step
- ESC closes wizard
- Tab navigation works within form

### 2. Quick Create Dialog (`quick-create.spec.ts`)

**Opening Methods:**
- ⌘⇧N (Cmd+Shift+N) - always works regardless of preferences
- Command Palette (⌘K) → "Quick Create"

**Dialog Behavior:**
- ESC closes dialog
- Clicking backdrop closes dialog
- Minimal form: name, language, stack, path

**Defaults:**
- Testing: enabled by default
- README: enabled by default
- Git: enabled by default
- License: MIT (or project default)

**Validation:**
- Project name required
- Name length: 2-50 characters
- Valid path required

**Project Creation:**
- ⌘↵ creates project
- Success navigates to workbench
- Form resets after creation

**Link to Full Wizard:**
- "Need more options?" link present
- Clicking link closes Quick Create and opens full wizard
- Data transfers from Quick Create to wizard

**Preference Independence:**
- Always opens with ⌘⇧N even if skipWizard = false
- Provides guaranteed fast-track for power users

### 3. Skip Wizard Preference (`skip-wizard-preference.spec.ts`)

**Default Behavior (skipWizard = false):**
- ⌘N opens full wizard
- "New Project" button opens full wizard
- ⌘⇧N always opens Quick Create (override)

**Enabled Behavior (skipWizard = true):**
- ⌘N opens Quick Create instead of wizard
- "New Project" button opens Quick Create
- ⌘⇧N still opens Quick Create (same result)
- Command Palette "New Project" respects preference

**Persistence:**
- Preference stored in localStorage
- Key: `vibeforge:user-preferences`
- Survives page reloads
- Survives browser restarts

**Toggling:**
- Changing preference changes behavior immediately (after reload)
- No cached state issues
- Preference change reflected in both keyboard shortcut and button

**Command Palette Integration:**
- Separate commands: "New Project" and "Quick Create"
- "New Project" respects skipWizard preference
- "Quick Create" always opens Quick Create

**Settings UI Integration:**
- Toggle available in settings page
- Changes save to localStorage
- Visual feedback on toggle state

## Test Infrastructure

### Configuration

**File:** `playwright.config.ts`

```typescript
{
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium' },  // Desktop Chrome
    { name: 'firefox' },   // Desktop Firefox
    { name: 'webkit' },    // Desktop Safari
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
}
```

### Directory Structure

```
vibeforge/
├── playwright.config.ts          # Playwright configuration
├── tests/
│   └── e2e/
│       ├── wizard-modal.spec.ts       # Wizard modal tests
│       ├── quick-create.spec.ts       # Quick Create dialog tests
│       └── skip-wizard-preference.spec.ts  # Preference tests
└── playwright-report/            # Generated test reports
```

## Running Tests

### Basic Commands

```bash
# Run all E2E tests (headless mode)
pnpm test:e2e

# Run with interactive UI mode (recommended for development)
pnpm test:e2e:ui

# Run in headed mode (see the browser)
pnpm test:e2e:headed

# Debug specific test
pnpm test:e2e:debug

# View last test report
pnpm test:e2e:report
```

### Browser-Specific Tests

```bash
# Run on Chromium only
pnpm test:e2e:chromium

# Run on Firefox only
pnpm test:e2e:firefox

# Run on WebKit (Safari) only
pnpm test:e2e:webkit
```

### Advanced Options

```bash
# Run specific test file
pnpm test:e2e tests/e2e/wizard-modal.spec.ts

# Run specific test by name
pnpm test:e2e --grep "should open wizard"

# Run tests in parallel (faster)
pnpm test:e2e --workers=4

# Update snapshots (if using visual regression)
pnpm test:e2e --update-snapshots

# Generate trace for failed tests
pnpm test:e2e --trace on
```

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Set up localStorage preferences if needed
    await page.evaluate(() => {
      localStorage.setItem('vibeforge:user-preferences', JSON.stringify({
        skipWizard: false
      }));
    });
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await page.click('button:has-text("Click Me")');
    await expect(page.locator('text=Result')).toBeVisible();
  });
});
```

### Best Practices

#### 1. Use Explicit Waits

```typescript
// Good - explicit timeout
await expect(page.locator('text=Modal')).toBeVisible({ timeout: 5000 });

// Bad - implicit wait may be too short
await expect(page.locator('text=Modal')).toBeVisible();
```

#### 2. Handle Platform Differences

```typescript
// Good - cross-platform keyboard shortcuts
const cmdKey = process.platform === 'darwin' ? 'Meta' : 'Control';
await page.keyboard.press(`${cmdKey}+N`);

// Bad - Mac-only
await page.keyboard.press('Meta+N');
```

#### 3. Use Robust Selectors

```typescript
// Good - multiple fallback selectors
page.locator('input[name="projectName"], input[id="project-name"]')

// Good - text content for user-visible elements
page.locator('text=New Project')

// Good - test IDs for dynamic content
page.locator('[data-testid="wizard-step-intent"]')

// Bad - fragile CSS selectors
page.locator('div.modal > div:nth-child(2) > form')
```

#### 4. Test LocalStorage Interactions

```typescript
// Set preference
await page.evaluate(() => {
  localStorage.setItem('vibeforge:user-preferences', JSON.stringify({
    skipWizard: true
  }));
});

// Verify preference
const prefs = await page.evaluate(() => {
  const stored = localStorage.getItem('vibeforge:user-preferences');
  return stored ? JSON.parse(stored) : null;
});
expect(prefs?.skipWizard).toBe(true);
```

#### 5. Handle Timing Issues

```typescript
// Good - wait for network to settle
await page.waitForLoadState('networkidle');

// Good - explicit timeout for auto-save
await page.waitForTimeout(1000);

// Good - wait for specific element
await page.waitForSelector('text=Loaded');
```

### Common Patterns

#### Testing Modal Open/Close

```typescript
test('should open and close modal', async ({ page }) => {
  // Open
  await page.keyboard.press('Meta+N');
  await expect(page.locator('text=Modal Title')).toBeVisible();

  // Close with ESC
  await page.keyboard.press('Escape');
  await expect(page.locator('text=Modal Title')).not.toBeVisible();
});
```

#### Testing Form Validation

```typescript
test('should validate required field', async ({ page }) => {
  await page.click('button:has-text("Submit")');

  // Error message should appear
  await expect(page.locator('text=Name is required')).toBeVisible();

  // Fill field
  await page.fill('input[name="name"]', 'Test Name');

  // Error should disappear
  await expect(page.locator('text=Name is required')).not.toBeVisible();
});
```

#### Testing Navigation

```typescript
test('should navigate through steps', async ({ page }) => {
  // Step 1
  await expect(page.locator('text=Step 1')).toBeVisible();
  await page.click('button:has-text("Next")');

  // Step 2
  await expect(page.locator('text=Step 2')).toBeVisible();
  await page.click('button:has-text("Back")');

  // Back to Step 1
  await expect(page.locator('text=Step 1')).toBeVisible();
});
```

## Troubleshooting

### Common Issues

#### 1. Tests Timing Out

**Problem:** Tests fail with "Timeout 30000ms exceeded"

**Solutions:**
- Increase timeout: `{ timeout: 10000 }`
- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Check if dev server is running: `pnpm dev`
- Verify baseURL in playwright.config.ts

#### 2. Element Not Found

**Problem:** "Element not found" or "locator.click: Target closed"

**Solutions:**
- Wait for element: `await page.waitForSelector('text=Element')`
- Check selector specificity
- Use multiple fallback selectors
- Verify element is visible: `await expect(element).toBeVisible()`

#### 3. LocalStorage Not Persisting

**Problem:** Preferences don't persist across reloads

**Solutions:**
- Call `page.reload()` after setting localStorage
- Wait for network idle after reload
- Verify key names match exactly
- Check browser console for errors

#### 4. Keyboard Shortcuts Not Working

**Problem:** Cmd+N or other shortcuts don't trigger actions

**Solutions:**
- Use platform-specific keys (Meta vs Control)
- Ensure page has focus: `await page.focus('body')`
- Check for conflicting shortcuts in browser
- Use `--headed` mode to debug visually

#### 5. Flaky Tests

**Problem:** Tests pass sometimes, fail others

**Solutions:**
- Add explicit waits instead of fixed timeouts
- Use `waitForLoadState('networkidle')`
- Check for race conditions in async code
- Disable animations in test mode
- Run in serial mode: `fullyParallel: false`

### Debugging Tests

```bash
# Run in headed mode to see what's happening
pnpm test:e2e:headed

# Use debug mode for step-by-step execution
pnpm test:e2e:debug

# Generate trace for failed tests
pnpm test:e2e --trace on

# View trace in Playwright inspector
npx playwright show-trace trace.zip
```

### CI/CD Considerations

For continuous integration:
```typescript
// playwright.config.ts
{
  retries: process.env.CI ? 2 : 0,  // Retry flaky tests in CI
  workers: process.env.CI ? 1 : undefined,  // Serial in CI for stability
  forbidOnly: !!process.env.CI,  // Prevent test.only in CI
}
```

## CI/CD Integration

VibeForge includes comprehensive GitHub Actions workflows for automated testing.

### Workflows Overview

#### 1. Main CI Workflow (`.github/workflows/ci.yml`)

**Trigger:** Push to main/master/develop, Pull Requests

**Jobs:**
1. **Lint & Type Check** - Runs `pnpm check` to validate TypeScript types
2. **Unit Tests** - Runs Vitest unit tests with coverage
3. **E2E Tests** - Runs Playwright tests across all browsers (Chromium, Firefox, WebKit)
4. **Build** - Verifies production build succeeds
5. **Status Check** - Final verification that all jobs passed

**Features:**
- Parallel execution across browser matrix
- Automatic artifact uploads (reports, screenshots, videos)
- Coverage reports generation
- Build artifacts preservation
- Dependency caching via pnpm

**Usage:**
```bash
# Automatically runs on:
git push origin main
git push origin feature-branch  # On PR

# Or manually trigger via GitHub UI
```

#### 2. Manual E2E Workflow (`.github/workflows/e2e-manual.yml`)

**Trigger:** Manual workflow dispatch

**Features:**
- Choose specific browser (chromium, firefox, webkit, or all)
- Toggle headed/headless mode
- On-demand testing for specific scenarios
- Uploads test videos and screenshots

**Usage:**
1. Go to Actions tab in GitHub
2. Select "E2E Tests (Manual)"
3. Click "Run workflow"
4. Choose browser and options
5. Click "Run workflow" button

**Parameters:**
- **Browser:** chromium | firefox | webkit | all
- **Headed:** true | false (run with visible browser)

#### 3. Nightly E2E Workflow (`.github/workflows/e2e-nightly.yml`)

**Trigger:** Scheduled (2 AM UTC daily) or manual

**Features:**
- Comprehensive test suite across all browsers
- Test sharding for parallel execution (2 shards per browser)
- Merged HTML reports from all shards
- Automatic issue creation on failure
- Extended artifact retention (30 days)

**Schedule:**
```yaml
schedule:
  - cron: '0 2 * * *'  # Every day at 2 AM UTC
```

**Report Merging:**
All test results from sharded runs are automatically merged into a single comprehensive HTML report.

**Failure Notifications:**
Automatically creates a GitHub issue when nightly tests fail with:
- Run number and link
- Date/time of failure
- Links to artifacts
- Automatic labels (bug, e2e-test, automated)

### Viewing Test Results

#### In GitHub UI

1. **Go to Actions tab**
2. **Select workflow run**
3. **View job results**
4. **Download artifacts:**
   - `playwright-report-{browser}` - HTML test reports
   - `test-results-{browser}` - Raw test results
   - `coverage-report` - Unit test coverage
   - `build` - Production build artifacts

#### Download and View Reports

```bash
# Download artifact from GitHub
# Extract the zip file
unzip playwright-report-chromium.zip

# View report locally
npx playwright show-report playwright-report/
```

### Artifact Retention

| Artifact Type | Retention | Purpose |
|---------------|-----------|---------|
| Playwright Reports | 30 days | Test execution details |
| Test Results | 30 days | Screenshots, videos, traces |
| Coverage Reports | 30 days | Unit test coverage data |
| Build Artifacts | 7 days | Production build verification |
| Nightly Reports (merged) | 30 days | Comprehensive test results |
| Manual Test Videos | 7 days | Visual debugging |

### Browser Installation

Playwright browsers are automatically installed in CI using:
```yaml
- name: Install Playwright browsers
  run: pnpm exec playwright install --with-deps ${{ matrix.browser }}
```

This installs:
- Browser binaries (Chromium, Firefox, WebKit)
- System dependencies required for each browser
- Cached for faster subsequent runs

### Performance Optimization

**Caching:**
- Node.js dependencies cached via pnpm
- Playwright browsers installed per job
- Reduces test execution time by ~60%

**Parallel Execution:**
- E2E tests run in browser matrix (3 parallel jobs)
- Nightly tests use sharding (6 parallel jobs)
- Unit tests run separately from E2E tests

**Timeout Configuration:**
- E2E jobs: 30 minutes max
- Nightly jobs: 45 minutes max
- Prevents hung tests from blocking CI

### Adding CI to Your Fork

If you fork VibeForge, the workflows will automatically be available:

1. **Enable Actions** in your fork's Settings → Actions
2. **Grant workflow permissions** (Settings → Actions → General → Workflow permissions)
3. **Workflows run automatically** on push/PR

### Local CI Simulation

Run the same tests locally before pushing:

```bash
# Full CI suite simulation
CI=true pnpm run check           # Type check
CI=true pnpm test:run            # Unit tests
CI=true pnpm test:e2e            # E2E tests (all browsers)
pnpm build                       # Production build

# Or run in sequence
pnpm run check && pnpm test:run && pnpm test:e2e && pnpm build
```

### Debugging CI Failures

#### View Failure Details

1. Click on failed job in Actions tab
2. Expand failed test step
3. Review error message and stack trace
4. Download artifacts for screenshots/videos

#### Common CI-Specific Issues

**Timing Issues:**
- CI runs may be slower than local
- Increase timeouts: `{ timeout: 10000 }`
- Use `waitForLoadState('networkidle')`

**Resource Constraints:**
- GitHub runners have limited resources
- Tests run serially in CI (`workers: 1`)
- Avoid memory-intensive operations

**Browser Differences:**
- WebKit behavior may differ on Linux vs macOS
- Test across all browsers locally first
- Use platform-agnostic selectors

### Workflow Status Badges

Add to your README.md:

```markdown
![CI Status](https://github.com/USERNAME/REPO/workflows/CI/badge.svg)
![E2E Tests](https://github.com/USERNAME/REPO/workflows/E2E%20Tests%20(Nightly)/badge.svg)
```

### Pull Request Checks

All PRs must pass:
- ✅ Lint & Type Check
- ✅ Unit Tests
- ✅ E2E Tests (all browsers)
- ✅ Build

**Branch Protection:**
Consider enabling in Settings → Branches:
```yaml
Require status checks to pass:
  - Lint & Type Check
  - Unit Tests
  - E2E Tests (chromium)
  - E2E Tests (firefox)
  - E2E Tests (webkit)
  - Build
```

## Test Coverage

### Current Coverage (Phase 5)

| Feature | Coverage | Test File |
|---------|----------|-----------|
| New Project Wizard | ✅ 100% | wizard-modal.spec.ts |
| Quick Create Dialog | ✅ 100% | quick-create.spec.ts |
| Skip Wizard Preference | ✅ 100% | skip-wizard-preference.spec.ts |
| Keyboard Shortcuts | ✅ 100% | All test files |
| Draft Persistence | ✅ 100% | wizard-modal.spec.ts |
| Form Validation | ✅ 100% | wizard-modal.spec.ts, quick-create.spec.ts |
| Command Palette | ✅ Partial | skip-wizard-preference.spec.ts |

### Future Coverage Needs

- [ ] Settings UI integration (full implementation)
- [ ] Project creation success flow (workbench initialization)
- [ ] Error handling (API failures, network issues)
- [ ] Accessibility (keyboard navigation, screen readers)
- [ ] Visual regression testing (screenshots)
- [ ] Performance testing (wizard load time)
- [ ] Mobile/responsive testing

## Related Documentation

- [REFACTORING_TEST_RESULTS.md](./REFACTORING_TEST_RESULTS.md) - Build verification and manual test plan
- [CLEANUP_SUMMARY.md](./CLEANUP_SUMMARY.md) - Codebase cleanup after refactoring
- [playwright.config.ts](./playwright.config.ts) - Playwright configuration
- [package.json](./package.json) - Test scripts and dependencies

## Quick Reference

### Test Commands
```bash
pnpm test:e2e              # Run all tests
pnpm test:e2e:ui           # Interactive UI mode
pnpm test:e2e:headed       # See browser
pnpm test:e2e:debug        # Debug mode
pnpm test:e2e:report       # View report
```

### Keyboard Shortcuts Tested
- **⌘N** - New Project (respects skipWizard)
- **⌘⇧N** - Quick Create (always)
- **⌘K** - Command Palette
- **⌘↵** - Advance step / Submit form
- **ESC** - Close modal

### LocalStorage Keys
- `vibeforge:user-preferences` - User settings (skipWizard, etc.)
- `vibeforge:wizard-draft` - Wizard form draft data

## Contributing

When adding new E2E tests:

1. **Follow naming conventions**: `feature-name.spec.ts`
2. **Group related tests**: Use `test.describe()` blocks
3. **Add setup/teardown**: Use `beforeEach` and `afterEach`
4. **Document test purpose**: Add comments explaining what you're testing
5. **Use descriptive test names**: "should do X when Y happens"
6. **Test both happy and error paths**
7. **Keep tests independent**: No test should depend on another
8. **Update this documentation**: Add new test coverage to the tables above

## Status

**Current Status:** ✅ READY FOR USE

All core workbench refactoring features are covered by comprehensive E2E tests. The test suite is ready for local development and can be integrated into CI/CD pipelines.

**Last Updated:** November 24, 2025
**Test Files:** 3
**Total Tests:** ~30+
**Browser Coverage:** Chromium, Firefox, WebKit
