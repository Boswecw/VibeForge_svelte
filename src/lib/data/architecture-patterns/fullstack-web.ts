/**
 * Full-Stack Web Application Architecture Pattern
 *
 * Complete web app with Python/FastAPI backend, SvelteKit frontend, and PostgreSQL database.
 * Uses REST API for communication.
 *
 * @example Modern SaaS applications, web platforms
 */

import type { ArchitecturePattern } from '$lib/workbench/types/architecture';

// ============================================================================
// TEMPLATE STRINGS
// ============================================================================

const fastapiMainTemplate = `from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
{{#if includeDatabase}}
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
{{/if}}

app = FastAPI(title="{{projectName}}")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

{{#if includeDatabase}}
# Database setup
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/dbname"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
{{/if}}

class Message(BaseModel):
    text: str

@app.get("/")
async def root():
    return {"message": "Welcome to {{projectName}} API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/greet")
async def greet(message: Message):
    return {"greeting": f"Hello, {message.text}!"}
`;

const requirementsTemplate = `fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0
{{#if includeDatabase}}
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.13.0
{{/if}}
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
`;

const frontendPackageJsonTemplate = `{
  "name": "{{projectName}}-frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"
  },
  "dependencies": {
    "svelte": "^5.0.0"
  },
  "devDependencies": {
    "@sveltejs/adapter-auto": "^3.0.0",
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "svelte-check": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}`;

// ============================================================================
// FULL-STACK WEB PATTERN DEFINITION
// ============================================================================

/**
 * Complete full-stack web application architecture pattern
 *
 * Components:
 * - Python/FastAPI REST API backend
 * - TypeScript/SvelteKit frontend
 * - PostgreSQL database
 *
 * Integration: REST API over HTTP
 */
export const fullstackWebPattern: ArchitecturePattern = {
	id: 'fullstack-web',
	name: 'fullstack-web',
	displayName: 'Full-Stack Web Application',
	description: 'Complete web app with API backend and modern frontend',
	category: 'web',
	icon: '🌐',

	components: [
		// ========================================================================
		// BACKEND COMPONENT (Python/FastAPI)
		// ========================================================================
		{
			id: 'backend',
			role: 'backend',
			name: 'API Backend',
			description: 'FastAPI REST API server with async support',
			language: 'python',
			framework: 'fastapi',
			location: 'backend',
			dependencies: [
				{
					componentId: 'database',
					type: 'required',
					relationship: 'calls'
				}
			],

			scaffolding: {
				directories: [
					{
						path: 'app',
						description: 'Application code',
						subdirectories: [
							{ path: 'api', description: 'API routes' },
							{ path: 'models', description: 'Data models' },
							{ path: 'schemas', description: 'Pydantic schemas' },
							{ path: 'services', description: 'Business logic' },
							{ path: 'db', description: 'Database setup' }
						]
					},
					{
						path: 'tests',
						description: 'Test suite'
					}
				],

				files: [
					{
						path: 'app/main.py',
						content: fastapiMainTemplate,
						templateEngine: 'handlebars',
						overwritable: false
					},
					{
						path: 'requirements.txt',
						content: requirementsTemplate,
						templateEngine: 'handlebars',
						overwritable: false
					},
					{
						path: '.env.example',
						content: `DATABASE_URL=postgresql://user:password@localhost/dbname
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:5173`,
						templateEngine: 'none',
						overwritable: false
					},
					{
						path: 'app/api/__init__.py',
						content: '',
						templateEngine: 'none',
						overwritable: true
					},
					{
						path: 'app/models/__init__.py',
						content: '',
						templateEngine: 'none',
						overwritable: true
					}
				],

				packageFiles: {},
				configFiles: {}
			},

			commands: {
				install: ['pip install -r requirements.txt'],
				dev: ['uvicorn app.main:app --reload --port 8000'],
				build: ['python -m build'],
				test: ['pytest']
			}
		},

		// ========================================================================
		// FRONTEND COMPONENT (TypeScript/SvelteKit)
		// ========================================================================
		{
			id: 'frontend',
			role: 'frontend',
			name: 'Web Frontend',
			description: 'SvelteKit web application with TypeScript',
			language: 'typescript',
			framework: 'sveltekit',
			location: 'frontend',
			dependencies: [
				{
					componentId: 'backend',
					type: 'required',
					relationship: 'calls'
				}
			],

			scaffolding: {
				directories: [
					{
						path: 'src/routes',
						description: 'SvelteKit routes',
						files: [
							{
								path: '+page.svelte',
								content: `<script lang="ts">
	let message = '';
	let greeting = '';

	async function sendGreeting() {
		const response = await fetch('http://localhost:8000/api/greet', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ text: message })
		});

		const data = await response.json();
		greeting = data.greeting;
	}
</script>

<main>
	<h1>Welcome to {{projectName}}</h1>

	<div class="form">
		<input
			type="text"
			placeholder="Enter your name..."
			bind:value={message}
		/>
		<button on:click={sendGreeting}>
			Greet
		</button>
	</div>

	{#if greeting}
		<p class="greeting">{greeting}</p>
	{/if}
</main>

<style>
	main {
		text-align: center;
		padding: 2rem;
	}

	.form {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin: 2rem 0;
	}

	.greeting {
		margin-top: 2rem;
		font-size: 1.5rem;
		color: #667eea;
	}
</style>`,
								templateEngine: 'handlebars',
								overwritable: true
							}
						]
					},
					{
						path: 'src/lib',
						description: 'Shared libraries',
						subdirectories: [
							{ path: 'components', description: 'Reusable components' },
							{ path: 'stores', description: 'State management' },
							{ path: 'api', description: 'API client functions' }
						]
					}
				],

				files: [
					{
						path: 'package.json',
						content: frontendPackageJsonTemplate,
						templateEngine: 'handlebars',
						overwritable: false
					},
					{
						path: 'svelte.config.js',
						content: `import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
};

export default config;`,
						templateEngine: 'none',
						overwritable: false
					},
					{
						path: 'vite.config.ts',
						content: `import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5173
	}
});`,
						templateEngine: 'none',
						overwritable: false
					}
				],

				packageFiles: {},
				configFiles: {}
			},

			commands: {
				install: ['npm install'],
				dev: ['npm run dev'],
				build: ['npm run build'],
				test: ['npm test']
			}
		},

		// ========================================================================
		// DATABASE COMPONENT (PostgreSQL)
		// ========================================================================
		{
			id: 'database',
			role: 'database',
			name: 'Database',
			description: 'PostgreSQL database',
			language: 'sql',
			framework: 'postgresql',
			location: 'database',
			dependencies: [],

			scaffolding: {
				directories: [
					{
						path: 'migrations',
						description: 'Database migrations'
					}
				],

				files: [
					{
						path: 'init.sql',
						content: `-- {{projectName}} Database Initialization

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);`,
						templateEngine: 'handlebars',
						overwritable: false
					},
					{
						path: 'docker-compose.yml',
						content: `version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: {{projectName}}_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  postgres_data:`,
						templateEngine: 'handlebars',
						overwritable: false
					}
				],

				packageFiles: {},
				configFiles: {}
			},

			commands: {
				install: ['docker-compose up -d'],
				dev: ['docker-compose up'],
				build: [],
				test: []
			}
		}
	],

	// ==========================================================================
	// INTEGRATION CONFIGURATION
	// ==========================================================================
	integration: {
		protocol: 'rest-api',
		sharedTypes: true,
		sharedConfig: false,
		generateBindings: [
			{
				from: 'backend',
				to: 'frontend',
				format: 'typescript'
			}
		]
	},

	// ==========================================================================
	// PATTERN METADATA
	// ==========================================================================
	complexity: 'intermediate',
	maturity: 'stable',
	popularity: 90,

	idealFor: [
		'SaaS applications',
		'Web platforms',
		'API-driven applications',
		'Multi-user systems',
		'Cloud-first applications'
	],

	notIdealFor: [
		'Desktop applications',
		'Mobile-native apps',
		'Embedded systems',
		'Real-time gaming'
	],

	examples: [
		'Web dashboards',
		'Admin panels',
		'Content management systems',
		'E-commerce platforms'
	],

	// ==========================================================================
	// PREREQUISITES
	// ==========================================================================
	prerequisites: {
		tools: ['Python 3.11+', 'Node.js', 'PostgreSQL or Docker'],
		skills: ['Python', 'TypeScript', 'REST APIs', 'SQL basics'],
		timeEstimate: '3-6 hours setup'
	},

	// ==========================================================================
	// DOCUMENTATION
	// ==========================================================================
	documentation: {
		quickStart: `# Quick Start

## 1. Set up database

\`\`\`bash
cd database
docker-compose up -d
\`\`\`

## 2. Install backend dependencies

\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
\`\`\`

## 3. Install frontend dependencies

\`\`\`bash
cd frontend
npm install
\`\`\`

## 4. Run in development

Terminal 1 (Backend):
\`\`\`bash
cd backend
uvicorn app.main:app --reload
\`\`\`

Terminal 2 (Frontend):
\`\`\`bash
cd frontend
npm run dev
\`\`\`

Visit http://localhost:5173
`,

		architecture: `# Architecture

## Three-tier Architecture

### 1. Frontend (SvelteKit)
- Modern reactive UI with Svelte 5
- TypeScript for type safety
- Server-side rendering (SSR) capable
- API client layer

### 2. Backend (FastAPI)
- RESTful API with OpenAPI docs
- Async request handling
- Pydantic for data validation
- SQLAlchemy ORM

### 3. Database (PostgreSQL)
- Relational data storage
- ACID transactions
- Full SQL capabilities
- Scalable and reliable

## Request Flow

\`\`\`
User Action (Frontend)
  ↓
HTTP Request (fetch)
  ↓
FastAPI Route Handler
  ↓
Business Logic (Service Layer)
  ↓
Database Query (SQLAlchemy)
  ↓
PostgreSQL
  ↓
Response (JSON)
  ↓
Frontend State Update
  ↓
UI Re-render
\`\`\`
`,

		deployment: `# Deployment

## Docker Deployment

Build images:
\`\`\`bash
docker build -t myapp-backend ./backend
docker build -t myapp-frontend ./frontend
\`\`\`

Run with docker-compose:
\`\`\`yaml
version: '3.8'
services:
  frontend:
    image: myapp-frontend
    ports:
      - "80:3000"
  backend:
    image: myapp-backend
    ports:
      - "8000:8000"
  database:
    image: postgres:16-alpine
\`\`\`

## Cloud Platforms

**Frontend:** Vercel, Netlify, Cloudflare Pages
**Backend:** Railway, Render, AWS ECS, Google Cloud Run
**Database:** AWS RDS, Google Cloud SQL, Neon

## Environment Variables

Set these in production:
- \`DATABASE_URL\`: PostgreSQL connection string
- \`SECRET_KEY\`: Secure random key for JWT
- \`CORS_ORIGINS\`: Frontend domain(s)
`,

		troubleshooting: `# Troubleshooting

## CORS errors?

Update CORS origins in \`backend/app/main.py\`:
\`\`\`python
allow_origins=["http://localhost:5173", "https://yourapp.com"]
\`\`\`

## Database connection fails?

1. Check PostgreSQL is running:
   \`\`\`bash
   docker-compose ps
   \`\`\`

2. Verify connection string in \`.env\`

3. Test connection:
   \`\`\`bash
   psql -h localhost -U user -d dbname
   \`\`\`

## Frontend can't reach backend?

1. Ensure backend is running on port 8000
2. Check API URL in frontend code
3. Verify no firewall blocking

## Hot reload not working?

**Backend:** Use \`--reload\` flag with uvicorn
**Frontend:** Vite auto-reloads, check console for errors
`
	}
};
