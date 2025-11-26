<script lang="ts">
  import { themeStore } from "$lib/core/stores";
  import type { Workspace } from "$lib/types/workspace";
  import WorkspacesHeader from "$lib/components/workspaces/WorkspacesHeader.svelte";
  import WorkspacesList from "$lib/components/workspaces/WorkspacesList.svelte";
  import WorkspaceDetailPanel from "$lib/components/workspaces/WorkspaceDetailPanel.svelte";
  import WorkspaceEditorDrawer from "$lib/components/workspaces/WorkspaceEditorDrawer.svelte";

  // Mock workspaces data
  let workspaces: Workspace[] = $state([
    {
      id: "workspace-1",
      name: "AuthorForge",
      slug: "authorforge",
      description:
        "Main workspace for authoring and creative writing projects.",
      createdAt: "2024-10-15T10:30:00Z",
      updatedAt: "2024-11-18T14:22:00Z",
      isDefault: true,
      status: "active",
      models: ["Claude", "GPT-5.x"],
      tags: ["authoring", "creative", "fiction"],
      settings: {
        defaultEvaluationScale: "1-5",
        requireWinner: false,
      },
      stats: {
        totalRuns: 47,
        lastRunAt: "2 hours ago",
      },
    },
    {
      id: "workspace-2",
      name: "VibeForge Dev",
      slug: "vibeforge-dev",
      description:
        "Development and iteration environment for VibeForge prompt engineering.",
      createdAt: "2024-09-20T09:15:00Z",
      updatedAt: "2024-11-18T08:45:00Z",
      isDefault: false,
      status: "active",
      models: ["Claude", "Local"],
      tags: ["development", "research", "testing"],
      settings: {
        defaultEvaluationScale: "1-10",
        requireWinner: true,
      },
      stats: {
        totalRuns: 152,
        lastRunAt: "yesterday",
      },
    },
    {
      id: "workspace-3",
      name: "Leopold",
      slug: "leopold",
      description:
        "Client project: Leopold content generation and optimization workflows.",
      createdAt: "2024-08-05T14:00:00Z",
      updatedAt: "2024-11-15T11:30:00Z",
      isDefault: false,
      status: "active",
      models: ["GPT-5.x"],
      tags: ["client", "production", "content"],
      settings: {
        defaultEvaluationScale: "1-5",
        requireWinner: true,
      },
      stats: {
        totalRuns: 89,
        lastRunAt: "3 days ago",
      },
    },
    {
      id: "workspace-4",
      name: "Research Lab (Archived)",
      slug: "research-lab",
      description:
        "Experimental and exploratory prompt research — no longer active.",
      createdAt: "2024-07-10T08:30:00Z",
      updatedAt: "2024-10-25T16:20:00Z",
      isDefault: false,
      status: "archived",
      models: ["Claude", "Local", "Gemini"],
      tags: ["research", "experiment"],
      settings: {
        defaultEvaluationScale: "1-5",
        requireWinner: false,
      },
      stats: {
        totalRuns: 34,
        lastRunAt: "25 days ago",
      },
    },
  ]);

  // Local state
  let activeWorkspaceId: string | null = $state(workspaces[0].id);
  let isEditorOpen = $state(false);
  let editorMode: "create" | "edit" = $state("create");
  let editingWorkspace: Workspace | null = $state(null);

  const activeWorkspace = $derived(
    workspaces.find((w) => w.id === activeWorkspaceId) || null
  );

  // Event handlers
  const openCreateWorkspace = () => {
    editorMode = "create";
    editingWorkspace = null;
    isEditorOpen = true;
  };

  const openEditWorkspace = (workspace: Workspace) => {
    editorMode = "edit";
    editingWorkspace = workspace;
    isEditorOpen = true;
  };

  const saveWorkspace = (workspace: Workspace) => {
    const existingIdx = workspaces.findIndex((w) => w.id === workspace.id);
    if (existingIdx >= 0) {
      // Update existing
      workspaces[existingIdx] = workspace;
    } else {
      // Add new
      workspaces = [...workspaces, workspace];
      activeWorkspaceId = workspace.id;
    }
    isEditorOpen = false;
    editingWorkspace = null;
    // TODO: Wire workspace create/update to backend or global store
  };

  const setActiveWorkspace = (id: string) => {
    activeWorkspaceId = id;
  };

  const setDefaultWorkspace = (id: string) => {
    workspaces = workspaces.map((w) => ({
      ...w,
      isDefault: w.id === id,
    }));
    // TODO: Persist default workspace to backend or store
  };

  const toggleArchive = (id: string) => {
    workspaces = workspaces.map((w) => {
      if (w.id === id) {
        return {
          ...w,
          status: w.status === "active" ? "archived" : "active",
          updatedAt: new Date().toISOString(),
        };
      }
      return w;
    });
    // TODO: Persist workspace status to backend
  };

  const closeEditor = () => {
    isEditorOpen = false;
    editingWorkspace = null;
  };
</script>

<!-- Workspace management: list (left), details + actions (right), drawer for create/edit -->
<main class="flex-1 overflow-hidden flex flex-col bg-forge-blacksteel">
  <div class="px-8 py-6 flex flex-col gap-6 h-full overflow-hidden">
    <WorkspacesHeader />

    <!-- Two-column layout: list (left) + detail (right) -->
    <div
      class="grid gap-6 flex-1 overflow-hidden"
      style="grid-template-columns: 320px 1fr;"
    >
      <!-- Left: Workspaces list -->
      <div class="overflow-y-auto">
        <WorkspacesList
          {workspaces}
          {activeWorkspaceId}
          onSelectWorkspace={setActiveWorkspace}
          onCreateWorkspace={openCreateWorkspace}
        />
      </div>

      <!-- Right: Workspace detail panel -->
      <div class="overflow-y-auto">
        <WorkspaceDetailPanel
          workspace={activeWorkspace}
          onEdit={openEditWorkspace}
          onToggleArchive={toggleArchive}
          onSetDefault={setDefaultWorkspace}
          onOpenInWorkbench={(id) => {
            // TODO: Navigate to workbench with selected workspace
            console.log("Open workbench with workspace:", id);
          }}
          onViewHistory={(id) => {
            // TODO: Navigate to history filtered by workspace
            console.log("View history for workspace:", id);
          }}
        />
      </div>
    </div>
  </div>
</main>

<!-- Workspace editor drawer (right-side slide-in) -->
<WorkspaceEditorDrawer
  open={isEditorOpen}
  mode={editorMode}
  initialWorkspace={editingWorkspace}
  onSave={saveWorkspace}
  onCancel={closeEditor}
/>
