/**
 * Code Analyzer Service
 * Frontend wrapper for Tauri code analysis commands
 */

import type {
  AnalysisResult,
  ProjectProfile,
  DetectedLanguage,
  DetectedFramework,
} from "./types";
import type { WizardData, ProjectType } from "$lib/workbench/types/wizard";
import { ALL_STACKS } from "$lib/data/stack-profiles";

// Conditionally import Tauri APIs (only available in Tauri environment)
type TauriInvoke = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
type TauriOpen = (path: string) => Promise<void>;
let invoke: TauriInvoke = () => Promise.reject(new Error("Tauri not available"));
let open: TauriOpen = () => Promise.reject(new Error("Tauri not available"));

if (typeof window !== "undefined" && "__TAURI__" in window) {
  try {
    // Dynamic imports with variables to bypass Vite static analysis
    const tauriModule = "@tauri-apps/api/tauri";
    const dialogModule = "@tauri-apps/api/dialog";
    import(/* @vite-ignore */ tauriModule)
      .then((module) => {
        invoke = module.invoke;
      })
      .catch(() => {});
    import(/* @vite-ignore */ dialogModule)
      .then((module) => {
        open = module.open;
      })
      .catch(() => {});
  } catch (e) {
    // Tauri not available in browser
  }
}

export class CodeAnalyzerService {
  /**
   * Open folder picker dialog and analyze selected project
   */
  async analyzeProject(): Promise<AnalysisResult> {
    try {
      // Open directory picker
      const selectedPath = await (open as any)({
        directory: true,
        multiple: false,
        title: "Select Project Folder to Analyze",
      });

      if (!selectedPath || typeof selectedPath !== "string") {
        return {
          success: false,
          error: "No directory selected",
          analysisTimeMs: 0,
          filesScanned: 0,
        };
      }

      // Call Tauri backend to analyze
      const result = await invoke<AnalysisResult>("analyze_codebase", {
        projectPath: selectedPath,
      });

      return result;
    } catch (error) {
      console.error("Failed to analyze project:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
        analysisTimeMs: 0,
        filesScanned: 0,
      };
    }
  }

  /**
   * Analyze specific directory path (for testing or programmatic use)
   */
  async analyzeDirectory(path: string): Promise<AnalysisResult> {
    try {
      const result = await invoke<AnalysisResult>("analyze_codebase", {
        projectPath: path,
      });
      return result;
    } catch (error) {
      console.error("Failed to analyze directory:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
        analysisTimeMs: 0,
        filesScanned: 0,
      };
    }
  }

  /**
   * Convert ProjectProfile to WizardData
   * Maps detected project to wizard configuration
   */
  profileToWizardData(profile: ProjectProfile): Partial<WizardData> {
    const stack = profile.suggestedStackId
      ? ALL_STACKS.find(s => s.id === profile.suggestedStackId) || null
      : null;

    const languages = this.mapLanguagesToIds(profile.languages);
    const features = this.detectFeatures(profile);

    const data: Partial<WizardData> = {
      projectName: profile.projectName,
      projectDescription: this.generateProjectDescription(profile),
      projectType: this.detectProjectType(profile) as ProjectType,
      complexity: 'moderate', // Default, user can change
      primaryLanguage: languages[0] || null,
      secondaryLanguages: languages.slice(1),
      selectedStack: stack,
      features: {
        authentication: features.includes('authentication'),
        database: features.includes('database'),
        api: profile.hasBackend,
        testing: features.includes('testing'),
        docker: features.includes('docker'),
        cicd: features.includes('ci-cd'),
        monitoring: false, // Default
      },
      teamSize: 1, // Default, user can change
      timeline: 'month', // Default, user can change
      generateReadme: true,
      initGit: true,
    };

    return data;
  }

  /**
   * Generate project description from profile
   */
  private generateProjectDescription(profile: ProjectProfile): string {
    const parts: string[] = [];

    // Project type
    if (profile.hasFrontend && profile.hasBackend) {
      parts.push("Full-stack application");
    } else if (profile.hasFrontend) {
      parts.push("Frontend application");
    } else if (profile.hasBackend) {
      parts.push("Backend service");
    } else if (profile.hasMobile) {
      parts.push("Mobile application");
    }

    // Primary framework
    const primaryFramework = profile.frameworks[0];
    if (primaryFramework) {
      parts.push(`built with ${primaryFramework.name}`);
    }

    // Primary language
    if (profile.primaryLanguage !== "unknown") {
      const langName = profile.languages.find(
        (l) => l.id === profile.primaryLanguage
      )?.name;
      if (langName) {
        parts.push(`using ${langName}`);
      }
    }

    // Database
    if (profile.database) {
      parts.push(`with ${profile.database.type} database`);
    }

    return parts.join(" ") || "Existing codebase";
  }

  /**
   * Detect project type from profile
   */
  private detectProjectType(profile: ProjectProfile): ProjectType {
    if (profile.hasMobile) return "mobile";
    if (profile.hasFrontend && profile.hasBackend) return "web";
    if (profile.hasFrontend) return "web";
    if (profile.hasBackend) {
      // Check for AI-related dependencies
      const hasAI = profile.dependencies.some(
        (d) =>
          d.name.includes("openai") ||
          d.name.includes("langchain") ||
          d.name.includes("tensorflow") ||
          d.name.includes("torch")
      );
      if (hasAI) return "ai";
      return "api";
    }
    return "cli";
  }

  /**
   * Map detected languages to wizard language IDs
   */
  private mapLanguagesToIds(languages: DetectedLanguage[]): string[] {
    // Return languages sorted by confidence, top 3
    return languages
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map((l) => l.id)
      .filter((id) => id !== "unknown");
  }

  /**
   * Detect enabled features from profile
   */
  private detectFeatures(profile: ProjectProfile): string[] {
    const features: string[] = [];

    if (profile.hasDocker) features.push("docker");
    if (profile.hasCI) features.push("ci-cd");
    if (profile.hasTests) features.push("testing");
    if (profile.authentication) features.push("authentication");
    if (profile.database) features.push("database");

    // Check for specific features in frameworks
    for (const framework of profile.frameworks) {
      if (framework.name === "TailwindCSS") features.push("tailwind");
      if (framework.name === "Prisma") features.push("orm");
      if (framework.name === "tRPC") features.push("type-safety");
      if (framework.name === "GraphQL") features.push("graphql");
    }

    return features;
  }

  /**
   * Get confidence score for stack match
   */
  getStackMatchConfidence(profile: ProjectProfile, stackId: string): number {
    // If analyzer already matched, use that confidence
    if (profile.suggestedStackId === stackId && profile.stackMatchConfidence) {
      return profile.stackMatchConfidence;
    }

    // Calculate manual confidence
    const stack = ALL_STACKS.find((s) => s.id === stackId);
    if (!stack) return 0;

    let confidence = 0;
    let factors = 0;

    // Check language match
    const stackLanguages = ((stack.technologies as any).languages || []).map((l: string) =>
      l.toLowerCase()
    );
    const profileLanguageIds = profile.languages.map((l) => l.id);
    const languageMatches = profileLanguageIds.filter((id) =>
      stackLanguages.some((sl: string) => sl.includes(id.split("-")[0]))
    );
    if (languageMatches.length > 0) {
      confidence += languageMatches.length / stackLanguages.length;
      factors++;
    }

    // Check framework match
    const stackFrameworks = [
      ...(stack.technologies.frontend || []),
      ...(stack.technologies.backend || []),
    ].map((f) => f.toLowerCase());
    const profileFrameworks = profile.frameworks.map((f) =>
      f.name.toLowerCase()
    );
    const frameworkMatches = profileFrameworks.filter((pf) =>
      stackFrameworks.some((sf) => sf.includes(pf) || pf.includes(sf))
    );
    if (frameworkMatches.length > 0) {
      confidence += frameworkMatches.length / stackFrameworks.length;
      factors++;
    }

    return factors > 0 ? confidence / factors : 0;
  }

  /**
   * Format analysis summary for display
   */
  formatAnalysisSummary(profile: ProjectProfile): string {
    const lines: string[] = [
      `📁 ${profile.projectName}`,
      `📂 ${profile.projectPath}`,
      "",
      `**Languages:**`,
      ...profile.languages
        .slice(0, 3)
        .map((l) => `  • ${l.name} (${Math.round(l.confidence * 100)}%)`),
    ];

    if (profile.frameworks.length > 0) {
      lines.push("", "**Frameworks:**");
      lines.push(...profile.frameworks.slice(0, 5).map((f) => `  • ${f.name}`));
    }

    if (profile.database) {
      lines.push("", `**Database:** ${profile.database.type}`);
    }

    if (profile.authentication) {
      lines.push("", `**Authentication:** ${profile.authentication.method}`);
    }

    const projectType = [];
    if (profile.hasFrontend) projectType.push("Frontend");
    if (profile.hasBackend) projectType.push("Backend");
    if (profile.hasMobile) projectType.push("Mobile");
    if (projectType.length > 0) {
      lines.push("", `**Project Type:** ${projectType.join(" + ")}`);
    }

    if (profile.suggestedStackId) {
      const stack = ALL_STACKS.find((s) => s.id === profile.suggestedStackId);
      if (stack) {
        lines.push(
          "",
          `**Suggested Stack:** ${stack.name} (${Math.round((profile.stackMatchConfidence || 0) * 100)}% match)`
        );
      }
    }

    return lines.join("\n");
  }
}

// Singleton instance
export const codeAnalyzerService = new CodeAnalyzerService();
