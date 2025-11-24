<div align="center">
  <img src="static/VibeForge_icon.svg" alt="VibeForge" width="200" />
  
  # VibeForge
  
  **AI-Powered Project Automation Platform**
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Beta-blue" alt="Beta">
  <img src="https://img.shields.io/badge/License-Freeware-purple" alt="Freeware">
  <img src="https://img.shields.io/badge/Backend-Commercial-red" alt="Commercial Backend">
  <img src="https://img.shields.io/badge/SvelteKit-5-orange" alt="SvelteKit 5">
</p>

---

> **📄 License (Freeware With Restrictions)**  
> VibeForge is released as **freeware** by Boswell Digital Solutions LLC.  
> Free to download and use, but with modification and redistribution restrictions.  
> Backend services (NeuroForge + DataForge) remain commercial.  
> See [License section](#-license-freeware-with-restrictions) for full terms.

---

VibeForge is an intelligent project creation platform with AI-powered recommendations, adaptive learning, and success prediction. It guides developers through multi-step project setup with 15 programming languages, 10 production-ready stack profiles, and learning-based insights. Built with SvelteKit 5, TypeScript, and Tailwind CSS, it provides a professional wizard interface optimized for efficiency and low cognitive load.

---

## 📚 Table of Contents

1. [Quick Start](#-quick-start)
2. [What is VibeForge?](#-what-is-vibeforge)
3. [Key Features](#-key-features)
4. [Tech Stack](#-tech-stack)
5. [Project Status](#-project-status)
6. [Documentation](#-documentation)
7. [Architecture](#-architecture)
8. [Wizard Flow](#-wizard-flow)
9. [API Integration](#-api-integration)
10. [Development](#-development)
11. [Project Structure](#-project-structure)
12. [Troubleshooting](#-troubleshooting)
13. [Deployment](#-deployment)
14. [Testing](#-testing)
15. [Contributing](#-contributing)
16. [Quick Links](#-quick-links)
17. [License](#-license-freeware-with-restrictions)

---

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open browser to http://localhost:5173
```

**First-time setup?** See [SETUP.md](./SETUP.md) for detailed installation instructions.

---

## 📋 What is VibeForge?

VibeForge is a **freeware entry product** to the Forge Ecosystem—an intelligent project creation wizard that helps developers:

- **Create AI-optimized projects** with adaptive stack recommendations
- **Select from 15 languages** across 4 categories (Frontend, Backend, Mobile, Systems)
- **Choose production-ready stacks** from 10 professionally configured profiles
- **Learn from experience** with historical insights and success prediction
- **Get personalized recommendations** based on your project history
- **Predict project success** with ML-powered forecasting

### 🌟 Key Features

#### 🧙 Intelligent Wizard System

- **5-Step Project Creation** - Intent → Languages → Stack → Configuration → Review & Generate
- **Template Library** - 10 professional project templates with auto-fill
- **Smart Validation** - Real-time name checking, description quality analysis
- **Progress Tracking** - Visual step indicators and completion status
- **Draft Saving** - Resume wizard sessions across browser restarts

#### 🔤 Language Support (15 Languages)

- **Frontend** (3): JavaScript/TypeScript 📘, Svelte 🔥, Solid.js ⚛️
- **Backend** (5): Python 🐍, Node.js 🟢, Go 🐹, Rust 🦀, Java ☕
- **Mobile** (3): Dart (Flutter) 🎯, Kotlin 🤖, Swift 💨
- **Systems** (4): C, C++, Bash 💻, SQL 📈
- **Compatibility Validation** - Real-time checks for language pairing conflicts
- **Project-Type Recommendations** - AI-suggested languages based on intent

#### 📦 Stack Profiles (10 Production-Ready Stacks)

- **T3 Stack** - Next.js + tRPC + Prisma + TypeScript
- **MERN** - MongoDB + Express + React + Node.js
- **Next.js Enterprise** - React + TypeScript + Tailwind
- **Django Full-Stack** - Python + Django + PostgreSQL
- **FastAPI AI** - Python + FastAPI + AI/ML libraries
- **Laravel MVC** - PHP + Laravel + MySQL
- **React Native Expo** - Mobile + TypeScript + Expo
- **Go Cloud-Native** - Go + Microservices + Docker
- **SvelteKit** - Svelte 5 + TypeScript + Vite
- **SolidStart** - Solid.js + TypeScript + Vinxi

#### 🧠 Adaptive Learning Layer

- **Historical Insights** - Track project creation patterns and outcomes
- **Success Prediction** - ML-powered forecasting with confidence scores
- **User Preferences** - Learn language/stack favorites automatically
- **Pattern Detection** - Identify successful project configurations
- **Personalized Recommendations** - Tailored suggestions based on history
- **DataForge Integration** - Persistent learning data storage

#### ⚙️ Configuration Management

- **Database Selection** - PostgreSQL, MySQL, MongoDB, SQLite, Redis
- **Authentication** - JWT, OAuth 2.0, Session, Firebase Auth
- **Deployment Platforms** - Vercel, Netlify, Docker, AWS, Heroku
- **Environment Variables** - Auto-generated `.env.example` templates
- **Docker Support** - Automatic `Dockerfile` and `docker-compose.yml` generation

#### 🚀 Project Generation

- **Complete Directory Structure** - Professional project scaffolding
- **README Generation** - Stack-specific documentation with setup instructions
- **Configuration Files** - `package.json`, `tsconfig.json`, `.gitignore`
- **Docker Templates** - Multi-service setups with database integration
- **Best Practices** - Industry-standard project organization

#### 🎨 Professional Design

- **Dark/Light Theme** - "Forge" design system with steel-inspired colors
- **Low Cognitive Load** - Clean, focused interface
- **Responsive Layout** - Optimized for desktop development workflows
- **Accessibility** - ARIA labels, keyboard navigation support

### Backend Integration (Commercial)

VibeForge connects to commercial Forge backend services:

- **NeuroForge** - AI orchestration and model routing
- **DataForge** - Learning data persistence and analytics
- **Note:** Backend services are proprietary and not included in freeware distribution

---

## 📚 Documentation

| Document                                 | Purpose                                     |
| ---------------------------------------- | ------------------------------------------- |
| **[SETUP.md](./SETUP.md)**               | Installation and configuration guide        |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Technical architecture and design patterns  |
| **[FEATURES.md](./FEATURES.md)**         | Feature documentation and user guides       |
| **[DEVELOPMENT.md](./DEVELOPMENT.md)**   | Development workflow and contribution guide |
| **[TESTING.md](./TESTING.md)**           | Testing procedures and checklists           |

---

## 🏗️ Tech Stack

- **SvelteKit 2.x** - Full-stack metaframework
- **Svelte 5** - Latest with runes (`$state`, `$derived`, `$props`)
- **TypeScript 5.9** - Full type safety
- **Tailwind CSS v4** - Utility-first styling
- **Vite 7.x** - Lightning-fast build tool
- **pnpm** - Fast package manager

---

## 🎯 Project Status

**Version:** 0.1.0 (Beta)  
**Status:** 🔵 Beta - Feature Complete, Active Testing  
**License:** Freeware with Restrictions

### Completed Features (Phase 3.2 & 3.3)

- [x] Multi-step project creation wizard
- [x] 15 programming languages with metadata
- [x] 10 production-ready stack profiles
- [x] Adaptive learning layer (backend + frontend)
- [x] Historical insights dashboard
- [x] Success prediction with ML
- [x] Language compatibility validation
- [x] Stack recommendations engine
- [x] Timeline estimation system
- [x] Template library (10 templates)
- [x] Dark/Light theme system
- [x] Full backend API integration ✅

### In Progress

- [ ] Runtime environment detection (Phase 2.7)
- [ ] Dev-Container auto-generation
- [ ] User authentication
- [ ] Project outcome tracking (Phase 3.4)
- [ ] Feedback collection system
- [ ] Cloud deployment

---

## 🏛️ Architecture

### Frontend Stack

**Core Framework:**

- **SvelteKit 2.x** - Full-stack metaframework with file-based routing
- **Svelte 5** - Runes mode (`$state`, `$derived`, `$props`, `$effect`)
- **TypeScript 5.9** - Full type safety across components and stores
- **Vite 7.x** - Lightning-fast HMR and optimized builds

**Styling & Design:**

- **Tailwind CSS v4** - Utility-first with custom "Forge" theme
- **PostCSS** - CSS processing and optimization
- **Custom Design System** - Steel-inspired color palette (blacksteel, gunmetal, ember)

**State Management:**

- **Svelte Stores** - Reactive state management
  - `wizardStore.ts` - Multi-step wizard state
  - `languagesStore.ts` - Language selection state
  - `stacksStore.ts` - Stack profile state
  - `insightsStore.ts` - Learning layer state
  - `themeStore.ts` - Theme persistence

### Backend Integration

VibeForge connects to commercial backend services:

```
┌──────────────────────┐
│   VibeForge Frontend   │ (Freeware)
│   SvelteKit 5 + Tauri  │
└─────────┬────────────┘
          │
          ├─────> DataForge API (Commercial)
          │         • Project persistence
          │         • Learning data storage
          │         • Analytics aggregation
          │
          └─────> NeuroForge API (Commercial)
                    • AI recommendations
                    • Success prediction
                    • Pattern analysis
```

**API Client Layer:**

- `src/lib/api/languagesClient.ts` - Language data fetching
- `src/lib/api/stackProfilesClient.ts` - Stack profile queries
- `src/lib/api/insightsClient.ts` - Learning layer integration
- Offline-first with local fallback data
- Graceful degradation when backends unavailable

### Tauri Backend (Rust)

**Project Generator:**

- `src-tauri/src/project_generator.rs` - File system operations
- Generates complete project structures
- Creates stack-specific configuration files
- Handles Docker, database, and auth templates

**Future: Runtime Detection:**

- `src-tauri/src/runtime_checker.rs` - Detect installed languages/tools
- Version parsing and validation
- PATH detection with user overrides
- Result caching (5-minute TTL)

### Data Flow

```
1. User Input (Wizard Steps)
   ↓
2. Svelte Stores (State Management)
   ↓
3. Validation & Compatibility Checks
   ↓
4. API Integration (DataForge/NeuroForge)
   ↓
5. Learning Layer Analysis
   ↓
6. Tauri Backend (Project Generation)
   ↓
7. File System Output
```

---

## 🧭 Wizard Flow

### Step 1: Project Intent 🎯

**Objective:** Capture project vision and requirements

**Inputs:**

- Project name (validated for uniqueness)
- Description (quality analysis with hints)
- Project type (Web, Mobile, Desktop, API, AI/ML, CLI)
- Team size (Solo, Small 2-5, Medium 6-15, Large 16+)
- Timeline (Quick prototype, MVP 1-3 months, Full project 3-6 months, Enterprise 6+ months)

**Features:**

- Template selector with 10 professional templates
- Auto-fill from templates
- Description quality scoring
- Complexity estimation
- Milestone suggestions

### Step 2: Language Selection 🔤

**Objective:** Choose programming languages with compatibility validation

**Inputs:**

- Primary languages (1-3 selections)
- Category filtering (Frontend, Backend, Mobile, Systems)
- Search functionality

**Features:**

- Project-type based recommendations
- Compatibility warnings (e.g., "Python + Dart rarely used together")
- Layer validation (frontend + backend pairing)
- Language details modal with full metadata
- Real-time API integration with offline fallback

### Step 3: Stack Selection 📦

**Objective:** Select production-ready stack profile

**Inputs:**

- Stack profile (filtered by compatible languages)
- Complexity preference (Beginner, Intermediate, Advanced)

**Features:**

- Language-based filtering
- Smart recommendations based on intent + languages
- Stack comparison modal
- Popularity indicators
- Technology preview with icons

### Step 4: Configuration ⚙️

**Objective:** Configure project specifics

**Inputs:**

- Database (PostgreSQL, MySQL, MongoDB, SQLite, Redis, None)
- Authentication (JWT, OAuth 2.0, Session, Firebase, None)
- Deployment platform (Vercel, Netlify, Docker, AWS, Heroku, Self-hosted)
- Additional features (Docker support, Testing setup, CI/CD)

**Features:**

- Stack-specific options
- Runtime status display
- Environment variable preview
- Configuration validation

### Step 5: Review & Generate 🚀

**Objective:** Review selections and generate project

**Displays:**

- Complete project summary
- Selected languages and stack
- Configuration details
- Runtime checklist
- Estimated setup time

**Actions:**

- Edit any previous step
- Select output directory (default: `~/Projects`)
- Generate project structure
- Open in file manager
- Copy path to clipboard

**Generated Files:**

- Complete directory structure
- `README.md` with setup instructions
- `package.json` / `requirements.txt` / `Cargo.toml`
- `.gitignore` (language-aware)
- `.env.example`
- `Dockerfile` and `docker-compose.yml` (if selected)
- Stack-specific configs (`tsconfig.json`, etc.)

---

## 🔌 API Integration

### DataForge Learning Layer

VibeForge persists learning data to DataForge for analytics and insights.

**Endpoints Used:**

```typescript
// Save project creation
POST /api/vibeforge/projects
{
  project_name: string,
  project_type: string,
  selected_languages: string[],
  selected_stack: string,
  team_size: string,
  timeline: string,
  complexity: number
}

// Track wizard session
POST /api/vibeforge/sessions
{
  project_id: string,
  steps_completed: number,
  abandoned: boolean,
  completion_time_seconds: number,
  llm_queries_count: number
}

// Record project outcome
POST /api/vibeforge/outcomes
{
  project_id: string,
  build_success: boolean,
  test_pass_rate: number,
  deploy_success: boolean,
  user_satisfaction: number
}

// Get historical insights
GET /api/vibeforge/analytics/stack-success
GET /api/vibeforge/analytics/language-trends
GET /api/vibeforge/preferences/{user_id}
```

**Offline Behavior:**

- All API calls gracefully fail to local data
- Wizard continues without backend
- Data synced when connection restored

### NeuroForge AI Recommendations

Optional AI-powered suggestions using NeuroForge orchestration.

**Endpoints Used:**

```typescript
// Get language recommendations
POST /api/neuroforge/recommend/languages
{
  project_type: string,
  team_size: string,
  timeline: string
}

// Get stack recommendations
POST /api/neuroforge/recommend/stacks
{
  project_type: string,
  selected_languages: string[],
  complexity: string
}

// Predict success probability
POST /api/neuroforge/predict/success
{
  project_config: ProjectConfig,
  user_history: UserHistory
}
```

---

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Start dev server (with hot reload)
pnpm dev

# Type checking
pnpm check
pnpm check:watch

# Build for production
pnpm build

# Preview production build
pnpm preview
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development workflows.

---

## 📖 Key Concepts

### 3-Column Layout Philosophy

- **Left Column (Context):** Browse and select reusable context blocks
- **Center Column (Prompt):** Compose prompts with active context visualization
- **Right Column (Output):** View model responses and execution metrics

### Context Blocks

Reusable prompt components that can be:

- System prompts
- Design specifications
- Project context
- Code snippets
- Workflow instructions

### Workspaces

Isolated environments for different projects or teams, each with:

- Separate contexts
- Independent presets
- Isolated run history
- Workspace-specific settings

---

## 🎨 Design System

VibeForge uses a custom "Forge" design system inspired by forged steel:

**Dark Mode (Default):**

- `forge-blacksteel` - Primary backgrounds
- `forge-gunmetal` - Secondary backgrounds
- `forge-steel` - Interactive states
- `forge-ember` - Primary accent (amber)

**Light Mode:**

- `forge-quench` - Light backgrounds
- `forge-quenchLift` - Elevated surfaces

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete design system documentation.

---

## 🔧 Troubleshooting

### 1. "Cannot find module" errors

**Cause:** Missing dependencies or incorrect installation.

**Solution:**

```bash
# Remove node_modules and lockfile
rm -rf node_modules pnpm-lock.yaml

# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
pnpm install

# Verify installation
pnpm list
```

### 2. Development server won't start

**Cause:** Port 5173 already in use or Vite configuration issue.

**Solution:**

```bash
# Check what's using port 5173
lsof -i :5173
# or
netstat -tuln | grep 5173

# Kill the process
kill -9 <PID>

# Or use different port
pnpm dev --port 5174

# Check Vite config
cat vite.config.ts
```

### 3. TypeScript errors in IDE

**Cause:** Type checking not running or stale types.

**Solution:**

```bash
# Run type checking
pnpm check

# Watch mode for continuous checking
pnpm check:watch

# Restart TypeScript server in VS Code
# Command Palette (Ctrl+Shift+P) -> "TypeScript: Restart TS Server"

# Regenerate Svelte types
npx svelte-kit sync
```

### 4. Tauri build fails

**Cause:** Missing Rust toolchain or system dependencies.

**Solution:**

```bash
# Check Rust installation
rustc --version
cargo --version

# Update Rust
rustup update

# Install Tauri system dependencies (Linux)
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev

# Clean and rebuild
cd src-tauri
cargo clean
cd ..
pnpm tauri build
```

### 5. "API endpoint not found" errors

**Cause:** DataForge or NeuroForge backend not running.

**Solution:**

```bash
# Check if DataForge is running
curl http://localhost:8001/health

# Start DataForge
cd ../DataForge
source venv/bin/activate
uvicorn app.main:app --port 8001

# Verify VibeForge API client config
cat src/lib/api/config.ts

# VibeForge works offline - backends are optional
# Check browser console for fallback messages
```

### 6. Wizard state lost on refresh

**Cause:** LocalStorage not persisting or disabled.

**Solution:**

```bash
# Check browser console for localStorage errors
# Enable localStorage in browser settings

# Check wizard store persistence
cat src/lib/stores/wizardStore.ts | grep localStorage

# Test localStorage manually in browser console:
# localStorage.setItem('test', 'value')
# localStorage.getItem('test')
```

### 7. Project generation creates empty directory

**Cause:** Tauri backend error or file permission issue.

**Solution:**

```bash
# Check Tauri logs
pnpm tauri dev
# Look for errors in terminal output

# Verify write permissions
ls -la ~/Projects
mkdir -p ~/Projects/test-project
touch ~/Projects/test-project/test.txt

# Check Rust backend logs
cat src-tauri/src/project_generator.rs

# Try different output directory
# Use wizard to select /tmp or another writable location
```

### 8. Theme not persisting across sessions

**Cause:** LocalStorage issue or theme store not initialized.

**Solution:**

```bash
# Check theme store
cat src/lib/stores/themeStore.ts

# Manually test in browser console:
# localStorage.setItem('vibeforge-theme', 'dark')
# location.reload()

# Clear localStorage and reset
# localStorage.clear()
```

### 9. Build succeeds but app won't run

**Cause:** Missing runtime dependencies or configuration errors.

**Solution:**

```bash
# Check build output
pnpm build
ls -la build/

# Preview build locally
pnpm preview

# Check for errors in browser console
# Inspect Network tab for failed requests

# Verify adapter config
cat svelte.config.js | grep adapter
```

### 10. Language/stack recommendations not working

**Cause:** API client not fetching data or backend unavailable.

**Solution:**

```bash
# VibeForge includes local fallback data
# Check local data files
cat src/lib/data/languages.ts
cat src/lib/data/stackProfiles.ts

# Verify API client
cat src/lib/api/languagesClient.ts

# Check browser console for:
# "Using local language data" (offline mode)
# "Fetched languages from API" (online mode)

# Test API directly
curl http://localhost:8000/api/v1/languages
```

### 11. Hot module reload (HMR) not working

**Cause:** Vite configuration or file watcher issue.

**Solution:**

```bash
# Increase file watcher limits (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Restart dev server
pnpm dev

# Check Vite config
cat vite.config.ts | grep hmr

# Try with polling
pnpm dev --force
```

### 12. CSS not applying or Tailwind classes missing

**Cause:** Tailwind not properly configured or CSS not compiled.

**Solution:**

```bash
# Check Tailwind config
cat tailwind.config.cjs

# Verify PostCSS config
cat postcss.config.cjs

# Rebuild with clean cache
pnpm build --no-cache

# Check that app.css is imported
grep "import.*app.css" src/routes/+layout.svelte

# Verify Tailwind is processing
pnpm dev
# Check browser Network tab for app.css
```

---

## 🚀 Deployment

### Static Site Deployment

**Vercel:**

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

**Netlify:**

```bash
# Install Netlify CLI
pnpm add -g netlify-cli

# Deploy
netlify deploy

# Production deployment
netlify deploy --prod
```

**Build settings:**

- Build command: `pnpm build`
- Publish directory: `build`
- Node version: `20.x`

### Tauri Desktop App

**Build for production:**

```bash
# Build release version
pnpm tauri build

# Output locations:
# Linux: src-tauri/target/release/bundle/
# Windows: src-tauri/target/release/bundle/msi/
# macOS: src-tauri/target/release/bundle/dmg/
```

**Code signing (macOS):**

```bash
# Set environment variables
export APPLE_CERTIFICATE="Developer ID Application: Your Name (TEAM_ID)"
export APPLE_ID="your-apple-id@example.com"
export APPLE_PASSWORD="app-specific-password"

# Build with signing
pnpm tauri build
```

**Windows installer:**

```powershell
# Requires WiX Toolset
# Download from: https://wixtoolset.org/

pnpm tauri build
# Creates .msi installer in src-tauri/target/release/bundle/msi/
```

### Docker Deployment (Web Version)

**Dockerfile:**

```dockerfile
FROM node:20-slim as builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Build and run:**

```bash
# Build image
docker build -t vibeforge:latest .

# Run container
docker run -d -p 80:80 vibeforge:latest

# Open browser
open http://localhost
```

---

## 🪧 Testing

```bash
# Type checking
pnpm check

# Manual testing
pnpm dev
# Navigate to http://localhost:5173
# Test features in browser
```

See [TESTING.md](./TESTING.md) for comprehensive testing procedures.

---

## 📦 Project Structure

```
vibeforge/
├── src/
│   ├── routes/              # SvelteKit pages (file-based routing)
│   │   ├── +page.svelte     # Main workbench
│   │   ├── contexts/        # Context library
│   │   ├── quick-run/       # Quick experiment mode
│   │   ├── history/         # Run history
│   │   ├── patterns/        # Prompt patterns
│   │   ├── presets/         # Saved configurations
│   │   ├── evals/           # Evaluations
│   │   ├── workspaces/      # Workspace management
│   │   └── settings/        # User preferences
│   │
│   └── lib/
│       ├── components/      # Reusable UI components
│       ├── stores/          # Svelte state management
│       └── types/           # TypeScript interfaces
│
├── static/                  # Static assets
├── docs/                    # Archived documentation
└── [config files]
```

---

## 🤝 Contributing

We welcome contributions! Please see [DEVELOPMENT.md](./DEVELOPMENT.md) for:

- Code style guidelines
- Component patterns
- Store architecture
- Testing requirements
- Pull request process

---

## 📄 License (Freeware With Restrictions)

VibeForge is released as **freeware** by Boswell Digital Solutions LLC.

### You May:

- ✅ Download and use the official unmodified binaries for free
- ✅ Redistribute the exact binaries
- ✅ Use the software for personal, academic, or commercial development

### You May Not:

- ❌ Modify, decompile, reverse engineer, or extract code
- ❌ Redistribute modified versions
- ❌ Bundle VibeForge into SaaS or commercial tools
- ❌ Use its design or workflow to create competing products
- ❌ Train AI models on VibeForge's UI, workflows, or logic

### Backend Services (Commercial)

All backend orchestration (NeuroForge) and data engines (DataForge) remain **commercial property** of Boswell Digital Solutions LLC. VibeForge connects to these commercial services for:

- AI-powered recommendations
- Learning data persistence
- Success prediction analytics
- Historical insights aggregation

**© 2025 Boswell Digital Solutions LLC — All Rights Reserved.**

### Why Freeware?

VibeForge serves as the **entry product** to the Forge Ecosystem. It's free to use and introduces developers to:

- Professional project automation
- AI-powered development workflows
- The power of adaptive learning systems
- Integration with commercial Forge products (AuthorForge, TradeForge, etc.)

### Commercial Products

For advanced features, consider:

- **AuthorForge** (Commercial) - Genre-aware creative writing platform
- **TradeForge** (Commercial) - Market intelligence and financial analysis
- **DataForge** (Commercial) - Enterprise data engine with compliance automation
- **NeuroForge** (Commercial) - Advanced LLM orchestration with champion selection

**Contact:** charlesboswell@boswelldigitalsolutions.com

---

## 🔗 Related Projects

- **DataForge** - Knowledge base management with semantic search
- **AuthorForge** - AI writing assistant
- **NeuroForge** - Multi-model AI orchestration backend

---

## 🔗 Quick Links

### Application URLs

- **🏠 Main Workbench**: http://localhost:5173/
- **🧙 Project Wizard**: http://localhost:5173/wizard
- **📊 Analytics Dashboard**: http://localhost:5173/analytics
- **🛠️ Dev Environment**: http://localhost:5173/dev-environment (coming soon)
- **📋 Demo Page**: http://localhost:5173/demo

### API Endpoints

- **Languages API**: http://localhost:8000/api/v1/languages
- **Stack Profiles API**: http://localhost:8000/api/v1/stacks
- **Learning Layer API**: http://localhost:8001/api/vibeforge/
- **DataForge Health**: http://localhost:8001/health
- **NeuroForge Health**: http://localhost:8002/health

### Documentation

- **📚 Setup Guide**: [SETUP.md](./SETUP.md)
- **🏛️ Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **✨ Features**: [FEATURES.md](./FEATURES.md)
- **🛠️ Development**: [DEVELOPMENT.md](./DEVELOPMENT.md)
- **🪧 Testing**: [TESTING.md](./TESTING.md)
- **🗺️ Roadmap**: [VIBEFORGE_ROADMAP.md](./VIBEFORGE_ROADMAP.md)
- **📚 INDEX**: [INDEX.md](./INDEX.md)

### Related Projects

- **DataForge**: [../DataForge/README.md](../DataForge/README.md) - Enterprise data engine
- **NeuroForge**: [../NeuroForge/README.md](../NeuroForge/README.md) - LLM orchestration
- **AuthorForge**: [../AuthorForge/README.md](../AuthorForge/README.md) - Creative writing platform

### Example Commands

**Start Development:**

```bash
cd /home/charles/projects/Coding2025/Forge/vibeforge
pnpm dev
```

**Build Desktop App:**

```bash
pnpm tauri build
```

**Type Check:**

```bash
pnpm check:watch
```

**Test API:**

```bash
curl http://localhost:8000/api/v1/languages | jq .
```

---

## 👤 Support

For questions or issues:

1. Check the [documentation](./ARCHITECTURE.md)
2. Review [existing issues](https://github.com/your-repo/issues)
3. Open a new issue with details

---

**Built with ❤️ for AI Engineers**
