/**
 * Refactoring Automation System
 *
 * Complete automated refactoring system with analysis, planning, execution, and learning.
 *
 * ## Usage Example
 *
 * ```typescript
 * import { RefactoringAutomation } from '$lib/refactoring';
 * import { balancedStandards } from '$lib/refactoring/standards/presets';
 *
 * // Initialize the system
 * const automation = new RefactoringAutomation({
 *   repositoryPath: '/path/to/project',
 *   enableLearning: true,
 *   neuroforgeUrl: 'http://localhost:8000/api'
 * });
 *
 * // 1. Analyze codebase
 * const analysis = await automation.analyze('/path/to/project');
 *
 * // 2. Create refactoring plan
 * const plan = await automation.createPlan(analysis, {
 *   standards: balancedStandards,
 *   complexity: 'medium'
 * });
 *
 * // 3. Execute refactoring
 * const project = await automation.execute(plan, analysis);
 *
 * // 4. Monitor progress
 * const progress = automation.getProgress(project);
 * console.log(`Progress: ${progress.percentage}%`);
 *
 * // 5. Get outcome
 * const outcome = await automation.complete(project, finalAnalysis, analysis);
 * console.log(`Rating: ${outcome.rating}, Success: ${outcome.success}`);
 * ```
 */

// Types
export type * from './types';

// Standards
export { StandardsEngine } from './standards/StandardsEngine';
export * from './standards/presets';
export * from './standards/rules';

// Analyzer
export { CodebaseAnalyzer } from './analyzer/CodebaseAnalyzer';
export { FileSystemScanner } from './analyzer/FileSystemScanner';
export { TechStackDetector } from './analyzer/TechStackDetector';
export { MetricsCollector } from './analyzer/MetricsCollector';
export { PatternDetector } from './analyzer/PatternDetector';
export { IssueDetector } from './analyzer/IssueDetector';

// Planner
export { RefactoringPlanner } from './planner/RefactoringPlanner';
export { TaskGenerator } from './planner/TaskGenerator';
export { PhaseGenerator } from './planner/PhaseGenerator';
export { EstimationEngine } from './planner/EstimationEngine';
export { PromptGenerator } from './planner/PromptGenerator';
export type { PlannerConfig } from './planner';

// Executor
export { TaskExecutor } from './executor/TaskExecutor';
export { ProgressTracker } from './executor/ProgressTracker';
export { OutcomeAnalyzer } from './executor/OutcomeAnalyzer';
export { LearningLoop } from './executor/LearningLoop';
export type { ExecutorConfig } from './executor';

// Main Automation Class
export { RefactoringAutomation } from './RefactoringAutomation';
