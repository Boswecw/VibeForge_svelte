<script lang="ts">
	import type { CodebaseAnalysis } from '$lib/refactoring/types/analysis';

	interface Props {
		summary: CodebaseAnalysis['summary'];
		compact?: boolean;
	}

	let { summary, compact = false }: Props = $props();

	const healthColors = {
		excellent: 'text-green-400',
		good: 'text-blue-400',
		fair: 'text-yellow-400',
		poor: 'text-red-400'
	};

	const healthIcons = {
		excellent: '✓',
		good: '○',
		fair: '⚠',
		poor: '✗'
	};
</script>

{#if compact}
	<div class="flex items-center gap-2 text-xs">
		<span class={healthColors[summary.health]}>
			{healthIcons[summary.health]} {summary.health.toUpperCase()}
		</span>
		<span class="text-slate-400">·</span>
		<span class="text-slate-300">Score: {summary.score}/100</span>
	</div>
{:else}
	<div class="space-y-3">
		<!-- Health Badge -->
		<div class="flex items-center gap-3">
			<span
				class="px-3 py-1 rounded-full text-sm font-medium {healthColors[summary.health]} bg-slate-800"
			>
				{healthIcons[summary.health]} {summary.health.toUpperCase()}
			</span>
			<span class="text-lg font-bold text-slate-200">{summary.score}/100</span>
		</div>

		<!-- Highlights -->
		{#if summary.highlights.length > 0}
			<div>
				<h4 class="text-xs font-medium text-slate-400 mb-1">Highlights</h4>
				<ul class="space-y-1">
					{#each summary.highlights as highlight}
						<li class="text-sm text-green-400">✓ {highlight}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Concerns -->
		{#if summary.concerns.length > 0}
			<div>
				<h4 class="text-xs font-medium text-slate-400 mb-1">Concerns</h4>
				<ul class="space-y-1">
					{#each summary.concerns as concern}
						<li class="text-sm text-yellow-400">⚠ {concern}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
{/if}
