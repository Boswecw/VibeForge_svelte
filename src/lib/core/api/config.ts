/**
 * NeuroForge API configuration
 */

export const neuroforgeConfig = {
  baseUrl: import.meta.env.VITE_NEUROFORGE_URL || "http://localhost:8000",
  apiVersion: "v1",
};

export function getApiUrl(path: string): string {
  return `${neuroforgeConfig.baseUrl}/api/${neuroforgeConfig.apiVersion}${path}`;
}
