/**
 * REST API Backend Pattern
 *
 * Backend-only API server with database integration.
 * Perfect for building APIs consumed by web, mobile, or desktop clients.
 *
 * @example Headless CMS, API services, backend for SPA
 */

import type { ArchitecturePattern } from '$lib/workbench/types/architecture';

// ============================================================================
// TEMPLATE STRINGS
// ============================================================================

const fastapiMainTemplate = `from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
{{#if includeDatabase}}
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
{{/if}}

app = FastAPI(
    title="{{projectName}} API",
    description="{{projectDescription}}",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

{{#if includeDatabase}}
# Database setup
DATABASE_URL = "postgresql://user:password@localhost/{{projectName}}_dev"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
{{/if}}

# Models
class Item(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None

@app.get("/")
async def root():
    return {
        "message": "Welcome to {{projectName}} API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/items", response_model=List[Item])
async def list_items():
    # TODO: Implement database query
    return []

@app.post("/items", response_model=Item)
async def create_item(item: Item):
    # TODO: Implement database insert
    return item

@app.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    # TODO: Implement database query
    raise HTTPException(status_code=404, detail="Item not found")
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
{{#if includeAuth}}
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
{{/if}}
pytest==7.4.3
httpx==0.25.2
`;

const dockerfileTemplate = `FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
`;

// ============================================================================
// REST API BACKEND PATTERN DEFINITION
// ============================================================================

export const restApiBackendPattern: ArchitecturePattern = {
	id: 'rest-api-backend',
	name: 'rest-api-backend',
	displayName: 'REST API Backend',
	description: 'Backend-only API server with database',
	category: 'backend',
	icon: '🔌',

	components: [
		// ========================================================================
		// BACKEND COMPONENT (Python/FastAPI)
		// ========================================================================
		{
			id: 'backend',
			role: 'backend',
			name: 'API Server',
			description: 'FastAPI REST API with async support',
			language: 'python',
			framework: 'fastapi',
			location: '.',
			dependencies: [],

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
							{ path: 'db', description: 'Database utilities' }
						]
					},
					{
						path: 'tests',
						description: 'Test suite',
						subdirectories: [
							{ path: 'api', description: 'API endpoint tests' },
							{ path: 'unit', description: 'Unit tests' }
						]
					},
					{
						path: 'migrations',
						description: 'Database migrations'
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
						path: 'Dockerfile',
						content: dockerfileTemplate,
						templateEngine: 'none',
						overwritable: false
					},
					{
						path: '.env.example',
						content: `DATABASE_URL=postgresql://user:password@localhost/{{projectName}}_dev
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
DEBUG=true`,
						templateEngine: 'handlebars',
						overwritable: false
					},
					{
						path: 'app/__init__.py',
						content: '',
						templateEngine: 'none',
						overwritable: true
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
					},
					{
						path: 'tests/__init__.py',
						content: '',
						templateEngine: 'none',
						overwritable: true
					},
					{
						path: 'pytest.ini',
						content: `[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --strict-markers`,
						templateEngine: 'none',
						overwritable: false
					}
				],

				packageFiles: {},
				configFiles: {}
			},

			commands: {
				install: ['pip install -r requirements.txt'],
				dev: ['uvicorn app.main:app --reload --port 8000'],
				build: ['docker build -t {{projectName}} .'],
				test: ['pytest']
			}
		}
	],

	// ==========================================================================
	// INTEGRATION CONFIGURATION
	// ==========================================================================
	integration: {
		protocol: 'rest-api',
		sharedTypes: false,
		sharedConfig: false,
		generateBindings: []
	},

	// ==========================================================================
	// PATTERN METADATA
	// ==========================================================================
	complexity: 'simple',
	maturity: 'stable',
	popularity: 95,

	idealFor: [
		'RESTful API services',
		'Backend for SPA/mobile apps',
		'Microservices',
		'Headless CMS',
		'Data APIs'
	],

	notIdealFor: [
		'Static websites',
		'Server-side rendered apps',
		'Real-time applications (use WebSocket)',
		'Monolithic applications'
	],

	examples: [
		'User management API',
		'E-commerce backend',
		'Content API',
		'Analytics service'
	],

	// ==========================================================================
	// PREREQUISITES
	// ==========================================================================
	prerequisites: {
		tools: ['Python 3.11+', 'PostgreSQL or Docker'],
		skills: ['Python', 'REST APIs', 'SQL basics'],
		timeEstimate: '1-2 hours setup'
	},

	// ==========================================================================
	// DOCUMENTATION
	// ==========================================================================
	documentation: {
		quickStart: `# Quick Start

## 1. Install dependencies

\`\`\`bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
\`\`\`

## 2. Set up environment

\`\`\`bash
cp .env.example .env
# Edit .env with your database credentials
\`\`\`

## 3. Run development server

\`\`\`bash
uvicorn app.main:app --reload
\`\`\`

Visit http://localhost:8000/docs for API documentation
`,

		architecture: `# Architecture

## Single-Component Backend

### API Server (FastAPI)
- RESTful endpoints with OpenAPI docs
- Async request handling
- Pydantic for data validation
- SQLAlchemy ORM (optional)
- JWT authentication (optional)

## Request Flow

\`\`\`
HTTP Request
  ↓
FastAPI Route Handler
  ↓
Pydantic Validation
  ↓
Business Logic (Service Layer)
  ↓
Database Query (SQLAlchemy)
  ↓
JSON Response
\`\`\`

## Directory Structure

\`\`\`
.
├── app/
│   ├── main.py          # Application entry
│   ├── api/             # Route handlers
│   ├── models/          # Database models
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic
│   └── db/              # Database utilities
├── tests/               # Test suite
├── migrations/          # Alembic migrations
├── requirements.txt     # Dependencies
└── Dockerfile          # Container config
\`\`\`
`,

		deployment: `# Deployment

## Docker Deployment

Build and run:
\`\`\`bash
docker build -t myapi .
docker run -p 8000:8000 myapi
\`\`\`

## Cloud Platforms

**Recommended:**
- Railway (easy deployment)
- Render (free tier available)
- AWS ECS / Google Cloud Run
- DigitalOcean App Platform

## Environment Variables

Set these in production:
- \`DATABASE_URL\`: PostgreSQL connection string
- \`SECRET_KEY\`: Secure random key for JWT
- \`CORS_ORIGINS\`: Allowed client domains
- \`DEBUG\`: Set to false in production
`,

		troubleshooting: `# Troubleshooting

## Database connection fails?

1. Check PostgreSQL is running
2. Verify connection string in \`.env\`
3. Test connection: \`psql $DATABASE_URL\`

## CORS errors?

Update CORS origins in \`app/main.py\`:
\`\`\`python
allow_origins=["https://yourfrontend.com"]
\`\`\`

## Import errors?

Ensure virtual environment is activated:
\`\`\`bash
source venv/bin/activate
pip install -r requirements.txt
\`\`\`
`
	}
};
