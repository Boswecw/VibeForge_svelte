# VibeForge_BDS – Agent System Implementation Plan (for Codex in VS Code)

**Scope:** Implement Planner, Execution, Evaluator, and Coordinator agents in VibeForge_BDS, with UI panels and backend wiring.  
**Audience:** Charles + AI pair-programmer (Codex / Copilot Chat / Claude).  
**Mode:** Follow this document step-by-step. Use each section as a prompt or checklist for your AI coding assistant.

---

## 0. Assumptions and Context

VibeForge_BDS is:

- A **Tauri desktop app** with a **SvelteKit + TypeScript** frontend.
- An internal BDS fork of VibeForge, used for real development work across Forge repos.

Forge backend services (assumed to exist):

- **ForgeAgents** – agent orchestration and PAORT sessions.
- **MAPO** – multi-step orchestration “brain” sitting between agents and NeuroForge.
- **NeuroForge** – model routing, champion/fallback models, safety layer, telemetry.
- **DataForge** – documents, vectors, SAS documents, evaluation metrics, logs.

**Non-negotiable rules (BDS-SAS):**

1. The **client must never call external LLM APIs directly**. All LLM access is via ForgeAgents → MAPO → NeuroForge.
2. The client must **not mutate production data** directly.
3. Multi-step reasoning flows are modelled as **ForgeAgents PAORT sessions**.
4. Where SAS requires safety/evaluation, these steps **cannot be bypassed**.

You will orchestrate the implementation in **phases**. Each phase has:

- Goal
- Files to create or edit
- Checklist
- A Codex prompt you can paste directly into VS Code

---

## 1. How to Use This Plan with Codex

### 1.1 Workflow

1. Open VS Code in the `VibeForge_BDS` repo.
2. Open Copilot Chat / Codex / Claude inside VS Code.
3. For each phase:
   - Copy the **“Codex Prompt for this Phase”** block.
   - Paste into your AI assistant.
   - Let it scaffold the code.
   - Review, adjust, and commit.

4. Keep this plan open as the **source of truth**. If the AI drifts, re-ground it by pasting the relevant phase.

### 1.2 General Prompt Template

Whenever you start a new phase, you can wrap the phase text like this:

> “You are helping me implement the VibeForge_BDS agent system. I will give you a phase from my implementation plan. Follow it exactly, editing/creating the files under `apps/vibeforge_bds/` (or the appropriate path). Do not invent new services. Work within the constraints described. Here is the phase:  
> [PASTE PHASE TEXT]”

---

## 2. Phase 0 – Establish Backend Client Layer

### Goal

Create a small, well-typed **API client module** in the VibeForge_BDS frontend for:

- ForgeAgents (agent sessions, PAORT streaming)
- DataForge (SAS sections, evaluation results)
- (Optionally) a simple configuration for backend base URLs.

### Files (suggested structure)

- `src/lib/api/forgeAgentsClient.ts`
- `src/lib/api/dataForgeClient.ts`
- `src/lib/api/types.ts`
- `src/lib/config/backend.ts`

### Checklist

- [ ] Define TypeScript interfaces for:
  - Agent session requests/responses
  - PAORT events / step logs
  - SAS section snippets from DataForge
- [ ] Implement functions:
  - `startPlannerSession(payload)`
  - `startExecutionSession(payload)`
  - `startEvaluatorSession(payload)`
  - `startCoordinatorSession(payload)`
  - `getSASSections(tags: string[])`
- [ ] Add a small `backend.ts` config file with base URLs:
  - e.g., `FORGE_AGENTS_BASE_URL`, `DATAFORGE_BASE_URL`
- [ ] All functions handle:
  - JSON encode/decode
  - Errors via thrown exceptions or `Result`-style types

### Codex Prompt for this Phase

> **Prompt:**  
> I am implementing the VibeForge_BDS internal agent system.  
> Create a backend client layer for ForgeAgents and DataForge.  
> Constraints:
> - Tech: SvelteKit + TypeScript.
> - No direct OpenAI/Anthropic calls from the client. All LLM-related work is via ForgeAgents → MAPO → NeuroForge.
> - APIs may be stubs for now; focus on clean interfaces and types.
>
> Please:
> 1. Create `src/lib/config/backend.ts` with strongly-typed base URL constants for ForgeAgents and DataForge.
> 2. Create `src/lib/api/types.ts` with interfaces like:
>    - `AgentSessionType = "planner" | "execution" | "evaluator" | "coordinator"`
>    - `AgentSessionRequest`, `AgentSessionResponse`
>    - `PAORTEvent` (Plan/Act/Observe/Reflect/Transition events)
>    - `SASSection` for SAS snippets from DataForge.
> 3. Create `src/lib/api/forgeAgentsClient.ts` with functions:
>    - `startPlannerSession`
>    - `startExecutionSession`
>    - `startEvaluatorSession`
>    - `startCoordinatorSession`
>    Each should accept a typed payload and call a REST endpoint on ForgeAgents.
> 4. Create `src/lib/api/dataForgeClient.ts` with functions:
>    - `getSASSectionsByTags(tags: string[])`
>    - (Optional) `getEvaluationHistory(entityId: string)`
> 5. Include clear TODO comments where real endpoint URLs or auth will later be configured.
>
> Use idiomatic TypeScript, and keep the code clean and easily testable.

---

## 3. Phase 1 – Define Agent Templates and Registry

### Goal

Create a **central registry** of agent templates describing:

- Planner, Execution, Evaluator, Coordinator templates
- Their labels, descriptions, backend pipeline ids, and SAS options

### Files

- `src/lib/agents/templates.ts`
- `src/lib/agents/types.ts`

### Checklist

- [ ] Define types:
  - `AgentKind = "planner" | "execution" | "evaluator" | "coordinator"`
  - `AgentTemplate` with fields:
    - `id`, `label`, `description`
    - `kind: AgentKind`
    - `pipelineId` (e.g., `nf.mapo.prompt_exec.v1`)
    - `allowedRepos: string[]`
    - `autoEvaluateWithSAS: boolean`
    - `locked: boolean` (cannot be edited in UI)
- [ ] Export `AGENT_TEMPLATES` grouped by kind
- [ ] Ensure templates reflect BDS-SAS constraints

### Codex Prompt for this Phase

> **Prompt:**  
> In VibeForge_BDS, I need a central registry of “agent templates” describing Planner, Execution, Evaluator, and Coordinator agents.  
> Create:
> - `src/lib/agents/types.ts`
> - `src/lib/agents/templates.ts`
>
> Requirements:
> 1. `AgentKind = "planner" | "execution" | "evaluator" | "coordinator"`.
> 2. `AgentTemplate` interface with:
>    - `id: string`
>    - `label: string`
>    - `description: string`
>    - `kind: AgentKind`
>    - `pipelineId: string` (maps to a MAPO/NeuroForge pipeline)
>    - `allowedRepos: string[]`
>    - `autoEvaluateWithSAS: boolean`
>    - `locked: boolean`
> 3. In `templates.ts`, export an `AGENT_TEMPLATES` object such as:
>    - `planner: AgentTemplate[]`
>    - `execution: AgentTemplate[]`
>    - `evaluator: AgentTemplate[]`
>    - `coordinator: AgentTemplate[]`
> 4. Seed with a few realistic examples:
>    - A planner template for “Cross-Repo Feature Plan”.
>    - An execution template for “Prompt Exec via NeuroForge”.
>    - An evaluator template for “SAS Compliance Check”.
>    - A coordinator template for “Multi-App Provider API Rollout”.
>
> Do not implement any backend calls here; this is purely configuration and types.

---

## 4. Phase 2 – Global Stores and Session Models

### Goal

Create shared **Svelte stores** to manage agent sessions and their PAORT event streams.

### Files

- `src/lib/stores/agentSessions.ts`

### Checklist

- [ ] Store types:
  - `AgentSessionSummary` (id, kind, label, status, createdAt)
  - `AgentSessionDetail` (includes PAORT events, inputs, outputs)
- [ ] Functions:
  - `createPlannerSession(...)`
  - `createExecutionSession(...)`
  - `createEvaluatorSession(...)`
  - `createCoordinatorSession(...)`
- [ ] Tie into `forgeAgentsClient` from Phase 0

### Codex Prompt for this Phase

> **Prompt:**  
> Now create a Svelte store module to track agent sessions in VibeForge_BDS.  
> File: `src/lib/stores/agentSessions.ts`.
>
> Requirements:
> 1. Define types:
>    - `AgentSessionStatus = "pending" | "running" | "completed" | "failed"`.
>    - `AgentSessionSummary` with id, kind, label, status, createdAt, `templateId`.
>    - `AgentSessionDetail` with summary + `input`, `output`, `paortEvents: PAORTEvent[]`.
> 2. Provide Svelte stores:
>    - `agentSessionSummaries` – a map or array of summaries.
>    - `agentSessionDetails` – a map from id to detail.
> 3. Provide helper functions that:
>    - Call the appropriate client functions from `forgeAgentsClient.ts` (Phase 0).
>    - Update `agentSessionSummaries` and `agentSessionDetails` when a session starts.
>    - Optionally handle a future streaming API (add TODO comments).
> 4. Keep the module purely frontend state; no Svelte components here.
>
> Use idiomatic Svelte store patterns (e.g., `writable`) and strongly typed functions.

---

## 5. Phase 3 – Planning Panel UI

### Goal

Build a **Planning Panel** UI that:

- Lists planning sessions
- Shows PAORT steps and task breakdown per repo
- Allows re-running planning with constraints

### Files

- `src/routes/planning/+page.svelte` (or similar)
- `src/routes/planning/+page.ts` (if you use load functions)
- `src/lib/components/planning/PlanningList.svelte`
- `src/lib/components/planning/PlanningDetail.svelte`

### Checklist

- [ ] List all planner sessions using `agentSessionSummaries`.
- [ ] Detail view shows:
  - PAORT steps
  - Tasks grouped by repo
  - Links to RFC-style summary text
- [ ] Provide “New Plan” dialog:
  - Accepts high-level description
  - Optional repo selection
  - Creates a new planner session using a planner template

### Codex Prompt for this Phase

> **Prompt:**  
> Implement the Planning Panel UI for VibeForge_BDS.
>
> Requirements:
> 1. Create a Svelte route under `/planning` with:
>    - A left column listing planner sessions (`AgentSessionSummary` where kind === "planner").
>    - A right column showing details of the selected session.
> 2. Use components:
>    - `src/lib/components/planning/PlanningList.svelte`
>    - `src/lib/components/planning/PlanningDetail.svelte`
> 3. `PlanningList`:
>    - Displays session label, status, createdAt, and template label.
>    - Allows selecting a session (e.g., via store or local state).
> 4. `PlanningDetail`:
>    - Shows PAORT steps in order.
>    - Shows a breakdown of tasks by repo (assume the backend returns structured `tasksByRepo` in the session detail).
>    - Includes a button “Re-plan with Updated Constraints” that:
>      - Opens a simple modal (can be a basic Svelte component).
>      - Allows editing fields like `allowedRepos` or `maxSteps`.
>      - Calls an update function or starts a new planner session.
>
> Use Tailwind utility classes for layout, assuming the project already uses Tailwind. Keep the UI clean and readable.

---

## 6. Phase 4 – Workbench Execution Panel UI

### Goal

Implement the **Execution Panel** for prompt runs, code refactors, and evaluation runs.

### Files

- `src/routes/workbench/+page.svelte`
- `src/lib/components/workbench/ExecutionForm.svelte`
- `src/lib/components/workbench/ExecutionResult.svelte`

### Checklist

- [ ] Dropdown to pick an agent template of kind `"execution"` or `"evaluator"`.
- [ ] Input area:
  - Prompt text **or** code snippet
  - Optional metadata: repo, branch, path
- [ ] On submit:
  - Create appropriate agent session
  - Show model used, pipeline id, token usage, latency, safety notes
- [ ] Link result area to `agentSessionDetails`

### Codex Prompt for this Phase

> **Prompt:**  
> Implement the Workbench Execution Panel under `/workbench` for VibeForge_BDS.
>
> Requirements:
> 1. Create `/workbench` route:
>    - A form where the user can:
>      - Select an Execution or Evaluator agent template from `AGENT_TEMPLATES`.
>      - Enter either prompt text or code snippet.
>      - (Optionally) specify repo, branch, file path metadata.
>    - On submit:
>      - Start an execution or evaluator session via the store helpers.
> 2. `ExecutionForm.svelte`:
>    - Controls the inputs and template selection.
>    - Emits an event or calls a helper to start the session.
> 3. `ExecutionResult.svelte`:
>    - Given a session id, shows:
>      - Pipeline id, model(s) used.
>      - Token usage and latency (if provided).
>      - Safety / SAS notes from the Evaluator agents.
> 4. Keep the UI generic so it can be reused for both prompt runs and refactor runs.
>
> Assume the backend returns a structured `executionMetadata` object in the session detail. Add TODO comments where you need to align with the real API.

---

## 7. Phase 5 – Agent Settings / Admin View

### Goal

Create an **Admin view** for managing agent templates and SAS-related toggles.

### Files

- `src/routes/admin/agents/+page.svelte`
- `src/lib/components/admin/AgentTemplateTable.svelte`
- `src/lib/components/admin/AgentTemplateForm.svelte`
- `src/lib/agents/templateConfig.ts` (for reading/writing config JSON in the future)

### Checklist

- [ ] List all templates from `AGENT_TEMPLATES`
- [ ] Show columns:
  - Kind, label, pipeline id, allowedRepos, autoEvaluateWithSAS, locked
- [ ] Allow editing non-locked templates in the UI (for now, in-memory)
- [ ] For now, persist changes to a local store or leave as TODO for real config I/O

### Codex Prompt for this Phase

> **Prompt:**  
> Implement an Agent Settings Admin view at `/admin/agents` in VibeForge_BDS.
>
> Requirements:
> 1. Show a table of all `AgentTemplate` entries from `AGENT_TEMPLATES`.
>    - Columns: kind, label, pipelineId, allowedRepos, autoEvaluateWithSAS, locked.
> 2. For templates where `locked === false`:
>    - Provide an “Edit” action that opens a small form (`AgentTemplateForm.svelte`).
>    - Allow editing allowedRepos and autoEvaluateWithSAS.
> 3. For now, persist edits in a Svelte store or in-memory structure.
>    - Add TODO comments indicating that in the future, this should write to a persistent JSON/YAML config via Tauri.
> 4. Make sure locked templates are visibly marked and not editable.
>
> Keep styling minimal but clear. Use Tailwind for spacing, borders, and typography.

---

## 8. Phase 6 – SAS-Aware Evaluation Utilities

### Goal

Implement a small evaluation helper layer that:

- Fetches SAS sections from DataForge
- Associates SAS checks with sessions
- Outputs structured pass/warn/fail results

### Files

- `src/lib/sas/evaluation.ts`
- Update `agentSessions` store to optionally attach SAS results

### Checklist

- [ ] Utility functions:
  - `evaluateAgainstSAS(sessionDetail): Promise<SASEvaluationResult[]>`
- [ ] Types:
  - `SASEvaluationStatus = "pass" | "warn" | "fail"`
  - `SASEvaluationResult` with sectionId, title, status, explanation
- [ ] Integrate:
  - For planner sessions: auto-run SAS check if template says `autoEvaluateWithSAS`
  - For execution sessions: same, based on template setting

### Codex Prompt for this Phase

> **Prompt:**  
> Implement SAS-aware evaluation utilities for VibeForge_BDS.
>
> Requirements:
> 1. Create `src/lib/sas/evaluation.ts` with:
>    - Types:
>      - `SASEvaluationStatus = "pass" | "warn" | "fail"`.
>      - `SASEvaluationResult` with fields: `sectionId`, `sectionTitle`, `status`, `explanation`.
>    - A function `evaluateAgainstSAS(sessionDetail: AgentSessionDetail): Promise<SASEvaluationResult[]>`.
>      - This should:
>        - Call `getSASSectionsByTags` from `dataForgeClient.ts` (tags can be inferred from session kind or template).
>        - Produce a list of SASEvaluationResult objects. For now, mock the comparison logic with TODO comments.
> 2. Update `src/lib/stores/agentSessions.ts` so that:
>    - When a session completes and its template has `autoEvaluateWithSAS === true`, it calls `evaluateAgainstSAS`.
>    - Stores the results on the session detail (e.g., `sasResults?: SASEvaluationResult[]`).
>
> Keep the code structured so real SAS comparison logic can be plugged in later.

---

## 9. Phase 7 – Coordinator Flow UI

### Goal

Implement the **Coordinator** flow for multi-repo, multi-service changes.

### Files

- `src/routes/coordinator/+page.svelte`
- `src/lib/components/coordinator/CoordinatorForm.svelte`
- `src/lib/components/coordinator/CoordinatorSummary.svelte`

### Checklist

- [ ] Form accepts:
  - High-level change description
  - Selected repos/services
- [ ] Starts a coordinator session via store helper
- [ ] Display per-repo plans + SAS summary in a single view

### Codex Prompt for this Phase

> **Prompt:**  
> Implement the Coordinator flow for multi-repo work under `/coordinator` in VibeForge_BDS.
>
> Requirements:
> 1. `/coordinator` page with:
>    - A form (`CoordinatorForm.svelte`) where the user enters:
>      - A high-level change description (e.g., “Introduce a new provider API for VibeForge, AuthorForge, WebSafe”).
>      - A multi-select of repos/services.
>    - On submit:
>      - Start a coordinator agent session using the appropriate template and store helper.
> 2. `CoordinatorSummary.svelte`:
>    - Given the coordinator session detail, shows:
>      - Per-repo plans (tasks, order, risks).
>      - Cross-repo checklist.
>      - Top-level SAS evaluation summary.
> 3. Assume the backend returns a structure like:
>    - `perRepoPlans: { repo: string; tasks: string[]; }[]`
>    - `globalChecklist: string[]`
>    - `sasSummary: SASEvaluationResult[]`
>    Add TODO comments where real types need alignment with APIs.
>
> The goal is to give a single pane of glass for multi-app changes.

---

## 10. Phase 8 – Telemetry Hooks and Observability (Light Pass)

### Goal

Attach simple telemetry logging hooks so that:

- Agent session lifecycle events can be forwarded to DataForge
- Future observability is easier

### Files

- `src/lib/telemetry/telemetry.ts`
- Calls added inside `agentSessions` helpers

### Checklist

- [ ] Define a simple `logEvent` helper that:
  - Accepts event type, session id, metadata
  - For now, logs to console + TODO for DataForge ingestion
- [ ] Wire `logEvent` to:
  - Session created
  - Session completed
  - SAS evaluation completed

### Codex Prompt for this Phase

> **Prompt:**  
> Add a light telemetry layer for agent sessions in VibeForge_BDS.
>
> Requirements:
> 1. Create `src/lib/telemetry/telemetry.ts` with a `logEvent` function:
>    - Parameters: `eventType: string`, `sessionId: string`, `metadata?: Record<string, unknown>`.
>    - For now, just `console.log` structured messages and add a TODO to write to DataForge later.
> 2. In `src/lib/stores/agentSessions.ts`, call `logEvent` when:
>    - A session is started.
>    - A session completes or fails.
>    - SAS evaluation finishes.
>
> Keep things minimal but clearly structured so we can later replace console logging with real API calls.

---

## 11. Final Notes and Next Steps

Once all phases are implemented:

- You will have:
  - A **Planning Panel** for structured, SAS-aware feature planning.
  - A **Workbench Execution Panel** for prompt runs, refactors, and evaluation flows.
  - An **Agent Settings Admin View** for template management.
  - A **Coordinator View** for cross-repo, cross-app changes.
  - A minimal SAS-aware evaluation layer and telemetry hooks.

Next steps after this plan:

- Wire real ForgeAgents/DataForge API URLs and auth.
- Replace stubbed evaluation logic with your actual BDS-SAS documents and rules.
- Add tests for the key utilities and stores.
- Iterate on UX/UI as you dogfood this in real BDS dev work.

Use this document as the **single coordination artifact** with Codex / Copilot / Claude. Work one phase at a time, commit often, and keep BDS-SAS constraints intact.
