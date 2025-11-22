# End-to-End Testing Guide - Phase 2

**Status**: Ready for manual testing  
**Build**: ✅ Production build successful  
**Compilation**: ✅ 0 errors  
**Type Safety**: ✅ 100% TypeScript  

---

## Test Environment Setup

### Prerequisites
- Three terminal windows available
- DataForge backend API running
- NeuroForge backend API running
- VibeForge frontend running on http://localhost:5173

### Architecture Under Test
```
Frontend (VibeForge) ←→ SvelteKit Proxy (/api/*) ←→ DataForge Backend
                                                  ←→ NeuroForge Backend
```

---

## Test Plan

### Phase A: Environment Initialization (5 min)

#### Step 1: Start DataForge Backend
```bash
cd ~/projects/Coding2025/Forge/DataForge
npm run dev
# Expected: Server running on http://localhost:5000 (or configured port)
# Verify: http://localhost:5000/health should return 200
```

#### Step 2: Start NeuroForge Backend
```bash
cd ~/projects/Coding2025/Forge/NeuroForge
npm run dev
# Expected: Server running on http://localhost:5001 (or configured port)
# Verify: http://localhost:5001/health should return 200
```

#### Step 3: Start VibeForge Frontend
```bash
cd ~/projects/Coding2025/Forge/vibeforge
npm run dev
# Expected: Server running on http://localhost:5173
# Verify: http://localhost:5173 loads without errors
```

#### Step 4: Open Browser
- Navigate to http://localhost:5173
- Open DevTools (F12) → Console tab
- Keep DevTools open to monitor for errors

**Expected Result**: Page loads with three-column layout visible
- Left: ContextColumn (empty or loading)
- Center: PromptColumn with empty textarea
- Right: OutputColumn (empty)

---

### Phase B: Component Load Testing (10 min)

#### Test B.1: ContextColumn Loading
**Test Steps**:
1. Observe ContextColumn on page load
2. Check console for any errors
3. Verify contexts are loading (may see loading spinner briefly)

**Expected Behavior**:
- ✅ No console errors
- ✅ List of contexts appears (or empty list with message)
- ✅ Search input becomes active after ~1s

**Pass/Fail**: ___

#### Test B.2: PromptColumn Loading
**Test Steps**:
1. Observe PromptColumn
2. Check for models dropdown
3. Verify models load

**Expected Behavior**:
- ✅ Models dropdown populated with model names
- ✅ "Run" button present (disabled initially)
- ✅ Textarea ready for input

**Pass/Fail**: ___

#### Test B.3: OutputColumn Initialization
**Test Steps**:
1. Observe OutputColumn
2. Check for empty state message

**Expected Behavior**:
- ✅ Empty state displayed ("No responses yet" or similar)
- ✅ No console errors

**Pass/Fail**: ___

---

### Phase C: User Interaction Testing (15 min)

#### Test C.1: Context Selection
**Test Steps**:
1. In ContextColumn, click first context item to select it
2. Observe visual feedback
3. Check if it's marked as "active"

**Expected Behavior**:
- ✅ Context highlights (blue or highlighted color)
- ✅ contextStore.activeContexts updated
- ✅ No console errors

**Pass/Fail**: ___

**Debug Info to Collect**:
```javascript
// In browser console:
const { get } = await import('svelte/store');
const { contextStore } = await import('$lib/stores/contextStore');
console.log(get(contextStore).activeContexts);
```

#### Test C.2: Context Search
**Test Steps**:
1. In ContextColumn search box, type a search term (e.g., "context" or "test")
2. Wait 300ms+ for debounce to complete
3. Observe search results

**Expected Behavior**:
- ✅ Results update with matching contexts
- ✅ Similarity scores displayed
- ✅ No rapid repeated API calls (debounce working)

**Pass/Fail**: ___

**Verify Debounce**: Open Network tab, search multiple times, verify only 1 request per 300ms+

#### Test C.3: Model Selection
**Test Steps**:
1. In PromptColumn models section, click first model button
2. Click second model button
3. Observe selection state

**Expected Behavior**:
- ✅ Selected models highlight blue
- ✅ "Run" button updates to show count (e.g., "Run with 2 models")
- ✅ neuroforgeStore.selectedModels updated

**Pass/Fail**: ___

#### Test C.4: Prompt Input
**Test Steps**:
1. Click in textarea
2. Type: "Hello, tell me about artificial intelligence"
3. Observe character count update

**Expected Behavior**:
- ✅ Text appears in textarea
- ✅ Character count updates (bottom left shows ~45 characters)
- ✅ "Run" button becomes enabled (blue, clickable)

**Pass/Fail**: ___

---

### Phase D: Execution Flow Testing (20 min)

#### Test D.1: Execute with Single Model
**Test Steps**:
1. Ensure: 1 model selected, context selected, prompt typed
2. Click "Run" button
3. Observe status changes

**Expected Behavior**:
- ✅ "Run" button becomes "Running..."
- ✅ OutputColumn shows "Executing..." status
- ✅ Footer status shows "Executing..."

**Debug - Check API Call**:
1. Open Network tab (F12 → Network)
2. Filter by `run`
3. Click Run button
4. Verify POST `/api/run` is called with payload:
```javascript
{
  "workspace_id": "vf_ws_01",
  "prompt": "your prompt text",
  "models": ["model-id"],
  "contexts": [/* context IDs */]
}
```

**Expected Response** (200-2000ms):
```javascript
{
  "run_id": "run_xxx",
  "responses": [
    {
      "output_id": "model_id",
      "model_name": "Model Name",
      "output": "Generated response text",
      "usage": {
        "prompt_tokens": 50,
        "completion_tokens": 150,
        "total_tokens": 200
      },
      "latency_ms": 500,
      "finish_reason": "stop"
    }
  ]
}
```

**Pass/Fail**: ___

#### Test D.2: Response Display
**Test Steps**:
1. After execution completes, observe OutputColumn
2. Check for response tabs
3. Verify metrics displayed

**Expected Behavior**:
- ✅ Response tabs appear (one per selected model)
- ✅ First tab auto-selected and highlighted blue
- ✅ Response text displayed
- ✅ Metrics grid shows:
  - Total Tokens: 200
  - Latency: 500ms (or similar)
  - Finish Reason: "stop"

**Pass/Fail**: ___

#### Test D.3: Tab Switching
**Test Steps**:
1. If multiple models were run, multiple tabs should be present
2. Click different response tabs
3. Observe tab switching

**Expected Behavior**:
- ✅ Active tab highlights blue
- ✅ Response text changes to match selected tab
- ✅ Metrics update to show selected response data
- ✅ Smooth transition

**Pass/Fail**: ___

#### Test D.4: Footer Status Update
**Test Steps**:
1. After execution, observe footer
2. Look for run ID and response count

**Expected Behavior**:
- ✅ Footer shows: `Run: run_xxx... • 1 response`
- ✅ Status shows run ID (first 12 chars)
- ✅ Response count correct

**Pass/Fail**: ___

---

### Phase E: Multi-Model Testing (15 min)

#### Test E.1: Execute with Multiple Models
**Test Steps**:
1. Clear previous selections
2. Select 2-3 models
3. Type a new prompt
4. Click "Run"

**Expected Behavior**:
- ✅ Footer shows "Run with 3 models"
- ✅ Execution completes
- ✅ OutputColumn shows 3 response tabs

**Pass/Fail**: ___

#### Test E.2: Compare Responses
**Test Steps**:
1. Click each tab to view responses from different models
2. Compare outputs

**Expected Behavior**:
- ✅ Each response visible
- ✅ Different outputs from different models (usually)
- ✅ Metrics vary per model (tokens, latency)

**Pass/Fail**: ___

---

### Phase F: Error Handling Testing (10 min)

#### Test F.1: Empty Prompt Error
**Test Steps**:
1. Select a model
2. Leave textarea empty
3. Try to click "Run" button

**Expected Behavior**:
- ✅ "Run" button is disabled (grayed out, not clickable)
- ✅ No API call occurs
- ✅ Clear visual feedback that button is disabled

**Pass/Fail**: ___

#### Test F.2: No Models Selected Error
**Test Steps**:
1. Clear all model selections (if any selected)
2. Type prompt in textarea
3. Try to click "Run" button

**Expected Behavior**:
- ✅ "Run" button is disabled
- ✅ Button text shows "Run" (not enabled)
- ✅ No API call occurs

**Pass/Fail**: ___

#### Test F.3: Backend Error Handling
**Test Steps**:
1. Stop one of the backend services (DataForge or NeuroForge)
2. Try to execute
3. Observe error handling

**Expected Behavior**:
- ✅ Red error message appears in PromptColumn
- ✅ Error message describes the issue
- ✅ OutputColumn doesn't show false data
- ✅ System remains usable for retry

**Error Message Example**:
```
Error: Failed to execute prompt. Please try again.
```

**Pass/Fail**: ___

#### Test F.4: Network Error Recovery
**Test Steps**:
1. With error still present, restart stopped backend
2. Try execution again

**Expected Behavior**:
- ✅ Error clears
- ✅ Execution succeeds
- ✅ Response displays

**Pass/Fail**: ___

---

### Phase G: Responsive Design Testing (10 min)

#### Test G.1: Desktop View (Full Width)
**Test Steps**:
1. Ensure browser window is maximized (~1920px wide)
2. Observe three-column layout

**Expected Behavior**:
- ✅ All three columns visible side-by-side
- ✅ ContextColumn ~30% width
- ✅ PromptColumn ~40% width
- ✅ OutputColumn ~30% width

**Pass/Fail**: ___

#### Test G.2: Tablet View (768px)
**Test Steps**:
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "iPad" or set width to 768px
4. Observe layout

**Expected Behavior**:
- ✅ Layout adapts to tablet width
- ✅ Components still accessible
- ✅ No horizontal scrolling needed
- ✅ Scrolling works within columns

**Pass/Fail**: ___

#### Test G.3: Mobile View (375px)
**Test Steps**:
1. In device toolbar, select "iPhone 12" or set width to 375px
2. Observe layout

**Expected Behavior**:
- ✅ Single column (stacked vertically) or proper mobile layout
- ✅ All components accessible with scrolling
- ✅ No horizontal scrolling
- ✅ Touch-friendly button sizes

**Pass/Fail**: ___

---

### Phase H: Store State Verification (10 min)

#### Test H.1: Check neuroforgeStore
**Test Steps**:
1. Execute a prompt with 2 models
2. In browser console, run:
```javascript
const { get } = await import('svelte/store');
const { neuroforgeStore } = await import('$lib/stores/neuroforgeStore');
console.log('neuroforgeStore:', get(neuroforgeStore));
```

**Expected Output**:
```javascript
{
  models: [/* array of models */],
  selectedModels: [/* selected model IDs */],
  isExecuting: false,
  currentRunId: "run_xxx",
  responses: [/* 2 responses */],
  error: null,
  lastUpdated: "2025-11-20T..."
}
```

**Pass/Fail**: ___

#### Test H.2: Check contextStore
**Test Steps**:
1. Select a context
2. In browser console:
```javascript
const { get } = await import('svelte/store');
const { contextStore } = await import('$lib/stores/contextStore');
console.log('contextStore:', get(contextStore));
```

**Expected Output**:
```javascript
{
  activeContexts: [/* selected context IDs */]
}
```

**Pass/Fail**: ___

---

## Comprehensive Test Results

### Summary Table

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| B.1 | ContextColumn Loading | ⬜ | |
| B.2 | PromptColumn Loading | ⬜ | |
| B.3 | OutputColumn Init | ⬜ | |
| C.1 | Context Selection | ⬜ | |
| C.2 | Context Search | ⬜ | |
| C.3 | Model Selection | ⬜ | |
| C.4 | Prompt Input | ⬜ | |
| D.1 | Single Model Execute | ⬜ | |
| D.2 | Response Display | ⬜ | |
| D.3 | Tab Switching | ⬜ | |
| D.4 | Footer Status | ⬜ | |
| E.1 | Multi-Model Execute | ⬜ | |
| E.2 | Compare Responses | ⬜ | |
| F.1 | Empty Prompt Error | ⬜ | |
| F.2 | No Models Error | ⬜ | |
| F.3 | Backend Error Handling | ⬜ | |
| F.4 | Error Recovery | ⬜ | |
| G.1 | Desktop Responsive | ⬜ | |
| G.2 | Tablet Responsive | ⬜ | |
| G.3 | Mobile Responsive | ⬜ | |
| H.1 | neuroforgeStore State | ⬜ | |
| H.2 | contextStore State | ⬜ | |

**Total Tests**: 22  
**Passed**: ⬜  
**Failed**: ⬜  
**Skipped**: ⬜  

---

## Issues Encountered

### Critical Issues (Blocks Testing)
1. [  ] Issue: _____________
   - Severity: Critical
   - Resolution: _____________

### Major Issues (Degrades Functionality)
1. [  ] Issue: _____________
   - Severity: Major
   - Workaround: _____________

### Minor Issues (Cosmetic/UX)
1. [  ] Issue: _____________
   - Severity: Minor
   - Impact: _____________

---

## Performance Metrics

| Metric | Expected | Actual | Status |
|--------|----------|--------|--------|
| Page Load Time | < 2s | ___ | ⬜ |
| Models Load | < 1s | ___ | ⬜ |
| Contexts Load | < 1s | ___ | ⬜ |
| Search Debounce | 300ms | ___ | ⬜ |
| Execution Time (1 model) | 2-10s | ___ | ⬜ |
| Execution Time (3 models) | 5-30s | ___ | ⬜ |
| Response Display | < 500ms | ___ | ⬜ |
| Tab Switch | < 100ms | ___ | ⬜ |

---

## Console Errors Log

Document any errors that appear in the browser console:

```
Timestamp | Error Message | Component | Action Taken
---------|------------------|-----------|---------------
[   ] | | | 
[   ] | | | 
[   ] | | | 
```

---

## Final Sign-Off

### Testing Completed By
- **Name**: _________________
- **Date**: _________________
- **Time**: _________________

### Overall Assessment
- [ ] All tests passed - Ready for production
- [ ] Most tests passed - Minor issues only
- [ ] Some tests failed - Needs fixes
- [ ] Many tests failed - Needs major work

### Recommendation
```
[ ] Approve for production deployment
[ ] Approve with known issues (list above)
[ ] Request additional testing before approval
[ ] Reject - needs significant work
```

### Comments
_________________________________________________________
_________________________________________________________
_________________________________________________________

---

## Next Steps After Testing

1. **If All Pass**: Ready for staging/production deployment
2. **If Minor Issues**: Document, create tickets, proceed with caution
3. **If Major Issues**: Fix and re-test before proceeding
4. **If Critical Issues**: Stop testing, investigate, fix, restart

---

## Appendix: Troubleshooting Guide

### Issue: Contexts not loading
**Diagnosis**: Check console for errors related to `/api/contexts`  
**Solution**:
1. Verify DataForge is running and responding
2. Check CORS configuration
3. Verify workspace_id is correct ("vf_ws_01")

### Issue: Models not loading
**Diagnosis**: Check console for errors related to `/api/models`  
**Solution**:
1. Verify NeuroForge is running and responding
2. Check API authentication/tokens
3. Verify model list is populated in backend

### Issue: Execution fails
**Diagnosis**: Check console and Network tab  
**Solution**:
1. Verify all backends (DataForge, NeuroForge) running
2. Check `/api/run` request payload
3. Verify response structure matches expected format

### Issue: Response not displaying
**Diagnosis**: Check console and neuroforgeStore state  
**Solution**:
1. Verify store update executed: `get(neuroforgeStore).responses`
2. Verify response has required fields
3. Check OutputColumn component in DevTools

### Issue: Memory leaks or performance degradation
**Diagnosis**: Run Chrome DevTools Memory profiler  
**Solution**:
1. Check for unsubscribed store subscriptions
2. Verify no infinite loops in reactive statements
3. Profile and identify bottlenecks

---

**End-to-End Testing Guide Complete**

Ready to begin testing Phase 2 integration.
