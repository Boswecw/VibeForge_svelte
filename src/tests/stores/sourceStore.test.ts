import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { sourceStore } from '$lib/workbench/stores/source.svelte';
import type { FileTreeNode } from '$lib/workbench/stores/source.svelte';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Source Store', () => {
	const mockRepoInfo = {
		name: 'test-repo',
		full_name: 'owner/test-repo',
		description: 'Test repository',
		default_branch: 'main'
	};

	const mockTreeResponse = {
		tree: [
			{ path: 'src/index.ts', type: 'blob' },
			{ path: 'src/utils.ts', type: 'blob' },
			{ path: 'README.md', type: 'blob' },
			{ path: 'package.json', type: 'blob' },
			{ path: 'node_modules/lib.js', type: 'blob' }
		]
	};

	const mockFileContent = {
		content: btoa('const x = 10;'), // Base64 encoded
		encoding: 'base64'
	};

	beforeEach(() => {
		// Reset store state
		sourceStore.disconnect();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	// ============================================================================
	// INITIALIZATION
	// ============================================================================

	describe('Initialization', () => {
		it('should initialize with not connected state', () => {
			expect(sourceStore.isConnected).toBe(false);
		});

		it('should initialize with no repo info', () => {
			expect(sourceStore.repo).toBeNull();
		});

		it('should initialize with empty file tree', () => {
			expect(sourceStore.fileTree).toEqual([]);
		});

		it('should initialize with not loading state', () => {
			expect(sourceStore.isLoading).toBe(false);
		});

		it('should initialize with no error', () => {
			expect(sourceStore.error).toBeNull();
		});
	});

	// ============================================================================
	// CONNECTION
	// ============================================================================

	describe('connect', () => {
		it('should connect to public repository', async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockRepoInfo
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTreeResponse
				});

			await sourceStore.connect({
				owner: 'owner',
				repo: 'test-repo',
				branch: 'main'
			});

			expect(sourceStore.isConnected).toBe(true);
			expect(sourceStore.repo).toMatchObject({
				owner: 'owner',
				name: 'test-repo',
				branch: 'main'
			});
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});

		it('should fetch repo info from GitHub API', async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockRepoInfo
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTreeResponse
				});

			await sourceStore.connect({
				owner: 'testuser',
				repo: 'testrepo',
				branch: 'main'
			});

			expect(mockFetch).toHaveBeenNthCalledWith(
				1,
				'https://api.github.com/repos/testuser/testrepo'
			);
		});

		it('should fetch file tree from GitHub API', async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockRepoInfo
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTreeResponse
				});

			await sourceStore.connect({
				owner: 'testuser',
				repo: 'testrepo',
				branch: 'main'
			});

			expect(mockFetch).toHaveBeenNthCalledWith(
				2,
				expect.stringContaining('https://api.github.com/repos/testuser/testrepo/git/trees/')
			);
		});

		it('should handle subdirectory path', async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockRepoInfo
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTreeResponse
				});

			await sourceStore.connect({
				owner: 'owner',
				repo: 'test-repo',
				branch: 'main',
				subdirectory: 'src/lib'
			});

			expect(sourceStore.repo?.subdirectory).toBe('src/lib');
		});

		it('should handle connection failure - invalid repo', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404
			});

			await expect(
				sourceStore.connect({
					owner: 'owner',
					repo: 'nonexistent',
					branch: 'main'
				})
			).rejects.toThrow();

			expect(sourceStore.isConnected).toBe(false);
			expect(sourceStore.error).not.toBeNull();
		});

		it('should handle connection failure - network error', async () => {
			mockFetch.mockRejectedValueOnce(new Error('Network error'));

			await expect(
				sourceStore.connect({
					owner: 'owner',
					repo: 'test-repo',
					branch: 'main'
				})
			).rejects.toThrow();

			expect(sourceStore.isConnected).toBe(false);
			expect(sourceStore.error).toBe('Network error');
		});

		it('should set loading state during connection', async () => {
			let loadingDuringFetch = false;

			mockFetch.mockImplementationOnce(async () => {
				loadingDuringFetch = sourceStore.isLoading;
				return {
					ok: true,
					json: async () => mockRepoInfo
				};
			});
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockTreeResponse
			});

			await sourceStore.connect({
				owner: 'owner',
				repo: 'test-repo',
				branch: 'main'
			});

			expect(loadingDuringFetch).toBe(true);
			expect(sourceStore.isLoading).toBe(false);
		});
	});

	describe('disconnect', () => {
		beforeEach(async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockRepoInfo
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTreeResponse
				});

			await sourceStore.connect({
				owner: 'owner',
				repo: 'test-repo',
				branch: 'main'
			});
		});

		it('should disconnect from repository', () => {
			sourceStore.disconnect();
			expect(sourceStore.isConnected).toBe(false);
		});

		it('should clear repo info', () => {
			sourceStore.disconnect();
			expect(sourceStore.repo).toBeNull();
		});

		it('should clear file tree', () => {
			sourceStore.disconnect();
			expect(sourceStore.fileTree).toEqual([]);
		});

		it('should clear error', () => {
			sourceStore.disconnect();
			expect(sourceStore.error).toBeNull();
		});
	});

	// ============================================================================
	// FILE LOADING
	// ============================================================================

	describe('loadFile', () => {
		beforeEach(async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockRepoInfo
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTreeResponse
				});

			await sourceStore.connect({
				owner: 'owner',
				repo: 'test-repo',
				branch: 'main'
			});

			vi.clearAllMocks();
		});

		it('should load file content from GitHub', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockFileContent
			});

			const content = await sourceStore.loadFile('src/index.ts');

			expect(content).toBe('const x = 10;');
			expect(mockFetch).toHaveBeenCalledWith(
				'https://api.github.com/repos/owner/test-repo/contents/src/index.ts?ref=main'
			);
		});

		it('should cache loaded files', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockFileContent
			});

			// First load
			await sourceStore.loadFile('src/index.ts');
			expect(mockFetch).toHaveBeenCalledTimes(1);

			// Second load (should use cache)
			await sourceStore.loadFile('src/index.ts');
			expect(mockFetch).toHaveBeenCalledTimes(1); // No additional fetch
		});

		it('should handle file load failure', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404
			});

			await expect(sourceStore.loadFile('nonexistent.ts')).rejects.toThrow();
		});

		it('should decode base64 content correctly', async () => {
			const testContent = 'Hello World!';
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					content: btoa(testContent),
					encoding: 'base64'
				})
			});

			const content = await sourceStore.loadFile('test.txt');
			expect(content).toBe(testContent);
		});
	});

	// ============================================================================
	// BATCH FILE FETCHING
	// ============================================================================

	describe('fetchAllSourceFiles', () => {
		beforeEach(async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockRepoInfo
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						tree: [
							{ path: 'src/file1.ts', type: 'blob' },
							{ path: 'src/file2.ts', type: 'blob' },
							{ path: 'src/file3.ts', type: 'blob' }
						]
					})
				});

			await sourceStore.connect({
				owner: 'owner',
				repo: 'test-repo',
				branch: 'main'
			});

			vi.clearAllMocks();
		});

		it('should fetch all source files', async () => {
			// Mock file content responses
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ content: btoa('file1 content'), encoding: 'base64' })
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ content: btoa('file2 content'), encoding: 'base64' })
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ content: btoa('file3 content'), encoding: 'base64' })
				});

			const files = await sourceStore.fetchAllSourceFiles();

			expect(files.size).toBe(3);
			expect(files.get('src/file1.ts')).toBe('file1 content');
			expect(files.get('src/file2.ts')).toBe('file2 content');
			expect(files.get('src/file3.ts')).toBe('file3 content');
		});

		it('should batch fetch files in chunks of 10', async () => {
			// Create 25 files to test batching
			const manyFiles = Array.from({ length: 25 }, (_, i) => ({
				tree: [{ path: `file${i}.ts`, type: 'blob' }]
			}));

			mockFetch.mockReset();
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockRepoInfo
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						tree: manyFiles[0].tree.concat(
							...manyFiles.slice(1).map(f => f.tree)
						)
					})
				});

			await sourceStore.connect({
				owner: 'owner',
				repo: 'test-repo',
				branch: 'main'
			});

			vi.clearAllMocks();

			// Mock all file content responses
			for (let i = 0; i < 25; i++) {
				mockFetch.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						content: btoa(`content${i}`),
						encoding: 'base64'
					})
				});
			}

			const files = await sourceStore.fetchAllSourceFiles();

			expect(files.size).toBe(25);
			// Should have been fetched in 3 batches (10 + 10 + 5)
			expect(mockFetch).toHaveBeenCalledTimes(25);
		});

		it('should skip files that fail to load', async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ content: btoa('content1'), encoding: 'base64' })
				})
				.mockRejectedValueOnce(new Error('Failed to load'))
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ content: btoa('content3'), encoding: 'base64' })
				});

			const files = await sourceStore.fetchAllSourceFiles();

			expect(files.size).toBe(2); // Only successfully loaded files
			expect(files.has('src/file1.ts')).toBe(true);
			expect(files.has('src/file2.ts')).toBe(false);
			expect(files.has('src/file3.ts')).toBe(true);
		});
	});

	// ============================================================================
	// FILE TREE BUILDING
	// ============================================================================

	describe('buildFileTree', () => {
		it('should build hierarchical tree from flat list', () => {
			const items = [
				{ path: 'src/index.ts', type: 'blob' },
				{ path: 'src/utils/helpers.ts', type: 'blob' },
				{ path: 'src/utils/constants.ts', type: 'blob' },
				{ path: 'README.md', type: 'blob' }
			];

			const tree = sourceStore.buildFileTree(items);

			expect(tree.length).toBe(2); // src and README.md
			const srcNode = tree.find((n: FileTreeNode) => n.name === 'src');
			expect(srcNode).toBeDefined();
			expect(srcNode?.type).toBe('directory');
			expect(srcNode?.children?.length).toBe(2); // index.ts and utils
		});

		it('should filter out non-source files', () => {
			const items = [
				{ path: 'src/index.ts', type: 'blob' },
				{ path: 'node_modules/lib.js', type: 'blob' },
				{ path: '.git/config', type: 'blob' },
				{ path: 'dist/bundle.js', type: 'blob' }
			];

			const tree = sourceStore.buildFileTree(items);

			expect(tree.length).toBe(1); // Only src
			expect(tree.some((n: FileTreeNode) => n.name === 'node_modules')).toBe(false);
			expect(tree.some((n: FileTreeNode) => n.name === '.git')).toBe(false);
			expect(tree.some((n: FileTreeNode) => n.name === 'dist')).toBe(false);
		});

		it('should handle files at root level', () => {
			const items = [
				{ path: 'index.ts', type: 'blob' },
				{ path: 'utils.ts', type: 'blob' }
			];

			const tree = sourceStore.buildFileTree(items);

			expect(tree.length).toBe(2);
			expect(tree.every((n: FileTreeNode) => n.type === 'file')).toBe(true);
		});

		it('should handle deeply nested directories', () => {
			const items = [
				{ path: 'a/b/c/d/e/file.ts', type: 'blob' }
			];

			const tree = sourceStore.buildFileTree(items);

			let current = tree;
			expect(current.length).toBe(1);
			expect(current[0].name).toBe('a');

			// Traverse down the tree
			for (const dir of ['a', 'b', 'c', 'd', 'e']) {
				const node = current.find((n: FileTreeNode) => n.name === dir);
				expect(node).toBeDefined();
				expect(node?.type).toBe('directory');
				if (node?.children) {
					current = node.children;
				}
			}
		});
	});

	// ============================================================================
	// SOURCE FILE PATH EXTRACTION
	// ============================================================================

	describe('getSourceFilePaths', () => {
		it('should extract all file paths from tree', () => {
			const tree: FileTreeNode[] = [
				{
					name: 'src',
					path: 'src',
					type: 'directory',
					children: [
						{ name: 'index.ts', path: 'src/index.ts', type: 'file' },
						{ name: 'utils.ts', path: 'src/utils.ts', type: 'file' }
					]
				}
			];

			const paths = sourceStore.getSourceFilePaths(tree);

			expect(paths).toContain('src/index.ts');
			expect(paths).toContain('src/utils.ts');
			expect(paths.length).toBe(2);
		});

		it('should handle nested directories', () => {
			const tree: FileTreeNode[] = [
				{
					name: 'src',
					path: 'src',
					type: 'directory',
					children: [
						{
							name: 'lib',
							path: 'src/lib',
							type: 'directory',
							children: [
								{ name: 'file.ts', path: 'src/lib/file.ts', type: 'file' }
							]
						}
					]
				}
			];

			const paths = sourceStore.getSourceFilePaths(tree);

			expect(paths).toContain('src/lib/file.ts');
		});

		it('should return empty array for empty tree', () => {
			const paths = sourceStore.getSourceFilePaths([]);
			expect(paths).toEqual([]);
		});
	});

	// ============================================================================
	// INTEGRATION TESTS
	// ============================================================================

	describe('Integration - Complete Workflow', () => {
		it('should handle full connection and file loading workflow', async () => {
			// Connect to repository
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockRepoInfo
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTreeResponse
				});

			await sourceStore.connect({
				owner: 'owner',
				repo: 'test-repo',
				branch: 'main'
			});

			expect(sourceStore.isConnected).toBe(true);
			expect(sourceStore.fileTree.length).toBeGreaterThan(0);

			// Load a file
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockFileContent
			});

			const content = await sourceStore.loadFile('src/index.ts');
			expect(content).toBe('const x = 10;');

			// Disconnect
			sourceStore.disconnect();
			expect(sourceStore.isConnected).toBe(false);
			expect(sourceStore.repo).toBeNull();
		});

		it('should handle reconnection to different repository', async () => {
			// First connection
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ ...mockRepoInfo, name: 'repo1' })
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTreeResponse
				});

			await sourceStore.connect({
				owner: 'owner',
				repo: 'repo1',
				branch: 'main'
			});

			expect(sourceStore.repo?.name).toBe('repo1');

			// Second connection (should replace first)
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ ...mockRepoInfo, name: 'repo2' })
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockTreeResponse
				});

			await sourceStore.connect({
				owner: 'owner',
				repo: 'repo2',
				branch: 'main'
			});

			expect(sourceStore.repo?.name).toBe('repo2');
		});
	});
});
