/**
 * Refactoring Types Barrel Export
 *
 * Central export point for all refactoring type definitions.
 */

// Analysis types
export type {
	FileType,
	Framework,
	StateManagement,
	FileInfo,
	DirectoryStructure,
	TechStack,
	TestCoverageMetrics,
	TypeSafetyMetrics,
	CodeQualityMetrics,
	CodebaseMetrics,
	PatternType,
	DetectedPattern,
	IssueSeverity,
	IssueCategory,
	DetectedIssue,
	CodebaseAnalysis
} from './analysis';

// Standards types
export type {
	QualityPreset,
	TestingStandards,
	TypeSafetyStandards,
	CodeQualityStandards,
	ArchitectureStandards,
	QualityStandards,
	RuleEvaluation,
	CategoryEvaluation,
	StandardsEvaluation,
	QualityGateCheck,
	QualityGate,
	GateVerificationResult
} from './standards';

// Planning types
export type {
	TaskCategory,
	TaskPriority,
	TaskStatus,
	RefactoringTask,
	RefactoringPhase,
	TimeEstimate,
	CostEstimate,
	RefactoringPlan,
	PlanTemplate,
	ClaudePromptDocument,
	ImplementationDocument
} from './planning';

// Execution types
export type {
	ExecutionStatus,
	GitCheckpoint,
	GitOperationResult,
	ClaudeCodeSession,
	TaskExecution,
	PhaseExecution,
	ExecutionProgress,
	RefactoringProject,
	ExecutionCommand,
	CommandResult,
	RollbackAction
} from './execution';

// Learning types
export type {
	OutcomeRating,
	RefactoringOutcome,
	EstimationFeedback,
	RecommendationRequest,
	TaskRecommendation,
	PlanRecommendation,
	LearningMetrics
} from './learning';
