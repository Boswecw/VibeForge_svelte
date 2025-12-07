# VibeForge Troubleshooting Guide

**Version:** 5.7.0 (Phase 2 Complete)
**Last Updated:** December 6, 2025

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Installation Issues](#installation-issues)
3. [Development Server Issues](#development-server-issues)
4. [Build & Compilation Issues](#build--compilation-issues)
5. [Runtime Issues](#runtime-issues)
6. [Backend Integration Issues](#backend-integration-issues)
7. [LLM Provider Issues](#llm-provider-issues)
8. [MCP Integration Issues](#mcp-integration-issues)
9. [Cortex Planning Issues](#cortex-planning-issues)
10. [Performance Issues](#performance-issues)
11. [Data & Storage Issues](#data--storage-issues)
12. [Platform-Specific Issues](#platform-specific-issues)
13. [Getting Help](#getting-help)

---

## Quick Diagnostics

Run these commands first to identify common issues:

```bash
# Check Node.js version (need 20.x+)
node --version

# Check pnpm version (need 9.x+)
pnpm --version

# Check Rust version (need 1.75+)
rustc --version

# Check dependencies
pnpm list --depth=0

# Run type checking
pnpm check

# Run tests
pnpm test
```

**Expected output:**
```
node: v20.x.x ✓
pnpm: 9.x.x ✓
rustc: 1.75+ ✓
Dependencies: No issues ✓
Type check: 0 errors ✓
Tests: 986/1,029 passing (95.8%) ✓
```

---

## Installation Issues

### Issue: "pnpm: command not found"

**Cause:** pnpm not installed globally

**Solution:**
```bash
npm install -g pnpm

# Verify installation
pnpm --version
```

### Issue: "Cannot find module '@sveltejs/kit'"

**Cause:** Dependencies not installed or corrupted

**Solution:**
```bash
# Remove old dependencies
rm -rf node_modules pnpm-lock.yaml

# Clear pnpm cache
pnpm store prune

# Reinstall
pnpm install

# Verify
pnpm list @sveltejs/kit
```

### Issue: "Peer dependency warnings"

**Cause:** Version conflicts in dependencies

**Solution:**
```bash
# Use legacy peer deps (if needed)
pnpm install --legacy-peer-deps

# Or update all dependencies
pnpm update --latest
```

### Issue: "EACCES: permission denied"

**Cause:** Insufficient permissions

**Solution:**
```bash
# Option 1: Fix npm/pnpm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.pnpm-store

# Option 2: Use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

---

## Development Server Issues

### Issue: "Port 5173 already in use"

**Cause:** Another process using the default port

**Solution:**
```bash
# Find process using port
lsof -i :5173
# or
netstat -tuln | grep 5173

# Kill process
kill -9 <PID>

# Or use different port
pnpm dev --port 5174
```

### Issue: "Dev server won't start"

**Cause:** Multiple possible causes

**Solution:**
```bash
# 1. Check for errors
pnpm dev --debug

# 2. Clear .svelte-kit cache
rm -rf .svelte-kit

# 3. Clear Vite cache
rm -rf node_modules/.vite

# 4. Reinstall dependencies
rm -rf node_modules
pnpm install

# 5. Restart
pnpm dev
```

### Issue: "Hot Module Reload (HMR) not working"

**Cause:** File watcher limits or Vite configuration

**Solution (Linux):**
```bash
# Increase file watcher limits
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Restart dev server
pnpm dev
```

**Solution (macOS/Windows):**
```bash
# Try with polling
pnpm dev --force

# Or restart with clean cache
rm -rf .svelte-kit node_modules/.vite
pnpm dev
```

### Issue: "WebSocket connection failed"

**Cause:** Firewall or proxy blocking WebSocket connections

**Solution:**
```bash
# Check firewall
sudo ufw status

# Allow port 5173
sudo ufw allow 5173

# Or use polling instead
# vite.config.ts:
export default defineConfig({
  server: {
    watch: {
      usePolling: true
    }
  }
});
```

---

## Build & Compilation Issues

### Issue: "TypeScript errors" (Type checking)

**Cause:** Type mismatches or missing types

**Solution:**
```bash
# Run type checking
pnpm check

# See specific errors
npx svelte-kit sync
pnpm check --watch

# Common fixes:
# 1. Regenerate types
npx svelte-kit sync

# 2. Restart TypeScript server (VSCode)
# Cmd+Shift+P > "TypeScript: Restart TS Server"

# 3. Check tsconfig.json
cat tsconfig.json
```

### Issue: "Build fails with 'out of memory'"

**Cause:** Insufficient memory for build process

**Solution:**
```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Build
pnpm build

# Or use smaller chunks
# vite.config.ts:
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
});
```

### Issue: "CSS/Tailwind classes not working"

**Cause:** Tailwind not configured or CSS not compiled

**Solution:**
```bash
# 1. Check Tailwind config
cat tailwind.config.cjs

# 2. Verify PostCSS config
cat postcss.config.cjs

# 3. Rebuild with clean cache
rm -rf .svelte-kit node_modules/.vite
pnpm build

# 4. Verify app.css is imported
grep "import.*app.css" src/routes/+layout.svelte
```

### Issue: "Tauri build fails"

**Cause:** Missing system dependencies or Rust issues

**Solution (Linux):**
```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev

# Clean Rust cache
cd src-tauri && cargo clean && cd ..

# Rebuild
pnpm tauri build
```

**Solution (macOS):**
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Update Rust
rustup update stable

# Rebuild
pnpm tauri build
```

**Solution (Windows):**
```powershell
# Install Visual Studio Build Tools
winget install Microsoft.VisualStudio.2022.BuildTools

# Update Rust
rustup update stable

# Rebuild
pnpm tauri build
```

---

## Runtime Issues

### Issue: "Application won't start (Desktop)"

**Cause:** Missing dependencies or corrupted cache

**Solution (Linux):**
```bash
# Check logs
journalctl -xe | grep vibeforge

# Clear cache
rm -rf ~/.config/vibeforge

# Reinstall
sudo dpkg -i vibeforge_5.7.0_amd64.deb
vibeforge
```

**Solution (macOS):**
```bash
# Check logs
cat ~/Library/Logs/VibeForge/main.log

# Clear cache
rm -rf ~/Library/Application\ Support/vibeforge

# Reinstall
open VibeForge_5.7.0_x64.dmg
```

**Solution (Windows):**
```powershell
# Check logs
type %APPDATA%\VibeForge\logs\main.log

# Clear cache
del /F /S /Q %APPDATA%\vibeforge

# Reinstall .msi
```

### Issue: "Blank screen on launch"

**Cause:** Corrupted localStorage or incompatible data

**Solution:**
```javascript
// Open DevTools (Ctrl+Shift+I)
// In Console, run:
localStorage.clear();
location.reload();
```

### Issue: "Application crashes on specific action"

**Cause:** Unhandled error in code

**Solution:**
```bash
# 1. Check DevTools Console (F12)
# Look for error messages

# 2. Check ErrorBoundary
# Errors should be caught and displayed

# 3. Report issue with:
# - Steps to reproduce
# - Error message from console
# - Browser/OS version
```

### Issue: "Theme not persisting"

**Cause:** localStorage blocked or not working

**Solution:**
```javascript
// Test localStorage
try {
  localStorage.setItem('test', 'value');
  console.log('localStorage works:', localStorage.getItem('test'));
  localStorage.removeItem('test');
} catch (e) {
  console.error('localStorage blocked:', e);
}

// If blocked, check browser settings:
// Chrome: Settings > Privacy > Cookies > Allow
// Firefox: Settings > Privacy > Cookies > Allow
```

---

## Backend Integration Issues

### Issue: "Cannot connect to DataForge API"

**Cause:** API not running or network issue

**Solution:**
```bash
# 1. Check if API is running
curl http://localhost:8001/health
# Expected: {"status": "ok"}

# 2. Check environment variables
echo $PUBLIC_DATAFORGE_URL

# 3. Check network
ping localhost

# 4. Start DataForge (if not running)
cd ../DataForge
source venv/bin/activate
uvicorn app.main:app --port 8001
```

### Issue: "Cannot connect to NeuroForge API"

**Cause:** API not running or authentication issue

**Solution:**
```bash
# 1. Check if API is running
curl http://localhost:8000/health

# 2. Check environment variables
echo $PUBLIC_NEUROFORGE_URL

# 3. Start NeuroForge (if not running)
cd ../NeuroForge/neuroforge_backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Issue: "API returns 404"

**Cause:** Wrong endpoint or API version mismatch

**Solution:**
```bash
# Check API version
curl http://localhost:8001/api/version

# Check available endpoints
curl http://localhost:8001/docs

# Update API URL in .env
PUBLIC_DATAFORGE_URL=http://localhost:8001/api/v1
```

### Issue: "CORS errors"

**Cause:** Backend not allowing frontend origin

**Solution (Backend):**
```python
# In DataForge/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## LLM Provider Issues

### Issue: "Claude API error: Invalid API key"

**Cause:** Wrong or expired API key

**Solution:**
```bash
# 1. Get new API key from https://console.anthropic.com/settings/keys

# 2. Update in Settings panel
# - Open VibeForge
# - Go to Planning > Settings
# - Enter new Anthropic API key
# - Click "Save API Keys"

# 3. Verify key is saved
# Open DevTools Console:
const apiKeys = JSON.parse(localStorage.getItem('vibeforge-api-keys') || '{}');
console.log('Anthropic key set:', !!apiKeys.anthropic);
```

### Issue: "OpenAI API error: Rate limit exceeded"

**Cause:** Too many requests or exceeded quota

**Solution:**
```bash
# Check quota usage
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer YOUR_API_KEY"

# Wait before retrying (rate limit resets)
# Or upgrade OpenAI plan
```

### Issue: "Streaming stops mid-response"

**Cause:** Network timeout or API issue

**Solution:**
```javascript
// 1. Check network in DevTools (F12 > Network)
// Look for failed SSE connections

// 2. Increase timeout (if self-hosting)
// In modelRouter.ts:
const controller = new AbortController();
setTimeout(() => controller.abort(), 60000); // 60 seconds

// 3. Check API status
// https://status.openai.com
// https://status.anthropic.com
```

### Issue: "Cost tracking incorrect"

**Cause:** Token estimation vs actual usage

**Solution:**
```javascript
// Token counts are estimates
// Actual billing from providers may differ slightly

// Check actual usage:
// - OpenAI: https://platform.openai.com/usage
// - Anthropic: https://console.anthropic.com/settings/billing
```

---

## MCP Integration Issues

### Issue: "MCP server won't connect"

**Cause:** Server not running or wrong URL

**Solution:**
```bash
# 1. Check if MCP server is running
curl http://localhost:8001/mcp/health

# 2. Check server configuration
# In tools.svelte.ts:
const defaultServers = [
  {
    id: 'dataforge',
    name: 'DataForge',
    url: 'http://localhost:8001'
  }
];

# 3. Restart MCP server
cd ../DataForge
source venv/bin/activate
uvicorn app.main:app --port 8001
```

### Issue: "Tools not discovered"

**Cause:** MCP server not exposing tools or protocol mismatch

**Solution:**
```bash
# 1. Test tools endpoint directly
curl http://localhost:8001/mcp/tools

# Expected response:
# {
#   "tools": [
#     {"name": "queryKB", "description": "..."},
#     ...
#   ]
# }

# 2. Check MCP protocol version
# Server must support JSON-RPC 2.0

# 3. Check browser console for errors
# Open DevTools (F12) > Console
```

### Issue: "Tool invocation fails"

**Cause:** Invalid parameters or server error

**Solution:**
```javascript
// 1. Check tool schema
// In VibeForge, click on tool to see input schema

// 2. Test tool manually
const result = await mcpManager.invokeTool('dataforge', 'queryKB', {
  query: 'test query'
});
console.log('Result:', result);

// 3. Check server logs for errors
# In DataForge terminal
```

---

## Cortex Planning Issues

### Issue: "Cannot start planning session"

**Cause:** Missing API keys or license restriction

**Solution:**
```javascript
// 1. Check license tier
const license = JSON.parse(localStorage.getItem('vibeforge-license') || '{}');
console.log('License tier:', license.tier);
console.log('Can use orchestrator:', license.tier !== 'free');

// 2. Start trial if free tier
// Click "Begin Trial" in Planning panel

// 3. Check API keys
const apiKeys = JSON.parse(localStorage.getItem('vibeforge-api-keys') || '{}');
console.log('API keys:', Object.keys(apiKeys));
// Need: anthropic, openai
```

### Issue: "Planning session stuck in 'Running'"

**Cause:** Network timeout or API error

**Solution:**
```bash
# 1. Check browser console for errors
# F12 > Console

# 2. Abort session
# Click "Abort" button in Planning panel

# 3. Check API status
# https://status.openai.com
# https://status.anthropic.com

# 4. Retry with different workflow
# Try "Quick" instead of "Default"
```

### Issue: "Deliverable not parsing"

**Cause:** LLM didn't generate proper markers

**Solution:**
```markdown
# Expected deliverable format:
---BEGIN IMPLEMENTATION PLAN---
[plan content]
---END IMPLEMENTATION PLAN---

---BEGIN CLAUDE CODE PROMPT---
[prompt content]
---END CLAUDE CODE PROMPT---

# If missing, copy output manually
# Go to Stages tab > Final stage > Copy output
```

### Issue: "Quota exceeded"

**Cause:** Monthly limit reached

**Solution:**
```javascript
// 1. Check quota
const license = JSON.parse(localStorage.getItem('vibeforge-license') || '{}');
console.log('Usage this month:', license.usage.orchestratorRunsThisMonth);
console.log('Quota:', license.tier === 'trial' ? 20 : 'unlimited');

// 2. Wait until next month (resets on 1st)
// Or upgrade tier

// 3. Upgrade tier
// Click "Upgrade" in Planning panel
```

---

## Performance Issues

### Issue: "Slow page load"

**Cause:** Large bundle size or slow network

**Solution:**
```bash
# 1. Analyze bundle size
npx vite-bundle-visualizer

# 2. Check network in DevTools
# F12 > Network > Reload

# 3. Enable caching
# Check that Service Worker is registered

# 4. Optimize images
# Compress/resize images in static/
```

### Issue: "Laggy UI during streaming"

**Cause:** Too many DOM updates

**Solution:**
```javascript
// Already optimized in StreamingText.svelte
// Uses requestAnimationFrame for smooth updates

// If still laggy:
// 1. Close other tabs
// 2. Disable browser extensions
// 3. Check CPU usage (Activity Monitor/Task Manager)
```

### Issue: "High memory usage"

**Cause:** Large session history or memory leak

**Solution:**
```javascript
// 1. Clear old sessions
const sessions = JSON.parse(localStorage.getItem('vibeforge-planning-sessions') || '[]');
console.log('Session count:', sessions.length);

// Limit to 50 (already implemented)
// But can manually clear:
localStorage.removeItem('vibeforge-planning-sessions');

// 2. Reload page to reset memory
location.reload();
```

---

## Data & Storage Issues

### Issue: "localStorage quota exceeded"

**Cause:** Too much data stored (5-10MB limit)

**Solution:**
```javascript
// 1. Check storage usage
let total = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    total += localStorage[key].length + key.length;
  }
}
console.log('localStorage usage:', (total / 1024 / 1024).toFixed(2), 'MB');

// 2. Clear old data
localStorage.removeItem('vibeforge-planning-sessions');
localStorage.removeItem('vibeforge-runs');

// 3. Implement auto-cleanup
// Already done: MAX_STORED_SESSIONS = 50
```

### Issue: "Data lost after browser update"

**Cause:** Browser cleared storage or bug

**Solution:**
```javascript
// 1. Check if data exists
console.log('localStorage keys:', Object.keys(localStorage));

// 2. Recover from backup (if exported)
// Import sessions from downloaded files

// 3. Prevent future loss
// Regular exports:
// Planning > Output > Download Deliverables
```

### Issue: "Sync issues between tabs"

**Cause:** localStorage not syncing

**Solution:**
```javascript
// VibeForge already uses storage events
// But if issues persist:

// 1. Reload all tabs
// 2. Work in single tab
// 3. Report issue with reproduction steps
```

---

## Platform-Specific Issues

### Linux

**Issue: "libwebkit2gtk-4.1 not found"**
```bash
sudo apt-get update
sudo apt-get install libwebkit2gtk-4.1-dev
```

**Issue: "Application menu not showing (Wayland)"**
```bash
# Use X11 session instead
# Or run with:
GDK_BACKEND=x11 vibeforge
```

### macOS

**Issue: "App can't be opened because it's from unidentified developer"**
```bash
# Right-click > Open (first time)
# Or disable Gatekeeper (not recommended):
sudo spctl --master-disable
```

**Issue: "Notarization failed"**
```bash
# Check notarization status
xcrun notarytool info <submission-id> \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_PASSWORD" \
  --team-id "$APPLE_TEAM_ID"
```

### Windows

**Issue: "VCRUNTIME140.dll not found"**
```powershell
# Install Visual C++ Redistributable
winget install Microsoft.VCRedist.2015+.x64
```

**Issue: "SmartScreen warning"**
```powershell
# Click "More info" > "Run anyway"
# Or code sign with valid certificate
```

---

## Getting Help

### Before Reporting

1. **Check existing issues:** https://github.com/your-repo/issues
2. **Search documentation:**
   - [README.md](../README.md)
   - [SETUP.md](../SETUP.md)
   - [USER_GUIDE.md](./USER_GUIDE.md)
   - [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)

### Reporting Issues

Create an issue with:

**Environment:**
```
- OS: [e.g., Ubuntu 22.04, macOS 14, Windows 11]
- VibeForge Version: [e.g., 5.7.0]
- Node.js: [e.g., 20.10.0]
- pnpm: [e.g., 9.1.0]
- Browser: [e.g., Chrome 120] (if web)
```

**Steps to Reproduce:**
```
1. Go to '...'
2. Click on '...'
3. See error
```

**Expected vs Actual:**
```
Expected: Should show ...
Actual: Shows error ...
```

**Logs/Screenshots:**
```
[Paste console errors or attach screenshots]
```

### Community Support

- **GitHub Discussions:** https://github.com/your-repo/discussions
- **Discord:** [Coming Soon]
- **Email:** support@vibeforge.com (Enterprise only)

---

**Last Updated:** December 6, 2025
**Version:** 5.7.0 (Phase 2 Complete)
