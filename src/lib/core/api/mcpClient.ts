/**
 * VibeForge V2 - MCP Client
 *
 * This client implements the Model Context Protocol for discovering and invoking tools.
 * For Phase 1, all methods return mock data to demonstrate the architecture.
 *
 * Later phases will implement real MCP protocol communication.
 *
 * MCP Flow:
 * 1. listServers() - Discover available MCP servers
 * 2. listTools(serverId) - List tools provided by a server
 * 3. invokeTool(serverId, toolName, args) - Execute a tool
 */

import type {
  McpServer,
  McpTool,
  McpToolInvocation,
  ListServersRequest,
  ListServersResponse,
  ListToolsRequest,
  ListToolsResponse,
  InvokeToolRequest,
  InvokeToolResponse,
} from '$lib/core/types';

// ============================================================================
// SERVER DISCOVERY
// ============================================================================

export async function listServers(
  request: ListServersRequest = {}
): Promise<ListServersResponse> {
  await delay(300);

  const servers: McpServer[] = [
    {
      id: 'mcp_dataforge',
      name: 'DataForge MCP',
      description: 'Knowledge base queries and context management',
      version: '1.0.0',
      status: 'connected',
      endpoint: 'http://localhost:8001/mcp',
      capabilities: {
        supportsToolDiscovery: true,
        supportsStreaming: false,
        supportsAuth: true,
      },
    },
    {
      id: 'mcp_neuroforge',
      name: 'NeuroForge MCP',
      description: 'Model routing and execution',
      version: '1.0.0',
      status: 'connected',
      endpoint: 'http://localhost:8002/mcp',
      capabilities: {
        supportsToolDiscovery: true,
        supportsStreaming: true,
        supportsAuth: true,
      },
    },
    {
      id: 'mcp_web',
      name: 'Web Tools MCP',
      description: 'Web search, scraping, and content extraction',
      version: '0.9.0',
      status: 'disconnected',
      endpoint: 'http://localhost:8003/mcp',
      capabilities: {
        supportsToolDiscovery: true,
        supportsStreaming: false,
        supportsAuth: false,
      },
    },
  ];

  const filtered = request.includeDisconnected
    ? servers
    : servers.filter((s) => s.status === 'connected');

  return {
    servers: filtered,
  };
}

// ============================================================================
// TOOL DISCOVERY
// ============================================================================

export async function listTools(request: ListToolsRequest): Promise<ListToolsResponse> {
  await delay(300);

  const toolsByServer: Record<string, McpTool[]> = {
    mcp_dataforge: [
      {
        id: 'tool_query_kb',
        serverId: 'mcp_dataforge',
        name: 'queryKnowledgeBase',
        description: 'Search the knowledge base using vector similarity',
        category: 'query',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query text',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 10)',
            },
            workspaceId: {
              type: 'string',
              description: 'Optional workspace ID to filter results',
            },
          },
          required: ['query'],
        },
        examples: [
          {
            input: { query: 'Svelte 5 runes', limit: 5 },
            output: { results: ['...'], count: 3 },
            description: 'Search for Svelte 5 documentation',
          },
        ],
        isFavorite: false,
      },
      {
        id: 'tool_get_context',
        serverId: 'mcp_dataforge',
        name: 'getContextBlock',
        description: 'Retrieve a specific context block by ID',
        category: 'query',
        inputSchema: {
          type: 'object',
          properties: {
            contextId: {
              type: 'string',
              description: 'Context block ID',
            },
          },
          required: ['contextId'],
        },
        isFavorite: false,
      },
      {
        id: 'tool_ingest_doc',
        serverId: 'mcp_dataforge',
        name: 'ingestDocument',
        description: 'Ingest and index a new document',
        category: 'transform',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'Document content',
            },
            title: {
              type: 'string',
              description: 'Document title',
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata',
            },
          },
          required: ['content', 'title'],
        },
        isFavorite: false,
      },
    ],
    mcp_neuroforge: [
      {
        id: 'tool_route_model',
        serverId: 'mcp_neuroforge',
        name: 'routeToModel',
        description: 'Route a prompt to the best available model',
        category: 'analyze',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The prompt to execute',
            },
            constraints: {
              type: 'object',
              description: 'Routing constraints (cost, speed, quality)',
            },
          },
          required: ['prompt'],
        },
        isFavorite: true,
      },
      {
        id: 'tool_exec_prompt',
        serverId: 'mcp_neuroforge',
        name: 'executePrompt',
        description: 'Execute a prompt on specified models',
        category: 'generate',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The prompt to execute',
            },
            modelIds: {
              type: 'array',
              description: 'List of model IDs',
              items: {
                type: 'string',
              },
            },
            stream: {
              type: 'boolean',
              description: 'Enable streaming responses',
            },
          },
          required: ['prompt', 'modelIds'],
        },
        isFavorite: true,
      },
    ],
    mcp_web: [
      {
        id: 'tool_web_search',
        serverId: 'mcp_web',
        name: 'webSearch',
        description: 'Search the web and return results',
        category: 'query',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            maxResults: {
              type: 'number',
              description: 'Maximum results to return',
            },
          },
          required: ['query'],
        },
        isFavorite: false,
      },
    ],
  };

  const tools = toolsByServer[request.serverId] || [];

  const filtered = request.category
    ? tools.filter((t) => t.category === request.category)
    : tools;

  return {
    tools: filtered,
  };
}

// ============================================================================
// TOOL INVOCATION
// ============================================================================

export async function invokeTool(
  request: InvokeToolRequest
): Promise<InvokeToolResponse> {
  const startedAt = new Date().toISOString();
  await delay(1000 + Math.random() * 500);

  const invocation: McpToolInvocation = {
    id: `inv_${Date.now()}`,
    toolId: `tool_${request.toolName}`,
    serverId: request.serverId,
    args: request.args,
    status: 'success',
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs: 1200,
    result: {
      data: generateMockToolResult(request.toolName, request.args),
      metadata: {
        source: 'mock',
        phase: 1,
      },
    },
  };

  return {
    invocation,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateMockToolResult(toolName: string, args: Record<string, unknown>): unknown {
  // Generate contextual mock data based on tool name
  switch (toolName) {
    case 'queryKnowledgeBase':
      return {
        results: [
          {
            id: 'ctx_svelte5',
            title: 'Svelte 5 Runes',
            relevance: 0.92,
            snippet: 'Svelte 5 introduces runes for reactivity: $state, $derived...',
          },
        ],
        count: 1,
        query: args.query,
      };

    case 'getContextBlock':
      return {
        id: args.contextId,
        title: 'Mock Context Block',
        content: 'This is mock content for demonstration',
      };

    case 'routeToModel':
      return {
        recommendedModel: 'claude-3.5-sonnet',
        reasoning: 'Best balance of quality and cost for this prompt type',
        alternatives: ['gpt-4o', 'claude-3.5-haiku'],
      };

    case 'executePrompt':
      return {
        outputs: (args.modelIds as string[]).map((modelId) => ({
          modelId,
          response: `Mock response from ${modelId}`,
          tokens: 250,
        })),
      };

    case 'webSearch':
      return {
        results: [
          {
            title: 'Mock Search Result',
            url: 'https://example.com',
            snippet: 'This is a mock search result for demonstration purposes',
          },
        ],
        query: args.query,
      };

    default:
      return {
        message: 'Mock tool result',
        args,
      };
  }
}
