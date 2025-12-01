/**
 * Browser Extension Architecture Pattern
 *
 * Cross-browser extension with WXT Framework, Manifest V3,
 * Svelte UI, and modern development experience.
 */

import type { ArchitecturePattern } from '$lib/workbench/types/architecture';

// ============================================================================
// TEMPLATES
// ============================================================================

const packageJsonTemplate = `{
  "name": "{{projectName}}",
  "version": "1.0.0",
  "description": "{{description}}",
  "type": "module",
  "scripts": {
    "dev": "wxt",
    "dev:firefox": "wxt -b firefox",
    "build": "wxt build",
    "build:firefox": "wxt build -b firefox",
    "zip": "wxt zip",
    "zip:firefox": "wxt zip -b firefox",
    "type-check": "tsc --noEmit",
    "prepare": "wxt prepare"
  },
  "keywords": ["browser-extension", "chrome-extension", "firefox-addon"],
  "author": "{{author}}",
  "license": "MIT",
  "dependencies": {
    "svelte": "^4.2.8",
    "webextension-polyfill": "^0.10.0"
  },
  "devDependencies": {
    "wxt": "^0.16.0",
    "@sveltejs/vite-plugin-svelte": "^3.0.1",
    "@types/webextension-polyfill": "^0.10.7",
    "typescript": "^5.3.3",
    "vite": "^5.0.10"
  }
}
`;

const wxtConfigTemplate = `import { defineConfig } from 'wxt';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  vite: () => ({
    plugins: [svelte()],
  }),
  manifest: {
    name: '{{projectName}}',
    description: '{{description}}',
    version: '1.0.0',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['<all_urls>'],
  },
});
`;

const tsconfigJsonTemplate = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "types": ["wxt/client", "webextension-polyfill"],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "entrypoints/**/*",
    "components/**/*",
    "utils/**/*"
  ],
  "exclude": ["node_modules", ".output"]
}
`;

const backgroundTemplate = `import browser from 'webextension-polyfill';

export default defineBackground(() => {
  console.log('Background script started');

  // Listen for extension installation
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      console.log('Extension installed');

      // Set default settings
      browser.storage.sync.set({
        enabled: true,
        theme: 'light'
      });
    }
  });

  // Listen for messages from content scripts or popup
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message);

    if (message.type === 'GET_TAB_INFO') {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(tabs => {
          if (tabs[0]) {
            sendResponse({
              title: tabs[0].title,
              url: tabs[0].url
            });
          }
        });
      return true; // Keep message channel open for async response
    }

    if (message.type === 'SAVE_DATA') {
      browser.storage.sync.set({ userData: message.data })
        .then(() => {
          sendResponse({ success: true });
        });
      return true;
    }
  });

  // Listen for tab updates
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      console.log('Tab updated:', tab.url);
    }
  });
});
`;

const contentTemplate = `import browser from 'webextension-polyfill';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('Content script loaded on:', window.location.href);

    // Listen for messages from background or popup
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'HIGHLIGHT_TEXT') {
        highlightText(message.text);
        sendResponse({ success: true });
      }
    });

    // Example: Inject a notification
    function showNotification(text: string) {
      const notification = document.createElement('div');
      notification.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4F46E5;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 999999;
        font-family: system-ui;
      \`;
      notification.textContent = text;
      document.body.appendChild(notification);

      setTimeout(() => notification.remove(), 3000);
    }

    // Example: Highlight text on page
    function highlightText(searchText: string) {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent || '';
        if (text.includes(searchText)) {
          const parent = node.parentElement;
          if (parent) {
            const highlighted = document.createElement('mark');
            highlighted.style.backgroundColor = '#FDE047';
            highlighted.textContent = searchText;

            const parts = text.split(searchText);
            const fragment = document.createDocumentFragment();

            parts.forEach((part, i) => {
              fragment.appendChild(document.createTextNode(part));
              if (i < parts.length - 1) {
                fragment.appendChild(highlighted.cloneNode(true));
              }
            });

            parent.replaceChild(fragment, node);
          }
        }
      }
    }

    // Example: Send data to background
    function sendToBackground(data: any) {
      browser.runtime.sendMessage({
        type: 'SAVE_DATA',
        data
      });
    }
  }
});
`;

const popupHtmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{projectName}}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./popup.ts"></script>
</body>
</html>
`;

const popupTsTemplate = `import './popup.css';
import Popup from '../components/Popup.svelte';

const app = new Popup({
  target: document.getElementById('app')!,
});

export default app;
`;

const popupCssTemplate = `body {
  width: 400px;
  min-height: 300px;
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background: #F9FAFB;
}

#app {
  width: 100%;
  height: 100%;
}
`;

const popupSvelteTemplate = `<script lang="ts">
  import browser from 'webextension-polyfill';
  import { onMount } from 'svelte';

  let enabled = true;
  let theme = 'light';
  let currentTab: { title?: string; url?: string } = {};
  let savedData: string[] = [];

  onMount(async () => {
    // Load settings from storage
    const settings = await browser.storage.sync.get(['enabled', 'theme', 'userData']);
    enabled = settings.enabled ?? true;
    theme = settings.theme ?? 'light';
    savedData = settings.userData ?? [];

    // Get current tab info
    const response = await browser.runtime.sendMessage({ type: 'GET_TAB_INFO' });
    currentTab = response;
  });

  async function toggleEnabled() {
    enabled = !enabled;
    await browser.storage.sync.set({ enabled });
  }

  async function changeTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    await browser.storage.sync.set({ theme });
  }

  async function saveCurrentPage() {
    if (currentTab.url) {
      const newData = [...savedData, currentTab.url];
      await browser.storage.sync.set({ userData: newData });
      savedData = newData;
    }
  }

  async function sendMessageToContent() {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      await browser.tabs.sendMessage(tab.id, {
        type: 'HIGHLIGHT_TEXT',
        text: 'example'
      });
    }
  }
</script>

<div class="popup">
  <div class="header">
    <h1>{{projectName}}</h1>
    <p class="subtitle">{{description}}</p>
  </div>

  <div class="content">
    <!-- Current Tab -->
    <div class="section">
      <h2>Current Tab</h2>
      <div class="tab-info">
        <div class="tab-title">{currentTab.title || 'Loading...'}</div>
        <div class="tab-url">{currentTab.url || ''}</div>
      </div>
    </div>

    <!-- Settings -->
    <div class="section">
      <h2>Settings</h2>

      <div class="setting">
        <span>Extension Enabled</span>
        <label class="switch">
          <input type="checkbox" bind:checked={enabled} on:change={toggleEnabled} />
          <span class="slider"></span>
        </label>
      </div>

      <div class="setting">
        <span>Theme: {theme}</span>
        <button class="btn-secondary" on:click={changeTheme}>
          Toggle Theme
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div class="section">
      <h2>Actions</h2>

      <button class="btn-primary" on:click={saveCurrentPage}>
        Save Current Page
      </button>

      <button class="btn-secondary" on:click={sendMessageToContent}>
        Highlight Text
      </button>
    </div>

    <!-- Saved Data -->
    {#if savedData.length > 0}
      <div class="section">
        <h2>Saved Pages ({savedData.length})</h2>
        <ul class="saved-list">
          {#each savedData as url}
            <li>{url}</li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>

<style>
  .popup {
    padding: 0;
  }

  .header {
    background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
    color: white;
    padding: 20px;
    text-align: center;
  }

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }

  .subtitle {
    margin: 8px 0 0;
    opacity: 0.9;
    font-size: 14px;
  }

  .content {
    padding: 16px;
  }

  .section {
    margin-bottom: 20px;
  }

  .section:last-child {
    margin-bottom: 0;
  }

  h2 {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .tab-info {
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 6px;
    padding: 12px;
  }

  .tab-title {
    font-weight: 500;
    color: #111827;
    margin-bottom: 4px;
  }

  .tab-url {
    font-size: 12px;
    color: #6B7280;
    word-break: break-all;
  }

  .setting {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 6px;
    margin-bottom: 8px;
  }

  .switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 24px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #CBD5E1;
    transition: 0.2s;
    border-radius: 24px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.2s;
    border-radius: 50%;
  }

  input:checked + .slider {
    background-color: #4F46E5;
  }

  input:checked + .slider:before {
    transform: translateX(24px);
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 8px;
  }

  .btn-primary {
    background: #4F46E5;
    color: white;
  }

  .btn-primary:hover {
    background: #4338CA;
  }

  .btn-secondary {
    background: white;
    color: #374151;
    border: 1px solid #E5E7EB;
  }

  .btn-secondary:hover {
    background: #F9FAFB;
  }

  .saved-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .saved-list li {
    padding: 8px 12px;
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 4px;
    margin-bottom: 4px;
    font-size: 12px;
    color: #6B7280;
    word-break: break-all;
  }
</style>
`;

const optionsHtmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{projectName}} - Options</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./options.ts"></script>
</body>
</html>
`;

const optionsTsTemplate = `import './options.css';
import Options from '../components/Options.svelte';

const app = new Options({
  target: document.getElementById('app')!,
});

export default app;
`;

const optionsCssTemplate = `body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background: #F9FAFB;
}

#app {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}
`;

const optionsSvelteTemplate = `<script lang="ts">
  import browser from 'webextension-polyfill';
  import { onMount } from 'svelte';

  let enabled = true;
  let theme = 'light';
  let autoSave = false;
  let notifications = true;
  let saved = false;

  onMount(async () => {
    const settings = await browser.storage.sync.get([
      'enabled',
      'theme',
      'autoSave',
      'notifications'
    ]);

    enabled = settings.enabled ?? true;
    theme = settings.theme ?? 'light';
    autoSave = settings.autoSave ?? false;
    notifications = settings.notifications ?? true;
  });

  async function saveSettings() {
    await browser.storage.sync.set({
      enabled,
      theme,
      autoSave,
      notifications
    });

    saved = true;
    setTimeout(() => { saved = false; }, 2000);
  }

  async function resetSettings() {
    enabled = true;
    theme = 'light';
    autoSave = false;
    notifications = true;
    await saveSettings();
  }
</script>

<div class="options">
  <header>
    <h1>{{projectName}} Options</h1>
    <p>Configure your extension settings</p>
  </header>

  <div class="settings-card">
    <div class="setting-group">
      <h2>General</h2>

      <label>
        <input type="checkbox" bind:checked={enabled} />
        <span>Enable extension</span>
      </label>

      <label>
        <input type="checkbox" bind:checked={notifications} />
        <span>Show notifications</span>
      </label>

      <label>
        <input type="checkbox" bind:checked={autoSave} />
        <span>Auto-save data</span>
      </label>
    </div>

    <div class="setting-group">
      <h2>Appearance</h2>

      <label>
        <span>Theme</span>
        <select bind:value={theme}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto</option>
        </select>
      </label>
    </div>

    <div class="actions">
      <button class="btn-primary" on:click={saveSettings}>
        Save Settings
      </button>
      <button class="btn-secondary" on:click={resetSettings}>
        Reset to Defaults
      </button>
    </div>

    {#if saved}
      <div class="success-message">
        ✓ Settings saved successfully!
      </div>
    {/if}
  </div>
</div>

<style>
  header {
    margin-bottom: 32px;
  }

  h1 {
    font-size: 32px;
    margin: 0 0 8px;
    color: #111827;
  }

  header p {
    color: #6B7280;
    margin: 0;
  }

  .settings-card {
    background: white;
    border-radius: 12px;
    padding: 32px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .setting-group {
    margin-bottom: 32px;
  }

  .setting-group:last-of-type {
    margin-bottom: 24px;
  }

  h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 16px;
    color: #374151;
  }

  label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #F3F4F6;
  }

  label:last-child {
    border-bottom: none;
  }

  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  select {
    padding: 8px 12px;
    border: 1px solid #D1D5DB;
    border-radius: 6px;
    background: white;
    cursor: pointer;
  }

  .actions {
    display: flex;
    gap: 12px;
  }

  .btn-primary,
  .btn-secondary {
    flex: 1;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #4F46E5;
    color: white;
  }

  .btn-primary:hover {
    background: #4338CA;
  }

  .btn-secondary {
    background: white;
    color: #374151;
    border: 1px solid #E5E7EB;
  }

  .btn-secondary:hover {
    background: #F9FAFB;
  }

  .success-message {
    margin-top: 16px;
    padding: 12px;
    background: #D1FAE5;
    color: #065F46;
    border-radius: 6px;
    text-align: center;
  }
</style>
`;

const iconPngTemplate = `// Placeholder for extension icons
// Replace with actual 16x16, 48x48, 128x128 PNG icons
`;

const readmeTemplate = `# {{projectName}}

{{description}}

A cross-browser extension built with WXT Framework, Svelte, and Manifest V3.

## Features

- 🌐 **Cross-browser** - Works on Chrome, Firefox, Edge, Safari
- ⚡ **WXT Framework** - Modern extension development experience
- 🎨 **Svelte UI** - Reactive popup and options page
- 📡 **Message Passing** - Communication between extension contexts
- 💾 **Storage API** - Sync settings across devices
- 🔥 **Hot Reload** - Instant updates during development
- 📦 **Manifest V3** - Latest extension standard

## Quick Start

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Development

**Chrome/Edge:**
\`\`\`bash
npm run dev
\`\`\`

**Firefox:**
\`\`\`bash
npm run dev:firefox
\`\`\`

The extension will automatically reload when you make changes.

### 3. Load Extension

**Chrome:**
1. Open \`chrome://extensions\`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select \`.output/chrome-mv3\` directory

**Firefox:**
1. Open \`about:debugging#/runtime/this-firefox\`
2. Click "Load Temporary Add-on"
3. Select any file in \`.output/firefox-mv3\` directory

## Build for Production

**Chrome/Edge:**
\`\`\`bash
npm run build
npm run zip
\`\`\`

**Firefox:**
\`\`\`bash
npm run build:firefox
npm run zip:firefox
\`\`\`

Output will be in \`.output/\` directory.

## Project Structure

\`\`\`
{{projectName}}/
├── entrypoints/
│   ├── background.ts     # Background service worker
│   ├── content.ts        # Content script
│   ├── popup.html        # Popup UI HTML
│   ├── popup.ts          # Popup entry point
│   ├── options.html      # Options page HTML
│   └── options.ts        # Options entry point
├── components/
│   ├── Popup.svelte      # Popup Svelte component
│   └── Options.svelte    # Options Svelte component
├── public/
│   └── icons/            # Extension icons
├── wxt.config.ts         # WXT configuration
├── package.json
└── tsconfig.json
\`\`\`

## Extension Components

### Background Script

Runs in the background and handles:
- Extension lifecycle events
- Message passing coordination
- Browser API interactions
- Cross-tab communication

### Content Script

Injected into web pages to:
- Modify page content
- Extract data from pages
- Listen for page events
- Communicate with background

### Popup

The extension popup UI that shows when clicking the extension icon:
- Display current tab information
- Toggle extension settings
- Quick actions
- View saved data

### Options Page

Full-page settings interface:
- Configure extension behavior
- Manage preferences
- Advanced settings
- Import/export data

## Storage API

The extension uses Chrome's storage API:

**Save data:**
\`\`\`typescript
await browser.storage.sync.set({ key: 'value' });
\`\`\`

**Load data:**
\`\`\`typescript
const data = await browser.storage.sync.get('key');
\`\`\`

**Listen for changes:**
\`\`\`typescript
browser.storage.onChanged.addListener((changes) => {
  console.log('Storage changed:', changes);
});
\`\`\`

## Message Passing

**From popup/content to background:**
\`\`\`typescript
const response = await browser.runtime.sendMessage({
  type: 'GET_DATA'
});
\`\`\`

**From background to content:**
\`\`\`typescript
await browser.tabs.sendMessage(tabId, {
  type: 'UPDATE_UI',
  data: 'value'
});
\`\`\`

**Listen for messages:**
\`\`\`typescript
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_DATA') {
    sendResponse({ data: 'value' });
  }
  return true; // Keep channel open for async
});
\`\`\`

## Permissions

Update permissions in \`wxt.config.ts\`:

\`\`\`typescript
manifest: {
  permissions: [
    'storage',      // Storage API
    'activeTab',    // Current tab access
    'tabs',         // Tab information
    'notifications' // Show notifications
  ],
  host_permissions: [
    '<all_urls>'    // Access all websites
  ]
}
\`\`\`

## Publishing

### Chrome Web Store

1. Create a developer account
2. Build and zip: \`npm run build && npm run zip\`
3. Upload \`.output/chrome-mv3.zip\`
4. Fill in store listing details
5. Submit for review

### Firefox Add-ons

1. Create a developer account
2. Build and zip: \`npm run build:firefox && npm run zip:firefox\`
3. Upload \`.output/firefox-mv3.zip\`
4. Submit for review

## Development Tips

- **Hot Reload**: Changes to popup/options auto-reload
- **Background Changes**: Requires extension reload
- **Content Script**: Requires page refresh
- **TypeScript**: Full type safety with \`webextension-polyfill\`
- **Debugging**: Use DevTools in popup/options, background console in \`chrome://extensions\`

## License

MIT
`;

// ============================================================================
// BROWSER EXTENSION PATTERN DEFINITION
// ============================================================================

export const browserExtensionPattern: ArchitecturePattern = {
	id: 'browser-extension',
	name: 'browser-extension',
	displayName: 'Browser Extension',
	description: 'Cross-browser extension with WXT Framework, Svelte UI, and Manifest V3',
	category: 'web',
	icon: '🧩',

	components: [
		{
			id: 'extension',
			role: 'frontend',
			name: 'Browser Extension',
			language: 'typescript',
			framework: 'wxt',
			location: '.',
			scaffolding: {
				directories: [
					{
						path: 'entrypoints',
						files: [
							{ path: 'background.ts', content: backgroundTemplate, templateEngine: 'handlebars', overwritable: false },
							{ path: 'content.ts', content: contentTemplate, templateEngine: 'handlebars', overwritable: false },
							{ path: 'popup.html', content: popupHtmlTemplate, templateEngine: 'handlebars', overwritable: false },
							{ path: 'popup.ts', content: popupTsTemplate, templateEngine: 'handlebars', overwritable: false },
							{ path: 'popup.css', content: popupCssTemplate, templateEngine: 'handlebars', overwritable: false },
							{ path: 'options.html', content: optionsHtmlTemplate, templateEngine: 'handlebars', overwritable: false },
							{ path: 'options.ts', content: optionsTsTemplate, templateEngine: 'handlebars', overwritable: false },
							{ path: 'options.css', content: optionsCssTemplate, templateEngine: 'handlebars', overwritable: false }
						]
					},
					{
						path: 'components',
						files: [
							{ path: 'Popup.svelte', content: popupSvelteTemplate, templateEngine: 'handlebars', overwritable: false },
							{ path: 'Options.svelte', content: optionsSvelteTemplate, templateEngine: 'handlebars', overwritable: false }
						]
					},
					{
						path: 'public/icons',
						files: [
							{ path: '.gitkeep', content: '# Add extension icons here (16x16, 48x48, 128x128)', overwritable: false }
						]
					}
				],
				files: [
					{ path: 'package.json', content: packageJsonTemplate, templateEngine: 'handlebars', overwritable: false },
					{ path: 'wxt.config.ts', content: wxtConfigTemplate, templateEngine: 'handlebars', overwritable: false },
					{ path: 'tsconfig.json', content: tsconfigJsonTemplate, templateEngine: 'handlebars', overwritable: false },
					{ path: 'README.md', content: readmeTemplate, templateEngine: 'handlebars', overwritable: false },
					{ path: '.gitignore', content: 'node_modules/\n.output/\n.wxt/\n*.log\n.DS_Store\n', overwritable: false }
				],
				packageFiles: {},
				configFiles: {}
			},
			dependencies: []
		}
	],

	integration: {
		protocol: 'browser-api',
		sharedTypes: false,
		sharedConfig: true,
		generateBindings: []
	},

	complexity: 'intermediate',
	maturity: 'stable',
	popularity: 65,

	idealFor: [
		'Productivity tools',
		'Web scrapers',
		'Content enhancers',
		'Developer tools',
		'Privacy tools',
		'Ad blockers',
		'Page modifiers',
		'Data extractors'
	],

	notIdealFor: [
		'Mobile apps',
		'Desktop applications',
		'Server applications',
		'Native apps',
		'Large data processing'
	],

	prerequisites: {
		tools: ['Node.js 18+', 'Chrome or Firefox'],
		knowledge: [
			'Browser APIs',
			'Extension architecture',
			'Message passing',
			'Content scripts',
			'Manifest V3'
		]
	},

	tags: [
		'browser-extension',
		'chrome-extension',
		'firefox-addon',
		'wxt',
		'svelte',
		'manifest-v3',
		'webextension',
		'cross-browser'
	]
};
