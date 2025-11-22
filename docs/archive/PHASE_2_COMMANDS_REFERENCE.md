# Phase 2 Quick Commands Reference

## Getting Started

### View Project Status

```bash
cd ~/projects/Coding2025/Forge/vibeforge

# Quick overview
cat READY_FOR_TESTING.md

# Full project closure report
cat PHASE_2_PROJECT_CLOSURE.md
```

### Start Testing

```bash
# Quick test guide
cat TESTING_CHECKLIST.md

# Detailed test plan
cat PHASE_2_E2E_TESTING_GUIDE.md
```

---

## Development Commands

### Build & Check

```bash
cd ~/projects/Coding2025/Forge/vibeforge

# Check for errors
npm run check

# Build for production
npm run build

# Preview production build
npm run preview

# Start dev server
npm run dev
```

### Verify Compilation

```bash
cd ~/projects/Coding2025/Forge/vibeforge

# Check specific files
npm run check 2>&1 | grep -E "(error|PromptColumn|OutputColumn)"

# View full check output
npm run check 2>&1 | tail -20
```

---

## Component Verification

### View Component Code

```bash
cd ~/projects/Coding2025/Forge/vibeforge

# ContextColumn
cat src/lib/components/ContextColumn.svelte | head -50

# PromptColumn
cat src/lib/components/PromptColumn.svelte | head -50

# OutputColumn
cat src/lib/components/OutputColumn.svelte | head -50

# Main page
cat src/routes/+page.svelte | head -50
```

### Check Line Counts

```bash
cd ~/projects/Coding2025/Forge/vibeforge

wc -l src/lib/components/{ContextColumn,PromptColumn,OutputColumn}.svelte src/routes/+page.svelte

# Expected output:
#   403 ContextColumn.svelte
#   293 PromptColumn.svelte
#   212 OutputColumn.svelte
#   273 +page.svelte
#  1181 total
```

---

## Store Verification

### Check Store Files

```bash
cd ~/projects/Coding2025/Forge/vibeforge

# List all stores
ls -1 src/lib/stores/*.ts

# Expected:
#   accessibilityStore.ts
#   contextStore.ts
#   dataforgeStore.ts
#   neuroforgeStore.ts
#   presets.ts
#   promptStore.ts
#   runStore.ts
#   themeStore.ts
```

### View Store Code

```bash
cd ~/projects/Coding2025/Forge/vibeforge

# View neuroforgeStore
cat src/lib/stores/neuroforgeStore.ts | head -40

# View contextStore
cat src/lib/stores/contextStore.ts | head -40

# View dataforgeStore
cat src/lib/stores/dataforgeStore.ts | head -40
```

---

## API Verification

### Check API Routes

```bash
cd ~/projects/Coding2025/Forge/vibeforge

# List API endpoints
find src/routes/api -name "+server.ts"

# Expected:
#   src/routes/api/models/+server.ts
#   src/routes/api/contexts/+server.ts
#   src/routes/api/search-context/+server.ts
#   src/routes/api/run/+server.ts
#   src/routes/api/history/+server.ts
```

### View API Code

```bash
cd ~/projects/Coding2025/Forge/vibeforge

# View models endpoint
cat src/routes/api/models/+server.ts

# View run endpoint
cat src/routes/api/run/+server.ts

# View contexts endpoint
cat src/routes/api/contexts/+server.ts
```

---

## Documentation References

### Quick Reference

```bash
cd ~/projects/Coding2025/Forge/vibeforge

# Entry point (START HERE for testing)
cat READY_FOR_TESTING.md

# Quick checklist (35-50 min test)
cat TESTING_CHECKLIST.md

# Detailed test plan (22 test cases)
cat PHASE_2_E2E_TESTING_GUIDE.md

# Project closure
cat PHASE_2_PROJECT_CLOSURE.md
```

### Technical Reference

```bash
cd ~/projects/Coding2025/Forge/vibeforge

# Completion summary
cat PHASE_2_COMPLETION.md

# Executive summary
cat PHASE_2_EXECUTIVE_SUMMARY.md

# Quick start
cat PHASE_2_QUICK_START.md

# Certificate
cat PHASE_2_CERTIFICATE.md
```

### Session Notes

```bash
cd ~/projects/Coding2025/Forge/vibeforge

# Progress notes
cat PHASE_2_PROGRESS.md

# Wiring summary
cat PHASE_2_WIRING_COMPLETE.md

# Integration validation
cat PHASE_2_INTEGRATION_VALIDATION.md
```

---

## Testing Setup

### Terminal 1: DataForge Backend

```bash
cd ~/projects/Coding2025/Forge/DataForge
npm run dev
# Expected: "Server listening on http://localhost:5000"
```

### Terminal 2: NeuroForge Backend

```bash
cd ~/projects/Coding2025/Forge/NeuroForge
npm run dev
# Expected: "Server listening on http://localhost:5001"
```

### Terminal 3: VibeForge Frontend

```bash
cd ~/projects/Coding2025/Forge/vibeforge
npm run dev
# Expected: "http://localhost:5173"
```

### Browser

```
http://localhost:5173
Open DevTools: F12
Console Tab: Watch for errors
Network Tab: Monitor API calls
```

---

## Testing Commands During Execution

### In Browser Console (F12)

```javascript
// Check neuroforgeStore state
const { get } = await import("svelte/store");
const { neuroforgeStore } = await import("$lib/stores/neuroforgeStore");
console.log(get(neuroforgeStore));

// Check contextStore state
const { contextStore } = await import("$lib/stores/contextStore");
console.log(get(contextStore));

// Check dataforgeStore state
const { dataforgeStore } = await import("$lib/stores/dataforgeStore");
console.log(get(dataforgeStore));

// Check if execution running
const state = get(neuroforgeStore);
console.log({
  executing: state.isExecuting,
  responses: state.responses.length,
  error: state.error,
  runId: state.currentRunId,
});
```

---

## Troubleshooting Commands

### Check Ports

```bash
# Check if ports are in use
lsof -i :5173  # Frontend
lsof -i :5000  # DataForge
lsof -i :5001  # NeuroForge

# Kill process on port (if needed)
kill -9 $(lsof -t -i:5173)
kill -9 $(lsof -t -i:5000)
kill -9 $(lsof -t -i:5001)
```

### Check Process Status

```bash
# Check running processes
ps aux | grep -E "(npm|node)"

# Grep for specific services
ps aux | grep dataforge
ps aux | grep neuroforge
ps aux | grep vibeforge
```

### View Build Logs

```bash
cd ~/projects/Coding2025/Forge/vibeforge

# Rebuild and capture logs
npm run build 2>&1 | tee build.log

# View specific errors
npm run check 2>&1 | grep -i error

# Full svelte-check output
npm run check
```

---

## Documentation Statistics

### Count Documentation Files

```bash
cd ~/projects/Coding2025/Forge/vibeforge

# Count Phase 2 docs
ls -1 PHASE_2_*.md | wc -l
# Expected: 8-10

# Count testing docs
ls -1 *TESTING*.md *CHECKLIST*.md *READY* | wc -l
# Expected: 3-4

# Total docs
ls -1 *.md | wc -l
# Expected: 20+
```

### Count Documentation Lines

```bash
cd ~/projects/Coding2025/Forge/vibeforge

# Total lines in Phase 2 docs
wc -l PHASE_2_*.md | tail -1

# Total lines in testing docs
wc -l TESTING_CHECKLIST.md PHASE_2_E2E_TESTING_GUIDE.md READY_FOR_TESTING.md

# Most comprehensive docs
ls -lhS *.md | head -10
```

---

## Component Statistics

### Code Metrics

```bash
cd ~/projects/Coding2025/Forge/vibeforge

# Total component lines
wc -l src/lib/components/{ContextColumn,PromptColumn,OutputColumn}.svelte src/routes/+page.svelte | tail -1

# Store code lines
wc -l src/lib/stores/*.ts | tail -1

# API routes lines
find src/routes/api -name "+server.ts" -exec wc -l {} + | tail -1

# Total project TypeScript
find src -name "*.ts" -o -name "*.svelte" | xargs wc -l | tail -1
```

---

## Production Build Verification

### Full Build Check

```bash
cd ~/projects/Coding2025/Forge/vibeforge

# Clean build
rm -rf .svelte-kit build dist
npm run build

# Check bundle size
du -sh build/ .svelte-kit/

# List built artifacts
find .svelte-kit/output -type f -name "*.js" | head -10
```

---

## Git Operations (if using version control)

### Check Changes

```bash
cd ~/projects/Coding2025/Forge/vibeforge

# View current status
git status

# View Phase 2 changes
git diff HEAD~1

# View specific component changes
git diff HEAD -- src/lib/components/PromptColumn.svelte
```

### Commit Phase 2 Work (example)

```bash
cd ~/projects/Coding2025/Forge/vibeforge

git add -A
git commit -m "Phase 2: Complete UI component wiring

- Wire ContextColumn with context search
- Wire PromptColumn with model selection and execution
- Wire OutputColumn with response tabs and metrics
- Integrate main page with store coordination
- Add comprehensive testing documentation

Testing: Ready for end-to-end validation
Build: 0 errors, 100% type safety"
```

---

## Performance Profiling

### Monitor Build Speed

```bash
cd ~/projects/Coding2025/Forge/vibeforge

# Time development build
time npm run build

# Expected: ~9-10 seconds

# Check incremental build
npm run build -- --verbose
```

### Monitor Runtime Performance

```bash
# In browser DevTools (F12):

# 1. Open Performance tab
# 2. Click Record
# 3. Do actions (search, execute, tab switch)
# 4. Click Stop
# 5. Analyze:
#    - Page load time
#    - Interaction time
#    - Memory usage
```

---

## Quick Audit

### 2-Minute Audit

```bash
cd ~/projects/Coding2025/Forge/vibeforge

echo "=== Compilation Status ==="
npm run check 2>&1 | tail -1

echo "=== Component Count ==="
wc -l src/lib/components/{ContextColumn,PromptColumn,OutputColumn}.svelte src/routes/+page.svelte | tail -1

echo "=== Store Files ==="
ls -1 src/lib/stores/*.ts | wc -l

echo "=== API Endpoints ==="
find src/routes/api -name "+server.ts" | wc -l

echo "=== Documentation ==="
ls -1 PHASE_2_*.md TESTING_*.md READY_*.md | wc -l
```

---

## Next Steps

### If Everything Works ✅

```bash
# Mark task complete
echo "✅ Phase 2 Complete - Ready for testing"

# Begin end-to-end testing
cat READY_FOR_TESTING.md
```

### If Issues Found ❌

```bash
# Check error logs
npm run check 2>&1 | grep error

# View specific component errors
npm run check 2>&1 | grep "PromptColumn\|OutputColumn"

# Rebuild
npm run build
```

---

## Summary

**Phase 2 Status**: ✅ COMPLETE  
**Build Status**: ✅ SUCCESS  
**Type Safety**: ✅ 100%  
**Testing**: ✅ READY

**Next**: Execute testing from READY_FOR_TESTING.md

---

**All commands reference Phase 2 VibeForge integration project.**
