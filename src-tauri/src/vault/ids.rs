//! Prefixed ULID identifiers.
//!
//! Every ID column in the vault schema is `TEXT PRIMARY KEY`, not a Postgres
//! `UUID`. The contracts in `docs/plans/05_CONTRACTS_AND_APIS.md` show the
//! real shape throughout (`mis_01J...`, `rec_01J...`, `ws_01J...`): a short
//! entity prefix over a Crockford-Base32 ULID. Prefixes below cover every
//! primary key in `migrations/001_initial_vault_schema.sql`, plus two
//! non-table identifiers used in the JSON contracts (worktree refs, trace ids).

use ulid::Ulid;

pub mod prefix {
    pub const WORKSPACE: &str = "ws_";
    pub const REPOSITORY: &str = "repo_";
    pub const REPO_TRUTH_SNAPSHOT: &str = "snap_";
    pub const INSTRUCTION_DRIFT_FINDING: &str = "find_";
    pub const MISSION: &str = "mis_";
    pub const MISSION_EVENT: &str = "evt_";
    pub const WORKCELL_RUN: &str = "wcr_";
    pub const AGENT_RUN: &str = "agt_";
    pub const TOOL_CALL: &str = "tool_";
    pub const SECURITY_EVENT: &str = "sec_";
    pub const CONTEXT_PACK: &str = "ctx_";
    pub const CLOUD_PAYLOAD_PREVIEW: &str = "prv_";
    pub const VALIDATION_RUN: &str = "val_";
    pub const PATCH_CANDIDATE: &str = "pat_";
    pub const BOARD_REVIEW: &str = "brd_";
    pub const RECOMMENDATION_CARD: &str = "rec_";
    pub const DEVELOPER_DECISION: &str = "dec_";
    pub const PATCH_RECEIPT: &str = "rcp_";
    pub const WORKTREE: &str = "wt_";
    pub const TRACE: &str = "trc_";
}

/// Generate a new prefixed ULID, e.g. `new_id(prefix::MISSION)` -> `"mis_01J..."`.
pub fn new_id(prefix: &str) -> String {
    format!("{prefix}{}", Ulid::new())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_id_has_expected_shape() {
        let id = new_id(prefix::MISSION);
        assert!(id.starts_with("mis_"));
        // Crockford Base32 ULID is always 26 characters.
        assert_eq!(id.len(), prefix::MISSION.len() + 26);
    }

    #[test]
    fn new_id_is_unique_across_calls() {
        let a = new_id(prefix::WORKSPACE);
        let b = new_id(prefix::WORKSPACE);
        assert_ne!(a, b);
    }
}
