/**
 * Deployment API Client
 */

import { getApiUrl } from "./config";

export interface Deployment {
  id: string;
  prompt_id: string;
  environment: "dev" | "staging" | "prod";
  endpoint: string;
  version: string;
  status: "active" | "inactive";
  deployed_at: string;
  deployed_by: string;
}

export interface DeploymentCreate {
  prompt_id: string;
  environment: "dev" | "staging" | "prod";
  version?: string;
}

export interface SDKSnippets {
  typescript: string;
  python: string;
  curl: string;
}

export async function deployPrompt(
  promptId: string,
  environment: "dev" | "staging" | "prod",
  version?: string
): Promise<Deployment> {
  const response = await fetch(
    getApiUrl(`/workbench/prompts/${promptId}/deploy`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "test_user", // TODO: Get from auth context
      },
      body: JSON.stringify({
        prompt_id: promptId,
        environment,
        version,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to deploy prompt: ${response.statusText}`);
  }

  return response.json();
}

export async function listDeployments(promptId: string): Promise<Deployment[]> {
  const response = await fetch(
    getApiUrl(`/workbench/prompts/${promptId}/deployments`),
    {
      headers: {
        "x-user-id": "test_user", // TODO: Get from auth context
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to list deployments: ${response.statusText}`);
  }

  return response.json();
}

export async function getDeployment(
  promptId: string,
  deploymentId: string
): Promise<Deployment> {
  const response = await fetch(
    getApiUrl(`/workbench/prompts/${promptId}/deployments/${deploymentId}`),
    {
      headers: {
        "x-user-id": "test_user", // TODO: Get from auth context
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get deployment: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteDeployment(
  promptId: string,
  deploymentId: string
): Promise<void> {
  const response = await fetch(
    getApiUrl(`/workbench/prompts/${promptId}/deployments/${deploymentId}`),
    {
      method: "DELETE",
      headers: {
        "x-user-id": "test_user", // TODO: Get from auth context
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete deployment: ${response.statusText}`);
  }
}

export async function getSDKSnippets(
  promptId: string,
  endpoint: string
): Promise<SDKSnippets> {
  const response = await fetch(
    getApiUrl(
      `/workbench/prompts/${promptId}/sdk-snippets?endpoint=${encodeURIComponent(
        endpoint
      )}`
    ),
    {
      headers: {
        "x-user-id": "test_user", // TODO: Get from auth context
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get SDK snippets: ${response.statusText}`);
  }

  return response.json();
}
