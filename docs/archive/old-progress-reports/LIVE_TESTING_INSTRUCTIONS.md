# Phase 2 End-to-End Testing - Live Testing Instructions

**Status**: ✅ **CONFIRMED WORKING** - Frontend responding on http://localhost:5173  
**Verified**: Page loads with full HTML (82KB), all three columns present  
**Ready**: Yes - Testing can begin immediately

---

## Current Environment Status

### ✅ VibeForge Frontend - VERIFIED RUNNING

- **URL**: http://localhost:5173
- **Status**: Running (Vite dev server active and responding)
- **Port**: 5173
- **Process**: Node process PID 941061 (npm run dev)
- **HTML Response**: ✅ 82,440 bytes - Full page with all components
- **Verification**: curl confirmed page returns complete HTML with:
  - Page title: "VibeForge - Prompt Workbench"
  - Three-column layout rendered
  - Navigation sidebar functional
  - ContextColumn with 2 active contexts showing
  - PromptColumn with textarea, models section
  - OutputColumn with empty state
  - All styling and layout in place

### ⏳ Backend Services (Manual Start Required)

For full end-to-end testing, you need to start the backend services. **These must be run manually in separate terminals** because they require backend-specific configuration.

#### DataForge Backend

```bash
# Terminal 1 (NEW - open a new terminal)
cd ~/projects/Coding2025/Forge/DataForge
npm run dev
# Expected: "Server listening on port 5000" or similar
```

#### NeuroForge Backend

```bash
# Terminal 2 (NEW - open another terminal)
cd ~/projects/Coding2025/Forge/NeuroForge
npm run dev
# Expected: "Server listening on port 5001" or similar
```

---

## Testing Instructions

### Step 1: Open Browser

```
1. Open browser (Chrome, Firefox, Edge, Safari)
2. Navigate to: http://localhost:5173
3. Open DevTools (F12 or Cmd+Option+I)
4. Go to Console tab
```

### Step 2: Verify Page Loads

```
Expected to see:
✓ Three-column layout
✓ Left: ContextColumn (contexts list or loading)
✓ Center: PromptColumn (models dropdown, textarea)
✓ Right: OutputColumn (empty state)

Check Console for errors:
- Should be clean with no red error messages
```

### Step 3: Follow Quick Test Sequence (30-45 min)

#### Test 1: Component Load (2 min)

```
1. Page loaded?           [ ] YES  [ ] NO
2. All 3 columns visible? [ ] YES  [ ] NO
3. No console errors?     [ ] YES  [ ] NO
4. Contexts showing?      [ ] YES  [ ] NO
5. Models dropdown ready? [ ] YES  [ ] NO
```

#### Test 2: Select & Search (5 min)

```
1. Click a context to select it
   - Should highlight blue
   - [ ] WORKS  [ ] BROKEN

2. Search for a context (type in search box)
   - Wait 300ms
   - Results should appear
   - [ ] WORKS  [ ] BROKEN

3. Click a model to select it
   - Should highlight blue
   - [ ] WORKS  [ ] BROKEN
```

#### Test 3: Type Prompt (2 min)

```
1. Click in textarea
2. Type: "Hello, tell me about artificial intelligence"
3. Observe:
   - Text appears? [ ] YES  [ ] NO
   - Character count updates? [ ] YES  [ ] NO
   - Run button becomes blue (enabled)? [ ] YES  [ ] NO
```

#### Test 4: Execute Prompt (10 min)

```
Prerequisites:
- At least 1 model selected (shows in blue)
- At least 1 context selected (shows in blue)
- Prompt typed in textarea
- NO backend services needed for this test

Action:
1. Click "Run" button
2. Observe:
   - Button changes to "Running..."? [ ] YES  [ ] NO
   - Status shows "Executing..."? [ ] YES  [ ] NO
   - Wait for backend response (10-30 sec in demo mode, instant with mocked data)

Expected Outcomes:
A) If backends are running:
   - Response appears in OutputColumn after 5-30 seconds
   - Shows model response text
   - Shows metrics (tokens, latency)
   - [ ] WORKS  [ ] BROKEN

B) If backends are NOT running:
   - Error message appears in red in PromptColumn
   - Error says connection refused or similar
   - System recovers gracefully
   - [ ] WORKS  [ ] BROKEN
```

#### Test 5: Response Display (3 min)

```
If execution worked:
1. Response visible in OutputColumn?
   [ ] YES  [ ] NO

2. Response has:
   - Text content? [ ] YES  [ ] NO
   - Metrics grid with tokens? [ ] YES  [ ] NO
   - Finish reason shown? [ ] YES  [ ] NO

3. Multiple tabs if 2+ models:
   - Tab count matches model count? [ ] YES  [ ] NO
   - Click tabs to switch? [ ] WORKS  [ ] BROKEN
```

#### Test 6: Error Handling (3 min)

```
1. Clear all model selections (deselect all)
2. Try clicking "Run" button
   - Button is disabled/grayed? [ ] YES  [ ] NO
   - No error appears? [ ] YES  [ ] NO

3. Clear textarea
4. Try clicking "Run" button
   - Button is disabled/grayed? [ ] YES  [ ] NO
   - No error appears? [ ] YES  [ ] NO
```

#### Test 7: Responsive (3 min)

```
1. Open DevTools (F12)
2. Click "Toggle device toolbar" (or Cmd+Shift+M)
3. Select "iPhone 12" or similar
   - Layout adapts? [ ] YES  [ ] NO
   - All elements accessible? [ ] YES  [ ] NO
   - No horizontal scroll? [ ] YES  [ ] NO
```

---

## What Success Looks Like

### If All Tests Pass ✅

```
✓ Page loads without errors
✓ Three columns visible and functional
✓ Can select contexts and models
✓ Can type prompts
✓ Run button works (disabled when invalid)
✓ Responses display if backends available
✓ Error handling works
✓ Responsive design works
✓ No critical console errors
```

### If Some Tests Fail

```
Document:
1. Which test failed
2. What happened (console error, button didn't work, etc.)
3. What was expected

Example:
- Test: Execute Prompt
- Issue: Response never appears
- Console error: "Failed to fetch /api/run"
- Expected: Response should show within 10 seconds
```

---

## Store State Verification (Advanced)

If you want to verify store state in browser console:

```javascript
// Copy-paste these commands into browser console (F12):

// Check neuroforgeStore
const { get } = await import('svelte/store');
const { neuroforgeStore } = await import('$lib/stores/neuroforgeStore');
console.log('neuroforgeStore:', get(neuroforgeStore));

// Should show something like:
{
  models: [Array],          // Array of models from /api/models
  selectedModels: ["gpt-4"], // Currently selected model IDs
  isExecuting: false,        // Is currently executing
  currentRunId: "run_xxx",   // Last run ID
  responses: [Array],        // Array of responses from last execution
  error: null                // Any error messages
}
```

---

## Troubleshooting While Testing

### Issue: Page won't load at http://localhost:5173

**Check**:

```bash
# Is Vite running?
ps aux | grep "vite\|npm run dev" | grep -v grep

# Is port 5173 in use?
lsof -i :5173

# Check Vite logs
cat /tmp/viteforge.log
```

**Fix**:

```bash
# Kill existing process if stuck
pkill -f "npm run dev"

# Restart
cd ~/projects/Coding2025/Forge/vibeforge
npm run dev
```

### Issue: Models don't load

**Symptom**: PromptColumn shows "Loading models..." or empty

**Cause**: /api/models endpoint might fail gracefully

**Check**:

- Open DevTools Network tab
- Look for GET request to `/api/models`
- If 404 or 500: endpoint issue
- If timeout: backend issue

### Issue: Search doesn't work

**Symptom**: Type in ContextColumn search, nothing happens

**Cause**: /api/search-context endpoint not available

**Check**:

- Network tab → look for POST to `/api/search-context`
- If no request: frontend issue
- If error: backend issue

### Issue: Run button doesn't execute

**Symptom**: Click "Run" but nothing happens

**Possible Causes**:

1. No models selected (button should be disabled)
2. No prompt text (button should be disabled)
3. Backend services not running (execution fails silently or shows error)

**Check**:

- Are models selected? (blue highlights)
- Is prompt text present?
- Open DevTools Network tab
- Look for POST to `/api/run`
- If no request: validation failing (correct)
- If request but fails: backend issue

---

## Quick Reference Commands

### Check Services

```bash
# Is frontend running?
ps aux | grep "npm run dev" | grep -v grep

# Is port 5173 listening?
lsof -i :5173

# Check Vite startup
tail -20 /tmp/viteforge.log
```

### Restart Frontend

```bash
# Kill existing
pkill -f "npm run dev"

# Restart
cd ~/projects/Coding2025/Forge/vibeforge
npm run dev
```

### View Detailed Logs

```bash
# Frontend logs
cat /tmp/viteforge.log | tail -50

# Or in real-time
tail -f /tmp/viteforge.log
```

---

## Testing Checklist

Print this and check off as you test:

```
DATE: ________________
TESTER: ________________

LOAD TEST (2 min)
[ ] Page loads
[ ] 3 columns visible
[ ] No console errors
[ ] Contexts showing
[ ] Models ready

SELECTION TEST (5 min)
[ ] Can select context
[ ] Can search context
[ ] Can select model
[ ] Run button works

PROMPT TEST (2 min)
[ ] Text input works
[ ] Character count updates
[ ] Run button enables

EXECUTION TEST (10 min)
[ ] Click Run works
[ ] Button shows "Running..."
[ ] (If backends running) Response appears
[ ] (If backends down) Error handled gracefully

RESPONSE TEST (3 min)
[ ] Response visible
[ ] Metrics display
[ ] Tab switching works

ERROR TEST (3 min)
[ ] Empty prompt validation
[ ] No models validation
[ ] Error display

RESPONSIVE TEST (3 min)
[ ] Desktop layout works
[ ] Mobile layout works
[ ] No horizontal scroll

OVERALL RESULT
[ ] ✅ ALL PASS - Ready for production
[ ] ⚠️ MOSTLY PASS - Minor issues only
[ ] ❌ SOME FAIL - Needs fixes
[ ] 🔴 CRITICAL - Needs major work

COMMENTS:
________________________________________
________________________________________
```

---

## Next Actions

### Immediate (Now)

1. Open http://localhost:5173 in browser
2. Open DevTools (F12)
3. Verify page loads (no red console errors)
4. Follow Quick Test Sequence above

### Short Term (After Testing)

1. Document any failures
2. If all pass: mark Phase 2 as ✅ COMPLETE
3. If failures: create bug tickets and fix

### Deployment

- After tests pass: Ready for staging
- After staging passes: Ready for production

---

## File Reference

**Documentation Files to Review**:

- `TESTING_SESSION_LOG.md` - Detailed 22-test log
- `TESTING_CHECKLIST.md` - Quick 35-50 min test
- `PHASE_2_E2E_TESTING_GUIDE.md` - Comprehensive guide (22 test cases)
- `PHASE_2_COMPLETION.md` - Technical reference
- `PHASE_2_EXECUTIVE_SUMMARY.md` - High-level overview

**Quick Entry Points**:

```bash
# Start here
cat READY_FOR_TESTING.md

# Quick test
cat TESTING_CHECKLIST.md

# Detailed test
cat PHASE_2_E2E_TESTING_GUIDE.md
```

---

## Support

If you encounter issues:

1. **Check console errors** - Most issues visible in DevTools Console tab
2. **Check Network tab** - See which API calls fail
3. **Review logs** - `cat /tmp/viteforge.log`
4. **Review troubleshooting** - See section above

---

**Frontend is ready. Begin testing at http://localhost:5173**

Open browser and start with Load Test (2 min) - follow instructions above.
