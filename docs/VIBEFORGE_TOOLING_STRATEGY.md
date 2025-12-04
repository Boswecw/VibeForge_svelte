# VibeForge AI Tooling Strategy (Codex Prompt Derived)

## Executive Summary
- **Objective:** Optimize AI-assisted engineering for solo or small teams using Opus, Sonnet, Copilot, and ChatGPT while evolving VibeForge into the orchestrating, Linux-native automation layer.
- **Approach:** Assign clear roles to each model, automate routine steps with VibeForge, and enforce cost-aware routing that defaults to free/local capabilities where possible.
- **Outcome:** Lower spend (target 30–50% reduction), faster iteration cycles, and a reusable workflow blueprint that scales across projects.

## Architecture Overview
```
Developer  ⇄  VibeForge CLI/GUI orchestrator
            ├─ Context manager (ingest/trim/index repos, docs, tickets)
            ├─ Router (cost/perf-aware) → Opus | Sonnet | ChatGPT | Local LLMs | Copilot inline
            ├─ Prompt templates + chain library (planning, refactor, tests, docs)
            ├─ Task graph + memory (runs, artifacts, diffs, test logs)
            └─ Integrations: git, CI, issue trackers, Deploy (Render/Netlify/Railway/Fly/local Docker)
```

## Tool Role Matrix
| Workstream | Opus (Claude Max) | Sonnet (Claude VS Code) | Copilot | ChatGPT | VibeForge Automation |
| --- | --- | --- | --- | --- | --- |
| Deep reasoning, architecture, ADRs | Primary (derive plans, ADR drafts) | Secondary (refine) | N/A | Alternate perspectives | Auto-prompt ADR template, archive decisions |
| Multi-file refactors / migrations | Reviewer of plan; risk analysis | Primary editing + codegen | Inline accelerators | Optional code-style brainstorming | Generate refactor plan, apply patches, run tests |
| Repo analysis / onboarding | Strategy + knowledge map | Structured summaries | N/A | Narrative summaries | Auto-index repo, produce briefings |
| Tests & QA | Test strategy, property-based ideas | Implement tests | Scaffold assertions | Edge-case ideation | Orchestrate test matrix, run & report |
| Docs & tutorials | Information architecture | Create doc skeletons | Auto-complete snippets | Tone/style shifts | Synthesize changelogs, README updates |
| Deployment & ops | Risk/cost modeling | Config generation | YAML snippets | Checklists | Scaffold IaC templates, cost diffs |
| Daily coding | Architectural check-ins | Main co-editor | Inline hints | Brainstorming | Manage context windows, switch models |

### What VibeForge Should Fully Automate
- Context ingestion (git history, open PRs, issues, docs) and semantic search caches.
- Prompt routing based on task type, sensitivity, and spend budget.
- Patch application, formatting, lint/test execution, and artifact bundling.
- Standardized deliverables (plans, ADRs, QA reports, release notes).
- Cost dashboards plus alerts for inefficient usage (e.g., overusing Opus for boilerplate).

## Cost Optimization Strategy
| Area | Essential | Reducible/Replaceable | Hosting Optimization | Expected Savings |
| --- | --- | --- | --- | --- |
| Reasoning | Keep Opus for weekly deep dives/ADRs | Prefer Sonnet/local for routine Q&A | N/A | 10–20% by limiting Opus calls |
| Editing | Sonnet sessions for structured edits | Copilot for inline; avoid Opus editing | N/A | 5–10% (shorter Sonnet sessions) |
| Brainstorming | ChatGPT light usage | Offload to local LLM when privacy allows | N/A | 2–5% |
| Hosting | N/A | Move from Render/Netlify to Railway/Fly or Docker on a small VPS | Use dev/stage auto-suspend; containerize | 15–25% infra savings |
| Automation | VibeForge batch tasks | Replace manual Opus prompts with templates | Cache contexts locally | 5–10% |

**Monthly target:** $130 → ~$70–90 through Opus throttling, shorter Sonnet sessions, and cheaper hosting.

## Ideal Engineering Workflow (2026)
1. **Daily kickoff**: VibeForge ingests git status/issues, builds context packs. Router suggests: Opus for plan, Sonnet for execution.
2. **Planning (15–30 min)**: Opus generates plan/ADR; VibeForge captures tasks and converts to prompts for Sonnet.
3. **Implementation (90–150 min)**: Sonnet drives multi-file edits via VibeForge patches; Copilot handles inline completions. VibeForge runs fmt/lint/tests after each patch set.
4. **Review loop**: Opus audits diffs/test logs; VibeForge enforces checklist (perf/security/regression). ChatGPT offers tone/style or UX copy variants.
5. **Docs & release**: VibeForge autogenerates changelog, doc updates, deployment scripts; Sonnet applies. Opus final verification for risky changes.
6. **Deploy**: VibeForge triggers CI, builds Docker image, deploys to cost-optimized target (Railway/Fly/local). Post-deploy health checks logged.
7. **Retro/metrics**: Cost + usage report; VibeForge flags inefficient patterns and recommends routing tweaks.

## VibeForge Feature Specification
- **Model Router**: Cost/performance rules; fallbacks to local models; per-task budgets; supports Opus/Sonnet/ChatGPT + future providers.
- **Context Manager**: Repo indexer (AST + embeddings), ticket/doc ingestion, change summaries, recency prioritization, automatic trimming.
- **Prompt Library**: Codex-style templates for planning, refactor, testgen, docs, ADRs, risk reviews; parameterized for model strengths.
- **Execution Engine**: Apply patches, run formatters/tests, capture artifacts, and maintain task graphs; supports dry-run and rollback.
- **Quality Gates**: Security/perf lint bundles, regression heuristics, test coverage targets, release checklists.
- **Cost Dashboard**: Per-model spend, session length, cache hits, overuse alerts; recommendations (e.g., "switch to Sonnet for boilerplate").
- **Integrations**: Git/CI/CD, issue trackers, telemetry, secret scanning; deploy helpers for Render/Netlify/Railway/Fly/local Docker.
- **Interfaces**: Linux-native CLI, TUI, optional minimal GUI; VS Code extension adapter; headless API for scripts.
- **Data Residency**: Local-first caching; redact sensitive data; configurable offline mode with local LLMs.

## Final Workflow Blueprint (Playbook)
- **Inputs**: Tasks/issues → VibeForge → context pack + routing plan.
- **Flows**:
  - *Plan*: Opus → ADR/plan → stored in repo.
  - *Execute*: Sonnet via VibeForge patches; Copilot assists; auto-tests.
  - *Review*: Opus risk audit; ChatGPT UX copy; VibeForge enforces gates.
  - *Release*: VibeForge builds, deploys, and logs artifacts.
- **Cadence**: Weekly deep-opus session; daily Sonnet sprints; continuous Copilot inline; nightly cost/usage report.

## Future Roadmap
- **1 year:** Stable router + context manager; local LLM fallback; CLI/TUI; cost dashboards; automated ADR/test/report generation.
- **2 years:** Multi-project orchestration, hierarchical memory, predictive routing (learned from telemetry), richer GUI, deeper CI/CD hooks.
- **5 years:** Fully autonomous dev loops for routine work, hybrid local/cloud inference, policy-aware code generation, self-optimizing cost/perf profiles, and ecosystem plugins (Forge Ecosystem) for domain-specific automation.

## Optional Templates
- JSON-schema or Claude Projects prompt variants can be auto-generated by VibeForge from this document to seed new projects or teams.
