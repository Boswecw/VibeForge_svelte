<script lang="ts">
  const title = 'Evaluations';
  const subtitle = 'Run systematic tests and score prompt performance.';
</script>

<div class="flex flex-col h-full">
  <div class="border-b border-forge-line px-4 py-3">
    <h1 class="text-sm font-semibold mb-1">{title}</h1>
    <p class="text-[11px] text-forge-textMuted">{subtitle}</p>
  </div>

  <div class="flex-1 overflow-y-auto p-4">
    <div class="border border-dashed border-forge-line rounded-md p-6 text-center">
      <p class="text-xs text-forge-textMuted mb-3">
        Evaluation suite coming soon. You'll be able to:
      </p>
      <ul class="text-xs text-forge-textDim space-y-2 text-left max-w-md mx-auto">
        <li>• Create test suites with multiple prompts and expected outputs</li>
        <li>• Run batch evaluations across different models</li>
        <li>• Score outputs with custom criteria or LLM judges</li>
        <li>• Track prompt performance over time</li>
      </ul>
    </div>
  </div>
</div>
