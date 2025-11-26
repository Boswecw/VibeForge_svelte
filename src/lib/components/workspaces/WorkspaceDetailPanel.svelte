<!-- @component
### Props
- `! workspace` **Workspace | null**
- `onEdit` **(workspace: Workspace) =► void** = `() =► {}`
- `onOpenInWorkbench` **(id: string) =► void** = `() =► {}`
- `onSetDefault` **(id: string) =► void** = `() =► {}`
- `onToggleArchive` **(id: string) =► void** = `() =► {}`
- `onViewHistory` **(id: string) =► void** = `() =► {}`

Right panel: details, metadata, and actions for selected workspace
-->
<script lang="ts">
  import { themeStore } from "$lib/core/stores";
  import type { Workspace } from "$lib/types/workspace";

  interface Props {
    workspace: Workspace | null;
    onEdit?: (workspace: Workspace) => void;
    onToggleArchive?: (id: string) => void;
    onSetDefault?: (id: string) => void;
    onOpenInWorkbench?: (id: string) => void;
    onViewHistory?: (id: string) => void;
  }

  const {
    workspace,
    onEdit = () => {},
    onToggleArchive = () => {},
    onSetDefault = () => {},
    onOpenInWorkbench = () => {},
    onViewHistory = () => {},
  }: Props = $props();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
</script>

<!-- Right panel: workspace detail or empty state -->
<section
  class={`rounded-lg border p-4 flex flex-col gap-4 ${
    themeStore.current === "dark"
      ? "bg-slate-900 border-slate-700"
      : "bg-white border-slate-200 shadow-sm"
  }`}
>
  {#if workspace}
    <!-- Header with name and actions -->
    <header
      class="flex items-start justify-between gap-2 border-b pb-4"
      class:border-slate-700={themeStore.current === "dark"}
      class:border-slate-200={themeStore.current !== "dark"}
    >
      <div class="flex flex-col gap-1">
        <h2
          class={`text-sm font-semibold ${
            themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
          }`}
        >
          {workspace.name}
        </h2>
        <p
          class={`text-[11px] ${
            themeStore.current === "dark" ? "text-slate-400" : "text-slate-600"
          }`}
        >
          {workspace.slug} · Created {formatDate(workspace.createdAt)} · Updated
          {formatDate(workspace.updatedAt)}
        </p>
      </div>
      <div class="flex flex-wrap gap-2 justify-end text-xs">
        <button
          class={`px-3 py-1.5 rounded-md border transition-colors ${
            themeStore.current === "dark"
              ? "border-slate-600 text-slate-300 hover:bg-slate-800"
              : "border-slate-300 text-slate-600 hover:bg-slate-100"
          }`}
          onclick={() => onEdit(workspace)}
          title="Edit workspace details"
        >
          Edit
        </button>
        <button
          class={`px-3 py-1.5 rounded-md border transition-colors ${
            workspace.status === "active"
              ? themeStore.current === "dark"
                ? "border-amber-500 text-amber-400 hover:bg-slate-800"
                : "border-amber-600 text-amber-700 hover:bg-amber-50"
              : themeStore.current === "dark"
              ? "border-slate-600 text-slate-400 hover:bg-slate-800"
              : "border-slate-300 text-slate-600 hover:bg-slate-100"
          }`}
          onclick={() => onToggleArchive(workspace.id)}
          title={workspace.status === "active"
            ? "Archive workspace"
            : "Unarchive workspace"}
        >
          {workspace.status === "active" ? "Archive" : "Unarchive"}
        </button>
      </div>
    </header>

    <!-- Description -->
    <section class="flex flex-col gap-2">
      <p
        class={`text-xs ${
          themeStore.current === "dark" ? "text-slate-300" : "text-slate-700"
        }`}
      >
        {workspace.description}
      </p>
      {#if workspace.tags?.length}
        <div class="flex flex-wrap gap-2 text-[11px]">
          {#each workspace.tags as tag (tag)}
            <span
              class={`inline-flex items-center rounded-full border px-2 py-0.5 ${
                themeStore.current === "dark"
                  ? "border-slate-600 text-slate-300"
                  : "border-slate-300 text-slate-700"
              }`}
            >
              {tag}
            </span>
          {/each}
        </div>
      {/if}
    </section>

    <!-- Models & Defaults -->
    <section class="flex flex-col gap-2 text-xs">
      <h3
        class={`text-xs font-semibold ${
          themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
        }`}
      >
        Default models
      </h3>
      <div class="flex flex-wrap gap-2">
        {#each workspace.models as model (model)}
          <span
            class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
              themeStore.current === "dark"
                ? "border-slate-600 text-slate-300"
                : "border-slate-300 text-slate-700"
            }`}
          >
            {model}
          </span>
        {/each}
      </div>

      <h3
        class={`text-xs font-semibold mt-3 ${
          themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
        }`}
      >
        Evaluation defaults
      </h3>
      <p
        class={`text-[11px] ${
          themeStore.current === "dark" ? "text-slate-400" : "text-slate-600"
        }`}
      >
        Scale: {workspace.settings.defaultEvaluationScale} ·
        {workspace.settings.requireWinner
          ? "Winner required for completion"
          : "Winner optional"}
      </p>
    </section>

    <!-- Stats & Links -->
    <section class="flex flex-col gap-2 text-xs">
      <h3
        class={`text-xs font-semibold ${
          themeStore.current === "dark" ? "text-slate-100" : "text-slate-900"
        }`}
      >
        Activity
      </h3>
      <p
        class={`text-[11px] ${
          themeStore.current === "dark" ? "text-slate-400" : "text-slate-600"
        }`}
      >
        {workspace.stats.totalRuns} runs total
        {#if workspace.stats.lastRunAt}
          · Last run {workspace.stats.lastRunAt}
        {/if}
      </p>

      <div class="flex flex-wrap gap-2">
        <button
          class={`px-3 py-1.5 rounded-md border transition-colors ${
            themeStore.current === "dark"
              ? "border-slate-600 text-slate-300 hover:bg-slate-800"
              : "border-slate-300 text-slate-600 hover:bg-slate-100"
          }`}
          onclick={() => onOpenInWorkbench(workspace.id)}
          title="Open this workspace in the main workbench"
        >
          Open in Workbench
        </button>
        <button
          class={`px-3 py-1.5 rounded-md border transition-colors ${
            themeStore.current === "dark"
              ? "border-slate-600 text-slate-300 hover:bg-slate-800"
              : "border-slate-300 text-slate-600 hover:bg-slate-100"
          }`}
          onclick={() => onViewHistory(workspace.id)}
          title="View runs and evaluations for this workspace"
        >
          View History
        </button>
      </div>
    </section>

    <!-- Default toggle -->
    <section class="flex flex-col gap-2 text-xs">
      <label
        class={`inline-flex items-center gap-2 text-[11px] cursor-pointer ${
          themeStore.current === "dark" ? "text-slate-300" : "text-slate-700"
        }`}
      >
        <input
          type="checkbox"
          checked={workspace.isDefault}
          onchange={() => onSetDefault(workspace.id)}
          class="w-4 h-4 cursor-pointer"
        />
        <span>Set as default workspace</span>
      </label>
    </section>

    <!-- Danger zone -->
    <section
      class={`mt-2 rounded-md border px-3 py-2 text-[11px] ${
        themeStore.current === "dark"
          ? "border-rose-500/50 bg-rose-950/40 text-rose-200"
          : "border-rose-300 bg-rose-50 text-rose-700"
      }`}
    >
      <p class="font-semibold mb-1">Danger zone</p>
      <p>
        Deleting a workspace will remove all associated runs and evaluations.
        This action will be wired to the backend later.
      </p>
      <button
        class={`mt-2 px-3 py-1.5 rounded-md border transition-colors ${
          themeStore.current === "dark"
            ? "border-rose-500 text-rose-400 hover:bg-rose-900/40"
            : "border-rose-500 text-rose-600 hover:bg-rose-100"
        }`}
        disabled
        title="Delete functionality disabled for now"
      >
        Delete workspace (disabled)
      </button>
    </section>
  {:else}
    <!-- Empty state -->
    <div class="flex items-center justify-center h-64">
      <p
        class={`text-sm ${
          themeStore.current === "dark" ? "text-slate-400" : "text-slate-500"
        }`}
      >
        Select a workspace from the list to view its details, or create a new
        one.
      </p>
    </div>
  {/if}
</section>
