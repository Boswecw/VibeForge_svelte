# VibeForge Setup Guide

Complete installation and configuration instructions for VibeForge.

---

## Prerequisites

### Required Software

- **Node.js** 20.x or later
- **pnpm** 8.x or later (recommended) or npm/yarn
- **Git** (for cloning the repository)

### System Requirements

- **OS:** Linux, macOS, or Windows (WSL recommended)
- **RAM:** 4GB minimum, 8GB recommended
- **Disk Space:** 500MB for dependencies

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/vibeforge.git
cd vibeforge
```

### 2. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

### 3. Verify Installation

```bash
# Check TypeScript compilation
pnpm check

# Should output: "No errors found"
```

---

## Development Setup

### Start Development Server

```bash
pnpm dev
```

The application will be available at:
- **URL:** http://localhost:5173
- **Hot Reload:** Enabled (changes auto-refresh)

### Development Commands

```bash
# Start dev server
pnpm dev

# Type checking (one-time)
pnpm check

# Type checking (watch mode)
pnpm check:watch

# Build for production
pnpm build

# Preview production build
pnpm preview
```

---

## Configuration

### Environment Variables

Create a `.env` file in the project root (optional):

```env
# API Configuration (if using backend)
PUBLIC_API_BASE_URL=http://localhost:8000
PUBLIC_API_VERSION=v1

# Analytics (optional)
PUBLIC_ANALYTICS_ID=your-analytics-id
```

### Theme Configuration

The default theme is **dark mode**. Users can toggle between dark/light mode in the UI.

To change the default theme, edit `src/lib/stores/themeStore.ts`:

```typescript
const initialTheme: Theme = 'dark'; // or 'light'
```

### Port Configuration

To change the development server port, edit `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 5173, // Change to your preferred port
  },
});
```

---

## Browser Setup

### Recommended Browsers

- **Chrome** 90+ (recommended)
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

### Browser Extensions (Optional)

- **Svelte DevTools** - For debugging Svelte components
- **React DevTools** - Not needed (Svelte-only project)

---

## IDE Setup

### VS Code (Recommended)

Install these extensions:

1. **Svelte for VS Code** (`svelte.svelte-vscode`)
2. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
3. **TypeScript Vue Plugin (Volar)** - Not needed
4. **Prettier** (`esbenp.prettier-vscode`)

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[svelte]": {
    "editor.defaultFormatter": "svelte.svelte-vscode"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## Troubleshooting

### Common Issues

#### 1. `pnpm: command not found`

**Solution:** Install pnpm globally

```bash
npm install -g pnpm
```

#### 2. Port 5173 already in use

**Solution:** Kill the process or change the port

```bash
# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or change port in vite.config.ts
```

#### 3. TypeScript errors on first run

**Solution:** Rebuild TypeScript cache

```bash
rm -rf node_modules/.vite
pnpm check
```

#### 4. Tailwind styles not loading

**Solution:** Restart dev server

```bash
# Stop server (Ctrl+C)
pnpm dev
```

---

## Next Steps

After successful setup:

1. **Explore the UI** - Navigate to http://localhost:5173
2. **Read the docs** - See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
3. **Try features** - See [FEATURES.md](./FEATURES.md) for feature guides
4. **Start developing** - See [DEVELOPMENT.md](./DEVELOPMENT.md) for workflows

---

## Production Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for production deployment instructions.

---

**Setup Complete!** 🎉

You're ready to start using VibeForge. Run `pnpm dev` and open http://localhost:5173 to begin.

