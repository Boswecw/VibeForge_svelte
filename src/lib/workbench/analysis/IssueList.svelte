<script lang="ts">
	import type { DetectedIssue } from '$lib/refactoring/types/analysis';
	import IssueItem from './IssueItem.svelte';

	interface Props {
		issues: DetectedIssue[];
		onIssueClick?: (issue: DetectedIssue) => void;
	}

	let { issues, onIssueClick }: Props = $props();

	const errors = $derived(issues.filter((i) => i.severity === 'error'));
	const warnings = $derived(issues.filter((i) => i.severity === 'warning'));
	const suggestions = $derived(issues.filter((i) => i.severity === 'info'));
</script>

<div class="space-y-4">
	{#if errors.length > 0}
		<div>
			<h4 class="text-sm font-medium text-red-400 mb-2">🔴 Errors ({errors.length})</h4>
			<div class="space-y-1">
				{#each errors as issue (issue.id)}
					<IssueItem {issue} onclick={() => onIssueClick?.(issue)} />
				{/each}
			</div>
		</div>
	{/if}

	{#if warnings.length > 0}
		<div>
			<h4 class="text-sm font-medium text-yellow-400 mb-2">🟡 Warnings ({warnings.length})</h4>
			<div class="space-y-1">
				{#each warnings as issue (issue.id)}
					<IssueItem {issue} onclick={() => onIssueClick?.(issue)} />
				{/each}
			</div>
		</div>
	{/if}

	{#if suggestions.length > 0}
		<div>
			<h4 class="text-sm font-medium text-blue-400 mb-2">
				🟢 Suggestions ({suggestions.length})
			</h4>
			<div class="space-y-1">
				{#each suggestions as issue (issue.id)}
					<IssueItem {issue} onclick={() => onIssueClick?.(issue)} />
				{/each}
			</div>
		</div>
	{/if}

	{#if errors.length === 0 && warnings.length === 0 && suggestions.length === 0}
		<div class="text-center py-8 text-slate-400">
			<p class="text-lg mb-1">✓ No issues found</p>
			<p class="text-sm">Your code looks great!</p>
		</div>
	{/if}
</div>
