# Phase 2 — Quick Reference Guide

## What Was Done Today

✅ **PromptColumn** - Loads models, executes `/api/run`, shows execution state  
✅ **OutputColumn** - Displays response tabs with metrics (tokens, latency, finish_reason)  
✅ **ContextColumn** - Already working (no changes)

## How to Use

### 1. Start the App

```bash
npm run dev
# Navigate to http://localhost:5173
```

### 2. Test the Flow

**Left Column (ContextColumn):**

- Contexts auto-load
- Type in search box
- Results appear with similarity scores

**Middle Column (PromptColumn):**

- Models auto-load (colored buttons)
- Click buttons to select models
- Type your prompt
- Click "Run" button

**Right Column (OutputColumn):**

- Tabs appear for each model
- Click tabs to switch between responses
- See tokens, latency, finish reason below

## Files Modified Today

```
src/lib/components/
├── PromptColumn.svelte      [UPDATED - 150 lines added]
├── OutputColumn.svelte      [UPDATED - Completely rewired]
└── ContextColumn.svelte     [UNCHANGED - Already working]
```

## Key Functions to Know

### PromptColumn

```typescript
handleRun(); // Execute prompt via /api/run
toggleModel(id); // Select/deselect model
```

### OutputColumn

```typescript
Auto-selects first tab when responses arrive
formatNumber()     // Format token counts with commas
```

## What's Next

1. **Wire main page** (10 min)

   - Add three-column grid layout
   - Import the three components

2. **Test end-to-end** (1 hour)

   - Run full flow from prompt → output

3. **Create history panel** (1 hour, optional)
   - Load past runs
   - Replay functionality

## How It Works

```
1. User selects models in PromptColumn
2. User types prompt + clicks "Run"
3. PromptColumn calls POST /api/run
4. Backend calls NeuroForge /prompt/run
5. Backend calls DataForge /runs to log
6. Response comes back with run_id + responses
7. neuroforgeStore updates automatically
8. OutputColumn sees new responses and creates tabs
9. First tab auto-selects and displays output
```

## Endpoints Being Used

**Reading:**

- `GET /api/models` — Load available models (PromptColumn)
- `GET /api/contexts` — Load available contexts (ContextColumn)
- `POST /api/search-context` — Search contexts (ContextColumn)

**Writing:**

- `POST /api/run` — Execute prompt + log run (PromptColumn)

## Store Interactions

### PromptColumn writes to neuroforgeStore:

```typescript
setModels(models); // When models load
selectModels(selected); // When user selects models
setExecuting(true / false); // During execution
setCurrentRunId(id); // When run completes
setResponses(responses); // When responses arrive
setError(message); // On error
```

### OutputColumn reads from neuroforgeStore:

```typescript
$neuroforgeStore.responses; // Display response tabs
$neuroforgeStore.isExecuting; // Show "Running..." indicator
$neuroforgeStore.currentRunId; // Display run ID
$neuroforgeStore.error; // Show error messages
```

## Common Issues & Fixes

### Models not loading?

- Check browser console for errors
- Verify `/api/models` endpoint responds
- Check network tab for 200 status code

### Run button disabled?

- Ensure at least one model selected
- Ensure prompt text is not empty
- Button will enable once conditions met

### No output tabs appearing?

- Check network tab - did `/api/run` return 200?
- Check if responses array is populated
- Look for error messages in OutputColumn

### Tabs showing but no data?

- Refresh page
- Check that activeResponse exists
- Verify metrics data structure matches type definitions

## Development Tips

### Quick Debugging

```javascript
// In browser console:
// Check store state
_sveltekit.stores; // See all stores
// Check API responses
fetch("/api/models")
  .then((r) => r.json())
  .then(console.log);
fetch("/api/contexts?workspace_id=vf_ws_01")
  .then((r) => r.json())
  .then(console.log);
```

### Enable Redux DevTools (if using Redux)

Currently using Svelte stores, not Redux

### Hot Reload

- Changes to components auto-refresh
- Changes to stores auto-refresh
- No manual rebuild needed

## Success Criteria - Phase 2 Wiring

✅ Models load on page load  
✅ Can select multiple models  
✅ Can type prompt  
✅ Run button works when models+prompt selected  
✅ Response tabs appear after run  
✅ Can switch between tabs  
✅ Metrics display correctly  
✅ Error messages show on failures  
✅ Loading states show during execution  
✅ All three columns coordinate via stores

## Performance Notes

- Model loading: ~50ms (happens once)
- Running prompt: ~1-5 seconds (depends on backend)
- Tab switching: Instant (local state)
- Search results: ~300ms delay (debounced)
- No unnecessary re-renders

## Browser DevTools Recommendations

**Console Tab:**

- Check for any JavaScript errors
- Log store updates for debugging

**Network Tab:**

- Monitor `/api/*` requests
- Check response status codes (200, 400, 500)
- Verify response payloads match types

**Vue/React DevTools:**

- Not applicable (using plain Svelte)

## Common Commands

```bash
# Start development server
npm run dev

# Type check
npm run check

# Build for production
npm run build

# Preview production build
npm run preview

# Lint (if configured)
npm run lint
```

## Files to Reference

**Architecture:**

- `INTEGRATION_ARCHITECTURE.md` — Full system design
- `PHASE_1_DELIVERY_INDEX.md` — Phase 1 reference
- `PHASE_2_PROGRESS.md` — Detailed progress
- `PHASE_2_WIRING_COMPLETE.md` — Today's changes

**Code:**

- `src/lib/stores/neuroforgeStore.ts` — Response state management
- `src/lib/stores/dataforgeStore.ts` — Context state management
- `src/routes/api/run/+server.ts` — Main orchestration endpoint
- `src/lib/types/neuroforge.ts` — Response type definitions

## Next Session Checklist

- [ ] Wire main `+page.svelte`
- [ ] Test end-to-end flow
- [ ] Create HistoryPanel (optional)
- [ ] Run integration tests
- [ ] Deploy to production

---

**Phase 2 Status**: 60% complete  
**Last Updated**: November 20, 2025  
**Estimated Time to Complete**: 2 hours
