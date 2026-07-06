# 04 — Data Model — Local PostgreSQL Evidence Vault

## Purpose

The Local Evidence Vault is the customer-side system of record. It stores evidence, not just logs. The schema must support audit, rollback, review, privacy proof, and contractor implementation.

## Database rules

- One local vault per user workspace group by default.
- Source content is not duplicated unless pinned to a local receipt artifact.
- Raw secrets are never stored.
- Rows are append-first where possible.
- Authority-sensitive updates create events.
- All timestamps are UTC.
- All hashes are SHA-256 hex unless otherwise specified.
- All cloud-bound fields must be classified before transmission.

## Core enums

```sql
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE mission_state AS ENUM (
  'drafted','classified','blocked','context_ready','awaiting_cloud_approval',
  'admitted','running','paused','awaiting_review','decision_pending',
  'sent_back','approved','modified','rejected','failed','cancelled','receipt_finalized'
);

CREATE TYPE verdict AS ENUM (
  'approve','approve_with_conditions','request_changes','reject','defer','needs_human_review'
);

CREATE TYPE decision_kind AS ENUM (
  'approved','approved_with_modification','rejected','deferred','sent_back_to_fleet','accepted_risk'
);

CREATE TYPE command_risk_class AS ENUM (
  'read_only','build_test','write_scoped','network','destructive','privileged','forbidden'
);
```

## Workspace and repository

```sql
CREATE TABLE workspace (
  workspace_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  vault_schema_version TEXT NOT NULL,
  privacy_mode TEXT NOT NULL CHECK (privacy_mode IN ('local_lock','approval','team','enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE repository (
  repo_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspace(workspace_id) ON DELETE CASCADE,
  repo_root_hash TEXT NOT NULL,
  vcs_type TEXT NOT NULL CHECK (vcs_type IN ('git')),
  default_branch_hash TEXT,
  current_head TEXT,
  repo_alias TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, repo_root_hash)
);
```

## Repo truth and drift

```sql
CREATE TABLE repo_truth_snapshot (
  snapshot_id TEXT PRIMARY KEY,
  repo_id TEXT NOT NULL REFERENCES repository(repo_id) ON DELETE CASCADE,
  head_commit TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  language_summary JSONB NOT NULL DEFAULT '{}',
  framework_summary JSONB NOT NULL DEFAULT '{}',
  dependency_summary JSONB NOT NULL DEFAULT '{}',
  test_command_candidates JSONB NOT NULL DEFAULT '[]',
  build_command_candidates JSONB NOT NULL DEFAULT '[]',
  agent_instruction_files JSONB NOT NULL DEFAULT '[]',
  snapshot_hash TEXT NOT NULL,
  UNIQUE(repo_id, head_commit, snapshot_hash)
);

CREATE TABLE instruction_drift_finding (
  finding_id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL REFERENCES repo_truth_snapshot(snapshot_id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  drift_type TEXT NOT NULL,
  severity risk_level NOT NULL,
  finding_summary TEXT NOT NULL,
  evidence_refs JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Missions, workcells, agents

```sql
CREATE TABLE mission (
  mission_id TEXT PRIMARY KEY,
  repo_id TEXT NOT NULL REFERENCES repository(repo_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  request_summary TEXT NOT NULL,
  requested_by TEXT NOT NULL DEFAULT 'local-user',
  risk_level risk_level NOT NULL DEFAULT 'medium',
  state mission_state NOT NULL DEFAULT 'drafted',
  autonomy_tier TEXT NOT NULL CHECK (autonomy_tier IN ('advisory','candidate_patch','approval_gated_cloud','team_policy')),
  source_commit TEXT NOT NULL,
  active_context_pack_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mission_event (
  event_id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES mission(mission_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('developer','system','agent','board','cloud')),
  actor_id TEXT NOT NULL,
  event_payload JSONB NOT NULL DEFAULT '{}',
  previous_state mission_state,
  next_state mission_state,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workcell_run (
  workcell_run_id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES mission(mission_id) ON DELETE CASCADE,
  workcell_type TEXT NOT NULL,
  permission_envelope JSONB NOT NULL,
  state TEXT NOT NULL,
  worktree_path_hash TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agent_run (
  agent_run_id TEXT PRIMARY KEY,
  workcell_run_id TEXT NOT NULL REFERENCES workcell_run(workcell_run_id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  model_route TEXT NOT NULL,
  provider_family TEXT,
  state TEXT NOT NULL,
  input_context_pack_hash TEXT,
  output_artifact_refs JSONB NOT NULL DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Tool calls and security events

```sql
CREATE TABLE tool_call (
  tool_call_id TEXT PRIMARY KEY,
  agent_run_id TEXT REFERENCES agent_run(agent_run_id) ON DELETE SET NULL,
  mission_id TEXT NOT NULL REFERENCES mission(mission_id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  command_risk command_risk_class,
  command_preview TEXT,
  path_scope JSONB NOT NULL DEFAULT '[]',
  approval_required BOOLEAN NOT NULL DEFAULT false,
  approved_by_decision_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('planned','blocked','approved','running','success','failed','cancelled')),
  stdout_ref TEXT,
  stderr_ref TEXT,
  exit_code INTEGER,
  receipt_hash TEXT
);

CREATE TABLE security_event (
  security_event_id TEXT PRIMARY KEY,
  mission_id TEXT REFERENCES mission(mission_id) ON DELETE SET NULL,
  event_class TEXT NOT NULL,
  risk_level risk_level NOT NULL,
  blocked BOOLEAN NOT NULL DEFAULT true,
  reason TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Context, cloud preview, validation, patches

```sql
CREATE TABLE context_pack (
  context_pack_id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES mission(mission_id) ON DELETE CASCADE,
  context_type TEXT NOT NULL,
  route_class TEXT NOT NULL CHECK (route_class IN ('local','quick_cloud','deep_cloud','team_policy')),
  token_budget INTEGER NOT NULL,
  included_summary JSONB NOT NULL DEFAULT '[]',
  excluded_summary JSONB NOT NULL DEFAULT '[]',
  redaction_summary JSONB NOT NULL DEFAULT '[]',
  source_refs JSONB NOT NULL DEFAULT '[]',
  cloud_allowed BOOLEAN NOT NULL DEFAULT false,
  context_pack_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cloud_payload_preview (
  preview_id TEXT PRIMARY KEY,
  context_pack_id TEXT NOT NULL REFERENCES context_pack(context_pack_id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL REFERENCES mission(mission_id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  route_class TEXT NOT NULL,
  estimated_credits INTEGER NOT NULL CHECK (estimated_credits >= 0),
  included_summary JSONB NOT NULL DEFAULT '[]',
  excluded_summary JSONB NOT NULL DEFAULT '[]',
  redaction_summary JSONB NOT NULL DEFAULT '[]',
  forbidden_field_scan_passed BOOLEAN NOT NULL DEFAULT false,
  approved_decision_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE validation_run (
  validation_run_id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES mission(mission_id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned','running','passed','failed','blocked','cancelled','degraded')),
  command_refs JSONB NOT NULL DEFAULT '[]',
  summary TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE patch_candidate (
  patch_id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES mission(mission_id) ON DELETE CASCADE,
  repo_id TEXT NOT NULL REFERENCES repository(repo_id) ON DELETE CASCADE,
  source_commit TEXT NOT NULL,
  target_base_commit TEXT NOT NULL,
  worktree_ref TEXT NOT NULL,
  patch_manifest_hash TEXT NOT NULL,
  diff_summary TEXT NOT NULL,
  files_changed JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK (status IN ('candidate','awaiting_review','approved','rejected','applied','abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Board, decisions, receipts

```sql
CREATE TABLE board_review (
  board_review_id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES mission(mission_id) ON DELETE CASCADE,
  patch_id TEXT REFERENCES patch_candidate(patch_id) ON DELETE SET NULL,
  round INTEGER NOT NULL DEFAULT 1,
  review_mode TEXT NOT NULL CHECK (review_mode IN ('quick','deep','delphi')),
  material_disagreement BOOLEAN NOT NULL DEFAULT false,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recommendation_card (
  recommendation_id TEXT PRIMARY KEY,
  board_review_id TEXT NOT NULL REFERENCES board_review(board_review_id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL REFERENCES mission(mission_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  verdict verdict NOT NULL,
  risk_level risk_level NOT NULL,
  confidence JSONB NOT NULL,
  why_it_matters TEXT NOT NULL,
  evidence_refs JSONB NOT NULL DEFAULT '[]',
  affected_files JSONB NOT NULL DEFAULT '[]',
  suggested_action TEXT NOT NULL,
  developer_options JSONB NOT NULL DEFAULT '[]',
  context_pack_hash TEXT,
  validation_refs JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE developer_decision (
  decision_id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES mission(mission_id) ON DELETE CASCADE,
  recommendation_id TEXT REFERENCES recommendation_card(recommendation_id) ON DELETE SET NULL,
  decision decision_kind NOT NULL,
  reason TEXT,
  accepted_risk BOOLEAN NOT NULL DEFAULT false,
  actor_id TEXT NOT NULL DEFAULT 'local-user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE patch_receipt (
  receipt_id TEXT PRIMARY KEY,
  patch_id TEXT NOT NULL REFERENCES patch_candidate(patch_id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL REFERENCES mission(mission_id) ON DELETE CASCADE,
  context_pack_hash TEXT NOT NULL,
  patch_manifest_hash TEXT NOT NULL,
  validation_refs JSONB NOT NULL DEFAULT '[]',
  board_review_refs JSONB NOT NULL DEFAULT '[]',
  developer_decision_refs JSONB NOT NULL DEFAULT '[]',
  outcome TEXT NOT NULL,
  receipt_hash TEXT NOT NULL,
  previous_receipt_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Indexes

```sql
CREATE INDEX idx_repository_workspace ON repository(workspace_id);
CREATE INDEX idx_repo_truth_repo_head ON repo_truth_snapshot(repo_id, head_commit);
CREATE INDEX idx_mission_repo_state ON mission(repo_id, state);
CREATE INDEX idx_mission_event_mission_time ON mission_event(mission_id, created_at);
CREATE INDEX idx_workcell_mission ON workcell_run(mission_id);
CREATE INDEX idx_agent_run_workcell ON agent_run(workcell_run_id);
CREATE INDEX idx_tool_call_mission ON tool_call(mission_id);
CREATE INDEX idx_context_mission ON context_pack(mission_id);
CREATE INDEX idx_patch_candidate_mission ON patch_candidate(mission_id);
CREATE INDEX idx_recommendation_mission ON recommendation_card(mission_id);
CREATE INDEX idx_decision_mission ON developer_decision(mission_id);
```

## Backup and retention

| Data class | Default retention | Export |
|---|---:|---|
| Receipts | Keep until workspace deletion | Full/exportable |
| Patch candidates | 180 days or cleanup policy | Redacted diff summary/exportable |
| Tool stdout/stderr refs | 30 days unless pinned | Redacted only |
| Context manifests | Mission retention | Manifest exportable; raw context local only |
| Cloud previews | Mission retention | Exportable |
| Security events | Workspace retention | Exportable |
| Raw secrets | Never store | Not applicable |

## Minimum vault tests

- Create/read mission lifecycle.
- Candidate patch produces receipt and hash chain.
- Cloud job blocked without preview.
- Analytics event blocked when forbidden field appears.
- Security event written for blocked path traversal.
- Backup and restore produce equivalent receipt hashes.
- Local Lock mode prevents all cloud attempts.
