import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const GENERATED_AGENT_FILES = ["AGENTS.md", "CLAUDE.md", "CODEX.md", "GEMINI.md"] as const;

type Manifest = {
  schema_version: string;
  repo: {
    full_name: string;
    local_name: string;
    package_name: string;
    default_branch: string;
    repo_class: string;
  };
  identity: {
    product_name: string;
    one_line: string;
    authority_role: string;
  };
  owns: string[];
  does_not_own: string[];
  upstream_authorities?: Record<string, { owns?: string } | string>;
  downstream_consumers?: string[];
  canonical_files: string[];
  generated_files: string[];
  agent_edit_policy: {
    may_edit: string[];
    must_not_edit_directly: string[];
    must_regenerate: string[];
  };
  verification?: {
    required_identity_checks?: string[];
    test_commands?: string[];
    build_commands?: string[];
    safety_rules?: string[];
    llm_rules?: string[];
  };
};

type LoadedManifest = {
  manifest: Manifest;
  manifestText: string;
  manifestHash: string;
};

type DriftResult = {
  file: string;
  reason: "missing" | "stale";
};

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function parseScalar(raw: string): string {
  const value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseYamlSubset(text: string): Record<string, unknown> {
  const rawLines = text.replace(/\r\n/g, "\n").split("\n");
  const lines = rawLines
    .map((line, index) => ({
      index,
      indent: line.match(/^ */)?.[0].length ?? 0,
      content: line.trim(),
    }))
    .filter((line) => line.content.length > 0 && !line.content.startsWith("#"));

  const root: Record<string, unknown> = {};
  const stack: Array<{ indent: number; value: Record<string, unknown> | string[] }> = [
    { indent: -1, value: root },
  ];

  function nextChildIsList(currentIndex: number, indent: number): boolean {
    for (let i = currentIndex + 1; i < lines.length; i += 1) {
      const next = lines[i];
      if (next.indent <= indent) {
        return false;
      }
      return next.content.startsWith("- ");
    }
    return false;
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    while (line.indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].value;
    if (line.content.startsWith("- ")) {
      if (!Array.isArray(parent)) {
        throw new Error(`Invalid list item at manifest line ${line.index + 1}`);
      }
      parent.push(parseScalar(line.content.slice(2)));
      continue;
    }

    if (Array.isArray(parent)) {
      throw new Error(`Nested list maps are not supported at manifest line ${line.index + 1}`);
    }

    const colonIndex = line.content.indexOf(":");
    if (colonIndex === -1) {
      throw new Error(`Invalid manifest line ${line.index + 1}: ${line.content}`);
    }

    const key = line.content.slice(0, colonIndex).trim();
    const value = line.content.slice(colonIndex + 1).trim();
    if (!key) {
      throw new Error(`Invalid empty manifest key at line ${line.index + 1}`);
    }

    if (value.length === 0) {
      const child: Record<string, unknown> | string[] = nextChildIsList(i, line.indent) ? [] : {};
      parent[key] = child;
      stack.push({ indent: line.indent, value: child });
    } else {
      parent[key] = parseScalar(value);
    }
  }

  return root;
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`repo.manifest.yaml is missing object: ${label}`);
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`repo.manifest.yaml is missing string: ${label}`);
  }
  return value;
}

function asStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`repo.manifest.yaml is missing string list: ${label}`);
  }
  return value as string[];
}

function optionalStringArray(value: unknown): string[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return [];
  }
  return value as string[];
}

function normalizeManifest(parsed: Record<string, unknown>): Manifest {
  const repo = asRecord(parsed.repo, "repo");
  const identity = asRecord(parsed.identity, "identity");
  const agentEditPolicy = asRecord(parsed.agent_edit_policy, "agent_edit_policy");
  const verification =
    parsed.verification === undefined ? undefined : asRecord(parsed.verification, "verification");

  return {
    schema_version: asString(parsed.schema_version, "schema_version"),
    repo: {
      full_name: asString(repo.full_name, "repo.full_name"),
      local_name: asString(repo.local_name, "repo.local_name"),
      package_name: asString(repo.package_name, "repo.package_name"),
      default_branch: asString(repo.default_branch, "repo.default_branch"),
      repo_class: asString(repo.repo_class, "repo.repo_class"),
    },
    identity: {
      product_name: asString(identity.product_name, "identity.product_name"),
      one_line: asString(identity.one_line, "identity.one_line"),
      authority_role: asString(identity.authority_role, "identity.authority_role"),
    },
    owns: asStringArray(parsed.owns, "owns"),
    does_not_own: asStringArray(parsed.does_not_own, "does_not_own"),
    upstream_authorities: parsed.upstream_authorities as Manifest["upstream_authorities"],
    downstream_consumers: optionalStringArray(parsed.downstream_consumers),
    canonical_files: asStringArray(parsed.canonical_files, "canonical_files"),
    generated_files: asStringArray(parsed.generated_files, "generated_files"),
    agent_edit_policy: {
      may_edit: asStringArray(agentEditPolicy.may_edit, "agent_edit_policy.may_edit"),
      must_not_edit_directly: asStringArray(
        agentEditPolicy.must_not_edit_directly,
        "agent_edit_policy.must_not_edit_directly",
      ),
      must_regenerate: asStringArray(
        agentEditPolicy.must_regenerate,
        "agent_edit_policy.must_regenerate",
      ),
    },
    verification: verification
      ? {
          required_identity_checks: optionalStringArray(verification.required_identity_checks),
          test_commands: optionalStringArray(verification.test_commands),
          build_commands: optionalStringArray(verification.build_commands),
          safety_rules: optionalStringArray(verification.safety_rules),
          llm_rules: optionalStringArray(verification.llm_rules),
        }
      : undefined,
  };
}

function loadManifest(rootDir = process.cwd()): LoadedManifest {
  const manifestPath = path.join(rootDir, "repo.manifest.yaml");
  const manifestText = readFileSync(manifestPath, "utf8");
  const parsed = parseYamlSubset(manifestText);
  return {
    manifest: normalizeManifest(parsed),
    manifestText,
    manifestHash: sha256(manifestText),
  };
}

function runGit(args: string[], rootDir = process.cwd()): string {
  return execFileSync("git", args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function normalizeRemoteFullName(remoteUrl: string): string {
  const withoutGitSuffix = remoteUrl.trim().replace(/\.git$/, "");
  const scpLike = withoutGitSuffix.match(/^git@[^:]+:(.+)$/);
  if (scpLike) {
    return scpLike[1].toLowerCase();
  }
  const githubLike = withoutGitSuffix.match(/github\.com[:/](.+)$/);
  if (githubLike) {
    return githubLike[1].toLowerCase();
  }
  return withoutGitSuffix.toLowerCase();
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function extractReadmeTitle(readme: string): string {
  const htmlTitle = readme.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (htmlTitle) {
    return stripHtml(htmlTitle[1]);
  }

  const markdownTitle = readme.match(/^#(?!#)\s+(.+)$/m);
  if (markdownTitle) {
    return markdownTitle[1].trim();
  }

  return "";
}

function listSection(items: string[]): string {
  if (items.length === 0) {
    return "- None declared\n";
  }
  return items.map((item) => `- ${item}`).join("\n") + "\n";
}

function authoritySection(authorities: Manifest["upstream_authorities"]): string {
  if (!authorities || Object.keys(authorities).length === 0) {
    return "- None declared\n";
  }

  return (
    Object.entries(authorities)
      .map(([name, value]) => {
        if (typeof value === "string") {
          return `- ${name}: ${value}`;
        }
        return `- ${name}: ${value.owns ?? "authority declared in repo.manifest.yaml"}`;
      })
      .join("\n") + "\n"
  );
}

function renderAgentInstruction(fileName: string, loaded: LoadedManifest): string {
  const { manifest, manifestHash } = loaded;
  const tests = manifest.verification?.test_commands ?? [];
  const builds = manifest.verification?.build_commands ?? [];
  const safetyRules = manifest.verification?.safety_rules ?? [];
  const llmRules = manifest.verification?.llm_rules ?? [];

  return `<!--
GENERATED FILE - DO NOT EDIT DIRECTLY

Source: repo.manifest.yaml
Generated by: tools/repo-context/generate-agent-instructions.ts
Manifest hash: ${manifestHash}
Receipt: receipts/repo-context/latest.json
-->

# ${fileName} - ${manifest.identity.product_name} Agent Instructions

## Repo Identity

- Full name: ${manifest.repo.full_name}
- Local name: ${manifest.repo.local_name}
- Package name: ${manifest.repo.package_name}
- Default branch: ${manifest.repo.default_branch}
- Repo class: ${manifest.repo.repo_class}
- Product: ${manifest.identity.product_name}
- Authority role: ${manifest.identity.authority_role}
- Summary: ${manifest.identity.one_line}

## Owns

${listSection(manifest.owns)}
## Does Not Own

${listSection(manifest.does_not_own)}
## Upstream Authorities

${authoritySection(manifest.upstream_authorities)}
## Downstream Consumers

${listSection(manifest.downstream_consumers ?? [])}
## Canonical Files

${listSection(manifest.canonical_files)}
## Generated Files

${listSection(manifest.generated_files)}
## Agent Edit Policy

Agents may edit:

${listSection(manifest.agent_edit_policy.may_edit)}
Agents must not edit these files directly:

${listSection(manifest.agent_edit_policy.must_not_edit_directly)}
Regenerate these files after manifest changes:

${listSection(manifest.agent_edit_policy.must_regenerate)}
## Verification Commands

Context and drift:

- bun run generate:agent-instructions
- bun run check:agent-instruction-drift
- bun run verify:repo-context

Tests:

${listSection(tests)}
Builds:

${listSection(builds)}
## Safety Rules

${listSection(safetyRules)}
## Repo-Specific LLM Rules

${listSection(llmRules)}
## Required Preflight Before Cross-Repo Work

- Confirm the target repo path and git remote before reading architectural meaning from files.
- Confirm the repo class and authority role from repo.manifest.yaml.
- List the files you plan to read and edit.
- Do not mutate upstream authority repos unless the work order explicitly allows it.
- Run bun run verify:repo-context before claiming this repo is agent-governed.
`;
}

function expectedInstructions(loaded: LoadedManifest): Map<string, string> {
  const expected = new Map<string, string>();
  const generated = new Set(loaded.manifest.generated_files);
  for (const file of GENERATED_AGENT_FILES) {
    if (generated.has(file)) {
      expected.set(file, renderAgentInstruction(file, loaded));
    }
  }
  return expected;
}

function getInstructionDrift(rootDir = process.cwd()): DriftResult[] {
  const loaded = loadManifest(rootDir);
  const expected = expectedInstructions(loaded);
  const drift: DriftResult[] = [];

  for (const [file, expectedText] of expected.entries()) {
    const filePath = path.join(rootDir, file);
    if (!existsSync(filePath)) {
      drift.push({ file, reason: "missing" });
      continue;
    }

    const actual = readFileSync(filePath, "utf8");
    if (actual !== expectedText) {
      drift.push({ file, reason: "stale" });
    }
  }

  return drift;
}

export function generateAgentInstructions(rootDir = process.cwd()): void {
  const loaded = loadManifest(rootDir);
  const expected = expectedInstructions(loaded);

  for (const [file, contents] of expected.entries()) {
    writeFileSync(path.join(rootDir, file), contents, "utf8");
  }

  console.log(`Generated ${expected.size} agent instruction files from repo.manifest.yaml`);
}

export function checkAgentInstructionDrift(rootDir = process.cwd()): void {
  const drift = getInstructionDrift(rootDir);
  if (drift.length === 0) {
    console.log("Generated agent instructions match repo.manifest.yaml");
    return;
  }

  for (const item of drift) {
    console.error(`${item.reason.toUpperCase()}: ${item.file}`);
  }
  process.exitCode = 1;
}

function fileHash(rootDir: string, relativePath: string): string | null {
  const filePath = path.join(rootDir, relativePath);
  if (!existsSync(filePath)) {
    return null;
  }
  return sha256(readFileSync(filePath, "utf8"));
}

function receiptTimestamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function verifyRepoContext(rootDir = process.cwd()): void {
  const loaded = loadManifest(rootDir);
  const { manifest, manifestHash } = loaded;
  const checks: Array<{ id: string; status: "passed" | "failed"; detail: string }> = [];

  function addCheck(id: string, passed: boolean, detail: string): void {
    checks.push({ id, status: passed ? "passed" : "failed", detail });
  }

  const remote = runGit(["remote", "get-url", "origin"], rootDir);
  const normalizedRemote = normalizeRemoteFullName(remote);
  const expectedRemote = manifest.repo.full_name.toLowerCase();
  addCheck(
    "repository_full_name",
    normalizedRemote === expectedRemote,
    `origin is ${remote}; expected ${manifest.repo.full_name}`,
  );

  const localName = path.basename(rootDir);
  addCheck(
    "local_directory_name",
    localName === manifest.repo.local_name,
    `directory is ${localName}; expected ${manifest.repo.local_name}`,
  );

  const packageJson = JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf8")) as {
    name?: string;
  };
  addCheck(
    "package_name",
    packageJson.name === manifest.repo.package_name,
    `package name is ${packageJson.name ?? "<missing>"}; expected ${manifest.repo.package_name}`,
  );

  const readmeTitle = extractReadmeTitle(readFileSync(path.join(rootDir, "README.md"), "utf8"));
  addCheck(
    "README title",
    readmeTitle === manifest.identity.product_name,
    `README title is ${readmeTitle || "<missing>"}; expected ${manifest.identity.product_name}`,
  );

  const currentBranch = runGit(["branch", "--show-current"], rootDir);
  addCheck(
    "default_branch",
    currentBranch === manifest.repo.default_branch,
    `current branch is ${currentBranch}; expected ${manifest.repo.default_branch}`,
  );

  for (const file of manifest.canonical_files) {
    addCheck(
      `canonical_file:${file}`,
      existsSync(path.join(rootDir, file)),
      existsSync(path.join(rootDir, file)) ? `${file} exists` : `${file} is missing`,
    );
  }

  const drift = getInstructionDrift(rootDir);
  addCheck(
    "generated_instruction_hashes_match",
    drift.length === 0,
    drift.length === 0
      ? "generated instruction files match repo.manifest.yaml"
      : `generated instruction drift: ${drift.map((item) => item.file).join(", ")}`,
  );

  const generatedFiles: Record<string, string | null> = {};
  for (const file of manifest.generated_files) {
    generatedFiles[file] = fileHash(rootDir, file);
  }

  const status = checks.every((check) => check.status === "passed") ? "passed" : "failed";
  const timestamp = new Date().toISOString();
  const receipt = {
    schema_version: "RepoContextVerificationReceipt.v1",
    timestamp,
    repo_full_name: manifest.repo.full_name,
    repo_class: manifest.repo.repo_class,
    authority_role: manifest.identity.authority_role,
    local_path: rootDir,
    git_remote: remote,
    default_branch: manifest.repo.default_branch,
    current_branch: currentBranch,
    package_name: packageJson.name ?? null,
    readme_title: readmeTitle,
    manifest_hash: manifestHash,
    generated_files: generatedFiles,
    checks,
    status,
    warnings: [],
  };

  const receiptDir = path.join(rootDir, "receipts", "repo-context");
  mkdirSync(receiptDir, { recursive: true });
  const timestampedReceipt = path.join(receiptDir, `${receiptTimestamp()}.json`);
  const latestReceipt = path.join(receiptDir, "latest.json");
  const receiptText = JSON.stringify(receipt, null, 2) + "\n";
  writeFileSync(timestampedReceipt, receiptText, "utf8");
  writeFileSync(latestReceipt, receiptText, "utf8");

  if (status === "passed") {
    console.log(`Repo context verification passed: ${path.relative(rootDir, timestampedReceipt)}`);
  } else {
    console.error(`Repo context verification failed: ${path.relative(rootDir, timestampedReceipt)}`);
    for (const check of checks.filter((item) => item.status === "failed")) {
      console.error(`FAILED ${check.id}: ${check.detail}`);
    }
    process.exitCode = 1;
  }
}
