<!-- @component
### Props
- `! runtimes` **RuntimeStatus[]**
- `category` **"frontend" | "backend" | "systems" | "mobile" | "all"** = `all`
- `onShowInstructions` **(runtimeId: string) =► void**

no description yet
-->
<script lang="ts">
  import type { RuntimeStatus } from "$lib/api/runtimeClient";

  interface Props {
    runtimes: RuntimeStatus[];
    category?: "frontend" | "backend" | "systems" | "mobile" | "all";
    onShowInstructions?: (runtimeId: string) => void;
  }

  let { runtimes, category = "all", onShowInstructions }: Props = $props();

  const filteredRuntimes = $derived(
    category === "all"
      ? runtimes
      : runtimes.filter((r) => r.category === category)
  );

  function getStatusIcon(runtime: RuntimeStatus): string {
    if (runtime.notes?.includes("Container-only")) return "🐳";
    if (runtime.installed) return "✅";
    if (runtime.required) return "❌";
    return "⚠️";
  }

  function getStatusColor(runtime: RuntimeStatus): string {
    if (runtime.notes?.includes("Container-only")) return "text-blue-600";
    if (runtime.installed) return "text-green-600";
    if (runtime.required) return "text-red-600";
    return "text-yellow-600";
  }

  function getStatusText(runtime: RuntimeStatus): string {
    if (runtime.notes?.includes("Container-only")) return "Container Only";
    if (runtime.installed) return "Installed";
    if (runtime.required) return "Required - Missing";
    return "Not Installed";
  }

  function formatLastChecked(timestamp?: number): string {
    if (!timestamp) return "Never";
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
</script>

<div
  class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm"
>
  <table class="w-full text-sm text-left">
    <thead class="bg-gray-50 text-xs uppercase text-gray-700">
      <tr>
        <th class="px-6 py-3">Status</th>
        <th class="px-6 py-3">Runtime</th>
        <th class="px-6 py-3">Version</th>
        <th class="px-6 py-3">Path</th>
        <th class="px-6 py-3">Last Checked</th>
        <th class="px-6 py-3">Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each filteredRuntimes as runtime}
        <tr class="border-b hover:bg-gray-50">
          <td class="px-6 py-4">
            <div class="flex items-center gap-2">
              <span class="text-2xl">{getStatusIcon(runtime)}</span>
              <span class={`font-medium ${getStatusColor(runtime)}`}>
                {getStatusText(runtime)}
              </span>
            </div>
          </td>
          <td class="px-6 py-4">
            <div>
              <div class="font-medium text-gray-900">{runtime.name}</div>
              <div class="text-gray-500 text-xs capitalize">
                {runtime.category}
              </div>
            </div>
          </td>
          <td class="px-6 py-4">
            {#if runtime.version}
              <code
                class="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-800"
              >
                {runtime.version}
              </code>
            {:else}
              <span class="text-gray-400">—</span>
            {/if}
          </td>
          <td class="px-6 py-4 max-w-xs truncate">
            {#if runtime.path}
              <code class="text-xs font-mono text-gray-600">{runtime.path}</code
              >
            {:else if runtime.notes}
              <span class="text-gray-500 text-xs italic">{runtime.notes}</span>
            {:else}
              <span class="text-gray-400">—</span>
            {/if}
          </td>
          <td class="px-6 py-4 text-gray-500 text-xs">
            {formatLastChecked(runtime.last_checked)}
          </td>
          <td class="px-6 py-4">
            {#if !runtime.installed}
              <button
                onclick={() => onShowInstructions?.(runtime.id)}
                class="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Install
              </button>
            {/if}
          </td>
        </tr>
      {/each}
      {#if filteredRuntimes.length === 0}
        <tr>
          <td colspan="6" class="px-6 py-8 text-center text-gray-500">
            No runtimes found for this category
          </td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>
