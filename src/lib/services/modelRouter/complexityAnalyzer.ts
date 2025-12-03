/**
 * Task Complexity Analyzer
 * Analyzes tasks and determines their complexity level
 */

import type {
  TaskComplexity,
  TaskCategory,
  ComplexityFactors,
  COMPLEXITY_WEIGHTS,
  TASK_CATEGORY_DEFAULTS,
} from "./types";

export class ComplexityAnalyzer {
  private weights: typeof COMPLEXITY_WEIGHTS;
  private categoryDefaults: typeof TASK_CATEGORY_DEFAULTS;

  constructor(
    weights?: Partial<typeof COMPLEXITY_WEIGHTS>,
    categoryDefaults?: Partial<typeof TASK_CATEGORY_DEFAULTS>
  ) {
    this.weights = {
      promptLength: 0.2,
      reasoningDepth: 0.3,
      domainComplexity: 0.25,
      outputStructure: 0.15,
      contextSize: 0.1,
      ...weights,
    };

    this.categoryDefaults = {
      stack_recommendation: {
        reasoningDepth: 8,
        domainComplexity: 7,
        outputStructure: "structured" as const,
        requiresMultiStep: true,
      },
      recommendation: {
        reasoningDepth: 6,
        domainComplexity: 6,
        outputStructure: "structured" as const,
        requiresMultiStep: false,
      },
      code_analysis: {
        reasoningDepth: 7,
        domainComplexity: 8,
        outputStructure: "complex" as const,
        requiresMultiStep: true,
      },
      explanation: {
        reasoningDepth: 5,
        domainComplexity: 5,
        outputStructure: "simple" as const,
        requiresMultiStep: false,
      },
      validation: {
        reasoningDepth: 3,
        domainComplexity: 4,
        outputStructure: "simple" as const,
        requiresMultiStep: false,
      },
      generation: {
        reasoningDepth: 6,
        domainComplexity: 6,
        outputStructure: "structured" as const,
        requiresMultiStep: false,
      },
      reasoning: {
        reasoningDepth: 9,
        domainComplexity: 7,
        outputStructure: "structured" as const,
        requiresMultiStep: true,
      },
      ...categoryDefaults,
    };
  }

  /**
   * Analyze task complexity
   */
  analyzeComplexity(
    taskCategory: TaskCategory,
    factors: Partial<ComplexityFactors>
  ): TaskComplexity {
    // Merge with category defaults
    const fullFactors = this.applyDefaults(taskCategory, factors);

    // Calculate weighted score
    const score = this.calculateComplexityScore(fullFactors);

    // Map score to complexity level
    return this.scoreToComplexity(score);
  }

  /**
   * Calculate numeric complexity score (0-100)
   */
  calculateComplexityScore(factors: ComplexityFactors): number {
    let score = 0;

    // Prompt length component (0-10)
    const promptScore = this.scorePromptLength(factors.promptLength);
    score += promptScore * this.weights.promptLength * 10;

    // Reasoning depth component (already 0-10)
    score += factors.reasoningDepth * this.weights.reasoningDepth * 10;

    // Domain complexity component (already 0-10)
    score += factors.domainComplexity * this.weights.domainComplexity * 10;

    // Output structure component (0-10)
    const structureScore = this.scoreOutputStructure(factors.outputStructure);
    score += structureScore * this.weights.outputStructure * 10;

    // Context size component (0-10)
    const contextScore = this.scoreContextSize(factors.contextSize);
    score += contextScore * this.weights.contextSize * 10;

    // Multi-step bonus
    if (factors.requiresMultiStep) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Score prompt length (0-10)
   */
  private scorePromptLength(tokens: number): number {
    if (tokens < 50) return 1;
    if (tokens < 100) return 2;
    if (tokens < 200) return 3;
    if (tokens < 400) return 4;
    if (tokens < 800) return 5;
    if (tokens < 1200) return 6;
    if (tokens < 1600) return 7;
    if (tokens < 2000) return 8;
    if (tokens < 3000) return 9;
    return 10;
  }

  /**
   * Score output structure complexity (0-10)
   */
  private scoreOutputStructure(
    structure: "simple" | "structured" | "complex"
  ): number {
    switch (structure) {
      case "simple":
        return 3;
      case "structured":
        return 6;
      case "complex":
        return 9;
    }
  }

  /**
   * Score context size (0-10)
   */
  private scoreContextSize(tokens: number): number {
    if (tokens < 100) return 1;
    if (tokens < 500) return 2;
    if (tokens < 1000) return 3;
    if (tokens < 2000) return 4;
    if (tokens < 3000) return 5;
    if (tokens < 4000) return 6;
    if (tokens < 5000) return 7;
    if (tokens < 6000) return 8;
    if (tokens < 7000) return 9;
    return 10;
  }

  /**
   * Map numeric score to complexity level
   */
  private scoreToComplexity(score: number): TaskComplexity {
    if (score < 25) return "simple";
    if (score < 50) return "medium";
    if (score < 75) return "complex";
    return "expert";
  }

  /**
   * Apply category defaults to factors
   */
  private applyDefaults(
    taskCategory: TaskCategory,
    factors: Partial<ComplexityFactors>
  ): ComplexityFactors {
    const defaults = this.categoryDefaults[taskCategory];

    return {
      promptLength: factors.promptLength || 100,
      reasoningDepth: factors.reasoningDepth ?? defaults.reasoningDepth ?? 5,
      domainComplexity:
        factors.domainComplexity ?? defaults.domainComplexity ?? 5,
      outputStructure:
        factors.outputStructure || defaults.outputStructure || "simple",
      requiresMultiStep:
        factors.requiresMultiStep ?? defaults.requiresMultiStep ?? false,
      contextSize: factors.contextSize || 0,
    };
  }

  /**
   * Analyze from prompt text
   */
  analyzeFromPrompt(
    taskCategory: TaskCategory,
    promptText: string,
    additionalFactors?: Partial<ComplexityFactors>
  ): {
    complexity: TaskComplexity;
    score: number;
    factors: ComplexityFactors;
  } {
    // Estimate token count (rough approximation: 1 token ≈ 4 chars)
    const promptTokens = Math.ceil(promptText.length / 4);

    // Detect multi-step requirements
    const requiresMultiStep = this.detectMultiStep(promptText);

    // Detect reasoning depth from keywords
    const reasoningDepth = this.detectReasoningDepth(promptText);

    // Build factors
    const factors: Partial<ComplexityFactors> = {
      promptLength: promptTokens,
      requiresMultiStep,
      reasoningDepth,
      ...additionalFactors,
    };

    const fullFactors = this.applyDefaults(taskCategory, factors);
    const score = this.calculateComplexityScore(fullFactors);
    const complexity = this.scoreToComplexity(score);

    return {
      complexity,
      score,
      factors: fullFactors,
    };
  }

  /**
   * Detect if task requires multi-step reasoning
   */
  private detectMultiStep(promptText: string): boolean {
    const multiStepKeywords = [
      "step by step",
      "first",
      "then",
      "finally",
      "analyze",
      "compare",
      "evaluate",
      "recommend",
      "multiple",
      "several",
      "various",
    ];

    const lowerText = promptText.toLowerCase();
    return multiStepKeywords.some((keyword) => lowerText.includes(keyword));
  }

  /**
   * Detect reasoning depth from prompt
   */
  private detectReasoningDepth(promptText: string): number {
    let depth = 5; // baseline

    const lowerText = promptText.toLowerCase();

    // High reasoning keywords
    const highReasoningKeywords = [
      "why",
      "explain",
      "reasoning",
      "rationale",
      "justify",
      "compare",
      "analyze",
      "evaluate",
    ];
    const highMatches = highReasoningKeywords.filter((kw) =>
      lowerText.includes(kw)
    ).length;
    depth += highMatches * 1.5;

    // Low reasoning (simple generation)
    const lowReasoningKeywords = [
      "list",
      "name",
      "what is",
      "define",
      "simple",
    ];
    const lowMatches = lowReasoningKeywords.filter((kw) =>
      lowerText.includes(kw)
    ).length;
    depth -= lowMatches * 1;

    return Math.min(10, Math.max(1, Math.round(depth)));
  }

  /**
   * Get complexity explanation
   */
  explainComplexity(
    complexity: TaskComplexity,
    factors: ComplexityFactors
  ): string {
    const parts: string[] = [];

    parts.push(`Task complexity: **${complexity.toUpperCase()}**`);

    if (factors.promptLength > 1000) {
      parts.push(`• Large prompt (${factors.promptLength} tokens)`);
    }

    if (factors.reasoningDepth >= 7) {
      parts.push(`• Deep reasoning required (${factors.reasoningDepth}/10)`);
    }

    if (factors.domainComplexity >= 7) {
      parts.push(`• Complex domain knowledge (${factors.domainComplexity}/10)`);
    }

    if (factors.outputStructure === "complex") {
      parts.push(`• Complex output structure needed`);
    }

    if (factors.requiresMultiStep) {
      parts.push(`• Multi-step reasoning required`);
    }

    if (factors.contextSize > 3000) {
      parts.push(`• Large context (${factors.contextSize} tokens)`);
    }

    return parts.join("\n");
  }
}

/**
 * Singleton instance
 */
export const complexityAnalyzer = new ComplexityAnalyzer();
