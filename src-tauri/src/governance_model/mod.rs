//! Canonical governance model constants used by runtime checks and StateForge export.

pub mod stateforge_export;

pub const STATEFORGE_VERSION: &str = "0.2.1";
pub const STATEFORGE_SEED: &str = "stateforge-v0.1-fixed-seed";
pub const STATEFORGE_DEFAULT_MAX_DEPTH: u32 = 30;
pub const STATEFORGE_DEFAULT_MAX_STATES: u32 = 200_000;

pub const PIPELINE_INITIAL_STATE: &str = "IDLE";
pub const PIPELINE_APPROVED_STATE: &str = "APPROVED";
pub const PIPELINE_FAILED_STATE: &str = "FAILED";
pub const PIPELINE_RELEASED_STATE: &str = "RELEASED";

pub const STATEFORGE_ACTIONS: &[&str] = &[
    "noop",
    "plan",
    "submit_for_review",
    "approve_plan",
    "start_execution",
    "enter_verifying",
    "enter_evidence_review",
    "begin_release",
    "finalize_release",
    "fail",
    "dep_ok",
    "dep_degraded",
    "dep_down",
    "cost_charge_embed",
    "cost_charge_llm_call",
    "cost_charge_retrieve",
    "cost_charge_tool_call",
    "ev_append_valid",
    "ev_seal",
];

pub const PIPELINE_TERMINAL_STATES: &[&str] = &[PIPELINE_FAILED_STATE, PIPELINE_RELEASED_STATE];

pub const PIPELINE_FAILURE_TRANSITIONS: &[&str] = &[
    "IDLE",
    "PLANNING",
    "PLAN_REVIEW",
    PIPELINE_APPROVED_STATE,
    "EXECUTING",
    "VERIFYING",
    "EVIDENCE_REVIEW",
    "RELEASING",
];

pub const PIPELINE_TRANSITIONS: &[(&str, &str, &str)] = &[
    ("IDLE", "plan", "PLANNING"),
    ("PLANNING", "submit_for_review", "PLAN_REVIEW"),
    ("PLAN_REVIEW", "approve_plan", PIPELINE_APPROVED_STATE),
    (PIPELINE_APPROVED_STATE, "start_execution", "EXECUTING"),
    ("EXECUTING", "enter_verifying", "VERIFYING"),
    ("VERIFYING", "enter_evidence_review", "EVIDENCE_REVIEW"),
    ("EVIDENCE_REVIEW", "begin_release", "RELEASING"),
    ("RELEASING", "finalize_release", PIPELINE_RELEASED_STATE),
];

pub const AUTHORITY_ACTORS: &[&str] = &["Human", "SMITH", "Service"];
pub const AUTHORITY_RINGS: &[&str] = &["R0", "R1", "R2"];
pub const AUTHORITY_REQUIREMENTS: &[(&str, &str, &str)] = &[
    ("approve_plan", "Human", "R0"),
    ("start_execution", "SMITH", "R1"),
    ("finalize_release", "SMITH", "R1"),
];

pub const DEPENDENCY_INITIAL_STATUS: &str = "OK";
pub const DEPENDENCY_STATUSES: &[&str] = &["OK", "DEGRADED", "DOWN"];
pub const CRITICAL_ACTIONS: &[&str] = &["start_execution", "begin_release", "finalize_release"];

pub const EVIDENCE_CHAIN_MAX_LEN: u8 = 3;
pub const EVIDENCE_CHAIN_HASH_ALG: &str = "sha256";
pub const EVIDENCE_CHAIN_ALLOW_SEAL_EMPTY: bool = false;
pub const EVIDENCE_CHAIN_ACTIONS: &[&str] = &[
    "ev_append_valid",
    "ev_append_invalid_prev",
    "ev_seal",
    "ev_mutate_after_seal",
    "ev_fork",
];

pub const COST_DEFAULT_CAP: u32 = 5;
pub const COST_DEFAULT_TOTAL: u32 = 0;
pub const COST_DEFAULT_MAX_TOTAL: u32 = 8;
pub const COST_ALLOW_OVER_CAP: bool = false;
pub const COST_ACTIONS: &[&str] = &[
    "cost_charge_embed",
    "cost_charge_llm_call",
    "cost_charge_retrieve",
    "cost_charge_tool_call",
];
pub const COST_SCHEDULE: &[(&str, u32)] = &[
    ("embed", 1),
    ("llm_call", 3),
    ("retrieve", 1),
    ("tool_call", 2),
];
