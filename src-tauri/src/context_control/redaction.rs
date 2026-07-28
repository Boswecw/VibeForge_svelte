//! The redaction scanner: doc 06 "Algorithm 2" step 5 — "Redact token-like,
//! key-like, credential-like, and personal-data-like values."
//!
//! Every included evidence item's text passes through [`redact`] before it
//! can leave `context_control`. This is a **defense-in-depth** layer, not
//! the primary secret boundary: whole secret-shaped files (`.env`, key
//! files) should never be selected as evidence in the first place — that's
//! `authority::forbidden_patterns`' job at read time, and
//! `budget::select_within_budget`'s job for items the caller marks
//! `secret_like`. Redaction exists for the residual case: a secret pasted
//! *inside* an otherwise-legitimate source file, a connection string in a
//! config comment, an email address in a code sample.
//!
//! Design choices, matching the security-boundary style already set by
//! `authority::forbidden_patterns`:
//!
//! - **High-precision patterns, not a maximal dragnet.** Each regex targets
//!   a recognizable secret shape (provider token prefixes, PEM blocks,
//!   `key = value` credential assignments, `scheme://user:pass@` URLs,
//!   email addresses). Over-redaction that mangles ordinary prose/code is a
//!   real cost here because it degrades the evidence a reviewer sees; the
//!   goal is to catch things that are *unambiguously* secret-shaped and let
//!   the whole-file exclusion layers handle the rest.
//! - **Ordered application.** Broad structural matches (PEM blocks, then
//!   credential assignments and credentialed URLs) run before narrow token
//!   matches, so a secret assigned via `api_key = ghp_...` is counted once,
//!   as a credential, rather than double-counted. Each regex runs over the
//!   text already scrubbed by earlier passes; placeholders contain no `=`,
//!   `:`, `@`, or `.` sequences that later passes match, so redactions never
//!   cascade.
//!
//! Accepted residual risk (flagged adversarially 2026-07-24): this is a
//! pattern matcher, not a secret oracle. A high-entropy credential with no
//! recognizable prefix, delimiter, or assignment context (a bare 40-char
//! hex string sitting alone on a line that could equally be a git SHA or a
//! checksum) is deliberately NOT redacted — treating every long token-shaped
//! string as a secret would redact commit hashes, content hashes, and UUIDs
//! throughout normal repo evidence. Bare-value entropy heuristics belong
//! upstream at file selection (exclude the file), not here at the
//! text-scrub layer. `contains_secret_like` inherits the same boundary and
//! is documented at its call site in `forbidden_fields`.

#![forbid(unsafe_code)]

use regex::Regex;
use std::sync::LazyLock;

/// The four doctrine categories. `label()` feeds the human-readable
/// `redaction_summary` JSONB the vault stores; `placeholder()` is what
/// replaces the matched span in-text.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RedactionCategory {
    Token,
    Key,
    Credential,
    PersonalData,
}

impl RedactionCategory {
    pub fn placeholder(&self) -> &'static str {
        match self {
            RedactionCategory::Token => "[REDACTED_TOKEN]",
            RedactionCategory::Key => "[REDACTED_KEY]",
            RedactionCategory::Credential => "[REDACTED_CREDENTIAL]",
            RedactionCategory::PersonalData => "[REDACTED_PII]",
        }
    }

    fn summary_noun(&self) -> &'static str {
        match self {
            RedactionCategory::Token => "token-like",
            RedactionCategory::Key => "key-like",
            RedactionCategory::Credential => "credential-like",
            RedactionCategory::PersonalData => "personal-data-like",
        }
    }
}

/// Per-category redaction counts for one [`redact`] call.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct RedactionCounts {
    pub token: usize,
    pub key: usize,
    pub credential: usize,
    pub personal_data: usize,
}

impl RedactionCounts {
    pub fn total(&self) -> usize {
        self.token + self.key + self.credential + self.personal_data
    }

    fn add(&mut self, category: RedactionCategory, n: usize) {
        match category {
            RedactionCategory::Token => self.token += n,
            RedactionCategory::Key => self.key += n,
            RedactionCategory::Credential => self.credential += n,
            RedactionCategory::PersonalData => self.personal_data += n,
        }
    }
}

/// The result of redacting one text: the scrubbed text plus what was found.
#[derive(Debug, Clone)]
pub struct RedactionOutcome {
    pub redacted_text: String,
    pub counts: RedactionCounts,
}

// Ordered: structural/broad matches first (so an assigned or URL-embedded
// secret is attributed to Credential, not double-counted as a bare Token),
// narrow provider-token matches next, personal data last.
static PATTERNS: LazyLock<Vec<(RedactionCategory, Regex)>> = LazyLock::new(|| {
    let specs: &[(RedactionCategory, &str)] = &[
        // PEM / private-key blocks (spanning newlines: (?s) makes '.' match '\n').
        (
            RedactionCategory::Key,
            r"(?s)-----BEGIN[A-Z0-9 ]*PRIVATE KEY-----.*?-----END[A-Z0-9 ]*PRIVATE KEY-----",
        ),
        // scheme://user:password@host  (credentialed connection string)
        (
            RedactionCategory::Credential,
            r"[a-zA-Z][a-zA-Z0-9+.\-]*://[^\s:/@]+:[^\s:/@]+@",
        ),
        // key = value / key: value credential assignment
        (
            RedactionCategory::Credential,
            r#"(?i)\b(?:password|passwd|secret|api[_-]?key|access[_-]?key|secret[_-]?key|auth[_-]?token|token)\b\s*[:=]\s*["']?[^\s"']{6,}"#,
        ),
        // AWS access key id
        (RedactionCategory::Credential, r"\bAKIA[0-9A-Z]{16}\b"),
        // GitHub personal/OAuth/server/refresh tokens
        (RedactionCategory::Token, r"\bgh[posru]_[A-Za-z0-9]{20,}"),
        // OpenAI-style secret keys
        (RedactionCategory::Token, r"\bsk-[A-Za-z0-9]{20,}"),
        // Slack tokens
        (RedactionCategory::Token, r"\bxox[baprs]-[A-Za-z0-9-]{10,}"),
        // JSON Web Tokens (header.payload.signature, base64url)
        (
            RedactionCategory::Token,
            r"\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}",
        ),
        // Bearer <token>
        (RedactionCategory::Token, r"(?i)\bbearer\s+[A-Za-z0-9._\-]{16,}"),
        // Email addresses (personal-data-like)
        (
            RedactionCategory::PersonalData,
            r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b",
        ),
    ];

    specs
        .iter()
        .map(|(category, pat)| {
            (
                *category,
                Regex::new(pat).expect("static redaction regex must compile"),
            )
        })
        .collect()
});

/// Redact secret-shaped spans from `input`, returning the scrubbed text and
/// per-category counts. Deterministic and side-effect-free.
pub fn redact(input: &str) -> RedactionOutcome {
    let mut text = input.to_string();
    let mut counts = RedactionCounts::default();

    for (category, re) in PATTERNS.iter() {
        // Count before replacing (replace_all doesn't hand back a match
        // count). Two passes over the string is fine at evidence sizes.
        let n = re.find_iter(&text).count();
        if n > 0 {
            text = re.replace_all(&text, category.placeholder()).into_owned();
            counts.add(*category, n);
        }
    }

    RedactionOutcome {
        redacted_text: text,
        counts,
    }
}

/// `true` if `input` contains at least one secret-shaped span. Used by
/// `forbidden_fields` as a defense-in-depth check that a would-be cloud
/// payload carries no un-redacted secrets. Inherits [`redact`]'s
/// high-precision / no-bare-entropy boundary exactly.
pub fn contains_secret_like(input: &str) -> bool {
    PATTERNS.iter().any(|(_, re)| re.is_match(input))
}

/// Human-readable summary lines for the vault's `redaction_summary` JSONB,
/// e.g. `"3 token-like value(s) redacted"`. Empty when nothing was redacted.
/// Stable order (Token, Key, Credential, PersonalData) so the enclosing
/// context-pack hash is deterministic.
pub fn summarize(counts: &RedactionCounts) -> Vec<String> {
    let mut out = Vec::new();
    for (category, n) in [
        (RedactionCategory::Token, counts.token),
        (RedactionCategory::Key, counts.key),
        (RedactionCategory::Credential, counts.credential),
        (RedactionCategory::PersonalData, counts.personal_data),
    ] {
        if n > 0 {
            out.push(format!("{n} {} value(s) redacted", category.summary_noun()));
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn redacts_github_token() {
        let out = redact("const t = 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';");
        assert!(out.redacted_text.contains("[REDACTED_TOKEN]"));
        assert!(!out.redacted_text.contains("ghp_ABCDEF"));
        assert_eq!(out.counts.token, 1);
    }

    #[test]
    fn redacts_openai_key() {
        let out = redact("key: sk-abcdefghijklmnopqrstuvwxyz012345");
        // "key" is not one of the credential-assignment trigger words
        // (api_key/access_key/secret_key/etc.), so the bare `sk-` token
        // pattern is what fires here. The important property is that the
        // secret is gone, exactly once.
        assert!(!out.redacted_text.contains("sk-abcdef"));
        assert_eq!(out.counts.total(), 1);
        assert_eq!(out.counts.token, 1);
    }

    #[test]
    fn redacts_pem_private_key_block() {
        let pem = "-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAKj\nabcdef\n-----END RSA PRIVATE KEY-----";
        let out = redact(pem);
        assert_eq!(out.redacted_text, "[REDACTED_KEY]");
        assert_eq!(out.counts.key, 1);
    }

    #[test]
    fn redacts_credentialed_connection_string() {
        let out = redact("DB=postgres://forge:hunter2@db.internal:5432/app");
        assert!(out.redacted_text.contains("[REDACTED_CREDENTIAL]"));
        assert!(!out.redacted_text.contains("hunter2"));
        assert_eq!(out.counts.credential, 1);
    }

    #[test]
    fn redacts_password_assignment() {
        let out = redact("password = correct-horse-battery");
        assert!(out.redacted_text.contains("[REDACTED_CREDENTIAL]"));
        assert!(!out.redacted_text.contains("correct-horse"));
    }

    #[test]
    fn redacts_email_as_personal_data() {
        let out = redact("Contact: jane.doe@example.com for access.");
        assert!(out.redacted_text.contains("[REDACTED_PII]"));
        assert!(!out.redacted_text.contains("jane.doe@example.com"));
        assert_eq!(out.counts.personal_data, 1);
    }

    #[test]
    fn leaves_ordinary_code_untouched() {
        let src = "fn add(a: i32, b: i32) -> i32 { a + b } // returns the sum";
        let out = redact(src);
        assert_eq!(out.redacted_text, src);
        assert_eq!(out.counts.total(), 0);
    }

    #[test]
    fn does_not_redact_bare_git_sha_or_content_hash() {
        // Accepted-residual-risk boundary: a bare 40-hex string with no
        // secret context is NOT redacted (it's almost always a commit SHA or
        // content hash in repo evidence). Documented in the module header.
        let sha = "40e1a2b3c4d5e6f70819a2b3c4d5e6f708192a3b";
        let out = redact(&format!("source_commit = {sha}"));
        // The `= <value>` here matches the credential-assignment rule only
        // if the key is a secret-ish word; "source_commit" is not in that
        // list, so the SHA survives.
        assert!(out.redacted_text.contains(sha));
    }

    #[test]
    fn contains_secret_like_flags_tokens_but_not_plain_prose() {
        assert!(contains_secret_like("here is ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"));
        assert!(!contains_secret_like("the quick brown fox jumps over the lazy dog"));
    }

    #[test]
    fn summarize_lists_only_nonzero_categories_in_stable_order() {
        let counts = RedactionCounts {
            token: 2,
            key: 0,
            credential: 1,
            personal_data: 0,
        };
        let summary = summarize(&counts);
        assert_eq!(
            summary,
            vec![
                "2 token-like value(s) redacted".to_string(),
                "1 credential-like value(s) redacted".to_string(),
            ]
        );
    }

    #[test]
    fn summarize_empty_when_nothing_redacted() {
        assert!(summarize(&RedactionCounts::default()).is_empty());
    }
}
