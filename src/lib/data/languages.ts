/**
 * Programming Language Definitions
 *
 * Comprehensive list of supported programming languages for the VibeForge
 * Code Language Selector. Each language includes metadata, ecosystem info,
 * and stack compatibility mappings.
 */

export type LanguageCategory = "frontend" | "backend" | "systems" | "mobile";

export type EcosystemSupport = "excellent" | "good" | "moderate";

export interface Language {
  id: string;
  name: string;
  category: LanguageCategory;
  icon: string;
  color: string;
  description: string;
  ecosystemSupport: EcosystemSupport;
  compatibleStacks: string[]; // stack profile IDs
  packageManager?: string;
  testFrameworks?: string[];
  linters?: string[];
  formatters?: string[];
  buildTools?: string[];
}

export interface ProjectLanguages {
  selected: string[]; // language IDs
  primary?: string; // main language ID
  timestamp: string;
}

/**
 * All supported languages
 */
export const LANGUAGES: Record<string, Language> = {
  // Frontend Languages
  "javascript-typescript": {
    id: "javascript-typescript",
    name: "JavaScript / TypeScript",
    category: "frontend",
    icon: "📘",
    color: "#3178C6",
    description: "Most popular web language with static typing option",
    ecosystemSupport: "excellent",
    compatibleStacks: [
      "t3-stack",
      "mern-stack",
      "nextjs-fullstack",
      "sveltekit-stack",
      "react-native-expo",
    ],
    packageManager: "npm/pnpm/yarn",
    testFrameworks: ["Vitest", "Jest", "Playwright"],
    linters: ["ESLint"],
    formatters: ["Prettier"],
    buildTools: ["Vite", "Webpack", "esbuild"],
  },
  svelte: {
    id: "svelte",
    name: "Svelte",
    category: "frontend",
    icon: "🔥",
    color: "#FF3E00",
    description: "Truly reactive framework with minimal JavaScript",
    ecosystemSupport: "good",
    compatibleStacks: ["sveltekit-stack"],
    packageManager: "npm/pnpm",
    testFrameworks: ["Vitest", "Playwright"],
    linters: ["ESLint"],
    formatters: ["Prettier"],
    buildTools: ["Vite", "SvelteKit"],
  },
  solid: {
    id: "solid",
    name: "Solid",
    category: "frontend",
    icon: "⚛️",
    color: "#2C4F7C",
    description: "Fine-grained reactivity without virtual DOM",
    ecosystemSupport: "moderate",
    compatibleStacks: ["solidstart-stack"],
    packageManager: "npm/pnpm",
    testFrameworks: ["Vitest"],
    linters: ["ESLint"],
    formatters: ["Prettier"],
    buildTools: ["Vite", "SolidStart"],
  },

  // Backend Languages
  python: {
    id: "python",
    name: "Python",
    category: "backend",
    icon: "🐍",
    color: "#3776AB",
    description: "Versatile language excellent for AI/ML and web backends",
    ecosystemSupport: "excellent",
    compatibleStacks: ["django-stack", "fastapi-ai-stack"],
    packageManager: "pip/poetry/uv",
    testFrameworks: ["pytest", "unittest"],
    linters: ["ruff", "pylint", "mypy"],
    formatters: ["black", "ruff"],
    buildTools: ["setuptools", "poetry"],
  },
  nodejs: {
    id: "nodejs",
    name: "Node.js",
    category: "backend",
    icon: "🟢",
    color: "#68A063",
    description: "JavaScript runtime for backend development",
    ecosystemSupport: "excellent",
    compatibleStacks: [
      "mern-stack",
      "t3-stack",
      "nextjs-fullstack",
      "sveltekit-stack",
    ],
    packageManager: "npm/pnpm/yarn",
    testFrameworks: ["Vitest", "Jest"],
    linters: ["ESLint"],
    formatters: ["Prettier"],
    buildTools: ["esbuild", "Webpack"],
  },
  go: {
    id: "go",
    name: "Go",
    category: "backend",
    icon: "🐹",
    color: "#00ADD8",
    description: "High-performance systems language for cloud-native apps",
    ecosystemSupport: "excellent",
    compatibleStacks: ["golang-cloud-native"],
    packageManager: "go modules",
    testFrameworks: ["testing", "testify"],
    linters: ["golangci-lint", "staticcheck"],
    formatters: ["gofmt", "goimports"],
    buildTools: ["go build", "make"],
  },
  rust: {
    id: "rust",
    name: "Rust",
    category: "backend",
    icon: "🦀",
    color: "#CE422B",
    description: "Memory-safe systems language with zero-cost abstractions",
    ecosystemSupport: "good",
    compatibleStacks: [],
    packageManager: "cargo",
    testFrameworks: ["cargo test", "rstest"],
    linters: ["clippy"],
    formatters: ["rustfmt"],
    buildTools: ["cargo", "maturin"],
  },
  java: {
    id: "java",
    name: "Java",
    category: "backend",
    icon: "☕",
    color: "#007396",
    description: "Enterprise-grade language with strong ecosystem",
    ecosystemSupport: "excellent",
    compatibleStacks: [],
    packageManager: "Maven/Gradle",
    testFrameworks: ["JUnit", "Mockito"],
    linters: ["Checkstyle", "SpotBugs"],
    formatters: ["google-java-format"],
    buildTools: ["Maven", "Gradle"],
  },

  // Systems / Tooling
  c: {
    id: "c",
    name: "C",
    category: "systems",
    icon: "⚙️",
    color: "#A8B9CC",
    description: "Low-level systems programming language",
    ecosystemSupport: "excellent",
    compatibleStacks: [],
    testFrameworks: ["Unity", "Check"],
    linters: ["clang-tidy"],
    formatters: ["clang-format"],
    buildTools: ["make", "CMake", "gcc", "clang"],
  },
  cpp: {
    id: "cpp",
    name: "C++",
    category: "systems",
    icon: "⚙️",
    color: "#00599C",
    description: "Object-oriented systems programming",
    ecosystemSupport: "excellent",
    compatibleStacks: [],
    packageManager: "vcpkg/conan",
    testFrameworks: ["Google Test", "Catch2"],
    linters: ["clang-tidy"],
    formatters: ["clang-format"],
    buildTools: ["CMake", "make", "g++", "clang++"],
  },
  bash: {
    id: "bash",
    name: "Bash",
    category: "systems",
    icon: "🐚",
    color: "#4EAA25",
    description: "Shell scripting for automation and DevOps",
    ecosystemSupport: "excellent",
    compatibleStacks: [],
    testFrameworks: ["bats", "shunit2"],
    linters: ["shellcheck"],
    formatters: ["shfmt"],
    buildTools: ["bash", "sh"],
  },
  sql: {
    id: "sql",
    name: "SQL",
    category: "systems",
    icon: "🗄️",
    color: "#CC2927",
    description: "Database query and management language",
    ecosystemSupport: "excellent",
    compatibleStacks: [
      "django-stack",
      "fastapi-ai-stack",
      "laravel-stack",
      "golang-cloud-native",
    ],
    testFrameworks: ["pgTAP", "SQLite"],
    linters: ["sqlfluff"],
    formatters: ["pg_format", "sqlfluff"],
    buildTools: ["psql", "sqlite3"],
  },

  // Mobile / Modern
  dart: {
    id: "dart",
    name: "Dart",
    category: "mobile",
    icon: "🎯",
    color: "#0175C2",
    description: "Language for Flutter cross-platform development",
    ecosystemSupport: "excellent",
    compatibleStacks: [],
    packageManager: "pub",
    testFrameworks: ["flutter_test"],
    linters: ["dart analyze"],
    formatters: ["dart format"],
    buildTools: ["dart", "flutter"],
  },
  kotlin: {
    id: "kotlin",
    name: "Kotlin",
    category: "mobile",
    icon: "🔷",
    color: "#7F52FF",
    description: "Modern JVM language for Android development",
    ecosystemSupport: "excellent",
    compatibleStacks: [],
    packageManager: "Gradle",
    testFrameworks: ["JUnit", "Kotest"],
    linters: ["ktlint", "detekt"],
    formatters: ["ktlint"],
    buildTools: ["Gradle", "Maven"],
  },
  swift: {
    id: "swift",
    name: "Swift",
    category: "mobile",
    icon: "🍎",
    color: "#FA7343",
    description: "Apple's language for iOS/macOS development",
    ecosystemSupport: "excellent",
    compatibleStacks: [],
    packageManager: "Swift Package Manager",
    testFrameworks: ["XCTest"],
    linters: ["SwiftLint"],
    formatters: ["swift-format"],
    buildTools: ["Xcode", "swiftc"],
  },
};

/**
 * Get all languages as array
 */
export const ALL_LANGUAGES: Language[] = Object.values(LANGUAGES);

/**
 * Get languages by category
 */
export function getLanguagesByCategory(category: LanguageCategory): Language[] {
  return ALL_LANGUAGES.filter((lang) => lang.category === category);
}

/**
 * Get language by ID
 */
export function getLanguage(id: string): Language | undefined {
  return LANGUAGES[id];
}

/**
 * Language categories for UI display
 */
export const LANGUAGE_CATEGORIES = [
  {
    id: "frontend" as const,
    name: "Frontend",
    description: "Client-side web technologies",
    icon: "🎨",
  },
  {
    id: "backend" as const,
    name: "Backend",
    description: "Server-side development",
    icon: "⚡",
  },
  {
    id: "systems" as const,
    name: "Systems / Tooling",
    description: "Low-level and automation",
    icon: "🔧",
  },
  {
    id: "mobile" as const,
    name: "Mobile / Modern",
    description: "Mobile and cross-platform",
    icon: "📱",
  },
] as const;
