# Research & Assist Panel: Component Reference

## Visual Structure

```
┌────────────────────────────────────────────────────────────────────┐
│ VibeForge Workbench                                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │ │
│  📚 Research / Assist  💾 Save  ⭐ Presets  [Model] [Run]        │ │
│                                                                    │ │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │ │
│                                                          ┌─────────┤ │
│   Context │ Prompt │ Output                            │Research │ │
│           │        │                                   │& Assist │ │
│           │        │                      ┌────────────┼─────────┤ │
│           │        │                      │ Research &      │    │ │
│           │        │                      │   Assist        │    │ │
│           │        │                      │ Notes Snippets  │    │ │
│           │        │                      │ [Notes]          │    │ │
│           │        │                      │ ────────────────│    │ │
│           │        │                      │ Workspace notes │    │ │
│           │        │                      │                │    │ │
│           │        │                      │ [Textarea]     │    │ │
│           │        │                      │ Keep rough res │    │ │
│           │        │                      │ notes, links.. │    │ │
│           │        │                      │                │    │ │
│           │        │                      │ Notes are stor │    │ │
│           │        │                      │ locally for now│    │ │
│           │        │                      │                │    │ │
│           │        │                      │ [x] Close      │    │ │
│           │        │                      └────────────────┘    │ │
│           │        │                                             │ │
│           │        │                                             │ │
└────────────────────────────────────────────────────────────────────┘
```

## Tab Layout

### Tab Bar

```
[Notes] [Snippets] [Suggestions]
 ^^^^^^
 (amber bg when active)
```

---

## Notes Panel

```
┌────────────────────────────┐
│ Workspace Notes            │
│ Keep rough research notes, │
│ links, and references here │
│ while you work.            │
│                            │
│ ┌──────────────────────┐   │
│ │ [Textarea]           │   │
│ │                      │   │
│ │ Paste research notes │   │
│ │ links, or key...     │   │
│ │                      │   │
│ │ (min-h-60)           │   │
│ └──────────────────────┘   │
│                            │
│ Notes are stored locally.  │
│ TODO: sync per workspace.  │
└────────────────────────────┘
```

---

## Snippets Panel

```
┌─────────────────────────────────────┐
│ Snippets                            │
│ Reusable blocks you can insert      │
│ into your prompt.                   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Code Review Boilerplate    │Insert│
│ │ coding · VibeForge Dev          │ │
│ │ [code] [review] [boilerplate]   │ │
│ │                                 │ │
│ │ Review this code for:           │ │
│ │ - Security vulnerabilities      │ │
│ │ - Performance bottlenecks       │ │
│ │ ...                             │ │
│ │                                 │ │
│ │ Updated 2 days ago              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Story Structure Checklist   │Insert│
│ │ writing · AuthorForge           │ │
│ │ [story] [structure] [writing]   │ │
│ │                                 │ │
│ │ Story Structure Verification:   │ │
│ │ - [ ] Clear protagonist         │ │
│ │ - [ ] Inciting incident         │ │
│ │ ...                             │ │
│ │                                 │ │
│ │ Updated 1 week ago              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ... (more snippets)                 │
└─────────────────────────────────────┘
```

---

## Suggestions Panel

```
┌─────────────────────────────────────┐
│ Suggestions                         │
│ Prompting tips and reminders        │
│ to improve runs.                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Separate Instructions from      │ │
│ │ Content                         │ │
│ │ prompting                       │ │
│ │                                 │ │
│ │ Keep your system instructions   │ │
│ │ distinct from the user content. │ │
│ │ Use clear markers or sections.. │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Be Explicit About Format        │ │
│ │ structure                       │ │
│ │                                 │ │
│ │ Don't assume the model will     │ │
│ │ guess your desired output       │ │
│ │ format...                       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ... (more suggestions)              │
└─────────────────────────────────────┘
```

---

## Color Scheme

### Dark Mode (Default)

- **Background**: `bg-slate-950` (#0B0F17 / forge-blacksteel)
- **Panel BG**: `bg-slate-900` (#111827 / forge-gunmetal)
- **Borders**: `border-slate-800` (#233044 / forge-line)
- **Text Primary**: `text-slate-100`
- **Text Secondary**: `text-slate-400`
- **Active Tab**: `bg-amber-500 text-slate-900` (forge-ember)

### Light Mode

- **Background**: `bg-white`
- **Panel BG**: `bg-slate-50`
- **Borders**: `border-slate-200`
- **Text Primary**: `text-slate-900`
- **Text Secondary**: `text-slate-500`
- **Active Tab**: `bg-amber-500 text-slate-900`

---

## Data Types

### ResearchAssistDrawer Props

```typescript
interface Props {
  open: boolean;
  workspace: string;
  mode?: "workbench" | "quick-run";
  onClose?: () => void;
  onInsertSnippet?: (text: string) => void;
}
```

### Snippet Type (Internal)

```typescript
type Snippet = {
  id: string;
  title: string;
  category: "coding" | "writing" | "analysis" | "other";
  workspace: string;
  text: string;
  tags: string[];
  updatedAt: string;
};
```

### Suggestion Type (Internal)

```typescript
type Suggestion = {
  id: string;
  title: string;
  category: "prompting" | "structure" | "safety" | "evaluation";
  body: string;
};
```

---

## Interaction Flow

### Opening the Panel

```
User clicks "📚 Research / Assist" button
    ↓
isResearchOpen = true
    ↓
ResearchAssistDrawer renders (fixed position, z-40)
    ↓
Panel shows with backdrop (fixed inset-0)
```

### Switching Tabs

```
User clicks "Snippets" tab
    ↓
activeTab = 'snippets'
    ↓
Content area re-renders (Snippets panel visible)
```

### Inserting Snippet

```
User clicks "Insert" on a snippet
    ↓
onInsertSnippet event fired with snippet.text
    ↓
Parent (Workbench) receives event
    ↓
handleInsertSnippet(text) appends to prompt:
  currentPrompt + "\n\n" + text
    ↓
promptState.setText(newPrompt)
    ↓
Prompt column updates (reactively)
```

### Closing Panel

```
User clicks "Close" button OR clicks backdrop
    ↓
onClose event fired
    ↓
isResearchOpen = false
    ↓
ResearchAssistDrawer conditionally unmounts
```

---

## Key Styling Classes

### Header

```svelte
class="flex items-center justify-between px-4 py-3 border-b"
```

### Tab Button (Active)

```svelte
class="px-3 py-1.5 rounded-full border font-medium bg-amber-500 text-slate-900 border-amber-500"
```

### Tab Button (Inactive)

```svelte
class="px-3 py-1.5 rounded-full border font-medium bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
```

### Content Area

```svelte
class="flex-1 overflow-y-auto px-4 py-4 text-xs"
```

### Snippet Card

```svelte
class="rounded-md border p-3 flex flex-col gap-2 bg-slate-900 border-slate-700"
```

### Insert Button

```svelte
class="px-2 py-1 rounded-md text-[11px] font-medium bg-amber-500 text-slate-900 hover:bg-amber-600 whitespace-nowrap"
```

---

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid, Flexbox, CSS Variables ✓
- Tailwind CSS v4 ✓
- Svelte 5 runes (`$state`, `$derived`) ✓
- Fixed positioning and z-index stacking ✓

No polyfills required.

---

## Performance Notes

- **Lightweight**: Single component, ~450 lines of code
- **No subscriptions**: Uses prop drilling and callbacks, not complex store hierarchies
- **Mocked data**: Snippets and suggestions are derived (cached) arrays; no external queries
- **Smooth animations**: Uses Tailwind's `transition-all` and `transition-colors` for tab switches
- **Scrollable overflow**: Only content area scrolls; header/tabs stay fixed

---

## Accessibility

- **Semantic HTML**: `<header>`, `<nav>`, `<section>`, `<article>` elements
- **ARIA labels**: Close button, role="button" on backdrop
- **Keyboard support**: Tabs are buttons (focusable), textarea is focusable
- **Color contrast**: Text meets WCAG AA standards on both dark and light modes
- **Focus ring**: Textarea has `focus:ring-2 focus:ring-amber-500`

---

## Future Considerations

### Snippet Search/Filter

```svelte
let searchQuery = $state('');
let filtered = $derived(
  snippets.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.tags.some(t => t.includes(searchQuery))
  )
);
```

### Custom Snippet Creation

```svelte
let newSnippet = $state({ title: '', text: '', tags: [] });
const saveSnippet = () => {
  snippets.push({ id: crypto.randomUUID(), ...newSnippet, updatedAt: new Date().toISOString() });
};
```

### Workspace Sync

```typescript
// In parent component
const workspaceSnippets = $derived.by(() => {
  return snippetStore.getByWorkspace(workspace);
});
```
