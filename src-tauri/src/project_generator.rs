use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::io::Write;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectConfig {
    pub name: String,
    pub description: String,
    pub project_type: String,
    pub languages: Vec<String>,
    pub stack_id: String,
    pub database: Option<String>,
    pub authentication: Option<String>,
    pub deployment_platform: Option<String>,
    pub environment_variables: HashMap<String, String>,
    pub features: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct GenerationResult {
    pub success: bool,
    pub project_path: String,
    pub message: String,
    pub files_created: usize,
}

#[tauri::command]
pub async fn generate_project(
    config: ProjectConfig,
    output_dir: String,
) -> Result<GenerationResult, String> {
    println!("Generating project: {}", config.name);
    println!("Output directory: {}", output_dir);
    
    // Validate config
    if config.name.is_empty() {
        return Err("Project name is required".to_string());
    }
    
    if config.stack_id.is_empty() {
        return Err("Stack selection is required".to_string());
    }
    
    // Create project directory
    let project_path = PathBuf::from(&output_dir).join(&config.name);
    
    if project_path.exists() {
        return Err(format!("Directory '{}' already exists", config.name));
    }
    
    // Create project structure
    let files_created = create_project_structure(&project_path, &config)
        .map_err(|e| format!("Failed to create project structure: {}", e))?;
    
    Ok(GenerationResult {
        success: true,
        project_path: project_path.to_string_lossy().to_string(),
        message: format!("Project '{}' generated successfully!", config.name),
        files_created,
    })
}

fn create_project_structure(project_path: &Path, config: &ProjectConfig) -> Result<usize, std::io::Error> {
    let mut files_created = 0;
    
    // Create root directory
    fs::create_dir_all(project_path)?;
    files_created += 1;
    
    // Create basic directory structure
    let dirs = vec![
        "src",
        "src/components",
        "src/lib",
        "src/pages",
        "src/styles",
        "tests",
        "tests/unit",
        "tests/integration",
        "public",
        "docs",
    ];
    
    for dir in dirs {
        fs::create_dir_all(project_path.join(dir))?;
        files_created += 1;
    }
    
    // Create database directories if database is configured
    if config.database.is_some() && config.database.as_ref().unwrap() != "none" {
        fs::create_dir_all(project_path.join("db/migrations"))?;
        fs::create_dir_all(project_path.join("db/seeds"))?;
        files_created += 2;
    }
    
    // Generate files
    files_created += generate_readme(project_path, config)?;
    files_created += generate_gitignore(project_path, config)?;
    files_created += generate_package_json(project_path, config)?;
    files_created += generate_env_example(project_path, config)?;
    files_created += generate_docker_files(project_path, config)?;
    files_created += generate_config_files(project_path, config)?;
    
    // Generate stack-specific files
    files_created += generate_stack_specific_files(project_path, config)?;
    
    Ok(files_created)
}

fn generate_readme(project_path: &Path, config: &ProjectConfig) -> Result<usize, std::io::Error> {
    let content = format!(
        r#"# {}

{}

## Tech Stack

{}

{}

{}

## Getting Started

### Prerequisites

{}

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd {}

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development server
npm run dev
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Project Structure

```
{}/
├── src/              # Source code
│   ├── components/   # Reusable components
│   ├── lib/         # Utility functions
│   ├── pages/       # Page components
│   └── styles/      # CSS/styling files
├── tests/           # Test files
├── public/          # Static assets
├── docs/            # Documentation
└── README.md        # This file
```

## Environment Variables

See `.env.example` for required environment variables.

## Deployment

{}

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---

Generated with ❤️ by VibeForge
"#,
        config.name,
        config.description,
        format_stack_info(config),
        format_languages(config),
        format_database_info(config),
        format_prerequisites(config),
        config.name,
        config.name,
        format_deployment_info(config)
    );
    
    let mut file = fs::File::create(project_path.join("README.md"))?;
    file.write_all(content.as_bytes())?;
    Ok(1)
}

fn format_stack_info(config: &ProjectConfig) -> String {
    format!("**Stack**: {}", config.stack_id)
}

fn format_languages(config: &ProjectConfig) -> String {
    if config.languages.is_empty() {
        String::new()
    } else {
        format!("**Languages**: {}", config.languages.join(", "))
    }
}

fn format_database_info(config: &ProjectConfig) -> String {
    if let Some(db) = &config.database {
        if db != "none" {
            return format!("**Database**: {}", db);
        }
    }
    String::new()
}

fn format_prerequisites(config: &ProjectConfig) -> String {
    let mut prereqs = vec!["Node.js (v18 or higher)".to_string()];
    
    for lang in &config.languages {
        match lang.to_lowercase().as_str() {
            "python" => prereqs.push("Python 3.10+".to_string()),
            "go" | "golang" => prereqs.push("Go 1.20+".to_string()),
            "rust" => prereqs.push("Rust 1.70+".to_string()),
            "java" => prereqs.push("Java 17+".to_string()),
            _ => {}
        }
    }
    
    if let Some(db) = &config.database {
        match db.as_str() {
            "postgresql" => prereqs.push("PostgreSQL 14+".to_string()),
            "mysql" => prereqs.push("MySQL 8+".to_string()),
            "mongodb" => prereqs.push("MongoDB 6+".to_string()),
            _ => {}
        }
    }
    
    prereqs.iter().map(|p| format!("- {}", p)).collect::<Vec<_>>().join("\n")
}

fn format_deployment_info(config: &ProjectConfig) -> String {
    if let Some(platform) = &config.deployment_platform {
        match platform.as_str() {
            "vercel" => {
                "This project is optimized for deployment on Vercel.\n\n\
                ```bash\n\
                npm install -g vercel\n\
                vercel\n\
                ```".to_string()
            }
            "netlify" => {
                "This project is optimized for deployment on Netlify.\n\n\
                ```bash\n\
                npm install -g netlify-cli\n\
                netlify deploy\n\
                ```".to_string()
            }
            "docker" => {
                "This project includes Docker configuration.\n\n\
                ```bash\n\
                docker-compose up -d\n\
                ```".to_string()
            }
            _ => format!("Deploy to {}", platform)
        }
    } else {
        "Configure your deployment platform of choice.".to_string()
    }
}

fn generate_gitignore(project_path: &Path, config: &ProjectConfig) -> Result<usize, std::io::Error> {
    let mut content = r#"# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage
*.test.js.snap

# Production
/build
/dist
/.svelte-kit

# Misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS
Thumbs.db
"#.to_string();
    
    // Add language-specific ignores
    if config.languages.contains(&"Python".to_string()) || config.languages.contains(&"python".to_string()) {
        content.push_str("\n# Python\n__pycache__/\n*.py[cod]\n*.egg-info/\n.pytest_cache/\n.venv/\nvenv/\n");
    }
    
    if config.languages.contains(&"Go".to_string()) {
        content.push_str("\n# Go\n*.exe\n*.dll\n*.so\n*.dylib\n");
    }
    
    if config.languages.contains(&"Rust".to_string()) {
        content.push_str("\n# Rust\n/target/\nCargo.lock\n");
    }
    
    // Add database-specific ignores
    if let Some(db) = &config.database {
        if db == "sqlite" {
            content.push_str("\n# SQLite\n*.db\n*.sqlite\n*.sqlite3\n");
        }
    }
    
    let mut file = fs::File::create(project_path.join(".gitignore"))?;
    file.write_all(content.as_bytes())?;
    Ok(1)
}

fn generate_package_json(project_path: &Path, config: &ProjectConfig) -> Result<usize, std::io::Error> {
    let scripts = get_scripts_for_stack(&config.stack_id);
    let dependencies = get_dependencies_for_stack(&config.stack_id);
    let dev_dependencies = get_dev_dependencies_for_stack(&config.stack_id);
    
    let content = format!(
        r#"{{
  "name": "{}",
  "version": "0.1.0",
  "description": "{}",
  "type": "module",
  "scripts": {{
{}
  }},
  "dependencies": {{
{}
  }},
  "devDependencies": {{
{}
  }}
}}
"#,
        config.name,
        config.description,
        scripts,
        dependencies,
        dev_dependencies
    );
    
    let mut file = fs::File::create(project_path.join("package.json"))?;
    file.write_all(content.as_bytes())?;
    Ok(1)
}

fn get_scripts_for_stack(stack_id: &str) -> String {
    match stack_id {
        "t3-stack" => {
            r#"    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio""#.to_string()
        }
        "mern-stack" => {
            r#"    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "cd server && nodemon index.js",
    "client": "cd client && npm run dev",
    "build": "cd client && npm run build",
    "install:all": "npm install && cd server && npm install && cd ../client && npm install""#.to_string()
        }
        id if id.contains("nextjs") => {
            r#"    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint""#.to_string()
        }
        id if id.contains("sveltekit") => {
            r#"    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "check": "svelte-check --tsconfig ./tsconfig.json""#.to_string()
        }
        id if id.contains("solidstart") => {
            r#"    "dev": "vinxi dev",
    "build": "vinxi build",
    "start": "vinxi start",
    "test": "vitest""#.to_string()
        }
        _ => {
            r#"    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest""#.to_string()
        }
    }
}

fn get_dependencies_for_stack(stack_id: &str) -> String {
    match stack_id {
        "t3-stack" => {
            r#"    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@trpc/client": "^10.45.0",
    "@trpc/server": "^10.45.0",
    "@trpc/react-query": "^10.45.0",
    "@trpc/next": "^10.45.0",
    "@tanstack/react-query": "^5.17.0",
    "@prisma/client": "^5.8.0",
    "next-auth": "^4.24.5",
    "superjson": "^2.2.1",
    "zod": "^3.22.4""#.to_string()
        }
        "mern-stack" => {
            r#"    "express": "^4.18.2",
    "mongoose": "^8.0.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1""#.to_string()
        }
        id if id.contains("nextjs") => {
            r#"    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0""#.to_string()
        }
        id if id.contains("sveltekit") => {
            r#"    "@sveltejs/kit": "^2.0.0",
    "svelte": "^5.0.0""#.to_string()
        }
        id if id.contains("solidstart") => {
            r#"    "@solidjs/start": "^1.0.0",
    "solid-js": "^1.8.0",
    "vinxi": "^0.3.0""#.to_string()
        }
        _ => {
            r#"    "vite": "^5.0.0""#.to_string()
        }
    }
}

fn get_dev_dependencies_for_stack(stack_id: &str) -> String {
    let mut deps = vec![
        r#"    "typescript": "^5.3.3""#,
        r#"    "@types/node": "^20.10.6""#,
    ];
    
    match stack_id {
        "t3-stack" => {
            deps.extend(vec![
                r#"    "@types/react": "^18.2.45""#,
                r#"    "@types/react-dom": "^18.2.18""#,
                r#"    "prisma": "^5.8.0""#,
                r#"    "tailwindcss": "^3.4.0""#,
                r#"    "postcss": "^8.4.32""#,
                r#"    "autoprefixer": "^10.4.16""#,
                r#"    "eslint": "^8.56.0""#,
                r#"    "eslint-config-next": "^14.0.4""#,
            ]);
        }
        "mern-stack" => {
            deps.extend(vec![
                r#"    "nodemon": "^3.0.2""#,
                r#"    "@types/express": "^4.17.21""#,
                r#"    "@types/cors": "^2.8.17""#,
            ]);
        }
        id if id.contains("nextjs") => {
            deps.extend(vec![
                r#"    "@types/react": "^18.2.45""#,
                r#"    "@types/react-dom": "^18.2.18""#,
                r#"    "eslint": "^8.56.0""#,
                r#"    "eslint-config-next": "^14.0.4""#,
            ]);
        }
        id if id.contains("sveltekit") => {
            deps.extend(vec![
                r#"    "@sveltejs/adapter-auto": "^3.0.0""#,
                r#"    "svelte-check": "^3.6.0""#,
                r#"    "vite": "^5.0.10""#,
            ]);
        }
        _ => {
            deps.push(r#"    "vitest": "^1.1.0""#);
        }
    }
    
    deps.join(",\n")
}

fn generate_env_example(project_path: &Path, config: &ProjectConfig) -> Result<usize, std::io::Error> {
    if config.environment_variables.is_empty() {
        return Ok(0);
    }
    
    let mut content = String::from("# Environment Variables\n# Copy this file to .env and fill in your values\n\n");
    
    for (key, value) in &config.environment_variables {
        content.push_str(&format!("{}={}\n", key, value));
    }
    
    // Add stack-specific variables
    if config.stack_id == "t3-stack" {
        content.push_str("\n# Prisma Database\nDATABASE_URL=postgresql://postgres:password@localhost:5432/mydb\n");
        content.push_str("\n# NextAuth\nNEXTAUTH_SECRET=your-secret-here-change-in-production\n");
        content.push_str("NEXTAUTH_URL=http://localhost:3000\n");
        content.push_str("\n# Discord OAuth (optional)\nDISCORD_CLIENT_ID=\nDISCORD_CLIENT_SECRET=\n");
        content.push_str("\n# GitHub OAuth (optional)\nGITHUB_CLIENT_ID=\nGITHUB_CLIENT_SECRET=\n");
    }
    
    // Add common variables based on configuration
    if let Some(db) = &config.database {
        match db.as_str() {
            "postgresql" => {
                content.push_str("\n# Database\nDATABASE_URL=postgresql://user:password@localhost:5432/dbname\n");
            }
            "mysql" => {
                content.push_str("\n# Database\nDATABASE_URL=mysql://user:password@localhost:3306/dbname\n");
            }
            "mongodb" => {
                content.push_str("\n# Database\nMONGODB_URI=mongodb://localhost:27017/dbname\n");
            }
            _ => {}
        }
    }
    
    if let Some(auth) = &config.authentication {
        match auth.as_str() {
            "jwt" => {
                content.push_str("\n# Authentication\nJWT_SECRET=your-secret-key-here\n");
            }
            "oauth" => {
                content.push_str("\n# OAuth\nOAUTH_CLIENT_ID=your-client-id\nOAUTH_CLIENT_SECRET=your-client-secret\n");
            }
            _ => {}
        }
    }
    
    let mut file = fs::File::create(project_path.join(".env.example"))?;
    file.write_all(content.as_bytes())?;
    Ok(1)
}

fn generate_docker_files(project_path: &Path, config: &ProjectConfig) -> Result<usize, std::io::Error> {
    if let Some(platform) = &config.deployment_platform {
        if platform == "docker" {
            let mut files_created = 0;
            
            // Dockerfile
            let dockerfile_content = generate_dockerfile(config);
            let mut file = fs::File::create(project_path.join("Dockerfile"))?;
            file.write_all(dockerfile_content.as_bytes())?;
            files_created += 1;
            
            // docker-compose.yml
            let compose_content = generate_docker_compose(config);
            let mut file = fs::File::create(project_path.join("docker-compose.yml"))?;
            file.write_all(compose_content.as_bytes())?;
            files_created += 1;
            
            return Ok(files_created);
        }
    }
    Ok(0)
}

fn generate_dockerfile(config: &ProjectConfig) -> String {
    format!(
        r#"FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
"#
    )
}

fn generate_docker_compose(config: &ProjectConfig) -> String {
    let mut services = format!(
        r#"version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
"#
    );
    
    // Add database service if configured
    if let Some(db) = &config.database {
        match db.as_str() {
            "postgresql" => {
                services.push_str(
                    r#"
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
"#
                );
            }
            "mysql" => {
                services.push_str(
                    r#"
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: mydb
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
"#
                );
            }
            "mongodb" => {
                services.push_str(
                    r#"
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
"#
                );
            }
            _ => {}
        }
    }
    
    services
}

fn generate_config_files(project_path: &Path, config: &ProjectConfig) -> Result<usize, std::io::Error> {
    let mut files_created = 0;
    
    // TypeScript config
    let tsconfig = r#"{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "build"]
}
"#;
    let mut file = fs::File::create(project_path.join("tsconfig.json"))?;
    file.write_all(tsconfig.as_bytes())?;
    files_created += 1;
    
    // Add stack-specific config files
    if config.stack_id.contains("sveltekit") {
        let svelte_config = r#"import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter()
  }
};

export default config;
"#;
        let mut file = fs::File::create(project_path.join("svelte.config.js"))?;
        file.write_all(svelte_config.as_bytes())?;
        files_created += 1;
    }
    
    if config.stack_id.contains("nextjs") {
        let next_config = r#"/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
"#;
        let mut file = fs::File::create(project_path.join("next.config.js"))?;
        file.write_all(next_config.as_bytes())?;
        files_created += 1;
    }
    
    Ok(files_created)
}

// ============================================================================
// STACK-SPECIFIC FILE GENERATION
// ============================================================================

fn generate_stack_specific_files(project_path: &Path, config: &ProjectConfig) -> Result<usize, std::io::Error> {
    match config.stack_id.as_str() {
        "t3-stack" => generate_t3_stack_files(project_path, config),
        "mern-stack" => generate_mern_stack_files(project_path, config),
        "nextjs-fullstack" => generate_nextjs_fullstack_files(project_path, config),
        "sveltekit-stack" => generate_sveltekit_stack_files(project_path, config),
        "fastapi-ai-stack" => generate_fastapi_stack_files(project_path, config),
        _ => Ok(0)
    }
}

// ============================================================================
// T3 STACK (Next.js + tRPC + Prisma + NextAuth + Tailwind)
// ============================================================================

fn generate_t3_stack_files(project_path: &Path, config: &ProjectConfig) -> Result<usize, std::io::Error> {
    let mut files_created = 0;
    
    // Create T3-specific directory structure
    fs::create_dir_all(project_path.join("src/app"))?;
    fs::create_dir_all(project_path.join("src/server/api/routers"))?;
    fs::create_dir_all(project_path.join("src/server/auth"))?;
    fs::create_dir_all(project_path.join("prisma"))?;
    files_created += 4;
    
    // Prisma Schema
    let prisma_schema = r#"// This is your Prisma schema file
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  posts         Post[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
"#;
    let mut file = fs::File::create(project_path.join("prisma/schema.prisma"))?;
    file.write_all(prisma_schema.as_bytes())?;
    files_created += 1;
    
    // tRPC App Router setup
    let trpc_init = r#"import { initTRPC, TRPCError } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";
import { ZodError } from "zod";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;
  const session = await getServerAuthSession({ req, res });

  return {
    session,
    db,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
"#;
    fs::create_dir_all(project_path.join("src/server/api"))?;
    let mut file = fs::File::create(project_path.join("src/server/api/trpc.ts"))?;
    file.write_all(trpc_init.as_bytes())?;
    files_created += 1;
    
    // Root tRPC router
    let root_router = r#"import { createTRPCRouter } from "~/server/api/trpc";
import { postRouter } from "~/server/api/routers/post";
import { userRouter } from "~/server/api/routers/user";

export const appRouter = createTRPCRouter({
  post: postRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
"#;
    let mut file = fs::File::create(project_path.join("src/server/api/root.ts"))?;
    file.write_all(root_router.as_bytes())?;
    files_created += 1;
    
    // Post router example
    let post_router = r#"import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.db.post.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: true },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.post.findUnique({
        where: { id: input.id },
        include: { author: true },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        content: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.create({
        data: {
          title: input.title,
          content: input.content,
          authorId: ctx.session.user.id,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.delete({
        where: { id: input.id },
      });
    }),
});
"#;
    let mut file = fs::File::create(project_path.join("src/server/api/routers/post.ts"))?;
    file.write_all(post_router.as_bytes())?;
    files_created += 1;
    
    // User router example
    let user_router = r#"import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getCurrent: protectedProcedure.query(({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.user.findUnique({
        where: { id: input.id },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        image: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });
    }),
});
"#;
    let mut file = fs::File::create(project_path.join("src/server/api/routers/user.ts"))?;
    file.write_all(user_router.as_bytes())?;
    files_created += 1;
    
    // NextAuth config
    let auth_config = r#"import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import { getServerSession, type NextAuthOptions, type DefaultSession } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GitHubProvider from "next-auth/providers/github";
import { db } from "~/server/db";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  adapter: PrismaAdapter(db),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
};

export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
"#;
    let mut file = fs::File::create(project_path.join("src/server/auth.ts"))?;
    file.write_all(auth_config.as_bytes())?;
    files_created += 1;
    
    // Database client
    let db_client = r#"import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
"#;
    let mut file = fs::File::create(project_path.join("src/server/db.ts"))?;
    file.write_all(db_client.as_bytes())?;
    files_created += 1;
    
    // tRPC React Client
    let trpc_react = r#"import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";
import superjson from "superjson";
import { type AppRouter } from "~/server/api/root";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    };
  },
  ssr: false,
});

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
"#;
    fs::create_dir_all(project_path.join("src/utils"))?;
    let mut file = fs::File::create(project_path.join("src/utils/api.ts"))?;
    file.write_all(trpc_react.as_bytes())?;
    files_created += 1;
    
    // App Router API handler
    let api_handler = r#"import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req, res: null as any }),
  });

export { handler as GET, handler as POST };
"#;
    fs::create_dir_all(project_path.join("src/app/api/trpc/[trpc]"))?;
    let mut file = fs::File::create(project_path.join("src/app/api/trpc/[trpc]/route.ts"))?;
    file.write_all(api_handler.as_bytes())?;
    files_created += 1;
    
    // NextAuth API handler
    let nextauth_handler = r#"import NextAuth from "next-auth";
import { authOptions } from "~/server/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
"#;
    fs::create_dir_all(project_path.join("src/app/api/auth/[...nextauth]"))?;
    let mut file = fs::File::create(project_path.join("src/app/api/auth/[...nextauth]/route.ts"))?;
    file.write_all(nextauth_handler.as_bytes())?;
    files_created += 1;
    
    // Root layout with providers
    let root_layout = r#"import "~/styles/globals.css";
import { Inter } from "next/font/google";
import { TRPCReactProvider } from "~/trpc/react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "T3 App",
  description: "Generated by create-t3-app",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable}`}>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
"#;
    let mut file = fs::File::create(project_path.join("src/app/layout.tsx"))?;
    file.write_all(root_layout.as_bytes())?;
    files_created += 1;
    
    // Home page with example
    let home_page = r#""use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { api } from "~/utils/api";

export default function HomePage() {
  const { data: session } = useSession();
  const { data: posts, isLoading } = api.post.getAll.useQuery();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Welcome to <span className="text-[hsl(280,100%,70%)]">T3</span> Stack
        </h1>
        
        <div className="flex flex-col items-center gap-2">
          <p className="text-2xl text-white">
            {session ? `Logged in as ${session.user?.name}` : "Not logged in"}
          </p>
          <button
            className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
            onClick={() => (session ? signOut() : signIn())}
          >
            {session ? "Sign out" : "Sign in"}
          </button>
        </div>

        <div className="w-full max-w-2xl">
          <h2 className="text-3xl font-bold text-white mb-4">Recent Posts</h2>
          {isLoading ? (
            <p className="text-white">Loading...</p>
          ) : (
            <div className="flex flex-col gap-4">
              {posts?.map((post) => (
                <div
                  key={post.id}
                  className="rounded-lg bg-white/10 p-4 text-white"
                >
                  <h3 className="text-xl font-bold">{post.title}</h3>
                  <p className="text-sm text-white/70">
                    by {post.author.name} • {post.createdAt.toLocaleDateString()}
                  </p>
                  {post.content && <p className="mt-2">{post.content}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
"#;
    let mut file = fs::File::create(project_path.join("src/app/page.tsx"))?;
    file.write_all(home_page.as_bytes())?;
    files_created += 1;
    
    // Tailwind config
    let tailwind_config = r#"import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
    },
  },
  plugins: [],
} satisfies Config;
"#;
    let mut file = fs::File::create(project_path.join("tailwind.config.ts"))?;
    file.write_all(tailwind_config.as_bytes())?;
    files_created += 1;
    
    // PostCSS config
    let postcss_config = r#"module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
"#;
    let mut file = fs::File::create(project_path.join("postcss.config.cjs"))?;
    file.write_all(postcss_config.as_bytes())?;
    files_created += 1;
    
    // Global styles
    let globals_css = r#"@tailwind base;
@tailwind components;
@tailwind utilities;
"#;
    fs::create_dir_all(project_path.join("src/styles"))?;
    let mut file = fs::File::create(project_path.join("src/styles/globals.css"))?;
    file.write_all(globals_css.as_bytes())?;
    files_created += 1;
    
    // tRPC React Provider
    let trpc_provider = r#""use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import superjson from "superjson";
import { type AppRouter } from "~/server/api/root";

const createQueryClient = () => new QueryClient();

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    return createQueryClient();
  }
  return (clientQueryClientSingleton ??= createQueryClient());
};

export const api = createTRPCReact<AppRouter>();

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchLink({
          transformer: superjson,
          url: getBaseUrl() + "/api/trpc",
          headers: () => {
            const headers = new Headers();
            headers.set("x-trpc-source", "nextjs-react");
            return headers;
          },
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}

function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
"#;
    fs::create_dir_all(project_path.join("src/trpc"))?;
    let mut file = fs::File::create(project_path.join("src/trpc/react.tsx"))?;
    file.write_all(trpc_provider.as_bytes())?;
    files_created += 1;
    
    Ok(files_created)
}

// ============================================================================
// MERN STACK (MongoDB + Express + React + Node.js)
// ============================================================================

fn generate_mern_stack_files(project_path: &Path, config: &ProjectConfig) -> Result<usize, std::io::Error> {
    let mut files_created = 0;
    
    // Create MERN-specific directory structure
    fs::create_dir_all(project_path.join("server/routes"))?;
    fs::create_dir_all(project_path.join("server/models"))?;
    fs::create_dir_all(project_path.join("server/controllers"))?;
    fs::create_dir_all(project_path.join("server/middleware"))?;
    fs::create_dir_all(project_path.join("client/src/components"))?;
    fs::create_dir_all(project_path.join("client/src/pages"))?;
    fs::create_dir_all(project_path.join("client/src/services"))?;
    files_created += 7;
    
    // Server entry point
    let server_index = r#"import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });
"#;
    fs::create_dir_all(project_path.join("server"))?;
    let mut file = fs::File::create(project_path.join("server/index.js"))?;
    file.write_all(server_index.as_bytes())?;
    files_created += 1;
    
    // User model
    let user_model = r#"import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);
export default User;
"#;
    let mut file = fs::File::create(project_path.join("server/models/User.js"))?;
    file.write_all(user_model.as_bytes())?;
    files_created += 1;
    
    // Post model
    let post_model = r#"import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    published: {
      type: Boolean,
      default: false,
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model('Post', postSchema);
export default Post;
"#;
    let mut file = fs::File::create(project_path.join("server/models/Post.js"))?;
    file.write_all(post_model.as_bytes())?;
    files_created += 1;
    
    // User routes
    let user_routes = r#"import express from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/userController.js';

const router = express.Router();

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
"#;
    let mut file = fs::File::create(project_path.join("server/routes/users.js"))?;
    file.write_all(user_routes.as_bytes())?;
    files_created += 1;
    
    // Post routes
    let post_routes = r#"import express from 'express';
import { getPosts, getPostById, createPost, updatePost, deletePost } from '../controllers/postController.js';

const router = express.Router();

router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/', createPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

export default router;
"#;
    let mut file = fs::File::create(project_path.join("server/routes/posts.js"))?;
    file.write_all(post_routes.as_bytes())?;
    files_created += 1;
    
    // User controller
    let user_controller = r#"import User from '../models/User.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    const userObject = user.toObject();
    delete userObject.password;
    res.status(201).json(userObject);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
"#;
    let mut file = fs::File::create(project_path.join("server/controllers/userController.js"))?;
    file.write_all(user_controller.as_bytes())?;
    files_created += 1;
    
    // Post controller
    let post_controller = r#"import Post from '../models/Post.js';

export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email avatar');
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const post = new Post(req.body);
    await post.save();
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name email avatar');
    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'name email avatar');
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
"#;
    let mut file = fs::File::create(project_path.join("server/controllers/postController.js"))?;
    file.write_all(post_controller.as_bytes())?;
    files_created += 1;
    
    // React client App.jsx
    let client_app = r#"import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './pages/Home';
import Posts from './pages/Posts';
import PostDetail from './pages/PostDetail';
import Navbar from './components/Navbar';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/posts/:id" element={<PostDetail />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
"#;
    fs::create_dir_all(project_path.join("client/src"))?;
    let mut file = fs::File::create(project_path.join("client/src/App.jsx"))?;
    file.write_all(client_app.as_bytes())?;
    files_created += 1;
    
    // API service
    let api_service = r#"import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Users
export const getUsers = () => api.get('/users');
export const getUserById = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Posts
export const getPosts = () => api.get('/posts');
export const getPostById = (id) => api.get(`/posts/${id}`);
export const createPost = (data) => api.post('/posts', data);
export const updatePost = (id, data) => api.put(`/posts/${id}`, data);
export const deletePost = (id) => api.delete(`/posts/${id}`);

export default api;
"#;
    let mut file = fs::File::create(project_path.join("client/src/services/api.js"))?;
    file.write_all(api_service.as_bytes())?;
    files_created += 1;
    
    // Example Home page
    let home_page = r#"import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home">
      <h1>Welcome to MERN Stack App</h1>
      <p>A full-stack application built with MongoDB, Express, React, and Node.js</p>
      <Link to="/posts" className="btn">
        View Posts
      </Link>
    </div>
  );
}

export default Home;
"#;
    let mut file = fs::File::create(project_path.join("client/src/pages/Home.jsx"))?;
    file.write_all(home_page.as_bytes())?;
    files_created += 1;
    
    // Posts page with React Query
    let posts_page = r#"import { useQuery } from '@tanstack/react-query';
import { getPosts } from '../services/api';
import { Link } from 'react-router-dom';

function Posts() {
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const response = await getPosts();
      return response.data;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="posts">
      <h1>Posts</h1>
      <div className="posts-grid">
        {posts?.map((post) => (
          <div key={post._id} className="post-card">
            <h2>{post.title}</h2>
            <p>{post.content.substring(0, 100)}...</p>
            <div className="post-meta">
              <span>By {post.author.name}</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
            <Link to={`/posts/${post._id}`} className="btn">
              Read More
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Posts;
"#;
    let mut file = fs::File::create(project_path.join("client/src/pages/Posts.jsx"))?;
    file.write_all(posts_page.as_bytes())?;
    files_created += 1;
    
    // Client package.json
    let client_package_json = r#"{
  "name": "client",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
"#;
    let mut file = fs::File::create(project_path.join("client/package.json"))?;
    file.write_all(client_package_json.as_bytes())?;
    files_created += 1;
    
    // Vite config for client
    let vite_config = r#"import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
"#;
    let mut file = fs::File::create(project_path.join("client/vite.config.js"))?;
    file.write_all(vite_config.as_bytes())?;
    files_created += 1;
    
    Ok(files_created)
}

// ============================================================================
// NEXT.JS FULLSTACK (Next.js 14+ App Router)
// ============================================================================

fn generate_nextjs_fullstack_files(project_path: &Path, config: &ProjectConfig) -> Result<usize, std::io::Error> {
    let mut files_created = 0;
    
    // Create Next.js App Router structure
    fs::create_dir_all(project_path.join("src/app/api"))?;
    fs::create_dir_all(project_path.join("src/app/(dashboard)"))?;
    fs::create_dir_all(project_path.join("src/lib"))?;
    fs::create_dir_all(project_path.join("src/components"))?;
    files_created += 4;
    
    // API route example
    let api_route = r#"import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello from API' });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ received: body });
}
"#;
    fs::create_dir_all(project_path.join("src/app/api/hello"))?;
    let mut file = fs::File::create(project_path.join("src/app/api/hello/route.ts"))?;
    file.write_all(api_route.as_bytes())?;
    files_created += 1;
    
    // Root layout
    let layout = r#"import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Next.js App',
  description: 'Built with Next.js 14+ App Router',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
"#;
    let mut file = fs::File::create(project_path.join("src/app/layout.tsx"))?;
    file.write_all(layout.as_bytes())?;
    files_created += 1;
    
    // Home page
    let page = r#"import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">
        Welcome to Next.js 14+
      </h1>
      <p className="text-xl mb-4">
        With App Router, Server Components, and more!
      </p>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
"#;
    let mut file = fs::File::create(project_path.join("src/app/page.tsx"))?;
    file.write_all(page.as_bytes())?;
    files_created += 1;
    
    // Dashboard layout with nested routing
    let dashboard_layout = r#"export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <nav className="w-64 bg-gray-100 p-4">
        <h2 className="text-xl font-bold mb-4">Dashboard</h2>
        <ul className="space-y-2">
          <li>
            <a href="/dashboard" className="text-blue-600 hover:underline">
              Overview
            </a>
          </li>
          <li>
            <a href="/dashboard/settings" className="text-blue-600 hover:underline">
              Settings
            </a>
          </li>
        </ul>
      </nav>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
"#;
    let mut file = fs::File::create(project_path.join("src/app/(dashboard)/layout.tsx"))?;
    file.write_all(dashboard_layout.as_bytes())?;
    files_created += 1;
    
    // Dashboard page
    let dashboard_page = r#"export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p>Welcome to your dashboard!</p>
    </div>
  );
}
"#;
    let mut file = fs::File::create(project_path.join("src/app/(dashboard)/dashboard/page.tsx"))?;
    file.write_all(dashboard_page.as_bytes())?;
    files_created += 1;
    
    Ok(files_created)
}

// Placeholder functions for other stacks
fn generate_sveltekit_stack_files(_project_path: &Path, _config: &ProjectConfig) -> Result<usize, std::io::Error> {
    // TODO: Implement SvelteKit template
    Ok(0)
}

fn generate_fastapi_stack_files(_project_path: &Path, _config: &ProjectConfig) -> Result<usize, std::io::Error> {
    // TODO: Implement FastAPI template
    Ok(0)
}
