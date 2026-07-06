//! Language, framework, and dependency summaries derived from the walked
//! file list (already ignore-pruned by `walk.rs`) plus parsed manifest
//! evidence (`manifests.rs`).
//!
//! CRITICAL DETERMINISM CONTRACT: every `Vec` returned by the three
//! `build_*` functions here is sorted by a stable key before returning.
//! This is required for a byte-stable snapshot hash later
//! (`snapshot::compute_snapshot_hash`) — `snapshot::canonical_string`'s
//! canonicalizer only sorts JSON *object* keys, not array contents, so
//! array-order determinism is this file's (and `commands.rs`'s)
//! responsibility, not the hasher's.

#![forbid(unsafe_code)]

use crate::repo_truth::manifests::ManifestFacts;
use crate::repo_truth::walk::WalkedFile;
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub struct LanguageCount {
    pub language: String,
    pub file_count: usize,
}

/// Deliberately also `Deserialize`: the `vibeforge_repo_truth drift`
/// subcommand reloads a prior scan's already-stored `language_summary`
/// JSONB column (rather than re-running manifest parsing) and needs to
/// round-trip it back into this type to feed
/// `drift::detect_unverifiable_claims`.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LanguageSummary {
    pub languages: Vec<LanguageCount>,
    pub primary_language: Option<String>,
}

/// Extension -> language table. Deliberately fixed/small; extend here if a
/// new leaf extension needs recognizing rather than pulling in a
/// general-purpose language-detection crate for a handful of entries.
fn language_for_extension(repo_relative: &str) -> Option<&'static str> {
    let leaf = repo_relative.rsplit('/').next().unwrap_or(repo_relative);
    let (_, ext) = leaf.rsplit_once('.')?;
    let ext = ext.to_ascii_lowercase();
    match ext.as_str() {
        "rs" => Some("rust"),
        "ts" | "tsx" | "js" | "jsx" | "mjs" | "cjs" | "svelte" => Some("javascript"),
        "py" => Some("python"),
        "go" => Some("go"),
        "rb" => Some("ruby"),
        "java" => Some("java"),
        "kt" => Some("kotlin"),
        "php" => Some("php"),
        _ => None,
    }
}

/// Tally file_count per language from extensions, combined with manifest
/// evidence (a manifest's language always appears in the summary even with
/// zero matching source files yet, e.g. a freshly-scaffolded repo).
/// `primary_language` is the highest `file_count`, ties broken first by
/// manifest presence, then alphabetically — both tie-breaks are evaluated
/// over the already-alphabetically-sorted `languages` list so the
/// alphabetically-first candidate naturally wins a full tie.
pub fn build_language_summary(files: &[WalkedFile], manifests: &[ManifestFacts]) -> LanguageSummary {
    let mut counts: BTreeMap<String, usize> = BTreeMap::new();

    for file in files {
        if let Some(lang) = language_for_extension(&file.repo_relative) {
            *counts.entry(lang.to_string()).or_insert(0) += 1;
        }
    }

    let manifest_languages: BTreeSet<String> = manifests.iter().filter_map(|m| m.language.clone()).collect();
    for lang in &manifest_languages {
        counts.entry(lang.clone()).or_insert(0);
    }

    let mut languages: Vec<LanguageCount> = counts
        .into_iter()
        .map(|(language, file_count)| LanguageCount { language, file_count })
        .collect();
    languages.sort_by(|a, b| a.language.cmp(&b.language));

    let mut primary: Option<&LanguageCount> = None;
    for lc in &languages {
        primary = Some(match primary {
            None => lc,
            Some(current) => {
                if lc.file_count > current.file_count {
                    lc
                } else if lc.file_count < current.file_count {
                    current
                } else {
                    let lc_has_manifest = manifest_languages.contains(&lc.language);
                    let current_has_manifest = manifest_languages.contains(&current.language);
                    if lc_has_manifest && !current_has_manifest {
                        lc
                    } else if current_has_manifest && !lc_has_manifest {
                        current
                    } else if lc.language < current.language {
                        lc
                    } else {
                        current
                    }
                }
            }
        });
    }

    // Resolved to an owned value before constructing the struct below: `primary`
    // borrows from `languages`, and that borrow must end before `languages` is
    // moved into the `languages` field of the same struct literal.
    let primary_language: Option<String> = primary.map(|l| l.language.clone());

    LanguageSummary {
        languages,
        primary_language,
    }
}

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
pub struct DetectedFramework {
    pub framework: String,
    pub language: String,
    pub matched_dependency: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct FrameworkSummary {
    pub frameworks: Vec<DetectedFramework>,
}

/// `(dependency_name_marker, framework_name, language)`. Matching is by
/// substring containment against a manifest's dependency name (covers
/// both exact-match ecosystems like composer's `"vendor/package"` keys and
/// prefixed ones like Go's `"github.com/gin-gonic/gin"` module paths with
/// one rule).
const FRAMEWORK_MARKERS: &[(&str, &str, &str)] = &[
    ("tauri", "tauri", "rust"),
    ("actix-web", "actix-web", "rust"),
    ("axum", "axum", "rust"),
    ("rocket", "rocket", "rust"),
    ("react", "react", "javascript"),
    ("next", "next", "javascript"),
    ("@sveltejs/kit", "sveltekit", "javascript"),
    ("svelte", "svelte", "javascript"),
    ("vue", "vue", "javascript"),
    ("nuxt", "nuxt", "javascript"),
    ("@angular/core", "angular", "javascript"),
    ("express", "express", "javascript"),
    ("fastify", "fastify", "javascript"),
    ("@nestjs/core", "nestjs", "javascript"),
    ("django", "django", "python"),
    ("flask", "flask", "python"),
    ("fastapi", "fastapi", "python"),
    ("gin-gonic/gin", "gin", "go"),
    ("rails", "rails", "ruby"),
    ("sinatra", "sinatra", "ruby"),
    ("spring-boot-starter", "spring-boot", "java"),
    ("laravel/framework", "laravel", "php"),
    ("symfony/framework-bundle", "symfony", "php"),
];

pub fn build_framework_summary(manifests: &[ManifestFacts]) -> FrameworkSummary {
    let mut frameworks: Vec<DetectedFramework> = Vec::new();

    for &(marker, framework, language) in FRAMEWORK_MARKERS {
        let matched = manifests.iter().find_map(|manifest| {
            manifest
                .dependencies
                .iter()
                .chain(manifest.dev_dependencies.iter())
                .find(|dep| dep.contains(marker))
                .cloned()
        });
        if let Some(matched_dependency) = matched {
            frameworks.push(DetectedFramework {
                framework: framework.to_string(),
                language: language.to_string(),
                matched_dependency,
            });
        }
    }

    frameworks.sort_by(|a, b| a.framework.cmp(&b.framework));
    FrameworkSummary { frameworks }
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct ManifestDependencyCounts {
    pub repo_relative: String,
    pub dependency_count: usize,
    pub dev_dependency_count: usize,
    pub top_dependencies: Vec<String>,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct DependencySummary {
    pub manifests: Vec<ManifestDependencyCounts>,
}

pub fn build_dependency_summary(manifests: &[ManifestFacts]) -> DependencySummary {
    let mut entries: Vec<ManifestDependencyCounts> = manifests
        .iter()
        .map(|m| {
            let mut top: Vec<String> = m.dependencies.clone();
            top.sort();
            top.truncate(50);
            ManifestDependencyCounts {
                repo_relative: m.repo_relative.clone(),
                dependency_count: m.dependencies.len(),
                dev_dependency_count: m.dev_dependencies.len(),
                top_dependencies: top,
            }
        })
        .collect();
    entries.sort_by(|a, b| a.repo_relative.cmp(&b.repo_relative));
    DependencySummary { manifests: entries }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::repo_truth::manifests::ManifestKind;
    use std::path::PathBuf;

    fn walked(repo_relative: &str) -> WalkedFile {
        WalkedFile {
            repo_relative: repo_relative.to_string(),
            absolute: PathBuf::from(repo_relative),
            size_bytes: 10,
            is_symlink: false,
        }
    }

    fn manifest(repo_relative: &str, kind: ManifestKind, language: Option<&str>, deps: &[&str]) -> ManifestFacts {
        ManifestFacts {
            repo_relative: repo_relative.to_string(),
            kind,
            language: language.map(|s| s.to_string()),
            dependencies: deps.iter().map(|s| s.to_string()).collect(),
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
    fn primary_language_picks_highest_file_count() {
        let files = vec![
            walked("src/a.rs"),
            walked("src/b.rs"),
            walked("src/c.rs"),
            walked("web/app.ts"),
        ];
        let summary = build_language_summary(&files, &[]);
        assert_eq!(summary.primary_language, Some("rust".to_string()));
    }

    #[test]
    fn language_summary_is_order_independent() {
        let files_a = vec![walked("a.rs"), walked("b.py"), walked("c.py")];
        let mut files_b = files_a.clone();
        files_b.reverse();

        let summary_a = build_language_summary(&files_a, &[]);
        let summary_b = build_language_summary(&files_b, &[]);

        assert_eq!(summary_a.languages, summary_b.languages);
        assert_eq!(summary_a.primary_language, summary_b.primary_language);
    }

    #[test]
    fn framework_detected_purely_from_known_dependency_name() {
        let manifests = vec![manifest("package.json", ManifestKind::PackageJson, Some("javascript"), &["svelte", "left-pad"])];
        let summary = build_framework_summary(&manifests);
        assert!(summary.frameworks.iter().any(|f| f.framework == "svelte"));
        assert!(!summary.frameworks.iter().any(|f| f.framework == "react"));
    }

    #[test]
    fn dependency_summary_sorted_by_manifest_path() {
        let manifests = vec![
            manifest("z_service/Cargo.toml", ManifestKind::CargoToml, Some("rust"), &["serde"]),
            manifest("a_service/Cargo.toml", ManifestKind::CargoToml, Some("rust"), &["tokio"]),
        ];
        let summary = build_dependency_summary(&manifests);
        assert_eq!(summary.manifests[0].repo_relative, "a_service/Cargo.toml");
        assert_eq!(summary.manifests[1].repo_relative, "z_service/Cargo.toml");
    }
}
