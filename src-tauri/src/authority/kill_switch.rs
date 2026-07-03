//! DB-level kill switch primitive.
//!
//! Scoped deliberately: nothing executes missions yet (that's Epic 5's
//! workcell runtime and Epic 10's agent fleet), so there is no real running
//! process to interrupt. This writes the evidence trail a future runtime
//! will need to check against (a `security_event`, a `mission_event`, and a
//! `mission.state` transition to `'cancelled'`) without pretending to
//! signal a process that doesn't exist. The signature is shaped so a later
//! epic can extend the *body* (to actually signal a running workcell) once
//! one exists, without changing any call site that already depends on it.
//!
//! Depends on `crate::vault` directly (writes real rows) — unlike the pure
//! `path_guard`/`forbidden_patterns`/`command_policy`/`risk` modules, this
//! one is not DB-independent. Any binary that mounts `authority` and
//! intends to use `kill_switch` must also mount `vault` via the same
//! `#[path]` pattern (see `bin/vibeforge_authority.rs`).

#![forbid(unsafe_code)]

use sqlx::PgPool;

use crate::vault;

#[derive(Debug, Clone)]
pub enum KillSwitchTarget {
    Mission(String),
    All,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct KillSwitchReceipt {
    /// Missions actually transitioned to `cancelled` by this call. Empty if
    /// the target was already inactive (safe no-op — no duplicate
    /// cancellation event is written), or if `All` found nothing active.
    pub cancelled_mission_ids: Vec<String>,
    pub security_event_id: String,
}

#[derive(Debug, thiserror::Error)]
pub enum KillSwitchError {
    #[error("mission not found: {0}")]
    MissionNotFound(String),
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
}

pub async fn trigger_kill_switch(
    pool: &PgPool,
    target: KillSwitchTarget,
    reason: &str,
    actor_id: &str,
) -> Result<KillSwitchReceipt, KillSwitchError> {
    let mission_ids = match &target {
        KillSwitchTarget::Mission(id) => {
            let mission = vault::get_mission(pool, id)
                .await?
                .ok_or_else(|| KillSwitchError::MissionNotFound(id.clone()))?;
            if vault::KILL_SWITCH_ACTIVE_STATES.contains(&mission.state.as_str()) {
                vec![mission.mission_id]
            } else {
                // Already terminal (or otherwise inactive) — safe no-op,
                // no duplicate cancellation event.
                Vec::new()
            }
        }
        KillSwitchTarget::All => vault::active_mission_ids(pool).await?,
    };

    for mission_id in &mission_ids {
        let previous_state = vault::get_mission(pool, mission_id)
            .await?
            .map(|m| m.state);

        vault::set_mission_state(pool, mission_id, "cancelled").await?;

        vault::insert_mission_event(
            pool,
            mission_id,
            "kill_switch_triggered",
            "developer",
            actor_id,
            serde_json::json!({ "reason": reason }),
            previous_state.as_deref(),
            Some("cancelled"),
        )
        .await?;
    }

    let target_evidence = match &target {
        KillSwitchTarget::Mission(id) => serde_json::json!({ "requested_mission_id": id }),
        KillSwitchTarget::All => serde_json::json!({ "requested": "all" }),
    };
    let evidence = serde_json::json!({
        "target": target_evidence,
        "cancelled_mission_ids": mission_ids,
    });

    let security_event = vault::insert_security_event(
        pool,
        match &target {
            KillSwitchTarget::Mission(id) => Some(id.as_str()),
            KillSwitchTarget::All => None,
        },
        "kill_switch",
        "low",
        true,
        reason,
        evidence,
    )
    .await?;

    Ok(KillSwitchReceipt {
        cancelled_mission_ids: mission_ids,
        security_event_id: security_event.security_event_id,
    })
}
