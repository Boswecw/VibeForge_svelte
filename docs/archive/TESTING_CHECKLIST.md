# Quick Testing Checklist - Phase 2

## Pre-Test Setup (5 min)

### Terminal 1: DataForge
```bash
cd ~/projects/Coding2025/Forge/DataForge
npm run dev
```
- [ ] Server started
- [ ] Port visible (likely 5000)
- [ ] Health check passes

### Terminal 2: NeuroForge
```bash
cd ~/projects/Coding2025/Forge/NeuroForge
npm run dev
```
- [ ] Server started
- [ ] Port visible (likely 5001)
- [ ] Health check passes

### Terminal 3: VibeForge
```bash
cd ~/projects/Coding2025/Forge/vibeforge
npm run dev
```
- [ ] Frontend started
- [ ] Running on http://localhost:5173
- [ ] No build errors

### Browser Setup
- [ ] Navigate to http://localhost:5173
- [ ] DevTools open (F12)
- [ ] Console tab visible
- [ ] Network tab ready

---

## Quick Test Sequence (30-45 min)

### Load Test (2 min)
- [ ] Page loads with three columns visible
- [ ] No console errors
- [ ] ContextColumn shows contexts or loading state
- [ ] PromptColumn shows models
- [ ] OutputColumn shows empty state

### Selection Test (5 min)
- [ ] Click a context in ContextColumn → highlights
- [ ] Search for context → results update
- [ ] Click a model in PromptColumn → highlights blue
- [ ] Type prompt → character count updates
- [ ] "Run" button enabled (blue)

### Execution Test (10 min)

**Single Model**:
1. Select 1 model
2. Select 1 context
3. Type prompt: "Hello, what is AI?"
4. Click "Run"
5. - [ ] Button shows "Running..."
6. - [ ] Wait 2-10 seconds
7. - [ ] Response appears in OutputColumn
8. - [ ] Metrics display (tokens, latency)

**Multi-Model**:
1. Select 2-3 models
2. Click "Run"
3. - [ ] Multiple response tabs appear
4. - [ ] Click tabs → switch responses
5. - [ ] Metrics update per response

### Error Test (3 min)
- [ ] Try to run with no models selected → button disabled
- [ ] Try to run with empty prompt → button disabled
- [ ] (Optional) Stop backend, try to execute → error displays

### Responsive Test (3 min)
- [ ] Desktop view: all columns visible
- [ ] Tablet view (768px): layout adapts
- [ ] Mobile view (375px): stacked or single column

### Store Verification (2 min)
In browser console:
```javascript
// Check neuroforgeStore
const { get } = await import('svelte/store');
const { neuroforgeStore } = await import('$lib/stores/neuroforgeStore');
console.log(get(neuroforgeStore));
```
- [ ] Has responses after execution
- [ ] Has selectedModels
- [ ] Has currentRunId
- [ ] isExecuting: false after completion

---

## Pass/Fail Decision Tree

```
Does page load without errors?
├─ NO  → FAIL (Debug console errors)
└─ YES → Continue

Do all three columns appear?
├─ NO  → FAIL (Check component imports)
└─ YES → Continue

Can you select contexts and models?
├─ NO  → FAIL (Check store writes)
└─ YES → Continue

Can you execute a single model?
├─ NO  → FAIL (Check /api/run endpoint)
└─ YES → Continue

Does response display in OutputColumn?
├─ NO  → FAIL (Check store updates)
└─ YES → Continue

Can you switch between response tabs?
├─ NO  → FAIL (Check tab switching logic)
└─ YES → PASS! ✅
```

---

## Quick Reference: API Calls to Watch

### Network Tab - Expected Calls

1. **Load Models**
   - `GET /api/models`
   - Status: 200
   - Response: Array of model objects

2. **Load Contexts**
   - `GET /api/contexts?workspace_id=vf_ws_01`
   - Status: 200
   - Response: Array of context objects

3. **Search Contexts**
   - `POST /api/search-context`
   - Status: 200
   - Body: `{ workspace_id, query }`
   - Response: Array of search results

4. **Execute Prompt**
   - `POST /api/run`
   - Status: 200
   - Body:
     ```json
     {
       "workspace_id": "vf_ws_01",
       "prompt": "user prompt",
       "models": ["model_id_1", "model_id_2"],
       "contexts": ["context_id_1"]
     }
     ```
   - Response:
     ```json
     {
       "run_id": "run_xxx",
       "responses": [
         {
           "output_id": "model_id",
           "model_name": "Model Name",
           "output": "Response text",
           "usage": {
             "total_tokens": 200
           },
           "latency_ms": 500,
           "finish_reason": "stop"
         }
       ]
     }
     ```

---

## Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Contexts not loading | Check DataForge is running (`ps aux \| grep dataforge`) |
| Models not loading | Check NeuroForge is running (`ps aux \| grep neuroforge`) |
| "Run" button disabled | Select a model AND type prompt text |
| No response after clicking "Run" | Check backend services, verify no console errors |
| Only 1 response when 2 models selected | Check /api/run response structure in Network tab |
| Response not updating | Refresh page (Ctrl+R), check console for store errors |
| Layout broken on mobile | This is expected - may need mobile-specific layout phase |

---

## Test Status Template

Print and fill out while testing:

```
Date: ______________
Tester: ______________
Start Time: ______________

┌─ Load Test ────────────────────────────┐
│ Page loads: [ ] YES  [ ] NO            │
│ No errors: [ ] YES  [ ] NO             │
│ Columns visible: [ ] YES  [ ] NO       │
└────────────────────────────────────────┘

┌─ Selection Test ───────────────────────┐
│ Context selectable: [ ] YES  [ ] NO    │
│ Model selectable: [ ] YES  [ ] NO      │
│ Prompt input works: [ ] YES  [ ] NO    │
│ Run button enabled: [ ] YES  [ ] NO    │
└────────────────────────────────────────┘

┌─ Execution Test ───────────────────────┐
│ Single model runs: [ ] YES  [ ] NO     │
│ Response displays: [ ] YES  [ ] NO     │
│ Metrics show: [ ] YES  [ ] NO          │
│ Multi-model runs: [ ] YES  [ ] NO      │
│ Tabs switch: [ ] YES  [ ] NO           │
└────────────────────────────────────────┘

┌─ Error Handling ───────────────────────┐
│ No model validation: [ ] YES  [ ] NO   │
│ No prompt validation: [ ] YES  [ ] NO  │
│ Backend error shows: [ ] YES  [ ] NO   │
└────────────────────────────────────────┘

Overall Result: [ ] PASS  [ ] FAIL

Critical Issues: _________________________
_________________________________________

Notes: __________________________________
_________________________________________

End Time: ______________
```

---

## What Success Looks Like

✅ **Pass Criteria**:
1. Page loads without errors
2. All three columns visible and functional
3. Can select contexts and models
4. Can execute prompts with one or multiple models
5. Responses display correctly with metrics
6. Response tabs work
7. Error handling works (disabled buttons, error messages)
8. No critical console errors

❌ **Fail Criteria**:
1. Page fails to load
2. Columns missing or broken
3. Cannot select contexts/models
4. Execution fails
5. Responses don't display
6. Critical console errors
7. Store state incorrect

---

## After Testing

### If PASS:
1. Mark task as complete
2. Document any minor issues found
3. Ready for staging deployment

### If FAIL:
1. Collect error messages from console
2. Check Network tab for failed requests
3. Verify all backends running correctly
4. Fix issues, rebuild, restart
5. Re-test

---

**Ready to Test?**

```bash
# All-in-one quick start (run in separate terminals):
Terminal 1: cd ~/projects/Coding2025/Forge/DataForge && npm run dev
Terminal 2: cd ~/projects/Coding2025/Forge/NeuroForge && npm run dev
Terminal 3: cd ~/projects/Coding2025/Forge/vibeforge && npm run dev
Browser: http://localhost:5173
```

Begin with the Quick Test Sequence above!
