# VibeForge Refactoring - Implementation Checklist

**Reference:** `TECHNICAL_DUE_DILIGENCE_REFACTORING_PLAN.md`  
**Start Date:** November 25, 2025  
**Status:** 📋 Ready to Begin

---

## 🔴 Phase 1: Foundation Fixes (Week 1-2)

### ✅ Task 1.1: Fix Module Exports

**Status:** 🔲 Not Started  
**Assignee:** ******\_******  
**Estimated Time:** 4 hours  
**Priority:** P0 - Critical

#### Checklist

- [ ] **Step 1:** Verify current workbench component structure

  ```bash
  cd /home/charles/projects/Coding2025/Forge/vibeforge
  ls -la src/lib/workbench/context/
  ls -la src/lib/workbench/prompt/
  ls -la src/lib/workbench/output/
  ```

- [ ] **Step 2:** Create index.ts for context column

  ```bash
  touch src/lib/workbench/context/index.ts
  ```

  **Content:**

  ```typescript
  export { default as ContextColumn } from "./ContextColumn.svelte";
  ```

- [ ] **Step 3:** Create index.ts for prompt column

  ```bash
  touch src/lib/workbench/prompt/index.ts
  ```

  **Content:**

  ```typescript
  export { default as PromptColumn } from "./PromptColumn.svelte";
  ```

- [ ] **Step 4:** Create index.ts for output column

  ```bash
  touch src/lib/workbench/output/index.ts
  ```

  **Content:**

  ```typescript
  export { default as OutputColumn } from "./OutputColumn.svelte";
  ```

- [ ] **Step 5:** Update imports in `src/routes/+page.svelte`

  ```typescript
  // Before:
  import ContextColumn from "$lib/workbench/context/ContextColumn.svelte";

  // After:
  import { ContextColumn } from "$lib/workbench/context";
  ```

- [ ] **Step 6:** Test build

  ```bash
  pnpm run build
  ```

- [ ] **Step 7:** Test dev server

  ```bash
  pnpm run dev
  ```

- [ ] **Step 8:** Commit changes
  ```bash
  git add src/lib/workbench/*/index.ts src/routes/+page.svelte
  git commit -m "fix: add proper exports for workbench components"
  ```

**Validation:**

- ✅ Build completes without errors
- ✅ Dev server starts successfully
- ✅ Workbench page loads without console errors
- ✅ All three columns render correctly

---

### ✅ Task 1.2: Consolidate Store System

**Status:** 🔲 Not Started  
**Assignee:** ******\_******  
**Estimated Time:** 16 hours  
**Priority:** P0 - Critical

#### Checklist

- [ ] **Step 1:** Audit all store references

  ```bash
  grep -r "from '\$lib/stores/" src/ | tee store-audit.txt
  grep -r "from '\$lib/core/stores/" src/ | tee -a store-audit.txt
  ```

- [ ] **Step 2:** List existing stores

  ```bash
  ls -la src/lib/stores/
  ```

  **Expected:**
  - accessibilityStore.ts
  - contextStore.ts
  - dataforgeStore.ts
  - estimation.ts
  - learning.ts
  - neuroforgeStore.ts
  - palette.ts
  - presets.ts
  - promptStore.ts
  - researchStore.ts
  - runStore.ts
  - themeStore.ts
  - toast.svelte.ts
  - versions.ts

- [ ] **Step 3:** Identify missing stores
  - [ ] Check if workbenchStore is needed
  - [ ] Check if any core/stores references exist
  - [ ] Document which stores are actually used

- [ ] **Step 4:** Remove references to non-existent `/lib/core/stores/`

  ```bash
  # Find all references
  grep -r "lib/core/stores" src/

  # Update each file to use /lib/stores/ instead
  ```

- [ ] **Step 5:** Ensure all stores use consistent patterns
  - [ ] Verify themeStore.ts pattern (writable + localStorage)
  - [ ] Verify contextStore.ts exports
  - [ ] Verify promptStore.ts exports
  - [ ] Verify runStore.ts exports
  - [ ] Verify presets.ts exports

- [ ] **Step 6:** Create index.ts for stores (optional)

  ```bash
  touch src/lib/stores/index.ts
  ```

  **Content:**

  ```typescript
  export { theme } from "./themeStore";
  export { contextStore } from "./contextStore";
  export { promptStore } from "./promptStore";
  export { runStore } from "./runStore";
  export { presets } from "./presets";
  // ... export all stores
  ```

- [ ] **Step 7:** Update all import statements

  ```typescript
  // Option 1: Direct imports
  import { theme } from "$lib/stores/themeStore";

  // Option 2: Barrel export
  import { theme, contextStore } from "$lib/stores";
  ```

- [ ] **Step 8:** Test all store functionality
  - [ ] Theme toggle works
  - [ ] Context blocks save/load
  - [ ] Prompt state persists
  - [ ] Run history populates
  - [ ] Presets save/load

- [ ] **Step 9:** Run type checking

  ```bash
  pnpm run check
  ```

- [ ] **Step 10:** Commit changes
  ```bash
  git add src/lib/stores/
  git commit -m "refactor: consolidate store system to single pattern"
  ```

**Validation:**

- ✅ No references to `/lib/core/stores/`
- ✅ All stores export consistently
- ✅ Type checking passes
- ✅ All features using stores work correctly

---

### ✅ Task 1.3: Fix Type Definitions

**Status:** 🔲 Not Started  
**Assignee:** ******\_******  
**Estimated Time:** 8 hours  
**Priority:** P0 - Critical

#### Checklist

- [ ] **Step 1:** Audit type imports

  ```bash
  grep -r "import type" src/lib/ | grep -E "types/" | tee type-audit.txt
  ```

- [ ] **Step 2:** List existing type files

  ```bash
  ls -la src/lib/types/
  ```

- [ ] **Step 3:** Check for missing type files
  - [ ] workbench.ts
  - [ ] settings.ts
  - [ ] wizard.ts
  - [ ] learning.ts

- [ ] **Step 4:** Create missing type files as needed

  ```bash
  # If workbench.ts is missing:
  touch src/lib/types/workbench.ts
  ```

  **Content:**

  ```typescript
  /**
   * Workbench-specific types
   */

  export interface WorkbenchState {
    activeContexts: string[];
    promptText: string;
    selectedModels: string[];
  }

  export interface ColumnLayout {
    leftWidth: number;
    rightWidth: number;
  }

  // Add more types as needed
  ```

- [ ] **Step 5:** Enable TypeScript strict mode

  ```json
  // tsconfig.json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true
    }
  }
  ```

- [ ] **Step 6:** Fix any implicit errors

  ```bash
  pnpm run check 2>&1 | tee type-errors.txt
  ```

- [ ] **Step 7:** Add JSDoc comments to complex types

  ```typescript
  /**
   * Represents a context block in the workbench
   * @property id - Unique identifier
   * @property name - Display name
   * @property content - Block content (markdown)
   */
  export interface ContextBlock {
    id: string;
    name: string;
    content: string;
  }
  ```

- [ ] **Step 8:** Export all types from index

  ```bash
  touch src/lib/types/index.ts
  ```

  **Content:**

  ```typescript
  export * from "./workbench";
  export * from "./settings";
  export * from "./learning";
  // ... export all type modules
  ```

- [ ] **Step 9:** Update imports to use barrel export

  ```typescript
  // Before:
  import type { WorkbenchState } from "$lib/types/workbench";

  // After (optional):
  import type { WorkbenchState } from "$lib/types";
  ```

- [ ] **Step 10:** Run type checking

  ```bash
  pnpm run check
  ```

- [ ] **Step 11:** Commit changes
  ```bash
  git add src/lib/types/
  git commit -m "fix: add missing type definitions and enable strict mode"
  ```

**Validation:**

- ✅ TypeScript strict mode enabled
- ✅ No implicit any warnings
- ✅ All type imports resolve
- ✅ `pnpm run check` passes with 0 errors

---

### ✅ Task 1.4: Backend Configuration

**Status:** 🔲 Not Started  
**Assignee:** ******\_******  
**Estimated Time:** 6 hours  
**Priority:** P0 - Critical

#### Checklist

- [ ] **Step 1:** Create config.py

  ```bash
  cd /home/charles/projects/Coding2025/Forge/vibeforge-backend
  touch python/app/config.py
  ```

- [ ] **Step 2:** Implement Pydantic Settings

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

      # Storage
      data_dir: str = "data"

      class Config:
          env_file = ".env"
          case_sensitive = False

  settings = Settings()
  ```

- [ ] **Step 3:** Update main.py to use config

  ```python
  # python/app/main.py
  from app.config import settings

  app = FastAPI(
      title="VibeForge Backend",
      debug=settings.debug
  )

  app.add_middleware(
      CORSMiddleware,
      allow_origins=settings.cors_origins,  # Use config
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

- [ ] **Step 4:** Update routers to use config

  ```python
  # python/app/routers/vibeforge.py
  from app.config import settings

  # Replace os.getenv() with:
  api_key = settings.anthropic_api_key
  ```

- [ ] **Step 5:** Update LLM service to use config

  ```python
  # python/app/services/llm_service.py
  from app.config import settings

  class LLMService:
      def __init__(self):
          self.anthropic_key = settings.anthropic_api_key
          self.openai_key = settings.openai_api_key
  ```

- [ ] **Step 6:** Update .env.example

  ```bash
  cat > .env.example << 'EOF'
  # API Settings
  API_HOST=0.0.0.0
  API_PORT=8000
  DEBUG=false
  LOG_LEVEL=INFO

  # LLM Providers
  ANTHROPIC_API_KEY=sk-ant-your-key-here
  OPENAI_API_KEY=sk-your-key-here
  OLLAMA_BASE_URL=http://localhost:11434

  # Backend Services
  DATAFORGE_API_BASE=http://localhost:8001
  NEUROFORGE_API_BASE=http://localhost:8002

  # Security
  CORS_ORIGINS=["http://localhost:5173"]
  API_KEY_SECRET=change-this-in-production

  # Performance
  MAX_PROMPT_LENGTH=50000
  MAX_CONCURRENT_RUNS=100
  REQUEST_TIMEOUT_SECONDS=60

  # Storage
  DATA_DIR=data
  EOF
  ```

- [ ] **Step 7:** Add pydantic-settings to dependencies

  ```bash
  # Update pyproject.toml
  # Add to dependencies:
  # "pydantic-settings>=2.0.0"
  ```

- [ ] **Step 8:** Install dependencies

  ```bash
  pip install pydantic-settings
  ```

- [ ] **Step 9:** Test configuration loading

  ```bash
  python -c "from python.app.config import settings; print(settings.model_dump())"
  ```

- [ ] **Step 10:** Test server starts

  ```bash
  cd python
  uvicorn app.main:app --reload
  ```

- [ ] **Step 11:** Commit changes
  ```bash
  git add python/app/config.py python/app/main.py python/app/routers/ .env.example
  git commit -m "feat: centralize configuration with Pydantic Settings"
  ```

**Validation:**

- ✅ Config loads from .env file
- ✅ All environment variables validated
- ✅ Server starts without errors
- ✅ No direct os.getenv() calls in routers

---

## 🟡 Phase 2: Complete Features (Week 3-4)

### ✅ Task 2.1: Resolve All TODOs

**Status:** 🔲 Not Started  
**Assignee:** ******\_******  
**Estimated Time:** 24 hours  
**Priority:** P1 - High

#### Sub-Task 2.1.1: Quick Run API Integration

- [ ] **Step 1:** Locate TODO

  ```bash
  grep -n "TODO: Replace mock outputs" src/routes/quick-run/+page.svelte
  ```

- [ ] **Step 2:** Review current mock implementation
  - [ ] Understand data structure
  - [ ] Identify API endpoint needed
  - [ ] Check if backend endpoint exists

- [ ] **Step 3:** Implement real API call

  ```typescript
  // src/routes/quick-run/+page.svelte

  async function executeRun() {
    try {
      const response = await fetch(`${API_BASE}/v1/vibeforge/runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          prompt: promptText,
          models: selectedModels,
          parameters: {
            temperature,
            maxTokens,
          },
        }),
      });

      const results = await response.json();
      // Update UI with results
    } catch (error) {
      console.error("Run failed:", error);
    }
  }
  ```

- [ ] **Step 4:** Update UI to show loading state
- [ ] **Step 5:** Add error handling
- [ ] **Step 6:** Test with real backend
- [ ] **Step 7:** Remove TODO comment

#### Sub-Task 2.1.2: Patterns → Workbench Integration

- [ ] **Step 1:** Locate TODO

  ```bash
  grep -n "TODO: Wire.*Send to Workbench" src/routes/patterns/+page.svelte
  ```

- [ ] **Step 2:** Implement pattern transfer

  ```typescript
  // src/routes/patterns/+page.svelte

  import { goto } from "$app/navigation";
  import { promptStore } from "$lib/stores/promptStore";

  function sendToWorkbench(pattern: Pattern) {
    // Update prompt store
    promptStore.setText(pattern.template);

    // Navigate to workbench
    goto("/");
  }
  ```

- [ ] **Step 3:** Add button to pattern cards
- [ ] **Step 4:** Test navigation
- [ ] **Step 5:** Verify prompt pre-fills
- [ ] **Step 6:** Remove TODO comment

#### Sub-Task 2.1.3: Contexts Integration

- [ ] **Step 1:** Wire context selection to workbench
- [ ] **Step 2:** Test context blocks appear in workbench
- [ ] **Step 3:** Remove TODO comment

#### Sub-Task 2.1.4: Workspaces Backend Wiring

- [ ] **Step 1:** Create backend endpoint for workspace CRUD
- [ ] **Step 2:** Update frontend to call backend
- [ ] **Step 3:** Test create/update/delete
- [ ] **Step 4:** Remove TODO comment

#### Sub-Task 2.1.5: Settings Export

- [ ] **Step 1:** Implement export to JSON
- [ ] **Step 2:** Add download functionality
- [ ] **Step 3:** Test export
- [ ] **Step 4:** Remove TODO comment

#### Sub-Task 2.1.6: API Encryption

- [ ] **Step 1:** Move credential handling to backend
- [ ] **Step 2:** Implement encryption with Fernet
- [ ] **Step 3:** Update frontend to not store keys
- [ ] **Step 4:** Remove TODO comment

#### Sub-Task 2.1.7: Semantic Search

- [ ] **Step 1:** Integrate vector store (DataForge)
- [ ] **Step 2:** Implement search endpoint
- [ ] **Step 3:** Test search results
- [ ] **Step 4:** Remove TODO comment

#### Sub-Task 2.1.8: Adaptive Recommendations

- [ ] **Step 1:** Integrate LLM advisor
- [ ] **Step 2:** Implement recommendation logic
- [ ] **Step 3:** Test recommendations
- [ ] **Step 4:** Remove TODO comment

**Validation:**

- ✅ `grep -r "TODO" src/` returns 0 results
- ✅ All features work end-to-end
- ✅ No mock data in production code

---

### ✅ Task 2.2: Replace JSON Storage

**Status:** 🔲 Not Started  
**Assignee:** ******\_******  
**Estimated Time:** 16 hours  
**Priority:** P1 - High

#### Checklist

- [ ] **Step 1:** Design database schema

  ```sql
  CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      prompt TEXT NOT NULL,
      model VARCHAR(100) NOT NULL,
      response TEXT,
      tokens_used INT,
      cost_usd DECIMAL(10,4),
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE INDEX idx_runs_user_id ON runs(user_id);
  CREATE INDEX idx_runs_created_at ON runs(created_at);
  ```

- [ ] **Step 2:** Add SQLAlchemy to dependencies

  ```toml
  # pyproject.toml
  dependencies = [
      "sqlalchemy>=2.0.0",
      "asyncpg>=0.29.0",  # For async PostgreSQL
      "alembic>=1.12.0"
  ]
  ```

- [ ] **Step 3:** Create SQLAlchemy models

  ```bash
  touch python/app/models/database.py
  ```

- [ ] **Step 4:** Implement database models

  ```python
  # python/app/models/database.py
  from sqlalchemy import Column, String, Integer, Text, DECIMAL, DateTime
  from sqlalchemy.dialects.postgresql import UUID, JSONB
  from sqlalchemy.ext.declarative import declarative_base
  import uuid
  from datetime import datetime

  Base = declarative_base()

  class Run(Base):
      __tablename__ = "runs"

      id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
      user_id = Column(UUID(as_uuid=True), nullable=True)
      prompt = Column(Text, nullable=False)
      model = Column(String(100), nullable=False)
      response = Column(Text)
      tokens_used = Column(Integer)
      cost_usd = Column(DECIMAL(10, 4))
      metadata = Column(JSONB)
      created_at = Column(DateTime, default=datetime.utcnow)
  ```

- [ ] **Step 5:** Setup Alembic for migrations

  ```bash
  cd python
  alembic init alembic
  ```

- [ ] **Step 6:** Create initial migration

  ```bash
  alembic revision --autogenerate -m "Initial schema"
  ```

- [ ] **Step 7:** Create database repository

  ```bash
  touch python/app/repositories/runs_db.py
  ```

- [ ] **Step 8:** Implement repository

  ```python
  # python/app/repositories/runs_db.py
  from sqlalchemy.ext.asyncio import AsyncSession
  from sqlalchemy import select
  from app.models.database import Run
  from typing import List, Optional
  import uuid

  class RunsDBRepo:
      def __init__(self, session: AsyncSession):
          self.session = session

      async def create(self, run_data: dict) -> Run:
          run = Run(**run_data)
          self.session.add(run)
          await self.session.commit()
          await self.session.refresh(run)
          return run

      async def get_by_id(self, run_id: uuid.UUID) -> Optional[Run]:
          result = await self.session.execute(
              select(Run).where(Run.id == run_id)
          )
          return result.scalar_one_or_none()

      async def list(self, limit: int = 100, offset: int = 0) -> List[Run]:
          result = await self.session.execute(
              select(Run).limit(limit).offset(offset)
          )
          return result.scalars().all()
  ```

- [ ] **Step 9:** Setup database connection

  ```python
  # python/app/database.py
  from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
  from sqlalchemy.orm import sessionmaker
  from app.config import settings

  engine = create_async_engine(
      settings.database_url,
      echo=settings.debug,
      pool_size=10,
      max_overflow=20
  )

  async_session = sessionmaker(
      engine, class_=AsyncSession, expire_on_commit=False
  )

  async def get_db():
      async with async_session() as session:
          yield session
  ```

- [ ] **Step 10:** Update routers to use DB repo

  ```python
  # python/app/routers/vibeforge.py
  from app.database import get_db
  from app.repositories.runs_db import RunsDBRepo
  from sqlalchemy.ext.asyncio import AsyncSession

  @router.post("/runs")
  async def create_run(
      run: RunCreate,
      db: AsyncSession = Depends(get_db)
  ):
      repo = RunsDBRepo(db)
      result = await repo.create(run.model_dump())
      return result
  ```

- [ ] **Step 11:** Migrate existing JSON data

  ```python
  # python/scripts/migrate_json_to_db.py
  import json
  import asyncio
  from app.database import async_session
  from app.repositories.runs_db import RunsDBRepo

  async def migrate():
      with open('data/runs.json', 'r') as f:
          runs = json.load(f)

      async with async_session() as session:
          repo = RunsDBRepo(session)
          for run_data in runs:
              await repo.create(run_data)

      print(f"Migrated {len(runs)} runs")

  if __name__ == "__main__":
      asyncio.run(migrate())
  ```

- [ ] **Step 12:** Add DATABASE_URL to config

  ```python
  # python/app/config.py
  database_url: str = "postgresql+asyncpg://user:pass@localhost/vibeforge"
  ```

- [ ] **Step 13:** Test database operations

  ```bash
  python scripts/migrate_json_to_db.py
  ```

- [ ] **Step 14:** Remove JSON storage code

  ```bash
  # Optional: keep as fallback
  mv python/app/repositories/runs_file.py python/app/repositories/runs_file.py.bak
  ```

- [ ] **Step 15:** Commit changes
  ```bash
  git add python/app/models/ python/app/repositories/ python/app/database.py
  git commit -m "feat: replace JSON storage with PostgreSQL"
  ```

**Validation:**

- ✅ Database migrations run successfully
- ✅ CRUD operations work
- ✅ Existing data migrated
- ✅ No data loss
- ✅ Connection pooling active

---

### ✅ Task 2.3: Security Hardening

**Status:** 🔲 Not Started  
**Assignee:** ******\_******  
**Estimated Time:** 12 hours  
**Priority:** P1 - High

#### Checklist

- [ ] **Step 1:** Move API key handling to backend
- [ ] **Step 2:** Implement JWT authentication
- [ ] **Step 3:** Add rate limiting
- [ ] **Step 4:** Restrict CORS origins
- [ ] **Step 5:** Add input sanitization
- [ ] **Step 6:** Add security headers
- [ ] **Step 7:** Implement credential encryption
- [ ] **Step 8:** Add audit logging

**Detailed steps to be added...**

---

## 🟡 Phase 3: Testing & Quality (Week 5-6)

_[Detailed checklists to be added]_

---

## 🟢 Phase 4: Operations (Week 7-8)

_[Detailed checklists to be added]_

---

## 🟢 Phase 5: Documentation (Week 9)

_[Detailed checklists to be added]_

---

## Progress Tracking

### Week 1 Progress

- [ ] Task 1.1: Fix Module Exports
- [ ] Task 1.2: Consolidate Store System

### Week 2 Progress

- [ ] Task 1.3: Fix Type Definitions
- [ ] Task 1.4: Backend Configuration

### Week 3 Progress

- [ ] Task 2.1: Resolve All TODOs (Part 1)

### Week 4 Progress

- [ ] Task 2.1: Resolve All TODOs (Part 2)
- [ ] Task 2.2: Replace JSON Storage

### Week 5 Progress

- [ ] Task 2.3: Security Hardening
- [ ] Task 3.1: Backend Test Suite

### Week 6 Progress

- [ ] Task 3.2: Frontend Test Suite
- [ ] Task 3.3: Code Quality Tools

### Week 7 Progress

- [ ] Task 4.1: Observability
- [ ] Task 4.2: Deployment

### Week 8 Progress

- [ ] Task 4.3: Performance Optimization

### Week 9 Progress

- [ ] Task 5.1: Technical Documentation
- [ ] Task 5.2: Developer Experience

---

## Daily Standup Template

**Date:** ****\_\_****  
**Assignee:** ****\_\_****

**Yesterday:**

- Completed: ****\_\_****
- Blockers: ****\_\_****

**Today:**

- Working on: ****\_\_****
- Need help with: ****\_\_****

**Tomorrow:**

- Planning to: ****\_\_****

---

## Notes

- Update this checklist as you complete tasks
- Add estimated vs. actual time for future planning
- Document any decisions or changes in approach
- Link to related PRs or issues

---

**Document Version:** 1.0  
**Last Updated:** November 25, 2025
