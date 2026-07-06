//! The ONE place in `repo_truth` that ever opens a file's bytes.
//!
//! Every other file in this module works from data this module produces
//! (or from the walk's metadata) — nothing else does its own `File::open`.
//! `read_capped_text` layers three things on top of a raw read:
//!
//! 1. `crate::authority::path_guard::resolve_under_repo_root` first, so
//!    this inherits Epic 2's dangling-symlink escape fix and
//!    traversal/absolute-path rejection for free, and
//!    `crate::authority::forbidden_patterns::check()` second, as defense
//!    in depth against the resolved (not the raw requested) path.
//! 2. A full-file streaming SHA-256 (`full_sha256`) computed in fixed-size
//!    chunks — the whole file is never loaded into one buffer, however
//!    large it is.
//! 3. A separately-capped text window (`text`, at most `max_parse_window`
//!    bytes) used for parsing/prose-scanning elsewhere in this module —
//!    deliberately decoupled from the full-file hash above, so a very
//!    large file still gets a correct whole-file hash even though only its
//!    first slice is ever parsed as text.
//!
//! `text` is always built via `String::from_utf8_lossy` on the captured
//! prefix, never `from_utf8` — a non-UTF-8 file must degrade to lossy
//! replacement characters, not a hard error, since this module scans
//! arbitrary repository content it doesn't control.

#![forbid(unsafe_code)]

use crate::authority::forbidden_patterns;
use crate::authority::path_guard::{self, PathGuardError, PathGuardOptions};
use sha2::{Digest, Sha256};
use std::io::Read;
use std::path::Path;

/// ~500 KiB. Generous for even large instruction files / manifests while
/// keeping parsing bounded regardless of how large the underlying file is.
pub const DEFAULT_MAX_PARSE_WINDOW: usize = 500_000;

/// How much of the captured prefix is sniffed for a NUL byte to flag
/// `looked_binary`. Deliberately smaller than `DEFAULT_MAX_PARSE_WINDOW` —
/// binary content reveals itself in the first few KB; scanning the whole
/// capped window would just be wasted work.
const BINARY_SNIFF_WINDOW: usize = 8_000;

const STREAM_CHUNK_SIZE: usize = 64 * 1024;

#[derive(Debug, thiserror::Error)]
pub enum SafeReadError {
    #[error("path rejected by path guard: {0}")]
    PathGuard(#[from] PathGuardError),
    #[error("path matches forbidden pattern {0}")]
    Forbidden(String),
    #[error("io error reading {path}: {source}")]
    Io {
        path: String,
        #[source]
        source: std::io::Error,
    },
}

#[derive(Debug, Clone)]
pub struct CappedRead {
    /// Lossy-decoded text of at most `max_parse_window` bytes.
    pub text: String,
    /// `"sha256:" + lowercase hex`, computed over the file's ENTIRE
    /// contents, independent of the `text` window's size.
    pub full_sha256: String,
    pub full_size_bytes: u64,
    /// True if the file's full size exceeds `max_parse_window` (i.e. `text`
    /// does not contain the whole file).
    pub truncated: bool,
    /// True if a NUL byte was found within the first `BINARY_SNIFF_WINDOW`
    /// bytes of the captured prefix.
    pub looked_binary: bool,
}

/// Read `repo_relative` (resolved under `repo_root`), returning a
/// full-file hash plus a capped text window. See the module doc comment
/// for the read-safety layering this applies before ever opening the file.
pub fn read_capped_text(
    repo_root: &Path,
    repo_relative: &str,
    max_parse_window: usize,
) -> Result<CappedRead, SafeReadError> {
    let authorized = path_guard::resolve_under_repo_root(
        repo_root,
        repo_relative,
        PathGuardOptions {
            must_exist: true,
            scope_allowlist: None,
        },
    )?;

    let forbidden: Vec<String> = forbidden_patterns::DEFAULT_FORBIDDEN_PATTERNS
        .iter()
        .map(|s| (*s).to_string())
        .collect();
    if let Some(pattern) = forbidden_patterns::check(&authorized.repo_relative, &forbidden) {
        return Err(SafeReadError::Forbidden(pattern.to_string()));
    }

    let mut file = std::fs::File::open(&authorized.absolute).map_err(|source| SafeReadError::Io {
        path: authorized.repo_relative.clone(),
        source,
    })?;

    let mut hasher = Sha256::new();
    let mut captured: Vec<u8> = Vec::with_capacity(max_parse_window.min(STREAM_CHUNK_SIZE));
    let mut full_size_bytes: u64 = 0;
    let mut buf = [0u8; STREAM_CHUNK_SIZE];

    loop {
        let n = file.read(&mut buf).map_err(|source| SafeReadError::Io {
            path: authorized.repo_relative.clone(),
            source,
        })?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
        full_size_bytes += n as u64;

        if captured.len() < max_parse_window {
            let remaining = max_parse_window - captured.len();
            let take = remaining.min(n);
            captured.extend_from_slice(&buf[..take]);
        }
    }

    let truncated = full_size_bytes > captured.len() as u64;

    let sniff_len = captured.len().min(BINARY_SNIFF_WINDOW);
    let looked_binary = captured[..sniff_len].contains(&0u8);

    let full_sha256 = format!("sha256:{}", hex_encode(hasher.finalize().as_slice()));
    let text = String::from_utf8_lossy(&captured).into_owned();

    Ok(CappedRead {
        text,
        full_sha256,
        full_size_bytes,
        truncated,
        looked_binary,
    })
}

fn hex_encode(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[cfg(unix)]
    use std::os::unix::fs::symlink;
    use tempfile::TempDir;

    fn independent_sha256_hex(bytes: &[u8]) -> String {
        let mut hasher = Sha256::new();
        hasher.update(bytes);
        format!("sha256:{}", hex_encode(hasher.finalize().as_slice()))
    }

    #[test]
    fn rejects_symlink_escaping_repo_root() {
        #[cfg(unix)]
        {
            let outside = TempDir::new().unwrap();
            let outside_file = outside.path().join("secret.txt");
            std::fs::write(&outside_file, b"secret").unwrap();

            let root = TempDir::new().unwrap();
            let link = root.path().join("link.txt");
            symlink(&outside_file, &link).unwrap();

            let err = read_capped_text(root.path(), "link.txt", DEFAULT_MAX_PARSE_WINDOW).unwrap_err();
            assert!(matches!(err, SafeReadError::PathGuard(_)));
        }
    }

    #[test]
    fn identical_bytes_produce_identical_hashes_and_a_changed_byte_changes_it() {
        let root = TempDir::new().unwrap();
        std::fs::write(root.path().join("a.txt"), b"hello world").unwrap();
        std::fs::write(root.path().join("b.txt"), b"hello world").unwrap();
        std::fs::write(root.path().join("c.txt"), b"hetlo world").unwrap();

        let a = read_capped_text(root.path(), "a.txt", DEFAULT_MAX_PARSE_WINDOW).unwrap();
        let b = read_capped_text(root.path(), "b.txt", DEFAULT_MAX_PARSE_WINDOW).unwrap();
        let c = read_capped_text(root.path(), "c.txt", DEFAULT_MAX_PARSE_WINDOW).unwrap();

        assert_eq!(a.full_sha256, b.full_sha256);
        assert_ne!(a.full_sha256, c.full_sha256);
    }

    #[test]
    fn nul_byte_containing_file_is_flagged_looked_binary() {
        let root = TempDir::new().unwrap();
        let mut contents = b"leading text".to_vec();
        contents.push(0u8);
        contents.extend_from_slice(b"trailing text");
        std::fs::write(root.path().join("bin.dat"), &contents).unwrap();

        let result = read_capped_text(root.path(), "bin.dat", DEFAULT_MAX_PARSE_WINDOW).unwrap();
        assert!(result.looked_binary);
    }

    #[test]
    fn non_binary_text_file_is_not_flagged() {
        let root = TempDir::new().unwrap();
        std::fs::write(root.path().join("plain.txt"), b"just plain text, no nulls here").unwrap();

        let result = read_capped_text(root.path(), "plain.txt", DEFAULT_MAX_PARSE_WINDOW).unwrap();
        assert!(!result.looked_binary);
    }

    #[test]
    fn file_larger_than_parse_window_is_truncated_but_full_hash_covers_everything() {
        let root = TempDir::new().unwrap();
        let max_window = 100usize;
        let mut contents = vec![b'a'; max_window * 3];
        let marker = b"__TRUE_END_OF_FILE_MARKER__";
        contents.extend_from_slice(marker);
        std::fs::write(root.path().join("big.txt"), &contents).unwrap();

        let result = read_capped_text(root.path(), "big.txt", max_window).unwrap();

        assert!(result.truncated);
        assert_eq!(result.full_size_bytes, contents.len() as u64);
        assert!(result.text.len() <= max_window);
        assert!(
            !result.text.contains("__TRUE_END_OF_FILE_MARKER__"),
            "capped text window must not contain content past the window boundary"
        );
        assert_eq!(result.full_sha256, independent_sha256_hex(&contents));
    }

    #[test]
    fn file_smaller_than_parse_window_is_not_truncated() {
        let root = TempDir::new().unwrap();
        std::fs::write(root.path().join("small.txt"), b"tiny").unwrap();

        let result = read_capped_text(root.path(), "small.txt", DEFAULT_MAX_PARSE_WINDOW).unwrap();
        assert!(!result.truncated);
        assert_eq!(result.text, "tiny");
    }
}
