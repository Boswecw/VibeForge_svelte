//! Candidate test/build command derivation from `ManifestFacts`.
//!
//! Every rule here reads only structured `ManifestFacts` fields, never raw
//! manifest text — `manifests.rs` owns turning file bytes into facts;
//! this file only reasons about those facts.
//!
//! Sort-before-serialize contract: every returned `Vec` is sorted by
//! `(source, command)` before returning, for the same determinism reason
//! documented in `languages.rs` — a byte-stable snapshot hash later
//! depends on producer-owned array ordering, not just canonicalized JSON
//! object keys.

#![forbid(unsafe_code)]

use crate::repo_truth::manifests::{ManifestFacts, ManifestKind};

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Confidence {
    High,
    Medium,
    Low,
}

/// Deliberately also `Deserialize`: the `vibeforge_repo_truth drift`
/// subcommand reloads a prior scan's already-stored
/// `test_command_candidates`/`build_command_candidates` JSONB columns
/// (rather than re-running manifest parsing) and needs to round-trip them
/// back into this type.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub struct CommandCandidate {
    pub command: String,
    pub source: String,
    pub confidence: Confidence,
}

fn sort_candidates(candidates: &mut Vec<CommandCandidate>) {
    candidates.sort_by(|a, b| (a.source.as_str(), a.command.as_str()).cmp(&(b.source.as_str(), b.command.as_str())));
}

/// Derive candidate TEST commands from parsed manifest facts.
pub fn test_command_candidates(manifests: &[ManifestFacts]) -> Vec<CommandCandidate> {
    let mut out = Vec::new();

    for m in manifests {
        match m.kind {
            ManifestKind::PackageJson => {
                let pm = m.package_manager_hint.as_deref().unwrap_or("npm");
                for (key, cmd) in &m.package_scripts {
                    // `source` includes the script's actual command text, not
                    // just its key name -- otherwise the emitted `command`
                    // (always "pm run <key>", the correct invocation
                    // regardless of the underlying tool) is identical whether
                    // the script runs vitest or jest, and nothing in the
                    // persisted snapshot changes when a script's
                    // implementation changes while its name doesn't. Found
                    // via the pre-existing `hash_changes_when_a_tracked_file_changes`
                    // test in scan.rs, which asserted this and failed against
                    // the original `_cmd`-ignoring implementation.
                    if key == "test" {
                        out.push(CommandCandidate {
                            command: format!("{pm} run test"),
                            source: format!("package.json:scripts.test={cmd}"),
                            confidence: Confidence::High,
                        });
                    } else if key.to_ascii_lowercase().contains("test") {
                        out.push(CommandCandidate {
                            command: format!("{pm} run {key}"),
                            source: format!("package.json:scripts.{key}={cmd}"),
                            confidence: Confidence::Medium,
                        });
                    }
                }
            }
            ManifestKind::CargoToml => {
                out.push(CommandCandidate {
                    command: "cargo test".to_string(),
                    source: format!("{}:presence", m.repo_relative),
                    confidence: Confidence::Medium,
                });
            }
            ManifestKind::PyprojectToml => {
                let has_pytest_dep = m.dependencies.iter().any(|d| d.eq_ignore_ascii_case("pytest"))
                    || m.dev_dependencies.iter().any(|d| d.eq_ignore_ascii_case("pytest"));
                if m.pyproject_has_pytest_ini_options {
                    out.push(CommandCandidate {
                        command: "pytest".to_string(),
                        source: format!("{}:tool.pytest.ini_options", m.repo_relative),
                        confidence: Confidence::High,
                    });
                } else if has_pytest_dep {
                    out.push(CommandCandidate {
                        command: "pytest".to_string(),
                        source: format!("{}:dependencies.pytest", m.repo_relative),
                        confidence: Confidence::Medium,
                    });
                }
            }
            ManifestKind::RequirementsTxt => {
                if m.dependencies.iter().any(|d| d.eq_ignore_ascii_case("pytest")) {
                    out.push(CommandCandidate {
                        command: "pytest".to_string(),
                        source: format!("{}:pytest", m.repo_relative),
                        confidence: Confidence::Medium,
                    });
                }
            }
            ManifestKind::GoMod => {
                out.push(CommandCandidate {
                    command: "go test ./...".to_string(),
                    source: format!("{}:presence", m.repo_relative),
                    confidence: Confidence::Medium,
                });
            }
            ManifestKind::Gemfile => {
                if m.dependencies.iter().any(|d| d.eq_ignore_ascii_case("rspec")) {
                    out.push(CommandCandidate {
                        command: "bundle exec rspec".to_string(),
                        source: format!("{}:rspec", m.repo_relative),
                        confidence: Confidence::Medium,
                    });
                }
            }
            ManifestKind::Makefile => {
                if m.makefile_targets.iter().any(|t| t.eq_ignore_ascii_case("test")) {
                    out.push(CommandCandidate {
                        command: "make test".to_string(),
                        source: format!("{}:target.test", m.repo_relative),
                        confidence: Confidence::High,
                    });
                }
            }
            ManifestKind::PomXml => {
                out.push(CommandCandidate {
                    command: "mvn test".to_string(),
                    source: format!("{}:presence", m.repo_relative),
                    confidence: Confidence::Medium,
                });
            }
            ManifestKind::BuildGradle => {
                out.push(CommandCandidate {
                    command: "./gradlew test".to_string(),
                    source: format!("{}:presence", m.repo_relative),
                    confidence: Confidence::Medium,
                });
            }
            ManifestKind::ComposerJson => {
                if m.package_scripts.iter().any(|(k, _)| k == "test") {
                    out.push(CommandCandidate {
                        command: "composer run-script test".to_string(),
                        source: format!("{}:scripts.test", m.repo_relative),
                        confidence: Confidence::High,
                    });
                }
            }
        }
    }

    sort_candidates(&mut out);
    out
}

/// Derive candidate BUILD commands from parsed manifest facts. Not every
/// ecosystem covered by `test_command_candidates` has a corresponding
/// build rule in this MVP (e.g. `pom.xml`/`Gemfile`/`requirements.txt`
/// intentionally contribute nothing here).
pub fn build_command_candidates(manifests: &[ManifestFacts]) -> Vec<CommandCandidate> {
    let mut out = Vec::new();

    for m in manifests {
        match m.kind {
            ManifestKind::PackageJson => {
                let pm = m.package_manager_hint.as_deref().unwrap_or("npm");
                for (key, cmd) in &m.package_scripts {
                    if key.to_ascii_lowercase().contains("build") {
                        out.push(CommandCandidate {
                            command: format!("{pm} run {key}"),
                            source: format!("package.json:scripts.{key}={cmd}"),
                            confidence: Confidence::Medium,
                        });
                    }
                }
            }
            ManifestKind::CargoToml => {
                out.push(CommandCandidate {
                    command: "cargo build".to_string(),
                    source: format!("{}:presence", m.repo_relative),
                    confidence: Confidence::Medium,
                });
            }
            ManifestKind::PyprojectToml => {
                if m.pyproject_has_build_system {
                    out.push(CommandCandidate {
                        command: "python -m build".to_string(),
                        source: format!("{}:build-system", m.repo_relative),
                        confidence: Confidence::Medium,
                    });
                }
            }
            ManifestKind::GoMod => {
                out.push(CommandCandidate {
                    command: "go build ./...".to_string(),
                    source: format!("{}:presence", m.repo_relative),
                    confidence: Confidence::Medium,
                });
            }
            ManifestKind::Makefile => {
                if m.makefile_targets.iter().any(|t| t.eq_ignore_ascii_case("build")) {
                    out.push(CommandCandidate {
                        command: "make build".to_string(),
                        source: format!("{}:target.build", m.repo_relative),
                        confidence: Confidence::High,
                    });
                }
            }
            ManifestKind::BuildGradle => {
                out.push(CommandCandidate {
                    command: "./gradlew build".to_string(),
                    source: format!("{}:presence", m.repo_relative),
                    confidence: Confidence::Medium,
                });
            }
            ManifestKind::RequirementsTxt
            | ManifestKind::Gemfile
            | ManifestKind::PomXml
            | ManifestKind::ComposerJson => {}
        }
    }

    sort_candidates(&mut out);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn base_facts(repo_relative: &str, kind: ManifestKind) -> ManifestFacts {
        ManifestFacts {
            repo_relative: repo_relative.to_string(),
            kind,
            language: None,
            dependencies: Vec::new(),
            dev_dependencies: Vec::new(),
            package_scripts: Vec::new(),
            package_manager_hint: None,
            makefile_targets: Vec::new(),
            pyproject_has_pytest_ini_options: false,
            pyproject_has_build_system: false,
            parse_error: None,
        }
    }

    #[test]
    fn cargo_presence_yields_medium_test_and_build_candidates() {
        let manifests = vec![base_facts("Cargo.toml", ManifestKind::CargoToml)];
        let test_candidates = test_command_candidates(&manifests);
        let build_candidates = build_command_candidates(&manifests);

        assert!(test_candidates
            .iter()
            .any(|c| c.command == "cargo test" && c.confidence == Confidence::Medium));
        assert!(build_candidates
            .iter()
            .any(|c| c.command == "cargo build" && c.confidence == Confidence::Medium));
    }

    #[test]
    fn package_json_test_script_is_high_confidence_others_are_medium() {
        let mut facts = base_facts("package.json", ManifestKind::PackageJson);
        facts.package_scripts = vec![
            ("test".to_string(), "vitest run".to_string()),
            ("test:e2e".to_string(), "playwright test".to_string()),
            ("build".to_string(), "vite build".to_string()),
        ];
        facts.package_manager_hint = Some("npm".to_string());

        let test_candidates = test_command_candidates(&[facts.clone()]);
        let build_candidates = build_command_candidates(&[facts]);

        // `source` now includes the script's command text (e.g.
        // "...scripts.test=vitest run"), not just its key name -- matched
        // with `starts_with` here since these assertions care about which
        // script key was found, not the exact command text.
        let exact_test = test_candidates
            .iter()
            .find(|c| c.source.starts_with("package.json:scripts.test="))
            .unwrap();
        assert_eq!(exact_test.command, "npm run test");
        assert_eq!(exact_test.confidence, Confidence::High);
        assert_eq!(exact_test.source, "package.json:scripts.test=vitest run");

        let other_test = test_candidates
            .iter()
            .find(|c| c.source.starts_with("package.json:scripts.test:e2e="))
            .unwrap();
        assert_eq!(other_test.confidence, Confidence::Medium);

        let build = build_candidates
            .iter()
            .find(|c| c.source.starts_with("package.json:scripts.build="))
            .unwrap();
        assert_eq!(build.command, "npm run build");
        assert_eq!(build.confidence, Confidence::Medium);
        assert_eq!(build.source, "package.json:scripts.build=vite build");
    }

    #[test]
    fn source_includes_actual_script_command_text_so_a_changed_implementation_is_detectable() {
        // Regression test for the bug `hash_changes_when_a_tracked_file_changes`
        // (scan.rs) caught: two scripts with the same key ("test") but
        // different underlying commands must produce different
        // `CommandCandidate`s, even though `command` itself ("npm run test")
        // is identical either way.
        let mut vitest_facts = base_facts("package.json", ManifestKind::PackageJson);
        vitest_facts.package_scripts = vec![("test".to_string(), "vitest run".to_string())];
        vitest_facts.package_manager_hint = Some("npm".to_string());

        let mut jest_facts = vitest_facts.clone();
        jest_facts.package_scripts = vec![("test".to_string(), "jest".to_string())];

        let vitest_candidates = test_command_candidates(&[vitest_facts]);
        let jest_candidates = test_command_candidates(&[jest_facts]);

        assert_eq!(vitest_candidates[0].command, jest_candidates[0].command);
        assert_ne!(vitest_candidates[0].source, jest_candidates[0].source);
    }

    #[test]
    fn package_manager_hint_changes_emitted_command_string() {
        let mut npm_facts = base_facts("package.json", ManifestKind::PackageJson);
        npm_facts.package_scripts = vec![("test".to_string(), "vitest run".to_string())];
        npm_facts.package_manager_hint = Some("npm".to_string());

        let mut pnpm_facts = npm_facts.clone();
        pnpm_facts.package_manager_hint = Some("pnpm".to_string());

        let npm_candidates = test_command_candidates(&[npm_facts]);
        let pnpm_candidates = test_command_candidates(&[pnpm_facts]);

        assert_eq!(npm_candidates[0].command, "npm run test");
        assert_eq!(pnpm_candidates[0].command, "pnpm run test");
    }

    #[test]
    fn makefile_test_and_build_targets_are_high_confidence() {
        let mut facts = base_facts("Makefile", ManifestKind::Makefile);
        facts.makefile_targets = vec!["test".to_string(), "build".to_string(), "clean".to_string()];

        let test_candidates = test_command_candidates(&[facts.clone()]);
        let build_candidates = build_command_candidates(&[facts]);

        assert!(test_candidates.iter().any(|c| c.command == "make test" && c.confidence == Confidence::High));
        assert!(build_candidates.iter().any(|c| c.command == "make build" && c.confidence == Confidence::High));
    }

    #[test]
    fn pyproject_pytest_ini_section_is_high_dependency_only_is_medium() {
        let mut ini_facts = base_facts("pyproject.toml", ManifestKind::PyprojectToml);
        ini_facts.pyproject_has_pytest_ini_options = true;

        let mut dep_facts = base_facts("pyproject.toml", ManifestKind::PyprojectToml);
        dep_facts.dependencies = vec!["pytest".to_string()];

        let ini_candidates = test_command_candidates(&[ini_facts]);
        let dep_candidates = test_command_candidates(&[dep_facts]);

        assert_eq!(ini_candidates[0].confidence, Confidence::High);
        assert_eq!(dep_candidates[0].confidence, Confidence::Medium);
    }

    #[test]
    fn candidate_lists_are_byte_identical_json_regardless_of_manifest_discovery_order() {
        let cargo = base_facts("Cargo.toml", ManifestKind::CargoToml);
        let mut go = base_facts("go.mod", ManifestKind::GoMod);
        go.repo_relative = "go.mod".to_string();

        let order_a = vec![cargo.clone(), go.clone()];
        let order_b = vec![go, cargo];

        let json_a = serde_json::to_string(&test_command_candidates(&order_a)).unwrap();
        let json_b = serde_json::to_string(&test_command_candidates(&order_b)).unwrap();
        assert_eq!(json_a, json_b);

        let build_json_a = serde_json::to_string(&build_command_candidates(&order_a)).unwrap();
        let build_json_b = serde_json::to_string(&build_command_candidates(&order_b)).unwrap();
        assert_eq!(build_json_a, build_json_b);
    }
}
