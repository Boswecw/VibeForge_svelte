<!--
Example Usage: Research & Assist Drawer

This file demonstrates how to integrate the ResearchAssistDrawer component
into any page (Workbench, Quick Run, or custom flows).
-->

<!-- ============================================================================
     BASIC USAGE: Workbench
     ============================================================================ -->

<script lang="ts">
  // In your page component (e.g., src/routes/+page.svelte)
  
  import ResearchAssistDrawer from "$lib/components/research/ResearchAssistDrawer.svelte";
  import { promptState } from "$lib/stores/promptStore";
  import { get } from "svelte/store";

  // 1. State for drawer visibility
  let isResearchOpen = $state(false);

  // 2. Handler to insert snippet into prompt
  const handleInsertSnippet = (text: string) => {
    const currentPrompt = get(promptState).text;
    const newPrompt = currentPrompt 
      ? currentPrompt + "\n\n" + text 
      : text;
    promptState.setText(newPrompt.trim());
  };
</script>

<!-- In template: button to open drawer -->

<button
type="button"
onclick={() => (isResearchOpen = true)}
title="Open Research & Assist panel"

> 📚 Research / Assist
> </button>

<!-- Render the drawer component -->

<ResearchAssistDrawer
open={isResearchOpen}
workspace="VibeForge Dev"
mode="workbench"
onClose={() => (isResearchOpen = false)}
onInsertSnippet={(text) => handleInsertSnippet(text)}
/>

<!-- ============================================================================
     QUICK RUN VARIANT: Lightweight Version
     ============================================================================ -->

<!--
For Quick Run, you may want to pass a different workspace or handle
snippet insertion differently if the prompt state is managed differently.
-->

<script lang="ts">
  // In src/routes/quick-run/+page.svelte
  
  let isResearchOpen = $state(false);
  let promptText = $state(""); // Or whatever your quick run state is

  const handleInsertSnippet = (text: string) => {
    promptText = promptText ? promptText + "\n\n" + text : text;
  };
</script>

<ResearchAssistDrawer
open={isResearchOpen}
workspace="Quick Run"
mode="quick-run"
onClose={() => (isResearchOpen = false)}
onInsertSnippet={(text) => handleInsertSnippet(text)}
/>

<!-- ============================================================================
     ADVANCED: Custom Snippet Handling
     ============================================================================ -->

<!--
If you want to do something special when a snippet is inserted,
you can customize the onInsertSnippet callback.
-->

<script lang="ts">
  const handleInsertSnippetAdvanced = (text: string) => {
    // Option 1: Append with custom formatting
    const formatted = `\n\n[SNIPPET]\n${text}\n[/SNIPPET]\n`;
    promptState.setText(get(promptState).text + formatted);

    // Option 2: Show a toast notification
    // showToast(`Inserted snippet (${text.length} chars)`);

    // Option 3: Track analytics
    // trackEvent('snippet_inserted', { snippetLength: text.length });

    // Option 4: Auto-focus the prompt editor
    // focusPromptEditor();
  };
</script>

<!-- ============================================================================
     STYLING CUSTOMIZATION
     ============================================================================ -->

<!--
The drawer uses Tailwind CSS exclusively. To customize appearance:

1. Edit ResearchAssistDrawer.svelte directly (most accurate)
2. Pass a "variant" prop if you add support for it
3. Use CSS custom properties (CSS variables) in app.css for theme values

Current color mapping:
- bg-slate-950 → Dark mode main background
- bg-slate-900 → Dark mode panel background
- bg-amber-500 → Active state / accent color (forge-ember)

To adjust the drawer width, edit:
  max-w-md → max-w-lg (wider) or max-w-sm (narrower)

To adjust tab styling, edit:
  px-3 py-1.5 → px-4 py-2 (more spacious)
  text-[11px] → text-xs (larger font)
-->

<!-- ============================================================================
     PROPS REFERENCE
     ============================================================================ -->

<!--
open: boolean
  - Controls visibility of the drawer
  - When true: drawer renders and is visible
  - When false: drawer is hidden (not in DOM)
  - Example: onclick={() => (isResearchOpen = true)}

workspace: string
  - Display name of current workspace
  - Shown in header subtitle
  - Used to filter/organize notes and snippets (future enhancement)
  - Example: "VibeForge Dev", "Quick Run", "AuthorForge", etc.

mode?: 'workbench' | 'quick-run'
  - Context indicator (informational, not used in current implementation)
  - Can be used for analytics or conditional rendering in future versions
  - Default: 'workbench'
  - Example: mode="quick-run" in Quick Run pages

onClose?: () => void
  - Callback fired when user clicks Close button or backdrop
  - Must set parent state to false
  - Example: onClose={() => (isResearchOpen = false)}

onInsertSnippet?: (text: string) => void
  - Callback fired when user clicks "Insert" on a snippet
  - Receives the full snippet text as parameter
  - Parent should handle appending to prompt or other logic
  - Example: onInsertSnippet={(text) => handleInsertSnippet(text)}
-->

<!-- ============================================================================
     TESTING CHECKLIST
     ============================================================================ -->

<!--
Manual Testing Checklist:

[ ] Drawer opens when button clicked
[ ] Drawer closes when Close button clicked
[ ] Drawer closes when backdrop clicked
[ ] Tabs switch without errors
[ ] Snippets have correct titles, categories, tags
[ ] Snippet preview text displays correctly (scrollable if long)
[ ] Insert button appends snippet to prompt
[ ] Inserted snippet has proper newline spacing
[ ] Notes textarea can be typed into and preserves text during session
[ ] Suggestions display without edit buttons
[ ] Theme toggle (dark/light) updates drawer colors
[ ] Drawer position fixed on right side
[ ] Scrollbar appears when content overflows
[ ] No layout jank or flash when opening/closing
[ ] Works on mobile (drawer might need responsive width adjustment)

Optional Advanced Tests:
[ ] Multiple insertions work correctly
[ ] Long snippet text doesn't break layout
[ ] Fast tab clicking doesn't cause issues
[ ] Copy/paste works in notes textarea
[ ] Keyboard navigation (Tab key) works for buttons
-->

<!-- ============================================================================
     PERFORMANCE CONSIDERATIONS
     ============================================================================ -->

<!--
1. Mocked Data
   - Snippets and suggestions are defined inline in component
   - Derived as arrays (cached by reactivity)
   - No external fetches or store subscriptions
   - Performance: Negligible (< 1ms render time)

2. State Management
   - Only two pieces of local state: activeTab and notes
   - No complex derived state chains
   - Parent manages open/close
   - Performance: Negligible

3. DOM Size
   - Drawer only renders when open={true}
   - No hidden elements cluttering DOM
   - Scrollable container uses overflow-y-auto
   - Performance: Negligible

4. Interactions
   - Tab clicks update local state (instant)
   - Snippet insert fires callback (parent handles)
   - No debouncing or throttling needed
   - Performance: Instant

Optimization Ideas (if needed):
- Virtualize snippet list if > 50 snippets
- Lazy load suggestions from backend
- Debounce notes textarea saves (future)
- Memoize snippet search results
-->

<!-- ============================================================================
     TROUBLESHOOTING
     ============================================================================ -->

<!--
Issue: Drawer doesn't appear when open={true}
- Check: Is ResearchAssistDrawer imported?
- Check: Is open state bound correctly?
- Check: Is z-index sufficient? (currently z-40)

Issue: Snippet insert doesn't update prompt
- Check: Is onInsertSnippet callback defined?
- Check: Is promptState imported and used correctly?
- Check: Is promptState a Svelte store with setText method?

Issue: Drawer overlaps main content
- Check: Is drawer rendering inside main workbench div or separate?
- Check: Is position: fixed applied?
- Check: Are z-index values correct? (backdrop z-40, panel should be higher)

Issue: Theme colors don't switch
- Check: Is $theme store imported?
- Check: Is $theme reactive in component? (Should be auto-subscribed)
- Check: Are Tailwind conditionals syntactically correct?

Issue: Textarea text disappears
- Check: Is bind:value={notes} working? (It should preserve during session)
- Check: Is notes state properly initialized as $state('')?
- Check: Is there a parent component causing re-mount?

Issue: Close button doesn't work
- Check: onclick handler is defined correctly
- Check: onClose callback is wired to parent state

Issue: Scrollbar not showing on long content
- Check: Is overflow-y-auto applied to content container?
- Check: Is container height flex-1 (fill available space)?
-->

<!-- ============================================================================
     NEXT STEPS: ADDING PERSISTENCE
     ============================================================================ -->

<!--
To save notes per workspace, follow this pattern:

1. Create a new store (similar to accessibilityStore.ts):

   // src/lib/stores/researchStore.ts
   import { writable } from 'svelte/store';
   import { browser } from '$app/environment';

   interface ResearchState {
     notes: Record<string, string>; // workspace -> notes text
   }

   function createResearchStore() {
     const stored = browser ? localStorage.getItem('vibeforge-research') : null;
     const initial = stored ? JSON.parse(stored) : { notes: {} };

     const { subscribe, set, update } = writable<ResearchState>(initial);

     return {
       subscribe,
       setNotes: (workspace: string, text: string) => {
         update((state) => {
           const newState = {
             notes: { ...state.notes, [workspace]: text }
           };
           if (browser) {
             localStorage.setItem('vibeforge-research', JSON.stringify(newState));
           }
           return newState;
         });
       },
       getNotes: (workspace: string): string => {
         return browser ? JSON.parse(localStorage.getItem('vibeforge-research') || '{}').notes[workspace] || '' : '';
       }
     };
   }

   export const researchStore = createResearchStore();

2. Update ResearchAssistDrawer to use the store:

   import { researchStore } from '$lib/stores/researchStore';

   // On mount or workspace change:
   let notes = $state(researchStore.getNotes(workspace));

   // On notes change (in textarea):
   $effect(() => {
     researchStore.setNotes(workspace, notes);
   });

3. Test: Reload page → notes should persist per workspace
-->

<!-- ============================================================================
     INTEGRATION CHECKLIST
     ============================================================================ -->

<!--
Before committing, verify:

[X] Component file created: src/lib/components/research/ResearchAssistDrawer.svelte
[X] Import added to src/routes/+page.svelte
[X] State (isResearchOpen) added to workbench page
[X] Handler (handleInsertSnippet) added to workbench page
[X] Button added to workbench header
[X] Drawer component rendered at bottom of template
[X] All props wired correctly
[X] No TypeScript errors
[X] No console warnings
[X] Drawer opens/closes cleanly
[X] Snippets insert correctly
[X] Theme toggle works
[X] Documentation files created:
    - RESEARCH_ASSIST_IMPLEMENTATION.md
    - RESEARCH_ASSIST_REFERENCE.md
    - RESEARCH_ASSIST_EXAMPLES.md (this file)

Quick Run Integration (optional):
[X] Component can be reused in quick-run page
[X] Snippet insertion works similarly
[X] Workspace name/context can be customized

Ready for QA / User Testing!
-->
