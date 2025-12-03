/**
 * VibeForge Architecture Patterns Type System
 *
 * Types for multi-component project architecture patterns. Enables projects
 * like desktop apps (Rust/Tauri + SvelteKit) or full-stack web (FastAPI + SvelteKit)
 * to be treated as first-class architecture patterns.
 *
 * @module architecture
 */

// ============================================================================
// COMPONENT ROLES
// ============================================================================

/**
 * Role a component plays in the project architecture
 *
 * @example
 * ```typescript
 * const backendRole: ComponentRole = 'backend';
 * const frontendRole: ComponentRole = 'frontend';
 * ```
 */
export type ComponentRole =
	| 'backend' // Server/API/native backend
	| 'frontend' // Web/desktop UI
	| 'mobile' // Mobile app
	| 'cli' // Command-line interface
	| 'library' // Shared library/package
	| 'database' // Database/storage
	| 'infrastructure' // Docker, K8s, etc.
	| 'ml-backend' // ML/AI service
	| 'api-gateway'; // API gateway/router

// ============================================================================
// INTEGRATION PROTOCOLS
// ============================================================================

/**
 * Protocol used for component communication
 *
 * @example
 * ```typescript
 * const desktopProtocol: IntegrationProtocol = 'tauri-commands';
 * const webProtocol: IntegrationProtocol = 'rest-api';
 * ```
 */
export type IntegrationProtocol =
	| 'tauri-commands' // Desktop: Tauri IPC
	| 'rest-api' // Full-stack: HTTP REST
	| 'graphql' // Full-stack: GraphQL
	| 'grpc' // Microservices: gRPC
	| 'websocket' // Real-time: WebSocket
	| 'ipc' // Process: Inter-process
	| 'shared-memory' // Native: Shared memory
	| 'browser-api' // Browser: Web APIs
	| 'workspace'; // Monorepo: Workspace protocol

// ============================================================================
// COMPONENT DEPENDENCY
// ============================================================================

/**
 * Dependency relationship between components
 *
 * @example
 * ```typescript
 * const dependency: ComponentDependency = {
 *   componentId: 'backend',
 *   type: 'required',
 *   relationship: 'calls'
 * };
 * ```
 */
export interface ComponentDependency {
	/** ID of the component this depends on */
	componentId: string;

	/** Whether the dependency is required or optional, or the protocol type (workspace, http) */
	type: 'required' | 'optional' | 'workspace' | 'http';

	/** Type of relationship */
	relationship?: 'calls' | 'imports' | 'embeds' | 'extends';
}

// ============================================================================
// FILE TEMPLATES
// ============================================================================

/**
 * Template engine for file generation
 */
export type TemplateEngine = 'handlebars' | 'jinja2' | 'none';

/**
 * File template with content and metadata
 *
 * @example
 * ```typescript
 * const template: FileTemplate = {
 *   path: 'src/main.rs',
 *   content: tauriMainTemplate,
 *   templateEngine: 'handlebars',
 *   overwritable: false
 * };
 * ```
 */
export interface FileTemplate {
	/** Relative path where file should be created */
	path: string;

	/** File content (may contain template variables) */
	content: string;

	/** Template engine to use for variable substitution */
	templateEngine?: TemplateEngine;

	/** Whether this file can be overwritten if it exists */
	overwritable: boolean;
}

/**
 * Directory structure definition
 *
 * @example
 * ```typescript
 * const structure: DirectoryStructure = {
 *   path: 'src',
 *   description: 'Source code directory',
 *   subdirectories: [
 *     { path: 'commands', description: 'Command handlers' }
 *   ]
 * };
 * ```
 */
export interface DirectoryStructure {
	/** Relative path for the directory */
	path: string;

	/** Optional description of directory purpose */
	description?: string;

	/** Files to create in this directory */
	files?: FileTemplate[];

	/** Subdirectories to create */
	subdirectories?: DirectoryStructure[];
}

/**
 * Complete scaffolding configuration for a component
 *
 * @example
 * ```typescript
 * const scaffolding: ComponentScaffolding = {
 *   directories: [{ path: 'src', description: 'Source code' }],
 *   files: [{ path: 'main.rs', content: '...', templateEngine: 'handlebars', overwritable: false }],
 *   packageFiles: { 'Cargo.toml': { ... } },
 *   configFiles: { '.gitignore': '...' }
 * };
 * ```
 */
export interface ComponentScaffolding {
	/** Directory structure to create */
	directories: DirectoryStructure[];

	/** Files to generate */
	files: FileTemplate[];

	/** Package manager files (package.json, Cargo.toml, etc.) */
	packageFiles: Record<string, any>;

	/** Configuration files */
	configFiles: Record<string, any>;
}

// ============================================================================
// PROJECT COMPONENT
// ============================================================================

/**
 * Single component in a multi-component project
 *
 * @example
 * ```typescript
 * const backendComponent: ProjectComponent = {
 *   id: 'backend',
 *   role: 'backend',
 *   name: 'Backend',
 *   description: 'Rust/Tauri backend',
 *   language: 'rust',
 *   framework: 'tauri',
 *   location: 'src-tauri',
 *   dependencies: [],
 *   scaffolding: { ... },
 *   commands: {
 *     install: ['cargo fetch'],
 *     dev: ['cargo tauri dev']
 *   }
 * };
 * ```
 */
export interface ProjectComponent {
	/** Unique identifier for this component */
	id: string;

	/** Role this component plays */
	role: ComponentRole;

	/** Display name */
	name: string;

	/** Description of component purpose */
	description?: string;

	// Technology
	/** Primary programming language */
	language: string;

	/** Framework or library */
	framework: string;

	// File system
	/** Path in project (e.g., "src-tauri/") */
	location: string;

	// Dependencies
	/** Other components this component depends on */
	dependencies: ComponentDependency[];

	// Scaffolding
	/** Files and directories to generate */
	scaffolding: ComponentScaffolding;

	// Build/dev commands
	/** Commands for development and build */
	commands?: {
		/** Install dependencies */
		install?: string[];

		/** Run in development mode */
		dev?: string[];

		/** Build for production */
		build?: string[];

		/** Run tests */
		test?: string[];
	};
}

// ============================================================================
// COMPONENT INTEGRATION
// ============================================================================

/**
 * Binding generation configuration
 */
export interface BindingGeneration {
	/** Source component ID */
	from: string;

	/** Target component ID */
	to: string;

	/** Format for generated bindings */
	format: 'typescript' | 'rust-types' | 'python-stubs';
}

/**
 * Configuration for how components integrate
 *
 * @example
 * ```typescript
 * const integration: ComponentIntegration = {
 *   protocol: 'tauri-commands',
 *   sharedTypes: true,
 *   sharedConfig: false,
 *   generateBindings: [{
 *     from: 'backend',
 *     to: 'frontend',
 *     format: 'typescript'
 *   }]
 * };
 * ```
 */
export interface ComponentIntegration {
	/** Communication protocol between components */
	protocol: IntegrationProtocol;

	/** Generate shared type definitions? */
	sharedTypes: boolean;

	/** Share configuration files? */
	sharedConfig: boolean;

	/** Code generation for bindings (can be binding objects or format strings) */
	generateBindings?: (BindingGeneration | string)[];
}

// ============================================================================
// ARCHITECTURE PATTERN
// ============================================================================

/**
 * Architecture pattern category
 */
export type ArchitectureCategory =
	| 'desktop'
	| 'web'
	| 'mobile'
	| 'backend'
	| 'cli'
	| 'ai-ml'
	| 'microservices';

/**
 * Complexity level (alias for wizard compatibility)
 */
export type ComplexityLevel = 'simple' | 'intermediate' | 'complex' | 'enterprise';

/**
 * Pattern maturity level
 */
export type PatternMaturity = 'experimental' | 'stable' | 'mature';

/**
 * Prerequisites for using a pattern
 */
export interface PatternPrerequisites {
	/** Required CLI tools */
	tools: string[];

	/** Required knowledge/skills */
	skills?: string[];

	/** Estimated time to set up */
	timeEstimate?: string;

	/** Required knowledge/expertise areas (optional) */
	knowledge?: string[];
}

/**
 * Pattern documentation sections
 */
export interface PatternDocumentation {
	/** Quick start guide */
	quickStart: string;

	/** Architecture explanation */
	architecture: string;

	/** Deployment instructions */
	deployment: string;

	/** Common issues and solutions */
	troubleshooting: string;
}

/**
 * Complete architecture pattern definition
 *
 * Defines a multi-component project structure with all components,
 * integration protocols, and scaffolding templates.
 *
 * @example
 * ```typescript
 * const pattern: ArchitecturePattern = {
 *   id: 'desktop-app',
 *   name: 'desktop-app',
 *   displayName: 'Desktop Application',
 *   description: 'Cross-platform desktop app',
 *   category: 'desktop',
 *   icon: '🖥️',
 *   components: [backendComponent, frontendComponent],
 *   integration: { ... },
 *   complexity: 'intermediate',
 *   maturity: 'stable',
 *   popularity: 85,
 *   idealFor: ['Desktop apps', 'Native tools'],
 *   notIdealFor: ['Web-only apps'],
 *   examples: ['VS Code', 'Obsidian'],
 *   prerequisites: { ... },
 *   documentation: { ... }
 * };
 * ```
 */
export interface ArchitecturePattern {
	/** Unique pattern identifier */
	id: string;

	/** URL-friendly name */
	name: string;

	/** Human-readable display name */
	displayName: string;

	/** Description of the pattern */
	description: string;

	/** Category this pattern belongs to */
	category: ArchitectureCategory;

	// Visual identity
	/** Emoji or icon */
	icon: string;

	/** ASCII or SVG diagram (optional) */
	diagram?: string;

	// Components
	/** Components that make up this pattern */
	components: ProjectComponent[];

	/** How components integrate */
	integration: ComponentIntegration;

	// Characteristics
	/** Complexity level */
	complexity: ComplexityLevel;

	/** Pattern maturity */
	maturity: PatternMaturity;

	/** Popularity score (0-100) */
	popularity: number;

	// Use case matching
	/** Ideal use cases */
	idealFor: string[];

	/** Not ideal for these use cases */
	notIdealFor: string[];

	/** Example projects using this pattern */
	examples?: string[];

	/** Tags for categorization and search */
	tags?: string[];

	// Requirements
	/** Prerequisites for using this pattern */
	prerequisites: PatternPrerequisites;

	// Documentation
	/** Complete documentation */
	documentation?: PatternDocumentation;

	// Root-level files (optional)
	/** Files to generate in the project root */
	rootFiles?: FileTemplate[];
}
