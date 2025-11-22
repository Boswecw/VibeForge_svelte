# VibeForge Testing Guide

Testing procedures, checklists, and guidelines for VibeForge.

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Type Checking](#type-checking)
3. [Manual Testing](#manual-testing)
4. [Feature Testing Checklists](#feature-testing-checklists)
5. [Browser Testing](#browser-testing)
6. [Accessibility Testing](#accessibility-testing)
7. [Performance Testing](#performance-testing)

---

## Testing Overview

VibeForge currently uses **manual testing** and **TypeScript type checking** as the primary testing methods. Automated unit and integration tests are planned for future implementation.

### Testing Strategy

1. **Type Checking** - Compile-time type safety with TypeScript
2. **Manual Testing** - User-driven testing of features and workflows
3. **Browser Testing** - Cross-browser compatibility testing
4. **Accessibility Testing** - Screen reader and keyboard navigation testing
5. **Performance Testing** - Bundle size and runtime performance monitoring

---

## Type Checking

### Running Type Checks

```bash
# One-time type check
pnpm check

# Watch mode (continuous checking)
pnpm check:watch

# Type check with verbose output
pnpm check --verbose
```

### Expected Output

```
Loading svelte-check in workspace: /path/to/vibeforge
Getting Svelte diagnostics...
====================================

svelte-check found 0 errors, 0 warnings, and 0 hints
```

### Common Type Errors

#### Missing type annotations

**Error:**
```
Parameter 'context' implicitly has an 'any' type.
```

**Fix:**
```svelte
<script lang="ts">
  import type { ContextBlock } from '$lib/types/context';
  
  let { context }: { context: ContextBlock } = $props();
</script>
```

#### Incorrect prop types

**Error:**
```
Type 'string' is not assignable to type 'number'.
```

**Fix:**
```svelte
<!-- Ensure prop types match -->
<Component count={123} /> <!-- number -->
<Component name="test" /> <!-- string -->
```

---

## Manual Testing

### Pre-Release Testing Checklist

Before releasing a new feature or version, complete this checklist:

#### General

- [ ] Application loads without errors
- [ ] No console errors or warnings
- [ ] TypeScript compilation passes (`pnpm check`)
- [ ] All navigation links work
- [ ] Theme toggle works (dark/light)
- [ ] Settings persist across page reloads

#### Dark/Light Mode

- [ ] All pages render correctly in dark mode
- [ ] All pages render correctly in light mode
- [ ] Theme toggle button works
- [ ] Theme preference persists in localStorage
- [ ] No visual glitches when switching themes

#### Responsive Design

- [ ] Mobile (320px - 767px) - Layout adapts correctly
- [ ] Tablet (768px - 1023px) - Layout adapts correctly
- [ ] Desktop (1024px+) - Full layout displays correctly
- [ ] No horizontal scrolling on any screen size
- [ ] Touch targets are at least 44x44px on mobile

---

## Feature Testing Checklists

### Main Workbench

- [ ] ContextColumn displays available contexts
- [ ] PromptColumn textarea accepts input
- [ ] OutputColumn displays placeholder or responses
- [ ] Research & Assist panel opens/closes
- [ ] Active contexts are visually indicated
- [ ] Token counter updates as prompt changes
- [ ] Run button is clickable (even if not functional yet)

### Context Library

- [ ] Context list displays correctly
- [ ] Search bar filters contexts
- [ ] Type filter works (system, design, project, code, workflow)
- [ ] Tag filter works
- [ ] Context detail panel shows full context
- [ ] "Send to Workbench" button works
- [ ] "Add Documents" button opens upload modal

### Document Ingestion

- [ ] Upload modal opens when "Add Documents" is clicked
- [ ] Drag-drop file upload works
- [ ] File selection dialog works
- [ ] Metadata fields are editable (title, category, tags)
- [ ] "Ingest Documents" button adds files to queue
- [ ] Ingestion queue displays with correct status
- [ ] Status indicators update (queued → processing → ready)
- [ ] Error states display correctly

### Research & Assist Panel

- [ ] Panel opens/closes correctly
- [ ] Three tabs are visible (Notes, Snippets, Suggestions)
- [ ] Tab switching works
- [ ] Notes textarea accepts input
- [ ] Notes persist across page reloads (if implemented)
- [ ] Snippets display correctly
- [ ] "Insert" button adds snippet to prompt (if implemented)
- [ ] Suggestions display correctly

### Quick Run

- [ ] Page loads correctly
- [ ] Prompt textarea accepts input
- [ ] Model selection works
- [ ] Run button is clickable
- [ ] Simplified layout displays correctly

### Run History

- [ ] History table displays past runs
- [ ] Filters work (date, model, status)
- [ ] Search works
- [ ] Run detail panel shows full details
- [ ] Replay button works (if implemented)
- [ ] Export button works (if implemented)

### Prompt Patterns

- [ ] Pattern list displays correctly
- [ ] Search and filters work
- [ ] Pattern detail panel shows full pattern
- [ ] "Load into Workbench" button works (if implemented)
- [ ] Usage metrics display correctly

### Presets

- [ ] Preset list displays correctly
- [ ] "Save as Preset" button works
- [ ] Preset detail panel shows full preset
- [ ] "Load Preset" button works
- [ ] Pin/unpin functionality works
- [ ] Delete preset works

### Evaluations

- [ ] Evaluation list displays correctly
- [ ] "New Evaluation" button works
- [ ] Evaluation detail shows scoring interface
- [ ] Criteria definition works
- [ ] Scoring interface works
- [ ] Export results works (if implemented)

### Workspaces

- [ ] Workspace list displays correctly
- [ ] "New Workspace" button works
- [ ] Workspace switching works
- [ ] Workspace detail panel shows settings
- [ ] Archive/delete workspace works
- [ ] Activity tracking displays correctly

### Settings

- [ ] Settings page loads correctly
- [ ] Theme toggle works
- [ ] Font size adjustment works
- [ ] UI density control works
- [ ] API key fields accept input
- [ ] Settings persist across page reloads
- [ ] Export data button works (if implemented)

---

## Browser Testing

### Supported Browsers

Test in the following browsers:

- [ ] **Chrome** 90+ (primary)
- [ ] **Firefox** 88+
- [ ] **Safari** 14+
- [ ] **Edge** 90+

### Browser-Specific Issues

#### Safari

- Check for CSS Grid/Flexbox issues
- Test localStorage persistence
- Verify theme toggle works

#### Firefox

- Check for Tailwind CSS compatibility
- Test responsive design
- Verify all interactive elements work

---

## Accessibility Testing

### Keyboard Navigation

- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Escape key closes modals/drawers
- [ ] Enter key activates buttons

### Screen Reader Testing

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Buttons have descriptive text
- [ ] ARIA labels are present where needed
- [ ] Headings are properly structured (h1, h2, h3)

### Color Contrast

- [ ] Text meets WCAG AA contrast ratio (4.5:1)
- [ ] Interactive elements meet WCAG AA contrast ratio
- [ ] Focus indicators are visible

---

## Performance Testing

### Bundle Size

```bash
# Build for production
pnpm build

# Check bundle size
ls -lh .svelte-kit/output/client/_app/immutable/chunks/
```

**Target:** < 200KB (gzipped)

### Runtime Performance

- [ ] Page load time < 2 seconds
- [ ] Time to interactive < 3 seconds
- [ ] No layout shifts (CLS < 0.1)
- [ ] Smooth scrolling (60fps)
- [ ] No memory leaks

### Lighthouse Audit

```bash
# Build and preview
pnpm build
pnpm preview

# Run Lighthouse in Chrome DevTools
# Target scores:
# - Performance: > 90
# - Accessibility: > 95
# - Best Practices: > 90
# - SEO: > 90
```

---

**For more information, see:**

- [README.md](./README.md) - Project overview
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflows
- [FEATURES.md](./FEATURES.md) - Feature documentation

