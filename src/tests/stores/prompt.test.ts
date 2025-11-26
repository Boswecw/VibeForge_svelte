import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { promptStore } from "$lib/core/stores/prompt.svelte";
import type { PromptTemplate } from "$lib/core/types";

describe("Prompt Store", () => {
  const mockTemplate: PromptTemplate = {
    id: "tmpl-1",
    name: "Test Template",
    content: "Hello {{name}}, your task is: {{task}}",
    description: "A test template",
    variables: ["name", "task"],
    tags: ["test"],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };

  const mockTemplate2: PromptTemplate = {
    id: "tmpl-2",
    name: "Simple Template",
    content: "Write a {{type}} about {{topic}}",
    description: "Simple template",
    variables: ["type", "topic"],
    tags: ["simple"],
    createdAt: "2025-01-02T00:00:00Z",
    updatedAt: "2025-01-02T00:00:00Z",
  };

  beforeEach(() => {
    // Clear state before each test
    promptStore.clearText();
    promptStore.setTemplates([]);
    promptStore.setError(null);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  describe("Initialization", () => {
    it("should initialize with empty state", () => {
      expect(promptStore.text).toBe("");
      expect(promptStore.variables).toEqual({});
      expect(promptStore.currentTemplate).toBeNull();
      expect(promptStore.templates).toEqual([]);
      expect(promptStore.isLoading).toBe(false);
      expect(promptStore.error).toBeNull();
    });

    it("should initialize derived state correctly", () => {
      expect(promptStore.estimatedTokens).toBe(0);
      expect(promptStore.isEmpty).toBe(true);
      expect(promptStore.variablePlaceholders).toEqual([]);
      expect(promptStore.allVariablesFilled).toBe(true);
      expect(promptStore.resolvedPrompt).toBe("");
    });
  });

  // ============================================================================
  // TEXT MANAGEMENT
  // ============================================================================

  describe("setText", () => {
    it("should set prompt text", () => {
      promptStore.setText("Hello world");
      expect(promptStore.text).toBe("Hello world");
    });

    it("should auto-detect and initialize variables", () => {
      promptStore.setText("Hello {{name}}, welcome to {{place}}");

      expect(promptStore.variables).toHaveProperty("name");
      expect(promptStore.variables).toHaveProperty("place");
      expect(promptStore.variables.name).toBe("");
      expect(promptStore.variables.place).toBe("");
    });

    it("should not overwrite existing variable values", () => {
      promptStore.setText("Hello {{name}}");
      promptStore.setVariable("name", "John");

      promptStore.setText("Hello {{name}}, {{greeting}}");

      expect(promptStore.variables.name).toBe("John");
      expect(promptStore.variables.greeting).toBe("");
    });

    it("should handle text without variables", () => {
      promptStore.setText("Plain text without variables");

      expect(promptStore.text).toBe("Plain text without variables");
      expect(Object.keys(promptStore.variables)).toHaveLength(0);
    });
  });

  describe("appendText", () => {
    it("should append text to existing text", () => {
      promptStore.setText("First line");
      promptStore.appendText("Second line");

      expect(promptStore.text).toBe("First line\n\nSecond line");
    });

    it("should set text when prompt is empty", () => {
      promptStore.appendText("First line");
      expect(promptStore.text).toBe("First line");
    });

    it("should handle multiple appends", () => {
      promptStore.setText("Line 1");
      promptStore.appendText("Line 2");
      promptStore.appendText("Line 3");

      expect(promptStore.text).toBe("Line 1\n\nLine 2\n\nLine 3");
    });
  });

  describe("clearText", () => {
    it("should clear text", () => {
      promptStore.setText("Some text");
      promptStore.clearText();

      expect(promptStore.text).toBe("");
    });

    it("should clear variables", () => {
      promptStore.setText("Hello {{name}}");
      promptStore.setVariable("name", "John");
      promptStore.clearText();

      expect(promptStore.variables).toEqual({});
    });

    it("should clear current template", () => {
      promptStore.loadTemplate(mockTemplate);
      promptStore.clearText();

      expect(promptStore.currentTemplate).toBeNull();
    });
  });

  // ============================================================================
  // VARIABLE MANAGEMENT
  // ============================================================================

  describe("setVariable", () => {
    beforeEach(() => {
      promptStore.setText("Hello {{name}}");
    });

    it("should set a variable value", () => {
      promptStore.setVariable("name", "John");
      expect(promptStore.variables.name).toBe("John");
    });

    it("should update existing variable", () => {
      promptStore.setVariable("name", "John");
      promptStore.setVariable("name", "Jane");
      expect(promptStore.variables.name).toBe("Jane");
    });
  });

  describe("setVariables", () => {
    beforeEach(() => {
      promptStore.setText("Hello {{name}} from {{place}}");
    });

    it("should set multiple variables at once", () => {
      promptStore.setVariables({ name: "John", place: "NYC" });

      expect(promptStore.variables.name).toBe("John");
      expect(promptStore.variables.place).toBe("NYC");
    });

    it("should merge with existing variables", () => {
      promptStore.setVariable("name", "John");
      promptStore.setVariables({ place: "NYC" });

      expect(promptStore.variables.name).toBe("John");
      expect(promptStore.variables.place).toBe("NYC");
    });

    it("should overwrite existing variables", () => {
      promptStore.setVariable("name", "John");
      promptStore.setVariables({ name: "Jane" });

      expect(promptStore.variables.name).toBe("Jane");
    });
  });

  describe("clearVariables", () => {
    it("should clear all variables", () => {
      promptStore.setText("Hello {{name}} from {{place}}");
      promptStore.setVariables({ name: "John", place: "NYC" });

      promptStore.clearVariables();

      expect(promptStore.variables).toEqual({});
    });

    it("should not affect text", () => {
      promptStore.setText("Hello {{name}}");
      promptStore.clearVariables();

      expect(promptStore.text).toBe("Hello {{name}}");
    });
  });

  // ============================================================================
  // TEMPLATE MANAGEMENT
  // ============================================================================

  describe("loadTemplate", () => {
    it("should load template and set text", () => {
      promptStore.loadTemplate(mockTemplate);

      expect(promptStore.currentTemplate).toEqual(mockTemplate);
      expect(promptStore.text).toBe(mockTemplate.content);
    });

    it("should initialize variables from template", () => {
      promptStore.loadTemplate(mockTemplate);

      expect(promptStore.variables).toHaveProperty("name");
      expect(promptStore.variables).toHaveProperty("task");
      expect(promptStore.variables.name).toBe("");
      expect(promptStore.variables.task).toBe("");
    });

    it("should replace previous template", () => {
      promptStore.loadTemplate(mockTemplate);
      promptStore.loadTemplate(mockTemplate2);

      expect(promptStore.currentTemplate).toEqual(mockTemplate2);
      expect(promptStore.text).toBe(mockTemplate2.content);
    });

    it("should reset variables when loading new template", () => {
      promptStore.loadTemplate(mockTemplate);
      promptStore.setVariable("name", "John");

      promptStore.loadTemplate(mockTemplate2);

      expect(promptStore.variables).not.toHaveProperty("name");
      expect(promptStore.variables).toHaveProperty("type");
      expect(promptStore.variables).toHaveProperty("topic");
    });
  });

  describe("clearTemplate", () => {
    it("should clear current template", () => {
      promptStore.loadTemplate(mockTemplate);
      promptStore.clearTemplate();

      expect(promptStore.currentTemplate).toBeNull();
    });

    it("should not clear text or variables", () => {
      promptStore.loadTemplate(mockTemplate);
      promptStore.setVariable("name", "John");

      promptStore.clearTemplate();

      expect(promptStore.text).toBe(mockTemplate.content);
      expect(promptStore.variables.name).toBe("John");
    });
  });

  describe("setTemplates", () => {
    it("should set templates array", () => {
      const templates = [mockTemplate, mockTemplate2];
      promptStore.setTemplates(templates);

      expect(promptStore.templates).toEqual(templates);
    });

    it("should replace existing templates", () => {
      promptStore.setTemplates([mockTemplate]);
      promptStore.setTemplates([mockTemplate2]);

      expect(promptStore.templates).toEqual([mockTemplate2]);
    });
  });

  // ============================================================================
  // DERIVED STATE - TOKEN ESTIMATION
  // ============================================================================

  describe("estimatedTokens", () => {
    it("should estimate tokens from text length", () => {
      promptStore.setText("Hello world"); // 11 chars = ~2 tokens
      expect(promptStore.estimatedTokens).toBe(2);
    });

    it("should return 0 for empty text", () => {
      expect(promptStore.estimatedTokens).toBe(0);
    });

    it("should update when text changes", () => {
      promptStore.setText("Short"); // 5 chars = 1 token
      expect(promptStore.estimatedTokens).toBe(1);

      promptStore.setText("This is a much longer text with many words"); // 42 chars = 10 tokens
      expect(promptStore.estimatedTokens).toBe(10);
    });
  });

  // ============================================================================
  // DERIVED STATE - EMPTY CHECK
  // ============================================================================

  describe("isEmpty", () => {
    it("should return true for empty text", () => {
      expect(promptStore.isEmpty).toBe(true);
    });

    it("should return true for whitespace-only text", () => {
      promptStore.setText("   \n\t  ");
      expect(promptStore.isEmpty).toBe(true);
    });

    it("should return false for non-empty text", () => {
      promptStore.setText("Hello");
      expect(promptStore.isEmpty).toBe(false);
    });
  });

  // ============================================================================
  // DERIVED STATE - VARIABLE PLACEHOLDERS
  // ============================================================================

  describe("variablePlaceholders", () => {
    it("should extract variable placeholders from text", () => {
      promptStore.setText("Hello {{name}}, your task is: {{task}}");

      expect(promptStore.variablePlaceholders).toEqual(["name", "task"]);
    });

    it("should return empty array when no placeholders", () => {
      promptStore.setText("Plain text without variables");

      expect(promptStore.variablePlaceholders).toEqual([]);
    });

    it("should handle duplicate placeholders", () => {
      promptStore.setText("{{name}} and {{name}} again");

      expect(promptStore.variablePlaceholders).toEqual(["name", "name"]);
    });

    it("should handle multiple different placeholders", () => {
      promptStore.setText("{{a}} {{b}} {{c}} {{d}}");

      expect(promptStore.variablePlaceholders).toEqual(["a", "b", "c", "d"]);
    });
  });

  // ============================================================================
  // DERIVED STATE - ALL VARIABLES FILLED
  // ============================================================================

  describe("allVariablesFilled", () => {
    beforeEach(() => {
      promptStore.setText("Hello {{name}} from {{place}}");
    });

    it("should return false when variables are not filled", () => {
      expect(promptStore.allVariablesFilled).toBe(false);
    });

    it("should return false when some variables are filled", () => {
      promptStore.setVariable("name", "John");
      expect(promptStore.allVariablesFilled).toBe(false);
    });

    it("should return true when all variables are filled", () => {
      promptStore.setVariable("name", "John");
      promptStore.setVariable("place", "NYC");
      expect(promptStore.allVariablesFilled).toBe(true);
    });

    it("should return false when variables are whitespace-only", () => {
      promptStore.setVariable("name", "  ");
      promptStore.setVariable("place", "\n\t");
      expect(promptStore.allVariablesFilled).toBe(false);
    });

    it("should return true when no variables exist", () => {
      promptStore.setText("Plain text");
      expect(promptStore.allVariablesFilled).toBe(true);
    });
  });

  // ============================================================================
  // DERIVED STATE - RESOLVED PROMPT
  // ============================================================================

  describe("resolvedPrompt", () => {
    it("should resolve variables in prompt", () => {
      promptStore.setText("Hello {{name}}, welcome to {{place}}");
      promptStore.setVariable("name", "John");
      promptStore.setVariable("place", "NYC");

      expect(promptStore.resolvedPrompt).toBe("Hello John, welcome to NYC");
    });

    it("should replace unset variables with empty string", () => {
      promptStore.setText("Hello {{name}}");
      // Variable is auto-initialized to "" but not set

      expect(promptStore.resolvedPrompt).toBe("Hello ");
    });

    it("should handle multiple occurrences of same variable", () => {
      promptStore.setText("{{name}} loves {{name}}");
      promptStore.setVariable("name", "Alice");

      expect(promptStore.resolvedPrompt).toBe("Alice loves Alice");
    });

    it("should return original text when no variables", () => {
      promptStore.setText("Plain text");

      expect(promptStore.resolvedPrompt).toBe("Plain text");
    });

    it("should handle partial variable filling", () => {
      promptStore.setText("{{a}} and {{b}}");
      promptStore.setVariable("a", "First");
      // b is auto-initialized to ""

      expect(promptStore.resolvedPrompt).toBe("First and ");
    });
  });

  // ============================================================================
  // LOADING AND ERROR STATE
  // ============================================================================

  describe("setLoading", () => {
    it("should set loading state to true", () => {
      promptStore.setLoading(true);
      expect(promptStore.isLoading).toBe(true);
    });

    it("should set loading state to false", () => {
      promptStore.setLoading(true);
      promptStore.setLoading(false);
      expect(promptStore.isLoading).toBe(false);
    });
  });

  describe("setError", () => {
    it("should set error message", () => {
      promptStore.setError("Test error");
      expect(promptStore.error).toBe("Test error");
    });

    it("should clear error message", () => {
      promptStore.setError("Test error");
      promptStore.setError(null);
      expect(promptStore.error).toBeNull();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe("Integration", () => {
    it("should handle complete workflow: load template, fill variables, resolve", () => {
      // Load template
      promptStore.loadTemplate(mockTemplate);
      expect(promptStore.text).toBe("Hello {{name}}, your task is: {{task}}");

      // Fill variables
      promptStore.setVariable("name", "Alice");
      promptStore.setVariable("task", "write tests");

      // Check all filled
      expect(promptStore.allVariablesFilled).toBe(true);

      // Get resolved prompt
      expect(promptStore.resolvedPrompt).toBe(
        "Hello Alice, your task is: write tests"
      );

      // Check token estimation
      expect(promptStore.estimatedTokens).toBeGreaterThan(0);
    });

    it("should handle text modification after template load", () => {
      promptStore.loadTemplate(mockTemplate);
      promptStore.setText("Modified: {{name}} - {{task}} - {{extra}}");

      expect(promptStore.variablePlaceholders).toEqual(["name", "task", "extra"]);
      expect(promptStore.variables).toHaveProperty("extra");
    });

    it("should maintain state across multiple operations", () => {
      // Initial setup
      promptStore.setText("Test {{var1}}");
      promptStore.setVariable("var1", "value1");

      // Append more text
      promptStore.appendText("More {{var2}}");
      promptStore.setVariable("var2", "value2");

      // Verify state
      expect(promptStore.text).toContain("Test {{var1}}");
      expect(promptStore.text).toContain("More {{var2}}");
      expect(promptStore.variables.var1).toBe("value1");
      expect(promptStore.variables.var2).toBe("value2");
    });
  });
});
