/**
 * VibeForge V2 - API Clients Index
 *
 * Central export point for all API clients.
 * VibeForge frontend consumes only NeuroForge and DataForge backends.
 */

// NeuroForge Client (LLM execution, versioning, deployments)
export * as neuroforgeClient from "./neuroforgeClient";

// Prompts Client (Prompt CRUD operations)
export * as promptsClient from "./promptsClient";

// Versions Client (Version control operations)
export * as versionsClient from "./versionsClient";

// Estimation Client (Token counting and cost estimation)
export * as estimationClient from "./estimationClient";

// DataForge Client (Context, analytics, storage)
export * as dataforgeClient from "./dataforgeClient";

// MCP Client (Model Context Protocol)
export * as mcpClient from "./mcpClient";
