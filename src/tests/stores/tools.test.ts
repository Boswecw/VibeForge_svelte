import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { toolsStore } from "$lib/core/stores/tools.svelte";
import type { McpServer, McpTool, McpToolInvocation } from "$lib/core/types";

describe("Tools Store", () => {
  const mockServer1: McpServer = {
    id: "server-1",
    name: "File System Server",
    description: "MCP server for file operations",
    version: "1.0.0",
    status: "connected",
    endpoint: "http://localhost:3001",
    capabilities: {
      supportsToolDiscovery: true,
      supportsStreaming: false,
      supportsAuth: false,
    },
  };

  const mockServer2: McpServer = {
    id: "server-2",
    name: "Database Server",
    description: "MCP server for database operations",
    version: "2.0.0",
    status: "disconnected",
    endpoint: "http://localhost:3002",
    capabilities: {
      supportsToolDiscovery: true,
      supportsStreaming: true,
      supportsAuth: true,
    },
  };

  const mockTool1: McpTool = {
    id: "tool-1",
    serverId: "server-1",
    name: "read_file",
    description: "Read contents of a file",
    category: "query",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path" },
      },
      required: ["path"],
    },
    isFavorite: true,
  };

  const mockTool2: McpTool = {
    id: "tool-2",
    serverId: "server-1",
    name: "write_file",
    description: "Write contents to a file",
    category: "transform",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        content: { type: "string" },
      },
    },
    isFavorite: false,
  };

  const mockTool3: McpTool = {
    id: "tool-3",
    serverId: "server-2",
    name: "query_db",
    description: "Execute database query",
    category: "query",
    inputSchema: {
      type: "object",
      properties: {
        sql: { type: "string" },
      },
    },
    isFavorite: true,
  };

  const mockInvocation1: McpToolInvocation = {
    id: "inv-1",
    toolId: "tool-1",
    serverId: "server-1",
    args: { path: "/test.txt" },
    status: "success",
    startedAt: "2025-01-01T10:00:00Z",
    completedAt: "2025-01-01T10:00:01Z",
    durationMs: 1000,
    result: { data: "File contents" },
  };

  const mockInvocation2: McpToolInvocation = {
    id: "inv-2",
    toolId: "tool-2",
    serverId: "server-1",
    args: { path: "/test.txt", content: "New content" },
    status: "error",
    startedAt: "2025-01-01T10:05:00Z",
    error: { code: "ERR_PERM", message: "Permission denied" },
  };

  beforeEach(() => {
    // Clear state before each test
    toolsStore.setServers([]);
    toolsStore.setTools([]);
    toolsStore.setInvocations([]);
    toolsStore.clearToolSelection();
    toolsStore.setError(null);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  describe("Initialization", () => {
    it("should initialize with empty state", () => {
      expect(toolsStore.servers).toEqual([]);
      expect(toolsStore.tools).toEqual([]);
      expect(toolsStore.invocations).toEqual([]);
      expect(toolsStore.selectedToolIds).toEqual([]);
      expect(toolsStore.isLoading).toBe(false);
      expect(toolsStore.error).toBeNull();
    });

    it("should initialize derived state correctly", () => {
      expect(toolsStore.connectedServers).toEqual([]);
      expect(toolsStore.disconnectedServers).toEqual([]);
      expect(toolsStore.toolsByServer).toEqual({});
      expect(toolsStore.toolsByCategory).toEqual({});
      expect(toolsStore.favoriteTools).toEqual([]);
      expect(toolsStore.selectedTools).toEqual([]);
      expect(toolsStore.recentInvocations).toEqual([]);
      expect(toolsStore.successfulInvocations).toEqual([]);
      expect(toolsStore.failedInvocations).toEqual([]);
    });
  });

  // ============================================================================
  // SERVER ACTIONS
  // ============================================================================

  describe("setServers", () => {
    it("should set servers array", () => {
      const servers = [mockServer1, mockServer2];
      toolsStore.setServers(servers);

      expect(toolsStore.servers).toEqual(servers);
    });

    it("should clear error when setting servers", () => {
      toolsStore.setError("Test error");
      toolsStore.setServers([mockServer1]);

      expect(toolsStore.error).toBeNull();
    });
  });

  describe("addServer", () => {
    it("should add a new server", () => {
      toolsStore.addServer(mockServer1);

      expect(toolsStore.servers).toHaveLength(1);
      expect(toolsStore.servers[0]).toEqual(mockServer1);
    });

    it("should append to existing servers", () => {
      toolsStore.setServers([mockServer1]);
      toolsStore.addServer(mockServer2);

      expect(toolsStore.servers).toHaveLength(2);
      expect(toolsStore.servers[1]).toEqual(mockServer2);
    });
  });

  describe("updateServer", () => {
    beforeEach(() => {
      toolsStore.setServers([mockServer1, mockServer2]);
    });

    it("should update server properties", () => {
      toolsStore.updateServer("server-1", { status: "disconnected" });

      const server = toolsStore.getServerById("server-1");
      expect(server?.status).toBe("disconnected");
    });

    it("should not affect other servers", () => {
      toolsStore.updateServer("server-1", { status: "disconnected" });

      const otherServer = toolsStore.getServerById("server-2");
      expect(otherServer?.status).toBe("disconnected");
    });
  });

  describe("removeServer", () => {
    beforeEach(() => {
      toolsStore.setServers([mockServer1, mockServer2]);
      toolsStore.setTools([mockTool1, mockTool2, mockTool3]);
    });

    it("should remove server", () => {
      toolsStore.removeServer("server-1");

      expect(toolsStore.servers).toHaveLength(1);
      expect(toolsStore.getServerById("server-1")).toBeUndefined();
    });

    it("should remove tools from server", () => {
      toolsStore.removeServer("server-1");

      const remainingTools = toolsStore.tools;
      expect(remainingTools).toHaveLength(1);
      expect(remainingTools.every(t => t.serverId !== "server-1")).toBe(true);
    });
  });

  describe("getServerById", () => {
    beforeEach(() => {
      toolsStore.setServers([mockServer1, mockServer2]);
    });

    it("should return server when found", () => {
      const server = toolsStore.getServerById("server-1");
      expect(server).toEqual(mockServer1);
    });

    it("should return undefined when not found", () => {
      const server = toolsStore.getServerById("non-existent");
      expect(server).toBeUndefined();
    });
  });

  // ============================================================================
  // TOOL ACTIONS
  // ============================================================================

  describe("setTools", () => {
    it("should set tools array", () => {
      const tools = [mockTool1, mockTool2];
      toolsStore.setTools(tools);

      expect(toolsStore.tools).toEqual(tools);
    });

    it("should clear error when setting tools", () => {
      toolsStore.setError("Test error");
      toolsStore.setTools([mockTool1]);

      expect(toolsStore.error).toBeNull();
    });
  });

  describe("addTool", () => {
    it("should add a new tool", () => {
      toolsStore.addTool(mockTool1);

      expect(toolsStore.tools).toHaveLength(1);
      expect(toolsStore.tools[0]).toEqual(mockTool1);
    });

    it("should append to existing tools", () => {
      toolsStore.setTools([mockTool1]);
      toolsStore.addTool(mockTool2);

      expect(toolsStore.tools).toHaveLength(2);
      expect(toolsStore.tools[1]).toEqual(mockTool2);
    });
  });

  describe("updateTool", () => {
    beforeEach(() => {
      toolsStore.setTools([mockTool1, mockTool2]);
    });

    it("should update tool properties", () => {
      toolsStore.updateTool("tool-1", { description: "Updated description" });

      const tool = toolsStore.getToolById("tool-1");
      expect(tool?.description).toBe("Updated description");
    });

    it("should not affect other tools", () => {
      toolsStore.updateTool("tool-1", { description: "Updated" });

      const otherTool = toolsStore.getToolById("tool-2");
      expect(otherTool?.description).toBe("Write contents to a file");
    });
  });

  describe("removeTool", () => {
    beforeEach(() => {
      toolsStore.setTools([mockTool1, mockTool2]);
      toolsStore.selectTool("tool-1");
    });

    it("should remove tool", () => {
      toolsStore.removeTool("tool-1");

      expect(toolsStore.tools).toHaveLength(1);
      expect(toolsStore.getToolById("tool-1")).toBeUndefined();
    });

    it("should remove from selection", () => {
      toolsStore.removeTool("tool-1");

      expect(toolsStore.selectedToolIds).not.toContain("tool-1");
    });
  });

  describe("toggleFavorite", () => {
    beforeEach(() => {
      toolsStore.setTools([mockTool1, mockTool2]);
    });

    it("should toggle favorite from true to false", () => {
      toolsStore.toggleFavorite("tool-1");

      const tool = toolsStore.getToolById("tool-1");
      expect(tool?.isFavorite).toBe(false);
    });

    it("should toggle favorite from false to true", () => {
      toolsStore.toggleFavorite("tool-2");

      const tool = toolsStore.getToolById("tool-2");
      expect(tool?.isFavorite).toBe(true);
    });
  });

  describe("selectTool", () => {
    beforeEach(() => {
      toolsStore.setTools([mockTool1, mockTool2]);
    });

    it("should select a tool", () => {
      toolsStore.selectTool("tool-1");

      expect(toolsStore.selectedToolIds).toContain("tool-1");
    });

    it("should not duplicate selection", () => {
      toolsStore.selectTool("tool-1");
      toolsStore.selectTool("tool-1");

      expect(toolsStore.selectedToolIds.filter(id => id === "tool-1")).toHaveLength(1);
    });
  });

  describe("deselectTool", () => {
    beforeEach(() => {
      toolsStore.setTools([mockTool1, mockTool2]);
      toolsStore.selectTool("tool-1");
      toolsStore.selectTool("tool-2");
    });

    it("should deselect a tool", () => {
      toolsStore.deselectTool("tool-1");

      expect(toolsStore.selectedToolIds).not.toContain("tool-1");
      expect(toolsStore.selectedToolIds).toContain("tool-2");
    });
  });

  describe("toggleToolSelection", () => {
    beforeEach(() => {
      toolsStore.setTools([mockTool1, mockTool2]);
    });

    it("should select when not selected", () => {
      toolsStore.toggleToolSelection("tool-1");

      expect(toolsStore.selectedToolIds).toContain("tool-1");
    });

    it("should deselect when selected", () => {
      toolsStore.selectTool("tool-1");
      toolsStore.toggleToolSelection("tool-1");

      expect(toolsStore.selectedToolIds).not.toContain("tool-1");
    });
  });

  describe("clearToolSelection", () => {
    beforeEach(() => {
      toolsStore.setTools([mockTool1, mockTool2]);
      toolsStore.selectTool("tool-1");
      toolsStore.selectTool("tool-2");
    });

    it("should clear all selections", () => {
      toolsStore.clearToolSelection();

      expect(toolsStore.selectedToolIds).toEqual([]);
    });
  });

  describe("getToolById", () => {
    beforeEach(() => {
      toolsStore.setTools([mockTool1, mockTool2]);
    });

    it("should return tool when found", () => {
      const tool = toolsStore.getToolById("tool-1");
      expect(tool).toEqual(mockTool1);
    });

    it("should return undefined when not found", () => {
      const tool = toolsStore.getToolById("non-existent");
      expect(tool).toBeUndefined();
    });
  });

  describe("getToolsByServer", () => {
    beforeEach(() => {
      toolsStore.setTools([mockTool1, mockTool2, mockTool3]);
    });

    it("should return tools for specific server", () => {
      const tools = toolsStore.getToolsByServer("server-1");

      expect(tools).toHaveLength(2);
      expect(tools.every(t => t.serverId === "server-1")).toBe(true);
    });

    it("should return empty array when no tools for server", () => {
      const tools = toolsStore.getToolsByServer("non-existent");

      expect(tools).toEqual([]);
    });
  });

  // ============================================================================
  // INVOCATION ACTIONS
  // ============================================================================

  describe("setInvocations", () => {
    it("should set invocations array", () => {
      const invocations = [mockInvocation1, mockInvocation2];
      toolsStore.setInvocations(invocations);

      expect(toolsStore.invocations).toEqual(invocations);
    });
  });

  describe("addInvocation", () => {
    it("should add a new invocation", () => {
      toolsStore.addInvocation(mockInvocation1);

      expect(toolsStore.invocations).toHaveLength(1);
      expect(toolsStore.invocations[0]).toEqual(mockInvocation1);
    });

    it("should prepend to existing invocations", () => {
      toolsStore.setInvocations([mockInvocation1]);
      toolsStore.addInvocation(mockInvocation2);

      expect(toolsStore.invocations).toHaveLength(2);
      expect(toolsStore.invocations[0]).toEqual(mockInvocation2);
    });
  });

  describe("updateInvocation", () => {
    beforeEach(() => {
      toolsStore.setInvocations([mockInvocation1, mockInvocation2]);
    });

    it("should update invocation properties", () => {
      toolsStore.updateInvocation("inv-1", {
        status: "error",
        error: { code: "ERR_TEST", message: "Test error" }
      });

      const inv = toolsStore.getInvocationById("inv-1");
      expect(inv?.status).toBe("error");
      expect(inv?.error?.code).toBe("ERR_TEST");
    });

    it("should not affect other invocations", () => {
      toolsStore.updateInvocation("inv-1", { status: "error" });

      const otherInv = toolsStore.getInvocationById("inv-2");
      expect(otherInv?.status).toBe("error");
    });
  });

  describe("clearInvocations", () => {
    beforeEach(() => {
      toolsStore.setInvocations([mockInvocation1, mockInvocation2]);
    });

    it("should clear all invocations", () => {
      toolsStore.clearInvocations();

      expect(toolsStore.invocations).toEqual([]);
    });
  });

  describe("getInvocationById", () => {
    beforeEach(() => {
      toolsStore.setInvocations([mockInvocation1, mockInvocation2]);
    });

    it("should return invocation when found", () => {
      const inv = toolsStore.getInvocationById("inv-1");
      expect(inv).toEqual(mockInvocation1);
    });

    it("should return undefined when not found", () => {
      const inv = toolsStore.getInvocationById("non-existent");
      expect(inv).toBeUndefined();
    });
  });

  // ============================================================================
  // DERIVED STATE - SERVERS
  // ============================================================================

  describe("connectedServers", () => {
    beforeEach(() => {
      toolsStore.setServers([mockServer1, mockServer2]);
    });

    it("should return only connected servers", () => {
      const connected = toolsStore.connectedServers;

      expect(connected).toHaveLength(1);
      expect(connected[0].status).toBe("connected");
    });
  });

  describe("disconnectedServers", () => {
    beforeEach(() => {
      toolsStore.setServers([mockServer1, mockServer2]);
    });

    it("should return only disconnected servers", () => {
      const disconnected = toolsStore.disconnectedServers;

      expect(disconnected).toHaveLength(1);
      expect(disconnected[0].status).toBe("disconnected");
    });
  });

  // ============================================================================
  // DERIVED STATE - TOOLS
  // ============================================================================

  describe("toolsByServer", () => {
    beforeEach(() => {
      toolsStore.setTools([mockTool1, mockTool2, mockTool3]);
    });

    it("should group tools by server", () => {
      const byServer = toolsStore.toolsByServer;

      expect(byServer["server-1"]).toHaveLength(2);
      expect(byServer["server-2"]).toHaveLength(1);
    });
  });

  describe("toolsByCategory", () => {
    beforeEach(() => {
      toolsStore.setTools([mockTool1, mockTool2, mockTool3]);
    });

    it("should group tools by category", () => {
      const byCategory = toolsStore.toolsByCategory;

      expect(byCategory.query).toHaveLength(2);
      expect(byCategory.transform).toHaveLength(1);
    });
  });

  describe("favoriteTools", () => {
    beforeEach(() => {
      toolsStore.setTools([mockTool1, mockTool2, mockTool3]);
    });

    it("should return only favorite tools", () => {
      const favorites = toolsStore.favoriteTools;

      expect(favorites).toHaveLength(2);
      expect(favorites.every(t => t.isFavorite === true)).toBe(true);
    });
  });

  describe("selectedTools", () => {
    beforeEach(() => {
      toolsStore.setTools([mockTool1, mockTool2, mockTool3]);
      toolsStore.selectTool("tool-1");
      toolsStore.selectTool("tool-3");
    });

    it("should return selected tools", () => {
      const selected = toolsStore.selectedTools;

      expect(selected).toHaveLength(2);
      expect(selected.some(t => t.id === "tool-1")).toBe(true);
      expect(selected.some(t => t.id === "tool-3")).toBe(true);
    });
  });

  // ============================================================================
  // DERIVED STATE - INVOCATIONS
  // ============================================================================

  describe("recentInvocations", () => {
    it("should return most recent invocations", () => {
      const invocations = [mockInvocation1, mockInvocation2];
      toolsStore.setInvocations(invocations);

      const recent = toolsStore.recentInvocations;

      // mockInvocation2 has later startedAt (10:05 vs 10:00)
      expect(recent[0].id).toBe("inv-2");
      expect(recent[1].id).toBe("inv-1");
    });

    it("should limit to 10 invocations", () => {
      const manyInvocations = Array.from({ length: 15 }, (_, i) => ({
        ...mockInvocation1,
        id: `inv-${i}`,
        startedAt: `2025-01-01T10:${i.toString().padStart(2, '0')}:00Z`,
      }));

      toolsStore.setInvocations(manyInvocations);

      expect(toolsStore.recentInvocations).toHaveLength(10);
    });
  });

  describe("successfulInvocations", () => {
    beforeEach(() => {
      toolsStore.setInvocations([mockInvocation1, mockInvocation2]);
    });

    it("should return only successful invocations", () => {
      const successful = toolsStore.successfulInvocations;

      expect(successful).toHaveLength(1);
      expect(successful[0].status).toBe("success");
    });
  });

  describe("failedInvocations", () => {
    beforeEach(() => {
      toolsStore.setInvocations([mockInvocation1, mockInvocation2]);
    });

    it("should return only failed invocations", () => {
      const failed = toolsStore.failedInvocations;

      expect(failed).toHaveLength(1);
      expect(failed[0].status).toBe("error");
    });
  });

  // ============================================================================
  // GENERAL ACTIONS
  // ============================================================================

  describe("setLoading", () => {
    it("should set loading state to true", () => {
      toolsStore.setLoading(true);
      expect(toolsStore.isLoading).toBe(true);
    });

    it("should set loading state to false", () => {
      toolsStore.setLoading(true);
      toolsStore.setLoading(false);
      expect(toolsStore.isLoading).toBe(false);
    });
  });

  describe("setError", () => {
    it("should set error message", () => {
      toolsStore.setError("Test error");
      expect(toolsStore.error).toBe("Test error");
    });

    it("should clear error message", () => {
      toolsStore.setError("Test error");
      toolsStore.setError(null);
      expect(toolsStore.error).toBeNull();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe("Integration", () => {
    it("should handle complete workflow", () => {
      // Add servers
      toolsStore.setServers([mockServer1, mockServer2]);
      expect(toolsStore.connectedServers).toHaveLength(1);

      // Add tools
      toolsStore.setTools([mockTool1, mockTool2, mockTool3]);
      expect(toolsStore.toolsByServer["server-1"]).toHaveLength(2);

      // Select tools
      toolsStore.selectTool("tool-1");
      toolsStore.selectTool("tool-3");
      expect(toolsStore.selectedTools).toHaveLength(2);

      // Add invocations
      toolsStore.setInvocations([mockInvocation1, mockInvocation2]);
      expect(toolsStore.successfulInvocations).toHaveLength(1);
      expect(toolsStore.failedInvocations).toHaveLength(1);

      // Remove server and verify cascade
      toolsStore.removeServer("server-1");
      expect(toolsStore.tools).toHaveLength(1);
      expect(toolsStore.getToolById("tool-1")).toBeUndefined();
    });

    it("should maintain consistency when toggling favorites", () => {
      toolsStore.setTools([mockTool1, mockTool2]);

      expect(toolsStore.favoriteTools).toHaveLength(1);

      toolsStore.toggleFavorite("tool-2");
      expect(toolsStore.favoriteTools).toHaveLength(2);

      toolsStore.toggleFavorite("tool-1");
      expect(toolsStore.favoriteTools).toHaveLength(1);
    });

    it("should handle tool selection with removal", () => {
      toolsStore.setTools([mockTool1, mockTool2, mockTool3]);
      toolsStore.selectTool("tool-1");
      toolsStore.selectTool("tool-2");

      expect(toolsStore.selectedTools).toHaveLength(2);

      toolsStore.removeTool("tool-1");

      expect(toolsStore.selectedToolIds).not.toContain("tool-1");
      expect(toolsStore.selectedTools).toHaveLength(1);
    });
  });
});
