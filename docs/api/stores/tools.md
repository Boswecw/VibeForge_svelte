# Tools Store API

> Manages MCP servers, tools, and invocations for protocol integration

**File**: [`src/lib/core/stores/tools.svelte.ts`](../../../src/lib/core/stores/tools.svelte.ts)
**Test File**: [`src/tests/stores/tools.test.ts`](../../../src/tests/stores/tools.test.ts)
**Test Coverage**: 57 tests

## Overview

The `toolsStore` manages Model Context Protocol (MCP) servers, their tools, and tool invocations. It provides comprehensive management for MCP integration including server discovery, tool categorization, and invocation tracking.

## State Interface

```typescript
interface ToolsState {
  servers: McpServer[];
  tools: McpTool[];
  invocations: McpToolInvocation[];
  selectedToolIds: string[];
  isLoading: boolean;
  error: string | null;
}
```

## API Reference

### State Getters

| Property | Type | Description |
|----------|------|-------------|
| `toolsStore.servers` | `McpServer[]` | All MCP servers |
| `toolsStore.tools` | `McpTool[]` | All available tools |
| `toolsStore.invocations` | `McpToolInvocation[]` | Tool invocation history |
| `toolsStore.selectedToolIds` | `string[]` | IDs of selected tools |
| `toolsStore.isLoading` | `boolean` | Loading state |
| `toolsStore.error` | `string \| null` | Error message if any |

### Derived State

| Property | Type | Description |
|----------|------|-------------|
| `toolsStore.connectedServers` | `McpServer[]` | Only connected servers |
| `toolsStore.disconnectedServers` | `McpServer[]` | Only disconnected servers |
| `toolsStore.toolsByServer` | `Record<string, McpTool[]>` | Tools grouped by server ID |
| `toolsStore.toolsByCategory` | `Record<McpToolCategory, McpTool[]>` | Tools grouped by category |
| `toolsStore.favoriteTools` | `McpTool[]` | Only favorited tools |
| `toolsStore.selectedTools` | `McpTool[]` | Full objects of selected tools |
| `toolsStore.recentInvocations` | `McpToolInvocation[]` | 10 most recent invocations |
| `toolsStore.successfulInvocations` | `McpToolInvocation[]` | Only successful invocations |
| `toolsStore.failedInvocations` | `McpToolInvocation[]` | Only failed invocations |

### Actions

#### Server Management

```typescript
toolsStore.setServers(servers: McpServer[]): void
toolsStore.addServer(server: McpServer): void
toolsStore.updateServer(id: string, updates: Partial<McpServer>): void
toolsStore.removeServer(id: string): void  // Cascade deletes tools
toolsStore.getServerById(id: string): McpServer | undefined
```

#### Tool Management

```typescript
toolsStore.setTools(tools: McpTool[]): void
toolsStore.addTool(tool: McpTool): void
toolsStore.updateTool(id: string, updates: Partial<McpTool>): void
toolsStore.removeTool(id: string): void
toolsStore.toggleFavorite(id: string): void
toolsStore.getToolById(id: string): McpTool | undefined
toolsStore.getToolsByServer(serverId: string): McpTool[]
```

#### Tool Selection

```typescript
toolsStore.selectTool(id: string): void
toolsStore.deselectTool(id: string): void
toolsStore.toggleToolSelection(id: string): void
toolsStore.clearToolSelection(): void
```

#### Invocation Management

```typescript
toolsStore.setInvocations(invocations: McpToolInvocation[]): void
toolsStore.addInvocation(invocation: McpToolInvocation): void
toolsStore.updateInvocation(id: string, updates: Partial<McpToolInvocation>): void
toolsStore.clearInvocations(): void
toolsStore.getInvocationById(id: string): McpToolInvocation | undefined
```

#### Utility

```typescript
toolsStore.setLoading(loading: boolean): void
toolsStore.setError(error: string | null): void
```

## Usage Examples

### Server Status Display

```svelte
<script lang="ts">
  import { toolsStore } from '$lib/core/stores/tools.svelte';

  const connectedServers = $derived(toolsStore.connectedServers);
  const disconnectedServers = $derived(toolsStore.disconnectedServers);
</script>

<div class="mcp-servers">
  <h3>MCP Servers</h3>

  <section>
    <h4>Connected ({connectedServers.length})</h4>
    {#each connectedServers as server}
      <div class="server-card connected">
        <h5>{server.name}</h5>
        <p>{server.description}</p>
        <span class="version">v{server.version}</span>
        <span class="endpoint">{server.endpoint}</span>
        <div class="capabilities">
          {#if server.capabilities.supportsToolDiscovery}
            <span class="capability">Tool Discovery</span>
          {/if}
          {#if server.capabilities.supportsStreaming}
            <span class="capability">Streaming</span>
          {/if}
        </div>
      </div>
    {/each}
  </section>

  <section>
    <h4>Disconnected ({disconnectedServers.length})</h4>
    {#each disconnectedServers as server}
      <div class="server-card disconnected">
        <h5>{server.name}</h5>
        <button onclick={() => reconnectServer(server.id)}>Reconnect</button>
      </div>
    {/each}
  </section>
</div>
```

### Tools by Category

```svelte
<script lang="ts">
  import { toolsStore } from '$lib/core/stores/tools.svelte';

  const toolsByCategory = $derived(toolsStore.toolsByCategory);
</script>

<div class="tools-by-category">
  {#each Object.entries(toolsByCategory) as [category, tools]}
    <section class="category-section">
      <h3>{category} ({tools.length})</h3>

      <div class="tools-grid">
        {#each tools as tool}
          <div class="tool-card">
            <div class="tool-header">
              <h4>{tool.name}</h4>
              <button
                class="favorite-btn"
                class:favorited={tool.isFavorite}
                onclick={() => toolsStore.toggleFavorite(tool.id)}
              >
                {tool.isFavorite ? '⭐' : '☆'}
              </button>
            </div>

            <p>{tool.description}</p>

            <div class="tool-meta">
              <span class="server">
                {toolsStore.getServerById(tool.serverId)?.name}
              </span>
              <span class="category">{tool.category}</span>
            </div>

            <button onclick={() => toolsStore.selectTool(tool.id)}>
              Select Tool
            </button>
          </div>
        {/each}
      </div>
    </section>
  {/each}
</div>
```

### Favorite Tools Toolbar

```svelte
<script lang="ts">
  import { toolsStore } from '$lib/core/stores/tools.svelte';

  const favoriteTools = $derived(toolsStore.favoriteTools);
</script>

<div class="favorites-toolbar">
  <h4>Favorite Tools</h4>
  <div class="favorites-list">
    {#each favoriteTools as tool}
      <button
        class="tool-button"
        onclick={() => invokeTool(tool)}
        title={tool.description}
      >
        {tool.name}
      </button>
    {/each}

    {#if favoriteTools.length === 0}
      <p class="empty-state">No favorite tools yet. Star tools to add them here.</p>
    {/if}
  </div>
</div>
```

### Tool Invocation History

```svelte
<script lang="ts">
  import { toolsStore } from '$lib/core/stores/tools.svelte';

  const recentInvocations = $derived(toolsStore.recentInvocations);
  const successfulInvocations = $derived(toolsStore.successfulInvocations);
  const failedInvocations = $derived(toolsStore.failedInvocations);
</script>

<div class="invocation-history">
  <div class="history-stats">
    <span>Total: {toolsStore.invocations.length}</span>
    <span>Success: {successfulInvocations.length}</span>
    <span>Failed: {failedInvocations.length}</span>
  </div>

  <h3>Recent Invocations</h3>
  {#each recentInvocations as invocation}
    {@const tool = toolsStore.getToolById(invocation.toolId)}
    <div class="invocation-card" class:error={invocation.status === 'error'}>
      <div class="invocation-header">
        <h4>{tool?.name || 'Unknown Tool'}</h4>
        <span class="status status-{invocation.status}">{invocation.status}</span>
      </div>

      <div class="invocation-details">
        <p class="timestamp">{new Date(invocation.startedAt).toLocaleString()}</p>

        {#if invocation.durationMs}
          <span class="duration">{invocation.durationMs}ms</span>
        {/if}

        {#if invocation.error}
          <p class="error-message">{invocation.error}</p>
        {/if}

        {#if invocation.result}
          <details>
            <summary>View Result</summary>
            <pre>{JSON.stringify(invocation.result, null, 2)}</pre>
          </details>
        {/if}
      </div>
    </div>
  {/each}
</div>
```

### Tools by Server

```svelte
<script lang="ts">
  import { toolsStore } from '$lib/core/stores/tools.svelte';

  const toolsByServer = $derived(toolsStore.toolsByServer);
</script>

<div class="tools-by-server">
  {#each toolsStore.servers as server}
    {@const serverTools = toolsByServer[server.id] || []}
    <section class="server-section">
      <div class="server-header">
        <h3>{server.name}</h3>
        <span class="status status-{server.status}">{server.status}</span>
        <span class="tool-count">{serverTools.length} tools</span>
      </div>

      {#if serverTools.length > 0}
        <div class="tools-list">
          {#each serverTools as tool}
            <div class="tool-item">
              <span class="tool-name">{tool.name}</span>
              <span class="tool-category">{tool.category}</span>
              <label>
                <input
                  type="checkbox"
                  checked={toolsStore.selectedToolIds.includes(tool.id)}
                  onchange={() => toolsStore.toggleToolSelection(tool.id)}
                />
                Select
              </label>
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty-state">No tools available from this server</p>
      {/if}
    </section>
  {/each}
</div>
```

### Selected Tools Panel

```svelte
<script lang="ts">
  import { toolsStore } from '$lib/core/stores/tools.svelte';

  const selectedTools = $derived(toolsStore.selectedTools);
</script>

<div class="selected-tools-panel">
  <h3>Selected Tools ({selectedTools.length})</h3>

  {#if selectedTools.length > 0}
    <div class="selected-list">
      {#each selectedTools as tool}
        <div class="selected-tool">
          <span>{tool.name}</span>
          <button onclick={() => toolsStore.deselectTool(tool.id)}>
            Remove
          </button>
        </div>
      {/each}
    </div>

    <button onclick={() => toolsStore.clearToolSelection()}>
      Clear All
    </button>
  {:else}
    <p class="empty-state">No tools selected</p>
  {/if}
</div>
```

## Type Definitions

### McpServer

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
```

### McpTool

```typescript
interface McpTool {
  id: string;
  serverId: string;
  name: string;
  description: string;
  category: McpToolCategory;
  inputSchema: Record<string, any>;
  isFavorite: boolean;
}

type McpToolCategory = 'query' | 'action' | 'transform' | 'utility';
```

### McpToolInvocation

```typescript
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

## Cascade Deletion

When removing a server, all associated tools are automatically removed:

```typescript
// Remove server with ID "server-1"
toolsStore.removeServer("server-1");

// All tools with serverId === "server-1" are also removed
// Selected tool IDs are cleaned up automatically
```

## MCP Integration

The tools store integrates with MCP protocol endpoints:

```typescript
import * as mcpClient from '$lib/core/api/mcpClient';

// List servers
const servers = await mcpClient.listServers();
toolsStore.setServers(servers);

// Discover tools from a server
const tools = await mcpClient.listTools(serverId);
toolsStore.setTools(tools);

// Invoke a tool
const result = await mcpClient.invokeTool(toolId, input);
```

## Best Practices

### ✅ Do

- Use `connectedServers` to show only active servers
- Group tools by category or server for better UX
- Track invocation history for debugging
- Use favorites for frequently used tools
- Check server status before invoking tools

### ❌ Don't

- Don't mutate server/tool objects directly
- Don't invoke tools from disconnected servers
- Don't forget to handle invocation errors
- Don't assume all tools have the same input schema
- Don't bypass cascade deletion (use `removeServer()`)

## Common Patterns

### Server Connection Status

```typescript
const server = toolsStore.getServerById('server-1');
if (server?.status === 'connected') {
  // Safe to use tools from this server
}
```

### Tool Discovery

```typescript
// Get all tools from a specific server
const dataforgeTools = toolsStore.getToolsByServer('dataforge-mcp');

// Get all query tools
const queryTools = toolsStore.toolsByCategory['query'];
```

### Invocation Tracking

```typescript
// Add invocation when starting
const invocation: McpToolInvocation = {
  id: crypto.randomUUID(),
  toolId: 'tool-1',
  input: { query: 'test' },
  status: 'pending',
  startedAt: new Date().toISOString(),
};
toolsStore.addInvocation(invocation);

// Update when complete
toolsStore.updateInvocation(invocation.id, {
  status: 'success',
  result: { data: '...' },
  completedAt: new Date().toISOString(),
  durationMs: 150,
});
```

---

**Last Updated**: 2025-01-26
**Version**: 5.3.0
**Test Coverage**: 57 tests (servers, tools, invocations, cascade deletion)
