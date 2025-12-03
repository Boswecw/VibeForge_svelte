/**
 * Dev-Container Template Generator
 *
 * Generates devcontainer.json and Dockerfile configurations
 * for projects requiring container-based development environments.
 */

export interface DevContainerConfig {
  name: string;
  image?: string;
  dockerFile?: string;
  features?: Record<string, string | boolean | Record<string, any>>;
  customizations?: {
    vscode?: {
      extensions?: string[];
      settings?: Record<string, any>;
    };
  };
  forwardPorts?: number[];
  postCreateCommand?: string;
  remoteUser?: string;
}

export interface DevContainerTemplate {
  name: string;
  description: string;
  languages: string[];
  devcontainerConfig: DevContainerConfig;
  dockerfile?: string;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  useCases?: string[];
}

/**
 * Base Container Template
 * Node.js + Python + Rust - covers most web development scenarios
 */
export const BASE_CONTAINER: DevContainerTemplate = {
  name: "Base Development Container",
  description:
    "Node.js 20 + Python 3.11 + Rust - General purpose web development",
  languages: ["javascript-typescript", "python", "rust"],
  devcontainerConfig: {
    name: "VibeForge Base Container",
    image: "mcr.microsoft.com/devcontainers/typescript-node:20-bookworm",
    features: {
      "ghcr.io/devcontainers/features/python:1": {
        version: "3.11",
        installTools: true,
      },
      "ghcr.io/devcontainers/features/rust:1": {
        version: "latest",
        profile: "minimal",
      },
      "ghcr.io/devcontainers/features/git:1": {
        version: "latest",
      },
      "ghcr.io/devcontainers/features/docker-in-docker:2": {
        version: "latest",
      },
    },
    customizations: {
      vscode: {
        extensions: [
          "dbaeumer.vscode-eslint",
          "esbenp.prettier-vscode",
          "ms-python.python",
          "ms-python.vscode-pylance",
          "rust-lang.rust-analyzer",
          "bradlc.vscode-tailwindcss",
        ],
        settings: {
          "editor.formatOnSave": true,
          "editor.defaultFormatter": "esbenp.prettier-vscode",
          "[python]": {
            "editor.defaultFormatter": "ms-python.python",
          },
        },
      },
    },
    forwardPorts: [3000, 5173, 8000, 8001],
    postCreateCommand: "npm install -g pnpm && pip install --upgrade pip",
    remoteUser: "node",
  },
};

/**
 * Mobile Container Template
 * Flutter + Android SDK - for mobile app development
 */
export const MOBILE_CONTAINER: DevContainerTemplate = {
  name: "Mobile Development Container",
  description:
    "Flutter + Android SDK + Dart - Mobile app development (Android/iOS)",
  languages: ["dart", "kotlin", "swift"],
  devcontainerConfig: {
    name: "VibeForge Mobile Container",
    image: "cirrusci/flutter:stable",
    features: {
      "ghcr.io/devcontainers/features/java:1": {
        version: "17",
        installGradle: true,
      },
      "ghcr.io/devcontainers/features/node:1": {
        version: "20",
      },
      "ghcr.io/devcontainers/features/git:1": {
        version: "latest",
      },
    },
    customizations: {
      vscode: {
        extensions: [
          "dart-code.dart-code",
          "dart-code.flutter",
          "fwcd.kotlin",
          "swift.swift-lang",
        ],
        settings: {
          "dart.flutterSdkPath": "/sdks/flutter",
          "dart.debugExtensionBackendProtocol": "ws",
        },
      },
    },
    forwardPorts: [8080, 3000],
    postCreateCommand: "flutter doctor && flutter pub get",
    remoteUser: "cirrus",
  },
  dockerfile: `FROM cirrusci/flutter:stable

# Install Android SDK components
RUN sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"

# Install additional tools
RUN apt-get update && apt-get install -y \\
    git \\
    curl \\
    unzip \\
    xz-utils \\
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=\${PATH}:\${ANDROID_HOME}/tools:\${ANDROID_HOME}/platform-tools

USER cirrus
WORKDIR /workspace
`,
};

/**
 * Full-Stack Container Template
 * All 15 languages - comprehensive development environment
 */
export const FULLSTACK_CONTAINER: DevContainerTemplate = {
  name: "Full-Stack Development Container",
  description: "All 15 languages + tools - Complete development powerhouse",
  languages: [
    "javascript-typescript",
    "python",
    "go",
    "rust",
    "java",
    "dart",
    "kotlin",
    "swift",
    "c",
    "cpp",
    "bash",
  ],
  devcontainerConfig: {
    name: "VibeForge Full-Stack Container",
    dockerFile: "Dockerfile",
    features: {
      "ghcr.io/devcontainers/features/git:1": {
        version: "latest",
      },
      "ghcr.io/devcontainers/features/docker-in-docker:2": {
        version: "latest",
      },
    },
    customizations: {
      vscode: {
        extensions: [
          "dbaeumer.vscode-eslint",
          "esbenp.prettier-vscode",
          "ms-python.python",
          "golang.go",
          "rust-lang.rust-analyzer",
          "redhat.java",
          "dart-code.flutter",
          "fwcd.kotlin",
          "swift.swift-lang",
          "ms-vscode.cpptools",
        ],
        settings: {
          "editor.formatOnSave": true,
        },
      },
    },
    forwardPorts: [3000, 5173, 8000, 8001, 8080, 9000],
    postCreateCommand:
      "npm install -g pnpm && pip install --upgrade pip && go install golang.org/x/tools/gopls@latest",
    remoteUser: "vscode",
  },
  dockerfile: `FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install base packages
RUN apt-get update && apt-get install -y \\
    build-essential \\
    curl \\
    wget \\
    git \\
    ca-certificates \\
    gnupg \\
    lsb-release \\
    sudo \\
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \\
    && apt-get install -y nodejs

# Install Python 3.11
RUN apt-get update && apt-get install -y \\
    python3.11 \\
    python3.11-dev \\
    python3-pip \\
    && rm -rf /var/lib/apt/lists/*

# Install Go
RUN wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz \\
    && tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz \\
    && rm go1.21.5.linux-amd64.tar.gz
ENV PATH=\${PATH}:/usr/local/go/bin

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:\${PATH}"

# Install Java 17
RUN apt-get update && apt-get install -y \\
    openjdk-17-jdk \\
    && rm -rf /var/lib/apt/lists/*

# Install GCC/G++ (C/C++)
RUN apt-get update && apt-get install -y \\
    gcc \\
    g++ \\
    make \\
    cmake \\
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -s /bin/bash vscode \\
    && echo "vscode ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER vscode
WORKDIR /workspace

# Install user-level tools
RUN npm install -g pnpm typescript

ENV PATH="\${PATH}:/home/vscode/.local/bin"
`,
};

/**
 * Stack-specific containers for popular frameworks
 */
export const STACK_CONTAINERS: Record<string, DevContainerTemplate> = {
  "t3-stack": {
    name: "T3 Stack Container",
    description: "Next.js + tRPC + Tailwind + Prisma",
    languages: ["javascript-typescript"],
    devcontainerConfig: {
      name: "T3 Stack Development",
      image: "mcr.microsoft.com/devcontainers/typescript-node:20-bookworm",
      features: {
        "ghcr.io/devcontainers/features/docker-in-docker:2": "latest",
      },
      customizations: {
        vscode: {
          extensions: [
            "dbaeumer.vscode-eslint",
            "esbenp.prettier-vscode",
            "bradlc.vscode-tailwindcss",
            "prisma.prisma",
          ],
        },
      },
      forwardPorts: [3000],
      postCreateCommand: "npm install",
    },
  },

  mern: {
    name: "MERN Stack Container",
    description: "MongoDB + Express + React + Node.js",
    languages: ["javascript-typescript"],
    devcontainerConfig: {
      name: "MERN Stack Development",
      image: "mcr.microsoft.com/devcontainers/javascript-node:20-bookworm",
      features: {
        "ghcr.io/devcontainers/features/docker-in-docker:2": "latest",
      },
      customizations: {
        vscode: {
          extensions: [
            "dbaeumer.vscode-eslint",
            "esbenp.prettier-vscode",
            "mongodb.mongodb-vscode",
          ],
        },
      },
      forwardPorts: [3000, 5000, 27017],
      postCreateCommand: "npm install",
    },
  },

  "fastapi-ai": {
    name: "FastAPI AI Container",
    description: "Python + FastAPI + AI/ML libraries",
    languages: ["python"],
    devcontainerConfig: {
      name: "FastAPI AI Development",
      image: "mcr.microsoft.com/devcontainers/python:3.11-bookworm",
      features: {
        "ghcr.io/devcontainers/features/docker-in-docker:2": "latest",
      },
      customizations: {
        vscode: {
          extensions: [
            "ms-python.python",
            "ms-python.vscode-pylance",
            "ms-toolsai.jupyter",
          ],
        },
      },
      forwardPorts: [8000],
      postCreateCommand: "pip install -r requirements.txt",
    },
  },
};

/**
 * Generate devcontainer.json for selected languages
 */
export function generateDevContainer(
  languages: string[],
  stackId?: string
): DevContainerTemplate {
  // Check if we have a stack-specific container
  if (stackId && STACK_CONTAINERS[stackId]) {
    return STACK_CONTAINERS[stackId];
  }

  // Check for mobile languages
  const mobileLanguages = ["dart", "kotlin", "swift"];
  const hasMobile = languages.some((lang) => mobileLanguages.includes(lang));
  if (hasMobile) {
    return MOBILE_CONTAINER;
  }

  // Check if we need full-stack (5+ languages)
  if (languages.length >= 5) {
    return FULLSTACK_CONTAINER;
  }

  // Default to base container
  return BASE_CONTAINER;
}

/**
 * Generate complete devcontainer files as downloadable content
 */
export function generateDevContainerFiles(
  languages: string[],
  stackId?: string,
  projectName: string = "vibeforge-project"
): {
  "devcontainer.json": string;
  Dockerfile?: string;
  "README.md": string;
} {
  const template = generateDevContainer(languages, stackId);

  const devcontainerJson = JSON.stringify(template.devcontainerConfig, null, 2);

  const dockerfile = template.dockerfile || null;

  const readme = `# Dev-Container Setup for ${projectName}

## What is this?

This folder contains configuration for a [Development Container](https://containers.dev/), which provides a consistent, fully-configured development environment.

## Template: ${template.name}

${template.description}

**Included Languages:**
${template.languages.map((lang) => `- ${lang}`).join("\n")}

## How to Use

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
- [VS Code](https://code.visualstudio.com/) with [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Steps
1. Copy this \`.devcontainer\` folder to your project root
2. Open your project in VS Code
3. Press \`F1\` and select **"Dev Containers: Reopen in Container"**
4. Wait for the container to build (first time takes ~5-10 minutes)
5. Start coding! All tools are pre-installed

## What's Included

${
  template.devcontainerConfig.features
    ? Object.keys(template.devcontainerConfig.features)
        .map((feature) => `- ${feature.split("/").pop()}`)
        .join("\n")
    : "- All required language runtimes and tools"
}

## VS Code Extensions

The following extensions will be automatically installed:
${
  template.devcontainerConfig.customizations?.vscode?.extensions
    ?.map((ext) => `- ${ext}`)
    .join("\n") || "- No extensions specified"
}

## Troubleshooting

**Container won't build?**
- Make sure Docker Desktop is running
- Try: Dev Containers: Rebuild Container

**Need to add more tools?**
- Edit \`.devcontainer/devcontainer.json\`
- Add features from https://containers.dev/features

---

Generated by VibeForge Phase 2.7 - Dev Environment System
`;

  const files: {
    "devcontainer.json": string;
    Dockerfile?: string;
    "README.md": string;
  } = {
    "devcontainer.json": devcontainerJson,
    "README.md": readme,
  };

  if (dockerfile) {
    files["Dockerfile"] = dockerfile;
  }

  return files;
}

/**
 * Create a downloadable .zip file (requires JSZip or similar library)
 */
export function createDownloadableZip(files: Record<string, string>): Blob {
  // Create a simple text-based zip representation
  // In production, use JSZip library for proper zip files
  const content = Object.entries(files)
    .map(([filename, content]) => {
      return `=== FILE: ${filename} ===\n${content}\n\n`;
    })
    .join("\n");

  return new Blob([content], { type: "text/plain" });
}
