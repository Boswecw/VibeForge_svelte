/**
 * Stack Recommendation Prompts
 * LLM prompt templates for intelligent stack recommendations
 */

import type { ProjectType } from "$lib/workbench/types/wizard";

export interface PromptContext {
  projectType: ProjectType;
  projectName: string;
  description?: string;
  selectedLanguages: string[];
  teamSize?: number;
  timeline?: string;
  complexity?: string;
  availableStacks: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    complexity: string;
    category: string;
  }>;
  historicalData?: {
    popularStacks: string[];
    userPreviousStacks: string[];
    successRates: Record<string, number>;
  };
}

export class StackRecommendationPrompts {
  /**
   * Generate system prompt for stack recommendation
   */
  static getSystemPrompt(): string {
    return `You are an expert software architect and technology advisor. Your role is to help developers choose the best technology stack for their projects based on:

1. Project requirements and constraints
2. Selected programming languages
3. Team size and timeline
4. Project complexity
5. Historical success data
6. Industry best practices

Provide thoughtful, practical recommendations that balance:
- Technical alignment with requirements
- Developer experience and productivity
- Community support and ecosystem maturity
- Learning curve vs. team expertise
- Long-term maintenance considerations

Be concise, specific, and explain your reasoning clearly.`;
  }

  /**
   * Generate user prompt for stack recommendations
   */
  static getRecommendationPrompt(context: PromptContext): string {
    const {
      projectType,
      projectName,
      description,
      selectedLanguages,
      teamSize,
      timeline,
      complexity,
      availableStacks,
      historicalData,
    } = context;

    let prompt = `I need help choosing a technology stack for my project.

**Project Details:**
- Name: ${projectName}
- Type: ${projectType}
${description ? `- Description: ${description}` : ""}
- Selected Languages: ${selectedLanguages.join(", ")}
${teamSize ? `- Team Size: ${teamSize} developer${teamSize > 1 ? "s" : ""}` : ""}
${timeline ? `- Timeline: ${timeline}` : ""}
${complexity ? `- Complexity: ${complexity}` : ""}

**Available Stack Options:**
${availableStacks
  .map(
    (stack, idx) =>
      `${idx + 1}. **${stack.name}** (${stack.category})
   - Description: ${stack.description}
   - Technologies: ${stack.technologies.join(", ")}
   - Complexity: ${stack.complexity}`
  )
  .join("\n\n")}`;

    if (historicalData) {
      prompt += `\n\n**Historical Context:**`;

      if (historicalData.popularStacks?.length > 0) {
        prompt += `\n- Most popular stacks: ${historicalData.popularStacks.join(", ")}`;
      }

      if (historicalData.userPreviousStacks?.length > 0) {
        prompt += `\n- Your previous stacks: ${historicalData.userPreviousStacks.join(", ")}`;
      }

      if (
        historicalData.successRates &&
        Object.keys(historicalData.successRates).length > 0
      ) {
        const ratesStr = Object.entries(historicalData.successRates)
          .map(
            ([stack, rate]) => `${stack} (${(rate * 100).toFixed(0)}% success)`
          )
          .join(", ");
        prompt += `\n- Success rates: ${ratesStr}`;
      }
    }

    prompt += `\n\n**Task:**
Evaluate each stack option and provide:
1. Top 3 recommended stacks (ranked by suitability)
2. For each recommendation:
   - Suitability score (0-100)
   - Key strengths (2-3 points)
   - Potential concerns (1-2 points)
   - Best use case

Respond in JSON format:
\`\`\`json
{
  "recommendations": [
    {
      "stackId": "stack-id",
      "stackName": "Stack Name",
      "score": 85,
      "strengths": ["Strength 1", "Strength 2"],
      "concerns": ["Concern 1"],
      "bestFor": "Brief explanation of ideal use case",
      "reasoning": "Why this stack is suitable"
    }
  ],
  "summary": "Overall recommendation guidance (2-3 sentences)"
}
\`\`\``;

    return prompt;
  }

  /**
   * Generate prompt for explaining stack choice
   */
  static getExplanationPrompt(
    stackName: string,
    projectType: ProjectType,
    languages: string[]
  ): string {
    return `Explain why ${stackName} is a good choice for a ${projectType} project using ${languages.join(" and ")}.

Provide a concise explanation (3-4 sentences) covering:
1. How it aligns with the project type
2. Language ecosystem benefits
3. Key advantages for this use case

Keep it practical and beginner-friendly.`;
  }

  /**
   * Generate comparison prompt for multiple stacks
   */
  static getComparisonPrompt(
    stackNames: string[],
    context: Partial<PromptContext>
  ): string {
    return `Compare these technology stacks: ${stackNames.join(", ")}

For a ${context.projectType || "web"} project using ${context.selectedLanguages?.join(", ") || "modern languages"}.

Provide a comparison table covering:
- Learning curve
- Development speed
- Scalability
- Community support
- Best suited for

Keep it concise and actionable.`;
  }

  /**
   * Generate alternative suggestions prompt
   */
  static getAlternativesPrompt(
    currentStack: string,
    reason: string,
    context: Partial<PromptContext>
  ): string {
    return `I'm considering ${currentStack} but ${reason}.

Suggest 2-3 alternative stacks that might be better for:
- Project type: ${context.projectType || "general purpose"}
- Languages: ${context.selectedLanguages?.join(", ") || "flexible"}
${context.teamSize ? `- Team size: ${context.teamSize}` : ""}

For each alternative, briefly explain why it addresses my concern.`;
  }

  /**
   * Generate few-shot examples for better responses
   */
  static getFewShotExamples(): Array<{ user: string; assistant: string }> {
    return [
      {
        user: `Project: E-commerce site
Type: web
Languages: JavaScript, TypeScript
Stacks: Next.js, MERN, T3 Stack`,
        assistant: `{
  "recommendations": [
    {
      "stackId": "nextjs",
      "stackName": "Next.js",
      "score": 92,
      "strengths": [
        "Built-in SSR and SSG for SEO-critical e-commerce",
        "TypeScript support with excellent DX",
        "Vercel deployment optimized for performance"
      ],
      "concerns": [
        "May be overkill for very simple stores"
      ],
      "bestFor": "Modern e-commerce with dynamic content and SEO requirements",
      "reasoning": "Next.js excels at e-commerce with its hybrid rendering, built-in image optimization, and strong TypeScript support. Perfect for product pages that need SEO while maintaining great user experience."
    }
  ],
  "summary": "Next.js is the top choice for modern e-commerce, offering the best balance of SEO, performance, and developer experience with TypeScript."
}`,
      },
      {
        user: `Project: Real-time chat app
Type: web
Languages: Python, JavaScript
Stacks: Django, FastAPI + React, MERN`,
        assistant: `{
  "recommendations": [
    {
      "stackId": "fastapi-react",
      "stackName": "FastAPI + React",
      "score": 88,
      "strengths": [
        "FastAPI's WebSocket support ideal for real-time features",
        "Async Python perfect for concurrent connections",
        "React provides smooth real-time UI updates"
      ],
      "concerns": [
        "Requires separate frontend/backend deployment"
      ],
      "bestFor": "Real-time applications requiring WebSocket connections and async processing",
      "reasoning": "FastAPI's native async support and WebSocket capabilities make it excellent for real-time chat. Combined with React's efficient re-rendering, you get a responsive chat experience with Python's ecosystem for backend logic."
    }
  ],
  "summary": "FastAPI + React is ideal for real-time applications, leveraging Python's async capabilities and React's reactive UI for smooth chat experiences."
}`,
      },
    ];
  }
}
