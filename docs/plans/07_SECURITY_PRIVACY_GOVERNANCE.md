# 07 — Security, Privacy, and Governance

## Core posture

```text
Local evidence is authoritative.
Cloud is optional.
Every boundary crossing is explicit.
Every high-risk action is approval-gated.
Every trust claim has a receipt.
```

## Data classification

| Class | Examples | Storage | Cloud |
|---|---|---|---|
| Public metadata | app version, OS family, route class | local + cloud allowed | allowed if safe schema |
| Workspace metadata | workspace ID, license tier, feature usage | local + cloud allowed | allowed if non-identifying |
| Repo metadata | language summary, dependency families | local | cloud only in approved preview |
| Source content | code snippets, diffs | local only | approved job only after redaction |
| Sensitive content | secrets, `.env`, credentials, private docs | never store raw | never send |
| Receipts | hashes, decision refs, validation refs | local | redacted summary only |
| Tool outputs | stdout/stderr/test logs | local with retention | never analytics; cloud only if approved payload |

## Privacy modes

| Mode | Behavior |
|---|---|
| Local Lock | No provider calls, no telemetry, no crash upload, no cloud embeddings, no sync |
| Approval Mode | Cloud jobs require preview, estimate, approval, receipt |
| Team Mode | Policy may sync; source does not sync unless explicit integration permits |
| Enterprise Mode | Custom telemetry, private cloud/on-prem route, SSO/RBAC, SIEM export roadmap |

## Threat model

| Threat | Control | Test |
|---|---|---|
| Prompt/context leaks secrets | PCC excludes and redacts; cloud preview required | secret fixture blocked |
| Agent writes outside repo | canonical path resolver + allowed roots | traversal fixture blocked |
| Agent mutates active tree | worktree-only write policy | active-tree write fixture |
| Command injection | structured command runner, no shell string by default | `curl \| sh`, `rm -rf`, `sudo` fixtures |
| Cloud analytics leak private data | allowlist schema + unknown-field rejection | forbidden-field fixture |
| False confidence from board | minority report + confidence rubric | conflicting-review fixture |
| Cost runaway | route caps + credit estimate + kill switch | budget exhaustion fixture |
| Vault corruption | migrations + backups + doctor | restore equivalence test |
| Symlink escape | realpath/canonical path checks | symlink fixture |
| Provider key leakage | OS keyring, redacted display, no logs | key scanning tests |

## Path policy

- Canonicalize before every read/write.
- Resolve symlinks before policy decision.
- Deny paths outside allowed roots.
- Deny hidden secret-like directories unless explicitly whitelisted for read-only metadata.
- Deny `.env`, private keys, SSH keys, certificate keys, cloud credential files, and token stores.
- Use path aliases in cloud previews and analytics.

## Command policy

| Class | Examples | Default |
|---|---|---|
| read_only | `git status`, `git diff`, scoped `ls` | allow if scoped |
| build_test | `npm test`, `cargo test`, `pytest` | allow if profile-selected |
| write_scoped | formatters/codegen in worktree | allow in worktree only |
| network | package install, curl, API calls | approval required |
| destructive | rm, clean, reset, destructive migration | approval required or blocked |
| privileged | sudo, broad chmod, system services | blocked in MVP |
| forbidden | pipe-to-shell, credential exfiltration, force push | blocked |

## Cloud approval modal

Must show:

```text
Job type
Route class
Provider family
Model family
Estimated credits
Included summary
Excluded summary
Redaction summary
Forbidden field scan status
Retention statement
Developer options:
  Approve once
  Approve this route for this mission
  Run local only
  Cancel
```

## Safe analytics allowlist

Allowed:

```text
account ID
workspace ID
license tier
app version
OS family
job type
route class
provider family
model family
credit cost
duration
success/failure
error category
quota events
billing events
aggregate feature usage
```

Forbidden:

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
private issue/PR text
user documents
```

## Incident handling

When a privacy/security boundary blocks an action:

1. Stop the action.
2. Record a security event.
3. Show a plain-English explanation.
4. Offer safe alternatives.
5. Preserve evidence for support without leaking forbidden content.
6. Keep the mission recoverable unless the user cancels.
