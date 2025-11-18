<script lang="ts">
  import { theme } from "$lib/stores/themeStore";
  import SettingsHeader from "$lib/components/settings/SettingsHeader.svelte";
  import WorkspaceSettingsSection from "$lib/components/settings/WorkspaceSettingsSection.svelte";
  import AppearanceSettingsSection from "$lib/components/settings/AppearanceSettingsSection.svelte";
  import ModelSettingsSection from "$lib/components/settings/ModelSettingsSection.svelte";
  import DataSettingsSection from "$lib/components/settings/DataSettingsSection.svelte";
</script>

<!-- Settings: workspace defaults, appearance, model config, and data/privacy placeholders -->
<div class="flex-1 flex flex-col max-w-[1920px] mx-auto w-full">
  <div
    class={`border-b px-6 py-4 transition-colors ${
      $theme === "dark" ? "border-slate-700" : "border-slate-200"
    }`}
  >
    <div class="flex flex-col gap-1">
      <h1
        class={`text-base font-semibold tracking-tight ${
          $theme === "dark" ? "text-slate-100" : "text-slate-900"
        }`}
      >
        Settings
      </h1>
      <p
        class={`text-xs ${
          $theme === "dark" ? "text-slate-400" : "text-slate-500"
        }`}
      >
        Manage workspace defaults, appearance, models, and data preferences
      </p>
    </div>
  </div>

  <!-- Main settings content -->
  <main class="flex-1 overflow-y-auto">
    <div class="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-4">
      <SettingsHeader />
      <WorkspaceSettingsSection />
      <AppearanceSettingsSection />
      <ModelSettingsSection />
      <DataSettingsSection />
    </div>
  </main>
</div>
