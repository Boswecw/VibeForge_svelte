# VibeForge Deployment Guide

**Version:** 5.7.0 (Phase 2 Complete)
**Last Updated:** December 6, 2025
**Status:** Production Ready ✅

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Building for Production](#building-for-production)
4. [Desktop Application (Tauri)](#desktop-application-tauri)
5. [Web Application](#web-application)
6. [Testing the Build](#testing-the-build)
7. [Release Process](#release-process)
8. [CI/CD Setup](#cicd-setup)
9. [Troubleshooting](#troubleshooting)

---

## Overview

VibeForge V2 can be deployed in two modes:

### 1. Desktop Application (Tauri)
- **Platform-native** applications for Linux, macOS, Windows
- **Recommended** for most users (better performance, native integrations)
- Bundles: `.deb`, `.AppImage` (Linux), `.dmg` (macOS), `.msi` (Windows)

### 2. Web Application (SvelteKit)
- **Browser-based** SPA for web deployment
- **Optional** for cloud/hosted scenarios
- Platforms: Vercel, Netlify, Docker, self-hosted

### Deployment Matrix

| Mode | Platform | Artifact | Size | Target |
|------|----------|----------|------|--------|
| **Desktop** | Linux x64 | `.deb` | ~18MB | Ubuntu 20.04+ |
| **Desktop** | Linux x64 | `.AppImage` | ~22MB | Any distro |
| **Desktop** | macOS x64 | `.dmg` | ~12MB | macOS 10.15+ |
| **Desktop** | macOS ARM | `.dmg` | ~12MB | Apple Silicon |
| **Desktop** | Windows x64 | `.msi` | ~15MB | Windows 10+ |
| **Web** | Any | Static files | ~5MB | Modern browsers |

---

## Pre-Deployment Checklist

Before building for production, verify:

### Code Quality

- [x] **All tests passing** (986/1,029 = 95.8%)
  ```bash
  pnpm test
  ```

- [x] **Type checking passing** (0 errors)
  ```bash
  pnpm check
  ```

- [x] **Linting clean**
  ```bash
  pnpm lint
  ```

### Configuration

- [ ] **Environment variables set** (`.env.production`)
  ```bash
  # Required for backend integration
  PUBLIC_DATAFORGE_URL=https://api.dataforge.com
  PUBLIC_NEUROFORGE_URL=https://api.neuroforge.com
  PUBLIC_VIBEFORGE_API_URL=https://api.vibeforge.com

  # Optional for analytics
  PUBLIC_ANALYTICS_ID=your-analytics-id
  ```

- [ ] **Version bumped** (`package.json`, `src-tauri/Cargo.toml`)
  ```bash
  # Update version in both files
  # package.json: "version": "5.7.0"
  # Cargo.toml: version = "5.7.0"
  ```

- [ ] **Changelog updated** (`CHANGELOG.md`)
  ```markdown
  ## [5.7.0] - 2025-12-06
  ### Added
  - V2 AI Workbench with real-time streaming
  - Cortex Multi-AI Planning Orchestrator
  - MCP protocol integration
  ...
  ```

### Backend Services

- [ ] **DataForge API accessible** (if using backend)
  ```bash
  curl https://api.dataforge.com/health
  # Expected: {"status": "ok"}
  ```

- [ ] **NeuroForge API accessible** (if using backend)
  ```bash
  curl https://api.neuroforge.com/health
  # Expected: {"status": "ok"}
  ```

---

## Building for Production

### Prerequisites

**All Platforms:**
- Node.js 20.x+
- pnpm 9.x+
- Rust 1.75+ (for Tauri builds)
- Git

**Install Rust (if not installed):**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup update
```

**Install pnpm (if not installed):**
```bash
npm install -g pnpm
```

### Build Steps

**1. Clean Build Environment:**
```bash
# Remove old builds
rm -rf build/
rm -rf .svelte-kit/
rm -rf node_modules/.vite/
rm -rf src-tauri/target/release/

# Clean Rust cache (optional, if issues)
cd src-tauri && cargo clean && cd ..
```

**2. Install Dependencies:**
```bash
# Install Node dependencies
pnpm install --frozen-lockfile

# Fetch Rust dependencies (Tauri only)
cd src-tauri && cargo fetch && cd ..
```

**3. Build Frontend:**
```bash
# Build SvelteKit application
pnpm build
```

**Expected output:**
```
✔ building client
✔ building server
Run npm run preview to preview your production build locally.

> Using @sveltejs/adapter-static
  ✔ done
✓ built in 15.23s
```

**Verify build:**
```bash
ls -lh build/
# Should see: _app/, favicon.png, index.html, etc.
```

**4. Test Build Locally:**
```bash
pnpm preview
# Open http://localhost:4173
```

**5. Proceed to Platform-Specific Build:**
- For **Desktop**: See [Desktop Application (Tauri)](#desktop-application-tauri)
- For **Web**: See [Web Application](#web-application)

---

## Desktop Application (Tauri)

### Platform-Specific Prerequisites

#### Linux (Ubuntu/Debian)

```bash
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
```

#### macOS

```bash
# Install Xcode Command Line Tools
xcode-select --install

# No additional dependencies needed
```

#### Windows

```bash
# Install Visual Studio C++ Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/

# Or use winget
winget install Microsoft.VisualStudio.2022.BuildTools
```

### Build Tauri Application

**1. Build for Current Platform:**
```bash
pnpm tauri build
```

**Build output location:**
```bash
# Linux
src-tauri/target/release/bundle/deb/vibeforge_5.7.0_amd64.deb
src-tauri/target/release/bundle/appimage/vibeforge_5.7.0_amd64.AppImage

# macOS
src-tauri/target/release/bundle/dmg/VibeForge_5.7.0_x64.dmg
src-tauri/target/release/bundle/macos/VibeForge.app

# Windows
src-tauri/target/release/bundle/msi/VibeForge_5.7.0_x64_en-US.msi
```

**2. Verify Build:**
```bash
# Check bundle size
ls -lh src-tauri/target/release/bundle/

# Test installer (Linux example)
sudo dpkg -i src-tauri/target/release/bundle/deb/vibeforge_5.7.0_amd64.deb

# Run application
vibeforge
```

### Code Signing (Optional but Recommended)

#### macOS Code Signing

**Prerequisites:**
- Apple Developer account
- Developer ID Application certificate
- App-specific password for notarization

**Setup:**
```bash
# Set environment variables
export APPLE_CERTIFICATE="Developer ID Application: Your Name (TEAM_ID)"
export APPLE_ID="your-apple-id@example.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="TEAM_ID"

# Build with signing
pnpm tauri build
```

**Notarization:**
```bash
# After build, notarize the .dmg
xcrun notarytool submit \
  src-tauri/target/release/bundle/dmg/VibeForge_5.7.0_x64.dmg \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_PASSWORD" \
  --team-id "$APPLE_TEAM_ID" \
  --wait

# Staple the notarization
xcrun stapler staple \
  src-tauri/target/release/bundle/dmg/VibeForge_5.7.0_x64.dmg
```

#### Windows Code Signing

**Prerequisites:**
- Code signing certificate (.pfx file)
- SignTool (part of Windows SDK)

**Setup:**
```powershell
# Set environment variables
$env:WINDOWS_CERTIFICATE = "path/to/certificate.pfx"
$env:WINDOWS_CERTIFICATE_PASSWORD = "certificate-password"

# Build with signing
pnpm tauri build
```

### Cross-Platform Builds (Advanced)

**Use GitHub Actions for multi-platform builds:**

See [CI/CD Setup](#cicd-setup) for automated builds.

---

## Web Application

### Adapter: Static (Default)

VibeForge uses `@sveltejs/adapter-static` for static site generation.

**Build command:**
```bash
pnpm build
```

**Output:** `build/` directory with static files

### Deployment Platforms

#### Vercel (Recommended for Web)

**1. Install Vercel CLI:**
```bash
pnpm add -g vercel
```

**2. Deploy:**
```bash
# Development preview
vercel

# Production deployment
vercel --prod
```

**Configuration:** `vercel.json`
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "build",
  "framework": "sveltekit",
  "env": {
    "PUBLIC_DATAFORGE_URL": "@dataforge-url",
    "PUBLIC_NEUROFORGE_URL": "@neuroforge-url"
  }
}
```

#### Netlify

**1. Install Netlify CLI:**
```bash
pnpm add -g netlify-cli
```

**2. Deploy:**
```bash
# Link to Netlify site
netlify link

# Deploy
netlify deploy --prod
```

**Configuration:** `netlify.toml`
```toml
[build]
  command = "pnpm build"
  publish = "build"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Docker

**Dockerfile:**
```dockerfile
FROM node:20-slim as builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build application
RUN pnpm build

# Production image
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location /_app/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

**Build and run:**
```bash
# Build image
docker build -t vibeforge:5.7.0 .

# Run container
docker run -d -p 80:80 vibeforge:5.7.0

# Test
curl http://localhost
```

#### Self-Hosted (Node.js)

**Using SvelteKit preview server (not recommended for production):**
```bash
pnpm preview --host 0.0.0.0 --port 3000
```

**Using a process manager (PM2):**
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'vibeforge',
    script: 'build/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

---

## Testing the Build

### Desktop Application Tests

**1. Installation Test:**
```bash
# Linux (.deb)
sudo dpkg -i vibeforge_5.7.0_amd64.deb
vibeforge --version
# Expected: VibeForge 5.7.0

# macOS (.dmg)
open VibeForge_5.7.0_x64.dmg
# Drag to Applications, then run

# Windows (.msi)
# Double-click installer, follow wizard
```

**2. Functionality Test:**
```bash
# Launch application
vibeforge

# Manual tests:
# 1. Create new workspace
# 2. Add context block
# 3. Execute prompt with Claude/GPT-4
# 4. Verify streaming works
# 5. Test MCP connection (if backends available)
# 6. Create Cortex planning session
# 7. Verify deliverable download
```

**3. Smoke Test Script:**
```bash
#!/bin/bash
# smoke-test.sh

echo "Running VibeForge smoke tests..."

# Check if application is installed
if ! command -v vibeforge &> /dev/null; then
    echo "❌ VibeForge not installed"
    exit 1
fi

# Check version
VERSION=$(vibeforge --version | grep -oP '\d+\.\d+\.\d+')
if [[ "$VERSION" != "5.7.0" ]]; then
    echo "❌ Wrong version: $VERSION"
    exit 1
fi

# Launch application (background)
vibeforge &
VIBEFORGE_PID=$!

# Wait for startup
sleep 5

# Check if process is running
if ! ps -p $VIBEFORGE_PID > /dev/null; then
    echo "❌ Application crashed on startup"
    exit 1
fi

# Cleanup
kill $VIBEFORGE_PID

echo "✅ All smoke tests passed"
```

### Web Application Tests

**1. Preview Locally:**
```bash
pnpm preview
# Open http://localhost:4173
```

**2. Lighthouse Audit:**
```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse http://localhost:4173 --output html --output-path ./lighthouse-report.html

# Expected scores (targets):
# - Performance: >90
# - Accessibility: >95
# - Best Practices: >95
# - SEO: >90
```

**3. Browser Compatibility:**

Test in:
- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

**4. Responsive Design:**

Test viewports:
- Desktop: 1920x1080
- Laptop: 1366x768
- Tablet: 768x1024
- Mobile: 375x667

---

## Release Process

### Semantic Versioning

VibeForge follows [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH

5.7.0
│ │ │
│ │ └─ Patch: Bug fixes, no new features
│ └─── Minor: New features, backward compatible
└───── Major: Breaking changes
```

### Release Workflow

**1. Prepare Release:**
```bash
# Create release branch
git checkout -b release/5.7.0

# Update version
# - package.json: "version": "5.7.0"
# - src-tauri/Cargo.toml: version = "5.7.0"
# - src-tauri/tauri.conf.json: "version": "5.7.0"

# Update CHANGELOG.md
cat >> CHANGELOG.md <<EOF
## [5.7.0] - 2025-12-06

### Added
- V2 AI Workbench with real-time streaming
- Cortex Multi-AI Planning Orchestrator (4-stage workflow)
- MCP protocol integration (DataForge, NeuroForge)
- Freemium licensing with 14-day trial

### Changed
- Migrated to Svelte 5 runes
- Improved test coverage to 95.8%

### Fixed
- [List any bug fixes]

### Security
- [List any security fixes]
EOF

# Commit changes
git add -A
git commit -m "chore: Bump version to 5.7.0"
```

**2. Build Release Artifacts:**
```bash
# Clean environment
pnpm clean

# Install dependencies
pnpm install --frozen-lockfile

# Run tests
pnpm test

# Build for all platforms (via CI/CD or locally)
pnpm tauri build
```

**3. Create GitHub Release:**
```bash
# Tag release
git tag -a v5.7.0 -m "VibeForge V2 - Phase 2 Complete"

# Push tag
git push origin v5.7.0

# Create release on GitHub
gh release create v5.7.0 \
  --title "VibeForge V2 - Phase 2 Complete" \
  --notes-file CHANGELOG.md \
  src-tauri/target/release/bundle/deb/*.deb \
  src-tauri/target/release/bundle/appimage/*.AppImage \
  src-tauri/target/release/bundle/dmg/*.dmg \
  src-tauri/target/release/bundle/msi/*.msi
```

**4. Update Documentation:**
```bash
# Update README.md with latest version
# Update SETUP.md with installation instructions
# Update docs/CHANGELOG.md

git commit -m "docs: Update for v5.7.0 release"
git push origin release/5.7.0
```

**5. Merge to Main:**
```bash
# Create pull request
gh pr create --base main --head release/5.7.0 \
  --title "Release v5.7.0" \
  --body "Phase 2 Complete - V2 Workbench + Cortex"

# After approval, merge
gh pr merge --squash
```

---

## CI/CD Setup

### GitHub Actions (Recommended)

**Create `.github/workflows/release.yml`:**

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        platform: [ubuntu-20.04, macos-latest, windows-latest]

    runs-on: ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install dependencies (Linux)
        if: matrix.platform == 'ubuntu-20.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev \
            build-essential curl wget file libssl-dev \
            libayatana-appindicator3-dev librsvg2-dev

      - name: Install frontend dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

      - name: Build application
        run: pnpm tauri build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.platform }}-build
          path: src-tauri/target/release/bundle/

  release:
    needs: build
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Download artifacts
        uses: actions/download-artifact@v4

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            ubuntu-20.04-build/**/*.deb
            ubuntu-20.04-build/**/*.AppImage
            macos-latest-build/**/*.dmg
            windows-latest-build/**/*.msi
          body_path: CHANGELOG.md
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Trigger release:**
```bash
git tag v5.7.0
git push origin v5.7.0
```

### Automated Testing

**Create `.github/workflows/test.yml`:**

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run type checking
        run: pnpm check

      - name: Run tests
        run: pnpm test

      - name: Run linter
        run: pnpm lint

      - name: Build
        run: pnpm build
```

---

## Troubleshooting

### Build Failures

**Issue: "Cannot find module '@sveltejs/kit'"**
```bash
# Solution: Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Issue: "Rust compilation failed"**
```bash
# Solution: Update Rust
rustup update stable

# Clean Cargo cache
cd src-tauri && cargo clean && cd ..

# Rebuild
pnpm tauri build
```

**Issue: "WebKit2GTK not found (Linux)"**
```bash
# Solution: Install missing dependencies
sudo apt-get install libwebkit2gtk-4.1-dev
```

### Runtime Issues

**Issue: "Application won't start"**
```bash
# Check logs (Linux)
journalctl -xe | grep vibeforge

# Check logs (macOS)
~/Library/Logs/VibeForge/

# Check logs (Windows)
%APPDATA%\VibeForge\logs\
```

**Issue: "Blank screen on launch"**
```bash
# Solution: Clear application cache
# Linux: rm -rf ~/.config/vibeforge/
# macOS: rm -rf ~/Library/Application Support/vibeforge/
# Windows: del /F /S /Q %APPDATA%\vibeforge\
```

### Performance Issues

**Issue: "Slow build times"**
```bash
# Solution: Enable caching
export CARGO_INCREMENTAL=1
export RUSTC_WRAPPER=sccache

# Install sccache
cargo install sccache
```

**Issue: "Large bundle size"**
```bash
# Check bundle size
du -sh src-tauri/target/release/bundle/

# Optimize build
# 1. Enable LTO in Cargo.toml
# 2. Strip symbols
# 3. Use production mode
```

### Deployment Issues

**Issue: "404 on routes (Vercel/Netlify)"**
```bash
# Solution: Add fallback redirects
# vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}

# netlify.toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Issue: "Environment variables not working"**
```bash
# Ensure PUBLIC_ prefix for client-side vars
PUBLIC_API_URL=https://api.example.com

# Rebuild after changing environment
pnpm build
```

---

## Support

**Need help with deployment?**

1. Check [README.md](../README.md) for basic setup
2. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
3. Search [GitHub Issues](https://github.com/your-repo/issues)
4. Create a new issue with:
   - Platform (Linux/macOS/Windows)
   - Version (5.7.0)
   - Build logs
   - Steps to reproduce

---

**Last Updated:** December 6, 2025
**Version:** 5.7.0 (Phase 2 Complete)
**Status:** ✅ Production Ready
