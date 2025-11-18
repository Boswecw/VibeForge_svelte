# Document Ingestion: Code Reference

## Changes Made to Context Library Page

### File: `src/routes/contexts/+page.svelte`

---

## 1. Import Statements (Top of file)

**Added:**

```typescript
import UploadIngestModal from "$lib/components/ingest/UploadIngestModal.svelte";
import IngestQueuePanel from "$lib/components/ingest/IngestQueuePanel.svelte";
```

**Location:** After existing component imports, before theme store import

---

## 2. Type Definitions (Script section)

**Added IngestDocument interface:**

```typescript
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
```

**Location:** After existing type definitions (ContextType, ContextSize, ContextBlock)

---

## 3. State Variables (Script section)

**Added after existing state:**

```typescript
// Ingest modal and queue state
let isUploadOpen = $state(false);
let ingestQueue = $state<IngestDocument[]>([]);
```

**Location:** After `activeContextId` declaration

---

## 4. Event Handlers (Script section)

**Added after selectBlock handler:**

### handleIngest Function

```typescript
// Handler for ingesting documents
const handleIngest = (docs: IngestDocument[]) => {
  ingestQueue = [...ingestQueue, ...docs];
  isUploadOpen = false;
  console.log(
    `Ingested ${docs.length} document(s). Queue now has ${ingestQueue.length} total.`
  );
};
```

### handleSimulateProgress Function

```typescript
// Handler for simulating progress on queue items
const handleSimulateProgress = () => {
  ingestQueue = ingestQueue.map((doc) => {
    if (doc.status === "queued") {
      return {
        ...doc,
        status: "processing" as const,
        updatedAt: new Date().toISOString(),
      };
    }
    if (doc.status === "processing") {
      return {
        ...doc,
        status: "ready" as const,
        updatedAt: new Date().toISOString(),
      };
    }
    return doc;
  });
};
```

**Location:** After selectBlock function, before sendToWorkbench function

---

## 5. Header Component Update (Template section)

**Changed from:**

```svelte
<ContextLibraryHeader totalCount={allContextBlocks.length} filteredCount={filteredBlocks.length} />
```

**To:**

```svelte
<ContextLibraryHeader
  totalCount={allContextBlocks.length}
  filteredCount={filteredBlocks.length}
  onAddDocuments={() => (isUploadOpen = true)}
/>
```

**Location:** Inside main layout div, top section with header

---

## 6. Queue Panel Render (Template section)

**Added after detail panel, before closing </main>:**

```svelte
<!-- Ingest Queue Panel (below library UI) -->
{#if ingestQueue.length > 0}
  <div class="mt-8 border-t {$theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} pt-6">
    <IngestQueuePanel
      {ingestQueue}
      onSimulateProgress={handleSimulateProgress}
    />
  </div>
{/if}
```

**Location:** After the 2-column grid closes (after ContextDetailPanel), still inside main section

---

## 7. Modal Render (Template section)

**Added after closing </main> tag:**

```svelte
<!-- Upload Modal -->
<UploadIngestModal
  open={isUploadOpen}
  onClose={() => (isUploadOpen = false)}
  onIngest={handleIngest}
  workspace="default"
/>
```

**Location:** At the very end of template, outside main content area

---

## Changes to ContextLibraryHeader Component

### File: `src/lib/components/context/ContextLibraryHeader.svelte`

---

## 1. Props Interface Update

**Changed from:**

```typescript
interface Props {
  totalCount: number;
  filteredCount: number;
}
```

**To:**

```typescript
interface Props {
  totalCount: number;
  filteredCount: number;
  onAddDocuments?: () => void;
}
```

**And:**

```typescript
let { totalCount, filteredCount }: Props = $props();
```

**To:**

```typescript
let { totalCount, filteredCount, onAddDocuments }: Props = $props();
```

---

## 2. Button Update (Template section)

**Changed from:**

```svelte
<button
  type="button"
  class={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
    $theme === 'dark'
      ? 'border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-700'
  }`}
  disabled
  title="Coming soon"
>
  + New Context (coming soon)
</button>
```

**To:**

```svelte
<button
  type="button"
  onclick={onAddDocuments}
  class={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
    $theme === 'dark'
      ? 'border-slate-800 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:border-slate-600'
      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white hover:border-slate-300'
  }`}
  title="Upload documents to ingest as context"
>
  📄 Add Documents
</button>
```

**Changes:**

- Removed `disabled` attribute
- Changed onclick handler from nothing to `{onAddDocuments}`
- Updated title tooltip
- Updated button text and emoji
- Adjusted styling from disabled (muted) to active (enabled)

---

## Integration Checklist

After making these changes:

- [x] Imports added for both ingest components
- [x] IngestDocument type interface added
- [x] State variables initialized (isUploadOpen, ingestQueue)
- [x] Event handlers defined (handleIngest, handleSimulateProgress)
- [x] Header component updated with new prop
- [x] Header button made functional
- [x] Queue panel conditional render added
- [x] Modal component render added at end of template

---

## Type Safety

All new code is fully typed:

```typescript
// ✅ Ingest handler accepts typed array
const handleIngest = (docs: IngestDocument[]) => { ... }

// ✅ Queue state is typed
let ingestQueue = $state<IngestDocument[]>([]);

// ✅ Callback prop is optional but typed
onAddDocuments?: () => void;

// ✅ Status transitions use const assertions
{ ..., status: 'processing' as const, ... }
```

---

## Testing Each Part

### 1. Button Click

```typescript
// In browser DevTools console:
const button = document.querySelector('button:contains("Add Documents")');
button.click(); // Should open modal
```

### 2. Adding Documents

```typescript
// Modal should appear with file dropzone
// Drag a file or click to browse
// Edit metadata
// Click "Start ingestion"
```

### 3. Queue Display

```typescript
// After ingestion, queue should appear below library UI
// Should show table with documents
// Status should be "queued"
```

### 4. Progress Simulation

```typescript
// Click "Simulate progress" button
// Status should advance: queued → processing → ready
// Timestamps should update
```

---

## Component Communication Flow

```
User Action
    ↓
ContextLibraryHeader button click
    ↓
onAddDocuments() callback fires
    ↓
() => (isUploadOpen = true) executes
    ↓
UploadIngestModal open={true} renders
    ↓
User selects files + metadata
    ↓
"Start ingestion" click
    ↓
onIngest(docs) callback
    ↓
handleIngest(docs) in Context Library
    ↓
ingestQueue = [...ingestQueue, ...docs]
    ↓
IngestQueuePanel render (conditionally visible)
    ↓
Queue displays documents with status badges
    ↓
User clicks "Simulate progress"
    ↓
onSimulateProgress() callback
    ↓
handleSimulateProgress() updates status
    ↓
Queue re-renders with new status
```

---

## Data Flow

```
FILES uploaded in modal
    ↓
converted to IngestDocument[] with:
  - Generated ID (UUID format in real impl)
  - Filename from file
  - MIME type from file
  - File size
  - User-edited title
  - Selected category
  - Workspace ("default")
  - User-entered tags (comma-split)
  - Initial status: "queued"
  - Timestamps: createdAt, updatedAt
    ↓
Array passed to handleIngest(docs)
    ↓
Spread into ingestQueue state
    ↓
IngestQueuePanel receives updated queue
    ↓
Renders table with documents

User clicks "Simulate progress"
    ↓
Queue items map with status transitions
    ↓
Timestamps update to now
    ↓
ingestQueue state updates
    ↓
Panel re-renders with new status badges
```

---

## Notes

- **LSP Module Resolution:** TypeScript compiler may show "no default export" error for ingest components; this is a known LSP limitation and doesn't affect runtime (SvelteKit handles it correctly)
- **Session-Local Queue:** Queue data is not persisted; reload clears it (TODO: add localStorage or backend persistence)
- **Theme Aware:** All new UI uses `$theme` store for dark/light mode support
- **Callback Pattern:** Uses Svelte 5 callback props (no event dispatchers needed)
- **Async TODO:** Real file parsing, backend ingestion, and status polling are stubbed (console.log only)
