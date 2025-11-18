<!-- @component
### Props
- `! activeWorkspaceId` **string | null**
- `! onCreateWorkspace` **() =► void**
- `! onSelectWorkspace` **(id: string) =► void**
- `! workspaces` **Workspace[]**

Left panel: list of workspaces with metadata
-->
<script lang="ts">
  import { theme } from "$lib/stores/themeStore";
  import type { Workspace } from "$lib/types/workspace";

  interface Props {
    workspaces: Workspace[];
    activeWorkspaceId: string | null;
    onSelectWorkspace: (id: string) => void;
    onCreateWorkspace: () => void;
  }

  const {
    workspaces,
    activeWorkspaceId,
    onSelectWorkspace,
    onCreateWorkspace,
  }: Props = $props();

  // Filter to show active workspaces first
  const sortedWorkspaces = $derived.by(() => {
    const active = workspaces.filter((w) => w.status === "active");
    const archived = workspaces.filter((w) => w.status === "archived");
    return [...active, ...archived];
  });

  const activeCount = $derived(
    workspaces.filter((w) => w.status === "active").length
  );
</script>

<!-- Left panel: workspaces list -->
<section
  class={`rounded-lg border p-3 flex flex-col gap-3 ${
    $theme === "dark"
      ? "bg-slate-900 border-slate-700"
      : "bg-white border-slate-200 shadow-sm"
  }`}
>
  <!-- Header row -->
  <div class="flex items-center justify-between gap-2">
    <div class="flex flex-col">
      <h2 class="text-sm font-semibold">Workspaces</h2>
      <p
        class={`text-[11px] ${
          $theme === "dark" ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {activeCount} total
      </p>
    </div>
    <button
      class="px-3 py-1.5 rounded-md text-xs font-medium bg-amber-500 text-slate-900 hover:bg-amber-600 transition-colors"
      onclick={onCreateWorkspace}
      title="Create a new workspace"
    >
      New
    </button>
  </div>

  <!-- Workspace list -->
  <div class="mt-2 flex flex-col gap-2 overflow-y-auto max-h-[520px]">
    {#each sortedWorkspaces as workspace (workspace.id)}
      <button
        class={`w-full text-left rounded-md border px-3 py-2 flex flex-col gap-1 text-xs transition-colors ${
          activeWorkspaceId === workspace.id
            ? $theme === "dark"
              ? "border-amber-400 bg-slate-800"
              : "border-amber-500 bg-amber-50"
            : $theme === "dark"
            ? "border-slate-700 bg-slate-950 hover:bg-slate-900"
            : "border-slate-200 bg-white hover:bg-slate-50"
        }`}
        onclick={() => onSelectWorkspace(workspace.id)}
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="font-medium text-[13px]">{workspace.name}</span>
            {#if workspace.isDefault}
              <span
                class={`text-[10px] border rounded-full px-2 py-0.5 ${
                  $theme === "dark"
                    ? "border-amber-400 text-amber-400"
                    : "border-amber-500 text-amber-600"
                }`}
              >
                Default
              </span>
            {/if}
          </div>
          <span
            class={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] border ${
              workspace.status === "active"
                ? $theme === "dark"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-emerald-600 text-emerald-700"
                : $theme === "dark"
                ? "border-slate-500 text-slate-400"
                : "border-slate-400 text-slate-600"
            }`}
          >
            {workspace.status}
          </span>
        </div>

        <p
          class={`text-[11px] line-clamp-2 ${
            $theme === "dark" ? "text-slate-400" : "text-slate-600"
          }`}
        >
          {workspace.description}
        </p>

        <div
          class={`flex items-center justify-between gap-2 text-[11px] mt-1 ${
            $theme === "dark" ? "text-slate-500" : "text-slate-500"
          }`}
        >
          <span>{workspace.stats.totalRuns} runs</span>
          <span>
            {workspace.stats.lastRunAt
              ? `Last: ${workspace.stats.lastRunAt}`
              : "No runs yet"}
          </span>
        </div>
      </button>
    {/each}
  </div>
</section>
