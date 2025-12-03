/**
 * Dev-Container Template Utilities
 * Phase 2.7.4: Dev-Container Templates
 *
 * Provides functions for managing and generating dev-container configurations
 */

export interface DevContainerTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  languages: string[];
  tools: string[];
  useCases: string[];
  complexity: 'simple' | 'moderate' | 'complex' | 'beginner' | 'intermediate' | 'advanced';
  templatePath: string;
}

export const DEVCONTAINER_TEMPLATES: DevContainerTemplate[] = [
  {
    id: 'base',
    name: 'Base Development',
    description: 'Node.js, Python, and Rust development environment',
    icon: '🛠️',
    languages: ['JavaScript', 'TypeScript', 'Python', 'Rust'],
    tools: ['Git', 'Docker', 'pnpm', 'pip', 'cargo'],
    useCases: ['Full-stack web apps', 'API development', 'General purpose'],
    complexity: 'simple',
    templatePath: '/src/lib/templates/devcontainer/base.json',
  },
  {
    id: 'fullstack',
    name: 'Full-Stack Pro',
    description: 'Complete development environment with all major languages',
    icon: '🚀',
    languages: ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java'],
    tools: ['Git', 'Docker', 'Kubernetes', 'pnpm', 'pip', 'poetry', 'cargo', 'gradle'],
    useCases: ['Enterprise applications', 'Microservices', 'Multi-language projects'],
    complexity: 'complex',
    templatePath: '/src/lib/templates/devcontainer/fullstack.json',
  },
  {
    id: 'mobile',
    name: 'Mobile Development',
    description: 'Flutter and Android SDK for mobile app development',
    icon: '📱',
    languages: ['Dart', 'Kotlin', 'Java'],
    tools: ['Flutter SDK', 'Android SDK', 'Git', 'Gradle'],
    useCases: ['Mobile apps', 'Cross-platform development', 'Android development'],
    complexity: 'complex',
    templatePath: '/src/lib/templates/devcontainer/mobile.json',
  },
  {
    id: 'sveltekit',
    name: 'SvelteKit',
    description: 'Optimized for SvelteKit and modern frontend development',
    icon: '🎨',
    languages: ['JavaScript', 'TypeScript', 'Svelte'],
    tools: ['Git', 'pnpm', 'Vite', 'ESLint', 'Prettier'],
    useCases: ['SvelteKit projects', 'Frontend applications', 'Static sites'],
    complexity: 'simple',
    templatePath: '/src/lib/templates/devcontainer/sveltekit.json',
  },
  {
    id: 'fastapi',
    name: 'FastAPI',
    description: 'Python FastAPI backend development with SQLAlchemy',
    icon: '⚡',
    languages: ['Python'],
    tools: ['Git', 'pip', 'poetry', 'uvicorn', 'SQLAlchemy', 'Alembic'],
    useCases: ['REST APIs', 'Backend services', 'Microservices'],
    complexity: 'moderate',
    templatePath: '/src/lib/templates/devcontainer/fastapi.json',
  },
];

/**
 * Get all available devcontainer templates
 */
export function getAllTemplates(): DevContainerTemplate[] {
  return DEVCONTAINER_TEMPLATES;
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): DevContainerTemplate | undefined {
  return DEVCONTAINER_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates suitable for a given language
 */
export function getTemplatesForLanguage(language: string): DevContainerTemplate[] {
  return DEVCONTAINER_TEMPLATES.filter(t =>
    t.languages.some(lang => lang.toLowerCase().includes(language.toLowerCase()))
  );
}

/**
 * Get templates by complexity
 */
export function getTemplatesByComplexity(
  complexity: 'simple' | 'moderate' | 'complex'
): DevContainerTemplate[] {
  return DEVCONTAINER_TEMPLATES.filter(t => t.complexity === complexity);
}

/**
 * Load template JSON content
 */
export async function loadTemplate(templateId: string): Promise<object | null> {
  const template = getTemplateById(templateId);
  if (!template) {
    console.error(`Template not found: ${templateId}`);
    return null;
  }

  try {
    // In production, this would fetch from the file system via Tauri
    // For now, we'll return a placeholder
    const response = await fetch(template.templatePath);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading template ${templateId}:`, error);
    return null;
  }
}

/**
 * Generate devcontainer.json content for a project
 */
export async function generateDevContainer(
  templateId: string,
  projectName?: string
): Promise<string | null> {
  const templateContent = await loadTemplate(templateId);
  if (!templateContent) {
    return null;
  }

  // Customize the template if needed
  if (projectName && typeof templateContent === 'object' && 'name' in templateContent) {
    (templateContent as { name: string }).name = `${projectName} Dev Container`;
  }

  return JSON.stringify(templateContent, null, 2);
}

/**
 * Get recommended template based on project configuration
 */
export function getRecommendedTemplate(config: {
  primaryLanguage?: string;
  stack?: string;
  additionalLanguages?: string[];
}): DevContainerTemplate | null {
  const { primaryLanguage, stack, additionalLanguages = [] } = config;

  // Mobile projects
  if (
    primaryLanguage === 'dart' ||
    primaryLanguage === 'kotlin' ||
    primaryLanguage === 'swift'
  ) {
    return getTemplateById('mobile') || null;
  }

  // SvelteKit projects
  if (stack === 'sveltekit' || stack === 'svelte') {
    return getTemplateById('sveltekit') || null;
  }

  // FastAPI projects
  if (stack === 'fastapi') {
    return getTemplateById('fastapi') || null;
  }

  // Multiple languages → full-stack
  if (additionalLanguages.length >= 2) {
    return getTemplateById('fullstack') || null;
  }

  // Default to base template
  return getTemplateById('base') || null;
}

/**
 * Format template for display
 */
export function formatTemplateInfo(template: DevContainerTemplate): string {
  return `${template.icon} ${template.name}

${template.description}

**Languages**: ${template.languages.join(', ')}
**Tools**: ${template.tools.join(', ')}
**Best for**: ${template.useCases.join(', ')}
**Complexity**: ${template.complexity}`;
}
