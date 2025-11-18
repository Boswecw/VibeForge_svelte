# Document Ingestion Flow: Visual Guide

## UI Component Hierarchy

```
Context Library Page (/routes/contexts/+page.svelte)
│
├── ContextLibraryHeader
│   └── "📄 Add Documents" button [onclick: isUploadOpen = true]
│       └── triggers UploadIngestModal render
│
├── 2-Column Grid Layout
│   ├── LEFT: Filters + Library
│   │   ├── ContextFilters
│   │   └── ContextList
│   │
│   └── RIGHT: Detail Panel
│       └── ContextDetailPanel
│
├── IngestQueuePanel (conditionally rendered if queue.length > 0)
│   └── Shows documents with status tracking
│
└── UploadIngestModal (overlay)
    ├── File Dropzone
    ├── File List (editable metadata)
    └── "Start Ingestion" Button
        └── onIngest callback → handleIngest()
```

---

## User Interaction Flow

### 1. Opening the Upload Modal

```
User clicks "📄 Add Documents" button in header
    ↓
isUploadOpen = true
    ↓
UploadIngestModal component renders (fixed overlay)
    ↓
Modal displays dropzone + file list form
```

### 2. Selecting Files

```
User drags files onto dropzone OR clicks to browse
    ↓
Files appear in modal's file list
    ↓
User can edit:
  - File title (defaults to filename)
  - Category (dropdown: reference, docs, code, research, other)
    ↓
Shared metadata fields:
  - Workspace (readonly: "default")
  - Tags (comma-separated input)
```

### 3. Starting Ingestion

```
User clicks "Start Ingestion" button
    ↓
Modal validates files (must have ≥1 file)
    ↓
onIngest callback triggered with docs array
    ↓
handleIngest() in Context Library:
  - Appends docs to ingestQueue state
  - Closes modal (isUploadOpen = false)
  - Logs: "Ingested N document(s)"
```

### 4. Queue Appears

```
ingestQueue.length > 0 now
    ↓
IngestQueuePanel becomes visible
    ↓
Shows table of queued documents:
  | Title | Filename | Size | Status | Tags | Created |
  |-------|----------|------|--------|------|---------|
  | Doc A | file.pdf | 2MB | queued | ai   | 10:45   |
  | Doc B | spec.md  | 50KB| queued | code | 10:46   |
```

### 5. Simulating Progress (Demo Feature)

```
User clicks "Simulate progress" button in queue panel
    ↓
handleSimulateProgress() called
    ↓
For each document in queue:
  - queued → processing
  - processing → ready
  - ready → stays ready
    ↓
Queue UI updates with:
  - New status badges
  - Updated timestamps
  - Animated pulse for processing items
```

---

## Data Model & Status Flow

### IngestDocument Interface

```typescript
{
  id: string;                              // UUID
  filename: string;                        // Original file name
  mimeType: string;                        // e.g., "application/pdf"
  sizeBytes: number;                       // File size
  title: string;                           // Editable display name
  workspace: string;                       // "default"
  category: 'reference'|'docs'|'code'|     // Document category
           'research'|'other';
  tags: string[];                          // ["ai", "coding", ...]
  status: 'queued'|'processing'|           // Ingestion status
          'ready'|'error';
  createdAt: string;                       // ISO timestamp
  updatedAt: string;                       // ISO timestamp
  errorMessage?: string;                   // Error details if failed
}
```

### Status Lifecycle

```
CREATION        QUEUED          PROCESSING      READY
  ↓               ↓                ↓               ↓
File uploaded   In queue,      Processing      Ingestion
with metadata   waiting to     in progress     complete,
                start                          ready for
                                              use as context
                   ↓
                 ERROR (optional)
                 Failed during
                 ingestion
```

### Status Badge Colors (Theme-Aware)

| Status     | Dark Mode                     | Light Mode                 |
| ---------- | ----------------------------- | -------------------------- |
| queued     | slate-800/20                  | slate-100                  |
| processing | amber-900/20 (animated pulse) | amber-100 (animated pulse) |
| ready      | emerald-900/20                | emerald-100                |
| error      | rose-900/20                   | rose-100                   |

---

## Component Props & Events

### ContextLibraryHeader

**Props:**

```typescript
totalCount: number;           // Total context blocks
filteredCount: number;        // Blocks matching filters
onAddDocuments?: () => void;  // Button click handler
```

**When to call onAddDocuments:**
→ Set `isUploadOpen = true` in parent

---

### UploadIngestModal

**Props:**

```typescript
open: boolean;                              // Controls visibility
onClose: () => void;                        // Modal close handler
onIngest: (docs: IngestDocument[]) => void; // Ingest button handler
workspace: string;                          // Workspace context
```

**Event Callbacks:**

- `onClose()` → User clicks X or outside modal
- `onIngest(docs)` → User clicks "Start ingestion" with valid files

---

### IngestQueuePanel

**Props:**

```typescript
ingestQueue: IngestDocument[];     // Array of documents
onSimulateProgress?: () => void;   // Simulate button handler
```

**Display Features:**

- Renders max 15 documents (TODO: pagination)
- Stats bar showing counts by status
- Status badges with icons
- Tags display (first 2, "+N more")
- Formatted timestamps
- Animated pulse for processing items
- "Simulate progress" button (demo)

---

## State Management

### In Context Library Page (+page.svelte)

```typescript
// Upload modal state
let isUploadOpen = $state(false);

// Ingestion queue (session-local, not persisted)
let ingestQueue = $state<IngestDocument[]>([]);

// Handler: Add docs to queue
const handleIngest = (docs: IngestDocument[]) => {
  ingestQueue = [...ingestQueue, ...docs];
  isUploadOpen = false;
};

// Handler: Advance status of queued items
const handleSimulateProgress = () => {
  ingestQueue = ingestQueue.map((doc) => {
    if (doc.status === "queued") {
      return {
        ...doc,
        status: "processing",
        updatedAt: new Date().toISOString(),
      };
    }
    if (doc.status === "processing") {
      return { ...doc, status: "ready", updatedAt: new Date().toISOString() };
    }
    return doc;
  });
};
```

---

## Theme Integration

All components use the `$theme` store:

```typescript
import { theme } from '$lib/stores/themeStore';

// In template:
<div class={`
  ${$theme === 'dark'
    ? 'bg-slate-900 text-slate-100 border-slate-700'
    : 'bg-white text-slate-900 border-slate-200'}
`}>
```

**Auto-switches when user toggles theme:**

- Modal background
- Queue panel backgrounds
- Text colors
- Border colors
- Status badge colors
- Button hover states

---

## Dark Mode Screenshots (ASCII)

### Upload Modal

```
┌─────────────────────────────────────────────┐
│  📄 Upload Documents              [X]      │  Dark: bg-slate-900, border-slate-700
├─────────────────────────────────────────────┤
│ Drag files here or click to browse          │
│ ┌───────────────────────────────────────┐   │
│ │ Accepted: PDF, Markdown, TXT, Code    │   │
│ └───────────────────────────────────────┘   │
│                                             │
│ Files to Ingest:                            │
│ ┌─────────────────────────────────────────┐ │
│ │ Title: [spec.md]     Category: [docs]  │ │  Editable inputs
│ │  spec.md (45 KB)                      │ │
│ │                                       │ │
│ │ Title: [guide]       Category: [ref]  │ │
│ │  architecture.pdf (2.3 MB)            │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Shared Metadata:                            │
│ Workspace: [default] (readonly)             │
│ Tags: [ai, docs, spec] (comma-separated)    │
│                                             │
│ [Start Ingestion] [Cancel]                  │
└─────────────────────────────────────────────┘
```

### Ingest Queue Panel

```
Ingestion Queue (2 documents)

Status:  ⭕ Queued (2)  🟡 Processing (0)  ✅ Ready (0)  ❌ Error (0)

┌─────────────────────────────────────────────────────────┐
│ Title          File Size  Status    Tags         At     │
├─────────────────────────────────────────────────────────┤
│ spec.md        45 KB      ⭕ queued  ai, docs     10:45  │
│ guide          2.3 MB     ⭕ queued  spec        10:46  │
└─────────────────────────────────────────────────────────┘

[Simulate progress →]  Shows demo of status transitions
```

---

## File Organization

```
src/lib/components/ingest/
├── UploadIngestModal.svelte        (300+ lines)
│   ├── File dropzone (drag & drop)
│   ├── File list with editable metadata
│   ├── Shared metadata section
│   ├── Ingest button with validation
│   └── Dark/light theme support
│
└── IngestQueuePanel.svelte         (270+ lines)
    ├── Queue table (status, timestamps, tags)
    ├── Stats bar (counts by status)
    ├── Status badges (color-coded)
    ├── "Simulate progress" button (demo)
    └── Dark/light theme support

src/routes/contexts/+page.svelte    (modified)
├── Imports both ingest components
├── State: isUploadOpen, ingestQueue
├── Handlers: handleIngest, handleSimulateProgress
├── Header with "Add Documents" button
├── Library UI (unchanged)
└── Conditional queue panel render
```

---

## Next Feature Ideas

**Phase 2: Document Processing**

- Real file parsing (extract text from PDF, parse code files)
- Automatic metadata extraction (title, tags from file content)
- Preview modal before ingestion

**Phase 3: Context Library Integration**

- "Promote to Context" button in queue
- Auto-create ContextBlocks from ingested documents
- Link documents → contexts with bidirectional reference

**Phase 4: Global Features**

- "Add Documents" button in TopBar (global, not just Context Library)
- Document search across queue + library
- Batch operations (tag, delete, promote multiple)

---

## Testing the Flow

1. **Start dev server:** `pnpm dev` → visit http://localhost:5173/contexts
2. **Click "📄 Add Documents"** → Modal opens
3. **Drag files or click to browse** → Add some files
4. **Edit metadata** (title, category, tags)
5. **Click "Start Ingestion"** → Files move to queue
6. **Queue appears below** → Shows documents with status
7. **Click "Simulate progress"** → Status advances queued → processing → ready
8. **Toggle theme** (dark/light) → Components adapt
