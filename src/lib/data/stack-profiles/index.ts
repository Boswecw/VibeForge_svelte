/**
 * Stack Profile Definitions
 *
 * Curated collection of the 10 most popular development stacks in 2025.
 * Each profile includes comprehensive metadata, technology details, and real-world guidance.
 */

import type { StackProfile } from "$lib/core/types/stack-profiles";

// Import all stack profile JSON files
import t3StackData from "./t3-stack.json";
import mernStackData from "./mern-stack.json";
import nextjsFullstackData from "./nextjs-fullstack.json";
import djangoStackData from "./django-stack.json";
import fastapiAiStackData from "./fastapi-ai-stack.json";
import laravelStackData from "./laravel-stack.json";
import reactNativeExpoData from "./react-native-expo.json";
import golangCloudNativeData from "./golang-cloud-native.json";
import sveltekitStackData from "./sveltekit-stack.json";
import solidstartStackData from "./solidstart-stack.json";

/**
 * All available stack profiles, indexed by ID
 */
export const STACK_PROFILES: Record<string, StackProfile> = {
  "t3-stack": t3StackData as StackProfile,
  "mern-stack": mernStackData as StackProfile,
  "nextjs-fullstack": nextjsFullstackData as StackProfile,
  "django-stack": djangoStackData as StackProfile,
  "fastapi-ai-stack": fastapiAiStackData as StackProfile,
  "laravel-stack": laravelStackData as StackProfile,
  "react-native-expo": reactNativeExpoData as StackProfile,
  "golang-cloud-native": golangCloudNativeData as StackProfile,
  "sveltekit-stack": sveltekitStackData as StackProfile,
  "solidstart-stack": solidstartStackData as StackProfile,
};

/**
 * Array of all stack profiles for iteration
 */
export const ALL_STACKS: StackProfile[] = Object.values(STACK_PROFILES);

/**
 * Get stack profile by ID
 */
export function getStackProfile(id: string): StackProfile | undefined {
  return STACK_PROFILES[id];
}

/**
 * Get stacks by category
 */
export function getStacksByCategory(category: string): StackProfile[] {
  return ALL_STACKS.filter((stack) => stack.category === category);
}

/**
 * Get stacks by popularity (sorted descending)
 */
export function getPopularStacks(limit?: number): StackProfile[] {
  const sorted = [...ALL_STACKS].sort((a, b) => b.popularity - a.popularity);
  return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * Search stacks by name, description, or features
 */
export function searchStacks(query: string): StackProfile[] {
  const lowerQuery = query.toLowerCase();
  return ALL_STACKS.filter(
    (stack) =>
      stack.name.toLowerCase().includes(lowerQuery) ||
      stack.displayName.toLowerCase().includes(lowerQuery) ||
      stack.description.toLowerCase().includes(lowerQuery) ||
      (stack.tagline && stack.tagline.toLowerCase().includes(lowerQuery)) ||
      stack.features.some((feature) =>
        feature.toLowerCase().includes(lowerQuery)
      )
  );
}

/**
 * Filter stacks by complexity level
 */
export function getStacksByComplexity(complexity: string): StackProfile[] {
  return ALL_STACKS.filter(
    (stack) => stack.requirements.complexity === complexity
  );
}

/**
 * Get recommended stacks based on project requirements
 */
export function getRecommendedStacks(requirements: {
  category?: string;
  complexity?: string;
  timeToMarket?: string;
  scalability?: string;
  budget?: string;
}): StackProfile[] {
  return ALL_STACKS.filter((stack) => {
    if (requirements.category && stack.category !== requirements.category)
      return false;
    if (
      requirements.complexity &&
      stack.requirements.complexity !== requirements.complexity
    )
      return false;
    if (
      requirements.timeToMarket &&
      stack.requirements.timeToMarket !== requirements.timeToMarket
    )
      return false;
    if (
      requirements.scalability &&
      stack.requirements.scalability !== requirements.scalability
    )
      return false;
    if (
      requirements.budget &&
      stack.requirements.budget !== requirements.budget
    )
      return false;
    return true;
  });
}

/**
 * Stack categories for filtering
 */
export const STACK_CATEGORIES = [
  { id: "web", name: "Web Development", icon: "🌐" },
  { id: "mobile", name: "Mobile Development", icon: "📱" },
  { id: "api", name: "API Development", icon: "⚡" },
  { id: "ai", name: "AI/ML Development", icon: "🤖" },
] as const;

/**
 * Complexity levels
 */
export const COMPLEXITY_LEVELS = [
  {
    id: "beginner",
    name: "Beginner",
    description: "Easy to learn, great for new developers",
  },
  {
    id: "intermediate",
    name: "Intermediate",
    description: "Some experience required",
  },
  {
    id: "advanced",
    name: "Advanced",
    description: "Requires expertise and experience",
  },
] as const;
