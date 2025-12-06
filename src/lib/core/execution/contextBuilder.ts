/**
 * VibeForge V2 - Context Builder
 *
 * Assembles execution context from active context blocks and MCP tool results.
 */

import type { ContextBlock } from '$lib/core/types';
import type { LLMMessage } from '$lib/core/llm/types';
import type {
  ExecutionContext,
  ToolResult,
  ContextAssemblyOptions,
} from './types';

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

export class ContextBuilder {
  /**
   * Build execution context from blocks, prompt, and tool results
   */
  static build(
    prompt: string,
    contextBlocks: ContextBlock[],
    toolResults: ToolResult[] = [],
    options: ContextAssemblyOptions = {}
  ): ExecutionContext {
    const {
      maxTokens,
      priorityOrder = 'manual',
      includeToolResults = true,
      toolResultFormat = 'text',
    } = options;

    // Sort context blocks by priority
    const sortedBlocks = this.sortBlocksByPriority(contextBlocks, priorityOrder);

    // Assemble system context
    const systemContext = this.assembleSystemContext(
      sortedBlocks,
      includeToolResults ? toolResults : [],
      toolResultFormat,
      maxTokens
    );

    // Calculate token estimates
    const contextBlockCount = sortedBlocks.length;
    const toolResultCount = includeToolResults ? toolResults.length : 0;
    const totalContextTokens = this.estimateTokens(systemContext);
    const userPromptTokens = this.estimateTokens(prompt);

    // Format as LLM messages
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: systemContext,
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    return {
      systemContext,
      userPrompt: prompt,
      messages,
      metadata: {
        contextBlockCount,
        toolResultCount,
        totalContextTokens,
        userPromptTokens,
      },
    };
  }

  /**
   * Sort context blocks by priority order
   */
  private static sortBlocksByPriority(
    blocks: ContextBlock[],
    priorityOrder: 'manual' | 'kind' | 'recent'
  ): ContextBlock[] {
    const sorted = [...blocks];

    switch (priorityOrder) {
      case 'kind': {
        // Priority: system > design > project > code > workflow > data
        const kindOrder: Record<string, number> = {
          system: 1,
          design: 2,
          project: 3,
          code: 4,
          workflow: 5,
          data: 6,
        };
        return sorted.sort(
          (a, b) =>
            (kindOrder[a.kind] || 999) - (kindOrder[b.kind] || 999)
        );
      }

      case 'recent':
        return sorted.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

      case 'manual':
      default:
        // Keep original order (as arranged by user)
        return sorted;
    }
  }

  /**
   * Assemble system context from blocks and tool results
   */
  private static assembleSystemContext(
    blocks: ContextBlock[],
    toolResults: ToolResult[],
    toolResultFormat: 'json' | 'text',
    maxTokens?: number
  ): string {
    const parts: string[] = [];

    // Add context blocks
    if (blocks.length > 0) {
      parts.push('# Context Information\n');

      for (const block of blocks) {
        parts.push(this.formatContextBlock(block));
      }
    }

    // Add tool results
    if (toolResults.length > 0) {
      parts.push('\n# Tool Execution Results\n');

      for (const result of toolResults) {
        parts.push(this.formatToolResult(result, toolResultFormat));
      }
    }

    let assembled = parts.join('\n');

    // Truncate if exceeds max tokens
    if (maxTokens) {
      assembled = this.truncateToTokenLimit(assembled, maxTokens);
    }

    return assembled;
  }

  /**
   * Format a context block for inclusion in system message
   */
  private static formatContextBlock(block: ContextBlock): string {
    const parts = [];

    // Header with title and kind
    parts.push(`## ${block.title} (${block.kind})`);

    // Description if present
    if (block.description) {
      parts.push(`*${block.description}*`);
    }

    // Content
    parts.push(block.content);

    // Tags if present
    if (block.tags.length > 0) {
      parts.push(`\nTags: ${block.tags.join(', ')}`);
    }

    return parts.join('\n') + '\n';
  }

  /**
   * Format a tool result for inclusion in system message
   */
  private static formatToolResult(
    result: ToolResult,
    format: 'json' | 'text'
  ): string {
    const parts = [];

    // Header
    parts.push(`## Tool: ${result.toolName}`);
    parts.push(`Executed at: ${new Date(result.executedAt).toLocaleString()}`);

    // Status
    parts.push(`Status: ${result.success ? '✓ Success' : '✗ Failed'}`);

    // Arguments
    if (Object.keys(result.arguments).length > 0) {
      parts.push('\n### Arguments:');
      if (format === 'json') {
        parts.push('```json');
        parts.push(JSON.stringify(result.arguments, null, 2));
        parts.push('```');
      } else {
        for (const [key, value] of Object.entries(result.arguments)) {
          parts.push(`- ${key}: ${JSON.stringify(value)}`);
        }
      }
    }

    // Result
    if (result.success) {
      parts.push('\n### Result:');
      if (format === 'json') {
        parts.push('```json');
        parts.push(JSON.stringify(result.result, null, 2));
        parts.push('```');
      } else {
        parts.push(String(result.result));
      }
    } else if (result.error) {
      parts.push(`\n### Error:\n${result.error}`);
    }

    return parts.join('\n') + '\n';
  }

  /**
   * Estimate tokens for text (rough: 1 token ≈ 4 characters)
   */
  private static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Truncate text to fit within token limit
   */
  private static truncateToTokenLimit(text: string, maxTokens: number): string {
    const estimatedTokens = this.estimateTokens(text);

    if (estimatedTokens <= maxTokens) {
      return text;
    }

    // Calculate character limit (tokens * 4)
    const maxChars = maxTokens * 4;

    // Truncate with ellipsis
    return text.substring(0, maxChars - 100) + '\n\n... (truncated)';
  }

  /**
   * Validate execution context
   */
  static validate(context: ExecutionContext): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if user prompt is present
    if (!context.userPrompt || context.userPrompt.trim().length === 0) {
      errors.push('User prompt is empty');
    }

    // Check if messages are formatted correctly
    if (!context.messages || context.messages.length === 0) {
      errors.push('No messages formatted');
    }

    // Validate message structure
    for (const [index, message] of context.messages.entries()) {
      if (!message.role) {
        errors.push(`Message ${index} is missing role`);
      }
      if (!message.content) {
        errors.push(`Message ${index} is missing content`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a simple execution context from just a prompt
 */
export function createSimpleContext(prompt: string): ExecutionContext {
  return ContextBuilder.build(prompt, [], []);
}

/**
 * Create execution context with context blocks
 */
export function createContextWithBlocks(
  prompt: string,
  blocks: ContextBlock[]
): ExecutionContext {
  return ContextBuilder.build(prompt, blocks, []);
}

/**
 * Create execution context with context blocks and tool results
 */
export function createFullContext(
  prompt: string,
  blocks: ContextBlock[],
  toolResults: ToolResult[]
): ExecutionContext {
  return ContextBuilder.build(prompt, blocks, toolResults);
}
