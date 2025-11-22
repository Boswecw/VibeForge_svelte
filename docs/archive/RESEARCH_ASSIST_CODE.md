<!--
CODE SNIPPETS: Integration Details

This file contains the exact code changes made to integrate ResearchAssistDrawer
into the Workbench, for easy reference and copy-paste.
-->

## Integration: src/routes/+page.svelte

### 1. Import Statement (Add to top of file)

```svelte
import ResearchAssistDrawer from "$lib/components/research/ResearchAssistDrawer.svelte";
```

**Location:** Line 1, after other component imports

```svelte
import ContextColumn from "$lib/components/ContextColumn.svelte";
import PromptColumn from "$lib/components/PromptColumn.svelte";
import OutputColumn from "$lib/components/OutputColumn.svelte";
import PresetsDrawer from "$lib/components/presets/PresetsDrawer.svelte";
import SavePresetModal from "$lib/components/presets/SavePresetModal.svelte";
import ResearchAssistDrawer from "$lib/components/research/ResearchAssistDrawer.svelte";  // ← ADD THIS
```

---

### 2. State Declaration (Add to script section)

```svelte
let isResearchOpen = $state(false);
```

**Location:** In `<script>` block, with other state variables

```svelte
let selectedModelId = $state(models[0].id);
let showPresetsDrawer = $state(false);
let isSavePresetOpen = $state(false);
let isResearchOpen = $state(false);  // ← ADD THIS
```

---

### 3. Handler Function (Add to script section)

```svelte
// Handle inserting snippet into prompt
const handleInsertSnippet = (text: string) => {
  const currentPrompt = get(promptState).text;
  const newPrompt = currentPrompt ? currentPrompt + "\n\n" + text : text;
  promptState.setText(newPrompt.trim());
};
```

**Location:** In `<script>` block, after other handler functions

```svelte
const handleSavePreset = (event: any) => {
  const { preset } = event.detail;
  isSavePresetOpen = false;
};

// ← ADD THIS FUNCTION:
const handleInsertSnippet = (text: string) => {
  const currentPrompt = get(promptState).text;
  const newPrompt = currentPrompt ? currentPrompt + "\n\n" + text : text;
  promptState.setText(newPrompt.trim());
};
```

---

### 4. Header Button (Add to template)

```svelte
<button
  type="button"
  class={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
    $theme === "dark"
      ? "border border-slate-700 text-slate-300 hover:bg-slate-800"
      : "border border-slate-300 text-slate-600 hover:bg-slate-100"
  }`}
  onclick={() => (isResearchOpen = true)}
  title="Open Research & Assist panel"
>
  📚 Research / Assist
</button>
```

**Location:** In the header, first button in the action group (before "Save as preset")

```svelte
<div class="flex items-center gap-3">
  <!-- ← ADD THIS BUTTON: -->
  <button
    type="button"
    class={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
      $theme === "dark"
        ? "border border-slate-700 text-slate-300 hover:bg-slate-800"
        : "border border-slate-300 text-slate-600 hover:bg-slate-100"
    }`}
    onclick={() => (isResearchOpen = true)}
    title="Open Research & Assist panel"
  >
    📚 Research / Assist
  </button>

  <!-- Existing buttons follow: -->
  <button onclick={openSavePreset}>
    💾 Save as preset
  </button>
  <!-- ... etc ... -->
</div>
```

---

### 5. Drawer Render (Add to template)

```svelte
<!-- Research & Assist drawer -->
<ResearchAssistDrawer
  open={isResearchOpen}
  workspace="VibeForge Dev"
  mode="workbench"
  onClose={() => (isResearchOpen = false)}
  onInsertSnippet={(text) => handleInsertSnippet(text)}
/>
```

**Location:** At bottom of template, after Presets components

```svelte
<!-- Presets drawer -->
<PresetsDrawer
  open={showPresetsDrawer}
  mode="workbench"
  onClose={() => (showPresetsDrawer = false)}
  onApplyPreset={handleApplyPreset}
/>

<!-- Save as Preset modal -->
<SavePresetModal
  open={isSavePresetOpen}
  mode="workbench"
  initialPrompt={getCurrentPrompt()}
  initialWorkspace="VibeForge Dev"
  initialModels={getCurrentModels()}
  initialContextRefs={getCurrentContextRefs()}
  onClose={() => (isSavePresetOpen = false)}
  onSaved={handleSavePreset}
/>

<!-- ← ADD THIS: -->
<!-- Research & Assist drawer -->
<ResearchAssistDrawer
  open={isResearchOpen}
  workspace="VibeForge Dev"
  mode="workbench"
  onClose={() => (isResearchOpen = false)}
  onInsertSnippet={(text) => handleInsertSnippet(text)}
/>
```

---

## Complete Component Props Reference

### ResearchAssistDrawer Props

```typescript
interface Props {
  // Required
  open: boolean; // Show/hide drawer
  workspace: string; // Workspace name (for display)

  // Optional
  mode?: "workbench" | "quick-run"; // Context (for analytics/display)
  onClose?: () => void; // Called when drawer closes
  onInsertSnippet?: (text: string) => void; // Called when snippet inserted
}
```

### Props Explanation

| Prop              | Type                         | Required | Default       | Description                                                                                                      |
| ----------------- | ---------------------------- | -------- | ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `open`            | `boolean`                    | ✓        | -             | Controls drawer visibility. When `true`, drawer renders and shows. When `false`, drawer is hidden.               |
| `workspace`       | `string`                     | ✓        | -             | Display name of current workspace. Shown in drawer header. Used to scope notes/snippets (future).                |
| `mode`            | `'workbench' \| 'quick-run'` | ✗        | `'workbench'` | Which context the drawer is used in. Informational only (can be used for analytics).                             |
| `onClose`         | `() => void`                 | ✗        | No-op         | Callback fired when user clicks Close button or backdrop. Parent should set `open={false}`.                      |
| `onInsertSnippet` | `(text: string) => void`     | ✗        | No-op         | Callback fired when user clicks Insert on a snippet. Receives full snippet text. Parent should append to prompt. |

---

## Event Handling Details

### onClose Event

**When it fires:**

- User clicks "Close" button in header
- User clicks backdrop (area outside drawer)

**What parent should do:**

```svelte
onClose={() => (isResearchOpen = false)}
```

**Important:** Event fires; parent is responsible for setting `open={false}`. Drawer does not close itself.

---

### onInsertSnippet Event

**When it fires:**

- User clicks "Insert" button on any snippet

**What it passes:**

- Full text of the snippet as string parameter

**What parent should do:**

```svelte
const handleInsertSnippet = (text: string) => {
  // Option 1: Append to prompt store
  const current = get(promptState).text;
  promptState.setText(current ? current + "\n\n" + text : text);

  // Option 2: Show notification (optional)
  // showToast(`Inserted ${text.length} characters`);

  // Option 3: Track analytics (optional)
  // trackEvent('snippet_inserted');
};

// Then pass to drawer:
<ResearchAssistDrawer
  onInsertSnippet={(text) => handleInsertSnippet(text)}
/>
```

---

## Interior State (Not Exposed as Props)

These are managed **inside** `ResearchAssistDrawer.svelte` and not exposed:

```typescript
let activeTab = $state<"notes" | "snippets" | "suggestions">("notes");
let notes = $state("");
```

**What they do:**

- `activeTab`: Tracks which tab is currently selected
- `notes`: Stores text entered in Notes panel textarea

**Why they're not props:**

- Simple, independent state
- No need for parent to manage
- Could be extracted to store in future (for persistence)

---

## Example: Full Integration Code

Here's a minimal working example:

```svelte
<script lang="ts">
  import ResearchAssistDrawer from "$lib/components/research/ResearchAssistDrawer.svelte";
  import { promptState } from "$lib/stores/promptStore";
  import { theme } from "$lib/stores/themeStore";
  import { get } from "svelte/store";

  let isResearchOpen = $state(false);

  const handleInsertSnippet = (text: string) => {
    const current = get(promptState).text;
    promptState.setText(current ? current + "\n\n" + text : text);
  };
</script>

<div class={`flex-1 flex flex-col ${$theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
  <header class="px-6 py-4 border-b">
    <h1>My Page</h1>

    <button
      onclick={() => (isResearchOpen = true)}
      type="button"
      class="px-3 py-2 rounded-md text-sm font-medium bg-amber-500 text-slate-900"
    >
      📚 Research
    </button>
  </header>

  <main class="flex-1 p-6">
    {/* Your main content here */}
  </main>

  <ResearchAssistDrawer
    open={isResearchOpen}
    workspace="My Workspace"
    mode="workbench"
    onClose={() => (isResearchOpen = false)}
    onInsertSnippet={(text) => handleInsertSnippet(text)}
  />
</div>
```

---

## Common Patterns

### Pattern 1: Show Notification on Insert

```svelte
const handleInsertSnippet = (text: string) => {
  // ... insert logic ...

  // Show toast (requires toast store/component)
  showToast(`Inserted ${text.length} characters`);
};
```

### Pattern 2: Auto-Focus Prompt After Insert

```svelte
const handleInsertSnippet = (text: string) => {
  // ... insert logic ...

  // Focus prompt editor (requires ref to editor element)
  promptEditor?.focus();
};
```

### Pattern 3: Track Analytic Event

```svelte
const handleInsertSnippet = (text: string) => {
  // ... insert logic ...

  // Track in analytics
  analytics.track('snippet_inserted', {
    length: text.length,
    timestamp: new Date().toISOString()
  });
};
```

### Pattern 4: Conditional Behavior Based on Mode

```svelte
<ResearchAssistDrawer
  mode={isQuickRun ? 'quick-run' : 'workbench'}
  onInsertSnippet={(text) => {
    if (isQuickRun) {
      // Handle Quick Run differently
      quickRunPrompt.set(get(quickRunPrompt) + "\n\n" + text);
    } else {
      // Handle Workbench
      promptState.setText(get(promptState).text + "\n\n" + text);
    }
  }}
/>
```

---

## Styling Customization

### Change Drawer Width

Edit `ResearchAssistDrawer.svelte`, find:

```svelte
class="w-full max-w-md h-full border-l flex flex-col"
```

Change `max-w-md` to:

- `max-w-sm` – Narrower (smaller)
- `max-w-lg` – Wider (larger)
- `max-w-2xl` – Much wider (desktop)

### Change Tab Styling

Edit `ResearchAssistDrawer.svelte`, find tab button classes:

```svelte
class="px-3 py-1.5 rounded-full border font-medium transition-colors"
```

Change `px-3 py-1.5` to:

- `px-2 py-1` – Tighter (smaller)
- `px-4 py-2` – Spacious (larger)

### Change Accent Color

Edit `ResearchAssistDrawer.svelte`, find active tab class:

```svelte
class="bg-amber-500 text-slate-900 border-amber-500"
```

Change `amber-500` to:

- `blue-500` – Blue
- `emerald-500` – Green
- `rose-500` – Pink
- Any Tailwind color

---

## Debugging

### Drawer doesn't open

Check 1: Is `open={isResearchOpen}` bound correctly?

```svelte
// ✓ Correct
let isResearchOpen = $state(false);
<ResearchAssistDrawer open={isResearchOpen} ... />

// ✗ Wrong
let isResearchOpen = false;  // Missing $state!
```

Check 2: Is onclick handler firing?

```svelte
// Add console log to debug
onclick={() => {
  console.log('Before:', isResearchOpen);
  isResearchOpen = true;
  console.log('After:', isResearchOpen);
}}
```

### Snippet doesn't insert

Check 1: Is `onInsertSnippet` handler wired?

```svelte
// ✓ Correct
onInsertSnippet={(text) => handleInsertSnippet(text)}

// ✗ Missing callback
onInsertSnippet  // No handler!
```

Check 2: Is `promptState` a store with `setText` method?

```svelte
// ✓ Correct
promptState.setText(newPrompt);

// ✗ Wrong
promptState = newPrompt;  // Direct assignment
```

Check 3: Is `get()` imported from 'svelte/store'?

```svelte
import { get } from "svelte/store";  // Required!
```

### Colors don't update on theme toggle

Check: Is `$theme` store imported and used?

```svelte
import { theme } from '$lib/stores/themeStore';

// In template, check for $theme references:
class={$theme === 'dark' ? 'dark-classes' : 'light-classes'}
```

---

## Performance Tips

1. **Drawer renders only when `open={true}`**

   - Hidden drawer doesn't consume DOM or render time
   - Only render cost when open

2. **Use memoization for derived state**

   - Snippets array is derived (cached)
   - Suggestions array is derived (cached)
   - No re-computation on every render

3. **Don't create handlers inline**
   ✗ Avoid:

   ```svelte
   onInsertSnippet={(text) => {
     // Complex logic here
     const current = get(promptState).text;
     // ... more ...
     promptState.setText(...);
   }}
   ```

   ✓ Better:

   ```svelte
   const handleInsertSnippet = (text: string) => { ... };
   onInsertSnippet={(text) => handleInsertSnippet(text)}
   ```

---

## Summary: The Five Code Changes

To integrate Research & Assist drawer:

1. **Import** the component
2. **Add state** (`isResearchOpen`)
3. **Add handler** (`handleInsertSnippet`)
4. **Add button** (in header)
5. **Add component** (at bottom of template)

That's it! Five pieces of code to add, and the drawer is ready to use.

---
