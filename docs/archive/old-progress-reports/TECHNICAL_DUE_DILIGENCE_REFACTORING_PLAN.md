# VibeForge - Technical Due Diligence Review & Refactoring Plan

**Date:** November 25, 2025  
**Scope:** Complete VibeForge ecosystem (Frontend + Backend)  
**Reviewer:** Technical Due Diligence Team  
**Status:** 🔴 **CRITICAL REFACTORING REQUIRED**

---

## Executive Summary

VibeForge is a **professional prompt engineering workbench** consisting of:

- **Frontend:** SvelteKit 5 + TypeScript desktop application (222 files)
- **Backend:** FastAPI + Rust (PyO3) hybrid service (20 Python files)
- **Integration Points:** DataForge (analytics/storage) + NeuroForge (LLM execution)

### Overall Assessment

| Category        | Status            | Score      |
| --------------- | ----------------- | ---------- |
| Architecture    | 🟡 Moderate       | 6.5/10     |
| Code Quality    | 🟡 Moderate       | 6/10       |
| Testing         | 🔴 Poor           | 4/10       |
| Security        | 🟡 Moderate       | 6/10       |
| Performance     | 🟢 Good           | 7.5/10     |
| Documentation   | 🟢 Good           | 8/10       |
| Maintainability | 🔴 Poor           | 5/10       |
| **Overall**     | 🔴 **Needs Work** | **6.1/10** |

### Critical Findings

1. ❌ **Module Resolution Failures** - Missing store exports, broken imports
2. ❌ **Incomplete Integrations** - 20+ TODO markers, unfinished features
3. ❌ **State Management Fragmentation** - Dual store systems (legacy + runes)
4. ❌ **Type Safety Gaps** - Missing type definitions, implicit any usage
5. ⚠️ **Testing Coverage** - Only 9 test files for 242 total files (~3.7%)
6. ⚠️ **Security Concerns** - API keys in frontend, no encryption
7. ⚠️ **Build Configuration** - Mixed Rust/Python setup complexity

---

## 1. Architecture Analysis

### 1.1 Frontend Architecture (SvelteKit)

**Strengths:**

- ✅ Modern SvelteKit 5 with Svelte 5 runes
- ✅ Clean 3-column workbench layout
- ✅ File-based routing for clarity
- ✅ Separation of concerns (routes/lib/components)
- ✅ Proper TypeScript integration

**Issues:**

- ❌ **Dual Store System:** Mix of legacy stores and rune-based stores
  - `/src/lib/stores/` (legacy writable stores - 14 files)
  - `/src/lib/core/stores/` (rune-based - not found)
  - References to non-existent stores cause runtime errors
- ❌ **Component Organization Duplication:**
  - `/src/lib/components/` vs `/src/lib/workbench/` overlap
  - Unclear separation between feature and workbench components
- ❌ **Missing Module Exports:**
  - Workbench column components not properly exported
  - Index files incomplete or missing
- ❌ **Type System Gaps:**
  - Some imports reference non-existent type files
  - Implicit any in several places

**Directory Structure Issues:**

```
src/
├── lib/
│   ├── components/        # Feature-specific (but overlaps with workbench)
│   ├── workbench/         # Workbench-specific (but has duplication)
│   ├── stores/            # LEGACY: Writable stores
│   ├── core/              # NEW: Should contain rune stores (not found)
│   │   └── stores/        # EXPECTED but missing
│   ├── api/               # API clients (good)
│   ├── types/             # Type definitions (incomplete)
│   └── services/          # Business logic (good)
```

**Recommendation:** Consolidate store systems, clarify component organization.

---

### 1.2 Backend Architecture (FastAPI + Rust)

**Strengths:**

- ✅ FastAPI for async HTTP handling
- ✅ Rust (PyO3) for performance-critical operations
- ✅ Clear router separation (vibeforge, dataforge, neuroforge, adaptive)
- ✅ Middleware for logging and CORS
- ✅ Pydantic for request/response validation

**Issues:**

- ❌ **Environment Configuration Missing:**
  - No centralized `config.py` using Pydantic Settings
  - Environment variables scattered across files
  - API keys accessed directly via `os.getenv()`
- ❌ **Incomplete Features:**
  - DataForge semantic search endpoint returns empty list (TODO)
  - Adaptive LLM recommendations stubbed out (TODO)
  - No retry logic for external API calls
- ❌ **Storage Layer:**
  - Uses JSON file storage (`data/runs.json`) - not production-ready
  - No database integration option
  - No transaction support or data validation
- ❌ **Error Handling:**
  - Generic exception handling in routers
  - No structured error response format
  - Missing input validation for edge cases
- ❌ **Logging:**
  - Basic Python logging, no structured logging
  - No log aggregation or monitoring integration
  - Debug logs in production code paths

**Recommendation:** Implement proper configuration management, complete TODOs, add production storage.

---

### 1.3 Integration Architecture

**Service Communication:**

```
┌──────────────┐
│  VibeForge   │ (Frontend - SvelteKit)
│   Frontend   │
└──────┬───────┘
       │ HTTP/JSON
       ├──────────────┐
       │              │
       ▼              ▼
┌──────────┐    ┌──────────┐
│VibeForge │    │DataForge │
│ Backend  │◄───┤ Backend  │
│(FastAPI) │    │(FastAPI) │
└────┬─────┘    └──────────┘
     │
     ▼
┌──────────┐
│NeuroForge│
│ Backend  │
│(FastAPI) │
└──────────┘
```

**Issues:**

- ❌ **No Service Discovery** - Hardcoded URLs in environment variables
- ❌ **No Circuit Breakers** - No resilience patterns for downstream failures
- ❌ **No Request Tracing** - Can't trace requests across services
- ❌ **CORS Wide Open** - `allow_origins=["*"]` in production
- ❌ **No Authentication** - Simple API key, no OAuth/JWT
- ❌ **No Rate Limiting** - Vulnerable to abuse

**Recommendation:** Implement service mesh patterns, proper authentication, resilience.

---

## 2. Code Quality Analysis

### 2.1 Frontend Code Quality

**Metrics:**

- **Total Files:** 222 (TypeScript + Svelte)
- **Test Files:** 9 (4 e2e + 5 unit tests)
- **Test Coverage:** ~3.7% (estimated)
- **TODO Markers:** 20+ instances
- **TypeScript Errors:** None (but type safety gaps exist)

**Issues:**

#### 2.1.1 TODO/FIXME Markers

```typescript
// src/lib/stores/runStore.ts:43
// TODO: Implement when DataForge /api/v1/runs endpoint is ready

// src/routes/quick-run/+page.svelte:125
// TODO: Replace mock outputs with real API call to run selected models

// src/routes/quick-run/+page.svelte:126
// TODO: Persist lastRunTokens/lastRunCost to metrics backend

// src/routes/patterns/+page.svelte:573
// TODO: Wire "Send to Workbench" to pre-fill the Workbench prompt editor

// src/routes/contexts/+page.svelte:372
// TODO: Integrate with workbench context store

// src/lib/components/workspaces/WorkspaceEditorDrawer.svelte:86
// TODO: Wire workspace create/update to backend or global store

// src/lib/components/settings/ModelSettingsSection.svelte:187
// TODO: Encrypt and persist credentials securely

// src/lib/components/settings/DataSettingsSection.svelte:18
// TODO: Implement export functionality
```

**Impact:** Core features incomplete, user experience degraded.

#### 2.1.2 Store System Confusion

```typescript
// Referenced but missing:
import { theme } from "$lib/stores/themeStore"; // EXISTS
import { contextStore } from "$lib/stores/contextStore"; // MISSING
import { presets } from "$lib/stores/presets"; // EXISTS
import { dataforgeStore } from "$lib/stores/dataforgeStore"; // EXISTS

// Expected but not found:
import { workbench } from "$lib/core/stores/workbench.svelte"; // NOT FOUND
import { contextBlocks } from "$lib/core/stores/contextBlocks.svelte"; // NOT FOUND
```

**Impact:** Runtime errors, inconsistent state management.

#### 2.1.3 Component Export Issues

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  // These imports fail because exports are missing:
  import ContextColumn from "$lib/workbench/context/ContextColumn.svelte";
  import PromptColumn from "$lib/workbench/prompt/PromptColumn.svelte";
  import OutputColumn from "$lib/workbench/output/OutputColumn.svelte";
</script>
```

**Actual Structure:**

```
src/lib/workbench/
├── context/
│   └── ContextColumn.svelte  ← EXISTS but no index export
├── prompt/
│   └── PromptColumn.svelte   ← EXISTS but no index export
└── output/
    └── OutputColumn.svelte   ← EXISTS but no index export
```

**Impact:** Build failures, app won't start.

---

### 2.2 Backend Code Quality

**Metrics:**

- **Total Files:** 20 Python files
- **Test Files:** 0
- **Test Coverage:** 0%
- **TODO Markers:** 2 critical TODOs

**Issues:**

#### 2.2.1 Configuration Management

```python
# Current approach (WRONG):
# python/app/routers/vibeforge.py
import os
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Should be:
# python/app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    class Config:
        env_file = ".env"
```

**Impact:** Hard to test, hard to override, no validation.

#### 2.2.2 Storage Layer

```python
# python/app/repositories/runs_file.py
class RunsFileRepo:
    """JSON file storage - NOT PRODUCTION READY"""

    def __init__(self, data_dir: Path = Path("data")):
        self.runs_file = data_dir / "runs.json"
        self.runs: List[RunCreate] = []
        self._load_from_disk()

    def _load_from_disk(self):
        if self.runs_file.exists():
            with open(self.runs_file, 'r') as f:
                data = json.load(f)
                self.runs = [RunCreate(**r) for r in data]
```

**Issues:**

- No transaction support
- File corruption risk
- No concurrent access handling
- Won't scale beyond single instance

**Impact:** Data loss risk, can't scale horizontally.

#### 2.2.3 Incomplete Features

```python
# python/app/routers/dataforge.py:25
@router.get("/contexts/search")
async def search_contexts(q: str):
    return []  # TODO: Implement with vector store

# python/app/routers/adaptive.py:84
async def recommend_stack():
    # TODO: Integrate with existing LLM stack advisor
    return {
        "recommendations": [],
        "confidence": 0.0
    }
```

**Impact:** Features advertised but don't work.

---

## 3. Testing Analysis

### 3.1 Frontend Testing

**Existing Tests:**

- **Unit Tests (5):**
  - `anthropicProvider.test.ts`
  - `openaiProvider.test.ts`
  - `modelRouter.test.ts`
  - `performanceMetrics.test.ts`
  - `costTracker.test.ts`
- **E2E Tests (4):**
  - `debug-shortcuts.spec.ts`
  - `wizard-modal.spec.ts`
  - `skip-wizard-preference.spec.ts`
  - `quick-create.spec.ts`

**Coverage:** ~3.7% (9 test files / 222 total files)

**Missing Tests:**

- ❌ Store tests (themeStore, contextStore, runStore, etc.)
- ❌ Component tests (all 100+ Svelte components)
- ❌ Integration tests (API client tests)
- ❌ Accessibility tests
- ❌ Performance tests

**Recommendation:** Achieve 60%+ coverage minimum.

---

### 3.2 Backend Testing

**Existing Tests:**

- **Unit Tests:** 0
- **Integration Tests:** 0
- **E2E Tests:** 0

**Coverage:** 0%

**Missing Tests:**

- ❌ Router tests (all endpoints)
- ❌ Service tests (LLM service, experience context)
- ❌ Repository tests (RunsFileRepo)
- ❌ Client tests (DataForge client)
- ❌ Middleware tests (wizard logging)

**Recommendation:** Achieve 70%+ coverage minimum for backend.

---

## 4. Security Analysis

### 4.1 Authentication & Authorization

**Current State:**

- Simple API key: `VITE_VIBEFORGE_API_KEY=vf-dev-key`
- No user authentication
- No role-based access control
- No session management

**Issues:**

- ❌ API key in frontend code (exposed in bundle)
- ❌ No token expiration
- ❌ No refresh mechanism
- ❌ No audit logging for access

**Recommendation:** Implement OAuth 2.0 + JWT tokens.

---

### 4.2 Data Security

**Issues:**

- ❌ **LLM API Keys in Frontend:**
  ```typescript
  // src/lib/components/settings/ModelSettingsSection.svelte
  // User enters API keys in UI, stored in localStorage
  // TODO: Encrypt and persist credentials securely
  ```
- ❌ **No Encryption at Rest:** JSON files store prompts/outputs in plaintext
- ❌ **No Encryption in Transit:** HTTP used, not HTTPS enforced
- ❌ **No Input Sanitization:** XSS vulnerability in prompt editor

**Recommendation:** Encrypt sensitive data, enforce HTTPS, sanitize inputs.

---

### 4.3 CORS Configuration

```python
# python/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ❌ WIDE OPEN
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Impact:** Any domain can make requests. Production should whitelist origins.

**Recommendation:** Restrict to known origins in production.

---

## 5. Performance Analysis

### 5.1 Frontend Performance

**Strengths:**

- ✅ Svelte 5 compiler generates efficient JavaScript
- ✅ Lazy loading for routes (SvelteKit auto-splits)
- ✅ Monaco Editor loaded on-demand
- ✅ Proper use of derived state to minimize re-renders

**Issues:**

- ⚠️ **Large Bundle Size:** No bundle analysis performed
- ⚠️ **No Code Splitting for Components:** All loaded upfront
- ⚠️ **No Virtual Scrolling:** Long lists may cause performance issues
- ⚠️ **No Debouncing:** Search inputs don't debounce API calls

**Recommendation:** Add bundle analyzer, implement virtual scrolling, debounce searches.

---

### 5.2 Backend Performance

**Strengths:**

- ✅ Async FastAPI for concurrent request handling
- ✅ Rust (PyO3) for token estimation (fast)
- ✅ Pydantic V2 for fast validation

**Issues:**

- ⚠️ **JSON File I/O on Every Request:**
  ```python
  def _load_from_disk(self):
      with open(self.runs_file, 'r') as f:
          data = json.load(f)
  ```
  No caching, reads entire file every time.
- ⚠️ **No Connection Pooling:** HTTP clients created per request
- ⚠️ **No Caching:** Repeated API calls to DataForge/NeuroForge
- ⚠️ **Synchronous LLM Calls:** Blocks event loop during model inference

**Recommendation:** Add Redis cache, connection pooling, async LLM calls.

---

## 6. Operational Concerns

### 6.1 Deployment Readiness

**Issues:**

- ❌ **No Docker Compose for Development:** Multi-service setup is manual
- ❌ **No Health Checks:** Services can't detect if dependencies are down
- ❌ **No Graceful Shutdown:** FastAPI doesn't handle SIGTERM properly
- ❌ **No Logging Aggregation:** Logs go to stdout, not collected
- ❌ **No Metrics Exposed:** No Prometheus/Grafana integration
- ❌ **No Deployment Documentation:** Missing production deployment guide

**Recommendation:** Add health checks, metrics, Docker Compose, deployment docs.

---

### 6.2 Monitoring & Observability

**Current State:**

- Basic Python logging
- No structured logs (JSON format)
- No distributed tracing
- No error tracking (Sentry, etc.)
- No performance monitoring (APM)

**Recommendation:** Implement structured logging, OpenTelemetry, error tracking.

---

### 6.3 Environment Configuration

**Current Issues:**

- `.env.example` exists but incomplete
- No validation of required variables
- No secrets management
- Development and production configs mixed

**Recommendation:** Use Pydantic Settings, add validation, separate dev/prod configs.

---

## 7. Maintainability Analysis

### 7.1 Code Organization

**Issues:**

- ❌ **Duplication:** `/lib/components/` vs `/lib/workbench/` overlap
- ❌ **Inconsistent Naming:** Mix of PascalCase and kebab-case for files
- ❌ **Deep Nesting:** Some components buried 5+ levels deep
- ❌ **Circular Dependencies:** Potential issues between stores and components

**Recommendation:** Flatten structure, standardize naming, remove duplication.

---

### 7.2 Documentation

**Strengths:**

- ✅ Extensive README files
- ✅ Architecture documentation
- ✅ Setup guides
- ✅ JSDoc comments in many files

**Issues:**

- ⚠️ **Outdated Docs:** Some reference non-existent files
- ⚠️ **Missing API Docs:** No OpenAPI spec generation
- ⚠️ **No Architecture Decision Records (ADRs):** Decisions not documented

**Recommendation:** Update docs, generate OpenAPI spec, add ADRs.

---

### 7.3 Dependency Management

**Frontend Dependencies:**

```json
{
  "dependencies": {
    "monaco-editor": "^0.55.1", // OK
    "chart.js": "^4.5.1", // OK
    "svelte-chartjs": "^3.1.5" // OK
  },
  "devDependencies": {
    "@sveltejs/kit": "^2.47.1", // Latest
    "svelte": "^5.43.10", // Latest
    "typescript": "^5.9.3", // Latest
    "vite": "^7.1.10" // Latest
  }
}
```

**Status:** ✅ Dependencies are up-to-date.

**Backend Dependencies:**

```toml
dependencies = [
    "fastapi>=0.104.0",      # OK (latest: 0.115.0)
    "uvicorn[standard]>=0.24.0",  # OK
    "pydantic>=2.0.0"        # OK (using V2)
]
```

**Status:** ✅ Dependencies are reasonably current.

**Issues:**

- ⚠️ **No Dependabot/Renovate:** No automated dependency updates
- ⚠️ **No Security Scanning:** No Snyk/Trivy integration

**Recommendation:** Add automated dependency updates, security scanning.

---

## 8. Critical Issues Summary

### 🔴 CRITICAL (Must Fix)

1. **Module Resolution Failures**
   - **Impact:** App won't build/run
   - **Files:** All workbench column imports fail
   - **Fix:** Export components properly, fix index files

2. **Store System Fragmentation**
   - **Impact:** Runtime errors, state inconsistency
   - **Files:** Dual store systems causing conflicts
   - **Fix:** Consolidate to single store pattern

3. **Missing Type Definitions**
   - **Impact:** Type safety compromised
   - **Files:** Multiple missing type imports
   - **Fix:** Create missing type files, fix imports

4. **Incomplete Features (20+ TODOs)**
   - **Impact:** Features don't work as advertised
   - **Files:** Scattered across codebase
   - **Fix:** Complete or remove incomplete features

5. **Zero Backend Tests**
   - **Impact:** No confidence in backend reliability
   - **Files:** All backend files untested
   - **Fix:** Write comprehensive test suite

6. **API Keys in Frontend**
   - **Impact:** Security vulnerability
   - **Files:** ModelSettingsSection, localStorage
   - **Fix:** Move API key handling to backend

---

### 🟡 HIGH PRIORITY (Should Fix)

7. **JSON File Storage**
   - **Impact:** Data loss risk, won't scale
   - **Files:** RunsFileRepo
   - **Fix:** Implement proper database storage

8. **CORS Wide Open**
   - **Impact:** Security vulnerability
   - **Files:** main.py
   - **Fix:** Restrict origins in production

9. **No Environment Config Validation**
   - **Impact:** Silent failures, debugging nightmare
   - **Files:** Scattered env var access
   - **Fix:** Centralize config with Pydantic Settings

10. **Low Test Coverage (3.7%)**
    - **Impact:** Bugs will slip through
    - **Files:** Only 9 tests for 242 files
    - **Fix:** Achieve 60%+ coverage

11. **No Error Tracking**
    - **Impact:** Can't debug production issues
    - **Files:** N/A
    - **Fix:** Integrate Sentry or similar

12. **No Health Checks**
    - **Impact:** Can't monitor service health
    - **Files:** N/A
    - **Fix:** Add `/health` endpoints

---

### 🟢 MEDIUM PRIORITY (Nice to Have)

13. **Bundle Size Optimization**
14. **Virtual Scrolling for Long Lists**
15. **Structured Logging**
16. **API Documentation Generation**
17. **Docker Compose for Dev Environment**
18. **Performance Monitoring**
19. **Dependency Automation**
20. **ADR Documentation**

---

## 9. Refactoring Plan

### Phase 1: Foundation Fixes (Week 1-2) 🔴 CRITICAL

**Goal:** Make the app buildable and runnable.

#### Task 1.1: Fix Module Exports

- [ ] Create index files for workbench components
- [ ] Export ContextColumn, PromptColumn, OutputColumn
- [ ] Verify all imports resolve correctly
- [ ] Test build succeeds

**Files to Create:**

```
src/lib/workbench/context/index.ts
src/lib/workbench/prompt/index.ts
src/lib/workbench/output/index.ts
```

**Expected Content:**

```typescript
// src/lib/workbench/context/index.ts
export { default as ContextColumn } from "./ContextColumn.svelte";
```

---

#### Task 1.2: Consolidate Store System

- [ ] Audit all store references
- [ ] Migrate legacy stores to rune-based pattern
- [ ] Remove duplicate store implementations
- [ ] Update all import statements
- [ ] Add store documentation

**Decision:** Keep rune-based stores in `/src/lib/stores/`, remove `/src/lib/core/stores/` references.

**Files to Migrate:**

```
✅ Keep: src/lib/stores/themeStore.ts (already good)
✅ Keep: src/lib/stores/contextStore.ts
✅ Keep: src/lib/stores/promptStore.ts
✅ Keep: src/lib/stores/runStore.ts
✅ Keep: src/lib/stores/presets.ts
❌ Remove: All references to /lib/core/stores/
```

---

#### Task 1.3: Fix Type Definitions

- [ ] Create missing type files
- [ ] Add proper type exports
- [ ] Fix implicit any usage
- [ ] Add JSDoc for complex types

**Files to Create:**

```
src/lib/types/workbench.ts (if missing)
src/lib/types/settings.ts (if missing)
```

---

#### Task 1.4: Backend Configuration

- [ ] Create `python/app/config.py` with Pydantic Settings
- [ ] Centralize environment variable access
- [ ] Add validation for required variables
- [ ] Update all routers to use config
- [ ] Create `.env.example` with all required vars

**Implementation:**

```python
# python/app/config.py
from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    # API Settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False
    log_level: str = "INFO"

    # LLM Provider Keys
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    ollama_base_url: str = "http://localhost:11434"

    # Backend Services
    dataforge_api_base: str = "http://localhost:8001"
    neuroforge_api_base: str = "http://localhost:8002"

    # Security
    cors_origins: List[str] = ["http://localhost:5173"]
    api_key_secret: str = "dev-secret-change-in-production"

    # Performance
    max_prompt_length: int = 50000
    max_concurrent_runs: int = 100
    request_timeout_seconds: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

---

### Phase 2: Complete Features (Week 3-4) 🟡 HIGH PRIORITY

#### Task 2.1: Resolve All TODOs

- [ ] Quick Run: Replace mock outputs with real API calls
- [ ] Patterns: Wire "Send to Workbench" functionality
- [ ] Contexts: Integrate with workbench context store
- [ ] Workspaces: Wire create/update to backend
- [ ] Settings: Implement export functionality
- [ ] Settings: Encrypt API credentials
- [ ] DataForge: Implement semantic search
- [ ] Adaptive: Integrate LLM stack recommendations

**Priority Order:**

1. Quick Run API integration (user-facing)
2. Patterns → Workbench integration (user-facing)
3. Contexts integration (user-facing)
4. Workspaces backend wiring (critical)
5. Settings export (nice-to-have)
6. API encryption (security)
7. Semantic search (advanced)
8. Adaptive recommendations (advanced)

---

#### Task 2.2: Replace JSON Storage

- [ ] Design database schema (PostgreSQL)
- [ ] Implement SQLAlchemy models
- [ ] Create database repository layer
- [ ] Add Alembic migrations
- [ ] Implement connection pooling
- [ ] Add transaction support
- [ ] Migrate existing JSON data

**Schema Design:**

```sql
CREATE TABLE runs (
    id UUID PRIMARY KEY,
    prompt TEXT NOT NULL,
    model VARCHAR(100) NOT NULL,
    response TEXT,
    tokens_used INT,
    cost_usd DECIMAL(10,4),
    created_at TIMESTAMP DEFAULT NOW(),
    user_id UUID REFERENCES users(id)
);

CREATE INDEX idx_runs_user_id ON runs(user_id);
CREATE INDEX idx_runs_created_at ON runs(created_at);
```

---

#### Task 2.3: Security Hardening

- [ ] Move API key handling to backend
- [ ] Implement credential encryption (Fernet)
- [ ] Add JWT authentication
- [ ] Restrict CORS origins
- [ ] Add rate limiting (slowapi)
- [ ] Implement input sanitization
- [ ] Add security headers

**Implementation:**

```python
# Add to backend
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@router.post("/runs")
@limiter.limit("10/minute")
async def create_run(request: Request, run: RunCreate):
    ...
```

---

### Phase 3: Testing & Quality (Week 5-6) 🟡 HIGH PRIORITY

#### Task 3.1: Backend Test Suite

- [ ] Add pytest configuration
- [ ] Write router tests (all endpoints)
- [ ] Write service tests
- [ ] Write repository tests
- [ ] Write middleware tests
- [ ] Add integration tests
- [ ] Target: 70%+ coverage

**Test Structure:**

```
vibeforge-backend/
└── tests/
    ├── conftest.py
    ├── unit/
    │   ├── test_routers_vibeforge.py
    │   ├── test_routers_dataforge.py
    │   ├── test_services_llm.py
    │   └── test_repositories_runs.py
    ├── integration/
    │   ├── test_api_endpoints.py
    │   └── test_dataforge_client.py
    └── fixtures/
        └── sample_data.py
```

---

#### Task 3.2: Frontend Test Suite

- [ ] Add Vitest configuration
- [ ] Write store tests (all stores)
- [ ] Write component tests (critical components)
- [ ] Add integration tests (API clients)
- [ ] Expand E2E tests (Playwright)
- [ ] Target: 60%+ coverage

**Priority Components:**

1. Stores (10+ files)
2. Workbench columns (3 files)
3. Settings sections (4 files)
4. API clients (4 files)
5. Layout components (3 files)

---

#### Task 3.3: Code Quality Tools

- [ ] Add ESLint configuration
- [ ] Add Prettier configuration
- [ ] Add pre-commit hooks (husky)
- [ ] Add Ruff for Python linting
- [ ] Add Black for Python formatting
- [ ] Configure CI/CD linting

---

### Phase 4: Operations (Week 7-8) 🟢 MEDIUM PRIORITY

#### Task 4.1: Observability

- [ ] Add structured logging (JSON format)
- [ ] Integrate OpenTelemetry for tracing
- [ ] Add Sentry for error tracking
- [ ] Expose Prometheus metrics
- [ ] Create Grafana dashboards
- [ ] Add health check endpoints

**Health Check:**

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "0.1.0",
        "dependencies": {
            "dataforge": await check_dataforge(),
            "neuroforge": await check_neuroforge()
        }
    }
```

---

#### Task 4.2: Deployment

- [ ] Create Docker Compose for dev
- [ ] Add Dockerfile for production
- [ ] Add Kubernetes manifests
- [ ] Document deployment process
- [ ] Add environment-specific configs
- [ ] Implement graceful shutdown

**Docker Compose:**

```yaml
version: "3.8"
services:
  vibeforge-frontend:
    build: ./vibeforge
    ports:
      - "5173:5173"
    environment:
      - VITE_DATAFORGE_API_BASE=http://dataforge:8001

  vibeforge-backend:
    build: ./vibeforge-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/vibeforge

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=vibeforge
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
```

---

#### Task 4.3: Performance Optimization

- [ ] Add Redis caching layer
- [ ] Implement connection pooling
- [ ] Add bundle analysis (frontend)
- [ ] Implement virtual scrolling
- [ ] Add request debouncing
- [ ] Optimize bundle size
- [ ] Add CDN for static assets

---

### Phase 5: Documentation (Week 9) 🟢 MEDIUM PRIORITY

#### Task 5.1: Technical Documentation

- [ ] Update architecture docs
- [ ] Create API documentation (OpenAPI)
- [ ] Write deployment guide
- [ ] Create ADR documentation
- [ ] Update README files
- [ ] Add troubleshooting guide

#### Task 5.2: Developer Experience

- [ ] Create getting started guide
- [ ] Add contributing guidelines
- [ ] Document testing procedures
- [ ] Create development workflow guide
- [ ] Add code style guide

---

## 10. Risk Assessment

| Risk                             | Probability | Impact   | Mitigation                     |
| -------------------------------- | ----------- | -------- | ------------------------------ |
| Module resolution breaks app     | High        | Critical | Phase 1, Task 1.1 - Priority 1 |
| Data loss from JSON storage      | Medium      | High     | Phase 2, Task 2.2 - Priority 2 |
| Security breach via exposed keys | Medium      | High     | Phase 2, Task 2.3 - Priority 2 |
| Production failures (no tests)   | High        | High     | Phase 3 - Priority 1           |
| Performance degradation          | Low         | Medium   | Phase 4, Task 4.3 - Priority 3 |
| Developer onboarding friction    | Low         | Low      | Phase 5 - Priority 4           |

---

## 11. Success Metrics

### Technical Metrics

- [ ] Build success rate: 100%
- [ ] Test coverage: 60%+ (frontend), 70%+ (backend)
- [ ] Zero critical security vulnerabilities
- [ ] API response time: <200ms (p95)
- [ ] Zero runtime errors in logs
- [ ] All TODOs resolved

### Quality Metrics

- [ ] TypeScript strict mode enabled
- [ ] Zero ESLint errors
- [ ] 100% API documentation coverage
- [ ] All exports properly typed
- [ ] No implicit any usage

### Operational Metrics

- [ ] Health check endpoint available
- [ ] Metrics exposed for monitoring
- [ ] Deployment documentation complete
- [ ] Zero downtime deployment possible
- [ ] Database backups automated

---

## 12. Timeline Summary

| Phase                  | Duration    | Priority    | Deliverables                              |
| ---------------------- | ----------- | ----------- | ----------------------------------------- |
| Phase 1: Foundation    | 2 weeks     | 🔴 Critical | Buildable app, config system, type safety |
| Phase 2: Features      | 2 weeks     | 🟡 High     | Complete TODOs, database, security        |
| Phase 3: Testing       | 2 weeks     | 🟡 High     | 60%+ coverage, quality tools              |
| Phase 4: Operations    | 2 weeks     | 🟢 Medium   | Monitoring, deployment, optimization      |
| Phase 5: Documentation | 1 week      | 🟢 Medium   | Complete docs, dev experience             |
| **Total**              | **9 weeks** |             | **Production-ready VibeForge**            |

---

## 13. Next Steps

### Immediate Actions (This Week)

1. **Create fix branches:**

   ```bash
   git checkout -b refactor/phase-1-foundation
   ```

2. **Fix module exports (Day 1):**
   - Create workbench index files
   - Test build
   - Commit and push

3. **Consolidate stores (Day 2-3):**
   - Audit all store usage
   - Migrate to single pattern
   - Update imports
   - Test functionality

4. **Backend config (Day 4-5):**
   - Create config.py
   - Update routers
   - Add validation
   - Test with environment variables

### Communication Plan

- **Daily Standups:** Report progress on current phase
- **Weekly Reviews:** Demo completed tasks to stakeholders
- **Bi-weekly Retrospectives:** Adjust plan based on learnings
- **Documentation Updates:** Keep this plan up-to-date

---

## 14. Conclusion

VibeForge has **strong architectural foundations** but suffers from **incomplete implementation** and **technical debt**. The codebase shows evidence of rapid development with good intentions but needs **systematic refactoring** to reach production quality.

**Key Takeaways:**

- 🟢 **Architecture:** Well-designed, modern stack
- 🔴 **Execution:** Incomplete features, module issues
- 🔴 **Testing:** Insufficient coverage
- 🟡 **Security:** Needs hardening
- 🟢 **Documentation:** Good but needs updates

**Recommendation:** **Proceed with refactoring plan.** The 9-week timeline is realistic and will result in a production-ready application. Prioritize Phase 1 (Foundation) and Phase 2 (Features) as they address critical issues that prevent deployment.

---

**Document Version:** 1.0  
**Last Updated:** November 25, 2025  
**Next Review:** Start of Phase 2 (Week 3)
