# 08 — Implementation and Milestones

## Build doctrine

```text
Build trust rails first.
Then build useful agents.
Then add cloud acceleration.
Then add commercial/team features.
```

## Milestones

| Milestone | Goal | Exit gate |
|---|---|---|
| M0 Product boundary | Freeze customer language, privacy modes, non-goals | No ambiguity between Local Evidence Vault and Cloud DataForge |
| M1 Repo truth | Scanner, AGENTS.md proposal, drift checker | Drift fixture fails when instructions contradict repo truth |
| M2 Vault | Local PostgreSQL lifecycle, migrations, status/backup/doctor | Backup/restore and doctor pass |
| M3 Authority Gate | Risk classifier, autonomy tiers, path/command policy, kill switch | malicious path/command fixtures block |
| M4 Context Control | Context manifest, redaction, cloud preview | cloud route blocked without approved preview |
| M5 Workcell runtime | Isolated worktrees, workcell states, agent/tool ledger | candidate patch created without active tree mutation |
| M6 Validation | validation profiles and runner | failed required validation blocks promotion |
| M7 Board Review | review packet, recommendation cards, developer decisions | approve/modify/reject/defer/send-back all produce receipts |
| M8 Patch Receipts | patch manifest, hash chain, export package | tampering invalidates receipt |
| M9 Cloud MVP | credit estimates, approval modal, safe analytics, budgets | forbidden analytics fields blocked |
| M10 Agent Fleet | planner, cartographer, coder, tester, security, architecture, synthesizer | candidate patch + board cards generated |
| M11 Cockpit Polish | dashboard, control room, board inbox, patch queue, receipts, cloud usage | full workflow via UI |
| M12 Commercial Beta | license tiers, BYOK, onboarding, docs, support export | 10 beta users complete workflow without support |
| M13 Team/Enterprise | policy sync, PR package, SSO/RBAC/SIEM designs | enterprise claims limited to proven scope |

## Validation profiles

| Profile | Typical trigger | Required checks |
|---|---|---|
| docs_only | Markdown/docs | lint links where available, no code validation required |
| frontend_change | UI routes/components | typecheck, unit/component tests, build |
| backend_rust_change | Rust crates | fmt, clippy, tests |
| backend_python_change | Python adapters | ruff/format/type/test where configured |
| contract_change | JSON schema/API/SQL | schema validation, migration test, compatibility test |
| security_change | auth/secrets/policy/path/command | full relevant tests + security fixture suite |
| cloud_analytics_change | cloud events | allowlist positive/negative fixtures |

## Owner map

| Workstream | Owner type |
|---|---|
| Vault/database | Backend/database engineer |
| Authority/security | Security/backend engineer |
| Workcells/process | Systems engineer |
| Context/model routing | AI platform engineer |
| Board/recommendation | AI/product engineer |
| Cockpit | Frontend/Tauri engineer |
| Cloud/billing | Full-stack/cloud engineer |
| Commercial beta | Product/engineering lead |

## Release rule

A feature is not complete until it has:

```text
contract
local receipt path
negative fixture
visible failure state
documentation
```
