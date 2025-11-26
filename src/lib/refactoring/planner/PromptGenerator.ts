/**
 * Prompt Generator
 *
 * Generates detailed prompts for Claude Code to execute refactoring tasks
 */

import type { RefactoringTask, RefactoringPhase, ClaudePromptDocument } from '../types/planning';
import type { QualityStandards } from '../types/standards';

/**
 * Prompt Generator
 *
 * Creates structured prompts for Claude Code execution
 */
export class PromptGenerator {
	/**
	 * Generates a prompt for a single task
	 */
	generateTaskPrompt(task: RefactoringTask, standards: QualityStandards): ClaudePromptDocument {
		const content = `# Refactoring Task: ${task.title}

## Objective
${task.description}

## Category
${task.category}

## Priority
${task.priority}

## Acceptance Criteria
${task.acceptanceCriteria.map((criterion, i) => `${i + 1}. ${criterion}`).join('\n')}

## Quality Standards
- Minimum test coverage: ${standards.testing.minimumCoverage}%
- Type safety: ${standards.typeSafety.allowAnyTypes ? 'Permissive' : 'Strict - no any types'}
- Code quality: Max ${standards.codeQuality.maxTodoCount} TODOs allowed

## Affected Files
${task.affectedFiles.length > 0 ? task.affectedFiles.map((f) => `- ${f}`).join('\n') : 'To be determined during execution'}

## Instructions

1. **Read and Understand**: Review all affected files
2. **Plan**: Create a brief implementation plan (3-5 steps)
3. **Implement**: Make the necessary changes
4. **Test**: Run tests and ensure all pass
5. **Verify**: Confirm all acceptance criteria are met

## Constraints

- Do NOT add new features beyond the task scope
- Do NOT refactor unrelated code
- Maintain existing functionality
- Follow the project's coding style
- Ensure backward compatibility

## Testing Requirements

- All existing tests must continue to pass
- Add new tests if implementing new functionality
- Run \`pnpm check\` to verify TypeScript compilation
- Run \`pnpm test\` to verify all tests pass

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] Code reviewed (if required)
- [ ] Changes committed to git

## Estimated Time
${task.estimatedHours} hour${task.estimatedHours > 1 ? 's' : ''}

---

**Note**: This is a generated prompt for automated refactoring. Follow the guidelines strictly.
`;

		return {
			taskId: task.id,
			title: task.title,
			content,
			generatedAt: new Date().toISOString()
		};
	}

	/**
	 * Generates prompts for all tasks in a phase
	 */
	generatePhasePrompts(
		phase: RefactoringPhase,
		standards: QualityStandards
	): ClaudePromptDocument[] {
		return phase.tasks.map((task) => this.generateTaskPrompt(task, standards));
	}

	/**
	 * Generates a summary prompt for the entire refactoring plan
	 */
	generatePlanSummaryPrompt(
		phases: RefactoringPhase[],
		standards: QualityStandards
	): ClaudePromptDocument {
		const totalTasks = phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
		const totalHours = phases.reduce((sum, phase) => sum + phase.estimatedHours, 0);

		const content = `# Refactoring Plan Summary

## Overview
This refactoring plan consists of ${phases.length} phase${phases.length > 1 ? 's' : ''} with ${totalTasks} task${totalTasks > 1 ? 's' : ''}.

**Total Estimated Time**: ${totalHours} hours (${Math.ceil(totalHours / 8)} working days)

## Quality Standards: ${standards.name}
- Test Coverage: ${standards.testing.minimumCoverage}%
- Type Safety: ${standards.typeSafety.allowAnyTypes ? 'Permissive' : 'Strict'}
- Strict Mode: ${standards.typeSafety.requireStrictMode ? 'Required' : 'Optional'}
- TODO Comments: ${standards.codeQuality.allowTodoComments ? `Max ${standards.codeQuality.maxTodoCount}` : 'Not allowed'}

## Phases

${phases
	.map(
		(phase, i) => `### Phase ${phase.number}: ${phase.name}
**Status**: ${phase.required ? 'Required' : 'Optional'}
**Estimated Time**: ${phase.estimatedHours} hours
**Tasks**: ${phase.tasks.length}

${phase.tasks.map((task, j) => `${j + 1}. [${task.priority.toUpperCase()}] ${task.title} (${task.estimatedHours}h)`).join('\n')}
`
	)
	.join('\n')}

## Execution Guidelines

1. **Sequential Execution**: Complete phases in order
2. **Required Phases**: Phases 1-${phases.filter((p) => p.required).length} must be completed
3. **Quality Gates**: Verify standards after each phase
4. **Git Commits**: Commit after each completed task
5. **Testing**: Run full test suite after each phase

## Critical Success Factors

- All required phases must be completed
- All tests must pass
- TypeScript compilation must succeed
- Quality standards must be met
- No breaking changes to public APIs

---

**Generated**: ${new Date().toISOString()}
`;

		return {
			taskId: 'plan-summary',
			title: 'Refactoring Plan Summary',
			content,
			generatedAt: new Date().toISOString()
		};
	}
}
