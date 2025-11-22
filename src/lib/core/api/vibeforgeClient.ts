/**
 * VibeForge V2 - VibeForge Backend Client
 *
 * This client handles communication with the VibeForge backend (gateway).
 * For Phase 1, all methods return mock data.
 *
 * Later phases will implement real HTTP/MCP calls.
 */

import type {
  Workspace,
  Preset,
  Pattern,
  PromptRun,
  Evaluation,
  ApiResponse,
  PaginatedResponse,
} from '$lib/core/types';

// ============================================================================
// WORKSPACE OPERATIONS
// ============================================================================

export async function listWorkspaces(): Promise<ApiResponse<Workspace[]>> {
  // Mock delay
  await delay(300);

  return {
    success: true,
    data: [
      {
        id: 'ws_demo',
        name: 'Demo Workspace',
        description: 'Default workspace for VibeForge V2 demo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {
          theme: 'dark',
          autoSave: true,
          defaultModel: 'claude-3.5-sonnet',
        },
      },
    ],
  };
}

export async function getWorkspace(id: string): Promise<ApiResponse<Workspace>> {
  await delay(200);

  return {
    success: true,
    data: {
      id,
      name: 'Demo Workspace',
      description: 'Default workspace for VibeForge V2 demo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        theme: 'dark',
        autoSave: true,
        defaultModel: 'claude-3.5-sonnet',
      },
    },
  };
}

// ============================================================================
// PRESET OPERATIONS
// ============================================================================

export async function listPresets(workspaceId: string): Promise<ApiResponse<Preset[]>> {
  await delay(300);

  return {
    success: true,
    data: [
      {
        id: 'preset_code_review',
        name: 'Code Review',
        description: 'Standard code review prompt with best practices',
        workspaceId,
        promptTemplate:
          'Review the following code for:\n- Best practices\n- Security issues\n- Performance concerns\n\n{{code}}',
        contextBlockIds: ['ctx_system', 'ctx_code_standards'],
        modelIds: ['claude-3.5-sonnet'],
        tags: ['code', 'review'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };
}

// ============================================================================
// PATTERN OPERATIONS
// ============================================================================

export async function listPatterns(): Promise<ApiResponse<Pattern[]>> {
  await delay(300);

  return {
    success: true,
    data: [
      {
        id: 'pattern_chain_of_thought',
        name: 'Chain of Thought',
        description: 'Step-by-step reasoning pattern',
        category: 'reasoning',
        promptTemplate:
          "Let's solve this step by step:\n1. First, {{step1}}\n2. Then, {{step2}}\n3. Finally, {{step3}}",
        exampleInputs: ['Calculate 15% tip on $47.50'],
        exampleOutputs: [
          "1. First, convert 15% to decimal: 0.15\n2. Then, multiply: $47.50 × 0.15 = $7.125\n3. Finally, round to nearest cent: $7.13",
        ],
        tags: ['reasoning', 'step-by-step'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };
}

// ============================================================================
// RUN OPERATIONS
// ============================================================================

export async function listRuns(
  workspaceId: string,
  page = 1,
  pageSize = 20
): Promise<ApiResponse<PaginatedResponse<PromptRun>>> {
  await delay(300);

  return {
    success: true,
    data: {
      items: [],
      total: 0,
      page,
      pageSize,
      hasMore: false,
    },
  };
}

export async function getRun(id: string): Promise<ApiResponse<PromptRun>> {
  await delay(200);

  return {
    success: true,
    data: {
      id,
      workspaceId: 'ws_demo',
      promptSnapshot: 'Test prompt',
      contextBlockIds: [],
      modelId: 'claude-3.5-sonnet',
      status: 'success',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: 1500,
      inputTokens: 150,
      outputTokens: 300,
      totalTokens: 450,
      output: 'Test output',
    },
  };
}

// ============================================================================
// EVALUATION OPERATIONS
// ============================================================================

export async function listEvaluations(
  workspaceId: string
): Promise<ApiResponse<Evaluation[]>> {
  await delay(300);

  return {
    success: true,
    data: [],
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
