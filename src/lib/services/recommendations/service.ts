/**
 * Stack Recommendation Service
 * Combines LLM recommendations with empirical data
 */

import { llmClient } from "../llm/client";
import { modelRouter, costTracker, performanceMetrics } from "../modelRouter";
import { StackRecommendationPrompts, type PromptContext } from "./prompts";
import type { LLMChatResponse } from "../llm/types";
import type { ProjectType } from "$lib/workbench/types/wizard";

export interface StackRecommendation {
  stackId: string;
  stackName: string;
  score: number; // 0-100
  strengths: string[];
  concerns: string[];
  bestFor: string;
  reasoning: string;
  source: "llm" | "empirical" | "hybrid";
}

export interface RecommendationResult {
  recommendations: StackRecommendation[];
  summary: string;
  confidence: number; // 0-1
  timestamp: Date;
  usedLLM: boolean;
}

export interface EmpiricalData {
  stackId: string;
  successRate: number;
  popularityScore: number;
  userFamiliarity: number;
  projectTypeMatch: number;
}

export class StackRecommendationService {
  private readonly MIN_CONFIDENCE = 0.6;
  private readonly LLM_WEIGHT = 0.4;
  private readonly EMPIRICAL_WEIGHT = 0.3;
  private readonly LANGUAGE_MATCH_WEIGHT = 0.2;
  private readonly POPULARITY_WEIGHT = 0.1;

  /**
   * Get stack recommendations with LLM enhancement
   */
  async getRecommendations(
    context: PromptContext,
    empiricalData: EmpiricalData[]
  ): Promise<RecommendationResult> {
    try {
      // Check if LLM is available
      const llmStatus = await llmClient.checkStatus();

      if (llmStatus.available) {
        return await this.getLLMRecommendations(context, empiricalData);
      } else {
        // Fallback to empirical-only recommendations
        return this.getEmpiricalRecommendations(context, empiricalData);
      }
    } catch (error) {
      console.error("Recommendation error:", error);
      // Fallback on error
      return this.getEmpiricalRecommendations(context, empiricalData);
    }
  }

  /**
   * Get LLM-powered recommendations
   */
  private async getLLMRecommendations(
    context: PromptContext,
    empiricalData: EmpiricalData[]
  ): Promise<RecommendationResult> {
    const systemPrompt = StackRecommendationPrompts.getSystemPrompt();
    const userPrompt =
      StackRecommendationPrompts.getRecommendationPrompt(context);

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    try {
      // Use ModelRouter to select optimal model
      const selection = await modelRouter.selectModel(fullPrompt) as any;

      console.log(
        `[Recommendations] Selected model: ${selection.provider}/${selection.modelId}`,
        `\nEstimated cost: $${selection.estimatedCost.toFixed(4)}`,
        `\nEstimated latency: ${selection.estimatedLatencyMs || selection.estimatedLatency || 0}ms`,
        `\nExplanation: ${selection.explanation || 'No explanation provided'}`
      );

      const startTime = Date.now();
      let tokenCount = { input: 0, output: 0 };

      // Call LLM with selected model
      const response: LLMChatResponse = await llmClient.chat(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          // Override with selected model
          model: selection.modelId,
        }
      );

      const responseTime = Date.now() - startTime;

      // Estimate token counts (rough approximation: 1 token ≈ 4 characters)
      tokenCount.input = Math.ceil(fullPrompt.length / 4);
      tokenCount.output = Math.ceil(response.content.length / 4);

      // Track cost
      await costTracker.trackUsage(
        selection.provider,
        selection.modelId,
        "recommendation",
        tokenCount.input,
        tokenCount.output
      );

      // Parse LLM response
      const llmRecommendations = this.parseLLMResponse(response.content);

      // Record performance metrics (accepted = true if we got valid recommendations)
      const accepted = llmRecommendations.length > 0;
      await performanceMetrics.recordMetric(
        selection.provider,
        selection.modelId,
        "recommendation",
        responseTime,
        accepted,
        false,
        accepted ? 5 : 3 // Higher satisfaction if we got good results
      );

      // Combine with empirical data
      const hybridRecommendations = this.combineRecommendations(
        llmRecommendations,
        empiricalData,
        context
      );

      return {
        recommendations: hybridRecommendations,
        summary: this.extractSummary(response.content),
        confidence: this.calculateConfidence(hybridRecommendations),
        timestamp: new Date(),
        usedLLM: true,
      };
    } catch (error) {
      console.error("LLM recommendation failed:", error);

      // Record error in performance metrics
      const config = llmClient.getConfig();
      if (config) {
        await performanceMetrics.recordMetric(
          config.provider,
          config.model,
          "recommendation",
          0,
          false,
          true,
          1
        );
      }

      return this.getEmpiricalRecommendations(context, empiricalData);
    }
  }

  /**
   * Parse LLM JSON response
   */
  private parseLLMResponse(content: string): Partial<StackRecommendation>[] {
    try {
      // Extract JSON from markdown code blocks
      const jsonMatch =
        content.match(/```json\n([\s\S]*?)\n```/) ||
        content.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;

      const parsed = JSON.parse(jsonStr);
      interface ParsedRecommendation {
        stackId: string;
        stackName: string;
        score: number;
        strengths?: string[];
        concerns?: string[];
        bestFor?: string;
        reasoning?: string;
      }
      return ((parsed.recommendations || []) as ParsedRecommendation[]).map((rec) => ({
        stackId: rec.stackId,
        stackName: rec.stackName,
        score: rec.score,
        strengths: rec.strengths || [],
        concerns: rec.concerns || [],
        bestFor: rec.bestFor || "",
        reasoning: rec.reasoning || "",
        source: "llm" as const,
      }));
    } catch (error) {
      console.error("Failed to parse LLM response:", error);
      return [];
    }
  }

  /**
   * Extract summary from LLM response
   */
  private extractSummary(content: string): string {
    try {
      const jsonMatch =
        content.match(/```json\n([\s\S]*?)\n```/) ||
        content.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      const parsed = JSON.parse(jsonStr);
      return (
        parsed.summary ||
        "AI-powered recommendations based on your project requirements."
      );
    } catch {
      return "Recommendations generated based on project requirements and best practices.";
    }
  }

  /**
   * Combine LLM and empirical recommendations
   */
  private combineRecommendations(
    llmRecs: Partial<StackRecommendation>[],
    empiricalData: EmpiricalData[],
    context: PromptContext
  ): StackRecommendation[] {
    const combined = llmRecs.map((llmRec) => {
      const empirical = empiricalData.find((e) => e.stackId === llmRec.stackId);
      const stack = context.availableStacks.find(
        (s) => s.id === llmRec.stackId
      );

      if (!empirical || !stack) {
        return {
          ...llmRec,
          score: llmRec.score || 50,
          source: "llm" as const,
        } as StackRecommendation;
      }

      // Calculate hybrid score
      const llmScore = (llmRec.score || 50) / 100;
      const empiricalScore =
        empirical.successRate * this.EMPIRICAL_WEIGHT +
        empirical.popularityScore * this.POPULARITY_WEIGHT +
        empirical.userFamiliarity * 0.15 +
        empirical.projectTypeMatch * this.LANGUAGE_MATCH_WEIGHT;

      const hybridScore =
        (llmScore * this.LLM_WEIGHT + empiricalScore * (1 - this.LLM_WEIGHT)) *
        100;

      return {
        ...llmRec,
        score: Math.round(hybridScore),
        source: "hybrid" as const,
      } as StackRecommendation;
    });

    // Sort by score and return top recommendations
    return combined.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  /**
   * Fallback: Empirical-only recommendations
   */
  private getEmpiricalRecommendations(
    context: PromptContext,
    empiricalData: EmpiricalData[]
  ): RecommendationResult {
    const recommendations = empiricalData
      .map((data) => {
        const stack = context.availableStacks.find(
          (s) => s.id === data.stackId
        );
        if (!stack) return null;

        // Calculate score from empirical data
        const score = Math.round(
          data.successRate * 40 +
            data.popularityScore * 30 +
            data.projectTypeMatch * 20 +
            data.userFamiliarity * 10
        );

        // Generate basic recommendations
        const strengths = this.generateEmpiricalStrengths(stack, data);
        const concerns = this.generateEmpiricalConcerns(stack, data);

        return {
          stackId: stack.id,
          stackName: stack.name,
          score,
          strengths,
          concerns,
          bestFor: stack.description,
          reasoning: `Based on ${(data.successRate * 100).toFixed(0)}% success rate and popularity among similar projects.`,
          source: "empirical" as "llm" | "empirical" | "hybrid",
        } as StackRecommendation;
      })
      .filter((r): r is StackRecommendation => r !== null)
      .sort((a, b) => (b?.score || 0) - (a?.score || 0))
      .slice(0, 5);

    return {
      recommendations,
      summary: `Recommendations based on historical data and project patterns. ${recommendations.length} stacks match your requirements.`,
      confidence: this.calculateConfidence(recommendations),
      timestamp: new Date(),
      usedLLM: false,
    };
  }

  /**
   * Generate strengths from empirical data
   */
  private generateEmpiricalStrengths(
    stack: PromptContext["availableStacks"][0],
    data: EmpiricalData
  ): string[] {
    const strengths: string[] = [];

    if (data.successRate > 0.8) {
      strengths.push(
        `High success rate (${(data.successRate * 100).toFixed(0)}%) for similar projects`
      );
    }

    if (data.popularityScore > 0.7) {
      strengths.push("Popular choice among developers");
    }

    if (data.projectTypeMatch > 0.8) {
      strengths.push(`Well-suited for ${stack.category} projects`);
    }

    if (data.userFamiliarity > 0.6) {
      strengths.push("Familiar technology based on your history");
    }

    if (strengths.length === 0) {
      strengths.push(
        `Includes ${stack.technologies.slice(0, 2).join(" and ")}`
      );
    }

    return strengths.slice(0, 3);
  }

  /**
   * Generate concerns from empirical data
   */
  private generateEmpiricalConcerns(
    stack: PromptContext["availableStacks"][0],
    data: EmpiricalData
  ): string[] {
    const concerns: string[] = [];

    if (data.successRate < 0.6) {
      concerns.push("Lower success rate for similar projects");
    }

    if (data.userFamiliarity < 0.3) {
      concerns.push("Unfamiliar technology - may have learning curve");
    }

    if (stack.complexity === "Advanced") {
      concerns.push("Advanced complexity level");
    }

    return concerns.slice(0, 2);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(recommendations: StackRecommendation[]): number {
    if (recommendations.length === 0) return 0;

    const topScore = recommendations[0]?.score || 0;
    const avgScore =
      recommendations.reduce((sum, r) => sum + r.score, 0) /
      recommendations.length;
    const spread = topScore - avgScore;

    // Higher confidence when top choice is clearly better
    const confidence = Math.min(1, (topScore / 100) * (1 + spread / 100));
    return Math.max(this.MIN_CONFIDENCE, confidence);
  }

  /**
   * Get explanation for a specific stack
   */
  async explainStack(
    stackName: string,
    projectType: ProjectType,
    languages: string[]
  ): Promise<string> {
    try {
      const status = await llmClient.checkStatus();
      if (!status.available) {
        return `${stackName} is recommended for ${projectType} projects using ${languages.join(" and ")}.`;
      }

      const prompt = StackRecommendationPrompts.getExplanationPrompt(
        stackName,
        projectType,
        languages
      );

      const systemPrompt =
        "You are a helpful technology advisor. Explain stack choices clearly and concisely.";
      const fullPrompt = `${systemPrompt}\n\n${prompt}`;

      // Use cheaper model for simpler explanation task
      const selection = await modelRouter.selectModel(
        fullPrompt,
        "explanation",
        {
          strategy: "cost", // Use cheapest model for explanations
          constraints: {
            maxLatency: 5000, // 5 seconds max
          },
          expectedOutputLength: 300, // Brief explanation
        }
      );

      const startTime = Date.now();

      const response = await llmClient.chat(
        [
          {
            role: "system",
            content: systemPrompt,
          },
          { role: "user", content: prompt },
        ],
        {
          model: selection.modelId,
        }
      );

      const responseTime = Date.now() - startTime;

      // Track usage
      const tokenCount = {
        input: Math.ceil(fullPrompt.length / 4),
        output: Math.ceil(response.content.length / 4),
      };

      await costTracker.trackUsage(
        selection.provider,
        selection.modelId,
        "explanation",
        tokenCount.input,
        tokenCount.output
      );

      await performanceMetrics.recordMetric(
        selection.provider,
        selection.modelId,
        "explanation",
        responseTime,
        true,
        false,
        4
      );

      return response.content;
    } catch (error) {
      console.error("Stack explanation failed:", error);
      return `${stackName} is a solid choice for ${projectType} projects.`;
    }
  }
}

// Export singleton
export const stackRecommendationService = new StackRecommendationService();
