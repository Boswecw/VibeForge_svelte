# 10 — Contractor Handoff

## Contractor objective

Build the MVP trust loop first:

```text
repo scan → mission → context pack → isolated workcell → patch candidate → validation → board cards → developer decision → receipt
```

Do not implement broad autonomous coding before this loop exists.

## Repo structure recommendation

```text
vibeforge/
  apps/
    cockpit/                 # SvelteKit UI
    desktop/                 # Tauri shell
    cli/                     # Rust CLI
  crates/
    authority-gate/          # policies, risk, approvals
    vault/                   # Postgres migrations/repositories
    repo-scanner/            # repo truth, instruction drift
    context-control/         # manifests/redaction/preview
    workcells/               # runtime contracts
    validation/              # validation profiles and command runner
    receipts/                # hash chains and receipt schemas
    cloud-client/            # approved cloud jobs/safe analytics
  agents/
    adapters/
    prompts/
  schemas/
    json/
    sql/
  fixtures/
    privacy/
    security/
    receipts/
    workcells/
  docs/
```

## Epics

### Epic 1 — Vault and migrations

- Create local PostgreSQL lifecycle manager.
- Implement migrations from `04_DATA_MODEL_SQL.md`.
- Add `schema_migrations`.
- Implement repository layer.
- Implement `vibeforge vault status`, `backup`, and `doctor`.

Done when backup/restore preserves receipt hashes and doctor detects missing migrations/orphan refs.

### Epic 2 — Authority Gate

- Implement risk classifier.
- Implement autonomy tiers.
- Implement permission envelope validation.
- Implement path canonicalization with symlink resolution.
- Implement command risk classifier.
- Implement kill switch.
- Emit mission/security events.

Done when traversal, symlink, `.env`, `sudo`, `rm -rf`, and `curl | sh` fixtures block.

### Epic 3 — Repo truth and instruction drift

- Build repo scanner.
- Detect languages/frameworks/dependency files.
- Detect test/build commands.
- Detect agent instruction files.
- Produce `RepoTruthSnapshot`.
- Implement instruction drift findings.

Done when snapshot hash is stable and instruction contradictions are flagged.

### Epic 4 — Context Control

- Build context selector.
- Add redaction scanner.
- Add context pack manifest.
- Add cloud payload preview.
- Add token/size budgeting.
- Store context refs in vault.

Done when cloud payload cannot execute without preview and secret-like fixtures are excluded.

### Epic 5 — Workcell runtime

- Create isolated git worktree manager.
- Implement workcell state machine.
- Implement agent run ledger.
- Implement tool call runner.
- Add pause/resume/cancel.
- Package review packet.

Done when candidate patch is generated without active tree mutation.

### Epic 6 — Validation profiles

- Implement profile resolver.
- Implement command runner with structured args.
- Capture status, refs, exit code, summaries.
- Add block conditions.

Done when failed required validation blocks promotion unless developer accepts risk with reason.

### Epic 7 — Board review

- Implement board review packet.
- Implement role-specific review prompts/adapters.
- Implement recommendation card schema.
- Implement material disagreement detector.
- Implement developer decision API.

Done when conflicting reviewer fixture shows disagreement and minority report.

### Epic 8 — Patch receipts

- Implement patch manifest.
- Implement receipt hash.
- Implement previous receipt hash.
- Implement receipt validation.
- Implement PR/export package.

Done when tampering with diff or manifest invalidates receipt.

### Epic 9 — Cloud and safe analytics

- Implement cloud approval workflow.
- Implement credit estimate.
- Implement provider route config.
- Implement safe analytics allowlist validator.
- Implement budget caps.
- Implement Local Lock mode.

Done when unknown analytics fields and forbidden strings block transmission.

### Epic 10 — Cockpit UI

- Build dashboard.
- Build Agent Control Room.
- Build Board Review Inbox.
- Build Patch Candidate Queue.
- Build Receipts Browser.
- Build Cloud Usage View.
- Build Kill Switch.
- Implement degraded-state UI.

Done when every UI card shows status, evidence, risk, options, and receipt.

## First 10 tickets

1. Create workspace/repository/mission tables and migration runner.
2. Implement vault status/doctor CLI.
3. Implement path canonicalization library with fixtures.
4. Implement command classifier with fixtures.
5. Implement mission state machine.
6. Implement repo scanner snapshot and hash.
7. Implement context pack manifest and redaction receipt.
8. Implement isolated worktree creation and cleanup.
9. Implement validation run table and docs_only profile.
10. Implement RecommendationCard and DeveloperDecision APIs.
