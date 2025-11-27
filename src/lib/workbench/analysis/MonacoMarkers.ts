/**
 * Monaco Markers Utility
 *
 * Utilities to add inline markers (squiggles) to Monaco editor from analysis issues.
 */

import type * as Monaco from 'monaco-editor';
import type { DetectedIssue } from '$lib/refactoring/types/analysis';

export interface MarkerOptions {
	editor: Monaco.editor.IStandaloneCodeEditor;
	monaco: typeof Monaco;
	issues: DetectedIssue[];
}

/**
 * Maps issue severity to Monaco marker severity
 */
function getSeverity(
	monaco: typeof Monaco,
	severity: DetectedIssue['severity']
): Monaco.MarkerSeverity {
	switch (severity) {
		case 'error':
			return monaco.MarkerSeverity.Error;
		case 'warning':
			return monaco.MarkerSeverity.Warning;
		case 'info':
			return monaco.MarkerSeverity.Info;
		default:
			return monaco.MarkerSeverity.Hint;
	}
}

/**
 * Converts DetectedIssue to Monaco marker
 * Note: DetectedIssue has lineNumbers array, not specific line/column positions
 */
function issueToMarkers(monaco: typeof Monaco, issue: DetectedIssue): Monaco.editor.IMarkerData[] {
	// If no line numbers specified, we can't create markers
	if (!issue.lineNumbers || issue.lineNumbers.length === 0) {
		return [];
	}

	// Create a marker for each line number
	return issue.lineNumbers.map((line) => ({
		severity: getSeverity(monaco, issue.severity),
		message: `${issue.title}\n${issue.description}${issue.suggestion ? `\n\n💡 ${issue.suggestion}` : ''}`,
		startLineNumber: line,
		startColumn: 1,
		endLineNumber: line,
		endColumn: 1000, // Span entire line
		source: 'VibeForge Analysis',
		code: issue.id
	}));
}

/**
 * Sets markers on Monaco editor from analysis issues
 */
export function setAnalysisMarkers({ editor, monaco, issues }: MarkerOptions): void {
	const model = editor.getModel();
	if (!model) return;

	// Convert all issues to markers (flattening the array since each issue can produce multiple markers)
	const markers = issues.flatMap((issue) => issueToMarkers(monaco, issue));

	monaco.editor.setModelMarkers(model, 'vibeforge-analysis', markers);
}

/**
 * Clears all analysis markers
 */
export function clearAnalysisMarkers(
	monaco: typeof Monaco,
	editor: Monaco.editor.IStandaloneCodeEditor
): void {
	const model = editor.getModel();
	if (!model) return;

	monaco.editor.setModelMarkers(model, 'vibeforge-analysis', []);
}

/**
 * Navigates editor to issue location
 */
export function goToIssue(editor: Monaco.editor.IStandaloneCodeEditor, issue: DetectedIssue): void {
	if (!issue.lineNumbers || issue.lineNumbers.length === 0) return;

	// Go to first line number
	const line = issue.lineNumbers[0];
	editor.revealLineInCenter(line);
	editor.setPosition({ lineNumber: line, column: 1 });
	editor.focus();
}

/**
 * Highlights multiple lines in editor (for issues spanning multiple lines)
 */
export function highlightIssueLines(
	editor: Monaco.editor.IStandaloneCodeEditor,
	monaco: typeof Monaco,
	issue: DetectedIssue
): void {
	if (!issue.lineNumbers || issue.lineNumbers.length === 0) return;

	const decorations = issue.lineNumbers.map((line) => ({
		range: new monaco.Range(line, 1, line, 1),
		options: {
			isWholeLine: true,
			className: 'vibeforge-issue-highlight',
			glyphMarginClassName: 'vibeforge-issue-glyph'
		}
	}));

	editor.deltaDecorations([], decorations);
}
