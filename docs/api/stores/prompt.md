# Prompt Store API

> Manages prompt text, variables, and templates with auto-detection and token estimation

**File**: [`src/lib/core/stores/prompt.svelte.ts`](../../../src/lib/core/stores/prompt.svelte.ts)
**Test File**: [`src/tests/stores/prompt.test.ts`](../../../src/tests/stores/prompt.test.ts)
**Test Coverage**: 54 tests

## Overview

The `promptStore` manages prompt text with variable substitution support, template loading, and automatic token estimation. Variables are automatically detected from `{{variableName}}` placeholders.

## State Interface

```typescript
interface PromptStoreState {
  text: string;
  variables: Record<string, string>;
  currentTemplate: PromptTemplate | null;
  templates: PromptTemplate[];
  isLoading: boolean;
  error: string | null;
}
```

## API Reference

### State Getters

| Property | Type | Description |
|----------|------|-------------|
| `promptStore.text` | `string` | Current prompt text |
| `promptStore.variables` | `Record<string, string>` | Variable values for substitution |
| `promptStore.currentTemplate` | `PromptTemplate \| null` | Currently loaded template |
| `promptStore.templates` | `PromptTemplate[]` | Available templates |
| `promptStore.isLoading` | `boolean` | Loading state |
| `promptStore.error` | `string \| null` | Error message if any |

### Derived State

| Property | Type | Description |
|----------|------|-------------|
| `promptStore.estimatedTokens` | `number` | Estimated token count (text.length / 4) |
| `promptStore.isEmpty` | `boolean` | True if prompt text is empty |
| `promptStore.variablePlaceholders` | `string[]` | Detected variable names from `{{var}}` syntax |
| `promptStore.allVariablesFilled` | `boolean` | True if all variables have values |
| `promptStore.resolvedPrompt` | `string` | Prompt with variables substituted |

### Actions

#### Text Management

```typescript
promptStore.setText(text: string): void           // Set prompt text, auto-detects variables
promptStore.appendText(text: string): void        // Append text with newlines
promptStore.clearText(): void                     // Clear text and variables
```

#### Variable Management

```typescript
promptStore.setVariable(key: string, value: string): void
promptStore.setVariables(variables: Record<string, string>): void
promptStore.clearVariables(): void
```

#### Template Management

```typescript
promptStore.loadTemplate(template: PromptTemplate): void
promptStore.clearTemplate(): void
promptStore.setTemplates(templates: PromptTemplate[]): void
```

#### Utility

```typescript
promptStore.setLoading(loading: boolean): void
promptStore.setError(error: string | null): void
```

## Usage Examples

### Basic Prompt Entry

```svelte
<script lang="ts">
  import { promptStore } from '$lib/core/stores/prompt.svelte';

  let promptText = $state('');

  function handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    promptStore.setText(target.value);
  }
</script>

<div class="prompt-editor">
  <textarea
    value={promptStore.text}
    oninput={handleInput}
    placeholder="Enter your prompt..."
  />
  <span class="token-count">{promptStore.estimatedTokens} tokens</span>
</div>
```

### Variable Substitution

```svelte
<script lang="ts">
  import { promptStore } from '$lib/core/stores/prompt.svelte';

  // Prompt with variables
  const templateText = 'Summarize this text in {{length}} sentences: {{text}}';
  promptStore.setText(templateText);

  // Variable placeholders are auto-detected
  const placeholders = $derived(promptStore.variablePlaceholders);
  // ['length', 'text']

  // Set variable values
  promptStore.setVariable('length', '3');
  promptStore.setVariable('text', 'Lorem ipsum dolor sit amet...');

  // Get resolved prompt
  const resolved = $derived(promptStore.resolvedPrompt);
  // 'Summarize this text in 3 sentences: Lorem ipsum dolor sit amet...'
</script>

<div class="variable-editor">
  {#each placeholders as varName}
    <label>
      {varName}:
      <input
        type="text"
        value={promptStore.variables[varName] || ''}
        oninput={(e) => promptStore.setVariable(varName, e.target.value)}
      />
    </label>
  {/each}

  <div class="preview">
    <h4>Resolved Prompt:</h4>
    <p>{resolved}</p>
  </div>

  {#if !promptStore.allVariablesFilled}
    <p class="warning">Please fill all variables</p>
  {/if}
</div>
```

### Template Loading

```typescript
import { promptStore } from '$lib/core/stores/prompt.svelte';
import type { PromptTemplate } from '$lib/core/types';

const template: PromptTemplate = {
  id: 'summarize',
  name: 'Text Summarizer',
  category: 'text-processing',
  content: 'Summarize the following in {{length}} sentences:\n\n{{text}}',
  variables: ['length', 'text'],
  description: 'Summarize text to specified length',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Load template
promptStore.loadTemplate(template);

// Variables are initialized as empty strings
console.log(promptStore.variables);
// { length: '', text: '' }

// Fill variables
promptStore.setVariables({
  length: '5',
  text: 'Long article content here...',
});
```

### Complete Prompt Editor Component

```svelte
<script lang="ts">
  import { promptStore } from '$lib/core/stores/prompt.svelte';

  const hasVariables = $derived(promptStore.variablePlaceholders.length > 0);
  const canExecute = $derived(
    !promptStore.isEmpty && promptStore.allVariablesFilled
  );
</script>

<div class="prompt-editor">
  <!-- Main Textarea -->
  <textarea
    value={promptStore.text}
    oninput={(e) => promptStore.setText(e.target.value)}
    placeholder="Enter your prompt (use {{variable}} syntax for variables)"
    rows="10"
  />

  <!-- Token Counter -->
  <div class="meta">
    <span>Tokens: {promptStore.estimatedTokens}</span>
    {#if promptStore.currentTemplate}
      <span>Template: {promptStore.currentTemplate.name}</span>
    {/if}
  </div>

  <!-- Variables Section -->
  {#if hasVariables}
    <div class="variables">
      <h3>Variables</h3>
      {#each promptStore.variablePlaceholders as varName}
        <label>
          {varName}
          <input
            type="text"
            value={promptStore.variables[varName] || ''}
            oninput={(e) => promptStore.setVariable(varName, e.target.value)}
            placeholder="Enter value for {varName}"
          />
        </label>
      {/each}
    </div>
  {/if}

  <!-- Actions -->
  <div class="actions">
    <button
      onclick={() => promptStore.clearText()}
      disabled={promptStore.isEmpty}
    >
      Clear
    </button>

    <button disabled={!canExecute}>
      Execute Prompt
    </button>
  </div>

  <!-- Resolved Preview (when variables exist) -->
  {#if hasVariables}
    <details>
      <summary>Preview Resolved Prompt</summary>
      <pre>{promptStore.resolvedPrompt}</pre>
    </details>
  {/if}
</div>
```

### Template Selector

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { promptStore } from '$lib/core/stores/prompt.svelte';

  onMount(() => {
    // Load templates (normally from API)
    promptStore.setTemplates([
      {
        id: '1',
        name: 'Code Review',
        category: 'development',
        content: 'Review this {{language}} code:\n\n{{code}}',
        variables: ['language', 'code'],
        description: 'Code review template',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // ... more templates
    ]);
  });
</script>

<div class="template-selector">
  <select onchange={(e) => {
    const template = promptStore.templates.find(
      t => t.id === e.target.value
    );
    if (template) promptStore.loadTemplate(template);
  }}>
    <option value="">Select a template...</option>
    {#each promptStore.templates as template}
      <option value={template.id}>{template.name}</option>
    {/each}
  </select>

  {#if promptStore.currentTemplate}
    <button onclick={() => promptStore.clearTemplate()}>
      Clear Template
    </button>
  {/if}
</div>
```

## Variable Syntax

### Placeholder Format

Variables use double-curly-brace syntax:
```
{{variableName}}
```

### Auto-Detection

Variables are automatically detected and initialized when setting text:
```typescript
promptStore.setText('Hello {{name}}, you are {{age}} years old');

// Variables object is automatically initialized:
// { name: '', age: '' }
```

### Multiple Occurrences

The same variable can appear multiple times:
```
Translate "{{text}}" to French. Then translate "{{text}}" to Spanish.
```

### Resolution

Variables are replaced in the resolved prompt:
```typescript
promptStore.setText('Hello {{name}}!');
promptStore.setVariable('name', 'Alice');
console.log(promptStore.resolvedPrompt); // 'Hello Alice!'
```

## Token Estimation

Tokens are estimated using a simple algorithm:
```typescript
const estimatedTokens = Math.floor(text.length / 4);
```

**Note**: This is an approximation. Actual token counts vary by:
- Tokenizer used (GPT, Claude, etc.)
- Language (English vs other languages)
- Special characters and formatting

For accurate token counts, use the specific LLM provider's tokenizer.

## Best Practices

### ✅ Do

- Use variable syntax `{{var}}` for reusable prompts
- Check `allVariablesFilled` before execution
- Use `resolvedPrompt` to see final text with variables
- Load templates to standardize common prompts
- Monitor `estimatedTokens` to stay within context limits

### ❌ Don't

- Don't use other variable syntaxes (only `{{var}}` supported)
- Don't rely solely on token estimation for limits
- Don't forget to handle empty prompt state
- Don't mutate variables object directly

---

**Last Updated**: 2025-01-26
**Version**: 5.3.0
**Test Coverage**: 54 tests (text, variables, templates, resolution)
