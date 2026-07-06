//! Instruction drift detection: claimed commands extracted from
//! unstructured instruction-file prose, compared against what the scanner
//! actually found. Deterministic regex/string matching only — no LLM
//! calls, no NLP dependency.
//!
//! The recognized-binaries list here (`npm`, `pnpm`, `yarn`, `cargo`,
//! `pytest`, `python`, `go`, `mvn`, `gradle`, `make`, `bundle`, `composer`,
//! `rspec`) is a DIFFERENT, unrelated list from
//! `crate::authority::command_policy`'s own command-safety classification
//! list — different job entirely: this module extracts CLAIMED commands
//! out of prose; `command_policy` classifies the safety of an
//! already-fully-formed shell command string. Do not import or reuse that
//! module here.
//!
//! `extract_claimed_commands` is a hand-rolled single-pass state machine
//! over `text.lines()`, not an unbounded multi-line `DOTALL` regex over
//! the whole prose — this repo's own
//! `authority::forbidden_patterns` doc comment already argues against a
//! general-purpose engine for a similarly fixed-shape matching problem for
//! a related reason (auditability); the additional reason here is
//! avoiding pathological backtracking risk from a DOTALL-style regex
//! scanning arbitrarily large untrusted prose.

#![forbid(unsafe_code)]

use crate::repo_truth::commands::CommandCandidate;
use crate::repo_truth::languages::LanguageSummary;
use regex::Regex;
use std::collections::{BTreeMap, HashSet};
use std::sync::OnceLock;

const RECOGNIZED_BINARIES: &[&str] = &[
    "npm", "pnpm", "yarn", "cargo", "pytest", "python", "go", "mvn", "gradle", "make", "bundle", "composer", "rspec",
];

/// Binaries that are already a complete, meaningful command on their own
/// (no subcommand/argument required) — `pytest`, `rspec`, and bare `make`
/// (runs the default target) are real, common single-word claims in
/// instruction file prose. Every other recognized binary (`go`, `cargo`,
/// `npm`, etc) needs at least a second token to be worth treating as a
/// command claim at all — a bare `go` or `cargo` token alone is far more
/// likely to be an ordinary English word / package name than an actual
/// command reference. This is what "e.g. `go test` needs both tokens"
/// means in practice.
const SELF_SUFFICIENT_SINGLE_TOKEN: &[&str] = &["pytest", "rspec", "make"];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClaimedCommand {
    pub raw_text: String,
    pub file_path: String,
    pub line_number: u32,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct DriftFindingData {
    pub file_path: String,
    /// Exactly one of these two string values for this MVP.
    pub drift_type: &'static str,
    /// `"high" | "medium" | "low"`, matching the DB's `risk_level` enum —
    /// these detectors only ever produce `high`/`medium`, never
    /// `"critical"`.
    pub severity: &'static str,
    pub finding_summary: String,
    pub evidence_refs: serde_json::Value,
}

fn looks_like_recognized_command(span: &str) -> bool {
    let tokens: Vec<&str> = span.split_whitespace().collect();
    let Some(first) = tokens.first() else {
        return false;
    };
    let first_lower = first.to_ascii_lowercase();
    if !RECOGNIZED_BINARIES.contains(&first_lower.as_str()) {
        return false;
    }
    if tokens.len() >= 2 {
        return true;
    }
    SELF_SUFFICIENT_SINGLE_TOKEN.contains(&first_lower.as_str())
}

fn inline_backtick_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"`([^`\n]+)`").unwrap())
}

/// Single linear pass over `text.lines()`, maintaining an `in_fence`
/// state toggled by any line whose trimmed content starts with three
/// backticks. Every line while `in_fence` is a candidate span in full;
/// every non-fenced line is additionally scanned for inline
/// single-backtick spans. Identical `raw_text` within this one file is
/// deduped, keeping the first `line_number` seen.
pub fn extract_claimed_commands(file_path: &str, text: &str) -> Vec<ClaimedCommand> {
    let mut in_fence = false;
    let mut claims: Vec<ClaimedCommand> = Vec::new();
    let mut seen: HashSet<String> = HashSet::new();

    for (idx, line) in text.lines().enumerate() {
        let line_number = (idx + 1) as u32;

        if line.trim_start().starts_with("```") {
            in_fence = !in_fence;
            continue;
        }

        if in_fence {
            consider_span(line.trim(), file_path, line_number, &mut claims, &mut seen);
        } else {
            for cap in inline_backtick_regex().captures_iter(line) {
                consider_span(cap[1].trim(), file_path, line_number, &mut claims, &mut seen);
            }
        }
    }

    claims
}

fn consider_span(
    span: &str,
    file_path: &str,
    line_number: u32,
    claims: &mut Vec<ClaimedCommand>,
    seen: &mut HashSet<String>,
) {
    if span.is_empty() || !looks_like_recognized_command(span) {
        return;
    }
    if !seen.insert(span.to_string()) {
        return;
    }
    claims.push(ClaimedCommand {
        raw_text: span.to_string(),
        file_path: file_path.to_string(),
        line_number,
    });
}

/// Lowercase, collapse whitespace, and fold the `<pm> run <x>` / `<pm>
/// <x>` shorthand equivalence for `npm`/`pnpm`/`yarn` specifically (strip
/// a literal `"run"` token immediately following the package-manager
/// token), so `"pnpm run test"` and `"pnpm test"` compare equal.
pub fn normalize_command(command: &str) -> String {
    let lower = command.to_ascii_lowercase();
    let tokens: Vec<&str> = lower.split_whitespace().collect();
    if tokens.is_empty() {
        return String::new();
    }

    let pm_tokens = ["npm", "pnpm", "yarn"];
    if pm_tokens.contains(&tokens[0]) && tokens.len() >= 2 && tokens[1] == "run" {
        let mut folded = vec![tokens[0]];
        folded.extend(&tokens[2..]);
        return folded.join(" ");
    }

    tokens.join(" ")
}

fn language_for_binary(binary: &str) -> Option<&'static str> {
    match binary {
        "npm" | "pnpm" | "yarn" => Some("javascript"),
        "cargo" => Some("rust"),
        "pytest" | "python" => Some("python"),
        "go" => Some("go"),
        "mvn" | "gradle" => Some("java"),
        "bundle" | "rspec" => Some("ruby"),
        "composer" => Some("php"),
        // `make` is a language-agnostic build tool used across many
        // ecosystems -- absence of any *specific* language can't be used
        // to infer "make is definitely wrong here", so a `make` claim
        // never escalates to `high` on ecosystem-absence grounds alone.
        "make" => None,
        _ => None,
    }
}

const MAX_QUOTE_CHARS: usize = 200;

fn truncate_quote(text: &str) -> String {
    if text.chars().count() <= MAX_QUOTE_CHARS {
        text.to_string()
    } else {
        let truncated: String = text.chars().take(MAX_QUOTE_CHARS).collect();
        format!("{truncated}\u{2026}")
    }
}

/// For each claim, normalize it and compare against every normalized
/// candidate from BOTH `test_candidates` and `build_candidates` combined.
/// An exact match means no finding. No match produces a finding with
/// `severity = "high"` if the claim's recognized binary's entire
/// ecosystem/language is completely absent from `language_summary`, else
/// `severity = "medium"` (ecosystem present, specific script/target name
/// just doesn't match).
pub fn detect_unverifiable_claims(
    claims: &[ClaimedCommand],
    test_candidates: &[CommandCandidate],
    build_candidates: &[CommandCandidate],
    language_summary: &LanguageSummary,
) -> Vec<DriftFindingData> {
    let normalized_candidates: Vec<String> = test_candidates
        .iter()
        .chain(build_candidates.iter())
        .map(|c| normalize_command(&c.command))
        .collect();

    let mut findings = Vec::new();
    for claim in claims {
        let normalized_claim = normalize_command(&claim.raw_text);
        if normalized_candidates.iter().any(|c| *c == normalized_claim) {
            continue;
        }

        let first_token = claim.raw_text.split_whitespace().next().unwrap_or("").to_ascii_lowercase();
        let ecosystem_absent = match language_for_binary(&first_token) {
            Some(lang) => !language_summary.languages.iter().any(|l| l.language == lang),
            None => false,
        };
        let severity = if ecosystem_absent { "high" } else { "medium" };

        let checked_against: Vec<serde_json::Value> = test_candidates
            .iter()
            .chain(build_candidates.iter())
            .map(|c| serde_json::Value::String(c.command.clone()))
            .collect();

        findings.push(DriftFindingData {
            file_path: claim.file_path.clone(),
            drift_type: "unverifiable_command_reference",
            severity,
            finding_summary: format!(
                "{} references `{}`, which does not match any detected test/build command",
                claim.file_path, claim.raw_text
            ),
            evidence_refs: serde_json::json!([{
                "file_path": claim.file_path,
                "line_number": claim.line_number,
                "quoted_text": truncate_quote(&claim.raw_text),
                "checked_against": checked_against,
            }]),
        });
    }
    findings
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Intent {
    Test,
    Build,
    /// Ignored for MVP — the schema only has test/build candidate
    /// columns to check claims against.
    Other,
}

/// Loosely honors "ends in test"/"equals pytest/rspec" from the product
/// spec while still recognizing realistic multi-argument forms like `"go
/// test ./..."` or `"bundle exec rspec"` — checking for the presence of a
/// `test`/`rspec`/`pytest` TOKEN anywhere in the normalized command,
/// rather than requiring it to be the exact last token, which the literal
/// "ends in" wording alone would miss for `"go test ./..."`.
fn classify_intent(normalized: &str) -> Intent {
    let tokens: Vec<&str> = normalized.split_whitespace().collect();
    let has_token = |t: &str| tokens.iter().any(|tok| *tok == t);

    if normalized == "pytest" || normalized == "rspec" || has_token("test") || has_token("rspec") || has_token("pytest")
    {
        return Intent::Test;
    }
    if has_token("build") {
        return Intent::Build;
    }
    Intent::Other
}

/// For every PAIR of instruction files, if both have a Test-intent claim
/// (or both Build-intent) whose normalized forms differ, produce a
/// `conflicting_instruction_commands` finding. `file_path` on the finding
/// is the alphabetically-first of the two file paths — the schema has
/// exactly one `file_path` column per finding row, and `evidence_refs`
/// lists both files' claims so the finding is still self-explanatory.
pub fn detect_conflicting_instructions(claims: &[ClaimedCommand]) -> Vec<DriftFindingData> {
    let mut by_file: BTreeMap<String, Vec<(Intent, String, &ClaimedCommand)>> = BTreeMap::new();
    for claim in claims {
        let normalized = normalize_command(&claim.raw_text);
        let intent = classify_intent(&normalized);
        if intent == Intent::Other {
            continue;
        }
        by_file.entry(claim.file_path.clone()).or_default().push((intent, normalized, claim));
    }

    let files: Vec<&String> = by_file.keys().collect();
    let mut findings = Vec::new();

    for i in 0..files.len() {
        for j in (i + 1)..files.len() {
            // `files` is derived from a BTreeMap's sorted keys, so
            // files[i] is always alphabetically <= files[j] here.
            let file_a = files[i];
            let file_b = files[j];
            let claims_a = &by_file[file_a];
            let claims_b = &by_file[file_b];

            for intent in [Intent::Test, Intent::Build] {
                for (a_intent, norm_a, claim_a) in claims_a {
                    if *a_intent != intent {
                        continue;
                    }
                    for (b_intent, norm_b, claim_b) in claims_b {
                        if *b_intent != intent || norm_a == norm_b {
                            continue;
                        }
                        findings.push(DriftFindingData {
                            file_path: file_a.clone(),
                            drift_type: "conflicting_instruction_commands",
                            severity: "medium",
                            finding_summary: format!(
                                "{} claims `{}` while {} claims `{}` for the same {intent:?} command",
                                claim_a.file_path, claim_a.raw_text, claim_b.file_path, claim_b.raw_text
                            ),
                            evidence_refs: serde_json::json!([
                                {
                                    "file_path": claim_a.file_path,
                                    "line_number": claim_a.line_number,
                                    "quoted_text": truncate_quote(&claim_a.raw_text),
                                },
                                {
                                    "file_path": claim_b.file_path,
                                    "line_number": claim_b.line_number,
                                    "quoted_text": truncate_quote(&claim_b.raw_text),
                                }
                            ]),
                        });
                    }
                }
            }
        }
    }

    findings
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::repo_truth::commands::Confidence;
    use crate::repo_truth::languages::LanguageCount;

    fn language_summary_with(languages: &[&str]) -> LanguageSummary {
        LanguageSummary {
            languages: languages
                .iter()
                .map(|l| LanguageCount {
                    language: l.to_string(),
                    file_count: 1,
                })
                .collect(),
            primary_language: languages.first().map(|s| s.to_string()),
        }
    }

    #[test]
    fn extraction_works_from_fenced_blocks_and_inline_backticks() {
        let text = "Run tests:\n```\nnpm test\n```\nOr just use `cargo test` inline.\n";
        let claims = extract_claimed_commands("AGENTS.md", text);
        assert!(claims.iter().any(|c| c.raw_text == "npm test"));
        assert!(claims.iter().any(|c| c.raw_text == "cargo test"));
    }

    #[test]
    fn bare_single_token_go_is_not_extracted_but_go_test_is() {
        let text = "```\ngo\ngo test\n```\n";
        let claims = extract_claimed_commands("AGENTS.md", text);
        assert!(!claims.iter().any(|c| c.raw_text == "go"));
        assert!(claims.iter().any(|c| c.raw_text == "go test"));
    }

    #[test]
    fn exact_match_between_claim_and_candidate_produces_no_findings() {
        let claims = vec![ClaimedCommand {
            raw_text: "npm test".to_string(),
            file_path: "AGENTS.md".to_string(),
            line_number: 1,
        }];
        let test_candidates = vec![CommandCandidate {
            command: "npm run test".to_string(),
            source: "package.json:scripts.test".to_string(),
            confidence: Confidence::High,
        }];
        let summary = language_summary_with(&["javascript"]);

        let findings = detect_unverifiable_claims(&claims, &test_candidates, &[], &summary);
        assert!(findings.is_empty());
    }

    #[test]
    fn ecosystem_absent_is_high_ecosystem_present_wrong_script_is_medium() {
        let absent_claims = vec![ClaimedCommand {
            raw_text: "cargo test".to_string(),
            file_path: "AGENTS.md".to_string(),
            line_number: 1,
        }];
        let empty_summary = language_summary_with(&[]);
        let absent_findings = detect_unverifiable_claims(&absent_claims, &[], &[], &empty_summary);
        assert_eq!(absent_findings.len(), 1);
        assert_eq!(absent_findings[0].severity, "high");

        let present_claims = vec![ClaimedCommand {
            raw_text: "npm run e2e".to_string(),
            file_path: "AGENTS.md".to_string(),
            line_number: 2,
        }];
        let js_summary = language_summary_with(&["javascript"]);
        let test_candidates = vec![CommandCandidate {
            command: "npm run test".to_string(),
            source: "package.json:scripts.test".to_string(),
            confidence: Confidence::High,
        }];
        let present_findings = detect_unverifiable_claims(&present_claims, &test_candidates, &[], &js_summary);
        assert_eq!(present_findings.len(), 1);
        assert_eq!(present_findings[0].severity, "medium");
    }

    #[test]
    fn conflicting_test_commands_produce_a_finding() {
        let claims = vec![
            ClaimedCommand {
                raw_text: "npm test".to_string(),
                file_path: "AGENTS.md".to_string(),
                line_number: 1,
            },
            ClaimedCommand {
                raw_text: "pytest".to_string(),
                file_path: "CLAUDE.md".to_string(),
                line_number: 1,
            },
        ];
        let findings = detect_conflicting_instructions(&claims);
        assert_eq!(findings.len(), 1);
        assert_eq!(findings[0].drift_type, "conflicting_instruction_commands");
        assert_eq!(findings[0].file_path, "AGENTS.md");
    }

    #[test]
    fn agreeing_instruction_files_produce_no_conflict_finding() {
        let claims = vec![
            ClaimedCommand {
                raw_text: "npm test".to_string(),
                file_path: "AGENTS.md".to_string(),
                line_number: 1,
            },
            ClaimedCommand {
                raw_text: "npm run test".to_string(),
                file_path: "CLAUDE.md".to_string(),
                line_number: 1,
            },
        ];
        let findings = detect_conflicting_instructions(&claims);
        assert!(findings.is_empty());
    }

    #[test]
    fn npm_run_test_and_npm_test_normalize_equal() {
        assert_eq!(normalize_command("npm run test"), normalize_command("npm test"));
        assert_eq!(normalize_command("pnpm run test"), normalize_command("pnpm test"));
    }

    #[test]
    fn adversarial_conflicting_instructions_quadratic_blowup_two_files() {
        // Two instruction files, each with M distinct test-intent claims
        // (varying a trailing numeric token so none get deduped as
        // identical raw_text within a file). detect_conflicting_instructions
        // is a for-i-in-files/for-j-in-files/for-claim_a/for-claim_b nested
        // loop -- for two files this alone is already O(M^2).
        for m in [200usize, 400, 800, 1600] {
            let mut claims = Vec::new();
            for i in 0..m {
                claims.push(ClaimedCommand {
                    raw_text: format!("pytest v{i:06}"),
                    file_path: "AGENTS.md".to_string(),
                    line_number: 1,
                });
            }
            for i in 0..m {
                claims.push(ClaimedCommand {
                    raw_text: format!("pytest w{i:06}"),
                    file_path: "CLAUDE.md".to_string(),
                    line_number: 1,
                });
            }
            let start = std::time::Instant::now();
            let findings = detect_conflicting_instructions(&claims);
            let elapsed = start.elapsed();
            eprintln!("m={m} (2 files, {} total claims) -> {} findings in {elapsed:?}", claims.len(), findings.len());
        }
    }

    #[test]
    fn adversarial_conflicting_instructions_quadratic_blowup_many_files() {
        // Now scale the FILE COUNT too (up to DEFAULT_MAX_INSTRUCTION_FILES
        // = 50), each with a realistic-ish number of distinct claims
        // extracted from a single ~500KB instruction file (the
        // safe_read::DEFAULT_MAX_PARSE_WINDOW cap). A single backtick span
        // like "`pytest v000001`" is ~17 bytes, so ~500_000/17 =~ 29000
        // distinct claims COULD fit in one file's parse window. Use a more
        // conservative 2000/file here to keep this adversarial test itself
        // from taking forever, and extrapolate.
        let per_file = 300usize;
        for num_files in [2usize, 5, 10, 20, 50] {
            let mut claims = Vec::new();
            for f in 0..num_files {
                let file_path = format!("instr_{f:02}.md");
                for i in 0..per_file {
                    claims.push(ClaimedCommand {
                        raw_text: format!("pytest f{f:02}v{i:06}"),
                        file_path: file_path.clone(),
                        line_number: 1,
                    });
                }
            }
            let start = std::time::Instant::now();
            let findings = detect_conflicting_instructions(&claims);
            let elapsed = start.elapsed();
            eprintln!(
                "num_files={num_files} per_file={per_file} (total claims={}) -> {} findings in {elapsed:?}",
                claims.len(),
                findings.len()
            );
        }
    }

    #[test]
    fn identical_repeated_claims_within_one_file_dedupe_to_one() {
        let text = "```\nnpm test\n```\nAgain: `npm test`\n";
        let claims = extract_claimed_commands("AGENTS.md", text);
        assert_eq!(claims.iter().filter(|c| c.raw_text == "npm test").count(), 1);
        // First occurrence's line number (inside the fence) is kept.
        let kept = claims.iter().find(|c| c.raw_text == "npm test").unwrap();
        assert_eq!(kept.line_number, 2);
    }

    #[test]
    fn zzz_adversarial_finding_summary_leaks_unbounded_raw_text_via_giant_fenced_line() {
        // A single fenced-code-block LINE starting with a recognized
        // binary token ("npm") but followed by ~50KB of arbitrary prose
        // (e.g. embedded secrets/proprietary text) on that SAME line. The
        // whole line becomes `raw_text` in `extract_claimed_commands`
        // (nothing caps line length there), then flows into
        // `detect_unverifiable_claims`. `evidence_refs.quoted_text` is
        // correctly bounded via `truncate_quote`, but `finding_summary` is
        // built with `claim.raw_text` directly and unbounded.
        let secret_blob = "SECRET_PAYLOAD_".repeat(4000); // ~64,000 chars
        let raw_line = format!("npm test {secret_blob}");
        let claims = vec![ClaimedCommand {
            raw_text: raw_line.clone(),
            file_path: "AGENTS.md".to_string(),
            line_number: 1,
        }];
        let summary = language_summary_with(&["javascript"]);

        let findings = detect_unverifiable_claims(&claims, &[], &[], &summary);
        assert_eq!(findings.len(), 1);
        let finding = &findings[0];

        eprintln!("finding_summary.len() = {}", finding.finding_summary.len());
        eprintln!("raw_line.len() = {}", raw_line.len());
        eprintln!("finding_summary prefix = {}", &finding.finding_summary[..200.min(finding.finding_summary.len())]);

        let evidence_str = finding.evidence_refs.to_string();
        eprintln!("evidence_refs.len() = {}", evidence_str.len());

        // CONFIRM: finding_summary contains the full ~64,000-char secret
        // blob verbatim, unbounded and unrelated to MAX_QUOTE_CHARS (200).
        assert!(
            finding.finding_summary.contains(&secret_blob),
            "finding_summary should contain the full unbounded raw_text (this is the bug)"
        );
        assert!(
            finding.finding_summary.len() > MAX_QUOTE_CHARS * 10,
            "finding_summary length ({}) is NOT bounded anywhere near MAX_QUOTE_CHARS ({})",
            finding.finding_summary.len(),
            MAX_QUOTE_CHARS
        );

        // Meanwhile evidence_refs' quoted_text IS correctly bounded.
        assert!(
            !evidence_str.contains(&secret_blob),
            "evidence_refs should NOT contain the full blob (it should be truncated)"
        );
    }

    #[test]
    fn zzz_adversarial_conflicting_finding_summary_also_leaks_unbounded_raw_text() {
        // Same bug class in `detect_conflicting_instructions`: its
        // `finding_summary` also interpolates `claim_a.raw_text` /
        // `claim_b.raw_text` directly, unbounded, even though its own
        // `evidence_refs.quoted_text` values are correctly truncated.
        let secret_blob = "CONFLICT_SECRET_".repeat(3000); // ~51,000 chars
        let claims = vec![
            ClaimedCommand {
                raw_text: format!("npm test {secret_blob}"),
                file_path: "AGENTS.md".to_string(),
                line_number: 1,
            },
            ClaimedCommand {
                raw_text: "pytest".to_string(),
                file_path: "CLAUDE.md".to_string(),
                line_number: 1,
            },
        ];
        let findings = detect_conflicting_instructions(&claims);
        assert_eq!(findings.len(), 1);
        let finding = &findings[0];

        eprintln!("conflicting finding_summary.len() = {}", finding.finding_summary.len());
        assert!(
            finding.finding_summary.contains(&secret_blob),
            "conflicting-instructions finding_summary should contain the full unbounded raw_text (this is the bug)"
        );
    }
}
