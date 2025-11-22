<script lang="ts">
  import { onMount } from "svelte";
  import { toastStore } from "$lib/core/stores/toastStore";
  import * as chainClient from "$lib/core/api/chainClient";
  import type { ChainExecutionResult } from "$lib/core/api/chainClient";

  interface ChainNode {
    id: string;
    promptId: string;
    promptName: string;
    x: number;
    y: number;
    inputs: { [key: string]: string }; // Variable mappings
    outputs: string[]; // Output variable names
  }

  interface ChainConnection {
    id: string;
    sourceNodeId: string;
    sourceOutput: string;
    targetNodeId: string;
    targetInput: string;
  }

  interface Chain {
    id: string;
    name: string;
    nodes: ChainNode[];
    connections: ChainConnection[];
  }

  let { chainId = $bindable("") } = $props();

  let chain = $state<Chain>({
    id: chainId || `chain_${Date.now()}`,
    name: "Untitled Chain",
    nodes: [
      {
        id: "node_1",
        promptId: "prompt_character",
        promptName: "Character Generator",
        x: 100,
        y: 150,
        inputs: {},
        outputs: ["character_name", "character_bio"],
      },
      {
        id: "node_2",
        promptId: "prompt_story",
        promptName: "Story Writer",
        x: 450,
        y: 150,
        inputs: { character: "character_name" },
        outputs: ["story_text"],
      },
      {
        id: "node_3",
        promptId: "prompt_summary",
        promptName: "Story Summarizer",
        x: 800,
        y: 150,
        inputs: { full_text: "story_text" },
        outputs: ["summary"],
      },
    ],
    connections: [
      {
        id: "conn_1",
        sourceNodeId: "node_1",
        sourceOutput: "character_name",
        targetNodeId: "node_2",
        targetInput: "character",
      },
      {
        id: "conn_2",
        sourceNodeId: "node_2",
        sourceOutput: "story_text",
        targetNodeId: "node_3",
        targetInput: "full_text",
      },
    ],
  });

  let selectedNode = $state<string | null>(null);
  let draggingNode = $state<string | null>(null);
  let dragOffset = $state({ x: 0, y: 0 });
  let canvasRef = $state<HTMLDivElement | null>(null);
  let isExecuting = $state(false);
  let executionProgress = $state<{
    [nodeId: string]: "pending" | "running" | "success" | "error";
  }>({});

  // Available prompts for adding to chain
  const availablePrompts = [
    { id: "prompt_character", name: "Character Generator" },
    { id: "prompt_story", name: "Story Writer" },
    { id: "prompt_summary", name: "Story Summarizer" },
    { id: "prompt_dialogue", name: "Dialogue Generator" },
    { id: "prompt_worldbuilding", name: "World Builder" },
  ];

  function handleNodeMouseDown(nodeId: string, event: MouseEvent) {
    draggingNode = nodeId;
    selectedNode = nodeId;
    const node = chain.nodes.find((n) => n.id === nodeId);
    if (node) {
      dragOffset = {
        x: event.clientX - node.x,
        y: event.clientY - node.y,
      };
    }
  }

  function handleMouseMove(event: MouseEvent) {
    if (draggingNode && canvasRef) {
      const node = chain.nodes.find((n) => n.id === draggingNode);
      if (node) {
        const rect = canvasRef.getBoundingClientRect();
        node.x = Math.max(
          0,
          Math.min(rect.width - 200, event.clientX - rect.left - dragOffset.x)
        );
        node.y = Math.max(
          0,
          Math.min(rect.height - 150, event.clientY - rect.top - dragOffset.y)
        );
      }
    }
  }

  function handleMouseUp() {
    draggingNode = null;
  }

  function addNode(promptId: string, promptName: string) {
    const newNode: ChainNode = {
      id: `node_${Date.now()}`,
      promptId,
      promptName,
      x: 100 + chain.nodes.length * 50,
      y: 150 + chain.nodes.length * 30,
      inputs: {},
      outputs: [`output_${Date.now()}`],
    };
    chain.nodes.push(newNode);
    toastStore.addToast({
      message: `Added ${promptName} to chain`,
      type: "success",
      duration: 2000,
    });
  }

  function removeNode(nodeId: string) {
    // Remove connections associated with this node
    chain.connections = chain.connections.filter(
      (c) => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
    );
    // Remove the node
    chain.nodes = chain.nodes.filter((n) => n.id !== nodeId);
    if (selectedNode === nodeId) {
      selectedNode = null;
    }
    toastStore.addToast({
      message: "Node removed from chain",
      type: "info",
      duration: 2000,
    });
  }

  function getConnectionPath(
    sourceNode: ChainNode,
    targetNode: ChainNode
  ): string {
    const startX = sourceNode.x + 200; // Right edge of source
    const startY = sourceNode.y + 60; // Middle of source
    const endX = targetNode.x; // Left edge of target
    const endY = targetNode.y + 60; // Middle of target

    // Bezier curve for smooth connection
    const controlX1 = startX + (endX - startX) * 0.5;
    const controlX2 = startX + (endX - startX) * 0.5;

    return `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`;
  }

  async function executeChain() {
    isExecuting = true;
    executionProgress = {};

    try {
      // Save chain first if it doesn't have an ID
      if (!chain.id || chain.id.startsWith("chain_")) {
        await saveChain();
      }

      // Initialize all nodes as pending
      for (const node of chain.nodes) {
        executionProgress[node.id] = "pending";
      }

      // Execute chain via API
      const result: ChainExecutionResult = await chainClient.executeChain(
        chain.id,
        { initialInputs: {} }
      );

      // Update progress based on results
      for (const nodeResult of result.nodeResults) {
        executionProgress[nodeResult.nodeId] = nodeResult.status as
          | "success"
          | "error";
      }

      if (result.status === "completed") {
        toastStore.addToast({
          message: `Chain executed successfully in ${result.totalExecutionTimeMs}ms`,
          type: "success",
          duration: 3000,
        });
      } else {
        toastStore.addToast({
          message: "Chain execution failed",
          type: "error",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Chain execution error:", error);
      toastStore.addToast({
        message:
          error instanceof Error ? error.message : "Failed to execute chain",
        type: "error",
        duration: 4000,
      });
    } finally {
      isExecuting = false;
    }
  }

  async function saveChain() {
    try {
      const chainData = {
        name: chain.name,
        nodes: chain.nodes,
        connections: chain.connections,
      };

      if (chain.id && !chain.id.startsWith("chain_")) {
        // Update existing chain
        const updated = await chainClient.updateChain(chain.id, chainData);
        chain = updated;
      } else {
        // Create new chain
        const created = await chainClient.createChain(chainData);
        chain = created;
        chainId = created.id; // Update bindable prop
      }

      toastStore.addToast({
        message: "Chain saved successfully",
        type: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error("Save chain error:", error);
      toastStore.addToast({
        message:
          error instanceof Error ? error.message : "Failed to save chain",
        type: "error",
        duration: 3000,
      });
    }
  }

  onMount(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  });
</script>

<div class="prompt-chain-container h-full flex flex-col bg-forge-charcoal">
  <!-- Toolbar -->
  <div
    class="toolbar flex items-center justify-between p-4 bg-forge-gunmetal border-b border-slate-700"
  >
    <div class="flex items-center gap-4">
      <input
        type="text"
        bind:value={chain.name}
        class="px-3 py-1.5 bg-forge-charcoal border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:border-forge-ember"
        placeholder="Chain name"
      />
      <span class="text-xs text-slate-400">{chain.nodes.length} nodes</span>
    </div>

    <div class="flex items-center gap-2">
      <button
        class="px-4 py-2 bg-slate-700 text-slate-100 text-sm rounded hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onclick={saveChain}
        disabled={isExecuting}
      >
        Save Chain
      </button>
      <button
        class="px-4 py-2 bg-forge-ember text-slate-900 font-medium text-sm rounded hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onclick={executeChain}
        disabled={isExecuting || chain.nodes.length === 0}
      >
        {isExecuting ? "Executing..." : "Execute Chain"}
      </button>
    </div>
  </div>

  <div class="flex flex-1 overflow-hidden">
    <!-- Sidebar: Available Prompts -->
    <div
      class="sidebar w-64 bg-forge-gunmetal border-r border-slate-700 overflow-y-auto"
    >
      <div class="p-4">
        <h3 class="text-sm font-semibold text-slate-100 mb-3">
          Available Prompts
        </h3>
        <div class="space-y-2">
          {#each availablePrompts as prompt}
            <button
              class="w-full text-left px-3 py-2 bg-forge-charcoal border border-slate-600 rounded text-sm text-slate-200 hover:border-forge-ember transition-colors"
              onclick={() => addNode(prompt.id, prompt.name)}
              disabled={isExecuting}
            >
              <div class="font-medium">{prompt.name}</div>
              <div class="text-xs text-slate-400">Click to add</div>
            </button>
          {/each}
        </div>

        {#if selectedNode}
          <div class="mt-6 pt-6 border-t border-slate-700">
            <h3 class="text-sm font-semibold text-slate-100 mb-3">
              Node Properties
            </h3>
            {#each chain.nodes as node}
              {#if node.id === selectedNode}
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs text-slate-400 mb-1"
                      >Prompt</label
                    >
                    <div class="text-sm text-slate-200">{node.promptName}</div>
                  </div>
                  <div>
                    <label class="block text-xs text-slate-400 mb-1"
                      >Inputs</label
                    >
                    <div class="text-xs text-slate-300">
                      {Object.keys(node.inputs).length > 0
                        ? Object.entries(node.inputs)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(", ")
                        : "No inputs"}
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs text-slate-400 mb-1"
                      >Outputs</label
                    >
                    <div class="text-xs text-slate-300">
                      {node.outputs.join(", ")}
                    </div>
                  </div>
                  <button
                    class="w-full px-3 py-1.5 bg-red-900/30 text-red-400 text-xs rounded hover:bg-red-900/50 transition-colors"
                    onclick={() => removeNode(node.id)}
                  >
                    Remove Node
                  </button>
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Canvas: Chain Visualization -->
    <div
      class="canvas-container flex-1 relative overflow-auto"
      bind:this={canvasRef}
    >
      <svg class="absolute inset-0 w-full h-full pointer-events-none z-0">
        <!-- Draw connections -->
        {#each chain.connections as connection}
          {#each chain.nodes as sourceNode}
            {#if sourceNode.id === connection.sourceNodeId}
              {#each chain.nodes as targetNode}
                {#if targetNode.id === connection.targetNodeId}
                  <path
                    d={getConnectionPath(sourceNode, targetNode)}
                    fill="none"
                    stroke="#64748b"
                    stroke-width="2"
                    class="transition-all"
                  />
                  <!-- Arrow head -->
                  <circle
                    cx={targetNode.x}
                    cy={targetNode.y + 60}
                    r="4"
                    fill="#64748b"
                  />
                {/if}
              {/each}
            {/if}
          {/each}
        {/each}
      </svg>

      <!-- Draw nodes -->
      <div class="relative w-full h-full min-h-[600px]">
        {#each chain.nodes as node}
          <div
            class="chain-node absolute w-[200px] bg-forge-gunmetal border-2 rounded-lg shadow-lg cursor-move z-10 transition-colors"
            class:border-forge-ember={selectedNode === node.id}
            class:border-slate-600={selectedNode !== node.id}
            class:border-green-500={executionProgress[node.id] === "success"}
            class:border-yellow-500={executionProgress[node.id] === "running"}
            class:border-red-500={executionProgress[node.id] === "error"}
            style="left: {node.x}px; top: {node.y}px;"
            onmousedown={(e) => handleNodeMouseDown(node.id, e)}
            role="button"
            tabindex="0"
          >
            <div class="p-3">
              <div class="flex items-start justify-between mb-2">
                <div class="font-medium text-sm text-slate-100 leading-tight">
                  {node.promptName}
                </div>
                {#if executionProgress[node.id]}
                  <div class="ml-2">
                    {#if executionProgress[node.id] === "running"}
                      <div
                        class="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"
                      />
                    {:else if executionProgress[node.id] === "success"}
                      <svg
                        class="w-4 h-4 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    {:else if executionProgress[node.id] === "error"}
                      <svg
                        class="w-4 h-4 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    {/if}
                  </div>
                {/if}
              </div>

              <div class="text-xs text-slate-400 space-y-1">
                {#if Object.keys(node.inputs).length > 0}
                  <div class="flex items-center gap-1">
                    <span class="shrink-0">⬅</span>
                    <span class="truncate"
                      >{Object.keys(node.inputs).length} inputs</span
                    >
                  </div>
                {/if}
                {#if node.outputs.length > 0}
                  <div class="flex items-center gap-1">
                    <span class="shrink-0">➡</span>
                    <span class="truncate">{node.outputs.length} outputs</span>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Connection points -->
            <div
              class="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-forge-ember rounded-full border-2 border-forge-gunmetal"
            />
            <div
              class="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-forge-ember rounded-full border-2 border-forge-gunmetal"
            />
          </div>
        {/each}

        {#if chain.nodes.length === 0}
          <div
            class="absolute inset-0 flex items-center justify-center text-slate-500 text-sm"
          >
            <div class="text-center">
              <svg
                class="w-16 h-16 mx-auto mb-4 opacity-30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <p>Click prompts from the sidebar to add them to your chain</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .chain-node:active {
    cursor: grabbing;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>
