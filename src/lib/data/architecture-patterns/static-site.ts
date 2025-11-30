/**
 * Static Site Pattern
 *
 * Static site generator using SvelteKit with adapter-static.
 * Perfect for blogs, documentation, portfolios, and marketing sites.
 *
 * @example Blogs, docs sites, portfolios, landing pages
 */

import type { ArchitecturePattern } from '$lib/workbench/types/architecture';

// ============================================================================
// TEMPLATE STRINGS
// ============================================================================

const packageJsonTemplate = `{
  "name": "{{projectName}}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"
  },
  "devDependencies": {
    "@sveltejs/adapter-static": "^3.0.0",
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "svelte": "^5.0.0",
    "svelte-check": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  },
  "type": "module"
}`;

const svelteConfigTemplate = `import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
\tpreprocess: vitePreprocess(),
\tkit: {
\t\tadapter: adapter({
\t\t\tpages: 'build',
\t\t\tassets: 'build',
\t\t\tfallback: undefined,
\t\t\tprecompress: false,
\t\t\tstrict: true
\t\t})
\t}
};

export default config;`;

const homePageTemplate = `<script lang="ts">
\tconst title = '{{projectName}}';
\tconst description = '{{projectDescription}}';
</script>

<svelte:head>
\t<title>{title}</title>
\t<meta name="description" content={description} />
</svelte:head>

<main>
\t<h1>{title}</h1>
\t<p>{description}</p>

\t<section class="links">
\t\t<a href="/about">About</a>
\t\t<a href="/blog">Blog</a>
\t</section>
</main>

<style>
\tmain {
\t\tmax-width: 800px;
\t\tmargin: 0 auto;
\t\tpadding: 2rem;
\t}

\th1 {
\t\tfont-size: 3rem;
\t\tmargin-bottom: 1rem;
\t}

\t.links {
\t\tdisplay: flex;
\t\tgap: 1rem;
\t\tmargin-top: 2rem;
\t}

\ta {
\t\tpadding: 0.5rem 1rem;
\t\tbackground: #667eea;
\t\tcolor: white;
\t\ttext-decoration: none;
\t\tborder-radius: 4px;
\t}
</style>`;

const aboutPageTemplate = `<script lang="ts">
\tconst title = 'About';
</script>

<svelte:head>
\t<title>{title} - {{projectName}}</title>
</svelte:head>

<main>
\t<h1>{title}</h1>
\t<p>This is the about page for {{projectName}}.</p>
\t<a href="/">← Back to home</a>
</main>

<style>
\tmain {
\t\tmax-width: 800px;
\t\tmargin: 0 auto;
\t\tpadding: 2rem;
\t}
</style>`;

const layoutTemplate = `<script lang="ts">
\timport '../app.css';
\tlet { children } = $props();
</script>

<div class="layout">
\t<header>
\t\t<nav>
\t\t\t<a href="/">{{projectName}}</a>
\t\t</nav>
\t</header>

\t<div class="content">
\t\t{@render children()}
\t</div>

\t<footer>
\t\t<p>© {new Date().getFullYear()} {{projectName}}</p>
\t</footer>
</div>

<style>
\t.layout {
\t\tdisplay: flex;
\t\tflex-direction: column;
\t\tmin-height: 100vh;
\t}

\theader {
\t\tpadding: 1rem 2rem;
\t\tbackground: #667eea;
\t\tcolor: white;
\t}

\tnav a {
\t\tcolor: white;
\t\ttext-decoration: none;
\t\tfont-weight: bold;
\t}

\t.content {
\t\tflex: 1;
\t}

\tfooter {
\t\tpadding: 2rem;
\t\ttext-align: center;
\t\tbackground: #f5f5f5;
\t}
</style>`;

const appCssTemplate = `* {
\tbox-sizing: border-box;
\tmargin: 0;
\tpadding: 0;
}

body {
\tfont-family: system-ui, -apple-system, sans-serif;
\tline-height: 1.6;
\tcolor: #333;
}`;

// ============================================================================
// STATIC SITE PATTERN DEFINITION
// ============================================================================

export const staticSitePattern: ArchitecturePattern = {
	id: 'static-site',
	name: 'static-site',
	displayName: 'Static Site (SSG)',
	description: 'Static site generator with SvelteKit',
	category: 'web',
	icon: '📄',

	components: [
		// ========================================================================
		// FRONTEND COMPONENT (SvelteKit Static)
		// ========================================================================
		{
			id: 'frontend',
			role: 'frontend',
			name: 'Static Site',
			description: 'SvelteKit static site generator',
			language: 'typescript',
			framework: 'sveltekit',
			location: '.',
			dependencies: [],

			scaffolding: {
				directories: [
					{
						path: 'src',
						description: 'Source code',
						subdirectories: [
							{
								path: 'routes',
								description: 'Pages and routes',
								files: [
									{
										path: '+page.svelte',
										content: homePageTemplate,
										templateEngine: 'handlebars',
										overwritable: false
									},
									{
										path: '+layout.svelte',
										content: layoutTemplate,
										templateEngine: 'handlebars',
										overwritable: false
									}
								],
								subdirectories: [
									{
										path: 'about',
										description: 'About page',
										files: [
											{
												path: '+page.svelte',
												content: aboutPageTemplate,
												templateEngine: 'handlebars',
												overwritable: false
											}
										]
									}
								]
							},
							{
								path: 'lib',
								description: 'Shared components and utilities'
							}
						],
						files: [
							{
								path: 'app.css',
								content: appCssTemplate,
								templateEngine: 'none',
								overwritable: false
							},
							{
								path: 'app.html',
								content: `<!doctype html>
<html lang="en">
\t<head>
\t\t<meta charset="utf-8" />
\t\t<meta name="viewport" content="width=device-width, initial-scale=1" />
\t\t%sveltekit.head%
\t</head>
\t<body data-sveltekit-preload-data="hover">
\t\t<div style="display: contents">%sveltekit.body%</div>
\t</body>
</html>`,
								templateEngine: 'none',
								overwritable: false
							}
						]
					},
					{
						path: 'static',
						description: 'Static assets',
						subdirectories: [
							{ path: 'images', description: 'Images' },
							{ path: 'fonts', description: 'Fonts' }
						],
						files: [
							{
								path: 'robots.txt',
								content: `User-agent: *
Allow: /`,
								templateEngine: 'none',
								overwritable: false
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
						path: 'svelte.config.js',
						content: svelteConfigTemplate,
						templateEngine: 'none',
						overwritable: false
					},
					{
						path: 'vite.config.ts',
						content: `import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
\tplugins: [sveltekit()]
});`,
						templateEngine: 'none',
						overwritable: false
					},
					{
						path: 'tsconfig.json',
						content: `{
\t"extends": "./.svelte-kit/tsconfig.json",
\t"compilerOptions": {
\t\t"allowJs": true,
\t\t"checkJs": true,
\t\t"esModuleInterop": true,
\t\t"forceConsistentCasingInFileNames": true,
\t\t"resolveJsonModule": true,
\t\t"skipLibCheck": true,
\t\t"sourceMap": true,
\t\t"strict": true,
\t\t"moduleResolution": "bundler"
\t}
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
	popularity: 85,

	idealFor: [
		'Blogs and content sites',
		'Documentation sites',
		'Portfolios',
		'Landing pages',
		'Marketing websites'
	],

	notIdealFor: [
		'Dynamic web applications',
		'Real-time applications',
		'User authentication required',
		'Database-driven sites'
	],

	examples: [
		'Personal blog',
		'Company website',
		'Product documentation',
		'Portfolio site'
	],

	// ==========================================================================
	// PREREQUISITES
	// ==========================================================================
	prerequisites: {
		tools: ['Node.js 18+'],
		skills: ['HTML', 'CSS', 'Basic JavaScript/TypeScript', 'Svelte'],
		timeEstimate: '30 minutes setup'
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

Visit http://localhost:5173

## 3. Build for production

\`\`\`bash
npm run build
\`\`\`

Static files will be in \`build/\` directory
`,

		architecture: `# Architecture

## Static Site Generation (SSG)

### Build Process
1. SvelteKit pre-renders all routes at build time
2. Generates static HTML/CSS/JS files
3. No server required for hosting
4. SEO-friendly by default

### Directory Structure

\`\`\`
.
├── src/
│   ├── routes/           # Pages (auto-routing)
│   │   ├── +page.svelte  # Home page
│   │   ├── +layout.svelte # Shared layout
│   │   └── about/
│   │       └── +page.svelte # About page
│   ├── lib/              # Shared components
│   └── app.css           # Global styles
├── static/               # Static assets
└── build/                # Output (after build)
\`\`\`

### Routing

SvelteKit uses file-based routing:
- \`src/routes/+page.svelte\` → \`/\`
- \`src/routes/about/+page.svelte\` → \`/about\`
- \`src/routes/blog/[slug]/+page.svelte\` → \`/blog/:slug\`
`,

		deployment: `# Deployment

## Static Hosting (Free Options)

### Netlify
\`\`\`bash
npm run build
netlify deploy --dir=build --prod
\`\`\`

### Vercel
\`\`\`bash
npm run build
vercel --prod
\`\`\`

### GitHub Pages
\`\`\`bash
npm run build
# Push build/ directory to gh-pages branch
\`\`\`

### Cloudflare Pages
- Connect GitHub repo
- Build command: \`npm run build\`
- Output directory: \`build\`

## Custom Server

Serve the \`build/\` directory with any static file server:
\`\`\`bash
npx serve build
\`\`\`
`,

		troubleshooting: `# Troubleshooting

## Prerendering errors?

Ensure all routes can be statically generated:
- No dynamic \`load\` functions using request data
- No server-side only code in \`+page.svelte\`
- Use \`export const prerender = true\` if needed

## 404 on deployed site?

Configure your host's fallback/redirect rules:
- Netlify: Add \`_redirects\` file
- Vercel: Configure in \`vercel.json\`

## Styles not loading?

Check \`svelte.config.js\` paths configuration and ensure adapter-static is properly configured
`
	}
};
