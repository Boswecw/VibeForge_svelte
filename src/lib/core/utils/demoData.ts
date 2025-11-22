/**
 * Demo Data Initialization
 * Populates stores with mock data for Phase 1 development
 */

import {
	workspaceStore,
	contextBlocksStore,
	promptStore,
	modelsStore,
	toolsStore
} from '$lib/core/stores';
import type { Workspace, ContextBlock, Model, McpServer, McpTool } from '$lib/core/types';

/**
 * Initialize all stores with demo data
 * Called on app mount in +layout.svelte
 */
export function initializeDemoData() {
	// Initialize workspace
	const demoWorkspace: Workspace = {
		id: 'default',
		name: 'Default Workspace',
		description: 'Your main VibeForge workspace',
		settings: {
			theme: 'dark',
			autoSave: true,
			defaultModel: 'claude-3-5-sonnet'
		},
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	workspaceStore.setWorkspace(demoWorkspace);

	// Initialize context blocks
	const demoContextBlocks: ContextBlock[] = [
		{
			id: 'ctx_1',
			title: 'VibeForge System Context',
			description: 'System-level context about VibeForge architecture and features',
			content: `VibeForge is a professional prompt engineering workbench with a 3-column layout:
- Context Column: Manage context blocks and MCP tools
- Prompt Column: Compose prompts with template variables
- Output Column: View LLM responses with metrics

Built with SvelteKit 2.x, Svelte 5 runes, and Tailwind v4.`,
			tags: ['system', 'architecture', 'overview'],
			source: 'global',
			kind: 'system',
			isActive: true,
			createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
			updatedAt: new Date(Date.now() - 86400000).toISOString()
		},
		{
			id: 'ctx_2',
			title: 'Forge Design System',
			description: 'Color palette and typography guidelines for the Forge design system',
			content: `Color Palette:
- forge-blacksteel: #0B0F17 (primary background)
- forge-gunmetal: #111827 (secondary surfaces)
- forge-steel: #1E293B (interactive states)
- forge-ember: #FBBF24 (primary accent - amber glow)

Typography: Inter for UI, JetBrains Mono for code`,
			tags: ['design', 'colors', 'typography'],
			source: 'global',
			kind: 'design',
			isActive: true,
			createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
			updatedAt: new Date(Date.now() - 172800000).toISOString()
		},
		{
			id: 'ctx_3',
			title: 'Svelte 5 Runes Quick Reference',
			description: 'Quick reference guide for Svelte 5 reactive primitives',
			content: `// State
let count = $state(0);

// Derived
const doubled = $derived(count * 2);

// Effect
$effect(() => {
  console.log('Count:', count);
});

// Props in components
const { name, age = 18 }: Props = $props();`,
			tags: ['svelte', 'runes', 'reference'],
			source: 'workspace',
			kind: 'code',
			isActive: false,
			createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
			updatedAt: new Date(Date.now() - 259200000).toISOString()
		}
	];
	contextBlocksStore.setBlocks(demoContextBlocks);

	// Initialize models
	const demoModels: Model[] = [
		{
			id: 'claude-3-5-sonnet',
			name: 'Claude 3.5 Sonnet',
			provider: 'anthropic',
			maxTokens: 200000,
			supportsStreaming: true,
			costPer1kTokens: 0.003, // $3 per 1M input tokens
			metadata: {
				description: 'Most intelligent model, best for complex tasks',
				outputTokens: 8192,
				pricingOutput: 0.015 // $15 per 1M output tokens
			}
		},
		{
			id: 'claude-3-5-haiku',
			name: 'Claude 3.5 Haiku',
			provider: 'anthropic',
			maxTokens: 200000,
			supportsStreaming: true,
			costPer1kTokens: 0.0008, // $0.80 per 1M input tokens
			metadata: {
				description: 'Fast and cost-effective',
				outputTokens: 8192,
				pricingOutput: 0.004 // $4 per 1M output tokens
			}
		},
		{
			id: 'gpt-4-turbo',
			name: 'GPT-4 Turbo',
			provider: 'openai',
			maxTokens: 128000,
			supportsStreaming: true,
			costPer1kTokens: 0.01, // $10 per 1M input tokens
			metadata: {
				description: 'Latest GPT-4 with improved performance',
				outputTokens: 4096,
				pricingOutput: 0.03 // $30 per 1M output tokens
			}
		},
		{
			id: 'gpt-4o',
			name: 'GPT-4o',
			provider: 'openai',
			maxTokens: 128000,
			supportsStreaming: true,
			costPer1kTokens: 0.005, // $5 per 1M input tokens
			metadata: {
				description: 'Multimodal model with vision capabilities',
				outputTokens: 4096,
				pricingOutput: 0.015 // $15 per 1M output tokens
			}
		},
		{
			id: 'llama-3-70b',
			name: 'Llama 3 70B',
			provider: 'local',
			maxTokens: 8192,
			supportsStreaming: true,
			costPer1kTokens: 0,
			metadata: {
				description: 'Open-source model running locally',
				outputTokens: 2048,
				pricingOutput: 0
			}
		}
	];
	modelsStore.setModels(demoModels);

	// Pre-select Claude 3.5 Sonnet
	modelsStore.selectModel('claude-3-5-sonnet');

	// Initialize MCP servers and tools
	const demoServers: McpServer[] = [
		{
			id: 'dataforge-mcp',
			name: 'DataForge MCP',
			description: 'Knowledge base and document management',
			version: '1.0.0',
			status: 'connected',
			endpoint: 'http://localhost:8001',
			capabilities: {
				supportsToolDiscovery: true,
				supportsStreaming: false,
				supportsAuth: false
			}
		},
		{
			id: 'neuroforge-mcp',
			name: 'NeuroForge MCP',
			description: 'Model routing and orchestration',
			version: '1.0.0',
			status: 'connected',
			endpoint: 'http://localhost:8002',
			capabilities: {
				supportsToolDiscovery: true,
				supportsStreaming: true,
				supportsAuth: true
			}
		},
		{
			id: 'web-tools-mcp',
			name: 'Web Tools MCP',
			description: 'Web search and scraping utilities',
			version: '1.0.0',
			status: 'connected',
			endpoint: 'http://localhost:8003',
			capabilities: {
				supportsToolDiscovery: true,
				supportsStreaming: false,
				supportsAuth: false
			}
		}
	];

	const demoTools: McpTool[] = [
		{
			id: 'tool_query_kb',
			serverId: 'dataforge-mcp',
			name: 'queryKnowledgeBase',
			description: 'Search the knowledge base for relevant information',
			category: 'query',
			inputSchema: {
				type: 'object',
				properties: {
					query: { type: 'string' },
					limit: { type: 'number' }
				}
			}
		},
		{
			id: 'tool_get_context',
			serverId: 'dataforge-mcp',
			name: 'getContextBlock',
			description: 'Retrieve a specific context block by ID',
			category: 'query',
			inputSchema: {
				type: 'object',
				properties: {
					blockId: { type: 'string' }
				}
			}
		},
		{
			id: 'tool_ingest',
			serverId: 'dataforge-mcp',
			name: 'ingestDocument',
			description: 'Add a new document to the knowledge base',
			category: 'transform',
			inputSchema: {
				type: 'object',
				properties: {
					content: { type: 'string' },
					metadata: { type: 'object' }
				}
			}
		},
		{
			id: 'tool_route_model',
			serverId: 'neuroforge-mcp',
			name: 'routeToModel',
			description: 'Route a prompt to the best model for the task',
			category: 'system',
			inputSchema: {
				type: 'object',
				properties: {
					prompt: { type: 'string' },
					taskType: { type: 'string' }
				}
			}
		},
		{
			id: 'tool_web_search',
			serverId: 'web-tools-mcp',
			name: 'webSearch',
			description: 'Search the web for information',
			category: 'query',
			inputSchema: {
				type: 'object',
				properties: {
					query: { type: 'string' },
					maxResults: { type: 'number' }
				}
			}
		},
		{
			id: 'tool_fetch_url',
			serverId: 'web-tools-mcp',
			name: 'fetchURL',
			description: 'Fetch and extract content from a URL',
			category: 'query',
			inputSchema: {
				type: 'object',
				properties: {
					url: { type: 'string' }
				}
			}
		}
	];

	toolsStore.setServers(demoServers);
	toolsStore.setTools(demoTools);

	// Set some initial prompt text (optional)
	promptStore.setText(
		'You are an expert AI assistant. Please help me understand the key features of VibeForge and how it can improve my prompt engineering workflow.'
	);

	console.log('✅ Demo data initialized');
}
