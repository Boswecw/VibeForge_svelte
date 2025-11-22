# 📚 VibeForge Documentation Map

**Last Updated**: November 21, 2025  
**Status**: ✅ All documentation organized & accessible

---

## 🎯 START HERE

### Quick Navigation by Role

| Role              | Document                           | Time   |
| ----------------- | ---------------------------------- | ------ |
| **New Developer** | [README.md](README.md)             | 5 min  |
| **Get Started**   | [SETUP.md](SETUP.md)               | 10 min |
| **Architecture**  | [ARCHITECTURE.md](ARCHITECTURE.md) | 10 min |
| **Development**   | [DEVELOPMENT.md](DEVELOPMENT.md)   | 15 min |
| **Testing**       | [TESTING.md](TESTING.md)           | varies |
| **Project Index** | [INDEX.md](INDEX.md)               | 10 min |

---

## 📂 Documentation Structure

### Root Level (Active Documents)

**Core Guides:**

- `README.md` - Project overview & features
- `ARCHITECTURE.md` - 3-column layout & component architecture
- `DEVELOPMENT.md` - Development workflow & patterns
- `SETUP.md` - Installation & configuration
- `TESTING.md` - Test procedures & patterns
- `FEATURES.md` - Feature overview
- `INDEX.md` - Master index

### docs/setup/ (Setup & Development)

**Getting started & development reference:**

- Setup instructions & configuration

### docs/guides/ (Integration & Procedures)

**Testing & implementation guides:**

- Testing session logs & procedures

### docs/archive/ (Historical Documentation)

**Session logs & testing history:**

- `LIVE_TESTING_*.md` - Live testing sessions & results
- Testing session documentation

---

## 🎯 The 3-Column Layout

| Column      | Purpose                | Component            |
| ----------- | ---------------------- | -------------------- |
| **Context** | Reusable prompt blocks | ContextColumn.svelte |
| **Prompt**  | Main text editor       | PromptColumn.svelte  |
| **Output**  | Model responses        | OutputColumn.svelte  |

---

## 🎯 Pages (9 Total)

| Page           | Route         | Purpose                         |
| -------------- | ------------- | ------------------------------- |
| Main Workbench | `/`           | 3-column workspace              |
| Quick Run      | `/quick-run`  | Single-column rapid experiments |
| Contexts       | `/contexts`   | Context library                 |
| History        | `/history`    | Run history & replay            |
| Patterns       | `/patterns`   | Prompt patterns                 |
| Presets        | `/presets`    | Saved configurations            |
| Evaluations    | `/evals`      | Model comparison                |
| Settings       | `/settings`   | User preferences                |
| Workspaces     | `/workspaces` | Workspace management            |

---

## 🎯 Store System

**Svelte Stores (src/lib/stores/):**

- `themeStore` - Dark/light mode toggle
- `promptStore` - Active prompt text & tokens
- `contextStore` - Context blocks & active list
- `runStore` - Execution history
- `presetsStore` - Preset library
- `accessibilityStore` - Font size & accessibility

**Pattern**: All stores use `browser` check for SSR safety

---

## 🎯 Common Tasks

### I want to...

| Goal                            | Location                                                              |
| ------------------------------- | --------------------------------------------------------------------- |
| Understand the architecture     | [ARCHITECTURE.md](ARCHITECTURE.md)                                    |
| Set up locally                  | [SETUP.md](SETUP.md)                                                  |
| Understand development workflow | [DEVELOPMENT.md](DEVELOPMENT.md)                                      |
| Add a new feature               | [DEVELOPMENT.md](DEVELOPMENT.md) + [ARCHITECTURE.md](ARCHITECTURE.md) |
| Run tests                       | [TESTING.md](TESTING.md)                                              |
| See what was tested             | [docs/archive/LIVE*TESTING*\*.md](docs/archive/)                      |
| Work on a page                  | [INDEX.md](INDEX.md) → Page guide                                     |

---

## 📊 Project Status

**Status**: 95% Complete  
**Framework**: SvelteKit + Tailwind v4
**Pages**: 9 fully implemented
**Stores**: 6 (theme, prompt, context, run, presets, accessibility)

---

## 📞 Key Files Reference

| File                | Purpose                   |
| ------------------- | ------------------------- |
| **README.md**       | Project overview          |
| **ARCHITECTURE.md** | Layout & component design |
| **DEVELOPMENT.md**  | Development patterns      |
| **SETUP.md**        | Installation guide        |
| **TESTING.md**      | Test procedures           |
| **INDEX.md**        | Master index              |

---

**All documentation organized, archived, and accessible** ✅
