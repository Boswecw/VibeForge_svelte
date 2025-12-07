/**
 * MCP Integration Tests
 * Tests for Model Context Protocol client integration with real server scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { McpClient } from '$lib/core/mcp/client';
import { McpConnectionManager } from '$lib/core/mcp/manager';
import type { McpServerConfig } from '$lib/core/mcp/types';

describe('MCP Client Integration', () => {
	let client: McpClient;

	beforeEach(() => {
		const config: McpServerConfig = {
			id: 'test-server',
			name: 'Test Server',
			transport: 'http',
			url: 'http://localhost:8001'
		};
		client = new McpClient(config);
	});

	afterEach(async () => {
		await client.disconnect();
	});

	describe('Connection Management', () => {
		it('should connect to server successfully', async () => {
			// Mock successful connection
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: '2.0',
					id: 1,
					result: {
						protocolVersion: '1.0',
						serverInfo: {
							name: 'Test Server',
							version: '1.0.0'
						}
					}
				})
			});

			await client.connect();

			expect(client.isConnected()).toBe(true);
			expect(client.getStatus()).toBe('connected');
		});

		it('should handle connection failure gracefully', async () => {
			// Mock connection failure
			global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

			await expect(client.connect()).rejects.toThrow();
			expect(client.isConnected()).toBe(false);
			expect(client.getStatus()).toBe('error');
		});

		it('should reconnect after disconnect', async () => {
			// Mock successful connection
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: '2.0',
					id: 1,
					result: {
						protocolVersion: '1.0',
						serverInfo: { name: 'Test Server', version: '1.0.0' }
					}
				})
			});

			await client.connect();
			expect(client.isConnected()).toBe(true);

			await client.disconnect();
			expect(client.isConnected()).toBe(false);

			await client.connect();
			expect(client.isConnected()).toBe(true);
		});

		it('should emit connection events', async () => {
			const connectHandler = vi.fn();
			const disconnectHandler = vi.fn();

			client.on('connected', connectHandler);
			client.on('disconnected', disconnectHandler);

			// Mock successful connection
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: '2.0',
					id: 1,
					result: {
						protocolVersion: '1.0',
						serverInfo: { name: 'Test Server', version: '1.0.0' }
					}
				})
			});

			await client.connect();
			expect(connectHandler).toHaveBeenCalled();

			await client.disconnect();
			expect(disconnectHandler).toHaveBeenCalled();
		});
	});

	describe('Tool Discovery', () => {
		it('should list available tools', async () => {
			// Mock successful connection and tool list
			global.fetch = vi
				.fn()
				.mockResolvedValueOnce({
					// Initialize
					ok: true,
					json: async () => ({
						jsonrpc: '2.0',
						id: 1,
						result: {
							protocolVersion: '1.0',
							serverInfo: { name: 'Test Server', version: '1.0.0' }
						}
					})
				})
				.mockResolvedValueOnce({
					// List tools
					ok: true,
					json: async () => ({
						jsonrpc: '2.0',
						id: 2,
						result: {
							tools: [
								{
									name: 'queryKB',
									description: 'Query knowledge base',
									inputSchema: {
										type: 'object',
										properties: {
											query: { type: 'string' }
										}
									}
								},
								{
									name: 'ingestDocument',
									description: 'Ingest document',
									inputSchema: {
										type: 'object',
										properties: {
											content: { type: 'string' }
										}
									}
								}
							]
						}
					})
				});

			await client.connect();
			const tools = await client.listTools();

			expect(tools).toHaveLength(2);
			expect(tools[0].name).toBe('queryKB');
			expect(tools[1].name).toBe('ingestDocument');
		});

		it('should handle empty tool list', async () => {
			global.fetch = vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						jsonrpc: '2.0',
						id: 1,
						result: {
							protocolVersion: '1.0',
							serverInfo: { name: 'Test Server', version: '1.0.0' }
						}
					})
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						jsonrpc: '2.0',
						id: 2,
						result: { tools: [] }
					})
				});

			await client.connect();
			const tools = await client.listTools();

			expect(tools).toHaveLength(0);
		});
	});

	describe('Tool Invocation', () => {
		it('should invoke tool successfully', async () => {
			global.fetch = vi
				.fn()
				.mockResolvedValueOnce({
					// Initialize
					ok: true,
					json: async () => ({
						jsonrpc: '2.0',
						id: 1,
						result: {
							protocolVersion: '1.0',
							serverInfo: { name: 'Test Server', version: '1.0.0' }
						}
					})
				})
				.mockResolvedValueOnce({
					// Invoke tool
					ok: true,
					json: async () => ({
						jsonrpc: '2.0',
						id: 2,
						result: {
							content: 'Query result: 5 documents found'
						}
					})
				});

			await client.connect();
			const result = await client.callTool('queryKB', { query: 'test query' });

			expect(result.content).toContain('5 documents found');
		});

		it('should handle tool invocation errors', async () => {
			global.fetch = vi
				.fn()
				.mockResolvedValueOnce({
					// Initialize
					ok: true,
					json: async () => ({
						jsonrpc: '2.0',
						id: 1,
						result: {
							protocolVersion: '1.0',
							serverInfo: { name: 'Test Server', version: '1.0.0' }
						}
					})
				})
				.mockResolvedValueOnce({
					// Invoke tool with error
					ok: false,
					status: 400,
					json: async () => ({
						jsonrpc: '2.0',
						id: 2,
						error: {
							code: -32602,
							message: 'Invalid params'
						}
					})
				});

			await client.connect();

			await expect(client.callTool('queryKB', { invalid: 'params' })).rejects.toThrow();
		});

		it('should timeout long-running tool calls', async () => {
			global.fetch = vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						jsonrpc: '2.0',
						id: 1,
						result: {
							protocolVersion: '1.0',
							serverInfo: { name: 'Test Server', version: '1.0.0' }
						}
					})
				})
				.mockImplementationOnce(
					() =>
						new Promise((resolve) =>
							setTimeout(
								() =>
									resolve({
										ok: true,
										json: async () => ({ jsonrpc: '2.0', id: 2, result: {} })
									}),
								35000
							)
						)
				);

			await client.connect();

			// Should timeout after 30 seconds (default timeout)
			await expect(
				client.callTool('slowTool', {}, { timeout: 1000 })
			).rejects.toThrow(/timeout/i);
		}, 10000);
	});

	describe('Error Recovery', () => {
		it('should retry failed requests', async () => {
			let attempts = 0;
			global.fetch = vi.fn().mockImplementation(async () => {
				attempts++;
				if (attempts < 3) {
					throw new Error('Network error');
				}
				return {
					ok: true,
					json: async () => ({
						jsonrpc: '2.0',
						id: 1,
						result: {
							protocolVersion: '1.0',
							serverInfo: { name: 'Test Server', version: '1.0.0' }
						}
					})
				};
			});

			await client.connect();

			expect(attempts).toBe(3); // Initial attempt + 2 retries
			expect(client.isConnected()).toBe(true);
		});

		it('should handle server disconnection', async () => {
			const disconnectHandler = vi.fn();
			client.on('disconnected', disconnectHandler);

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: '2.0',
					id: 1,
					result: {
						protocolVersion: '1.0',
						serverInfo: { name: 'Test Server', version: '1.0.0' }
					}
				})
			});

			await client.connect();
			expect(client.isConnected()).toBe(true);

			// Simulate server disconnection
			await client.disconnect();

			expect(disconnectHandler).toHaveBeenCalled();
			expect(client.isConnected()).toBe(false);
		});
	});
});

describe('MCP Connection Manager Integration', () => {
	let manager: McpConnectionManager;

	beforeEach(() => {
		manager = new McpConnectionManager();
	});

	afterEach(async () => {
		await manager.disconnectAll();
	});

	describe('Multi-Server Management', () => {
		it('should connect to multiple servers', async () => {
			// Mock successful connections
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: '2.0',
					id: 1,
					result: {
						protocolVersion: '1.0',
						serverInfo: { name: 'Test Server', version: '1.0.0' }
					}
				})
			});

			await manager.connect({
				id: 'dataforge',
				name: 'DataForge',
				transport: 'http',
				url: 'http://localhost:8001'
			});

			await manager.connect({
				id: 'neuroforge',
				name: 'NeuroForge',
				transport: 'http',
				url: 'http://localhost:8000'
			});

			const servers = manager.getConnectedServers();
			expect(servers).toHaveLength(2);
		});

		it('should list all tools from all servers', async () => {
			global.fetch = vi
				.fn()
				.mockResolvedValueOnce({
					// Server 1 init
					ok: true,
					json: async () => ({
						jsonrpc: '2.0',
						id: 1,
						result: {
							protocolVersion: '1.0',
							serverInfo: { name: 'Server 1', version: '1.0.0' }
						}
					})
				})
				.mockResolvedValueOnce({
					// Server 1 tools
					ok: true,
					json: async () => ({
						jsonrpc: '2.0',
						id: 2,
						result: {
							tools: [{ name: 'tool1', description: 'Tool 1', inputSchema: {} }]
						}
					})
				})
				.mockResolvedValueOnce({
					// Server 2 init
					ok: true,
					json: async () => ({
						jsonrpc: '2.0',
						id: 3,
						result: {
							protocolVersion: '1.0',
							serverInfo: { name: 'Server 2', version: '1.0.0' }
						}
					})
				})
				.mockResolvedValueOnce({
					// Server 2 tools
					ok: true,
					json: async () => ({
						jsonrpc: '2.0',
						id: 4,
						result: {
							tools: [{ name: 'tool2', description: 'Tool 2', inputSchema: {} }]
						}
					})
				});

			await manager.connect({
				id: 'server1',
				name: 'Server 1',
				transport: 'http',
				url: 'http://localhost:8001'
			});

			await manager.connect({
				id: 'server2',
				name: 'Server 2',
				transport: 'http',
				url: 'http://localhost:8002'
			});

			const allTools = await manager.getAllTools();

			expect(allTools).toHaveLength(2);
			expect(allTools[0].name).toBe('tool1');
			expect(allTools[1].name).toBe('tool2');
		});

		it('should disconnect from specific server', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: '2.0',
					id: 1,
					result: {
						protocolVersion: '1.0',
						serverInfo: { name: 'Test Server', version: '1.0.0' }
					}
				})
			});

			await manager.connect({
				id: 'server1',
				name: 'Server 1',
				transport: 'http',
				url: 'http://localhost:8001'
			});

			await manager.connect({
				id: 'server2',
				name: 'Server 2',
				transport: 'http',
				url: 'http://localhost:8002'
			});

			expect(manager.getConnectedServers()).toHaveLength(2);

			await manager.disconnect('server1');

			expect(manager.getConnectedServers()).toHaveLength(1);
			expect(manager.getClient('server1')).toBeUndefined();
			expect(manager.getClient('server2')).toBeDefined();
		});
	});

	describe('Event Handling', () => {
		it('should emit server connected event', async () => {
			const handler = vi.fn();
			manager.on('server-connected', handler);

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: '2.0',
					id: 1,
					result: {
						protocolVersion: '1.0',
						serverInfo: { name: 'Test Server', version: '1.0.0' }
					}
				})
			});

			await manager.connect({
				id: 'test',
				name: 'Test Server',
				transport: 'http',
				url: 'http://localhost:8001'
			});

			expect(handler).toHaveBeenCalledWith('test');
		});

		it('should emit server disconnected event', async () => {
			const handler = vi.fn();
			manager.on('server-disconnected', handler);

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					jsonrpc: '2.0',
					id: 1,
					result: {
						protocolVersion: '1.0',
						serverInfo: { name: 'Test Server', version: '1.0.0' }
					}
				})
			});

			await manager.connect({
				id: 'test',
				name: 'Test Server',
				transport: 'http',
				url: 'http://localhost:8001'
			});

			await manager.disconnect('test');

			expect(handler).toHaveBeenCalledWith('test');
		});
	});
});
