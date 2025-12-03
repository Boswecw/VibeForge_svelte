<!--
  StepConfig.svelte

  Step 4: Configure features, team size, and timeline
-->
<script lang="ts">
  import { wizardStore } from '../../../stores/wizard.svelte';
  import type { Timeline, FeatureSelection } from '../../../types/wizard';

  const commonFeatures = [
    { key: 'authentication', label: 'Authentication', icon: '🔐', description: 'User login and auth system' },
    { key: 'database', label: 'Database', icon: '💾', description: 'Data persistence layer' },
    { key: 'api', label: 'REST API', icon: '🔌', description: 'Backend API endpoints' },
    { key: 'testing', label: 'Testing', icon: '🧪', description: 'Unit and integration tests' },
    { key: 'docker', label: 'Docker', icon: '🐳', description: 'Containerization setup' },
    { key: 'ci', label: 'CI/CD', icon: '🔄', description: 'Continuous integration' },
    { key: 'monitoring', label: 'Monitoring', icon: '📊', description: 'Logging and metrics' },
  ];

  const timelines: { value: Timeline; label: string; description: string }[] = [
    { value: 'sprint', label: '1-2 Weeks', description: 'Quick sprint or MVP' },
    { value: 'month', label: '1 Month', description: 'Standard project timeline' },
    { value: 'quarter', label: '3 Months', description: 'Full-featured product' },
    { value: 'year', label: '6-12 Months', description: 'Long-term development' },
  ];

  // Reactive bindings to wizard store
  let features = $state<FeatureSelection>({ ...wizardStore.config.features });
  let teamSize = $state(typeof wizardStore.config.teamSize === 'number' ? wizardStore.config.teamSize : 1);
  let timeline = $state(wizardStore.config.timeline || '');

  // Sync to store on change
  $effect(() => {
    wizardStore.config.features = features;
  });

  $effect(() => {
    wizardStore.config.teamSize = teamSize;
  });

  $effect(() => {
    wizardStore.config.timeline = timeline;
  });

  function toggleFeature(key: string): void {
    features = {
      ...features,
      [key]: !features[key],
    };
  }

  const enabledCount = $derived(Object.values(features).filter(Boolean).length);
</script>

<div class="space-y-6">
  <!-- Features -->
  <div>
    <h3 class="text-sm font-medium text-zinc-300 mb-3">
      Project Features
    </h3>
    <p class="text-xs text-zinc-500 mb-4">
      Select features to include in your project setup
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {#each commonFeatures as feature}
        {@const isEnabled = features[feature.key] === true}
        <button
          type="button"
          class="
            flex items-start gap-3 p-3
            rounded-lg border text-left transition-all
            {isEnabled
              ? 'bg-blue-600/20 border-blue-500'
              : 'bg-gunmetal-800 border-gunmetal-700 hover:border-gunmetal-600'}
          "
          on:click={() => toggleFeature(feature.key)}
        >
          <div class="flex-shrink-0 mt-0.5">
            <div
              class="
                w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                {isEnabled
                  ? 'bg-blue-600 border-blue-500'
                  : 'border-gunmetal-600'}
              "
            >
              {#if isEnabled}
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </div>
          </div>

          <div class="flex-1">
            <div class="flex items-center gap-2 mb-0.5">
              <span class="text-lg">{feature.icon}</span>
              <p class="text-sm font-medium {isEnabled ? 'text-blue-400' : 'text-zinc-300'}">
                {feature.label}
              </p>
            </div>
            <p class="text-xs text-zinc-500">{feature.description}</p>
          </div>
        </button>
      {/each}
    </div>

    {#if enabledCount > 0}
      <p class="mt-2 text-xs text-zinc-500">
        {enabledCount} feature{enabledCount !== 1 ? 's' : ''} selected
      </p>
    {/if}
  </div>

  <!-- Team Size -->
  <div>
    <h3 class="text-sm font-medium text-zinc-300 mb-3">
      Team Size
    </h3>
    <div class="flex items-center gap-4">
      <button
        type="button"
        class="p-2 rounded-lg bg-gunmetal-800 border border-gunmetal-700 hover:bg-gunmetal-700 disabled:opacity-50"
        disabled={teamSize <= 1}
        on:click={() => teamSize = Math.max(1, teamSize - 1)}
        aria-label="Decrease team size"
      >
        <svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
        </svg>
      </button>

      <div class="flex-1 text-center">
        <div class="text-2xl font-bold text-zinc-100">{teamSize}</div>
        <div class="text-xs text-zinc-500">
          {teamSize === 1 ? 'Solo developer' : `${teamSize} developers`}
        </div>
      </div>

      <button
        type="button"
        class="p-2 rounded-lg bg-gunmetal-800 border border-gunmetal-700 hover:bg-gunmetal-700 disabled:opacity-50"
        disabled={teamSize >= 50}
        on:click={() => teamSize = Math.min(50, teamSize + 1)}
        aria-label="Increase team size"
      >
        <svg class="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  </div>

  <!-- Timeline -->
  <div>
    <h3 class="text-sm font-medium text-zinc-300 mb-3">
      Timeline
    </h3>
    <div class="grid grid-cols-2 gap-2">
      {#each timelines as timelineOption}
        {@const isSelected = timeline === timelineOption.value}
        <button
          type="button"
          class="
            flex flex-col p-3
            rounded-lg border text-left transition-all
            {isSelected
              ? 'bg-ember-600/20 border-ember-500 ring-2 ring-ember-500/50'
              : 'bg-gunmetal-800 border-gunmetal-700 hover:border-gunmetal-600'}
          "
          on:click={() => timeline = timelineOption.value}
        >
          <span class="text-sm font-medium {isSelected ? 'text-ember-400' : 'text-zinc-300'}">
            {timelineOption.label}
          </span>
          <span class="text-xs text-zinc-500 mt-0.5">{timelineOption.description}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Summary -->
  <div class="p-4 bg-gunmetal-800/50 border border-gunmetal-700 rounded-lg">
    <h4 class="text-xs font-medium text-zinc-400 mb-2">Configuration Summary</h4>
    <div class="space-y-1 text-xs text-zinc-400">
      <p>
        <span class="text-zinc-500">Features:</span> {enabledCount} selected
      </p>
      <p>
        <span class="text-zinc-500">Team Size:</span> {teamSize} {teamSize === 1 ? 'developer' : 'developers'}
      </p>
      <p>
        <span class="text-zinc-500">Timeline:</span> {timelines.find(t => t.value === timeline)?.label}
      </p>
    </div>
  </div>
</div>
