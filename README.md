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

### Core Features

✅ **Multi-Step Wizard** - Intelligent project creation flow
✅ **15 Programming Languages** - Frontend, Backend, Mobile, Systems categories
✅ **10 Stack Profiles** - Production-ready configurations (T3, MERN, Next.js, FastAPI AI, etc.)
✅ **Adaptive Learning** - Historical insights and personalized recommendations  
✅ **Success Prediction** - ML-powered project outcome forecasting  
✅ **Experience Tracking** - User preference learning and pattern detection
✅ **Smart Recommendations** - Language + stack compatibility validation
✅ **Timeline Estimation** - Complexity scoring and milestone suggestions
✅ **Template Library** - 10 professional project templates
✅ **Dark/Light Theme** - Professional design optimized for developers

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

## 🧪 Testing

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

## 📞 Support

For questions or issues:

1. Check the [documentation](./ARCHITECTURE.md)
2. Review [existing issues](https://github.com/your-repo/issues)
3. Open a new issue with details

---

**Built with ❤️ for AI Engineers**
