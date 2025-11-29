<!--
  StepComponentConfig.svelte

  Wizard step for configuring individual components in the selected architecture pattern.
  Allows customization of language, framework, location, and per-component features.
-->
<script lang="ts">
  import type { ProjectConfig } from '../../../types/project';
  import type { ComponentConfig } from '../../../types/wizard';
  import type { ProjectComponent } from '../../../types/architecture';

  interface Props {
    config: ProjectConfig;
  }

  let { config }: Props = $props();

  // Expanded component for accordion
  let expandedComponent = $state<string | null>(null);

  function toggleComponent(componentId: string) {
    expandedComponent = expandedComponent === componentId ? null : componentId;
  }

  // Get or create component config
  function getComponentConfig(componentId: string): ComponentConfig {
    let componentConfig = config.componentConfigs.get(componentId);

    if (!componentConfig) {
      componentConfig = {
        componentId,
        includeTests: true,
        includeDocker: false,
        includeCi: false,
      };
      config.componentConfigs.set(componentId, componentConfig);
    }

    return componentConfig;
  }

  // Update component config
  function updateComponentConfig(componentId: string, updates: Partial<ComponentConfig>) {
    const current = getComponentConfig(componentId);
    config.componentConfigs.set(componentId, { ...current, ...updates });
  }

  // Get role icon
  function getRoleIcon(component: ProjectComponent): string {
    const icons: Record<string, string> = {
      backend: '🔧',
      frontend: '🎨',
      mobile: '📱',
      cli: '⌨️',
      library: '📚',
      database: '🗄️',
      infrastructure: '☁️',
      'ml-backend': '🤖',
      'api-gateway': '🚪'
    };
    return icons[component.role] || '📦';
  }

  // Get component dependencies display
  function getDependenciesText(component: ProjectComponent): string {
    if (component.dependencies.length === 0) return 'No dependencies';
    return component.dependencies
      .map(dep => {
        const depComp = config.architecturePattern?.components.find(c => c.id === dep.componentId);
        return depComp?.name || dep.componentId;
      })
      .join(', ');
  }
</script>

{#if !config.architecturePattern}
  <!-- No pattern selected - show info -->
  <div class="text-center py-12">
    <svg class="w-16 h-16 mx-auto text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <p class="text-zinc-400 mb-2">No architecture pattern selected</p>
    <p class="text-sm text-zinc-500">
      This step is only available when using multi-component patterns.
    </p>
  </div>
{:else}
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold text-zinc-100 mb-2">
        Configure Components
      </h2>
      <p class="text-sm text-zinc-400">
        Customize each component in your <span class="font-medium text-ember-400">{config.architecturePattern.displayName}</span> project
      </p>
    </div>

    <!-- Pattern Overview -->
    <div class="bg-gunmetal-900 border border-gunmetal-700 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <div class="text-3xl">{config.architecturePattern.icon}</div>
        <div class="flex-1">
          <h3 class="font-semibold text-zinc-100">{config.architecturePattern.displayName}</h3>
          <p class="text-sm text-zinc-400 mt-1">{config.architecturePattern.description}</p>
          <div class="flex items-center gap-4 mt-2 text-xs text-zinc-500">
            <span>{config.architecturePattern.components.length} components</span>
            <span>•</span>
            <span class="capitalize">{config.architecturePattern.complexity} complexity</span>
            <span>•</span>
            <span>{config.architecturePattern.integration.protocol} integration</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Components Configuration -->
    <div class="space-y-3">
      <h3 class="text-sm font-semibold text-zinc-300">Components</h3>

      {#each config.architecturePattern.components as component}
        {@const componentConfig = getComponentConfig(component.id)}
        {@const isExpanded = expandedComponent === component.id}

        <div class="border border-gunmetal-700 rounded-lg overflow-hidden bg-gunmetal-900">
          <!-- Component Header (Accordion Toggle) -->
          <button
            type="button"
            class="w-full p-4 flex items-center justify-between hover:bg-gunmetal-800 transition-colors"
            onclick={() => toggleComponent(component.id)}
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl" aria-hidden="true">{getRoleIcon(component)}</span>
              <div class="text-left">
                <div class="font-medium text-zinc-100">
                  {component.name}
                  <span class="ml-2 text-xs text-zinc-500 capitalize">({component.role})</span>
                </div>
                <div class="text-xs text-zinc-400 mt-0.5">
                  {component.framework} • {component.language}
                </div>
              </div>
            </div>

            <svg
              class="w-5 h-5 text-zinc-400 transition-transform {isExpanded ? 'rotate-180' : ''}"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Component Configuration (Expandable) -->
          {#if isExpanded}
            <div class="border-t border-gunmetal-700 p-4 space-y-4 bg-gunmetal-950">
              <!-- Description -->
              <p class="text-sm text-zinc-400">{component.description}</p>

              <!-- Dependencies -->
              {#if component.dependencies.length > 0}
                <div>
                  <label class="block text-xs font-medium text-zinc-400 mb-2">Dependencies</label>
                  <div class="text-sm text-zinc-300 bg-gunmetal-900 border border-gunmetal-700 rounded-lg p-3">
                    {getDependenciesText(component)}
                  </div>
                </div>
              {/if}

              <!-- Location -->
              <div>
                <label for="{component.id}-location" class="block text-xs font-medium text-zinc-400 mb-2">
                  Location in Project
                </label>
                <input
                  id="{component.id}-location"
                  type="text"
                  value={componentConfig.location || component.location}
                  oninput={(e) => updateComponentConfig(component.id, { location: (e.target as HTMLInputElement).value })}
                  placeholder={component.location}
                  class="
                    w-full px-3 py-2 rounded-lg
                    bg-gunmetal-900 border border-gunmetal-700
                    text-zinc-100 placeholder:text-zinc-600 text-sm
                    focus:outline-none focus:border-ember-500 focus:ring-2 focus:ring-ember-500/50
                    transition-all
                  "
                />
              </div>

              <!-- Features -->
              <div>
                <label class="block text-xs font-medium text-zinc-400 mb-2">Features</label>
                <div class="space-y-2">
                  <!-- Testing -->
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={componentConfig.includeTests}
                      onchange={(e) => updateComponentConfig(component.id, { includeTests: (e.target as HTMLInputElement).checked })}
                      class="
                        w-4 h-4 rounded
                        bg-gunmetal-900 border-gunmetal-700
                        text-ember-600 focus:ring-ember-500
                      "
                    />
                    <span class="text-sm text-zinc-300">Include testing framework</span>
                  </label>

                  <!-- Docker -->
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={componentConfig.includeDocker}
                      onchange={(e) => updateComponentConfig(component.id, { includeDocker: (e.target as HTMLInputElement).checked })}
                      class="
                        w-4 h-4 rounded
                        bg-gunmetal-900 border-gunmetal-700
                        text-ember-600 focus:ring-ember-500
                      "
                    />
                    <span class="text-sm text-zinc-300">Include Docker configuration</span>
                  </label>

                  <!-- CI/CD -->
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={componentConfig.includeCi}
                      onchange={(e) => updateComponentConfig(component.id, { includeCi: (e.target as HTMLInputElement).checked })}
                      class="
                        w-4 h-4 rounded
                        bg-gunmetal-900 border-gunmetal-700
                        text-ember-600 focus:ring-ember-500
                      "
                    />
                    <span class="text-sm text-zinc-300">Include CI/CD configuration</span>
                  </label>
                </div>
              </div>

              <!-- Commands Preview -->
              <div>
                <label class="block text-xs font-medium text-zinc-400 mb-2">Commands</label>
                <div class="bg-gunmetal-900 border border-gunmetal-700 rounded-lg p-3 space-y-2 text-xs font-mono">
                  {#if component.commands.dev}
                    <div><span class="text-zinc-500">Dev:</span> <span class="text-zinc-300">{component.commands.dev.join(' ')}</span></div>
                  {/if}
                  {#if component.commands.build}
                    <div><span class="text-zinc-500">Build:</span> <span class="text-zinc-300">{component.commands.build.join(' ')}</span></div>
                  {/if}
                  {#if component.commands.test}
                    <div><span class="text-zinc-500">Test:</span> <span class="text-zinc-300">{component.commands.test.join(' ')}</span></div>
                  {/if}
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Integration Info -->
    <div class="bg-blue-900/10 border border-blue-800 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
        <div class="flex-1">
          <h4 class="text-sm font-semibold text-blue-400 mb-1">Component Integration</h4>
          <p class="text-xs text-zinc-400">
            Components will communicate via <span class="font-medium text-blue-300">{config.architecturePattern.integration.protocol}</span>.
            {#if config.architecturePattern.integration.sharedTypes}
              Shared type definitions will be generated automatically.
            {/if}
          </p>
        </div>
      </div>
    </div>
  </div>
{/if}
