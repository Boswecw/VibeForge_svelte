# Architecture

**Document version:** 1.1

High-level architecture, authority posture, and surface ownership.

> **Disambiguation:** this document is about VibeForge's *governance architecture* (authority boundaries, component roles, the doctrine introduced in [00-overview.md](00-overview.md)). The pre-existing root [`ARCHITECTURE.md`](../../ARCHITECTURE.md) describes the *product/UI architecture* from earlier Phase 2/3 work (the three-column workbench, Cortex, MCP integration). They are different layers of meaning under the same word — read both, don't conflate them.

## Architecture overview

VibeForge borrows internal architecture patterns from Forge-ecosystem-style systems without exposing all of their internal names or authority to commercial users. Today, only `Forge_Command` (`/home/charlie/Forge/ecosystem/Forge_Command`) exists as a real, separate repo; the rest of the components below describe VibeForge's own internal doctrine and future architecture, not external technical dependencies that exist on disk yet. Treat the table below as the authoritative *ownership boundary* reference as these components come online, so authority never blurs between them:

```text
Agents may propose.
Boards may recommend.
SMITH may gate.
Developers decide.
Receipts prove.
```

## Component role map

| Component | Owns | Does not own |
|---|---|---|
| SMITH / forge-smithy | Authority gates, patch classification, approval receipts, policy checks, command permission decisions, receipt finalization, autonomy enforcement | Model execution, context compilation, board synthesis, cloud analytics, UI rendering |
| YellowJacket | Workcell lifecycle, run states, permission envelope validation, artifact packaging, review packet generation, degraded/checkpoint/resume states | Canonical truth, app authority, unrestricted execution, final approval, billing, cloud routing |
| PCC (context control) | Context pack construction, minimization, source refs, redaction, token/context budgets, cloud payload preview, context selection receipts | Final authority, agent execution, patch application, board verdicts, billing |
| PACT | Contract drift gates, schema compatibility, continuity findings, cross-repo contract alignment, promotion gate checks | Agent execution, source mutation, human approval, cloud analytics |
| ForgeAgents | Agent execution, role-specific worker behavior, tool invocation under permission envelope, local/cloud worker adapters | Authority, final patch approval, data privacy policy, schema truth |
| NeuronForge | Local AI orchestration, local model route, local fallback, local inference configuration | Commercial billing, final patch authority, Cloud DataForge analytics |
| NeuroForge | Optional cloud reasoning, model routing, deep analysis jobs, comparative model jobs | Local source of truth, developer approval, raw repo persistence, Cloud DataForge privacy policy |
| Rake | Ingestion, docs/source preparation, research enrichment, evidence candidate preparation | Canonical promotion, patch authority, human approval |
| VibeForge Local Evidence Vault | Private local records, evidence retention, decisions, receipts, AARs, context manifests | Company analytics, billing, remote usage aggregation |
| Cloud DataForge | Privacy-safe analytics, usage metering, billing metrics, route performance, quota events, product health | Source code, prompts, diffs, raw logs, secrets, full local evidence |
| Forge_Command (pattern donor only) | Operator cockpit, authority boundaries, traceability, receipts, validation profiles, worktree staging, autonomy tiers, exception-first UI, kill switch — borrowed patterns, not a runtime dependency | ForgeCustomer/admin/fleet-update business logic — VibeForge does not copy this |

See [`repo.manifest.yaml`](../../repo.manifest.yaml) for VibeForge's own product-level `owns`/`does_not_own` boundary (this repo's surface, not the full ecosystem table above), and `upstream_authorities`, which currently lists only `Forge_Command` since it's the sole component of the table above that exists as a real repo today.
