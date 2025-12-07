/**
 * VF-310: Built-in Prompt Patterns Library
 *
 * 20+ professional prompt engineering patterns for common development workflows.
 * Each pattern is carefully crafted with proven templates and variable definitions.
 */

import type { PromptPattern, TemplateVariable } from '../types/patterns';

/**
 * Helper to create a built-in pattern
 */
function createBuiltInPattern(
	id: string,
	name: string,
	description: string,
	template: string,
	variables: TemplateVariable[],
	category: PromptPattern['category'],
	tags: string[],
	recommendedModels?: string[],
	outputFormat?: PromptPattern['outputFormat']
): PromptPattern {
	return {
		id,
		name,
		description,
		template,
		variables,
		category,
		tags,
		author: 'VibeForge',
		recommendedModels,
		outputFormat,
		isBuiltIn: true,
		isPublic: true,
		usageCount: 0,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		version: 1
	};
}

/**
 * Built-in Patterns Library (20+ patterns)
 */
export const BUILTIN_PATTERNS: PromptPattern[] = [
	// ========== CODING PATTERNS ==========

	createBuiltInPattern(
		'code-review',
		'Code Review',
		'Comprehensive code review analyzing quality, best practices, and potential improvements',
		`You are an expert code reviewer. Perform a thorough code review of the following {{language}} code.

**Code to Review:**
\`\`\`{{language}}
{{code}}
\`\`\`

**Review Focus:**
{{focus}}

**Review Instructions:**
1. Analyze code quality (readability, maintainability, performance)
2. Identify bugs, security vulnerabilities, and edge cases
3. Check adherence to {{language}} best practices and conventions
4. Suggest specific improvements with code examples
5. Rate overall code quality (1-10) with justification

**Review Format:**
- **Summary**: Brief overview of code quality
- **Strengths**: What's done well
- **Issues**: Problems categorized by severity (Critical, Major, Minor)
- **Suggestions**: Specific improvement recommendations with code examples
- **Overall Rating**: X/10 with explanation`,
		[
			{
				name: 'language',
				label: 'Programming Language',
				description: 'The programming language of the code',
				type: 'string',
				required: true,
				placeholder: 'e.g., TypeScript, Python, Rust',
				exampleValue: 'TypeScript'
			},
			{
				name: 'code',
				label: 'Code to Review',
				description: 'The code snippet to review',
				type: 'code',
				required: true,
				placeholder: 'Paste your code here...',
				exampleValue: 'function calculateTotal(items: any[]) { ... }'
			},
			{
				name: 'focus',
				label: 'Review Focus',
				description: 'Specific aspects to focus on',
				type: 'string',
				required: false,
				defaultValue: 'General code quality',
				placeholder: 'e.g., Performance, Security, Readability',
				exampleValue: 'Performance and memory usage'
			}
		],
		'coding',
		['review', 'quality', 'best-practices'],
		['claude-3.5-sonnet', 'gpt-4'],
		'markdown'
	),

	createBuiltInPattern(
		'bug-root-cause',
		'Bug Root Cause Analysis',
		'Systematic investigation to identify the root cause of a bug',
		`You are a debugging expert. Help me identify the root cause of this bug.

**Bug Description:**
{{bugDescription}}

**Expected Behavior:**
{{expectedBehavior}}

**Actual Behavior:**
{{actualBehavior}}

**Relevant Code:**
\`\`\`{{language}}
{{code}}
\`\`\`

**Steps to Reproduce:**
{{stepsToReproduce}}

**Debug Analysis:**
1. Analyze the code flow and identify potential failure points
2. Examine edge cases and boundary conditions
3. Check for common bug patterns (null checks, off-by-one errors, race conditions, etc.)
4. Propose the most likely root cause(s)
5. Suggest specific fixes with code examples
6. Recommend preventive measures (tests, refactoring, etc.)

**Output Format:**
- **Root Cause**: Most likely cause with explanation
- **Why It Happens**: Technical explanation
- **Proposed Fix**: Code changes with before/after examples
- **Test Case**: Unit test to verify the fix
- **Prevention**: How to avoid similar bugs`,
		[
			{
				name: 'bugDescription',
				label: 'Bug Description',
				description: 'Brief description of the bug',
				type: 'string',
				required: true,
				placeholder: 'Describe the bug...',
				exampleValue: 'User profile update fails silently'
			},
			{
				name: 'expectedBehavior',
				label: 'Expected Behavior',
				description: 'What should happen',
				type: 'string',
				required: true,
				placeholder: 'What should happen...',
				exampleValue: 'Profile should update and show success message'
			},
			{
				name: 'actualBehavior',
				label: 'Actual Behavior',
				description: 'What actually happens',
				type: 'string',
				required: true,
				placeholder: 'What actually happens...',
				exampleValue: 'No error, no update, no feedback'
			},
			{
				name: 'language',
				label: 'Programming Language',
				description: 'Language of the code',
				type: 'string',
				required: true,
				placeholder: 'e.g., JavaScript, Python',
				exampleValue: 'JavaScript'
			},
			{
				name: 'code',
				label: 'Relevant Code',
				description: 'Code related to the bug',
				type: 'code',
				required: true,
				placeholder: 'Paste relevant code...',
				exampleValue: 'async function updateProfile(data) { ... }'
			},
			{
				name: 'stepsToReproduce',
				label: 'Steps to Reproduce',
				description: 'How to trigger the bug',
				type: 'string',
				required: true,
				placeholder: 'Step-by-step reproduction...',
				exampleValue: '1. Login\n2. Edit profile\n3. Click Save'
			}
		],
		'debugging',
		['bug', 'debugging', 'troubleshooting'],
		['claude-3.5-sonnet', 'gpt-4'],
		'markdown'
	),

	createBuiltInPattern(
		'api-design-review',
		'API Design Review',
		'Evaluate API design for RESTful principles, usability, and best practices',
		`You are an API design expert. Review this API design for quality, usability, and best practices.

**API Specification:**
{{apiSpec}}

**API Type:**
{{apiType}}

**Target Use Case:**
{{useCase}}

**Review Criteria:**
1. **RESTful Design**: Adherence to REST principles (if applicable)
2. **Naming Conventions**: Clear, consistent, intuitive endpoint/method names
3. **Resource Modeling**: Proper resource hierarchy and relationships
4. **HTTP Methods**: Correct usage of GET, POST, PUT, DELETE, PATCH
5. **Status Codes**: Appropriate HTTP status code usage
6. **Error Handling**: Clear error responses and error codes
7. **Versioning**: API versioning strategy
8. **Security**: Authentication, authorization, data protection
9. **Pagination**: Handling of large result sets
10. **Documentation**: Clarity and completeness

**Output Format:**
- **Overall Assessment**: Summary of API design quality (1-10 rating)
- **Strengths**: What's done well
- **Issues**: Categorized by severity with specific examples
- **Recommendations**: Concrete improvements with code/spec examples
- **Best Practices**: Alignment with industry standards`,
		[
			{
				name: 'apiSpec',
				label: 'API Specification',
				description: 'API endpoints, methods, and schemas',
				type: 'code',
				required: true,
				placeholder: 'Paste API spec (OpenAPI, endpoints list, etc.)...',
				exampleValue:
					'GET /api/users\nPOST /api/users\nGET /api/users/:id'
			},
			{
				name: 'apiType',
				label: 'API Type',
				description: 'Type of API (REST, GraphQL, gRPC, etc.)',
				type: 'string',
				required: true,
				defaultValue: 'REST',
				placeholder: 'e.g., REST, GraphQL, gRPC',
				exampleValue: 'REST'
			},
			{
				name: 'useCase',
				label: 'Target Use Case',
				description: 'What this API is used for',
				type: 'string',
				required: true,
				placeholder: 'Describe the use case...',
				exampleValue: 'User management for SaaS application'
			}
		],
		'design',
		['api', 'rest', 'design', 'architecture'],
		['claude-3.5-sonnet', 'gpt-4'],
		'markdown'
	),

	// ========== DOCUMENTATION PATTERNS ==========

	createBuiltInPattern(
		'doc-generator',
		'Documentation Generator',
		'Generate comprehensive documentation from code with examples and usage instructions',
		`You are a technical documentation expert. Generate comprehensive documentation for this {{language}} code.

**Code to Document:**
\`\`\`{{language}}
{{code}}
\`\`\`

**Documentation Requirements:**
1. **Overview**: Brief description of what this code does
2. **Purpose**: Why this code exists and when to use it
3. **API Reference**: Functions/methods with parameters, return types, and descriptions
4. **Usage Examples**: At least 3 practical examples showing how to use the code
5. **Edge Cases**: Important edge cases and how they're handled
6. **Error Handling**: What errors can occur and how to handle them
7. **Dependencies**: External dependencies and requirements
8. **Configuration**: Any configuration options
9. **Best Practices**: Recommended usage patterns

**Output Format:** Markdown with code examples`,
		[
			{
				name: 'language',
				label: 'Programming Language',
				description: 'The programming language',
				type: 'string',
				required: true,
				placeholder: 'e.g., TypeScript, Python',
				exampleValue: 'TypeScript'
			},
			{
				name: 'code',
				label: 'Code to Document',
				description: 'The code that needs documentation',
				type: 'code',
				required: true,
				placeholder: 'Paste your code...',
				exampleValue: 'export function formatCurrency(amount: number) { ... }'
			}
		],
		'documentation',
		['docs', 'documentation', 'api-docs'],
		['claude-3.5-sonnet', 'gpt-4'],
		'markdown'
	),

	createBuiltInPattern(
		'readme-generator',
		'README.md Generator',
		'Generate a professional README.md for a project',
		`You are a technical writer. Generate a comprehensive README.md for this project.

**Project Name:** {{projectName}}

**Project Description:** {{projectDescription}}

**Technology Stack:** {{techStack}}

**Target Audience:** {{audience}}

**README Sections:**
1. **Project Title & Description**: Compelling overview with badges (build status, license, etc.)
2. **Features**: Key features and capabilities (bullet points)
3. **Demo**: Screenshots, GIFs, or live demo link if available
4. **Installation**: Step-by-step installation instructions
5. **Quick Start**: Minimal example to get started immediately
6. **Usage**: Detailed usage examples with code snippets
7. **Configuration**: Environment variables and configuration options
8. **API Reference**: If applicable (brief overview, link to detailed docs)
9. **Contributing**: How to contribute (link to CONTRIBUTING.md)
10. **Testing**: How to run tests
11. **Deployment**: Deployment instructions (if applicable)
12. **Troubleshooting**: Common issues and solutions
13. **License**: License information
14. **Contact**: How to reach maintainers

**Tone**: {{tone}}

**Output Format:** Complete README.md in GitHub-flavored Markdown`,
		[
			{
				name: 'projectName',
				label: 'Project Name',
				description: 'The name of the project',
				type: 'string',
				required: true,
				placeholder: 'e.g., MyAwesomeApp',
				exampleValue: 'VibeForge'
			},
			{
				name: 'projectDescription',
				label: 'Project Description',
				description: 'Brief description of what the project does',
				type: 'string',
				required: true,
				placeholder: 'Describe your project...',
				exampleValue: 'AI-powered prompt engineering workbench'
			},
			{
				name: 'techStack',
				label: 'Technology Stack',
				description: 'Technologies and frameworks used',
				type: 'string',
				required: true,
				placeholder: 'e.g., React, Node.js, PostgreSQL',
				exampleValue: 'SvelteKit 5, TypeScript, Tailwind CSS, Tauri'
			},
			{
				name: 'audience',
				label: 'Target Audience',
				description: 'Who will use this project?',
				type: 'string',
				required: true,
				placeholder: 'e.g., developers, designers, data scientists',
				exampleValue: 'AI engineers and prompt engineers'
			},
			{
				name: 'tone',
				label: 'Documentation Tone',
				description: 'Tone of the documentation',
				type: 'string',
				required: false,
				defaultValue: 'Professional and friendly',
				placeholder: 'e.g., Professional, Casual, Technical',
				exampleValue: 'Professional and friendly'
			}
		],
		'documentation',
		['readme', 'docs', 'documentation', 'github'],
		['claude-3.5-sonnet', 'gpt-4'],
		'markdown'
	),

	// ========== TESTING PATTERNS ==========

	createBuiltInPattern(
		'test-generator',
		'Unit Test Generator',
		'Generate comprehensive unit tests with edge cases and mocks',
		`You are a testing expert. Generate comprehensive unit tests for this {{language}} code using {{testFramework}}.

**Code to Test:**
\`\`\`{{language}}
{{code}}
\`\`\`

**Testing Requirements:**
1. **Happy Path Tests**: Tests for expected behavior with valid inputs
2. **Edge Cases**: Boundary conditions, null values, empty arrays, etc.
3. **Error Cases**: Invalid inputs, error handling, exceptions
4. **Mocking**: Mock external dependencies (API calls, database, etc.)
5. **Assertions**: Clear, meaningful assertions
6. **Test Coverage**: Aim for 100% code coverage
7. **Test Names**: Descriptive test names following the pattern "should_expectedBehavior_when_condition"

**Test Structure:**
- Use {{testFramework}} syntax and best practices
- Include setup/teardown if needed
- Group related tests with describe/context blocks
- Use clear, descriptive variable names

**Output Format:** Complete test file with all test cases`,
		[
			{
				name: 'language',
				label: 'Programming Language',
				description: 'The programming language',
				type: 'string',
				required: true,
				placeholder: 'e.g., TypeScript, Python, Rust',
				exampleValue: 'TypeScript'
			},
			{
				name: 'code',
				label: 'Code to Test',
				description: 'The code that needs tests',
				type: 'code',
				required: true,
				placeholder: 'Paste your code...',
				exampleValue: 'export function validateEmail(email: string) { ... }'
			},
			{
				name: 'testFramework',
				label: 'Test Framework',
				description: 'Testing framework to use',
				type: 'string',
				required: true,
				placeholder: 'e.g., Vitest, Jest, pytest, RSpec',
				exampleValue: 'Vitest'
			}
		],
		'testing',
		['testing', 'unit-tests', 'tdd', 'quality'],
		['claude-3.5-sonnet', 'gpt-4'],
		'code'
	),

	createBuiltInPattern(
		'e2e-test-generator',
		'E2E Test Generator',
		'Generate end-to-end test scenarios using Playwright or Cypress',
		`You are an E2E testing expert. Generate comprehensive end-to-end tests for this user flow using {{testFramework}}.

**User Flow Description:**
{{userFlow}}

**Application Type:**
{{appType}}

**Test Requirements:**
1. **Setup**: Page navigation and initial state
2. **User Actions**: Click, type, select, upload, etc.
3. **Assertions**: Verify elements, text, state changes
4. **Error Scenarios**: Test error handling and edge cases
5. **Cleanup**: Reset state after tests
6. **Accessibility**: Basic accessibility checks (if applicable)
7. **Performance**: Key performance metrics (if applicable)

**Test Structure:**
- Use {{testFramework}} best practices
- Include test data setup
- Use page object pattern if complex
- Clear, descriptive test names
- Independent, isolated tests (no interdependencies)

**Output Format:** Complete E2E test file with all scenarios`,
		[
			{
				name: 'userFlow',
				label: 'User Flow Description',
				description: 'Describe the user flow to test',
				type: 'string',
				required: true,
				placeholder: 'Describe the flow step-by-step...',
				exampleValue:
					'User login → Create new project → Add team member → Invite via email'
			},
			{
				name: 'appType',
				label: 'Application Type',
				description: 'Type of application',
				type: 'string',
				required: true,
				placeholder: 'e.g., SPA, Multi-page app, Mobile',
				exampleValue: 'Single Page Application (SPA)'
			},
			{
				name: 'testFramework',
				label: 'E2E Framework',
				description: 'E2E testing framework to use',
				type: 'string',
				required: true,
				placeholder: 'e.g., Playwright, Cypress, Selenium',
				exampleValue: 'Playwright'
			}
		],
		'testing',
		['e2e', 'integration', 'testing', 'playwright', 'cypress'],
		['claude-3.5-sonnet', 'gpt-4'],
		'code'
	),

	// ========== REFACTORING PATTERNS ==========

	createBuiltInPattern(
		'refactor-suggestions',
		'Refactoring Suggestions',
		'Analyze code and suggest refactoring improvements',
		`You are a code refactoring expert. Analyze this {{language}} code and suggest refactoring improvements.

**Code to Refactor:**
\`\`\`{{language}}
{{code}}
\`\`\`

**Refactoring Goals:**
{{goals}}

**Refactoring Analysis:**
1. **Code Smells**: Identify code smells (long functions, duplicate code, magic numbers, etc.)
2. **SOLID Principles**: Check adherence to SOLID principles
3. **Design Patterns**: Suggest applicable design patterns
4. **Performance**: Identify performance optimization opportunities
5. **Readability**: Improvements for code clarity and maintainability
6. **Testability**: Suggestions to make code more testable
7. **Modern Features**: Opportunities to use modern language features

**Output Format:**
- **Current Issues**: List of code smells and problems
- **Refactoring Plan**: Step-by-step refactoring approach
- **Refactored Code**: Complete refactored version with explanations
- **Benefits**: How this improves the codebase
- **Migration Path**: How to safely apply these changes`,
		[
			{
				name: 'language',
				label: 'Programming Language',
				description: 'The programming language',
				type: 'string',
				required: true,
				placeholder: 'e.g., TypeScript, Python, Java',
				exampleValue: 'TypeScript'
			},
			{
				name: 'code',
				label: 'Code to Refactor',
				description: 'The code that needs refactoring',
				type: 'code',
				required: true,
				placeholder: 'Paste your code...',
				exampleValue: 'function processData(data) { ... }'
			},
			{
				name: 'goals',
				label: 'Refactoring Goals',
				description: 'What you want to achieve',
				type: 'string',
				required: false,
				defaultValue: 'Improve code quality and maintainability',
				placeholder: 'e.g., Better performance, clearer structure',
				exampleValue:
					'Improve testability and reduce cyclomatic complexity'
			}
		],
		'refactoring',
		['refactor', 'clean-code', 'improvement'],
		['claude-3.5-sonnet', 'gpt-4'],
		'markdown'
	),

	// ========== ANALYSIS PATTERNS ==========

	createBuiltInPattern(
		'performance-analysis',
		'Performance Analysis',
		'Identify performance bottlenecks and optimization opportunities',
		`You are a performance optimization expert. Analyze this {{language}} code for performance bottlenecks.

**Code to Analyze:**
\`\`\`{{language}}
{{code}}
\`\`\`

**Performance Context:**
{{context}}

**Analysis Areas:**
1. **Algorithmic Complexity**: Big O analysis (time and space)
2. **Data Structures**: Are optimal data structures used?
3. **Memory Usage**: Memory leaks, unnecessary allocations, GC pressure
4. **I/O Operations**: Database queries, API calls, file operations
5. **Concurrency**: Thread safety, race conditions, deadlocks
6. **Caching**: Opportunities for caching
7. **Network**: Network call optimization (batching, compression)
8. **Rendering**: UI rendering performance (if applicable)

**Output Format:**
- **Performance Profile**: Current performance characteristics
- **Bottlenecks**: Identified performance issues (ranked by impact)
- **Optimizations**: Specific optimization recommendations with code examples
- **Trade-offs**: Performance vs. readability/complexity considerations
- **Benchmarking**: Suggested benchmarks to measure improvements`,
		[
			{
				name: 'language',
				label: 'Programming Language',
				description: 'The programming language',
				type: 'string',
				required: true,
				placeholder: 'e.g., JavaScript, Python, Go',
				exampleValue: 'JavaScript'
			},
			{
				name: 'code',
				label: 'Code to Analyze',
				description: 'The code to analyze for performance',
				type: 'code',
				required: true,
				placeholder: 'Paste your code...',
				exampleValue: 'function searchUsers(query) { ... }'
			},
			{
				name: 'context',
				label: 'Performance Context',
				description: 'Context about performance requirements',
				type: 'string',
				required: true,
				placeholder:
					'e.g., Expected load, response time requirements, scale',
				exampleValue: '10,000 requests/sec, <100ms response time target'
			}
		],
		'analysis',
		['performance', 'optimization', 'bottleneck'],
		['claude-3.5-sonnet', 'gpt-4'],
		'markdown'
	),

	createBuiltInPattern(
		'security-audit',
		'Security Audit',
		'Identify security vulnerabilities and provide remediation guidance',
		`You are a security expert. Perform a comprehensive security audit of this {{language}} code.

**Code to Audit:**
\`\`\`{{language}}
{{code}}
\`\`\`

**Application Type:**
{{appType}}

**Security Checklist:**
1. **Input Validation**: SQL injection, XSS, command injection
2. **Authentication**: Password handling, session management, JWT security
3. **Authorization**: Access control, privilege escalation
4. **Data Protection**: Encryption at rest/transit, sensitive data exposure
5. **Dependencies**: Vulnerable dependencies, supply chain security
6. **Error Handling**: Information leakage in error messages
7. **Cryptography**: Proper use of crypto libraries
8. **OWASP Top 10**: Check against OWASP Top 10 vulnerabilities
9. **API Security**: Rate limiting, CORS, API key management
10. **Logging**: Secure logging (no sensitive data in logs)

**Output Format:**
- **Vulnerability Summary**: Count and severity distribution
- **Critical Issues**: Immediate security risks (with CVSS scores if applicable)
- **Vulnerabilities**: Detailed list with:
  - Description of the vulnerability
  - Proof of concept / exploit scenario
  - Severity rating (Critical, High, Medium, Low)
  - Remediation steps with code examples
  - Prevention guidance
- **Security Best Practices**: Additional recommendations`,
		[
			{
				name: 'language',
				label: 'Programming Language',
				description: 'The programming language',
				type: 'string',
				required: true,
				placeholder: 'e.g., JavaScript, Python, PHP',
				exampleValue: 'JavaScript'
			},
			{
				name: 'code',
				label: 'Code to Audit',
				description: 'The code to audit for security issues',
				type: 'code',
				required: true,
				placeholder: 'Paste your code...',
				exampleValue: 'app.post(\'/login\', (req, res) => { ... })'
			},
			{
				name: 'appType',
				label: 'Application Type',
				description: 'Type of application (helps contextualize threats)',
				type: 'string',
				required: true,
				placeholder: 'e.g., Web app, API, Mobile backend',
				exampleValue: 'Web application with REST API'
			}
		],
		'analysis',
		['security', 'vulnerability', 'audit', 'owasp'],
		['claude-3.5-sonnet', 'gpt-4'],
		'markdown'
	),

	// ========== DESIGN PATTERNS ==========

	createBuiltInPattern(
		'architecture-review',
		'Architecture Review',
		'Review system architecture for scalability, reliability, and best practices',
		`You are a software architect. Review this system architecture and provide recommendations.

**Architecture Description:**
{{architecture}}

**System Requirements:**
{{requirements}}

**Current Scale:**
{{scale}}

**Review Areas:**
1. **Scalability**: Horizontal/vertical scaling, bottlenecks, load distribution
2. **Reliability**: Fault tolerance, redundancy, disaster recovery
3. **Performance**: Latency, throughput, caching strategies
4. **Security**: Defense in depth, zero trust, data protection
5. **Maintainability**: Modularity, coupling, technical debt
6. **Cost Efficiency**: Resource utilization, cloud costs
7. **Observability**: Logging, monitoring, alerting
8. **Data Architecture**: Database choice, data modeling, consistency
9. **Integration**: API design, service communication, event-driven patterns
10. **Deployment**: CI/CD, blue-green, canary deployments

**Output Format:**
- **Architecture Assessment**: Overall rating and summary
- **Strengths**: Well-architected aspects
- **Weaknesses**: Areas of concern with risk levels
- **Recommendations**: Specific improvements ranked by priority
- **Alternative Patterns**: Suggested architectural patterns
- **Migration Path**: How to evolve the architecture safely`,
		[
			{
				name: 'architecture',
				label: 'Architecture Description',
				description: 'Describe the system architecture',
				type: 'string',
				required: true,
				placeholder: 'Describe components, data flow, tech stack...',
				exampleValue:
					'React frontend → Node.js API → PostgreSQL, Redis cache, S3 storage'
			},
			{
				name: 'requirements',
				label: 'System Requirements',
				description: 'Functional and non-functional requirements',
				type: 'string',
				required: true,
				placeholder: 'List key requirements...',
				exampleValue:
					'99.9% uptime, <200ms response time, handle 10K concurrent users'
			},
			{
				name: 'scale',
				label: 'Current Scale',
				description: 'Current system scale and growth trajectory',
				type: 'string',
				required: true,
				placeholder: 'e.g., Users, requests/day, data volume',
				exampleValue: '50K users, 5M requests/day, 500GB database, 20% MoM growth'
			}
		],
		'design',
		['architecture', 'system-design', 'scalability'],
		['claude-3.5-sonnet', 'gpt-4', 'claude-opus-4'],
		'markdown'
	),

	// ========== PLANNING PATTERNS ==========

	createBuiltInPattern(
		'feature-planning',
		'Feature Planning',
		'Create a comprehensive implementation plan for a new feature',
		`You are a technical project manager. Create a detailed implementation plan for this feature.

**Feature Description:**
{{featureDescription}}

**Target Users:**
{{targetUsers}}

**Success Criteria:**
{{successCriteria}}

**Technical Context:**
{{techContext}}

**Planning Requirements:**
1. **Feature Breakdown**: Break into epics and user stories
2. **Technical Design**: High-level architecture and component design
3. **API Changes**: New endpoints, data models, migrations
4. **UI/UX**: User flows, wireframes (description), components
5. **Dependencies**: External APIs, libraries, services
6. **Data Migration**: Database schema changes and migration strategy
7. **Testing Strategy**: Unit, integration, E2E test coverage
8. **Rollout Plan**: Phased rollout, feature flags, monitoring
9. **Risk Assessment**: Potential risks and mitigation strategies
10. **Timeline**: Estimated phases and duration

**Output Format:**
- **Executive Summary**: One-paragraph feature overview
- **User Stories**: At least 5 user stories with acceptance criteria
- **Technical Design**: Component diagram (text), data flow
- **Implementation Phases**: Broken down into deliverable phases
- **Success Metrics**: How to measure success
- **Risks & Mitigation**: Identified risks with mitigation plans`,
		[
			{
				name: 'featureDescription',
				label: 'Feature Description',
				description: 'Describe the feature to be implemented',
				type: 'string',
				required: true,
				placeholder: 'Describe the feature in detail...',
				exampleValue: 'Real-time collaborative document editing like Google Docs'
			},
			{
				name: 'targetUsers',
				label: 'Target Users',
				description: 'Who will use this feature?',
				type: 'string',
				required: true,
				placeholder: 'Describe the target users...',
				exampleValue: 'Teams of 5-50 people working on shared documents'
			},
			{
				name: 'successCriteria',
				label: 'Success Criteria',
				description: 'How do we know this feature is successful?',
				type: 'string',
				required: true,
				placeholder: 'List success criteria...',
				exampleValue:
					'95% of teams use collaborative editing, <500ms sync latency, 99% uptime'
			},
			{
				name: 'techContext',
				label: 'Technical Context',
				description: 'Current tech stack and constraints',
				type: 'string',
				required: true,
				placeholder: 'Describe tech stack, constraints...',
				exampleValue:
					'React + TypeScript frontend, Node.js backend, PostgreSQL database'
			}
		],
		'planning',
		['planning', 'feature', 'roadmap', 'project'],
		['claude-3.5-sonnet', 'gpt-4', 'claude-opus-4'],
		'markdown'
	),

	createBuiltInPattern(
		'estimation-breakdown',
		'Task Estimation & Breakdown',
		'Break down a task into subtasks with time estimates',
		`You are an engineering manager. Break down this task into subtasks with realistic time estimates.

**Task Description:**
{{taskDescription}}

**Team Context:**
{{teamContext}}

**Constraints:**
{{constraints}}

**Breakdown Requirements:**
1. **Subtask Identification**: Break into atomic, independent subtasks
2. **Dependencies**: Identify task dependencies (what blocks what)
3. **Effort Estimation**: Provide optimistic, realistic, and pessimistic estimates
4. **Resource Allocation**: Suggest who should do what (based on skills)
5. **Risk Factors**: Identify unknowns and potential blockers
6. **Parallelization**: Which tasks can be done in parallel?
7. **Milestones**: Key checkpoints and deliverables

**Estimation Method:** Use three-point estimation (optimistic, realistic, pessimistic)

**Output Format:**
- **Task Breakdown Tree**: Hierarchical list of subtasks
- **Dependency Graph**: Text-based representation of dependencies
- **Time Estimates**: Per subtask with totals
- **Critical Path**: Longest path through dependencies
- **Risks**: Potential delays and mitigation strategies
- **Timeline**: Suggested sprint/milestone structure`,
		[
			{
				name: 'taskDescription',
				label: 'Task Description',
				description: 'Describe the task to estimate',
				type: 'string',
				required: true,
				placeholder: 'Describe the task...',
				exampleValue: 'Migrate authentication system from JWT to OAuth2'
			},
			{
				name: 'teamContext',
				label: 'Team Context',
				description: 'Team size, skills, availability',
				type: 'string',
				required: true,
				placeholder: 'Describe team context...',
				exampleValue: '3 senior engineers, 2 junior, familiar with OAuth'
			},
			{
				name: 'constraints',
				label: 'Constraints',
				description: 'Timeline, resource, or technical constraints',
				type: 'string',
				required: true,
				placeholder: 'List any constraints...',
				exampleValue: 'Must complete in 2 sprints, zero downtime migration'
			}
		],
		'planning',
		['estimation', 'planning', 'breakdown', 'project'],
		['claude-3.5-sonnet', 'gpt-4'],
		'markdown'
	),

	// ========== LEARNING PATTERNS ==========

	createBuiltInPattern(
		'code-explainer',
		'Code Explainer',
		'Explain complex code in simple terms for learning and onboarding',
		`You are a coding instructor. Explain this {{language}} code in clear, simple terms.

**Code to Explain:**
\`\`\`{{language}}
{{code}}
\`\`\`

**Target Audience:**
{{audience}}

**Explanation Requirements:**
1. **High-Level Overview**: What does this code do? (one paragraph)
2. **Step-by-Step Breakdown**: Line-by-line or block-by-block explanation
3. **Key Concepts**: Important programming concepts used (with definitions)
4. **Data Flow**: How data moves through the code
5. **Edge Cases**: Special cases and how they're handled
6. **Common Pitfalls**: Mistakes beginners might make with similar code
7. **Learning Resources**: Links to docs or tutorials for key concepts

**Explanation Style:**
- Use simple, jargon-free language where possible
- Define technical terms when first introduced
- Use analogies for complex concepts
- Include visual aids (text-based diagrams) if helpful
- Provide context for "why" decisions were made

**Output Format:** Markdown with clear sections and code annotations`,
		[
			{
				name: 'language',
				label: 'Programming Language',
				description: 'The programming language',
				type: 'string',
				required: true,
				placeholder: 'e.g., Python, JavaScript, Rust',
				exampleValue: 'JavaScript'
			},
			{
				name: 'code',
				label: 'Code to Explain',
				description: 'The code that needs explanation',
				type: 'code',
				required: true,
				placeholder: 'Paste your code...',
				exampleValue: 'const debounce = (fn, delay) => { ... }'
			},
			{
				name: 'audience',
				label: 'Target Audience',
				description: 'Who is this explanation for?',
				type: 'string',
				required: true,
				placeholder: 'e.g., beginners, junior developers, non-programmers',
				exampleValue: 'Junior developers new to JavaScript'
			}
		],
		'learning',
		['learning', 'explanation', 'onboarding', 'education'],
		['claude-3.5-sonnet', 'gpt-4'],
		'markdown'
	),

	// ========== WRITING PATTERNS ==========

	createBuiltInPattern(
		'commit-message',
		'Commit Message Generator',
		'Generate clear, descriptive commit messages following conventional commits',
		`You are a Git expert. Generate a clear, descriptive commit message for these code changes.

**Changes Made:**
{{changes}}

**Commit Type:**
{{commitType}}

**Affected Components:**
{{components}}

**Commit Message Format:**
Follow Conventional Commits specification:
- Type: feat, fix, docs, style, refactor, test, chore, perf, ci, build
- Scope: Component or module affected (optional)
- Subject: Imperative mood, lowercase, no period, <50 characters
- Body: Detailed explanation (optional, <72 characters per line)
- Footer: Breaking changes, issue references (optional)

**Format:**
\`\`\`
type(scope): subject

[optional body]

[optional footer]
\`\`\`

**Output:** Provide 3 commit message options (brief, detailed, very detailed)`,
		[
			{
				name: 'changes',
				label: 'Changes Made',
				description: 'Describe what changed in the code',
				type: 'string',
				required: true,
				placeholder: 'Describe the code changes...',
				exampleValue:
					'Added email validation to user registration form, updated error messages'
			},
			{
				name: 'commitType',
				label: 'Commit Type',
				description: 'Type of commit (feat, fix, refactor, etc.)',
				type: 'string',
				required: true,
				placeholder: 'e.g., feat, fix, refactor, docs',
				exampleValue: 'feat'
			},
			{
				name: 'components',
				label: 'Affected Components',
				description: 'Which parts of the codebase were changed?',
				type: 'string',
				required: false,
				placeholder: 'e.g., auth, user, api',
				exampleValue: 'auth'
			}
		],
		'writing',
		['git', 'commit', 'version-control'],
		['claude-3.5-sonnet', 'gpt-4'],
		'text'
	),

	createBuiltInPattern(
		'changelog-generator',
		'CHANGELOG Generator',
		'Generate a comprehensive CHANGELOG from commit history or release notes',
		`You are a release manager. Generate a comprehensive CHANGELOG for this release.

**Release Version:**
{{version}}

**Changes:**
{{changes}}

**Target Audience:**
{{audience}}

**CHANGELOG Format:**
Follow Keep a Changelog conventions:
- Semantic versioning (MAJOR.MINOR.PATCH)
- Group changes by type: Added, Changed, Deprecated, Removed, Fixed, Security
- Date in YYYY-MM-DD format
- Link to version tags
- Keep descriptions concise but meaningful
- Highlight breaking changes prominently

**Output Format:**
\`\`\`markdown
## [Version] - YYYY-MM-DD

### Added
- Feature 1
- Feature 2

### Changed
- Change 1

### Fixed
- Bug fix 1
\`\`\`

**Output:** Complete CHANGELOG entry in markdown`,
		[
			{
				name: 'version',
				label: 'Release Version',
				description: 'Version number (semantic versioning)',
				type: 'string',
				required: true,
				placeholder: 'e.g., 2.1.0, 1.0.0-beta.1',
				exampleValue: '2.1.0'
			},
			{
				name: 'changes',
				label: 'Changes',
				description: 'List of changes in this release',
				type: 'string',
				required: true,
				placeholder: 'List all changes, one per line...',
				exampleValue:
					'Added OAuth2 support\nFixed email validation bug\nDeprecated legacy API endpoints'
			},
			{
				name: 'audience',
				label: 'Target Audience',
				description: 'Who will read this changelog?',
				type: 'string',
				required: true,
				placeholder: 'e.g., end users, developers, internal team',
				exampleValue: 'Developers using our API'
			}
		],
		'writing',
		['changelog', 'release', 'version', 'documentation'],
		['claude-3.5-sonnet', 'gpt-4'],
		'markdown'
	),

	// ========== ADDITIONAL SPECIALIZED PATTERNS ==========

	createBuiltInPattern(
		'sql-query-optimizer',
		'SQL Query Optimizer',
		'Optimize SQL queries for performance and identify index opportunities',
		`You are a database optimization expert. Analyze and optimize this SQL query.

**SQL Query:**
\`\`\`sql
{{query}}
\`\`\`

**Database Type:**
{{dbType}}

**Table Schema:**
{{schema}}

**Performance Context:**
{{context}}

**Optimization Analysis:**
1. **Execution Plan**: Likely execution plan analysis
2. **Index Opportunities**: Missing indexes that would help
3. **Query Rewrite**: Optimized version of the query
4. **N+1 Detection**: Potential N+1 query issues
5. **Join Optimization**: JOIN order and type recommendations
6. **Subquery Optimization**: Convert to JOINs where beneficial
7. **Caching**: Caching opportunities
8. **Pagination**: Efficient pagination strategies

**Output Format:**
- **Performance Assessment**: Current query issues
- **Optimized Query**: Improved SQL with explanations
- **Index Recommendations**: CREATE INDEX statements
- **Before/After**: Estimated performance improvement
- **Monitoring**: What metrics to track`,
		[
			{
				name: 'query',
				label: 'SQL Query',
				description: 'The SQL query to optimize',
				type: 'code',
				required: true,
				placeholder: 'Paste your SQL query...',
				exampleValue:
					'SELECT * FROM users WHERE email LIKE \'%@example.com\''
			},
			{
				name: 'dbType',
				label: 'Database Type',
				description: 'Type of database',
				type: 'string',
				required: true,
				placeholder: 'e.g., PostgreSQL, MySQL, SQL Server',
				exampleValue: 'PostgreSQL'
			},
			{
				name: 'schema',
				label: 'Table Schema',
				description: 'Relevant table schemas (CREATE TABLE statements)',
				type: 'string',
				required: false,
				placeholder: 'CREATE TABLE users (...)',
				exampleValue: 'users (id, email, name, created_at)'
			},
			{
				name: 'context',
				label: 'Performance Context',
				description: 'Table size, query frequency, performance issues',
				type: 'string',
				required: true,
				placeholder: 'Describe performance context...',
				exampleValue: '10M rows, runs 1000 times/sec, takes 5 seconds'
			}
		],
		'analysis',
		['sql', 'database', 'optimization', 'performance'],
		['claude-3.5-sonnet', 'gpt-4'],
		'markdown'
	),

	createBuiltInPattern(
		'regex-generator',
		'Regex Pattern Generator',
		'Generate and explain regular expressions for pattern matching',
		`You are a regex expert. Create a regular expression pattern for this use case.

**Pattern Requirements:**
{{requirements}}

**Language/Flavor:**
{{flavor}}

**Sample Inputs:**
**Should Match:**
{{shouldMatch}}

**Should NOT Match:**
{{shouldNotMatch}}

**Regex Output:**
1. **Pattern**: The regex pattern with explanation of each component
2. **Breakdown**: Detailed explanation of what each part does
3. **Test Cases**: Test the pattern against provided samples
4. **Alternatives**: Alternative patterns if multiple approaches exist
5. **Performance**: Notes on performance for large inputs
6. **Common Pitfalls**: Edge cases and potential issues

**Output Format:** Markdown with pattern explanation and test cases`,
		[
			{
				name: 'requirements',
				label: 'Pattern Requirements',
				description: 'What should the regex match?',
				type: 'string',
				required: true,
				placeholder: 'Describe what you need to match...',
				exampleValue: 'Email addresses that support + aliases'
			},
			{
				name: 'flavor',
				label: 'Regex Flavor',
				description: 'Language/engine (affects syntax)',
				type: 'string',
				required: true,
				placeholder: 'e.g., JavaScript, Python, PCRE, Java',
				exampleValue: 'JavaScript'
			},
			{
				name: 'shouldMatch',
				label: 'Should Match (Examples)',
				description: 'Examples that SHOULD match',
				type: 'string',
				required: true,
				placeholder: 'One example per line...',
				exampleValue: 'user@example.com\nuser+tag@example.com'
			},
			{
				name: 'shouldNotMatch',
				label: 'Should NOT Match (Examples)',
				description: 'Examples that should NOT match',
				type: 'string',
				required: true,
				placeholder: 'One example per line...',
				exampleValue: '@example.com\nuser@\nuser'
			}
		],
		'coding',
		['regex', 'pattern', 'validation'],
		['claude-3.5-sonnet', 'gpt-4'],
		'markdown'
	),

	createBuiltInPattern(
		'error-message-improver',
		'Error Message Improver',
		'Transform cryptic error messages into user-friendly, actionable messages',
		`You are a UX writer specializing in error messages. Improve this error message.

**Current Error Message:**
{{currentError}}

**Context:**
{{context}}

**Target Audience:**
{{audience}}

**Error Message Best Practices:**
1. **Clarity**: Use plain language, avoid jargon
2. **Specificity**: Explain exactly what went wrong
3. **Actionability**: Tell users how to fix it
4. **Tone**: Be helpful, not blaming
5. **Technical Details**: Include for developers (collapsible if user-facing)
6. **Prevention**: Suggest how to avoid this in the future

**Output Format:**
- **Improved Message**: User-friendly error message
- **Technical Details**: Additional context for developers (optional)
- **Actions**: Clear next steps for the user
- **Before/After**: Side-by-side comparison
- **Variations**: Provide 2-3 alternative phrasings`,
		[
			{
				name: 'currentError',
				label: 'Current Error Message',
				description: 'The error message to improve',
				type: 'string',
				required: true,
				placeholder: 'Paste the current error message...',
				exampleValue: 'ERR_INVALID_INPUT: validation failed at line 42'
			},
			{
				name: 'context',
				label: 'Context',
				description: 'When/where does this error occur?',
				type: 'string',
				required: true,
				placeholder: 'Describe the context...',
				exampleValue: 'User submitted registration form with invalid email'
			},
			{
				name: 'audience',
				label: 'Target Audience',
				description: 'Who sees this error?',
				type: 'string',
				required: true,
				placeholder: 'e.g., end users, developers, admins',
				exampleValue: 'Non-technical end users'
			}
		],
		'writing',
		['ux', 'error', 'messaging', 'usability'],
		['claude-3.5-sonnet', 'gpt-4'],
		'text'
	),

	createBuiltInPattern(
		'migration-planner',
		'Migration Planner',
		'Plan safe database or system migrations with rollback strategies',
		`You are a database migration expert. Create a comprehensive migration plan.

**Migration Description:**
{{migrationDescription}}

**Current State:**
{{currentState}}

**Target State:**
{{targetState}}

**Constraints:**
{{constraints}}

**Migration Plan Requirements:**
1. **Pre-Migration**: Backups, testing, validation
2. **Migration Steps**: Detailed step-by-step process
3. **Data Transformation**: How data will be converted
4. **Rollback Plan**: How to safely revert if issues occur
5. **Zero-Downtime Strategy**: Blue-green, read replicas, etc.
6. **Validation**: How to verify migration success
7. **Monitoring**: What to monitor during migration
8. **Timeline**: Estimated duration for each phase

**Output Format:**
- **Migration Overview**: Summary and risk assessment
- **Pre-Migration Checklist**: Things to do before starting
- **Migration Script**: SQL or code for the migration
- **Rollback Script**: How to undo the migration
- **Validation Queries**: Queries to verify success
- **Timeline**: Hour-by-hour or phase-by-phase breakdown`,
		[
			{
				name: 'migrationDescription',
				label: 'Migration Description',
				description: 'What needs to be migrated?',
				type: 'string',
				required: true,
				placeholder: 'Describe the migration...',
				exampleValue:
					'Migrate user addresses from single text field to structured address table'
			},
			{
				name: 'currentState',
				label: 'Current State',
				description: 'Current database/system state',
				type: 'string',
				required: true,
				placeholder: 'Describe current schema/structure...',
				exampleValue:
					'users table with address column (text), 500K rows'
			},
			{
				name: 'targetState',
				label: 'Target State',
				description: 'Desired end state after migration',
				type: 'string',
				required: true,
				placeholder: 'Describe target schema/structure...',
				exampleValue:
					'users table + addresses table (street, city, state, zip, country)'
			},
			{
				name: 'constraints',
				label: 'Migration Constraints',
				description: 'Constraints (downtime, data integrity, performance)',
				type: 'string',
				required: true,
				placeholder: 'List constraints...',
				exampleValue: 'Zero downtime, no data loss, complete in 4 hour window'
			}
		],
		'planning',
		['migration', 'database', 'deployment', 'data'],
		['claude-3.5-sonnet', 'gpt-4', 'claude-opus-4'],
		'markdown'
	)
];

/**
 * Get pattern by ID
 */
export function getPatternById(id: string): PromptPattern | undefined {
	return BUILTIN_PATTERNS.find((p) => p.id === id);
}

/**
 * Get patterns by category
 */
export function getPatternsByCategory(
	category: PromptPattern['category']
): PromptPattern[] {
	return BUILTIN_PATTERNS.filter((p) => p.category === category);
}

/**
 * Get patterns by tag
 */
export function getPatternsByTag(tag: string): PromptPattern[] {
	return BUILTIN_PATTERNS.filter((p) => p.tags.includes(tag));
}

/**
 * Search patterns by query
 */
export function searchPatterns(query: string): PromptPattern[] {
	const lowerQuery = query.toLowerCase();
	return BUILTIN_PATTERNS.filter(
		(p) =>
			p.name.toLowerCase().includes(lowerQuery) ||
			p.description.toLowerCase().includes(lowerQuery) ||
			p.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
	);
}
