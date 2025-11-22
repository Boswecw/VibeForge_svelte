/**
 * Chain API client for VibeForge
 * Handles chain creation, execution, and management
 */

import { getApiUrl } from "./config";

export interface ChainNode {
  id: string;
  promptId: string;
  promptName: string;
  x: number;
  y: number;
  inputs: { [key: string]: string };
  outputs: string[];
}

export interface ChainConnection {
  id: string;
  sourceNodeId: string;
  sourceOutput: string;
  targetNodeId: string;
  targetInput: string;
}

export interface Chain {
  id: string;
  name: string;
  nodes: ChainNode[];
  connections: ChainConnection[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ChainCreate {
  name: string;
  nodes: ChainNode[];
  connections: ChainConnection[];
}

export interface ChainExecuteRequest {
  initialInputs?: { [key: string]: any };
}

export interface NodeExecutionResult {
  nodeId: string;
  status: "success" | "error" | "skipped";
  outputs: { [key: string]: any };
  error?: string;
  executionTimeMs: number;
}

export interface ChainExecutionResult {
  executionId: string;
  chainId: string;
  status: "running" | "completed" | "failed";
  nodeResults: NodeExecutionResult[];
  totalExecutionTimeMs: number;
  startedAt: string;
  completedAt?: string;
}

const HEADERS = {
  "Content-Type": "application/json",
  "x-user-id": "test_user",
};

/**
 * Create a new chain
 */
export async function createChain(chainData: ChainCreate): Promise<Chain> {
  const response = await fetch(getApiUrl("/chains"), {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(chainData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create chain: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a specific chain by ID
 */
export async function getChain(chainId: string): Promise<Chain> {
  const response = await fetch(getApiUrl(`/chains/${chainId}`), {
    headers: HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch chain: ${response.statusText}`);
  }

  return response.json();
}

/**
 * List all chains
 */
export async function listChains(): Promise<Chain[]> {
  const response = await fetch(getApiUrl("/chains"), {
    headers: HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Failed to list chains: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update an existing chain
 */
export async function updateChain(
  chainId: string,
  chainData: ChainCreate
): Promise<Chain> {
  const response = await fetch(getApiUrl(`/chains/${chainId}`), {
    method: "PUT",
    headers: HEADERS,
    body: JSON.stringify(chainData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update chain: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a chain
 */
export async function deleteChain(chainId: string): Promise<void> {
  const response = await fetch(getApiUrl(`/chains/${chainId}`), {
    method: "DELETE",
    headers: HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Failed to delete chain: ${response.statusText}`);
  }
}

/**
 * Execute a chain
 */
export async function executeChain(
  chainId: string,
  request: ChainExecuteRequest = {}
): Promise<ChainExecutionResult> {
  const response = await fetch(getApiUrl(`/chains/${chainId}/execute`), {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to execute chain: ${response.statusText}`);
  }

  return response.json();
}

/**
 * List all executions for a chain
 */
export async function listChainExecutions(
  chainId: string
): Promise<ChainExecutionResult[]> {
  const response = await fetch(getApiUrl(`/chains/${chainId}/executions`), {
    headers: HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Failed to list chain executions: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get details of a specific execution
 */
export async function getExecution(
  executionId: string
): Promise<ChainExecutionResult> {
  const response = await fetch(getApiUrl(`/executions/${executionId}`), {
    headers: HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch execution: ${response.statusText}`);
  }

  return response.json();
}
