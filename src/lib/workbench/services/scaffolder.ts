/**
 * Scaffolder Service
 *
 * Service for project scaffolding via Tauri backend.
 * Wraps Tauri commands and provides type-safe scaffolding API.
 *
 * Browser Mode: When running in browser (not Tauri), uses mock implementation for testing.
 */

import { browser } from '$app/environment';
import type {
	ScaffoldConfig,
	ScaffoldResult,
	ScaffoldProgressEvent
} from '../types/scaffolding';

// Conditionally import Tauri APIs (only available in Tauri context)
let invoke: any;
let listen: any;
let UnlistenFn: any;

if (browser && (window as any).__TAURI__) {
	// Running in Tauri desktop app
	import('@tauri-apps/api/core').then(module => {
		invoke = module.invoke;
	});
	import('@tauri-apps/api/event').then(module => {
		listen = module.listen;
		UnlistenFn = module.UnlistenFn;
	});
}

const isTauriMode = browser && (window as any).__TAURI__;

// Mock progress callback storage for browser mode
let mockProgressCallbacks: ((event: ScaffoldProgressEvent) => void)[] = [];
let mockCompleteCallbacks: ((result: ScaffoldResult) => void)[] = [];

// ============================================================================
// TAURI COMMANDS
// ============================================================================

/**
 * Generate a project from an architecture pattern
 */
export async function generateProject(config: ScaffoldConfig): Promise<ScaffoldResult> {
	// Browser mock mode for testing UI
	if (!isTauriMode) {
		return await mockGenerateProject(config);
	}

	// Tauri mode - real implementation
	try {
		const result = await invoke<ScaffoldResult>('generate_pattern_project_command', {
			config: {
				pattern_id: config.patternId,
				pattern_name: config.patternName,
				project_name: config.projectName,
				project_description: config.projectDescription,
				project_path: config.projectPath,
				components: config.components.map((c) => ({
					id: c.id,
					role: c.role,
					name: c.name,
					language: c.language,
					framework: c.framework,
					location: c.location,
					scaffolding: {
						directories: c.scaffolding.directories.map(mapDirectory),
						files: c.scaffolding.files.map(mapFile)
					},
					custom_config: c.customConfig
				})),
				features: {
					testing: config.features.testing,
					linting: config.features.linting,
					git: config.features.git,
					docker: config.features.docker,
					ci: config.features.ci
				}
			}
		});

		return {
			success: result.success,
			projectPath: result.projectPath || result.project_path,
			message: result.message,
			filesCreated: result.filesCreated || result.files_created || 0,
			componentsGenerated: result.componentsGenerated || result.components_generated || []
		};
	} catch (error) {
		console.error('Scaffolding error:', error);
		throw new Error(
			`Failed to generate project: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Install dependencies for a generated project
 */
export async function installDependencies(
	projectPath: string,
	components: ScaffoldConfig['components']
): Promise<void> {
	try {
		await invoke('install_project_dependencies', {
			projectPath,
			components: components.map((c) => ({
				id: c.id,
				role: c.role,
				name: c.name,
				language: c.language,
				framework: c.framework,
				location: c.location
			}))
		});
	} catch (error) {
		console.error('Dependency installation error:', error);
		throw new Error(
			`Failed to install dependencies: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Listen to scaffolding progress events
 */
export async function listenToScaffoldingProgress(
	callback: (event: ScaffoldProgressEvent) => void
): Promise<any> {
	// Browser mock mode
	if (!isTauriMode) {
		mockProgressCallbacks.push(callback);
		return () => {
			mockProgressCallbacks = mockProgressCallbacks.filter(cb => cb !== callback);
		};
	}

	// Tauri mode
	return await listen<ScaffoldProgressEvent>('scaffolding-progress', (event) => {
		callback(event.payload);
	});
}

/**
 * Listen to scaffolding completion
 */
export async function listenToScaffoldingComplete(
	callback: (result: ScaffoldResult) => void
): Promise<any> {
	// Browser mock mode
	if (!isTauriMode) {
		mockCompleteCallbacks.push(callback);
		return () => {
			mockCompleteCallbacks = mockCompleteCallbacks.filter(cb => cb !== callback);
		};
	}

	// Tauri mode
	return await listen<ScaffoldResult>('scaffolding-complete', (event) => {
		callback(event.payload);
	});
}

/**
 * Listen to scaffolding errors
 */
export async function listenToScaffoldingError(
	callback: (error: { message: string; details?: string }) => void
): Promise<UnlistenFn> {
	return await listen<{ message: string; details?: string }>('scaffolding-error', (event) => {
		callback(event.payload);
	});
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map directory definition to Rust format (snake_case)
 */
function mapDirectory(dir: ScaffoldConfig['components'][0]['scaffolding']['directories'][0]): any {
	return {
		path: dir.path,
		description: dir.description,
		subdirectories: dir.subdirectories?.map(mapDirectory),
		files: dir.files?.map(mapFile)
	};
}

/**
 * Map file definition to Rust format (snake_case)
 */
function mapFile(file: ScaffoldConfig['components'][0]['scaffolding']['files'][0]): any {
	return {
		path: file.path,
		content: file.content,
		template_engine: file.templateEngine,
		overwritable: file.overwritable
	};
}

// ============================================================================
// BROWSER MOCK IMPLEMENTATION (for UI testing without Tauri)
// ============================================================================

/**
 * Mock project generation with simulated progress events
 */
async function mockGenerateProject(config: ScaffoldConfig): Promise<ScaffoldResult> {
	console.log('[Mock Mode] Generating project:', config.projectName);

	// Simulate scaffolding stages with delays
	const stages: Array<{ stage: ScaffoldProgressEvent['stage'], progress: number, message: string }> = [
		{ stage: 'preparing', progress: 5, message: `Validating configuration for ${config.projectName}...` },
		{ stage: 'preparing', progress: 10, message: 'Creating project directory structure...' },
		{ stage: 'files', progress: 20, message: 'Generating project files...' },
		{ stage: 'files', progress: 40, message: `Processing ${config.components.length} components...` },
		{ stage: 'files', progress: 50, message: 'Applying Handlebars templates...' },
		{ stage: 'dependencies', progress: 60, message: 'Installing dependencies (mock)...' },
		{ stage: 'dependencies', progress: 80, message: 'Resolving package versions...' },
		{ stage: 'git', progress: 90, message: 'Initializing Git repository...' },
		{ stage: 'git', progress: 95, message: 'Creating initial commit...' },
		{ stage: 'complete', progress: 100, message: 'Project created successfully!' }
	];

	// Emit progress events
	for (const event of stages) {
		const progressEvent: ScaffoldProgressEvent = {
			stage: event.stage,
			progress: event.progress,
			message: event.message,
			details: event.stage === 'files' ? `Processing ${config.patternName} pattern` : undefined
		};

		// Notify all listeners
		mockProgressCallbacks.forEach(cb => cb(progressEvent));

		// Simulate processing time
		await new Promise(resolve => setTimeout(resolve, 500));
	}

	// Generate mock result
	const result: ScaffoldResult = {
		success: true,
		projectPath: `${config.projectPath}/${config.projectName}`,
		message: `Successfully generated ${config.projectName} using ${config.patternName} pattern`,
		filesCreated: 15 + config.components.length * 5,
		componentsGenerated: config.components.map(c => c.name)
	};

	// Emit completion event
	mockCompleteCallbacks.forEach(cb => cb(result));

	return result;
}
