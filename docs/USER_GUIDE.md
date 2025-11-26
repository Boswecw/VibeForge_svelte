# VibeForge User Guide

> Complete guide to using the VibeForge workbench for LLM-powered workflows

**Version**: 5.3.0
**Last Updated**: 2025-01-26

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Workbench Overview](#workbench-overview)
4. [Context Management](#context-management)
5. [Prompt Engineering](#prompt-engineering)
6. [Model Selection](#model-selection)
7. [Execution & Output](#execution--output)
8. [Workflow Examples](#workflow-examples)
9. [Advanced Features](#advanced-features)
10. [Tips & Best Practices](#tips--best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Introduction

VibeForge is an AI-powered project automation platform designed to streamline your workflow with large language models (LLMs). The workbench provides a powerful three-column interface for managing context, crafting prompts, and viewing outputs.

### Key Features

- **Context Management**: Organize and activate context blocks for prompts
- **Variable Substitution**: Use templates with `{{variable}}` syntax
- **Multi-Model Execution**: Run prompts across multiple LLM providers
- **Token Estimation**: Track token usage and costs in real-time
- **MCP Integration**: Leverage Model Context Protocol tools
- **Run History**: Review past executions with full analytics

---

## Getting Started

### Launching VibeForge

```bash
# Development mode
pnpm dev

# Production build
pnpm build
pnpm preview
```

The application will be available at `http://localhost:5173` (development) or `http://localhost:4173` (preview).

### Initial Setup

1. **Select a Workspace**: Choose or create a workspace from the top bar
2. **Configure Settings**: Set theme (dark/light) and preferences
3. **Verify MCP Servers**: Check that MCP servers are connected (Context column)

---

## Workbench Overview

The workbench consists of three main columns:

```
┌──────────────┬──────────────┬──────────────┐
│   CONTEXT    │    PROMPT    │    OUTPUT    │
│              │              │              │
│ • Blocks     │ • Editor     │ • Results    │
│ • MCP Tools  │ • Variables  │ • History    │
│ • Token Est. │ • Templates  │ • Metrics    │
└──────────────┴──────────────┴──────────────┘
```

### Navigation

- **Left Rail**: Quick navigation to Workbench, History, Patterns, etc.
- **Top Bar**: Workspace selector, theme toggle, user menu
- **Status Bar**: Token count, model info, execution status

---

## Context Management

Context blocks provide background information to your prompts without including them directly in the prompt text.

### Adding Context Blocks

1. Navigate to the **Context** column
2. Click **"+ Add Context"**
3. Fill in:
   - **Name**: Descriptive title (e.g., "Project Requirements")
   - **Kind**: Type of context (text, code, document)
   - **Content**: The actual context content

**Example**:
```
Name: Product Specs
Kind: text
Content: Our product is a SaaS platform for team collaboration...
```

### Activating Blocks

- Click the toggle next to a block to activate/deactivate
- Only **active blocks** are included in prompt execution
- Monitor total tokens in the Context header

### Reordering Blocks

- Drag and drop blocks to reorder
- Order matters: blocks appear in prompt in the order shown

### Managing Blocks

- **Edit**: Click the edit icon to modify content
- **Delete**: Click the trash icon to remove
- **Duplicate**: Create a copy of an existing block

### Token Estimation

Each block shows an estimated token count:
```
My Context Block          [~250 tokens]  ○ Active
```

The Context header shows the total:
```
Context (3 blocks, ~750 tokens)
```

---

## Prompt Engineering

The Prompt column is where you craft your instructions for the LLM.

### Writing Prompts

Simply type or paste your prompt in the text editor:

```
Analyze the provided product specifications and create a
feature prioritization matrix with the following criteria:
- User impact
- Development complexity
- Strategic alignment
```

### Using Variables

Create reusable prompts with variable substitution:

```
Translate the following {{language}} code to {{target_language}}:

{{code}}
```

Variables are automatically detected and input fields appear below the editor.

#### Variable Syntax

- Use double curly braces: `{{variableName}}`
- Variable names must be alphanumeric (a-z, A-Z, 0-9, _)
- Variables can appear multiple times

#### Filling Variables

1. Type your prompt with `{{variables}}`
2. Input fields appear automatically
3. Fill in each variable value
4. The preview shows the resolved prompt

**Example**:
```
Prompt:     Summarize {{text}} in {{length}} sentences
Variables:  text → "Long article content..."
            length → "5"
Resolved:   Summarize Long article content... in 5 sentences
```

### Using Templates

Save common prompts as templates:

1. Click **"Templates"** dropdown
2. Select a template (e.g., "Code Review", "Summarize Text")
3. Template loads with variables pre-defined
4. Fill in variable values

### Token Estimation

The Prompt editor shows estimated tokens:
```
Prompt Editor                     [~120 tokens]
```

**Note**: This is an approximation. Actual token counts vary by model.

---

## Model Selection

Choose which LLM models to run your prompt against.

### Selecting Models

1. In the **Prompt** column, find the model selector
2. Choose from available providers:
   - **Anthropic**: Claude models (Sonnet, Opus, Haiku)
   - **OpenAI**: GPT models (GPT-4, GPT-3.5)
   - **Local**: Self-hosted models

### Single vs Multi-Model

**Single Model** (Dropdown):
- Select one model from the dropdown
- Faster execution
- Best for quick iterations

**Multi-Model** (Checkboxes):
- Select multiple models
- Compare responses side-by-side
- Useful for model evaluation

### Model Information

Each model displays:
- **Name**: Model identifier
- **Context Window**: Maximum token capacity
- **Cost**: Price per 1k tokens (if applicable)

**Example**:
```
Claude Sonnet 4.5
Max Tokens: 200,000
Cost: $0.003/1k tokens
```

### Cost Estimation

Before execution, view estimated cost:
```
Estimated Cost: $0.0045
(1,500 tokens × 1 model × $0.003/1k)
```

---

## Execution & Output

Execute prompts and view results in the Output column.

### Running a Prompt

1. **Verify Context**: Ensure correct blocks are active
2. **Fill Variables**: Complete all variable fields (if any)
3. **Select Model(s)**: Choose at least one model
4. **Click "Run"** or press **Cmd+Enter** (Mac) / **Ctrl+Enter** (Windows)

### Execution Progress

During execution:
- Progress bar shows completion percentage
- Status updates in the status bar
- Cancel button available if needed

### Viewing Output

The Output column displays:

#### Header
```
Output: Claude Sonnet 4.5
Tokens: 1,245 | Duration: 2.3s | Cost: $0.0037
```

#### Response
The LLM's full response with formatting preserved.

#### Actions
- **Copy**: Copy output to clipboard
- **Save**: Save to file or workspace
- **Compare**: View alongside other runs (multi-model)

### Run History

Access previous executions:

1. Click the **"History"** dropdown in Output column
2. Select a past run to view
3. All metadata preserved (tokens, cost, duration)

### Run Comparison (Multi-Model)

When running multiple models:

1. Each model's output appears in a separate panel
2. Switch between outputs using tabs or dropdown
3. Compare side-by-side for quality assessment

---

## Workflow Examples

### Example 1: Code Review

**Goal**: Review a code file for best practices

1. **Context**: Add code file as context block
   ```
   Name: User Controller
   Kind: code
   Content: [paste your code]
   ```

2. **Prompt**:
   ```
   Review the provided code for:
   - Security vulnerabilities
   - Performance issues
   - Code style and best practices
   - Potential bugs

   Provide specific recommendations with line numbers.
   ```

3. **Model**: Select Claude Sonnet 4.5 (good for code review)

4. **Execute** and review recommendations

---

### Example 2: Multi-Language Translation

**Goal**: Translate text to multiple languages

1. **Context**: No context needed

2. **Prompt** with variables:
   ```
   Translate the following English text to {{language}}:

   {{text}}

   Provide a natural, idiomatic translation.
   ```

3. **Variables**:
   - `text`: "Welcome to our platform"
   - `language`: "Spanish" (run once)
   - Then change to "French" and run again

4. **Model**: GPT-4 or Claude

5. **Compare** translations for quality

---

### Example 3: Data Analysis

**Goal**: Analyze CSV data and generate insights

1. **Context**: Add CSV data
   ```
   Name: Sales Data Q4 2024
   Kind: text
   Content: [paste CSV data]
   ```

2. **Prompt**:
   ```
   Analyze the provided sales data and:
   1. Identify top 5 performing products
   2. Calculate total revenue
   3. Detect any anomalies or trends
   4. Provide actionable recommendations

   Format output as a business report.
   ```

3. **Model**: Claude Opus (best for analysis)

4. **Review** insights and export report

---

### Example 4: Template-Based Email

**Goal**: Generate personalized emails using a template

1. **Prompt** with variables:
   ```
   Write a professional email with the following details:

   To: {{recipient_name}}
   Subject: {{subject}}
   Tone: {{tone}}

   Body:
   {{main_points}}

   Include a call-to-action and professional sign-off.
   ```

2. **Variables**:
   - `recipient_name`: "Dr. Smith"
   - `subject`: "Project Proposal Follow-up"
   - `tone`: "formal and respectful"
   - `main_points`: "1. Thank for meeting 2. Attach proposal 3. Request feedback"

3. **Model**: GPT-4 or Claude Sonnet

4. **Iterate** by adjusting variables and re-running

---

## Advanced Features

### MCP Tools

Access Model Context Protocol tools in the Context column:

1. **View Available Tools**: Expand "MCP Tools" section
2. **Select Tool**: Click to activate
3. **Configure**: Fill in required parameters
4. **Execute**: Tool results are automatically added to context

**Example Tools**:
- `queryKB`: Search knowledge base
- `webSearch`: Fetch web results
- `ingestDocument`: Process and add documents

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Enter` (Mac) / `Ctrl+Enter` (Win) | Execute prompt |
| `Cmd+K` | Command palette (planned) |
| `Cmd+/` | Toggle comment (in editor) |
| `Esc` | Cancel execution |

### Workspace Settings

Customize your workspace:

1. Click workspace name in top bar
2. Select **"Settings"**
3. Configure:
   - **Theme**: Dark or light mode
   - **Auto-Save**: Enable/disable
   - **Default Model**: Set preferred model
   - **Token Limits**: Set warnings

### Run Analytics

View aggregate statistics:

1. Navigate to **"History"** in left rail
2. View:
   - Total runs
   - Total tokens used
   - Total cost
   - Average duration
   - Success/failure rates

---

## Tips & Best Practices

### Context Management

✅ **Do**:
- Keep context blocks focused and relevant
- Use descriptive names for easy identification
- Deactivate unused blocks to save tokens
- Monitor total token count

❌ **Don't**:
- Don't include duplicate information
- Don't activate all blocks unnecessarily
- Don't exceed model context limits

### Prompt Engineering

✅ **Do**:
- Be specific and clear in instructions
- Use examples when helpful
- Break complex tasks into steps
- Test prompts with different models

❌ **Don't**:
- Don't be overly verbose
- Don't use ambiguous language
- Don't forget to specify output format

### Variable Usage

✅ **Do**:
- Use variables for reusable prompts
- Name variables clearly (`user_input`, not `x`)
- Test with different variable values
- Save successful prompts as templates

❌ **Don't**:
- Don't use special characters in variable names
- Don't forget to fill all variables
- Don't nest variables

### Model Selection

✅ **Do**:
- Choose models based on task complexity
- Use cost estimation before running
- Compare models for critical tasks
- Consider context window limits

❌ **Don't**:
- Don't use expensive models for simple tasks
- Don't ignore token limits
- Don't run unnecessary multi-model comparisons

---

## Troubleshooting

### Prompt Won't Execute

**Problem**: "Run" button is disabled

**Solutions**:
- ✓ Ensure at least one model is selected
- ✓ Fill all required variables
- ✓ Check that prompt is not empty
- ✓ Verify you're not already executing

---

### High Token Count

**Problem**: Context blocks exceed token limit

**Solutions**:
- Deactivate unnecessary blocks
- Shorten block content
- Split into multiple runs
- Choose model with larger context window

---

### Execution Error

**Problem**: Run fails with error message

**Solutions**:
- Check MCP server connection status
- Verify API keys are configured
- Review error message for specifics
- Try again with different model
- Check workspace permissions

---

### Variables Not Detected

**Problem**: Typed `{{variable}}` but input field doesn't appear

**Solutions**:
- Ensure correct syntax: `{{name}}` not `{name}` or `{{name}}`
- Check for typos in variable names
- Re-type the prompt if needed
- Verify no special characters in name

---

### Cost Concerns

**Problem**: Estimated costs are too high

**Solutions**:
- Use cheaper models (Claude Haiku, GPT-3.5)
- Reduce context block length
- Shorten expected output
- Use local models for testing
- Set budget alerts in workspace settings

---

## Additional Resources

- [API Reference](./api/README.md) - Developer documentation
- [Architecture Guide](./ARCHITECTURE.md) - System design
- [MCP Integration Guide](./MCP_GUIDE.md) - Protocol details
- [Phase 2 Completion](../PHASE2_COMPLETE.md) - Testing achievements
- [Phase 3 Completion](../PHASE3_COMPLETE.md) - Documentation enhancement

---

## Need Help?

- **Documentation**: Check the [guides directory](./guides/)
- **GitHub Issues**: Report bugs or request features
- **Community**: Join the discussion (link TBD)

---

**© 2025 Boswell Digital Solutions LLC**
**All Rights Reserved**
