//! Manifest discovery + hand-rolled parsing for build/dependency
//! manifests recognized across the JS/Rust/Python/Go/Ruby/Java/PHP/Make
//! ecosystems.
//!
//! No TOML-parsing crate is pulled in for `Cargo.toml`/`pyproject.toml` —
//! this repo's own `authority::forbidden_patterns` already made the same
//! call for a similarly fixed-shape-set problem (no `glob` crate), and the
//! same reasoning applies here: the set of sections/fields this module
//! actually needs is small and fixed, so hand-rolled line/section scanning
//! (track the current `[section]` via a regex on the whole trimmed line,
//! then match `name = ...` lines while inside a recognized section) is
//! more auditable at this boundary than pulling in a general-purpose TOML
//! parser for a handful of fixed-shape lines.
//!
//! `package.json`/`composer.json` ARE real JSON and are parsed with
//! `serde_json` (already a first-class dependency) rather than hand-rolled
//! scanning — there's no equivalent reason to avoid it there.
//!
//! `pom.xml`/`build.gradle(.kts)` parsing is explicitly a heuristic:
//! presence-detection of dependency-shaped tags/calls via regex, not a
//! real XML/Groovy/Kotlin parser. Good enough to answer "does this repo
//! declare a dependency with this name", not a source of truth for a full
//! dependency graph.

#![forbid(unsafe_code)]

use crate::repo_truth::safe_read;
use crate::repo_truth::walk::WalkedFile;
use regex::Regex;
use std::path::Path;
use std::sync::OnceLock;

pub const DEFAULT_MAX_MANIFESTS: usize = 500;

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ManifestKind {
    CargoToml,
    PackageJson,
    PyprojectToml,
    RequirementsTxt,
    GoMod,
    Gemfile,
    PomXml,
    BuildGradle,
    ComposerJson,
    Makefile,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct ManifestFacts {
    pub repo_relative: String,
    pub kind: ManifestKind,
    /// Best-guess ecosystem language for this manifest, e.g. `"rust"`,
    /// `"javascript"`, `"python"`. `None` for `Makefile`, which isn't tied
    /// to one language.
    pub language: Option<String>,
    pub dependencies: Vec<String>,
    pub dev_dependencies: Vec<String>,
    /// `(script_name, script_command)` pairs. Populated for `package.json`
    /// and `composer.json` (both have a JSON `"scripts"` object); empty
    /// otherwise.
    pub package_scripts: Vec<(String, String)>,
    /// JS package manager inferred from repo-root lockfile presence.
    /// Populated only for `package.json`.
    pub package_manager_hint: Option<String>,
    /// Non-`.PHONY` target names. Populated only for `Makefile`.
    pub makefile_targets: Vec<String>,
    /// Whether `pyproject.toml` declares a `[tool.pytest.ini_options]`
    /// section. `commands.rs` needs this structural fact (not full
    /// content) to decide `pytest` command confidence; always `false` for
    /// every manifest kind other than `PyprojectToml`.
    pub pyproject_has_pytest_ini_options: bool,
    /// Whether `pyproject.toml` declares a `[build-system]` table. Same
    /// reasoning as `pyproject_has_pytest_ini_options` above.
    pub pyproject_has_build_system: bool,
    /// Set (with the rest of the struct left empty/partial) instead of
    /// panicking when a manifest is unreadable or doesn't parse as
    /// expected for its kind.
    pub parse_error: Option<String>,
}

impl ManifestFacts {
    fn empty(repo_relative: String, kind: ManifestKind, language: Option<String>) -> Self {
        ManifestFacts {
            repo_relative,
            kind,
            language,
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
}

fn recognize_manifest_kind(repo_relative: &str) -> Option<ManifestKind> {
    let leaf = repo_relative.rsplit('/').next().unwrap_or(repo_relative);
    if leaf.eq_ignore_ascii_case("Cargo.toml") {
        Some(ManifestKind::CargoToml)
    } else if leaf.eq_ignore_ascii_case("package.json") {
        Some(ManifestKind::PackageJson)
    } else if leaf.eq_ignore_ascii_case("pyproject.toml") {
        Some(ManifestKind::PyprojectToml)
    } else if leaf.eq_ignore_ascii_case("requirements.txt") {
        Some(ManifestKind::RequirementsTxt)
    } else if leaf.eq_ignore_ascii_case("go.mod") {
        Some(ManifestKind::GoMod)
    } else if leaf.eq_ignore_ascii_case("Gemfile") {
        Some(ManifestKind::Gemfile)
    } else if leaf.eq_ignore_ascii_case("pom.xml") {
        Some(ManifestKind::PomXml)
    } else if leaf.eq_ignore_ascii_case("build.gradle") || leaf.eq_ignore_ascii_case("build.gradle.kts") {
        Some(ManifestKind::BuildGradle)
    } else if leaf.eq_ignore_ascii_case("composer.json") {
        Some(ManifestKind::ComposerJson)
    } else if leaf.eq_ignore_ascii_case("Makefile")
        || leaf.eq_ignore_ascii_case("makefile")
        || leaf.eq_ignore_ascii_case("GNUmakefile")
    {
        Some(ManifestKind::Makefile)
    } else {
        None
    }
}

fn language_for_kind(kind: ManifestKind) -> Option<String> {
    match kind {
        ManifestKind::CargoToml => Some("rust".to_string()),
        ManifestKind::PackageJson => Some("javascript".to_string()),
        ManifestKind::PyprojectToml | ManifestKind::RequirementsTxt => Some("python".to_string()),
        ManifestKind::GoMod => Some("go".to_string()),
        ManifestKind::Gemfile => Some("ruby".to_string()),
        ManifestKind::PomXml | ManifestKind::BuildGradle => Some("java".to_string()),
        ManifestKind::ComposerJson => Some("php".to_string()),
        ManifestKind::Makefile => None,
    }
}

/// Detect the JS package manager from repo-ROOT lockfile presence only
/// (`pnpm-lock.yaml` / `yarn.lock` / `bun.lockb` / `package-lock.json`).
/// Simplification: a monorepo with only a nested lockfile (not at the repo
/// root) won't be detected here — acceptable given the fixed shape of
/// what's actually asked of this MVP.
pub fn detect_js_package_manager(files: &[WalkedFile]) -> Option<String> {
    let has_root_file = |name: &str| files.iter().any(|f| f.repo_relative == name);
    if has_root_file("pnpm-lock.yaml") {
        Some("pnpm".to_string())
    } else if has_root_file("yarn.lock") {
        Some("yarn".to_string())
    } else if has_root_file("bun.lockb") {
        Some("bun".to_string())
    } else if has_root_file("package-lock.json") {
        Some("npm".to_string())
    } else {
        None
    }
}

/// Find recognized manifest files among an already-walked (already
/// ignore-pruned) file list and parse each one, capped at
/// `DEFAULT_MAX_MANIFESTS` — a safety ceiling independent of `walk`'s own
/// `max_files` cap.
pub fn find_and_parse_manifests(repo_root: &Path, files: &[WalkedFile]) -> Vec<ManifestFacts> {
    let package_manager_hint = detect_js_package_manager(files);

    let mut out = Vec::new();
    for file in files {
        if out.len() >= DEFAULT_MAX_MANIFESTS {
            break;
        }
        let Some(kind) = recognize_manifest_kind(&file.repo_relative) else {
            continue;
        };
        let language = language_for_kind(kind);
        let mut facts = ManifestFacts::empty(file.repo_relative.clone(), kind, language);

        match safe_read::read_capped_text(repo_root, &file.repo_relative, safe_read::DEFAULT_MAX_PARSE_WINDOW) {
            Ok(capped) => populate_manifest_facts(&mut facts, kind, &capped.text),
            Err(err) => facts.parse_error = Some(format!("could not read manifest: {err}")),
        }

        if kind == ManifestKind::PackageJson {
            facts.package_manager_hint = package_manager_hint.clone();
        }

        out.push(facts);
    }
    out
}

fn populate_manifest_facts(facts: &mut ManifestFacts, kind: ManifestKind, text: &str) {
    match kind {
        ManifestKind::CargoToml => {
            facts.dependencies = extract_toml_section_dependency_names(text, "dependencies");
            facts.dev_dependencies = extract_toml_section_dependency_names(text, "dev-dependencies");
        }
        ManifestKind::PyprojectToml => {
            facts.dependencies = extract_toml_section_dependency_names(text, "tool.poetry.dependencies");
            facts.dev_dependencies =
                extract_toml_section_dependency_names(text, "tool.poetry.dev-dependencies");
            facts.pyproject_has_pytest_ini_options = has_toml_section(text, "tool.pytest.ini_options");
            facts.pyproject_has_build_system = has_toml_section(text, "build-system");
        }
        ManifestKind::RequirementsTxt => {
            facts.dependencies = parse_requirements_txt(text);
        }
        ManifestKind::GoMod => {
            facts.dependencies = parse_go_mod_requires(text);
        }
        ManifestKind::Gemfile => {
            facts.dependencies = parse_gemfile(text);
        }
        ManifestKind::Makefile => {
            facts.makefile_targets = parse_makefile_targets(text);
        }
        ManifestKind::PackageJson => match serde_json::from_str::<serde_json::Value>(text) {
            Ok(value) => {
                facts.dependencies = json_object_keys(&value, "dependencies");
                facts.dev_dependencies = json_object_keys(&value, "devDependencies");
                facts.package_scripts = json_object_string_pairs(&value, "scripts");
            }
            Err(err) => facts.parse_error = Some(format!("invalid JSON: {err}")),
        },
        ManifestKind::ComposerJson => match serde_json::from_str::<serde_json::Value>(text) {
            Ok(value) => {
                facts.dependencies = json_object_keys(&value, "require");
                facts.dev_dependencies = json_object_keys(&value, "require-dev");
                facts.package_scripts = json_object_string_pairs(&value, "scripts");
            }
            Err(err) => facts.parse_error = Some(format!("invalid JSON: {err}")),
        },
        ManifestKind::PomXml => {
            facts.dependencies = extract_regex_captures(artifact_id_regex(), text);
        }
        ManifestKind::BuildGradle => {
            facts.dependencies = extract_regex_captures(gradle_dependency_regex(), text);
        }
    }
}

/// Hand-rolled TOML section scan: tracks the current `[section]` (matched
/// against the whole trimmed line) and, while inside `section_name`
/// (case-insensitive, exact match — e.g. `"dependencies"` vs
/// `"dev-dependencies"` vs `"tool.poetry.dependencies"` never leak into
/// each other since each requires its own exact section header), collects
/// the left-hand identifier of any `name = value` line.
fn extract_toml_section_dependency_names(text: &str, section_name: &str) -> Vec<String> {
    static SECTION_RE: OnceLock<Regex> = OnceLock::new();
    static DEP_RE: OnceLock<Regex> = OnceLock::new();
    let section_re = SECTION_RE.get_or_init(|| Regex::new(r"^\[(.+)\]$").unwrap());
    let dep_re = DEP_RE.get_or_init(|| Regex::new(r"^([A-Za-z0-9_.\-]+)\s*=").unwrap());

    let mut current_section: Option<String> = None;
    let mut names = Vec::new();
    for line in text.lines() {
        let trimmed = line.trim();
        if let Some(caps) = section_re.captures(trimmed) {
            current_section = Some(caps[1].trim().to_string());
            continue;
        }
        if current_section
            .as_deref()
            .is_some_and(|s| s.eq_ignore_ascii_case(section_name))
        {
            if let Some(caps) = dep_re.captures(trimmed) {
                names.push(caps[1].to_string());
            }
        }
    }
    names
}

/// Whether `text` declares a `[section_name]` header anywhere (exact,
/// case-insensitive match on the whole section name — e.g.
/// `"tool.pytest.ini_options"` or `"build-system"`). Reuses the same
/// section-header regex as `extract_toml_section_dependency_names`, just
/// checking presence rather than collecting names under it.
fn has_toml_section(text: &str, section_name: &str) -> bool {
    static SECTION_RE: OnceLock<Regex> = OnceLock::new();
    let section_re = SECTION_RE.get_or_init(|| Regex::new(r"^\[(.+)\]$").unwrap());
    text.lines().any(|line| {
        section_re
            .captures(line.trim())
            .is_some_and(|caps| caps[1].trim().eq_ignore_ascii_case(section_name))
    })
}

fn parse_requirements_txt(text: &str) -> Vec<String> {
    let mut deps = Vec::new();
    for line in text.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        let without_comment = trimmed.split('#').next().unwrap_or(trimmed).trim();
        if without_comment.is_empty() {
            continue;
        }
        // Strip version specifiers (==, >=, <=, ~=, !=, <, >), extras
        // (`[extra]`), and environment markers (`; python_version...`) to
        // get just the package name.
        let name = without_comment
            .split(['=', '>', '<', '~', '!', ';', '['])
            .next()
            .unwrap_or(without_comment)
            .trim();
        if !name.is_empty() {
            deps.push(name.to_string());
        }
    }
    deps
}

fn parse_go_mod_requires(text: &str) -> Vec<String> {
    let mut deps = Vec::new();
    let mut in_require_block = false;
    for line in text.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("require (") || trimmed == "require(" {
            in_require_block = true;
            continue;
        }
        if in_require_block {
            if trimmed == ")" {
                in_require_block = false;
                continue;
            }
            if let Some(module) = trimmed.split_whitespace().next() {
                if !module.is_empty() {
                    deps.push(module.to_string());
                }
            }
            continue;
        }
        if let Some(rest) = trimmed.strip_prefix("require ") {
            if let Some(module) = rest.split_whitespace().next() {
                deps.push(module.to_string());
            }
        }
    }
    deps
}

fn parse_gemfile(text: &str) -> Vec<String> {
    static GEM_RE: OnceLock<Regex> = OnceLock::new();
    let gem_re = GEM_RE.get_or_init(|| Regex::new(r#"^\s*gem\s+['"]([A-Za-z0-9_.\-]+)['"]"#).unwrap());
    text.lines().filter_map(|line| gem_re.captures(line).map(|c| c[1].to_string())).collect()
}

/// Extract Makefile target names from lines matching `^([A-Za-z0-9_.-]+):`
/// that are NOT tab-indented (a tab-indented line is a recipe command, not
/// a target declaration, even if it happens to contain a colon) and are
/// not `.PHONY` itself (a declaration listing OTHER targets as phony, not
/// a target of its own).
fn parse_makefile_targets(text: &str) -> Vec<String> {
    static TARGET_RE: OnceLock<Regex> = OnceLock::new();
    let target_re = TARGET_RE.get_or_init(|| Regex::new(r"^([A-Za-z0-9_.\-]+):").unwrap());

    let mut targets = Vec::new();
    for line in text.lines() {
        if line.starts_with('\t') {
            continue;
        }
        if let Some(caps) = target_re.captures(line) {
            let name = caps[1].to_string();
            if name.eq_ignore_ascii_case(".phony") {
                continue;
            }
            targets.push(name);
        }
    }
    targets
}

fn json_object_keys(value: &serde_json::Value, key: &str) -> Vec<String> {
    value
        .get(key)
        .and_then(|v| v.as_object())
        .map(|obj| obj.keys().cloned().collect())
        .unwrap_or_default()
}

fn json_object_string_pairs(value: &serde_json::Value, key: &str) -> Vec<(String, String)> {
    value
        .get(key)
        .and_then(|v| v.as_object())
        .map(|obj| {
            obj.iter()
                .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
                .collect()
        })
        .unwrap_or_default()
}

fn artifact_id_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"<artifactId>\s*([^<\s]+)\s*</artifactId>").unwrap())
}

fn gradle_dependency_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(
            r#"(?:implementation|api|compile|testImplementation|runtimeOnly|testRuntimeOnly)\s*[\(]?\s*["']([^"']+)["']"#,
        )
        .unwrap()
    })
}

fn extract_regex_captures(re: &Regex, text: &str) -> Vec<String> {
    re.captures_iter(text).map(|c| c[1].trim().to_string()).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::repo_truth::walk;
    use std::fs;
    use tempfile::TempDir;

    fn write_file(root: &Path, rel: &str, contents: &str) {
        let path = root.join(rel);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).unwrap();
        }
        fs::write(path, contents).unwrap();
    }

    fn manifests_in(root: &Path) -> Vec<ManifestFacts> {
        let walked = walk::walk_repo(root, walk::DEFAULT_MAX_DEPTH, walk::DEFAULT_MAX_FILES);
        find_and_parse_manifests(root, &walked.files)
    }

    #[test]
    fn package_json_scripts_and_dependencies_are_extracted() {
        let root = TempDir::new().unwrap();
        write_file(
            root.path(),
            "package.json",
            r#"{
                "name": "app",
                "scripts": { "test": "vitest run", "build": "vite build" },
                "dependencies": { "svelte": "^5.0.0" },
                "devDependencies": { "vite": "^5.0.0" }
            }"#,
        );

        let facts = manifests_in(root.path());
        let pkg = facts.iter().find(|f| f.kind == ManifestKind::PackageJson).unwrap();

        assert_eq!(pkg.dependencies, vec!["svelte".to_string()]);
        assert_eq!(pkg.dev_dependencies, vec!["vite".to_string()]);
        assert!(pkg.package_scripts.contains(&("test".to_string(), "vitest run".to_string())));
        assert!(pkg.package_scripts.contains(&("build".to_string(), "vite build".to_string())));
    }

    #[test]
    fn cargo_toml_dependencies_and_dev_dependencies_never_leak_into_each_other() {
        let root = TempDir::new().unwrap();
        write_file(
            root.path(),
            "Cargo.toml",
            r#"
[package]
name = "foo"

[dependencies]
serde = "1.0"
tokio = { version = "1", features = ["full"] }

[dev-dependencies]
tempfile = "3"
"#,
        );

        let facts = manifests_in(root.path());
        let cargo = facts.iter().find(|f| f.kind == ManifestKind::CargoToml).unwrap();

        assert!(cargo.dependencies.contains(&"serde".to_string()));
        assert!(cargo.dependencies.contains(&"tokio".to_string()));
        assert!(!cargo.dependencies.contains(&"tempfile".to_string()));

        assert!(cargo.dev_dependencies.contains(&"tempfile".to_string()));
        assert!(!cargo.dev_dependencies.contains(&"serde".to_string()));
        assert!(!cargo.dev_dependencies.contains(&"tokio".to_string()));
    }

    #[test]
    fn requirements_txt_ignores_comments_and_strips_specifiers() {
        let root = TempDir::new().unwrap();
        write_file(
            root.path(),
            "requirements.txt",
            "# top comment\n\nrequests==2.31.0\nflask>=2.0\npytest~=7.4  # test runner\n",
        );

        let facts = manifests_in(root.path());
        let reqs = facts.iter().find(|f| f.kind == ManifestKind::RequirementsTxt).unwrap();

        assert_eq!(reqs.dependencies, vec!["requests", "flask", "pytest"]);
    }

    #[test]
    fn makefile_extracts_targets_excluding_phony_and_recipe_lines() {
        let root = TempDir::new().unwrap();
        write_file(
            root.path(),
            "Makefile",
            ".PHONY: test build clean\ntest:\n\techo running: tests\nbuild:\n\tcargo build\nclean:\n\trm -rf target\n",
        );

        let facts = manifests_in(root.path());
        let makefile = facts.iter().find(|f| f.kind == ManifestKind::Makefile).unwrap();

        assert!(makefile.makefile_targets.contains(&"test".to_string()));
        assert!(makefile.makefile_targets.contains(&"build".to_string()));
        assert!(makefile.makefile_targets.contains(&"clean".to_string()));
        assert!(!makefile
            .makefile_targets
            .iter()
            .any(|t| t.eq_ignore_ascii_case(".phony")));
    }

    #[test]
    fn pyproject_toml_detects_pytest_ini_and_build_system_sections() {
        let root = TempDir::new().unwrap();
        write_file(
            root.path(),
            "pyproject.toml",
            "[build-system]\nrequires = [\"setuptools\"]\n\n[tool.pytest.ini_options]\ntestpaths = [\"tests\"]\n",
        );

        let facts = manifests_in(root.path());
        let pyproject = facts.iter().find(|f| f.kind == ManifestKind::PyprojectToml).unwrap();

        assert!(pyproject.pyproject_has_build_system);
        assert!(pyproject.pyproject_has_pytest_ini_options);
    }

    #[test]
    fn find_and_parse_manifests_respects_max_manifests_cap() {
        let root = TempDir::new().unwrap();
        for i in 0..(DEFAULT_MAX_MANIFESTS + 50) {
            write_file(root.path(), &format!("pkg_{i}/Cargo.toml"), "[package]\nname = \"x\"\n");
        }

        let facts = manifests_in(root.path());
        assert_eq!(facts.len(), DEFAULT_MAX_MANIFESTS);
    }
}
