# Model Context Protocol (MCP) Integration Guide

> Complete guide for integrating and using MCP tools in VibeForge

**Version**: 5.3.0
**Last Updated**: 2025-01-26

## Table of Contents

1. [Introduction](#introduction)
2. [MCP Overview](#mcp-overview)
3. [Architecture](#architecture)
4. [Server Management](#server-management)
5. [Tool Discovery](#tool-discovery)
6. [Tool Invocation](#tool-invocation)
7. [Integration Examples](#integration-examples)
8. [Creating MCP Servers](#creating-mcp-servers)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

The Model Context Protocol (MCP) enables VibeForge to extend LLM capabilities through standardized tool interfaces. This guide covers how to integrate, manage, and use MCP servers and tools.

### What is MCP?

MCP is a protocol that allows LLMs to:
- Access external data sources
- Perform actions in external systems
- Discover and invoke tools dynamically
- Maintain consistent interfaces across providers

### VibeForge MCP Features

- **Server Discovery**: Automatically detect and connect to MCP servers
- **Tool Management**: Browse, favorite, and select tools
- **Invocation Tracking**: Monitor tool usage and performance
- **Multi-Server Support**: Connect to multiple MCP servers simultaneously

---

## MCP Overview

### Protocol Components

```
┌─────────────────┐
│   VibeForge     │
│   (MCP Client)  │
└────────┬────────┘
         │
         ├─────────> MCP Server 1 (DataForge)
         │           ├── queryKB
         │           ├── ingestDocument
         │           └── getContextBlock
         │
         ├─────────> MCP Server 2 (Web Tools)
         │           ├── webSearch
         │           ├── fetchURL
         │           └── scrapeContent
         │
         └─────────> MCP Server 3 (NeuroForge)
                     ├── routeModel
                     ├── estimateCost
                     └── listProviders
```

### Core Concepts

1. **MCP Server**: Backend service that exposes tools via MCP protocol
2. **Tool**: Specific capability (e.g., "query knowledge base", "search web")
3. **Invocation**: Execution of a tool with specific inputs
4. **Tool Schema**: JSON Schema defining tool inputs and outputs

---

## Architecture

### Store Layer

The [`toolsStore`](./api/stores/tools.md) manages all MCP state:

```typescript
import { toolsStore } from '$lib/core/stores/tools.svelte';

// Servers
toolsStore.servers           // All MCP servers
toolsStore.connectedServers  // Only connected servers

// Tools
toolsStore.tools             // All tools
toolsStore.toolsByServer     // Grouped by server
toolsStore.toolsByCategory   // Grouped by category

// Invocations
toolsStore.invocations       // Tool execution history
```

### API Client Layer

The [`mcpClient`](../src/lib/core/api/mcpClient.ts) handles protocol communication:

```typescript
import * as mcpClient from '$lib/core/api/mcpClient';

// Discover servers
const servers = await mcpClient.listServers();

// Discover tools from a server
const tools = await mcpClient.listTools(serverId);

// Invoke a tool
const result = await mcpClient.invokeTool(toolId, input);
```

### Type Definitions

Located in [`types/mcp.ts`](../src/lib/core/types/mcp.ts):

```typescript
interface McpServer {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'connected' | 'disconnected';
  endpoint: string;
  capabilities: {
    supportsToolDiscovery: boolean;
    supportsStreaming: boolean;
    supportsAuth: boolean;
  };
}

interface McpTool {
  id: string;
  serverId: string;
  name: string;
  description: string;
  category: 'query' | 'action' | 'transform' | 'utility';
  inputSchema: Record<string, any>;
  isFavorite: boolean;
}

interface McpToolInvocation {
  id: string;
  toolId: string;
  input: Record<string, any>;
  result?: any;
  status: 'pending' | 'success' | 'error';
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}
```

---

## Server Management

### Listing Servers

```typescript
import { toolsStore } from '$lib/core/stores/tools.svelte';
import * as mcpClient from '$lib/core/api/mcpClient';

// Fetch servers from backend
const servers = await mcpClient.listServers();

// Update store
toolsStore.setServers(servers);

// Access in components
const connectedServers = toolsStore.connectedServers;
```

### Adding a Server

```typescript
import { toolsStore } from '$lib/core/stores/tools.svelte';
import type { McpServer } from '$lib/core/types';

const newServer: McpServer = {
  id: crypto.randomUUID(),
  name: 'Custom MCP Server',
  description: 'My custom tools',
  version: '1.0.0',
  status: 'connected',
  endpoint: 'http://localhost:3000',
  capabilities: {
    supportsToolDiscovery: true,
    supportsStreaming: false,
    supportsAuth: false,
  },
};

toolsStore.addServer(newServer);
```

### Updating Server Status

```typescript
// Mark server as disconnected
toolsStore.updateServer('server-id', {
  status: 'disconnected',
});

// Reconnect server
async function reconnectServer(serverId: string) {
  try {
    // Attempt connection
    const status = await mcpClient.checkServerStatus(serverId);

    toolsStore.updateServer(serverId, {
      status: 'connected',
    });
  } catch (error) {
    console.error('Failed to reconnect:', error);
  }
}
```

### Removing a Server

```typescript
// Remove server (automatically removes associated tools)
toolsStore.removeServer('server-id');
```

---

## Tool Discovery

### Discovering Tools

```typescript
import { toolsStore } from '$lib/core/stores/tools.svelte';
import * as mcpClient from '$lib/core/api/mcpClient';

async function discoverTools(serverId: string) {
  try {
    // Fetch tools from server
    const tools = await mcpClient.listTools(serverId);

    // Add to store
    toolsStore.setTools(tools);

    console.log(`Discovered ${tools.length} tools`);
  } catch (error) {
    console.error('Tool discovery failed:', error);
    toolsStore.setError('Failed to discover tools');
  }
}
```

### Browsing Tools

#### By Server

```typescript
const dataforgeTools = toolsStore.getToolsByServer('dataforge-mcp');
```

#### By Category

```typescript
const toolsByCategory = toolsStore.toolsByCategory;

// Access specific category
const queryTools = toolsByCategory['query'];
const actionTools = toolsByCategory['action'];
```

#### Favorite Tools

```typescript
const favoriteTools = toolsStore.favoriteTools;
```

### Managing Favorites

```typescript
// Toggle favorite status
toolsStore.toggleFavorite('tool-id');

// Check if favorited
const tool = toolsStore.getToolById('tool-id');
if (tool?.isFavorite) {
  console.log('This is a favorite tool');
}
```

---

## Tool Invocation

### Basic Invocation

```typescript
import { toolsStore } from '$lib/core/stores/tools.svelte';
import * as mcpClient from '$lib/core/api/mcpClient';

async function invokeTool(toolId: string, input: Record<string, any>) {
  // Create invocation record
  const invocation: McpToolInvocation = {
    id: crypto.randomUUID(),
    toolId,
    input,
    status: 'pending',
    startedAt: new Date().toISOString(),
  };

  // Add to history
  toolsStore.addInvocation(invocation);

  try {
    const startTime = Date.now();

    // Invoke tool via MCP client
    const result = await mcpClient.invokeTool(toolId, input);

    // Update invocation with success
    toolsStore.updateInvocation(invocation.id, {
      result,
      status: 'success',
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    });

    return result;
  } catch (error) {
    // Update invocation with error
    toolsStore.updateInvocation(invocation.id, {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      completedAt: new Date().toISOString(),
    });

    throw error;
  }
}
```

### Example: Query Knowledge Base

```typescript
// DataForge MCP tool: queryKB
const result = await invokeTool('dataforge-queryKB', {
  query: 'What are the project requirements?',
  maxResults: 5,
});

console.log(result);
// {
//   results: [
//     { content: '...', score: 0.95 },
//     { content: '...', score: 0.87 },
//   ]
// }
```

### Example: Web Search

```typescript
// Web Tools MCP tool: webSearch
const result = await invokeTool('webtools-search', {
  query: 'Svelte 5 runes documentation',
  limit: 10,
});

console.log(result);
// {
//   results: [
//     { title: '...', url: '...', snippet: '...' },
//   ]
// }
```

### Tool Input Validation

```typescript
import type { McpTool } from '$lib/core/types';

function validateToolInput(tool: McpTool, input: Record<string, any>): boolean {
  const schema = tool.inputSchema;

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in input)) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }
  }

  // Validate types (simplified)
  if (schema.properties) {
    for (const [key, spec] of Object.entries(schema.properties)) {
      if (key in input) {
        const value = input[key];
        const expectedType = (spec as any).type;

        if (typeof value !== expectedType) {
          console.error(`Invalid type for ${key}: expected ${expectedType}`);
          return false;
        }
      }
    }
  }

  return true;
}
```

---

## Integration Examples

### Example 1: Context-Aware Search

Combine context blocks with MCP tools:

```typescript
import { toolsStore } from '$lib/core/stores/tools.svelte';
import { contextBlocksStore } from '$lib/core/stores/contextBlocks.svelte';
import * as mcpClient from '$lib/core/api/mcpClient';

async function searchWithContext(query: string) {
  // Get active context
  const activeContext = contextBlocksStore.activeBlocks
    .map(b => b.content)
    .join('\n\n');

  // Invoke search tool with context
  const result = await mcpClient.invokeTool('dataforge-queryKB', {
    query,
    context: activeContext,
    maxResults: 5,
  });

  return result;
}
```

### Example 2: Tool-Assisted Prompts

Use MCP tools to enhance prompts:

```typescript
import { promptStore } from '$lib/core/stores/prompt.svelte';
import { toolsStore } from '$lib/core/stores/tools.svelte';
import * as mcpClient from '$lib/core/api/mcpClient';

async function enhancePromptWithKB() {
  // Get current prompt
  const prompt = promptStore.resolvedPrompt;

  // Search knowledge base for relevant info
  const kbResult = await mcpClient.invokeTool('dataforge-queryKB', {
    query: prompt,
    maxResults: 3,
  });

  // Add results as context
  const enhancedContext = `
Knowledge Base Results:
${kbResult.results.map((r: any) => r.content).join('\n\n')}

Original Prompt:
${prompt}
  `;

  promptStore.setText(enhancedContext);
}
```

### Example 3: Tool Chain

Chain multiple MCP tools:

```typescript
async function processDocument(url: string) {
  // 1. Fetch document content
  const fetchResult = await mcpClient.invokeTool('webtools-fetch', {
    url,
  });

  // 2. Extract text
  const extractResult = await mcpClient.invokeTool('webtools-extract', {
    html: fetchResult.content,
  });

  // 3. Ingest into knowledge base
  const ingestResult = await mcpClient.invokeTool('dataforge-ingest', {
    content: extractResult.text,
    metadata: {
      source: url,
      timestamp: new Date().toISOString(),
    },
  });

  return ingestResult;
}
```

---

## Creating MCP Servers

### Server Specification

An MCP server must implement these endpoints:

```
GET  /mcp/tools          # List available tools
POST /mcp/invoke/:toolId # Invoke a tool
GET  /mcp/status         # Server health check
```

### Example Server (Express.js)

```typescript
import express from 'express';

const app = express();
app.use(express.json());

// List tools
app.get('/mcp/tools', (req, res) => {
  res.json([
    {
      id: 'my-tool',
      name: 'My Custom Tool',
      description: 'Does something useful',
      category: 'query',
      inputSchema: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'Input text' },
        },
        required: ['input'],
      },
    },
  ]);
});

// Invoke tool
app.post('/mcp/invoke/:toolId', async (req, res) => {
  const { toolId } = req.params;
  const { input } = req.body;

  if (toolId === 'my-tool') {
    const result = await performCustomOperation(input);
    res.json({ result });
  } else {
    res.status(404).json({ error: 'Tool not found' });
  }
});

// Health check
app.get('/mcp/status', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

app.listen(3000, () => {
  console.log('MCP server running on port 3000');
});
```

### Tool Schema Format

Use JSON Schema for input validation:

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query"
    },
    "maxResults": {
      "type": "number",
      "description": "Maximum number of results",
      "default": 10
    }
  },
  "required": ["query"]
}
```

---

## Best Practices

### Server Design

✅ **Do**:
- Implement clear error messages
- Support tool discovery endpoint
- Version your API
- Document tool schemas thoroughly
- Handle timeouts gracefully

❌ **Don't**:
- Don't expose sensitive operations without auth
- Don't return unstructured data
- Don't skip input validation
- Don't ignore MCP protocol standards

### Tool Selection

✅ **Do**:
- Organize tools by category
- Use favorites for frequently used tools
- Provide clear descriptions
- Test tools before production use

❌ **Don't**:
- Don't invoke disconnected server tools
- Don't assume all tools are fast
- Don't ignore tool errors
- Don't cache tool results indefinitely

### Error Handling

✅ **Do**:
- Track failed invocations
- Provide user-friendly error messages
- Implement retry logic for transient failures
- Log errors for debugging

❌ **Don't**:
- Don't swallow errors silently
- Don't expose internal error details to users
- Don't retry infinite times
- Don't forget to clean up failed invocations

---

## Troubleshooting

### Server Not Connecting

**Problem**: MCP server shows as "disconnected"

**Solutions**:
- Verify server is running: `curl http://localhost:3000/mcp/status`
- Check network connectivity
- Review server logs for errors
- Verify endpoint URL is correct
- Test with MCP client manually

---

### Tools Not Discovered

**Problem**: Tool list is empty after discovery

**Solutions**:
- Check server implements `/mcp/tools` endpoint
- Verify server is connected
- Review server tool registration code
- Check for errors in browser console
- Try manual tool discovery: `mcpClient.listTools(serverId)`

---

### Tool Invocation Fails

**Problem**: Tool returns error or times out

**Solutions**:
- Validate input matches tool schema
- Check tool implementation for bugs
- Verify required parameters are provided
- Increase timeout limits
- Review invocation history: `toolsStore.failedInvocations`

---

### Invocation History Missing

**Problem**: Tool invocations aren't tracked

**Solutions**:
- Ensure `toolsStore.addInvocation()` is called
- Check invocation update logic
- Verify store is persisting correctly
- Clear and reinitialize: `toolsStore.clearInvocations()`

---

## MCP Protocol Reference

### Server Capabilities

```typescript
interface McpCapabilities {
  supportsToolDiscovery: boolean;   // Can list tools dynamically
  supportsStreaming: boolean;        // Supports streaming responses
  supportsAuth: boolean;             // Requires authentication
}
```

### Tool Categories

- **`query`**: Read-only operations (search, fetch, list)
- **`action`**: State-changing operations (create, update, delete)
- **`transform`**: Data processing (convert, extract, analyze)
- **`utility`**: Helper operations (validate, format, calculate)

---

## Additional Resources

- [Tools Store API](./api/stores/tools.md)
- [MCP Types Reference](../src/lib/core/types/mcp.ts)
- [MCP Client Implementation](../src/lib/core/api/mcpClient.ts)
- [Developer Guide](./DEVELOPER_GUIDE.md)

---

**© 2025 Boswell Digital Solutions LLC**
**All Rights Reserved**
