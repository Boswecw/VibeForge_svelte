/**
 * Runtime Check API Client
 *
 * Communicates with Tauri backend to detect language runtimes
 * and development environment status.
 */

// Conditionally import Tauri API (only available in Tauri environment)
type TauriInvoke = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
let invoke: TauriInvoke = () => Promise.reject(new Error("Tauri not available"));

if (typeof window !== "undefined" && "__TAURI__" in window) {
  try {
    // Dynamic import with variable to bypass Vite static analysis
    const tauriModule = "@tauri-apps/api/tauri";
    import(/* @vite-ignore */ tauriModule)
      .then((module) => {
        invoke = module.invoke;
      })
      .catch(() => {});
  } catch (e) {
    // Tauri not available in browser
  }
}

export interface RuntimeStatus {
  id: string;
  name: string;
  category: "frontend" | "backend" | "systems" | "mobile";
  required: boolean;
  installed: boolean;
  on_path: boolean;
  version?: string;
  path?: string;
  last_checked?: number;
  notes?: string;
}

export interface RuntimeCheckResult {
  runtimes: RuntimeStatus[];
  all_required_met: boolean;
  missing_required: string[];
  container_only: string[];
  timestamp: number;
}

/**
 * Mock runtime data for development (when Tauri is not available)
 */
function getMockRuntimeData(): RuntimeCheckResult {
  const now = Math.floor(Date.now() / 1000);

  return {
    runtimes: [
      {
        id: "javascript-typescript",
        name: "JavaScript/TypeScript (Node.js)",
        category: "frontend",
        required: true,
        installed: true,
        on_path: true,
        version: "20.10.0",
        path: "/usr/bin/node",
        last_checked: now,
      },
      {
        id: "npm",
        name: "npm",
        category: "frontend",
        required: true,
        installed: true,
        on_path: true,
        version: "10.2.3",
        path: "/usr/bin/npm",
        last_checked: now,
      },
      {
        id: "pnpm",
        name: "pnpm",
        category: "frontend",
        required: false,
        installed: true,
        on_path: true,
        version: "8.10.5",
        path: "/usr/bin/pnpm",
        last_checked: now,
      },
      {
        id: "python",
        name: "Python",
        category: "backend",
        required: false,
        installed: true,
        on_path: true,
        version: "3.11.6",
        path: "/usr/bin/python3",
        last_checked: now,
      },
      {
        id: "go",
        name: "Go",
        category: "backend",
        required: false,
        installed: false,
        on_path: false,
        last_checked: now,
        notes: "'go' not found on PATH",
      },
      {
        id: "rust",
        name: "Rust",
        category: "backend",
        required: false,
        installed: true,
        on_path: true,
        version: "1.74.0",
        path: "/home/user/.cargo/bin/rustc",
        last_checked: now,
      },
      {
        id: "java",
        name: "Java",
        category: "backend",
        required: false,
        installed: false,
        on_path: false,
        last_checked: now,
        notes: "'java' not found on PATH",
      },
      {
        id: "git",
        name: "Git",
        category: "systems",
        required: true,
        installed: true,
        on_path: true,
        version: "2.42.0",
        path: "/usr/bin/git",
        last_checked: now,
      },
      {
        id: "bash",
        name: "Bash",
        category: "systems",
        required: true,
        installed: true,
        on_path: true,
        version: "5.2.15",
        path: "/usr/bin/bash",
        last_checked: now,
      },
      {
        id: "docker",
        name: "Docker",
        category: "systems",
        required: false,
        installed: true,
        on_path: true,
        version: "24.0.7",
        path: "/usr/bin/docker",
        last_checked: now,
      },
      {
        id: "dart",
        name: "Dart (Flutter)",
        category: "mobile",
        required: false,
        installed: false,
        on_path: false,
        last_checked: now,
        notes: "Container-only runtime (requires Dev-Container)",
      },
      {
        id: "kotlin",
        name: "Kotlin",
        category: "mobile",
        required: false,
        installed: false,
        on_path: false,
        last_checked: now,
        notes: "Container-only runtime (requires Dev-Container)",
      },
      {
        id: "swift",
        name: "Swift",
        category: "mobile",
        required: false,
        installed: false,
        on_path: false,
        last_checked: now,
        notes: "Container-only runtime (requires Dev-Container)",
      },
    ],
    all_required_met: true,
    missing_required: [],
    container_only: ["Dart (Flutter)", "Kotlin", "Swift"],
    timestamp: now,
  };
}

/**
 * Check all runtimes and return their status
 */
export async function checkRuntimes(): Promise<RuntimeCheckResult> {
  try {
    return await invoke<RuntimeCheckResult>("check_runtimes");
  } catch (error) {
    console.error("Failed to check runtimes:", error);
    // Fallback to mock data if Tauri is not available (dev mode)
    return getMockRuntimeData();
  }
}

/**
 * Refresh the runtime cache (force re-check)
 */
export async function refreshRuntimeCache(): Promise<void> {
  try {
    await invoke("refresh_runtime_cache");
  } catch (error) {
    console.error("Failed to refresh runtime cache:", error);
  }
}

/**
 * Get installation instructions for a specific runtime
 */
export async function getInstallInstructions(
  runtimeId: string
): Promise<string> {
  try {
    return await invoke<string>("get_install_instructions", { runtimeId });
  } catch (error) {
    console.error("Failed to get install instructions:", error);
    return "Installation instructions not available.";
  }
}

/**
 * Check if a specific runtime is installed
 */
export function isRuntimeInstalled(
  result: RuntimeCheckResult,
  runtimeId: string
): boolean {
  const runtime = result.runtimes.find((r) => r.id === runtimeId);
  return runtime?.installed ?? false;
}

/**
 * Get runtimes by category
 */
export function getRuntimesByCategory(
  result: RuntimeCheckResult,
  category: RuntimeStatus["category"]
): RuntimeStatus[] {
  return result.runtimes.filter((r) => r.category === category);
}

/**
 * Get missing required runtimes
 */
export function getMissingRequired(
  result: RuntimeCheckResult
): RuntimeStatus[] {
  return result.runtimes.filter((r) => r.required && !r.installed);
}

/**
 * Check if all requirements for selected languages are met
 */
export function checkLanguageRequirements(
  result: RuntimeCheckResult,
  languageIds: string[]
): {
  allMet: boolean;
  missing: RuntimeStatus[];
  containerOnly: RuntimeStatus[];
} {
  const languageToRuntime: Record<string, string[]> = {
    "javascript-typescript": ["javascript-typescript", "npm"],
    python: ["python"],
    go: ["go"],
    rust: ["rust"],
    java: ["java"],
    dart: ["dart"],
    kotlin: ["kotlin"],
    swift: ["swift"],
    c: ["c"],
    cpp: ["cpp"],
    bash: ["bash"],
  };

  const requiredRuntimes = new Set<string>();
  languageIds.forEach((langId) => {
    const runtimes = languageToRuntime[langId] || [];
    runtimes.forEach((r) => requiredRuntimes.add(r));
  });

  const missing: RuntimeStatus[] = [];
  const containerOnly: RuntimeStatus[] = [];

  requiredRuntimes.forEach((runtimeId) => {
    const runtime = result.runtimes.find((r) => r.id === runtimeId);
    if (!runtime) return;

    if (runtime.notes?.includes("Container-only")) {
      containerOnly.push(runtime);
    } else if (!runtime.installed) {
      missing.push(runtime);
    }
  });

  return {
    allMet: missing.length === 0,
    missing,
    containerOnly,
  };
}
