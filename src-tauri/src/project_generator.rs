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
        id if id.contains("nextjs") => {
            r#"    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest""#.to_string()
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
        id if id.contains("nextjs") => {
            r#"    "next": "^14.0.0",
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
        r#"    "typescript": "^5.0.0""#,
        r#"    "@types/node": "^20.0.0""#,
        r#"    "vitest": "^1.0.0""#,
    ];
    
    if stack_id.contains("nextjs") {
        deps.push(r#"    "@types/react": "^18.2.0""#);
        deps.push(r#"    "@types/react-dom": "^18.2.0""#);
        deps.push(r#"    "eslint": "^8.0.0""#);
        deps.push(r#"    "eslint-config-next": "^14.0.0""#);
    }
    
    if stack_id.contains("sveltekit") {
        deps.push(r#"    "@sveltejs/adapter-auto": "^3.0.0""#);
        deps.push(r#"    "svelte-check": "^3.6.0""#);
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
