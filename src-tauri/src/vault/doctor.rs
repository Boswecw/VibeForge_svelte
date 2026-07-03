//! `vibeforge doctor` checks.
//!
//! Beyond connectivity, migration status, and table existence, this runs four
//! anti-join queries for references the schema in
//! `migrations/001_initial_vault_schema.sql` leaves structurally unenforced
//! (no `REFERENCES` clause) — Postgres FK constraints already guarantee
//! everything else, so a generic redundant FK re-check would be pointless.
//! These four are the real gaps:
//!
//! - `mission.active_context_pack_id` -> `context_pack.context_pack_id`
//! - `tool_call.approved_by_decision_id` -> `developer_decision.decision_id`
//! - `cloud_payload_preview.approved_decision_id` -> `developer_decision.decision_id`
//! - `patch_receipt.previous_receipt_hash` -> another row's `patch_receipt.receipt_hash`
//!   (the tamper-evidence hash chain — a hash-to-hash link Postgres FK syntax
//!   cannot express at all, and the one most tied to the product doctrine).

use super::VAULT_TABLES;
use serde::Serialize;
use sqlx::postgres::PgPool;
use sqlx::Row;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum CheckStatus {
    Passed,
    Failed,
}

#[derive(Debug, Clone, Serialize)]
pub struct DoctorCheck {
    pub id: String,
    pub status: CheckStatus,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct DoctorReport {
    pub checks: Vec<DoctorCheck>,
    pub status: CheckStatus,
}

pub async fn run_checks(pool: &PgPool) -> DoctorReport {
    let mut checks = Vec::new();

    if let Err(e) = sqlx::query("SELECT 1").execute(pool).await {
        checks.push(DoctorCheck {
            id: "connectivity".into(),
            status: CheckStatus::Failed,
            detail: format!(
                "could not connect: {e}. If using the dedicated vault, run: \
                 docker compose -f docker-compose.vault.yml up -d vault-db. \
                 If falling back to the native cluster, run: sudo systemctl start postgresql@16-main"
            ),
        });
        return DoctorReport {
            status: CheckStatus::Failed,
            checks,
        };
    }
    checks.push(DoctorCheck {
        id: "connectivity".into(),
        status: CheckStatus::Passed,
        detail: "connected to vault database".into(),
    });

    match sqlx::query("SELECT COUNT(*) AS count FROM _sqlx_migrations WHERE success = false")
        .fetch_one(pool)
        .await
    {
        Ok(row) => {
            let failed: i64 = row.get("count");
            checks.push(DoctorCheck {
                id: "migration_drift".into(),
                status: if failed == 0 {
                    CheckStatus::Passed
                } else {
                    CheckStatus::Failed
                },
                detail: if failed == 0 {
                    "no failed migrations recorded".into()
                } else {
                    format!("{failed} migration(s) recorded as failed in _sqlx_migrations")
                },
            });
        }
        Err(e) => checks.push(DoctorCheck {
            id: "migration_drift".into(),
            status: CheckStatus::Failed,
            detail: format!("could not read _sqlx_migrations (has `vault migrate` been run?): {e}"),
        }),
    }

    for table in VAULT_TABLES {
        let exists = sqlx::query(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables \
             WHERE table_schema = 'public' AND table_name = $1) AS exists",
        )
        .bind(table)
        .fetch_one(pool)
        .await;

        match exists {
            Ok(row) => {
                let exists: bool = row.get("exists");
                checks.push(DoctorCheck {
                    id: format!("table_exists:{table}"),
                    status: if exists {
                        CheckStatus::Passed
                    } else {
                        CheckStatus::Failed
                    },
                    detail: if exists {
                        format!("{table} exists")
                    } else {
                        format!("{table} is missing")
                    },
                });
            }
            Err(e) => checks.push(DoctorCheck {
                id: format!("table_exists:{table}"),
                status: CheckStatus::Failed,
                detail: format!("existence check failed: {e}"),
            }),
        }
    }

    checks.push(
        anti_join_check(
            pool,
            "orphan_ref:mission.active_context_pack_id",
            "SELECT COUNT(*) AS count FROM mission m WHERE m.active_context_pack_id IS NOT NULL \
             AND NOT EXISTS (SELECT 1 FROM context_pack c WHERE c.context_pack_id = m.active_context_pack_id)",
        )
        .await,
    );

    checks.push(
        anti_join_check(
            pool,
            "orphan_ref:tool_call.approved_by_decision_id",
            "SELECT COUNT(*) AS count FROM tool_call t WHERE t.approved_by_decision_id IS NOT NULL \
             AND NOT EXISTS (SELECT 1 FROM developer_decision d WHERE d.decision_id = t.approved_by_decision_id)",
        )
        .await,
    );

    checks.push(
        anti_join_check(
            pool,
            "orphan_ref:cloud_payload_preview.approved_decision_id",
            "SELECT COUNT(*) AS count FROM cloud_payload_preview p WHERE p.approved_decision_id IS NOT NULL \
             AND NOT EXISTS (SELECT 1 FROM developer_decision d WHERE d.decision_id = p.approved_decision_id)",
        )
        .await,
    );

    checks.push(
        anti_join_check(
            pool,
            "hash_chain:patch_receipt.previous_receipt_hash",
            "SELECT COUNT(*) AS count FROM patch_receipt r WHERE r.previous_receipt_hash IS NOT NULL \
             AND NOT EXISTS (SELECT 1 FROM patch_receipt prev WHERE prev.receipt_hash = r.previous_receipt_hash)",
        )
        .await,
    );

    let status = if checks.iter().all(|c| c.status == CheckStatus::Passed) {
        CheckStatus::Passed
    } else {
        CheckStatus::Failed
    };

    DoctorReport { checks, status }
}

async fn anti_join_check(pool: &PgPool, id: &str, sql: &str) -> DoctorCheck {
    match sqlx::query(sql).fetch_one(pool).await {
        Ok(row) => {
            let orphan_count: i64 = row.get("count");
            if orphan_count == 0 {
                DoctorCheck {
                    id: id.to_string(),
                    status: CheckStatus::Passed,
                    detail: "no orphaned references".to_string(),
                }
            } else {
                DoctorCheck {
                    id: id.to_string(),
                    status: CheckStatus::Failed,
                    detail: format!("{orphan_count} orphaned reference(s) found"),
                }
            }
        }
        Err(e) => DoctorCheck {
            id: id.to_string(),
            status: CheckStatus::Failed,
            detail: format!("check query failed: {e}"),
        },
    }
}
