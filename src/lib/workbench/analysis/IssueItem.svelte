<script lang="ts">
	import type { DetectedIssue } from '$lib/refactoring/types/analysis';

	interface Props {
		issue: DetectedIssue;
		onclick?: () => void;
	}

	let { issue, onclick }: Props = $props();

	const severityColors = {
		error: 'text-red-400',
		warning: 'text-yellow-400',
		info: 'text-blue-400'
	};

	const severityBgs = {
		error: 'bg-red-900/20 border-red-700',
		warning: 'bg-yellow-900/20 border-yellow-700',
		info: 'bg-blue-900/20 border-blue-700'
	};

	const categoryLabels = {
		testing: 'Testing',
		'type-safety': 'Type Safety',
		'code-quality': 'Code Quality',
		architecture: 'Architecture',
		security: 'Security'
	};
</script>

<button
	class="w-full text-left px-3 py-2 rounded border {severityBgs[issue.severity]} hover:bg-slate-700/30 transition-colors"
	onclick={onclick}
>
	<div class="flex items-start justify-between gap-2">
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2 mb-1">
				<span class="text-xs font-medium {severityColors[issue.severity]}">
					{categoryLabels[issue.category]}
				</span>
				{#if issue.autoFixable}
					<span class="text-xs text-green-400">● Auto-fixable</span>
				{/if}
			</div>
			<p class="text-sm font-medium text-slate-200 mb-1">{issue.title}</p>
			<p class="text-xs text-slate-400 line-clamp-2">{issue.description}</p>

			{#if issue.files.length > 0}
				<div class="mt-2 text-xs text-slate-500">
					{issue.files.length} file{issue.files.length > 1 ? 's' : ''}
					{#if issue.lineNumbers && issue.lineNumbers.length > 0}
						· Lines {issue.lineNumbers.join(', ')}
					{/if}
				</div>
			{/if}

			{#if issue.suggestion}
				<div class="mt-2 text-xs text-green-400 italic">
					💡 {issue.suggestion}
				</div>
			{/if}
		</div>
	</div>
</button>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
