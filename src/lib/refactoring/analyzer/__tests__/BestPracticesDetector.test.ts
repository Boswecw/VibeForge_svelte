/**
 * BestPracticesDetector Unit Tests
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BestPracticesDetector } from '../BestPracticesDetector';

describe('BestPracticesDetector', () => {
	let detector: BestPracticesDetector;

	beforeEach(() => {
		detector = new BestPracticesDetector();
	});

	// ============================================================================
	// INITIALIZATION
	// ============================================================================

	describe('Initialization', () => {
		it('should create detector instance', () => {
			expect(detector).toBeDefined();
			expect(detector).toBeInstanceOf(BestPracticesDetector);
		});
	});

	// ============================================================================
	// MISSING ERROR HANDLING DETECTION
	// ============================================================================

	describe('detectMissingErrorHandling', () => {
		it('should detect Promise without .catch()', () => {
			const content = `
fetch('/api/data').then(response => response.json()).then(data => console.log(data));
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const errorIssue = issues.find(i => i.title.includes('Promise without error'));

			expect(errorIssue).toBeDefined();
			expect(errorIssue?.severity).toBe('warning');
			expect(errorIssue?.category).toBe('code-quality');
		});

		it('should detect fetch without error handling', () => {
			const content = `
fetch('/api/data');
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const fetchIssue = issues.find(i => i.title.includes('fetch'));

			expect(fetchIssue).toBeDefined();
			expect(fetchIssue?.severity).toBe('warning');
		});

		it('should not flag fetch with .catch()', () => {
			const content = `
fetch('/api/data')
	.then(r => r.json())
	.catch(err => console.error(err));
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const fetchIssue = issues.find(i => i.title.includes('fetch'));

			expect(fetchIssue).toBeUndefined();
		});

		it('should not flag fetch with try-catch', () => {
			const content = `
try {
	const response = await fetch('/api/data');
	const data = await response.json();
} catch (error) {
	console.error(error);
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const fetchIssue = issues.find(i => i.title.includes('fetch'));

			expect(fetchIssue).toBeUndefined();
		});

		it('should detect async function without try-catch', () => {
			const content = `
async function loadData() {
	const response = await fetch('/api/data');
	return response.json();
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const asyncIssue = issues.find(i => i.title.includes('Async function'));

			expect(asyncIssue).toBeDefined();
			expect(asyncIssue?.severity).toBe('warning');
		});

		it('should not flag async function with try-catch', () => {
			const content = `
async function loadData() {
	try {
		const response = await fetch('/api/data');
		return response.json();
	} catch (error) {
		console.error(error);
	}
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const asyncIssue = issues.find(i => i.title.includes('Async function'));

			expect(asyncIssue).toBeUndefined();
		});

		it('should suggest adding error handling', () => {
			const content = `
fetch('/api/data').then(r => r.json());
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const errorIssue = issues.find(i => i.title.includes('Promise'));

			expect(errorIssue?.suggestion).toContain('.catch()');
			expect(errorIssue?.suggestion).toContain('try-catch');
		});
	});

	// ============================================================================
	// MAGIC NUMBERS DETECTION
	// ============================================================================

	describe('detectMagicNumbers', () => {
		it('should detect magic numbers', () => {
			const content = `
if (users.length > 100) {
	processInBatches(users, 50);
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const magicIssues = issues.filter(i => i.title.includes('Magic number'));

			expect(magicIssues.length).toBeGreaterThan(0);
			expect(magicIssues[0]?.severity).toBe('info');
			expect(magicIssues[0]?.category).toBe('code-quality');
		});

		it('should not flag 0 and 1', () => {
			const content = `
const result = value * 1 + 0;
if (count > 0) return 1;
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const magicIssues = issues.filter(i => i.title.includes('Magic number'));

			expect(magicIssues.length).toBe(0);
		});

		it('should not flag constant declarations', () => {
			const content = `
const MAX_RETRIES = 3;
const TIMEOUT = 5000;
const BATCH_SIZE = 100;
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const magicIssues = issues.filter(i => i.title.includes('Magic number'));

			expect(magicIssues.length).toBe(0);
		});

		it('should not flag Math operations', () => {
			const content = `
const pi = Math.PI * 2;
const random = Math.floor(Math.random() * 100);
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const magicIssues = issues.filter(i => i.title.includes('Magic number'));

			expect(magicIssues.length).toBe(0);
		});

		it('should not flag commented lines', () => {
			const content = `
// Set timeout to 5000ms
const value = calculateValue();
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const magicIssues = issues.filter(i => i.title.includes('Magic number'));

			expect(magicIssues.length).toBe(0);
		});

		it('should suggest named constants', () => {
			const content = `
setTimeout(callback, 3000);
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const magicIssue = issues.find(i => i.title.includes('Magic number'));

			expect(magicIssue?.suggestion).toContain('named constant');
		});
	});

	// ============================================================================
	// DEAD CODE DETECTION
	// ============================================================================

	describe('detectDeadCode', () => {
		it('should detect unreachable code after return', () => {
			const content = `
function test() {
	return true;
	console.log('unreachable');
	const x = 10;
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const deadIssue = issues.find(i => i.title.includes('Unreachable'));

			expect(deadIssue).toBeDefined();
			expect(deadIssue?.severity).toBe('warning');
			expect(deadIssue?.category).toBe('code-quality');
		});

		it('should not flag closing braces after return', () => {
			const content = `
function test() {
	if (condition) {
		return true;
	}
	return false;
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const deadIssue = issues.find(i => i.title.includes('Unreachable'));

			expect(deadIssue).toBeUndefined();
		});

		it('should detect large commented code blocks', () => {
			const content = `
// const oldFunction = () => {
//   return something;
// };
// const anotherOld = 123;
// let unused = true;
// more commented code
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const commentIssue = issues.find(i => i.title.includes('commented block'));

			expect(commentIssue).toBeDefined();
			expect(commentIssue?.severity).toBe('info');
		});

		it('should not flag TODO/FIXME comments as dead code', () => {
			const content = `
// TODO: Implement feature
// TODO: Add validation
// TODO: Fix bug
// TODO: Refactor
// TODO: Test
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const commentIssue = issues.find(i => i.title.includes('commented block'));

			expect(commentIssue).toBeUndefined();
		});

		it('should not flag small comment blocks', () => {
			const content = `
// This is a comment
// explaining the next line
const x = 10;
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const commentIssue = issues.find(i => i.title.includes('commented block'));

			expect(commentIssue).toBeUndefined();
		});

		it('should mark unreachable code as auto-fixable', () => {
			const content = `
function test() {
	return true;
	console.log('dead');
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const deadIssue = issues.find(i => i.title.includes('Unreachable'));

			expect(deadIssue?.autoFixable).toBe(true);
		});
	});

	// ============================================================================
	// INCONSISTENT NAMING DETECTION
	// ============================================================================

	describe('detectInconsistentNaming', () => {
		it('should detect mixed naming conventions', () => {
			const content = `
const camelCase = 1;
const another_snake = 2;
const yetAnother = 3;
const more_snake_case = 4;
const andCamel = 5;
const PascalCase = 6;
const AnotherPascal = 7;
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const namingIssue = issues.find(i => i.title.includes('Inconsistent naming'));

			expect(namingIssue).toBeDefined();
			expect(namingIssue?.severity).toBe('info');
			expect(namingIssue?.category).toBe('code-quality');
		});

		it('should not flag consistent camelCase', () => {
			const content = `
const firstName = 'John';
const lastName = 'Doe';
const fullName = 'John Doe';
const userAge = 25;
const isActive = true;
const hasPermission = false;
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const namingIssue = issues.find(i => i.title.includes('Inconsistent naming'));

			expect(namingIssue).toBeUndefined();
		});

		it('should not flag files with few variables', () => {
			const content = `
const x = 1;
const y = 2;
const z = 3;
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const namingIssue = issues.find(i => i.title.includes('Inconsistent naming'));

			expect(namingIssue).toBeUndefined();
		});

		it('should show naming convention distribution', () => {
			const content = `
const camelCase1 = 1;
const camelCase2 = 2;
const snake_case1 = 3;
const snake_case2 = 4;
const PascalCase1 = 5;
const PascalCase2 = 6;
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const namingIssue = issues.find(i => i.title.includes('Inconsistent naming'));

			expect(namingIssue?.description).toContain('camelCase');
			expect(namingIssue?.description).toContain('snake_case');
			expect(namingIssue?.description).toContain('PascalCase');
		});

		it('should recommend camelCase for JS/TS', () => {
			const content = `
const mixed_one = 1;
const mixedTwo = 2;
const mixed_three = 3;
const mixedFour = 4;
const mixed_five = 5;
const mixedSix = 6;
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const namingIssue = issues.find(i => i.title.includes('Inconsistent naming'));

			expect(namingIssue?.suggestion).toContain('camelCase');
		});
	});

	// ============================================================================
	// TODO/FIXME DETECTION
	// ============================================================================

	describe('detectTODOComments', () => {
		it('should detect TODO comments', () => {
			const content = `
// TODO: Implement this feature
const x = 10;
// TODO: Add validation
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const todoIssue = issues.find(i => i.title.includes('TODO'));

			expect(todoIssue).toBeDefined();
			expect(todoIssue?.severity).toBe('info');
			expect(todoIssue?.category).toBe('code-quality');
		});

		it('should detect FIXME comments', () => {
			const content = `
// FIXME: This is broken
const buggyCode = true;
// FIXME: Memory leak here
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const fixmeIssue = issues.find(i => i.title.includes('FIXME'));

			expect(fixmeIssue).toBeDefined();
			expect(fixmeIssue?.severity).toBe('warning');
		});

		it('should detect block comment TODOs', () => {
			const content = `
/* TODO: Refactor this section */
const code = 'something';
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const todoIssue = issues.find(i => i.title.includes('TODO'));

			expect(todoIssue).toBeDefined();
		});

		it('should detect case-insensitive TODO', () => {
			const content = `
// todo: lowercase todo
// Todo: Mixed case todo
// TODO: Uppercase todo
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const todoIssue = issues.find(i => i.title.includes('TODO'));

			expect(todoIssue).toBeDefined();
			expect(todoIssue?.lineNumbers?.length).toBeGreaterThanOrEqual(3);
		});

		it('should count multiple TODOs', () => {
			const todos = Array(5).fill('// TODO: something').join('\n');
			const content = `
${todos}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const todoIssue = issues.find(i => i.title.includes('TODO'));

			expect(todoIssue?.title).toContain('5 TODO');
		});

		it('should suggest addressing TODOs', () => {
			const content = `
// TODO: Implement feature
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const todoIssue = issues.find(i => i.title.includes('TODO'));

			expect(todoIssue?.suggestion).toContain('Address TODOs');
		});

		it('should suggest addressing FIXMEs before production', () => {
			const content = `
// FIXME: Critical bug
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const fixmeIssue = issues.find(i => i.title.includes('FIXME'));

			expect(fixmeIssue?.suggestion).toContain('before production');
		});
	});

	// ============================================================================
	// EMPTY BLOCKS DETECTION
	// ============================================================================

	describe('detectEmptyBlocks', () => {
		it('should detect empty function bodies', () => {
			const content = `
function empty() {}
const alsoEmpty = () => {}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const emptyIssues = issues.filter(i => i.title.includes('Empty function'));

			expect(emptyIssues.length).toBeGreaterThan(0);
			expect(emptyIssues[0]?.severity).toBe('warning');
			expect(emptyIssues[0]?.category).toBe('code-quality');
		});

		it('should detect empty catch blocks', () => {
			const content = `
try {
	riskyOperation();
} catch (e) {}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const catchIssue = issues.find(i => i.title.includes('Empty catch'));

			expect(catchIssue).toBeDefined();
			expect(catchIssue?.severity).toBe('error');
		});

		it('should detect simplified empty catch', () => {
			const content = `
try {
	something();
} catch {}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const catchIssue = issues.find(i => i.title.includes('Empty catch'));

			expect(catchIssue).toBeDefined();
		});

		it('should suggest implementing or removing empty functions', () => {
			const content = `
function placeholder() {}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const emptyIssue = issues.find(i => i.title.includes('Empty function'));

			expect(emptyIssue?.suggestion).toContain('Implement');
			expect(emptyIssue?.suggestion).toContain('remove');
		});

		it('should suggest logging in empty catch', () => {
			const content = `
try { code(); } catch (e) {}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const catchIssue = issues.find(i => i.title.includes('Empty catch'));

			expect(catchIssue?.suggestion).toContain('log');
		});
	});

	// ============================================================================
	// INTEGRATION TESTS
	// ============================================================================

	describe('Integration', () => {
		it('should detect multiple best practice issues in same file', () => {
			const content = `
// TODO: Refactor this
// FIXME: Memory leak

const snake_case_var = 1;
const camelCaseVar = 2;
const another_snake = 3;
const anotherCamel = 4;
const yetAnother_snake = 5;
const yetAnotherCamel = 6;

fetch('/api').then(r => r.json());

async function getData() {
	return await fetch('/api/data');
}

function empty() {}

if (users.length > 100) {
	processBatch(50);
}

try {
	riskyOp();
} catch (e) {}

function unreachable() {
	return true;
	console.log('never runs');
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');

			expect(issues.length).toBeGreaterThan(5);
			expect(issues.some(i => i.title.includes('TODO'))).toBe(true);
			expect(issues.some(i => i.title.includes('FIXME'))).toBe(true);
			expect(issues.some(i => i.title.includes('Promise'))).toBe(true);
			expect(issues.some(i => i.title.includes('Empty'))).toBe(true);
		});

		it('should handle clean code without issues', () => {
			const content = `
const MAX_USERS = 100;
const BATCH_SIZE = 50;

async function loadUsers() {
	try {
		const response = await fetch('/api/users');
		const data = await response.json();

		if (data.users.length > MAX_USERS) {
			return processBatch(data.users, BATCH_SIZE);
		}

		return data.users;
	} catch (error) {
		console.error('Failed to load users:', error);
		throw error;
	}
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');

			// Should have minimal or no best practice violations
			expect(issues.length).toBe(0);
		});

		it('should work across different file types', () => {
			const tsContent = `
// TODO: implement
function empty() {}
			`;
			const jsContent = `
// FIXME: broken
fetch('/api').then(r => r.json());
			`;

			const tsIssues = detector.detectIssues(tsContent, 'test.ts', 'typescript');
			const jsIssues = detector.detectIssues(jsContent, 'test.js', 'javascript');

			expect(tsIssues.length).toBeGreaterThan(0);
			expect(jsIssues.length).toBeGreaterThan(0);
		});
	});
});
