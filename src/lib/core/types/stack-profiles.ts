/**
 * Stack Profile Type Definitions
 *
 * Defines the structure for modern development stack profiles that drive
 * project scaffolding, automation, and the Stack Advisor system.
 */

// ============================================================================
// Core Types
// ============================================================================

export type StackCategory = "web" | "mobile" | "desktop" | "api" | "ai" | "fullstack" | "backend";

export type ComplexityLevel = "beginner" | "intermediate" | "advanced";

export type SpeedLevel = "fast" | "medium" | "slow";

export type ScalabilityLevel = "low" | "medium" | "high";

export type TechnologyCategory =
  | "frontend"
  | "backend"
  | "database"
  | "infrastructure"
  | "testing"
  | "deployment";

// ============================================================================
// Technology Definition
// ============================================================================

export interface Technology {
  name: string;
  version?: string;
  category: TechnologyCategory;
  required: boolean;
  description?: string;
  packageName?: string;
  installCommand?: string;
  configFiles?: string[];
  documentation?: string;
}

// ============================================================================
// Environment Variable Schema
// ============================================================================

export interface EnvVariable {
  key: string;
  description: string;
  required: boolean;
  default?: string;
  example?: string;
  type: "string" | "number" | "boolean" | "url" | "secret";
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  category?: "api" | "database" | "auth" | "storage" | "other";
}

// ============================================================================
// Scaffolding Templates
// ============================================================================

export interface FileTemplate {
  path: string;
  content: string;
  templateEngine?: "handlebars" | "jinja2" | "none";
  overwritable: boolean;
}

export interface DirectoryStructure {
  path: string;
  description?: string;
  files?: FileTemplate[];
  subdirectories?: DirectoryStructure[];
}

export interface ScaffoldingTemplate {
  name: string;
  description: string;
  rootDirectory: string;
  structure: DirectoryStructure[];
  commands: {
    install?: string[];
    build?: string[];
    dev?: string[];
    test?: string[];
    deploy?: string[];
  };
  packageFiles: {
    frontend?: Record<string, any>;
    backend?: Record<string, any>;
  };
}

// ============================================================================
// Documentation Templates
// ============================================================================

export interface DocumentationTemplate {
  readme: string;
  setup: string;
  architecture: string;
  environment?: string;
  deployment?: string;
  contributing?: string;
  changelog?: string;
}

// ============================================================================
// Requirements & Scoring
// ============================================================================

export interface StackRequirements {
  complexity: ComplexityLevel;
  timeToMarket: SpeedLevel;
  scalability: ScalabilityLevel;
  teamSize: "solo" | "small" | "medium" | "large";
  budget: "low" | "medium" | "high" | "enterprise";
  maintenance: "low" | "medium" | "high";
  prerequisites?: string[];
  node_version?: string;
}

export interface StackScore {
  overall: number;
  technicalFit: number;
  learnability: number;
  ecosystem: number;
  performance: number;
  costEfficiency: number;
}

// ============================================================================
// Main Stack Profile
// ============================================================================

export interface StackProfile {
  id: string;
  name: string;
  displayName: string;
  description: string;
  tagline?: string;
  category: StackCategory;
  version: string;

  // Visual identity
  icon?: string;
  color?: string;
  badge?: string;

  // Convenience properties (optional shortcuts)
  complexity?: ComplexityLevel;
  compatibleLanguages?: string[];
  deployment?: {
    platforms?: string[];
    docker_support?: boolean;
  };

  // Technology stack
  technologies: {
    frontend?: Technology[];
    backend?: Technology[];
    database?: Technology[];
    infrastructure?: Technology[];
    testing?: Technology[];
    deployment?: Technology[];
  };

  // Features and capabilities
  features: string[];
  strengths: string[];
  limitations: string[];
  idealFor: string[];
  notIdealFor: string[];

  // Requirements and characteristics
  requirements: StackRequirements;

  // Environment configuration
  envSchema: EnvVariable[];

  // Project scaffolding
  scaffolding: ScaffoldingTemplate;

  // Documentation
  documentation: DocumentationTemplate;

  // Metadata
  popularity: number; // 0-100
  maturity: "experimental" | "stable" | "mature" | "legacy";
  communitySize: "small" | "medium" | "large" | "massive";
  lastUpdated: string; // ISO date

  // Learning resources
  resources: {
    officialDocs?: string;
    tutorials?: string[];
    videos?: string[];
    examples?: string[];
  };

  // Comparison data
  alternatives: string[]; // IDs of alternative stacks
  migrationPaths?: {
    from: string;
    difficulty: "easy" | "moderate" | "hard";
    guide?: string;
  }[];
}

// ============================================================================
// Stack Comparison
// ============================================================================

export interface StackComparison {
  stacks: StackProfile[];
  criteria: {
    name: string;
    weight: number;
    scores: Record<string, number>; // stackId -> score
  }[];
  winner?: string; // stackId
  recommendation: string;
  reasoning: string[];
}

// ============================================================================
// Stack Search & Filter
// ============================================================================

export interface StackSearchCriteria {
  query?: string;
  category?: StackCategory[];
  complexity?: ComplexityLevel[];
  features?: string[];
  technologies?: string[];
  minPopularity?: number;
  maturity?: StackProfile["maturity"][];
}

export interface StackSearchResult {
  stack: StackProfile;
  score: number;
  matchedFeatures: string[];
  matchedTechnologies: string[];
  relevanceScore: number;
}

// ============================================================================
// Project Intent (for Stack Advisor)
// ============================================================================

export interface ProjectIntent {
  name: string;
  description: string;
  type: StackCategory;

  priorities: {
    timeToMarket: number; // 0-10
    performance: number;
    safety: number;
    localFirst: number;
    aiHeavy: number;
    scalability: number;
    costSensitive: number;
  };

  team: {
    size: "solo" | "small" | "medium" | "large";
    expertise: {
      frontend?: ComplexityLevel;
      backend?: ComplexityLevel;
      mobile?: ComplexityLevel;
      ai?: ComplexityLevel;
    };
  };

  constraints?: {
    budget?: "low" | "medium" | "high" | "enterprise";
    timeline?: string;
    platforms?: ("web" | "mobile" | "desktop")[];
    deployment?: ("cloud" | "on-premise" | "hybrid")[];
  };

  existingTech?: string[];
  mustHave?: string[];
  niceToHave?: string[];
}

// ============================================================================
// API Response Types
// ============================================================================

export interface StackListResponse {
  stacks: StackProfile[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StackRecommendation {
  stack: StackProfile;
  score: StackScore;
  reasoning: string[];
  prosAndCons: {
    pros: string[];
    cons: string[];
  };
  confidence: number; // 0-100
  alternatives: {
    stackId: string;
    reason: string;
  }[];
}

export interface StackAdvisorResponse {
  recommendations: StackRecommendation[];
  projectIntent: ProjectIntent;
  reasoning: string;
  timestamp: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type PartialStackProfile = Partial<StackProfile> & {
  id: string;
  name: string;
};

export type StackProfileSummary = Pick<
  StackProfile,
  "id" | "name" | "displayName" | "description" | "category" | "icon" | "color"
>;
