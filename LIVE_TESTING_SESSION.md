# Phase 2 Live Testing Session - Real-Time Execution

**Session Start**: 2025-11-20  
**Status**: ✅ Page Loaded and Ready for Testing  
**Tester**: Manual Testing

---

## What You Should See Right Now

✅ **Three-Column Layout**:

- **Left Column (ContextColumn)**: Context selection area with mock contexts
- **Center Column (PromptColumn)**: Prompt editor with mock models loaded
- **Right Column (OutputColumn)**: Output/responses area (empty)

✅ **Header**: VibeForge title, buttons, theme toggle  
✅ **Sidebar**: Navigation menu on left  
✅ **Dark Theme**: Slate/forge color scheme active  
✅ **Mock Data**: API endpoints return mock data (contexts & models) while backends start

---

## Phase 1: Quick Component Verification (2 min)

### Test 1.1: Components Loaded

In browser **Console** (F12 → Console tab), run:

```javascript
// Check if stores can be imported
const { get } = await import("svelte/store");
console.log("✅ Svelte store imported");
```

**Expected**: No errors, should see `✅ Svelte store imported`

**If error**: Take screenshot and note error message

---

## Phase 2: User Interactions (10 min)

### Test 2.1: Select a Context

**Action**:

1. Look in ContextColumn (left side)
2. You should see context items listed
3. Click on one to select it
4. It should highlight/change color

**Expected**:

- [ ] Context highlights (changes color to blue/amber)
- [ ] Visual feedback immediate
- [ ] No console errors

**Result**: PASS / FAIL

### Test 2.2: Search Contexts

**Action**:

1. Find search box in ContextColumn
2. Type a search term (e.g., "system" or "forge")
3. Wait 1 second

**Expected**:

- [ ] Search results update
- [ ] Results appear below search box
- [ ] No repeated API calls (check Network tab)

**Result**: PASS / FAIL

### Test 2.3: View Models

**Action**:

1. Look in PromptColumn (center)
2. Find "Models" section
3. Observe what's shown

**Expected**:

- [ ] Models dropdown shows available models OR
- [ ] Shows "No models available" message (OK if backends not running)
- [ ] Models section visible and styled

**Result**: PASS / FAIL

### Test 2.4: Type Prompt

**Action**:

1. Click in the textarea (center column)
2. Type: "Hello, what is artificial intelligence?"
3. Observe character count at bottom

**Expected**:

- [ ] Text appears in textarea
- [ ] Character count updates (should show ~40 characters)
- [ ] No console errors

**Result**: PASS / FAIL

### Test 2.5: Verify Run Button State

**Action**:

1. Look at bottom of PromptColumn for "Run" button
2. Note its color/enabled state

**Expected**:

- [ ] If no models selected: Button is DISABLED (grayed out)
- [ ] If models selected: Button is ENABLED (blue/highlighted)
- [ ] Button shows model count (e.g., "Run with 1 model")

**Result**: PASS / FAIL

---

## Phase 3: Error Handling (3 min)

### Test 3.1: Empty Prompt Validation

**Action**:

1. Clear the textarea (delete all text)
2. Try to click "Run" button

**Expected**:

- [ ] Button is disabled/grayed
- [ ] Cannot click it
- [ ] No error appears (validation is silent)

**Result**: PASS / FAIL

### Test 3.2: No Models Validation

**Action**:

1. Look at models section
2. If models are shown as selected (blue), deselect them
3. Try to click "Run" button

**Expected**:

- [ ] Button is disabled/grayed
- [ ] Cannot execute
- [ ] Models section shows "0 selected"

**Result**: PASS / FAIL

---

## Phase 4: Optional - Backend Integration Testing (15 min)

**If you want to test full execution**, start backend services:

### Setup Backends (2 terminals)

**Terminal 1**:

```bash
cd ~/projects/Coding2025/Forge/DataForge
npm run dev
# Wait until "Server listening on port 5000" appears
```

**Terminal 2**:

```bash
cd ~/projects/Coding2025/Forge/NeuroForge
npm run dev
# Wait until "Server listening on port 5001" appears
```

**Back in Browser**:

```javascript
// Check if /api/models endpoint is accessible
const response = await fetch("/api/models");
const data = await response.json();
console.log("Models:", data);
```

### Test 4.1: Execute Prompt

**Action**:

1. Ensure 1 model is selected (should be available now)
2. Ensure context is selected
3. Ensure prompt is typed
4. Click "Run" button

**Expected**:

- [ ] Button changes to "Running..."
- [ ] Status shows "Executing..."
- [ ] Wait 5-15 seconds
- [ ] Response appears in OutputColumn
- [ ] Shows model output + metrics (tokens, latency)

**Result**: PASS / FAIL

### Test 4.2: Multi-Model Execution

**Action** (if 3+ models available):

1. Select 2-3 models
2. Click "Run"
3. Wait for execution
4. Look at output

**Expected**:

- [ ] Multiple response tabs appear (one per model)
- [ ] Each tab shows different response
- [ ] Can click tabs to switch between responses
- [ ] Metrics differ per model

**Result**: PASS / FAIL

### Test 4.3: Response Metrics

**Action**:

1. After execution completes
2. Look at response area
3. Find metrics display

**Expected**:

- [ ] Shows "Total Tokens: X,XXX" (formatted with commas)
- [ ] Shows "Latency: XXXms"
- [ ] Shows "Finish Reason: stop" (or similar)
- [ ] Metrics are readable and formatted

**Result**: PASS / FAIL

---

## Phase 5: Responsive Design (3 min)

### Test 5.1: Desktop View

**Action**:

1. Make browser window as wide as possible
2. Observe layout

**Expected**:

- [ ] All three columns visible side-by-side
- [ ] Proper spacing between columns
- [ ] No horizontal scrolling
- [ ] Content fits nicely

**Result**: PASS / FAIL

### Test 5.2: Tablet View

**Action**:

1. Press F12 to open DevTools
2. Click device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
3. Select "iPad" or set width to 768px
4. Observe layout

**Expected**:

- [ ] Layout adapts
- [ ] All elements still accessible
- [ ] No horizontal scrolling needed
- [ ] Readable on tablet size

**Result**: PASS / FAIL

### Test 5.3: Mobile View

**Action**:

1. In device toolbar, select "iPhone 12" or set width to 375px
2. Observe layout

**Expected**:

- [ ] Layout reflows for mobile
- [ ] Stacked or single column
- [ ] All content accessible with scrolling
- [ ] No horizontal scroll

**Result**: PASS / FAIL

---

## Phase 6: Store State Verification (2 min)

### Test 6.1: Check neuroforgeStore

**In Browser Console**:

```javascript
const { get } = await import("svelte/store");
const { neuroforgeStore } = await import("$lib/stores/neuroforgeStore");
const state = get(neuroforgeStore);
console.log("neuroforgeStore:", {
  models: state.models.length,
  selectedModels: state.selectedModels,
  isExecuting: state.isExecuting,
  responses: state.responses.length,
  error: state.error,
});
```

**Expected Output**:

```javascript
neuroforgeStore: {
  models: 3,                           // Some models loaded
  selectedModels: ["model-id"],        // Selected model IDs
  isExecuting: false,                  // Not currently executing
  responses: 1,                        // Number of responses
  error: null                          // No errors
}
```

**Result**: Matches expected? YES / NO

### Test 6.2: Check contextStore

**In Browser Console**:

```javascript
const { contextStore } = await import("$lib/stores/contextStore");
console.log("contextStore:", get(contextStore));
```

**Expected**:

```javascript
// Should show:
{ activeContexts: [...] }
// With IDs of selected contexts
```

**Result**: Shows context data? YES / NO

---

## Test Results Summary

### Phase 1: Component Verification

- [ ] Stores import successfully

### Phase 2: User Interactions

- [ ] Test 2.1 (Select Context): PASS / FAIL
- [ ] Test 2.2 (Search Context): PASS / FAIL
- [ ] Test 2.3 (View Models): PASS / FAIL
- [ ] Test 2.4 (Type Prompt): PASS / FAIL
- [ ] Test 2.5 (Run Button): PASS / FAIL

### Phase 3: Error Handling

- [ ] Test 3.1 (Empty Prompt): PASS / FAIL
- [ ] Test 3.2 (No Models): PASS / FAIL

### Phase 4: Backend Integration (Optional)

- [ ] Test 4.1 (Single Execution): PASS / FAIL / SKIPPED
- [ ] Test 4.2 (Multi-Model): PASS / FAIL / SKIPPED
- [ ] Test 4.3 (Metrics): PASS / FAIL / SKIPPED

### Phase 5: Responsive

- [ ] Test 5.1 (Desktop): PASS / FAIL
- [ ] Test 5.2 (Tablet): PASS / FAIL
- [ ] Test 5.3 (Mobile): PASS / FAIL

### Phase 6: Store State

- [ ] Test 6.1 (neuroforgeStore): PASS / FAIL
- [ ] Test 6.2 (contextStore): PASS / FAIL

---

## Overall Assessment

**Tests Passed**: **\_/22  
**Tests Failed**: \_**/22  
**Tests Skipped**: **\_/22  
**Pass Rate**: \_**%

### Issues Found

| #   | Issue | Severity                 | Status       |
| --- | ----- | ------------------------ | ------------ |
| 1   |       | Critical / Major / Minor | Open / Fixed |
| 2   |       |                          |              |
| 3   |       |                          |              |

---

## Recommendation

- [ ] ✅ PASS - All tests passed, ready for production
- [ ] ⚠️ PASS WITH NOTES - Minor issues found, acceptable
- [ ] ❌ FAIL - Significant issues, needs fixes
- [ ] 🔴 CRITICAL - Major problems, do not deploy

---

## Next Steps

**If All Pass**:

1. Phase 2 testing complete ✅
2. Ready for staging deployment
3. Document results and archive logs

**If Issues Found**:

1. Create bug tickets for each issue
2. Fix issues in code
3. Re-run affected tests
4. Verify fixes work

---

## Session Notes

Start with Phase 2 (Interactions). That's the most important test.

**Key Things to Watch For**:

- Console should stay clean (no red errors)
- UI should be responsive and smooth
- Store state should match what you see on screen
- Buttons should enable/disable correctly

**Questions?** Check the component code in:

- `src/lib/components/ContextColumn.svelte`
- `src/lib/components/PromptColumn.svelte`
- `src/lib/components/OutputColumn.svelte`

Good luck! Let me know results. 🚀
