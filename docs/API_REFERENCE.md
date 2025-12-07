# VibeForge API Reference

**Version:** 5.7.0 (Phase 2 Complete)
**Last Updated:** December 6, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Core Stores](#core-stores)
3. [Planning API](#planning-api)
4. [LLM Providers](#llm-providers)
5. [MCP Integration](#mcp-integration)
6. [Execution Engine](#execution-engine)
7. [Types Reference](#types-reference)

---

## Overview

VibeForge uses **Svelte 5 runes** for reactive state management. All stores are located in `src/lib/core/stores/` and use the `$state`, `$derived`, and `$effect` runes.

### Import Pattern

```typescript
import { themeStore } from '$lib/core/stores/theme.svelte';
import { contextBlocksStore } from '$lib/core/stores/contextBlocks.svelte';
import { planningStore } from '$lib/workbench/planning/stores/planning.svelte';
```

---

## Core Stores

### Theme Store

**Location:** `src/lib/core/stores/theme.svelte.ts`

**State:**
```typescript
interface ThemeStore {
  current: 'light' | 'dark';
  toggle: () => void;
  set: (theme: 'light' | 'dark') => void;
}
```

**Usage:**
```typescript
import { themeStore } from '$lib/core/stores/theme.svelte';

// Get current theme
const currentTheme = themeStore.current;

// Toggle theme
themeStore.toggle();

// Set specific theme
themeStore.set('dark');
```

**Persistence:** Saves to `localStorage['vibeforge-theme']`

---

### Workspace Store

**Location:** `src/lib/core/stores/workspace.svelte.ts`

**State:**
```typescript
interface Workspace {
  id: string;
  name: string;
  description: string;
  created: Date;
  updated: Date;
}

interface WorkspaceStore {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;

  // Actions
  loadWorkspaces: () => Promise<void>;
  createWorkspace: (data: Partial<Workspace>) => Promise<Workspace>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  selectWorkspace: (id: string) => void;
}
```

**Usage:**
```typescript
import { workspaceStore } from '$lib/core/stores/workspace.svelte';

// Load workspaces from API
await workspaceStore.loadWorkspaces();

// Create new workspace
const workspace = await workspaceStore.createWorkspace({
  name: 'My Project',
  description: 'Project workspace'
});

// Select workspace
workspaceStore.selectWorkspace(workspace.id);

// Get current workspace
const current = workspaceStore.currentWorkspace;
```

---

### Context Blocks Store

**Location:** `src/lib/core/stores/contextBlocks.svelte.ts`

**State:**
```typescript
interface ContextBlock {
  id: string;
  label: string;
  content: string;
  type: 'text' | 'code' | 'file';
  isActive: boolean;
  order: number;
  metadata?: {
    language?: string;
    fileName?: string;
    filePath?: string;
  };
}

interface ContextBlocksStore {
  blocks: ContextBlock[];
  activeBlocks: ContextBlock[]; // derived
  totalTokens: number; // derived

  // Actions
  addBlock: (block: Omit<ContextBlock, 'id' | 'order'>) => void;
  updateBlock: (id: string, updates: Partial<ContextBlock>) => void;
  deleteBlock: (id: string) => void;
  toggleBlock: (id: string) => void;
  reorderBlocks: (blockIds: string[]) => void;
  clearAll: () => void;
}
```

**Usage:**
```typescript
import { contextBlocksStore } from '$lib/core/stores/contextBlocks.svelte';

// Add context block
contextBlocksStore.addBlock({
  label: 'System Prompt',
  content: 'You are a helpful AI assistant...',
  type: 'text',
  isActive: true
});

// Get active blocks
const activeBlocks = contextBlocksStore.activeBlocks;

// Get total tokens
const tokens = contextBlocksStore.totalTokens;

// Toggle block active state
contextBlocksStore.toggleBlock('block-id');

// Update block content
contextBlocksStore.updateBlock('block-id', {
  content: 'Updated content...'
});
```

**Persistence:** Saves to `localStorage['vibeforge-context-blocks']`

---

### Prompt Store

**Location:** `src/lib/core/stores/prompt.svelte.ts`

**State:**
```typescript
interface PromptStore {
  text: string;
  variables: Record<string, string>;
  resolvedText: string; // derived

  // Actions
  setText: (text: string) => void;
  setVariable: (name: string, value: string) => void;
  clearVariables: () => void;
  resolveTemplate: () => string;
}
```

**Usage:**
```typescript
import { promptStore } from '$lib/core/stores/prompt.svelte';

// Set prompt text
promptStore.setText('Hello {{name}}, how can I help with {{task}}?');

// Set variables
promptStore.setVariable('name', 'Alice');
promptStore.setVariable('task', 'coding');

// Get resolved text
const resolved = promptStore.resolvedText;
// "Hello Alice, how can I help with coding?"

// Or resolve manually
const text = promptStore.resolveTemplate();
```

---

### Models Store

**Location:** `src/lib/core/stores/models.svelte.ts`

**State:**
```typescript
interface Model {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai';
  maxTokens: number;
  costPerInputToken: number;
  costPerOutputToken: number;
}

interface ModelsStore {
  availableModels: Model[];
  selectedModels: string[];

  // Derived
  activeModels: Model[];
  estimatedCost: number;

  // Actions
  toggleModel: (modelId: string) => void;
  selectModel: (modelId: string) => void;
  deselectModel: (modelId: string) => void;
  clearSelection: () => void;
}
```

**Usage:**
```typescript
import { modelsStore } from '$lib/core/stores/models.svelte';

// Get available models
const models = modelsStore.availableModels;

// Select model
modelsStore.selectModel('claude-3-5-sonnet');

// Select multiple models
modelsStore.toggleModel('gpt-4-turbo');

// Get active models
const active = modelsStore.activeModels;

// Estimate cost
const cost = modelsStore.estimatedCost;
```

---

### Runs Store

**Location:** `src/lib/core/stores/runs.svelte.ts`

**State:**
```typescript
interface Run {
  id: string;
  timestamp: Date;
  modelId: string;
  prompt: string;
  response: string;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  duration: number;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

interface RunsStore {
  runs: Run[];
  currentRun: Run | null;
  isRunning: boolean;

  // Derived
  runHistory: Run[];
  totalCost: number;
  totalTokens: number;

  // Actions
  startRun: (modelId: string, prompt: string) => Promise<Run>;
  completeRun: (runId: string, response: string, metadata: any) => void;
  failRun: (runId: string, error: string) => void;
  clearHistory: () => void;
}
```

**Usage:**
```typescript
import { runsStore } from '$lib/core/stores/runs.svelte';

// Start new run
const run = await runsStore.startRun('claude-3-5-sonnet', 'Hello, world!');

// Complete run
runsStore.completeRun(run.id, 'Response text', {
  tokenUsage: { input: 10, output: 50, total: 60 },
  cost: 0.0015,
  duration: 2500
});

// Get run history
const history = runsStore.runHistory;

// Get total cost
const totalCost = runsStore.totalCost;
```

**Persistence:** Saves to `localStorage['vibeforge-runs']`

---

## Planning API

### License Store

**Location:** `src/lib/core/stores/license.svelte.ts`

**State:**
```typescript
type LicenseTier = 'free' | 'trial' | 'pro' | 'enterprise';

interface License {
  tier: LicenseTier;
  trialStartDate?: Date;
  trialEndDate?: Date;
  usage: {
    orchestratorRunsThisMonth: number;
  };
}

interface LicenseStore {
  license: License;

  // Derived
  isFree: boolean;
  isTrial: boolean;
  isPro: boolean;
  isEnterprise: boolean;
  trialDaysRemaining: number | null;
  canUseOrchestrator: boolean;

  // Actions
  beginTrial: () => void;
  upgradeTier: (tier: LicenseTier) => void;
  recordOrchestratorRun: () => void;
}
```

**Usage:**
```typescript
import { licenseStore } from '$lib/core/stores/license.svelte';

// Check tier
if (licenseStore.canUseOrchestrator) {
  // Start planning session
}

// Begin trial
licenseStore.beginTrial();

// Check trial status
const daysLeft = licenseStore.trialDaysRemaining;

// Record usage
licenseStore.recordOrchestratorRun();
```

---

### Planning Store

**Location:** `src/lib/workbench/planning/stores/planning.svelte.ts`

**State:**
```typescript
interface PlanningSession {
  id: string;
  status: 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';
  request: {
    title: string;
    description: string;
    type: 'feature' | 'refactor' | 'bugfix';
  };
  stages: PlanningStage[];
  currentStageIndex: number;
  deliverable?: TwoFileDeliverable;
  created: Date;
  completed?: Date;
}

interface PlanningStore {
  sessions: PlanningSession[];
  currentSession: PlanningSession | null;
  isRunning: boolean;
  isPaused: boolean;
  streamingOutput: string;

  // Derived
  currentStage: PlanningStage | null;
  progress: number; // 0-100
  canStartSession: boolean;
  sessionComplete: boolean;

  // Actions
  startSession: (request: PlanningRequest) => Promise<void>;
  pauseSession: () => void;
  resumeSession: () => void;
  abortSession: () => void;
  injectContext: (context: string, stageIndex?: number) => void;
  loadSession: (sessionId: string) => void;
  downloadDeliverables: () => void;
}
```

**Usage:**
```typescript
import { planningStore } from '$lib/workbench/planning/stores/planning.svelte';

// Start planning session
await planningStore.startSession({
  title: 'User Authentication',
  description: 'Implement JWT-based auth with email/password...',
  type: 'feature'
});

// Monitor progress
const progress = planningStore.progress; // 0-100

// Pause session
planningStore.pauseSession();

// Resume session
planningStore.resumeSession();

// Get deliverable
if (planningStore.sessionComplete) {
  const deliverable = planningStore.currentSession?.deliverable;
  console.log('Plan:', deliverable?.implementationPlan);
  console.log('Prompt:', deliverable?.claudeCodePrompt);
}

// Download files
planningStore.downloadDeliverables();
```

---

## LLM Providers

### Model Router

**Location:** `src/lib/workbench/planning/services/modelRouter.ts`

**API:**
```typescript
class ModelRouter {
  // Set API keys
  setApiKey(provider: Provider, apiKey: string): void;

  // Call model
  call(options: ModelCallOptions): Promise<ModelCallResult>;

  // Abort request
  abort(): void;
}

interface ModelCallOptions {
  provider: 'anthropic' | 'openai' | 'xai' | 'google';
  model: string;
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  streaming?: boolean;
  onProgress?: (token: string) => void;
  signal?: AbortSignal;
}

interface ModelCallResult {
  content: string;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  duration: number;
}
```

**Usage:**
```typescript
import { modelRouter } from '$lib/workbench/planning/services/modelRouter';

// Set API keys
modelRouter.setApiKey('anthropic', 'sk-ant-...');
modelRouter.setApiKey('openai', 'sk-...');

// Non-streaming call
const result = await modelRouter.call({
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  prompt: 'Explain quantum computing',
  maxTokens: 1000
});

console.log('Response:', result.content);
console.log('Tokens:', result.tokenUsage.total);
console.log('Cost:', result.cost);

// Streaming call
const result = await modelRouter.call({
  provider: 'openai',
  model: 'gpt-4-turbo',
  prompt: 'Write a story...',
  streaming: true,
  onProgress: (token) => {
    console.log('Token:', token);
  }
});
```

---

## MCP Integration

### MCP Client

**Location:** `src/lib/core/mcp/client.ts`

**API:**
```typescript
class McpClient {
  constructor(config: McpServerConfig);

  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getStatus(): 'disconnected' | 'connecting' | 'connected' | 'error';

  // Tools
  listTools(): Promise<McpTool[]>;
  callTool(name: string, params: any, options?: { timeout?: number }): Promise<any>;

  // Events
  on(event: 'connected' | 'disconnected' | 'error', callback: Function): void;
}

interface McpServerConfig {
  id: string;
  name: string;
  transport: 'http' | 'websocket' | 'sse';
  url: string;
}

interface McpTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}
```

**Usage:**
```typescript
import { McpClient } from '$lib/core/mcp/client';

// Create client
const client = new McpClient({
  id: 'dataforge',
  name: 'DataForge',
  transport: 'http',
  url: 'http://localhost:8001'
});

// Connect
await client.connect();

// List tools
const tools = await client.listTools();
console.log('Available tools:', tools.map(t => t.name));

// Call tool
const result = await client.callTool('queryKB', {
  query: 'machine learning'
});
console.log('Results:', result);

// Event handling
client.on('disconnected', () => {
  console.log('Server disconnected');
});

// Disconnect
await client.disconnect();
```

---

### MCP Connection Manager

**Location:** `src/lib/core/mcp/manager.ts`

**API:**
```typescript
class McpConnectionManager {
  // Server management
  connect(config: McpServerConfig): Promise<void>;
  disconnect(serverId: string): Promise<void>;
  disconnectAll(): Promise<void>;
  getClient(serverId: string): McpClient | undefined;
  getConnectedServers(): McpServerConfig[];

  // Tools
  getAllTools(): Promise<McpTool[]>;
  invokeTool(serverId: string, toolName: string, params: any): Promise<any>;

  // Events
  on(event: 'server-connected' | 'server-disconnected', callback: (serverId: string) => void): void;
}
```

**Usage:**
```typescript
import { McpConnectionManager } from '$lib/core/mcp/manager';

const manager = new McpConnectionManager();

// Connect to multiple servers
await manager.connect({
  id: 'dataforge',
  name: 'DataForge',
  transport: 'http',
  url: 'http://localhost:8001'
});

await manager.connect({
  id: 'neuroforge',
  name: 'NeuroForge',
  transport: 'http',
  url: 'http://localhost:8000'
});

// Get all tools from all servers
const allTools = await manager.getAllTools();

// Invoke tool from specific server
const result = await manager.invokeTool('dataforge', 'queryKB', {
  query: 'test'
});

// Get connected servers
const servers = manager.getConnectedServers();
console.log('Connected to:', servers.map(s => s.name));
```

---

## Execution Engine

### Template Processor

**Location:** `src/lib/core/execution/templateProcessor.ts`

**API:**
```typescript
class TemplateProcessor {
  // Process template
  process(template: string, variables: Record<string, string>): string;

  // Extract variables
  extractVariables(template: string): string[];

  // Validate template
  validate(template: string, variables: Record<string, string>): {
    isValid: boolean;
    missingVars: string[];
  };
}
```

**Usage:**
```typescript
import { TemplateProcessor } from '$lib/core/execution/templateProcessor';

const processor = new TemplateProcessor();

// Process template
const text = processor.process(
  'Hello {{name}}, you are {{age}} years old',
  { name: 'Alice', age: '25' }
);
// "Hello Alice, you are 25 years old"

// Extract variables
const vars = processor.extractVariables('{{foo}} and {{bar}}');
// ['foo', 'bar']

// Validate
const result = processor.validate(
  '{{name}} {{age}}',
  { name: 'Alice' }
);
// { isValid: false, missingVars: ['age'] }
```

---

### Context Builder

**Location:** `src/lib/core/execution/contextBuilder.ts`

**API:**
```typescript
class ContextBuilder {
  // Build context from blocks and tools
  build(options: {
    blocks: ContextBlock[];
    toolResults?: Record<string, any>;
  }): string;

  // Estimate tokens
  estimateTokens(context: string): number;
}
```

**Usage:**
```typescript
import { ContextBuilder } from '$lib/core/execution/contextBuilder';

const builder = new ContextBuilder();

// Build context
const context = builder.build({
  blocks: [
    { label: 'System', content: 'You are a helpful assistant', isActive: true },
    { label: 'Spec', content: 'User needs...', isActive: true }
  ],
  toolResults: {
    queryKB: { results: ['doc1', 'doc2'] }
  }
});

// Estimate tokens
const tokens = builder.estimateTokens(context);
console.log('Context tokens:', tokens);
```

---

## Types Reference

### Core Types

**Location:** `src/lib/core/types/domain.ts`

```typescript
// Context
export interface ContextBlock {
  id: string;
  label: string;
  content: string;
  type: 'text' | 'code' | 'file';
  isActive: boolean;
  order: number;
  metadata?: Record<string, any>;
}

// Workspace
export interface Workspace {
  id: string;
  name: string;
  description: string;
  created: Date;
  updated: Date;
}

// Model
export interface Model {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai' | 'xai' | 'google';
  maxTokens: number;
  costPerInputToken: number;
  costPerOutputToken: number;
}

// Run
export interface Run {
  id: string;
  timestamp: Date;
  modelId: string;
  prompt: string;
  response: string;
  tokenUsage: TokenUsage;
  cost: number;
  duration: number;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}
```

### Planning Types

**Location:** `src/lib/workbench/planning/types/index.ts`

```typescript
export type StageType = 'initial' | 'review' | 'refinement' | 'final';
export type StageStatus = 'pending' | 'running' | 'completed' | 'failed';
export type Provider = 'anthropic' | 'openai' | 'xai' | 'google';
export type RequestType = 'feature' | 'refactor' | 'bugfix';
export type SessionStatus = 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface PlanningStage {
  id: string;
  index: number;
  type: StageType;
  model: string;
  provider: Provider;
  status: StageStatus;
  input: string;
  output: string;
  error?: string;
  tokenUsage?: TokenUsage;
  cost?: number;
  duration?: number;
  startedAt?: Date;
  completedAt?: Date;
}

export interface PlanningRequest {
  title: string;
  description: string;
  type: RequestType;
}

export interface PlanningSession {
  id: string;
  status: SessionStatus;
  request: PlanningRequest;
  stages: PlanningStage[];
  currentStageIndex: number;
  deliverable?: TwoFileDeliverable;
  created: Date;
  completed?: Date;
}

export interface TwoFileDeliverable {
  implementationPlan: string;
  claudeCodePrompt: string;
  metadata: {
    title: string;
    estimatedTime: string;
    phaseCount: number;
  };
}
```

### MCP Types

**Location:** `src/lib/core/mcp/types.ts`

```typescript
export interface McpServerConfig {
  id: string;
  name: string;
  transport: 'http' | 'websocket' | 'sse';
  url: string;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}

export interface McpToolInvocation {
  toolName: string;
  serverId: string;
  params: any;
  result?: any;
  error?: string;
  timestamp: Date;
  duration: number;
}
```

---

## Utility Functions

### Token Estimation

```typescript
import { estimateTokens } from '$lib/core/llm/utils';

const text = 'Hello, world!';
const tokens = estimateTokens(text);
// ~3 tokens (1 token ≈ 4 characters)
```

### Cost Calculation

```typescript
import { calculateCost } from '$lib/core/llm/utils';

const cost = calculateCost({
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  inputTokens: 1000,
  outputTokens: 500
});
// ~$0.0105 (based on current pricing)
```

---

## Error Handling

All async operations should be wrapped in try-catch:

```typescript
try {
  await planningStore.startSession(request);
} catch (error) {
  console.error('Planning session failed:', error);
  // Show user-friendly error message
}
```

Stores expose error state:
```typescript
if (workspaceStore.error) {
  console.error('Workspace error:', workspaceStore.error);
}
```

---

## Best Practices

### 1. Reactive Updates

Use Svelte's reactivity:
```svelte
<script>
  import { contextBlocksStore } from '$lib/core/stores/contextBlocks.svelte';

  // Automatically updates when blocks change
  $: totalTokens = contextBlocksStore.totalTokens;
</script>

<p>Total tokens: {totalTokens}</p>
```

### 2. Type Safety

Always use TypeScript types:
```typescript
import type { ContextBlock } from '$lib/core/types/domain';

const block: ContextBlock = {
  id: crypto.randomUUID(),
  label: 'System',
  content: '...',
  type: 'text',
  isActive: true,
  order: 0
};
```

### 3. Error Boundaries

Wrap components in ErrorBoundary:
```svelte
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

### 4. Performance

Use derived state instead of recomputing:
```typescript
// Good (derived, cached)
const activeBlocks = contextBlocksStore.activeBlocks;

// Bad (recomputes every time)
const activeBlocks = contextBlocksStore.blocks.filter(b => b.isActive);
```

---

## Changelog

### 5.7.0 (2025-12-06)
- Added Cortex Planning API
- Added Model Router
- Added MCP Integration
- Updated all stores to Svelte 5 runes

### 5.0.0 (2025-01-26)
- Initial API documentation
- Core stores documented

---

**For more examples, see:**
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [User Guide](./USER_GUIDE.md)
- [Source Code](../src/lib/core/)

---

**Last Updated:** December 6, 2025
**Version:** 5.7.0 (Phase 2 Complete)
