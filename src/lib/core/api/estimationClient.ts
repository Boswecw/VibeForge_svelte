/**
 * VibeForge - Cost Estimation API Client
 *
 * Client for token counting and cost estimation operations.
 */

import { neuroforgeConfig } from "./config";

// ============================================================================
// Types - matching backend Pydantic models
// ============================================================================

export interface TokenEstimate {
  model: string;
  inputTokens: number;
  estimatedOutputTokens: number;
  totalTokens: number;
}

export interface CostEstimate {
  model: string;
  inputCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
}

export interface EstimateRequest {
  prompt: string;
  models: string[];
  estimatedCompletionLength?: number;
  contextIds?: string[];
}

export interface EstimateResponse {
  promptLength: number;
  contextLength: number;
  totalInputLength: number;
  tokenEstimates: TokenEstimate[];
  costEstimates: CostEstimate[];
  totalEstimatedCostUsd: number;
}

export interface ModelPricing {
  model: string;
  inputPricePer1k: number;
  outputPricePer1k: number;
  contextWindow: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// ============================================================================
// API Client
// ============================================================================

class EstimationClient {
  private baseUrl: string;
  private userId: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.userId = "default_user"; // TODO: Get from auth context
  }

  /**
   * Estimate tokens and costs for a prompt
   */
  async estimate(
    request: EstimateRequest
  ): Promise<ApiResponse<EstimateResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/estimate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": this.userId,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.text();
        return { error: error || `Failed to estimate: ${response.status}` };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get pricing information for all models
   */
  async getPricing(): Promise<ApiResponse<ModelPricing[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/estimate/pricing`);

      if (!response.ok) {
        const error = await response.text();
        return { error: error || `Failed to get pricing: ${response.status}` };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get pricing for a specific model
   */
  async getModelPricing(model: string): Promise<ApiResponse<ModelPricing>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/estimate/pricing/${model}`);

      if (!response.ok) {
        const error = await response.text();
        return {
          error: error || `Failed to get model pricing: ${response.status}`,
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const estimationClient = new EstimationClient(neuroforgeConfig.baseUrl);
