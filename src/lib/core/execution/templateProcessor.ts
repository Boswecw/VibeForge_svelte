/**
 * VibeForge V2 - Template Processor
 *
 * Processes prompt templates with variable substitution.
 */

import type { TemplateProcessingResult } from './types';

// ============================================================================
// TEMPLATE PROCESSOR
// ============================================================================

export class TemplateProcessor {
  /**
   * Process a template with variable substitution
   */
  static process(
    template: string,
    variables: Record<string, string>
  ): TemplateProcessingResult {
    // Extract all variable placeholders (e.g., {{variableName}})
    const placeholders = this.extractPlaceholders(template);

    // Track substituted and missing variables
    const substituted: string[] = [];
    const missing: string[] = [];

    // Substitute variables
    let resolved = template;
    for (const placeholder of placeholders) {
      const value = variables[placeholder];

      if (value !== undefined && value !== null && value.trim() !== '') {
        // Substitute the variable
        const regex = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
        resolved = resolved.replace(regex, value);
        substituted.push(placeholder);
      } else {
        // Variable is missing or empty
        missing.push(placeholder);
      }
    }

    return {
      resolved,
      substituted,
      missing,
      complete: missing.length === 0,
    };
  }

  /**
   * Extract variable placeholders from template
   */
  static extractPlaceholders(template: string): string[] {
    const matches = template.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];

    // Extract variable names and deduplicate
    const placeholders = matches.map((m) => m.slice(2, -2));
    return Array.from(new Set(placeholders));
  }

  /**
   * Check if template has variables
   */
  static hasVariables(template: string): boolean {
    return /\{\{\w+\}\}/.test(template);
  }

  /**
   * Validate variable values
   */
  static validateVariables(
    template: string,
    variables: Record<string, string>
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const placeholders = this.extractPlaceholders(template);

    for (const placeholder of placeholders) {
      const value = variables[placeholder];

      if (value === undefined || value === null) {
        errors.push(`Missing variable: ${placeholder}`);
      } else if (typeof value !== 'string') {
        errors.push(`Variable ${placeholder} must be a string`);
      } else if (value.trim() === '') {
        errors.push(`Variable ${placeholder} is empty`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get default values for variables
   */
  static getDefaultValues(template: string): Record<string, string> {
    const placeholders = this.extractPlaceholders(template);
    const defaults: Record<string, string> = {};

    for (const placeholder of placeholders) {
      defaults[placeholder] = '';
    }

    return defaults;
  }

  /**
   * Preview resolved template
   */
  static preview(
    template: string,
    variables: Record<string, string>
  ): string {
    const result = this.process(template, variables);
    return result.resolved;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Resolve template with variables
 */
export function resolveTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return TemplateProcessor.process(template, variables).resolved;
}

/**
 * Check if all variables are provided
 */
export function hasAllVariables(
  template: string,
  variables: Record<string, string>
): boolean {
  const result = TemplateProcessor.process(template, variables);
  return result.complete;
}

/**
 * Get missing variables from template
 */
export function getMissingVariables(
  template: string,
  variables: Record<string, string>
): string[] {
  const result = TemplateProcessor.process(template, variables);
  return result.missing;
}
