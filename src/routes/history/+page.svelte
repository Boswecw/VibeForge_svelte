<script lang="ts">
  const title = 'History';
  const subtitle = 'View and replay past workbench runs.';
</script>

<div class="flex flex-col h-full">
  <div class="border-b border-forge-line px-4 py-3">
    <h1 class="text-sm font-semibold mb-1">{title}</h1>
    <p class="text-[11px] text-forge-textMuted">{subtitle}</p>
  </div>

  <div class="flex-1 overflow-y-auto p-4">
    <div class="border border-dashed border-forge-line rounded-md p-6 text-center">
      <p class="text-xs text-forge-textMuted mb-3">
        History tracking coming soon. You'll be able to:
      </p>
      <ul class="text-xs text-forge-textDim space-y-2 text-left max-w-md mx-auto">
        <li>• View all past prompt runs with timestamps</li>
        <li>• Filter by model, context, or result quality</li>
        <li>• Replay and compare historical runs</li>
        <li>• Export runs for documentation or analysis</li>
      </ul>
    </div>
  </div>
</div>
