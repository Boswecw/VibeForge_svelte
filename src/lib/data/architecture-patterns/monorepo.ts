/**
 * Monorepo Architecture Pattern
 *
 * Multi-package repository with Turborepo for parallel builds,
 * shared code, and unified tooling across multiple applications.
 */

import type { ArchitecturePattern } from '$lib/workbench/types/architecture';

// ============================================================================
// TEMPLATES
// ============================================================================

const packageJsonRootTemplate = `{
  "name": "{{projectName}}",
  "version": "1.0.0",
  "private": true,
  "description": "{{description}}",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \\"**/*.{ts,tsx,md,json}\\"",
    "clean": "turbo run clean && rm -rf node_modules",
    "type-check": "turbo run type-check"
  },
  "devDependencies": {
    "turbo": "^1.11.3",
    "prettier": "^3.1.1",
    "@{{projectName}}/typescript-config": "workspace:*"
  },
  "packageManager": "pnpm@8.15.0",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
`;

const turboJsonTemplate = `{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**", ".svelte-kit/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
`;

const pnpmWorkspaceTemplate = `packages:
  - 'apps/*'
  - 'packages/*'
`;

const webAppPackageJsonTemplate = `{
  "name": "@{{projectName}}/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint .",
    "type-check": "svelte-check --tsconfig ./tsconfig.json"
  },
  "dependencies": {
    "@{{projectName}}/ui": "workspace:*",
    "@{{projectName}}/utils": "workspace:*",
    "@sveltejs/kit": "^2.0.0",
    "svelte": "^4.2.8"
  },
  "devDependencies": {
    "@{{projectName}}/typescript-config": "workspace:*",
    "@{{projectName}}/eslint-config": "workspace:*",
    "@sveltejs/vite-plugin-svelte": "^3.0.1",
    "svelte-check": "^3.6.2",
    "typescript": "^5.3.3",
    "vite": "^5.0.10",
    "vitest": "^1.1.0"
  }
}
`;

const adminAppPackageJsonTemplate = `{
  "name": "@{{projectName}}/admin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite dev --port 3001",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint .",
    "type-check": "svelte-check --tsconfig ./tsconfig.json"
  },
  "dependencies": {
    "@{{projectName}}/ui": "workspace:*",
    "@{{projectName}}/utils": "workspace:*",
    "@sveltejs/kit": "^2.0.0",
    "svelte": "^4.2.8"
  },
  "devDependencies": {
    "@{{projectName}}/typescript-config": "workspace:*",
    "@{{projectName}}/eslint-config": "workspace:*",
    "@sveltejs/vite-plugin-svelte": "^3.0.1",
    "svelte-check": "^3.6.2",
    "typescript": "^5.3.3",
    "vite": "^5.0.10",
    "vitest": "^1.1.0"
  }
}
`;

const docsAppPackageJsonTemplate = `{
  "name": "@{{projectName}}/docs",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite dev --port 3002",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@{{projectName}}/ui": "workspace:*",
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/adapter-static": "^3.0.0",
    "svelte": "^4.2.8"
  },
  "devDependencies": {
    "@{{projectName}}/typescript-config": "workspace:*",
    "@sveltejs/vite-plugin-svelte": "^3.0.1",
    "svelte-check": "^3.6.2",
    "typescript": "^5.3.3",
    "vite": "^5.0.10"
  }
}
`;

const uiPackageJsonTemplate = `{
  "name": "@{{projectName}}/ui",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "svelte": "^4.2.8"
  },
  "devDependencies": {
    "@{{projectName}}/typescript-config": "workspace:*",
    "@{{projectName}}/eslint-config": "workspace:*",
    "typescript": "^5.3.3"
  },
  "peerDependencies": {
    "svelte": "^4.0.0"
  }
}
`;

const utilsPackageJsonTemplate = `{
  "name": "@{{projectName}}/utils",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "test": "vitest"
  },
  "devDependencies": {
    "@{{projectName}}/typescript-config": "workspace:*",
    "@{{projectName}}/eslint-config": "workspace:*",
    "typescript": "^5.3.3",
    "vitest": "^1.1.0"
  }
}
`;

const typesPackageJsonTemplate = `{
  "name": "@{{projectName}}/types",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@{{projectName}}/typescript-config": "workspace:*",
    "typescript": "^5.3.3"
  }
}
`;

const tsConfigBaseTemplate = `{
  "name": "@{{projectName}}/typescript-config",
  "version": "1.0.0",
  "main": "index.js",
  "files": [
    "base.json",
    "svelte.json"
  ]
}
`;

const tsConfigBaseJsonTemplate = `{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Default",
  "compilerOptions": {
    "composite": false,
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "inlineSources": false,
    "isolatedModules": true,
    "moduleResolution": "node",
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "preserveWatchOutput": true,
    "skipLibCheck": true,
    "strict": true
  },
  "exclude": ["node_modules"]
}
`;

const tsConfigSvelteJsonTemplate = `{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Svelte",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": true
  }
}
`;

const eslintConfigPackageJsonTemplate = `{
  "name": "@{{projectName}}/eslint-config",
  "version": "1.0.0",
  "main": "index.js",
  "files": [
    "index.js"
  ],
  "dependencies": {
    "@typescript-eslint/eslint-plugin": "^6.17.0",
    "@typescript-eslint/parser": "^6.17.0",
    "eslint-plugin-svelte": "^2.35.1",
    "eslint": "^8.56.0"
  }
}
`;

const eslintConfigIndexTemplate = `module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:svelte/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    extraFileExtensions: ['.svelte']
  },
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    }
  ],
  env: {
    browser: true,
    es2017: true,
    node: true
  }
};
`;

const uiButtonComponentTemplate = `<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'outline' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;

  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50';

  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-100'
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-6 text-lg'
  };

  $: classes = \`\${baseClasses} \${variants[variant]} \${sizes[size]}\`;
</script>

<button class={classes} {disabled} on:click>
  <slot />
</button>
`;

const uiCardComponentTemplate = `<script lang="ts">
  export let title: string | undefined = undefined;
  export let description: string | undefined = undefined;
  export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
</script>

<div class="rounded-lg border border-gray-200 bg-white shadow-sm">
  {#if title || description}
    <div class="border-b border-gray-200 px-6 py-4">
      {#if title}
        <h3 class="text-lg font-semibold text-gray-900">{title}</h3>
      {/if}
      {#if description}
        <p class="mt-1 text-sm text-gray-600">{description}</p>
      {/if}
    </div>
  {/if}
  <div class={paddings[padding]}>
    <slot />
  </div>
</div>
`;

const uiIndexTemplate = `export { default as Button } from './Button.svelte';
export { default as Card } from './Card.svelte';
`;

const utilsIndexTemplate = `export * from './string';
export * from './date';
export * from './validation';
`;

const utilsStringTemplate = `/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate string to specified length
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Convert string to slug format
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\\w\\s-]/g, '')
    .replace(/[\\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
`;

const utilsDateTemplate = `/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format date to human-readable string
 */
export function formatDateLong(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return \`\${interval} \${unit}\${interval !== 1 ? 's' : ''} ago\`;
    }
  }

  return 'just now';
}
`;

const utilsValidationTemplate = `/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate required field
 */
export function isRequired(value: string): boolean {
  return value.trim().length > 0;
}
`;

const typesIndexTemplate = `export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface ApiResponse<T = unknown> {
  data: T;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
`;

const readmeTemplate = `# {{projectName}}

{{description}}

A monorepo managed with Turborepo and pnpm workspaces.

## Structure

\`\`\`
{{projectName}}/
├── apps/
│   ├── web/           # Main web application (SvelteKit)
│   ├── admin/         # Admin dashboard (SvelteKit)
│   └── docs/          # Documentation site (SvelteKit)
├── packages/
│   ├── ui/            # Shared UI components
│   ├── utils/         # Shared utilities
│   └── types/         # Shared TypeScript types
├── tooling/
│   ├── eslint-config/ # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
├── package.json       # Root package.json
├── turbo.json         # Turborepo configuration
└── pnpm-workspace.yaml # pnpm workspace configuration
\`\`\`

## Prerequisites

- Node.js 18+
- pnpm 8+

## Getting Started

### 1. Install Dependencies

\`\`\`bash
pnpm install
\`\`\`

### 2. Development

Start all apps in development mode:

\`\`\`bash
pnpm dev
\`\`\`

Or run specific apps:

\`\`\`bash
# Web app only (http://localhost:5173)
pnpm --filter @{{projectName}}/web dev

# Admin dashboard (http://localhost:3001)
pnpm --filter @{{projectName}}/admin dev

# Docs site (http://localhost:3002)
pnpm --filter @{{projectName}}/docs dev
\`\`\`

### 3. Build

Build all apps:

\`\`\`bash
pnpm build
\`\`\`

### 4. Test

Run tests for all packages:

\`\`\`bash
pnpm test
\`\`\`

## Applications

### Web (\`apps/web\`)

Main user-facing application built with SvelteKit.

### Admin (\`apps/admin\`)

Administrative dashboard for managing the platform.

### Docs (\`apps/docs\`)

Documentation site with guides and API references.

## Shared Packages

### UI (\`packages/ui\`)

Reusable Svelte components:
- Button
- Card
- Input
- Modal
- etc.

Usage:
\`\`\`typescript
import { Button, Card } from '@{{projectName}}/ui';
\`\`\`

### Utils (\`packages/utils\`)

Shared utility functions:
- String manipulation
- Date formatting
- Validation helpers

Usage:
\`\`\`typescript
import { capitalize, formatDate, isValidEmail } from '@{{projectName}}/utils';
\`\`\`

### Types (\`packages/types\`)

Shared TypeScript type definitions:

\`\`\`typescript
import type { User, ApiResponse } from '@{{projectName}}/types';
\`\`\`

## Turborepo Features

### Caching

Turborepo caches build outputs and task results. Subsequent builds are instant if nothing changed.

### Parallel Execution

Run tasks across all packages in parallel:

\`\`\`bash
pnpm build  # Builds all packages in optimal order
\`\`\`

### Dependency Graph

Turborepo understands package dependencies and runs tasks in the correct order.

### Remote Caching

Enable remote caching for team collaboration:

\`\`\`bash
npx turbo login
npx turbo link
\`\`\`

## Common Tasks

### Add a New Package

\`\`\`bash
# Create new package directory
mkdir packages/new-package
cd packages/new-package

# Initialize package.json
pnpm init
\`\`\`

Update \`package.json\` with workspace dependencies.

### Add a Dependency

To a specific package:

\`\`\`bash
pnpm --filter @{{projectName}}/web add lodash
\`\`\`

To all packages:

\`\`\`bash
pnpm add -w lodash
\`\`\`

### Lint and Format

\`\`\`bash
pnpm lint      # Run ESLint
pnpm format    # Run Prettier
\`\`\`

### Type Checking

\`\`\`bash
pnpm type-check  # Run TypeScript compiler
\`\`\`

### Clean

Remove all build artifacts and node_modules:

\`\`\`bash
pnpm clean
\`\`\`

## Development Workflow

1. **Make changes** in any package or app
2. **Run dev** - Turborepo watches and rebuilds dependencies
3. **Test** your changes
4. **Commit** - All related changes in one atomic commit
5. **Push** - CI runs tasks in parallel with caching

## CI/CD

Turborepo integrates with all major CI platforms:

- GitHub Actions
- GitLab CI
- CircleCI
- Jenkins

Example GitHub Actions workflow:

\`\`\`yaml
- name: Install dependencies
  run: pnpm install

- name: Build
  run: pnpm build

- name: Test
  run: pnpm test

- name: Lint
  run: pnpm lint
\`\`\`

Turborepo will cache results between CI runs.

## License

MIT
`;

// ============================================================================
// MONOREPO PATTERN DEFINITION
// ============================================================================

export const monorepoPattern: ArchitecturePattern = {
	id: 'monorepo',
	name: 'monorepo',
	displayName: 'Monorepo (Turborepo)',
	description: 'Multi-package repository with Turborepo for parallel builds and shared code',
	category: 'web',
	icon: '📦',

	components: [
		{
			id: 'web-app',
			role: 'frontend',
			name: 'Web Application',
			language: 'typescript',
			framework: 'sveltekit',
			location: 'apps/web',
			scaffolding: {
				directories: [
					{
						path: 'apps/web/src',
						subdirectories: [
							{ path: 'routes' },
							{ path: 'lib' }
						]
					}
				],
				files: [
					{ path: 'apps/web/package.json', content: webAppPackageJsonTemplate, templateEngine: 'handlebars', overwritable: false }
				],
				packageFiles: {},
				configFiles: {}
			},
			dependencies: [
				{ componentId: 'ui-package', type: 'workspace' },
				{ componentId: 'utils-package', type: 'workspace' }
			]
		},
		{
			id: 'admin-app',
			role: 'frontend',
			name: 'Admin Dashboard',
			language: 'typescript',
			framework: 'sveltekit',
			location: 'apps/admin',
			scaffolding: {
				directories: [
					{
						path: 'apps/admin/src',
						subdirectories: [
							{ path: 'routes' },
							{ path: 'lib' }
						]
					}
				],
				files: [
					{ path: 'apps/admin/package.json', content: adminAppPackageJsonTemplate, templateEngine: 'handlebars', overwritable: false }
				],
				packageFiles: {},
				configFiles: {}
			},
			dependencies: [
				{ componentId: 'ui-package', type: 'workspace' },
				{ componentId: 'utils-package', type: 'workspace' }
			]
		},
		{
			id: 'docs-app',
			role: 'frontend',
			name: 'Documentation Site',
			language: 'typescript',
			framework: 'sveltekit',
			location: 'apps/docs',
			scaffolding: {
				directories: [
					{
						path: 'apps/docs/src',
						subdirectories: [
							{ path: 'routes' },
							{ path: 'lib' }
						]
					}
				],
				files: [
					{ path: 'apps/docs/package.json', content: docsAppPackageJsonTemplate, templateEngine: 'handlebars', overwritable: false }
				],
				packageFiles: {},
				configFiles: {}
			},
			dependencies: [
				{ componentId: 'ui-package', type: 'workspace' }
			]
		},
		{
			id: 'ui-package',
			role: 'library',
			name: 'UI Components',
			language: 'typescript',
			framework: 'svelte',
			location: 'packages/ui',
			scaffolding: {
				directories: [
					{
						path: 'packages/ui/src',
						files: [
							{ path: 'Button.svelte', content: uiButtonComponentTemplate, overwritable: false },
							{ path: 'Card.svelte', content: uiCardComponentTemplate, overwritable: false },
							{ path: 'index.ts', content: uiIndexTemplate, overwritable: false }
						]
					}
				],
				files: [
					{ path: 'packages/ui/package.json', content: uiPackageJsonTemplate, templateEngine: 'handlebars', overwritable: false }
				],
				packageFiles: {},
				configFiles: {}
			},
			dependencies: []
		},
		{
			id: 'utils-package',
			role: 'library',
			name: 'Utilities',
			language: 'typescript',
			framework: null,
			location: 'packages/utils',
			scaffolding: {
				directories: [
					{
						path: 'packages/utils/src',
						files: [
							{ path: 'index.ts', content: utilsIndexTemplate, overwritable: false },
							{ path: 'string.ts', content: utilsStringTemplate, overwritable: false },
							{ path: 'date.ts', content: utilsDateTemplate, overwritable: false },
							{ path: 'validation.ts', content: utilsValidationTemplate, overwritable: false }
						]
					}
				],
				files: [
					{ path: 'packages/utils/package.json', content: utilsPackageJsonTemplate, templateEngine: 'handlebars', overwritable: false }
				],
				packageFiles: {},
				configFiles: {}
			},
			dependencies: []
		},
		{
			id: 'types-package',
			role: 'library',
			name: 'TypeScript Types',
			language: 'typescript',
			framework: null,
			location: 'packages/types',
			scaffolding: {
				directories: [
					{
						path: 'packages/types/src',
						files: [
							{ path: 'index.ts', content: typesIndexTemplate, overwritable: false }
						]
					}
				],
				files: [
					{ path: 'packages/types/package.json', content: typesPackageJsonTemplate, templateEngine: 'handlebars', overwritable: false }
				],
				packageFiles: {},
				configFiles: {}
			},
			dependencies: []
		}
	],

	integration: {
		protocol: 'workspace',
		sharedTypes: true,
		sharedConfig: true,
		generateBindings: ['typescript']
	},

	complexity: 'complex',
	maturity: 'stable',
	popularity: 70,

	idealFor: [
		'Large-scale applications',
		'Product suites',
		'Design systems',
		'Multi-tenant SaaS',
		'Enterprise applications',
		'Microservices frontend',
		'Shared component libraries'
	],

	notIdealFor: [
		'Small projects',
		'Single application',
		'Prototypes',
		'Simple websites',
		'Hobby projects'
	],

	prerequisites: {
		tools: ['Node.js 18+', 'pnpm 8+'],
		knowledge: [
			'Monorepo concepts',
			'Package management',
			'Build systems',
			'TypeScript',
			'SvelteKit/React/Vue'
		]
	},

	tags: [
		'monorepo',
		'turborepo',
		'pnpm',
		'workspaces',
		'multi-package',
		'shared-code',
		'build-system',
		'typescript'
	]
};
