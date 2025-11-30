/**
 * Microservices Pattern
 *
 * Distributed architecture with multiple independent services.
 * Services communicate via REST API or message queues.
 *
 * @example E-commerce, SaaS platforms, enterprise systems
 */

import type { ArchitecturePattern } from '$lib/workbench/types/architecture';

// ============================================================================
// TEMPLATE STRINGS - API GATEWAY
// ============================================================================

const gatewayPackageJsonTemplate = `{
  "name": "{{projectName}}-gateway",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "http-proxy-middleware": "^2.0.6",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}`;

const gatewayMainTemplate = `import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    gateway: '{{projectName}} API Gateway',
    timestamp: new Date().toISOString()
  });
});

// Service routes
app.use('/api/users', createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://localhost:8001',
  changeOrigin: true,
  pathRewrite: { '^/api/users': '' }
}));

app.use('/api/products', createProxyMiddleware({
  target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:8002',
  changeOrigin: true,
  pathRewrite: { '^/api/products': '' }
}));

app.listen(PORT, () => {
  console.log(\`API Gateway running on port \${PORT}\`);
  console.log(\`User Service: \${process.env.USER_SERVICE_URL || 'http://localhost:8001'}\`);
  console.log(\`Product Service: \${process.env.PRODUCT_SERVICE_URL || 'http://localhost:8002'}\`);
});`;

// ============================================================================
// TEMPLATE STRINGS - USER SERVICE
// ============================================================================

const userServiceMainTemplate = `from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
{{#if includeDatabase}}
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from fastapi import Depends
{{/if}}

app = FastAPI(
    title="User Service",
    description="Microservice for user management",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

{{#if includeDatabase}}
# Database setup
DATABASE_URL = "postgresql://user:password@localhost/{{projectName}}_users"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
{{/if}}

# Models
class User(BaseModel):
    id: Optional[int] = None
    email: EmailStr
    name: str
    role: str = "user"

# In-memory storage (replace with database)
users_db: List[User] = []

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "user-service"}

@app.get("/users", response_model=List[User])
async def list_users():
    return users_db

@app.post("/users", response_model=User)
async def create_user(user: User):
    user.id = len(users_db) + 1
    users_db.append(user)
    return user

@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    for user in users_db:
        if user.id == user_id:
            return user
    raise HTTPException(status_code=404, detail="User not found")`;

const userServiceRequirementsTemplate = `fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic[email]==2.5.0
{{#if includeDatabase}}
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
{{/if}}
pytest==7.4.3
httpx==0.25.2`;

// ============================================================================
// TEMPLATE STRINGS - PRODUCT SERVICE
// ============================================================================

const productServiceMainTemplate = `from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal

app = FastAPI(
    title="Product Service",
    description="Microservice for product management",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Product(BaseModel):
    id: Optional[int] = None
    name: str
    description: str
    price: float
    stock: int = 0

# In-memory storage
products_db: List[Product] = [
    Product(id=1, name="Sample Product", description="A sample product", price=29.99, stock=100)
]

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "product-service"}

@app.get("/products", response_model=List[Product])
async def list_products():
    return products_db

@app.post("/products", response_model=Product)
async def create_product(product: Product):
    product.id = max([p.id for p in products_db], default=0) + 1
    products_db.append(product)
    return product

@app.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: int):
    for product in products_db:
        if product.id == product_id:
            return product
    raise HTTPException(status_code=404, detail="Product not found")

@app.put("/products/{product_id}/stock")
async def update_stock(product_id: int, quantity: int):
    for product in products_db:
        if product.id == product_id:
            product.stock = quantity
            return {"message": "Stock updated", "product": product}
    raise HTTPException(status_code=404, detail="Product not found")`;

const productServiceRequirementsTemplate = `fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pytest==7.4.3
httpx==0.25.2`;

// ============================================================================
// DOCKER COMPOSE
// ============================================================================

const dockerComposeTemplate = `version: '3.8'

services:
  gateway:
    build: ./gateway
    ports:
      - "3000:3000"
    environment:
      - USER_SERVICE_URL=http://user-service:8001
      - PRODUCT_SERVICE_URL=http://product-service:8002
    depends_on:
      - user-service
      - product-service
    networks:
      - microservices

  user-service:
    build: ./user-service
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=postgresql://user:password@user-db:5432/{{projectName}}_users
    depends_on:
      - user-db
    networks:
      - microservices

  product-service:
    build: ./product-service
    ports:
      - "8002:8002"
    networks:
      - microservices

  user-db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB={{projectName}}_users
    volumes:
      - user-data:/var/lib/postgresql/data
    networks:
      - microservices

volumes:
  user-data:

networks:
  microservices:
    driver: bridge`;

// ============================================================================
// GATEWAY DOCKERFILE
// ============================================================================

const gatewayDockerfileTemplate = `FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]`;

// ============================================================================
// SERVICE DOCKERFILE
// ============================================================================

const serviceDockerfileTemplate = `FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`;

// ============================================================================
// MICROSERVICES PATTERN DEFINITION
// ============================================================================

export const microservicesPattern: ArchitecturePattern = {
	id: 'microservices',
	name: 'microservices',
	displayName: 'Microservices Architecture',
	description: 'Distributed services with API gateway',
	category: 'microservices',
	icon: '🔷',

	components: [
		// ========================================================================
		// API GATEWAY COMPONENT
		// ========================================================================
		{
			id: 'gateway',
			role: 'backend',
			name: 'API Gateway',
			description: 'Node.js/Express API gateway with proxy',
			language: 'typescript',
			framework: 'express',
			location: 'gateway',
			dependencies: [
				{ componentId: 'user-service', type: 'http' },
				{ componentId: 'product-service', type: 'http' }
			],

			scaffolding: {
				directories: [
					{
						path: 'src',
						description: 'Source code',
						files: [
							{
								path: 'index.ts',
								content: gatewayMainTemplate,
								templateEngine: 'handlebars',
								overwritable: false
							}
						]
					}
				],

				files: [
					{
						path: 'package.json',
						content: gatewayPackageJsonTemplate,
						templateEngine: 'handlebars',
						overwritable: false
					},
					{
						path: 'tsconfig.json',
						content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}`,
						templateEngine: 'none',
						overwritable: false
					},
					{
						path: 'Dockerfile',
						content: gatewayDockerfileTemplate,
						templateEngine: 'none',
						overwritable: false
					},
					{
						path: '.env.example',
						content: `PORT=3000
USER_SERVICE_URL=http://localhost:8001
PRODUCT_SERVICE_URL=http://localhost:8002`,
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
				test: []
			}
		},

		// ========================================================================
		// USER SERVICE COMPONENT
		// ========================================================================
		{
			id: 'user-service',
			role: 'backend',
			name: 'User Service',
			description: 'FastAPI microservice for user management',
			language: 'python',
			framework: 'fastapi',
			location: 'user-service',
			dependencies: [],

			scaffolding: {
				directories: [
					{ path: 'app', description: 'Application code' },
					{ path: 'tests', description: 'Test suite' }
				],

				files: [
					{
						path: 'main.py',
						content: userServiceMainTemplate,
						templateEngine: 'handlebars',
						overwritable: false
					},
					{
						path: 'requirements.txt',
						content: userServiceRequirementsTemplate,
						templateEngine: 'handlebars',
						overwritable: false
					},
					{
						path: 'Dockerfile',
						content: serviceDockerfileTemplate,
						templateEngine: 'none',
						overwritable: false
					},
					{
						path: '.env.example',
						content: `DATABASE_URL=postgresql://user:password@localhost/{{projectName}}_users
PORT=8001`,
						templateEngine: 'handlebars',
						overwritable: false
					}
				],

				packageFiles: {},
				configFiles: {}
			},

			commands: {
				install: ['pip install -r requirements.txt'],
				dev: ['uvicorn main:app --reload --port 8001'],
				build: ['docker build -t user-service .'],
				test: ['pytest']
			}
		},

		// ========================================================================
		// PRODUCT SERVICE COMPONENT
		// ========================================================================
		{
			id: 'product-service',
			role: 'backend',
			name: 'Product Service',
			description: 'FastAPI microservice for product management',
			language: 'python',
			framework: 'fastapi',
			location: 'product-service',
			dependencies: [],

			scaffolding: {
				directories: [
					{ path: 'app', description: 'Application code' },
					{ path: 'tests', description: 'Test suite' }
				],

				files: [
					{
						path: 'main.py',
						content: productServiceMainTemplate,
						templateEngine: 'none',
						overwritable: false
					},
					{
						path: 'requirements.txt',
						content: productServiceRequirementsTemplate,
						templateEngine: 'none',
						overwritable: false
					},
					{
						path: 'Dockerfile',
						content: serviceDockerfileTemplate,
						templateEngine: 'none',
						overwritable: false
					},
					{
						path: '.env.example',
						content: `PORT=8002`,
						templateEngine: 'none',
						overwritable: false
					}
				],

				packageFiles: {},
				configFiles: {}
			},

			commands: {
				install: ['pip install -r requirements.txt'],
				dev: ['uvicorn main:app --reload --port 8002'],
				build: ['docker build -t product-service .'],
				test: ['pytest']
			}
		}
	],

	// ==========================================================================
	// ROOT FILES
	// ==========================================================================
	rootFiles: [
		{
			path: 'docker-compose.yml',
			content: dockerComposeTemplate,
			templateEngine: 'handlebars',
			overwritable: false
		},
		{
			path: 'README.md',
			content: `# {{projectName}}

{{projectDescription}}

## Microservices Architecture

This project uses a microservices architecture with the following services:

- **API Gateway** (Node.js/Express) - Port 3000
- **User Service** (Python/FastAPI) - Port 8001
- **Product Service** (Python/FastAPI) - Port 8002

## Quick Start

### Using Docker Compose (Recommended)

\`\`\`bash
docker-compose up --build
\`\`\`

Access the API Gateway at http://localhost:3000

### Running Services Individually

**Gateway:**
\`\`\`bash
cd gateway
npm install
npm run dev
\`\`\`

**User Service:**
\`\`\`bash
cd user-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
\`\`\`

**Product Service:**
\`\`\`bash
cd product-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8002
\`\`\`

## API Endpoints

### Gateway
- \`GET /health\` - Gateway health check
- \`GET /api/users\` - List all users
- \`POST /api/users\` - Create user
- \`GET /api/products\` - List all products
- \`POST /api/products\` - Create product

### Direct Service Access
- User Service: http://localhost:8001/docs
- Product Service: http://localhost:8002/docs

## Architecture

\`\`\`
Client
  ↓
API Gateway (3000)
  ↓
  ├─→ User Service (8001) → PostgreSQL
  └─→ Product Service (8002)
\`\`\`

## Technology Stack

- **Gateway**: Node.js, Express, TypeScript
- **Services**: Python, FastAPI, Pydantic
- **Database**: PostgreSQL
- **Orchestration**: Docker Compose

## Development

Each service is independently deployable and scalable.
Services communicate via REST API through the gateway.
`,
			templateEngine: 'handlebars',
			overwritable: false
		},
		{
			path: '.gitignore',
			content: `# Dependencies
node_modules/
__pycache__/
*.pyc
venv/
.venv/

# Environment
.env
*.local

# Build
dist/
build/
*.egg-info/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Docker
.dockerignore

# Logs
*.log
logs/

# OS
.DS_Store
Thumbs.db`,
			templateEngine: 'none',
			overwritable: false
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
	complexity: 'complex',
	maturity: 'stable',
	popularity: 70,

	idealFor: [
		'Large-scale applications',
		'E-commerce platforms',
		'Enterprise systems',
		'Multi-team development',
		'Independent service scaling',
		'Polyglot architectures'
	],

	notIdealFor: [
		'Small projects',
		'Simple CRUD apps',
		'Prototypes',
		'Single-developer projects',
		'Projects with tight coupling needs'
	],

	examples: [
		'E-commerce platform (user, product, order, payment services)',
		'SaaS application (auth, billing, analytics, notification services)',
		'Streaming platform (media, user, recommendation, search services)',
		'Ride-sharing app (user, driver, trip, payment services)'
	],

	// ==========================================================================
	// PREREQUISITES
	// ==========================================================================
	prerequisites: {
		tools: ['Node.js 18+', 'Python 3.11+', 'Docker', 'Docker Compose'],
		skills: [
			'REST API design',
			'Distributed systems',
			'Docker/containerization',
			'Service communication patterns',
			'API gateway concepts'
		],
		timeEstimate: '4-6 hours setup'
	},

	// ==========================================================================
	// DOCUMENTATION
	// ==========================================================================
	documentation: {
		quickStart: `# Quick Start

## 1. Start all services with Docker

\`\`\`bash
docker-compose up --build
\`\`\`

## 2. Access services

- API Gateway: http://localhost:3000
- User Service API Docs: http://localhost:8001/docs
- Product Service API Docs: http://localhost:8002/docs

## 3. Test the API

\`\`\`bash
# Create a user
curl -X POST http://localhost:3000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","name":"John Doe"}'

# List users
curl http://localhost:3000/api/users

# Create a product
curl -X POST http://localhost:3000/api/products \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Product 1","description":"Test","price":19.99,"stock":50}'
\`\`\`
`,

		architecture: `# Microservices Architecture

## Service Boundaries

Each service is responsible for its own domain:

- **User Service**: User management, authentication, profiles
- **Product Service**: Product catalog, inventory, pricing
- **API Gateway**: Request routing, load balancing, rate limiting

## Communication Patterns

### Synchronous (REST API)
Services communicate via HTTP REST endpoints through the gateway.

\`\`\`
Client → Gateway → User Service
              ↓
         Product Service
\`\`\`

### Service Discovery
Currently using static URLs in environment variables.
For production, consider:
- Consul
- Eureka
- Kubernetes DNS

## Data Management

Each service owns its data:
- User Service → User Database
- Product Service → Product Database (can be separate)

No direct database sharing between services.

## Scalability

Services can be scaled independently:

\`\`\`bash
docker-compose up --scale user-service=3 --scale product-service=2
\`\`\`

## Service Communication

**Synchronous**: REST API via Gateway (current)
**Asynchronous**: Message queues (future enhancement)
- RabbitMQ
- Apache Kafka
- Redis Pub/Sub
`,

		deployment: `# Deployment

## Docker Compose (Development)

\`\`\`bash
docker-compose up -d
\`\`\`

## Kubernetes (Production)

### 1. Build images

\`\`\`bash
docker build -t myregistry/gateway:latest ./gateway
docker build -t myregistry/user-service:latest ./user-service
docker build -t myregistry/product-service:latest ./product-service
\`\`\`

### 2. Push to registry

\`\`\`bash
docker push myregistry/gateway:latest
docker push myregistry/user-service:latest
docker push myregistry/product-service:latest
\`\`\`

### 3. Deploy to Kubernetes

\`\`\`bash
kubectl apply -f k8s/
\`\`\`

## Cloud Platforms

**AWS**:
- ECS/EKS for orchestration
- ALB for load balancing
- RDS for databases

**Google Cloud**:
- GKE for Kubernetes
- Cloud Load Balancing
- Cloud SQL

**Azure**:
- AKS for Kubernetes
- Application Gateway
- Azure Database

## Environment Variables

Set for each service:

**Gateway:**
- \`PORT\`
- \`USER_SERVICE_URL\`
- \`PRODUCT_SERVICE_URL\`

**User Service:**
- \`DATABASE_URL\`
- \`PORT\`

**Product Service:**
- \`PORT\`
`,

		troubleshooting: `# Troubleshooting

## Services can't communicate

1. Check Docker network:
\`\`\`bash
docker network ls
docker network inspect <network-name>
\`\`\`

2. Verify service URLs in gateway:
\`\`\`bash
docker logs <gateway-container>
\`\`\`

3. Test service health:
\`\`\`bash
curl http://localhost:8001/health
curl http://localhost:8002/health
\`\`\`

## Database connection fails

1. Check PostgreSQL is running:
\`\`\`bash
docker ps | grep postgres
\`\`\`

2. Verify connection string:
\`\`\`bash
docker exec -it <user-service> env | grep DATABASE_URL
\`\`\`

3. Test connection:
\`\`\`bash
docker exec -it <postgres-container> psql -U user -d dbname
\`\`\`

## Gateway proxy errors

Check CORS and proxy configuration in \`gateway/src/index.ts\`.

Enable debug logging:
\`\`\`bash
DEBUG=http-proxy-middleware* npm run dev
\`\`\`

## Port conflicts

Change ports in:
- \`docker-compose.yml\`
- Service \`.env\` files
- Gateway proxy configuration
`
	}
};
