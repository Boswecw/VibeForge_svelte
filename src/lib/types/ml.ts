/**
 * ML Type Definitions - Phase 4.2.4
 * Type definitions for ML-based project success prediction and risk assessment.
 */

export interface MLPredictionRequest {
  project_data: {
    patternId?: string;
    patternName?: string;
    projectName: string;
    projectDescription?: string;
    projectId?: string;
    createdAt?: string;
    components: Array<{
      id?: string;
      role?: string;
      name?: string;
      language: string;
      framework?: string;
      location?: string;
      scaffolding?: any;
      customConfig?: any;
    }>;
    features?: {
      testing?: boolean;
      linting?: boolean;
      git?: boolean;
      docker?: boolean;
      ci?: boolean;
    };
  };
  team_data?: {
    memberCount?: number;
    experienceScore?: number;
    isDedicated?: boolean;
  };
  project_id?: string;
}

export interface KeyFactor {
  name: string;
  contribution: number;
}

export interface MLPredictionResponse {
  project_id: string;
  success_probability: number; // 0-1
  confidence: number; // 0-1
  risk_level: 'low' | 'medium' | 'high';
  key_factors: KeyFactor[];
  model_version: string;
  predicted_at: string;
}

export interface RiskFactor {
  category: 'technical' | 'team' | 'complexity' | 'infrastructure';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  impact_score: number; // 0-1
  mitigation: string;
}

export interface RiskAssessmentResponse {
  project_id: string;
  overall_risk_score: number; // 0-1
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  risk_factors: RiskFactor[];
  recommendations: string[];
  success_probability: number;
  assessed_at: string;
}

export interface FeatureImportance {
  name: string;
  importance: number;
}

export interface FeatureImportanceResponse {
  features: Record<string, number>;
  top_features: FeatureImportance[];
}

export interface TrainingPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  sample_count: number;
  trained_at: string;
}

export interface TrainingStatusResponse {
  success: boolean;
  sample_count: number;
  training_duration_seconds: number;
  error_message?: string;
  performance?: TrainingPerformance;
}

export interface ModelStatus {
  status: 'ready' | 'not_trained' | 'unknown' | 'error';
  message: string;
  is_trained: boolean;
  model_version?: string;
  last_trained?: string;
  age_days?: number;
  feature_count?: number;
}

// UI State types

export interface PredictionState {
  loading: boolean;
  prediction: MLPredictionResponse | null;
  error: string | null;
}

export interface RiskAssessmentState {
  loading: boolean;
  assessment: RiskAssessmentResponse | null;
  error: string | null;
}

export interface ModelState {
  loading: boolean;
  status: ModelStatus | null;
  error: string | null;
}

// Helper type guards

export function isHighRisk(riskLevel: string): boolean {
  return riskLevel === 'high' || riskLevel === 'critical';
}

export function isMediumRisk(riskLevel: string): boolean {
  return riskLevel === 'medium';
}

export function isLowRisk(riskLevel: string): boolean {
  return riskLevel === 'low';
}

export function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical':
      return 'text-red-600 dark:text-red-400';
    case 'high':
      return 'text-orange-600 dark:text-orange-400';
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'low':
      return 'text-green-600 dark:text-green-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

export function getSeverityColor(severity: string): string {
  return getRiskColor(severity);
}

export function formatProbability(probability: number): string {
  return `${(probability * 100).toFixed(1)}%`;
}

export function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(0)}%`;
}
