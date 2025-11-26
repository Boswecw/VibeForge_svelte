/**
 * Pattern Detector
 *
 * Detects common patterns in codebases (stores, API clients, components, etc.)
 */

import type { FileInfo, TechStack, DetectedPattern } from '../types/analysis';

/**
 * Pattern Detector
 *
 * Analyzes files to detect architecture patterns
 */
export class PatternDetector {
	/**
	 * Detects patterns in the codebase
	 */
	async detect(files: FileInfo[], techStack: TechStack): Promise<DetectedPattern[]> {
		const patterns: DetectedPattern[] = [];

		// Detect store patterns
		const storePattern = this.detectStorePattern(files, techStack);
		if (storePattern) patterns.push(storePattern);

		// Detect API patterns
		const apiPattern = this.detectApiPattern(files);
		if (apiPattern) patterns.push(apiPattern);

		// Detect component patterns
		const componentPattern = this.detectComponentPattern(files, techStack);
		if (componentPattern) patterns.push(componentPattern);

		return patterns;
	}

	/**
	 * Detects store/state management patterns
	 */
	private detectStorePattern(files: FileInfo[], techStack: TechStack): DetectedPattern | null {
		const storeFiles = files.filter(
			(f) =>
				f.relativePath.includes('/stores/') ||
				f.relativePath.includes('/store/') ||
				f.relativePath.endsWith('.svelte.ts') ||
				f.relativePath.includes('store.ts')
		);

		if (storeFiles.length === 0) return null;

		return {
			type: 'store-pattern',
			name: techStack.stateManagement || 'Store Pattern',
			description: `Detected ${storeFiles.length} store files using ${techStack.stateManagement}`,
			files: storeFiles.map((f) => f.relativePath),
			confidence: storeFiles.length > 3 ? 0.9 : 0.6,
			isConsistent: true
		};
	}

	/**
	 * Detects API client patterns
	 */
	private detectApiPattern(files: FileInfo[]): DetectedPattern | null {
		const apiFiles = files.filter(
			(f) =>
				f.relativePath.includes('/api/') ||
				f.relativePath.includes('Client.ts') ||
				f.relativePath.includes('client.ts') ||
				f.relativePath.includes('service.ts')
		);

		if (apiFiles.length === 0) return null;

		return {
			type: 'api-pattern',
			name: 'API Client Pattern',
			description: `Detected ${apiFiles.length} API client files`,
			files: apiFiles.map((f) => f.relativePath),
			confidence: apiFiles.length > 2 ? 0.8 : 0.5,
			isConsistent: true
		};
	}

	/**
	 * Detects component patterns
	 */
	private detectComponentPattern(
		files: FileInfo[],
		techStack: TechStack
	): DetectedPattern | null {
		let componentFiles: FileInfo[] = [];

		if (techStack.framework === 'sveltekit' || techStack.framework === 'svelte') {
			componentFiles = files.filter((f) => f.type === 'svelte');
		} else if (techStack.framework === 'react' || techStack.framework === 'nextjs') {
			componentFiles = files.filter(
				(f) =>
					(f.extension === '.tsx' || f.extension === '.jsx') &&
					(f.relativePath.includes('/components/') || f.relativePath.includes('/Component'))
			);
		}

		if (componentFiles.length === 0) return null;

		return {
			type: 'component-pattern',
			name: `${techStack.framework} Components`,
			description: `Detected ${componentFiles.length} component files`,
			files: componentFiles.map((f) => f.relativePath),
			confidence: 0.9,
			isConsistent: true
		};
	}
}
