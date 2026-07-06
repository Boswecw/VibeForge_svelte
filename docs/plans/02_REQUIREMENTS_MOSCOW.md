# 02 — Requirements — MoSCoW Prioritization

## Product scope

VibeForge v1 is a local-first AI engineering workbench for serious developers. It governs agentic coding by combining repo truth, context control, isolated workcells, board-style review, local evidence, provenance receipts, and explicit developer authority.

## Must have

| ID | Requirement | Acceptance condition |
|---|---|---|
| M-001 | Local-first operation | User can scan repo, create review packets, run local validation, view receipts, and manage patch candidates without cloud |
| M-002 | Active tree protection | No agent writes to active working tree by default; candidate work happens in isolated worktrees |
| M-003 | Local Evidence Vault | PostgreSQL-backed local vault stores runs, tool calls, context manifests, patch candidates, board reviews, decisions, receipts, validations |
| M-004 | Developer authority | Developer can approve, approve with modification, reject, defer, or send back recommendations |
| M-005 | Patch receipts | Every candidate patch has source commit, patch manifest hash, context hash, validation refs, board refs, and decision refs |
| M-006 | Context pack control | Every agent/cloud job receives bounded context with manifest, hash, included/excluded summary, and redaction receipt |
| M-007 | Cloud approval gate | Cloud jobs require route class, payload preview, credit estimate, redaction summary, approval, and receipt |
| M-008 | Safe analytics allowlist | Cloud DataForge rejects source content, diffs, prompts, outputs, paths, repo names, branches, commits, logs, and secrets |
| M-009 | Command/path policy | Shell/tool commands and file operations are classified before execution |
| M-010 | Board review MVP | Security, testing, architecture, and product/reliability roles produce evidence-backed recommendation cards |
| M-011 | Validation profiles | Docs, frontend, backend, contract, security, and cloud analytics changes map to validation profiles |
| M-012 | Kill switch | User can stop all running workcells and revoke tool execution with cancellation receipts |
| M-013 | No fabricated state | UI state is derived from local vault state, live process state, or explicit degraded marker |
| M-014 | Installer/doctor | User can install, start, stop, inspect, backup, and repair the local vault |
| M-015 | Audit export | User can export redacted evidence bundle for patch, PR, or support case |

## Should have

| ID | Requirement | Acceptance condition |
|---|---|---|
| S-001 | Desktop cockpit | Dashboard, control room, board inbox, patch queue, receipts, cloud usage, kill switch |
| S-002 | CLI parity | Core flows available through CLI |
| S-003 | GitHub/GitLab PR package | PR summary can be created without leaking local evidence |
| S-004 | Provider routing | Local/cloud model routes configurable per workspace policy |
| S-005 | BYOK | Provider keys stored through OS keyring |
| S-006 | Multi-round Delphi board | Independent findings, disagreement exposure, synthesis, minority report |
| S-007 | AAR learning | Post-run lessons propose instruction/policy/test updates without applying silently |
| S-008 | Budget controls | Hard caps by route, day, week, workspace, and provider |
| S-009 | Golden fixtures | Privacy/security/receipt/analytics gates have negative test fixtures |
| S-010 | OpenTelemetry-compatible local traces | Privacy-controlled local observability export path |

## Could have

- Team policy sync.
- Enterprise private cloud or on-prem route.
- SSO/RBAC.
- SIEM export.
- Signed third-party workcell packs.
- IDE extensions.

## Won't have in MVP

- Auto-merge to protected branches.
- Silent cloud repo upload.
- Hidden background mutation.
- Compliance certification claims.
- Full enterprise governance suite.
- Autonomous production deploys.
- Centralized source-code storage.

## Premium MVP workflow

```text
scan repo
→ generate repo truth
→ request agent review
→ build context pack
→ run isolated workcell
→ produce candidate patch
→ validate patch
→ run board review
→ inspect recommendation cards
→ approve/modify/reject
→ store receipt
→ export PR/evidence summary
```
