/**
 * VibeForge V2 - MCP Tools Store
 *
 * Manages MCP servers, tools, and invocations using Svelte 5 runes.
 * Integrated with real MCP protocol implementation.
 */

import type { McpServer, McpTool, McpToolInvocation, McpToolCategory } from '$lib/core/types';
import { mcpManager } from '$lib/core/mcp/manager';
import { listServers, listTools, invokeTool } from '$lib/core/api/mcpClient';
import type { McpTool as McpProtocolTool } from '$lib/core/mcp/types';

// ============================================================================
// TOOLS STATE
// ============================================================================

interface ToolsState {
  servers: McpServer[];
  tools: McpTool[];
  invocations: McpToolInvocation[];
  selectedToolIds: string[];
  isLoading: boolean;
  error: string | null;
}

const state = $state<ToolsState>({
  servers: [],
  tools: [],
  invocations: [],
  selectedToolIds: [],
  isLoading: false,
  error: null,
});

// ============================================================================
// DERIVED STATE
// ============================================================================

const connectedServers = $derived(
  state.servers.filter((s) => s.status === 'connected')
);

const disconnectedServers = $derived(
  state.servers.filter((s) => s.status === 'disconnected')
);

const toolsByServer = $derived(
  state.tools.reduce(
    (acc, tool) => {
      if (!acc[tool.serverId]) {
        acc[tool.serverId] = [];
      }
      acc[tool.serverId].push(tool);
      return acc;
    },
    {} as Record<string, McpTool[]>
  )
);

const toolsByCategory = $derived(
  state.tools.reduce(
    (acc, tool) => {
      if (!acc[tool.category]) {
        acc[tool.category] = [];
      }
      acc[tool.category].push(tool);
      return acc;
    },
    {} as Record<McpToolCategory, McpTool[]>
  )
);

const favoriteTools = $derived(state.tools.filter((t) => t.isFavorite));

const selectedTools = $derived(
  state.tools.filter((t) => state.selectedToolIds.includes(t.id))
);

const recentInvocations = $derived(
  [...state.invocations]
    .sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    )
    .slice(0, 10)
);

const successfulInvocations = $derived(
  state.invocations.filter((i) => i.status === 'success')
);

const failedInvocations = $derived(state.invocations.filter((i) => i.status === 'error'));

// ============================================================================
// SERVER ACTIONS
// ============================================================================

function setServers(servers: McpServer[]) {
  state.servers = servers;
  state.error = null;
}

function addServer(server: McpServer) {
  state.servers = [...state.servers, server];
}

function updateServer(id: string, updates: Partial<McpServer>) {
  state.servers = state.servers.map((server) =>
    server.id === id ? { ...server, ...updates } : server
  );
}

function removeServer(id: string) {
  state.servers = state.servers.filter((server) => server.id !== id);
  // Also remove tools from this server
  state.tools = state.tools.filter((tool) => tool.serverId !== id);
}

function getServerById(id: string): McpServer | undefined {
  return state.servers.find((server) => server.id === id);
}

// ============================================================================
// TOOL ACTIONS
// ============================================================================

function setTools(tools: McpTool[]) {
  state.tools = tools;
  state.error = null;
}

function addTool(tool: McpTool) {
  state.tools = [...state.tools, tool];
}

function updateTool(id: string, updates: Partial<McpTool>) {
  state.tools = state.tools.map((tool) => (tool.id === id ? { ...tool, ...updates } : tool));
}

function removeTool(id: string) {
  state.tools = state.tools.filter((tool) => tool.id !== id);
  state.selectedToolIds = state.selectedToolIds.filter((selectedId) => selectedId !== id);
}

function toggleFavorite(id: string) {
  state.tools = state.tools.map((tool) =>
    tool.id === id ? { ...tool, isFavorite: !tool.isFavorite } : tool
  );
}

function selectTool(id: string) {
  if (!state.selectedToolIds.includes(id)) {
    state.selectedToolIds = [...state.selectedToolIds, id];
  }
}

function deselectTool(id: string) {
  state.selectedToolIds = state.selectedToolIds.filter((selectedId) => selectedId !== id);
}

function toggleToolSelection(id: string) {
  if (state.selectedToolIds.includes(id)) {
    deselectTool(id);
  } else {
    selectTool(id);
  }
}

function clearToolSelection() {
  state.selectedToolIds = [];
}

function getToolById(id: string): McpTool | undefined {
  return state.tools.find((tool) => tool.id === id);
}

function getToolsByServer(serverId: string): McpTool[] {
  return state.tools.filter((tool) => tool.serverId === serverId);
}

// ============================================================================
// INVOCATION ACTIONS
// ============================================================================

function setInvocations(invocations: McpToolInvocation[]) {
  state.invocations = invocations;
}

function addInvocation(invocation: McpToolInvocation) {
  state.invocations = [invocation, ...state.invocations];
}

function updateInvocation(id: string, updates: Partial<McpToolInvocation>) {
  state.invocations = state.invocations.map((inv) =>
    inv.id === id ? { ...inv, ...updates } : inv
  );
}

function clearInvocations() {
  state.invocations = [];
}

function getInvocationById(id: string): McpToolInvocation | undefined {
  return state.invocations.find((inv) => inv.id === id);
}

// ============================================================================
// GENERAL ACTIONS
// ============================================================================

function setLoading(loading: boolean) {
  state.isLoading = loading;
}

function setError(error: string | null) {
  state.error = error;
}

// ============================================================================
// MCP INTEGRATION ACTIONS
// ============================================================================

/**
 * Sync servers and tools from MCP manager
 * Call this to refresh the store with live MCP data
 */
async function syncFromMcpManager() {
  try {
    setLoading(true);
    setError(null);

    // Fetch servers from MCP client
    const { servers: mcpServers } = await listServers({ includeDisconnected: true });
    setServers(mcpServers);

    // Fetch tools for each connected server
    const allTools: McpTool[] = [];
    for (const server of mcpServers.filter(s => s.status === 'connected')) {
      try {
        const { tools } = await listTools({ serverId: server.id });
        allTools.push(...tools);
      } catch (error) {
        console.error(`Failed to list tools for ${server.name}:`, error);
      }
    }
    setTools(allTools);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to sync MCP data';
    setError(errorMessage);
    console.error('MCP sync error:', error);
  } finally {
    setLoading(false);
  }
}

/**
 * Invoke a tool and add the result to invocations
 */
async function invokeToolById(toolId: string, args: Record<string, unknown> = {}) {
  const tool = getToolById(toolId);
  if (!tool) {
    throw new Error(`Tool not found: ${toolId}`);
  }

  try {
    const { invocation } = await invokeTool({
      serverId: tool.serverId,
      toolName: tool.name,
      args
    });

    addInvocation(invocation);
    return invocation;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Tool invocation failed';
    throw new Error(errorMessage);
  }
}

/**
 * Subscribe to MCP manager changes and auto-sync
 * Call this once during app initialization
 */
function subscribeToMcpChanges() {
  mcpManager.onChange(() => {
    // Auto-sync when MCP state changes (connections, tools, etc.)
    syncFromMcpManager();
  });
}

/**
 * Manually refresh tools for a specific server
 */
async function refreshServerTools(serverId: string) {
  try {
    const { tools } = await listTools({ serverId });

    // Remove old tools from this server
    state.tools = state.tools.filter(t => t.serverId !== serverId);

    // Add new tools
    state.tools = [...state.tools, ...tools];
  } catch (error) {
    console.error(`Failed to refresh tools for ${serverId}:`, error);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const toolsStore = {
  // State
  get servers() {
    return state.servers;
  },
  get tools() {
    return state.tools;
  },
  get invocations() {
    return state.invocations;
  },
  get selectedToolIds() {
    return state.selectedToolIds;
  },
  get isLoading() {
    return state.isLoading;
  },
  get error() {
    return state.error;
  },
  // Derived
  get connectedServers() {
    return connectedServers;
  },
  get disconnectedServers() {
    return disconnectedServers;
  },
  get toolsByServer() {
    return toolsByServer;
  },
  get toolsByCategory() {
    return toolsByCategory;
  },
  get favoriteTools() {
    return favoriteTools;
  },
  get selectedTools() {
    return selectedTools;
  },
  get recentInvocations() {
    return recentInvocations;
  },
  get successfulInvocations() {
    return successfulInvocations;
  },
  get failedInvocations() {
    return failedInvocations;
  },
  // Server Actions
  setServers,
  addServer,
  updateServer,
  removeServer,
  getServerById,
  // Tool Actions
  setTools,
  addTool,
  updateTool,
  removeTool,
  toggleFavorite,
  selectTool,
  deselectTool,
  toggleToolSelection,
  clearToolSelection,
  getToolById,
  getToolsByServer,
  // Invocation Actions
  setInvocations,
  addInvocation,
  updateInvocation,
  clearInvocations,
  getInvocationById,
  // General Actions
  setLoading,
  setError,
  // MCP Integration Actions
  syncFromMcpManager,
  invokeToolById,
  subscribeToMcpChanges,
  refreshServerTools,
};
