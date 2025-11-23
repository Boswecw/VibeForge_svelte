<!-- @component
### Props
- `! runtimes` **RuntimeStatus[]**
- `onSave` **(overrides: ToolchainOverride[]) =► void**

no description yet
-->
<script lang="ts">
  import type { RuntimeStatus } from "$lib/api/runtimeClient";

  interface ToolchainOverride {
    runtimeId: string;
    customPath: string;
  }

  interface Props {
    runtimes: RuntimeStatus[];
    onSave?: (overrides: ToolchainOverride[]) => void;
  }

  let { runtimes, onSave }: Props = $props();

  let overrides = $state<Record<string, string>>({});
  let showForm = $state(false);

  function handleSave() {
    const overrideList: ToolchainOverride[] = Object.entries(overrides)
      .filter(([_, path]) => path.trim() !== "")
      .map(([runtimeId, customPath]) => ({ runtimeId, customPath }));

    onSave?.(overrideList);
    showForm = false;
  }

  function handleCancel() {
    overrides = {};
    showForm = false;
  }

  const configurableRuntimes = $derived(
    runtimes.filter((r) => !r.notes?.includes("Container-only"))
  );
</script>

<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
  <div class="flex items-center justify-between mb-4">
    <div>
      <h3 class="text-lg font-semibold text-gray-900">
        Manual Toolchain Configuration
      </h3>
      <p class="mt-1 text-sm text-gray-600">
        Override automatic runtime detection by specifying custom paths
      </p>
    </div>
    {#if !showForm}
      <button
        onclick={() => (showForm = true)}
        class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
      >
        Configure Paths
      </button>
    {/if}
  </div>

  {#if showForm}
    <div class="space-y-4">
      <div class="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <div class="flex gap-3">
          <span class="text-xl">💡</span>
          <div class="text-sm text-blue-900">
            <p class="font-medium">Manual Path Configuration</p>
            <p class="mt-1 text-blue-700">
              If VibeForge cannot automatically detect a runtime, you can
              specify the full path to the executable here. Leave blank to use
              automatic detection.
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-3 max-h-96 overflow-y-auto">
        {#each configurableRuntimes as runtime}
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <label
                for={`path-${runtime.id}`}
                class="block text-sm font-medium text-gray-900"
              >
                {runtime.name}
                {#if runtime.required}
                  <span class="text-red-600">*</span>
                {/if}
              </label>
              {#if runtime.path}
                <p class="text-xs text-gray-500 mt-0.5">
                  Current: <code class="font-mono">{runtime.path}</code>
                </p>
              {/if}
            </div>
            <div class="flex-[2]">
              <input
                type="text"
                id={`path-${runtime.id}`}
                bind:value={overrides[runtime.id]}
                placeholder={runtime.path || "/usr/bin/..."}
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </div>
        {/each}
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onclick={handleCancel}
          class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onclick={handleSave}
          class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          Save Configuration
        </button>
      </div>
    </div>
  {:else}
    <div class="text-center py-8 text-gray-500">
      <p class="text-sm">No custom toolchain paths configured.</p>
      <p class="text-xs mt-1">
        Click "Configure Paths" to add manual overrides.
      </p>
    </div>
  {/if}
</div>
