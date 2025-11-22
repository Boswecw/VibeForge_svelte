<script lang="ts">
  import { theme } from "$lib/stores/themeStore";
  import SettingsHeader from "$lib/components/settings/SettingsHeader.svelte";
  import WorkspaceSettingsSection from "$lib/components/settings/WorkspaceSettingsSection.svelte";
  import AppearanceSettingsSection from "$lib/components/settings/AppearanceSettingsSection.svelte";
  import ModelSettingsSection from "$lib/components/settings/ModelSettingsSection.svelte";
  import DataSettingsSection from "$lib/components/settings/DataSettingsSection.svelte";
</script>

<!-- Settings: workspace defaults, appearance, model config, and data/privacy placeholders -->
<main class="flex-1 overflow-hidden flex flex-col bg-forge-blacksteel">
  <div class="border-b px-8 py-6 border-forge-gunmetal">
    <div class="flex flex-col gap-1">
      <h1 class="text-base font-semibold tracking-tight text-slate-100">
        Settings
      </h1>
      <p class="text-xs text-slate-400">
        Manage workspace defaults, appearance, models, and data preferences
      </p>
    </div>
  </div>

  <!-- Main settings content -->
  <div class="flex-1 overflow-y-auto px-8 py-6">
    <div class="max-w-4xl flex flex-col gap-6">
      <SettingsHeader />
      <WorkspaceSettingsSection />
      <AppearanceSettingsSection />
      <ModelSettingsSection />
      <DataSettingsSection />
    </div>
  </div>
</main>
