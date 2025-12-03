<!--
  PatternPreviewModal.svelte

  Detailed preview modal for architecture patterns.
  Shows comprehensive information, structure, and examples.
-->
<script lang="ts">
  import type { ArchitecturePattern } from '../../types/architecture';

  export let pattern: ArchitecturePattern | null = null;
  export let onClose: () => void;
  export let onSelect: ((pattern: ArchitecturePattern) => void) | undefined = undefined;

  let activeTab: 'overview' | 'structure' | 'components' | 'prerequisites' = 'overview';

  function handleSelect() {
    if (pattern && onSelect) {
      onSelect(pattern);
      onClose();
    }
  }

  function getComplexityDots(complexity: string): string {
    const levels: Record<string, number> = {
      simple: 1,
      intermediate: 2,
      complex: 3,
      enterprise: 4
    };
    const level = levels[complexity] || 0;
    return '●'.repeat(level) + '○'.repeat(4 - level);
  }

  function getFileTreeFromComponents(pattern: ArchitecturePattern): string {
    const lines: string[] = [];
    const directories = new Set<string>();

    // Collect all directories and files
    pattern.components.forEach(component => {
      if (component.scaffolding?.directories) {
        component.scaffolding.directories.forEach(dir => {
          directories.add(dir.path);
          if (dir.subdirectories) {
            dir.subdirectories.forEach(sub => {
              directories.add(`${dir.path}/${sub.path}`);
            });
          }
        });
      }
    });

    // Sort directories
    const sortedDirs = Array.from(directories).sort();

    lines.push(`${pattern.name}/`);
    sortedDirs.forEach(dir => {
      const depth = dir.split('/').length;
      const indent = '  '.repeat(depth);
      const name = dir.split('/').pop();
      lines.push(`${indent}├── ${name}/`);
    });

    // Add some key files
    lines.push('  ├── package.json');
    lines.push('  ├── tsconfig.json');
    if (pattern.components.some(c => c.framework === 'sveltekit')) {
      lines.push('  ├── svelte.config.js');
      lines.push('  ├── vite.config.ts');
    }
    if (pattern.components.some(c => c.language === 'rust')) {
      lines.push('  ├── Cargo.toml');
    }
    lines.push('  ├── .gitignore');
    lines.push('  └── README.md');

    return lines.join('\n');
  }
</script>

{#if pattern}
  <div class="preview-overlay" on:click={onClose} role="button" tabindex="-1">
    <div class="preview-modal" on:click|stopPropagation role="dialog" aria-modal="true">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <div class="pattern-icon">{pattern.icon}</div>
          <div>
            <h2>{pattern.displayName}</h2>
            <p>{pattern.description}</p>
          </div>
        </div>
        <button class="close-btn" on:click={onClose} aria-label="Close preview">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          class="tab {activeTab === 'overview' ? 'active' : ''}"
          on:click={() => activeTab = 'overview'}
        >
          Overview
        </button>
        <button
          class="tab {activeTab === 'structure' ? 'active' : ''}"
          on:click={() => activeTab = 'structure'}
        >
          Structure
        </button>
        <button
          class="tab {activeTab === 'components' ? 'active' : ''}"
          on:click={() => activeTab = 'components'}
        >
          Components
        </button>
        <button
          class="tab {activeTab === 'prerequisites' ? 'active' : ''}"
          on:click={() => activeTab = 'prerequisites'}
        >
          Prerequisites
        </button>
      </div>

      <!-- Content -->
      <div class="modal-content">
        {#if activeTab === 'overview'}
          <div class="tab-content">
            <!-- Quick Stats -->
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Complexity</div>
                <div class="stat-value">
                  <span class="dots">{getComplexityDots(pattern.complexity)}</span>
                  <span class="capitalize">{pattern.complexity}</span>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-label">Category</div>
                <div class="stat-value">
                  <span class="badge">{pattern.category}</span>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-label">Popularity</div>
                <div class="stat-value">
                  <div class="popularity-bar">
                    <div class="bar-fill" style="width: {pattern.popularity}%"></div>
                  </div>
                  <span>{pattern.popularity}%</span>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-label">Components</div>
                <div class="stat-value count">{pattern.components.length}</div>
              </div>
            </div>

            <!-- Ideal For -->
            <div class="section">
              <h3>✓ Ideal For</h3>
              <ul class="use-case-list ideal">
                {#each pattern.idealFor as useCase}
                  <li>{useCase}</li>
                {/each}
              </ul>
            </div>

            <!-- Not Ideal For -->
            <div class="section">
              <h3>✗ Not Ideal For</h3>
              <ul class="use-case-list not-ideal">
                {#each pattern.notIdealFor as useCase}
                  <li>{useCase}</li>
                {/each}
              </ul>
            </div>

            <!-- Tags -->
            <div class="section">
              <h3>Technologies</h3>
              <div class="tags">
                {#each pattern.tags || [] as tag}
                  <span class="tag">{tag}</span>
                {/each}
              </div>
            </div>
          </div>
        {/if}

        {#if activeTab === 'structure'}
          <div class="tab-content">
            <div class="section">
              <h3>Project Structure</h3>
              <pre class="file-tree">{getFileTreeFromComponents(pattern)}</pre>
            </div>

            <div class="section">
              <h3>Architecture Overview</h3>
              <p class="description">
                This pattern creates a {pattern.components.length}-component architecture with the following structure:
              </p>
              <ul class="architecture-list">
                {#each pattern.components as component}
                  <li>
                    <strong>{component.name}</strong>
                    <span class="component-meta">
                      {component.language}
                      {#if component.framework}
                        • {component.framework}
                      {/if}
                    </span>
                  </li>
                {/each}
              </ul>
            </div>
          </div>
        {/if}

        {#if activeTab === 'components'}
          <div class="tab-content">
            {#each pattern.components as component, i}
              <div class="component-card">
                <div class="component-header">
                  <h3>{i + 1}. {component.name}</h3>
                  <span class="component-role">{component.role}</span>
                </div>

                <div class="component-details">
                  <div class="detail-row">
                    <span class="detail-label">Language:</span>
                    <span class="detail-value">{component.language}</span>
                  </div>
                  {#if component.framework}
                    <div class="detail-row">
                      <span class="detail-label">Framework:</span>
                      <span class="detail-value">{component.framework}</span>
                    </div>
                  {/if}
                  <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value code">{component.location}</span>
                  </div>
                  {#if component.dependencies.length > 0}
                    <div class="detail-row">
                      <span class="detail-label">Dependencies:</span>
                      <span class="detail-value">
                        {component.dependencies.map(d => d.componentId).join(', ')}
                      </span>
                    </div>
                  {/if}
                </div>

                {#if component.scaffolding?.directories && component.scaffolding.directories.length > 0}
                  <div class="component-files">
                    <div class="files-label">Key Files:</div>
                    <ul class="files-list">
                      {#each component.scaffolding.directories.slice(0, 3) as dir}
                        {#if dir.files}
                          {#each dir.files.slice(0, 2) as file}
                            <li>{dir.path}/{file.path}</li>
                          {/each}
                        {/if}
                      {/each}
                    </ul>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}

        {#if activeTab === 'prerequisites'}
          <div class="tab-content">
            <!-- Tools -->
            <div class="section">
              <h3>Required Tools</h3>
              <ul class="prereq-list">
                {#each pattern.prerequisites.tools as tool}
                  <li>
                    <svg class="icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    {tool}
                  </li>
                {/each}
              </ul>
            </div>

            <!-- Knowledge -->
            <div class="section">
              <h3>Recommended Knowledge</h3>
              <ul class="prereq-list">
                {#each pattern.prerequisites.knowledge as knowledge}
                  <li>
                    <svg class="icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
                    </svg>
                    {knowledge}
                  </li>
                {/each}
              </ul>
            </div>

            <!-- Integration -->
            <div class="section">
              <h3>Integration Details</h3>
              <div class="integration-grid">
                <div class="integration-item">
                  <div class="integration-label">Protocol</div>
                  <div class="integration-value">{pattern.integration.protocol}</div>
                </div>
                <div class="integration-item">
                  <div class="integration-label">Shared Types</div>
                  <div class="integration-value">{pattern.integration.sharedTypes ? 'Yes' : 'No'}</div>
                </div>
                <div class="integration-item">
                  <div class="integration-label">Shared Config</div>
                  <div class="integration-value">{pattern.integration.sharedConfig ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <div class="footer-stats">
          <span class="maturity-badge">{pattern.maturity}</span>
          <span class="stat-text">
            {pattern.components.length} components •
            {pattern.tags?.length || 0} technologies
          </span>
        </div>
        {#if onSelect}
          <button class="select-btn" on:click={handleSelect}>
            Select {pattern.displayName}
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .preview-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    z-index: 1001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .preview-modal {
    background: #18181B;
    border-radius: 16px;
    border: 1px solid #27272A;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    padding: 24px;
    border-bottom: 1px solid #27272A;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    background: linear-gradient(135deg, #3730A3 0%, #6366F1 100%);
    border-radius: 16px 16px 0 0;
  }

  .header-content {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  .pattern-icon {
    font-size: 48px;
  }

  .modal-header h2 {
    font-size: 28px;
    font-weight: 600;
    color: white;
    margin: 0 0 6px;
  }

  .modal-header p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
    line-height: 1.5;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: background 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid #27272A;
    padding: 0 24px;
    background: #18181B;
  }

  .tab {
    padding: 12px 20px;
    background: none;
    border: none;
    color: #A1A1AA;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .tab:hover {
    color: #D4D4D8;
  }

  .tab.active {
    color: #6366F1;
    border-bottom-color: #6366F1;
  }

  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  .tab-content {
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: #27272A;
    padding: 16px;
    border-radius: 8px;
  }

  .stat-label {
    font-size: 11px;
    font-weight: 600;
    color: #A1A1AA;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  .stat-value {
    color: #F4F4F5;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dots {
    color: #6366F1;
    font-size: 18px;
  }

  .badge {
    padding: 4px 12px;
    background: #3F3F46;
    border-radius: 12px;
    font-size: 13px;
    text-transform: capitalize;
  }

  .popularity-bar {
    flex: 1;
    height: 6px;
    background: #3F3F46;
    border-radius: 3px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%);
    transition: width 0.3s ease;
  }

  .count {
    color: #6366F1;
    font-size: 24px;
  }

  .section {
    margin-bottom: 24px;
  }

  .section h3 {
    font-size: 16px;
    font-weight: 600;
    color: #F4F4F5;
    margin: 0 0 12px;
  }

  .use-case-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 8px;
  }

  .use-case-list li {
    padding: 10px 12px;
    background: #27272A;
    border-radius: 6px;
    font-size: 13px;
    color: #D4D4D8;
  }

  .use-case-list.ideal li::before {
    content: '✓ ';
    color: #10B981;
    margin-right: 6px;
  }

  .use-case-list.not-ideal li::before {
    content: '✗ ';
    color: #EF4444;
    margin-right: 6px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tag {
    padding: 6px 12px;
    background: #27272A;
    border-radius: 6px;
    font-size: 12px;
    color: #D4D4D8;
    font-family: 'Monaco', 'Courier New', monospace;
  }

  .file-tree {
    background: #0D1117;
    color: #C9D1D9;
    padding: 16px;
    border-radius: 8px;
    font-size: 13px;
    font-family: 'Monaco', 'Courier New', monospace;
    overflow-x: auto;
    line-height: 1.6;
  }

  .description {
    color: #A1A1AA;
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .architecture-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .architecture-list li {
    padding: 12px;
    background: #27272A;
    border-radius: 6px;
    margin-bottom: 8px;
  }

  .architecture-list strong {
    color: #F4F4F5;
    display: block;
    margin-bottom: 4px;
  }

  .component-meta {
    font-size: 12px;
    color: #A1A1AA;
  }

  .component-card {
    background: #27272A;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .component-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .component-header h3 {
    font-size: 16px;
    color: #F4F4F5;
    margin: 0;
  }

  .component-role {
    padding: 4px 10px;
    background: #3F3F46;
    border-radius: 12px;
    font-size: 11px;
    color: #A1A1AA;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .component-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .detail-row {
    display: flex;
    gap: 8px;
    font-size: 13px;
  }

  .detail-label {
    color: #A1A1AA;
    min-width: 100px;
  }

  .detail-value {
    color: #D4D4D8;
  }

  .detail-value.code {
    font-family: 'Monaco', 'Courier New', monospace;
    color: #6366F1;
  }

  .component-files {
    padding-top: 12px;
    border-top: 1px solid #3F3F46;
  }

  .files-label {
    font-size: 11px;
    font-weight: 600;
    color: #A1A1AA;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .files-list {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 12px;
    font-family: 'Monaco', 'Courier New', monospace;
    color: #D4D4D8;
  }

  .files-list li {
    padding: 4px 0;
  }

  .prereq-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .prereq-list li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: #27272A;
    border-radius: 6px;
    margin-bottom: 8px;
    color: #D4D4D8;
    font-size: 14px;
  }

  .prereq-list .icon {
    color: #10B981;
    flex-shrink: 0;
  }

  .integration-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .integration-item {
    background: #27272A;
    padding: 12px;
    border-radius: 6px;
  }

  .integration-label {
    font-size: 11px;
    font-weight: 600;
    color: #A1A1AA;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .integration-value {
    color: #D4D4D8;
    font-size: 14px;
    font-weight: 500;
  }

  .modal-footer {
    padding: 20px 24px;
    border-top: 1px solid #27272A;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #18181B;
    border-radius: 0 0 16px 16px;
  }

  .footer-stats {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .maturity-badge {
    padding: 6px 12px;
    background: #10B981;
    color: white;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    text-transform: capitalize;
  }

  .stat-text {
    font-size: 13px;
    color: #A1A1AA;
  }

  .select-btn {
    padding: 12px 24px;
    background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .select-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
  }

  .capitalize {
    text-transform: capitalize;
  }

  /* Scrollbar */
  .modal-content::-webkit-scrollbar {
    width: 8px;
  }

  .modal-content::-webkit-scrollbar-track {
    background: #18181B;
  }

  .modal-content::-webkit-scrollbar-thumb {
    background: #3F3F46;
    border-radius: 4px;
  }

  .modal-content::-webkit-scrollbar-thumb:hover {
    background: #52525B;
  }
</style>
