/**
 * Executor Module Exports
 *
 * Exports all executor components
 */

// Phase 4: Core Executor Components
export { GitOperations } from './GitOperations';
export type { GitConfig } from './GitOperations';

export { GateVerifier } from './GateVerifier';
export type { VerifierConfig } from './GateVerifier';

export { ClaudeCodeBridge } from './ClaudeCodeBridge';
export type { ClaudeCodeConfig, SessionEvent, SessionEventHandler, SessionEventType } from './ClaudeCodeBridge';

export { RefactoringExecutor } from './RefactoringExecutor';
export type { RefactoringExecutorConfig } from './RefactoringExecutor';

// Supporting Components
export { ProgressTracker } from './ProgressTracker';
export { OutcomeAnalyzer } from './OutcomeAnalyzer';
export { LearningLoop } from './LearningLoop';

// Legacy (deprecated - use RefactoringExecutor instead)
export { TaskExecutor } from './TaskExecutor';
export type { ExecutorConfig } from './TaskExecutor';
