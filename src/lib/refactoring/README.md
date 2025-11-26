# Refactoring Automation System

Complete automated refactoring system with codebase analysis, intelligent planning, execution orchestration, and continuous learning.

## Architecture

### 4-Phase System

```
┌─────────────────────────────────────────────────────────────┐
│                  REFACTORING AUTOMATION                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Phase 1: Types & Standards                                 │
│  ├─ Quality Standards (40%, 60%, 80%, 100%)                │
│  ├─ Presets (Strict, Balanced, Startup, Legacy)            │
│  ├─ Rules (Coverage, TypeSafety, TODO)                     │
│  └─ Standards Engine (Evaluate, Gates, Verify)             │
│                                                              │
│  Phase 2: Codebase Analyzer                                 │
│  ├─ FileSystemScanner (Recursive scanning)                 │
│  ├─ TechStackDetector (Framework, language)                │
│  ├─ MetricsCollector (Coverage, types, quality, size)      │
│  ├─ PatternDetector (Stores, APIs, components)             │
│  ├─ IssueDetector (Generate issues from metrics)           │
│  └─ CodebaseAnalyzer (Orchestrate analysis)                │
│                                                              │
│  Phase 3: Refactoring Planner                               │
│  ├─ TaskGenerator (Analysis → Tasks)                       │
│  ├─ PhaseGenerator (Tasks → Phases with deps)              │
│  ├─ EstimationEngine (Refine estimates with learning)      │
│  ├─ PromptGenerator (Claude Code prompts)                  │
│  └─ RefactoringPlanner (Orchestrate planning)              │
│                                                              │
│  Phase 4: Executor & Learning Loop                          │
│  ├─ ProgressTracker (Real-time monitoring)                 │
│  ├─ OutcomeAnalyzer (Evaluate results)                     │
│  ├─ LearningLoop (NeuroForge integration)                  │
│  └─ TaskExecutor (Orchestrate execution)                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Simple Usage

```typescript
import { RefactoringAutomation } from '$lib/refactoring';

const automation = new RefactoringAutomation({
  repositoryPath: '/path/to/project'
});

// Analyze → Plan → Execute → Complete
const analysis = await automation.analyze('/path/to/project');
const plan = await automation.createPlan(analysis);
const project = await automation.execute(plan, analysis);

// Monitor progress
const progress = automation.getProgress(project);
console.log(`Progress: ${progress.percentage}%`);

// Complete and get outcome
const finalAnalysis = await automation.analyze('/path/to/project');
const { outcome } = await automation.complete(project, finalAnalysis, analysis);
console.log(`Rating: ${outcome.rating}`);
```

### 2. With Custom Standards

```typescript
import { RefactoringAutomation } from '$lib/refactoring';
import { strictStandards, balancedStandards } from '$lib/refactoring/standards/presets';

const automation = new RefactoringAutomation({
  repositoryPath: '/path/to/project',
  defaultStandards: strictStandards // 100% coverage, no any types
});

const plan = await automation.createPlan(analysis, {
  standards: balancedStandards, // Override with 80% coverage
  complexity: 'high' // Add 50% time buffer
});
```

### 3. With Learning Enabled

```typescript
const automation = new RefactoringAutomation({
  repositoryPath: '/path/to/project',
  enableLearning: true,
  neuroforgeUrl: 'http://localhost:8000/api'
});

// Get AI-powered recommendations
const plan = await automation.createPlan(analysis, {
  getLearningRecommendations: true
});

// Outcomes are automatically recorded to NeuroForge
const { outcome } = await automation.complete(project, finalAnalysis, analysis);

// View learning metrics
const metrics = await automation.getLearningMetrics();
console.log(`Success rate: ${metrics.successRate}%`);
```

## Component Usage

### Phase 1: Standards Engine

```typescript
import { StandardsEngine } from '$lib/refactoring/standards/StandardsEngine';
import { balancedStandards } from '$lib/refactoring/standards/presets';

const engine = new StandardsEngine(balancedStandards);

// Evaluate codebase against standards
const result = engine.evaluate(codebaseMetrics);
console.log(`Passed: ${result.passed}`);
console.log(`Score: ${result.summary.score}/100`);

// Generate quality gates
const gates = engine.generateGates();
gates.forEach(gate => {
  console.log(`Phase ${gate.phase}: ${gate.name}`);
});

// Verify a gate
const verification = engine.verifyGate(gates[0], currentMetrics);
console.log(`Gate passed: ${verification.passed}`);
```

### Phase 2: Codebase Analyzer

```typescript
import { CodebaseAnalyzer } from '$lib/refactoring/analyzer/CodebaseAnalyzer';

const analyzer = new CodebaseAnalyzer();
const analysis = await analyzer.analyze('/path/to/project');

console.log(`Health: ${analysis.summary.health}`);
console.log(`Score: ${analysis.summary.score}/100`);
console.log(`Test Coverage: ${analysis.metrics.testCoverage.lines}%`);
console.log(`Type Errors: ${analysis.metrics.typeSafety.typeErrorCount}`);
console.log(`Issues: ${analysis.issues.length}`);
```

### Phase 3: Refactoring Planner

```typescript
import { RefactoringPlanner } from '$lib/refactoring/planner/RefactoringPlanner';
import { balancedStandards } from '$lib/refactoring/standards/presets';

const planner = new RefactoringPlanner();

const plan = await planner.createPlan(analysis, {
  standards: balancedStandards,
  complexity: 'medium'
});

console.log(`Total phases: ${plan.phases.length}`);
console.log(`Total tasks: ${plan.phases.reduce((sum, p) => sum + p.tasks.length, 0)}`);
console.log(`Estimated hours: ${plan.totalEstimatedHours}`);
console.log(`Prompts generated: ${plan.prompts.length}`);

// Validate plan
const validation = planner.validatePlan(plan);
if (!validation.valid) {
  console.error('Plan errors:', validation.errors);
}
```

### Phase 4: Task Executor

```typescript
import { TaskExecutor } from '$lib/refactoring/executor/TaskExecutor';

const executor = new TaskExecutor({
  repositoryPath: '/path/to/project',
  enableLearning: true,
  createCheckpoints: true
});

// Create and start project
const project = await executor.createProject(plan, initialAnalysis);
await executor.startProject(project);

// Execute tasks
for (const phase of project.phases) {
  for (const task of phase.tasks) {
    await executor.executeTask(project, phase.phase, task.taskId);
  }
  await executor.completePhase(project, phase.phase);
}

// Complete project
const { outcome } = await executor.completeProject(
  project,
  finalAnalysis,
  initialAnalysis
);

console.log(`Outcome: ${outcome.rating}`);
console.log(`Coverage improvement: ${outcome.coverageAfter - outcome.coverageBefore}%`);
```

## Quality Standards Presets

### Strict (100% Quality)
- 100% test coverage
- Zero `any` types
- Zero type errors
- Zero TODO comments
- Strict TypeScript mode

### Balanced (80% Quality - Default)
- 80% test coverage
- Discourage `any` types (warn)
- Minimal type errors (< 5)
- Limited TODOs (< 50)
- Strict TypeScript mode

### Startup (60% Quality)
- 60% test coverage
- Allow `any` types
- Some type errors (< 20)
- Many TODOs (< 200)
- Non-strict mode OK

### Legacy (40% Quality)
- 40% test coverage
- Allow `any` types
- Many type errors (< 50)
- Many TODOs (< 500)
- Non-strict mode OK

## Learning System

The learning system records outcomes and improves estimates over time:

```typescript
// Outcomes are automatically recorded
const { outcome } = await automation.complete(project, finalAnalysis, analysis);

// Outcome includes:
outcome.rating;           // 'excellent' | 'good' | 'fair' | 'poor' | 'failed'
outcome.success;          // boolean
outcome.coverageAfter;    // Quality improvements
outcome.typeErrorsAfter;
outcome.actualHours;      // Estimation accuracy
outcome.variance;         // % difference from estimate
```

### Estimation Feedback

```typescript
// System learns from estimation accuracy
feedback = {
  estimatedHours: 4,
  actualHours: 5.2,
  accuracy: 77%, // 77% accurate
  factors: [
    { factor: 'Unexpected complexity', impact: 'negative', magnitude: 0.3 },
    { factor: 'Test writing complexity', impact: 'negative', magnitude: 0.6 }
  ]
};
```

## Testing

```bash
# Run all refactoring tests
pnpm test src/lib/refactoring

# Run specific phase tests
pnpm test src/lib/refactoring/standards   # Phase 1 (78 tests)
pnpm test src/lib/refactoring/analyzer    # Phase 2 (6 tests)
pnpm test src/lib/refactoring/planner     # Phase 3 (12 tests)
pnpm test src/lib/refactoring/executor    # Phase 4 (21 tests)

# Total: 117 tests, 100% passing
```

## API Reference

### RefactoringAutomation

Main entry point combining all system components.

**Methods:**
- `analyze(path)` - Analyze codebase
- `createPlan(analysis, options?)` - Create refactoring plan
- `execute(plan, initialAnalysis)` - Start execution
- `executeTask(project, phase, taskId)` - Execute single task
- `completePhase(project, phase)` - Complete a phase
- `complete(project, finalAnalysis, initialAnalysis)` - Finalize and record outcome
- `getProgress(project)` - Get current progress
- `validatePlan(plan)` - Validate plan structure
- `handleFailure(project, phase, taskId, error)` - Handle task failure
- `getLearningMetrics()` - Get learning statistics
- `checkLearningHealth()` - Check NeuroForge connection
- `setLearningEnabled(enabled)` - Enable/disable learning

### Key Types

```typescript
// Analysis
type CodebaseAnalysis = {
  metrics: CodebaseMetrics;
  issues: DetectedIssue[];
  summary: { health: 'excellent' | 'good' | 'fair' | 'poor'; score: number };
  // ... more
};

// Planning
type RefactoringPlan = {
  phases: RefactoringPhase[];
  totalEstimatedHours: number;
  prompts: ClaudePromptDocument[];
  status: 'draft' | 'approved' | 'executing' | 'completed';
};

// Execution
type RefactoringProject = {
  plan: RefactoringPlan;
  phases: PhaseExecution[];
  progress: ExecutionProgress;
  status: ExecutionStatus;
  logs: LogEntry[];
  // ... more
};

// Learning
type RefactoringOutcome = {
  rating: 'excellent' | 'good' | 'fair' | 'poor' | 'failed';
  success: boolean;
  coverageBefore: number;
  coverageAfter: number;
  actualHours: number;
  variance: number; // % difference from estimate
  // ... more
};
```

## Configuration

```typescript
interface AutomationConfig {
  repositoryPath: string;           // Required
  enableLearning?: boolean;         // Default: true
  neuroforgeUrl?: string;           // Default: 'http://localhost:8000/api'
  createCheckpoints?: boolean;      // Default: true
  autoVerifyGates?: boolean;        // Default: true
  defaultStandards?: QualityStandards; // Default: balancedStandards
}
```

## File Structure

```
src/lib/refactoring/
├── index.ts                        # Main exports
├── RefactoringAutomation.ts        # High-level API
├── README.md                       # This file
│
├── types/                          # TypeScript definitions
│   ├── analysis.ts
│   ├── standards.ts
│   ├── planning.ts
│   ├── execution.ts
│   ├── learning.ts
│   └── index.ts
│
├── standards/                      # Phase 1: Standards Engine
│   ├── StandardsEngine.ts
│   ├── presets/
│   │   ├── strict.ts
│   │   ├── balanced.ts
│   │   ├── startup.ts
│   │   ├── legacy.ts
│   │   └── index.ts
│   ├── rules/
│   │   ├── CoverageRule.ts
│   │   ├── TypeSafetyRule.ts
│   │   ├── TodoRule.ts
│   │   └── index.ts
│   └── __tests__/
│
├── analyzer/                       # Phase 2: Codebase Analyzer
│   ├── CodebaseAnalyzer.ts
│   ├── FileSystemScanner.ts
│   ├── TechStackDetector.ts
│   ├── MetricsCollector.ts
│   ├── PatternDetector.ts
│   ├── IssueDetector.ts
│   ├── index.ts
│   └── __tests__/
│
├── planner/                        # Phase 3: Refactoring Planner
│   ├── RefactoringPlanner.ts
│   ├── TaskGenerator.ts
│   ├── PhaseGenerator.ts
│   ├── EstimationEngine.ts
│   ├── PromptGenerator.ts
│   ├── index.ts
│   └── __tests__/
│
└── executor/                       # Phase 4: Executor & Learning
    ├── TaskExecutor.ts
    ├── ProgressTracker.ts
    ├── OutcomeAnalyzer.ts
    ├── LearningLoop.ts
    ├── index.ts
    └── __tests__/
```

## Principles

### User-Configurable Standards
- NO hardcoded quality thresholds
- Users choose their level: 40%, 60%, 80%, or 100%
- Standards guide planning, not enforce
- Flexibility for different project stages

### Continuous Learning
- Records all refactoring outcomes
- Learns estimation accuracy
- Improves recommendations over time
- Graceful degradation without NeuroForge

### Dependency-Aware Execution
- Topological sort for task ordering
- Prevents dependency violations
- Ensures tasks execute in correct sequence

### Progressive Enhancement
- Works without learning (offline mode)
- Works without git (testing mode)
- Degrades gracefully when features unavailable

## License

Part of the VibeForge project.
