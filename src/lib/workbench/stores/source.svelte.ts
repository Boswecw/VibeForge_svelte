/**
 * Source Store (Svelte 5)
 *
 * Manages GitHub repository connections and file caching.
 */

interface RepoInfo {
	owner: string;
	repo: string;
	branch: string;
	subdirectory?: string;
	name: string;
}

export interface FileTreeNode {
	name: string;
	path: string;
	type: 'file' | 'directory';
	children?: FileTreeNode[];
}

export interface ConnectOptions {
	owner: string;
	repo: string;
	branch: string;
	subdirectory?: string;
	isPrivate?: boolean;
}

interface SourceState {
	repo: RepoInfo | null;
	fileTree: FileTreeNode[];
	isConnected: boolean;
	isLoading: boolean;
	error: string | null;

	// File cache (path -> content)
	fileCache: Map<string, string>;

	// Currently loaded file
	currentFile: string | null;
}

function createSourceStore() {
	let state = $state<SourceState>({
		repo: null,
		fileTree: [],
		isConnected: false,
		isLoading: false,
		error: null,
		fileCache: new Map(),
		currentFile: null
	});

	// GitHub API base URL
	const API_BASE = 'https://api.github.com';

	return {
		// Getters
		get repo() {
			return state.repo;
		},
		get fileTree() {
			return state.fileTree;
		},
		get isConnected() {
			return state.isConnected;
		},
		get isLoading() {
			return state.isLoading;
		},
		get error() {
			return state.error;
		},
		get currentFile() {
			return state.currentFile;
		},

		/**
		 * Connect to a GitHub repository
		 */
		async connect(options: ConnectOptions) {
			state.isLoading = true;
			state.error = null;

			try {
				// Fetch repo info
				const repoRes = await fetch(`${API_BASE}/repos/${options.owner}/${options.repo}`);

				if (!repoRes.ok) {
					throw new Error(
						repoRes.status === 404 ? 'Repository not found' : 'Failed to fetch repository'
					);
				}

				// Fetch file tree
				const treePath = options.subdirectory
					? `${options.branch}:${options.subdirectory}`
					: options.branch;

				const treeRes = await fetch(
					`${API_BASE}/repos/${options.owner}/${options.repo}/git/trees/${treePath}?recursive=1`
				);

				if (!treeRes.ok) {
					throw new Error('Failed to fetch file tree');
				}

				const treeData = await treeRes.json();

				// Build tree structure
				state.fileTree = this.buildFileTree(treeData.tree, options.subdirectory);

				state.repo = {
					owner: options.owner,
					repo: options.repo,
					branch: options.branch,
					subdirectory: options.subdirectory,
					name: options.repo
				};

				state.isConnected = true;
			} catch (e) {
				state.error = e instanceof Error ? e.message : 'Connection failed';
				throw e;
			} finally {
				state.isLoading = false;
			}
		},

		/**
		 * Disconnect from repository
		 */
		disconnect() {
			state.repo = null;
			state.fileTree = [];
			state.isConnected = false;
			state.fileCache.clear();
			state.currentFile = null;
		},

		/**
		 * Load a file's content
		 */
		async loadFile(path: string): Promise<string> {
			// Check cache first
			if (state.fileCache.has(path)) {
				state.currentFile = path;
				return state.fileCache.get(path)!;
			}

			if (!state.repo) {
				throw new Error('No repository connected');
			}

			const fullPath = state.repo.subdirectory ? `${state.repo.subdirectory}/${path}` : path;

			const res = await fetch(
				`${API_BASE}/repos/${state.repo.owner}/${state.repo.repo}/contents/${fullPath}?ref=${state.repo.branch}`
			);

			if (!res.ok) {
				throw new Error('Failed to fetch file');
			}

			const data = await res.json();
			const content = atob(data.content);

			// Cache it
			state.fileCache.set(path, content);
			state.currentFile = path;

			return content;
		},

		/**
		 * Get all cached files (for analysis)
		 */
		getCachedFiles(): Map<string, string> {
			return state.fileCache;
		},

		/**
		 * Fetch all source files for analysis
		 */
		async fetchAllSourceFiles(): Promise<Map<string, string>> {
			if (!state.repo) {
				throw new Error('No repository connected');
			}

			const sourceFiles = this.getSourceFilePaths(state.fileTree);

			// Fetch files not in cache (in parallel, with limit)
			const uncached = sourceFiles.filter((p) => !state.fileCache.has(p));
			const batchSize = 10;

			for (let i = 0; i < uncached.length; i += batchSize) {
				const batch = uncached.slice(i, i + batchSize);
				await Promise.all(batch.map((p) => this.loadFile(p)));
			}

			return state.fileCache;
		},

		/**
		 * Build file tree from GitHub API response
		 */
		buildFileTree(items: any[], basePath?: string): FileTreeNode[] {
			const root: FileTreeNode[] = [];
			const map = new Map<string, FileTreeNode>();

			// Filter to relevant paths
			const filtered = items.filter((item) => {
				// Skip non-source files
				if (item.type === 'blob') {
					const ext = item.path.split('.').pop();
					return ['ts', 'tsx', 'js', 'jsx', 'svelte', 'py', 'rs', 'go', 'java', 'json', 'md'].includes(
						ext
					);
				}
				return item.type === 'tree';
			});

			// Build tree
			for (const item of filtered) {
				const pathParts = item.path.split('/');
				const name = pathParts[pathParts.length - 1];

				const node: FileTreeNode = {
					name,
					path: item.path,
					type: item.type === 'tree' ? 'directory' : 'file',
					children: item.type === 'tree' ? [] : undefined
				};

				map.set(item.path, node);

				if (pathParts.length === 1) {
					root.push(node);
				} else {
					const parentPath = pathParts.slice(0, -1).join('/');
					const parent = map.get(parentPath);
					if (parent && parent.children) {
						parent.children.push(node);
					}
				}
			}

			return root;
		},

		/**
		 * Get paths of source files from tree
		 */
		getSourceFilePaths(nodes: FileTreeNode[]): string[] {
			const paths: string[] = [];

			function walk(node: FileTreeNode) {
				if (node.type === 'file') {
					paths.push(node.path);
				} else if (node.children) {
					node.children.forEach(walk);
				}
			}

			nodes.forEach(walk);
			return paths;
		}
	};
}

export const sourceStore = createSourceStore();
