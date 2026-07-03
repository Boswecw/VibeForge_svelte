//! The Authority Gate (Epic 2): path canonicalization/symlink resolution,
//! the doctrine forbidden-pattern denylist, command risk classification,
//! mission risk classification, the permission envelope that composes all
//! of the above, and a DB-level kill switch.
//!
//! Structured as a module (not yet a separate Cargo crate — VibeForge isn't
//! a workspace today) but kept boundary-clean so it could become
//! `crates/authority-gate/` later without churn: nothing here depends on
//! `crate::vault`'s internal types, only `kill_switch` depends on
//! `crate::vault` at all (for persistence), and every other submodule here
//! is a pure function library with no DB access.

pub mod command_policy;
pub mod forbidden_patterns;
pub mod kill_switch;
pub mod path_guard;
pub mod permission_envelope;
pub mod risk;
