<script lang="ts">
	/**
	 * McpToolsSection component - Display available MCP servers and tools
	 * Shows connected MCP servers and their available tools
	 */

	import { toolsStore } from '$lib/core/stores';
	import Button from '$lib/ui/primitives/Button.svelte';
	import Panel from '$lib/ui/primitives/Panel.svelte';
	import SectionHeader from '$lib/ui/primitives/SectionHeader.svelte';
	import Tag from '$lib/ui/primitives/Tag.svelte';

	const servers = $derived(toolsStore.servers);
	const connectedServers = $derived(toolsStore.connectedServers);
	const toolsByServer = $derived(toolsStore.toolsByServer);
	const favoriteTools = $derived(toolsStore.favoriteTools);

	let expandedServerId = $state<string | null>(null);

	function toggleServer(serverId: string) {
		expandedServerId = expandedServerId === serverId ? null : serverId;
	}

	function handleToggleFavorite(toolId: string) {
		toolsStore.toggleFavorite(toolId);
	}

	function handleInvokeTool(serverId: string, toolName: string) {
		// Phase 2: Implement actual tool invocation
		console.log('Invoke tool:', { serverId, toolName });
		// For now, just show a placeholder
		alert(`Tool invocation placeholder: ${toolName}`);
	}
</script>

<Panel variant="bordered" padding="md" class="mcp-tools-section">
	<SectionHeader title="MCP Tools" description={`${connectedServers.length} server(s) connected`} level={4}>
		{#snippet actions()}
			<Button variant="ghost" size="sm">
				{#snippet children()}
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
					</svg>
					Add Server
				{/snippet}
			</Button>
		{/snippet}
	</SectionHeader>

	<div class="space-y-3 mt-4">
		{#if connectedServers.length === 0}
			<div class="text-center py-6 text-slate-500 text-sm">
				<svg class="w-12 h-12 mx-auto mb-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
				</svg>
				<p>No MCP servers connected</p>
				<p class="text-xs mt-1">Add a server to access tools</p>
			</div>
		{:else}
			<!-- Server List -->
			{#each connectedServers as server}
				{@const serverTools = toolsByServer[server.id] || []}
				{@const isExpanded = expandedServerId === server.id}

				<div class="server-item bg-forge-steel rounded-lg border border-slate-700 overflow-hidden">
					<!-- Server Header -->
					<button
						onclick={() => toggleServer(server.id)}
						class="w-full px-3 py-2 flex items-center justify-between hover:bg-forge-gunmetal transition-colors"
					>
						<div class="flex items-center gap-2">
							<!-- Connection Status -->
							<div class="w-2 h-2 rounded-full {server.status === 'connected' ? 'bg-emerald-500' : 'bg-slate-500'}"></div>

							<span class="text-sm font-medium text-slate-200">{server.name}</span>

							<Tag variant="default" size="sm">
								{#snippet children()}
									{serverTools.length} tool{serverTools.length !== 1 ? 's' : ''}
								{/snippet}
							</Tag>
						</div>

						<!-- Expand Icon -->
						<svg
							class="w-4 h-4 text-slate-400 transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
						</svg>
					</button>

					<!-- Tools List (Expanded) -->
					{#if isExpanded}
						<div class="px-3 pb-3 space-y-2 bg-forge-blacksteel/30">
							{#each serverTools as tool}
								{@const isFavorite = favoriteTools.some(ft => ft.id === tool.id)}

								<div class="tool-item bg-forge-gunmetal rounded p-2 hover:bg-forge-steel transition-colors">
									<div class="flex items-start justify-between gap-2">
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2">
												<span class="text-sm font-medium text-slate-200">{tool.name}</span>
												{#if isFavorite}
													<svg class="w-4 h-4 text-forge-ember" fill="currentColor" viewBox="0 0 20 20">
														<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
													</svg>
												{/if}
											</div>
											{#if tool.description}
												<p class="text-xs text-slate-400 mt-0.5 line-clamp-2">{tool.description}</p>
											{/if}
										</div>

										<!-- Tool Actions -->
										<div class="flex items-center gap-1 flex-shrink-0">
											<button
												onclick={() => handleToggleFavorite(tool.id)}
												class="p-1 rounded hover:bg-forge-steel transition-colors"
												aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
											>
												<svg class="w-4 h-4 {isFavorite ? 'text-forge-ember' : 'text-slate-500'}" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
												</svg>
											</button>

											<button
												onclick={() => handleInvokeTool(server.id, tool.name)}
												class="p-1 rounded hover:bg-forge-steel transition-colors text-slate-400 hover:text-forge-ember"
												aria-label="Invoke tool"
											>
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
												</svg>
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</Panel>
