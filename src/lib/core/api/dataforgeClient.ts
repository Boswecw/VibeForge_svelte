/**
 * VibeForge V2 - DataForge Client
 *
 * This client handles communication with DataForge (knowledge base).
 * For Phase 1, all methods return mock data.
 *
 * Later phases will implement real HTTP/MCP calls.
 */

import type {
  ContextBlock,
  ApiResponse,
  PaginatedResponse,
} from "$lib/core/types";

// ============================================================================
// CONTEXT BLOCK OPERATIONS
// ============================================================================

export async function listContextBlocks(
  workspaceId?: string,
  page = 1,
  pageSize = 50
): Promise<ApiResponse<PaginatedResponse<ContextBlock>>> {
  await delay(300);

  const mockContexts: ContextBlock[] = [
    {
      id: "ctx_system_vibeforge",
      title: "VibeForge System Instructions",
      kind: "system",
      content: `VibeForge is a professional prompt engineering workbench for AI developers.

Key principles:
- Workbench UI, not a chat interface
- 3-column layout: Context | Prompt | Output
- Dark-first "Forge" design system
- Support for multiple models simultaneously
- MCP-based tool integration`,
      description: "Core VibeForge system context",
      tags: ["system", "vibeforge"],
      isActive: true,
      source: "global",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "ctx_design_forge",
      title: "Forge Design System",
      kind: "design",
      content: `Forge Design System:

Colors (Dark Mode):
- forge-blacksteel: #0B0F17 (primary bg)
- forge-gunmetal: #111827 (secondary bg)
- forge-steel: #1E293B (interactive states)
- forge-ember: #FBBF24 (primary accent)

Typography:
- System fonts, -0.01em letter-spacing
- Careful hierarchy with size and weight

Layout:
- 3-column workbench with responsive behavior
- Generous spacing, comfortable for long sessions`,
      description: "Forge visual identity and UI guidelines",
      tags: ["design-system", "forge", "ui"],
      isActive: true,
      source: "global",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "ctx_project_dataforge",
      title: "DataForge Project Context",
      kind: "project",
      content: `DataForge is the knowledge base backend for the Forge ecosystem.

Features:
- Document ingestion and indexing
- Vector search with pgvector
- Context block management
- MCP server for tool-based access

Tech stack:
- FastAPI + Python
- PostgreSQL + pgvector
- ChromaDB for embeddings`,
      description: "DataForge project context",
      tags: ["dataforge", "project", "kb"],
      isActive: false,
      source: "workspace",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "ctx_code_svelte5",
      title: "Svelte 5 Runes Pattern",
      kind: "code",
      content: `Svelte 5 introduces runes for reactivity:

$state - reactive state
let count = $state(0);

$derived - computed values
let doubled = $derived(count * 2);

$props - component props
let { title, description } = $props();

$effect - side effects
$effect(() => {
  console.log('Count changed:', count);
});`,
      description: "Svelte 5 runes usage patterns",
      tags: ["svelte", "code", "runes"],
      isActive: false,
      source: "local",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = mockContexts.slice(start, end);

  return {
    success: true,
    data: {
      items,
      total: mockContexts.length,
      page,
      pageSize,
      hasMore: end < mockContexts.length,
    },
  };
}

export async function getContextBlock(
  id: string
): Promise<ApiResponse<ContextBlock>> {
  await delay(200);

  const { data } = await listContextBlocks();
  const context = data?.items.find((c) => c.id === id);

  if (!context) {
    return {
      success: false,
      error: {
        code: "CONTEXT_NOT_FOUND",
        message: `Context block with ID ${id} not found`,
      },
    };
  }

  return {
    success: true,
    data: context,
  };
}

export async function createContextBlock(
  block: Omit<ContextBlock, "id" | "createdAt" | "updatedAt">
): Promise<ApiResponse<ContextBlock>> {
  await delay(400);

  const newBlock: ContextBlock = {
    ...block,
    id: `ctx_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    success: true,
    data: newBlock,
  };
}

export async function updateContextBlock(
  id: string,
  updates: Partial<ContextBlock>
): Promise<ApiResponse<ContextBlock>> {
  await delay(400);

  const existing = await getContextBlock(id);
  if (!existing.success || !existing.data) {
    return existing;
  }

  const updated: ContextBlock = {
    ...existing.data,
    ...updates,
    id, // Ensure ID doesn't change
    updatedAt: new Date().toISOString(),
  };

  return {
    success: true,
    data: updated,
  };
}

export async function deleteContextBlock(
  id: string
): Promise<ApiResponse<void>> {
  await delay(300);

  return {
    success: true,
  };
}

// ============================================================================
// SEARCH OPERATIONS
// ============================================================================

export interface SearchContextRequest {
  query: string;
  workspaceId?: string;
  kinds?: string[];
  tags?: string[];
  limit?: number;
}

export async function searchContextBlocks(
  request: SearchContextRequest
): Promise<ApiResponse<ContextBlock[]>> {
  await delay(500);

  // Mock search - in reality this would use vector search
  const { data } = await listContextBlocks(request.workspaceId);
  const all = data?.items || [];

  let filtered = all;

  if (request.kinds && request.kinds.length > 0) {
    filtered = filtered.filter((c) => request.kinds?.includes(c.kind));
  }

  if (request.tags && request.tags.length > 0) {
    filtered = filtered.filter((c) =>
      request.tags?.some((tag) => c.tags.includes(tag))
    );
  }

  // Simple text search
  if (request.query) {
    const q = request.query.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q)
    );
  }

  const limited = filtered.slice(0, request.limit || 10);

  return {
    success: true,
    data: limited,
  };
}

// ============================================================================
// RUN LOGGING
// ============================================================================

const DATAFORGE_BASE_URL =
  import.meta.env.VITE_DATAFORGE_URL || "http://localhost:8001";

export interface LogRunRequest {
  userId: string;
  workspaceId: string;
  promptText: string;
  contextBlocks?: string[];
  models: {
    modelId: string;
    responseText: string;
    tokensUsed: number;
    latencyMs: number;
    error?: string;
  }[];
}

export async function logRun(
  request: LogRunRequest
): Promise<ApiResponse<{ runId: string }>> {
  try {
    const response = await fetch(`${DATAFORGE_BASE_URL}/api/v1/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: {
          code: "LOG_RUN_FAILED",
          message: error.detail || "Failed to log run",
        },
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: { runId: data.id },
    };
  } catch (error) {
    console.error("Failed to log run to DataForge:", error);
    // Don't fail the user flow if logging fails
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Network error",
      },
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
