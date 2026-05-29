# VibeForge Build Preflight

**Build Preflight** is VibeForge’s optional-but-powerful build guard system. It validates your project *before* packaging, catches misconfigurations early, and produces a deterministic audit record explaining exactly what passed, warned, or failed.

You can use Preflight locally while developing, in CI for pull requests, or as a hard gate before releasing installers.

> **Short version:** Preflight prevents broken builds, explains failures clearly, and makes releases boring (in a good way).

---

## Why Preflight exists

Packaging desktop apps fails for boring reasons:
- missing icons
- invalid identifiers
- mismatched dependencies
- incomplete manifests

Most tools surface these problems **late**, inside noisy build logs. Preflight moves those checks **up front**, runs them in a deterministic order, and tells you exactly what’s wrong *before* the build starts.

VibeForge uses the same Preflight engine internally that we use for our own releases.

---

## What Preflight does

Preflight validates your project against a **policy** that describes what a valid build looks like.

It checks:
- project structure
- configuration files
- naming and identifiers
- required assets (icons, manifests)
- packaging-specific requirements

Every run produces a structured report (`evidence.json`) that tools and humans can both understand.

---

## Supported packaging targets

Preflight supports multiple packaging targets. Each target has its own checks and policy block.

| Target | Description |
|------|-------------|
| `debian` | `.deb` packages for Debian/Ubuntu-based systems |
| `rpm` | RPM-based distributions |
| `appimage` | Portable Linux AppImages |
| `flatpak` | Flatpak manifests |

Targets can be validated independently.

---

## Getting started

Preflight runs through simple commands. You don’t need to learn everything at once.

### Basic usage

```bash
# Show help
node scripts/deb-preflight.mjs --help

# Run default checks (Debian)
pnpm preflight:deb
```

---

## Recommended developer flows

### Quick validation (no build)

Check policy and configuration only:

```bash
pnpm preflight:deb -- --dry-run
```

Useful while editing config files.

---

### Continuous validation (watch mode)

Re-run preflight automatically when files change:

```bash
pnpm preflight:deb -- --watch
```

Great for active development.

---

### Full validation with evidence

Generate a machine-readable report:

```bash
pnpm preflight:deb -- --json
```

This produces `evidence.json`, which explains every check and outcome.

---

### Target-specific checks

Validate a different packaging format:

```bash
pnpm preflight:deb -- --target appimage
pnpm preflight:deb -- --target rpm
pnpm preflight:deb -- --target flatpak
```

---

### Applying safe fixes

Some issues can be fixed automatically:

```bash
pnpm preflight:deb -- --fix
```

When fixes are applied, Preflight:
- makes only **bounded, safe changes**
- records them in the evidence report
- exits with a distinct status code

---

## CI and release gating

Preflight is most powerful when used as a gate.

In VibeForge projects:

```bash
pnpm build:deb
```

This command:
1. Runs Preflight in CI mode
2. Blocks the build on errors
3. Proceeds to packaging only if checks pass

Calling the packaging command directly is discouraged, because it bypasses validation.

---

## Exit codes (what they mean)

| Code | Meaning |
|------|--------|
| 0 | All checks passed |
| 1 | One or more checks failed |
| 2 | Invalid configuration |
| 3 | Invalid or missing policy |
| 4 | Fixes were applied |
| 5 | Watch mode terminated |

These codes are stable and suitable for CI pipelines.

---

## Evidence report (`evidence.json`)

Every Preflight run can emit a structured report:

```json
{
  "target": "debian",
  "checks": [...],
  "summary": {
    "ok": true,
    "warnings_count": 0,
    "errors_count": 0
  }
}
```

The report is:
- deterministic
- human-readable
- machine-friendly

CI workflows automatically upload it as an artifact.

---

## Optional vs required rules

Preflight distinguishes between **warnings** and **errors**:

- Missing optional assets → warnings locally
- The same issues → errors in CI

You control strictness through policy, not code.

This lets teams start relaxed and become stricter over time.

---

## When should I use Preflight?

Use it when:
- preparing a release
- running CI builds
- onboarding new contributors
- debugging packaging failures

Skip it when:
- doing quick UI-only experiments

You can turn it on gradually.

---

## Summary

Preflight helps you:
- fail early
- understand failures
- ship reliable builds

It’s there when you need it, invisible when you don’t.

---

*Preflight is part of the VibeForge toolchain and is actively used for our own releases.*

