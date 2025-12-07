<script lang="ts">
	/**
	 * StreamingControls component - Progress bar and stop button for streaming responses
	 */

	import { runsStore } from '$lib/core/stores';

	interface Props {
		/** Show the controls */
		visible?: boolean;
		/** Custom class */
		class?: string;
	}

	const { visible = true, class: className = '' }: Props = $props();

	const isExecuting = $derived(runsStore.isExecuting);
	const executionProgress = $derived(runsStore.executionProgress);

	function handleStop() {
		if (confirm('Stop generating responses?')) {
			runsStore.cancelExecution();
		}
	}
</script>

{#if visible && isExecuting}
	<div class="streaming-controls {className} p-4 bg-forge-gunmetal border-t border-slate-700">
		<div class="flex items-center gap-4">
			<!-- Progress Info -->
			<div class="flex-1">
				<div class="flex items-center justify-between mb-2">
					<span class="text-sm font-medium text-slate-300">Generating...</span>
					<span class="text-xs text-slate-400">{executionProgress}%</span>
				</div>

				<!-- Progress Bar -->
				<div class="w-full h-2 bg-forge-blacksteel rounded-full overflow-hidden">
					<div
						class="h-full bg-gradient-to-r from-forge-ember to-amber-500 transition-all duration-300 ease-out"
						style="width: {executionProgress}%"
					></div>
				</div>
			</div>

			<!-- Stop Button -->
			<button
				onclick={handleStop}
				class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 active:bg-red-700 transition-all duration-200 flex items-center gap-2 font-medium text-sm"
				title="Stop generation"
			>
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
						clip-rule="evenodd"
					></path>
				</svg>
				Stop
			</button>
		</div>

		<!-- Streaming Status Message -->
		<div class="mt-2 flex items-center gap-2 text-xs text-slate-400">
			<svg class="w-3 h-3 animate-pulse text-forge-ember" fill="currentColor" viewBox="0 0 20 20">
				<circle cx="10" cy="10" r="6"></circle>
			</svg>
			<span>Streaming response in real-time</span>
		</div>
	</div>
{/if}

<style>
	/* Pulsing animation for progress bar */
	@keyframes pulse-glow {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	.streaming-controls :global(.h-2) {
		animation: pulse-glow 2s ease-in-out infinite;
	}
</style>
