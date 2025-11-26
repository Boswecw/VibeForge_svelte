/**
 * Refactoring Store
 *
 * Centralized state management for the refactoring automation system
 */

import type { CodebaseAnalysis } from '$lib/refactoring/types/analysis';
import type { RefactoringPlan } from '$lib/refactoring/types/planning';
import type { RefactoringProject, RefactoringOutcome } from '$lib/refactoring/types/execution';
import type { QualityStandards } from '$lib/refactoring/types/standards';
import type { RefactoringAutomation } from '$lib/refactoring';

interface RefactoringState {
	// Current workflow step
	currentStep: 'analyze' | 'plan' | 'execute' | 'complete' | null;

	// Analysis
	analysis: CodebaseAnalysis | null;
	analyzing: boolean;
	analyzeError: string | null;

	// Planning
	plan: RefactoringPlan | null;
	planning: boolean;
	planError: string | null;
	selectedStandards: QualityStandards | null;

	// Execution
	project: RefactoringProject | null;
	executing: boolean;
	executeError: string | null;

	// Completion
	outcome: RefactoringOutcome | null;
	finalAnalysis: CodebaseAnalysis | null;

	// Configuration
	repositoryPath: string;
	enableLearning: boolean;
	createCheckpoints: boolean;

	// Automation instance
	automation: RefactoringAutomation | null;
}

function createRefactoringStore() {
	let state = $state<RefactoringState>({
		currentStep: null,
		analysis: null,
		analyzing: false,
		analyzeError: null,
		plan: null,
		planning: false,
		planError: null,
		selectedStandards: null,
		project: null,
		executing: false,
		executeError: null,
		outcome: null,
		finalAnalysis: null,
		repositoryPath: '',
		enableLearning: true,
		createCheckpoints: true,
		automation: null
	});

	return {
		// Getters
		get state() {
			return state;
		},

		get currentStep() {
			return state.currentStep;
		},

		get analysis() {
			return state.analysis;
		},

		get plan() {
			return state.plan;
		},

		get project() {
			return state.project;
		},

		get outcome() {
			return state.outcome;
		},

		get automation() {
			return state.automation;
		},

		get isAnalyzing() {
			return state.analyzing;
		},

		get isPlanning() {
			return state.planning;
		},

		get isExecuting() {
			return state.executing;
		},

		// Actions
		setRepositoryPath(path: string) {
			state.repositoryPath = path;
		},

		setStandards(standards: QualityStandards) {
			state.selectedStandards = standards;
		},

		setEnableLearning(enabled: boolean) {
			state.enableLearning = enabled;
		},

		setCreateCheckpoints(enabled: boolean) {
			state.createCheckpoints = enabled;
		},

		setAutomation(automation: RefactoringAutomation) {
			state.automation = automation;
		},

		startAnalysis() {
			state.currentStep = 'analyze';
			state.analyzing = true;
			state.analyzeError = null;
			state.analysis = null;
		},

		completeAnalysis(analysis: CodebaseAnalysis) {
			state.analyzing = false;
			state.analysis = analysis;
			state.analyzeError = null;
		},

		failAnalysis(error: string) {
			state.analyzing = false;
			state.analyzeError = error;
		},

		startPlanning() {
			state.currentStep = 'plan';
			state.planning = true;
			state.planError = null;
			state.plan = null;
		},

		completePlanning(plan: RefactoringPlan) {
			state.planning = false;
			state.plan = plan;
			state.planError = null;
		},

		failPlanning(error: string) {
			state.planning = false;
			state.planError = error;
		},

		startExecution() {
			state.currentStep = 'execute';
			state.executing = true;
			state.executeError = null;
			state.project = null;
		},

		updateProject(project: RefactoringProject) {
			state.project = project;
		},

		failExecution(error: string) {
			state.executing = false;
			state.executeError = error;
		},

		completeExecution() {
			state.executing = false;
			state.executeError = null;
		},

		startCompletion() {
			state.currentStep = 'complete';
		},

		setOutcome(outcome: RefactoringOutcome) {
			state.outcome = outcome;
		},

		setFinalAnalysis(finalAnalysis: CodebaseAnalysis) {
			state.finalAnalysis = finalAnalysis;
		},

		reset() {
			state.currentStep = null;
			state.analysis = null;
			state.analyzing = false;
			state.analyzeError = null;
			state.plan = null;
			state.planning = false;
			state.planError = null;
			state.project = null;
			state.executing = false;
			state.executeError = null;
			state.outcome = null;
			state.finalAnalysis = null;
		},

		resetToStep(step: 'analyze' | 'plan' | 'execute') {
			if (step === 'analyze') {
				this.reset();
			} else if (step === 'plan') {
				state.plan = null;
				state.planning = false;
				state.planError = null;
				state.project = null;
				state.executing = false;
				state.executeError = null;
				state.outcome = null;
				state.finalAnalysis = null;
				state.currentStep = 'plan';
			} else if (step === 'execute') {
				state.project = null;
				state.executing = false;
				state.executeError = null;
				state.outcome = null;
				state.finalAnalysis = null;
				state.currentStep = 'execute';
			}
		}
	};
}

export const refactoringStore = createRefactoringStore();
