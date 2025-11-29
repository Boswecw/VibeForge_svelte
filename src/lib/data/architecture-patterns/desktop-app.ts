/**
 * Desktop Application Architecture Pattern
 *
 * Cross-platform desktop app with Rust/Tauri backend and SvelteKit frontend.
 * Uses Tauri IPC for native system access with modern web UI.
 *
 * @example Cortex, VS Code, Obsidian
 */

import type { ArchitecturePattern } from '$lib/workbench/types/architecture';

// ============================================================================
// TEMPLATE STRINGS (referenced by scaffolding)
// ============================================================================

// These templates will be moved to separate .hbs files in Phase 3
// For now, they're defined as constants

const tauriMainTemplate = `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
{{#if includeDatabase}}
mod db;
{{/if}}

use tauri::Manager;

#[tokio::main]
async fn main() {
    {{#if includeDatabase}}
    let db = db::init_database().await
        .expect("Failed to initialize database");
    {{/if}}

    tauri::Builder::default()
        {{#if includeDatabase}}
        .manage(db)
        {{/if}}
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            {{#if includeDatabase}}
            commands::get_data,
            commands::save_data,
            {{/if}}
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}`;

const cargoTomlTemplate = `[package]
name = "{{projectName}}"
version = "0.1.0"
description = "{{projectDescription}}"
edition = "2021"

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = ["unstable"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
{{#if includeDatabase}}
rusqlite = { version = "0.31", features = ["bundled"] }
{{/if}}

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]`;

const tauriConfigTemplate = `{
  "$schema": "https://schema.tauri.app/config/2.0.0",
  "productName": "{{projectName}}",
  "version": "0.1.0",
  "identifier": "com.{{projectName}}.dev",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../build"
  },
  "app": {
    "windows": [
      {
        "title": "{{projectName}}",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": null
    }
  }
}`;

const packageJsonTemplate = `{
  "name": "{{projectName}}",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "tauri": "tauri"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-shell": "^2.0.0"
  },
  "devDependencies": {
    "@sveltejs/adapter-static": "^3.0.0",
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "svelte": "^5.0.0",
    "svelte-check": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "@tauri-apps/cli": "^2.0.0"
  }
}`;

const svelteConfigTemplate = `import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
};

export default config;`;

// ============================================================================
// DESKTOP APP PATTERN DEFINITION
// ============================================================================

/**
 * Complete desktop application architecture pattern
 *
 * Components:
 * - Rust/Tauri backend for native system access
 * - TypeScript/SvelteKit frontend for modern UI
 *
 * Integration: Tauri IPC commands
 */
export const desktopAppPattern: ArchitecturePattern = {
	id: 'desktop-app',
	name: 'desktop-app',
	displayName: 'Desktop Application',
	description: 'Cross-platform desktop app with native backend and modern web UI',
	category: 'desktop',
	icon: '🖥️',

	components: [
		// ========================================================================
		// BACKEND COMPONENT (Rust/Tauri)
		// ========================================================================
		{
			id: 'backend',
			role: 'backend',
			name: 'Backend',
			description: 'Rust/Tauri backend with native system access',
			language: 'rust',
			framework: 'tauri',
			location: 'src-tauri',
			dependencies: [],

			scaffolding: {
				directories: [
					{
						path: 'src',
						description: 'Rust source code',
						subdirectories: [
							{ path: 'commands', description: 'Tauri command handlers' },
							{ path: 'db', description: 'Database operations' },
							{ path: 'models', description: 'Data models' }
						]
					}
				],

				files: [
					{
						path: 'src/main.rs',
						content: tauriMainTemplate,
						templateEngine: 'handlebars',
						overwritable: false
					},
					{
						path: 'Cargo.toml',
						content: cargoTomlTemplate,
						templateEngine: 'handlebars',
						overwritable: false
					},
					{
						path: 'tauri.conf.json',
						content: tauriConfigTemplate,
						templateEngine: 'handlebars',
						overwritable: false
					},
					{
						path: 'src/commands/mod.rs',
						content: `use tauri::command;

#[command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}`,
						templateEngine: 'none',
						overwritable: true
					},
					{
						path: 'build.rs',
						content: `fn main() {
    tauri_build::build()
}`,
						templateEngine: 'none',
						overwritable: false
					}
				],

				packageFiles: {
					'Cargo.toml': {
						package: {
							name: '{{projectName}}',
							version: '0.1.0',
							edition: '2021'
						},
						dependencies: {
							tauri: { version: '2.0', features: ['unstable'] },
							serde: { version: '1.0', features: ['derive'] },
							serde_json: '1.0',
							tokio: { version: '1', features: ['full'] },
							rusqlite: { version: '0.31', features: ['bundled'] }
						}
					}
				},

				configFiles: {}
			},

			commands: {
				install: ['cargo fetch'],
				dev: ['cargo tauri dev'],
				build: ['cargo tauri build'],
				test: ['cargo test']
			}
		},

		// ========================================================================
		// FRONTEND COMPONENT (TypeScript/SvelteKit)
		// ========================================================================
		{
			id: 'frontend',
			role: 'frontend',
			name: 'Frontend',
			description: 'SvelteKit web UI with Tauri integration',
			language: 'typescript',
			framework: 'sveltekit',
			location: 'src',
			dependencies: [
				{
					componentId: 'backend',
					type: 'required',
					relationship: 'calls'
				}
			],

			scaffolding: {
				directories: [
					{
						path: 'routes',
						description: 'SvelteKit routes',
						files: [
							{
								path: '+page.svelte',
								content: `<script lang="ts">
	import { invoke } from '@tauri-apps/api/core';

	let name = '';
	let greetMsg = '';

	async function greet() {
		greetMsg = await invoke('greet', { name });
	}
</script>

<main>
	<h1>Welcome to {{projectName}}</h1>

	<div class="row">
		<input
			id="greet-input"
			placeholder="Enter a name..."
			bind:value={name}
		/>
		<button on:click={greet}>Greet</button>
	</div>

	{#if greetMsg}
		<p>{greetMsg}</p>
	{/if}
</main>

<style>
	main {
		text-align: center;
		padding: 2rem;
	}

	.row {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin: 2rem 0;
	}
</style>`,
								templateEngine: 'handlebars',
								overwritable: true
							}
						]
					},
					{
						path: 'lib',
						description: 'Shared libraries',
						subdirectories: [
							{ path: 'components', description: 'Reusable Svelte components' },
							{ path: 'stores', description: 'Svelte stores' },
							{ path: 'utils', description: 'Utility functions' }
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
						content: `import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [svelte()],
	clearScreen: false,
	server: {
		port: 5173,
		strictPort: true,
		watch: {
			ignored: ['**/src-tauri/**']
		}
	}
});`,
						templateEngine: 'none',
						overwritable: false
					},
					{
						path: 'tsconfig.json',
						content: `{
	"extends": "./.svelte-kit/tsconfig.json",
	"compilerOptions": {
		"allowJs": true,
		"checkJs": true,
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"resolveJsonModule": true,
		"skipLibCheck": true,
		"sourceMap": true,
		"strict": true,
		"moduleResolution": "bundler"
	}
}`,
						templateEngine: 'none',
						overwritable: false
					}
				],

				packageFiles: {
					'package.json': {
						name: '{{projectName}}',
						version: '0.1.0',
						type: 'module',
						scripts: {
							dev: 'vite dev',
							build: 'vite build',
							tauri: 'tauri'
						},
						dependencies: {
							'@tauri-apps/api': '^2.0.0',
							'@tauri-apps/plugin-shell': '^2.0.0'
						},
						devDependencies: {
							'@sveltejs/adapter-static': '^3.0.0',
							'@sveltejs/kit': '^2.0.0',
							'@sveltejs/vite-plugin-svelte': '^4.0.0',
							svelte: '^5.0.0',
							'svelte-check': '^4.0.0',
							typescript: '^5.0.0',
							vite: '^5.0.0',
							'@tauri-apps/cli': '^2.0.0'
						}
					}
				},

				configFiles: {}
			},

			commands: {
				install: ['npm install'],
				dev: ['npm run dev'],
				build: ['npm run build'],
				test: ['npm test']
			}
		}
	],

	// ==========================================================================
	// INTEGRATION CONFIGURATION
	// ==========================================================================
	integration: {
		protocol: 'tauri-commands',
		sharedTypes: true,
		sharedConfig: false,
		generateBindings: [
			{
				from: 'backend',
				to: 'frontend',
				format: 'typescript'
			}
		]
	},

	// ==========================================================================
	// PATTERN METADATA
	// ==========================================================================
	complexity: 'intermediate',
	maturity: 'stable',
	popularity: 85,

	idealFor: [
		'Desktop applications',
		'Native system access required',
		'File management tools',
		'Developer tools',
		'Local-first applications',
		'Cross-platform native apps'
	],

	notIdealFor: [
		'Web-only applications',
		'Mobile apps',
		'Server-side services',
		'Cloud-first applications'
	],

	examples: [
		'VS Code',
		'Obsidian',
		'File explorers',
		'Dev tools',
		'Cortex'
	],

	// ==========================================================================
	// PREREQUISITES
	// ==========================================================================
	prerequisites: {
		tools: ['Rust', 'Node.js', 'cargo', 'npm or pnpm'],
		skills: ['Basic Rust', 'TypeScript', 'SvelteKit basics'],
		timeEstimate: '4-8 hours setup'
	},

	// ==========================================================================
	// DOCUMENTATION
	// ==========================================================================
	documentation: {
		quickStart: `# Quick Start

## 1. Install dependencies

\`\`\`bash
# Install Rust dependencies
cd src-tauri && cargo fetch

# Install Node dependencies
npm install
\`\`\`

## 2. Run in development

\`\`\`bash
npm run tauri dev
\`\`\`

This will:
- Start the Vite dev server (frontend)
- Build and run the Tauri app (backend + window)
- Open developer tools automatically

## 3. Build for production

\`\`\`bash
npm run tauri build
\`\`\`

Outputs platform-specific bundles in \`src-tauri/target/release\`.
`,

		architecture: `# Architecture

## Components

### Backend (Rust/Tauri)
- **Native system access** via Tauri commands
- **SQLite database** for local storage (optional)
- **Fast, memory-safe** operations with Rust
- **Async runtime** with Tokio

### Frontend (SvelteKit)
- **Modern reactive UI** with Svelte 5
- **TypeScript** for type safety
- **Vite** for fast builds and HMR
- **Static adapter** for Tauri embedding

## Communication

**Tauri IPC (Inter-Process Communication)**
- Type-safe command bindings
- Async/await pattern
- Frontend calls backend via \`invoke()\`
- Backend exposes commands via \`#[tauri::command]\`

## Example Flow

\`\`\`
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
\`\`\`
`,

		deployment: `# Deployment

## Building

\`\`\`bash
npm run tauri build
\`\`\`

## Platform-specific outputs

### macOS
- \`src-tauri/target/release/bundle/macos/\`
- \`.app\` bundle
- \`.dmg\` installer

### Windows
- \`src-tauri/target/release/bundle/msi/\`
- \`.exe\` executable
- \`.msi\` installer

### Linux
- \`src-tauri/target/release/bundle/deb/\`
- \`.deb\` package
- \`.AppImage\` portable

## Code Signing

For distribution, configure code signing in \`tauri.conf.json\`:

\`\`\`json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name"
    },
    "windows": {
      "certificateThumbprint": "..."
    }
  }
}
\`\`\`
`,

		troubleshooting: `# Troubleshooting

## Build fails?

**Check Rust installation:**
\`\`\`bash
rustc --version
cargo --version
\`\`\`

**Update Rust:**
\`\`\`bash
rustup update
\`\`\`

## Tauri commands not working?

1. **Check command is registered** in \`src-tauri/src/main.rs\`:
   \`\`\`rust
   .invoke_handler(tauri::generate_handler![
       commands::your_command  // <- Add here
   ])
   \`\`\`

2. **Verify allowlist** in \`tauri.conf.json\` (v1 only):
   \`\`\`json
   {
     "tauri": {
       "allowlist": {
         "all": true
       }
     }
   }
   \`\`\`

3. **Check frontend import**:
   \`\`\`typescript
   import { invoke } from '@tauri-apps/api/core';
   \`\`\`

## Dev window blank?

- Ensure Vite dev server is running
- Check port 5173 is available
- Verify \`devUrl\` in \`tauri.conf.json\` matches Vite port

## Hot reload not working?

- Tauri watches \`src-tauri/src/\` for backend changes
- Vite watches \`src/\` for frontend changes
- Both should auto-reload independently
`
	}
};
