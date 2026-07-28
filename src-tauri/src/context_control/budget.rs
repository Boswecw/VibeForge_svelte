//! Token/size budgeting and evidence minimization: doc 06 "Algorithm 2"
//! step 3 ("Select minimal evidence") plus the token-budget column the
//! `context_pack` schema carries (`token_budget INTEGER NOT NULL`).
//!
//! Two responsibilities, both pure:
//!
//! 1. **Drop what must never be included at all.** Items the caller marked
//!    `secret_like` are excluded wholesale with
//!    [`ExclusionReason::SecretLike`] before any budgeting — this is the
//!    "secret-like fixtures are excluded" exit-gate property, enforced here
//!    rather than left to the inline redaction pass (redaction is for
//!    residual secrets *inside* legitimate evidence; a file that is itself a
//!    secret should never enter a pack).
//! 2. **Bound the rest.** Greedily include remaining items, in the order the
//!    caller offered them (the caller owns evidence *priority* — architecture
//!    summary first, then tests, then snippets, per doc 06 step 3), until the
//!    next item would exceed `token_budget`, then exclude the overflow with
//!    [`ExclusionReason::BudgetExceeded`].
//!
//! Token estimation is a deliberately crude, model-agnostic ~4-chars-per-
//! token heuristic. It is NOT a real tokenizer and does not try to be: the
//! budget is a *conservative safety bound* on how much evidence leaves the
//! machine, not a billing figure. Erring toward over-counting (excluding a
//! borderline item) is the safe direction for a privacy budget.

#![forbid(unsafe_code)]

use super::EvidenceItem;

/// Why an evidence item was excluded from the pack.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExclusionReason {
    SecretLike,
    BudgetExceeded,
}

impl ExclusionReason {
    pub fn as_str(&self) -> &'static str {
        match self {
            ExclusionReason::SecretLike => "excluded: secret-like, not eligible for context",
            ExclusionReason::BudgetExceeded => "excluded: token budget exceeded",
        }
    }
}

#[derive(Debug, Clone)]
pub struct ExcludedItem {
    pub item: EvidenceItem,
    pub reason: ExclusionReason,
}

#[derive(Debug, Clone)]
pub struct BudgetedSelection {
    pub included: Vec<EvidenceItem>,
    pub excluded: Vec<ExcludedItem>,
    pub used_tokens: usize,
    pub token_budget: usize,
}

/// Crude, model-agnostic token estimate: ceil(chars / 4), with a floor of 1
/// for any non-empty text so a tiny item still costs something against the
/// budget. Empty text costs 0.
pub fn estimate_tokens(text: &str) -> usize {
    let chars = text.chars().count();
    if chars == 0 {
        0
    } else {
        chars.div_ceil(4).max(1)
    }
}

/// Select a minimal, budget-bounded subset of `items`.
///
/// Secret-like items are dropped first (never counted against the budget —
/// they were never eligible). Remaining items are included greedily in
/// offered order until the running total would exceed `token_budget`; the
/// rest are excluded as `BudgetExceeded`. A single item larger than the
/// whole budget is excluded (not truncated) — partial evidence is worse than
/// a clean "this didn't fit" exclusion a reviewer can see.
pub fn select_within_budget(items: Vec<EvidenceItem>, token_budget: usize) -> BudgetedSelection {
    let mut included = Vec::new();
    let mut excluded = Vec::new();
    let mut used_tokens = 0usize;

    for item in items {
        if item.secret_like {
            excluded.push(ExcludedItem {
                item,
                reason: ExclusionReason::SecretLike,
            });
            continue;
        }

        let cost = estimate_tokens(&item.content);
        if used_tokens + cost <= token_budget {
            used_tokens += cost;
            included.push(item);
        } else {
            excluded.push(ExcludedItem {
                item,
                reason: ExclusionReason::BudgetExceeded,
            });
        }
    }

    BudgetedSelection {
        included,
        excluded,
        used_tokens,
        token_budget,
    }
}

/// Deterministic credit estimate for a cloud route, as a pure function of
/// route class and the token budget. `local`/`team_policy` never cost cloud
/// credits (they don't leave the machine); `quick_cloud` bills ~1 credit per
/// 1k budgeted tokens; `deep_cloud` is ~4x plus a fixed setup cost for the
/// heavier multi-pass job. Saturating and integer-only so it can go straight
/// into `cloud_payload_preview.estimated_credits` (`INTEGER CHECK >= 0`).
pub fn estimate_credits(route: super::RouteClass, token_budget: usize) -> i32 {
    use super::RouteClass;
    let per_k = token_budget.div_ceil(1000);
    let credits = match route {
        RouteClass::Local | RouteClass::TeamPolicy => 0,
        RouteClass::QuickCloud => per_k,
        RouteClass::DeepCloud => per_k.saturating_mul(4).saturating_add(10),
    };
    i32::try_from(credits).unwrap_or(i32::MAX)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn item(label: &str, content: &str) -> EvidenceItem {
        EvidenceItem::new(label, format!("src/{label}.txt"), content)
    }

    #[test]
    fn estimate_tokens_is_roughly_quarter_char_count() {
        assert_eq!(estimate_tokens(""), 0);
        assert_eq!(estimate_tokens("abcd"), 1);
        assert_eq!(estimate_tokens("abcde"), 2); // ceil(5/4)
        assert_eq!(estimate_tokens(&"x".repeat(400)), 100);
    }

    #[test]
    fn secret_like_items_are_excluded_before_budgeting() {
        let items = vec![
            item("readme", "hello world"),
            EvidenceItem::new("dotenv", ".env", "SECRET=1").secret(),
        ];
        let sel = select_within_budget(items, 10_000);
        assert_eq!(sel.included.len(), 1);
        assert_eq!(sel.included[0].label, "readme");
        assert_eq!(sel.excluded.len(), 1);
        assert_eq!(sel.excluded[0].reason, ExclusionReason::SecretLike);
        // secret item never counted against the budget
        assert_eq!(sel.used_tokens, estimate_tokens("hello world"));
    }

    #[test]
    fn greedy_inclusion_respects_budget_in_offered_order() {
        // each content is 40 chars -> 10 tokens; budget of 25 fits two.
        let forty = "x".repeat(40);
        let items = vec![
            item("a", &forty),
            item("b", &forty),
            item("c", &forty),
        ];
        let sel = select_within_budget(items, 25);
        assert_eq!(sel.included.iter().map(|i| i.label.clone()).collect::<Vec<_>>(), vec!["a", "b"]);
        assert_eq!(sel.excluded.len(), 1);
        assert_eq!(sel.excluded[0].item.label, "c");
        assert_eq!(sel.excluded[0].reason, ExclusionReason::BudgetExceeded);
        assert_eq!(sel.used_tokens, 20);
    }

    #[test]
    fn item_larger_than_whole_budget_is_excluded_not_truncated() {
        let sel = select_within_budget(vec![item("big", &"x".repeat(4000))], 100);
        assert!(sel.included.is_empty());
        assert_eq!(sel.excluded[0].reason, ExclusionReason::BudgetExceeded);
    }

    #[test]
    fn credit_estimate_is_zero_for_local_and_team_routes() {
        assert_eq!(estimate_credits(super::super::RouteClass::Local, 100_000), 0);
        assert_eq!(estimate_credits(super::super::RouteClass::TeamPolicy, 100_000), 0);
    }

    #[test]
    fn deep_cloud_costs_more_than_quick_cloud() {
        let quick = estimate_credits(super::super::RouteClass::QuickCloud, 8000);
        let deep = estimate_credits(super::super::RouteClass::DeepCloud, 8000);
        assert_eq!(quick, 8);
        assert_eq!(deep, 42); // 8*4 + 10
        assert!(deep > quick);
    }
}
