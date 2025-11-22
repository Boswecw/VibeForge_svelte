# Document Ingestion: Quick Start & Testing Guide

## Quick Start

### 1. Start the Dev Server

```bash
cd /home/charles/projects/Coding2025/Forge/vibeforge
pnpm dev
```

Open browser to: **http://localhost:5173/contexts**

---

## Testing Checklist

### ✅ UI Appears

- [ ] Page loads without errors
- [ ] "📄 Add Documents" button visible in header (next to stats)
- [ ] Button is enabled (not greyed out)
- [ ] Context library displays below header

### ✅ Modal Opens

- [ ] Click "📄 Add Documents" button
- [ ] Modal overlay appears (dark background, centered)
- [ ] Modal has title "📄 Upload Documents"
- [ ] Close button (X) in top-right corner
- [ ] Can close by clicking X or outside modal

### ✅ File Input

- [ ] Dropzone area visible with dashed border
- [ ] Text says "Drag files here or click to browse"
- [ ] Can drag files onto dropzone
- [ ] Can click dropzone to open file picker
- [ ] Multiple file selection works

### ✅ File List Management

- [ ] Selected files appear in list below dropzone
- [ ] Each file shows: editable title, filename, size
- [ ] Category dropdown for each file (default: blank)
- [ ] Can edit file title inline
- [ ] Can change category per file

### ✅ Metadata Section

- [ ] "Workspace" field shows "default" (read-only)
- [ ] "Tags" field accepts comma-separated values
- [ ] Tags update when typing

### ✅ Ingestion

- [ ] "Start Ingestion" button disabled when no files selected
- [ ] "Start Ingestion" button enabled when files exist
- [ ] Click button with files → modal closes
- [ ] Console shows message: "Ingested N document(s)..."

### ✅ Queue Appears

- [ ] After ingestion, queue panel appears below library UI
- [ ] Queue bordered section appears with title "Ingestion Queue"
- [ ] Table shows documents with columns: Title, File Size, Status, Tags, At
- [ ] Status shows as "⭕ queued" (slate-colored badge)
- [ ] All documents show created timestamp

### ✅ Queue Features

- [ ] Stats bar at top showing: "Queued (N) Processing (0) Ready (0)"
- [ ] "Simulate progress →" button present below queue
- [ ] Click button → status updates (queued → processing)
- [ ] Processing items show "🟡 processing" (amber) with pulse animation
- [ ] Click again → status updates (processing → ready)
- [ ] Ready items show "✅ ready" (emerald)
- [ ] Timestamps update with current time

### ✅ Theme Integration

- [ ] Toggle dark/light theme (use theme switcher in TopBar)
- [ ] Modal background adapts (dark stays dark, light becomes light)
- [ ] Text colors adapt (maintain contrast)
- [ ] Buttons change color appropriately
- [ ] Queue panel background adapts
- [ ] Status badge colors match theme

### ✅ Responsive Design

- [ ] On wide screen: 2-column library layout preserved
- [ ] On mobile: layout adapts to single column
- [ ] Modal still centers and is readable
- [ ] Queue table scrolls horizontally if needed

---

## Expected Behavior by Step

### Step 1: Initial Load

```
Page: /contexts
↓
Header shows: "Context Library" with "📄 Add Documents" button
Right side: Stats showing "X total blocks"
Left side: Filters (Search, Type, Tags) + Block list
Right side: Detail panel (empty until selected)
↓
No queue visible (queue only shows if ingestQueue.length > 0)
```

### Step 2: Click "Add Documents"

```
Action: Click "📄 Add Documents" button
↓
Result:
- Modal overlay appears (fixed, centered, dark background)
- Modal size: ~600px wide, auto height
- Dropzone visible: dashed border, padding
- Text: "Drag files here or click to browse"
- "Accepted: PDF, Markdown, TXT, Code"
- Shared metadata section below
- "Start Ingestion" button (initially disabled)
```

### Step 3: Add Files

```
Action: Drag file OR click to browse
↓
Result:
- File appears in list
- Shows: [editable title] | Filename | Size | Category dropdown
- Default category: blank
- Title pre-filled with filename (editable)
- Can select multiple files
- Each file can have different metadata
```

### Step 4: Edit Metadata

```
Action: Click on title field, edit text
Action: Change category dropdown
Action: Edit tags field
↓
Result:
- Edits persist in form (session-local)
- "Start Ingestion" button becomes enabled (if ≥1 file)
- No API calls yet (mocked)
```

### Step 5: Ingest

```
Action: Click "Start Ingestion" button
↓
Result:
- Modal closes
- Documents added to ingestQueue state
- All docs have status: "queued"
- Console.log: "Ingested 2 document(s). Queue now has 2 total."
- IngestQueuePanel conditional render triggers
- Queue panel appears below library UI
```

### Step 6: View Queue

```
View: Below library UI
↓
Shows:
- Title: "Ingestion Queue (2 documents)"
- Stats bar: "Queued (2) Processing (0) Ready (0) Error (0)"
- Table headers: Title | File Size | Status | Tags | At
- Row 1: [Title] | [Size] | ⭕ queued | [tags] | [timestamp]
- Row 2: [Title] | [Size] | ⭕ queued | [tags] | [timestamp]
- Button: "Simulate progress →" at bottom
```

### Step 7: Simulate Progress

```
Action: Click "Simulate progress →" button
↓
Result:
- First click:
  - Queued items → Processing items (status badge changes to 🟡)
  - Processing items get animated pulse effect
  - Timestamps update to current time

- Second click:
  - Processing items → Ready items (status badge changes to ✅)
  - Pulse animation stops
  - Timestamps update again

- Third click:
  - No change (ready items stay ready)
  - Stats bar shows: "Queued (0) Processing (0) Ready (2) Error (0)"
```

### Step 8: Add More Files

```
Action: Click "📄 Add Documents" again
↓
Result:
- Modal opens again (empty form)
- Previous files still in queue below
- Can add new files
- New files added to queue with previous ones
- Queue continues to show all documents
```

---

## Debugging Tips

### Modal Won't Open

- Check browser console (F12) for errors
- Verify `isUploadOpen` state in DevTools:
  ```javascript
  // In console, check if state exists
  // (Svelte state isn't directly accessible, but modal should be DOM node)
  document.querySelector('[class*="fixed"][class*="inset"]'); // Should find modal
  ```

### Files Not Appearing in List

- Check that files have .name property (name should be filename)
- File size should be calculated as `sizeBytes` in modal component
- If files appear but empty: check if title/category fields are rendering

### Queue Not Appearing

- Check if `ingestQueue.length > 0` is true
- Look at conditional render: `{#if ingestQueue.length > 0}`
- Queue should appear only after successful ingestion

### Theme Not Updating

- Check if toggle theme button works elsewhere (try on /settings)
- Verify `$theme` store is working: It should be 'dark' or 'light'
- If modal doesn't adapt color: check ClassNames in template

### Status Badge Wrong Color

- Check CSS mapping in IngestQueuePanel.svelte `getStatusBadgeColor()`
- Verify Tailwind CSS is loading (should apply classes)
- If color doesn't show: check dark vs light mode expected colors

---

## Console Commands for Testing

### Check State

```javascript
// Open DevTools console (F12)

// Check if context page loaded
document.title; // Should show page title

// Find modal in DOM
document.querySelector(".fixed"); // Should find modal when open

// Find queue panel
document.querySelector("table"); // Should find queue table when visible
```

### Simulate File Selection

```javascript
// Can't directly populate file input (security), but can test other things
// Verify components are loaded
window.location.pathname; // Should show /contexts
```

---

## Expected Console Output

### On Page Load

```
[no errors expected]
```

### On File Select

```
[no console output - UI updates]
```

### On "Start Ingestion"

```
Ingested 2 document(s). Queue now has 2 total.
```

### On "Simulate Progress" (multiple times)

```
[no output - UI updates]
```

---

## Common Issues & Solutions

| Issue                              | Cause                           | Solution                             |
| ---------------------------------- | ------------------------------- | ------------------------------------ |
| Modal doesn't open                 | `isUploadOpen` not set to true  | Check onclick handler on button      |
| Files don't appear after selection | File input not wired            | Verify dropzone component            |
| Queue doesn't show                 | Conditional render failing      | Check if `ingestQueue.length > 0`    |
| Wrong button text                  | HTML text incorrect             | Should say "📄 Add Documents"        |
| Status doesn't change              | Map function not updating state | Check `handleSimulateProgress` logic |
| Theme colors wrong                 | Tailwind classes not applied    | Check class names in template        |
| Modal overlays wrong area          | Fixed positioning issue         | Should be `fixed inset-0`            |
| Inputs don't save                  | State not updating              | Check `$state()` variable binding    |

---

## Browser DevTools Tips

### View Component Structure (Vue/Svelte DevTools Extension)

If installed, Svelte DevTools will show:

- Component tree (ContextLibraryHeader, UploadIngestModal, IngestQueuePanel)
- Props being passed
- State variables (isUploadOpen, ingestQueue)
- Event listeners

### Check Network Tab

- Should NOT see API calls (everything is mocked)
- File input is local-only (no upload happens)
- No POST/PUT requests

### Check Storage Tab

- localStorage should NOT have ingestQueue (not persisted yet—that's TODO)
- Check for 'vibeforge-theme' key (existing from themeStore)

---

## Performance Notes

- Modal should open instantly (no network delay)
- File selection should be immediate (FileList API)
- Queue rendering should be <100ms even with many files
- Status simulation should be snappy (simple state update)
- No lag when toggling theme

---

## Next Steps After Testing

### If Everything Works ✅

1. Proceed to backend integration (file storage, real parsing)
2. Add localStorage persistence for queue
3. Implement real ingestion status polling
4. Create global "Add Documents" entry point

### If Issues Found 🔴

1. Check console for error messages
2. Verify all 3 new files exist (modal, queue, header update)
3. Confirm imports are correct in Context Library page
4. Run `pnpm check` to validate TypeScript

### For Production 🚀

1. Add backend API endpoints for file storage
2. Implement real file parsing service
3. Add error handling + user feedback
4. Test with large files (>100MB)
5. Add virus scanning
6. Set file size limits

---

## Feature Completeness

### ✅ MVP (Current)

- [x] File upload UI (drag-drop + click)
- [x] Metadata input (title, category, tags)
- [x] Queue display with status tracking
- [x] Demo progress simulation
- [x] Dark/light theme support
- [x] Responsive layout

### ⏳ Phase 2 (TODO)

- [ ] Real file parsing
- [ ] Backend API integration
- [ ] Persistent queue storage
- [ ] Actual ingestion progress

### 🎯 Phase 3+ (TODO)

- [ ] Global entry point (TopBar)
- [ ] Document search/filter
- [ ] Promote to context flow
- [ ] Error recovery UI

---

## Quick Validation

**The feature is working correctly if:**

1. ✅ "📄 Add Documents" button appears and is clickable
2. ✅ Modal opens with file dropzone
3. ✅ Can select files and edit metadata
4. ✅ "Start Ingestion" adds documents to queue
5. ✅ Queue panel appears below library
6. ✅ Status badges show with correct colors
7. ✅ "Simulate progress" advances status
8. ✅ Theme toggle doesn't break UI

**Ready to test!** 🚀
