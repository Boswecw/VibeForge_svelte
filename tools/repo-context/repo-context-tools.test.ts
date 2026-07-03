import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkAgentInstructionDrift,
  generateAgentInstructions,
  verifyRepoContext,
} from "./repo-context-tools";

function writeValidManifest(rootDir: string, overrides: Record<string, string> = {}): void {
  const localName = overrides.local_name ?? path.basename(rootDir);
  const manifest = `schema_version: "RepoManifest.v1"

repo:
  full_name: "Fixture-Org/fixture-repo"
  local_name: "${localName}"
  package_name: "fixture-repo"
  default_branch: "master"
  repo_class: "fixture"

identity:
  product_name: "Fixture Product"
  one_line: "A fixture repo used to test repo-context-tools."
  authority_role: "fixture_authority"

owns:
  - fixture ownership item

does_not_own:
  - fixture non-ownership item

canonical_files:
  - repo.manifest.yaml
  - README.md
  - package.json

generated_files:
  - AGENTS.md
  - CLAUDE.md
  - CODEX.md
  - GEMINI.md

agent_edit_policy:
  may_edit:
    - src/**
  must_not_edit_directly:
    - AGENTS.md
  must_regenerate:
    - AGENTS.md

verification:
  test_commands:
    - echo test
  build_commands:
    - echo build
  safety_rules:
    - fixture safety rule
  llm_rules:
    - fixture llm rule
`;
  writeFileSync(path.join(rootDir, "repo.manifest.yaml"), manifest, "utf8");
}

describe("repo-context-tools", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(tmpdir(), "vibeforge-repo-context-"));
    writeValidManifest(tmpDir);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
    process.exitCode = undefined;
    vi.restoreAllMocks();
  });

  it("generates all four instruction files derived from repo.manifest.yaml", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    generateAgentInstructions(tmpDir);

    for (const file of ["AGENTS.md", "CLAUDE.md", "CODEX.md", "GEMINI.md"]) {
      const contents = readFileSync(path.join(tmpDir, file), "utf8");
      expect(contents).toContain("GENERATED FILE - DO NOT EDIT DIRECTLY");
      expect(contents).toContain(`# ${file} - Fixture Product Agent Instructions`);
      expect(contents).toContain("- Full name: Fixture-Org/fixture-repo");
      expect(contents).toContain("- fixture ownership item");
      expect(contents).toContain("- fixture non-ownership item");
      expect(contents).toContain("Manifest hash: sha256:");
    }
  });

  it("detects a hand-edited generated file as stale drift", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    generateAgentInstructions(tmpDir);
    writeFileSync(path.join(tmpDir, "AGENTS.md"), "hand-edited, no longer matches the manifest\n", "utf8");

    checkAgentInstructionDrift(tmpDir);

    expect(process.exitCode).toBe(1);
    expect(errorSpy.mock.calls.some((call) => String(call[0]).includes("STALE: AGENTS.md"))).toBe(true);
  });

  it("detects a deleted generated file as missing drift", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    generateAgentInstructions(tmpDir);
    rmSync(path.join(tmpDir, "AGENTS.md"));

    checkAgentInstructionDrift(tmpDir);

    expect(process.exitCode).toBe(1);
    expect(errorSpy.mock.calls.some((call) => String(call[0]).includes("MISSING: AGENTS.md"))).toBe(true);
  });

  it("reports no drift immediately after generation", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    generateAgentInstructions(tmpDir);
    checkAgentInstructionDrift(tmpDir);

    expect(process.exitCode).toBeUndefined();
    expect(
      logSpy.mock.calls.some((call) =>
        String(call[0]).includes("Generated agent instructions match repo.manifest.yaml"),
      ),
    ).toBe(true);
  });

  it("throws a clear error for an invalid or incomplete manifest", () => {
    writeFileSync(
      path.join(tmpDir, "repo.manifest.yaml"),
      'schema_version: "RepoManifest.v1"\nrepo:\n  full_name: "Fixture-Org/fixture-repo"\n',
      "utf8",
    );

    expect(() => generateAgentInstructions(tmpDir)).toThrow(/repo\.manifest\.yaml is missing/);
  });

  describe("verifyRepoContext", () => {
    beforeEach(() => {
      execFileSync("git", ["init", "-b", "master"], { cwd: tmpDir, stdio: ["ignore", "pipe", "pipe"] });
      execFileSync("git", ["remote", "add", "origin", "git@github.com:Fixture-Org/fixture-repo.git"], {
        cwd: tmpDir,
        stdio: ["ignore", "pipe", "pipe"],
      });
      writeFileSync(path.join(tmpDir, "package.json"), JSON.stringify({ name: "fixture-repo" }), "utf8");
      writeFileSync(path.join(tmpDir, "README.md"), "# Fixture Product\n\nA fixture repo.\n", "utf8");
      vi.spyOn(console, "log").mockImplementation(() => {});
      vi.spyOn(console, "error").mockImplementation(() => {});
      generateAgentInstructions(tmpDir);
    });

    it("writes a passing receipt when repo truth matches the manifest", () => {
      verifyRepoContext(tmpDir);

      expect(process.exitCode).toBeUndefined();
      const receipt = JSON.parse(readFileSync(path.join(tmpDir, "receipts", "repo-context", "latest.json"), "utf8"));
      expect(receipt.status).toBe("passed");
      expect(receipt.checks.every((check: { status: string }) => check.status === "passed")).toBe(true);
    });

    it("writes a failing receipt with the specific mismatched check when repo truth diverges", () => {
      writeFileSync(path.join(tmpDir, "package.json"), JSON.stringify({ name: "wrong-name" }), "utf8");

      verifyRepoContext(tmpDir);

      expect(process.exitCode).toBe(1);
      const receipt = JSON.parse(readFileSync(path.join(tmpDir, "receipts", "repo-context", "latest.json"), "utf8"));
      expect(receipt.status).toBe("failed");
      const packageCheck = receipt.checks.find((check: { id: string }) => check.id === "package_name");
      expect(packageCheck.status).toBe("failed");
      expect(packageCheck.detail).toContain("wrong-name");
      const remoteCheck = receipt.checks.find((check: { id: string }) => check.id === "repository_full_name");
      expect(remoteCheck.status).toBe("passed");
    });
  });
});
