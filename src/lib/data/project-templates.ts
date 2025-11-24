/**
 * Project Template Definitions
 *
 * Pre-configured templates for common project types to speed up
 * the wizard flow and provide smart defaults.
 */

import type { StackCategory } from "$lib/core/types/stack-profiles";

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: StackCategory;

  // Pre-filled wizard values
  recommendedLanguages: string[];
  recommendedStack: string;
  teamSize: "solo" | "small" | "medium" | "large";
  timeline: "sprint" | "month" | "quarter" | "long-term";

  // Metadata
  complexity: "beginner" | "intermediate" | "advanced";
  features: string[];
  estimatedSetupTime: string;
  useCases: string[];
  popularityScore: number;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "blog-cms",
    name: "Blog & Content Site",
    description:
      "Modern blog or content management system with markdown support, SEO optimization, and admin dashboard",
    icon: "📝",
    category: "web",
    recommendedLanguages: ["JavaScript/TypeScript", "Python"],
    recommendedStack: "nextjs-fullstack",
    teamSize: "solo",
    timeline: "sprint",
    complexity: "beginner",
    features: [
      "Markdown content",
      "SEO optimization",
      "Admin dashboard",
      "Comment system",
      "Analytics integration",
    ],
    estimatedSetupTime: "2-3 hours",
    useCases: [
      "Personal blog",
      "Company blog",
      "Documentation site",
      "News portal",
    ],
    popularityScore: 95,
  },

  {
    id: "ecommerce",
    name: "E-commerce Store",
    description:
      "Full-featured online store with product catalog, shopping cart, payment integration, and order management",
    icon: "🛒",
    category: "web",
    recommendedLanguages: ["JavaScript/TypeScript", "Python"],
    recommendedStack: "nextjs-fullstack",
    teamSize: "small",
    timeline: "quarter",
    complexity: "advanced",
    features: [
      "Product catalog",
      "Shopping cart",
      "Payment processing",
      "Order management",
      "Inventory tracking",
      "Customer accounts",
    ],
    estimatedSetupTime: "4-6 hours",
    useCases: [
      "Online store",
      "Marketplace",
      "Digital products",
      "Subscription service",
    ],
    popularityScore: 88,
  },

  {
    id: "portfolio",
    name: "Portfolio & Resume",
    description:
      "Personal portfolio website with project showcase, resume section, and contact form",
    icon: "💼",
    category: "web",
    recommendedLanguages: ["JavaScript/TypeScript"],
    recommendedStack: "sveltekit-stack",
    teamSize: "solo",
    timeline: "sprint",
    complexity: "beginner",
    features: [
      "Project showcase",
      "Resume/CV section",
      "Contact form",
      "Blog integration",
      "Dark mode",
    ],
    estimatedSetupTime: "1-2 hours",
    useCases: [
      "Personal website",
      "Professional portfolio",
      "Creative showcase",
      "Job application",
    ],
    popularityScore: 92,
  },

  {
    id: "saas-app",
    name: "SaaS Application",
    description:
      "Multi-tenant SaaS platform with user authentication, subscription billing, and admin dashboard",
    icon: "🚀",
    category: "web",
    recommendedLanguages: ["JavaScript/TypeScript", "Python"],
    recommendedStack: "t3-stack",
    teamSize: "medium",
    timeline: "long-term",
    complexity: "advanced",
    features: [
      "User authentication",
      "Subscription billing",
      "Multi-tenancy",
      "Admin dashboard",
      "API access",
      "Team collaboration",
    ],
    estimatedSetupTime: "6-8 hours",
    useCases: [
      "SaaS product",
      "B2B platform",
      "Team collaboration tool",
      "Business software",
    ],
    popularityScore: 85,
  },

  {
    id: "rest-api",
    name: "REST API Service",
    description:
      "Production-ready REST API with authentication, database integration, and comprehensive documentation",
    icon: "⚡",
    category: "api",
    recommendedLanguages: ["Python", "Go"],
    recommendedStack: "fastapi-ai-stack",
    teamSize: "small",
    timeline: "month",
    complexity: "intermediate",
    features: [
      "RESTful endpoints",
      "JWT authentication",
      "Database ORM",
      "API documentation",
      "Rate limiting",
      "CORS support",
    ],
    estimatedSetupTime: "3-4 hours",
    useCases: [
      "Backend API",
      "Microservice",
      "Mobile backend",
      "Integration service",
    ],
    popularityScore: 90,
  },

  {
    id: "mobile-app",
    name: "Mobile Application",
    description:
      "Cross-platform mobile app with native performance, offline support, and push notifications",
    icon: "📱",
    category: "mobile",
    recommendedLanguages: ["JavaScript/TypeScript", "Dart"],
    recommendedStack: "react-native-expo",
    teamSize: "small",
    timeline: "quarter",
    complexity: "intermediate",
    features: [
      "Cross-platform",
      "Native UI",
      "Offline support",
      "Push notifications",
      "Camera access",
      "Geolocation",
    ],
    estimatedSetupTime: "4-5 hours",
    useCases: ["Consumer app", "Business app", "Social app", "Utility app"],
    popularityScore: 87,
  },

  {
    id: "desktop-app",
    name: "Desktop Application",
    description:
      "Cross-platform desktop application with native look-and-feel and system integration",
    icon: "💻",
    category: "desktop",
    recommendedLanguages: ["Rust", "JavaScript/TypeScript"],
    recommendedStack: "sveltekit-stack",
    teamSize: "small",
    timeline: "quarter",
    complexity: "advanced",
    features: [
      "Cross-platform",
      "Native performance",
      "System integration",
      "Auto-updates",
      "File system access",
      "Tray icon",
    ],
    estimatedSetupTime: "5-6 hours",
    useCases: [
      "Productivity tool",
      "Developer tool",
      "Creative software",
      "Business application",
    ],
    popularityScore: 78,
  },

  {
    id: "ai-ml-project",
    name: "AI/ML Application",
    description:
      "Machine learning project with data processing, model training, and inference API",
    icon: "🤖",
    category: "ai",
    recommendedLanguages: ["Python", "JavaScript/TypeScript"],
    recommendedStack: "fastapi-ai-stack",
    teamSize: "small",
    timeline: "quarter",
    complexity: "advanced",
    features: [
      "Data processing",
      "Model training",
      "Inference API",
      "Web interface",
      "Experiment tracking",
      "Model versioning",
    ],
    estimatedSetupTime: "5-7 hours",
    useCases: [
      "ML model deployment",
      "Data analysis",
      "Computer vision",
      "NLP application",
    ],
    popularityScore: 83,
  },

  {
    id: "dashboard-analytics",
    name: "Dashboard & Analytics",
    description:
      "Real-time analytics dashboard with data visualization, reporting, and export capabilities",
    icon: "📊",
    category: "web",
    recommendedLanguages: ["JavaScript/TypeScript", "Python"],
    recommendedStack: "t3-stack",
    teamSize: "small",
    timeline: "month",
    complexity: "intermediate",
    features: [
      "Data visualization",
      "Real-time updates",
      "Custom reports",
      "Export to PDF/CSV",
      "User permissions",
      "Alert system",
    ],
    estimatedSetupTime: "4-5 hours",
    useCases: [
      "Business intelligence",
      "KPI tracking",
      "Admin dashboard",
      "Monitoring system",
    ],
    popularityScore: 86,
  },

  {
    id: "social-platform",
    name: "Social Platform",
    description:
      "Social networking platform with user profiles, feeds, messaging, and real-time interactions",
    icon: "👥",
    category: "web",
    recommendedLanguages: ["JavaScript/TypeScript", "Python"],
    recommendedStack: "mern-stack",
    teamSize: "medium",
    timeline: "long-term",
    complexity: "advanced",
    features: [
      "User profiles",
      "Activity feeds",
      "Real-time chat",
      "Notifications",
      "Media uploads",
      "Social graph",
    ],
    estimatedSetupTime: "7-9 hours",
    useCases: [
      "Social network",
      "Community platform",
      "Forum",
      "Team communication",
    ],
    popularityScore: 81,
  },

  {
    id: "django-web-app",
    name: "Django Web Application",
    description:
      "Full-featured Python web application with Django's batteries-included approach, admin panel, and ORM",
    icon: "🐍",
    category: "web",
    recommendedLanguages: ["Python"],
    recommendedStack: "django-stack",
    teamSize: "small",
    timeline: "month",
    complexity: "intermediate",
    features: [
      "Django admin panel",
      "ORM with migrations",
      "User authentication",
      "REST API (DRF)",
      "PostgreSQL database",
      "Template system",
    ],
    estimatedSetupTime: "3-4 hours",
    useCases: [
      "Business application",
      "Content management",
      "Internal tools",
      "API backend",
    ],
    popularityScore: 84,
  },

  {
    id: "golang-microservice",
    name: "Go Microservice",
    description:
      "High-performance cloud-native microservice with Kubernetes deployment and production-ready infrastructure",
    icon: "🐹",
    category: "api",
    recommendedLanguages: ["Go"],
    recommendedStack: "golang-cloud-native",
    teamSize: "small",
    timeline: "month",
    complexity: "advanced",
    features: [
      "Gin web framework",
      "GORM database",
      "Docker containerized",
      "Kubernetes ready",
      "RESTful API",
      "Middleware stack",
    ],
    estimatedSetupTime: "4-5 hours",
    useCases: [
      "Microservice",
      "Cloud-native API",
      "High-traffic backend",
      "Kubernetes deployment",
    ],
    popularityScore: 79,
  },

  {
    id: "laravel-app",
    name: "Laravel Application",
    description:
      "Elegant PHP web application with Laravel's expressive syntax, Eloquent ORM, and beautiful Blade templates",
    icon: "🔶",
    category: "web",
    recommendedLanguages: ["PHP"],
    recommendedStack: "laravel-stack",
    teamSize: "small",
    timeline: "month",
    complexity: "intermediate",
    features: [
      "Eloquent ORM",
      "Blade templates",
      "Laravel Sanctum auth",
      "RESTful API",
      "Artisan CLI",
      "Database migrations",
    ],
    estimatedSetupTime: "3-4 hours",
    useCases: [
      "Web application",
      "CMS system",
      "API backend",
      "E-commerce platform",
    ],
    popularityScore: 82,
  },

  {
    id: "solidjs-app",
    name: "SolidJS Application",
    description:
      "Modern reactive web app with SolidStart meta-framework, offering React-like DX with better performance",
    icon: "⚛️",
    category: "web",
    recommendedLanguages: ["JavaScript/TypeScript"],
    recommendedStack: "solidstart-stack",
    teamSize: "solo",
    timeline: "sprint",
    complexity: "intermediate",
    features: [
      "SolidStart meta-framework",
      "File-based routing",
      "Server functions",
      "Fine-grained reactivity",
      "TypeScript support",
      "Vinxi bundler",
    ],
    estimatedSetupTime: "2-3 hours",
    useCases: [
      "Modern web app",
      "Real-time dashboard",
      "Performance-critical UI",
      "SPA with SSR",
    ],
    popularityScore: 76,
  },
];

// Helper functions
export function getTemplateById(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(
  category: StackCategory
): ProjectTemplate[] {
  return PROJECT_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplatesByComplexity(
  complexity: ProjectTemplate["complexity"]
): ProjectTemplate[] {
  return PROJECT_TEMPLATES.filter((t) => t.complexity === complexity);
}

export function getPopularTemplates(limit: number = 5): ProjectTemplate[] {
  return [...PROJECT_TEMPLATES]
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, limit);
}

export function searchTemplates(query: string): ProjectTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return PROJECT_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowercaseQuery) ||
      t.description.toLowerCase().includes(lowercaseQuery) ||
      t.useCases.some((uc) => uc.toLowerCase().includes(lowercaseQuery)) ||
      t.features.some((f) => f.toLowerCase().includes(lowercaseQuery))
  );
}
