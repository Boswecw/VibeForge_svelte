# VibeForge Documentation - Master Index

**Last Updated**: November 21, 2025  
**Project Status**: Phase 3+ Complete (Professional Prompt Workbench)

---

## 📍 Quick Navigation

### 🎯 Core References

- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - AI agent instructions ⭐
- **[README.md](README.md)** - Project overview
- **[src/app.css](src/app.css)** - Design system & Tailwind

### 🟢 Architecture

- **3-Column Layout**: Context Column + Prompt Column + Output Column
- **Low Cognitive Load**: Structured context + clear prompts + execution history
- **Professional Workflows**: Designed for AI coding agents

---

## 📚 Documentation Structure

### **1. Core Documentation**

| Document                                                               | Purpose                          | Audience       |
| ---------------------------------------------------------------------- | -------------------------------- | -------------- |
| **[.github/copilot-instructions.md](.github/copilot-instructions.md)** | AI agent instructions & patterns | AI Agents      |
| **[README.md](README.md)**                                             | Project overview & quick start   | Everyone       |
| **[STARTUP.md](STARTUP.md)**                                           | Getting started guide            | New developers |

### **2. Architecture & Design**

#### 3-Column Layout Philosophy

```
┌─────────────────────────────────────────────────────┐
│              VibeForge Workbench                    │
├──────────────┬──────────────────┬──────────────────┤
│   Context    │      Prompt      │      Output      │
│   Column     │      Column      │      Column      │
│              │                  │                  │
│ • System     │ Text editor      │ Model response   │
│ • Design     │ Active context   │ Run history      │
│ • Project    │ Token counter    │ Comparisons      │
│ • Code       │ Quick save       │ Metrics          │
│ • Workflow   │                  │                  │
└──────────────┴──────────────────┴──────────────────┘
```

#### Pages & Routes

| Route         | Component            | Purpose                                          |
| ------------- | -------------------- | ------------------------------------------------ |
| `/`           | Main workbench       | 3-column professional interface                  |
| `/quick-run`  | Quick runner         | Lightweight single-column for rapid experiments  |
| `/contexts`   | Context library      | Browse & manage reusable context blocks          |
| `/history`    | Run history          | View, replay, compare previous runs              |
| `/patterns`   | Prompt patterns      | Library of prompt recipes/templates              |
| `/presets`    | Saved workspaces     | Save & restore complete workbench configurations |
| `/evals`      | Evaluation dashboard | Model comparison & quality metrics               |
| `/settings`   | User preferences     | Appearance, fonts, models, workspace defaults    |
| `/workspaces` | Workspace manager    | Multi-workspace support with stats               |

### **3. State Management**

#### Svelte Stores (in `src/lib/stores/`)

| Store                  | Purpose               | Methods                                             | Persistence  |
| ---------------------- | --------------------- | --------------------------------------------------- | ------------ |
| **themeStore**         | Dark/light mode       | `toggle()`, `setTheme()`                            | localStorage |
| **promptStore**        | Active prompt text    | `setText()`, `reset()`                              | Session      |
| **contextStore**       | Active context blocks | `toggleActive()`, `addContext()`, `removeContext()` | Session      |
| **runStore**           | Run history           | `addRun()`, `setActiveRun()`, `reset()`             | In-memory    |
| **presetsStore**       | Saved presets         | `togglePinned()`, `addPreset()`, `removePreset()`   | In-memory    |
| **accessibilityStore** | Font size control     | `setFontSize()`, `reset()`                          | localStorage |

**Pattern**: All stores use `browser` check before accessing `localStorage` (SSR-safe)

### **4. Design System**

#### Color Palette (Forge Theme)

```css
/* Metal/Dark Tones (Primary) */
forge-blacksteel:  #0B0F17  /* Main background */
forge-gunmetal:    #111827  /* Secondary backgrounds */
forge-steel:       #1E293B  /* Tertiary / interactive states */

/* Light/Quench Surfaces (Light Mode) */
forge-quench:      #F8FAFC  /* Primary light background */
forge-quenchLift:  #E2E8F0  /* Accent light backgrounds */

/* Text & Borders (Dark Mode) */
forge-textBright:  #F8FAFC  /* Primary text */
forge-textDim:     #CBD5E1  /* Secondary text */
forge-textMuted:   #94A3B8  /* Tertiary text */
forge-line:        #233044  /* Dark borders */

/* Text & Borders (Light Mode) */
forge-line-light:  #CBD5E1  /* Light borders */

/* Accent (Primary) */
forge-ember:       #FBBF24  /* Primary action (warm amber) */
forge-emberHover:  #F59E0B  /* Hover state */

/* Functional Colors */
forge-info:        #3B82F6  /* Information */
forge-danger:      #EF4444  /* Errors & alerts */
forge-success:     #22C55E  /* Success states */
```

#### Typography

- **Headings**: Sans-serif (system), bold, 2-4xl
- **Body**: Sans-serif (system), regular, base-lg
- **Code**: Monospace (JetBrains Mono or system), smaller
- **UI Labels**: Sans-serif, small, uppercase optional

#### Component Patterns

```svelte
<!-- Theme-aware styling -->
<div class={`px-4 py-3 ${$theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
  <!-- Content -->
</div>
```

### **5. Key Components**

#### Layout Components

- **WorkbenchShell** - Main container wrapper
- **ForgeSideNav** - Fixed 224px left navigation
- **ForgeTopBar** - Top application bar

#### Column Components

- **ContextColumn** - Reusable context blocks library
  - `ContextList` - Filterable list
  - `ContextDetailPanel` - Metadata & actions
- **PromptColumn** - Main editor interface
  - Active context chips
  - Token estimation
  - Quick save/preset
- **OutputColumn** - Results & history
  - Live model output
  - Run history table
  - Comparison metrics

#### Feature Components

- **PresetsDrawer** - Preset picker & manager
- **WorkspacesPanel** - Workspace switcher
- **SettingsForm** - Settings UI
- **EvaluationDashboard** - Model comparison

### **6. Type System**

#### Core Types (in `src/lib/types/`)

```typescript
// Context blocks
export type ContextKind = "system" | "design" | "project" | "code" | "workflow";
export interface ContextBlock {
  id: string;
  title: string;
  kind: ContextKind;
  description: string;
  tags: string[];
  isActive: boolean;
  lastUpdated: string; // ISO date
  source: "global" | "workspace" | "local";
}

// Model runs
export interface ModelRun {
  id: string;
  workspace_id: string;
  model: string;
  prompt: string;
  output: string;
  timestamp: string; // ISO date
  tokens: TokenUsage;
  duration_ms: number;
  evaluation?: EvaluationResult;
}

// Workspaces
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
  status: "active" | "archived";
  models: string[];
  tags: string[];
  settings: WorkspaceSettings;
  stats: { totalRuns: number; lastRunAt?: string };
}

// Presets (saved configurations)
export interface Preset {
  id: string;
  name: string;
  description: string;
  category: "coding" | "writing" | "analysis" | "evaluation" | "other";
  workspace: string;
  tags: string[];
  basePrompt: string;
  contextRefs: Array<{ id: string; label: string }>;
  models: string[];
  pinned: boolean;
  updatedAt: string; // ISO date
}
```

### **7. Feature Deep Dives**

#### Quick Run vs. Main Workbench

| Aspect       | Quick Run         | Main Workbench         |
| ------------ | ----------------- | ---------------------- |
| **Layout**   | Single-column     | 3-column               |
| **Focus**    | Speed             | Structured work        |
| **Context**  | Minimal           | Full library           |
| **History**  | Minimal           | Full tracking          |
| **Use Case** | Rapid experiments | Professional workflows |

#### Presets System

- **What**: Saved workbench configurations
- **Components**: `PresetsDrawer`, `SavePresetModal`, `PresetDetailPanel`
- **Storage**: Currently in-memory (localStorage TODO)
- **Pattern**: Save preset → export to store → retrieve later

#### Workspaces

- **Purpose**: Multi-workspace support (personal, team, project-specific)
- **Features**: Custom models, evaluation scales, settings
- **UI**: `WorkspacesList`, `WorkspaceDetailPanel`, `WorkspaceEditorDrawer`
- **Pattern**: 2-column desktop (list + detail), responsive mobile

#### Settings System

1. **WorkspaceSettingsSection** - Workspace defaults
2. **AppearanceSettingsSection** - Theme, font size, density
3. **ModelSettingsSection** - Per-model config
4. **DataSettingsSection** - History retention, data policies

### **8. Development Workflow**

```bash
# Setup
pnpm install                # Install dependencies
pnpm run dev                # Start dev server (:5173)

# Development
pnpm run dev                # Auto-reload
pnpm run check              # TypeScript validation
pnpm run check:watch        # Watch validation

# Build & Deploy
pnpm run build              # Production build
pnpm run preview            # Preview built output

# Code Quality
pnpm run lint               # ESLint
pnpm run format             # Prettier
```

### **9. Key Patterns**

#### Store Hydration (SSR-Safe)

```svelte
<script>
  import { browser } from '$app/environment';
  import { themeStore } from '$lib/stores/theme';

  onMount(() => {
    if (browser) {
      // Load persisted state
      themeStore.init();
    }
  });
</script>
```

#### Derived Stores

```typescript
// Create derived filter
export const activeContexts = derived(contextState, ($state) =>
  $state.filter((c) => c.isActive)
);
```

#### Component Props Pattern

```svelte
<script>
  let { blocks, activeId, onSelect } = $props();
</script>
```

#### Theme-Aware Styling

```svelte
<div class={$theme === 'dark' ? 'bg-forge-gunmetal' : 'bg-forge-quench'}>
```

### **10. Build & Deployment**

**Tech Stack**:

- SvelteKit 2.x with TypeScript 5.9
- Vite 7 for fast dev/build
- Tailwind CSS v4 (@tailwindcss/vite)
- Svelte 5.43 with runes

**Output**: `vite build` → `build/` directory

**Deployment Targets**:

- Static hosting (Vercel, Netlify, GitHub Pages)
- Container (Docker)
- Self-hosted (Node.js server)

---

## 📁 Project Structure

```
vibeforge/
├── .github/copilot-instructions.md        ← AI AGENT INSTRUCTIONS
├── README.md                              ← Project overview
├── STARTUP.md                             ← Getting started
├── package.json                           ← Dependencies & scripts
├── vite.config.ts                         ← Build config
├── tsconfig.json                          ← TypeScript config
├── tailwind.config.cjs                    ← Tailwind config
├── svelte.config.js                       ← SvelteKit config
│
├── src/
│   ├── app.css                            ← Design system & Tailwind
│   ├── app.html                           ← HTML template
│   ├── index.html                         ← Entry point
│   │
│   ├── routes/
│   │   ├── +layout.svelte                 ← Root layout
│   │   ├── +page.svelte                   ← Main workbench (/)
│   │   ├── quick-run/                     ← Quick runner
│   │   ├── contexts/                      ← Context library
│   │   ├── history/                       ← Run history
│   │   ├── patterns/                      ← Prompt patterns
│   │   ├── presets/                       ← Saved presets
│   │   ├── evals/                         ← Evaluation dashboard
│   │   ├── settings/                      ← Settings
│   │   └── workspaces/                    ← Workspace manager
│   │
│   ├── lib/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── WorkbenchShell.svelte
│   │   │   │   ├── ForgeSideNav.svelte
│   │   │   │   └── ForgeTopBar.svelte
│   │   │   │
│   │   │   ├── columns/
│   │   │   │   ├── ContextColumn.svelte
│   │   │   │   ├── PromptColumn.svelte
│   │   │   │   └── OutputColumn.svelte
│   │   │   │
│   │   │   ├── contexts/
│   │   │   ├── history/
│   │   │   ├── patterns/
│   │   │   ├── presets/
│   │   │   ├── evals/
│   │   │   ├── settings/
│   │   │   ├── workspaces/
│   │   │   │
│   │   │   └── common/
│   │   │       ├── Button.svelte
│   │   │       ├── Card.svelte
│   │   │       ├── Modal.svelte
│   │   │       └── [...UI primitives]
│   │   │
│   │   ├── stores/
│   │   │   ├── theme.ts
│   │   │   ├── prompt.ts
│   │   │   ├── context.ts
│   │   │   ├── run.ts
│   │   │   ├── presets.ts
│   │   │   └── accessibility.ts
│   │   │
│   │   ├── types/
│   │   │   ├── context.ts
│   │   │   ├── workspace.ts
│   │   │   ├── evaluation.ts
│   │   │   ├── run.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── api/
│   │   │   ├── context.ts
│   │   │   ├── run.ts
│   │   │   └── [...API clients]
│   │   │
│   │   └── utils/
│   │       ├── tokenCounter.ts
│   │       ├── formatters.ts
│   │       └── [...utilities]
│   │
│   └── styles/
│       └── [Custom CSS files]
│
├── static/
│   └── [Static assets]
│
└── [Configuration files]
    ├── playwright.config.ts
    ├── vitest.config.ts
    ├── .env.example
    └── [...]
```

---

## 🎯 Common Tasks

### **Add New Store**

1. Create `src/lib/stores/newstore.ts`
2. Define writable/derived stores
3. Add browser check for localStorage
4. Export store and methods
5. Import in components with `$` prefix

### **Add New Page**

1. Create `src/routes/newpage/+page.svelte`
2. Use layout inheritance (`+layout.svelte`)
3. Import components & stores
4. Add to navigation
5. Document in this INDEX

### **Add New Component**

1. Create `src/lib/components/[feature]/NewComponent.svelte`
2. Accept props with `let { prop } = $props()`
3. Use theme-aware styling
4. Export and document interface

### **Update Appearance**

1. Edit `src/app.css` for Forge tokens
2. Use Tailwind classes in components
3. Check light/dark mode with `$theme`
4. Test in both themes

---

## 📊 Project Status

| Area                | Status      | Features                   | Docs |
| ------------------- | ----------- | -------------------------- | ---- |
| **Main Workbench**  | ✅ Complete | 3-column, context, history | ✅   |
| **Quick Run**       | ✅ Complete | Rapid experiments          | ✅   |
| **Context Library** | ✅ Complete | Reusable blocks            | ✅   |
| **Presets System**  | ✅ Complete | Save/restore configs       | ✅   |
| **Workspaces**      | ✅ Complete | Multi-workspace support    | ✅   |
| **Settings**        | ✅ Complete | User preferences           | ✅   |
| **Evaluation**      | ✅ Complete | Model comparison           | ✅   |
| **Design System**   | ✅ Complete | Forge theme                | ✅   |

---

## 🔗 Related Projects

- **[DataForge](../DataForge/INDEX.md)** - Knowledge base backend
- **[NeuroForge](../NeuroForge/INDEX.md)** - LLM orchestration
- **[AuthorForge](../AuthorForge_Solid_new/INDEX.md)** - Writing suite
- **[vibeforge-backend](../vibeforge-backend/README.md)** - Unified LLM service

---

## 📞 Support

- **AI Agents**: Read [.github/copilot-instructions.md](.github/copilot-instructions.md)
- **Getting Started**: Read [STARTUP.md](STARTUP.md) & [README.md](README.md)
- **Styling Issues**: Check [src/app.css](src/app.css) & design system
- **Store Issues**: See store files in `src/lib/stores/`
- **Component Patterns**: Check similar components in `src/lib/components/`

---

**Version**: 3.0  
**Status**: ✅ Current  
**Last Updated**: 2025-11-21
