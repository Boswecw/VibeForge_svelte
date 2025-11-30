/**
 * Scaffolder Service
 *
 * Service for project scaffolding via Tauri backend.
 * Wraps Tauri commands and provides type-safe scaffolding API.
 */

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type {
	ScaffoldConfig,
	ScaffoldResult,
	ScaffoldProgressEvent
} from '../types/scaffolding';

// ============================================================================
// TAURI COMMANDS
// ============================================================================

/**
 * Generate a project from an architecture pattern
 */
export async function generateProject(config: ScaffoldConfig): Promise<ScaffoldResult> {
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
): Promise<UnlistenFn> {
	return await listen<ScaffoldProgressEvent>('scaffolding-progress', (event) => {
		callback(event.payload);
	});
}

/**
 * Listen to scaffolding completion
 */
export async function listenToScaffoldingComplete(
	callback: (result: ScaffoldResult) => void
): Promise<UnlistenFn> {
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
