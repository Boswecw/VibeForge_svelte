<div align="center">
  <img src="static/VibeForge_icon.svg" alt="VibeForge" width="200" />
  
  # VibeForge
  
  **A Professional Prompt Engineering Workbench for AI Developers**
</div>

VibeForge is a structured workspace for crafting, testing, and refining prompts for large language models. Built with SvelteKit, TypeScript, and Tailwind CSS, it provides a professional 3-column layout designed for low cognitive load and efficient workflows.

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

VibeForge is **not a chat interface**—it's a professional tool for AI engineers who need to:

- **Compose complex prompts** with reusable context blocks
- **Test multiple models** side-by-side with the same prompt
- **Track execution history** with full audit trails
- **Evaluate model outputs** systematically
- **Organize work** across multiple workspaces

### Core Features

✅ **3-Column Workbench** - Context | Prompt | Output layout
✅ **Context Library** - Reusable prompt components with search
✅ **Document Ingestion** - Upload and process documents into contexts
✅ **Research Assistant** - Notes, snippets, and suggestions panel
✅ **Multi-Model Execution** - Run prompts across multiple models
✅ **History & Replay** - Complete execution audit trail
✅ **Evaluations** - Systematic model comparison
✅ **Workspaces** - Multi-workspace organization
✅ **Dark/Light Theme** - Professional dark-first design

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

**Version:** 0.0.1 (MVP Phase)
**Status:** ✅ Production-Ready with Active Development

### Completed Features

- [x] Main Workbench (3-column layout)
- [x] Context Library with search
- [x] Document Ingestion system
- [x] Research & Assist panel
- [x] Quick Run mode
- [x] Run History
- [x] Prompt Patterns library
- [x] Presets management
- [x] Evaluations dashboard
- [x] Workspaces
- [x] Settings panel
- [x] Dark/Light theme system

### In Progress

- [ ] Backend API integration
- [ ] Real file storage
- [ ] User authentication
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

## 📄 License

[Add your license here]

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
