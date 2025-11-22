/**
 * VibeForge V2 - Model Context Protocol (MCP) Types
 *
 * These types represent MCP servers, tools, and invocations.
 * For Phase 1, these are simplified versions to support the architecture.
 * In later phases, we'll implement full MCP protocol support.
 *
 * MCP allows VibeForge to discover and invoke tools from various backends:
 * - DataForge (knowledge base queries)
 * - NeuroForge (model routing)
 * - External services (web search, code analysis, etc.)
 */

// ============================================================================
// MCP SERVER
// ============================================================================

export type McpServerStatus = 'connected' | 'disconnected' | 'error';

export interface McpServer {
  id: string;
  name: string;
  description: string;
  version: string;
  status: McpServerStatus;
  endpoint: string;
  capabilities: McpServerCapabilities;
  metadata?: Record<string, unknown>;
}

export interface McpServerCapabilities {
  supportsToolDiscovery: boolean;
  supportsStreaming: boolean;
  supportsAuth: boolean;
}

// ============================================================================
// MCP TOOL
// ============================================================================

export type McpToolCategory = 'query' | 'transform' | 'generate' | 'analyze' | 'system';

export interface McpTool {
  id: string;
  serverId: string;
  name: string;
  description: string;
  category: McpToolCategory;
  inputSchema: McpToolInputSchema;
  outputSchema?: McpToolOutputSchema;
  examples?: McpToolExample[];
  isFavorite?: boolean;
  metadata?: Record<string, unknown>;
}

export interface McpToolInputSchema {
  type: 'object';
  properties: Record<string, McpSchemaProperty>;
  required?: string[];
}

export interface McpToolOutputSchema {
  type: 'object';
  properties: Record<string, McpSchemaProperty>;
}

export interface McpSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: unknown[];
  items?: McpSchemaProperty;
  properties?: Record<string, McpSchemaProperty>;
}

export interface McpToolExample {
  input: Record<string, unknown>;
  output: unknown;
  description?: string;
}

// ============================================================================
// MCP TOOL INVOCATION
// ============================================================================

export type McpInvocationStatus = 'pending' | 'running' | 'success' | 'error';

export interface McpToolInvocation {
  id: string;
  toolId: string;
  serverId: string;
  args: Record<string, unknown>;
  status: McpInvocationStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  result?: McpToolResult;
  error?: McpToolError;
}

export interface McpToolResult {
  data: unknown;
  metadata?: Record<string, unknown>;
}

export interface McpToolError {
  code: string;
  message: string;
  details?: unknown;
}

// ============================================================================
// MCP CLIENT OPERATIONS
// ============================================================================

export interface ListServersRequest {
  includeDisconnected?: boolean;
}

export interface ListServersResponse {
  servers: McpServer[];
}

export interface ListToolsRequest {
  serverId: string;
  category?: McpToolCategory;
}

export interface ListToolsResponse {
  tools: McpTool[];
}

export interface InvokeToolRequest {
  serverId: string;
  toolName: string;
  args: Record<string, unknown>;
  timeout?: number;
}

export interface InvokeToolResponse {
  invocation: McpToolInvocation;
}
