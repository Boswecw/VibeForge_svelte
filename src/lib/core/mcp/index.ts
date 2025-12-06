/**
 * MCP (Model Context Protocol) Module
 *
 * Exports all MCP-related types, classes, and utilities
 */

// Core client and manager
export { McpClient } from './client';
export { McpClientManager, mcpManager } from './manager';
export type { ManagedServer } from './manager';

// All protocol types
export type {
	// JSON-RPC 2.0
	JsonRpcId,
	JsonRpcRequest,
	JsonRpcResponse,
	JsonRpcError,
	JsonRpcNotification,

	// MCP Protocol
	McpTransportType,
	McpServerInfo,
	McpCapabilities,
	McpTool,
	McpSchemaProperty,
	McpToolCallParams,
	McpToolResult,

	// MCP Methods
	McpInitializeParams,
	McpInitializeResult,
	McpToolsListResult,
	McpToolCallResult,

	// MCP Client
	McpConnectionStatus,
	McpClientConfig,
	McpClientState,

	// Events
	McpEventType,
	McpEvent,
	McpEventCallback
} from './types';

// Error codes
export { JsonRpcErrorCode } from './types';
