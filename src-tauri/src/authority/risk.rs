//! Mission-level risk classification (Algorithm 1,
//! docs/plans/06_AGENT_ORCHESTRATION_ALGORITHMS.md).
//!
//! Implements the algorithm's five risk/autonomy steps literally, in their
//! documented order. Steps 6 ("attach validation profile") and 7 ("emit
//! MissionClassified event") are out of scope here: validation profiles are
//! Epic 6's job (M6 in the milestone sequence), and event emission happens
//! at the call site via `vault::mission_event` once a `mission_id` exists —
//! this module is a pure function with no DB access.

#![forbid(unsafe_code)]

/// Matches the Postgres `risk_level` enum exactly
/// (`migrations/001_initial_vault_schema.sql`) — a real ENUM type, so
/// binding/decoding requires this derive with a matching `rename_all`.
/// Declaration order (Low..Critical) is also the intended severity
/// ordering, derived via `PartialOrd`/`Ord`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, sqlx::Type, serde::Serialize, serde::Deserialize)]
#[sqlx(type_name = "risk_level", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

/// Inputs to Algorithm 1, one flag per literal trigger category named in
/// the algorithm's steps 2 and 3. File-category detection (does this
/// mission "touch auth"? "touch secrets"?) is inherently heuristic
/// path/keyword matching performed by the caller before constructing this
/// struct — this is a real, ongoing residual risk (false negatives: a file
/// that's functionally an auth module but doesn't match any expected
/// naming pattern), not a one-time bug to fix. Callers should err toward
/// over-inclusion when uncertain, and `triggered_categories` on the output
/// makes every classification decision auditable after the fact.
#[derive(Debug, Clone, Default)]
pub struct RiskClassificationInput {
    // Step 2 triggers (raise to high).
    pub touches_auth: bool,
    pub touches_payments: bool,
    pub touches_secrets: bool,
    pub touches_migrations: bool,
    pub touches_ci_cd: bool,
    pub touches_crypto: bool,
    pub touches_policy: bool,
    pub touches_dependency_lockfiles: bool,
    pub touches_permissions: bool,
    // Step 3 triggers (raise to critical).
    pub requests_destructive_commands: bool,
    pub requests_production_deploy: bool,
    pub requests_credentials: bool,
    pub targets_protected_branch: bool,
    pub requests_privileged_actions: bool,
    // Step 4 / step 5 inputs.
    pub is_docs_only_or_read_only: bool,
    pub requests_cloud: bool,
    pub requests_writes: bool,
    pub is_shared_policy_workflow: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MissionClassification {
    pub risk_level: RiskLevel,
    /// "advisory" | "candidate_patch" | "approval_gated_cloud" | "team_policy"
    /// — a `TEXT CHECK` column in the schema (`mission.autonomy_tier`), not
    /// a Postgres enum, so this stays a plain `String` rather than another
    /// `sqlx::Type` derive.
    pub autonomy_tier: String,
    /// Every trigger category that fired, for the `MissionClassified` event
    /// payload — this is what makes a risk decision disputable/auditable
    /// after the fact, per doc 07's "every trust claim has a receipt"
    /// principle.
    pub triggered_categories: Vec<String>,
}

/// Classify a mission's risk level and autonomy tier.
///
/// Step 4 ("lower to low only for docs-only/read-only review with no cloud
/// and no writes") is evaluated last, so it CAN override an earlier
/// high/critical determination — e.g. a read-only review of an auth file
/// ends up `risk_level: Low`. This is deliberate, not a bug worth "fixing"
/// by reordering: `autonomy_tier` (set in step 5), not `risk_level`, is
/// what actually gates blast radius. Advisory Review mode has zero
/// write/execute capability by construction (see the Fleet Modes table in
/// docs/plans/06_AGENT_ORCHESTRATION_ALGORITHMS.md) regardless of what
/// `risk_level` says. `risk_level` is a proxy for how much review scrutiny
/// a mission deserves, not a permission grant — that distinction is what
/// makes the literal step order safe to preserve as written.
pub fn classify(input: &RiskClassificationInput) -> MissionClassification {
    let mut risk_level = RiskLevel::Medium;
    let mut triggered_categories = Vec::new();

    let high_triggers: &[(bool, &str)] = &[
        (input.touches_auth, "auth"),
        (input.touches_payments, "payments"),
        (input.touches_secrets, "secrets"),
        (input.touches_migrations, "migrations"),
        (input.touches_ci_cd, "ci_cd"),
        (input.touches_crypto, "crypto"),
        (input.touches_policy, "policy"),
        (input.touches_dependency_lockfiles, "dependency_lockfiles"),
        (input.touches_permissions, "permissions"),
    ];
    let mut any_high = false;
    for (flag, name) in high_triggers {
        if *flag {
            triggered_categories.push((*name).to_string());
            any_high = true;
        }
    }
    if any_high {
        risk_level = RiskLevel::High;
    }

    let critical_triggers: &[(bool, &str)] = &[
        (input.requests_destructive_commands, "destructive_commands"),
        (input.requests_production_deploy, "production_deploy"),
        (input.requests_credentials, "credentials"),
        (input.targets_protected_branch, "protected_branch"),
        (input.requests_privileged_actions, "privileged_actions"),
    ];
    let mut any_critical = false;
    for (flag, name) in critical_triggers {
        if *flag {
            triggered_categories.push((*name).to_string());
            any_critical = true;
        }
    }
    if any_critical {
        risk_level = RiskLevel::Critical;
    }

    if input.is_docs_only_or_read_only && !input.requests_cloud && !input.requests_writes {
        risk_level = RiskLevel::Low;
    }

    let autonomy_tier = if input.is_docs_only_or_read_only {
        "advisory"
    } else if input.requests_cloud {
        "approval_gated_cloud"
    } else if input.is_shared_policy_workflow {
        "team_policy"
    } else {
        "candidate_patch"
    }
    .to_string();

    MissionClassification {
        risk_level,
        autonomy_tier,
        triggered_categories,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_to_medium() {
        let result = classify(&RiskClassificationInput::default());
        assert_eq!(result.risk_level, RiskLevel::Medium);
        assert_eq!(result.autonomy_tier, "candidate_patch");
        assert!(result.triggered_categories.is_empty());
    }

    #[test]
    fn read_only_review_of_auth_file_is_low_risk_advisory() {
        // Fixture 17: proves the step-4 override is intentional and tested,
        // not an accidental quirk.
        let input = RiskClassificationInput {
            touches_auth: true,
            is_docs_only_or_read_only: true,
            requests_cloud: false,
            requests_writes: false,
            ..Default::default()
        };
        let result = classify(&input);
        assert_eq!(result.risk_level, RiskLevel::Low);
        assert_eq!(result.autonomy_tier, "advisory");
        assert_eq!(result.triggered_categories, vec!["auth".to_string()]);
    }

    #[test]
    fn dependency_lockfile_write_is_high_risk() {
        // Fixture 18.
        let input = RiskClassificationInput {
            touches_dependency_lockfiles: true,
            requests_writes: true,
            ..Default::default()
        };
        let result = classify(&input);
        assert_eq!(result.risk_level, RiskLevel::High);
        assert_eq!(result.autonomy_tier, "candidate_patch");
    }

    #[test]
    fn protected_branch_target_is_critical() {
        let input = RiskClassificationInput {
            targets_protected_branch: true,
            requests_writes: true,
            ..Default::default()
        };
        let result = classify(&input);
        assert_eq!(result.risk_level, RiskLevel::Critical);
    }

    #[test]
    fn auth_touch_without_read_only_flag_stays_high() {
        // Same category as the advisory-override test, but NOT flagged
        // read-only — step 4 must not fire, proving the override is
        // conditioned correctly rather than always collapsing to Low.
        let input = RiskClassificationInput {
            touches_auth: true,
            requests_writes: true,
            ..Default::default()
        };
        let result = classify(&input);
        assert_eq!(result.risk_level, RiskLevel::High);
        assert_eq!(result.autonomy_tier, "candidate_patch");
    }

    #[test]
    fn cloud_request_sets_approval_gated_autonomy_tier() {
        let input = RiskClassificationInput {
            requests_cloud: true,
            ..Default::default()
        };
        assert_eq!(classify(&input).autonomy_tier, "approval_gated_cloud");
    }

    #[test]
    fn risk_level_ordering_is_severity_order() {
        assert!(RiskLevel::Low < RiskLevel::Medium);
        assert!(RiskLevel::Medium < RiskLevel::High);
        assert!(RiskLevel::High < RiskLevel::Critical);
    }
}
