# 03 — Method — Architecture, Trust Lanes, and Workflows

## Comparable product landscape

Many agentic coding tools can now read repositories, edit files, run commands, and prepare pull requests. VibeForge should not compete as "another coder." It should become the trust layer around whichever coder, model, IDE, or cloud agent the developer already uses.

| Product family | Center of gravity | VibeForge premium response |
|---|---|---|
| Cloud coding agents | Remote task execution and PR generation | Govern through payload previews, local receipts, privacy-safe analytics |
| Terminal coding agents | Fast repo edits and command execution | Wrap with permission envelopes, command policy, context manifests, receipts |
| Local coding agents | Developer-machine execution | Require worktree isolation, patch receipts, validation, developer authority |
| AI IDEs | In-editor productivity | Add cross-tool governance, provenance, and auditability |

## Premium architecture principle

```text
Agents propose.
Tools execute inside permission envelopes.
Board reviewers recommend.
SMITH authorizes boundaries.
The developer decides.
The Local Evidence Vault records.
```

## Customer-facing component map

| Customer-facing capability | Internal implementation family |
|---|---|
| Authority Gate | SMITH / forge-smithy |
| Workcell Runtime | YellowJacket |
| Context Control | PCC |
| Continuity Gates | PACT |
| Agent Fleet | ForgeAgents |
| Local Reasoning Router | NeuronForge |
| Cloud Reasoning Router | NeuroForge |
| Evidence Vault | Local PostgreSQL Vault |
| Safe Analytics | Cloud DataForge |
| Developer Cockpit | Forge_Command-inspired cockpit patterns |

## System context

```plantuml
@startuml
title VibeForge System Context

actor Developer
rectangle "Developer Machine" {
  rectangle "VibeForge CLI" as CLI
  rectangle "Developer Cockpit" as Cockpit
  rectangle "Authority Gate\nSMITH" as SMITH
  rectangle "Workcell Runtime\nYellowJacket" as YJ
  rectangle "Context Control\nPCC" as PCC
  rectangle "Continuity Gates\nPACT" as PACT
  rectangle "Agent Fleet\nForgeAgents" as Agents
  database "Local Evidence Vault\nPostgreSQL" as Vault
  folder "Target Repository" as Repo
  folder "Isolated Git Worktrees" as Worktrees
  rectangle "Local Model Router\nNeuronForge" as LocalModels
}

cloud "Optional Cloud" {
  rectangle "Cloud Reasoning\nNeuroForge" as CloudModels
  rectangle "Cloud Workcells" as CloudAgents
  database "Cloud DataForge\nSafe Analytics Only" as DataForge
}

Developer --> CLI
Developer --> Cockpit
CLI --> SMITH
Cockpit --> SMITH
SMITH --> YJ
SMITH --> PCC
SMITH --> PACT
YJ --> Agents
Agents --> Worktrees
Agents --> LocalModels
PCC --> Repo
PACT --> Repo
SMITH --> Vault
YJ --> Vault
PCC --> Vault
PACT --> Vault
Agents --> Vault
SMITH --> CloudModels : approved payload only
SMITH --> CloudAgents : approved job only
SMITH --> DataForge : safe metadata only
@enduml
```

## Core sequence

```plantuml
@startuml
title VibeForge Patch Proposal Sequence

actor Developer
participant "Cockpit/CLI" as UI
participant "SMITH Authority Gate" as SMITH
participant "Repo Scanner" as Scan
participant "PACT Continuity Gates" as PACT
participant "PCC Context Control" as PCC
participant "YellowJacket Workcell" as YJ
participant "Agent Fleet" as Agents
participant "Validation Runner" as Val
participant "Board Synthesizer" as Board
database "Local Evidence Vault" as Vault

Developer -> UI: request task
UI -> SMITH: create mission
SMITH -> Scan: refresh RepoTruthSnapshot
Scan -> Vault: store snapshot
SMITH -> PACT: run drift and contract gates
PACT -> Vault: store gate results
SMITH -> PCC: build context pack
PCC -> Vault: store manifest + redaction receipt
SMITH -> YJ: admit workcell under permission envelope
YJ -> Agents: execute in isolated worktree
Agents -> Vault: append tool calls + run events
Agents -> Val: request validation profile
Val -> Vault: store validation results
YJ -> Board: package review packet
Board -> Vault: store recommendation cards
UI -> Developer: show diff, evidence, risks, disagreement
Developer -> UI: approve/modify/reject/defer/send back
UI -> SMITH: record decision
SMITH -> Vault: write final receipt
@enduml
```

## Mission lifecycle

```plantuml
@startuml
title Mission Lifecycle

[*] --> drafted
drafted --> classified : risk classified
classified --> blocked : policy denial
classified --> context_ready : context pack built
context_ready --> awaiting_cloud_approval : cloud route selected
awaiting_cloud_approval --> context_ready : rejected/local fallback
awaiting_cloud_approval --> admitted : approved
context_ready --> admitted : local route
admitted --> running
running --> paused
paused --> running
running --> awaiting_review
running --> failed
running --> cancelled
awaiting_review --> decision_pending
decision_pending --> approved
decision_pending --> modified
decision_pending --> rejected
decision_pending --> sent_back
sent_back --> context_ready
approved --> receipt_finalized
modified --> receipt_finalized
rejected --> receipt_finalized
failed --> receipt_finalized
cancelled --> receipt_finalized
receipt_finalized --> [*]
@enduml
```

## Trust lanes

| Lane | Owns | Never owns |
|---|---|---|
| Target Code Lane | repo scan, isolated worktree, patch candidate, validation | hidden mutation, force push, silent merge |
| Proof Lane | receipts, evidence refs, hashes, validation results, run state | business analytics or cloud pricing |
| Control Lane | policy, permissions, approvals, kill switch, decisions | raw model authority |
| Context Lane | context manifests, redaction, budgets, payload preview | permission to execute/merge |
| Cloud Lane | approved deep review, usage metering, safe analytics | source of truth or unapproved code storage |

## Authority matrix

| Boundary | Default | Approval required | Receipt |
|---|---|---|---|
| Read tracked repo file | allow if scoped | no | tool call event |
| Read ignored/secret-like file | block | explicit or never allowed by class | security event |
| Write isolated worktree | allow if scoped | no for low/medium risk | tool call + patch receipt |
| Write active tree | block | manual developer action outside agent path | decision receipt |
| Run read-only command | allow if allowlisted | no | command receipt |
| Run build/test command | allow if profile-selected | no | command receipt |
| Run network command | block | explicit approval | security event |
| Run destructive command | block | explicit approval or never allowed | security event |
| Cloud model call | block | preview + credit estimate + approval | cloud job receipt |
| Analytics event | allow only if schema passes | no | analytics gate receipt |

## UI rule

Every premium UI surface should follow:

```text
Status → Evidence → Risk → Options → Receipt
```

A green state must mean that local evidence exists and required gates passed. It must never mean "the model said it was okay."
