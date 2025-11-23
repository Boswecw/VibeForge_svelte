/**
 * Stack Recommendation System
 * Main exports for LLM-powered stack recommendations
 */

export { StackRecommendationPrompts, type PromptContext } from "./prompts";
export {
  StackRecommendationService,
  stackRecommendationService,
  type StackRecommendation,
  type RecommendationResult,
  type EmpiricalData,
} from "./service";
