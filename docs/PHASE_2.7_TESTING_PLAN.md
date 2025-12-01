# Phase 2.7: Testing & Polish Plan

**Version**: 1.0
**Created**: December 1, 2025
**Estimated Duration**: 2-3 hours
**Status**: Ready for Execution

---

## Overview

This document provides a comprehensive testing plan for Phase 2.7 features before proceeding to Phase 4.

### Scope

**Phase 2.7 Components to Test**:
1. ✅ Tauri Runtime Check Service (Rust backend)
2. ✅ Dev Environment Panel UI (4 Svelte components)
3. ✅ Wizard Runtime Integration (Steps 2, 3, 5)
4. ✅ Dev-Container Templates (5 templates + browser)

---

## Testing Strategy

### Levels
1. **Manual Testing**: Interactive UI testing in browser/Tauri app
2. **Functional Testing**: Feature completeness verification
3. **Integration Testing**: Cross-component interactions
4. **UX Testing**: User experience and polish

### Environment
- **Frontend**: SvelteKit dev server (port 5173)
- **Backend**: FastAPI dev server (port 8000)
- **Desktop**: Tauri app (cargo tauri dev)
- **Browser**: Chrome/Firefox for web testing

---

## Test Plan

### Section 1: Runtime Detection System (Tauri Backend)

#### 1.1 Runtime Check Service

**Test Case 1.1.1: Basic Runtime Detection**

```bash
# Start Tauri app
cd vibeforge
cargo tauri dev
```

**Expected Results**:
- [ ] App launches without errors
- [ ] Runtime check service initializes
- [ ] No Rust compilation errors
- [ ] No console errors in terminal

**Test Case 1.1.2: Check All Runtimes**

**Steps**:
1. Open Dev Environment Panel
2. Navigate to "Status" tab
3. Click "Refresh" button

**Expected Results**:
- [ ] All 15 runtimes checked (Node, Python, Go, Rust, Java, C, C++, Bash, Git, Docker, npm, pnpm, Dart, Kotlin, Swift)
- [ ] Versions displayed correctly for installed runtimes
- [ ] PATH resolution shown for installed runtimes
- [ ] Missing runtimes show "❌ Not Found"
- [ ] Container-only runtimes (Dart, Kotlin, Swift) show "🐳 Dev-Container"
- [ ] Last checked timestamp updates

**Test Case 1.1.3: Runtime Cache**

**Steps**:
1. Click "Refresh" button
2. Note the timestamp
3. Click "Refresh" again within 5 minutes

**Expected Results**:
- [ ] First refresh queries system
- [ ] Second refresh uses cached results (5-minute TTL)
- [ ] Timestamp remains the same (cache hit)
- [ ] Results consistent between refreshes

**Test Case 1.1.4: Version Parsing**

**Verify** (for installed runtimes):
- [ ] Node.js version format: `v20.x.x` or `v18.x.x`
- [ ] Python version: `3.x.x`
- [ ] Go version: `go1.x.x`
- [ ] Rust version: `1.x.x`
- [ ] Git version: `2.x.x`
- [ ] npm version: `10.x.x` or `9.x.x`
- [ ] pnpm version: `8.x.x` or `9.x.x`

**Bug Checks**:
- [ ] No crashes on missing runtimes
- [ ] No infinite loops
- [ ] No memory leaks (check memory usage)

---

### Section 2: Dev Environment Panel UI

#### 2.1 RuntimeStatusTable Component

**Test Case 2.1.1: Table Display**

**Steps**:
1. Open Dev Environment Panel
2. Navigate to "Status" tab

**Expected Results**:
- [ ] Table renders correctly
- [ ] All 15 runtimes listed
- [ ] Columns visible: Name, Category, Status, Version, Path, Actions
- [ ] Status icons correct (✔️/🐳/❌)
- [ ] Colors appropriate (green/blue/red)
- [ ] Responsive layout (resize window)

**Test Case 2.1.2: Sorting**

**Steps**:
1. Click "Sort by Status"
2. Click "Sort by Category"
3. Click "Sort by Name"

**Expected Results**:
- [ ] Status: Installed → Container-only → Missing
- [ ] Category: Alphabetical grouping
- [ ] Name: Alphabetical order
- [ ] Sorting persists on refresh

**Test Case 2.1.3: Filtering**

**Steps**:
1. Select "Frontend" category filter
2. Select "Backend" category
3. Select "Systems" category
4. Try search functionality (if implemented)

**Expected Results**:
- [ ] Only matching runtimes visible
- [ ] Filter persists during session
- [ ] "Clear Filters" button works

**Test Case 2.1.4: Summary Cards**

**Expected Results**:
- [ ] "Installed" count accurate
- [ ] "Missing" count accurate
- [ ] "Container-only" count accurate (should be 3: Dart, Kotlin, Swift)
- [ ] Total count = 15

---

#### 2.2 InstallationGuide Component

**Test Case 2.2.1: Install Instructions**

**Steps**:
1. Navigate to "Install" tab
2. Select a missing runtime (e.g., Python if not installed)
3. Check platform-specific commands

**Expected Results**:
- [ ] Ubuntu commands shown (apt-get)
- [ ] macOS commands shown (brew) - if on macOS
- [ ] Windows commands shown - if on Windows
- [ ] Platform icons visible (🐧/🍎/🪟)
- [ ] Commands syntax-highlighted

**Test Case 2.2.2: Copy to Clipboard**

**Steps**:
1. Click "Copy" button for Ubuntu command
2. Paste into text editor

**Expected Results**:
- [ ] Command copied correctly
- [ ] Button shows "Copied!" feedback
- [ ] Feedback resets after 2 seconds
- [ ] No extra whitespace

**Test Case 2.2.3: External Links**

**Steps**:
1. Click documentation link for Node.js
2. Click documentation link for Python

**Expected Results**:
- [ ] Links open in new tab/window
- [ ] Correct URLs (nodejs.org, python.org)
- [ ] No broken links

**Test Case 2.2.4: Container-Only Notices**

**Steps**:
1. Select Dart, Kotlin, or Swift

**Expected Results**:
- [ ] Notice: "This runtime requires a Dev-Container"
- [ ] Link to Dev-Container tab
- [ ] Explanation about mobile SDKs
- [ ] No host install instructions shown

---

#### 2.3 ToolchainsConfig Component

**Test Case 2.3.1: Path Overrides**

**Steps**:
1. Navigate to "Config" tab
2. Find Node.js runtime
3. Enable "Custom Path"
4. Enter: `/usr/local/bin/node`
5. Click "Save"

**Expected Results**:
- [ ] Toggle enables input field
- [ ] Input field accepts path
- [ ] "Save" button enabled
- [ ] Configuration saved (check localStorage)
- [ ] "Saved!" confirmation shown

**Test Case 2.3.2: Persistence**

**Steps**:
1. Set custom path for Node.js
2. Refresh page
3. Check Node.js configuration

**Expected Results**:
- [ ] Custom path persists after refresh
- [ ] Toggle remains enabled
- [ ] Path value retained

**Test Case 2.3.3: Reset Functionality**

**Steps**:
1. Set custom path for Node.js
2. Click "Reset to Default" for Node.js
3. Verify change

**Expected Results**:
- [ ] Custom path cleared
- [ ] Toggle disabled
- [ ] Auto-detected path shown
- [ ] localStorage updated

**Test Case 2.3.4: Bulk Reset**

**Steps**:
1. Set custom paths for 2-3 runtimes
2. Click "Reset All to Defaults"
3. Confirm action

**Expected Results**:
- [ ] Confirmation dialog appears
- [ ] All custom paths cleared
- [ ] All toggles disabled
- [ ] localStorage cleared
- [ ] Success message shown

**Test Case 2.3.5: Validation**

**Steps**:
1. Enter invalid path: `/nonexistent/path`
2. Try to save

**Expected Results**:
- [ ] Validation warning shown (if implemented)
- [ ] Or: saves but shows warning indicator
- [ ] User aware of potential issue

---

#### 2.4 DevContainerGenerator Component

**Test Case 2.4.1: Template Browser**

**Steps**:
1. Navigate to "Dev-Container" tab
2. View template grid

**Expected Results**:
- [ ] 5 templates displayed:
  - Base Development
  - Mobile Development
  - Full-Stack Development
  - SvelteKit Development
  - FastAPI Backend
- [ ] Each template shows:
  - Icon
  - Name
  - Description
  - Complexity badge (Simple/Moderate/Complex)
  - Languages list
  - Use cases
- [ ] Responsive grid (2 columns → 1 on mobile)

**Test Case 2.4.2: Search Functionality**

**Steps**:
1. Enter "python" in search box
2. Enter "mobile" in search box
3. Enter "fastapi" in search box
4. Clear search

**Expected Results**:
- [ ] "python": Shows Base, Full-Stack, FastAPI templates
- [ ] "mobile": Shows Mobile Development template
- [ ] "fastapi": Shows FastAPI Backend template
- [ ] Clear: All templates visible
- [ ] Result count updates correctly

**Test Case 2.4.3: Complexity Filtering**

**Steps**:
1. Select "Simple" filter
2. Select "Moderate" filter
3. Select "Complex" filter
4. Select "All Complexities"

**Expected Results**:
- [ ] Simple: Base, SvelteKit (2 templates)
- [ ] Moderate: FastAPI (1 template)
- [ ] Complex: Mobile, Full-Stack (2 templates)
- [ ] All: 5 templates
- [ ] Result count accurate

**Test Case 2.4.4: Template Details**

**Steps**:
1. Click "View Details" on Base template
2. Review information
3. Click "Back to templates"

**Expected Results**:
- [ ] Detail view loads
- [ ] Shows:
  - Large icon
  - Full description
  - Included languages (badges)
  - Pre-installed tools (badges)
  - Use cases (bulleted list)
  - Information box
  - Generate button
  - Cancel button
- [ ] Back navigation works

**Test Case 2.4.5: Template Generation (Placeholder)**

**Steps**:
1. Open Base template details
2. Click "Generate Dev-Container"

**Expected Results**:
- [ ] Alert/modal shows: "Generating dev-container for: Base Development"
- [ ] Message mentions `.devcontainer/devcontainer.json`
- [ ] No actual file generated (TODO in code)
- [ ] User aware feature is placeholder

**Bug Checks**:
- [ ] No console errors
- [ ] Hover effects work
- [ ] No layout breaks
- [ ] Colors match theme

---

### Section 3: Wizard Runtime Integration

#### 3.1 Step 2 (Languages) Integration

**Test Case 3.1.1: Runtime Requirements Display**

**Steps**:
1. Open New Project Wizard (`/wizard`)
2. Navigate to Step 2 (Languages)
3. Select TypeScript as primary language

**Expected Results**:
- [ ] "Runtime Requirements" section appears
- [ ] Shows: javascript-typescript, git, npm
- [ ] RuntimeRequirements component renders

**Test Case 3.1.2: Dynamic Updates**

**Steps**:
1. Select Python as primary language
2. Add Rust as additional language
3. Remove Rust

**Expected Results**:
- [ ] Requirements update to: python, git
- [ ] Adding Rust adds: rust
- [ ] Removing Rust removes: rust
- [ ] No duplicate entries
- [ ] Real-time updates (no refresh needed)

**Test Case 3.1.3: Status Indicators**

**Expected Results**:
- [ ] Installed runtimes: Green ✅ icon
- [ ] Missing runtimes: Red ❌ icon
- [ ] Container-only: Blue 🐳 icon
- [ ] Accurate status for all shown runtimes

**Test Case 3.1.4: Summary Stats**

**Expected Results**:
- [ ] "X of Y installed" text accurate
- [ ] Warning if missing required runtimes
- [ ] Success message if all installed

---

#### 3.2 Step 3 (Stack) Integration

**Test Case 3.2.1: Stack-Specific Requirements**

**Steps**:
1. Select TypeScript primary language
2. Navigate to Step 3 (Stack)
3. Select SvelteKit stack

**Expected Results**:
- [ ] Requirements show: javascript-typescript, pnpm, git, npm
- [ ] "Required Runtimes for Selected Stack" title visible
- [ ] pnpm added by stack selection

**Test Case 3.2.2: Different Stacks**

**Steps**:
1. Select Python primary language
2. Select FastAPI stack
3. Switch to Flask stack

**Expected Results**:
- [ ] FastAPI: python, git
- [ ] Flask: python, git
- [ ] Switching updates requirements

**Test Case 3.2.3: No Framework Option**

**Steps**:
1. Select "No Framework (Plain Language)"

**Expected Results**:
- [ ] Shows base language runtime + git
- [ ] No additional stack requirements

---

#### 3.3 Step 5 (Review) Integration

**Test Case 3.3.1: Complete Requirements**

**Steps**:
1. Complete wizard Steps 1-4
2. Navigate to Step 5 (Review)
3. Find "Runtime Checklist" section

**Expected Results**:
- [ ] Section labeled "Runtime Checklist"
- [ ] Shows ALL requirements from:
  - Primary language
  - Additional languages
  - Stack selection
  - Baseline (git, npm if applicable)
- [ ] No duplicates
- [ ] Status indicators for each

**Test Case 3.3.2: Review-Only Mode**

**Expected Results**:
- [ ] Install buttons disabled or hidden
- [ ] Read-only display
- [ ] Clear status for each runtime
- [ ] Warning if missing runtimes

**Test Case 3.3.3: Missing Runtime Warning**

**Steps**:
1. Configure project requiring Python
2. Assume Python not installed
3. Check Step 5

**Expected Results**:
- [ ] Warning banner: "Some required runtimes are missing"
- [ ] List of missing runtimes highlighted
- [ ] Suggestion to install before generating

---

### Section 4: Dev-Container Templates (Files)

#### 4.1 Template JSON Files

**Test Case 4.1.1: Base Template**

**File**: `src/lib/templates/devcontainer/base.json`

**Verify**:
- [ ] Valid JSON syntax
- [ ] Contains: Node.js, Python, Rust features
- [ ] Port forwarding: 3000, 5000, 8000, 8080
- [ ] VS Code extensions list present
- [ ] postCreateCommand includes: pnpm install, pip upgrade

**Test Case 4.1.2: Mobile Template**

**File**: `src/lib/templates/devcontainer/mobile.json`

**Verify**:
- [ ] Valid JSON syntax
- [ ] Contains: Java 17, common-utils
- [ ] Volume mounts for Flutter SDK and Android SDK
- [ ] Environment variables: ANDROID_SDK_ROOT, FLUTTER_ROOT
- [ ] onCreateCommand references setup-mobile.sh
- [ ] privileged: true (for emulator)
- [ ] /dev/kvm device access

**Test Case 4.1.3: Full-Stack Template**

**File**: `src/lib/templates/devcontainer/fullstack.json`

**Verify**:
- [ ] Valid JSON syntax
- [ ] Contains: Node, Python, Go, Rust, Java features
- [ ] Docker-in-Docker feature
- [ ] kubectl-helm-minikube feature
- [ ] Port forwarding: 7 ports (web servers + databases)
- [ ] Extensive VS Code extensions

**Test Case 4.1.4: SvelteKit Template**

**File**: `src/lib/templates/devcontainer/sveltekit.json`

**Verify**:
- [ ] Valid JSON syntax
- [ ] TypeScript-Node base image
- [ ] Svelte-specific extensions
- [ ] Port forwarding: 5173 (Vite), 4173 (preview)
- [ ] Lightweight compared to fullstack

**Test Case 4.1.5: FastAPI Template**

**File**: `src/lib/templates/devcontainer/fastapi.json`

**Verify**:
- [ ] Valid JSON syntax
- [ ] Python 3.11 base image
- [ ] Black formatter, Ruff linter extensions
- [ ] Port forwarding: 8000 (FastAPI), 5432 (PostgreSQL)
- [ ] FastAPI packages in postCreateCommand

---

#### 4.2 Mobile Setup Script

**Test Case 4.2.1: Script Syntax**

**File**: `src/lib/templates/devcontainer/setup-mobile.sh`

**Verify**:
- [ ] Valid Bash syntax
- [ ] Shebang: `#!/bin/bash`
- [ ] Flutter installation logic
- [ ] Android SDK download logic
- [ ] sdkmanager commands correct
- [ ] Flutter doctor command at end

**Test Case 4.2.2: Script Execution (Manual)**

**Note**: Only test if you have time and Docker available

**Steps**:
```bash
cd src/lib/templates/devcontainer
chmod +x setup-mobile.sh
# Review script (DO NOT RUN unless in container)
cat setup-mobile.sh
```

**Expected Results**:
- [ ] Script readable
- [ ] Commands look safe
- [ ] No obvious errors

---

### Section 5: Integration Tests

#### 5.1 Cross-Component Integration

**Test Case 5.1.1: Wizard → Dev Environment Panel**

**Steps**:
1. Start in wizard
2. Note missing runtimes in Step 2
3. Open Dev Environment Panel (new tab or side navigation if available)
4. Check Status tab

**Expected Results**:
- [ ] Missing runtimes consistent between views
- [ ] Status indicators match

**Test Case 5.1.2: Config → Wizard**

**Steps**:
1. Set custom Node.js path in Config tab
2. Return to wizard
3. Check Step 2 runtime status

**Expected Results**:
- [ ] Custom path used for detection (if refresh triggered)
- [ ] Or: requires explicit refresh

**Test Case 5.1.3: Template Recommendation**

**Steps**:
1. Complete wizard Steps 1-3
2. Open Dev Environment Panel → Dev-Container tab
3. Check if selected stack matches recommended template

**Expected Results**:
- [ ] SvelteKit stack → SvelteKit template highlighted
- [ ] FastAPI stack → FastAPI template highlighted
- [ ] Mobile languages → Mobile template highlighted

---

### Section 6: UX & Polish

#### 6.1 Visual Polish

**Checklist**:
- [ ] Consistent color scheme (green/blue/red for statuses)
- [ ] Icons render correctly
- [ ] Fonts legible
- [ ] Spacing appropriate
- [ ] No overlapping elements
- [ ] Hover effects smooth
- [ ] Transitions not jarring

#### 6.2 Responsive Design

**Test Viewports**:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1440x900)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

**Expected**:
- [ ] Layout adapts
- [ ] No horizontal scroll
- [ ] Buttons accessible
- [ ] Text readable

#### 6.3 Loading States

**Checklist**:
- [ ] Refresh button shows loading spinner
- [ ] Template loading shows indicator
- [ ] No blank screens during load

#### 6.4 Error Handling

**Test Scenarios**:
1. Backend unavailable
2. Tauri command fails
3. Invalid template data

**Expected**:
- [ ] Graceful error messages
- [ ] No app crashes
- [ ] Recovery options shown

---

## Bug Tracking Template

### Bug Report Format

```markdown
**Bug ID**: BUG-2.7-001
**Severity**: Critical / High / Medium / Low
**Component**: RuntimeStatusTable / InstallationGuide / etc.
**Title**: Brief description

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Behavior**:
What should happen

**Actual Behavior**:
What actually happens

**Environment**:
- OS: Ubuntu 22.04 / macOS / Windows
- Browser: Chrome 120 / Firefox
- Node: v20.x.x

**Screenshot**: (if applicable)

**Fix Proposed**: (if known)
```

---

## Polish Checklist

### Code Quality
- [ ] No console.error() in production
- [ ] No unused imports
- [ ] No TypeScript errors
- [ ] Consistent code style
- [ ] Comments on complex logic

### Documentation
- [ ] All TODO comments addressed or documented
- [ ] Component props documented
- [ ] README updated if needed

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader labels (ARIA)
- [ ] Color contrast sufficient
- [ ] Focus indicators visible

### Performance
- [ ] No memory leaks
- [ ] Fast initial load
- [ ] Smooth scrolling
- [ ] Efficient re-renders

---

## Testing Timeline

### Session 1 (1 hour)
- Section 1: Runtime Detection System
- Section 2.1-2.2: Dev Environment Panel (Status, Install tabs)

### Session 2 (1 hour)
- Section 2.3-2.4: Dev Environment Panel (Config, Dev-Container tabs)
- Section 3: Wizard Runtime Integration

### Session 3 (30 min - 1 hour)
- Section 4: Template files review
- Section 5: Integration tests
- Section 6: UX & Polish

**Total**: 2.5-3 hours

---

## Success Criteria

### Must-Have (Blocking Issues)
- [ ] No critical bugs (app crashes, data loss)
- [ ] Runtime detection works for at least 5 runtimes
- [ ] Wizard shows runtime requirements correctly
- [ ] Templates are valid JSON

### Should-Have (Important)
- [ ] All 15 runtimes detected correctly
- [ ] UI is responsive
- [ ] No console errors
- [ ] Persistence works (localStorage)

### Nice-to-Have (Polish)
- [ ] Smooth animations
- [ ] Excellent error messages
- [ ] Keyboard shortcuts
- [ ] Advanced filtering

---

## Next Steps After Testing

1. **Document Findings**: Create `PHASE_2.7_TESTING_REPORT.md`
2. **Fix Critical Bugs**: Address blocking issues first
3. **Polish**: Improve UX based on findings
4. **Update Documentation**: Reflect any changes
5. **Prepare for Phase 4**: Once stable, proceed to advanced features

---

**Document Status**: Ready for Execution
**Estimated Completion**: December 1-2, 2025
**Owner**: Testing Team / Charles
