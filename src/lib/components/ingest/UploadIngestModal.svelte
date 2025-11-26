<!-- @component
### Props
- `! open` **boolean** = `false`
- `! workspace` **string** = `VibeForge Dev`
- `onClose` **() =► void**
- `onIngest` **(docs: IngestDocument[]) =► void**

no description yet
-->
<script lang="ts">
  import { themeStore } from "$lib/core/stores";

  interface IngestDocument {
    id: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    title: string;
    workspace: string;
    category: "reference" | "docs" | "code" | "research" | "other";
    tags: string[];
    status: "queued" | "processing" | "ready" | "error";
    createdAt: string;
    updatedAt: string;
    errorMessage?: string;
  }

  interface Props {
    open: boolean;
    workspace: string;
    onClose?: () => void;
    onIngest?: (docs: IngestDocument[]) => void;
  }

  let {
    open = false,
    workspace = "VibeForge Dev",
    onClose,
    onIngest,
  }: Props = $props();

  let pendingDocs = $state<IngestDocument[]>([]);
  let tagsInput = $state("");
  let fileInput = $state<HTMLInputElement | null>(null);

  function openFilePicker() {
    fileInput?.click();
  }

  function handleFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files) return;

    const now = new Date().toISOString();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const doc: IngestDocument = {
        id: `doc-${Date.now()}-${i}`,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        workspace: workspace,
        category: "reference",
        tags: [],
        status: "queued",
        createdAt: now,
        updatedAt: now,
      };
      pendingDocs.push(doc);
    }

    // Reset input
    if (fileInput) {
      fileInput.value = "";
    }
  }

  function handleIngest() {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const now = new Date().toISOString();

    const docsToIngest = pendingDocs.map((doc) => ({
      ...doc,
      tags,
      updatedAt: now,
    }));

    onIngest?.(docsToIngest);
    pendingDocs = [];
    tagsInput = "";
    onClose?.();
  }

  function removeDoc(id: string) {
    pendingDocs = pendingDocs.filter((d) => d.id !== id);
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/40 cursor-pointer"
      onclick={onClose}
    />

    <!-- Modal -->
    <div
      class={`relative w-full max-w-2xl mx-4 rounded-lg border shadow-xl transition-all ${
        themeStore.current === "dark"
          ? "bg-slate-950 border-slate-800"
          : "bg-white border-slate-200"
      }`}
    >
      <!-- Header -->
      <header
        class={`flex items-center justify-between px-6 py-4 border-b ${
          themeStore.current === "dark" ? "border-slate-800" : "border-slate-200"
        }`}
      >
        <div class="flex flex-col gap-1">
          <h2 class="text-base font-semibold">Add documents</h2>
          <p
            class={`text-xs ${
              themeStore.current === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Upload files to be ingested into the Context Library.
          </p>
        </div>
        <button
          class={`text-xs font-medium ${
            themeStore.current === "dark"
              ? "text-slate-400 hover:text-slate-200"
              : "text-slate-500 hover:text-slate-900"
          }`}
          onclick={onClose}
          type="button"
        >
          Close
        </button>
      </header>

      <!-- Body -->
      <div
        class={`px-6 py-4 flex flex-col gap-4 text-xs max-h-[60vh] overflow-y-auto`}
      >
        <!-- Dropzone -->
        <div
          class={`border-2 border-dashed rounded-lg px-6 py-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            themeStore.current === "dark"
              ? "border-slate-700 bg-slate-900 hover:bg-slate-800"
              : "border-slate-300 bg-slate-50 hover:bg-slate-100"
          }`}
          onclick={openFilePicker}
          onkeydown={(e) => e.key === "Enter" && openFilePicker()}
          role="button"
          tabindex="0"
        >
          <p class="text-sm font-medium">Drop files here, or click to browse</p>
          <p
            class={`text-[11px] mt-1 ${
              themeStore.current === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Supported: PDF, Markdown, TXT, DOCX (mocked)
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.md,.txt,.docx,.doc"
            class="hidden"
            bind:this={fileInput}
            onchange={handleFilesSelected}
          />
        </div>

        <!-- File List -->
        {#if pendingDocs.length === 0}
          <p
            class={`text-xs ${
              themeStore.current === "dark" ? "text-slate-400" : "text-slate-500"
            }`}
          >
            No files selected yet. Select or drag files above to get started.
          </p>
        {:else}
          <div class="border rounded-lg overflow-hidden">
            <div
              class={`grid grid-cols-[1.4fr_0.8fr_0.7fr_0.5fr] gap-3 px-4 py-2 text-[11px] font-medium border-b ${
                themeStore.current === "dark"
                  ? "bg-slate-900 border-slate-800 text-slate-400"
                  : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            >
              <span>Title</span>
              <span>Filename</span>
              <span>Size</span>
              <span>Category</span>
            </div>
            <div class="max-h-[280px] overflow-y-auto text-xs">
              {#each pendingDocs as doc (doc.id)}
                <div
                  class={`grid grid-cols-[1.4fr_0.8fr_0.7fr_0.5fr] gap-3 px-4 py-3 items-center border-b ${
                    themeStore.current === "dark"
                      ? "border-slate-800 hover:bg-slate-900/50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="text"
                    class={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
                      themeStore.current === "dark"
                        ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                        : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
                    }`}
                    bind:value={doc.title}
                    placeholder="Document title"
                  />
                  <span class="truncate text-slate-400">{doc.filename}</span>
                  <span
                    class={themeStore.current === "dark"
                      ? "text-slate-400"
                      : "text-slate-500"}
                  >
                    {(doc.sizeBytes / 1024).toFixed(1)} KB
                  </span>
                  <select
                    class={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
                      themeStore.current === "dark"
                        ? "bg-slate-900 border-slate-700 text-slate-100 focus:border-amber-500 focus:outline-none"
                        : "bg-white border-slate-300 text-slate-900 focus:border-amber-500 focus:outline-none"
                    }`}
                    bind:value={doc.category}
                  >
                    <option value="reference">Reference</option>
                    <option value="docs">Docs</option>
                    <option value="code">Code</option>
                    <option value="research">Research</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Shared Metadata -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold">Workspace</label>
            <input
              type="text"
              class={`rounded-md border px-3 py-2 text-xs ${
                themeStore.current === "dark"
                  ? "bg-slate-900 border-slate-700 text-slate-100"
                  : "bg-slate-50 border-slate-300 text-slate-900"
              }`}
              value={workspace}
              readonly
            />
            <p
              class={`text-[10px] ${
                themeStore.current === "dark" ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Documents associated with this workspace.
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold">Tags</label>
            <input
              type="text"
              class={`rounded-md border px-3 py-2 text-xs transition-colors ${
                themeStore.current === "dark"
                  ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
                  : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
              }`}
              placeholder="e.g. research, chapter-1, api"
              bind:value={tagsInput}
            />
            <p
              class={`text-[10px] ${
                themeStore.current === "dark" ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Applied to all files. Use commas to separate.
            </p>
          </div>
        </div>

        <!-- Info -->
        <div
          class={`rounded-md border px-3 py-2 text-[10px] ${
            themeStore.current === "dark"
              ? "bg-slate-900 border-slate-800 text-slate-400"
              : "bg-blue-50 border-blue-200 text-blue-600"
          }`}
        >
          <p>
            📋 Files are queued for processing. Status updates will appear in
            the Ingestion Queue below. TODO: Real file parsing and backend
            integration.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <footer
        class={`flex items-center justify-between px-6 py-3 border-t ${
          themeStore.current === "dark" ? "border-slate-800" : "border-slate-200"
        }`}
      >
        <p
          class={`text-xs ${
            themeStore.current === "dark" ? "text-slate-500" : "text-slate-500"
          }`}
        >
          {pendingDocs.length > 0
            ? `${pendingDocs.length} file${
                pendingDocs.length !== 1 ? "s" : ""
              } ready to ingest`
            : "Select files to get started"}
        </p>
        <div class="flex gap-2">
          <button
            class={`px-4 py-2 rounded-md border text-xs font-medium transition-colors ${
              themeStore.current === "dark"
                ? "border-slate-600 text-slate-300 hover:bg-slate-800"
                : "border-slate-300 text-slate-600 hover:bg-slate-100"
            }`}
            onclick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            class={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
              pendingDocs.length === 0
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-amber-500 text-slate-900 hover:bg-amber-600 font-semibold"
            }`}
            disabled={pendingDocs.length === 0}
            onclick={handleIngest}
            type="button"
          >
            Start ingestion
          </button>
        </div>
      </footer>
    </div>
  </div>
{/if}

<style lang="postcss">
  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 9999px;
    background-color: rgb(71 85 105);
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: rgb(100 116 139);
  }
</style>
