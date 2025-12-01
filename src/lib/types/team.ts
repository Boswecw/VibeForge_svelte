/**
 * Team & Organization Learning Types - Phase 4.1
 * TypeScript definitions for team management and learning insights
 */

// ============================================================================
// Enums
// ============================================================================

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export type OrganizationType = 'startup' | 'enterprise' | 'agency' | 'education' | 'nonprofit' | 'personal';

// ============================================================================
// Core Types
// ============================================================================

export interface Team {
  id: number;
  name: string;
  slug: string;
  description?: string;
  organizationType?: OrganizationType;
  teamSize?: number;
  industry?: string;
  settings: Record<string, any>;
  isActive: boolean;
  isPublic: boolean;
  ownerId: number;
  memberCount: number;
  projectCount: number;
  totalSessions: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  role: TeamRole;
  joinedAt: string;
  invitedBy?: number;
  // Populated fields
  userName?: string;
  userEmail?: string;
}

export interface TeamInvite {
  id: number;
  teamId: number;
  invitedEmail: string;
  invitedUserId?: number;
  invitedBy: number;
  role: TeamRole;
  status: InviteStatus;
  inviteToken: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
}

export interface TeamProject {
  id: number;
  teamId: number;
  projectId: number;
  isTeamTemplate: boolean;
  visibility: 'team' | 'public' | 'private';
  createdBy?: number;
  createdAt: string;
  updatedAt?: string;
  // Populated fields
  projectName?: string;
  patternName?: string;
}

// ============================================================================
// Learning & Insights Types
// ============================================================================

export interface LanguageMetric {
  language: string;
  count: number;
  successRate: number;
}

export interface StackMetric {
  stack: string;
  count: number;
  successRate: number;
}

export interface TeamLearningAggregate {
  id: number;
  teamId: number;
  computedAt: string;
  periodStart: string;
  periodEnd: string;
  memberCountSnapshot: number;

  // Language & Stack Data
  topLanguages: LanguageMetric[];
  languageTrends: Record<string, any>;
  topStacks: StackMetric[];
  stackCombinations: string[];

  // Project Metrics
  commonProjectTypes: Array<{ type: string; count: number }>;
  avgProjectComplexity?: number;
  avgTeamSizePreference?: number;

  // Success Metrics
  overallSuccessRate?: number;
  projectsCompleted: number;
  projectsAbandoned: number;
  avgSatisfactionScore?: number;

  // Session Metrics
  totalLlmQueries: number;
  avgTokensPerSession?: number;
  mostUsedProvider?: string;
  mostUsedModel?: string;
  avgSessionDurationMinutes?: number;
  avgStepsRevisited?: number;
  recommendationOverrideRate?: number;

  // AI Recommendations
  recommendedLanguages: string[];
  recommendedStacks: string[];
  improvementSuggestions: string[];

  createdAt: string;
}

export interface TeamInsight {
  id: number;
  teamId: number;
  insightType: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionableSteps?: string[];
  dataSources: string[];
  confidenceScore?: number;
  impactEstimate?: 'low' | 'medium' | 'high';
  isActive: boolean;
  isRead: boolean;
  isActedUpon: boolean;
  dismissedAt?: string;
  generatedBy?: string;
  createdAt: string;
  expiresAt?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateTeamRequest {
  name: string;
  slug: string;
  description?: string;
  organizationType?: OrganizationType;
  teamSize?: number;
  industry?: string;
  isPublic?: boolean;
  settings?: Record<string, any>;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  organizationType?: OrganizationType;
  teamSize?: number;
  industry?: string;
  isPublic?: boolean;
  settings?: Record<string, any>;
}

export interface InviteMemberRequest {
  invitedEmail: string;
  role: TeamRole;
  expiresInDays?: number;
}

export interface LinkProjectRequest {
  projectId: number;
  isTeamTemplate?: boolean;
  visibility?: 'team' | 'public' | 'private';
}

export interface TeamInsightsRequest {
  teamId: number;
  periodDays?: number;
}

export interface TeamInsightsResponse {
  teamId: number;
  periodStart: string;
  periodEnd: string;
  topLanguages: LanguageMetric[];
  topStacks: StackMetric[];
  recommendedLanguages: string[];
  recommendedStacks: string[];
  improvementSuggestions: string[];
  overallSuccessRate?: number;
  totalProjects: number;
  totalSessions: number;
  avgSessionDurationMinutes?: number;
}

// ============================================================================
// Dashboard Summary Types
// ============================================================================

export interface TeamDashboardSummary {
  team: Team;
  members: TeamMember[];
  recentProjects: TeamProject[];
  latestAggregate?: TeamLearningAggregate;
  activeInsights: TeamInsight[];
  stats: {
    totalProjects: number;
    activeProjects: number;
    totalMembers: number;
    successRate: number;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

export interface TeamListFilter {
  ownedOnly?: boolean;
  publicOnly?: boolean;
  skip?: number;
  limit?: number;
}

export interface PaginatedTeamResponse {
  data: Team[];
  total: number;
  page: number;
  limit: number;
}
