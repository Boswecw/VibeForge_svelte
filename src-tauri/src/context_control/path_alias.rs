//! Stable private-path aliasing: doc 06 "Algorithm 2" step 4 — "Replace
//! private absolute paths with stable aliases" — and doc 07's "Use path
//! aliases in cloud previews and analytics."
//!
//! The vault must never store or transmit a raw private absolute path (the
//! same rule `repo_truth::snapshot::hash_repo_root_path` enforces for the
//! repo root). Absolute paths leak the developer's username, directory
//! layout, and often project/client names. This module maps each distinct
//! absolute path to a short, opaque, deterministic alias (`path_001`,
//! `path_002`, …) assigned in first-seen order, so the same path always gets
//! the same alias within one pack and previews/analytics carry only the
//! aliases.
//!
//! Repo-relative paths (`src/lib/x.ts`) are intentionally left untouched —
//! they carry no host-identifying information and are the normal, useful way
//! to refer to evidence a reviewer needs to locate.

#![forbid(unsafe_code)]

use regex::Regex;
use std::collections::BTreeMap;
use std::sync::LazyLock;

// A POSIX absolute path with at least two segments (`/a/b`...), or a `~/...`
// home-relative path, or a Windows drive path (`C:\...` / `C:/...`). Segment
// characters are kept deliberately narrow (word chars, dot, dash) so this
// doesn't greedily swallow surrounding prose or match a lone `/`.
static ABSOLUTE_PATH: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(
        r"(?:~/[\w.\-]+(?:/[\w.\-]+)*|/(?:[\w.\-]+/)+[\w.\-]+|[A-Za-z]:[\\/](?:[\w.\-]+[\\/])*[\w.\-]+)",
    )
    .expect("static absolute-path regex must compile")
});

/// A first-seen-ordered, deterministic real-path → alias map.
#[derive(Debug, Default)]
pub struct AliasMap {
    map: BTreeMap<String, String>,
    order: Vec<String>,
}

impl AliasMap {
    pub fn new() -> Self {
        Self::default()
    }

    /// Return the stable alias for `real_path`, assigning a new one the first
    /// time this path is seen. Same input → same alias for the life of this
    /// map.
    pub fn alias_for(&mut self, real_path: &str) -> String {
        if let Some(existing) = self.map.get(real_path) {
            return existing.clone();
        }
        let alias = format!("path_{:03}", self.order.len() + 1);
        self.map.insert(real_path.to_string(), alias.clone());
        self.order.push(real_path.to_string());
        alias
    }

    /// The (real_path, alias) pairs in assignment order. Real paths are NOT
    /// meant to be persisted — this is for local, in-memory display/debug
    /// only. Only the aliases ever reach the vault.
    pub fn entries(&self) -> Vec<(String, String)> {
        self.order
            .iter()
            .map(|real| (real.clone(), self.map[real].clone()))
            .collect()
    }

    pub fn len(&self) -> usize {
        self.order.len()
    }

    pub fn is_empty(&self) -> bool {
        self.order.is_empty()
    }
}

/// Whether `s`, on its own, looks like a private absolute path (whole-string
/// match). Used to decide whether an `EvidenceItem.source_ref` needs
/// aliasing before it can be stored as a `source_ref`.
pub fn looks_like_private_path(s: &str) -> bool {
    ABSOLUTE_PATH
        .find(s)
        .is_some_and(|m| m.start() == 0 && m.end() == s.len())
}

/// Replace every absolute-path-shaped span in `text` with its stable alias,
/// recording assignments in `aliases`. Repo-relative paths are left as-is.
pub fn alias_paths_in_text(text: &str, aliases: &mut AliasMap) -> String {
    ABSOLUTE_PATH
        .replace_all(text, |caps: &regex::Captures| {
            let matched = &caps[0];
            aliases.alias_for(matched)
        })
        .into_owned()
}

/// Alias a single `source_ref` iff it's a private absolute path; otherwise
/// return it unchanged (the common repo-relative case).
pub fn alias_source_ref(source_ref: &str, aliases: &mut AliasMap) -> String {
    if looks_like_private_path(source_ref) {
        aliases.alias_for(source_ref)
    } else {
        source_ref.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn same_path_gets_same_alias() {
        let mut m = AliasMap::new();
        let a = m.alias_for("/home/charlie/Forge/x");
        let b = m.alias_for("/home/charlie/Forge/x");
        assert_eq!(a, b);
        assert_eq!(a, "path_001");
    }

    #[test]
    fn distinct_paths_get_distinct_sequential_aliases() {
        let mut m = AliasMap::new();
        assert_eq!(m.alias_for("/home/a"), "path_001");
        assert_eq!(m.alias_for("/home/b"), "path_002");
        assert_eq!(m.len(), 2);
    }

    #[test]
    fn detects_private_absolute_paths() {
        assert!(looks_like_private_path("/home/charlie/Forge/apps/Vibeforge/src/main.rs"));
        assert!(looks_like_private_path("~/secrets/config"));
        assert!(looks_like_private_path(r"C:\Users\charlie\project\a.ts"));
    }

    #[test]
    fn repo_relative_paths_are_not_private() {
        assert!(!looks_like_private_path("src/lib/api/client.ts"));
        assert!(!looks_like_private_path("Cargo.toml"));
    }

    #[test]
    fn aliases_absolute_path_inside_text_but_leaves_relative_alone() {
        let mut m = AliasMap::new();
        let text = "see /home/charlie/Forge/apps/Vibeforge/src/main.rs and src/lib/x.ts";
        let out = alias_paths_in_text(text, &mut m);
        assert!(out.contains("path_001"));
        assert!(!out.contains("/home/charlie"));
        // repo-relative reference survives
        assert!(out.contains("src/lib/x.ts"));
    }

    #[test]
    fn alias_source_ref_passes_relative_through_untouched() {
        let mut m = AliasMap::new();
        assert_eq!(alias_source_ref("src/lib/x.ts", &mut m), "src/lib/x.ts");
        assert!(m.is_empty());
        assert_eq!(alias_source_ref("/home/charlie/x.ts", &mut m), "path_001");
    }
}
