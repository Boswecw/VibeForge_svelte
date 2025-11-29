/**
 * Architecture Types Test Suite
 *
 * Tests for type definitions, discriminated unions, and type narrowing.
 */

import { describe, it, expect } from 'vitest';
import type {
	ComponentRole,
	IntegrationProtocol,
	ComponentDependency,
	ArchitectureCategory,
	ComplexityLevel,
	PatternMaturity
} from '../architecture';

describe('Architecture Types', () => {
	describe('ComponentRole', () => {
		it('should allow all valid component roles', () => {
			const roles: ComponentRole[] = [
				'backend',
				'frontend',
				'mobile',
				'cli',
				'library',
				'database',
				'infrastructure',
				'ml-backend',
				'api-gateway'
			];

			roles.forEach((role) => {
				expect(role).toBeTypeOf('string');
			});
		});

		it('should narrow to specific role type', () => {
			const role: ComponentRole = 'backend';
			expect(role).toBe('backend');
		});
	});

	describe('IntegrationProtocol', () => {
		it('should allow all valid protocols', () => {
			const protocols: IntegrationProtocol[] = [
				'tauri-commands',
				'rest-api',
				'graphql',
				'grpc',
				'websocket',
				'ipc',
				'shared-memory'
			];

			protocols.forEach((protocol) => {
				expect(protocol).toBeTypeOf('string');
			});
		});

		it('should narrow to specific protocol type', () => {
			const protocol: IntegrationProtocol = 'tauri-commands';
			expect(protocol).toBe('tauri-commands');
		});
	});

	describe('ComponentDependency', () => {
		it('should validate dependency structure', () => {
			const dependency: ComponentDependency = {
				componentId: 'backend',
				type: 'required',
				relationship: 'calls'
			};

			expect(dependency.componentId).toBe('backend');
			expect(dependency.type).toBe('required');
			expect(dependency.relationship).toBe('calls');
		});

		it('should allow optional dependencies', () => {
			const dependency: ComponentDependency = {
				componentId: 'cache',
				type: 'optional',
				relationship: 'imports'
			};

			expect(dependency.type).toBe('optional');
		});

		it('should allow all relationship types', () => {
			const relationships: Array<ComponentDependency['relationship']> = [
				'calls',
				'imports',
				'embeds',
				'extends'
			];

			relationships.forEach((rel) => {
				const dep: ComponentDependency = {
					componentId: 'test',
					type: 'required',
					relationship: rel
				};
				expect(dep.relationship).toBe(rel);
			});
		});
	});

	describe('ArchitectureCategory', () => {
		it('should allow all valid categories', () => {
			const categories: ArchitectureCategory[] = [
				'desktop',
				'web',
				'mobile',
				'backend',
				'cli',
				'ai-ml',
				'microservices'
			];

			categories.forEach((category) => {
				expect(category).toBeTypeOf('string');
			});
		});
	});

	describe('ComplexityLevel', () => {
		it('should allow all complexity levels', () => {
			const levels: ComplexityLevel[] = ['simple', 'intermediate', 'complex', 'enterprise'];

			levels.forEach((level) => {
				expect(level).toBeTypeOf('string');
			});
		});
	});

	describe('PatternMaturity', () => {
		it('should allow all maturity levels', () => {
			const maturities: PatternMaturity[] = ['experimental', 'stable', 'mature'];

			maturities.forEach((maturity) => {
				expect(maturity).toBeTypeOf('string');
			});
		});
	});
});
