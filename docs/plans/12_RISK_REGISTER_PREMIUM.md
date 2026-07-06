# 12 — Premium Risk Register

| ID | Risk | Severity | Likelihood | Owner | Mitigation | Validation |
|---|---|---:|---:|---|---|---|
| R-001 | Product scope becomes too broad | S4 | L4 | Product lead | Build trust loop first; defer enterprise extras | MVP gate review |
| R-002 | Internal names confuse customers | S3 | L4 | Product/design | Capability-led naming | Messaging review |
| R-003 | Cloud privacy leakage | S5 | L3 | Security lead | Payload preview, redaction, analytics allowlist | forbidden-field fixtures |
| R-004 | Agent writes outside scope | S5 | L3 | Systems lead | worktree isolation, canonical paths | path/symlink fixtures |
| R-005 | Active tree mutation | S5 | L2 | Systems lead | active tree write block by default | mutation fixture |
| R-006 | Command injection/destructive command | S5 | L3 | Security lead | structured runner, risk classifier | command fixtures |
| R-007 | Board review creates fake certainty | S4 | L3 | AI lead | disagreement preservation | conflicting-review fixture |
| R-008 | Receipts become unread logs | S3 | L4 | UX lead | receipt browser and summaries | usability test |
| R-009 | Local PostgreSQL install friction | S4 | L3 | Backend lead | doctor/repair, lifecycle tooling | install matrix |
| R-010 | Cloud cost runaway | S4 | L3 | Cloud lead | estimates, caps, kill switch | budget fixtures |
| R-011 | Compliance overclaim | S4 | L3 | GTM/legal | careful wording, no certification claims | marketing review |
| R-012 | Context pack misses crucial evidence | S3 | L4 | AI lead | AAR feedback and missing-evidence field | beta analysis |
| R-013 | Secret redaction false negative | S5 | L3 | Security lead | multiple detectors, deny paths | secret corpus tests |
| R-014 | Secret redaction false positive frustrates users | S2 | L4 | UX/security | preview and safe override | beta feedback |
| R-015 | Agent runtime hangs | S3 | L3 | Systems lead | timeouts, cancellation, kill switch | chaos tests |
| R-016 | Vault corruption/migration failure | S4 | L2 | Backend lead | backup prompts, checksums | migration rehearsal |
| R-017 | UI hides degraded state | S4 | L3 | UX lead | no fabricated state rule | UI state fixtures |
| R-018 | Provider API changes break adapters | S3 | L4 | AI platform | adapter abstraction | provider test matrix |
| R-019 | Team policy leaks repo details | S5 | L2 | Security lead | source-free policy sync | team privacy fixtures |
| R-020 | Patch receipts can be forged locally | S4 | L2 | Security lead | hash chain MVP, signing roadmap | tamper fixtures |
| R-021 | Worktree cleanup deletes wrong files | S5 | L2 | Systems lead | managed root only, dry-run cleanup | cleanup fixtures |
| R-022 | Developer fatigue from approvals | S3 | L4 | Product/UX | route profiles and batch review | usability study |
| R-023 | Fleet outputs conflict incoherently | S3 | L3 | AI lead | board synthesis and minority reports | conflict fixture |
| R-024 | Market perceives as wrapper | S4 | L3 | GTM/product | lead with governance/evidence | buyer interviews |
| R-025 | Beta users expect codegen superiority | S3 | L3 | Product | messaging: govern agents, do not replace them | onboarding test |

## Top launch blockers

1. Active tree mutation prevention.
2. Cloud payload preview and approval.
3. Safe analytics allowlist.
4. Command/path policy.
5. Local vault backup/restore.
6. Receipt hash validation.
7. Board review card clarity.
8. Kill switch reliability.
9. Local Lock mode.
10. Premium onboarding clarity.
