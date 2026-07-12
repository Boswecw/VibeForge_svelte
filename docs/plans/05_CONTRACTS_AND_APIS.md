# 05 — Contracts and APIs

## Contract principles

- JSON contracts are versioned.
- New fields must be additive.
- Breaking changes require a new schema version.
- Every contract has positive and negative fixtures.
- Cloud-bound contracts must pass privacy classification before transmission.
- All IDs are opaque strings.
- All timestamps are RFC 3339 UTC.

## RecommendationCard.v1

```json
{
  "schema_version": "vibeforge.recommendation_card.v1",
  "recommendation_id": "rec_01J...",
  "mission_id": "mis_01J...",
  "board_review_id": "brd_01J...",
  "board_sources": ["security", "testing", "architecture"],
  "title": "Add missing negative-path authorization test",
  "risk_level": "high",
  "confidence": {
    "evidence": "medium",
    "reviewer_agreement": "high",
    "validation": "low",
    "overall": "medium"
  },
  "verdict": "request_changes",
  "why_it_matters": "Authorization behavior changed without proving denial for non-admin users.",
  "evidence_refs": ["evi_01J...", "tool_01J..."],
  "affected_files": ["src/auth/session.ts"],
  "suggested_action": "Add a negative-path test before approving the patch.",
  "developer_options": ["apply_suggested_patch", "modify", "reject", "send_back", "defer"],
  "context_pack_hash": "sha256:...",
  "pact_gate_status": "pass_with_warning",
  "validation_refs": ["val_01J..."],
  "created_at": "2026-07-03T00:00:00Z"
}
```

## DeveloperDecision.v1

```json
{
  "schema_version": "vibeforge.developer_decision.v1",
  "decision_id": "dec_01J...",
  "mission_id": "mis_01J...",
  "recommendation_id": "rec_01J...",
  "developer_id": "local-user",
  "decision": "approved_with_modification",
  "reason": "Accepting the test requirement but applying manually.",
  "accepted_risk": false,
  "created_at": "2026-07-03T00:00:00Z",
  "trace_id": "trc_01J..."
}
```

## CloudPayloadPreview.v1

```json
{
  "schema_version": "vibeforge.cloud_payload_preview.v1",
  "preview_id": "prv_01J...",
  "mission_id": "mis_01J...",
  "context_pack_id": "ctx_01J...",
  "job_type": "DeepArchitectureReview",
  "route_class": "deep_cloud",
  "estimated_credits": 34,
  "included_summary": ["repo architecture summary", "selected dependency metadata", "redacted snippets from 4 files"],
  "excluded_summary": [".env files", "ignored files", "secret-like values", "private branch names"],
  "redaction_summary": ["3 token-like strings redacted", "2 private paths replaced with stable aliases"],
  "forbidden_field_scan_passed": true,
  "approval_required": true,
  "created_at": "2026-07-03T00:00:00Z"
}
```

## AnalyticsSafeEvent.v1

```json
{
  "schema_version": "vibeforge.analytics_safe_event.v1",
  "event_id": "evt_01J...",
  "account_id": "acct_01J...",
  "workspace_id": "ws_01J...",
  "license_tier": "pro",
  "app_version": "0.1.0",
  "os_family": "linux",
  "feature_name": "cloud_deep_review",
  "job_type": "DeepArchitectureReview",
  "route_class": "deep_cloud",
  "provider_family": "anthropic",
  "model_family": "claude",
  "credit_cost": 34,
  "duration_ms": 88422,
  "success_state": "success",
  "error_category": null,
  "timestamp": "2026-07-03T00:00:00Z"
}
```

Forbidden in analytics:

```text
source code
diffs
raw prompts
raw model outputs
raw terminal output
test logs
file paths
private repo names
branch names
commit messages
secrets
.env contents
issue/PR text
user documents
```

## VibePatchReceipt.v1

```json
{
  "schema_version": "vibeforge.patch_receipt.v1",
  "receipt_id": "rcp_01J...",
  "patch_id": "pat_01J...",
  "mission_id": "mis_01J...",
  "repo_id": "repo_01J...",
  "source_commit": "40hex",
  "target_base_commit": "40hex",
  "worktree_ref": "wt_01J...",
  "context_pack_hash": "sha256:...",
  "patch_manifest_hash": "sha256:...",
  "files_changed": [
    {"path_alias": "file_001", "display_path": "src/auth/session.ts", "action": "modify", "sha256_after": "sha256:..."}
  ],
  "validation": {"profile": "security_change", "status": "passed", "validation_refs": ["val_01J..."]},
  "board_review_refs": ["brd_01J..."],
  "developer_decision_refs": ["dec_01J..."],
  "decision": "approved_for_branch",
  "outcome": "branch_created",
  "receipt_hash": "sha256:...",
  "created_at": "2026-07-03T00:00:00Z"
}
```

## Local service API

Base URL:

```text
http://127.0.0.1:<ephemeral-port>/api/v1
```

Authentication:

```text
local-only bearer token generated at startup
token stored in OS keyring or process memory
desktop app obtains token through Tauri command bridge
```

| Method | Path | Purpose |
|---|---|---|
| POST | `/missions` | Create mission |
| GET | `/missions/{mission_id}` | Fetch mission |
| POST | `/missions/{mission_id}/classify` | Classify risk/autonomy |
| POST | `/missions/{mission_id}/cancel` | Cancel and receipt |
| GET | `/missions/{mission_id}/events` | Stream mission events |
| POST | `/missions/{mission_id}/context-packs` | Build context pack |
| POST | `/context-packs/{context_pack_id}/cloud-preview` | Generate cloud payload preview |
| POST | `/missions/{mission_id}/workcells` | Start workcell |
| POST | `/workcells/{workcell_run_id}/pause` | Pause workcell |
| POST | `/workcells/{workcell_run_id}/resume` | Resume workcell |
| POST | `/workcells/{workcell_run_id}/cancel` | Cancel workcell |
| POST | `/missions/{mission_id}/board-reviews` | Create board review |
| POST | `/recommendations/{recommendation_id}/decisions` | Record developer decision |
| GET | `/patches/{patch_id}` | Fetch patch candidate |
| POST | `/patches/{patch_id}/validate` | Run validation |
| POST | `/patches/{patch_id}/export-pr-package` | Export PR summary |
| GET | `/receipts/{receipt_id}` | Fetch receipt |
| POST | `/vault/backup` | Create backup |
| GET | `/vault/status` | Health/status |
| POST | `/vault/doctor` | Run repair diagnostics |

## Forge Yellowjacket support-agent reference

Internal planning and future adapter work should resolve Yellowjacket support
runner references to:

```text
git@github.com:Boswell-Digital-Solutions/forge-yellowjacket.git
/home/charlie/Forge/apps/public-app-local-support/yellowjacket
```

VibeForge contracts may reference Forge Yellowjacket receipts, review packets,
permission envelopes, and replay proof by opaque artifact IDs or hashes. They
must not embed raw model output, raw terminal logs, source text, or canonical app
state from that repo.

## Cloud API

| Method | Path | Purpose | Payload class |
|---|---|---|---|
| POST | `/v1/cloud-jobs` | Submit approved cloud job | Redacted approved payload |
| GET | `/v1/cloud-jobs/{cloud_job_id}` | Poll cloud job | Metadata |
| POST | `/v1/analytics/events` | Submit safe analytics event | Safe event only |
| GET | `/v1/credits/estimate` | Estimate route cost | Metadata + job class |

## CLI surface

```bash
vibeforge doctor
vibeforge vault status
vibeforge vault backup --out ./backup.vf
vibeforge repo scan .
vibeforge mission create --repo . --title "Review auth patch"
vibeforge mission run <mission_id> --mode candidate-patch
vibeforge mission cancel <mission_id>
vibeforge context preview <mission_id> --cloud
vibeforge board review <mission_id>
vibeforge patches list
vibeforge patches show <patch_id>
vibeforge patches validate <patch_id> --profile security_change
vibeforge receipts show <receipt_id>
vibeforge export pr-package <patch_id> --out ./vibeforge-pr-summary.md
vibeforge kill-switch --all
```
