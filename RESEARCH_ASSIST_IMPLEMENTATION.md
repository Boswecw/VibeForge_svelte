# Research & Assist Panel Implementation

## Overview

I've implemented a **Research & Assist side panel** for VibeForge's Workbench—a right-side drawer providing three key functions:

1. **Notes** – Freeform workspace research notebook
2. **Snippets** – Reusable prompt boilerplate blocks (code review, story structure, safety checks, analysis frameworks)
3. **Suggestions** – Static, read-only prompting tips and best practices

The panel is visually lightweight and non-intrusive, always easy to open/close, and fully integrated with the Workbench's 3-column layout.

---

## Architecture

### New Component: `ResearchAssistDrawer.svelte`

**Location:** `src/lib/components/research/ResearchAssistDrawer.svelte`

**Props:**

- `open: boolean` – Controls drawer visibility
- `workspace: string` – Current workspace name (displayed in header)
- `mode?: 'workbench' | 'quick-run'` – Which context the drawer is being used in
- `onClose?: () => void` – Callback when drawer closes
- `onInsertSnippet?: (text: string) => void` – Callback when user inserts a snippet

**Features:**

#### Header

- Displays "Research & Assist" title with workspace context
- Close button and workspace label
- Soft, professional styling that matches VibeForge's design language

#### Tab Navigation

- Three tabs: **Notes**, **Snippets**, **Suggestions**
- Active tab highlighted with amber accent color (`#FBBF24`)
- Smooth transitions between tabs

#### Notes Panel

- Freeform textarea for research notes, links, and references
- Auto-wrapping, resizable (`min-h-60`)
- Persisted locally (TODO: sync to backend per workspace)
- Low cognitive friction—just paste and annotate while working

#### Snippets Panel

- Displays 4 pre-populated, mocked snippets:
  - **Code Review Boilerplate** – comprehensive review checklist
  - **Story Structure Checklist** – narrative beat validation
  - **LLM Safety Check** – pre-deployment verification
  - **Analysis Framework** – structured thinking template
- Each snippet shows:
  - Title and metadata (category, workspace, timestamps)
  - Tags for quick classification
  - Scrollable preview of text content
  - **Insert button** – appends snippet to prompt with newline separator
- Design allows quick visual scanning and one-click insertion

#### Suggestions Panel

- 6 static, read-only suggestions organized by category:
  - **Prompting** (separate instructions from content, be explicit about format, define "good" output)
  - **Structure** (use step-by-step reasoning, explicit format)
  - **Safety** (request self-checks & verification, test edge cases)
  - **Evaluation** (test with edge cases)
- No editing—pure guidance
- Helps users iterate on prompt quality without overwhelming them

---

## Design & UX Philosophy

### Consistency with VibeForge

The Research & Assist panel adheres to VibeForge's core principles:

1. **Low Cognitive Load**

   - Single-column, linear flow (Notes → Snippets → Suggestions)
   - Sidebar drawer doesn't disrupt main workbench
   - Tab navigation is clear and unambiguous

2. **Professional & Quiet**

   - Narrow (`max-w-md`), fixed-width drawer
   - Dark-first theme with light-mode support via `$theme` store
   - Subtle borders and spacing mirror existing VibeForge components

3. **Hierarchy & Clarity**
   - Header provides context (workspace name, mode)
   - Three distinct tabs match VibeForge's pattern of separation of concerns
   - Snippets with visual preview + one-click insertion = low friction

### Theme Support

All components use Tailwind conditional styling based on `$theme` store:

- **Dark mode**: `bg-slate-950`, `border-slate-800`, `text-slate-100`
- **Light mode**: `bg-white`, `border-slate-200`, `text-slate-900`
- **Accent**: Amber (`#FBBF24`) for active tabs and insert buttons

---

## Integration: Workbench

### Changes to `src/routes/+page.svelte`

#### 1. Import

```svelte
import ResearchAssistDrawer from "$lib/components/research/ResearchAssistDrawer.svelte";
```

#### 2. State

```svelte
let isResearchOpen = $state(false);
```

#### 3. Handler for Snippet Insertion

```svelte
const handleInsertSnippet = (text: string) => {
  const currentPrompt = get(promptState).text;
  const newPrompt = currentPrompt ? currentPrompt + "\n\n" + text : text;
  promptState.setText(newPrompt.trim());
};
```

This cleanly appends the snippet to the prompt with spacing, maintaining usability.

#### 4. Header Button

```svelte
<button
  type="button"
  class="px-3 py-2 rounded-md text-sm font-medium transition-all ..."
  onclick={() => (isResearchOpen = true)}
  title="Open Research & Assist panel"
>
  📚 Research / Assist
</button>
```

Added before the "Save as preset" button in the workbench header.

#### 5. Drawer Render

```svelte
<ResearchAssistDrawer
  open={isResearchOpen}
  workspace="VibeForge Dev"
  mode="workbench"
  onClose={() => (isResearchOpen = false)}
  onInsertSnippet={(text) => handleInsertSnippet(text)}
/>
```

Rendered at the bottom of the template, alongside Presets and SavePresetModal.

---

## Mocked Data

### Snippets

Four carefully designed, domain-specific snippets:

1. **Code Review Boilerplate**

   - Checks for: security, performance, style, tests, documentation
   - Risk levels and structured response format
   - Tags: `code`, `review`, `boilerplate`

2. **Story Structure Checklist**

   - Verifies: protagonist motivation, inciting incident, stakes, obstacles, climax, resolution
   - Pacing guidance
   - Tags: `story`, `structure`, `writing`

3. **LLM Safety Check**

   - Pre-deployment verification: hallucinations, leaks, jailbreaks, tone, citations
   - Tags: `safety`, `verification`, `llm`

4. **Analysis Framework**
   - Structured thinking: context, question, factors, trade-offs, uncertainties, next steps
   - Tags: `analysis`, `framework`, `research`

### Suggestions

Six actionable, static tips:

- Separate instructions from content
- Be explicit about format
- Request self-checks and verification
- Use step-by-step reasoning
- Define "good" output
- Test with edge cases

Each with title, category, and descriptive body.

---

## Local-Only Features & TODOs

### Current Behavior

- **Notes**: Stored in component local state (`let notes = $state('')`); persists during session only
- **Snippets**: Mocked inline; not loaded from backend or workspace-specific data
- **Suggestions**: Static array; no personalization or learning

### Future Enhancements (TODO)

1. **Persist notes per workspace** – Save to localStorage or backend
2. **Load workspace-specific snippets** – Query backend for user's saved snippets
3. **Dynamic suggestions** – Surface tips based on context (detected language, domain, model)
4. **Add snippet creation UI** – Allow users to save and name their own snippets
5. **Sync across sessions** – Use a store + localStorage pattern (see `accessibilityStore.ts` for reference)

---

## Optional: Quick Run Integration

To add the Research & Assist drawer to Quick Run:

```svelte
// In src/routes/quick-run/+page.svelte

import ResearchAssistDrawer from "$lib/components/research/ResearchAssistDrawer.svelte";

let isResearchOpen = $state(false);

const handleInsertSnippet = (text: string) => {
  promptText.set(get(promptText) + "\n\n" + text); // Append to quick run prompt
};

// In header:
<button onclick={() => (isResearchOpen = true)}>📚 Research</button>

// In template:
<ResearchAssistDrawer
  open={isResearchOpen}
  workspace="Quick Run"
  mode="quick-run"
  onClose={() => (isResearchOpen = false)}
  onInsertSnippet={(text) => handleInsertSnippet(text)}
/>
```

---

## Summary: Why This Works

### User Experience

- **Contextual support without context-switching** – Research notes, prompting tips, and boilerplate are always a click away
- **Reduces friction** – Insert a full snippet in one click instead of manual copy-paste
- **Supports different workflows** – Notes for planning, snippets for consistency, suggestions for learning

### Architecture

- **Lightweight & modular** – Single component with clear props, no complex state management
- **Theme-consistent** – Uses existing `$theme` store, matches VibeForge's visual language
- **Event-driven** – Passes data back to parent via callbacks (`onClose`, `onInsertSnippet`)
- **Easy to extend** – Mocked data can be swapped for real backend queries later

### Developer Experience

- **Clear separation** – Notes panel, snippets panel, suggestions panel are logically distinct
- **Svelte 5 patterns** – Uses modern `$state` runes, event handlers, and derived state
- **No external dependencies** – Only uses VibeForge's existing theme store and Tailwind

---

## Files

### Created

- `src/lib/components/research/ResearchAssistDrawer.svelte` – Main drawer component with integrated panels

### Modified

- `src/routes/+page.svelte` – Added import, state, handler, button, and drawer render

---

## Next Steps

1. **Test in dev** – Run `pnpm dev` and verify the drawer opens/closes, snippets insert, and theme toggles work
2. **Refine mocked data** – Adjust snippets and suggestions based on actual user feedback
3. **Add Quick Run integration** – Follow the pattern above to reuse the drawer
4. **Backend integration** – When ready, replace mocked `snippets` and `suggestions` arrays with store queries
5. **Note persistence** – Implement localStorage sync for notes (reference `accessibilityStore.ts`)

---

## Design Rationale

### Why a Right-Side Drawer?

- Complements the 3-column layout without disrupting it
- Parallels sidebar conventions users know (Slack, VS Code, Figma)
- Doesn't steal screen space from the main prompt/output columns

### Why These Three Tabs?

- **Notes** = Personal workspace context
- **Snippets** = Reusable patterns
- **Suggestions** = Just-in-time guidance
- Together: a complete "assist" surface

### Why Mocked Data?

- Allows immediate UX validation without backend dependencies
- Easy to replace with real data when backend is ready
- Demonstrates the intended use patterns clearly

---

**Status:** Ready to integrate and test. The component is production-ready for the UI/UX layer; backend wiring (notes persistence, dynamic snippets) can be added incrementally.
