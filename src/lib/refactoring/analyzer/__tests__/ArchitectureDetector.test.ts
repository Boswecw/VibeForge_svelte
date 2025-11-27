/**
 * ArchitectureDetector Unit Tests
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ArchitectureDetector } from '../ArchitectureDetector';

describe('ArchitectureDetector', () => {
	let detector: ArchitectureDetector;

	beforeEach(() => {
		detector = new ArchitectureDetector();
	});

	// ============================================================================
	// INITIALIZATION
	// ============================================================================

	describe('Initialization', () => {
		it('should create detector instance', () => {
			expect(detector).toBeDefined();
			expect(detector).toBeInstanceOf(ArchitectureDetector);
		});
	});

	// ============================================================================
	// CYCLOMATIC COMPLEXITY DETECTION
	// ============================================================================

	describe('detectComplexity', () => {
		it('should detect high complexity function', () => {
			const content = `
function complexFunction(x) {
	if (x > 10 && y < 5) {
		if (a || b) {
			for (let i = 0; i < x; i++) {
				if (i % 2 === 0 || i % 3 === 0) {
					while (i < 5 && i > 0) {
						if (i === 3) {
							return true;
						}
						i++;
					}
				}
			}
		}
	}
	return null;
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const complexityIssue = issues.find(i => i.title.includes('complexity'));

			expect(complexityIssue).toBeDefined();
			expect(complexityIssue?.severity).toMatch(/warning|info/);
			expect(complexityIssue?.category).toBe('architecture');
		});

		it('should detect very high complexity (>15) as warning', () => {
			const content = `
function veryComplex(x) {
	if (x && y || z) {
		if (a || b) {
			if (c && d) {
				if (e || f) {
					if (g && h) {
						if (i || j) {
							if (k && l) {
								for (let i = 0; i < 10; i++) {
									while (condition1 && condition2) {
										if (check1 || check2) {
											if (check3 && check4) {
												return true;
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
	return false;
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const complexityIssue = issues.find(i => i.title.includes('complexity'));

			expect(complexityIssue).toBeDefined();
			expect(complexityIssue?.severity).toBe('warning');
		});

		it('should not flag simple functions', () => {
			const content = `
function simple(x) {
	if (x > 0) {
		return x * 2;
	}
	return 0;
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const complexityIssue = issues.find(i => i.title.includes('complexity'));

			expect(complexityIssue).toBeUndefined();
		});

		it('should count ternary operators', () => {
			const content = `
function ternaryHeavy(a, b, c, d, e, f, g, h, i, j, k) {
	const v1 = a ? b : c;
	const v2 = d ? e : f;
	const v3 = g ? h : i;
	const v4 = j ? k : a;
	if (v1 || v2) {
		if (v3 && v4) {
			if (a || b) {
				if (c && d) {
					return v1 ? v2 : v3 ? v4 : 0;
				}
			}
		}
	}
	return 0;
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const complexityIssue = issues.find(i => i.title.includes('complexity'));

			expect(complexityIssue).toBeDefined();
		});

		it('should count logical operators', () => {
			const content = `
function logicalComplex(a, b, c, d, e, f, g, h, i, j, k) {
	if (a && b && c || d && e && f || g && h && i || j && k) {
		return true;
	}
	return false;
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const complexityIssue = issues.find(i => i.title.includes('complexity'));

			expect(complexityIssue).toBeDefined();
		});

		it('should only check JavaScript/TypeScript', () => {
			const content = `
def complex_function(x):
	if x > 10:
		for i in range(x):
			if i % 2 == 0:
				while i < 5:
					if i == 3:
						return True
					i += 1
	elif x < 5:
		return False
	return None
			`;

			const issues = detector.detectIssues(content, 'test.py', 'python');
			const complexityIssue = issues.find(i => i.title.includes('complexity'));

			// Should not detect complexity in Python (not implemented for Python in this detector)
			expect(complexityIssue).toBeUndefined();
		});
	});

	// ============================================================================
	// DEEP NESTING DETECTION
	// ============================================================================

	describe('detectDeepNesting', () => {
		it('should detect deeply nested code', () => {
			const content = `
function deepNesting() {
	if (condition1) {
		if (condition2) {
			if (condition3) {
				if (condition4) {
					if (condition5) {
						console.log('too deep');
					}
				}
			}
		}
	}
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const nestingIssue = issues.find(i => i.title.includes('nesting'));

			expect(nestingIssue).toBeDefined();
			expect(nestingIssue?.severity).toBe('warning');
			expect(nestingIssue?.category).toBe('architecture');
		});

		it('should not flag reasonable nesting', () => {
			const content = `
function reasonableNesting() {
	if (condition1) {
		if (condition2) {
			if (condition3) {
				console.log('ok');
			}
		}
	}
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const nestingIssue = issues.find(i => i.title.includes('nesting'));

			expect(nestingIssue).toBeUndefined();
		});

		it('should track nesting across different block types', () => {
			const content = `
function mixed() {
	if (a) {
		for (let i = 0; i < 10; i++) {
			while (condition) {
				try {
					if (x) {
						console.log('nested');
					}
				} catch (e) {}
			}
		}
	}
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const nestingIssue = issues.find(i => i.title.includes('nesting'));

			expect(nestingIssue).toBeDefined();
		});
	});

	// ============================================================================
	// GOD FUNCTIONS DETECTION
	// ============================================================================

	describe('detectGodFunctions', () => {
		it('should detect very long functions', () => {
			const lines = Array(60).fill('  console.log("line");').join('\n');
			const content = `
function godFunction() {
${lines}
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const godIssue = issues.find(i => i.title.includes('too long'));

			expect(godIssue).toBeDefined();
			expect(godIssue?.severity).toBe('warning');
			expect(godIssue?.category).toBe('architecture');
		});

		it('should not flag reasonably sized functions', () => {
			const lines = Array(30).fill('  console.log("line");').join('\n');
			const content = `
function normalFunction() {
${lines}
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const godIssue = issues.find(i => i.title.includes('too long'));

			expect(godIssue).toBeUndefined();
		});

		it('should detect long Python functions', () => {
			const lines = Array(60).fill('    print("line")').join('\n');
			const content = `
def god_function():
${lines}
			`;

			const issues = detector.detectIssues(content, 'test.py', 'python');
			const godIssue = issues.find(i => i.title.includes('too long'));

			expect(godIssue).toBeDefined();
		});

		it('should handle arrow functions', () => {
			const lines = Array(60).fill('  console.log("line");').join('\n');
			const content = `
const godFunction = () => {
${lines}
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const godIssue = issues.find(i => i.title.includes('too long'));

			expect(godIssue).toBeDefined();
		});
	});

	// ============================================================================
	// LONG PARAMETER LISTS DETECTION
	// ============================================================================

	describe('detectLongParameterLists', () => {
		it('should detect functions with many parameters', () => {
			const content = `
const manyParams = (a, b, c, d, e, f, g, h) => {
	return a + b + c + d + e + f + g + h;
};
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const paramIssue = issues.find(i => i.title.includes('parameter'));

			expect(paramIssue).toBeDefined();
			expect(paramIssue?.severity).toBe('info');
			expect(paramIssue?.category).toBe('architecture');
		});

		it('should not flag functions with few parameters', () => {
			const content = `
function fewParams(a, b, c) {
	return a + b + c;
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const paramIssue = issues.find(i => i.title.includes('parameter'));

			expect(paramIssue).toBeUndefined();
		});

		it('should detect long parameter lists in Python', () => {
			const content = `
def many_params(a, b, c, d, e, f, g, h):
	return a + b + c + d + e + f + g + h
			`;

			const issues = detector.detectIssues(content, 'test.py', 'python');
			const paramIssue = issues.find(i => i.title.includes('parameter'));

			expect(paramIssue).toBeDefined();
		});

		it('should handle arrow functions with many params', () => {
			const content = `
const func = (a, b, c, d, e, f, g) => a + b + c + d + e + f + g;
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const paramIssue = issues.find(i => i.title.includes('parameter'));

			expect(paramIssue).toBeDefined();
		});
	});

	// ============================================================================
	// CALLBACK HELL DETECTION
	// ============================================================================

	describe('detectCallbackHell', () => {
		it('should detect long promise chains', () => {
			const content = `
fetch('/api').then(r => r.json()).then(data => process(data)).then(result => save(result)).then(done => notify(done));
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const callbackIssue = issues.find(i => i.title.includes('Promise chain'));

			expect(callbackIssue).toBeDefined();
			expect(callbackIssue?.severity).toBe('warning');
			expect(callbackIssue?.category).toBe('architecture');
		});

		it('should detect nested callbacks', () => {
			const content = `
doSomething(function() {
	doAnother(function() {
		doMore(function() {
			console.log('callback hell');
		});
	});
});
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const callbackIssue = issues.find(i => i.title.includes('callback'));

			expect(callbackIssue).toBeDefined();
		});

		it('should detect nested arrow functions', () => {
			const content = `
doSomething(() => {
	doAnother(() => {
		doMore(() => {
			console.log('arrow callback hell');
		});
	});
});
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const callbackIssue = issues.find(i => i.title.includes('callback'));

			expect(callbackIssue).toBeDefined();
		});

		it('should not flag short promise chains', () => {
			const content = `
fetch('/api').then(r => r.json()).then(data => console.log(data));
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');
			const callbackIssue = issues.find(i => i.title.includes('Promise chain'));

			expect(callbackIssue).toBeUndefined();
		});

		it('should only check JavaScript/TypeScript', () => {
			const content = `
# This is Python, no callback hell detection
def callback_style():
	pass
			`;

			const issues = detector.detectIssues(content, 'test.py', 'python');
			const callbackIssue = issues.find(i => i.title.includes('callback'));

			expect(callbackIssue).toBeUndefined();
		});
	});

	// ============================================================================
	// INTEGRATION TESTS
	// ============================================================================

	describe('Integration', () => {
		it('should detect multiple architecture issues in same file', () => {
			const padding = Array(55).fill('console.log("padding");').join('\n\t');
			const content = `
const complexGodFunction = (a, b, c, d, e, f, g) => {
	if (x && y) {
		if (y || z) {
			if (z && w) {
				if (w || v) {
					if (v && u) {
						for (let i = 0; i < 100; i++) {
							while (condition1 && condition2) {
								if (check1 || check2) {
									doSomething(function() {
										doAnother(function() {
											doMore(function() {
												console.log('nested');
											});
										});
									});
								}
							}
						}
					}
				}
			}
		}
	}
	${padding}
};
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');

			expect(issues.length).toBeGreaterThan(2);
			expect(issues.some(i => i.title.includes('complexity'))).toBe(true);
			expect(issues.some(i => i.title.includes('nesting'))).toBe(true);
			expect(issues.some(i => i.title.includes('long'))).toBe(true);
		});

		it('should handle clean code without issues', () => {
			const content = `
function clean(x) {
	if (x > 0) {
		return x * 2;
	}
	return 0;
}

function another(y) {
	return y + 1;
}
			`;

			const issues = detector.detectIssues(content, 'test.ts', 'typescript');

			expect(issues.length).toBe(0);
		});
	});
});
