/**
 * Single Page Application (SPA) Pattern
 *
 * Client-side rendered app using Vite + Svelte.
 * Perfect for interactive web applications with external APIs.
 *
 * @example Admin dashboards, web apps, client-side tools
 */

import type { ArchitecturePattern } from '$lib/workbench/types/architecture';

// ============================================================================
// TEMPLATE STRINGS
// ============================================================================

const packageJsonTemplate = `{
  "name": "{{projectName}}",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "@tsconfig/svelte": "^5.0.0",
    "svelte": "^5.0.0",
    "svelte-check": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}`;

const mainTsTemplate = `import './app.css'
import App from './App.svelte'

const app = new App({
  target: document.getElementById('app')!,
})

export default app`;

const appSvelteTemplate = `<script lang="ts">
\timport Counter from './lib/Counter.svelte';
\t
\tconst title = '{{projectName}}';
</script>

<main>
\t<h1>{title}</h1>
\t<p>{{projectDescription}}</p>
\t
\t<Counter />
</main>

<style>
\tmain {
\t\ttext-align: center;
\t\tpadding: 2rem;
\t\tmax-width: 800px;
\t\tmargin: 0 auto;
\t}
\t
\th1 {
\t\tcolor: #667eea;
\t\tfont-size: 3rem;
\t\tmargin-bottom: 1rem;
\t}
</style>`;

const counterComponentTemplate = `<script lang="ts">
\tlet count = $state(0);
\t
\tfunction increment() {
\t\tcount += 1;
\t}
</script>

<div class="counter">
\t<button on:click={increment}>
\t\tCount: {count}
\t</button>
</div>

<style>
\t.counter {
\t\tmargin-top: 2rem;
\t}
\t
\tbutton {
\t\tpadding: 1rem 2rem;
\t\tfont-size: 1.2rem;
\t\tbackground: #667eea;
\t\tcolor: white;
\t\tborder: none;
\t\tborder-radius: 8px;
\t\tcursor: pointer;
\t\ttransition: background 0.2s;
\t}
\t
\tbutton:hover {
\t\tbackground: #5568d3;
\t}
</style>`;

const indexHtmlTemplate = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{projectName}}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`;

const appCssTemplate = `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  min-width: 320px;
  min-height: 100vh;
}`;

// ============================================================================
// SPA PATTERN DEFINITION
// ============================================================================

export const spaPattern: ArchitecturePattern = {
	id: 'spa',
	name: 'spa',
	displayName: 'Single Page Application',
	description: 'Client-side app with Vite + Svelte',
	category: 'web',
	icon: '⚡',

	components: [
		// ========================================================================
		// FRONTEND COMPONENT (Vite + Svelte)
		// ========================================================================
		{
			id: 'frontend',
			role: 'frontend',
			name: 'SPA Frontend',
			description: 'Vite-powered Svelte application',
			language: 'typescript',
			framework: 'svelte',
			location: '.',
			dependencies: [],

			scaffolding: {
				directories: [
					{
						path: 'src',
						description: 'Source code',
						subdirectories: [
							{
								path: 'lib',
								description: 'Components and utilities',
								files: [
									{
										path: 'Counter.svelte',
										content: counterComponentTemplate,
										templateEngine: 'none',
										overwritable: false
									}
								]
							}
						],
						files: [
							{
								path: 'main.ts',
								content: mainTsTemplate,
								templateEngine: 'none',
								overwritable: false
							},
							{
								path: 'App.svelte',
								content: appSvelteTemplate,
								templateEngine: 'handlebars',
								overwritable: false
							},
							{
								path: 'app.css',
								content: appCssTemplate,
								templateEngine: 'none',
								overwritable: false
							},
							{
								path: 'vite-env.d.ts',
								content: `/// <reference types="vite/client" />`,
								templateEngine: 'none',
								overwritable: false
							}
						]
					},
					{
						path: 'public',
						description: 'Static assets',
						files: [
							{
								path: 'favicon.ico',
								content: '',
								templateEngine: 'none',
								overwritable: true
							}
						]
					}
				],

				files: [
					{
						path: 'package.json',
						content: packageJsonTemplate,
						templateEngine: 'handlebars',
						overwritable: false
					},
					{
						path: 'index.html',
						content: indexHtmlTemplate,
						templateEngine: 'handlebars',
						overwritable: false
					},
					{
						path: 'vite.config.ts',
						content: `import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 3000
  }
})`,
						templateEngine: 'none',
						overwritable: false
					},
					{
						path: 'tsconfig.json',
						content: `{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*.ts", "src/**/*.svelte"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`,
						templateEngine: 'none',
						overwritable: false
					},
					{
						path: 'tsconfig.node.json',
						content: `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`,
						templateEngine: 'none',
						overwritable: false
					},
					{
						path: 'svelte.config.js',
						content: `import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  preprocess: vitePreprocess(),
}`,
						templateEngine: 'none',
						overwritable: false
					}
				],

				packageFiles: {},
				configFiles: {}
			},

			commands: {
				install: ['npm install'],
				dev: ['npm run dev'],
				build: ['npm run build'],
				test: ['npm run check']
			}
		}
	],

	// ==========================================================================
	// INTEGRATION CONFIGURATION
	// ==========================================================================
	integration: {
		protocol: 'rest-api',
		sharedTypes: false,
		sharedConfig: false,
		generateBindings: []
	},

	// ==========================================================================
	// PATTERN METADATA
	// ==========================================================================
	complexity: 'simple',
	maturity: 'stable',
	popularity: 90,

	idealFor: [
		'Interactive web applications',
		'Admin dashboards',
		'Client-side tools',
		'Web-based utilities',
		'API consumption'
	],

	notIdealFor: [
		'SEO-critical sites (use SSG/SSR)',
		'Content-heavy sites',
		'Sites requiring server-side logic',
		'Progressive Web Apps (use SvelteKit)'
	],

	examples: [
		'Task management app',
		'Data visualization dashboard',
		'Calculator/converter tools',
		'Admin panel for API'
	],

	// ==========================================================================
	// PREREQUISITES
	// ==========================================================================
	prerequisites: {
		tools: ['Node.js 18+'],
		skills: ['HTML', 'CSS', 'JavaScript/TypeScript', 'Svelte basics'],
		timeEstimate: '15 minutes setup'
	},

	// ==========================================================================
	// DOCUMENTATION
	// ==========================================================================
	documentation: {
		quickStart: `# Quick Start

## 1. Install dependencies

\`\`\`bash
npm install
\`\`\`

## 2. Run development server

\`\`\`bash
npm run dev
\`\`\`

Visit http://localhost:3000

## 3. Build for production

\`\`\`bash
npm run build
\`\`\`

Output will be in \`dist/\` directory
`,

		architecture: `# Architecture

## Client-Side Rendering (CSR)

### How it Works
1. Server sends minimal HTML + JavaScript bundle
2. JavaScript hydrates the DOM
3. App runs entirely in the browser
4. API calls made from client

### Directory Structure

\`\`\`
.
├── public/              # Static assets
├── src/
│   ├── lib/             # Components
│   ├── App.svelte       # Root component
│   ├── main.ts          # Entry point
│   └── app.css          # Global styles
├── index.html           # HTML shell
└── dist/                # Build output
\`\`\`

### State Management

Using Svelte 5 runes:
\`\`\`svelte
<script lang="ts">
  let count = $state(0);
  let doubled = $derived(count * 2);

  $effect(() => {
    console.log('Count changed:', count);
  });
</script>
\`\`\`

### API Integration

\`\`\`typescript
async function fetchData() {
  const response = await fetch('https://api.example.com/data');
  return await response.json();
}
\`\`\`
`,

		deployment: `# Deployment

## Static Hosting

The built app is just HTML/CSS/JS files, host anywhere:

### Netlify
\`\`\`bash
npm run build
netlify deploy --dir=dist --prod
\`\`\`

### Vercel
\`\`\`bash
npm run build
vercel --prod
\`\`\`

### GitHub Pages
\`\`\`bash
npm run build
# Push dist/ to gh-pages branch
\`\`\`

### Nginx
\`\`\`nginx
server {
  listen 80;
  root /var/www/app/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
\`\`\`

## Environment Variables

Use \`.env\` files:
\`\`\`
VITE_API_URL=https://api.example.com
\`\`\`

Access in code:
\`\`\`typescript
const apiUrl = import.meta.env.VITE_API_URL;
\`\`\`
`,

		troubleshooting: `# Troubleshooting

## Blank page after build?

Check browser console for errors. Common issues:
- Incorrect base path in \`vite.config.ts\`
- CORS errors from API
- Missing environment variables

## Slow development server?

- Clear Vite cache: \`rm -rf node_modules/.vite\`
- Update dependencies: \`npm update\`

## TypeScript errors?

Run type checking:
\`\`\`bash
npx svelte-check
\`\`\`

## API requests failing?

- Check CORS configuration on API server
- Verify API URL in environment variables
- Check network tab in browser DevTools
`
	}
};
