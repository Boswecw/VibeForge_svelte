/**
 * VibeForge V2 - Core Types Index
 *
 * Central export point for all core domain and MCP types.
 */

// Domain types
export type {
  // Workspace
  Workspace,
  WorkspaceSettings,
  // Context
  ContextKind,
  ContextSource,
  ContextBlock,
  // Prompt
  PromptTemplate,
  PromptState,
  // Models
  ModelProvider,
  Model,
  // Runs
  RunStatus,
  PromptRun,
  // Evaluations
  Evaluation,
  EvaluationCriteria,
  EvaluationResult,
  // Presets
  Preset,
  // Patterns
  Pattern,
  // API
  ApiResponse,
  ApiError,
  PaginatedResponse,
} from "./domain";

// Stack Profile types
export type {
  // Core types
  StackCategory,
  ComplexityLevel,
  SpeedLevel,
  ScalabilityLevel,
  TechnologyCategory,
  // Technology
  Technology,
  // Environment
  EnvVariable,
  // Scaffolding
  FileTemplate,
  DirectoryStructure,
  ScaffoldingTemplate,
  // Documentation
  DocumentationTemplate,
  // Requirements
  StackRequirements,
  StackScore,
  // Main profile
  StackProfile,
  PartialStackProfile,
  StackProfileSummary,
  // Comparison
  StackComparison,
  // Search
  StackSearchCriteria,
  StackSearchResult,
  // Project Intent
  ProjectIntent,
  // Responses
  StackListResponse,
  StackRecommendation,
  StackAdvisorResponse,
} from "./stack-profiles";

// MCP types
export type {
  // Server
  McpServerStatus,
  McpServer,
  McpServerCapabilities,
  // Tool
  McpToolCategory,
  McpTool,
  McpToolInputSchema,
  McpToolOutputSchema,
  McpSchemaProperty,
  McpToolExample,
  // Invocation
  McpInvocationStatus,
  McpToolInvocation,
  McpToolResult,
  McpToolError,
  // Operations
  ListServersRequest,
  ListServersResponse,
  ListToolsRequest,
  ListToolsResponse,
  InvokeToolRequest,
  InvokeToolResponse,
} from "./mcp";
