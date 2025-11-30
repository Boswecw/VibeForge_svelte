/**
 * GraphQL API Backend Pattern
 *
 * Modern GraphQL API with type-safe resolvers, subscriptions,
 * database integration, and real-time capabilities.
 */

import type { ArchitecturePattern } from '$lib/workbench/types/architecture';

// ============================================================================
// TEMPLATES
// ============================================================================

const packageJsonTemplate = `{
  "name": "{{projectName}}",
  "version": "1.0.0",
  "description": "{{description}}",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "migrate": "prisma migrate dev",
    "generate": "prisma generate",
    "studio": "prisma studio",
    "test": "vitest",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write 'src/**/*.ts'"
  },
  "keywords": ["graphql", "api", "apollo", "prisma"],
  "author": "{{author}}",
  "license": "MIT",
  "dependencies": {
    "@apollo/server": "^4.10.0",
    "graphql": "^16.8.1",
    "graphql-tag": "^2.12.6",
    "prisma": "^5.8.0",
    "@prisma/client": "^5.8.0",
    "dataloader": "^2.2.2",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "ws": "^8.16.0",
    "graphql-ws": "^5.14.3"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/ws": "^8.5.10",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "vitest": "^1.1.0",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.17.0",
    "@typescript-eslint/parser": "^6.17.0",
    "prettier": "^3.1.1"
  }
}
`;

const tsconfigJsonTemplate = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`;

const prismaSchemaTemplate = `// Prisma schema for GraphQL API
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
}
`;

const indexTsTemplate = `import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { createContext, Context } from './context';
import { makeExecutableSchema } from '@graphql-tools/schema';

const PORT = process.env.PORT || 4000;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Create schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        return createContext({ req: ctx.extra.request });
      },
    },
    wsServer
  );

  // Apollo Server
  const server = new ApolloServer<Context>({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  // Middleware
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: createContext,
    })
  );

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Start server
  httpServer.listen(PORT, () => {
    console.log(\`🚀 Server ready at http://localhost:\${PORT}/graphql\`);
    console.log(\`📡 Subscriptions ready at ws://localhost:\${PORT}/graphql\`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
`;

const schemaTemplate = `import gql from 'graphql-tag';

export const typeDefs = gql\`
  # User type
  type User {
    id: ID!
    email: String!
    name: String
    posts: [Post!]!
    createdAt: String!
    updatedAt: String!
  }

  # Post type
  type Post {
    id: ID!
    title: String!
    content: String
    published: Boolean!
    author: User!
    createdAt: String!
    updatedAt: String!
  }

  # Authentication types
  type AuthPayload {
    token: String!
    user: User!
  }

  # Queries
  type Query {
    me: User
    user(id: ID!): User
    users(skip: Int, take: Int): [User!]!
    post(id: ID!): Post
    posts(published: Boolean, skip: Int, take: Int): [Post!]!
    feed(skip: Int, take: Int): [Post!]!
  }

  # Mutations
  type Mutation {
    signup(email: String!, password: String!, name: String): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    createPost(title: String!, content: String): Post!
    updatePost(id: ID!, title: String, content: String, published: Boolean): Post
    deletePost(id: ID!): Post
    publishPost(id: ID!): Post
  }

  # Subscriptions
  type Subscription {
    postCreated: Post!
    postUpdated(id: ID!): Post!
  }
\`;
`;

const resolversTemplate = `import { GraphQLError } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import { Context } from './context';
import { hashPassword, comparePassword, generateToken } from './utils/auth';
import { createUserLoader, createPostLoader } from './dataloaders';

const pubsub = new PubSub();

export const resolvers = {
  Query: {
    me: async (_parent: any, _args: any, context: Context) => {
      if (!context.userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return context.prisma.user.findUnique({ where: { id: context.userId } });
    },

    user: async (_parent: any, args: { id: string }, context: Context) => {
      return context.loaders.user.load(args.id);
    },

    users: async (_parent: any, args: { skip?: number; take?: number }, context: Context) => {
      return context.prisma.user.findMany({
        skip: args.skip,
        take: args.take,
      });
    },

    post: async (_parent: any, args: { id: string }, context: Context) => {
      return context.loaders.post.load(args.id);
    },

    posts: async (
      _parent: any,
      args: { published?: boolean; skip?: number; take?: number },
      context: Context
    ) => {
      return context.prisma.post.findMany({
        where: args.published !== undefined ? { published: args.published } : undefined,
        skip: args.skip,
        take: args.take,
        orderBy: { createdAt: 'desc' },
      });
    },

    feed: async (_parent: any, args: { skip?: number; take?: number }, context: Context) => {
      return context.prisma.post.findMany({
        where: { published: true },
        skip: args.skip,
        take: args.take,
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Mutation: {
    signup: async (
      _parent: any,
      args: { email: string; password: string; name?: string },
      context: Context
    ) => {
      const hashedPassword = await hashPassword(args.password);
      const user = await context.prisma.user.create({
        data: {
          email: args.email,
          password: hashedPassword,
          name: args.name,
        },
      });
      const token = generateToken(user.id);
      return { token, user };
    },

    login: async (
      _parent: any,
      args: { email: string; password: string },
      context: Context
    ) => {
      const user = await context.prisma.user.findUnique({
        where: { email: args.email },
      });

      if (!user) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const valid = await comparePassword(args.password, user.password);
      if (!valid) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const token = generateToken(user.id);
      return { token, user };
    },

    createPost: async (
      _parent: any,
      args: { title: string; content?: string },
      context: Context
    ) => {
      if (!context.userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const post = await context.prisma.post.create({
        data: {
          title: args.title,
          content: args.content,
          authorId: context.userId,
        },
      });

      pubsub.publish('POST_CREATED', { postCreated: post });
      return post;
    },

    updatePost: async (
      _parent: any,
      args: { id: string; title?: string; content?: string; published?: boolean },
      context: Context
    ) => {
      if (!context.userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const post = await context.prisma.post.update({
        where: { id: args.id },
        data: {
          title: args.title,
          content: args.content,
          published: args.published,
        },
      });

      pubsub.publish(\`POST_UPDATED_\${args.id}\`, { postUpdated: post });
      return post;
    },

    deletePost: async (_parent: any, args: { id: string }, context: Context) => {
      if (!context.userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return context.prisma.post.delete({
        where: { id: args.id },
      });
    },

    publishPost: async (_parent: any, args: { id: string }, context: Context) => {
      if (!context.userId) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const post = await context.prisma.post.update({
        where: { id: args.id },
        data: { published: true },
      });

      pubsub.publish('POST_CREATED', { postCreated: post });
      return post;
    },
  },

  Subscription: {
    postCreated: {
      subscribe: () => pubsub.asyncIterator(['POST_CREATED']),
    },
    postUpdated: {
      subscribe: (_parent: any, args: { id: string }) =>
        pubsub.asyncIterator([\`POST_UPDATED_\${args.id}\`]),
    },
  },

  User: {
    posts: async (parent: any, _args: any, context: Context) => {
      return context.prisma.post.findMany({
        where: { authorId: parent.id },
      });
    },
  },

  Post: {
    author: async (parent: any, _args: any, context: Context) => {
      return context.loaders.user.load(parent.authorId);
    },
  },
};
`;

const contextTemplate = `import { PrismaClient } from '@prisma/client';
import { verifyToken } from './utils/auth';
import { createUserLoader, createPostLoader } from './dataloaders';

const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
  userId: string | null;
  loaders: {
    user: ReturnType<typeof createUserLoader>;
    post: ReturnType<typeof createPostLoader>;
  };
}

export async function createContext({ req }: any): Promise<Context> {
  let userId: string | null = null;

  // Extract token from Authorization header
  const authHeader = req?.headers?.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = verifyToken(token);
      userId = payload.userId;
    } catch (error) {
      // Invalid token - userId remains null
    }
  }

  return {
    prisma,
    userId,
    loaders: {
      user: createUserLoader(prisma),
      post: createPostLoader(prisma),
    },
  };
}
`;

const authUtilTemplate = `import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
}
`;

const dataloaderTemplate = `import DataLoader from 'dataloader';
import { PrismaClient, User, Post } from '@prisma/client';

export function createUserLoader(prisma: PrismaClient) {
  return new DataLoader<string, User | null>(async (userIds) => {
    const users = await prisma.user.findMany({
      where: { id: { in: [...userIds] } },
    });

    const userMap = new Map(users.map((user) => [user.id, user]));
    return userIds.map((id) => userMap.get(id) || null);
  });
}

export function createPostLoader(prisma: PrismaClient) {
  return new DataLoader<string, Post | null>(async (postIds) => {
    const posts = await prisma.post.findMany({
      where: { id: { in: [...postIds] } },
    });

    const postMap = new Map(posts.map((post) => [post.id, post]));
    return postIds.map((id) => postMap.get(id) || null);
  });
}
`;

const envTemplate = `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/{{projectName}}"

# Server
PORT=4000
NODE_ENV=development

# Authentication
JWT_SECRET="change-this-secret-in-production"

# Prisma
# Run: npx prisma migrate dev
# Studio: npx prisma studio
`;

const dockerComposeTemplate = `version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: {{projectName}}_db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: {{projectName}}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  graphql:
    build: .
    container_name: {{projectName}}_api
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://user:password@postgres:5432/{{projectName}}
      JWT_SECRET: change-this-secret-in-production
    depends_on:
      - postgres
    volumes:
      - .:/app
      - /app/node_modules

volumes:
  postgres_data:
`;

const dockerfileTemplate = `FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
`;

const readmeTemplate = `# {{projectName}}

{{description}}

GraphQL API built with Apollo Server, Prisma, and PostgreSQL.

## Features

- 🚀 **Apollo Server 4** - Modern GraphQL server
- 🔒 **Authentication** - JWT-based auth with bcrypt
- 📊 **Prisma ORM** - Type-safe database access
- 🐘 **PostgreSQL** - Production-ready database
- 📡 **Subscriptions** - Real-time updates via WebSocket
- 🔄 **DataLoader** - Prevents N+1 query problems
- 🐳 **Docker** - Containerized deployment
- 📝 **TypeScript** - Full type safety

## Quick Start

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Setup Database

Start PostgreSQL with Docker:

\`\`\`bash
docker-compose up -d postgres
\`\`\`

Or update \`.env\` with your PostgreSQL connection string.

### 3. Run Migrations

\`\`\`bash
npm run migrate
\`\`\`

### 4. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

The GraphQL playground will be available at:
- **HTTP**: http://localhost:4000/graphql
- **WebSocket**: ws://localhost:4000/graphql

## GraphQL Operations

### Authentication

**Sign up:**
\`\`\`graphql
mutation {
  signup(
    email: "user@example.com"
    password: "password123"
    name: "John Doe"
  ) {
    token
    user {
      id
      email
      name
    }
  }
}
\`\`\`

**Login:**
\`\`\`graphql
mutation {
  login(email: "user@example.com", password: "password123") {
    token
    user {
      id
      email
    }
  }
}
\`\`\`

Add the token to your requests:
\`\`\`
Authorization: Bearer YOUR_TOKEN_HERE
\`\`\`

### Posts

**Create post:**
\`\`\`graphql
mutation {
  createPost(
    title: "My First Post"
    content: "This is the content"
  ) {
    id
    title
    published
  }
}
\`\`\`

**Get posts:**
\`\`\`graphql
query {
  posts {
    id
    title
    content
    author {
      name
    }
  }
}
\`\`\`

**Subscribe to new posts:**
\`\`\`graphql
subscription {
  postCreated {
    id
    title
    author {
      name
    }
  }
}
\`\`\`

## Project Structure

\`\`\`
{{projectName}}/
├── src/
│   ├── index.ts           # Server entry point
│   ├── schema.ts          # GraphQL schema definition
│   ├── resolvers.ts       # Query/Mutation/Subscription resolvers
│   ├── context.ts         # Request context creation
│   ├── dataloaders.ts     # DataLoader implementations
│   └── utils/
│       └── auth.ts        # Authentication utilities
├── prisma/
│   └── schema.prisma      # Database schema
├── .env                   # Environment variables
├── docker-compose.yml     # Docker services
├── Dockerfile             # Container image
├── package.json
└── tsconfig.json
\`\`\`

## Database Management

### Prisma Studio

Browse your data with Prisma Studio:

\`\`\`bash
npm run studio
\`\`\`

### Migrations

Create a new migration:

\`\`\`bash
npx prisma migrate dev --name description_of_change
\`\`\`

Apply migrations in production:

\`\`\`bash
npx prisma migrate deploy
\`\`\`

### Reset Database

\`\`\`bash
npx prisma migrate reset
\`\`\`

## Testing

Run tests:

\`\`\`bash
npm test
\`\`\`

## Production Deployment

### Docker

Build and run with Docker Compose:

\`\`\`bash
docker-compose up -d
\`\`\`

### Environment Variables

Update \`.env\` for production:

\`\`\`env
DATABASE_URL="postgresql://..."
JWT_SECRET="strong-random-secret"
NODE_ENV="production"
\`\`\`

## API Documentation

The GraphQL schema is self-documenting. Use the Apollo Server playground to explore:

- **Queries** - Fetch data
- **Mutations** - Modify data
- **Subscriptions** - Real-time updates

## Performance

- **DataLoader** prevents N+1 queries
- **Prisma** provides optimized database queries
- **Connection pooling** for database connections
- **JWT tokens** for stateless authentication

## Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- GraphQL validation and type safety
- Parameterized queries via Prisma

## License

MIT
`;

// ============================================================================
// GRAPHQL API PATTERN DEFINITION
// ============================================================================

export const graphqlApiPattern: ArchitecturePattern = {
	id: 'graphql-api',
	name: 'graphql-api',
	displayName: 'GraphQL API Backend',
	description: 'Modern GraphQL API with type-safe resolvers, subscriptions, and database integration',
	category: 'backend',
	icon: '🔷',

	components: [
		{
			id: 'graphql-server',
			role: 'backend',
			name: 'GraphQL Server',
			language: 'typescript',
			framework: 'apollo-server',
			location: '.',
			scaffolding: {
				directories: [
					{
						path: 'src',
						subdirectories: [
							{ path: 'utils' }
						],
						files: [
							{ path: 'index.ts', content: indexTsTemplate, templateEngine: 'handlebars' },
							{ path: 'schema.ts', content: schemaTemplate, templateEngine: 'handlebars' },
							{ path: 'resolvers.ts', content: resolversTemplate, templateEngine: 'handlebars' },
							{ path: 'context.ts', content: contextTemplate, templateEngine: 'handlebars' },
							{ path: 'dataloaders.ts', content: dataloaderTemplate, templateEngine: 'handlebars' }
						]
					},
					{
						path: 'src/utils',
						files: [
							{ path: 'auth.ts', content: authUtilTemplate, templateEngine: 'handlebars' }
						]
					},
					{
						path: 'prisma',
						files: [
							{ path: 'schema.prisma', content: prismaSchemaTemplate, templateEngine: 'handlebars' }
						]
					}
				],
				files: [
					{ path: 'package.json', content: packageJsonTemplate, templateEngine: 'handlebars' },
					{ path: 'tsconfig.json', content: tsconfigJsonTemplate, templateEngine: 'handlebars' },
					{ path: '.env', content: envTemplate, templateEngine: 'handlebars' },
					{ path: 'docker-compose.yml', content: dockerComposeTemplate, templateEngine: 'handlebars' },
					{ path: 'Dockerfile', content: dockerfileTemplate, templateEngine: 'handlebars' },
					{ path: 'README.md', content: readmeTemplate, templateEngine: 'handlebars' },
					{ path: '.gitignore', content: 'node_modules/\ndist/\n.env\n*.log\n.DS_Store\nprisma/migrations/\n' }
				]
			},
			dependencies: []
		}
	],

	integration: {
		protocol: 'graphql',
		sharedTypes: true,
		sharedConfig: true,
		generateBindings: ['typescript']
	},

	complexity: 'intermediate',
	maturity: 'stable',
	popularity: 75,

	idealFor: [
		'Modern APIs',
		'Real-time applications',
		'Mobile backends',
		'Complex data relationships',
		'Type-safe APIs',
		'Microservices communication',
		'Content management systems'
	],

	notIdealFor: [
		'Simple CRUD apps',
		'File uploads only',
		'Static sites',
		'Serverless functions (use REST)',
		'Public APIs with rate limits'
	],

	prerequisites: {
		tools: ['Node.js 18+', 'PostgreSQL', 'Docker (optional)'],
		knowledge: [
			'TypeScript basics',
			'GraphQL fundamentals',
			'Database design',
			'Authentication concepts',
			'Async/await patterns'
		]
	},

	tags: [
		'graphql',
		'apollo-server',
		'prisma',
		'postgresql',
		'typescript',
		'subscriptions',
		'real-time',
		'api',
		'backend'
	]
};
