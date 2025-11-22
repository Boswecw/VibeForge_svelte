/**
 * VibeForge V2 - Prompt Store
 *
 * Manages prompt state and template handling using Svelte 5 runes.
 */

import type { PromptTemplate } from '$lib/core/types';

// ============================================================================
// PROMPT STATE
// ============================================================================

interface PromptStoreState {
  text: string;
  variables: Record<string, string>;
  currentTemplate: PromptTemplate | null;
  templates: PromptTemplate[];
  isLoading: boolean;
  error: string | null;
}

const state = $state<PromptStoreState>({
  text: '',
  variables: {},
  currentTemplate: null,
  templates: [],
  isLoading: false,
  error: null,
});

// ============================================================================
// DERIVED STATE
// ============================================================================

// Estimate tokens (rough: 1 token ≈ 4 characters)
const estimatedTokens = $derived(Math.floor(state.text.length / 4));

// Check if prompt is empty
const isEmpty = $derived(state.text.trim().length === 0);

// Extract variable placeholders from text (e.g., {{variableName}})
const variablePlaceholders = $derived(() => {
  const matches = state.text.match(/\{\{(\w+)\}\}/g);
  return matches ? matches.map((m) => m.slice(2, -2)) : [];
});

// Check if all variables are filled
const allVariablesFilled = $derived(() => {
  const placeholders = variablePlaceholders();
  return placeholders.every((key) => state.variables[key]?.trim().length > 0);
});

// Resolved prompt with variables substituted
const resolvedPrompt = $derived(() => {
  let resolved = state.text;
  Object.entries(state.variables).forEach(([key, value]) => {
    resolved = resolved.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  });
  return resolved;
});

// ============================================================================
// ACTIONS
// ============================================================================

function setText(text: string) {
  state.text = text;
  // Auto-detect new variables and initialize them
  const placeholders = text.match(/\{\{(\w+)\}\}/g);
  if (placeholders) {
    placeholders.forEach((placeholder) => {
      const key = placeholder.slice(2, -2);
      if (!(key in state.variables)) {
        state.variables[key] = '';
      }
    });
  }
}

function appendText(text: string) {
  state.text = state.text ? `${state.text}\n\n${text}` : text;
}

function clearText() {
  state.text = '';
  state.variables = {};
  state.currentTemplate = null;
}

function setVariable(key: string, value: string) {
  state.variables[key] = value;
}

function setVariables(variables: Record<string, string>) {
  state.variables = { ...state.variables, ...variables };
}

function clearVariables() {
  state.variables = {};
}

function loadTemplate(template: PromptTemplate) {
  state.currentTemplate = template;
  state.text = template.content;
  // Initialize variables from template
  const vars: Record<string, string> = {};
  template.variables.forEach((v) => {
    vars[v] = '';
  });
  state.variables = vars;
}

function clearTemplate() {
  state.currentTemplate = null;
}

function setTemplates(templates: PromptTemplate[]) {
  state.templates = templates;
}

function setLoading(loading: boolean) {
  state.isLoading = loading;
}

function setError(error: string | null) {
  state.error = error;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const promptStore = {
  // State
  get text() {
    return state.text;
  },
  get variables() {
    return state.variables;
  },
  get currentTemplate() {
    return state.currentTemplate;
  },
  get templates() {
    return state.templates;
  },
  get isLoading() {
    return state.isLoading;
  },
  get error() {
    return state.error;
  },
  // Derived
  get estimatedTokens() {
    return estimatedTokens;
  },
  get isEmpty() {
    return isEmpty;
  },
  get variablePlaceholders() {
    return variablePlaceholders();
  },
  get allVariablesFilled() {
    return allVariablesFilled();
  },
  get resolvedPrompt() {
    return resolvedPrompt();
  },
  // Actions
  setText,
  appendText,
  clearText,
  setVariable,
  setVariables,
  clearVariables,
  loadTemplate,
  clearTemplate,
  setTemplates,
  setLoading,
  setError,
};
