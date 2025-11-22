# VibeForge Integration Architecture — Phase 1

**Status**: Complete ✅  
**Date**: November 20, 2025  
**Phase**: 1 (Integration Skeleton)

---

## Overview

Phase 1 establishes the complete integration skeleton between VibeForge (frontend) and the two backend services:

- **DataForge** (`https://dataforge.internal/api/v1`) — Knowledge + Memory Engine
- **NeuroForge** (`https://neuroforge.internal/api/v1`) — Model Router + LLM Engine

This document describes the architecture, file structure, and contracts implemented.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  VibeForge Frontend (SvelteKit)             │
│                                                              │
│  ┌─────────────┬──────────────────┬──────────────────────┐ │
│  │   Context   │   Prompt Editor  │   Output Viewer      │ │
│  │   Column    │                  │                      │ │
│  └──────┬──────┴────────┬─────────┴─────────┬────────────┘ │
│         │               │                   │               │
│  ┌──────▼───────────────▼───────────────────▼────────────┐ │
│  │   SvelteKit Server Routes (/api/*)                    │ │
│  │   - /api/models         (forward to NF)               │ │
│  │   - /api/contexts       (forward to DF)               │ │
│  │   - /api/search-context (forward to DF)               │ │
│  │   - /api/run            (orchestrate DF + NF)         │ │
│  │   - /api/history        (forward to DF)               │ │
│  └──────┬─────────────────┬──────────────────┬───────────┘ │
│         │                 │                  │              │
└─────────┼─────────────────┼──────────────────┼──────────────┘
          │                 │                  │
    HTTP/JSON CORS Headers + API Keys
          │                 │                  │
┌─────────▼─────┐   ┌───────▼──────┐   ┌──────▼─────────┐
│   DataForge   │   │  NeuroForge  │   │  (Future API   │
│   Service     │   │  Service     │   │   Providers)   │
└───────────────┘   └──────────────┘   └────────────────┘
```

---

## Phase 1 Deliverables

### 1. Type Definitions

**Files Created:**

- `src/lib/types/dataforge.ts` — All DataForge API contracts
- `src/lib/types/neuroforge.ts` — All NeuroForge API contracts

**Includes:**

- Request/response types
- Model definitions
- Error handling types
- Full TypeScript coverage for both services

### 2. API Client Modules

**Files Created:**

- `src/lib/api/dataforge.ts` — Internal client for DataForge
- `src/lib/api/neuroforge.ts` — Internal client for NeuroForge

**Functions Implemented:**

#### DataForge Client

```typescript
listContexts(workspaceId: string): Promise<DataForgeContext[]>
searchContexts(workspaceId: string, request: SearchContextsRequest): Promise<DataForgeContextSearchResult[]>
getContextChunk(contextId: string, chunkId: string): Promise<DataForgeContextChunk>
logRun(request: LogRunRequest): Promise<string>
listRuns(workspaceId: string, options?): Promise<{ runs: any[], total: number }>
healthCheck(): Promise<boolean>
```

#### NeuroForge Client

```typescript
listModels(client?: string): Promise<NeuroForgeModel[]>
runPrompt(request: PromptRunRequest): Promise<PromptRunResponse>
sendFeedback(request: PromptFeedbackRequest): Promise<PromptFeedbackResponse>
healthCheck(): Promise<boolean>
```

### 3. SvelteKit Server Routes (Proxy Layer)

**Files Created:**

- `src/routes/api/models/+server.ts` — Model discovery (GET)
- `src/routes/api/contexts/+server.ts` — Context library (GET)
- `src/routes/api/search-context/+server.ts` — Semantic search (POST)
- `src/routes/api/run/+server.ts` — Prompt execution (POST)
- `src/routes/api/history/+server.ts` — Run history (GET)

**Key Features:**

- Input validation on every endpoint
- Error handling with proper HTTP status codes
- Request normalization (combining DataForge + NeuroForge responses)
- Logging for debugging
- API key management (server-side only)

**Execution Flow for /api/run (Main Endpoint):**

```
1. Parse + validate request
2. Call NeuroForge /prompt/run
   ├─ Executes prompt across selected models
   └─ Returns responses with token usage + latency
3. Call DataForge /runs
   ├─ Logs the execution + outputs
   └─ Returns run ID for history tracking
4. Return combined response to frontend
```

### 4. Integration Stores

**Files Created:**

- `src/lib/stores/dataforgeStore.ts` — State management for DataForge data
- `src/lib/stores/neuroforgeStore.ts` — State management for NeuroForge data

**DataForge Store:**

```typescript
state: DataForgeState
├─ contexts: DataForgeContext[]
├─ searchResults: DataForgeContextSearchResult[]
├─ history: any[]
├─ isLoadingContexts: boolean
├─ isSearching: boolean
├─ isLoadingHistory: boolean
├─ error: string | null
└─ lastUpdated: string | null

derived stores:
├─ dataforgeLoading: Readable<boolean>
├─ dataforgeHasError: Readable<boolean>
├─ contextCount: Readable<number>
└─ searchResultCount: Readable<number>
```

**NeuroForge Store:**

```typescript
state: NeuroForgeState
├─ models: NeuroForgeModel[]
├─ selectedModels: string[]
├─ isLoadingModels: boolean
├─ isExecuting: boolean
├─ currentRunId: string | null
├─ responses: ModelResponse[]
├─ error: string | null
└─ lastUpdated: string | null

derived stores:
├─ neuroforgeLoading: Readable<boolean>
├─ neuroforgeHasError: Readable<boolean>
├─ modelCount: Readable<number>
├─ selectedModelCount: Readable<number>
├─ responseCount: Readable<number>
├─ totalTokensUsed: Readable<number>
└─ maxLatency: Readable<number>
```

### 5. Environment Configuration

**File Created:**

- `.env.example` — Template for required environment variables

**Variables:**

```env
# Backend service URLs
DATAFORGE_API_BASE=https://localhost:8001/api/v1
NEUROFORGE_API_BASE=https://localhost:8002/api/v1

# API Key for VibeForge
VIBEFORGE_API_KEY=vf-dev-key

# Feature flags
VITE_ENABLE_CONTEXT_SEARCH=true
VITE_ENABLE_MODEL_COMPARISON=true
VITE_ENABLE_RUN_HISTORY=true

# Debug
VITE_LOG_API_CALLS=false
VITE_DEBUG_INTEGRATION=false
```

---

## API Contracts

### DataForge → VibeForge

**GET /workspaces/{workspace_id}/contexts**

```json
Response 200:
{
  "contexts": [
    {
      "id": "ctx_123",
      "workspace_id": "vf_ws_01",
      "title": "Architecture Guide",
      "kind": "design",
      "source": "workspace",
      "tags": ["architecture", "patterns"],
      "created_at": "2025-11-20T10:00:00Z",
      "updated_at": "2025-11-20T10:00:00Z"
    }
  ],
  "total": 1
}
```

**POST /workspaces/{workspace_id}/contexts/search**

```json
Request Body:
{
  "query": "authentication patterns",
  "top_k": 10,
  "filters": { "kind": "code" }
}

Response 200:
{
  "results": [
    {
      "context_id": "ctx_123",
      "chunk_id": "ch_01",
      "title": "Architecture Guide",
      "snippet": "...",
      "score": 0.92
    }
  ],
  "total": 1
}
```

**POST /runs**

```json
Request Body:
{
  "workspace_id": "vf_ws_01",
  "prompt": "Explain the auth flow",
  "models": ["nf:claude-3.5-sonnet", "nf:gpt-5.1"],
  "contexts": [{ "context_id": "ctx_123", "chunk_id": "ch_01" }],
  "outputs": [
    {
      "model": "nf:claude-3.5-sonnet",
      "output_id": "nf_out_001",
      "summary": "...",
      "tokens_used": { "input": 1200, "output": 600 }
    }
  ]
}

Response 201:
{
  "run_id": "df_run_001",
  "created_at": "2025-11-20T10:00:00Z"
}
```

**GET /workspaces/{workspace_id}/runs?limit=50&offset=0**

```json
Response 200:
{
  "runs": [...],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

### NeuroForge → VibeForge

**GET /models?client=vibeforge**

```json
Response 200:
{
  "models": [
    {
      "id": "nf:claude-3.5-sonnet",
      "name": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "display_name": "Claude 3.5 Sonnet",
      "capabilities": {
        "max_tokens": 200000,
        "supports_vision": true,
        "supports_function_calling": true
      },
      "pricing": {
        "input_token_cost": 3.0,
        "output_token_cost": 15.0
      },
      "metadata": {
        "is_champion": true,
        "category": "reasoning"
      }
    }
  ],
  "total": 1
}
```

**POST /prompt/run**

```json
Request Body:
{
  "workspace_id": "vf_ws_01",
  "session_id": "vf_sess_abc",
  "models": ["nf:claude-3.5-sonnet", "nf:gpt-5.1"],
  "prompt": "Explain microservices",
  "system": "You are an expert...",
  "contexts": [
    {
      "source": "dataforge",
      "context_id": "ctx_123",
      "chunk_id": "ch_01",
      "text": "..."
    }
  ],
  "settings": {
    "temperature": 0.7,
    "max_tokens": 1000
  }
}

Response 200:
{
  "run_id": "nf_run_001",
  "workspace_id": "vf_ws_01",
  "responses": [
    {
      "model": "nf:claude-3.5-sonnet",
      "output_id": "nf_out_001",
      "text": "Microservices are...",
      "usage": {
        "input_tokens": 1200,
        "output_tokens": 600
      },
      "latency_ms": 900
    }
  ],
  "total_latency_ms": 900
}
```

---

## Frontend Implementation Status

### Completed

✅ Type definitions (complete, enterprise-grade)  
✅ API client modules (complete, all functions)  
✅ SvelteKit server routes (complete, all endpoints)  
✅ Integration stores (complete, with derived stores)  
✅ Environment configuration (complete)

### Phase 2 (Next)

⏳ Update ContextColumn to fetch + search contexts dynamically  
⏳ Update PromptColumn to populate models, attach contexts, run prompt  
⏳ Update OutputColumn to display multi-model results with tabs  
⏳ Implement run history panel

### Phase 3 (Future)

⏳ Champion/challenger visualization  
⏳ Multi-model side-by-side diff  
⏳ Feedback integration  
⏳ Advanced telemetry

---

## Local Development Setup

### 1. Create `.env.local` in VibeForge root

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATAFORGE_API_BASE=https://localhost:8001/api/v1
NEUROFORGE_API_BASE=https://localhost:8002/api/v1
VIBEFORGE_API_KEY=vf-dev-key
```

### 2. Start VibeForge

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### 3. Mock DataForge + NeuroForge (Development)

For initial testing without live backend services, you can mock the API responses in `src/routes/api/*`:

```typescript
// Example: src/routes/api/models/+server.ts with mock
export const GET: RequestHandler = async () => {
  return json({
    status: "success",
    models: [
      {
        id: "nf:claude-3.5-sonnet",
        name: "Claude 3.5 Sonnet",
        // ... full model definition
      },
    ],
  });
};
```

---

## Testing Phase 1 Integration

### 1. Health Checks

```bash
# Check if NeuroForge is reachable
curl -H "Authorization: Bearer vf-dev-key" \
  https://localhost:8002/api/v1/health

# Check if DataForge is reachable
curl -H "Authorization: Bearer vf-dev-key" \
  https://localhost:8001/api/v1/health
```

### 2. Frontend API Endpoints

```bash
# Fetch models
curl http://localhost:5173/api/models

# Fetch contexts (requires workspace_id)
curl "http://localhost:5173/api/contexts?workspace_id=vf_ws_01"

# Search contexts
curl -X POST http://localhost:5173/api/search-context?workspace_id=vf_ws_01 \
  -H "Content-Type: application/json" \
  -d '{"query": "authentication", "top_k": 5}'

# Execute a run
curl -X POST http://localhost:5173/api/run \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "vf_ws_01",
    "prompt": "Explain microservices",
    "models": ["nf:claude-3.5-sonnet"]
  }'

# Fetch run history
curl "http://localhost:5173/api/history?workspace_id=vf_ws_01&limit=10"
```

---

## File Structure Summary

```
vibeforge/
├── .env.example                          # Environment template
├── src/
│   ├── lib/
│   │   ├── types/
│   │   │   ├── dataforge.ts              # DataForge API types
│   │   │   └── neuroforge.ts             # NeuroForge API types
│   │   ├── api/
│   │   │   ├── dataforge.ts              # DataForge client
│   │   │   └── neuroforge.ts             # NeuroForge client
│   │   ├── stores/
│   │   │   ├── dataforgeStore.ts         # DataForge state management
│   │   │   └── neuroforgeStore.ts        # NeuroForge state management
│   │   └── components/                   # (To be updated in Phase 2)
│   └── routes/
│       ├── +page.svelte                  # Main page (to wire in Phase 2)
│       └── api/
│           ├── models/+server.ts         # GET /api/models
│           ├── contexts/+server.ts       # GET /api/contexts
│           ├── search-context/+server.ts # POST /api/search-context
│           ├── run/+server.ts            # POST /api/run (main)
│           └── history/+server.ts        # GET /api/history
```

---

## Key Design Decisions

### 1. SvelteKit Server Routes as Proxy Layer

**Why**: Keeps DataForge/NeuroForge keys off the browser. Normalizes responses. Allows future multi-tenancy.

### 2. Separation of Concerns

**Why**: Each service has its own type definitions, clients, and stores. Easy to evolve independently.

### 3. No Frontend Direct Calls to DF/NF

**Why**: All communication goes through `/api/*` server routes. Makes auth, rate limiting, logging centralized.

### 4. Svelte 5 Runes + Derived Stores

**Why**: Modern reactivity with minimal boilerplate. Derived stores auto-compute totals, flags, etc.

### 5. Error Handling Strategy

**Why**: All errors bubble up with proper HTTP status codes and messages. Frontend can handle gracefully.

---

## Next Steps (Phase 2)

1. **Wire ContextColumn**

   - Load contexts on mount
   - Add debounced search input
   - Display search results
   - Allow multi-select

2. **Wire PromptColumn**

   - Populate model dropdown from store
   - Show context attachments
   - Add "Run" button with loading state
   - Handle execution flow

3. **Wire OutputColumn**

   - Display tabs for each model
   - Show output, tokens, latency
   - Add export/save buttons

4. **Implement History Panel**
   - Load past runs
   - Allow "replay in editor"
   - Sort/filter by model

---

## References

- **DataForge API Spec**: Base URL in `.env`
- **NeuroForge API Spec**: Base URL in `.env`
- **SvelteKit Docs**: https://kit.svelte.dev
- **Svelte 5 Runes**: https://svelte.dev/docs/runes

---

**Phase 1 Complete** ✅ Ready to wire UI components in Phase 2.
