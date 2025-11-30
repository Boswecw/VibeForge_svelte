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
        "sveltekit-stack" => {
            r#"    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-check --tsconfig ./tsconfig.json""#.to_string()
        }
        "solidstart-stack" => {
            r#"    "dev": "vinxi dev",
    "build": "vinxi build",
    "start": "vinxi start""#.to_string()
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
        "sveltekit-stack" => {
            r#"    "@sveltejs/kit": "^2.0.0",
    "svelte": "^5.0.0""#.to_string()
        }
        "solidstart-stack" => {
            r#"    "@solidjs/router": "^0.10.0",
    "@solidjs/start": "^0.4.0",
    "@solidjs/meta": "^0.29.0",
    "solid-js": "^1.8.0",
    "vinxi": "^0.3.0""#.to_string()
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
        "sveltekit-stack" => {
            deps.extend(vec![
                r#"    "@sveltejs/adapter-auto": "^3.0.0""#,
                r#"    "@sveltejs/vite-plugin-svelte": "^3.0.0""#,
                r#"    "svelte-check": "^3.6.0""#,
                r#"    "vite": "^5.0.10""#,
            ]);
        }
        "solidstart-stack" => {
            deps.extend(vec![
                r#"    "vite": "^5.0.10""#,
                r#"    "vite-plugin-solid": "^2.8.0""#,
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
        "solidstart-stack" => generate_solidstart_stack_files(project_path, config),
        "fastapi-ai-stack" => generate_fastapi_stack_files(project_path, config),
        "react-native-expo" => generate_react_native_expo_files(project_path, config),
        "django-stack" => generate_django_stack_files(project_path, config),
        "golang-cloud-native" => generate_golang_cloud_native_files(project_path, config),
        "laravel-stack" => generate_laravel_stack_files(project_path, config),
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

// ============================================================================
// SVELTEKIT STACK (SvelteKit 2.x + Svelte 5)
// ============================================================================

fn generate_sveltekit_stack_files(project_path: &Path, config: &ProjectConfig) -> Result<usize, std::io::Error> {
    let mut files_created = 0;
    
    // Create SvelteKit directory structure
    fs::create_dir_all(project_path.join("src/routes"))?;
    fs::create_dir_all(project_path.join("src/routes/api/posts"))?;
    fs::create_dir_all(project_path.join("src/routes/posts/[id]"))?;
    fs::create_dir_all(project_path.join("src/lib/components"))?;
    fs::create_dir_all(project_path.join("src/lib/server"))?;
    fs::create_dir_all(project_path.join("src/lib/stores"))?;
    fs::create_dir_all(project_path.join("static"))?;
    files_created += 7;
    
    // SvelteKit config
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
    
    // Vite config
    let vite_config = r#"import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5173,
		strictPort: false
	}
});
"#;
    let mut file = fs::File::create(project_path.join("vite.config.ts"))?;
    file.write_all(vite_config.as_bytes())?;
    files_created += 1;
    
    // Root layout
    let root_layout = r#"<script lang="ts">
	import '../app.css';
	
	let { children } = $props();
</script>

<div class="app">
	<nav>
		<a href="/">Home</a>
		<a href="/posts">Posts</a>
		<a href="/about">About</a>
	</nav>
	
	<main>
		{@render children()}
	</main>
	
	<footer>
		<p>Built with SvelteKit</p>
	</footer>
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	
	nav {
		display: flex;
		gap: 1rem;
		padding: 1rem 2rem;
		background: #f0f0f0;
	}
	
	nav a {
		text-decoration: none;
		color: #333;
		font-weight: 500;
	}
	
	nav a:hover {
		color: #ff3e00;
	}
	
	main {
		flex: 1;
		padding: 2rem;
	}
	
	footer {
		padding: 1rem 2rem;
		background: #f0f0f0;
		text-align: center;
	}
</style>
"#;
    let mut file = fs::File::create(project_path.join("src/routes/+layout.svelte"))?;
    file.write_all(root_layout.as_bytes())?;
    files_created += 1;
    
    // Home page with load function
    let home_page = r#"<script lang="ts">
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Home - SvelteKit App</title>
	<meta name="description" content="Welcome to our SvelteKit app" />
</svelte:head>

<div class="home">
	<h1>Welcome to SvelteKit</h1>
	<p>This is a modern full-stack framework for building web applications.</p>
	
	<div class="features">
		<div class="feature">
			<h2>🚀 Fast</h2>
			<p>Server-side rendering and code splitting out of the box</p>
		</div>
		<div class="feature">
			<h2>💪 Powerful</h2>
			<p>Full-stack framework with API routes and form actions</p>
		</div>
		<div class="feature">
			<h2>🎨 Flexible</h2>
			<p>Use Svelte 5 with runes for reactive state management</p>
		</div>
	</div>
	
	<p class="server-message">{data.message}</p>
</div>

<style>
	.home {
		max-width: 1200px;
		margin: 0 auto;
	}
	
	h1 {
		font-size: 3rem;
		color: #ff3e00;
		margin-bottom: 1rem;
	}
	
	.features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
		margin: 3rem 0;
	}
	
	.feature {
		padding: 2rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}
	
	.feature h2 {
		margin: 0 0 1rem 0;
	}
	
	.server-message {
		text-align: center;
		font-style: italic;
		color: #666;
	}
</style>
"#;
    let mut file = fs::File::create(project_path.join("src/routes/+page.svelte"))?;
    file.write_all(home_page.as_bytes())?;
    files_created += 1;
    
    // Home page load function
    let home_load = r#"import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		message: 'This message was loaded on the server!'
	};
};
"#;
    let mut file = fs::File::create(project_path.join("src/routes/+page.server.ts"))?;
    file.write_all(home_load.as_bytes())?;
    files_created += 1;
    
    // Posts page with API fetch
    let posts_page = r#"<script lang="ts">
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Posts - SvelteKit App</title>
</svelte:head>

<div class="posts">
	<h1>Posts</h1>
	
	{#if data.posts.length === 0}
		<p>No posts yet.</p>
	{:else}
		<div class="posts-grid">
			{#each data.posts as post}
				<article class="post-card">
					<h2>
						<a href="/posts/{post.id}">{post.title}</a>
					</h2>
					<p>{post.excerpt}</p>
					<div class="meta">
						<span>By {post.author}</span>
						<span>{new Date(post.createdAt).toLocaleDateString()}</span>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>

<style>
	.posts {
		max-width: 1200px;
		margin: 0 auto;
	}
	
	h1 {
		font-size: 2.5rem;
		margin-bottom: 2rem;
	}
	
	.posts-grid {
		display: grid;
		gap: 2rem;
	}
	
	.post-card {
		padding: 2rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}
	
	.post-card h2 {
		margin: 0 0 1rem 0;
	}
	
	.post-card h2 a {
		color: #333;
		text-decoration: none;
	}
	
	.post-card h2 a:hover {
		color: #ff3e00;
	}
	
	.meta {
		display: flex;
		gap: 1rem;
		color: #666;
		font-size: 0.875rem;
		margin-top: 1rem;
	}
</style>
"#;
    fs::create_dir_all(project_path.join("src/routes/posts"))?;
    let mut file = fs::File::create(project_path.join("src/routes/posts/+page.svelte"))?;
    file.write_all(posts_page.as_bytes())?;
    files_created += 1;
    
    // Posts load function
    let posts_load = r#"import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const response = await fetch('/api/posts');
	const posts = await response.json();
	
	return {
		posts
	};
};
"#;
    let mut file = fs::File::create(project_path.join("src/routes/posts/+page.server.ts"))?;
    file.write_all(posts_load.as_bytes())?;
    files_created += 1;
    
    // API endpoint for posts
    let posts_api = r#"import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// In-memory data (replace with database in production)
let posts = [
	{
		id: '1',
		title: 'Getting Started with SvelteKit',
		excerpt: 'Learn the basics of SvelteKit and build your first app.',
		content: 'SvelteKit is a framework for building web applications...',
		author: 'John Doe',
		createdAt: new Date().toISOString()
	},
	{
		id: '2',
		title: 'Svelte 5 Runes Explained',
		excerpt: 'Understanding the new reactivity system in Svelte 5.',
		content: 'Svelte 5 introduces a new way to handle reactivity...',
		author: 'Jane Smith',
		createdAt: new Date().toISOString()
	}
];

export const GET: RequestHandler = async () => {
	return json(posts);
};

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();
	const newPost = {
		id: String(posts.length + 1),
		...data,
		createdAt: new Date().toISOString()
	};
	posts.push(newPost);
	return json(newPost, { status: 201 });
};
"#;
    let mut file = fs::File::create(project_path.join("src/routes/api/posts/+server.ts"))?;
    file.write_all(posts_api.as_bytes())?;
    files_created += 1;
    
    // Single post page with dynamic route
    let post_detail = r#"<script lang="ts">
	import type { PageData } from './$types';
	
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.post.title} - SvelteKit App</title>
</svelte:head>

<article class="post">
	<h1>{data.post.title}</h1>
	<div class="meta">
		<span>By {data.post.author}</span>
		<span>{new Date(data.post.createdAt).toLocaleDateString()}</span>
	</div>
	<div class="content">
		<p>{data.post.content}</p>
	</div>
	<a href="/posts" class="back-link">← Back to posts</a>
</article>

<style>
	.post {
		max-width: 800px;
		margin: 0 auto;
	}
	
	h1 {
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}
	
	.meta {
		display: flex;
		gap: 1rem;
		color: #666;
		font-size: 0.875rem;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e0e0e0;
	}
	
	.content {
		line-height: 1.7;
		font-size: 1.1rem;
		margin-bottom: 2rem;
	}
	
	.back-link {
		color: #ff3e00;
		text-decoration: none;
	}
	
	.back-link:hover {
		text-decoration: underline;
	}
</style>
"#;
    let mut file = fs::File::create(project_path.join("src/routes/posts/[id]/+page.svelte"))?;
    file.write_all(post_detail.as_bytes())?;
    files_created += 1;
    
    // Post detail load function
    let post_detail_load = r#"import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const response = await fetch('/api/posts');
	const posts = await response.json();
	const post = posts.find((p: any) => p.id === params.id);
	
	if (!post) {
		throw error(404, 'Post not found');
	}
	
	return {
		post
	};
};
"#;
    let mut file = fs::File::create(project_path.join("src/routes/posts/[id]/+page.server.ts"))?;
    file.write_all(post_detail_load.as_bytes())?;
    files_created += 1;
    
    // Store example
    let store = r#"import { writable } from 'svelte/store';

export const theme = writable<'light' | 'dark'>('light');

export const user = writable<{
	id: string;
	name: string;
	email: string;
} | null>(null);
"#;
    let mut file = fs::File::create(project_path.join("src/lib/stores/index.ts"))?;
    file.write_all(store.as_bytes())?;
    files_created += 1;
    
    // Reusable component
    let button_component = r#"<script lang="ts">
	interface Props {
		variant?: 'primary' | 'secondary';
		disabled?: boolean;
		onclick?: () => void;
		children: any;
	}
	
	let { variant = 'primary', disabled = false, onclick, children }: Props = $props();
</script>

<button
	class="btn {variant}"
	{disabled}
	{onclick}
>
	{@render children()}
</button>

<style>
	.btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.btn.primary {
		background: #ff3e00;
		color: white;
	}
	
	.btn.primary:hover:not(:disabled) {
		background: #e63900;
	}
	
	.btn.secondary {
		background: #f0f0f0;
		color: #333;
	}
	
	.btn.secondary:hover:not(:disabled) {
		background: #e0e0e0;
	}
</style>
"#;
    let mut file = fs::File::create(project_path.join("src/lib/components/Button.svelte"))?;
    file.write_all(button_component.as_bytes())?;
    files_created += 1;
    
    // App CSS
    let app_css = r#":root {
	font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
	line-height: 1.5;
	font-weight: 400;
	color: #213547;
	background-color: #ffffff;
}

* {
	box-sizing: border-box;
	margin: 0;
	padding: 0;
}

body {
	min-height: 100vh;
}

h1, h2, h3, h4, h5, h6 {
	font-weight: 600;
	line-height: 1.2;
}

a {
	color: #ff3e00;
	text-decoration: none;
}

a:hover {
	text-decoration: underline;
}
"#;
    let mut file = fs::File::create(project_path.join("src/app.css"))?;
    file.write_all(app_css.as_bytes())?;
    files_created += 1;
    
    // App HTML
    let app_html = r#"<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
"#;
    let mut file = fs::File::create(project_path.join("src/app.html"))?;
    file.write_all(app_html.as_bytes())?;
    files_created += 1;
    
    Ok(files_created)
}

// ============================================================================
// SOLIDSTART STACK (SolidStart + Solid.js)
// ============================================================================

fn generate_solidstart_stack_files(project_path: &Path, _config: &ProjectConfig) -> Result<usize, std::io::Error> {
    let mut files_created = 0;
    
    // Create SolidStart directory structure
    fs::create_dir_all(project_path.join("src/routes"))?;
    fs::create_dir_all(project_path.join("src/routes/api"))?;
    fs::create_dir_all(project_path.join("src/components"))?;
    fs::create_dir_all(project_path.join("public"))?;
    files_created += 4;
    
    // App config
    let app_config = r#"import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  server: {
    preset: "node-server",
  },
});
"#;
    let mut file = fs::File::create(project_path.join("app.config.ts"))?;
    file.write_all(app_config.as_bytes())?;
    files_created += 1;
    
    // Root component
    let root = r#"// @refresh reload
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";

export default function App() {
  return (
    <Router
      root={(props) => (
        <div class="app">
          <nav>
            <a href="/">Home</a>
            <a href="/posts">Posts</a>
            <a href="/about">About</a>
          </nav>
          <main>
            <Suspense fallback={<div>Loading...</div>}>
              {props.children}
            </Suspense>
          </main>
          <footer>
            <p>Built with SolidStart</p>
          </footer>
        </div>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
"#;
    let mut file = fs::File::create(project_path.join("src/app.tsx"))?;
    file.write_all(root.as_bytes())?;
    files_created += 1;
    
    // Entry client
    let entry_client = r#"// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";

mount(() => <StartClient />, document.getElementById("app")!);
"#;
    let mut file = fs::File::create(project_path.join("src/entry-client.tsx"))?;
    file.write_all(entry_client.as_bytes())?;
    files_created += 1;
    
    // Entry server
    let entry_server = r#"// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
"#;
    let mut file = fs::File::create(project_path.join("src/entry-server.tsx"))?;
    file.write_all(entry_server.as_bytes())?;
    files_created += 1;
    
    // Home route
    let index_route = r#"import { Title } from "@solidjs/meta";
import { createAsync } from "@solidjs/router";
import { cache } from "@solidjs/router";

const getServerMessage = cache(async () => {
  "use server";
  return {
    message: "This message was loaded on the server!",
    timestamp: new Date().toISOString(),
  };
}, "server-message");

export const route = {
  load: () => getServerMessage(),
};

export default function Home() {
  const data = createAsync(() => getServerMessage());

  return (
    <>
      <Title>Home - SolidStart App</Title>
      <div class="home">
        <h1>Welcome to SolidStart</h1>
        <p>
          This is a modern full-stack framework for building web applications
          with Solid.js.
        </p>

        <div class="features">
          <div class="feature">
            <h2>🚀 Fast</h2>
            <p>Server-side rendering and streaming out of the box</p>
          </div>
          <div class="feature">
            <h2>💪 Powerful</h2>
            <p>Full-stack framework with API routes and server functions</p>
          </div>
          <div class="feature">
            <h2>⚡ Reactive</h2>
            <p>Fine-grained reactivity without virtual DOM</p>
          </div>
        </div>

        <p class="server-message">{data()?.message}</p>
      </div>
    </>
  );
}
"#;
    let mut file = fs::File::create(project_path.join("src/routes/index.tsx"))?;
    file.write_all(index_route.as_bytes())?;
    files_created += 1;
    
    // Posts route
    let posts_route = r#"import { Title } from "@solidjs/meta";
import { createAsync } from "@solidjs/router";
import { For } from "solid-js";
import { cache } from "@solidjs/router";

const getPosts = cache(async () => {
  "use server";
  // In-memory data (replace with database in production)
  return [
    {
      id: "1",
      title: "Getting Started with SolidStart",
      excerpt: "Learn the basics of SolidStart and build your first app.",
      author: "John Doe",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Solid.js Reactivity Explained",
      excerpt: "Understanding fine-grained reactivity in Solid.js.",
      author: "Jane Smith",
      createdAt: new Date().toISOString(),
    },
  ];
}, "posts");

export const route = {
  load: () => getPosts(),
};

export default function Posts() {
  const posts = createAsync(() => getPosts());

  return (
    <>
      <Title>Posts - SolidStart App</Title>
      <div class="posts">
        <h1>Posts</h1>

        <div class="posts-grid">
          <For each={posts()}>
            {(post) => (
              <article class="post-card">
                <h2>
                  <a href={`/posts/${post.id}`}>{post.title}</a>
                </h2>
                <p>{post.excerpt}</p>
                <div class="meta">
                  <span>By {post.author}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </article>
            )}
          </For>
        </div>
      </div>
    </>
  );
}
"#;
    let mut file = fs::File::create(project_path.join("src/routes/posts.tsx"))?;
    file.write_all(posts_route.as_bytes())?;
    files_created += 1;
    
    // API route
    let api_route = r#"import { json } from "@solidjs/router";
import type { APIEvent } from "@solidjs/start/server";

export async function GET() {
  const posts = [
    {
      id: "1",
      title: "Getting Started with SolidStart",
      excerpt: "Learn the basics of SolidStart and build your first app.",
      author: "John Doe",
      createdAt: new Date().toISOString(),
    },
  ];
  return json(posts);
}

export async function POST({ request }: APIEvent) {
  const data = await request.json();
  // Handle post creation
  return json({ success: true, data }, { status: 201 });
}
"#;
    let mut file = fs::File::create(project_path.join("src/routes/api/posts.ts"))?;
    file.write_all(api_route.as_bytes())?;
    files_created += 1;
    
    // Button component
    let button = r#"import { JSX, splitProps } from "solid-js";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export default function Button(props: ButtonProps) {
  const [local, others] = splitProps(props, ["variant", "class", "children"]);

  return (
    <button
      class={`btn ${local.variant || "primary"} ${local.class || ""}`}
      {...others}
    >
      {local.children}
    </button>
  );
}
"#;
    let mut file = fs::File::create(project_path.join("src/components/Button.tsx"))?;
    file.write_all(button.as_bytes())?;
    files_created += 1;
    
    // App CSS
    let app_css = r#":root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: #213547;
  background-color: #ffffff;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

nav {
  display: flex;
  gap: 1rem;
  padding: 1rem 2rem;
  background: #f0f0f0;
}

nav a {
  text-decoration: none;
  color: #333;
  font-weight: 500;
}

nav a:hover {
  color: #2c4f7c;
}

main {
  flex: 1;
  padding: 2rem;
}

footer {
  padding: 1rem 2rem;
  background: #f0f0f0;
  text-align: center;
}

.home {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 3rem;
  color: #2c4f7c;
  margin-bottom: 1rem;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin: 3rem 0;
}

.feature {
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn.primary {
  background: #2c4f7c;
  color: white;
}

.btn.primary:hover {
  background: #1e3a5f;
}

.btn.secondary {
  background: #f0f0f0;
  color: #333;
}
"#;
    let mut file = fs::File::create(project_path.join("src/app.css"))?;
    file.write_all(app_css.as_bytes())?;
    files_created += 1;
    
    Ok(files_created)
}

// ============================================================================
// FASTAPI STACK (FastAPI + Python + SQLAlchemy + Alembic)
// ============================================================================

fn generate_fastapi_stack_files(project_path: &Path, _config: &ProjectConfig) -> Result<usize, std::io::Error> {
    let mut files_created = 0;
    
    // Create FastAPI directory structure
    fs::create_dir_all(project_path.join("app/api/routes"))?;
    fs::create_dir_all(project_path.join("app/models"))?;
    fs::create_dir_all(project_path.join("app/schemas"))?;
    fs::create_dir_all(project_path.join("app/core"))?;
    fs::create_dir_all(project_path.join("tests"))?;
    fs::create_dir_all(project_path.join("alembic/versions"))?;
    files_created += 6;
    
    // Main application entry
    let main = r#"from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import users, posts
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(posts.router, prefix=f"{settings.API_V1_STR}/posts", tags=["posts"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to FastAPI",
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health")
async def health_check():
    return {"status": "ok"}
"#;
    let mut file = fs::File::create(project_path.join("app/main.py"))?;
    file.write_all(main.as_bytes())?;
    files_created += 1;
    
    // Config
    let config = r#"from typing import List
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl


class Settings(BaseSettings):
    PROJECT_NAME: str = "FastAPI App"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/dbname"
    
    # CORS
    ALLOWED_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]
    
    # Security
    SECRET_KEY: str = "change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"


settings = Settings()
"#;
    let mut file = fs::File::create(project_path.join("app/core/config.py"))?;
    file.write_all(config.as_bytes())?;
    files_created += 1;
    
    // Database setup
    let database = r#"from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
"#;
    let mut file = fs::File::create(project_path.join("app/core/database.py"))?;
    file.write_all(database.as_bytes())?;
    files_created += 1;
    
    // User model
    let user_model = r#"from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    posts = relationship("Post", back_populates="author")
"#;
    let mut file = fs::File::create(project_path.join("app/models/user.py"))?;
    file.write_all(user_model.as_bytes())?;
    files_created += 1;
    
    // Post model
    let post_model = r#"from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    content = Column(Text)
    published = Column(Boolean, default=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    author = relationship("User", back_populates="posts")
"#;
    let mut file = fs::File::create(project_path.join("app/models/post.py"))?;
    file.write_all(post_model.as_bytes())?;
    files_created += 1;
    
    // User schemas
    let user_schemas = r#"from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
"#;
    let mut file = fs::File::create(project_path.join("app/schemas/user.py"))?;
    file.write_all(user_schemas.as_bytes())?;
    files_created += 1;
    
    // Post schemas
    let post_schemas = r#"from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PostBase(BaseModel):
    title: str
    content: Optional[str] = None
    published: bool = False


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    published: Optional[bool] = None


class Post(PostBase):
    id: int
    author_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
"#;
    let mut file = fs::File::create(project_path.join("app/schemas/post.py"))?;
    file.write_all(post_schemas.as_bytes())?;
    files_created += 1;
    
    // Users router
    let users_router = r#"from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate

router = APIRouter()


@router.get("/", response_model=List[UserSchema])
async def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all users"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserSchema)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create new user"""
    # Check if user exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user (hash password in production!)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=user.password,  # TODO: Hash password
        full_name=user.full_name,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.put("/{user_id}", response_model=UserSchema)
async def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    """Update user"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete user"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(db_user)
    db.commit()
    return None
"#;
    let mut file = fs::File::create(project_path.join("app/api/routes/users.py"))?;
    file.write_all(users_router.as_bytes())?;
    files_created += 1;
    
    // Posts router
    let posts_router = r#"from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.post import Post
from app.schemas.post import Post as PostSchema, PostCreate, PostUpdate

router = APIRouter()


@router.get("/", response_model=List[PostSchema])
async def get_posts(
    skip: int = 0,
    limit: int = 100,
    published_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get all posts"""
    query = db.query(Post)
    if published_only:
        query = query.filter(Post.published == True)
    posts = query.offset(skip).limit(limit).all()
    return posts


@router.get("/{post_id}", response_model=PostSchema)
async def get_post(post_id: int, db: Session = Depends(get_db)):
    """Get post by ID"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.post("/", response_model=PostSchema, status_code=status.HTTP_201_CREATED)
async def create_post(post: PostCreate, author_id: int = 1, db: Session = Depends(get_db)):
    """Create new post"""
    db_post = Post(**post.model_dump(), author_id=author_id)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post


@router.put("/{post_id}", response_model=PostSchema)
async def update_post(post_id: int, post: PostUpdate, db: Session = Depends(get_db)):
    """Update post"""
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    update_data = post.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_post, field, value)
    
    db.commit()
    db.refresh(db_post)
    return db_post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: int, db: Session = Depends(get_db)):
    """Delete post"""
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    db.delete(db_post)
    db.commit()
    return None
"#;
    let mut file = fs::File::create(project_path.join("app/api/routes/posts.py"))?;
    file.write_all(posts_router.as_bytes())?;
    files_created += 1;
    
    // Requirements.txt
    let requirements = r#"fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
alembic==1.13.1
pydantic==2.5.3
pydantic-settings==2.1.0
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0
psycopg2-binary==2.9.9
"#;
    let mut file = fs::File::create(project_path.join("requirements.txt"))?;
    file.write_all(requirements.as_bytes())?;
    files_created += 1;
    
    // Alembic config
    let alembic_ini = r#"[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
"#;
    let mut file = fs::File::create(project_path.join("alembic.ini"))?;
    file.write_all(alembic_ini.as_bytes())?;
    files_created += 1;
    
    // Alembic env.py
    let alembic_env = r#"from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.core.config import settings
from app.core.database import Base
from app.models.user import User
from app.models.post import Post

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
"#;
    let mut file = fs::File::create(project_path.join("alembic/env.py"))?;
    file.write_all(alembic_env.as_bytes())?;
    files_created += 1;
    
    // Test example
    let test_main = r#"from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
"#;
    let mut file = fs::File::create(project_path.join("tests/test_main.py"))?;
    file.write_all(test_main.as_bytes())?;
    files_created += 1;
    
    // __init__ files
    fs::File::create(project_path.join("app/__init__.py"))?;
    fs::File::create(project_path.join("app/api/__init__.py"))?;
    fs::File::create(project_path.join("app/api/routes/__init__.py"))?;
    fs::File::create(project_path.join("app/models/__init__.py"))?;
    fs::File::create(project_path.join("app/schemas/__init__.py"))?;
    fs::File::create(project_path.join("app/core/__init__.py"))?;
    fs::File::create(project_path.join("tests/__init__.py"))?;
    files_created += 7;
    
    Ok(files_created)
}

// ============================================================================
// REACT NATIVE + EXPO STACK
// ============================================================================

fn generate_react_native_expo_files(project_path: &Path, config: &ProjectConfig) -> Result<usize, std::io::Error> {
    let mut files_created = 0;
    
    // Create React Native directory structure
    fs::create_dir_all(project_path.join("app"))?;
    fs::create_dir_all(project_path.join("app/(tabs)"))?;
    fs::create_dir_all(project_path.join("components"))?;
    fs::create_dir_all(project_path.join("constants"))?;
    fs::create_dir_all(project_path.join("hooks"))?;
    fs::create_dir_all(project_path.join("assets/images"))?;
    files_created += 6;
    
    // package.json
    let package_json = format!(r#"{{
  "name": "{}",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {{
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest",
    "lint": "eslint ."
  }},
  "dependencies": {{
    "expo": "~50.0.0",
    "expo-router": "~3.4.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "@react-navigation/native": "^6.1.9",
    "react-native-safe-area-context": "4.8.2",
    "react-native-screens": "~3.29.0",
    "expo-status-bar": "~1.11.1",
    "nativewind": "^4.0.1"
  }},
  "devDependencies": {{
    "@babel/core": "^7.23.0",
    "@types/react": "~18.2.45",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "eslint": "^8.56.0"
  }},
  "private": true
}}
"#, config.name);
    let mut file = fs::File::create(project_path.join("package.json"))?;
    file.write_all(package_json.as_bytes())?;
    files_created += 1;
    
    // app.json (Expo config)
    let app_json = format!(r##"{{
  "expo": {{
    "name": "{}",
    "slug": "{}",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "splash": {{
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    }},
    "ios": {{
      "supportsTablet": true,
      "bundleIdentifier": "com.{}.app"
    }},
    "android": {{
      "adaptiveIcon": {{
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }},
      "package": "com.{}.app"
    }},
    "web": {{
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    }},
    "plugins": [
      "expo-router"
    ],
    "experiments": {{
      "typedRoutes": true
    }}
  }}
}}
"##, config.name, config.name, config.name, config.name);
    let mut file = fs::File::create(project_path.join("app.json"))?;
    file.write_all(app_json.as_bytes())?;
    files_created += 1;
    
    // tsconfig.json
    let tsconfig = r#"{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
"#;
    let mut file = fs::File::create(project_path.join("tsconfig.json"))?;
    file.write_all(tsconfig.as_bytes())?;
    files_created += 1;
    
    // tailwind.config.js
    let tailwind_config = r#"/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
"#;
    let mut file = fs::File::create(project_path.join("tailwind.config.js"))?;
    file.write_all(tailwind_config.as_bytes())?;
    files_created += 1;
    
    // app/_layout.tsx (Root layout)
    let app_layout = r#"import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
"#;
    let mut file = fs::File::create(project_path.join("app/_layout.tsx"))?;
    file.write_all(app_layout.as_bytes())?;
    files_created += 1;
    
    // app/(tabs)/_layout.tsx
    let tabs_layout = r#"import { Tabs } from 'expo-router';
import { TabBarIcon } from '@/components/TabBarIcon';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} />,
        }}
      />
    </Tabs>
  );
}
"#;
    let mut file = fs::File::create(project_path.join("app/(tabs)/_layout.tsx"))?;
    file.write_all(tabs_layout.as_bytes())?;
    files_created += 1;
    
    // app/(tabs)/index.tsx
    let index_tsx = format!(r#"import {{ View, Text, StyleSheet }} from 'react-native';

export default function HomeScreen() {{
  return (
    <View style={{styles.container}}>
      <Text style={{styles.title}}>Welcome to {}</Text>
      <Text style={{styles.subtitle}}>Built with React Native + Expo</Text>
    </View>
  );
}}

const styles = StyleSheet.create({{
  container: {{
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  }},
  title: {{
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  }},
  subtitle: {{
    fontSize: 16,
    color: '#666',
  }},
}});
"#, config.name);
    let mut file = fs::File::create(project_path.join("app/(tabs)/index.tsx"))?;
    file.write_all(index_tsx.as_bytes())?;
    files_created += 1;
    
    // app/(tabs)/explore.tsx
    let explore_tsx = r#"import { View, Text, StyleSheet } from 'react-native';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.subtitle}>Discover amazing content</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
"#;
    let mut file = fs::File::create(project_path.join("app/(tabs)/explore.tsx"))?;
    file.write_all(explore_tsx.as_bytes())?;
    files_created += 1;
    
    // components/TabBarIcon.tsx
    let tab_bar_icon = r#"import { MaterialIcons } from '@expo/vector-icons';

type TabBarIconProps = {
  name: keyof typeof MaterialIcons.glyphMap;
  color: string;
};

export function TabBarIcon({ name, color }: TabBarIconProps) {
  return <MaterialIcons name={name} size={28} color={color} />;
}
"#;
    let mut file = fs::File::create(project_path.join("components/TabBarIcon.tsx"))?;
    file.write_all(tab_bar_icon.as_bytes())?;
    files_created += 1;
    
    // global.css
    let global_css = r#"@tailwind base;
@tailwind components;
@tailwind utilities;
"#;
    let mut file = fs::File::create(project_path.join("global.css"))?;
    file.write_all(global_css.as_bytes())?;
    files_created += 1;
    
    // .gitignore
    let gitignore = r#"node_modules/
.expo/
dist/
npm-debug.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/

# macOS
.DS_Store

# Environment
.env
.env.local
"#;
    let mut file = fs::File::create(project_path.join(".gitignore"))?;
    file.write_all(gitignore.as_bytes())?;
    files_created += 1;
    
    Ok(files_created)
}

// ============================================================================
// DJANGO STACK
// ============================================================================

fn generate_django_stack_files(project_path: &Path, config: &ProjectConfig) -> Result<usize, std::io::Error> {
    let mut files_created = 0;
    let project_slug = config.name.replace("-", "_").replace(" ", "_").to_lowercase();
    
    // Create Django directory structure
    fs::create_dir_all(project_path.join(&project_slug))?;
    fs::create_dir_all(project_path.join("apps/core"))?;
    fs::create_dir_all(project_path.join("apps/users"))?;
    fs::create_dir_all(project_path.join("templates"))?;
    fs::create_dir_all(project_path.join("static/css"))?;
    fs::create_dir_all(project_path.join("static/js"))?;
    fs::create_dir_all(project_path.join("media"))?;
    files_created += 7;
    
    // requirements.txt
    let requirements = r#"Django==5.0.0
djangorestframework==3.14.0
python-decouple==3.8
psycopg2-binary==2.9.9
pillow==10.1.0
django-cors-headers==4.3.1
drf-yasg==1.21.7
celery==5.3.4
redis==5.0.1
gunicorn==21.2.0
whitenoise==6.6.0
"#;
    let mut file = fs::File::create(project_path.join("requirements.txt"))?;
    file.write_all(requirements.as_bytes())?;
    files_created += 1;
    
    // manage.py
    let manage_py = format!(r#"#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', '{}.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
"#, project_slug);
    let mut file = fs::File::create(project_path.join("manage.py"))?;
    file.write_all(manage_py.as_bytes())?;
    files_created += 1;
    
    // {project}/settings.py
    let settings_py = format!(r#"""
Django settings for {} project.
"""
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=lambda v: [s.strip() for s in v.split(',')])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'drf_yasg',
    'apps.core',
    'apps.users',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = '{}.urls'

TEMPLATES = [
    {{
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {{
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        }},
    }},
]

WSGI_APPLICATION = '{}.wsgi.application'

DATABASES = {{
    'default': {{
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='{}'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD', default='postgres'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }}
}}

AUTH_PASSWORD_VALIDATORS = [
    {{'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'}},
    {{'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'}},
    {{'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'}},
    {{'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'}},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS Settings
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000', cast=lambda v: [s.strip() for s in v.split(',')])

# REST Framework
REST_FRAMEWORK = {{
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}}
"#, config.name, project_slug, project_slug, project_slug);
    let mut file = fs::File::create(project_path.join(format!("{}/settings.py", project_slug)))?;
    file.write_all(settings_py.as_bytes())?;
    files_created += 1;
    
    // {project}/urls.py
    let urls_py = format!(r#"""
URL configuration for {} project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="{} API",
        default_version='v1',
        description="API documentation",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.core.urls')),
    path('api/users/', include('apps.users.urls')),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
"#, config.name, config.name);
    let mut file = fs::File::create(project_path.join(format!("{}/urls.py", project_slug)))?;
    file.write_all(urls_py.as_bytes())?;
    files_created += 1;
    
    // {project}/wsgi.py
    let wsgi_py = format!(r#"""
WSGI config for {} project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', '{}.settings')
application = get_wsgi_application()
"#, config.name, project_slug);
    let mut file = fs::File::create(project_path.join(format!("{}/wsgi.py", project_slug)))?;
    file.write_all(wsgi_py.as_bytes())?;
    files_created += 1;
    
    // {project}/__init__.py
    fs::File::create(project_path.join(format!("{}/__init__.py", project_slug)))?;
    files_created += 1;
    
    // apps/core/models.py
    let core_models = r#"from django.db import models

class Post(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='posts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
"#;
    let mut file = fs::File::create(project_path.join("apps/core/models.py"))?;
    file.write_all(core_models.as_bytes())?;
    files_created += 1;
    
    // apps/core/serializers.py
    let core_serializers = r#"from rest_framework import serializers
from .models import Post

class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.username')
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'author', 'author_name', 'created_at', 'updated_at', 'published']
        read_only_fields = ['id', 'created_at', 'updated_at']
"#;
    let mut file = fs::File::create(project_path.join("apps/core/serializers.py"))?;
    file.write_all(core_serializers.as_bytes())?;
    files_created += 1;
    
    // apps/core/views.py
    let core_views = r#"from rest_framework import viewsets, permissions
from .models import Post
from .serializers import PostSerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
"#;
    let mut file = fs::File::create(project_path.join("apps/core/views.py"))?;
    file.write_all(core_views.as_bytes())?;
    files_created += 1;
    
    // apps/core/urls.py
    let core_urls = r#"from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet

router = DefaultRouter()
router.register(r'posts', PostViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
"#;
    let mut file = fs::File::create(project_path.join("apps/core/urls.py"))?;
    file.write_all(core_urls.as_bytes())?;
    files_created += 1;
    
    // apps/core/admin.py
    let core_admin = r#"from django.contrib import admin
from .models import Post

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'published', 'created_at']
    list_filter = ['published', 'created_at']
    search_fields = ['title', 'content']
    date_hierarchy = 'created_at'
"#;
    let mut file = fs::File::create(project_path.join("apps/core/admin.py"))?;
    file.write_all(core_admin.as_bytes())?;
    files_created += 1;
    
    // __init__ files
    fs::File::create(project_path.join("apps/__init__.py"))?;
    fs::File::create(project_path.join("apps/core/__init__.py"))?;
    fs::File::create(project_path.join("apps/users/__init__.py"))?;
    files_created += 3;
    
    // .env.example
    let env_example = format!(r#"SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME={}
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:3000
"#, project_slug);
    let mut file = fs::File::create(project_path.join(".env.example"))?;
    file.write_all(env_example.as_bytes())?;
    files_created += 1;
    
    Ok(files_created)
}

// ============================================================================
// GOLANG CLOUD-NATIVE STACK
// ============================================================================

fn generate_golang_cloud_native_files(project_path: &Path, config: &ProjectConfig) -> Result<usize, std::io::Error> {
    let mut files_created = 0;
    
    // Create Go directory structure
    fs::create_dir_all(project_path.join("cmd/api"))?;
    fs::create_dir_all(project_path.join("internal/handlers"))?;
    fs::create_dir_all(project_path.join("internal/models"))?;
    fs::create_dir_all(project_path.join("internal/middleware"))?;
    fs::create_dir_all(project_path.join("pkg/database"))?;
    fs::create_dir_all(project_path.join("pkg/config"))?;
    fs::create_dir_all(project_path.join("deployments/k8s"))?;
    files_created += 7;
    
    // go.mod
    let go_mod = format!(r#"module github.com/yourusername/{}

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/joho/godotenv v1.5.1
	gorm.io/gorm v1.25.5
	gorm.io/driver/postgres v1.5.4
	github.com/golang-jwt/jwt/v5 v5.2.0
	github.com/rs/cors v1.10.1
)
"#, config.name);
    let mut file = fs::File::create(project_path.join("go.mod"))?;
    file.write_all(go_mod.as_bytes())?;
    files_created += 1;
    
    // cmd/api/main.go
    let main_go = format!(r#"package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/yourusername/{}/internal/handlers"
	"github.com/yourusername/{}/internal/middleware"
	"github.com/yourusername/{}/pkg/config"
	"github.com/yourusername/{}/pkg/database"
)

func main() {{
	// Load environment variables
	if err := godotenv.Load(); err != nil {{
		log.Println("No .env file found")
	}}

	// Initialize database
	db, err := database.Connect()
	if err != nil {{
		log.Fatal("Failed to connect to database:", err)
	}}

	// Initialize Gin router
	r := gin.Default()

	// Middleware
	r.Use(middleware.CORS())
	r.Use(middleware.Logger())

	// Health check
	r.GET("/health", func(c *gin.Context) {{
		c.JSON(200, gin.H{{"status": "healthy"}})
	}})

	// API routes
	api := r.Group("/api/v1")
	{{
		handlers.RegisterRoutes(api, db)
	}}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {{
		port = "8080"
	}}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {{
		log.Fatal("Failed to start server:", err)
	}}
}}
"#, config.name, config.name, config.name, config.name);
    let mut file = fs::File::create(project_path.join("cmd/api/main.go"))?;
    file.write_all(main_go.as_bytes())?;
    files_created += 1;
    
    // internal/handlers/handlers.go
    let handlers_go = format!(r#"package handlers

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"github.com/yourusername/{}/internal/models"
)

func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB) {{
	r.GET("/posts", GetPosts(db))
	r.POST("/posts", CreatePost(db))
	r.GET("/posts/:id", GetPost(db))
	r.PUT("/posts/:id", UpdatePost(db))
	r.DELETE("/posts/:id", DeletePost(db))
}}

func GetPosts(db *gorm.DB) gin.HandlerFunc {{
	return func(c *gin.Context) {{
		var posts []models.Post
		if err := db.Find(&posts).Error; err != nil {{
			c.JSON(500, gin.H{{"error": err.Error()}})
			return
		}}
		c.JSON(200, posts)
	}}
}}

func CreatePost(db *gorm.DB) gin.HandlerFunc {{
	return func(c *gin.Context) {{
		var post models.Post
		if err := c.ShouldBindJSON(&post); err != nil {{
			c.JSON(400, gin.H{{"error": err.Error()}})
			return
		}}
		if err := db.Create(&post).Error; err != nil {{
			c.JSON(500, gin.H{{"error": err.Error()}})
			return
		}}
		c.JSON(201, post)
	}}
}}

func GetPost(db *gorm.DB) gin.HandlerFunc {{
	return func(c *gin.Context) {{
		var post models.Post
		id := c.Param("id")
		if err := db.First(&post, id).Error; err != nil {{
			c.JSON(404, gin.H{{"error": "Post not found"}})
			return
		}}
		c.JSON(200, post)
	}}
}}

func UpdatePost(db *gorm.DB) gin.HandlerFunc {{
	return func(c *gin.Context) {{
		var post models.Post
		id := c.Param("id")
		if err := db.First(&post, id).Error; err != nil {{
			c.JSON(404, gin.H{{"error": "Post not found"}})
			return
		}}
		if err := c.ShouldBindJSON(&post); err != nil {{
			c.JSON(400, gin.H{{"error": err.Error()}})
			return
		}}
		db.Save(&post)
		c.JSON(200, post)
	}}
}}

func DeletePost(db *gorm.DB) gin.HandlerFunc {{
	return func(c *gin.Context) {{
		id := c.Param("id")
		if err := db.Delete(&models.Post{{}}, id).Error; err != nil {{
			c.JSON(500, gin.H{{"error": err.Error()}})
			return
		}}
		c.JSON(204, nil)
	}}
}}
"#, config.name);
    let mut file = fs::File::create(project_path.join("internal/handlers/handlers.go"))?;
    file.write_all(handlers_go.as_bytes())?;
    files_created += 1;
    
    // internal/models/post.go
    let models_go = r#"package models

import (
	"time"
	"gorm.io/gorm"
)

type Post struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Title     string         `json:"title" binding:"required"`
	Content   string         `json:"content" binding:"required"`
	Author    string         `json:"author" binding:"required"`
	Published bool           `json:"published"`
}
"#;
    let mut file = fs::File::create(project_path.join("internal/models/post.go"))?;
    file.write_all(models_go.as_bytes())?;
    files_created += 1;
    
    // internal/middleware/cors.go
    let cors_go = r#"package middleware

import (
	"github.com/gin-gonic/gin"
)

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
"#;
    let mut file = fs::File::create(project_path.join("internal/middleware/cors.go"))?;
    file.write_all(cors_go.as_bytes())?;
    files_created += 1;
    
    // internal/middleware/logger.go
    let logger_go = r#"package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()

		if raw != "" {
			path = path + "?" + raw
		}

		log.Printf("[%s] %d | %13v | %15s | %s",
			method,
			statusCode,
			latency,
			clientIP,
			path,
		)
	}
}
"#;
    let mut file = fs::File::create(project_path.join("internal/middleware/logger.go"))?;
    file.write_all(logger_go.as_bytes())?;
    files_created += 1;
    
    // pkg/database/database.go
    let database_go = r#"package database

import (
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connect() (*gorm.DB, error) {
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	return db, nil
}
"#;
    let mut file = fs::File::create(project_path.join("pkg/database/database.go"))?;
    file.write_all(database_go.as_bytes())?;
    files_created += 1;
    
    // Dockerfile
    let dockerfile = r#"FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/api

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]
"#;
    let mut file = fs::File::create(project_path.join("Dockerfile"))?;
    file.write_all(dockerfile.as_bytes())?;
    files_created += 1;
    
    // deployments/k8s/deployment.yaml
    let k8s_deployment = format!(r#"apiVersion: apps/v1
kind: Deployment
metadata:
  name: {}-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: {}-api
  template:
    metadata:
      labels:
        app: {}-api
    spec:
      containers:
      - name: api
        image: {}-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: PORT
          value: "8080"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: host
        - name: DB_PORT
          value: "5432"
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        - name: DB_NAME
          value: {}
---
apiVersion: v1
kind: Service
metadata:
  name: {}-api-service
spec:
  selector:
    app: {}-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
"#, config.name, config.name, config.name, config.name, config.name, config.name, config.name);
    let mut file = fs::File::create(project_path.join("deployments/k8s/deployment.yaml"))?;
    file.write_all(k8s_deployment.as_bytes())?;
    files_created += 1;
    
    // .env.example
    let env_example = format!(r#"PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME={}
"#, config.name);
    let mut file = fs::File::create(project_path.join(".env.example"))?;
    file.write_all(env_example.as_bytes())?;
    files_created += 1;
    
    Ok(files_created)
}

// ============================================================================
// LARAVEL STACK
// ============================================================================

fn generate_laravel_stack_files(project_path: &Path, config: &ProjectConfig) -> Result<usize, std::io::Error> {
    let mut files_created = 0;
    
    // Create Laravel directory structure
    fs::create_dir_all(project_path.join("app/Http/Controllers"))?;
    fs::create_dir_all(project_path.join("app/Models"))?;
    fs::create_dir_all(project_path.join("database/migrations"))?;
    fs::create_dir_all(project_path.join("database/seeders"))?;
    fs::create_dir_all(project_path.join("routes"))?;
    fs::create_dir_all(project_path.join("resources/views"))?;
    fs::create_dir_all(project_path.join("public"))?;
    fs::create_dir_all(project_path.join("config"))?;
    files_created += 8;
    
    // composer.json
    let composer_json = format!(r#"{{
    "name": "yourusername/{}",
    "type": "project",
    "description": "{}",
    "keywords": ["laravel", "framework"],
    "license": "MIT",
    "require": {{
        "php": "^8.2",
        "laravel/framework": "^10.0",
        "laravel/sanctum": "^3.3",
        "laravel/tinker": "^2.8"
    }},
    "require-dev": {{
        "fakerphp/faker": "^1.23",
        "laravel/pint": "^1.13",
        "laravel/sail": "^1.26",
        "mockery/mockery": "^1.6",
        "nunomaduro/collision": "^7.10",
        "phpunit/phpunit": "^10.5",
        "spatie/laravel-ignition": "^2.4"
    }},
    "autoload": {{
        "psr-4": {{
            "App\\\\": "app/",
            "Database\\\\Factories\\\\": "database/factories/",
            "Database\\\\Seeders\\\\": "database/seeders/"
        }}
    }},
    "autoload-dev": {{
        "psr-4": {{
            "Tests\\\\": "tests/"
        }}
    }},
    "scripts": {{
        "post-autoload-dump": [
            "Illuminate\\\\Foundation\\\\ComposerScripts::postAutoloadDump",
            "@php artisan package:discover --ansi"
        ],
        "post-update-cmd": [
            "@php artisan vendor:publish --tag=laravel-assets --ansi --force"
        ]
    }},
    "config": {{
        "optimize-autoloader": true,
        "preferred-install": "dist",
        "sort-packages": true
    }},
    "minimum-stability": "stable",
    "prefer-stable": true
}}
"#, config.name, config.description);
    let mut file = fs::File::create(project_path.join("composer.json"))?;
    file.write_all(composer_json.as_bytes())?;
    files_created += 1;
    
    // artisan
    let artisan = r#"#!/usr/bin/env php
<?php

define('LARAVEL_START', microtime(true));

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$status = $kernel->handle(
    $input = new Symfony\Component\Console\Input\ArgvInput,
    new Symfony\Component\Console\Output\ConsoleOutput
);

$kernel->terminate($input, $status);

exit($status);
"#;
    let mut file = fs::File::create(project_path.join("artisan"))?;
    file.write_all(artisan.as_bytes())?;
    files_created += 1;
    
    // routes/web.php
    let routes_web = r#"<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});
"#;
    let mut file = fs::File::create(project_path.join("routes/web.php"))?;
    file.write_all(routes_web.as_bytes())?;
    files_created += 1;
    
    // routes/api.php
    let routes_api = r#"<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PostController;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::apiResource('posts', PostController::class);
"#;
    let mut file = fs::File::create(project_path.join("routes/api.php"))?;
    file.write_all(routes_api.as_bytes())?;
    files_created += 1;
    
    // app/Models/Post.php
    let post_model = r#"<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'content',
        'author',
        'published',
    ];

    protected $casts = [
        'published' => 'boolean',
    ];
}
"#;
    let mut file = fs::File::create(project_path.join("app/Models/Post.php"))?;
    file.write_all(post_model.as_bytes())?;
    files_created += 1;
    
    // app/Http/Controllers/PostController.php
    let post_controller = r#"<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PostController extends Controller
{
    public function index(): JsonResponse
    {
        $posts = Post::all();
        return response()->json($posts);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'author' => 'required|string|max:255',
            'published' => 'boolean',
        ]);

        $post = Post::create($validated);
        return response()->json($post, 201);
    }

    public function show(Post $post): JsonResponse
    {
        return response()->json($post);
    }

    public function update(Request $request, Post $post): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'string|max:255',
            'content' => 'string',
            'author' => 'string|max:255',
            'published' => 'boolean',
        ]);

        $post->update($validated);
        return response()->json($post);
    }

    public function destroy(Post $post): JsonResponse
    {
        $post->delete();
        return response()->json(null, 204);
    }
}
"#;
    let mut file = fs::File::create(project_path.join("app/Http/Controllers/PostController.php"))?;
    file.write_all(post_controller.as_bytes())?;
    files_created += 1;
    
    // database/migrations/create_posts_table.php
    let migration = r#"<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->string('author');
            $table->boolean('published')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
"#;
    let mut file = fs::File::create(project_path.join("database/migrations/2024_01_01_000000_create_posts_table.php"))?;
    file.write_all(migration.as_bytes())?;
    files_created += 1;
    
    // resources/views/welcome.blade.php
    let welcome_view = format!(r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
    <div class="min-h-screen flex items-center justify-center">
        <div class="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-lg">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">{}</h1>
            <p class="text-gray-600 mb-6">{}</p>
            <div class="flex gap-4">
                <a href="/api/posts" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    API Documentation
                </a>
                <a href="{{{{ url('/') }}}}" class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                    Get Started
                </a>
            </div>
        </div>
    </div>
</body>
</html>
"#, config.name, config.name, config.description);
    let mut file = fs::File::create(project_path.join("resources/views/welcome.blade.php"))?;
    file.write_all(welcome_view.as_bytes())?;
    files_created += 1;
    
    // .env.example
    let env_example = format!(r#"APP_NAME={}
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE={}
DB_USERNAME=root
DB_PASSWORD=

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120
"#, config.name, config.name);
    let mut file = fs::File::create(project_path.join(".env.example"))?;
    file.write_all(env_example.as_bytes())?;
    files_created += 1;
    
    // public/index.php
    let index_php = r#"<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Kernel::class);

$response = $kernel->handle(
    $request = Request::capture()
)->send();

$kernel->terminate($request, $response);
"#;
    let mut file = fs::File::create(project_path.join("public/index.php"))?;
    file.write_all(index_php.as_bytes())?;
    files_created += 1;
    
    Ok(files_created)
}
