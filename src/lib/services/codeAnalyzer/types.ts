/**
 * Code Analyzer Types
 * For analyzing existing codebases and detecting project structure
 */

export interface DetectedLanguage {
  id: string;
  name: string;
  confidence: number; // 0-1
  files: string[];
  lineCount: number;
}

export interface DetectedFramework {
  name: string;
  version?: string;
  category:
    | "frontend"
    | "backend"
    | "fullstack"
    | "mobile"
    | "testing"
    | "build";
  confidence: number;
  indicators: string[]; // Files/patterns that indicated this framework
}

export interface DetectedDependency {
  name: string;
  version?: string;
  type: "runtime" | "dev" | "peer";
  source: string; // package.json, requirements.txt, etc.
}

export interface DetectedDatabase {
  type: "postgresql" | "mongodb" | "mysql" | "sqlite" | "redis" | "unknown";
  confidence: number;
  indicators: string[];
}

export interface DetectedAuthentication {
  method: "jwt" | "session" | "oauth" | "none" | "unknown";
  confidence: number;
  indicators: string[];
}

export interface ProjectProfile {
  // Basic metadata
  projectName: string;
  projectPath: string;
  rootFiles: string[];

  // Detected languages
  languages: DetectedLanguage[];
  primaryLanguage: string; // Most used language

  // Detected frameworks
  frameworks: DetectedFramework[];

  // Dependencies
  dependencies: DetectedDependency[];

  // Project structure
  hasBackend: boolean;
  hasFrontend: boolean;
  hasMobile: boolean;
  hasTests: boolean;

  // Infrastructure
  database?: DetectedDatabase;
  authentication?: DetectedAuthentication;
  hasDocker: boolean;
  hasCI: boolean;

  // Matched stack (if any)
  suggestedStackId?: string;
  stackMatchConfidence?: number;
}

export interface AnalysisResult {
  success: boolean;
  profile?: ProjectProfile;
  error?: string;
  analysisTimeMs: number;
  filesScanned: number;
}

export interface AnalyzerConfig {
  maxDepth: number;
  ignorePatterns: string[];
  includePatterns: string[];
  followSymlinks: boolean;
}

export const DEFAULT_ANALYZER_CONFIG: AnalyzerConfig = {
  maxDepth: 5,
  ignorePatterns: [
    "node_modules",
    ".git",
    "dist",
    "build",
    "target",
    ".next",
    ".vscode",
    ".idea",
    "__pycache__",
    ".pytest_cache",
    "venv",
    "env",
    ".venv",
    "coverage",
    ".coverage",
    "*.pyc",
    "*.pyo",
    "*.so",
    "*.dylib",
    "*.dll",
  ],
  includePatterns: [
    "package.json",
    "requirements.txt",
    "Cargo.toml",
    "go.mod",
    "pom.xml",
    "build.gradle",
    "composer.json",
    "Gemfile",
    "tsconfig.json",
    "vite.config.*",
    "next.config.*",
    "nuxt.config.*",
    "svelte.config.*",
    "angular.json",
    ".dockerignore",
    "Dockerfile",
    "docker-compose.yml",
    ".github/workflows/*",
    ".gitlab-ci.yml",
  ],
  followSymlinks: false,
};

// Framework detection patterns
export const FRAMEWORK_PATTERNS: Record<
  string,
  {
    dependencies?: string[];
    files?: string[];
    content?: Array<{ file: string; pattern: RegExp }>;
  }
> = {
  "Next.js": {
    dependencies: ["next"],
    files: ["next.config.js", "next.config.ts", "next.config.mjs"],
  },
  React: {
    dependencies: ["react", "react-dom"],
  },
  Vue: {
    dependencies: ["vue"],
    files: ["vue.config.js"],
  },
  Svelte: {
    dependencies: ["svelte"],
    files: ["svelte.config.js"],
  },
  SvelteKit: {
    dependencies: ["@sveltejs/kit"],
    files: ["svelte.config.js"],
  },
  "Solid.js": {
    dependencies: ["solid-js"],
  },
  Angular: {
    dependencies: ["@angular/core"],
    files: ["angular.json"],
  },
  Express: {
    dependencies: ["express"],
  },
  Fastify: {
    dependencies: ["fastify"],
  },
  NestJS: {
    dependencies: ["@nestjs/core"],
  },
  Django: {
    dependencies: ["django"],
    files: ["manage.py"],
  },
  FastAPI: {
    dependencies: ["fastapi"],
  },
  Flask: {
    dependencies: ["flask"],
  },
  Laravel: {
    dependencies: ["laravel/framework"],
    files: ["artisan"],
  },
  Rails: {
    dependencies: ["rails"],
    files: ["Gemfile"],
  },
  "Go Fiber": {
    dependencies: ["github.com/gofiber/fiber"],
  },
  Gin: {
    dependencies: ["github.com/gin-gonic/gin"],
  },
  Actix: {
    dependencies: ["actix-web"],
  },
  Rocket: {
    dependencies: ["rocket"],
  },
  "React Native": {
    dependencies: ["react-native"],
  },
  Expo: {
    dependencies: ["expo"],
  },
  Flutter: {
    files: ["pubspec.yaml"],
  },
  Vite: {
    dependencies: ["vite"],
    files: ["vite.config.js", "vite.config.ts"],
  },
  Webpack: {
    dependencies: ["webpack"],
    files: ["webpack.config.js"],
  },
  TailwindCSS: {
    dependencies: ["tailwindcss"],
    files: ["tailwind.config.js", "tailwind.config.ts"],
  },
  Prisma: {
    dependencies: ["prisma", "@prisma/client"],
    files: ["schema.prisma"],
  },
  TypeORM: {
    dependencies: ["typeorm"],
  },
  Drizzle: {
    dependencies: ["drizzle-orm"],
  },
  tRPC: {
    dependencies: ["@trpc/server"],
  },
  GraphQL: {
    dependencies: ["graphql"],
  },
  Jest: {
    dependencies: ["jest"],
    files: ["jest.config.js", "jest.config.ts"],
  },
  Vitest: {
    dependencies: ["vitest"],
  },
  Pytest: {
    dependencies: ["pytest"],
  },
};

// Language detection by file extension
export const LANGUAGE_EXTENSIONS: Record<string, string> = {
  ".ts": "javascript-typescript",
  ".tsx": "javascript-typescript",
  ".js": "javascript-typescript",
  ".jsx": "javascript-typescript",
  ".mjs": "javascript-typescript",
  ".cjs": "javascript-typescript",
  ".py": "python",
  ".go": "go",
  ".rs": "rust",
  ".java": "java",
  ".kt": "kotlin",
  ".swift": "swift",
  ".c": "c",
  ".cpp": "cpp",
  ".cc": "cpp",
  ".cxx": "cpp",
  ".h": "c",
  ".hpp": "cpp",
  ".sh": "bash",
  ".bash": "bash",
  ".sql": "sql",
  ".svelte": "svelte",
  ".vue": "vue",
  ".dart": "dart",
};
