# 06 — Agent Orchestration Algorithms

## Design rules

- Agents never own authority.
- Agents write only inside isolated worktrees or approved scratch locations.
- Agents communicate through artifacts, not hidden shared state.
- Workcells have permission envelopes.
- Reviewers produce evidence-backed findings, not vague opinions.
- The board preserves disagreement.
- The developer can override, but overrides are receipted.

## Permission envelope

```json
{
  "permission_envelope_version": "vibeforge.permission_envelope.v1",
  "mission_id": "mis_01J...",
  "repo_id": "repo_01J...",
  "allowed_roots": ["repo_root", "worktree_root"],
  "forbidden_patterns": [".env", "**/.ssh/**", "**/secrets/**", "**/*.pem"],
  "allowed_commands": ["git diff", "git status", "npm test", "cargo test", "pytest"],
  "blocked_commands": ["rm -rf", "git push --force", "curl | sh", "sudo", "chmod -R 777"],
  "network_allowed": false,
  "cloud_allowed": false,
  "max_runtime_seconds": 3600,
  "max_tokens": 100000,
  "max_cost_credits": 0,
  "write_scope": "isolated_worktree_only"
}
```

## Algorithm 1 — Risk classification

```text
Input: mission request, repo truth, files likely touched, requested tools, cloud preference
Output: risk_level, autonomy_tier, approvals, validation profile

1. Start at medium risk.
2. Raise to high if auth, payments, secrets, migrations, CI/CD, crypto, policy, dependency lockfiles, or permissions are touched.
3. Raise to critical if destructive commands, production deploy, credentials, protected branches, or privileged actions are requested.
4. Lower to low only for docs-only/read-only review with no cloud and no writes.
5. Set autonomy tier:
   - advisory for read-only review
   - candidate_patch for isolated worktree patch
   - approval_gated_cloud for any cloud route
   - team_policy for shared policy workflows
6. Attach validation profile by file/path/language rules.
7. Emit MissionClassified event.
```

## Algorithm 2 — Context pack builder

```text
Input: mission, repo truth snapshot, policy, route class
Output: context manifest, redaction receipt, optional cloud preview

1. Resolve allowed root and canonicalize every selected path.
2. Exclude ignored, secret-like, binary, large, and forbidden files.
3. Select minimal evidence: architecture summary, relevant snippets, tests, dependencies, receipts, instruction files.
4. Replace private absolute paths with stable aliases.
5. Redact token-like, key-like, credential-like, and personal-data-like values.
6. Hash the manifest and selected content references.
7. If route is cloud, create payload preview, estimate credits, and block execution until approval.
8. Store manifest and receipt in Local Evidence Vault.
```

## Algorithm 3 — Workcell execution

```text
Input: mission, context pack, permission envelope, workcell type
Output: artifacts, tool call ledger, patch candidate, review packet

1. Create isolated git worktree from source commit.
2. Validate worktree path is under VibeForge managed root.
3. Start workcell with role plan.
4. For each agent action:
   a. Validate file/command against permission envelope.
   b. Record tool call as planned.
   c. Execute only if allowed or approved.
   d. Store output refs and exit code.
5. Detect patch manifest from worktree diff.
6. Run validation profile.
7. Package review packet.
8. Move mission to awaiting_review.
9. Never mutate active tree.
```

## Algorithm 4 — Ensemble Delphi board review

```text
Input: review packet, patch candidate, validation results, context manifest, PACT findings, security events
Output: board review, recommendation cards, disagreement report

1. Round 1 independent review:
   - security
   - testing
   - architecture
   - product/UX
   - reliability when applicable
2. Each reviewer emits verdict, risk, evidence refs, missing evidence, suggested action, confidence scores.
3. Compute material disagreement:
   - verdict differs across major reviewers
   - high-risk minority finding exists
   - confidence gap exceeds threshold
4. Round 2 exposes structured disagreement without hidden reasoning.
5. Synthesis produces final cards and preserves minority report.
6. Board cannot approve irreversible action; only developer can decide.
```

## Algorithm 5 — Patch promotion

```text
Input: patch candidate, board review, developer decision
Output: receipt, branch/export/apply result

1. Ensure patch candidate is tied to source commit and worktree ref.
2. Ensure validation profile reached required state.
3. Ensure high-risk cards are resolved or accepted with reason.
4. Ask developer for explicit action: branch, export patch, manual apply, abandon.
5. Hash patch manifest, context pack, validations, board refs, and decisions.
6. Write patch receipt.
7. Execute chosen promotion action only if policy allows.
8. Emit final mission event and receipt.
```

## Algorithm 6 — Safe analytics gate

```text
Input: candidate analytics event
Output: passed event or blocked receipt

1. Validate schema version.
2. Reject unknown fields.
3. Reject path-like, source-code-like, prompt-like, branch-name-like, commit-message-like, secret-like strings.
4. Reject nested JSON outside allowlisted shapes.
5. Hash local event.
6. If pass, transmit event and store local log.
7. If fail, block transmission and store privacy/security event.
```

## Fleet modes

| Mode | Agents | Writes | Cloud | Use |
|---|---:|---|---|---|
| Advisory Review | reviewers only | none | optional approval | architecture/security/test review |
| Candidate Patch | planner + coder + tester + reviewer | isolated worktree | optional approval | normal MVP patch proposal |
| Fleet Competition | multiple coder agents | isolated worktrees | optional approval | alternatives for hard tasks |
| Fleet Collaboration | specialized roles | artifact queue only | optional approval | larger tasks |
| Overnight Review | reviewers + planner | none or isolated | explicit budget cap | deep review |

## Stop conditions

A workcell stops immediately when:

- active tree write is requested
- forbidden path is touched
- secret-like content is requested for cloud
- command classifier returns forbidden
- budget cap would be exceeded
- validation enters blocked state
- user triggers kill switch
- worktree is dirty outside patch scope
- cloud provider result cannot be receipted
