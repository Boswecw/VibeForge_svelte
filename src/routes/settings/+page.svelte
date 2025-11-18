<script lang="ts">
  const title = 'Settings';
  const subtitle = 'Configure workspaces, API keys, and preferences.';
</script>

<div class="flex flex-col h-full">
  <div class="border-b border-forge-line px-4 py-3">
    <h1 class="text-sm font-semibold mb-1">{title}</h1>
    <p class="text-[11px] text-forge-textMuted">{subtitle}</p>
  </div>

  <div class="flex-1 overflow-y-auto p-4">
    <div class="border border-dashed border-forge-line rounded-md p-6 text-center">
      <p class="text-xs text-forge-textMuted mb-3">
        Settings coming soon. You'll be able to configure:
      </p>
      <ul class="text-xs text-forge-textDim space-y-2 text-left max-w-md mx-auto">
        <li>• API keys for Claude, OpenAI, and local models</li>
        <li>• Workspace preferences and defaults</li>
        <li>• Theme customization (light/dark, accent colors)</li>
        <li>• Data export and import settings</li>
      </ul>
    </div>
  </div>
</div>
