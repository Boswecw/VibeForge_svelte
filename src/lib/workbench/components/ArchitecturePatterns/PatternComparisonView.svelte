<!--
  PatternComparisonView.svelte

  Side-by-side comparison of architecture patterns.
  Displays key differences and similarities to help users choose.
-->
<script lang="ts">
  import { patternComparison } from '$lib/stores/patternComparison';
  import type { ArchitecturePattern } from '$lib/workbench/types/architecture';
  import type { ArchitecturePatternId } from '$lib/data/architecture-patterns';

  export let onSelect: ((pattern: ArchitecturePattern) => void) | undefined = undefined;

  $: patterns = $patternComparison.patterns;
  $: isOpen = $patternComparison.isOpen;

  function close() {
    patternComparison.close();
  }

  function removePattern(patternId: string) {
    patternComparison.removePattern(patternId as ArchitecturePatternId);
  }

  function selectPattern(pattern: ArchitecturePattern) {
    if (onSelect) {
      onSelect(pattern);
      close();
    }
  }

  function getComplexityLevel(complexity: string): number {
    const levels: Record<string, number> = {
      simple: 1,
      intermediate: 2,
      complex: 3,
      enterprise: 4
    };
    return levels[complexity] || 0;
  }

  function getComplexityDots(complexity: string): string {
    const level = getComplexityLevel(complexity);
    return '●'.repeat(level) + '○'.repeat(4 - level);
  }
</script>

{#if isOpen && patterns.length >= 2}
  <div class="comparison-overlay" on:click={close} role="button" tabindex="-1">
    <div class="comparison-modal" on:click|stopPropagation role="dialog">
      <!-- Header -->
      <div class="header">
        <div>
          <h2>Compare Patterns</h2>
          <p>Choose the best architecture for your project</p>
        </div>
        <button class="close-btn" on:click={close} aria-label="Close comparison">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- Comparison Grid -->
      <div class="comparison-grid">
        {#each patterns as pattern (pattern.id)}
          <div class="pattern-column">
            <!-- Pattern Header -->
            <div class="pattern-header">
              <div class="pattern-icon">{pattern.icon}</div>
              <div class="pattern-title">
                <h3>{pattern.displayName}</h3>
                <p>{pattern.description}</p>
              </div>
              <button
                class="remove-btn"
                on:click={() => removePattern(pattern.id)}
                aria-label="Remove from comparison"
              >
                ×
              </button>
            </div>

            <!-- Comparison Rows -->
            <div class="comparison-rows">
              <!-- Complexity -->
              <div class="row">
                <div class="label">Complexity</div>
                <div class="value">
                  <span class="dots">{getComplexityDots(pattern.complexity)}</span>
                  <span class="text">{pattern.complexity}</span>
                </div>
              </div>

              <!-- Category -->
              <div class="row">
                <div class="label">Category</div>
                <div class="value">
                  <span class="badge">{pattern.category}</span>
                </div>
              </div>

              <!-- Popularity -->
              <div class="row">
                <div class="label">Popularity</div>
                <div class="value">
                  <div class="popularity-bar">
                    <div class="bar-fill" style="width: {pattern.popularity}%"></div>
                  </div>
                  <span class="text">{pattern.popularity}%</span>
                </div>
              </div>

              <!-- Components -->
              <div class="row">
                <div class="label">Components</div>
                <div class="value">
                  <span class="count">{pattern.components.length}</span>
                </div>
              </div>

              <!-- Languages -->
              <div class="row">
                <div class="label">Languages</div>
                <div class="value tags">
                  {#each [...new Set(pattern.components.map(c => c.language))] as lang}
                    <span class="tag">{lang}</span>
                  {/each}
                </div>
              </div>

              <!-- Frameworks -->
              <div class="row">
                <div class="label">Frameworks</div>
                <div class="value tags">
                  {#each [...new Set(pattern.components.map(c => c.framework).filter(Boolean))] as fw}
                    <span class="tag">{fw}</span>
                  {/each}
                </div>
              </div>

              <!-- Ideal For -->
              <div class="row tall">
                <div class="label">Best For</div>
                <div class="value list">
                  <ul>
                    {#each pattern.idealFor.slice(0, 5) as useCase}
                      <li>✓ {useCase}</li>
                    {/each}
                  </ul>
                </div>
              </div>

              <!-- Not Ideal For -->
              <div class="row tall">
                <div class="label">Not For</div>
                <div class="value list">
                  <ul>
                    {#each pattern.notIdealFor.slice(0, 3) as useCase}
                      <li>✗ {useCase}</li>
                    {/each}
                  </ul>
                </div>
              </div>

              <!-- Prerequisites -->
              <div class="row tall">
                <div class="label">Prerequisites</div>
                <div class="value list">
                  <ul>
                    {#each pattern.prerequisites.tools.slice(0, 3) as tool}
                      <li>{tool}</li>
                    {/each}
                  </ul>
                </div>
              </div>
            </div>

            <!-- Select Button -->
            {#if onSelect}
              <button class="select-btn" on:click={() => selectPattern(pattern)}>
                Select {pattern.displayName}
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .comparison-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .comparison-modal {
    background: #18181B;
    border-radius: 12px;
    border: 1px solid #27272A;
    max-width: 1400px;
    width: 100%;
    max-height: 90vh;
    overflow: auto;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 24px;
    border-bottom: 1px solid #27272A;
    position: sticky;
    top: 0;
    background: #18181B;
    z-index: 10;
  }

  .header h2 {
    font-size: 24px;
    font-weight: 600;
    color: #F4F4F5;
    margin: 0 0 4px;
  }

  .header p {
    font-size: 14px;
    color: #A1A1AA;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    color: #A1A1AA;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: #27272A;
    color: #F4F4F5;
  }

  .comparison-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1px;
    background: #27272A;
  }

  .pattern-column {
    background: #18181B;
    display: flex;
    flex-direction: column;
  }

  .pattern-header {
    padding: 20px;
    background: linear-gradient(135deg, #3730A3 0%, #6366F1 100%);
    position: relative;
  }

  .pattern-icon {
    font-size: 40px;
    margin-bottom: 12px;
  }

  .pattern-title h3 {
    font-size: 20px;
    font-weight: 600;
    color: white;
    margin: 0 0 4px;
  }

  .pattern-title p {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
    line-height: 1.4;
  }

  .remove-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 24px;
    width: 28px;
    height: 28px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .remove-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .comparison-rows {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .row {
    padding: 16px 20px;
    border-bottom: 1px solid #27272A;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 60px;
  }

  .row.tall {
    min-height: 120px;
  }

  .label {
    font-size: 11px;
    font-weight: 600;
    color: #A1A1AA;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .value {
    color: #F4F4F5;
    font-size: 14px;
  }

  .dots {
    color: #6366F1;
    font-size: 16px;
    margin-right: 8px;
  }

  .badge {
    display: inline-block;
    padding: 4px 12px;
    background: #27272A;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    color: #A1A1AA;
    text-transform: capitalize;
  }

  .popularity-bar {
    height: 6px;
    background: #27272A;
    border-radius: 3px;
    overflow: hidden;
    flex: 1;
  }

  .bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .value {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .count {
    font-weight: 600;
    color: #6366F1;
  }

  .tags {
    gap: 6px;
  }

  .tag {
    display: inline-block;
    padding: 4px 8px;
    background: #27272A;
    border-radius: 4px;
    font-size: 11px;
    color: #D4D4D8;
    font-family: 'Monaco', 'Courier New', monospace;
  }

  .value.list {
    display: block;
  }

  .value.list ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .value.list li {
    padding: 4px 0;
    font-size: 13px;
    color: #D4D4D8;
  }

  .select-btn {
    margin: 20px;
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

  .select-btn:active {
    transform: translateY(0);
  }

  /* Scrollbar styling */
  .comparison-modal::-webkit-scrollbar {
    width: 8px;
  }

  .comparison-modal::-webkit-scrollbar-track {
    background: #18181B;
  }

  .comparison-modal::-webkit-scrollbar-thumb {
    background: #3F3F46;
    border-radius: 4px;
  }

  .comparison-modal::-webkit-scrollbar-thumb:hover {
    background: #52525B;
  }
</style>
