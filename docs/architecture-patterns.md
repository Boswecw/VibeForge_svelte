# Architecture Patterns

**Multi-component project architecture patterns for VibeForge.**

## Overview

Architecture Patterns enable VibeForge to scaffold complete multi-component projects, not just single-language applications. Instead of choosing "TypeScript + React", you select "Desktop App" and get a fully integrated Rust/Tauri + SvelteKit project.

## What is an Architecture Pattern?

An **Architecture Pattern** is a complete, production-ready project structure with:

- **Multiple integrated components** (backend, frontend, database, etc.)
- **Each component has its own language and framework**
- **Components communicate via defined protocols** (Tauri IPC, REST API, etc.)
- **Full scaffolding templates** for all files
- **Complete documentation** and setup instructions

## Available Patterns

### Desktop Application

**Category:** Desktop
**Icon:** 🖥️
**Complexity:** Intermediate

Cross-platform desktop app with native backend and modern web UI.

**Components:**
- **Backend:** Rust/Tauri for native system access
- **Frontend:** TypeScript/SvelteKit for modern UI

**Integration:** Tauri IPC commands

**Ideal for:**
- Desktop applications requiring native system access
- File management tools
- Developer tools
- Local-first applications

**Not ideal for:**
- Web-only applications
- Mobile apps
- Server-side services

**Examples:** VS Code, Obsidian, Cortex

---

### Full-Stack Web Application

**Category:** Web
**Icon:** 🌐
**Complexity:** Intermediate

Complete web app with API backend and modern frontend.

**Components:**
- **Backend:** Python/FastAPI REST API
- **Frontend:** TypeScript/SvelteKit web UI
- **Database:** PostgreSQL

**Integration:** REST API over HTTP

**Ideal for:**
- SaaS applications
- Web platforms
- API-driven applications
- Multi-user systems

**Not ideal for:**
- Desktop applications
- Mobile-native apps
- Embedded systems

**Examples:** Web dashboards, Admin panels, E-commerce platforms

---

## When to Use Each Pattern

### Choose Desktop App when:
- You need native file system access
- You're building developer tools
- You want cross-platform deployment (Mac, Windows, Linux)
- You need local-first architecture

### Choose Full-Stack Web when:
- You're building a SaaS product
- You need multi-user collaboration
- You want cloud deployment
- You need a REST API for mobile apps

## How Components Integrate

### Desktop App (Tauri IPC)

```
User clicks button (Frontend)
  ↓
invoke('save_data', { data })
  ↓
Tauri IPC
  ↓
#[command] save_data() (Backend)
  ↓
SQLite write
  ↓
Return result
  ↓
Frontend updates UI
```

### Full-Stack Web (REST API)

```
User Action (Frontend)
  ↓
fetch('/api/users', { method: 'POST' })
  ↓
HTTP Request
  ↓
@app.post('/api/users') (Backend)
  ↓
Database Query
  ↓
PostgreSQL
  ↓
JSON Response
  ↓
Frontend State Update
```

## Customizing Patterns

Each pattern can be customized through **Component Configuration**:

```typescript
const componentConfig: ComponentConfig = {
  componentId: 'backend',
  language: 'rust',           // Override language
  framework: 'tauri',         // Override framework
  location: 'src-tauri',      // Override location
  includeTests: true,         // Include test scaffolding
  includeDocker: false,       // Skip Docker setup
  includeCi: true             // Include CI/CD config
};
```

## Pattern Discovery

### Get all patterns

```typescript
import { getAllPatterns } from '$lib/data/architecture-patterns';

const patterns = getAllPatterns();
```

### Filter by category

```typescript
import { getPatternsByCategory } from '$lib/data/architecture-patterns';

const desktopPatterns = getPatternsByCategory('desktop');
const webPatterns = getPatternsByCategory('web');
```

### Search by use case

```typescript
import { searchPatternsByUseCase } from '$lib/data/architecture-patterns';

const patterns = searchPatternsByUseCase('desktop tools');
// Returns patterns ideal for desktop tools
```

### Get recommendations

```typescript
import { getRecommendedPatterns } from '$lib/data/architecture-patterns';

const recommendations = getRecommendedPatterns({
  category: 'web',
  complexity: 'intermediate',
  useCase: 'SaaS application'
});

recommendations.forEach(({ pattern, score }) => {
  console.log(`${pattern.displayName}: ${score}`);
});
```

## Component Structure

Each component in a pattern has:

### Scaffolding
- **Directories:** Complete folder structure
- **Files:** Template files with variable substitution
- **Package files:** package.json, Cargo.toml, etc.
- **Config files:** .gitignore, tsconfig.json, etc.

### Commands
- **install:** Install dependencies
- **dev:** Run in development mode
- **build:** Build for production
- **test:** Run tests

### Dependencies
Components can depend on other components:

```typescript
{
  componentId: 'backend',
  type: 'required',
  relationship: 'calls'
}
```

## Template Variables

Templates support Handlebars syntax:

### Variables
```handlebars
{{projectName}}
{{projectDescription}}
{{author}}
```

### Conditionals
```handlebars
{{#if includeDatabase}}
// Database code
{{/if}}
```

### Loops
```handlebars
{{#each dependencies}}
- {{this}}
{{/each}}
```

## Adding New Patterns

To add a new pattern:

1. **Create pattern file:** `src/lib/data/architecture-patterns/my-pattern.ts`
2. **Define components:** Backend, frontend, database, etc.
3. **Configure integration:** Choose protocol (REST, gRPC, etc.)
4. **Write documentation:** Quick start, architecture, deployment
5. **Register pattern:** Add to `ARCHITECTURE_PATTERNS` registry
6. **Write tests:** Validate structure and dependencies
7. **Create templates:** Add .hbs files for code generation

## Backward Compatibility

The wizard supports both:
- **Legacy mode:** Single language + single stack
- **Pattern mode:** Multi-component architecture

Legacy fields (`primaryLanguage`, `selectedStack`) are preserved for backward compatibility.

## Phase Roadmap

### Phase 1: Type System & Patterns ✅
- Complete type definitions
- Desktop app pattern
- Full-stack web pattern
- Pattern registry
- Comprehensive tests

### Phase 2: Wizard Integration (Next)
- UI for pattern selection
- Component configuration screens
- Preview and customization

### Phase 3: Project Generation (Future)
- Template rendering engine
- File system scaffolding
- Dependency installation
- Git initialization

## API Reference

### Registry Functions

- `getPattern(id)` - Get pattern by ID
- `getAllPatterns()` - Get all patterns
- `getPatternsByCategory(category)` - Filter by category
- `getPatternsByComplexity(complexity)` - Filter by complexity
- `getPopularPatterns(limit)` - Get most popular patterns
- `searchPatternsByUseCase(query)` - Search by use case
- `getPatternsByTools(tools)` - Filter by available tools
- `getRecommendedPatterns(criteria)` - Get scored recommendations

### Validation Functions

- `validatePattern(pattern)` - Validate pattern structure
- `validateAllPatterns()` - Validate all registered patterns

## Examples

### Example 1: List all patterns

```typescript
import { getAllPatterns } from '$lib/data/architecture-patterns';

getAllPatterns().forEach(pattern => {
  console.log(`${pattern.icon} ${pattern.displayName}`);
  console.log(`Category: ${pattern.category}`);
  console.log(`Complexity: ${pattern.complexity}`);
  console.log('---');
});
```

### Example 2: Find desktop patterns

```typescript
import { getPatternsByCategory } from '$lib/data/architecture-patterns';

const desktopPatterns = getPatternsByCategory('desktop');
console.log(`Found ${desktopPatterns.length} desktop patterns`);
```

### Example 3: Get recommendations

```typescript
import { getRecommendedPatterns } from '$lib/data/architecture-patterns';

const recs = getRecommendedPatterns({
  category: 'web',
  complexity: 'simple'
});

console.log('Top recommendation:', recs[0].pattern.displayName);
```

## Best Practices

1. **Start with a pattern:** Use existing patterns instead of custom configs
2. **Understand integration:** Know how components communicate
3. **Read documentation:** Each pattern has complete setup guides
4. **Validate patterns:** Use validation functions before deployment
5. **Test thoroughly:** Ensure all components integrate correctly

## Troubleshooting

### Pattern not found?
```typescript
const pattern = getPattern('my-pattern');
if (!pattern) {
  console.error('Pattern not registered');
}
```

### Component dependencies invalid?
```typescript
const errors = validatePattern(myPattern);
if (errors.length > 0) {
  console.error('Validation errors:', errors);
}
```

### Integration not working?
Check the pattern's `integration.protocol` and ensure components use the correct protocol (Tauri IPC, REST API, etc.).

## Further Reading

- [VibeForge Wizard Guide](./wizard.md)
- [Component Types Reference](./components.md)
- [Template Syntax Guide](./templates.md)
- [Custom Pattern Tutorial](./custom-patterns.md)

---

For questions or contributions, see the [Contributing Guide](../CONTRIBUTING.md).
