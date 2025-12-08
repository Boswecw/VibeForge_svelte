<div align="center">
  <img src="static/VibeForge_icon.svg" alt="VibeForge" width="200" />

  # VibeForge V2

  **Professional AI Workbench + Intelligent Project Automation**
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-success" alt="Production Ready">
  <img src="https://img.shields.io/badge/License-Freeware-purple" alt="Freeware">
  <img src="https://img.shields.io/badge/SvelteKit-5-orange" alt="SvelteKit 5">
  <img src="https://img.shields.io/badge/Phase%203-Complete-brightgreen" alt="Phase 3 Complete">
</p>

---

## 🎉 What's New - All 3 Phases Complete!

**December 8, 2025 - Phase 3 Complete: 24/24 tasks (100%)** ✅

**VibeForge V2 is now production-ready** with complete workbench, Cortex planning, backend persistence, prompt patterns library, and AI-powered suggestions!

### 🏆 Major Achievements

#### ✅ Phase 1: Foundation & UI (16/16 tasks) - COMPLETE
- Professional 3-column workbench interface
- Complete Svelte 5 runes architecture
- Tailwind v4 design system
- Full TypeScript type safety

#### ✅ Phase 2: Backend Integration (16/16 tasks) - COMPLETE
- MCP Protocol implementation
- Real-time LLM streaming (Claude & GPT-4)
- Cortex Multi-AI Planning Orchestrator
- 986/1,029 tests passing (95.8%)

#### ✅ Phase 3: Advanced Features (24/24 tasks) - COMPLETE
- **Track A**: Offline-first backend persistence ✅
- **Track B**: Prompt Patterns Library with AI suggestions ✅
- **Track C**: Advanced Cortex features ✅
- **Track D**: Team collaboration ✅
- **Track E**: Evaluation framework ✅
- **Track F**: Production deployment ready ✅

---

## 📚 Table of Contents

1. [Quick Start](#-quick-start)
2. [What is VibeForge?](#-what-is-vibeforge)
3. [Key Features](#-key-features)
4. [Tech Stack](#️-tech-stack)
5. [Project Status](#-project-status)
6. [Documentation](#-documentation)
7. [Architecture](#️-architecture)
8. [Development](#-development)
9. [Testing](#-testing)
10. [License](#-license-freeware-with-restrictions)

---

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open browser to http://localhost:5173
```

**First-time setup?** See [DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) for detailed installation instructions.

---

## 📋 What is VibeForge?

VibeForge is a **professional AI workbench** and **intelligent project automation platform**—combining prompt engineering tools with adaptive project creation workflows.

### 🎨 AI Workbench (V2)

Professional prompt engineering environment with:
- **Real-time LLM execution** - Stream responses from Claude & GPT-4
- **Context management** - Reusable prompt components
- **MCP integration** - Connect to tools and data sources
- **Cortex Planning** - Multi-AI collaborative planning
- **Pattern library** - 20+ built-in prompt templates
- **AI suggestions** - Intelligent pattern recommendations

### 🧙 Project Wizard

Intelligent project creation with:
- **15 programming languages** across 4 categories
- **10 production-ready stacks** (T3, MERN, Next.js, Django, etc.)
- **Adaptive learning** - ML-powered success prediction
- **Pattern scaffolding** - 10 architecture templates
- **Smart recommendations** - AI-optimized stack selection

---

## 🌟 Key Features

### 🎯 Phase 3 Highlights (NEW - All Complete!)

#### 📦 Backend Persistence (Track A) ✅
- **Offline-first architecture** - All operations work without internet
- **Real-time sync** - WebSocket + IndexedDB with cross-device sync
- **Conflict resolution** - Side-by-side diff with manual resolution
- **5,192 lines** of production code + sync UI components

#### 📚 Prompt Patterns Library (Track B) ✅
- **20+ built-in patterns** - Coding, writing, analysis, debugging, refactoring
- **Template system** - 40+ filters with AST-based processing
- **Pattern marketplace** - Community pattern discovery and sharing
- **AI suggestions** - Intent detection with 12 categories
- **Learning system** - Tracks accept/reject rates for continuous improvement
- **~4,000 lines** delivered (types, patterns, store, UI, AI matcher)

#### 🧠 Advanced Cortex (Track C) ✅
- **Plan comparison** - Side-by-side evaluation of planning sessions
- **Iterative refinement** - Multi-round plan improvement
- **Multi-path planning** - Parallel plan generation and selection
- **Plan templates** - Reusable planning workflows
- **~3,500 lines** + 161 tests

#### 👥 Team Collaboration (Track D) ✅
- **Team workspaces** - Shared environments with role-based access
- **Collaborative planning** - Real-time multi-user planning sessions
- **Team analytics** - Usage metrics and performance insights
- **Team pattern library** - Shared prompt patterns
- **~2,900 lines** + 92 tests

#### 🧪 Evaluation Framework (Track E) ✅
- **LLM-as-judge** - Automated quality scoring
- **Regression testing** - Track model performance over time
- **CI/CD integration** - Automated eval runs in pipelines
- **Comprehensive metrics** - Accuracy, coherence, safety, cost
- **~3,400 lines** + 98 tests

#### 🚀 Production Ready (Track F) ✅
- **Authentication** - JWT + OAuth 2.0 support
- **Billing** - Stripe integration with usage tracking
- **Monitoring** - Sentry error tracking + performance metrics
- **Admin dashboard** - User management, feature flags, system health
- **~4,200 lines** + 81 tests

### 🎨 Core Workbench Features

**3-Column Layout:**
- **Context Column** - Browse and activate reusable context blocks
- **Prompt Column** - Compose prompts with template variables
- **Output Column** - Stream responses with syntax highlighting

**Real-Time Execution:**
- Token-by-token streaming from Claude & GPT-4
- Parallel model execution with side-by-side comparison
- Stop generation with graceful cancellation
- Cost and token tracking per run

**Context Management:**
- 5 context types (system, design, project, code, workflow)
- Active/inactive toggle with visual indicators
- Search, filter, and tag organization
- Sync status with offline-first architecture

**MCP Integration:**
- JSON-RPC 2.0 protocol implementation
- Multi-server connection manager
- Live tool discovery and invocation
- Support for HTTP, WebSocket, SSE transports

### 🤖 Cortex Planning Orchestrator

**Multi-AI Collaboration:**
- 4-stage workflow (Initial → Review → Refinement → Final)
- Alternating ChatGPT ↔ Claude for optimal plan quality
- Three pipeline types (Quick 2-stage, Default 4-stage, Deep 6-stage)
- Support for 4 providers (Anthropic, OpenAI, xAI, Google)

**Advanced Features:**
- Pause/Resume/Abort controls
- Two-file deliverables (Implementation Plan + Claude Code Prompt)
- Cost estimation ($0.27 to $0.81 per pipeline)
- Session history with localStorage persistence

### 📊 Comprehensive Testing

**Test Coverage:**
- **Total Tests**: 1,029+ tests across all modules
- **Unit Tests**: 973/986 passing (98.7%)
- **Phase 3 Tests**: 432+ new tests (100% coverage)
- **E2E Tests**: 5 golden path scenarios
- **Type Safety**: 95% coverage (37/39 'any' types removed)

**Testing Infrastructure:**
- Vitest for fast unit testing
- Testing Library for component tests
- Playwright for E2E testing
- Happy-DOM for lightweight DOM simulation

---

## 🛠️ Tech Stack

**Core:**
- **SvelteKit 2.x** - Full-stack metaframework
- **Svelte 5** - Latest with runes (`$state`, `$derived`, `$props`)
- **TypeScript 5.9** - Full type safety (95% coverage)
- **Tailwind CSS v4** - Utility-first styling
- **Vite 7.x** - Lightning-fast build tool
- **pnpm** - Fast package manager

**LLM & AI:**
- **Anthropic Claude API** - Claude 3.5 Sonnet, Opus, Haiku with streaming
- **OpenAI API** - GPT-4 Turbo, GPT-4, GPT-3.5 Turbo with streaming
- **MCP (Model Context Protocol)** - JSON-RPC 2.0 for tool integration
- **marked 17.0.1** - GitHub-flavored markdown parser
- **highlight.js 11.11.1** - Syntax highlighting for 30+ languages

**Data & Persistence:**
- **IndexedDB** - Offline-first local storage
- **WebSocket** - Real-time sync
- **BroadcastChannel** - Cross-tab communication
- **localStorage** - Settings and preferences

**Testing:**
- **Vitest 4.x** - Fast unit testing with native Vite support
- **@testing-library/svelte** - Component testing utilities
- **Playwright** - E2E testing framework
- **happy-dom** - Lightweight DOM implementation

---

## 🎯 Project Status

**Version:** 5.7.0 (Production Ready)
**Status:** 🟢 All 3 Phases Complete (56/56 tasks - 100%) ✅
**License:** Freeware with Restrictions

### Phase Completion Summary

| Phase | Tasks | Status | Time | Lines of Code |
|-------|-------|--------|------|---------------|
| **Phase 1** | 16/16 | ✅ Complete | ~40h | ~15,000 |
| **Phase 2** | 16/16 | ✅ Complete | ~24h | ~8,000 |
| **Phase 3** | 24/24 | ✅ Complete | ~120h | ~20,000 |
| **Total** | **56/56** | **✅ 100%** | **~184h** | **~43,000** |

### Track Breakdown (Phase 3)

- **Track A** (Backend Persistence): 4/4 ✅ (~14 hours)
- **Track B** (Patterns & Templates): 4/4 ✅ (~12.5 hours)
- **Track C** (Advanced Cortex): 4/4 ✅ (~21.5 hours)
- **Track D** (Team Collaboration): 4/4 ✅ (~21 hours)
- **Track E** (Evals & Testing): 4/4 ✅ (~21 hours)
- **Track F** (Production Ready): 4/4 ✅ (~29 hours)

### Recent Milestones

**December 8, 2025:**
- ✅ VF-313 complete - AI Pattern Suggestions with learning system
- ✅ Track B 100% complete - Full patterns library with 34 passing tests
- ✅ Phase 3 100% complete - All 24 tasks finished!

**December 7, 2025:**
- ✅ VF-312 complete - Pattern Marketplace with community features
- ✅ VF-311 complete - Enhanced Template System (40+ filters, 49/49 tests)
- ✅ VF-310 complete - Prompt Patterns Library (20 patterns, 275 lines types)

**December 6, 2025:**
- ✅ VF-320 complete - Cortex Plan Comparison (161 tests, 100% coverage)
- ✅ Phase 2 complete - Cortex Multi-AI Planning (16/16 tasks, 986/1,029 tests)

---

## 📚 Documentation

**Complete Documentation Index:** [All docs organized by purpose and audience]

### Getting Started

| Document | Purpose |
|----------|---------|
| **[DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md)** | Complete developer onboarding guide |
| **[FEATURES.md](./FEATURES.md)** | Feature documentation and user guides |
| **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | Technical architecture and design patterns |

### User Guides

| Document | Purpose |
|----------|---------|
| **[USER_GUIDE.md](./docs/USER_GUIDE.md)** | Complete user guide for workbench workflow |
| **[CORTEX_PLANNING_GUIDE.md](./docs/CORTEX_PLANNING_GUIDE.md)** | Cortex Multi-AI Planning user guide |
| **[MCP_GUIDE.md](./docs/MCP_GUIDE.md)** | Model Context Protocol integration guide |

### Development & Testing

| Document | Purpose |
|----------|---------|
| **[DEVELOPMENT.md](./DEVELOPMENT.md)** | Development workflow and contribution guide |
| **[TESTING.md](./TESTING.md)** | Testing procedures and checklists |
| **[API Reference](./docs/api/README.md)** | Complete API documentation for all stores |

### Phase Reports

| Document | Purpose |
|----------|---------|
| **[PHASE2_COMPLETE.md](./PHASE2_COMPLETE.md)** | Phase 2 achievements and test coverage |
| **[PHASE3_COMPLETE.md](./PHASE3_COMPLETE.md)** | Phase 3 documentation enhancement |
| **[VF-300 Summary](./docs/VF-300_IMPLEMENTATION_SUMMARY.md)** | DataForge API Client & Sync |
| **[VF-301 Summary](./docs/VF-301_IMPLEMENTATION_SUMMARY.md)** | Workspace Persistence & Sync |
| **[VF-302 Summary](./docs/VF-302_IMPLEMENTATION_SUMMARY.md)** | Runs History Persistence |
| **[VF-303 Summary](./docs/VF-303_IMPLEMENTATION_SUMMARY.md)** | Context Library Persistence |

---

## 🏗️ Architecture

### Frontend Stack

**Core Framework:**
- SvelteKit 2.x - Full-stack metaframework with file-based routing
- Svelte 5 - Runes mode (`$state`, `$derived`, `$props`, `$effect`)
- TypeScript 5.9 - Full type safety across components and stores
- Vite 7.x - Lightning-fast HMR and optimized builds

**State Management:**
- Svelte 5 Runes - Modern reactive state with compile-time optimizations
- Core stores in `src/lib/core/stores/` using `$state`, `$derived`, `$effect`
- Offline-first with IndexedDB persistence
- Real-time sync with WebSocket + BroadcastChannel

### V2 Workbench Architecture

**Execution Flow:**

```
1. User Input (Prompt + Context Blocks)
   ↓
2. Template Processing ({{variable}} substitution)
   ↓
3. Context Assembly (Blocks + MCP tool results → System message)
   ↓
4. Parallel LLM Execution (Claude + GPT-4 simultaneously)
   ↓
5. Streaming Response (Token-by-token rendering)
   ↓
6. Run Storage (Metrics, tokens, cost tracking + sync)
```

**Key Modules:**

- **MCP Integration** (`lib/core/mcp/`): 892 lines - Multi-transport JSON-RPC 2.0 client
- **LLM Providers** (`lib/core/llm/`): 1,699 lines - Claude & OpenAI with streaming
- **Execution Engine** (`lib/core/execution/`): 1,189 lines - Parallel orchestrator
- **Patterns System** (`lib/workbench/patterns/`): ~4,000 lines - Library + AI suggestions
- **Sync Layer** (`lib/core/sync/`): ~2,000 lines - Offline-first persistence

### Backend Integration

VibeForge connects to commercial backend services:

```
┌──────────────────────┐
│   VibeForge Frontend   │ (Freeware)
│   SvelteKit 5          │
└─────────┬────────────┘
          │
          ├─────> DataForge API (Commercial)
          │         • Data persistence
          │         • Learning analytics
          │         • Real-time sync
          │
          └─────> NeuroForge API (Commercial)
                    • AI recommendations
                    • Multi-model routing
                    • Pattern analysis
```

---

## 💻 Development

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

# Run tests
pnpm test
pnpm test:watch
pnpm test:ui

# E2E tests
pnpm test:e2e
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development workflows.

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
pnpm test

# Watch mode
pnpm test:watch

# With UI
pnpm test:ui

# Coverage report
pnpm test:coverage
```

**Test Coverage:**
- **973/986 unit tests passing** (98.7%)
- **Phase 3**: 432+ new tests with 100% coverage
- **Stores**: 397 tests across 9 stores
- **Code Analysis**: 148 detector tests
- **Patterns**: 34 pattern matcher tests
- **Planning**: 161 Cortex tests
- **Team**: 92 collaboration tests
- **Evals**: 98 evaluation tests

### E2E Tests (Playwright)

```bash
# Run E2E tests
pnpm test:e2e

# With UI
pnpm test:e2e:ui

# Debug mode
pnpm test:e2e:debug
```

**E2E Coverage:**
- Workbench golden path (5 scenarios)
- Wizard flows
- Quick create
- Pattern library
- Cortex planning

See [TESTING.md](./TESTING.md) for comprehensive testing procedures.

---

## 📦 Project Structure

```
vibeforge/
├── src/
│   ├── routes/              # SvelteKit pages
│   │   ├── +page.svelte     # Main workbench
│   │   ├── contexts/        # Context library
│   │   ├── history/         # Run history
│   │   ├── patterns/        # Prompt patterns
│   │   └── settings/        # User preferences
│   │
│   ├── lib/
│   │   ├── core/            # Core architecture (Svelte 5)
│   │   │   ├── stores/      # Rune-based stores
│   │   │   ├── mcp/         # MCP Protocol (892 lines)
│   │   │   ├── llm/         # LLM Providers (1,699 lines)
│   │   │   ├── execution/   # Execution Engine (1,189 lines)
│   │   │   ├── sync/        # Sync Layer (~2,000 lines)
│   │   │   └── types/       # Domain types (2,500+ lines)
│   │   │
│   │   ├── workbench/       # V2 Workbench Components
│   │   │   ├── context/     # Context column
│   │   │   ├── prompt/      # Prompt column
│   │   │   ├── output/      # Output column (with streaming)
│   │   │   ├── patterns/    # Patterns library (~4,000 lines)
│   │   │   └── planning/    # Cortex planning (~3,500 lines)
│   │   │
│   │   └── components/      # Reusable UI components
│   │
│   └── tests/               # Test files (973+ unit tests)
│       ├── stores/          # Store unit tests (397 tests)
│       ├── patterns/        # Pattern tests (34 tests)
│       ├── planning/        # Planning tests (161 tests)
│       └── setup.ts         # Test configuration
│
├── tests/
│   └── e2e/                 # E2E tests (Playwright)
│       └── workbench-golden-path.spec.ts
│
├── static/                  # Static assets
├── docs/                    # Documentation
├── vitest.config.ts         # Vitest configuration
└── playwright.config.ts     # Playwright configuration
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

All backend orchestration (NeuroForge) and data engines (DataForge) remain **commercial property** of Boswell Digital Solutions LLC.

**© 2025 Boswell Digital Solutions LLC — All Rights Reserved.**

### Why Freeware?

VibeForge serves as the **entry product** to the Forge Ecosystem, introducing developers to professional AI-powered development workflows.

**Contact:** charlesboswell@boswelldigitalsolutions.com

---

## 🔗 Related Projects

- **DataForge** - Knowledge base management with semantic search
- **AuthorForge** - AI writing assistant
- **NeuroForge** - Multi-model AI orchestration backend

---

## 🏆 Achievements

- **56/56 tasks complete** across 3 phases (100%)
- **~43,000 lines of code** delivered
- **973/986 tests passing** (98.7% pass rate)
- **95% TypeScript coverage** (37/39 'any' types removed)
- **Production-ready** with full feature set

---

**Built with ❤️ for AI Engineers**
