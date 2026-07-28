# Epic 4 — Context Control

Status: **implemented, build/test unverified** (written in an environment
without a Rust toolchain — run `cargo test` / `cargo check` to confirm).

Realizes doc 06 "Algorithm 2 — Context pack builder" and the doc 07
privacy/redaction rules. Milestone M4 in
`docs/plans/08_IMPLEMENTATION_MILESTONES.md`; Epic 4 in
`docs/plans/10_CONTRACTOR_HANDOFF.md`.

## What it does

Builds a bounded, redacted, content-addressed **context pack** for a mission,
and gates any cloud escalation behind a mandatory, forbidden-field-scanned,
developer-approved **cloud payload preview**.

The two exit-gate properties are enforced as pure, unit-tested functions:

- **"a cloud payload cannot execute without a preview."**
  `context_control::cloud_preview::authorize_cloud_execution` fails closed on
  three independent conditions — no preview, a failed forbidden-field scan, or
  an unapproved preview — and there is no bypass path.
- **"secret-like fixtures are excluded."** `budget::select_within_budget`
  drops whole items marked `secret_like` (e.g. `.env`) before budgeting;
  `redaction::redact` scrubs token/key/credential/PII-like values out of every
  included item; `path_alias` replaces private absolute paths with stable
  aliases so no host path reaches the vault or a payload.

## Layout

Pure engine (no DB, no filesystem, mirrors `repo_truth/`'s split):

```
src-tauri/src/context_control/
  mod.rs             RouteClass, EvidenceItem, module wiring
  redaction.rs       token/key/credential/PII scrubber
  path_alias.rs      private-absolute-path -> stable alias
  budget.rs          token estimate, budget selection, credit estimate
  forbidden_fields.rs analytics allowlist + cloud-payload denylist scanner
  manifest.rs        context pack builder + content-addressed hash
  cloud_preview.rs   cloud payload preview + the cloud authorization gate
  fixtures_test.rs   fixture-driven end-to-end tests (cfg(test))
```

Persistence (vault repository layer):

```
src-tauri/src/vault/context_control.rs   context_pack + cloud_payload_preview
```

CLI (orchestration):

```
src-tauri/src/bin/vibeforge_context.rs   build-pack / cloud-preview / approve / show-pack
```

Fixtures (also consumed by `build-pack --evidence-file`):

```
src-tauri/fixtures/context_control/evidence.clean.json
src-tauri/fixtures/context_control/evidence.with_secret.json
```

## Vault

Uses the pre-existing `context_pack` and `cloud_payload_preview` tables and the
`ctx_` / `prv_` id prefixes already defined in migration 001 — no schema
migration was required. The vault stores summaries + the `context_pack_hash`
only; raw redacted content never becomes a column (same discipline as
`repo_truth`).

## CLI flow

```bash
# build a pack for a mission (evidence derived from the mission's latest
# repo-truth snapshot, plus optional --evidence-file)
vibeforge_context build-pack --mission-id mis_... --route-class deep_cloud --cloud-allowed

# generate a cloud preview — prints BLOCKED (unapproved), transmits nothing
vibeforge_context cloud-preview --context-pack-id ctx_...

# record developer approval; re-checks the gate
vibeforge_context approve --preview-id prv_... --decision-id dec_...
```

## Not in scope (deferred)

- Full-content re-derivation of a pack for a live cloud job (belongs to the
  Epic 5 workcell that holds the source).
- The `developer_decision` row itself (Epic 7); Epic 4 only writes the
  `approved_decision_id` reference the gate reads.
- Wiring the pure gate into an actual cloud transport (Epic 9 cloud client).

## Verification TODO (blocked on toolchain)

```bash
cd src-tauri
cargo test --bin vibeforge_context      # runs the context_control unit + fixture tests
cargo check --bins
```
