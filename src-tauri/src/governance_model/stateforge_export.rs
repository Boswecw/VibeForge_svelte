use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

use anyhow::Context;
use serde::Serialize;

use super::{
    AUTHORITY_ACTORS, AUTHORITY_REQUIREMENTS, AUTHORITY_RINGS, CRITICAL_ACTIONS,
    COST_ACTIONS, COST_ALLOW_OVER_CAP, COST_DEFAULT_CAP, COST_DEFAULT_MAX_TOTAL,
    COST_DEFAULT_TOTAL, COST_SCHEDULE,
    DEPENDENCY_INITIAL_STATUS, DEPENDENCY_STATUSES, EVIDENCE_CHAIN_ACTIONS,
    EVIDENCE_CHAIN_ALLOW_SEAL_EMPTY, EVIDENCE_CHAIN_HASH_ALG, EVIDENCE_CHAIN_MAX_LEN,
    PIPELINE_APPROVED_STATE, PIPELINE_FAILURE_TRANSITIONS, PIPELINE_INITIAL_STATE,
    PIPELINE_TERMINAL_STATES, PIPELINE_TRANSITIONS, STATEFORGE_ACTIONS,
    STATEFORGE_DEFAULT_MAX_DEPTH, STATEFORGE_DEFAULT_MAX_STATES, STATEFORGE_SEED,
    STATEFORGE_VERSION,
};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StateForgeModel {
    pub version: String,
    pub seed: String,
    pub defaults: DefaultsModel,
    pub actions: Vec<String>,
    pub nodes: NodesModel,
    #[serde(rename = "evidence_chain")]
    pub evidence_chain: EvidenceChainModel,
    pub cost: CostModel,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DefaultsModel {
    pub max_depth: u32,
    pub max_states: u32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NodesModel {
    pub pipeline: PipelineModel,
    pub authority: AuthorityModel,
    #[serde(rename = "circuit_breaker")]
    pub circuit_breaker: CircuitBreakerModel,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineModel {
    pub initial: String,
    pub approval_state: String,
    pub terminal: Vec<String>,
    pub failure_transitions: Vec<String>,
    pub transitions: BTreeMap<String, String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthorityModel {
    pub actors: Vec<String>,
    pub rings: Vec<String>,
    pub requirements: BTreeMap<String, AuthorityRequirementModel>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthorityRequirementModel {
    pub actor: String,
    pub ring: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CircuitBreakerModel {
    pub initial: String,
    pub statuses: Vec<String>,
    pub critical_actions: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EvidenceChainModel {
    pub next_nonce: u32,
    pub seen_nonces: Vec<u32>,
    pub max_len: u8,
    pub hash_alg: String,
    pub allow_seal_empty: bool,
    pub actions: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CostModel {
    pub cap: u32,
    pub total: u32,
    pub max_total: u32,
    pub allow_over_cap: bool,
    pub actions: Vec<String>,
    pub schedule: BTreeMap<String, u32>,
}

pub fn build_stateforge_model() -> StateForgeModel {
    let mut actions: Vec<String> = STATEFORGE_ACTIONS
        .iter()
        .map(|v| (*v).to_string())
        .collect();
    actions.sort_unstable();

    let mut pipeline_terminal: Vec<String> = PIPELINE_TERMINAL_STATES
        .iter()
        .map(|v| (*v).to_string())
        .collect();
    pipeline_terminal.sort_unstable();

    let mut failure_transitions: Vec<String> = PIPELINE_FAILURE_TRANSITIONS
        .iter()
        .map(|v| (*v).to_string())
        .collect();
    failure_transitions.sort_unstable();

    let mut transitions = BTreeMap::new();
    for (from, action, to) in PIPELINE_TRANSITIONS {
        transitions.insert(format!("{from}:{action}"), (*to).to_string());
    }

    let mut actors: Vec<String> = AUTHORITY_ACTORS.iter().map(|v| (*v).to_string()).collect();
    actors.sort_unstable();

    let mut rings: Vec<String> = AUTHORITY_RINGS.iter().map(|v| (*v).to_string()).collect();
    rings.sort_unstable();

    let mut requirements = BTreeMap::new();
    for (action, actor, ring) in AUTHORITY_REQUIREMENTS {
        requirements.insert(
            (*action).to_string(),
            AuthorityRequirementModel {
                actor: (*actor).to_string(),
                ring: (*ring).to_string(),
            },
        );
    }

    let mut statuses: Vec<String> = DEPENDENCY_STATUSES
        .iter()
        .map(|v| (*v).to_string())
        .collect();
    statuses.sort_unstable();

    let mut critical_actions: Vec<String> =
        CRITICAL_ACTIONS.iter().map(|v| (*v).to_string()).collect();
    critical_actions.sort_unstable();

    let mut evidence_chain_actions: Vec<String> = EVIDENCE_CHAIN_ACTIONS
        .iter()
        .map(|v| (*v).to_string())
        .collect();
    evidence_chain_actions.sort_unstable();

    let mut cost_actions: Vec<String> = COST_ACTIONS.iter().map(|v| (*v).to_string()).collect();
    cost_actions.sort_unstable();

    let mut cost_schedule = BTreeMap::new();
    for (op, amount) in COST_SCHEDULE {
        cost_schedule.insert((*op).to_string(), *amount);
    }

    StateForgeModel {
        version: STATEFORGE_VERSION.to_string(),
        seed: STATEFORGE_SEED.to_string(),
        defaults: DefaultsModel {
            max_depth: STATEFORGE_DEFAULT_MAX_DEPTH,
            max_states: STATEFORGE_DEFAULT_MAX_STATES,
        },
        actions,
        nodes: NodesModel {
            pipeline: PipelineModel {
                initial: PIPELINE_INITIAL_STATE.to_string(),
                approval_state: PIPELINE_APPROVED_STATE.to_string(),
                terminal: pipeline_terminal,
                failure_transitions,
                transitions,
            },
            authority: AuthorityModel {
                actors,
                rings,
                requirements,
            },
            circuit_breaker: CircuitBreakerModel {
                initial: DEPENDENCY_INITIAL_STATUS.to_string(),
                statuses,
                critical_actions,
            },
        },
        evidence_chain: EvidenceChainModel {
            next_nonce: 0,
            seen_nonces: Vec::new(),
            max_len: EVIDENCE_CHAIN_MAX_LEN,
            hash_alg: EVIDENCE_CHAIN_HASH_ALG.to_string(),
            allow_seal_empty: EVIDENCE_CHAIN_ALLOW_SEAL_EMPTY,
            actions: evidence_chain_actions,
        },
        cost: CostModel {
            cap: COST_DEFAULT_CAP,
            total: COST_DEFAULT_TOTAL,
            max_total: COST_DEFAULT_MAX_TOTAL,
            allow_over_cap: COST_ALLOW_OVER_CAP,
            actions: cost_actions,
            schedule: cost_schedule,
        },
    }
}

pub fn write_stateforge_model_json(path: &Path) -> Result<(), anyhow::Error> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .with_context(|| format!("failed to create directory {}", parent.display()))?;
    }

    let model = build_stateforge_model();
    let json = serde_json::to_string_pretty(&model).context("failed to serialize model json")?;
    fs::write(path, format!("{json}\n"))
        .with_context(|| format!("failed to write model json at {}", path.display()))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exporter_is_deterministic() {
        let first = serde_json::to_string_pretty(&build_stateforge_model()).expect("serialize");
        let second = serde_json::to_string_pretty(&build_stateforge_model()).expect("serialize");
        assert_eq!(first, second);
    }

    #[test]
    fn exporter_keeps_stateforge_schema_key_names() {
        let serialized = serde_json::to_value(build_stateforge_model()).expect("serialize");
        let root = serialized.as_object().expect("object root");
        assert!(root.contains_key("evidence_chain"));
        assert!(!root.contains_key("evidenceChain"));

        let nodes = root
            .get("nodes")
            .and_then(serde_json::Value::as_object)
            .expect("nodes");
        assert!(nodes.contains_key("circuit_breaker"));
        assert!(!nodes.contains_key("circuitBreaker"));
    }

    #[test]
    fn exporter_contains_expected_evidence_chain_defaults() {
        let serialized = serde_json::to_value(build_stateforge_model()).expect("serialize");
        let root = serialized.as_object().expect("object root");
        let evidence_chain = root
            .get("evidence_chain")
            .and_then(serde_json::Value::as_object)
            .expect("evidence_chain");

        assert_eq!(
            evidence_chain.get("maxLen").and_then(|v| v.as_u64()),
            Some(3)
        );
        assert_eq!(
            evidence_chain.get("nextNonce").and_then(|v| v.as_u64()),
            Some(0)
        );
        assert_eq!(
            evidence_chain
                .get("seenNonces")
                .and_then(serde_json::Value::as_array)
                .map(|values| values.len()),
            Some(0)
        );
        assert_eq!(
            evidence_chain.get("hashAlg").and_then(|v| v.as_str()),
            Some("sha256")
        );
        assert_eq!(
            evidence_chain
                .get("allowSealEmpty")
                .and_then(|v| v.as_bool()),
            Some(false)
        );

        let actions = evidence_chain
            .get("actions")
            .and_then(serde_json::Value::as_array)
            .expect("actions");
        let action_names: Vec<&str> = actions
            .iter()
            .map(|v| v.as_str().expect("action string"))
            .collect();
        assert_eq!(
            action_names,
            vec![
                "ev_append_invalid_prev",
                "ev_append_valid",
                "ev_fork",
                "ev_mutate_after_seal",
                "ev_seal",
            ]
        );

        let pipeline = root
            .get("nodes")
            .and_then(serde_json::Value::as_object)
            .and_then(|nodes| nodes.get("pipeline"))
            .and_then(serde_json::Value::as_object)
            .expect("pipeline");
        assert_eq!(
            pipeline.get("approvalState").and_then(|v| v.as_str()),
            Some("APPROVED")
        );

        let cost = root
            .get("cost")
            .and_then(serde_json::Value::as_object)
            .expect("cost");
        assert_eq!(cost.get("cap").and_then(|v| v.as_u64()), Some(5));
        assert_eq!(cost.get("total").and_then(|v| v.as_u64()), Some(0));
        assert_eq!(cost.get("maxTotal").and_then(|v| v.as_u64()), Some(8));
        assert_eq!(
            cost.get("allowOverCap").and_then(|v| v.as_bool()),
            Some(false)
        );

        let cost_actions = cost
            .get("actions")
            .and_then(serde_json::Value::as_array)
            .expect("cost actions");
        let cost_action_names: Vec<&str> = cost_actions
            .iter()
            .map(|v| v.as_str().expect("cost action string"))
            .collect();
        assert_eq!(
            cost_action_names,
            vec![
                "cost_charge_embed",
                "cost_charge_llm_call",
                "cost_charge_retrieve",
                "cost_charge_tool_call",
            ]
        );

        let schedule = cost
            .get("schedule")
            .and_then(serde_json::Value::as_object)
            .expect("schedule");
        assert_eq!(schedule.get("embed").and_then(|v| v.as_u64()), Some(1));
        assert_eq!(schedule.get("llm_call").and_then(|v| v.as_u64()), Some(3));
        assert_eq!(schedule.get("retrieve").and_then(|v| v.as_u64()), Some(1));
        assert_eq!(schedule.get("tool_call").and_then(|v| v.as_u64()), Some(2));
    }
}
